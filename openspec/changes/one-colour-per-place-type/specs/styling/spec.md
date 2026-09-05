## MODIFIED Requirements

### Requirement: A theme pair preserves the relationships the palette encodes, not only its contrast

Where a set of token values carries meaning by how they relate to one another, the
second theme SHALL preserve those relationships. Producing a legible value is not
sufficient; a value that reads as prominent on one ground SHALL read as prominent on
the other, and one that reads as recessive SHALL stay recessive.

This SHALL apply to the marker type colours in particular. Their relative
prominence is deliberate and is a product decision: the type holding the large
majority of a trip's markers is the most recessive coloured value so that the
minority types, which carry the information somebody is actually looking for, are
the ones that stand out. Which type holds the majority is a fact about how trips
are actually filled in, and the recessive value SHALL follow it rather than being
assigned once and left.

The set SHALL also hold one value that is deliberately not a colour: the fallback
type is a near-neutral, so that a marker meaning *this was never classified* reads
as the least classified thing on the map. It is exempt from the prominence ranking
because it makes no claim to rank.

Every other type colour SHALL be distinguishable from every other at normal map
zoom, in both themes, and against every basemap the applications draw — including
where a type's colour and a basemap fill share a hue.

A theme SHALL NOT be derived by mechanically inverting or lightening the other. Each
value SHALL be chosen against the ground it will be drawn on.

#### Scenario: The type colours are compared across themes

- **WHEN** the seven marker type colours are rendered in each theme
- **THEN** the same type is the most recessive coloured value in both
- **AND** the remaining prominent types are prominent against their ground in both

#### Scenario: A theme value is legible but wrongly ranked

- **WHEN** a proposed dark value has sufficient contrast but makes a recessive type
  the most prominent one
- **THEN** it does not satisfy this requirement

#### Scenario: The fallback type is compared to the rest

- **WHEN** the fallback type's colour is placed beside the six others
- **THEN** it reads as the least saturated value in the set
- **AND** it is not the value a prominent type is ranked against

#### Scenario: A type colour shares a hue with a basemap fill

- **WHEN** a marker is drawn on a basemap area whose fill shares its hue
- **THEN** the marker remains distinguishable from the ground beneath it
- **AND** this is confirmed against a rendered map rather than against swatches
