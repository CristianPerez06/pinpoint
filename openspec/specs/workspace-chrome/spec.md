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

A press that dismisses SHALL do only that. Where what is open dims the screen behind
it, the press SHALL NOT reach anything beneath it. Where nothing is dimmed, the press
SHALL NOT act on the map, and MAY act on another control of the chrome.

Rationale: a panel that closes only by finding one particular button inside it is a trap
in proportion to how tall it is — and the way out is furthest away exactly when the
panel is longest. Consistency is the requirement, not merely the presence of some way
out: a person learns one contract, not five.

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

### Requirement: The chrome is present before the data it names

In every application, the workspace's chrome SHALL be drawn on the first paint of the
workspace, before the trip and its places have been read. The mark, the control naming
the trip, the control naming the city, the session's tools, and the account control SHALL
all be present, in the placement each of them has once the data arrives, at both the
laptop and the phone shape. The chrome meets every requirement of `waiting-screens`; what
follows is particular to it.

A loading state SHALL NOT be shown *in place of* the chrome.

In the phone application, until the map can be shown, the area it will occupy SHALL hold a
single loading state, and that state SHALL be the same from the first paint until the map
replaces it — the same whether the trips or the trip's places are what is still being
read. The session's tools SHALL stand on the bottom edge from the first paint, inert until
the map is shown.

Nothing in the chrome SHALL change position, size, or appearance when the data arrives,
other than the names filling in where their placeholders were and the controls ceasing to
be inert.

Rationale: the chrome's arrangement is the same for every trip and it is known before any
of them is read. Withholding it until the data lands means the first thing shown says
nothing about the second, and the application arrives in one jump from a band of text to
an entire interface. What a person is waiting for is the map and the places on it; the
frame around them was never waiting for anything. This was first written for the web
application alone, and the phone application went on showing a loading screen, then the
header over a second loading message, then its tools — three arrivals for one wait. A
loading state that changes its words partway through the wait is a fourth.

#### Scenario: The workspace is opened

- **WHEN** the workspace is shown before the trip's data has arrived
- **THEN** the chrome is drawn, with every control it has once the data arrives
- **AND** it stands where it will stand once the data arrives
- **AND** no loading state is drawn in place of it

#### Scenario: The chrome is shown at a phone width

- **WHEN** the workspace is shown at a phone width before the data has arrived
- **THEN** the chrome takes its phone shape
- **AND** the tools stand on the bottom edge, as they do once the data arrives

#### Scenario: The phone application opens on a cold start

- **WHEN** the phone application opens before the session and the trips have been read
- **THEN** the chrome is drawn in its phone shape, with drawn placeholders for the trip's
  name and the city's name
- **AND** the map's area holds a loading state
- **AND** the tools stand on the bottom edge, inert

#### Scenario: The trip is known and its places are not

- **WHEN** the phone application has read the trip and has not yet read its places
- **THEN** the trip's name and the city's name are shown where their placeholders stood
- **AND** the map's area holds the same loading state it held before the trip was known
- **AND** the tools still stand on the bottom edge, inert

#### Scenario: The map is shown

- **WHEN** the map replaces the loading state in the phone application's map area
- **THEN** the tools become live
- **AND** neither the header nor the tools move or change size

### Requirement: A control is inert until the act it starts can complete

Where the chrome is drawn before its data, every control in it SHALL be inert until the
act that control begins is able to complete, as `waiting-screens` requires of every
screen, and SHALL be drawn and announced as that capability requires of an inert control.

Rationale: two of these tools need nothing fetched in order to be drawn and are still not
usable — one opens a form that needs the trip, and the other arms a map that does not
exist yet. Stating the rule as "inert until its data arrives" leaves both of them live and
each fails at the moment it is pressed.

#### Scenario: A control whose data has not arrived

- **WHEN** the chrome is drawn before the trip's data has arrived
- **THEN** the controls naming the trip, naming the city, narrowing the trip, and holding
  the account are each inert

#### Scenario: A control that needs no data but cannot yet act

- **WHEN** the chrome is drawn before the trip's data has arrived
- **THEN** the control that searches for a place and the control that places one by hand
  are also inert
- **AND** neither begins an act that cannot complete

#### Scenario: An inert control is reached without a pointer

- **WHEN** an inert control is reached by keyboard or by a screen reader
- **THEN** it is present in the tab order
- **AND** it is reported as unavailable
- **AND** activating it does nothing

#### Scenario: An inert control is drawn

- **WHEN** an inert control is drawn beside the live version of the same control
- **THEN** the two differ by more than hue
- **AND** any text either one carries clears the text contrast floor

### Requirement: A state standing in place of the workspace occupies the screen

Where the web application shows a state instead of the workspace — that it is loading,
that it failed, that there is nothing yet, or the setup for a first trip — that state
SHALL occupy the height of the screen it is standing in for.

Rationale: a state that sizes to its own content sits as a band at the top of an empty
page, and the centring written on it is drawn against a box the size of its own contents,
so it does nothing. This is the shape of defect that reads as correct in the stylesheet:
every declaration on the state itself is right, and the height was lost by the container
around it. The one of these that renders correctly today differs from the ones that do not
by three lines it has and they do not.

#### Scenario: A state is shown instead of the workspace

- **WHEN** the application shows loading, failure, emptiness, or first-trip setup in place
  of the workspace
- **THEN** that state occupies the full height of the screen
- **AND** it is not drawn as a band against the top of an otherwise empty page

### Requirement: A tool in the bottom bar is a glyph above one line of words

Where the chrome is phone-shaped and the session's controls stand on the bottom edge,
every one of those controls SHALL take one shape: a glyph, and beneath it the control's
name on a single line.

The name SHALL NOT be omitted. A glyph alone is a guess, and the glyphs these controls use
are conventions rather than pictures of what they open.

The name SHALL be one line and SHALL be set at one size across the controls in the bar.
Rationale: these controls are equals — each fires an action, none navigates — and equals
that are lettered at different sizes read as a hierarchy that does not exist.

**Nothing else SHALL occupy a line of its own in that column.** Where a control has
something to say beyond its name — that it is declaring a state, that it opens something,
how many of anything — that SHALL be carried on or beside the glyph, or in the control's
name, and SHALL NOT be added beneath the words as a further line.

Rationale: this is the defect the requirement exists to prevent, and it shipped. The
control that narrows the trip was built from a horizontal run of four elements — a glyph,
a word, a count and a state dot — and the bar draws its controls as a column, so each of
the four became a line and a pill-shaped control became a four-line block. It happened
only once a filter was applied, so the bar looked correct until somebody used the thing it
is there for. Nothing detected it: every rule involved was present and correct, the markup
type-checked, and the control rendered.

Rationale for stating this at all: the shape was previously a convention carried in
stylesheet comments and followed by two of the three controls. A convention that one
control can drift out of while type-checking and rendering is not a constraint, and the
one that drifted was the one carrying a state.

A control MAY be absent from the bar, and MAY be replaced by something of a different
shape while the map is doing something other than what it usually does. This requirement
governs the controls that are standing there as tools, not what may stand in their place.

#### Scenario: The session's controls have one shape

- **WHEN** a trip workspace is shown on a phone-shaped screen
- **THEN** each control on the bottom edge is a glyph above its own name
- **AND** each name is on one line
- **AND** the names are set at the same size as each other

#### Scenario: A control declaring a state does not grow a line

- **WHEN** a control on the bottom edge is declaring a state
- **THEN** it is still a glyph above one line of words
- **AND** the state is carried on the glyph or in the control's name
- **AND** no further line appears beneath the words

#### Scenario: A control that opens something does not show its affordance as a line

- **WHEN** a control on the bottom edge reveals a panel
- **THEN** no affordance indicating that is drawn beneath its name
- **AND** the control is still a glyph above one line of words

#### Scenario: A count has nowhere to go in the bar

- **WHEN** a control on the bottom edge would report a count
- **THEN** that count is not drawn as a line beneath the control's name
- **AND** whatever the count was reporting is either carried on the glyph, carried in the
  control's name, or not reported in this rendering

### Requirement: The session's tools weigh the same at every width

The controls that make up a session — beginning a place from search, beginning one from the
map, and narrowing what the map shows — SHALL be drawn at the same visual weight as each
other, at every width and on both platforms.

Same weight means none of them is given a fill, a border, a lettering weight or a size **as
emphasis** that the others do not have while all of them are at rest. It does not mean they
are indistinguishable: each keeps its own name and its own glyph, and a control that is
*declaring a state* is not at rest and is required to say so.

A treatment a control carries because of **what kind of control it is** is not emphasis
within the meaning of this requirement. A search field is filled because the styling rules
say a field is filled, and it accepts typing where its neighbours accept a press; it is not
being ranked above them by having a fill they do not. What this requirement forbids is a
treatment applied to *rank* one tool, which is recognisable by the test that removing it
would leave the control still doing its job in the same way.

Rationale: these controls are equals. Each fires an action and none navigates, and
`marker-capture` states that the two ways to begin adding a place are peers of which
neither is a fallback for the other. Drawing one of them more strongly asserts a hierarchy
that no requirement anywhere describes — and asserts it in colour, which no review reads.

Rationale for stating it at every width rather than for one shape: this equality was
already true of the phone-shaped bar and already written down there, but only as the reason
its three names are lettered at one size. The laptop bar drew one of the three as a filled
control for the life of the project without contradicting any requirement, because no
requirement reached it. A rule that holds at one breakpoint is a rule the other breakpoint
is free to break while type-checking, rendering, and looking deliberate.

This requirement governs weight only. Which controls exist, where they stand, what they are
called and what shape they take at a given width are settled elsewhere — in particular a
tool in the phone-shaped bar is a glyph above one line of words, and this requirement does
not carry that shape onto a laptop-shaped screen.

A control MAY be replaced, while the map is doing something other than what it usually
does, by something of a different weight. This governs the tools as they stand at rest, not
what stands in their place.

#### Scenario: The session's tools at a laptop width

- **WHEN** a trip workspace is shown on a laptop-shaped screen and no tool is declaring a
  state
- **THEN** no tool carries a fill, a border, a lettering weight or a size the others do not
- **AND** each tool is still distinguishable by its own name

#### Scenario: The session's tools at a phone width

- **WHEN** a trip workspace is shown on a phone-shaped screen and no tool is declaring a
  state
- **THEN** the three tools are drawn at the same weight as each other

#### Scenario: A tool is a field rather than a button

- **WHEN** one of the session's tools is a text field and its neighbours are buttons
- **THEN** the fill the field carries as a field is not treated as emphasis
- **AND** the field is not thereby ranked above the tools beside it

#### Scenario: A tool is declaring a state

- **WHEN** a tool is declaring that it is narrowing what the map shows
- **THEN** it is permitted to differ from its neighbours
- **AND** the difference is carried by more than hue alone

#### Scenario: The map is armed

- **WHEN** the map is armed and a tool has been replaced by what the arming needs
- **THEN** the replacement is not required to match the weight of the tools it stands among

### Requirement: Leaving the workspace and coming back returns it as it was left

Where the chrome offers a control that leaves the trip workspace for another screen, that
screen SHALL provide a way back that is visible without hunting, and returning SHALL
restore the workspace as it was left — the same trip and the same city, not the defaults
either would take on a fresh arrival.

Where the platform provides no system affordance for going back, the screen SHALL draw its
own. A screen that can be reached and not left is a screen that strands.

Rationale: every screen in both applications until now has either been the workspace or
replaced it — sign-in and sign-up, which nobody returns from, and which reach each other
through links they carry because there is nothing else to go back with. The first screen
that a person *returns* from is a different shape, and the two ways it can go wrong are
both silent.

On web the trip and the city are held in the address, so a way back that navigates to the
workspace's own path rather than reversing the step that left it drops the city and lands
somebody on a different one than they were working in — with nothing on screen to say that
it happened. On the phone the whole navigator is configured with no system header, so a
screen that does not draw its own way back has none at all.

Stating this as a rule of the chrome rather than of any one screen is deliberate. It binds
whatever else the chrome later sends people to, and the screens it sends them to are
exactly the ones nobody will think to check.

#### Scenario: A control in the chrome leads to another screen

- **WHEN** the chrome offers a control that leaves the trip workspace
- **THEN** the screen it leads to presents a visible way back
- **AND** that way back is present on a platform that provides no system affordance for it

#### Scenario: Returning restores the trip and the city

- **WHEN** a person leaves the workspace from a chrome control and comes back
- **THEN** the same trip is shown
- **AND** the same city is the one being worked in
- **AND** neither has fallen back to what a fresh arrival would have chosen

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
