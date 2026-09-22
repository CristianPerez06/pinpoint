## MODIFIED Requirements

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

