# product-mark Specification

## Purpose

The drawing every host shows to identify the product — a browser tab, a home screen, an
installed copy's splash — and the rules that keep those assets one mark rather than a
family of near-relations. It exists because five such assets were cut across two changes
with nothing written down, and they came out as two different drawings.

## Requirements

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

### Requirement: The mark is accent-tiled on every surface

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

This requirement names the accent rather than a hue on purpose. It was titled after
amber while the accent was amber, and the title then stated a colour the requirement
itself never did. The mark follows the accent: when the accent changes, every asset is
recut and none keeps the old colour.

#### Scenario: A person installs both the site and the application

- **WHEN** an installed copy of the site and the installed application appear on one
  home screen
- **THEN** both show a tile in the accent carrying a drop in `inkOnAccent`
- **AND** neither is the inverse of the other

#### Scenario: An asset is cut for a new platform

- **WHEN** an asset is required for a platform the product does not yet ship to
- **THEN** its tile is the accent and its drop is `inkOnAccent`
- **AND** the platform is not consulted about which of the two is the tile

#### Scenario: A colour in a text-expressed asset is edited

- **WHEN** a colour written into an icon expressed as text no longer matches the token
- **THEN** an automated check fails
- **AND** it names the asset and the token it has departed from

#### Scenario: The accent changes

- **WHEN** the accent's value is changed in the token definition
- **THEN** every icon asset is recut with the new tile and drop
- **AND** no asset is left showing the previous accent

### Requirement: The mark carries its own ground and is not themed

The mark SHALL be one asset per contract serving both the light and the dark ground. It
SHALL NOT be issued as a themed pair, SHALL NOT consult a colour-scheme media query, and
SHALL NOT be expressed in terms a host resolves at runtime.

An icon is fetched outside the document and inherits none of its custom properties, and
a host may not consult a media query for an icon at all. The tile is a fill the mark
brings with it rather than a surface the theme supplies, which is why one asset is
enough.

Every colour in an icon asset SHALL therefore be a literal. A colour standing in for the
tile SHALL be one chosen as a ground or as a fill; a text token SHALL NOT be used as the
mark's ground.

#### Scenario: The host is on the dark ground

- **WHEN** a host showing the mark is in its dark appearance
- **THEN** the same asset is shown as on the light ground
- **AND** it is legible on both

#### Scenario: A colour is picked for the tile

- **WHEN** a value is chosen for an icon's tile or background field
- **THEN** it is a token chosen as a ground or as a fill
- **AND** it is not a token whose purpose is to letter something

### Requirement: The drop is sized against the region its host renders

An icon's drop SHALL be sized as a fraction of the region that survives the host's
treatment of the canvas, not as a fraction of the file. Three treatments exist, and an
asset SHALL be cut to exactly one of them:

- **Drawn as given.** The host draws the whole canvas and adds nothing to it, so the
  asset carries its own corner radius. The drop SHALL be 50% of the canvas width.
- **Corners cut.** The host rounds or squircles the canvas and shows substantially all
  of it, so the asset is square to the edge. The drop SHALL be 41% of the canvas width.
- **Cropped to a mask.** The host crops the canvas to a shape it chooses before drawing
  it, so the asset is square to the edge and bleeds under the crop. The drop SHALL be
  41% of the width of the region the host renders, which is smaller than the canvas by
  a factor the host's own specification states.

Each figure SHALL hold within two percentage points. The first is larger than the others
deliberately and for a reason that is not about masking: an asset drawn as given is
drawn at 16px in a tab strip, where a 41% drop is six pixels across and the tile has to
do the reading.

#### Scenario: An asset is cut for a cropping host

- **WHEN** an asset is cut for a host that crops the canvas to its own mask
- **THEN** the drop measures 41% of the region that host renders
- **AND** it is not sized against the full canvas

#### Scenario: Two cropping hosts render different fractions of the canvas

- **WHEN** two hosts crop to different fractions of the canvas
- **THEN** their assets carry drops of different fractions of the file
- **AND** the drop reads at the same size in both once rendered

#### Scenario: The mark is seen at tab-strip size

- **WHEN** the mark is drawn at 16px
- **THEN** the tile reads as a solid field of the accent
- **AND** the drop is legible against it

### Requirement: The drop clears the crop it will be subjected to

On a cropping host the drop SHALL lie entirely inside that host's guaranteed-safe
region, and the drop's bounding box SHALL be centred on the canvas so that neither the
tip nor the head is nearer the edge than the other.

The tip is the exposed end: a drop centred by eye rather than by its bounds puts the tip
closer to the crop than the head, and the tip is the part that carries the pin's meaning.

An asset's clearance SHALL be established by measurement against the host
specification's own figure, and SHALL NOT be assumed from another host's. The two
specifications in force differ — a web manifest `maskable` icon reserves a circle 80% of
the image width, and an Android adaptive icon renders the middle 72 of 108 units and
guarantees only the middle 66.

#### Scenario: An asset is measured for clearance

- **WHEN** an asset destined for a cropping host is checked
- **THEN** it is measured against that host's own safe-region figure
- **AND** the drop lies wholly inside it

#### Scenario: The drop is positioned on the canvas

- **WHEN** the drop is placed on a canvas that will be cropped
- **THEN** its bounding box is centred on the canvas centre
- **AND** the tip and the head clear the crop by the same margin

### Requirement: One thing is called the mark

The teardrop tile SHALL be called the mark. The accent dot the application draws in its
own header SHALL be called something else, and the two SHALL NOT share a name in any
document describing the product's appearance.

They are different drawings for different places — one identifies the product to a host
that has never run it, the other identifies a screen inside an application already open
— and a shared name is how a future change draws the wrong one.

#### Scenario: A document describes the product's appearance

- **WHEN** a document names the teardrop tile and the header dot
- **THEN** only the teardrop tile is called the mark

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
