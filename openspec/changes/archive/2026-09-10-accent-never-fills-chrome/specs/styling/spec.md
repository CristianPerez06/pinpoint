## ADDED Requirements

### Requirement: The accent is a fill only where an act is committed

The accent SHALL be used as a control's fill only where that control commits an act inside
a form or a panel. A control standing in the chrome at rest SHALL NOT take the accent as
its fill, at any width and on either platform.

The chrome is what is permanently on screen around the map — the bar naming the trip and
the city, the session's tools, the account — as distinct from a form or a panel, which is
raised in answer to something and dismissed after it.

Rationale, and it is the reason the whole palette is shaped the way it is: every other
piece of restraint in the system exists to buy five saturated marker families that are the
only strong colour anywhere on screen, so that when somebody scans the interface the pins
are what they see. Chrome is present at all times and in a fixed place the eye returns to.
An accent fill there spends that budget continuously, in exchange for emphasis on a control
that is not being used at the moment it is being emphasised.

**A control that arms, opens, or narrows is not committing.** Beginning an act is not
completing one: a control that puts the map into a state where a further action is expected
is still chrome, and the accent belongs — if anywhere — on whatever ends that state.

This requirement bounds the accent as a **fill**. It says nothing about the accent as a
focus ring, as a selection halo on the map, or as `accent-wash` beneath `accent-ink`, all
of which remain available to chrome. A state carried by a wash is not a fill within the
meaning of this requirement.

Where two controls are peers by specification, neither SHALL be given a fill that the other
does not have. Colour is a claim about hierarchy whether or not it is described as one, and
it is made in the one place no reviewer reads.

#### Scenario: A control that commits inside a panel

- **WHEN** a form or a panel offers the control that completes the act it was raised for
- **THEN** that control may take the accent as its fill
- **AND** its text is `ink-on-accent`

#### Scenario: A control standing in the chrome

- **WHEN** a control stands in the chrome and is not committing an act
- **THEN** it does not take the accent as its fill
- **AND** this holds at every width and on both platforms

#### Scenario: A control that arms the map

- **WHEN** a control puts the map into a state where a further action is expected
- **THEN** it is not treated as committing an act
- **AND** it does not take the accent as its fill

#### Scenario: A control declaring a state in the chrome

- **WHEN** a control in the chrome is declaring that it is narrowing or selecting something
- **THEN** it may carry `accent-wash` beneath `accent-ink`
- **AND** carrying that state is not a fill within the meaning of this requirement

#### Scenario: Two controls that are peers by specification

- **WHEN** two controls begin the same act by different routes and neither is a fallback
  for the other
- **THEN** neither is drawn with a fill the other does not have
