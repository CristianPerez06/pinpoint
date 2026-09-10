## ADDED Requirements

### Requirement: An open panel stays where it opened

Where the chrome takes its laptop shape, a menu or panel that is open SHALL remain at the
position it opened at for as long as it is open. A control SHALL NOT move a panel raised
from it, or the controls placed beside it, by changing its own size in response to a state
it is declaring.

This is not implied by *A panel opens beside the control that opened it*. A panel that
slides across the screen is beside its control at every instant of the journey, so that
requirement is satisfied by the behaviour this one forbids.

Rationale: a panel is positioned against the control that raised it, so a control whose
width follows its own state drags the panel along with it. Every act inside a panel is
aimed by a pointer that is already resting there, and the acts that change the control's
state are the ordinary contents of the panel — a filter's criteria, and the way out of
them. So the moment the panel moves is the moment somebody is mid-decision inside it, and
the cost is paid again on every further choice, because the panel has to be chased before
it can be used.

The way out is the sharpest case and the one to test first. Where the control that
declares a state also reveals the way out of it — which *A control that declares a
narrowing reveals the way out of it* permits, and which this chrome does — the button that
retracts the state sits **inside** the panel. Pressing it changes the control's width
by definition, so a panel positioned against a content-sized control is guaranteed to jump
out from under the pointer that just pressed it. There is no lucky pointer position for
that one.

Nothing here requires a particular mechanism. A control may reserve the room its widest
state needs, or the panel may be positioned against something that does not resize; what
is required is that the reader sees neither the panel nor its neighbours move.

The scope is the laptop shape because it is where a panel is positioned against a control
at all. A panel that spans the width of the screen and stands on its bottom edge — see *A
panel raised on a phone-shaped screen rises from the edge* — has no anchor to be dragged
by, and is already covered.

#### Scenario: A criterion is applied with the panel open

- **WHEN** the chrome takes its laptop shape
- **AND** a panel raised from a control is open
- **AND** a choice made inside it changes what the control declares
- **THEN** the panel does not move
- **AND** the controls placed beside that control do not move

#### Scenario: The way out is taken from inside the panel

- **WHEN** the chrome takes its laptop shape
- **AND** a panel raised from a control that is declaring a state is open
- **AND** the way out of that state is taken from a control inside the panel
- **THEN** the panel does not move

#### Scenario: The control is at its widest before anything is declared

- **WHEN** the chrome takes its laptop shape
- **AND** a control that declares a state is shown with nothing declared
- **THEN** it occupies the room its widest declared state will need

#### Scenario: The window is wide enough to leave room spare

- **WHEN** the chrome takes its laptop shape at a width that leaves unused room in the row
- **AND** a choice made inside an open panel changes what the control declares
- **THEN** the panel does not move
