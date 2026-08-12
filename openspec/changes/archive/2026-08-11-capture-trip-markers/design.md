## Context

See `proposal.md` — Why. What follows is the state this design has to fit into.

`@pinpoint/data` reads and does not write. Its functions take an already-built
client and return `SettledQueryState<T>` — `ready`, `empty`, or `failed` — and
they deliberately do not validate rows on the way in, so that a `type` written by
a newer version of the app cannot take a whole trip's markers down.

`@pinpoint/auth` established the shape everything shared follows: take a
constructed client, return a discriminated result, never throw for an ordinary
outcome, and never touch anything that resolves on only one platform. Its
`Validatable<T>` interface is the precedent for describing a dependency
structurally rather than importing it.

The web app already has both clients wired: `lib/supabase/server.ts` for server
components and `lib/supabase/client.ts` (`createBrowserClient`) reading the same
cookie session. The trip page renders on the server and hands markers to
`TripMap`, a client component.

The database is Postgres 17 (`supabase/config.toml`). Every write this change
makes is already permitted by policy — `markers` and `cities` each carry insert,
update, and delete policies resolving to `is_trip_member(trip_id)`, with
`with check` on both insert and update.

## Goals / Non-Goals

**Goals**

- One capture path that both entry methods converge on, so the form, validation,
  and failure handling exist once.
- A geocoder integration whose interesting parts — request shape, response
  parsing, type guessing — are pure and testable without a network.
- Writes that are usable unchanged from mobile whenever mobile wants them.
- A currency that is impossible to display incorrectly, at the cost of sometimes
  displaying nothing.

**Non-Goals**

- Converting between currencies, ever. Amounts are transcribed from menus and
  ticket prices; a conversion invents precision and goes stale the day it is
  written.
- Detecting or resolving concurrent edits. There is no `updated_at` on a marker
  to compare against, and adding one to serve two travellers would be building
  the machinery before the problem.
- Self-hosting the geocoder. It is the answer if the public instance becomes
  unusable, and it is not free of effort, so it is not proposed until it is
  needed.

## Decisions

### The geocoder is Photon's public instance, queried from the browser

`https://photon.komoot.io/api`. Free, no signup, no key, no billing — inside the
$0 constraint, which is why the project carried Photon and Nominatim as an open
choice rather than picking a metered service. Photon over Nominatim because
Photon is built for search-as-you-type and Nominatim's usage policy forbids it.

Queried directly from the browser rather than proxied through a Next route
handler. The instance sends CORS headers, so a proxy would add a round trip to
the one interaction in the product where latency is felt, and would buy nothing:
there is no credential to hide, and no cache worth maintaining for two people.

**Alternative considered — proxy through the web app.** It would let one place
enforce rate limiting and add a shared cache. Both are worth having at a scale
this product does not reach, and neither is worth a round trip per keystroke now.
Revisit if the instance starts throttling.

### Bias by focus point, never by bounding box

Photon offers both: `lat`/`lon` with `zoom` (default 12) and
`location_bias_scale` (0.0–1.0, default 0.4) rank results near a point, while
`bbox` *excludes* everything outside a box.

The specification requires bias to affect ranking only, so that a day trip to a
neighbouring city stays findable. That rules `bbox` out. Requests carry
`lat`/`lon` derived from the selected city's markers, `limit`, and `lang`.

The focus point comes from the centre of the selected city's markers, computed
with the existing `boundsOf` from `@pinpoint/map` — no new geometry, and nothing
resolves the city's *name* to a position. A city is a label a person chose for a
group of pins; the pins already say where the group is. With no city selected, or
one holding no markers, the focus point is the centre of the current viewport,
which the map already knows.

### `@pinpoint/geocode` is a new package that takes a fetch function

It owns three things, of which two are pure:

```
  buildSearchUrl(query, bias, options)        pure
  toCandidates(unknown JSON)                  pure
  guessMarkerType(osm_key, osm_value)         pure
  searchPlaces(fetch, query, bias)            the one impure function
```

The fetch function is a parameter, described structurally the way
`@pinpoint/auth` describes `Validatable<T>`:

```ts
interface Fetcher {
  (url: string, init?: { signal?: AbortSignal }): Promise<{
    ok: boolean
    status: number
    json(): Promise<unknown>
  }>
}
```

Global `fetch` satisfies it on both platforms without the package importing DOM
types or declaring a dependency, and tests pass a function that returns a fixture
instead of stubbing a global.

The package depends on `@pinpoint/map` for `MARKER_TYPE_IDS` and
`FALLBACK_MARKER_TYPE`. Direction is fine — `map` sits at the base and takes no
workspace dependency in return.

**Alternative considered — put it in `@pinpoint/data`.** Rejected: everything
there takes a Supabase client and touches trip data. Photon takes neither, and
the mixed metaphor would make the package's rule ("takes a client, returns a
discriminated result") stop being true of all of it.

**Alternative considered — call global `fetch` directly.** Shorter, and it is
genuinely universal now. Rejected because the injected form matches the two
packages already established and makes the tests trivial, which is where the
value of this package actually is.

### A candidate's name is synthesised when Photon does not supply one

`properties.name` is absent for pure address results — a house number on a street
has `street` and `housenumber` and no name. The specification requires every
candidate to carry a name, so the package derives one: `name`, else
`housenumber street`, else `street`, else the first non-empty of `city`, `state`,
`country`. A candidate that yields nothing at all is dropped rather than offered
nameless.

### Type guessing is a table keyed on `osm_value`, falling back through `osm_key`

Photon returns an OSM tag pair per feature — `osm_key: "amenity"`,
`osm_value: "restaurant"`. Mapping is a lookup on `osm_value` first (specific:
`restaurant`, `cafe`, `bar`, `museum`, `viewpoint`, `castle`, `hotel`), then on
`osm_key` (coarse: `tourism`, `shop`, `railway`), then `FALLBACK_MARKER_TYPE`.

The table is deliberately partial. OSM's vocabulary has thousands of values and
will grow without this repository being told; the specification therefore forbids
rejecting or degrading a candidate for an unrecognised classification, and the
guess is a pre-selection the person overrides.

### Writes join `@pinpoint/data` with an outcome type, not a query state

`SettledQueryState<T>` has an `empty` case that means nothing for a write. Writes
return the shape `@pinpoint/auth` already uses, extended to carry the row back:

```ts
export type WriteOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'invalid-input'; fieldErrors: FieldErrors }
  | { ok: false; kind: 'rejected'; message: string }
```

Returning the created row is what lets the map draw the new marker without
re-fetching the trip, which the specification requires.

Unlike reads, writes **do** validate — against the existing `newMarkerSchema` and
`newCitySchema` in `@pinpoint/core`. The asymmetry is intentional and already
documented in `packages/data/src/markers.ts`: reads must tolerate a value a newer
version wrote, writes are where a bad value is stopped from being written.

`FieldErrors` and the zod-issues-to-field-errors conversion currently live in
`@pinpoint/auth`. They move down into `@pinpoint/core`, which both packages
already depend on, and `@pinpoint/auth` re-exports or imports them. This is the
one edit this change makes to a package it otherwise has no business in; the
alternative is a second copy of the same twelve lines.

### Writes are issued from the browser client, not from server actions

Authentication uses server actions because a session has to be written to a
cookie, which only a server can do. A marker write has no such requirement: the
browser client carries the same cookie session, row-level security is the
authorization either way, and there is no secret involved.

Going through a server action would mean a round trip plus `revalidatePath`,
which re-fetches every marker on the trip to add one. Writing from the client
lets `TripMap` — which already owns the marker list for the current render —
apply the returned row directly.

The marker list therefore becomes client state seeded from the server render,
rather than a value the server owns outright. That is the real cost of this
decision and it is worth naming.

### The selected city lives in the URL

`?city=<id>` on the trip page. It survives a reload, it is linkable, and it keeps
the selection out of a context provider that three components would have to reach
into. Absent means all cities.

### Drop mode and the unsaved marker are web application state

Neither belongs in a shared package: an unsaved marker is not a `Marker`, it has
no id, and it exists only for as long as a form is open. `@pinpoint/map` describes
saved markers; the web app draws the unsaved one itself, above the marker layer,
using `draggable: true` on the underlying renderer.

### Price formatting is one pure function in `@pinpoint/core`

`formatPrice(amount, currency | null)` next to `markerSchema`, because both
applications must format identically and the rule is a property of the domain
type. It uses `Intl.NumberFormat` with `style: 'currency'` when a currency is
present, and returns the bare amount when it is not — never a guessed symbol.

Currency is stored as an ISO 4217 three-letter code, validated as three uppercase
letters. The form takes a short text input rather than a picker: a list of 180
currencies is a lot of interface for a value set once per city.

### The composite foreign key uses Postgres 17's column-list `SET NULL`

Enforcing that a marker's city belongs to the marker's trip means a composite
foreign key on `(city_id, trip_id)`. The obvious form breaks an existing
guarantee: plain `ON DELETE SET NULL` nulls *every* referencing column, and
`markers.trip_id` is `NOT NULL`, so deleting a city that still had markers would
fail — contradicting the `markers` spec, which requires those markers to survive
and become unassigned.

Postgres 15 added `ON DELETE SET NULL (column_list)`, and this database is 17, so
the constraint names the column to null:

```sql
alter table public.cities
  add constraint cities_id_trip_key unique (id, trip_id);

alter table public.markers
  drop constraint markers_city_id_fkey,
  add constraint markers_city_id_fkey
    foreign key (city_id, trip_id)
    references public.cities (id, trip_id)
    on delete set null (city_id);
```

**Alternative considered — a `BEFORE INSERT OR UPDATE` trigger.** Works on any
version and reads plainly, but it is procedural where a constraint is
declarative, and it would not be enforced by the planner or visible in the
schema. Kept as the fallback if the column-list form turns out to be unavailable.

### The existing Kyoto city gets no currency backfill

The seeded markers' prices are yen, and it would be one line to say so. It is not
worth a permanent migration depending on data that a disposable migration created
and a later change deletes. Kyoto shows bare amounts until someone sets its
currency in the interface, which the specification already allows.

## Risks / Trade-offs

**The public Photon instance throttles or bans extensive use, and gives no
availability guarantee.** → Debounce so a request follows a pause rather than a
keystroke, abort superseded requests, and cap `limit`. The real mitigation is
structural: a dead geocoder degrades to tap-to-drop, which contacts nothing, so
losing search costs a convenience rather than the feature.

**Photon may change its response without notice.** → Parse tolerantly. Unknown
properties are ignored, a feature missing a name or geometry is dropped rather
than failing the batch, and a response that cannot be parsed at all surfaces as
"search unavailable" — never as a crash and never as "no matches".

**`Intl.NumberFormat` with `style: 'currency'` depends on ICU data, which is
thinner on Hermes than in a browser.** → If the phone renders a currency
incorrectly or throws, fall back to `CODE amount` (`JPY 500`). Verify on the
device rather than assuming; this is exactly the class of defect the last change
found only by opening the app and looking.

**The composite foreign key will refuse to be created if any existing marker
already points at another trip's city.** → There is one trip, so this is almost
certainly a no-op, but the migration is written to check first and the
verification is a task rather than an assumption.

**Marker state moves from the server to the client.** → The trip page still
fetches on the server and passes the result down, so the first paint is
unchanged; only subsequent mutations are client-owned. If this becomes tangled,
the escape is a server action plus `revalidatePath`, which is a contained
reversal.

**Last write wins, silently.** → Accepted. Two travellers editing the same field
of the same marker within seconds of each other is not a situation worth
machinery, and the cost of losing is retyping one field.

## Migration Plan

One migration, additive except for swapping one foreign key:

1. Verify no existing marker references a city of another trip. This is expected
   to return zero rows; if it does not, the offending markers are unassigned
   before the constraint is added.
2. Add `unique (id, trip_id)` on `cities` — required as the target of a composite
   foreign key.
3. Drop `markers_city_id_fkey` and recreate it over `(city_id, trip_id)` with
   `on delete set null (city_id)`.
4. Add `currency text` to `cities`, nullable, checked as three uppercase letters.

**Rollback**: drop the composite constraint, restore the single-column foreign
key with plain `on delete set null`, drop the column. No data is destroyed at any
step, so rollback loses only whatever currencies had been set.

No application deploy ordering is required: every column added is nullable and
every existing query keeps working, so the migration is safe to apply before the
application that uses it ships.

## Open Questions

- The exact `zoom` and `location_bias_scale` values for the focus point.
  Photon's defaults are 12 and 0.4, which correspond roughly to city scale, and
  they are a starting point to tune by using it. Changing them alters no
  specification, no interface, and no task.
- Whether `limit` should be 5 or 10 candidates. A judgement about how long a list
  is useful before it is noise, best made with the list in front of you.
