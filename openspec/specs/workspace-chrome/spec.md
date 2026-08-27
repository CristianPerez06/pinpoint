# workspace-chrome Specification

## Purpose
Define where a trip's controls live and what they owe the person using them: which
controls stay permanently reachable, which may sit behind a menu, and the guarantees
anything that opens over the map has to meet. The map is the subject of this screen, so
chrome is charged against it and has to earn what it takes.
## Requirements
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

### Requirement: The city being worked in is named beside the trip it narrows

The workspace SHALL display which city is being worked in, and that display SHALL be
the control that changes it. It SHALL be placed with the trip's name — beside it or
directly under it — rather than among the controls used throughout a session, because a
city is a narrowing of the trip and reads as one only when it stands where the trip
does.

When no city is selected, the display SHALL name that state in the vocabulary of the
product rather than standing empty, so that a reader is told the whole trip is in view
instead of being shown a control with nothing in it.

Rationale: this follows the rule already in force — a rare action lives behind the name
of what it acts on — extended to the one narrowing that is not filtering. Placing it
among the session's controls would say it belongs beside finding and dropping a place,
which is the company it does not keep: it changes what is being worked on, not what is
on the map.

#### Scenario: The city being worked in is shown

- **WHEN** a trip workspace is shown
- **THEN** the city being worked in is displayed with the trip's name
- **AND** pressing it is how the city is changed

#### Scenario: Nothing is selected

- **WHEN** a trip workspace is shown and no city is selected
- **THEN** the display names that the whole trip is in view
- **AND** it is not blank

#### Scenario: The city control is not among the session's controls

- **WHEN** a trip workspace is shown
- **THEN** the city control is not placed among the controls for finding a place,
  placing one by hand, and narrowing the trip

### Requirement: On a phone-shaped screen the city takes its own line

Where the chrome takes its phone shape, the trip's name and the city's name SHALL be
given separate lines rather than dividing one line between them.

Neither name has a length anybody promised — both are typed by a person. At a phone's
width two names sharing a row leave each other roughly eleven characters, so both are
cut to stubs and neither answers its question: not "which trip is this", and not "which
part of it am I in". A laptop-shaped bar has an order of magnitude more room and may
divide one line between them.

This does not forbid shortening a name. A control of a settled width whose full value is
one press away in the list it opens is a deliberate and different thing — it keeps
everything downstream of it from moving each time the selection changes, which is why
the laptop's city control has a fixed width at every size. What this forbids is the
arrangement where *both* names are cut at once and the row answers nothing.

Rationale: this follows the rule already in force that chrome follows the shape of the
screen rather than the platform, so it binds any application whose chrome takes that
shape and not one particular application. It has an obvious test, which is why it is
stated rather than left to judgement: put a long trip name and a long city name on the
narrowest supported screen and read them.

#### Scenario: A phone-shaped screen

- **WHEN** the chrome takes its phone shape
- **THEN** the city's name is shown on its own line, under the trip's name

#### Scenario: A long name on the narrowest screen

- **WHEN** a trip whose name runs to sixty characters is shown on the narrowest
  supported screen beside a city whose name runs to twenty
- **THEN** neither name is reduced to a stub by the other

#### Scenario: A laptop-shaped bar

- **WHEN** the chrome takes its laptop shape
- **THEN** the trip's name and the city's name may share one line
- **AND** a control of a settled width may shorten the name it displays, because the
  list it opens states it in full

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

