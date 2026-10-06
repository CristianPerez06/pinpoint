## MODIFIED Requirements

### Requirement: The phone keeps a copy of every trip it reads

The phone application SHALL keep, on the device, a copy of each trip it has read: the
trip itself, its markers, cities, members, recorded interest and the order of each day's
places, and the list of trips the person belongs to. The copy SHALL be written from what is on screen whenever that changes,
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

### Requirement: Everything else that changes a trip is unavailable with no signal

While the device has no connection, every control that changes a trip other than those in
*Visited and who wants to go can be recorded with no signal* SHALL be shown disabled, not
hidden, with a line saying it needs a connection. This SHALL include editing and removing a
place, searching for and dropping a place, creating, renaming and removing a city, changing a
place's day, putting a day's places in order — by dragging or step by step — renaming a trip and changing its dates, inviting and removing people, archiving
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

#### Scenario: The calendar offline

- **WHEN** the calendar is shown with no signal
- **THEN** each place's drag handle, and moving it up or down, is disabled
- **AND** a line says reordering needs a connection
- **AND** each day is shown in the order the phone last kept
