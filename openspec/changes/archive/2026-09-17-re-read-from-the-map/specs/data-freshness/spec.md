## REMOVED Requirements

### Requirement: The native application offers a way to ask for a re-read

**Reason**: The requirement bound the control to a *platform*, and the property that
actually decides it is the *shape of the screen*. Its own rationale says so — the control
exists because "on web a failed refresh is recovered by reloading" — and that premise
holds at a laptop width and fails at a phone's, where reload sits behind a collapsed
toolbar or a pull gesture the page can swallow. It fails completely for a copy installed
to a home screen, which this product declares itself eligible for and which runs with no
browser furniture at all: there is no reload to be recovered by. Written about a platform,
the rule left the web at a phone width with no way back from a read that failed while
offline, and no wording anybody could have followed to notice.

Its second sentence — that the control sits among the rare controls rather than the
frequent ones — put it in the account menu, where it read as something done to the
account rather than to the screen. That sentence is not carried forward here: **where a
control stands is `workspace-chrome`'s subject**, and it is restated there, as placement
on the screen rather than as membership of a group.

**Migration**: Replaced by *A map shown on a phone-shaped screen offers a way to ask for
a re-read*, below, which keeps both of this requirement's scenarios unchanged and widens
who must satisfy them. The phone application already satisfied the old requirement
through a row in its account menu; that row is removed and the control it held moves onto
the map. No behaviour that existed is withdrawn — a person who could ask for a re-read
before can still ask for one, in a more visible place.

## ADDED Requirements

### Requirement: A map shown on a phone-shaped screen offers a way to ask for a re-read

Where an application shows the map and the chrome takes its phone shape, it SHALL offer a
control that reads every list on screen again. The control SHALL be visible without
opening anything.

Where the chrome takes its laptop shape, an application SHALL NOT offer one. Reloading
the page is a control the browser already provides at that size, and a second one inside
the page duplicates it.

A screen that is not the map SHALL NOT offer one. Where such a screen provides a visible
way to the map, that way plus the map's own control SHALL be considered to satisfy this
requirement for it.

The control SHALL read every list, however recently any of them was last read — the
interval floor stated in *A list is not read again while what it holds is still fresh*
does not apply to it. It SHALL report that it is working and SHALL report a failure, as
`write-feedback` requires of any act a person asked for and is waiting on.

Rationale: a failed re-read is recovered by reloading, and whether reload is at hand is a
statement about the shape of the screen rather than about which application is running.
At a laptop width it is one pixel above where a second button would go. At a phone width
it is behind a collapsed toolbar or a pull gesture the page can swallow, and in an
installed copy — which this product's manifest asks for — there is no browser furniture
and so no reload at all. A person whose re-read failed while they were offline then has
no way back except force-quitting.

Rationale for the map and not every screen: this is an escape hatch, and one is enough
per product as long as reaching it is visible and short. Every screen re-reads itself on
becoming current again, so the only case this serves is a read that failed while the
device was offline — and the lists are the trip's, not the screen's, so a re-read asked
for from the map answers for whatever screen the person came from.

#### Scenario: A re-read is asked for by hand

- **WHEN** a person asks for a re-read from the control
- **THEN** every list on screen is read again

#### Scenario: Recovering from a failed re-read

- **WHEN** a re-read failed because the device was offline, and the device is online again
- **THEN** the person can ask for another without leaving or restarting the application

#### Scenario: The chrome takes its phone shape

- **WHEN** the map is shown and the chrome takes its phone shape, on either application
- **THEN** the control is visible without opening a menu or any other surface

#### Scenario: The chrome takes its laptop shape

- **WHEN** the map is shown and the chrome takes its laptop shape
- **THEN** no control asking for a re-read is offered anywhere on the screen, including
  behind a menu

#### Scenario: A screen that is not the map

- **WHEN** a screen other than the map is shown at any width
- **THEN** it offers no control asking for a re-read
- **AND** where it offers a visible way to the map, that is the route to one

#### Scenario: A re-read is asked for moments after an automatic one

- **WHEN** a person uses the control within the freshness interval of the last read
- **THEN** every list is read again regardless

#### Scenario: A re-read asked for by hand fails

- **WHEN** a re-read the person asked for by hand fails
- **THEN** the failure is reported to them
- **AND** the screen goes on showing what it was showing
