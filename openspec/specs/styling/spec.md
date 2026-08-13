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

