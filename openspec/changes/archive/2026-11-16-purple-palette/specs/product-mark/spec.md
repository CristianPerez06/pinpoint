## RENAMED Requirements

- FROM: `### Requirement: The mark is amber-tiled on every surface`
- TO: `### Requirement: The mark is accent-tiled on every surface`

## MODIFIED Requirements

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
