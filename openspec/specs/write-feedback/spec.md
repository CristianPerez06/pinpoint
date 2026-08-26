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

Where a refusal is about one field the person typed, it SHALL be shown against that
field. Where it is about the act rather than about an input, it SHALL be shown where the
person is looking — beside the control if one is still on screen, and otherwise over the
screen the write changed.

Rationale: a silent refusal is worse than an error, because the screen is left claiming
something happened. An optimistic write that rolls back without a message is the worst
version of it: the person watched the change land and then watched it disappear, and
nothing on screen accounts for either.

Each application SHALL have somewhere for a refusal that belongs to no open form to be
shown. An application without one has handlers whose failure branch writes into state
that nothing renders, which reads as reporting and is not.

#### Scenario: A refusal with no form open

- **WHEN** a write started from a control outside a form is refused
- **THEN** the person is told, on the screen they are looking at

#### Scenario: A refusal about something typed

- **WHEN** a write is refused because of a value the person entered
- **THEN** the message is shown against the field that value came from

#### Scenario: A rolled-back optimistic write

- **WHEN** an optimistic write is refused and the screen is restored
- **THEN** the restoration is accompanied by a message
- **AND** the message is dismissible without leaving the screen

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

