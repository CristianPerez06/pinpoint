## Purpose

Define how a screen a signed-in person sees behaves while the data it shows is being
read, on every application: drawn at once where it will stand, with still placeholders for
what is not yet known, controls that act only once their act can complete, and nothing
moving when the data arrives. Screens with rules of their own, such as the workspace's
chrome and the calendar, add to these and do not restate them.

## ADDED Requirements

### Requirement: A screen is drawn before its data arrives

Every application SHALL draw each screen a signed-in person sees before the data it shows
has been read. Each part of the screen SHALL stand where it will stand once the data
arrives, in the shape the screen takes at that size.

A loading state SHALL NOT be shown in place of the screen, and the screen SHALL NOT be
preceded by another screen's waiting state. A loading state MAY stand inside a part of the
screen whose contents cannot be drawn as placeholders, such as a map, provided the rest of
the screen is drawn around it.

Where the data, once read, shows that a different screen is needed, that screen MAY
replace the waiting one. An account with no trips is shown the setup for a first trip in
place of the waiting map.

This requirement does not apply before an application is able to draw anything at all,
while the operating system's launch screen is still showing.

Rationale: a screen's arrangement is known before any of its data is read. Withholding it
means the first thing shown says nothing about the second, and the application arrives in
one jump from a band of text, or from nothing, to an entire interface. What a person is
waiting for is the data. The frame around it was never waiting for anything. A new
account does see a frame that is then replaced, once, on its first launch; every other
launch is somebody who has a trip, and for them nothing jumps.

#### Scenario: Settings is opened by its address

- **WHEN** Settings is opened on the web application by its address, by a reload or a
  link, before the account has been read
- **THEN** the Settings screen is drawn, with its header, both sections and the choice of
  appearance
- **AND** no blank page and no other screen's waiting state is shown

#### Scenario: The phone application opens

- **WHEN** the phone application opens on the map before the session and the trips have
  been read
- **THEN** the map screen's header and its bottom row of tools are drawn where they will
  stand
- **AND** no loading screen is shown in place of the map screen

#### Scenario: An account with no trips

- **WHEN** the waiting map screen is shown and the trips, once read, are none
- **THEN** the setup for a first trip replaces it

### Requirement: What is not yet known is drawn, not written

Where a screen names something it has not yet read, it SHALL stand a drawn placeholder in
that name's place, in the size and line the name will occupy. It SHALL NOT write text in
place of the name, and SHALL NOT write the name in a recessive colour to say that it is
provisional. In particular, it SHALL NOT write a statement that is false for as long as
the data has not been read — that there is nothing there, or that there is no such value.

Text that is true before anything has been read SHALL be written as it will be once the
data arrives.

Where a name is already replaced by something that does not depend on the data, no
placeholder is required in its place.

Rationale: text is read, and every text a person can read is a claim. "Loading…" beside a
caret claims there is a menu that opens something, and a greyed name claims a name.
Neither is true yet. "No address on this account", written while the account is still
being read, is simply false. A drawn block claims only that something will go there,
which is the whole of what is known, and it is the only option the contrast floor leaves,
since text that is present but inert has to clear the floor and therefore cannot be
recessive enough to read as absent.

#### Scenario: A name has not been read

- **WHEN** a screen is drawn before the data naming something on it has arrived
- **THEN** a drawn placeholder stands where that name will be
- **AND** no text stands in its place

#### Scenario: Settings on the phone before the session is read

- **WHEN** Settings is shown on the phone application before the session has been read
- **THEN** a drawn placeholder stands where the account's address will be
- **AND** the screen does not say that the account has no address

#### Scenario: Text that is already true

- **WHEN** a screen is drawn before its data has arrived
- **THEN** headings, labels and the names of controls that do not depend on the data are
  written as they will be once it arrives

#### Scenario: A name is already replaced at this width

- **WHEN** a screen is drawn at a width where a name is already replaced by something
  that does not depend on the data
- **THEN** no placeholder is required in that name's place

### Requirement: Placeholders are still

The placeholders on a waiting screen SHALL NOT shimmer, pulse, or otherwise move. A
loading state standing inside part of a screen MAY carry its own indicator of activity,
together with words.

Rationale: a screen full of moving shapes reads as busy rather than as waiting, and the
placeholders this product already drew, the search list's waiting rows, were still. An
indicator of activity on its own is indistinguishable from a stalled one, which is why a
loading state carries words beside it.

#### Scenario: A waiting screen is drawn

- **WHEN** a screen is drawn before its data has arrived
- **THEN** no placeholder moves, shimmers or pulses

### Requirement: A control acts only once its act can complete

Where a screen is drawn before its data, every control on it SHALL be inert until the act
that control begins is able to complete. A control SHALL NOT be treated as usable merely
because it needs no data in order to be drawn. A control whose act is already able to
complete is not required to be inert.

An inert control SHALL remain in the tab order, SHALL report itself as unavailable to
assistive technology, and SHALL do nothing when activated. It SHALL NOT be made
unavailable by a means that removes it from the tab order or hides it from a screen
reader.

An inert control SHALL be distinguishable from its live state by more than colour, and any
text it carries SHALL clear the text contrast floor.

Rationale: some controls need nothing fetched in order to be drawn and are still not
usable. One opens a form that needs the trip, another arms a map that does not exist yet.
Stating the rule as "inert until its data arrives" leaves both of them live and each
fails at the moment it is pressed. The converse holds too: a control that leaves a screen
or changes the appearance needs nothing that is loading, and holding it inert would only
make somebody wait for no reason. Keeping an inert control in the tab order is what
separates a control that is temporarily unavailable from one that is absent: a person
navigating by keyboard or by screen reader is told the same thing a sighted person is told
by looking, which is that it is there and not yet.

#### Scenario: A control whose act cannot yet complete

- **WHEN** a control on a waiting screen is reached, by pointer, keyboard or screen reader,
  before the act it begins is able to complete
- **THEN** it is present in the tab order
- **AND** it is reported as unavailable
- **AND** activating it does nothing

#### Scenario: A control whose act can already complete

- **WHEN** Settings is drawn before the account has been read
- **THEN** the control leading back and the choice of appearance work
- **AND** only the account's address waits

#### Scenario: An inert control is drawn

- **WHEN** an inert control is drawn beside the live version of the same control
- **THEN** the two differ by more than hue
- **AND** any text either one carries clears the text contrast floor

### Requirement: The waiting screen and the loaded screen are one definition

Within each application, a screen drawn before its data and the same screen drawn after it
SHALL be produced by a single definition, which draws both states. A second rendering of
the same screen SHALL NOT be maintained for the waiting state.

Nothing on the screen SHALL change position or size when the data arrives. What changes is
that the placeholders are replaced where they stand by what they stood for, a loading
state standing inside part of the screen gives way to its contents, and the controls cease
to be inert.

Rationale: two renderings that merely look alike disagree the moment either one is edited,
and the moment they are exchanged is exactly the moment the transition was supposed to
feel settled, so a single pixel of disagreement reads as a flinch. One definition removes
the disagreement rather than policing it.

Stated as what can be seen rather than as how it is built. Whether an element is literally
retained is a fact about a framework and is not observable; whether the screen moves is
observable, is the thing actually being promised, and is what a person notices when it is
broken.

#### Scenario: The data arrives

- **WHEN** a screen's data arrives while its waiting state is shown
- **THEN** the placeholders are replaced where they stand
- **AND** nothing on the screen changes position or size on account of the arrival alone

#### Scenario: A waiting screen is edited

- **WHEN** a screen's arrangement is changed
- **THEN** its waiting state and its loaded state change together
- **AND** neither can be changed without the other

### Requirement: A waiting screen says it is loading to assistive technology

A screen drawn before its data SHALL tell assistive technology that it is loading. Its
drawn placeholders SHALL NOT be read out.

Rationale: a sighted person reads the wait from the shapes. A screen reader has nothing to
read in a grey bar, so without being told, a person using one meets a screen that seems
to have no names on it.

#### Scenario: A waiting screen is reached by a screen reader

- **WHEN** a screen is drawn before its data has arrived and a screen reader is in use
- **THEN** it is told that the screen is loading
- **AND** the drawn placeholders are not read out
