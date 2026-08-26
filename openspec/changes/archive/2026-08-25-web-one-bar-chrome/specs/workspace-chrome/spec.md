## Purpose

Define where a trip's controls live and what they owe the person using them: which
controls stay permanently reachable, which may sit behind a menu, and the guarantees
anything that opens over the map has to meet. The map is the subject of this screen, so
chrome is charged against it and has to earn what it takes.

## ADDED Requirements

### Requirement: Controls are placed by how often they are used

The system SHALL give permanent, always-visible placement to the controls used
throughout a session, and SHALL NOT give it to controls used once per trip or less.

A control used rarely MAY live behind a menu. A control used constantly SHALL NOT.

Rare **destructive** controls SHALL be placed away from the frequent ones, so that
neither is reached by mistake while aiming for the other.

Rationale: chrome is charged against the map, which is what the screen is for. Spending
permanent placement on something done once per trip takes that space every session for a
control almost nobody is reaching for, and it dilutes the controls that are. This is one
rule stated once for both applications, because it follows from screen shape and
frequency rather than from platform.

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

### Requirement: A rare action lives behind the name of what it acts on

Where a rare action acts on a named thing that the workspace already displays, the
system SHALL make that name the control which reveals the action, rather than adding a
separate control beside it.

Rationale: the name is already on screen answering which trip these places belong to.
Pressing the thing you are about to change is the shortest line between the question and
the answer, and it spends no additional space. The alternative — a menu button beside a
label — spends a permanent slot to open something the label could have opened.

#### Scenario: Trip actions are reached from the trip's name

- **WHEN** a trip workspace displays the trip's name
- **THEN** the name is a control
- **AND** it reveals the actions that act on that trip
- **AND** no separate control beside it does the same job

#### Scenario: A name that opens something says so

- **WHEN** a name is the control that reveals actions
- **THEN** it is distinguishable from a label that does nothing

### Requirement: Only one thing opens at a time

The system SHALL show at most one menu or panel raised from the chrome at a time.
Opening one SHALL dismiss any other.

This SHALL hold across the whole chrome rather than within each group of controls, so
that two panels cannot occupy the same place at once.

Rationale: two panels open together overlap, and where they are positioned alike they
overlap exactly — one silently drawn over the other, with no way to tell which is being
read. Enforcing this per group leaves the guarantee true within each and false between
them, which is the same defect with a smaller reproduction.

#### Scenario: Opening a second menu closes the first

- **WHEN** a menu raised from the chrome is open
- **AND** a different one is opened
- **THEN** the first is dismissed

#### Scenario: Two panels never occupy the same place

- **WHEN** any menu or panel raised from the chrome is open
- **THEN** no other is drawn

### Requirement: Anything that opens can be dismissed without hunting

Every menu or panel raised from the chrome SHALL be dismissible by pressing outside it,
and, on a platform with a keyboard, by pressing Escape. Its own control SHALL also
dismiss it.

These SHALL be consistent across every such menu and panel, rather than each carrying
its own contract.

Rationale: a panel that closes only by finding one particular button inside it is a trap
in proportion to how tall it is — and the way out is furthest away exactly when the
panel is longest. Consistency is the requirement, not merely the presence of some way
out: a person learns one contract, not five.

#### Scenario: Pressing outside dismisses

- **WHEN** a menu or panel raised from the chrome is open
- **AND** a press lands outside it
- **THEN** it is dismissed

#### Scenario: Escape dismisses

- **WHEN** a menu or panel raised from the chrome is open on a platform with a keyboard
- **AND** Escape is pressed
- **THEN** it is dismissed

#### Scenario: Every panel behaves the same way

- **WHEN** any two menus or panels raised from the chrome are compared
- **THEN** both are dismissed by the same actions

### Requirement: A control that opens something announces and restores state

On a platform with a keyboard focus model, a control that reveals a menu or panel SHALL
report whether it is currently open, and SHALL return focus to itself when what it
opened is dismissed.

What opens SHALL be announced as a named region rather than as unlabelled content.

Rationale: without the open state, a panel appears elsewhere on screen with nothing
tying it to what was pressed, and somebody who cannot see the panel is told nothing at
all. Without focus return, dismissing a panel from a control inside it destroys the
focused element and drops focus to the start of the document, so the way back is to
traverse the whole of the chrome again.

#### Scenario: The opener reports that it is open

- **WHEN** a control reveals a menu or panel
- **THEN** that control reports itself as open while the panel is shown
- **AND** reports itself as closed once it is dismissed

#### Scenario: Focus comes back

- **WHEN** a menu or panel raised from the chrome is dismissed
- **THEN** focus returns to the control that opened it

#### Scenario: What opened is named

- **WHEN** a menu or panel raised from the chrome is open
- **THEN** it is announced with a name describing what it contains

### Requirement: A panel opens beside the control that opened it

A menu or panel raised from a control SHALL be positioned adjacent to that control, and
SHALL NOT be positioned relative to the chrome as a whole.

It SHALL NOT cover a control that the chrome keeps permanently reachable.

Rationale: a panel that opens at a fixed position regardless of what was pressed breaks
the only tie between the two, so several different controls appear to open the same
thing. And a panel drawn over a permanent control removes it for as long as the panel is
open, which contradicts the placement rule that made it permanent.

#### Scenario: The panel follows its control

- **WHEN** two different controls in the chrome each reveal a panel
- **THEN** each panel is positioned beside the control that revealed it

#### Scenario: A panel does not cover a permanent control

- **WHEN** a menu or panel raised from the chrome is open
- **THEN** no control that the chrome keeps permanently reachable is covered by it
