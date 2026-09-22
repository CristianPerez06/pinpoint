# write-feedback Specification

## Purpose
Define what a write tells the person who asked for it: that it is happening, which act
is in progress, and what became of it. The interval between asking and being answered is
invisible at local latency and is the whole of the interaction on a slow one, so these
rules govern the part of the product the people who build it are least likely to see.

## Requirements

### Requirement: A write says it is happening, from the moment it is asked for

Every write SHALL acknowledge the request that started it before its result arrives, and
SHALL say what it is doing rather than only that something is happening. The
acknowledgement SHALL appear on or beside the control that was used, not somewhere else
on the screen.

Rationale: on a slow connection the interval between asking and being answered is the
whole of the interaction, and an unchanged control during it is indistinguishable from a
press that was not registered. It is invisible at local latency, which is why an
application can ship with ten writes that say nothing and look correct to everybody who
built it.

A read that a person explicitly asks for and then waits on SHALL be treated the same
way. What matters is that a press was made and has not yet been answered, not which
direction the data was travelling.

#### Scenario: A write is in flight

- **WHEN** a person uses a control that starts a write, on either platform
- **THEN** that control reports that the write is happening
- **AND** it says which act is in progress, not merely that the application is busy

#### Scenario: The write settles

- **WHEN** the write succeeds or is refused
- **THEN** the control returns to rest
- **AND** it does so on both outcomes, never only on success

#### Scenario: A press that starts a fetch

- **WHEN** a person presses a control that reveals something the application must fetch
  first
- **THEN** the control responds to that press before the result arrives

### Requirement: A control cannot send the same write twice

While a write is in flight, the control that started it SHALL NOT be able to start it
again. A second press SHALL do nothing.

Rationale: the person cannot see that the first press is still travelling, so pressing
again is the reasonable thing to do. What follows is at best a second identical write
and at worst a refusal reported against the person's own earlier success — being told
somebody is already on the trip you have just added them to, because both requests were
yours.

The database's constraints SHALL remain the backstop, and this requirement SHALL NOT be
satisfied by them. A unique index turns a duplicate into a refusal, which is a correct
outcome and an incoherent explanation.

A control made unavailable this way SHALL remain in the platform's focus or
accessibility order and SHALL be announced as unavailable rather than removed from it.

Rationale: a control that vanishes from the tab order mid-write tells somebody arriving
by keyboard or by screen reader that the action is gone, and says nothing about why. It
is the same rule the zoom control already follows at the end of its range.

#### Scenario: The control is pressed twice

- **WHEN** a person presses a control whose write has not yet settled
- **THEN** no second write is sent

#### Scenario: An unavailable control is reached without a pointer

- **WHEN** a person moves through the screen by keyboard or by screen reader while a
  write is in flight
- **THEN** the control is still reachable
- **AND** it is announced as unavailable

### Requirement: The choice between showing at once and waiting visibly is made by a stated rule

Each write SHALL be either **optimistic** or **pending**, and which one SHALL follow from
the write's own properties rather than from the preference of whoever wrote the call
site.

A write SHALL be optimistic when it changes one row, is reversible, and its outcome can
be drawn before it is confirmed. An optimistic write SHALL apply to the screen
immediately, SHALL restore exactly what was there if the database refuses, and SHALL say
that it was refused.

Every other write SHALL be pending: one whose result the screen cannot draw in advance,
one whose next step depends on the stored row, and one that cannot be undone.

The same write SHALL take the same answer on both platforms.

Rationale: the two applications have already diverged on this once, and a rule that is
not written down is rediscovered per call site and differently each time. Deletion is
the case that proves it — it is drawable optimistically and irreversible, so it can be
argued either way, and the point of a rule is that it is not argued again in each
application.

#### Scenario: An optimistic write is refused

- **WHEN** the database refuses a write whose effect was already shown
- **THEN** the screen returns to exactly what it showed before
- **AND** the person is told it was refused

#### Scenario: An irreversible write

- **WHEN** a person confirms an act that cannot be undone
- **THEN** the act is shown as in progress rather than as already done
- **AND** the screen shows it as done only once the database has confirmed it

#### Scenario: The same write on the other platform

- **WHEN** the same write is offered by both applications
- **THEN** both treat it the same way

### Requirement: A refused write says so, wherever it happened

Every write SHALL report its refusal, in words written for the person, whether or not a
form is open. No write SHALL fail silently.

**Words written for the person means words somebody wrote.** A message a validation
library produces by default SHALL NOT be shown, whatever it says and however accurate it
is. Such a message describes the rule that was broken — "Too small: expected number to
be >0" — in the vocabulary of the thing enforcing it, which is a different act from
telling somebody what is wrong with what they typed. Each message SHALL be a sentence:
it begins with a capital and ends in a full stop, and says what the person needs to do
differently.

Rationale: this repository already refuses to let the browser refuse a form, on exactly
this ground — a native validation bubble speaks in the platform's voice rather than the
product's. The same objection applies to every message the validation layer produces,
and the position was written down for one of them and not the other. The practical
difference is that a default is what arrives when nobody decides, so a rule stated only
as intent is met by whichever fields somebody happened to think about.

**Every field a person can fill in SHALL carry such a message for each way it can be
refused**, and this SHALL be enforced by an automated check rather than by review. Each
kind of record SHALL state, beside the record itself, which of its fields the surface
supplies rather than a person — a position taken from the map, the trip being worked on,
the moment something was created. Every field it does not name that way SHALL be treated
as one a person fills in. The check SHALL read that statement rather than hold a list of
its own.

Stated in that direction so that adding a field to a record places it among the fields
that must answer, unless somebody says otherwise. A list of fields that need messages is
a list somebody must remember to extend, which is the failure this is here to prevent.

Rationale: the dollar price answered in the library's voice from the day prices were
added and was noticed a year later, because nothing was looking. A list kept beside the
check is a second list, and the two drift the first time only one of them is edited.

A message SHALL NOT repeat the name of the field it belongs to, because the refusal is
already shown against that field and the field is already labelled. Where one label
covers more than one field, the message SHALL name which of them it concerns — this is
what `marker-capture` requires of the two prices, and it is the only case that warrants
it.

Where a refusal is about one field the person typed, it SHALL be shown against that
field. Where it is about the act rather than about an input, it SHALL be shown where the
person is looking — beside the control if one is still on screen, and otherwise over the
screen the write changed.

**A panel or sheet that is still open is where the person is looking**, so a refusal
belonging to a write it started SHALL be shown inside it rather than on the screen behind
it. A message drawn behind the surface that caused it has been reported, and cannot be
read.

Rationale: a silent refusal is worse than an error, because the screen is left claiming
something happened. An optimistic write that rolls back without a message is the worst
version of it: the person watched the change land and then watched it disappear, and
nothing on screen accounts for either. A refusal covered by the panel that caused it is
the same failure wearing a different coat — the handler reported it, and the person was
told nothing.

Each application SHALL have somewhere for a refusal that belongs to no open form to be
shown. An application without one has handlers whose failure branch writes into state
that nothing renders, which reads as reporting and is not.

A refusal about a field SHALL be reported as a **name** drawn from one shared source, and
both applications SHALL resolve that name to the same sentence, so that the same mistake
is answered the same way on the phone and on the laptop. The name SHALL be what the
refusal carries; the sentence SHALL be resolved where it is drawn.

Stated as a shared name rather than a shared sentence because the sharing and the language
are two different things, and holding one sentence achieves the first by assuming the
second. Both messages answering a refused city name were written twice on the same day and
had already drifted — one application quoting the name and the other not — which is why
this is shared at all; a shared name keeps exactly that, while leaving the words somewhere
a language can be chosen.

#### Scenario: A refusal with no form open

- **WHEN** a write started from a control outside a form is refused
- **THEN** the person is told, on the screen they are looking at

#### Scenario: A refusal about something typed

- **WHEN** a write is refused because of a value the person entered
- **THEN** the message is shown against the field that value came from

#### Scenario: A message the validation layer would have written

- **WHEN** a person enters a value that breaks a rule on any field they can fill in
- **THEN** the message shown is a sentence somebody wrote for this product
- **AND** it is not the validation library's own description of the rule

#### Scenario: A field added without a message

- **WHEN** a field a person fills in is added to a record and given no message of its own
- **THEN** an automated check fails

#### Scenario: A field the surface supplies

- **WHEN** a record carries a field nobody types — a position, the trip it belongs to,
  when it was created
- **THEN** no written message is required of it

#### Scenario: A message beside its own label

- **WHEN** a refused field is shown under a label that names only that field
- **THEN** the message does not repeat the field's name

#### Scenario: One label over two fields

- **WHEN** a refused field shares its label with another field
- **THEN** the message names which of them it concerns

#### Scenario: The same mistake on the other platform

- **WHEN** the same value is refused on the phone and on the laptop
- **THEN** both resolve the same name
- **AND** both say the same thing

#### Scenario: A refusal crossing out of shared code

- **WHEN** a shared write refuses a value a person entered
- **THEN** what it reports names the refusal
- **AND** it carries no sentence written for a person

#### Scenario: A rolled-back optimistic write

- **WHEN** an optimistic write is refused and the screen is restored
- **THEN** the restoration is accompanied by a message
- **AND** the message is dismissible without leaving the screen

#### Scenario: A refusal from a panel that is still open

- **WHEN** a write started from a panel or sheet is refused while that surface is still
  shown
- **THEN** the refusal is shown inside that surface
- **AND** it is readable without moving or closing it, at every width the surface is
  drawn at

### Requirement: Pending state belongs to the control, not to the screen

An application SHALL NOT hold one flag meaning "a write is in flight" for a screen that
offers more than one write. Pending state SHALL be held per write, so that a control is
unavailable when and only when its own write is in flight.

Rationale: a shared flag disables controls that have nothing to do with what is
happening and leaves the responsible one live — which is the state both applications
were in, arrived at independently, with the same flag passed to the same two unrelated
controls. It is not a bug that was introduced; it is what a single boolean does the
moment a second caller exists.

#### Scenario: One write in flight among several controls

- **WHEN** a write started from one control has not yet settled
- **THEN** that control is unavailable
- **AND** every control for a different write remains usable

### Requirement: A write that destroys something asks before it happens

The system SHALL ask before a write that destroys something a person entered, or that
cannot be got back. It SHALL NOT ask before a write that can be undone with nothing lost.

**The test is what is lost, not whether the act has an inverse.** Changing a city's
currency can be reversed by changing it back, and the prices stored in the old currency
cannot — so it asks. Archiving a trip is reversible and loses nothing, so it does not,
and the same holds for recording interest, marking a place visited, and renaming.

The question SHALL be asked by the product rather than by the platform, in the product's
own colours and wording, so that a person is not handed a box that belongs to the browser
or the operating system.

Where the consequence lands on records the person is not looking at, the question SHALL
say what and how many. A count discovered afterwards is a count that arrived too late to
inform the decision.

**The question SHALL be asked in the surface that offered the act**, and SHALL NOT raise
a further layer over it. Both applications already build panels and sheets that change
what they show without closing; a question is one more thing such a surface can show.

While a question is standing, the surface SHALL NOT continue to offer other acts that
destroy something. What is being removed MAY remain visible, and SHALL remain visible
where seeing it is how a person knows which record they are answering about.

Answering SHALL be a deliberate act distinct from the one that raised the question, and
declining SHALL leave everything unchanged. Dismissing the surface SHALL count as
declining.

**The control that confirms SHALL own the pending state**, and the write SHALL be treated
as beginning when the question is answered rather than when the act was first offered.

The question SHALL be announced when it appears, so that somebody who is not looking at
the screen learns what is being asked rather than only that the controls changed.

#### Scenario: An act that destroys something entered

- **WHEN** a person asks to remove a record, or to change something in a way that drops
  values they entered
- **THEN** they are asked to confirm before anything is written
- **AND** the question is drawn by the product rather than by the platform

#### Scenario: A reversible act that loses nothing

- **WHEN** a person archives a trip, records interest, marks a place visited, or renames
  something
- **THEN** nothing is asked
- **AND** the write proceeds

#### Scenario: A consequence that lands out of sight

- **WHEN** the act would change records the person is not currently looking at
- **THEN** the question states what those records are and how many

#### Scenario: Declining

- **WHEN** a person declines the question, by whichever route the surface offers
- **THEN** nothing is written
- **AND** the surface returns to what it was showing

#### Scenario: Dismissing while a question stands

- **WHEN** the surface holding a question is dismissed
- **THEN** the question is treated as declined
- **AND** nothing is written

#### Scenario: No second destructive act beside a question

- **WHEN** a question is standing in a surface that also lists other records
- **THEN** no control offering to destroy another record is available

#### Scenario: Waiting on the answer

- **WHEN** a person confirms and the write has not yet settled
- **THEN** the control they confirmed with says so
- **AND** it cannot be fired a second time

#### Scenario: The question is heard rather than seen

- **WHEN** a question appears
- **THEN** it is announced
- **AND** what is announced is the question, not only that controls changed
