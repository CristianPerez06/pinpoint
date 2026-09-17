## MODIFIED Requirements

### Requirement: Controls are placed by how often they are used

The system SHALL give permanent, always-visible placement to the controls used
throughout a session, and SHALL NOT give it to controls used once per trip or less.

A control used rarely MAY live behind a menu. A control used constantly SHALL NOT.

Rare **destructive** controls SHALL be placed away from the frequent ones, so that
neither is reached by mistake while aiming for the other.

There is one exception, and it is narrow. A control that is **the only way out of a
state the screen cannot otherwise leave** MAY be permanently placed although it is rare.
A control qualifies only where the screen offers no other route out of that state, and
the change that places it SHALL say which state and why nothing else answers it. Being
merely important, or merely hard to find, does not qualify.

Rationale: chrome is charged against the map, which is what the screen is for. Spending
permanent placement on something done once per trip takes that space every session for a
control almost nobody is reaching for, and it dilutes the controls that are. This is one
rule stated once for both applications, because it follows from screen shape and
frequency rather than from platform.

Rationale for the exception: frequency is the right measure for a control that *does*
something to the trip, because not finding it costs a detour through a menu. It is the
wrong measure for a control that is a way out. A person whose re-read failed while they
were offline has, by definition, nothing else on the screen that works — so the cost of
burying it is not a detour, it is force-quitting the application, and the rarity that
argued for hiding it is exactly what makes it unfindable at the one moment it is wanted.
The exception is written as a test rather than as a list, so it can be applied to the
next candidate instead of being reopened, and it is deliberately hard to pass: a control
that has any other route to the same outcome does not meet it.

#### Scenario: A rare action is not permanently displayed

- **WHEN** a trip workspace is shown
- **THEN** controls that act on the trip as a whole rather than on the map — renaming
  it, creating another, managing who is on it — are not each permanently displayed
- **AND** each remains reachable

#### Scenario: The session's own controls stay reachable

- **WHEN** a trip workspace is shown
- **THEN** finding a place, placing one by hand, and narrowing the trip are each
  reachable without first opening something

#### Scenario: Signing out is kept away from the frequent controls

- **WHEN** a trip workspace is shown
- **THEN** signing out is not adjacent to the controls used throughout a session

#### Scenario: A rare control is the only way out of a state

- **WHEN** a control is rare, and the screen offers no other way out of the state that
  control exists to leave
- **THEN** it may be given permanent, always-visible placement
- **AND** the change that places it states which state and why nothing else answers it

#### Scenario: A rare control that has another route

- **WHEN** a rare control's outcome can also be reached another way from that screen
- **THEN** it does not qualify for the exception
- **AND** it is placed by how often it is used, as every other control is

## ADDED Requirements

### Requirement: The re-read stands on the map's edge, clear of the zoom control

Where the map offers the control that asks for a re-read, that control SHALL float over
the map on the same edge as the zoom control, and SHALL be drawn **above** it.

It SHALL be a separate object rather than a member of the zoom control's group, and the
space between the two SHALL be wide enough that neither is pressed while aiming for the
other. A shared border, a shared outline, or any treatment that draws the two as one
control is forbidden.

The control SHALL overlap neither the attribution for the tile data nor the session's
tools, nor anything else standing on that edge — the same obligation the zoom control
already carries.

It SHALL take no fill. Under *The accent is a fill only where an act is committed* a
re-read commits nothing: it is chrome standing at rest.

Rationale for separating it: a stacked group is one target to the eye and several to a
thumb. Zoom is pressed constantly and the re-read is pressed almost never, so every
mis-aimed press in that column costs the trip a full round of reads while the person was
trying to look closer. That is the same reasoning that keeps signing out away from the
session's controls, applied to a control that is not destructive but is expensive.

Rationale for the edge at all, rather than the bar of tools: the bar holds what somebody
*does to the trip* — finding a place, placing one, narrowing the map — and those three
are peers of equal weight. A re-read is not one of them; it is an instrument of the
screen, which is what the zoom control on that edge already is. It is also the edge
furthest from a thumb at rest, which is where a rare control belongs.

#### Scenario: The control floats above zoom

- **WHEN** the map offers the re-read control
- **THEN** it is drawn over the map on the same edge as the zoom control, above it

#### Scenario: The two are not one control

- **WHEN** the re-read control and the zoom control are both shown
- **THEN** they are separate objects with visible space between them
- **AND** neither is pressed by a press aimed at the other

#### Scenario: Nothing on that edge is covered

- **WHEN** the map is rendered at any window or device size with the control present
- **THEN** the attribution for the tile data is fully visible
- **AND** the control overlaps neither it nor the session's tools

#### Scenario: The control is at rest

- **WHEN** the re-read control is shown and is not being pressed
- **THEN** it carries no fill
