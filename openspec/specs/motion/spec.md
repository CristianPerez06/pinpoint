# motion Specification

## Purpose

Define how either application animates, so motion feels like one product on the laptop
and on the phone: shared speeds and curves, respect for "reduce motion", one animation
mechanism per platform and the condition for adding another, the phone's animated
opening, and the moments when something changes on screen — surfaces opening and closing,
pins arriving and leaving, and the turning globe while the map loads.

## Requirements

### Requirement: Speeds and motion curves are shared tokens

Every duration and every easing curve an application animates with SHALL come from the
shared token source, defined once and consumed by both applications as ordinary values. A
component SHALL NOT write a duration or a curve as a literal.

A spring, meaning motion that settles by overshooting and coming back, SHALL likewise be a
named token, defined by values both platforms can apply.

A sequence that exists on one platform only, such as the phone's opening, MAY keep its own
timings, provided they are held in one named table in that application and not scattered
through its code.

Rationale: the same sheet sliding up at two speeds on two platforms reads as two products.
It is the argument `styling` makes for colour, applied to time.

#### Scenario: A sheet opens on both platforms

- **WHEN** the same kind of surface opens on the laptop and on the phone
- **THEN** both take its duration and its curve from the same named token
- **AND** each applies it with its own platform's mechanism

#### Scenario: A duration is written into a component

- **WHEN** a component animates with a duration or curve written as a literal
- **THEN** the change is rejected in review under this requirement
- **AND** the value is added to the shared token source under a name, or an existing one is used

#### Scenario: A sequence exists on one platform only

- **WHEN** an animated sequence is drawn by only one application
- **THEN** its timings may live in that application
- **AND** they are held in one named table rather than written where each step is drawn

### Requirement: "Reduce motion" is respected everywhere

When the person has asked their device or browser to reduce motion, no application SHALL move,
scale, spin or slide anything to show a change. The change SHALL happen at once, or by a fade
no longer than the shortest shared duration.

This SHALL hold for every animation, including the phone's opening, and SHALL be read from the
setting at the moment the animation would start, not only at launch.

#### Scenario: Reduce motion is on

- **WHEN** reduce motion is on and something would animate
- **THEN** nothing on screen moves
- **AND** the end state appears at once or by a short fade

#### Scenario: The setting changes while the app is open

- **WHEN** reduce motion is turned on while an application is open
- **THEN** the next animation that would start respects it without a restart

### Requirement: Each platform animates with one mechanism

Each application SHALL animate with one mechanism, named in the design of the change that
introduced this requirement: the laptop with its platform's own styling, and the phone with
one animation library that runs motion off the thread doing the app's work. A second
mechanism on either platform SHALL be added only when the first cannot do what is needed, and
the change adding it SHALL state which of the revisit conditions in that design has been met.

The phone's opening is the one exception. It draws in three dimensions, which neither
mechanism does, and the 3D drawing it uses SHALL NOT be used for anything else without its own
change.

No cross-platform animation runtime SHALL be introduced, for the reason `styling` rejects a
cross-platform styling runtime.

#### Scenario: A contributor adds an animation library

- **WHEN** a change adds a second animation mechanism to either application
- **THEN** it is rejected by default
- **AND** it is accepted only if its proposal names the revisit condition that has been met

### Requirement: The phone opens from its still icon without a visible switch

When the phone app is started, the first thing on screen SHALL be the still launch image: the
product's mark as an amber sphere with the dark pin, centred on the ground. The still image
SHALL be cut from the existing mark, like every other icon asset.

The animated opening SHALL begin from a frame identical to that image in size, position and
colour, and the still image SHALL stay on screen until the animated opening has drawn that
frame, so no blank or mismatched frame is shown between them.

#### Scenario: A cold launch

- **WHEN** the app is started from nothing
- **THEN** the still icon appears first
- **AND** the animation starts from exactly what the still icon shows
- **AND** no blank frame appears between them

#### Scenario: The device is in dark appearance

- **WHEN** the device is set to dark appearance at launch
- **THEN** the still icon sits on the dark ground

### Requirement: The full opening plays the approved sequence

The full opening SHALL play, in order:

1. The icon, still, for a moment.
2. The flat pin fills out into a 3D pin: a round head with the icon's hole drilled through it,
   narrowing to a point. It grows by about a third and rises until its point sits on the
   middle of the sphere, with its head tipped toward the viewer. At the same time the view
   rises to look down on the globe, light comes up on the sphere, and the continents appear in
   a darker amber than the sphere.
3. The globe spins right, stops hard and bounces.
4. The globe spins back left to where it started, stops hard and bounces.
5. The globe spins left again, as far as the first spin, stops hard and bounces.
6. The globe lifts slightly and fades, and the app is underneath.

The pin SHALL stay on the middle of the sphere while the globe spins under it, and SHALL sway
with each hard stop. Steps 1 to 5 SHALL take no more than two and a half seconds, and step 6 no
more than three tenths of a second.

The approved mock recorded in this change is the reference for how each step looks.

#### Scenario: The first launch on a fast phone

- **WHEN** the app is launched for the first time and is ready before the animation ends
- **THEN** all six steps play in order
- **AND** the app appears when step 6 ends

#### Scenario: Each spin ends

- **WHEN** any of the three spins reaches its end
- **THEN** the globe stops abruptly, overshoots slightly and settles back
- **AND** the pin sways with the stop

### Requirement: The full opening plays once, and later launches play a short one

The full opening SHALL play on the first launch after the app is installed. Every later launch
SHALL play the short opening: steps 1, 2 and 6 of the full sequence, with no spinning, in no
more than seven tenths of a second before step 6.

Whether the full opening has played SHALL be remembered on the device with the app's other
preferences, and SHALL be recorded once the full opening has finished, so that a launch
interrupted before the end plays it again.

#### Scenario: The second launch

- **WHEN** the app is launched after the full opening has played once
- **THEN** the short opening plays
- **AND** the globe does not spin

#### Scenario: The first launch is interrupted

- **WHEN** the app is closed before the full opening has finished
- **THEN** the next launch plays the full opening again

### Requirement: The opening never makes a launch slower

The opening SHALL play while the app loads what it needs to show its first screen, and SHALL
NOT delay that loading.

If the app is ready before the animation ends, the app SHALL appear when the animation ends.
If the animation ends first, the globe SHALL hold still in its final position until the app is
ready, and the app SHALL then appear with step 6. The opening SHALL NOT loop, spin or show any
progress indicator while it waits.

#### Scenario: A slow launch

- **WHEN** the app takes longer to become ready than the animation takes to play
- **THEN** the globe holds still once the animation has ended
- **AND** the app appears with step 6 as soon as it is ready

#### Scenario: Loading is not held back

- **WHEN** the opening is playing
- **THEN** the app's loading proceeds exactly as it would without the opening

### Requirement: With reduce motion on, the opening is the still icon

With reduce motion on, the phone SHALL show the still icon until the app is ready, and then
fade into the app in no more than two tenths of a second. The pin SHALL NOT turn 3D, and the
globe SHALL NOT spin, rise or appear.

A launch with reduce motion on SHALL NOT count as the full opening having played.

#### Scenario: Launch with reduce motion on

- **WHEN** the app is launched with reduce motion on
- **THEN** the still icon stays until the app is ready
- **AND** it fades into the app without moving

### Requirement: The 3D pin is the product's mark given depth

The pin in the opening SHALL be the product's mark: its flat frame is drawn from the shared
definition of the teardrop, and the 3D pin SHALL keep the mark's proportions, the head's size
against the whole and the hole's size against the head, taken from that same definition rather
than from literals of its own.

The hole SHALL remain visible, facing the viewer, throughout the opening, so the globe shows
through it.

#### Scenario: The pin's shape changes

- **WHEN** the shared definition of the teardrop is altered
- **THEN** the opening's flat frame and 3D pin both follow it
- **AND** no copy of the old proportions survives in the opening

#### Scenario: The pin turns 3D

- **WHEN** the pin has filled out into its 3D form
- **THEN** the hole through its head is still visible
- **AND** the globe can be seen through it

### Requirement: The opening's globe draws on the chosen ground

Once the app has read its own light or dark choice, the animated opening SHALL draw on that
ground. The sphere, the pin and the continents SHALL be the same colours on both grounds, as
the mark is.

#### Scenario: The chosen theme differs from the device

- **WHEN** the person chose dark in the app while the device is light
- **THEN** the still icon sits on the light ground
- **AND** the animated opening draws on the dark ground
- **AND** the app appears on the dark ground

### Requirement: The laptop has no opening animation

The web application SHALL NOT show a splash or a first-load animation. A page SHALL show its
own content, or its waiting state, from the first paint.

#### Scenario: The site is opened in a browser

- **WHEN** a person opens the web application
- **THEN** the first thing drawn is the page's own content or waiting state
- **AND** no animation stands in front of it

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
