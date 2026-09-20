## MODIFIED Requirements

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

#### Scenario: A panel over the map and a menu in the chrome

- **WHEN** a panel over the map is open
- **AND** a menu in the chrome is opened
- **THEN** at most one of the two is drawn

### Requirement: Anything that opens can be dismissed without hunting

Every menu or panel the system raises SHALL be dismissible by pressing outside it,
and, on a platform with a keyboard, by pressing Escape. Its own control SHALL also
dismiss it.

**This SHALL cover the panels raised over the map as well as those raised from the
chrome.** Where they were once outside this rule, that was a boundary drawn around one
piece of work rather than a judgement that they needed the guarantee less — and a panel
over the map is larger than a menu, so the one button that closes it is further away,
not nearer.

These SHALL be consistent across every such menu and panel, rather than each carrying
its own contract.

A press that dismisses SHALL do only that. Where what is open dims the screen behind
it, the press SHALL NOT reach anything beneath it. Where nothing is dimmed, the press
SHALL NOT act on the map, and MAY act on another control of the chrome.

**Where a panel holds work a person has entered, or a position they found on a map,
dismissing it SHALL ask before discarding rather than discarding silently**, by the same
means the system asks before any other act that destroys something entered. Where it
holds nothing entered, it SHALL simply close, and a panel that is only being read SHALL
always simply close.

Rationale: a panel that closes only by finding one particular button inside it is a trap
in proportion to how tall it is — and the way out is furthest away exactly when the
panel is longest. Consistency is the requirement, not merely the presence of some way
out: a person learns one contract, not five. The exception for entered work is not a
second contract but the same one — the way out is always there, and where taking it
would destroy something, taking it asks.

Rationale for what the press must not do: dismissing is not free if the press that
dismisses also acts. On a screen mostly filled by a map there is little empty space to
aim at, so the ordinary act of changing your mind drops a marker, opens a marker's card,
or arms a mode nobody asked for. The two halves differ because the dimming is itself a
claim — a screen drawn as stepped back should be stepped back — while a panel hanging
off its own control makes no such claim, and there switching from one control to the
next in a single press is what somebody means by it. The cost of the difference is
recorded rather than hidden: switching between two menus takes one press where nothing
is dimmed and two where something is.

#### Scenario: Pressing outside dismisses

- **WHEN** a menu or panel raised from the chrome is open
- **AND** a press lands outside it
- **THEN** it is dismissed

#### Scenario: A press outside a dimmed panel does nothing else

- **WHEN** a menu or panel that dims the screen behind it is open
- **AND** a press lands outside it
- **THEN** it is dismissed
- **AND** nothing beneath that press acts on it

#### Scenario: The dismissing press does not act on the map

- **WHEN** a menu or panel raised from the chrome is open
- **AND** a press lands on the map
- **THEN** it is dismissed
- **AND** no marker is created, and none is selected

#### Scenario: Where nothing is dimmed, another control still acts

- **WHEN** a menu or panel raised from the chrome is open and nothing is dimmed behind it
- **AND** a press lands on another control of the chrome
- **THEN** the open one is dismissed
- **AND** that control acts on the same press

#### Scenario: Escape dismisses

- **WHEN** a menu or panel raised from the chrome is open on a platform with a keyboard
- **AND** Escape is pressed
- **THEN** it is dismissed

#### Scenario: Every panel behaves the same way

- **WHEN** any two menus or panels raised from the chrome are compared
- **THEN** both are dismissed by the same actions

#### Scenario: A panel over the map is dismissed the same way

- **WHEN** a panel raised over the map is open
- **AND** a press lands outside it, or Escape is pressed
- **THEN** it is dismissed by either

#### Scenario: A panel over the map holding nothing entered

- **WHEN** a panel that is only being read is open over the map
- **AND** it is dismissed
- **THEN** it closes without asking

#### Scenario: A panel over the map holding entered work

- **WHEN** a panel holding entered values or a found position is dismissed
- **THEN** the person is asked before anything is discarded
- **AND** declining leaves everything they entered as it was

### Requirement: A control that opens something announces and restores state

On a platform with a keyboard focus model, a control that reveals a menu or panel SHALL
report whether it is currently open, and SHALL return focus to itself when what it
opened is dismissed.

What opens SHALL be announced as a named region rather than as unlabelled content.

**This SHALL cover the panels raised over the map as well as those raised from the
chrome.** Where a panel is opened by selecting something drawn on the map rather than by
pressing a control in the chrome, that drawn thing is the control: focus SHALL move into
the panel when it opens and SHALL return there when it closes.

Rationale: without the open state, a panel appears elsewhere on screen with nothing
tying it to what was pressed, and somebody who cannot see the panel is told nothing at
all. Without focus return, dismissing a panel from a control inside it destroys the
focused element and drops focus to the start of the document, so the way back is to
traverse the whole of the chrome again. A panel opened from a pin is the sharpest case:
focus stays on the pin while a panel appears somewhere else entirely.

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

#### Scenario: A panel opened from something drawn on the map

- **WHEN** a panel is opened by selecting a marker on the map
- **THEN** focus moves into the panel
- **AND** dismissing it returns focus to that marker

#### Scenario: A panel over the map is named

- **WHEN** a panel raised over the map is open
- **THEN** it is announced with a name describing what it contains
