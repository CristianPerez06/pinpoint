# data-freshness Specification

## Purpose

Define how a screen learns that stored data has changed somewhere else, and what a
re-read may and may not replace. A trip is a shared map — two or more people planning
together is the whole product — so "somebody else changed it" is the ordinary case, and
a list read once when a screen opened has no way of hearing about any of it.

Covers both applications and every list a trip is made of. It is one answer rather than
five, because the same question was going to be asked of the trips, the markers, the
cities, the members and the recorded interest, and answering it separately at each call
site is how two applications drift.

It states where a list is held and who may change it, when it is read again, how recently
is recent enough not to bother, and that a re-read never takes away what is already on
screen. What it deliberately does not promise is anything appearing while somebody is
looking: the trigger is coming back, and nothing here holds a connection open waiting to
be told.

## Requirements

### Requirement: One place holds each list, and everything on screen reads it

For each list a screen shows, the application SHALL hold it in exactly one place. Every
control that displays any part of that list SHALL read it from there.

A write SHALL put the row the database returned into that one place. A re-read SHALL
replace what is there. An application SHALL NOT keep a second copy of a list, nor a
separate record of local changes to be combined with it at render time.

Where the database carries a write on to rows the write did not return — removing a city
unassigns every marker filed under it — the application SHALL read those rows again
afterwards, on every such write, whatever else they hold. It MAY show the expected
result straight away, and the re-read SHALL then replace it. The re-read SHALL go ahead
however recently the list was last read, because the write did not count as a read.

Rationale: two copies of one list is how a rename ends up correct in the header and stale
in the picker — which is the defect that started this — and combining them at render time
is a merge somebody has to get right in every place it is written. One place cannot
disagree with itself.

Rationale for rows carried on: a row the database changed is changed in full, including
the moment it was last changed, which is what a later save of that row is checked
against. A screen that only writes in the part it expected to change still holds the old
moment. The next save of that marker was then refused as changed by somebody else, when
nobody had touched it (#188).

#### Scenario: Something is changed on this device

- **WHEN** a person changes a trip, a marker, a city, a member, or their interest
- **THEN** every place on screen showing that thing shows the change
- **AND** no part of the screen goes on showing the previous value

#### Scenario: A re-read arrives

- **WHEN** a list is read again
- **THEN** what is held is replaced by what was read

#### Scenario: A place is edited straight after its city is removed

- **WHEN** a person removes a city holding a marker, then without reloading opens that
  marker, changes its name and saves
- **THEN** the save goes through
- **AND** it is not refused as changed by somebody else

#### Scenario: A city with no places is removed

- **WHEN** a person removes a city that holds no markers
- **THEN** the markers are not read again on its account

### Requirement: A screen re-reads what it is showing when it becomes current again

Each application SHALL re-read the lists on screen when that screen becomes current again
after having been left, and SHALL state which event it treats as "current again" on that
platform.

- Web: the document becoming visible; and a screen being shown again from the browser's
  history — by going back or forward to it, whether through a control in the page or
  through the browser's own arrows.
- Native: the application returning to the foreground from having been in the background.
  Returning from a merely interrupted state — a notification pull, a control pull, a
  system dialog — SHALL NOT count, because none of them is somebody coming back.

A screen shown again from the browser's history SHALL NOT count the lists it is shown
with as a read. They are the answer from when that screen was first shown, however long
ago that was, and the interval floor in *A list is not read again while what it holds is
still fresh* SHALL NOT decline this re-read on their account. The re-read is automatic in
every other respect: it SHALL keep what is on screen until the new answer arrives, and
SHALL NOT report a failure.

Coming back SHALL be the only trigger. There SHALL be no polling, no interval, and no
re-read on a timer, and nothing SHALL hold a persistent connection in order to be told
about changes as they happen.

A change that would add a live subscription SHALL be rejected by default under this
requirement, and SHALL be accepted only if the proposal states that the revisit condition
recorded in `openspec/changes/archive/2026-09-13-retire-roadmap/design.md` has been met.

Rationale: the way a person learns that somebody else changed something is that they come
back to the application. That is one round of reads, at a moment when they are already
waiting to look at the screen, and it covers every case this product has — a rename, an
archive, an invitation — without a second mechanism that has to keep working.

Rationale for history: a web screen left for another screen and returned to through the
browser's history is not read again by the browser. It is rebuilt from the copy saved when
it was first shown, which predates everything done since — on this device as well as
elsewhere. Edit a place, open Settings, go back, and the place's card showed its old hours
with nothing to say so (#193). Returning through history is somebody coming back to the
screen as much as returning to the tab is, and the copy it arrives with is exactly as old
as that copy is.

What this costs is accepted rather than overlooked: nothing appears while a person is
looking at the screen. Somebody else's change lands the next time they come back, and not
before.

The mechanism that would close that gap was declined deliberately, and it is not a cost
decision — a live subscription is available to this product at no charge. It is a second
mechanism with failure modes this product has never had: reconnecting after a dropped
connection, messages missed while the application was in the background, and a channel
that has to respect the same row-level security the reads do. Shipping it alongside the
first invalidation the product ever had would have meant two new things to debug with no
way to tell which one was wrong.

#### Scenario: The application comes back

- **WHEN** a person returns to the application after leaving it
- **THEN** the lists on screen are read again
- **AND** what somebody else changed while they were away is shown

#### Scenario: A web screen is returned to through the browser's history

- **WHEN** a person edits a place on the map, opens another screen, and returns to the map
  by going back — through `Back to the map` or the browser's back arrow
- **THEN** the lists on the map are read again
- **AND** the place's card shows the edit without a reload
- **AND** what was shown before the new answer arrived stays on screen until it does

#### Scenario: A web screen is returned to through history within the interval

- **WHEN** a person returns to a screen through the browser's history within the
  freshness interval of the moment it was first shown
- **THEN** its lists are read again regardless

#### Scenario: A re-read on returning through history fails

- **WHEN** the re-read made on returning to a screen through the browser's history fails
- **THEN** the screen goes on showing what it was showing
- **AND** the failure is not reported to the person

#### Scenario: An interruption is not a return

- **WHEN** the native application is interrupted by a system surface and resumes without
  having been in the background
- **THEN** nothing is re-read

#### Scenario: Somebody else's change arrives while the screen is being watched

- **WHEN** another person changes a trip while somebody is looking at a screen showing it
- **THEN** nothing on that screen changes until they leave and come back
- **AND** this is the accepted behaviour rather than a defect

#### Scenario: A change proposes being told about changes as they happen

- **WHEN** a change would add a live subscription, a channel, or any persistent connection
  that reports changes without somebody coming back
- **THEN** the change is rejected by default under this requirement
- **AND** it is accepted only if the proposal states that the revisit condition recorded in
  `openspec/changes/archive/2026-09-13-retire-roadmap/design.md` has been met

### Requirement: A list is not read again while what it holds is still fresh

Each list SHALL carry the moment it was last read, and SHALL ignore a request to read it
again within a stated interval of that moment — whichever trigger asked. The interval SHALL
be the same on both platforms and SHALL be stated once rather than per trigger.

A re-read a person asked for by hand SHALL ignore this and read regardless.

There SHALL be no cache. Nothing SHALL serve a stored answer in place of a read; the
interval declines to read at all, and what stays on screen is the answer already there.

Rationale: focus and visibility flap, and there is more than one trigger. A floor held by
each trigger separately lets returning to the application read a list and opening the sheet
that shows it read the same list again a second later, because neither knows the other ran.
Held by the list, one rule covers every trigger there will ever be.

A caching layer would be the opposite of this change: its purpose is to answer with
something older than the truth, and the defect being fixed is that answers are too old. The
useful half — do not ask again yet — is this requirement. The harmful half is not wanted.

Held by hand is the exception because somebody pressed something. A control that quietly
declines because a read happened eight seconds ago is a control that appears broken.

#### Scenario: Two triggers ask for the same list

- **WHEN** a person returns to the application and immediately opens the surface showing one
  of the lists that were just read
- **THEN** that list is not read a second time

#### Scenario: Returning twice in quick succession

- **WHEN** a person leaves and returns twice within the interval
- **THEN** one round of reads is sent, not one per return

#### Scenario: A person asks by hand

- **WHEN** a person uses the control that asks for a re-read
- **THEN** every list is read, however recently it was last read

### Requirement: A re-read never takes away what is already on screen

A re-read of a list that is already displayed SHALL NOT return the screen to a loading
state. What is displayed SHALL remain displayed until the new answer arrives.

A re-read that fails SHALL leave the screen showing what it was showing, and SHALL NOT
report the failure. A read the person did not ask for has no press to answer, and
replacing a working screen with an error because a background read failed is worse than
the staleness it was trying to fix.

This SHALL NOT apply to a read a person asked for and is waiting on: that is governed by
`write-feedback`, and is answered.

Rationale: the trigger fires exactly when somebody is looking. A map that blanks to a
spinner every time the application is opened would do so on every return, rather than only
when something had actually changed.

#### Scenario: A re-read is in flight

- **WHEN** a re-read of a displayed list has been sent and has not returned
- **THEN** the list is still displayed
- **AND** no loading state is shown in its place

#### Scenario: A re-read fails

- **WHEN** a re-read fails
- **THEN** the screen goes on showing what it was showing
- **AND** the failure is not reported to the person

### Requirement: A surface that opens to show a list re-reads that list

Where a platform gives a moment at which a surface showing a list is opened, the
application SHALL re-read that list then, under the same interval floor and the same rule
about not taking away what is on screen.

Where a platform gives no such moment — a native select on web, which reports no open —
the requirement SHALL be considered met by the return trigger above rather than worked
around.

Rationale: opening the trips sheet is a person saying "show me the trips". It is the same
signal as coming back to the application, at a smaller scale, and it lands on exactly the
surfaces where a stale list is visible. It needs no gesture and nothing to discover, which
is why it is preferred to a control that has to be found.

#### Scenario: A list is opened

- **WHEN** a person opens a surface whose purpose is to show a list
- **THEN** that list is read again
- **AND** what is already there stays on screen until the new answer arrives

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

### Requirement: Every list a trip is made of is covered, on both platforms

This SHALL cover the trips a person belongs to, and a trip's markers, cities, members and
recorded interest, on both applications, by the same rules.

No list a person can see SHALL be left out, and a list added later SHALL be covered by the
same mechanism rather than by a decision made again at its call site.

Rationale: the trips list is where staleness shows first, because a trip's name sits in
the chrome of both applications and the list is also the switcher. It is not where it
stops: markers, cities, members and interest are read the same way and go stale for the
same reason.

#### Scenario: A trip's contents change elsewhere

- **WHEN** somebody else adds or edits a marker, a city, a member, or their interest on a
  trip open on this device
- **THEN** the change is shown after this device's stated trigger

#### Scenario: The other platform

- **WHEN** the same list is looked at on the other application
- **THEN** it goes stale and refreshes by the same rules
