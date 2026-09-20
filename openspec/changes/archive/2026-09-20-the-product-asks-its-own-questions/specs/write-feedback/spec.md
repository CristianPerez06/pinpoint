## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: A refused write says so, wherever it happened

Every write SHALL report its refusal, in words written for the person, whether or not a
form is open. No write SHALL fail silently.

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

#### Scenario: A refusal from a panel that is still open

- **WHEN** a write started from a panel or sheet is refused while that surface is still
  shown
- **THEN** the refusal is shown inside that surface
- **AND** it is readable without moving or closing it, at every width the surface is
  drawn at
