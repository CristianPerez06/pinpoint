## ADDED Requirements

### Requirement: The chrome is present before the data it names

In the web application, the workspace's chrome SHALL be drawn on the first paint of the
workspace route, before the trip and its places have been read. The mark, the control
naming the trip, the control naming the city, the session's tools, and the account
control SHALL all be present, in the placement each of them has once the data arrives,
at both the laptop and the phone shape.

A loading state SHALL NOT be shown *in place of* the chrome.

Rationale: the chrome's arrangement is the same for every trip and it is known before any
of them is read. Withholding it until the data lands means the first thing shown says
nothing about the second, and the application arrives in one jump from a band of text to
an entire interface. What a person is waiting for is the map and the places on it; the
frame around them was never waiting for anything.

#### Scenario: The workspace is opened

- **WHEN** the workspace route is shown before the trip's data has arrived
- **THEN** the chrome is drawn, with every control it has once the data arrives
- **AND** it stands where it will stand once the data arrives
- **AND** no loading state is drawn in place of it

#### Scenario: The chrome is shown at a phone width

- **WHEN** the workspace route is shown at a phone width before the data has arrived
- **THEN** the chrome takes its phone shape
- **AND** the tools stand on the bottom edge, as they do once the data arrives

### Requirement: A control is inert until the act it starts can complete

Where the chrome is drawn before its data, every control in it SHALL be inert until the
act that control begins is able to complete. A control SHALL NOT be treated as usable
merely because it needs no data in order to be drawn.

An inert control SHALL remain in the tab order, SHALL report itself as unavailable to
assistive technology, and SHALL do nothing when activated. It SHALL NOT be made
unavailable by a means that removes it from the tab order or hides it from a screen
reader.

An inert control SHALL be distinguishable from its live state by more than colour.

Rationale: two of these tools need nothing fetched in order to be drawn and are still not
usable — one opens a form that needs the trip, and the other arms a map that does not
exist yet. Stating the rule as "inert until its data arrives" leaves both of them live and
each fails at the moment it is pressed. Keeping an inert control in the tab order is what
separates a control that is temporarily unavailable from one that is absent: a person
navigating by keyboard or by screen reader is told the same thing a sighted person is
told by looking, which is that it is there and not yet.

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

### Requirement: A name that has not arrived is drawn, not written

Where the chrome names something it has not yet read — the trip, the city, or the person
signed in — it SHALL stand a drawn placeholder in that name's place. It SHALL NOT write
text in place of the name, and SHALL NOT write the name in a recessive colour to say that
it is provisional.

Where a name is already replaced by something that does not depend on the data, no
placeholder is required in its place.

Rationale: text is read, and every text a person can read is a claim. "Loading…" beside a
caret claims there is a menu that opens something, and a greyed name claims a name.
Neither is true yet. A drawn block claims only that something will go there, which is the
whole of what is known — and it is the only option the contrast floor leaves, since text
that is present but inert has to clear the floor and therefore cannot be recessive enough
to read as absent.

#### Scenario: The trip and city have not been read

- **WHEN** the chrome is drawn before the trip's data has arrived
- **THEN** a drawn placeholder stands where each name will be
- **AND** no text stands in place of either name

#### Scenario: A name is already replaced at this width

- **WHEN** the chrome is drawn at a width where a name is already replaced by something
  that does not depend on the data
- **THEN** no placeholder is required in that name's place

### Requirement: The chrome before the data and the chrome after it are one definition

The chrome drawn before the trip's data and the chrome drawn after it SHALL be produced
by a single definition, which draws both states. A second rendering of the same chrome
SHALL NOT be maintained for the waiting state.

Nothing in the chrome SHALL change position, size, or appearance when the data arrives,
other than the names filling in where their placeholders were and the controls ceasing to
be inert.

Rationale: two renderings that merely look alike disagree the moment either one is edited,
and the moment they are exchanged is exactly the moment the transition was supposed to
feel settled — so a single pixel of disagreement reads as a flinch. One definition removes
the disagreement rather than policing it.

Stated as what can be seen rather than as how it is built. Whether the element is
literally retained is a fact about a framework and is not observable; whether the bar
moves is observable, is the thing actually being promised, and is what a person notices
when it is broken.

#### Scenario: The data arrives

- **WHEN** the trip's data arrives while the chrome is drawn
- **THEN** the names fill in and the controls become live
- **AND** no control changes position, size, or appearance on account of the arrival alone

#### Scenario: The waiting chrome is edited

- **WHEN** the chrome's arrangement is changed
- **THEN** the waiting state and the loaded state change together
- **AND** neither can be changed without the other

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
