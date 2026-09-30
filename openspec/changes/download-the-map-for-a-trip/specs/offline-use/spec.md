## ADDED Requirements

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
to try again, keeping the areas that finished.

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
together.

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

#### Scenario: Updating after the streets were republished

- **WHEN** a place is added somewhere new after the map service has published a newer
  edition of the streets
- **THEN** Update downloads only the new area
- **AND** with no signal, the new area and the others draw together

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

## MODIFIED Requirements

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
