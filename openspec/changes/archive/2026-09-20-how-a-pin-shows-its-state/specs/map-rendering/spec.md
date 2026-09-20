## REMOVED Requirements

### Requirement: A visited marker is drawn as visited, without changing its colour

Replaced by **A visited marker is drawn as visited, without changing its colour or its
strength**, below. Removed and re-added rather than modified because one of its
scenarios — `Both applications mute identically`, which requires the marker to be
"muted by the same amount" — asserts the mechanism this change removes, and a
`MODIFIED` delta cannot drop a scenario. Every other sentence of it is carried
forward verbatim into the replacement.

## ADDED Requirements

### Requirement: The selected marker is drawn so it can be found

When a marker is selected, the map SHALL draw it distinguishably from every other marker,
so that a person reading its description can tell which point on the map it describes.

That distinction SHALL be carried by **size and by a ring around the marker**, and SHALL
NOT be carried by the marker's colour, for the reason the family colour exists: colour
names the marker's family and nothing else.

The selected marker SHALL be drawn above the markers around it. A marker in a tight
cluster is otherwise partly covered by whichever of its neighbours is drawn after it,
which is the case selection most needs to answer.

How much larger the selected marker is drawn SHALL be decided by shared code and carried
in the drawn description, in the same way the drawn box, the anchor and the visited form
already are, so that both applications draw it identically.

The marker's anchor SHALL be unchanged by selection: the point the drawn description names
SHALL stay on the marker's coordinate as it grows.

Only one marker SHALL be drawn as selected at a time, and dismissing the selection SHALL
return every marker to its ordinary size.

A marker SHALL be able to be selected and visited at once, and SHALL then show both —
selection is about which marker is being read, and visited is about the trip. Neither
SHALL replace the other.

Rationale: this was drawn two different ways for as long as both applications have had a
map. The laptop grew the selected pin and ringed it; the phone drew the ring alone, which
is nearly invisible where pins overlap — exactly where it is needed. Neither was wrong,
because nothing here said what a selected marker looks like, and a rule that is never
written is a rule each application gets to invent. The same requirement that makes the
drawn box and the anchor shared exists for this.

#### Scenario: A marker is selected

- **WHEN** a person selects a marker on either platform
- **THEN** it is drawn larger than the markers around it, and ringed
- **AND** every other marker stays its ordinary size

#### Scenario: Another marker is selected

- **WHEN** a person selects a second marker while the first is selected
- **THEN** the first returns to its ordinary size
- **AND** the second is the one drawn larger

#### Scenario: The selection is dismissed

- **WHEN** a person dismisses the selected marker
- **THEN** every marker is drawn at its ordinary size

#### Scenario: A selected marker among markers close together

- **WHEN** a selected marker sits among others close enough to overlap it
- **THEN** it is drawn above them
- **AND** no part of it is covered by a neighbour

#### Scenario: Both applications draw the selected marker identically

- **WHEN** the same marker is selected on the laptop and on the phone
- **THEN** it is grown by the same amount, taken from the shared drawn description

#### Scenario: A marker that is selected and visited

- **WHEN** a visited marker is selected
- **THEN** it is drawn in the visited form and drawn as selected
- **AND** both remain readable

#### Scenario: The marker stays on its coordinate as it grows

- **WHEN** a marker is selected and drawn larger
- **THEN** the point the drawn description names is still on the marker's coordinate
- **AND** it does not shift relative to what is beneath it

### Requirement: A visited marker is drawn as visited, without changing its colour or its strength

A marker that has been visited SHALL be drawn distinguishably from one that has not.

That distinction SHALL NOT be carried by the marker's colour. Colour names the marker's
family and nothing else, which is what allows the type list to grow without the map
becoming unreadable.

The distinction SHALL NOT be carried by drawing the marker more faintly. A marker drawn
at reduced strength loses its family colour and its glyph together — the two things that
say what kind of place it is — because both are drawn against the land and both fade into
it at the same rate.

A visited marker SHALL instead be drawn in a different **form** from an unvisited one,
with its family colour and its glyph at full strength. Its family colour SHALL clear
3:1 against the land it is drawn on, and its glyph SHALL clear 3:1 against the marker,
on both grounds — the same floor anything that is not text has to clear.

Rationale for form rather than strength: a marker's colour is chosen to clear the floor
by a small margin and nothing more, so there is no contrast to spend on a second signal.
Every one of the eight families measured between 1.58:1 and 1.98:1 against the light
ground when drawn at 45%, and the best obtainable value of that dial leaves the worst
family at 2.54:1 while making it indistinguishable from an unvisited marker. Strength
cannot carry this signal at any setting. Form is also the one channel that survives a
greyscale display, which two of the eight families already need.

Which form a visited marker takes SHALL be decided by shared code and carried in the
drawn description, in the same way the drawn box and the anchor already are, so that both
applications draw it identically.

Interest SHALL NOT be drawn on a marker. Narrowing the map is what answers who wants to
go; encoding several members' answers onto one pin that already carries a family colour, a
glyph, a possible count badge, a possible visited form and a possible selection is the
unreadability this rule exists to prevent.

Rationale: "which of these have we already been to" is asked while looking at the map,
most of all on a phone during the trip, and a filter answers it only once somebody thinks
to set one. "Who wants to go" is asked while planning, where narrowing is the better
instrument and the states are too many to draw.

#### Scenario: A visited marker among unvisited ones

- **WHEN** a trip containing visited and unvisited markers is drawn
- **THEN** the visited markers are visually distinguishable from the unvisited ones
- **AND** both are drawn in the colour of their family

#### Scenario: Two markers of one family, one visited

- **WHEN** two markers share a family and only one has been visited
- **THEN** they are drawn in the same colour
- **AND** still tell apart as visited and not

#### Scenario: Both applications draw a visited marker identically

- **WHEN** the same visited marker is drawn by either application
- **THEN** it takes the same form, taken from the shared drawn description

#### Scenario: A visited marker of the quietest family on the light ground

- **WHEN** a visited marker of the family with the least contrast against the land is
  drawn on the light ground
- **THEN** its family colour clears 3:1 against the land
- **AND** its glyph clears 3:1 against the marker
- **AND** somebody can still tell what kind of place it is

#### Scenario: A visited marker on a greyscale display

- **WHEN** a trip containing visited and unvisited markers is shown without colour
- **THEN** the visited markers are still distinguishable from the unvisited ones
- **AND** the distinction does not depend on one being fainter than the other

#### Scenario: Interest is not drawn

- **WHEN** members have recorded differing interest in a marker
- **THEN** the marker's drawn form is unchanged by those records
