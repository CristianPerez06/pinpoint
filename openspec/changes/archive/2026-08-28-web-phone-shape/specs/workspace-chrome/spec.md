## MODIFIED Requirements

### Requirement: A panel opens beside the control that opened it

Where the chrome takes its laptop shape, a menu or panel raised from a control SHALL be
positioned adjacent to that control, and SHALL NOT be positioned relative to the chrome
as a whole. It SHALL NOT cover a control that the chrome keeps permanently reachable.

Where the chrome takes its phone shape, a panel SHALL instead rise from the bottom edge
of the screen, and the requirement it must meet is stated separately — see *A panel
raised on a phone-shaped screen rises from the edge*.

Rationale: a panel that opens at a fixed position regardless of what was pressed breaks
the only tie between the two, so several different controls appear to open the same
thing. And a panel drawn over a permanent control removes it for as long as the panel is
open, which contradicts the placement rule that made it permanent.

Both of those reasons are about a screen with room beside a control and a pointer aimed
at it. Neither survives a screen 390 points wide, where a panel wide enough to read is
the width of the screen and there is no *beside*. Scoping this to the laptop is
therefore a correction rather than a relaxation: it was already false of the phone
application, whose trip sheet is raised from a control in the header and rises from the
opposite edge, and a rule contradicted by shipped behaviour teaches the next reader that
the document is not describing the product.

#### Scenario: The panel follows its control

- **WHEN** the chrome takes its laptop shape
- **AND** two different controls in the chrome each reveal a panel
- **THEN** each panel is positioned beside the control that revealed it

#### Scenario: A panel does not cover a permanent control

- **WHEN** the chrome takes its laptop shape
- **AND** a menu or panel raised from the chrome is open
- **THEN** no control that the chrome keeps permanently reachable is covered by it

#### Scenario: A phone-shaped screen positions panels differently

- **WHEN** the chrome takes its phone shape
- **THEN** a panel is not required to be adjacent to the control that revealed it
- **AND** it is not required to leave every permanent control uncovered

## ADDED Requirements

### Requirement: A panel raised on a phone-shaped screen rises from the edge

Where the chrome takes its phone shape, a menu or panel raised from the chrome SHALL be
pinned to the bottom edge of the screen and SHALL span its width. It MAY cover controls
the chrome keeps permanently reachable, including the bar of tools, for as long as it is
open.

The tie between the panel and what opened it, which adjacency carries on a laptop, SHALL
be carried by something else: the rest of the screen SHALL be visibly set back while the
panel is open, and dismissing the panel SHALL restore every control it covered.

There is one exception, and it is a different kind of panel rather than a different
position. A panel that **describes something drawn on the map** — a selected place, or
the form saving one — SHALL NOT set the rest of the screen back, and SHALL leave enough
of the map visible for the thing it describes to be read against its surroundings. Such
a panel SHALL report the height it occupies, so that the camera can keep that thing out
from under it.

Rationale: the two kinds are not a stylistic split. A filter is a decision made and put
away, and setting the map back is what says the map is waiting for it. A selected
place's details are *about* a pin the person is looking at, so dimming the map would
obscure the only thing that makes the panel meaningful — and covering that pin makes the
panel describe something invisible. This is the rule the phone application already
follows and the reason its marker sheet is built differently from its filter sheet.

#### Scenario: A decision is made and put away

- **WHEN** the chrome takes its phone shape
- **AND** a panel that narrows or changes what is being worked on is opened
- **THEN** it rises from the bottom edge and spans the width of the screen
- **AND** the rest of the screen is visibly set back
- **AND** dismissing it restores every control it covered

#### Scenario: A panel describing something on the map

- **WHEN** the chrome takes its phone shape
- **AND** a panel describing a marker or the place being saved is opened
- **THEN** the rest of the screen is not set back
- **AND** enough of the map remains visible to read that marker against its surroundings

#### Scenario: The panel reports what it covers

- **WHEN** a panel describing something drawn on the map is open
- **THEN** the height it occupies is available to whatever positions the camera

#### Scenario: The permanent controls come back

- **WHEN** a panel covering the bar of tools is dismissed
- **THEN** every tool it covered is reachable again without further interaction

### Requirement: Dismissal and focus are the same contract in both shapes

A panel that rises from the edge SHALL be dismissible by the same actions as one that
hangs from a control: a press outside it, Escape on a platform with a keyboard, and its
own control. It SHALL report its control as open while it is shown, SHALL return focus
to that control when dismissed, and SHALL be announced as a named region.

Changing where a panel is drawn SHALL NOT change what it owes the person reading it.

Rationale: the existing requirements covering dismissal, open state, focus return and
naming are written about panels raised from the chrome, without reference to where they
are drawn — and that is correct, because none of what they ask for is positional. Stating
it once here stops a second implementation of the contract being written for the second
shape, which is exactly how the five inconsistent contracts that preceded the current
one came about.

#### Scenario: The contract holds in the phone shape

- **WHEN** the chrome takes its phone shape and a panel rising from the edge is open
- **THEN** a press outside it dismisses it
- **AND** Escape dismisses it on a platform with a keyboard
- **AND** focus returns to the control that opened it

#### Scenario: Both shapes behave alike

- **WHEN** a panel in the laptop shape and one in the phone shape are compared
- **THEN** both are dismissed by the same actions
- **AND** both announce themselves as a named region
