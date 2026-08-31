# map-rendering Specification

## Purpose

Define what a rendered map shows and what stays shared between platforms: the tiles
and attribution, the camera that frames a trip's markers, how a marker's type becomes
something visible, and what happens when two markers occupy the same point. Covers
both applications, which use different rendering libraries and must produce the same
map from the same data.
## Requirements
### Requirement: Both applications render the same map from the same shared logic

Each application SHALL render an interactive map that can be panned and zoomed.

Both applications SHALL obtain the map style reference, the framing camera, and each
marker's visual description from the shared map package. Neither SHALL derive a
camera, choose a colour, or select an icon on its own.

The shared package SHALL NOT import either rendering library, any DOM API, or any
native module. Everything platform-specific — creating the map, mounting markers,
handling gestures — SHALL live in the application.

Given the same markers and the same viewport, both applications SHALL frame them
identically.

#### Scenario: The same trip on both platforms

- **WHEN** the same trip is opened on web and on mobile at the same viewport size
- **THEN** both show the same map style
- **AND** both centre on the same coordinates at the same zoom
- **AND** both draw the same marker at the same position with the same icon and colour

#### Scenario: The shared package stays renderer-agnostic

- **WHEN** the shared map package is inspected for imports
- **THEN** it imports neither rendering library, no DOM API, and no native module
- **AND** it resolves and type-checks under both applications' bundlers

#### Scenario: Framing logic changes

- **WHEN** the rule for framing markers changes
- **THEN** the change is made once in the shared package
- **AND** both applications reflect it without either being edited

### Requirement: Attribution for the tile data is always visible

Wherever map tiles are rendered, the applications SHALL display attribution for
OpenStreetMap data.

Attribution SHALL be visible in the map's default state without interaction. It MAY be
abbreviated behind a control that expands it, provided something identifying the data
source is visible unprompted.

Attribution SHALL NOT be removed, hidden behind an interaction that can be missed, or
rendered in a way that fails to appear when the map does.

#### Scenario: The map is displayed

- **WHEN** a person views a screen showing the map on either platform
- **THEN** attribution for OpenStreetMap data is visible without interacting with
  anything

#### Scenario: A change would remove attribution

- **WHEN** a change removes the attribution control or renders it invisible
- **THEN** the change violates this requirement regardless of visual motivation

### Requirement: The map opens framing the trip's markers

On opening, the map SHALL position itself to show every marker of the current trip,
using the shared framing logic and the actual size of the surface it is drawn into.

Where chrome is drawn over the map rather than beside it, framing SHALL use the part of
the map that is **not** covered. Both halves of framing are affected and both SHALL
account for it: the zoom SHALL be chosen so the markers fit the uncovered part, and the
centre SHALL be offset so they land in it. Choosing the zoom for the whole surface and
only shifting the centre satisfies neither — the markers are then fitted to an area
twice the height of the one that can be seen, so the outer ones sit behind the chrome
while the framing reports success.

Which part of the map is covered SHALL be determined by the actual overlap between the
chrome and the map, and not by the chrome's position on the screen alone. Chrome drawn
beside the map — above it, beneath it, or to one side — SHALL contribute nothing to the
covered part however tall it is, and the covered part SHALL never be larger than the map
itself.

Rationale: this is not defensive tidiness. An application measuring the covered part as
the distance from the map's bottom edge up to the top of each piece of chrome gets the
right answer only for chrome whose top edge is inside the map; for a control in a bar
above the map the same subtraction reaches past the map's own top and returns a value
larger than the surface. The result is a plausible positive number that no type and no
lint can question, and every consumer of it then behaves correctly and visibly wrongly.

Only chrome that spans the map's width SHALL reduce the area framing fits markers into.
Chrome occupying part of the width leaves the rest of the map usable, and framing against
a reduced height because one corner is occupied discards the map that is plainly visible
beside it.

Rationale: framing fits points into a rectangle and cannot express the shape left by a
panel in a corner, so it has to approximate. Of the two approximations available, one
risks a single marker landing behind a panel that can be dismissed, and the other opens
the map on empty space with every marker pressed against the top edge. They are not
comparable failures, and the second reads as the application being broken.

When the trip has no markers, the map SHALL open at the shared default position rather
than failing or showing an undefined region.

When the trip has exactly one marker, the map SHALL centre on it at a zoom level that
shows its surroundings rather than at maximum zoom.

The map SHALL re-frame when, and only when, the person asks it to. Two things are such
a request:

- **Selecting a city**, which SHALL frame that city's markers using the same shared
  logic. Selecting a city that holds no markers SHALL leave the view where it is,
  because there is nothing to frame and moving to an arbitrary position would be worse
  than not moving.
- **Choosing a place from search**, which SHALL move to that place. A searched place is
  usually not on screen — that is generally why somebody searched for it — so leaving
  the camera still would put the place they just chose somewhere they cannot see, and
  the position they are being invited to confirm would be invisible while they
  confirmed it.

Nothing else SHALL move the camera. Panning or zooming SHALL NOT be overridden by
re-framing, and markers arriving, changing, or being added SHALL NOT re-frame — the
distinction being drawn is between a view the person put somewhere and a view the
application moved on its own.

#### Scenario: A trip with several markers

- **WHEN** a trip with markers spread across a city is opened
- **THEN** every marker is within the visible area
- **AND** none sits against the edge of the viewport

#### Scenario: Chrome beside the map rather than over it

- **WHEN** markers are framed while the application's controls sit in a bar above the
  map rather than over it
- **THEN** framing uses the whole of the map's surface
- **AND** no part of the map is treated as covered

#### Scenario: Chrome covering one corner of the map

- **WHEN** markers are framed while a panel covers part of the map's width
- **THEN** the area framing fits the markers into is not reduced
- **AND** the markers are not compressed into the part of the map the panel does not
  reach

#### Scenario: A trip framed while a sheet covers part of the map

- **WHEN** markers are framed while a sheet stands over part of the map
- **THEN** every marker is within the part of the map that is not covered
- **AND** none is behind the sheet

#### Scenario: A trip with no markers

- **WHEN** a trip with no markers is opened
- **THEN** the map renders at the default position
- **AND** no error is shown

#### Scenario: The person pans away

- **WHEN** a person pans or zooms after the map has opened
- **THEN** the view stays where they put it
- **AND** the map does not snap back to the framing position

#### Scenario: A city is selected

- **WHEN** a person selects a city that holds markers
- **THEN** the map frames that city's markers
- **AND** it uses the same shared framing logic as it does on opening

#### Scenario: A city with no markers is selected

- **WHEN** a person selects a city that holds no markers
- **THEN** the camera does not move
- **AND** no error is shown

#### Scenario: A place is chosen from search

- **WHEN** a person chooses a place returned by search
- **THEN** the map moves to that place
- **AND** it is close enough to show what surrounds it, rather than at maximum zoom
- **AND** the unsaved marker for it is on screen

#### Scenario: A marker is added while the person has panned away

- **WHEN** a marker is saved after the person has moved the view
- **THEN** the view stays where they put it
- **AND** the new marker is drawn wherever it falls, visible or not

### Requirement: A marker's appearance is derived from its type by shared code

The shared map package SHALL expose a function turning a marker into a platform-neutral
visual description — its position, its icon, its colour family, and its label.
Applications SHALL render that description and SHALL NOT inspect a marker's type to
decide how it looks.

Colour family SHALL be determined by the marker type's family, and icon by the type
itself. The description SHALL carry these as identifiers rather than as values ready
to draw: a family name rather than a colour, and an icon name rather than a glyph.

Applications SHALL resolve a family identifier to a colour through the shared token
package for the active theme, and SHALL resolve an icon identifier through their own
platform's icon set. Neither SHALL contain a family's colour as a literal, and neither
SHALL decide which icon a type gets.

Rationale for identifiers rather than values: a colour now depends on the active
theme, which the shared package has no business knowing, and an icon is a rendered
component that a package declaring no dependencies cannot hold.

An icon identifier that an application cannot resolve SHALL render as the fallback
type's icon rather than as nothing, and the mismatch SHALL be caught by an automated
check rather than by looking at the map.

A marker whose stored type is not recognised SHALL still render, using the fallback
type's appearance.

#### Scenario: Two markers of different types

- **WHEN** a temple and a restaurant are rendered
- **THEN** they show different icons
- **AND** they show the colours of their respective families

#### Scenario: Two markers of the same family

- **WHEN** a temple and a castle are rendered
- **THEN** they share a colour, because they share a family
- **AND** they show different icons

#### Scenario: An unrecognised type

- **WHEN** a marker's stored type is not in the shared list
- **THEN** it renders with the fallback type's icon and colour
- **AND** it is not omitted from the map

#### Scenario: A colour is changed

- **WHEN** a family's colour is changed in the shared tokens
- **THEN** both applications render the new colour after rebuilding
- **AND** neither application contains the literal value

#### Scenario: A type has no icon on one platform

- **WHEN** a type's icon identifier has no mapping in one application's icon set
- **THEN** an automated check reports the unmapped identifier
- **AND** if it reaches a rendered map, the marker draws the fallback icon rather than
  an empty pin

### Requirement: Markers at identical coordinates remain reachable

When two or more markers of a trip share the same position, the map SHALL make their
number apparent and SHALL provide a way to reach every one of them.

A marker SHALL NOT be rendered such that it is permanently obscured by another. Because
identical coordinates render to the same point at every zoom level, zooming SHALL NOT
be the only way to separate them.

The map SHALL NOT alter a marker's stored position in order to separate it visually.

#### Scenario: Two markers share a position

- **WHEN** two markers of the same trip have identical coordinates
- **THEN** the map indicates that more than one marker is at that point
- **AND** both markers can be reached from it

#### Scenario: Zooming does not help

- **WHEN** a person zooms to maximum on two markers with identical coordinates
- **THEN** they are still not separated by position
- **AND** the mechanism above is still what makes both reachable

#### Scenario: Selecting a point that holds several markers

- **WHEN** a person selects a point where more than one marker sits
- **THEN** they are offered the markers at that point to choose between
- **AND** choosing one shows what was recorded about it

#### Scenario: Stored positions are left alone

- **WHEN** the map renders coincident markers
- **THEN** neither marker's stored longitude or latitude is modified
- **AND** what is stored still reflects what the geocoder or the person supplied

### Requirement: The map does not label every marker

The map SHALL NOT render a permanent text label beside every marker at every zoom
level. Labels MAY appear when the view is close enough that they do not collide.

Rationale: at the zoom level that shows a whole city, twenty labels overlap into
unreadable text, and the question the map answers at that zoom is which markers are
near each other, not what each one is called.

#### Scenario: A city-wide view

- **WHEN** a trip's markers for one city are all visible at once
- **THEN** markers are distinguishable from one another
- **AND** the view is not obscured by overlapping text

### Requirement: Selecting a marker shows what was recorded about it

The map SHALL allow a person to select a marker and see the information held about
that place: its name, its note, its link, its price, and its type. Values that are
absent SHALL be shown as absent rather than as empty text.

The information SHALL be reachable from the map without navigating away from it.

Selection SHALL be dismissible, returning to the unobstructed map.

The presentation MAY differ between platforms. Each application SHALL choose the form
native to it rather than sharing rendered markup.

#### Scenario: Selecting a marker

- **WHEN** a person selects a marker on either platform
- **THEN** they see the name, note, link, price, and type recorded for that place
- **AND** the map is still on screen

#### Scenario: A marker with only a name

- **WHEN** a marker has no note, link, or price
- **THEN** those fields are shown as absent
- **AND** no empty field is presented as though it held a value

#### Scenario: Dismissing the selection

- **WHEN** a person dismisses the selected marker
- **THEN** the map returns to its unobstructed state
- **AND** the camera is not moved by the dismissal

### Requirement: The map distinguishes loading from empty

While a trip's markers are being loaded, the map SHALL indicate that loading is in
progress. It SHALL NOT present a loading map as though the trip had no markers.

When loading fails, the map SHALL say so and SHALL NOT present the failure as an empty
trip.

When a filter is applied and no marker matches it, the map SHALL say that nothing matches
the filter, and SHALL NOT present that as a trip with no markers.

Rationale: a trip with no markers, a trip whose markers have not arrived, and a trip
narrowed to nothing all render identically — an empty map. The differences between "you
have not saved anything yet", "this is broken" and "nothing matches what you asked for"
are ones a person cannot recover on their own, and each calls for a different next
action: save something, retry, or widen the filter.

#### Scenario: Markers are still loading

- **WHEN** the map is shown before the trip's markers have arrived
- **THEN** it indicates that it is loading
- **AND** it does not state or imply that the trip has no markers

#### Scenario: Loading fails

- **WHEN** the markers cannot be loaded
- **THEN** the map reports the failure
- **AND** does not present the trip as empty

#### Scenario: The trip genuinely has no markers

- **WHEN** loading completes and the trip has no markers
- **THEN** the map says the trip has no markers
- **AND** this is distinguishable from both the loading and failed states

#### Scenario: A filter matches no markers

- **WHEN** a filter is applied to a trip that has markers, and none of them match
- **THEN** the map says that no markers match the filter
- **AND** this is distinguishable from the loading, failed, and genuinely-empty states

### Requirement: An unsaved marker is drawn distinguishably from saved ones

While a place is being added, the map SHALL show the position being added and SHALL
make it distinguishable at a glance from the trip's saved markers.

What is drawn SHALL follow the shape of the screen rather than the platform. Where
the position is indicated directly it SHALL be drawn as an unsaved marker at that
position. Where the position is indicated by framing the map under a fixed sight,
the sight SHALL be what shows it, and the saved markers SHALL remain visible
beneath — the point of showing the position at all is that it can be read against
the places already on the trip.

The position being added SHALL be drawn above saved markers, so that placing one at
or near an existing marker leaves it visible and correctable rather than buried.

The position SHALL remain visible while the form that saves it is open. A form
that covers the map entirely leaves a geocoded result unconfirmable: the candidate
carried a name and a claim about where it is, and looking at where it landed is
the only way to check the claim. Where the form cannot sit beside the map it SHALL
leave enough of it showing for the drawn position to be read against what is
around it.

Any movement of the camera made to keep the position clear SHALL be bounded by what it is
correcting for. A position that nothing is drawn in front of SHALL NOT move the camera at
all, and after any movement the position SHALL be within the map.

Rationale: "only far enough, if at all" is unenforceable until it says what too far
looks like. A correction that carries the position off the edge of the map has not kept
it clear of the chrome — it has hidden it more completely than the chrome would have,
and it does so while reporting that it made the position visible. The person is then
asked to describe a place they cannot see, having chosen it by pointing at a map they
could.

It SHALL NOT be counted among the trip's markers: it SHALL NOT contribute to framing,
and it SHALL NOT be included wherever the trip's markers are counted or listed.

When the place is abandoned the unsaved position SHALL disappear and the map SHALL be
exactly as it was. When the place is saved it SHALL become an ordinary marker and SHALL
be drawn like every other.

#### Scenario: An unsaved marker is placed by pointing at the map

- **WHEN** a person points at the map to place somewhere
- **THEN** the map draws its position distinguishably from the saved markers
- **AND** the camera does not re-frame, because they chose a point they were
  already looking at
- **AND** it moves only far enough, if at all, to keep that position clear of
  anything drawn over the map

#### Scenario: A position nothing is drawn in front of

- **WHEN** a person points at a part of the map that no chrome covers
- **THEN** the camera does not move at all

#### Scenario: The correction does not overshoot

- **WHEN** the camera moves to keep a position clear of chrome drawn over the map
- **THEN** the position is within the map afterwards
- **AND** it is not behind the chrome

#### Scenario: A position is shown by a fixed sight

- **WHEN** a person frames the map under a fixed sight to place somewhere
- **THEN** the sight is distinguishable at a glance from the trip's saved markers
- **AND** the saved markers stay visible beneath it
- **AND** the application does not move the camera while the sight is armed

#### Scenario: An unsaved marker is placed by choosing a search result

- **WHEN** a person chooses a place returned by search
- **THEN** the map draws its position distinguishably from the saved markers
- **AND** the camera moves so that position is on screen

#### Scenario: An unsaved marker is placed on top of a saved one

- **WHEN** a person places an unsaved marker at the position of an existing marker
- **THEN** the unsaved marker is drawn above it
- **AND** it can still be corrected

#### Scenario: The place is abandoned

- **WHEN** a person abandons the place they were adding
- **THEN** the unsaved position disappears
- **AND** the trip's markers are drawn exactly as before

#### Scenario: The form for the place is open

- **WHEN** a person is filling in the form for a place being added
- **THEN** the position being added is still drawn on the map
- **AND** enough of the map is visible to read that position against its surroundings

#### Scenario: The place is saved

- **WHEN** a person saves the place
- **THEN** the marker is drawn like every other marker of the trip
- **AND** it is no longer distinguished as unsaved

### Requirement: The rendered style is derived from the upstream document, and says so when it cannot be

The shared map package SHALL produce the map style by transforming the upstream style
document rather than by handing the applications its address unchanged. The
transformation SHALL be a pure function of the fetched document: given the same
document it SHALL produce the same result, and it SHALL perform no I/O of its own.

The transformation SHALL be identified by name in the shared package so that both
applications apply the same one, and neither SHALL adjust the style itself.

Where the transformation depends on the upstream document containing particular
layers, it SHALL verify that they are present and SHALL fail loudly when they are
not. It SHALL NOT silently return a partly-transformed style.

Rationale: the upstream document is versioned by somebody else and its layers can be
renamed without notice. A transformation that quietly skips what it cannot find
produces a map that is half-themed, which reads as a styling mistake and never is.

#### Scenario: The style is applied on both platforms

- **WHEN** the same trip is opened on web and on mobile
- **THEN** both render the style produced by the same shared transformation
- **AND** neither application modifies it afterwards

#### Scenario: The upstream document is missing an expected layer

- **WHEN** the fetched style document no longer contains a layer the transformation
  expects
- **THEN** the failure is reported, naming what was missing
- **AND** a partly-transformed style is not rendered

#### Scenario: The upstream document is unreachable

- **WHEN** the style document cannot be fetched
- **THEN** the map reports that it could not load the map style
- **AND** it does not present a blank canvas with correctly-placed markers and no
  explanation

### Requirement: The map is drawn in the same theme as the interface around it

The map SHALL be rendered in the theme the rest of the application is rendered in.
When the theme changes, the map SHALL change with it without the trip being reloaded
and without the camera moving.

Markers SHALL be drawn in their family's colour for the active theme.

#### Scenario: The interface is dark

- **WHEN** an application is rendering in the dark theme
- **THEN** the map is drawn in its dark form
- **AND** no part of the map is drawn in the light theme's values

#### Scenario: The theme changes while the map is open

- **WHEN** the theme changes while a trip is on screen
- **THEN** the map re-renders in the new theme
- **AND** the camera stays exactly where it was

### Requirement: A marker's drawn form declares which of its points sits on the coordinate

The shared visual description SHALL state which point of the drawn marker corresponds
to the marker's coordinate. Applications SHALL mount markers using that point and
SHALL NOT assume the drawn form is centred on its position.

The stated point SHALL hold at every zoom level, and while the map is being zoomed as
well as after it settles.

Rationale: a marker whose drawn form is anchored by the wrong point is off by a fixed
number of pixels, which is invisible at the zoom the map opens at and looks like
drift as soon as somebody zooms. It renders, it type-checks, and it is wrong.

#### Scenario: A marker is drawn at a known coordinate

- **WHEN** a marker is rendered on either platform
- **THEN** the point the shared description names sits on the marker's coordinate

#### Scenario: The map is zoomed

- **WHEN** a person zooms in or out
- **THEN** each marker's named point stays on its coordinate throughout
- **AND** markers do not drift relative to what is beneath them

### Requirement: A visited marker is drawn as visited, without changing its colour

A marker that has been visited SHALL be drawn distinguishably from one that has not.

That distinction SHALL NOT be carried by the marker's colour. Colour names the marker's
family and nothing else, which is what allows the type list to grow without the map
becoming unreadable.

How much a visited marker is muted SHALL be decided by shared code and carried in the
drawn description, in the same way the drawn box and the anchor already are, so that both
applications mute it identically.

Interest SHALL NOT be drawn on a marker. Narrowing the map is what answers who wants to
go; encoding several members' answers onto one pin that already carries a family colour, a
glyph, a possible count badge and a possible selection ring is the unreadability this rule
exists to prevent.

Rationale: "which of these have we already been to" is asked while looking at the map,
most of all on a phone during the trip, and a filter answers it only once somebody thinks
to set one. "Who wants to go" is asked while planning, where narrowing is the better
instrument and the states are too many to draw.

#### Scenario: A visited marker among unvisited ones

- **WHEN** a trip containing visited and unvisited markers is drawn
- **THEN** the visited markers are visually distinguishable from the unvisited ones
- **AND** both are drawn in the colour of their family

#### Scenario: Two markers of one family, one visited

- **WHEN** two markers share a family and only one has been visited
- **THEN** they are drawn in the same colour
- **AND** still tell apart as visited and not

#### Scenario: Both applications mute identically

- **WHEN** the same visited marker is drawn by either application
- **THEN** it is muted by the same amount, taken from the shared drawn description

#### Scenario: Interest is not drawn

- **WHEN** members have recorded differing interest in a marker
- **THEN** the marker's drawn form is unchanged by those records

### Requirement: Changing a filter does not move the camera

Applying, changing or clearing a filter SHALL NOT re-frame the map.

Rationale: the map already frames a trip when it opens and never afterwards, so that
panning somewhere deliberately is not undone. A filter is changed far more often than a
trip is opened, and re-framing on each change would move the ground under someone every
time they narrowed what they were looking at.

When a filter leaves markers to show but none of them are within the current view, the
map SHALL indicate that the matching markers are elsewhere and SHALL offer to frame them.
Refusing to move the camera would otherwise produce a map that is empty while the filter
reports matches, which is the same indistinguishable-empty problem from the other side.

#### Scenario: Narrowing the filter while panned

- **WHEN** a filter is applied while the map is panned somewhere
- **THEN** the camera stays where it was
- **AND** the markers that no longer match are removed from the map

#### Scenario: The matches are all off screen

- **WHEN** an applied filter matches markers and none of them are within the current view
- **THEN** the map indicates that the matching markers are outside the view
- **AND** offers to frame them

#### Scenario: Clearing the filter

- **WHEN** a filter is cleared
- **THEN** every marker is shown again
- **AND** the camera stays where it was

### Requirement: Zoom is reachable from a visible control, not only a gesture

Each application SHALL offer a visible control that zooms the map in and out. The
control SHALL be present whenever the map is, without any prior interaction, and SHALL
NOT be the only way to zoom — the platform's own gestures SHALL continue to work
unchanged.

Rationale: a gesture is not an affordance. On a pointer it is a scroll over a
full-bleed canvas, which is easy to trigger by accident and zooms about the pointer, so
the view slides while it scales; on a phone it is a pinch, which needs two hands or a
grip that cannot be held while walking, and the phone is the platform used *during* the
trip. A control is also the only form of zoom a screen reader or a keyboard can reach.

Zooming from the control SHALL be about the centre of the view, and the centre
coordinate SHALL NOT move. Where an application shows a position under a fixed sight,
zooming SHALL leave the position under that sight unchanged.

Rationale: this is what makes the control a way of *looking* rather than a way of moving
the camera. It is also what keeps it inside the rule that nothing but a person's request
moves the camera — the person asked, with a button instead of a gesture.

The step SHALL come from the shared map package. Neither application SHALL define its
own step or its own bounds.

The shared minimum and maximum zoom SHALL be in force for **every** instrument that can
change zoom, not only for the control and for framing. An application SHALL bind the
shared range to its renderer rather than relying on the renderer's own defaults.

Rationale: the range belongs to the product, and the renderers do not share it —
`maplibre-gl` allows more zoom than the shared framing logic will ever return. Without
binding it, the end of the range depends on which instrument was last used, and a camera
can be left somewhere no framing can return to.

At either end of the range the control that can do nothing SHALL be drawn as
unavailable and announced as unavailable, and SHALL NOT be removed. Where the platform
has a focus or accessibility order, the unavailable control SHALL remain in it.

Rationale: removing it tells somebody arriving by keyboard or by screen reader that
zoom is gone, and says nothing about why.

#### Scenario: The control is visible with the map

- **WHEN** a person views a screen showing the map on either platform
- **THEN** a control for zooming in and a control for zooming out are visible without
  interacting with anything

#### Scenario: Zooming in from the control

- **WHEN** a person uses the control to zoom in
- **THEN** the map zooms in by the shared step
- **AND** the centre coordinate of the view is unchanged

#### Scenario: Zooming while a position is under a fixed sight

- **WHEN** a person zooms from the control while a position is shown under a fixed sight
- **THEN** the position under the sight is unchanged
- **AND** confirming afterwards saves the same coordinate it would have saved before

#### Scenario: The end of the range is reached

- **WHEN** the map is at the shared maximum zoom
- **THEN** the control for zooming in is drawn as unavailable and announced as such
- **AND** it is still present and still reachable
- **AND** using it does nothing

#### Scenario: A gesture reaches the end of the range

- **WHEN** a person zooms past the shared maximum with a gesture rather than the control
- **THEN** the map stops at the shared maximum
- **AND** it does not stop at the rendering library's own limit

#### Scenario: Gestures still work

- **WHEN** a person zooms by scroll, by pinch, or by the rendering library's own
  keyboard shortcut
- **THEN** the map zooms as it did before the control existed

#### Scenario: The control is on the map at every width

- **WHEN** the map is rendered at any window or device size
- **THEN** the zoom control is within the map's own bounds
- **AND** it can be reached by pointer, by keyboard and by a screen reader

#### Scenario: The control does not cover the attribution

- **WHEN** the map is rendered at any window or device size
- **THEN** the attribution for the tile data is fully visible
- **AND** the zoom control overlaps neither it nor anything else standing on that edge

### Requirement: Framing stays usable as the visible strip shrinks

Framing SHALL produce a usable camera for every height the uncovered part of the map can
take, including none at all, and the zoom it produces SHALL always be a finite value
inside the shared range.

An application that frames against a reduced height SHALL NOT reduce it without limit.
It SHALL keep a floor under the strip it frames against, so that a tall sheet cannot
drive the camera to the end of the zoom range.

Rationale: the zoom is derived by dividing by the usable height. Zero does not produce a
value that is *not a number* — it produces negative infinity, which the shared clamp then
turns into the minimum zoom — so the failure is not a broken camera but a camera showing
the entire world, which reads as the map having jumped somewhere rather than as a
framing decision. The floor is what keeps the correction proportionate: the point of
framing against the visible strip is to see the places, and a strip small enough to zoom
out to the ocean has stopped serving that.

#### Scenario: A sheet covering the whole map

- **WHEN** framing is asked for while the covered height is at least the height of the
  surface
- **THEN** a camera with a finite zoom inside the shared range is produced
- **AND** the map continues to render

#### Scenario: A tall sheet does not zoom the map out to nothing

- **WHEN** a sheet covers most of the map and framing is asked for
- **THEN** the zoom is chosen against a bounded strip rather than against what is left
- **AND** it does not fall to the shared minimum

#### Scenario: The visible strip shrinking never zooms in

- **WHEN** the same points are framed against a full surface and against a strip of it
- **THEN** the zoom for the strip is no greater than the zoom for the full surface

### Requirement: The indication that the map is loading occupies the map's own area

Where the chrome around the map is already drawn, the indication that the map is loading
SHALL occupy the area the map itself will occupy, and SHALL be drawn on the ground the map
is drawn on.

It SHALL NOT stand in place of the whole screen, and SHALL NOT be drawn on a ground that
reads as another band of chrome.

Rationale: `The map distinguishes loading from empty` says the map indicates that it is
loading and does not say where that indication belongs. It did not have to while the whole
screen was the indication. Once the chrome is present, the question becomes real: a
loading panel on its own recessive surface, directly beneath a bar on a raised one, reads
as two bands of furniture rather than as one hole where the map goes. Giving the area the
map's own ground makes the space legible as the map before the map is there, which is what
tells a person that the thing they are waiting for is the map and not the application.

#### Scenario: The map is loading beneath drawn chrome

- **WHEN** the chrome is drawn and the map's data has not arrived
- **THEN** the indication that it is loading occupies the area the map will occupy
- **AND** that area is drawn on the ground the map is drawn on
- **AND** the indication does not stand in place of the whole screen

#### Scenario: The waiting area is drawn against the chrome

- **WHEN** the waiting area is drawn directly beneath or above a piece of chrome
- **THEN** it is distinguishable from that chrome
- **AND** it does not read as a second band of chrome

