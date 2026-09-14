## ADDED Requirements

### Requirement: A control does not appear to offer more than it offers

Where an application presents a control that resembles one in the other application — by
its name, its position, or its glyph — that control SHALL offer the same capability, or it
SHALL NOT be presented at all.

An application MAY reach a capability by a different route than the other, and MAY decline
a convenience the other offers. What it SHALL NOT do is present a control that appears to
be the other's and delivers less than it does.

Where a capability is offered only by an indirect route — something inferred from context,
defaulted on the person's behalf, or reached from a surface that does not name it — the
system SHALL NOT also present a control that names that capability without providing it.

Rationale: the specifications already require that either application be sufficient on its
own, and that rule is about capability rather than arrangement — so an application can
satisfy it while still being wrong on screen. The phone did exactly that. Every capability
behind the laptop's city control was reachable by another route: the map framed itself on
open, search biased to the visible map, and the form defaulted to the city last used. The
rule was satisfied. The phone also had a control called `Cities` that looked like the
laptop's and did a third of what it did, and nobody experiences that as a deliberate
omission — it reads as broken.

So passing the parity rule is not sufficient. A capability reachable by a route nobody
finds, standing next to a control that appears to offer it and does not, is a worse outcome
than the honest gap that rule was written to forbid. The question a change has to answer is
what the screen appears to promise, not only what the product can do somewhere.

#### Scenario: A control named for a capability it only partly offers

- **WHEN** an application presents a control named for a capability
- **THEN** that control offers the whole of it
- **AND** it is not presented at all if the application offers only part of it

#### Scenario: A capability offered by an indirect route

- **WHEN** an application offers a capability by inference or by a default rather than by a
  named control
- **THEN** that is permitted, and no control claims otherwise
- **AND** no control named for that capability is presented without providing it

#### Scenario: A change adds a control resembling the other application's

- **WHEN** a change would add a control that takes its name, position or glyph from the
  other application's
- **THEN** the capability behind it is compared against the other application's before the
  control is accepted
- **AND** offering less is reason to change the control or leave it out, not to ship it
  looking the same
