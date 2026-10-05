## MODIFIED Requirements

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
