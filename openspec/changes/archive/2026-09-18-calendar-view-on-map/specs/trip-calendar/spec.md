## ADDED Requirements

### Requirement: A place opened from the calendar can be looked at on the map, and the calendar is returned to where it was left

A place opened from this screen SHALL offer a way to show it on the map. Doing so SHALL
show the trip's map with that place's details open and the place itself in view — not
beneath the details, whichever shape the screen has.

It SHALL be shown whatever the map is narrowed to. Where the filter set on the workspace
is not drawing the place, it SHALL be opened as a place addressed by identity is opened
(`marker-filtering`): drawn under its details, said to be hidden, and the filter left as
it was.

For as long as those details stay open, they SHALL offer a way **back to the calendar**,
labelled as such rather than by the day it leads to. Using it SHALL return to this screen
on **the day that was being read** when the place was shown on the map, with no place
open. Where the calendar has its phone shape and the person had been reading the places
waiting for a day rather than the days, it SHALL return to that view.

Closing those details SHALL end the detour: the way back to the calendar SHALL go with
them, and the map SHALL be left as an ordinary arrival at it would find it. Saving an edit
to the place, or removing it, closes its details on the map (`marker-capture`), and so
ends the detour too. Details opened
on the map in any other way SHALL NOT offer a way back to the calendar.

While the way back to the calendar is offered, it SHALL be the only way back those details
offer. Where the place shares its point with others, the details SHALL NOT also offer to
return to the choice between them; the others stay reachable by selecting that point on
the map, as any coincident place is (`map-rendering`).

Details opened on the map SHALL NOT offer to show the place on the map; the offer belongs
to this screen, which does not show where anything is.

Returning SHALL show the trip as it now stands: a change made to the place while its
details stayed open on the map — recording interest in it, marking it visited — SHALL be
reflected without the calendar being read again by hand.

The calendar's own way back to the map SHALL be unchanged by this.

Rationale: whether a place belongs on a given day depends mostly on where it is, and this
screen does not show where anything is. The map is looked at to answer that one question,
in the middle of arranging days, so it is a detour rather than a departure — and a detour
that returns somebody to the day the trip opens on, instead of the day they were reading,
makes them find their place again every time they check one. The way back is named for
the screen rather than the day because it leads to one screen, and the day is restored
without having to be named. It does not reopen the place: the person has seen where it is,
and the day they were reading is what they return to act on.

#### Scenario: A place is shown on the map from the calendar

- **WHEN** a person opens a place on this screen and asks to see it on the map
- **THEN** the trip's map is shown with that place's details open
- **AND** the place is in view and not covered by its details

#### Scenario: A place the filter is hiding is shown on the map

- **WHEN** a person asks to see on the map a place the workspace's filter is not drawing
- **THEN** that place's details are open and it is drawn under them
- **AND** it is stated that the filter is hiding it
- **AND** the filter is unchanged

#### Scenario: Returning to the day being read

- **WHEN** a person reading a day that is not the one this screen opens on shows a place on the map and then goes back to the calendar
- **THEN** that same day is the one being read
- **AND** no place is open

#### Scenario: Returning to the places waiting for a day on a phone-shaped screen

- **WHEN** a person reading the places waiting for a day on a phone-shaped screen shows one of them on the map and then goes back to the calendar
- **THEN** the places waiting for a day are what is shown

#### Scenario: Closing the place ends the detour

- **WHEN** a place shown on the map from this screen has its details closed
- **THEN** no way back to the calendar is offered
- **AND** the map is shown as it would be to any arrival at it

#### Scenario: A place opened on the map in the ordinary way

- **WHEN** a person opens a place from the map itself, or from a search
- **THEN** its details offer no way back to the calendar

#### Scenario: A place sharing its point with others

- **WHEN** a place shown on the map from this screen shares its point with other places
- **THEN** its details offer the way back to the calendar
- **AND** they do not offer a way back to the other places at that point
- **AND** selecting that point on the map still offers every place there

#### Scenario: Editing the place on the map ends the detour

- **WHEN** a person shows a place on the map and saves an edit to it there
- **THEN** its details close as they do for any edit on the map
- **AND** no way back to the calendar is offered

#### Scenario: A change made on the map is reflected on return

- **WHEN** a person shows a place on the map, marks it visited there, and goes back to the calendar
- **THEN** the place is shown as visited
- **AND** the calendar was not read again by hand
