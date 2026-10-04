## ADDED Requirements

### Requirement: A control's edge clears the non-text contrast floor

The token that draws a control's edge — the border of a button, chip, field or checkbox,
and the track of a switch that is off — SHALL clear 3:1 against every ground a control is
drawn on, on both themes: the raised surface, the page's ground and the muted fill.

A line that only separates two things, such as rows in a list, SHALL use the hairline
token instead, which is not held to this floor.

Rationale: an outlined control is found by its edge, and an edge at 1.5:1 is one you have
to already know is there. It looked deliberate for as long as it existed, because a faint
edge reads as restraint. Keeping the two kinds of line on separate tokens is what lets the
edge be raised without every divider in the product getting heavier with it.

#### Scenario: An outlined control on either ground

- **WHEN** a button, chip, field, checkbox or off switch is drawn on the light or the dark
  ground
- **THEN** its edge measures at least 3:1 against what it is drawn on

#### Scenario: The value is changed

- **WHEN** the edge token's value is edited
- **THEN** a test fails if it drops under 3:1 against any of the three grounds, on either
  theme
