## MODIFIED Requirements

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
