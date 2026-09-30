# offline-use Specification

## Purpose
Define what the phone application keeps from a trip so it can be used with no signal: what
opens, what can still be done, how what was done is sent later, and how the map around a
trip's places is downloaded ahead of time. The laptop application is not covered.

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
the device. A downloaded map SHALL be kept, because it holds nothing about the person or the
trip beyond streets.

#### Scenario: Signing out

- **WHEN** a person signs out on the phone
- **THEN** no trip can be opened from a kept copy
- **AND** no waiting change is sent later on anyone's behalf

#### Scenario: Signing out with a downloaded map

- **WHEN** a person with a downloaded map signs out and signs back in
- **THEN** the map of those areas still draws with no signal

### Requirement: The map around a trip's places can be downloaded ahead of time

The phone application SHALL offer an *Offline map* screen for the open trip, reached from a
line in the trip sheet. The line SHALL say that the map is not downloaded, its size on the
device once it is, or how many new areas there are when the trip has places outside every
downloaded area.

The screen SHALL list the areas that would be downloaded, each with an estimate of its size
said as approximate, and their total. An area SHALL cover one group of places near each
other, with a margin around them; places far apart SHALL be in separate areas rather than in
one area spanning both. An area SHALL be named after the city most of its places are filed
under, or say how many places with no city it holds when none of them has a city.

Nothing SHALL be downloaded until the person presses Download, which SHALL state the total
size. When the device is on mobile data, the screen SHALL say so before the download starts,
without preventing it.

While downloading, the screen SHALL show progress overall and per area, and SHALL offer to
cancel; cancelling SHALL remove what was downloaded so far. The download SHALL continue while
the application is on screen, on any of its screens. When the application leaves the screen
the download SHALL pause, and SHALL continue when the person returns, without downloading
again what was finished. When an area cannot be downloaded, the screen SHALL say so and offer
to try again, keeping the areas that finished. When the connection is lost during a
download, the screen SHALL say the download has stopped, and the download SHALL continue by
itself when the connection returns.

Once downloaded, the map of those areas SHALL draw with no signal, at every zoom from the area
as a whole down to street level, with the map's attribution visible. The download SHALL
also hold the map around all of the trip's places at the zoom where they are seen at once,
without street detail, so the map opens with no signal showing the land under every pin
rather than an empty ground. It SHALL keep drawing
with no signal after the phone has been online again in the meantime. The screen SHALL show
the size on the device and the day it was downloaded, and SHALL offer to remove it from the
phone.

When the trip has places outside every downloaded area, the screen SHALL mark the new areas
and offer to download only those, stating how much more that is. The new areas SHALL be
downloaded with the same edition of the streets as the rest, so the whole trip draws
together. When the map service has published a newer edition since the trip was
downloaded, Update SHALL instead download every area again with the current edition, SHALL
state that size before it starts, and SHALL keep the areas already on the phone, drawing
with no signal, until it has finished.

While a trip's map is downloaded, its map SHALL draw from the edition of the streets that
was downloaded, online as well as offline.

With no connection, Download and Update SHALL be disabled with a line saying downloading
needs a connection. Removing SHALL still work.

Rationale: the whole trip in one press, because choosing areas one by one is a decision a
person should not have to make before a flight. The size first, because tens of megabytes
per city is enough to matter on a data plan or a full phone. One edition per trip, because
the map service republishes its streets weekly under a new address, and a phone that
follows the new address can no longer find the streets it downloaded.

#### Scenario: Downloading a trip's map

- **WHEN** a person opens Offline map and presses Download
- **THEN** the areas are downloaded with visible progress
- **AND** afterwards the trip sheet line shows the size on the device

#### Scenario: Using the map with no signal

- **WHEN** the map was downloaded and the device has no signal
- **THEN** the streets around the trip's places draw at street level
- **AND** the map's attribution is visible

#### Scenario: Opening the whole trip with no signal

- **WHEN** the map was downloaded and the application opens with no signal on the whole trip
- **THEN** the land, coasts and larger place names around every pin draw

#### Scenario: Online again, then offline

- **WHEN** the map was downloaded, the phone was online again for a while, and the signal is
  then lost
- **THEN** the streets around the trip's places still draw

#### Scenario: Leaving during a download

- **WHEN** a person switches to another application during a download and comes back
- **THEN** the download continues from where it stopped

#### Scenario: Losing the connection during a download

- **WHEN** the connection is lost partway through a download
- **THEN** the screen says the download has stopped until the phone is back online
- **AND** when the connection returns, it continues from where it stopped

#### Scenario: Cancelling a download

- **WHEN** a person cancels a download part way through
- **THEN** what was downloaded is removed
- **AND** the line says the map is not downloaded

#### Scenario: On mobile data

- **WHEN** the Offline map screen is opened on mobile data
- **THEN** a line says Wi-Fi is better for a download this size
- **AND** Download can still be pressed

#### Scenario: A place is added somewhere new

- **WHEN** a place is added far from every downloaded area
- **THEN** the trip sheet line and the Offline map screen say there is one new area
- **AND** Update downloads only that area

#### Scenario: Updating in the same edition

- **WHEN** a place is added somewhere new and the map service still publishes the edition
  the trip was downloaded with
- **THEN** Update downloads only the new area

#### Scenario: Updating after the streets were republished

- **WHEN** a place is added somewhere new after the map service has published a newer
  edition of the streets
- **THEN** the screen says Update downloads the whole trip again, and states that size
- **AND** until it finishes, the areas already downloaded still draw with no signal
- **AND** afterwards every area draws with no signal, the new one included

#### Scenario: Removing the download

- **WHEN** a person removes the downloaded map
- **THEN** the space is freed and the line says the map is not downloaded

#### Scenario: Places spread across a country

- **WHEN** a trip has places in two cities hundreds of kilometres apart
- **THEN** they are listed as two areas
- **AND** the land between them is not downloaded

#### Scenario: With no signal

- **WHEN** the Offline map screen is opened with no signal
- **THEN** Download and Update are disabled with a line saying downloading needs a connection
- **AND** Remove from this phone still works

### Requirement: Reading the trip again is unavailable with no signal

While the device has no connection, the map's control for reading the trip again SHALL be
shown disabled, not hidden, and SHALL become available again when the connection returns,
without any action from the person. The offline note on the map says why.

Rationale: pressed with no signal, it spun until the request gave up and then said nothing,
so a person was left waiting on a control that could not succeed.

#### Scenario: The map offline

- **WHEN** the map is shown with no signal
- **THEN** the control for reading the trip again is disabled

#### Scenario: The connection returns

- **WHEN** the connection returns
- **THEN** the control for reading the trip again can be pressed
