## MODIFIED Requirements

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

A change that would add a live subscription SHALL be rejected by default under this
requirement, and SHALL be accepted only if the proposal states that the revisit condition
in this change's design document has been met.

Rationale: the way a person learns that somebody else changed something is that they come
back to the application. That is one round of reads, at a moment when they are already
waiting to look at the screen, and it covers every case this product has — a rename, an
archive, an invitation — without a second mechanism that has to keep working.

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
- **AND** it is accepted only if the proposal states that the revisit condition in this
  change's design document has been met
