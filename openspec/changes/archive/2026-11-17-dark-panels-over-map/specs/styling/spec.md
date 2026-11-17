## ADDED Requirements

### Requirement: Anything raised over the map stands apart from the map on both grounds

A surface drawn on top of the map — a menu, a card, a form, a sheet, a note — SHALL be
distinguishable from the map beneath it on both the light and the dark ground, without
the person having to know it is there.

On the dark ground the raised surface SHALL be lighter than every area the map fills —
land, blocks, water and parks — so that it reads as above the map rather than as part of
it. The fields, chips, dividers and selected-row highlight inside it SHALL still be
distinguishable from it, and all text on it SHALL still clear the text contrast floor.

On the dark ground, where a shadow cannot be seen, a surface raised over the map SHALL
also carry an outline lighter than both the surface and every colour the map draws other
than its labels. On the light ground the outline SHALL be unchanged from the hairline the
surface carries today.

The raised surface colour is one colour across the application. A card, menu or sheet
drawn where there is no map SHALL use the same colour as one drawn over the map.

Rationale: on the dark ground the card colour measured 1.06:1 against the map's land, and
the shadow that separates a panel from the map on the light ground is black, which a
near-black map absorbs. The map and the interface were tinted to share one ground on
purpose; on the dark ground that went far enough that the two could not be told apart.
The map is left alone and the surfaces move, because darkening the map would make its
streets and parks harder to read.

#### Scenario: A menu is open over the map on the dark ground

- **WHEN** the dark theme is in force and a menu, place card, form, sheet or note is drawn
  over the map
- **THEN** its fill is lighter than the map's land, blocks, water and parks
- **AND** it carries an outline lighter than its fill and than the map's roads

#### Scenario: The same panel on the light ground

- **WHEN** the light theme is in force and the same surface is drawn over the map
- **THEN** its fill and outline are the values used before this requirement

#### Scenario: A card where there is no map

- **WHEN** a card, menu or sheet is drawn on the calendar, settings or sign-in screens on
  the dark ground
- **THEN** its fill is the same colour as a surface raised over the map

#### Scenario: The values are changed

- **WHEN** the dark surface, the dark outline or a dark map area colour is edited
- **THEN** a test fails if the surface is no longer lighter than every map area fill, or the
  outline is no longer lighter than the surface and every non-label map colour
