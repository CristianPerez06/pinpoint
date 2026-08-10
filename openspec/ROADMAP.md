# Roadmap

What pinpoint is being built toward, in what order, and why that order. This is
planning context, not a specification — `openspec/specs/` holds the rules in force.

## What this replaces

A spreadsheet with one tab per city. Columns: Name, Description, Neighborhood, a
column per traveller marked with an X, and Price.

Two of those columns are the whole product:

- **Neighborhood** is not a location field. It is a proximity proxy — it exists to
  answer "can we do these three in one afternoon?". **That is the column the map
  replaces.** City stays as an explicit field, because it answers a different and
  coarser question: which day are we spending where.
- **The per-person X columns** are the feature that beats the spreadsheet at
  planning, not just at location. Two people marking interest independently makes
  "show me the places we *both* want to go" a filter instead of a squint.

## Done

- **Monorepo skeleton** — two apps, shared packages, portability boundary enforced
  by the build.
- **Auth and schema** — accounts, members, five tables, row-level security on every
  one. Sequenced first so every policy was written once against a real
  authenticated user, rather than permissively and tightened later.
- **The map renders** — both applications draw a trip's markers from one
  zero-dependency `@pinpoint/map`, read-only. This was the founding bet and it
  holds: `@maplibre/maplibre-react-native` takes the same style **URL** as
  `maplibre-gl`, so there is one style source rather than two, and `fitBounds`
  needed no change for either renderer. Mobile left Expo Go for a development
  build, which is also where the Apple Developer Program cost arrives if iOS ever
  ships to somebody else's phone.

  Three defects only surfaced by opening the apps and looking — markers drifting
  off their coordinates on zoom, taps on a pin doing nothing on iOS, and the tile
  worker 404ing so pins floated over a blank canvas. Each typechecked, rendered,
  and was wrong. Budget for looking, not just for building.

## Next

### 1. Write path

Photon search plus tap-to-drop on the map. Cities, types, link, price.

Photon rather than Nominatim: Photon is built for as-you-type, Nominatim's usage
policy is not. Bias the query to the active city — hit rates go up sharply and the
"assign a city" step disappears, because the geocoder already answered it.

Tap-to-drop is not a fallback. Small restaurants are frequently absent from OSM
under their popular name, so for food it will be the primary path.

**After this change the app can replace the spreadsheet.** Not before.

### 2. Bulk import

Paste a list of names per city, geocode them all, confirm the ambiguous ones.

This looks like a nicety and is not. The app is worth *less* than the spreadsheet
until it holds everything — a half-migrated trip means checking two places, and
"is anything else nearby?" returns a wrong answer. Adding sixty places one at a
time is the difference between adopting this and going back to the sheet.

### 3. Interest and filters

Per-member interest, visited, and the filter that motivates the whole project:
**Both / Either / Only one of you / Nobody yet**.

"Nobody yet" is the triage pile — invisible in a spreadsheet, obvious here.

Arguably the highest-value change, and deliberately not first: it is worthless
until there is data, and the two steps above are what put data in.

### 4. Mobile reader

Map, filters, mark visited, and **what's near me right now** — the one thing a
spreadsheet fundamentally cannot do.

No add flow, no editing. Planning happens at a laptop; the mobile app is for
standing in a street during the trip. That asymmetry makes it a fraction of the
work of a second full client.

## Decisions that shape all of the above

- **Wishlist, not itinerary.** The broken dimension is *where*, not *when*. If days
  ever arrive they arrive as a second, independent grouping — a marker can be
  "Kyoto" *and* "day 3" — never as a level underneath City. Trip planners that grew
  day-scheduling did it for strangers, not for a trip.
- **List and map are co-equal.** A map answers "what is near what"; a list answers
  "what do we have". Losing fast scanning and fast entry would make this worse than
  the tool it replaces.
- **Types are a design system, not user data.** Colour is carried by five fixed
  families, icons by a growable type list. That is what lets the list expand without
  the map degrading into confetti.
- **Members are not users.** A member exists before the account does. Everything
  attributed to a person points at the member, so an account arriving later fills in
  one column instead of rewriting every attributed row.

## Settled

- **Pin legibility.** Sixteen drawn points across Kyoto read clearly at city zoom on
  both a laptop and a phone, so no clustering. The density problem was always text,
  not geometry — which is why the `map-rendering` spec forbids permanently labelling
  every marker instead of requiring clustering. Revisit in the high hundreds per
  view, which this product will not reach.
- **Markers on one point.** Identical coordinates are the same pixel at every zoom,
  so the pin underneath is unreachable forever. Badged with a count, and selecting it
  offers the markers there to choose between. Stored positions are never moved.

## Loose ends

- [ ] No CI guard that every table has row-level security enabled. A migration that
      forgets it ships a wide-open table and nothing catches it. Static check over
      `supabase/migrations/*.sql`; needs no database.
- [ ] `monorepo-structure` and `styling` specs still carry `TBD - created by
      archiving` purposes.
- [ ] Cross-trip isolation is untested — verifying that a member of trip A is
      refused trip B needs a second trip to exist.
- [ ] Password recovery is a dashboard operation. Fine at two users.
- [ ] Email confirmation is off, so sign-up is open to anyone who finds the URL.
      They see nothing without a membership, but the account exists. Revisit before
      the app has a public address.
- [ ] `price` has no currency. Correct for one trip, wrong for the second — and the
      write path is where a price first gets typed, so that is the moment to decide.
- [ ] A failing tile service is unhandled. If OpenFreeMap is unreachable the map is a
      blank canvas with correctly-placed pins and no explanation — the same symptom as
      a bug already fixed once, from a different cause. Nothing in `map-rendering`
      covers it.
- [ ] `AGENTS.md` says this repo merges with `git merge --no-ff`, but recent merges
      have been squashes. Reconcile the document with the practice, either way.

## Open design questions

- **Pin legibility.** Twenty-five markers in Kyoto with six stacked on one temple
  complex. Clustering, labels only at high zoom, or something else? This decides
  whether the map is pleasant or a mess, and it is worth settling before building
  rather than after.
- **Where do saved places come from?** If mostly Instagram and YouTube, the link
  field matters more than the description, and "why did we save this" becomes the
  primary question a marker answers.
- **Offline maps.** Protomaps `.pmtiles` to carry a country in one file. Genuinely
  useful underground and on unreliable data, and uncommitted — propose only when a
  change actually needs it.
