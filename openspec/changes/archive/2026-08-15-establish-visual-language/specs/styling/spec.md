## ADDED Requirements

### Requirement: Every colour token is defined for both a light and a dark ground

The authoritative token definition SHALL define each colour for both a light and a
dark ground. A colour SHALL NOT be defined once and reused across both.

Both applications SHALL render in the theme the person's device or explicit choice
asks for. A surface SHALL NOT present one theme's colours over another theme's, in
whole or in part.

Non-colour tokens — spacing, radii, the type scale — SHALL remain single-valued.
Nothing about a spacing step changes with the ground it sits on, and duplicating them
would create two places for one value to drift.

#### Scenario: The device asks for a dark interface

- **WHEN** a person's device is set to a dark appearance
- **THEN** both applications render in the dark theme
- **AND** every surface, including the map, uses that theme's values

#### Scenario: A token is defined for only one ground

- **WHEN** a colour token is added with a value for one theme and not the other
- **THEN** the derivation fails rather than falling back to the other theme's value

#### Scenario: A spacing step is looked up

- **WHEN** either application reads a spacing, radius, or type-scale token
- **THEN** it receives the same value in both themes

### Requirement: A theme pair preserves the relationships the palette encodes, not only its contrast

Where a set of token values carries meaning by how they relate to one another, the
second theme SHALL preserve those relationships. Producing a legible value is not
sufficient; a value that reads as prominent on one ground SHALL read as prominent on
the other, and one that reads as recessive SHALL stay recessive.

This SHALL apply to the marker family colours in particular. Their relative
prominence is deliberate and is a product decision: the family holding the large
majority of a trip's markers is the most recessive value so that the minority
families, which carry the information somebody is actually looking for, are the ones
that stand out.

A theme SHALL NOT be derived by mechanically inverting or lightening the other. Each
value SHALL be chosen against the ground it will be drawn on.

#### Scenario: The family colours are compared across themes

- **WHEN** the five marker family colours are rendered in each theme
- **THEN** the same family is the most recessive in both
- **AND** the remaining four are prominent against their ground in both

#### Scenario: A theme value is legible but wrongly ranked

- **WHEN** a proposed dark value has sufficient contrast but makes a recessive family
  the most prominent one
- **THEN** it does not satisfy this requirement

### Requirement: Typography is a shared token, and the typeface resolves on both platforms

The authoritative token definition SHALL include the type scale: for each role, its
size, weight, letter-spacing, line height, and whether its numerals are tabular.
Roles carrying values that align in columns SHALL specify tabular numerals, so that
digits in a list do not shift horizontally between rows.

Both applications SHALL render text in the same typeface. The typeface SHALL be
bundled with each application rather than fetched from a third party at runtime, and
SHALL be licensed for that use at no cost.

Each application SHALL verify that the bundled typeface is the one actually rendering.
A missing or misnamed font file falls back to a system face silently, changing every
measurement on the screen while breaking nothing that a build or a type-check can
detect.

#### Scenario: The same text on both platforms

- **WHEN** a place name is rendered on web and on mobile at the same role
- **THEN** both use the same typeface at the same weight and letter-spacing

#### Scenario: A column of prices

- **WHEN** prices are listed one above another
- **THEN** their digits align vertically

#### Scenario: The font file is missing

- **WHEN** an application is built without the typeface it declares
- **THEN** the failure is reported by an automated check
- **AND** it is not left to be noticed by looking at the rendered result

### Requirement: A platform representation carries resolved values for one theme, never a host-resolved reference

Derivation MAY emit whatever theming mechanism is native to a platform, including one
resolved by the browser at runtime, for representations consumed only by that
platform.

No representation consumed by native code SHALL contain a value the host is expected
to resolve. Both themes' values SHALL be present as literals, and the choice between
them SHALL be made by the application at the point of use.

Rationale: this is the same failure the existing literal requirement prevents, arriving
by a new route. Theming is the case that most invites emitting a reference, because
one reference per token is exactly what a browser theme wants and exactly what native
styling passes through uninterpreted — producing an element that occupies correct
layout space and renders nothing.

#### Scenario: The web representation is generated

- **WHEN** the tokens are derived for web
- **THEN** the representation may express themes through a browser-resolved mechanism

#### Scenario: The native representation is generated

- **WHEN** the tokens are derived for native
- **THEN** every value in it is a concrete literal
- **AND** both themes' values are present

#### Scenario: A host-resolved reference would reach native styling

- **WHEN** a derivation step would emit a browser-resolved reference into the native
  representation
- **THEN** the derivation fails rather than emitting it
