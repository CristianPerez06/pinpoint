## MODIFIED Requirements

### Requirement: The product has one mark, and it is the pin it draws

Every asset a host may show to identify the product SHALL be the same drawing: the
teardrop the applications draw on the map, on a filled tile, with the head knocked out
of the drop so the tile shows through it.

The teardrop's path SHALL have exactly one definition, held as a shared token value and
consumed by both applications and by the mark. It SHALL NOT be copied into an
application, into an asset, or into the tooling that cuts the assets.

One definition rather than several held in agreement. A copy that is checked is still a
copy: the check reports a divergence after somebody has made it, and only for the copies
it was told about. This is the same reasoning, and the same package, as the box the path
is drawn in — both applications take that box as a value rather than writing it, because
writing it is what let an earlier defect survive being fixed on one platform.

A shared path is not the shared rendered markup `styling` forbids. That requirement
forbids sharing styling code, a class-name vocabulary, or component markup, and rejects a
cross-platform styling runtime. A path is a list of coordinates, and each application
still draws it with its own parts — a `<path>` on one, a native SVG element on the other.

A mark that merely resembles the pin drifts from it silently. The product's mark is the
thing the product draws.

The head SHALL be knocked out of a single path rather than drawn as a second shape in
the tile's colour, so the hole cannot land a half-pixel off the fill at small sizes.

#### Scenario: A new surface needs an icon

- **WHEN** a host requires an icon the product does not yet have
- **THEN** it is cut from the existing mark
- **AND** no second drawing of the mark is introduced to serve it

#### Scenario: The pin's path changes

- **WHEN** the shared definition of the teardrop is altered
- **THEN** both applications and every icon asset draw the new path
- **AND** no copy of the old one survives anywhere

#### Scenario: The path is copied instead of imported

- **WHEN** an application, an asset, or a script carries its own literal of the path
- **THEN** an automated check fails
- **AND** it names the file holding the copy

#### Scenario: Two assets are compared

- **WHEN** any two of the product's icon assets are placed side by side
- **THEN** they read as one product rather than as two

### Requirement: The mark is amber-tiled on every surface

The tile SHALL be the accent and the drop SHALL be `inkOnAccent`, on every asset,
regardless of platform. The mark SHALL NOT be inverted for a surface, and its polarity
SHALL NOT be indexed on the platform the asset is destined for.

Platform is not an axis the mark may vary on, because the product's web assets and its
native assets reach the same home screen: an installed copy of the site and the
installed application sit beside each other, and a platform-indexed rule produces two
marks in one place.

The pairing is not a choice made here. `styling` already requires anything drawn on the
accent to be lettered in `inkOnAccent`, and that is what the drop is.

Every asset SHALL take these colours from the token definition rather than stating them
itself, and an asset that states a colour of its own SHALL fail an automated check. This
applies to an asset expressed as text as much as to one expressed as pixels: a colour
written into a hand-maintained drawing is a copy of a token like any other, and is the
one the previous change left unchecked.

#### Scenario: A person installs both the site and the application

- **WHEN** an installed copy of the site and the installed application appear on one
  home screen
- **THEN** both show an amber tile carrying a dark drop
- **AND** neither is the inverse of the other

#### Scenario: An asset is cut for a new platform

- **WHEN** an asset is required for a platform the product does not yet ship to
- **THEN** its tile is the accent and its drop is `inkOnAccent`
- **AND** the platform is not consulted about which of the two is the tile

#### Scenario: A colour in a text-expressed asset is edited

- **WHEN** a colour written into an icon expressed as text no longer matches the token
- **THEN** an automated check fails
- **AND** it names the asset and the token it has departed from

## ADDED Requirements

### Requirement: Every icon asset is generated rather than drawn

Every asset a host may show to identify the product SHALL be emitted by the repository's
own tooling from the path and the token colours, and SHALL NOT be maintained by hand.
This SHALL include assets expressed as text as well as assets expressed as pixels.

An automated check SHALL regenerate every asset and fail when what is committed differs
from what would be cut. The comparison SHALL be of content rather than of bytes, so that
a re-encoding which produces the same picture does not fail.

A hand-maintained asset is the mechanism that produced two different drawings of this
mark, and the reason it survived is that no build, typecheck, lint or test can read an
icon. Text is not an exemption: a drawing expressed as markup is as unreadable to those
tools as one expressed as pixels, and is more inviting to edit.

#### Scenario: An asset is edited by hand

- **WHEN** any icon asset is changed without the generator being run
- **THEN** the check fails and names the asset

#### Scenario: An asset is re-encoded without changing the picture

- **WHEN** a committed asset differs in encoding but renders identically
- **THEN** the check passes
