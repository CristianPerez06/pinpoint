# workspace-chrome

## ADDED Requirements

### Requirement: A tool in the bottom bar is a glyph above one line of words

Where the chrome is phone-shaped and the session's controls stand on the bottom edge,
every one of those controls SHALL take one shape: a glyph, and beneath it the control's
name on a single line.

The name SHALL NOT be omitted. A glyph alone is a guess, and the glyphs these controls use
are conventions rather than pictures of what they open.

The name SHALL be one line and SHALL be set at one size across the controls in the bar.
Rationale: these controls are equals — each fires an action, none navigates — and equals
that are lettered at different sizes read as a hierarchy that does not exist.

**Nothing else SHALL occupy a line of its own in that column.** Where a control has
something to say beyond its name — that it is declaring a state, that it opens something,
how many of anything — that SHALL be carried on or beside the glyph, or in the control's
name, and SHALL NOT be added beneath the words as a further line.

Rationale: this is the defect the requirement exists to prevent, and it shipped. The
control that narrows the trip was built from a horizontal run of four elements — a glyph,
a word, a count and a state dot — and the bar draws its controls as a column, so each of
the four became a line and a pill-shaped control became a four-line block. It happened
only once a filter was applied, so the bar looked correct until somebody used the thing it
is there for. Nothing detected it: every rule involved was present and correct, the markup
type-checked, and the control rendered.

Rationale for stating this at all: the shape was previously a convention carried in
stylesheet comments and followed by two of the three controls. A convention that one
control can drift out of while type-checking and rendering is not a constraint, and the
one that drifted was the one carrying a state.

A control MAY be absent from the bar, and MAY be replaced by something of a different
shape while the map is doing something other than what it usually does. This requirement
governs the controls that are standing there as tools, not what may stand in their place.

#### Scenario: The session's controls have one shape

- **WHEN** a trip workspace is shown on a phone-shaped screen
- **THEN** each control on the bottom edge is a glyph above its own name
- **AND** each name is on one line
- **AND** the names are set at the same size as each other

#### Scenario: A control declaring a state does not grow a line

- **WHEN** a control on the bottom edge is declaring a state
- **THEN** it is still a glyph above one line of words
- **AND** the state is carried on the glyph or in the control's name
- **AND** no further line appears beneath the words

#### Scenario: A control that opens something does not show its affordance as a line

- **WHEN** a control on the bottom edge reveals a panel
- **THEN** no affordance indicating that is drawn beneath its name
- **AND** the control is still a glyph above one line of words

#### Scenario: A count has nowhere to go in the bar

- **WHEN** a control on the bottom edge would report a count
- **THEN** that count is not drawn as a line beneath the control's name
- **AND** whatever the count was reporting is either carried on the glyph, carried in the
  control's name, or not reported in this rendering
