## ADDED Requirements

### Requirement: The accent cannot be mistaken for a marker type

The accent SHALL be distinguishable at a glance from every marker type colour, on both
grounds. It carries the primary action, the current selection and the focus ring, and the
type colours carry what kind of place a pin is; a person SHALL NOT have to work out which
of the two a colour on screen belongs to.

Where a change of accent would bring it close to a type colour, that type's colour SHALL
move in the same change, and the moved colour SHALL still satisfy every rule the type
colours already answer to: distinguishable from every other type at normal map zoom, on
both grounds and against every basemap fill, clearing the non-text floor against the land,
and keeping the prominence ranking.

The separation SHALL be judged on a rendered screen holding both — a pin beside a control
in its selected state — and not on swatches.

Rationale: this was a brand note rather than a requirement while the accent was amber,
which sat far from every type. Moving the accent to purple put it on top of the violet
that named Shopping, and what kept the two apart was a sentence in a document no check
reads. The rule is stated here so that the next change of either colour meets it as a
requirement.

#### Scenario: A selected control beside a pin

- **WHEN** a control in its selected state and a pin of any type are on screen together
- **THEN** the control's colour does not read as that type's colour
- **AND** this holds on both the light and the dark ground

#### Scenario: The accent is changed to a hue a type already holds

- **WHEN** a proposed accent is close in hue to an existing type colour
- **THEN** that type's colour is changed in the same change
- **AND** the new type colour is distinguishable from every other type on both grounds

#### Scenario: A type colour is moved to make room for the accent

- **WHEN** a type's colour is moved away from the accent
- **THEN** it clears the non-text contrast floor against the land on both grounds
- **AND** the type that was the most recessive coloured value is still the most recessive
