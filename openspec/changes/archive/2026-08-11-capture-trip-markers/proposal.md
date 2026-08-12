## Why

The map renders, and nothing can be put on it. Every marker in the product was
written by a seed migration, so the app is a viewer for data that only exists
because someone hand-wrote SQL. Until a traveller can add a place they found,
correct one they got wrong, and remove one they changed their mind about, the
spreadsheet is still the real tool and this is a demo of it.

This is the change the roadmap says lets the app replace the spreadsheet. Not
the one after it.

## What Changes

**Places arrive two ways, and they meet in one form.**

- A search box queries a free geocoder as you type, biased toward the city you
  are working on, and offers candidate places to add.
- Arming a drop mode and tapping the map places a provisional marker at that
  point, draggable to nudge before saving.

Tap-to-drop is not the fallback path. Small restaurants are frequently absent
from OpenStreetMap under the name anyone actually calls them, so for food it is
expected to be the primary one. It also means the whole capture flow keeps
working when the geocoder does not.

Both paths produce the same provisional marker — a position, optionally a name,
optionally a guessed type — which opens one form covering name, note, city,
type, link, and price. That same form edits an existing marker.

**Cities become something a person creates and files places under.**

- A city is created inline while saving a place, not on a separate screen.
- Selecting a city frames the map on its markers, biases search toward them, and
  becomes the default for the next place saved.
- A city carries an optional currency, and that is what denominates the prices of
  the markers filed under it. This settles a roadmap loose end: price has had no
  unit since the schema was written. Putting the unit on the city rather than on
  the trip means one trip can span two countries, and putting it on the city
  rather than on each marker means it is chosen once instead of sixty times.

**Markers can be edited and deleted**, by any member of the trip, from the same
surface that shows them.

**A commitment this change makes explicitly**: Photon becomes the geocoder. The
project has carried Photon and Nominatim as an open choice to be settled by the
first change that needs one. This is that change. Photon is chosen because it is
built for as-you-type querying and Nominatim's usage policy forbids it. The
public instance is free, needs no signup and no key, and so is inside the $0
constraint.

**Writing is web-only.** The roadmap's mobile step is deliberately a reader —
planning happens at a laptop, and the phone is for standing in a street during
the trip. Stating it here makes it a decision rather than something that merely
did not get built. The write functions take an already-constructed client and
return a discriminated result, exactly as `@pinpoint/auth` and the existing
reads do, so adding mobile capture later is a change to one application and not
to a package.

**Not in this change**, so that the boundary is on the record:

- Creating a trip, and adding people to one. Neither `trips` nor `trip_members`
  has an insert policy, and the schema records why: an insert policy cannot
  resolve to membership for a trip that has no members yet, so it needs a trigger
  making the creator the first member. That is its own change with its own
  decision. One seeded trip is enough for two travellers.
- Bulk import, per-member interest, and the filters — the next roadmap steps.
- Reverse geocoding. Nothing needs to turn a tapped point back into a place name.
- Removing the disposable Kyoto seed. It stays for now, deliberately.

## Capabilities

### New Capabilities

- `place-search`: querying a free geocoding service for candidate places, biasing
  the query toward where the person is working, turning a result into something
  that can become a marker, and behaving sanely when the service is slow, empty,
  or unreachable.
- `marker-capture`: the two ways a place gets onto the map, the provisional
  marker they both produce, the form that saves it, and editing and removing a
  marker afterwards.

### Modified Capabilities

- `markers`: a city gains an optional currency, and a marker's price is
  denominated by the currency of the city it is filed under. A marker's city must
  belong to the same trip as the marker — currently nothing enforces this, and
  this is the first change that writes a city reference from a client.
- `map-rendering`: framing currently happens once on opening and is never
  repeated, which a city selection has to be allowed to override. The map must
  also draw a provisional, unsaved marker distinguishably from saved ones.

## Impact

**New shared package** — `@pinpoint/geocode`. It takes a fetch function as an
argument the way `@pinpoint/auth` and `@pinpoint/data` take a client, so the
package itself reaches nothing platform-specific and its request building,
response parsing, and type guessing are testable without a network.

**`@pinpoint/data`** gains writes: creating, updating, and deleting a marker, and
creating and listing cities. Writes validate their input against the existing
`newMarkerSchema` and `newCitySchema`, which reads deliberately do not do.

**Database** — one migration: a currency column on `cities`, and a composite
foreign key so a marker's city cannot belong to another trip. The existing
row-level security policies already permit every write this change makes; they
were written against a real authenticated user and need no loosening.

**`apps/web`** — the search box, the drop mode, the marker form, the city
selector, and edit and delete affordances on the existing details panel.

**`apps/mobile`** — one small forced edit. Both applications currently render a
price as a bare number and neither knows cities exist, so the phone must start
reading cities purely to show a price with its currency. Without it the same
price reads differently on the two screens.

**Risk** — the public Photon instance has no service-level agreement and a usage
policy that a runaway as-you-type loop could offend. Mitigated by debouncing and
by cancelling superseded requests, and bounded by the fact that a failed search
degrades to tap-to-drop, which contacts nothing.
