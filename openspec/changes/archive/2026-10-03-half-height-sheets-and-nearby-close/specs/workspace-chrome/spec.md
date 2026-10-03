## MODIFIED Requirements

### Requirement: A panel raised on a phone-shaped screen rises from the edge

Where the chrome takes its phone shape, a menu or panel raised from the chrome SHALL be
pinned to the bottom edge of the screen and SHALL span its width. It MAY cover controls
the chrome keeps permanently reachable, including the bar of tools, for as long as it is
open.

Where the chrome takes its phone shape, in either application, Filter, Nearby, the
trips, the cities, the people and a place's details SHALL each stand at half the height
of the screen, whatever they hold. Contents taller than that SHALL scroll inside the
panel; contents shorter than that SHALL NOT shrink it. The menu, the map's credits and
the form saving a place are not among them.

A panel opened from inside another SHALL open: the first closes and the second rises in
its place, never the first closing and nothing following it.

Rationale: these panels chose their own heights — up to 85% of the screen for the trips,
and growing with what they held — so a long list left a sliver of map, and the same
panel stood at a different height every time it opened. Half the screen leaves the
other half of the map in view whichever of them is open, and a panel that is always the
same height is one the person learns where to reach.

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

#### Scenario: A long list on the phone

- **WHEN** a trip with 150 places is open on the phone and Nearby, the cities or the
  people is opened
- **THEN** the panel stands at half the height of the screen
- **AND** the rest of the list is reached by scrolling inside it

#### Scenario: A short panel on the phone

- **WHEN** a place with only a name is opened on the phone
- **THEN** its details stand at half the height of the screen, as a long place's do

#### Scenario: The site at a phone's width

- **WHEN** the site is used in a window as narrow as a phone and the cities are opened
- **THEN** they stand at half the height of the window, as they do in the application

#### Scenario: One panel opened from another

- **WHEN** People is pressed inside the trips panel on the phone
- **THEN** the trips panel closes and the people panel rises in its place

#### Scenario: The permanent controls come back

- **WHEN** a panel covering the bar of tools is dismissed
- **THEN** every tool it covered is reachable again without further interaction

