# route-following Specification

## Purpose
Lets a person on the phone follow a street route to a saved place inside Pinpoint, the way
a GPS app does: the map keeps them in view, the next turn is shown, a new route is found
when they leave it, and following ends when they arrive.

## Requirements

### Requirement: A street route can be started on the phone

Once a street route is drawn (`place-route`), the phone's route card SHALL offer a *Start*
button, beside *Open in…*, beneath the choice of how the person is travelling. It SHALL
be the most prominent control in the card, and SHALL carry an accessible name from the
product's named sentences that names the place.

*Start* SHALL NOT be offered while only the straight line is drawn: while the street
route is being found, when none was found, or with no connection. Rationale: a straight
line has no turns, so there is nothing to follow.

The laptop SHALL NOT offer *Start*. Following is a phone feature.

Pressing *Start* SHALL ask the routing service for the route with its turns, from where
the person is at that moment, to the place, for the chosen way of travelling. While it
waits, *Start* SHALL say that following is starting, SHALL be inert, and SHALL be announced
as busy; a second press SHALL NOT start a second request. The wait SHALL be bounded.

When a route comes back, following SHALL begin (*Following shows the map around the
person*). When none comes back, the card SHALL stay as it was, a line SHALL say following
could not start, and pressing *Start* again SHALL try again.

#### Scenario: A street route is drawn

- **WHEN** a street route to a place is drawn on the phone
- **THEN** *Start* and *Open in…* stand beneath the choice of way of travelling

#### Scenario: Only the straight line

- **WHEN** the straight line is drawn because the device has no connection
- **THEN** *Start* is not offered
- **AND** *Open in…* is offered

#### Scenario: Waiting for the street route

- **WHEN** the straight line is drawn while the street route is still being found
- **THEN** *Start* is not offered

#### Scenario: Starting

- **WHEN** a person presses *Start*
- **THEN** *Start* says following is starting and cannot be pressed again
- **AND** following begins once the route arrives

#### Scenario: It cannot start

- **WHEN** a person presses *Start* and no route comes back in time
- **THEN** the route card stays as it was
- **AND** a line says following could not start
- **AND** *Start* can be pressed again

#### Scenario: The laptop

- **WHEN** a street route is drawn on the laptop
- **THEN** no *Start* is offered

### Requirement: Following shows the map around the person

While following, the place's details SHALL be closed and the map SHALL fill the screen,
with the route line (in its street form), the person's position and the place's pin drawn
as `place-route` draws them. The line SHALL be the route being followed, and SHALL be
replaced whenever a new route replaces it.

The camera SHALL keep the person's position in view as they move, close enough to read the
streets around them, and clear of the card at the top and the bar at the bottom.

Unless the person has chosen the flat view, the map SHALL be tilted while following, leaning
back about 60 degrees so the streets ahead run towards the top of the screen, as a car's
sat-nav shows them. Tilted, the person's position SHALL still sit in the middle of what the
card and the bar leave uncovered, as it does on the flat map, at the start of a route and
after every turn of the map. Pins and the route line SHALL stay readable.

A control beside the compass SHALL switch between the tilted view and the flat one, for as
long as following lasts. It SHALL say which view pressing it gives — *3D* while the map is
flat, *2D* while it is tilted — and SHALL carry an accessible name from the product's named
sentences saying what pressing it does. The choice SHALL be remembered on the device, SHALL
still hold after the application is closed and opened again, and SHALL be the view the next
following starts in. A device that has never chosen SHALL start tilted.

The map SHALL be turned so that the way ahead points up the screen. The way ahead SHALL be
the direction of the route about 40 metres beyond the person, measured along the route, and
SHALL NOT come from the phone's compass or from the person's own movement. The map SHALL
NOT turn for a change of direction smaller than 15 degrees, so that it turns at corners
and holds still between them.

While following, a compass control SHALL show which way north is, and SHALL carry an
accessible name from the product's named sentences that says what pressing it does. It
SHALL stay offered for the whole trip, so it can be pressed more than once. With the map
turned to the way ahead, pressing it SHALL put north at the top; with north at the top,
pressing it SHALL turn the map to the way ahead again. Either press SHALL bring the camera
back to the person and resume following, and SHALL leave the map tilted or flat as it was.
While north is held at the top the control SHALL say so by more than its arrow.

When the person moves the map by hand, the camera SHALL stop following them, and a control
SHALL be offered that brings the camera back to them and resumes following, turning the map
to the way ahead again unless north was put at the top, and tilting it again unless the
flat view was chosen. It SHALL carry an accessible name from the product's named sentences.

When following ends, north SHALL be put back at the top and the map SHALL be flat again.

While following, the map's toolbar and its other controls SHALL NOT be offered, and
pressing a pin SHALL NOT open its details. The map's credits SHALL stay visible.

Rationale for the route rather than the compass: at walking speed a phone's compass and its
sense of direction are noisy, and a map that turns with every wobble is harder to read
than one that does not turn at all. The route only changes direction where the streets do.

Rationale for the tilt being a choice: a tilted map shows more of the way ahead and less of
what is beside and behind, and some people read a flat map more easily. Following with no
route (#296) is to share the same remembered choice.

#### Scenario: Following begins

- **WHEN** following begins on a route that leaves the person heading south
- **THEN** the place's details close
- **AND** the map shows the person, the route and the place, with the route ahead pointing
  up the screen
- **AND** the map is tilted, unless the flat view was chosen

#### Scenario: The person walks

- **WHEN** the person's position changes while following
- **THEN** the camera moves to keep them in view
- **AND** they are not hidden behind the card or the bar

#### Scenario: Tilted, and clear of the card and the bar

- **WHEN** following begins tilted, and later the map turns at a corner
- **THEN** both times the person's position sits in the middle of what the card and the bar
  leave uncovered

#### Scenario: Turning a corner

- **WHEN** the person passes a corner where the route turns left
- **THEN** the map turns so the new way ahead points up

#### Scenario: A gentle bend

- **WHEN** the route ahead bends by less than 15 degrees
- **THEN** the map does not turn

#### Scenario: North at the top

- **WHEN** the person presses the compass while following
- **THEN** north is at the top
- **AND** the map does not turn again until the compass is pressed again
- **AND** the map stays tilted if it was tilted
- **AND** the compass is still offered, and pressing it again turns the map to the way
  ahead

#### Scenario: Choosing the flat view

- **WHEN** the person presses *2D* while following
- **THEN** the map lies flat, still turned to the way ahead, with the person clear of the
  card and the bar
- **AND** the control now shows *3D*

#### Scenario: The choice is remembered

- **WHEN** the person chose the flat view, closed the application, opened it again and
  started following another route
- **THEN** following starts with the map flat

#### Scenario: Looking around

- **WHEN** the person drags the map while following
- **THEN** the camera stops following them
- **AND** a control to return to their position is shown
- **AND** pressing it brings the camera back, turned to the way ahead and tilted as chosen,
  and following the person resumes

#### Scenario: Following ends

- **WHEN** following ends, by arriving or by *Stop*
- **THEN** north is at the top
- **AND** the map is flat

#### Scenario: Pressing a pin

- **WHEN** a person presses another pin while following
- **THEN** no place's details open

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the control beside the compass is named in Spanish

### Requirement: The next turn is shown

While following, a card at the top of the screen SHALL show the next turn: a glyph for
the kind of turn, the distance to it, and the instruction the routing service wrote for
it, in the application's language. The distance SHALL be written as Nearby writes a
distance (`nearby-places`). The instruction SHALL be shown whole, however long it is; the
card SHALL grow to hold it and SHALL NOT cut it short.

When the turn is passed, the card SHALL show the next one. A screen reader SHALL be told
each new instruction as it replaces the previous one.

The instruction SHALL be the sentence the routing service wrote for the turn, and SHALL
NOT be the shorter text it gives for a road sign, which for a named road is the road's name
alone. The instruction's text SHALL NOT be reworded by the product (`product-wording`).

#### Scenario: The next turn

- **WHEN** the next turn is 340 metres ahead and the routing service calls it *Turn right
  onto the walkway.*
- **THEN** the card shows a right-turn glyph, *340 m* and *Turn right onto the walkway.*

#### Scenario: A turn onto a named road

- **WHEN** the next turn is a left onto a road with a name
- **THEN** the card shows the routing service's sentence for it, such as *Turn left onto
  Donguri Street.*
- **AND** not the road's name on its own

#### Scenario: Passing a turn

- **WHEN** the person passes the turn shown
- **THEN** the card shows the turn after it, and its distance

#### Scenario: A long instruction

- **WHEN** the routing service's instruction names a road and its route number and runs
  to three lines
- **THEN** the whole instruction is shown

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the instruction is the routing service's Spanish, as it wrote it

### Requirement: What is left of the route is shown

While following, a bar at the bottom of the screen SHALL show the time and the distance
left to the place, the place's name, the time the person is expected to arrive, and a
*Stop* button.

The time left SHALL be rounded to the nearest minute and never said as less than 1; under
an hour it SHALL be written in minutes and from an hour in hours and minutes, without
naming the way of travelling, for example *14 min · 1.1 km left*. The distance SHALL be
written as Nearby writes a distance. The arrival time SHALL be on the 24-hour clock the
product writes every time of day in, for example *Arrive 10:42*. All of them SHALL change
as the person moves.

Every word SHALL come from the product's named sentences, in English and in Spanish.

#### Scenario: Under way

- **WHEN** the routing service says 14 minutes and 1.1 kilometres are left at 10:28
- **THEN** the bar reads *14 min · 1.1 km left*, the place's name and *Arrive 10:42*

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the bar reads *14 min · quedan 1,1 km* and *Llegada 10:42*

### Requirement: Leaving the route finds a new one

When the person is far enough from the line that they have left it, the application SHALL
ask for a new route from where they are, without being asked to. While it waits, the card
SHALL say the person is off the route and a new one is being found, and the line already
drawn SHALL stay. When the new route arrives it SHALL replace the line, and the card and
the bar SHALL follow it.

While the person stays off the route, the application SHALL ask again at most once every
five seconds. When no new route comes back — no connection, or no service answers — the
card SHALL say the person is off the route and no new route was found, and the application
SHALL keep trying while they stay off it. When the connection returns while they are still
off the route, a new route SHALL be asked for at once, without waiting for them to move.

Losing the connection while on the route SHALL NOT interrupt following. Only finding a new
route needs one.

#### Scenario: Taking a wrong turn

- **WHEN** a person following a route walks away from it
- **THEN** the card says they are off the route and a new one is being found
- **AND** a new route from where they are replaces the line

#### Scenario: Off the route with no connection

- **WHEN** a person leaves the route while the device has no connection
- **THEN** the card says no new route was found
- **AND** the old line stays drawn
- **AND** a new route is asked for once the connection returns, if they are still off it

#### Scenario: The connection returns while standing still

- **WHEN** a person stands still off the route with no connection, and the connection returns
- **THEN** a new route from where they are replaces the line, without them moving

#### Scenario: No connection on the route

- **WHEN** the connection is lost while the person is on the route
- **THEN** the next turn and what is left keep updating

### Requirement: Arriving ends following

When the person reaches the place, following SHALL end by itself. A note SHALL say they have
arrived, naming the place, for a few seconds, and SHALL be announced to a screen reader. The
route SHALL be cleared, and the place's details SHALL open again with *Calculate route*
offered.

#### Scenario: Arriving

- **WHEN** a person following a route to Kinkaku-ji reaches it
- **THEN** a note says *You've arrived at Kinkaku-ji*
- **AND** following ends and the line is removed
- **AND** Kinkaku-ji's details are open with *Calculate route* offered

### Requirement: Following can be stopped at any time

Pressing *Stop* SHALL end following at once. The route SHALL be cleared, and the place's
details SHALL open again with *Calculate route* offered. Nothing SHALL ask the person to
confirm.

#### Scenario: Stopping

- **WHEN** a person presses *Stop* while following
- **THEN** following ends and the line is removed
- **AND** the place's details are open with *Calculate route* offered, standing on the
  bottom edge as they do when the place is opened from the map, and can be closed

### Requirement: The screen stays on, and following lasts only while the app is open

While following, the phone's screen SHALL NOT turn itself off. Once following ends, the
screen SHALL turn off as it normally does.

Following SHALL NOT read the device's location while the application is in the background
or the phone is locked (`device-location`), and SHALL NOT ask for permission to. When the
application returns to the foreground, following SHALL carry on from where the person is
then, finding a new route if they are off it.

Following SHALL NOT speak.

#### Scenario: Holding the phone

- **WHEN** a person follows a route for longer than the phone's screen timeout
- **THEN** the screen stays on

#### Scenario: Stopping lets the screen sleep

- **WHEN** following ends
- **THEN** the screen turns off after the phone's usual timeout

#### Scenario: Locking the phone

- **WHEN** a person locks the phone while following, walks on, and unlocks it
- **THEN** no position was read while it was locked
- **AND** following carries on from where they are, with a new route if they left the old
  one

#### Scenario: No new permission

- **WHEN** a person who allowed location while using the app starts following
- **THEN** they are not asked for any further location permission

### Requirement: Following asks the same routing services, under the same limits

Following SHALL ask the routing services `place-route` names, in the same order, skipping
any that cannot return the turns of a route. When one gives no usable answer, the next
SHALL be asked, within the same bounded wait. The same rules SHALL hold as for
*Calculate route*: no service that can bill, no more than one request a second from the
device.

#### Scenario: The first service is down while following

- **WHEN** the first routing service does not answer a request for a new route while
  following, and the next one returns a route
- **THEN** the new route replaces the line as it would have from the first
- **AND** nothing tells the person a different service answered

### Requirement: Calculating a route never restarts the application

Nothing that following needs SHALL run until *Start* is pressed. Opening the application,
opening a place and calculating a route SHALL NOT restart the application, whether or not
following is ever started.

Rationale: in #282, loading what following needs as the application opened made it
restart itself when *Calculate route* was pressed.

#### Scenario: Calculating without starting

- **WHEN** a person opens the application and calculates a route, without starting it
- **THEN** the application does not restart

#### Scenario: Starting after calculating

- **WHEN** a person calculates a route and then starts following it
- **THEN** the application does not restart

### Requirement: Following reads on both grounds and in both languages

The card, the bar, the note on arrival and the control returning the camera to the person
SHALL be drawn from the product's tokens and SHALL be legible on the light ground and on the
dark one. Every word the product writes in them SHALL come from the product's named
sentences, in English and in Spanish.

#### Scenario: Dark ground

- **WHEN** a route is followed on the dark ground
- **THEN** the card, the bar and their text are legible against the map and each other

#### Scenario: Changing language

- **WHEN** a route is followed in Spanish
- **THEN** every word the product wrote is Spanish
