## MODIFIED Requirements

### Requirement: Every colour token is defined for both a light and a dark ground

The authoritative token definition SHALL define each colour for both a light and a
dark ground. A colour SHALL NOT be defined once and reused across both.

Both applications SHALL render in the theme the person's device or explicit choice
asks for. A surface SHALL NOT present one theme's colours over another theme's, in
whole or in part.

Both applications SHALL offer an explicit choice between following the device, a light
ground and a dark ground. The choice SHALL be remembered on the device it was made on, and
SHALL survive a reload, a restart and a cold launch. Following the device SHALL be
available as a choice rather than only as the absence of one, and SHALL remain the
behaviour when nothing has been chosen.

Where a choice other than following the device is in force, it SHALL override what the
device asks for, and every surface the host draws on the application's behalf — form
controls, scrollbars, and the browser's own furniture where there is one — SHALL follow the
chosen ground rather than the device's.

Where following the device is in force, a change to the device's appearance while the
application is open SHALL repaint it.

A change of ground SHALL take effect across every surface together. There SHALL be no
moment, including the first frame after a load or a launch, at which one surface is drawn
on one ground and another on the other.

Non-colour tokens — spacing, radii, the type scale — SHALL remain single-valued.
Nothing about a spacing step changes with the ground it sits on, and duplicating them
would create two places for one value to drift.

Rationale: the sentence permitting an explicit choice has been in force since this
specification was written and nothing implemented it, so "or explicit choice" described
something no person could do. What the added paragraphs supply is the half that was
missing — what a choice means, that it persists, and that following the device survives as
a choice rather than being replaced by one.

The preference and the ground are deliberately different things. A preference has three
values and a ground has two; a stored ground cannot be told apart from a device that
happens to agree with it, and the difference is what makes "follow the device" expressible
at all.

The togetherness sentence is not a performance note. Both applications resolve the ground
in more than one place — on web the cascade decides the interface and JavaScript decides
the map, because the map's colours live inside a style document no stylesheet can reach —
and a light map inside a dark interface has already shipped once here, from a different
cause. Stating it as a requirement is what makes a second reader that could disagree a
defect rather than a detail.

#### Scenario: The device asks for a dark interface

- **WHEN** a person's device is set to a dark appearance
- **AND** no explicit choice has been made
- **THEN** both applications render in the dark theme
- **AND** every surface, including the map, uses that theme's values

#### Scenario: A person chooses a ground explicitly

- **WHEN** a person chooses light or dark in either application
- **THEN** that application renders in the chosen theme
- **AND** every surface, including the map, uses that theme's values
- **AND** it does so regardless of what the device asks for

#### Scenario: An explicit choice is changed

- **WHEN** a person changes the choice to the other ground
- **THEN** every surface repaints to the new ground together
- **AND** no surface is left on the previous ground

#### Scenario: The choice outlives the session

- **WHEN** a person has chosen a ground, and later reloads the page or launches the
  application again from cold
- **THEN** the application renders in the chosen ground from its first frame
- **AND** no other ground is drawn first

#### Scenario: Following the device is chosen, and the device changes

- **WHEN** a person has chosen to follow the device
- **AND** the device's appearance is changed while the application is open
- **THEN** the application repaints to the new ground

#### Scenario: The host's own surfaces under a forced ground

- **WHEN** a ground is in force that is not the one the device asks for
- **THEN** the surfaces the host draws — form controls, scrollbars, and the browser's
  address bar where there is one — are drawn on the forced ground
- **AND** not on the ground the device asks for

#### Scenario: A token is defined for only one ground

- **WHEN** a colour token is added with a value for one theme and not the other
- **THEN** the derivation fails rather than falling back to the other theme's value

#### Scenario: A spacing step is looked up

- **WHEN** either application reads a spacing, radius, or type-scale token
- **THEN** it receives the same value in both themes
