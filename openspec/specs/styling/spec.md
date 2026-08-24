# styling Specification

## Purpose

Define how two applications built on different rendering stacks stay visually one
product, and what they are forbidden from sharing in order to do it. Web and native
share **token values** — colour for both grounds, spacing, radii, elevation, and the
type scale — held in one authoritative, platform-neutral definition and derived
outward into each platform's own representation. They share no styling code, no
class-name vocabulary, and no component markup, because a shared component has to
render something and a `<div>` and a `<View>` are not the same something.

This capability also governs the failures that make styling uniquely bad at reporting
itself. A value the host is expected to resolve renders as nothing on native while
occupying correct layout space; a font file that does not load falls back silently and
changes every measurement on screen. Neither is visible to a typecheck, a lint, or any
test that does not inspect pixels, so the rules here are what stand in for one.
## Requirements
### Requirement: Visual styling is shared as token values, not as styling code

Web and mobile SHALL share visual identity by sharing **design token values** — colours, spacing, radii, and type scale. They SHALL NOT be required to share styling code, class-name vocabulary, or component markup in order to stay visually consistent.

Each application SHALL write its styling in the idiom native to its platform, consuming shared tokens as ordinary values.

The repository SHALL NOT introduce a cross-platform styling runtime — a library whose purpose is to make one styling vocabulary work on both web and native. Such a library couples both applications to a single upstream version of a styling toolchain, and the coupling cost is not justified by the size of this product's non-map interface, the majority of which is rendered by map style definitions rather than by application styling.

#### Scenario: A brand colour is used on both platforms

- **WHEN** a marker colour must look identical on web and mobile
- **THEN** both applications read the value from the shared token source
- **AND** each applies it using its own platform's styling mechanism
- **AND** neither application depends on the other's styling toolchain

#### Scenario: A contributor proposes a cross-platform styling runtime

- **WHEN** a change would add a library that makes one styling vocabulary work on both web and native
- **THEN** the change is rejected by default under this requirement
- **AND** it is accepted only if the proposal states which of the revisit conditions in this change's design document has been met

### Requirement: Design tokens have one source of truth, expressed as platform-neutral data

Design tokens SHALL have exactly one authoritative definition, and that definition SHALL be platform-neutral data rather than a stylesheet. Any platform-specific representation of the tokens SHALL be derived from that definition.

Derivation SHALL only ever go from the neutral definition outward to platform representations. No process SHALL recover token values by parsing a stylesheet, because stylesheet parsing is lossy and fails silently on inputs it does not anticipate.

#### Scenario: A token value changes

- **WHEN** a contributor changes a colour in the authoritative definition
- **THEN** every platform representation reflects the new value after regeneration
- **AND** no platform representation has to be edited by hand

#### Scenario: A contributor edits a derived representation directly

- **WHEN** a generated platform representation is edited by hand
- **THEN** the edit is lost on the next regeneration
- **AND** the file identifies itself as generated so the contributor is warned before making the edit

### Requirement: Token values are literals that resolve on every target platform

Every token value SHALL be a concrete literal that the consuming platform can render without further resolution. A token value SHALL NOT be a reference to another token that is resolved by the host environment at runtime.

This forbids emitting values that depend on browser-side custom-property resolution into any representation consumed by native code. Native styling passes such values through uninterpreted, producing an element that occupies correct layout space but renders nothing — a failure that is invisible to typechecking, to linting, and to any test that does not inspect rendered pixels.

Semantic aliases MAY exist in the authoritative definition, but SHALL be flattened to literal values during derivation.

#### Scenario: A semantic alias is defined

- **WHEN** the authoritative definition expresses a semantic token as an alias of a structural token
- **THEN** the derived representations contain the resolved literal value, not the alias reference
- **AND** the same alias is safe to use on both platforms

#### Scenario: An unresolvable value would reach native styling

- **WHEN** a derivation step would emit a host-resolved reference into a representation consumed by native code
- **THEN** the derivation fails rather than emitting it
- **AND** no silently-invisible element can be produced from token data

### Requirement: Shared styling infrastructure is introduced only when a token is shared

No shared token package SHALL be created before at least one token value is required by both applications. Until then, each application MAY define its own values locally.

Rationale: a token package with no tokens has no source of truth to protect and accumulates unrelated concerns. The requirements above SHALL apply in full at the moment such a package is first created.

#### Scenario: The workspace is scaffolded with no user interface

- **WHEN** the applications exist but render no styled product interface
- **THEN** no shared token package exists
- **AND** no cross-platform styling dependency is installed in either application

#### Scenario: The first shared colour appears

- **WHEN** a colour is first needed by both applications
- **THEN** a shared token package is created that satisfies every requirement in this specification
- **AND** both applications consume the value from it rather than duplicating the literal

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

### Requirement: Text is chosen against the surface it is drawn on

Every text colour SHALL be chosen against the surface it is actually drawn on, and that
surface SHALL NOT be assumed to be the theme's ground. Text drawn on a themed fill —
a filled button, a selected chip, a control that fills on hover — SHALL be chosen
against that fill.

A token SHALL NOT be used to letter a fill merely because it is the theme's ground.
A ground and a fill are different surfaces; a value chosen for legibility over the first
carries no claim about the second, and on a fill whose lightness does not track the
theme it will be wrong on exactly one of the two grounds.

Where a fill is light on both grounds, the text over it SHALL be dark on both. Such a
pair is not a violation of the requirement that each colour be chosen against its own
ground — it is that requirement producing near-neighbours, because the surface being
chosen against is near-identical in both themes.

A state that changes a control's fill SHALL change its text in the same rule wherever
the existing text colour is not legible on the new fill. This applies in particular
where two tokens converge to one value on a ground: a pair that differs on the light
ground and is identical on the dark one will produce a legible composition on the first
and a 1:1 one on the second, and nothing about the tokens themselves is wrong.

#### Scenario: A control is filled with the accent

- **WHEN** a control takes the accent as its fill
- **THEN** its text is a value chosen against the accent
- **AND** it is legible on both the light and the dark ground

#### Scenario: A hover state changes the fill

- **WHEN** a state change replaces a control's fill
- **THEN** the same state declares the text colour for that fill
- **AND** the control's text is legible in the new state on both grounds

#### Scenario: Two tokens converge on one ground

- **WHEN** a text token and a fill token resolve to the same value on one ground
- **THEN** no composition draws that text on that fill
- **AND** the requirement is not satisfied by the pair being legible on the other ground

#### Scenario: A fill is light on both grounds

- **WHEN** a colour used as a fill is light in both themes
- **THEN** the text chosen against it is dark in both
- **AND** the two values are permitted to be near-neighbours

### Requirement: A token used for text clears the text contrast floor

Both applications SHALL meet WCAG 2.2 AA. Any token used to render text SHALL clear
4.5:1 against every surface it is drawn on, or 3:1 where the text qualifies as large.
This SHALL include placeholders, field labels, and the text of a control that is present
but inert.

A token that does not clear the floor SHALL NOT be used for text of any kind, and its
definition SHALL say so. Recessive text is expressed with the most recessive token that
clears the floor, not with one that sits below it.

Rationale: a token described by how it should *feel* rather than by what it may be used
for is how a whole class of unreadable text comes to look deliberate. "Deliberately hard
to notice" is a real design intent and it is satisfied well above the floor; stated as a
licence, it reads as permission to go under it, and every reviewer after that sees intent
where there is a defect.

Non-text uses of such a token — a hairline, a border, a drawn mark — are unaffected by
this requirement and are governed by the 3:1 non-text floor instead.

#### Scenario: A label is rendered

- **WHEN** any label, placeholder, or inert control text is drawn
- **THEN** its colour clears 4.5:1 against the surface behind it

#### Scenario: A token is below the floor

- **WHEN** a colour token does not clear the text contrast floor on either ground
- **THEN** it is not used to render text
- **AND** its definition states that it is not a text colour

#### Scenario: Recessive text is wanted

- **WHEN** text should read as secondary to the text beside it
- **THEN** it uses the most recessive token that clears the floor
- **AND** the separation from primary text is carried by that token, by weight, or by size

