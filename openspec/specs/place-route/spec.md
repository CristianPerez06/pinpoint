# place-route Specification

## Purpose
Lets a person on the trip see how far a saved place is from where they are standing and
how long it takes to get there, on foot, by bike or by car, on the phone and on the
laptop. With a connection the route follows the streets; without one, it is a straight
line with its distance and an estimated walking time.

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

### Requirement: The route is drawn from the person to the place

With a position, the map SHALL draw a line from the person's position to the place, and
SHALL mark the person's position as *where am I* marks it. The line SHALL be drawn beneath
every marker, SHALL take no presses, and SHALL be drawn from the product's tokens so it
reads on both grounds. It SHALL NOT use any marker type's colour.

The line SHALL take one of two forms, and the two SHALL differ in their pattern, not in
their colour:

- **A straight line**, drawn dotted, when no street route is shown. It is a distance, not
  a way anyone can follow.
- **A street route**, drawn solid, following the streets the routing service returned for
  the chosen way of travelling (*A street route replaces the straight line when there is a
  connection*).

The camera SHALL then frame the person's position and the place together, both clear of
the place's details and of every other surface over the map, as framing a single place
already is. When a street route replaces the straight line, the camera SHALL frame the
whole of the street route, which may run outside the box the two ends make.

The line SHALL be drawn from where the person was when the button was pressed. It SHALL
NOT move as the person moves. Choosing another way of travelling SHALL route again from
that same position.

Both applications SHALL draw the same line from the same shared description of it.

#### Scenario: A route is drawn

- **WHEN** a position is found after *Calculate route* is pressed
- **THEN** a line joins the person's position to the place
- **AND** the person's position and the place are both visible, neither behind the details

#### Scenario: The street route arrives

- **WHEN** a street route replaces the straight line
- **THEN** the line is solid and follows the streets
- **AND** the whole route is visible, none of it behind the details

#### Scenario: Told apart in greyscale

- **WHEN** a straight line and a street route are compared on a greyscale screen
- **THEN** the straight line is dotted and the street route is solid

#### Scenario: The person walks on

- **WHEN** the person moves after the line was drawn
- **THEN** the line stays where it was drawn

#### Scenario: Both themes

- **WHEN** the line is drawn on the light ground and on the dark ground, in both forms
- **THEN** it is visible against the map on both, and no pin is hidden beneath it

### Requirement: The details say how far it is and how long it takes

Once the line is drawn, the button SHALL be replaced by the distance, a time where one is
known, an icon for the way of travelling, a *Clear* button, and the choice of how the
person is travelling (*The person chooses how they are travelling*).

**With a street route**, the distance and the time SHALL be the routing service's, for the
chosen way of travelling. The distance SHALL be written as Nearby writes a distance
(`nearby-places`), and the words SHALL say it is measured along the streets, for example
*4.4 km along the streets*. The time SHALL be rounded to the nearest minute and never
said as less than 1. Under an hour it SHALL be written in minutes and from an hour in hours
and minutes, with words naming the way of travelling: *53 min walk*, *18 min by bike*,
*14 min drive*, *2 h 25 min walk*. It SHALL NOT say *About*. A street route's time SHALL be
shown at any distance, for every way of travelling.

**With the straight line**, the distance SHALL be measured in a straight line, written as
Nearby writes a distance, and the words SHALL say it is measured in a straight line.

- While walking is chosen, an estimated walking time SHALL be shown, estimated from the
  straight-line distance, lengthened by 30% to allow for streets that do not run straight,
  at 4.5 kilometres an hour, rounded to the nearest 5 minutes and never under 5. Under an
  hour it SHALL be written in minutes; from an hour, in hours and minutes. The words SHALL
  say it is an estimate, for example *About 25 min walk*. Beyond 50 kilometres, the walking
  time SHALL NOT be shown, and the distance SHALL be shown alone.
- While cycling or driving is chosen, no time SHALL be shown, and the distance SHALL be
  shown alone. Rationale: a cycling or driving time guessed from a straight line is
  wrong in exactly the places that matter — one-way streets, motorways, a river with one
  bridge — and a confident wrong number is worse than none.

Every word SHALL come from the product's named sentences, in English and in Spanish.

Rationale for 30%: real walking routes in Kyoto, measured for #244, were 1.33 to 1.40 times
the straight line. Rationale for 50 kilometres: it is where Nearby already says a place is a
day trip rather than a walk, and a ten-hour walking estimate is true and useless. A street
route's time has no such limit, because a two-hour drive is worth knowing and a router's
long walk is still a real figure.

#### Scenario: A temple across town

- **WHEN** the straight line is shown, walking is chosen, and the place is 1.34 kilometres
  away in a straight line
- **THEN** the details read *About 25 min walk* and *1.3 km in a straight line*

#### Scenario: Close by

- **WHEN** the straight line is shown, walking is chosen, and the place is 120 metres away
- **THEN** the details read *About 5 min walk* and *120 m in a straight line*

#### Scenario: A day trip

- **WHEN** the straight line is shown, walking is chosen, and the place is 35.46 kilometres
  away
- **THEN** the details read *About 10 h 15 min walk* and *35 km in a straight line*

#### Scenario: Further than a day trip

- **WHEN** the straight line is shown, walking is chosen, and the place is 120 kilometres
  away
- **THEN** the details show *120 km in a straight line* and no walking time

#### Scenario: A street route on foot

- **WHEN** the routing service returns a walking route of 4.42 kilometres and 53 minutes
- **THEN** the details read *53 min walk* and *4.4 km along the streets*
- **AND** neither says *About*

#### Scenario: A long drive

- **WHEN** the routing service returns a driving route of 120 kilometres and 95 minutes
- **THEN** the details read *1 h 35 min drive* and *120 km along the streets*

#### Scenario: Cycling with the straight line

- **WHEN** cycling is chosen and the straight line is shown
- **THEN** the details show the straight-line distance and no time

#### Scenario: Spanish

- **WHEN** the application is in Spanish and a route is shown
- **THEN** the time, the way of travelling and the distance are written in Spanish

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
same choice of walking, cycling and driving, the same figures from the same place,
position and way of travelling, and the same words. Both SHALL offer it with no
connection, with walking alone.

#### Scenario: The same place on both

- **WHEN** the same place is routed to from the same position and the same way of
  travelling on the laptop and the phone, both with a connection
- **THEN** both show the same distance and the same time

#### Scenario: The same place on both with no connection

- **WHEN** the same place is routed to from the same position on the laptop and the phone,
  neither with a connection
- **THEN** both show the same straight-line distance and the same walking estimate

### Requirement: The person chooses how they are travelling

Once the line is drawn, the details SHALL offer three choices — walking, cycling and
driving — each with an icon and a word, beneath the distance and time. Exactly one SHALL be
chosen, and the chosen one SHALL be shown by a filled shape, not by colour alone. Each SHALL
carry an accessible name and SHALL say whether it is the one chosen.

Choosing another way of travelling SHALL route again for it from the same position, and
SHALL change the figures, the words and the icon beside them. It SHALL NOT clear the route
and SHALL NOT move the place's details.

Each application SHALL remember on the device the way of travelling the person last chose,
and a new route SHALL start with it. Only a person's own choice SHALL change what is
remembered; a switch the application makes by itself (*With no connection, only walking
is offered*) SHALL NOT. Before anything is remembered, a route SHALL start with walking.

#### Scenario: Choosing to drive

- **WHEN** a person routing on foot chooses driving
- **THEN** the route is found again for driving from the same position
- **AND** the details show the driving figures and the car icon
- **AND** the driving choice is shown filled

#### Scenario: The next route

- **WHEN** a person who chose cycling clears the route and routes to another place
- **THEN** the new route starts with cycling

#### Scenario: The first route on a device

- **WHEN** a person routes for the first time on a device
- **THEN** walking is chosen

#### Scenario: Read aloud

- **WHEN** a screen reader reaches the choices
- **THEN** each is announced by its name, and the chosen one is announced as chosen

### Requirement: A street route replaces the straight line when there is a connection

When a position has been found and the device has a connection, the application SHALL ask
a routing service for the route along the streets from that position to the place, for the
chosen way of travelling.

While it waits, the straight line SHALL be drawn and the figures for the straight line
shown, with a line saying the route along the streets is being found. When the street
route arrives, it SHALL replace the straight line and its figures. The wait SHALL be
bounded.

The application SHALL know more than one routing service and SHALL ask them in a fixed
order. When one gives no usable answer — it does not answer, refuses, or its allowance is
used up — the application SHALL ask the next, within the same bounded wait. When one
answers that there is no way, that answer SHALL stand and no other SHALL be asked.

When no street route comes back — no service answers in time, every one refuses, or one
finds no way — the straight line and its figures SHALL stay, and a line SHALL say that no
route along the streets was found for that way of travelling. Nothing else about the route
SHALL change, and the choice of way of travelling SHALL stay available.

Every routing service SHALL cost nothing, and SHALL NOT be able to bill: a service that
needs an account SHALL be one whose free allowance stops when it is used up, rather than
overflowing into charges. A key that ships inside an application SHALL be one whose
misuse can cost nothing but that allowance. The application SHALL NOT ask the services more
than once a second from one device, and SHALL NOT ask again for a route it was already
given from the same position, to the same place, for the same way of travelling, while the
application is open.

Rationale for allowing an account: the free public servers promise nothing, and the
service that replaces them first runs the same software under a plan that stops instead of
billing (#281). Being free is the rule; needing no account was how being free had been
assured.

Every routing service the application may ask SHALL be credited in the map's credits,
beside the map's other sources, with whatever the service's terms ask for.

#### Scenario: Pressing with a connection

- **WHEN** a person with a connection presses *Calculate route* and their position is found
- **THEN** the dotted straight line and its figures show at once, saying the street route is
  being found
- **AND** the solid street route and its figures replace them when it arrives

#### Scenario: The first service is down

- **WHEN** the first routing service does not answer, and the next one returns a route
- **THEN** the solid street route and its figures are shown, as with the first
- **AND** nothing tells the person a different service answered

#### Scenario: The first service finds no way

- **WHEN** the first routing service answers that there is no way for that way of
  travelling
- **THEN** no other service is asked
- **AND** a line says no route along the streets was found

#### Scenario: The service does not answer

- **WHEN** no routing service answers in time
- **THEN** the straight line and its figures stay
- **AND** a line says no route along the streets was found

#### Scenario: Reopening the same place

- **WHEN** a person clears a route and routes to the same place again without moving, for
  the same way of travelling
- **THEN** the street route is shown without asking the routing service again

#### Scenario: The credits

- **WHEN** a person opens the map's credits
- **THEN** every routing service the application may ask is named there

### Requirement: With no connection, only walking is offered

When the device has no connection, the application SHALL NOT ask for a street route. The
straight line and its walking figures SHALL be shown, exactly as they are with walking
chosen and no street route.

Cycling and driving SHALL stay where they are, SHALL be shown as unavailable by their
outline and lettering rather than by colour alone, SHALL NOT respond to a press, and SHALL
keep their names for a screen reader, which SHALL announce them as unavailable. One line
SHALL say that cycling and driving need a connection.

A street route fetched earlier SHALL NOT make cycling or driving available with no
connection.

When the connection is lost while cycling or driving is chosen, the route SHALL change to
walking with the straight line, and the line saying why SHALL say it is now walking because
there is no connection. When the connection returns, walking SHALL stay chosen, cycling and
driving SHALL become available again, and the street route for walking SHALL be asked for.

When a route is started with no connection and the remembered way of travelling is cycling
or driving, it SHALL start with walking, and what is remembered SHALL NOT change.

#### Scenario: Pressing with no connection

- **WHEN** a person with no connection presses *Calculate route* and their position is found
- **THEN** a dotted straight line is drawn with *About … min walk* and the straight-line
  distance
- **AND** cycling and driving are shown but cannot be pressed
- **AND** a line says cycling and driving need a connection

#### Scenario: Losing the connection while driving

- **WHEN** driving is chosen and the device loses its connection
- **THEN** the route changes to walking with the straight line
- **AND** a line says it is walking because there is no connection

#### Scenario: The connection returns

- **WHEN** the connection returns after the route changed to walking
- **THEN** walking stays chosen
- **AND** cycling and driving can be pressed again
- **AND** the street route on foot replaces the straight line

#### Scenario: A route kept from earlier

- **WHEN** a driving route to this place was shown earlier and the device now has no
  connection
- **THEN** driving cannot be pressed

#### Scenario: The remembered choice, offline

- **WHEN** a person who last chose driving starts a route with no connection
- **THEN** the route starts with walking
- **AND** the next route started with a connection starts with driving

### Requirement: The route can be continued in another maps app

Once a line is drawn, in either form, the route card SHALL offer to open the route in
another maps app. It SHALL be offered with no connection too: the other app deals with
its own connection.

**On the phone** it SHALL read *Open in…*, and SHALL stand beside *Start* where *Start* is
offered (`route-following`), and alone where it is not. Pressing it SHALL open a choice,
drawn by the application in the product's tokens and words, of:

- on an iPhone: *Google Maps* and *Apple Maps*;
- on Android: *Google Maps* and *Another maps app*, which hands the place to the device and
  lets the device choose or use its default;

and a way to close the choice without opening anything.

**On the laptop** it SHALL read *Open in Google Maps*, and SHALL open Google Maps in a new
tab, leaving Pinpoint open where it was.

Whichever app opens SHALL receive the place's position as the destination, and the
chosen way of travelling wherever that app accepts it; where it accepts none for that way
of travelling, it SHALL receive the destination alone. It SHALL NOT receive the person's
position: the other app finds it, and works out its own route.

Choosing Google Maps SHALL open the Google Maps app when it is installed and the Google
Maps website when it is not, so that the choice always opens something.

Each control SHALL carry an accessible name from the product's named sentences that names
the place.

Rationale: Pinpoint's own route cannot be carried across, and an app given the destination
plans its own way there just as well. Opening another app costs Pinpoint nothing and uses
no service of Google's on Pinpoint's behalf.

#### Scenario: The phone's choice, on an iPhone

- **WHEN** a person on an iPhone presses *Open in…*
- **THEN** a choice of *Google Maps* and *Apple Maps* opens, with a way to close it

#### Scenario: The phone's choice, on Android

- **WHEN** a person on Android presses *Open in…*
- **THEN** a choice of *Google Maps* and *Another maps app* opens, with a way to close it

#### Scenario: Google Maps is installed

- **WHEN** a person walking to a place chooses *Google Maps* and it is installed
- **THEN** the Google Maps app opens with directions to the place on foot

#### Scenario: Google Maps is not installed

- **WHEN** a person chooses *Google Maps* and it is not installed
- **THEN** the Google Maps website opens with directions to the place

#### Scenario: Apple Maps by bike

- **WHEN** a person cycling to a place chooses *Apple Maps*
- **THEN** Apple Maps opens with the place as its destination

#### Scenario: Another maps app

- **WHEN** a person on Android chooses *Another maps app*
- **THEN** the device opens its maps app, or asks which one, with the place

#### Scenario: Closing the choice

- **WHEN** a person closes the choice without picking an app
- **THEN** nothing opens and the route card is as it was

#### Scenario: The laptop

- **WHEN** a person driving to a place presses *Open in Google Maps* on the laptop
- **THEN** a new tab opens Google Maps with driving directions to the place
- **AND** Pinpoint stays open with the route drawn

#### Scenario: No connection

- **WHEN** only the straight line is drawn because the phone has no connection
- **THEN** *Open in…* is offered and opens the choice
