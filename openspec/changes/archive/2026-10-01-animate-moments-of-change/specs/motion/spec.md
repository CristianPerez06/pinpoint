## ADDED Requirements

### Requirement: A surface opening over a screen arrives and leaves with the shared timing

Every sheet, panel and menu that opens over a screen SHALL arrive and leave with motion
rather than appearing or vanishing in a single frame. Opening SHALL take the shared
duration for something arriving with weight and the curve that settles; closing SHALL take
the standard duration and the standard curve, so that closing is always quicker than
opening. Both applications SHALL use the same two pairings.

On the laptop, a surface that floats in a corner or hangs from the bar SHALL move a short
distance into its place while it fades in — up into a corner, down from the bar — and SHALL
leave the same way in reverse. Where the laptop's window is narrow enough that a surface
becomes a sheet on the bottom edge, it SHALL slide in from that edge, as the phone's do. On the
phone, a sheet attached to the bottom edge SHALL slide in from that edge and leave by it.
The distance travelled MAY differ between the two applications, because the surfaces sit
differently; the duration and the curve SHALL NOT.

A surface that is closing SHALL NOT respond to presses, and SHALL NOT be reachable by
keyboard or assistive technology, from the moment it is dismissed.

Rationale: a surface that pops in says nothing about where it came from, and one that
vanishes leaves a person checking whether they really closed it. Closing quicker than
opening keeps dismissing from feeling like waiting.

#### Scenario: A place's details open on both applications

- **WHEN** a person selects a place on the laptop and on the phone
- **THEN** on the laptop its details rise into the corner while fading in
- **AND** on the phone its details slide up from the bottom edge
- **AND** both take the same duration and curve

#### Scenario: A surface is dismissed

- **WHEN** a person dismisses an open sheet, panel or menu
- **THEN** it leaves by the way it came, in less time than it took to open
- **AND** pressing where it was while it leaves does nothing to it

#### Scenario: A surface is dismissed while still opening

- **WHEN** a person dismisses a surface before its opening has finished
- **THEN** it leaves from where it is, without first completing its opening

#### Scenario: A surface opens with reduce motion on

- **WHEN** reduce motion is on and a sheet, panel or menu opens or closes
- **THEN** it does not move
- **AND** it appears or disappears at once, or by a fade no longer than the shortest shared
  duration

### Requirement: A pin being put down drops onto the map

When a person puts down the pin for a place being added, on either application, the pin
SHALL drop onto its point: it falls a short distance from above, lands slightly past its
point and settles back, over the shared duration for something arriving with weight and the
curve that overshoots.

The drop SHALL play once, when the pin is put down. Moving the pin afterwards, and saving
the place, SHALL NOT play it again.

#### Scenario: A pin is put down on the phone

- **WHEN** a person puts down a pin on the phone
- **THEN** it drops onto its point exactly as it does on the laptop

#### Scenario: The place is saved

- **WHEN** the place whose pin was put down is saved
- **THEN** its pin stays where it is
- **AND** does not drop again

#### Scenario: A pin is put down with reduce motion on

- **WHEN** reduce motion is on and a person puts down a pin
- **THEN** the pin does not fall
- **AND** it appears at once or by a fade no longer than the shortest shared duration

### Requirement: A deleted place fades from the map

When a person deletes a place from its details and the deletion has succeeded, its pin
SHALL fade away while shrinking toward its point, over the standard duration and curve. The
details SHALL close at the same moment, with the timing every surface closes with.

Where the deleted place shares its point with other places, the pin SHALL stay and its count
SHALL go down, without fading.

Only a deletion made by the person on this device SHALL fade. A place that leaves the map
because a filter hides it, because it was deleted elsewhere, or because it was deleted from a
list rather than from the map SHALL disappear as it does without this requirement.

#### Scenario: A place is deleted

- **WHEN** a person deletes a place from its details and the deletion succeeds
- **THEN** its details close
- **AND** its pin shrinks toward its point as it fades away

#### Scenario: A place sharing its point with another is deleted

- **WHEN** a person deletes one of two places that share a point
- **THEN** the pin stays
- **AND** its count goes down

#### Scenario: A deletion is refused

- **WHEN** a person deletes a place and the deletion is refused
- **THEN** the pin stays where it was and does not fade

#### Scenario: A place is deleted with reduce motion on

- **WHEN** reduce motion is on and a person deletes a place
- **THEN** its pin does not shrink
- **AND** it disappears at once, or by a fade no longer than the shortest shared duration

### Requirement: The map's waiting area shows the turning globe

Where an application waits for the map, or for the trip it shows, inside the map's area, it
SHALL show the product's globe turning in place of a spinner: the mark's amber sphere, with
the continents in a darker amber turning under the mark's dark pin, which stands on the
middle of the sphere with the globe visible through its hole. The globe SHALL be drawn flat,
as a picture, and SHALL keep the same colours on both grounds, as the mark does.

It SHALL turn at a constant speed, one full turn over a shared duration, and SHALL carry the
words saying what is being waited for beside it.

Small indicators of activity inside controls, such as a button that is saving, SHALL remain
spinners.

With reduce motion on, the globe SHALL stand still, and the words SHALL remain.

Rationale: the map's waiting area is the one wait a person sees on every visit, and the globe
ties it to the phone's opening. Inside a control, a globe at that size cannot be read.

#### Scenario: The map is loading

- **WHEN** an application is waiting for the map or its trip inside the map's area
- **THEN** the globe turns where the spinner stood
- **AND** the words saying what is loading stand beside it

#### Scenario: The map is loading on the dark ground

- **WHEN** the map is loading and the application is on the dark ground
- **THEN** the sphere, the continents and the pin are the same colours as on the light ground

#### Scenario: The map is loading with reduce motion on

- **WHEN** reduce motion is on and the map is loading
- **THEN** the globe stands still
- **AND** the words saying what is loading are shown

#### Scenario: A button is saving

- **WHEN** a control shows that an act it started is in flight
- **THEN** it shows a spinner, not the globe
