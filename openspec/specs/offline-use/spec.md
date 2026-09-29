# offline-use Specification

## Purpose
Define what the phone application keeps from a trip so it can be used with no signal: what
opens, what can still be done, and how what was done is sent later. Downloading the map
around a trip's places ahead of time is not covered yet (#232). The laptop application is
not covered.

## Requirements

### Requirement: The phone keeps a copy of every trip it reads

The phone application SHALL keep, on the device, a copy of each trip it has read: the
trip itself, its markers, cities, members and recorded interest, and the list of trips the
person belongs to. The copy SHALL be written from what is on screen whenever that changes,
and SHALL record when the trip was last read successfully. The map's style document SHALL be
kept the same way.

The copy SHALL survive the application being closed and the device restarting. It SHALL NOT
be sent anywhere.

Rationale: the trip is needed most where the signal is worst, and a copy held only in
memory is gone the moment the application is closed.

#### Scenario: A trip is read

- **WHEN** a trip's lists are read successfully on the phone
- **THEN** the phone keeps a copy of them, with the time of the read

#### Scenario: Something changes on screen

- **WHEN** a person changes something on a trip, or a re-read replaces what is shown
- **THEN** the kept copy holds what is now on screen

### Requirement: A trip opens from its kept copy

When the phone application opens a trip of which a copy is kept, it SHALL show the kept copy
at once and read the trip at the same time; the read SHALL replace the copy when it arrives,
without a loading state in between. If the read fails, the kept copy SHALL stay on screen
and the failure SHALL NOT be reported, as for any re-read (`data-freshness`). When no copy
is kept, the trip SHALL load, and fail, as it did before this requirement.

The map SHALL draw with the kept style document when the style cannot be fetched.

Rationale: waiting for the read first would leave a person with a weak signal looking at a
loading screen for as long as the connection takes to give up, when the answer to *where
was that place* is already on the phone.

#### Scenario: Opening the application with no signal

- **WHEN** the application is opened with no signal, on a trip read on this phone before
- **THEN** the trip's places, cities, calendar, people and who wants to go are shown as they
  were last read
- **AND** no failure is shown in their place

#### Scenario: A trip never read on this phone

- **WHEN** a person switches, with no signal, to a trip this phone has never read
- **THEN** the failure is shown as before

### Requirement: The phone says when it is offline, and how old what it shows is

While the device has no connection, the map SHALL show a note that the phone is offline,
with the time the trip on screen was last read: *Offline · the trip as of 14:20*. When that
time was not today, the note SHALL also name the day. The note SHALL disappear when the
connection returns.

#### Scenario: The signal drops

- **WHEN** the device loses its connection while a trip is shown
- **THEN** the offline note appears with the time of the last read

#### Scenario: The signal returns

- **WHEN** the connection returns
- **THEN** the offline note disappears

### Requirement: Visited and who wants to go can be recorded with no signal

With no connection, a person SHALL still be able to mark a place visited or not visited, and
to record, change or withdraw whether they want to go. The change SHALL be shown at once,
everywhere the place is shown, with a line saying it will be sent when the phone is back
online.

Each such change SHALL be kept on the device until sent, surviving the application being
closed. When the connection returns, the changes SHALL be sent in the order they were made,
and the trip SHALL then be read again, however recently it was last read.

A change SHALL be sent as the state the person chose — *visited*, *not visited*, *wants to
go*, *not for me*, *undecided* — never as the opposite of what was stored. Of several
changes to the same thing, only the last SHALL be sent.

A change that the database refuses when sent — because the place was removed meanwhile, or
the person is no longer on the trip — SHALL be dropped without being reported. The re-read
that follows shows what is true.

Rationale: visited is shared by the whole trip. Sending *the opposite of what it was* would
let a tap made hours ago undo somebody else's tick; sending the chosen state means the last
change to reach the database wins, which is what already happens between two people online.
Interest cannot collide at all: each member can only change their own.

#### Scenario: Marking a place visited offline

- **WHEN** a person marks a place visited with no signal
- **THEN** it shows as visited at once
- **AND** a line under it says it will be sent when the phone is back online

#### Scenario: The connection returns

- **WHEN** the connection returns with changes waiting
- **THEN** they are sent in the order they were made
- **AND** the trip is read again afterwards
- **AND** the waiting line disappears

#### Scenario: The application is closed before the signal returns

- **WHEN** a person records interest offline, closes the application, and opens it later
  with a connection
- **THEN** the change is sent

#### Scenario: Somebody else unticked the place meanwhile

- **WHEN** a person marks a place visited offline, another member marks it not visited
  online, and the first phone then reconnects
- **THEN** the place ends up visited
- **AND** it is not flipped back to not visited

#### Scenario: The place was removed meanwhile

- **WHEN** a change waiting to be sent is for a place somebody else removed
- **THEN** the change is dropped without a message
- **AND** the place is gone after the re-read

### Requirement: Everything else that changes a trip is unavailable with no signal

While the device has no connection, every control that changes a trip other than those in
*Visited and who wants to go can be recorded with no signal* SHALL be shown disabled, not
hidden, with a line saying it needs a connection. This SHALL include editing and removing a
place, searching for and dropping a place, creating, renaming and removing a city, changing a
place's day, renaming a trip and changing its dates, inviting and removing people, archiving
and restoring a trip, and creating one.

Controls that only change what is shown — filtering, choosing a city, opening a place, the
calendar's views — SHALL keep working. When the connection returns, the disabled controls
SHALL become available again without any action from the person.

Rationale: a control that disappears reads as a feature that has gone; one that is disabled
with its reason says what to do about it.

#### Scenario: Opening a place offline

- **WHEN** a place's details are opened with no signal
- **THEN** Edit and Remove are disabled
- **AND** a line says editing needs a connection
- **AND** Visited and who wants to go can still be used

#### Scenario: The map offline

- **WHEN** the map is shown with no signal
- **THEN** Search and Drop are disabled
- **AND** Filter works

#### Scenario: The connection returns while details are open

- **WHEN** the connection returns while a place's details are shown
- **THEN** Edit and Remove become available

### Requirement: Signing out removes what the phone kept about the person

Signing out SHALL remove every kept trip copy and every change still waiting to be sent from
the device.

#### Scenario: Signing out

- **WHEN** a person signs out on the phone
- **THEN** no trip can be opened from a kept copy
- **AND** no waiting change is sent later on anyone's behalf
