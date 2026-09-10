## ADDED Requirements

### Requirement: A map that opens into a running interface arrives in the current theme

An application SHALL draw the map in the theme in force at the moment the map is created,
including when the map is created after the interface is already running — when somebody
switches to another trip, creates one, or reaches a trip by any navigation that does not
reload the page.

The map SHALL NOT be drawn in a default theme and corrected afterwards. A frame drawn in
the wrong theme is a defect whether or not a later frame replaces it.

Where an application resolves the theme as a value rather than through a stylesheet, that
value SHALL be read from the system at the moment it is first needed. A placeholder answer
is permitted only where the environment cannot know the preference: on a server, and during
the first client render, which must produce what the server produced.

Rationale: the existing requirement that the map is drawn in the interface's theme is
written from the point of view of a map that is already open — its scenarios cover a dark
interface and a theme changing under a visible map. Neither says anything about the moment
the map comes into existence, which is where this went wrong: a mount that happens after a
client-side navigation is long past hydration and has no reason to start on a guess.

#### Scenario: Somebody switches to another trip

- **WHEN** the interface is drawn in the dark theme and somebody switches from one trip to
  another without the page reloading
- **THEN** the map for the new trip is drawn in its dark form on its first frame
- **AND** no frame of it is drawn in the light theme's values

#### Scenario: Somebody creates a trip

- **WHEN** the interface is drawn in the dark theme and somebody creates a trip
- **THEN** the map for the new trip is drawn in its dark form on its first frame

#### Scenario: The first render must match the server

- **WHEN** an application renders on a server, or performs the first client render that has
  to match it
- **THEN** it may resolve the theme to a fixed default rather than to the system preference
- **AND** it corrects to the system preference as soon as it is entitled to

### Requirement: The renderer holds the style the application believes it holds

Where an application hands a style document to a renderer imperatively, it SHALL record the
document it actually handed over, at the moment it hands it over. It SHALL NOT infer what
the renderer holds from the absence of a previous record.

A style that is resolved while the map is being created SHALL be applied to the map once it
exists, in the same way as a style resolved at any other time.

Rationale: a map is created from whichever document happened to be ready, and a document
resolving a moment later is an ordinary occurrence rather than an error — the style is
fetched, and a cached answer arrives in a different order from a networked one. Treating
"nothing recorded yet" as "the renderer was built with this" makes the record disagree with
the renderer, and every later comparison is then made against a document nothing is drawing.
The observable cost is not one wrong map but two: the wrong theme now, and a theme change
afterwards that appears to need making twice.

#### Scenario: The style resolves while the map is being created

- **WHEN** a style document for the current theme resolves after the map has been created
  from a different document
- **THEN** the application applies the newly resolved style to the existing map
- **AND** the camera stays exactly where it was

#### Scenario: A theme change after the map has been reopened

- **WHEN** somebody switches trips and then changes the system appearance
- **THEN** the map follows on that change
- **AND** it does not require the appearance to be changed a second time
