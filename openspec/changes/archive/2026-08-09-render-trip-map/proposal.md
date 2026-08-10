# Render the trip map

## Why

The whole product is a map, and no map has ever rendered. Everything built so far —
the workspace, the portability boundary, the schema, authentication — exists to
support one, and none of it has been tested against the thing it was built for.

That makes this the change that retires the project's founding risk. `@pinpoint/map`
declares no runtime dependencies so that the same camera and style logic can drive
`maplibre-gl` on web and `@maplibre/maplibre-react-native` on native. Those are
different libraries with similar APIs, and similar is not the same. Until both render
from the same package, the boundary the build enforces is a hypothesis.

Everything after this depends on knowing the answer: adding markers, importing them
in bulk, and filtering them all assume a map exists to put them on.

## What Changes

- **Both applications render a map** of the signed-in person's trip, centred by the
  existing `fitBounds()`, with OpenStreetMap attribution visible.
- **Markers are drawn from the database**, each carrying the icon and colour its type
  implies. No adding, editing, or deleting — this change is read-only.
- **A new `@pinpoint/tokens` package.** Family colours are the first values both
  applications need to agree on, which is the condition the `styling` spec sets for
  creating one.
- **`@pinpoint/map` gains a marker view descriptor** — a pure function turning a
  domain marker into what a renderer needs. Each app renders the descriptor rather
  than deciding presentation for itself.
- **Selecting a marker shows what was recorded about it** — name, note, link, price,
  type. A map you cannot interrogate is a constellation of anonymous dots. Each
  platform presents this in its own idiom; only the fields are shared.
- **Markers sharing identical coordinates are made reachable.** A geocoder answering
  with a building's centre point can give two markers the same position, and the one
  drawn underneath is otherwise unclickable at every zoom level. Selecting such a point
  offers the markers there to choose between.
- **Loading and failure are distinguishable from emptiness.** A map still loading and a
  trip with no markers both render as an empty map, and "you have not saved anything"
  is very different from "this is broken". The async state is shared; the spinner is
  not — sharing rendered markup is what the `styling` spec forbids.
- **The mobile app moves to a development build.** `@maplibre/maplibre-react-native`
  contains native code, which Expo Go cannot load.
- **Seed data**: one city and roughly sixteen Kyoto markers, so the map has something
  to draw. Explicitly disposable — the write path replaces it with real entries.

Not in this change: adding or editing markers, place search, cities as an interface,
per-member interest, filtering, and offline tiles.

The map deliberately has no concept of a city. It holds a camera and a set of markers;
a city filter, when it arrives, changes what is passed in rather than how anything
draws. That keeps this change from building a structure the next one has to dismantle.

## Capabilities

### New Capabilities

- `map-rendering` — what a rendered map shows, how markers are drawn, what stays
  shared between platforms, and what happens when markers coincide.

### Modified Capabilities

None. `styling` already specifies what happens when the first shared colour appears;
this change satisfies that requirement rather than changing it. `markers` describes
the data model, which is unchanged — this change only reads it.

## Impact

- **New package** `packages/tokens/`, platform-neutral values with no dependencies.
- **`@pinpoint/map`** gains the descriptor function and a dependency on
  `@pinpoint/tokens`. It keeps declaring no *runtime* dependency outside the
  workspace, which is the property that matters.
- **`apps/web`** adds `maplibre-gl`, and `@pinpoint/tokens` to `transpilePackages`.
- **`apps/mobile`** adds `@maplibre/maplibre-react-native` and stops running under
  Expo Go. `pnpm dev:mobile` changes meaning, and the README instructions change with
  it.
- **`supabase/migrations/`** gains a disposable seed.
- **Shared query functions** for reading a trip's markers, following the
  `@pinpoint/auth` shape: take an already-constructed client, return a discriminated
  result. Whether they live in `@pinpoint/supabase` or a package of their own is
  settled in design.
- **`apps/web`** gains route-level loading and error boundaries, which it currently has
  none of; **`apps/mobile`** consolidates the `loading` flag it already re-derives in
  two screens.
- **Possible move**: `marker-type.ts` currently sits in `@pinpoint/core`, but icons
  and families are presentation data. It may belong beside the descriptor function in
  `@pinpoint/map`. Decided in design, not here.
- **Cost**: still none. Local device builds and simulators are free; the Apple
  Developer Program is only required to put the app on someone else's phone for
  longer than a week, which this change does not do.
