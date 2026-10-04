# place-route Specification

## Purpose
Lets a person on the trip see how far a saved place is from where they are standing, as a
straight line drawn on the map with its distance and an estimated walking time, on the
phone and on the laptop, with or without a connection.

## Requirements

### Requirement: A selected place offers to calculate the route to it

When a place's details are open over the map, each application SHALL offer a button
reading *Calculate route*, in the application's language. It SHALL stand directly under the place's name and
tags, above the place's fields, so that on the phone it is visible without scrolling the
details.

It SHALL carry an accessible name from the product's named sentences that names the place.
It SHALL remain available with no network connection.

The calendar SHALL NOT offer it when it opens a place's details over the calendar, because
no map is on screen to draw the line on.

Rationale for the position: the phone's details take half the window and scroll, and the
actions at their foot are below that half. A button for something done standing in the
street belongs where it is seen when the place opens.

#### Scenario: Opening a place

- **WHEN** a person selects a pin and its details open
- **THEN** a *Calculate route* button stands under the place's name and tags

#### Scenario: Opened over the calendar

- **WHEN** a place's details open over the calendar
- **THEN** no *Calculate route* button is offered

#### Scenario: The phone's details

- **WHEN** a place's details open on the phone
- **THEN** the button is visible without scrolling

#### Scenario: No connection

- **WHEN** the phone has no connection and a place's details are open
- **THEN** the button is shown and can be pressed

### Requirement: Pressing it finds where the person is

Pressing *Calculate route* SHALL find the person's position as *where am I* does
(`device-location`): asking for permission the first time, showing that it is working, and
ending after a bounded wait. While it is working the button SHALL be inert, SHALL say that
the position is being found, and SHALL be announced as busy. A press while it is working
SHALL NOT start a second attempt.

When permission is refused or no position is found, the line SHALL NOT be drawn, the camera
SHALL NOT move, and the same note *where am I* shows for that case SHALL be shown. The
button SHALL stay, and pressing it again SHALL try again.

#### Scenario: First press

- **WHEN** a person who has never answered presses *Calculate route*
- **THEN** the platform's own location prompt is shown

#### Scenario: Waiting for the position

- **WHEN** the position has not yet arrived
- **THEN** the button says the position is being found and cannot be pressed again

#### Scenario: Refused on the phone

- **WHEN** location is refused on the phone and *Calculate route* is pressed
- **THEN** no line is drawn and the map stays where it was
- **AND** the note says location is off and can be turned on in Settings
- **AND** the button is still offered

#### Scenario: Refused on the laptop

- **WHEN** the browser blocks location and *Calculate route* is pressed
- **THEN** no line is drawn and the note says the browser is blocking location

### Requirement: The route is a straight line from the person to the place

With a position, the map SHALL draw a straight line from the person's position to the
place, and SHALL mark the person's position as *where am I* marks it. The line SHALL be
drawn beneath every marker, SHALL take no presses, and SHALL be drawn from the product's
tokens so it reads on both grounds. It SHALL NOT use any marker type's colour.

The camera SHALL then frame the person's position and the place together, both clear of
the place's details and of every other surface over the map, as framing a single place
already is.

The line SHALL be drawn from where the person was when the button was pressed. It SHALL
NOT move as the person moves.

Both applications SHALL draw the same line from the same shared description of it.

#### Scenario: A route is drawn

- **WHEN** a position is found after *Calculate route* is pressed
- **THEN** a straight line joins the person's position to the place
- **AND** the person's position and the place are both visible, neither behind the details

#### Scenario: The person walks on

- **WHEN** the person moves after the line was drawn
- **THEN** the line stays where it was drawn

#### Scenario: Both themes

- **WHEN** the line is drawn on the light ground and on the dark ground
- **THEN** it is visible against the map on both, and no pin is hidden beneath it

### Requirement: The details say how far it is and how long on foot

Once the line is drawn, the button SHALL be replaced by the distance and an estimated
walking time, and a *Clear* button.

The distance SHALL be measured in a straight line and written as Nearby writes a distance
(`nearby-places`): in metres rounded to the nearest 10 under 1 kilometre, in kilometres
with one decimal under 10 and none from 10. The words SHALL say it is measured in a
straight line.

The walking time SHALL be estimated from the straight-line distance, lengthened by 30% to
allow for streets that do not run straight, at 4.5 kilometres an hour, rounded to the
nearest 5 minutes and never under 5. Under an hour it SHALL be written in minutes; from an
hour, in hours and minutes. The words SHALL say it is an estimate, for example *About 25
min walk*.

Beyond 50 kilometres, the walking time SHALL NOT be shown, and the distance SHALL be shown
alone.

Every word SHALL come from the product's named sentences, in English and in Spanish.

Rationale for 30%: real walking routes in Kyoto, measured for #244, were 1.33 to 1.40 times
the straight line. Rationale for 50 kilometres: it is where Nearby already says a place is a
day trip rather than a walk, and a ten-hour walking time is true and useless.

#### Scenario: A temple across town

- **WHEN** the place is 1.34 kilometres away in a straight line
- **THEN** the details read *About 25 min walk* and *1.3 km in a straight line*

#### Scenario: Close by

- **WHEN** the place is 120 metres away
- **THEN** the details read *About 5 min walk* and *120 m in a straight line*

#### Scenario: A day trip

- **WHEN** the place is 35.46 kilometres away
- **THEN** the details read *About 10 h 15 min walk* and *35 km in a straight line*

#### Scenario: Further than a day trip

- **WHEN** the place is 120 kilometres away
- **THEN** the details show *120 km in a straight line* and no walking time

#### Scenario: Spanish

- **WHEN** the application is in Spanish and a route is shown
- **THEN** the walking time and the distance are written in Spanish

### Requirement: The route goes away when it is no longer about the open place

The line and the figures SHALL be removed, and the button offered again, when the person
presses *Clear*. The line SHALL also be removed when the place's details close, and when
another place is selected.

Only one route SHALL be drawn at a time.

#### Scenario: Clear

- **WHEN** a person presses *Clear*
- **THEN** the line is removed and *Calculate route* is offered again

#### Scenario: Closing the place

- **WHEN** a person closes the place's details while a line is drawn
- **THEN** the line is removed

#### Scenario: Selecting another place

- **WHEN** a person selects another pin while a line is drawn
- **THEN** the line is removed and the other place opens with *Calculate route* offered

### Requirement: Both applications offer the route

The laptop and the phone SHALL both offer *Calculate route*, with the same behaviour, the
same figures from the same place and position, and the same words. The phone SHALL offer it
with no connection.

#### Scenario: The same place on both

- **WHEN** the same place is routed to from the same position on the laptop and the phone
- **THEN** both show the same distance and the same walking time
