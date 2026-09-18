## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: A name that has not arrived is drawn, not written

**Reason**: The rule applies to every screen, not only the workspace's chrome, and is now
stated once in `waiting-screens` as *What is not yet known is drawn, not written*, with
its rationale and both of its scenarios carried over.

**Migration**: None. The chrome is bound by the `waiting-screens` requirement, which
`The chrome is present before the data it names` now names.

### Requirement: The chrome before the data and the chrome after it are one definition

**Reason**: The rule applies to every screen, not only the workspace's chrome, and is now
stated once in `waiting-screens` as *The waiting screen and the loaded screen are one
definition*, with its rationale and both of its scenarios carried over. The part
particular to the chrome, that nothing in it changes appearance beyond the names and the
controls, has moved into *The chrome is present before the data it names*.

**Migration**: None. Each application's chrome is already one definition drawing both
states; the phone's becomes one in this change.
