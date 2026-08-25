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

Rationale: two copies of one list is how a rename ends up correct in the header and stale
in the picker — which is the defect that started this — and combining them at render time
is a merge somebody has to get right in every place it is written. One place cannot
disagree with itself.

#### Scenario: Something is changed on this device

- **WHEN** a person changes a trip, a marker, a city, a member, or their interest
- **THEN** every place on screen showing that thing shows the change
- **AND** no part of the screen goes on showing the previous value

#### Scenario: A re-read arrives

- **WHEN** a list is read again
- **THEN** what is held is replaced by what was read

### Requirement: A screen re-reads what it is showing when it becomes current again

Each application SHALL re-read the lists on screen when that screen becomes current again
after having been left, and SHALL state which event it treats as "current again" on that
platform.

- Web: the document becoming visible.
- Native: the application returning to the foreground from having been in the background.
  Returning from a merely interrupted state — a notification pull, a control pull, a
  system dialog — SHALL NOT count, because none of them is somebody coming back.

Coming back SHALL be the only trigger. There SHALL be no polling, no interval, and no
re-read on a timer, and nothing SHALL hold a persistent connection in order to be told
about changes as they happen.

Rationale: the way a person learns that somebody else changed something is that they come
back to the application. That is one round of reads, at a moment when they are already
waiting to look at the screen, and it covers every case this product has — a rename, an
archive, an invitation — without a second mechanism that has to keep working.

#### Scenario: The application comes back

- **WHEN** a person returns to the application after leaving it
- **THEN** the lists on screen are read again
- **AND** what somebody else changed while they were away is shown

#### Scenario: An interruption is not a return

- **WHEN** the native application is interrupted by a system surface and resumes without
  having been in the background
- **THEN** nothing is re-read

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

### Requirement: The native application offers a way to ask for a re-read

The native application SHALL offer somewhere to ask for every list to be read again. It
SHALL sit among the rare controls rather than the frequent ones.

The web application SHALL NOT add one. Reloading the page is a control the browser already
provides, and a second one inside the page duplicates it.

Rationale: on web a failed refresh is recovered by reloading. On native there is no
equivalent, so a person whose re-read failed while they were offline has no way back
except force-quitting the application. This is the escape hatch for that, not a control
anybody should need in ordinary use — which is why it belongs where Sign out is and not
under a thumb.

#### Scenario: A re-read is asked for by hand

- **WHEN** a person asks for a re-read from the native application
- **THEN** every list on screen is read again

#### Scenario: Recovering from a failed re-read

- **WHEN** a re-read failed because the device was offline, and the device is online again
- **THEN** the person can ask for another without leaving or restarting the application

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
