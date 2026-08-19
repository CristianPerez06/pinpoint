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

- **The write path** — search, drop, edit and remove, with cities as the grouping.
  **The app can now replace the spreadsheet.** Photon is settled as the geocoder,
  and writing is web-only by decision: the shared write functions are usable from
  either platform, and only the phone declines to offer them.

  Two things turned out differently from the plan. Cities are a name somebody
  chose for a cluster of pins, not a geographical fact — so nothing resolves a
  city's name to a position, and search biases toward the markers already filed
  under it, which say where the group is. That killed the idea below that the
  geocoder answers the "assign a city" question; it can suggest, and the person
  decides.

  And the bias is a focus point, never a bounding box. Photon offers both, and
  only the first ranks rather than excludes — a trip is mostly day trips, and the
  place an hour away has to stay findable.

  Budget for looking held again: three more defects surfaced only by opening the
  apps. One of them was a specification defect first — the camera refused to move
  to a searched place, because the rule had been written for pinning a pointed
  position and applied to both.

- **Interest and filters** — per-member interest, visited, and the filter that
  motivates the whole project. **The app now beats the spreadsheet at planning,
  not just at capture**, which was the point of the whole exercise.

  The vocabulary above did not survive contact. **Both / Either / Only one of you
  / Nobody yet** was written for two travellers, and every attempt to put it on
  screen was rejected on sight — twice. What shipped is a list of the people on
  the trip: tick names, get the places they all want. The four named piles turned
  out to be that question asked about everybody, so nothing was lost by dropping
  the names, and a trip of three can now ask about two of them, which fixed
  choices could never express.

  Two piles did not survive. "Either of you" is a longer list than no filter at
  all on a two-person trip. "Only one of you" — the disagreement pile — is a real
  loss and is recorded below, because no way of offering it fitted a list of
  people without reintroducing the second control that made the rejected attempts
  confusing.

  Budget for looking held a third time, and harder: three defects passed
  `typecheck`, `lint` and `build` untouched — a CSS class resolving to the literal
  string `"undefined"`, a detail card rendering a marker from a stale snapshot,
  and a map crashing to its error boundary because a ref survived a hot reload
  while the code that built it did not. Two were caught by reading, one only by
  clicking. Static checks have now been green over a real defect on three
  consecutive changes.

## Next

### 1. Mobile reader

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
- **What a price is denominated in.** The currency sits on the **city**, not the trip
  and not the marker: on the city so one trip can cross a border, on the city rather
  than each place so it is said once instead of sixty times. A city with no currency
  shows a bare amount and nothing is assumed — a price in the wrong currency is worse
  than one in none, because it looks correct. Moving a marker between cities never
  converts the stored amount; the number was transcribed off a menu.
- **Who the geocoder is.** Photon, the free public instance, held open until a change
  needed it. If it ever requires paying, search is withdrawn rather than billed —
  survivable only because dropping a pin contacts nothing, which is the real reason
  that path is primary rather than a fallback.

- **Bulk import is not a feature.** It was step one here for a long time, on the
  argument that the app is worth less than the spreadsheet until it holds
  everything. That argument is about a *migration* — one existing sheet, moved
  once — and a migration is not a product capability. Nobody pastes sixty places
  twice; after the move, places arrive one at a time, from a recommendation or a
  video, which is what the write path is for. Getting the first trip in is a
  sitting at a keyboard or a throwaway script, and neither earns permanent
  interface.

  The measurement is worth keeping even though the step is gone. Thirty-five real
  Osaka places through the geocoder: twenty-two resolved, six came back
  confidently wrong — 270 km to 16,187 km away — and seven found nothing. The
  failures were not obscure places but the notes written beside them; "Parque",
  "Templo", "Barrio" and "Tienda" are what matched, and they pulled the search to
  Spanish-speaking countries. Stripping those words and the parenthetical asides
  recovered seven of the thirteen.

  Two things follow. A pasted list would need a review step rather than trusting
  the geocoder, because a wrong match looks exactly like a right one. And the
  reason interactive search now shows how far away each result is, is that this
  is the only fact distinguishing them.

## Loose ends

- [ ] No CI guard that every table has row-level security enabled. A migration that
      forgets it ships a wide-open table and nothing catches it. Static check over
      `supabase/migrations/*.sql`; needs no database.
- [ ] `monorepo-structure` still carries a `TBD - created by archiving` purpose.
      `styling` had one too, replaced when the visual language landed.
- [ ] Cross-trip isolation is untested — verifying that a member of trip A is
      refused trip B needs a second trip to exist.
- [ ] Password recovery is a dashboard operation. Fine at two users.
- [ ] Email confirmation is off, so sign-up is open to anyone who finds the URL.
      They see nothing without a membership, but the account exists. Revisit before
      the app has a public address.
- [ ] The disposable Kyoto seed migration is still applied. It was kept deliberately so
      there was something to look at; deleting it now needs the rows gone as well as
      the file, since removing a migration leaves the remote's history untouched.
- [ ] A long note is clipped rather than scrolled in the mobile detail sheet. The sheet
      sizes to its content, and a `ScrollView` inside a content-sized parent collapses;
      the fix is a sheet with a real height, which is its own change.
- [ ] Concurrent edits are last-write-wins with no way to detect a collision — there is
      no `updated_at` on a marker to compare. Correct at two travellers, and the thing
      to revisit before there are more.
- [ ] Creating a trip and inviting people is still impossible from the product.
      Neither `trips` nor `trip_members` has an insert policy, and the schema records
      why: an insert policy cannot resolve to membership for a trip with no members, so
      it needs a trigger making the creator the first member.
- [ ] `README.md`'s "Status" describes a product two changes ago. It says "No writing
      yet" when markers can be added, edited and deleted, and it says both platforms
      take the same style **URL** — which stopped being true when the themed basemap
      landed, because the document is now fetched and patched before either renderer
      sees it. That URL claim is the founding portability argument, so stating it
      wrongly misrepresents the thing the repository exists to demonstrate.
- [ ] `README.md`'s "A new native dependency means another native build" understates
      how it fails. It promises "a missing native component" message; adding
      `react-native-svg` and `expo-font` instead produced `EXC_CRASH (SIGABRT)` at
      launch with no JavaScript error, no red screen and a clean Metro log, because the
      generated codegen artifacts and the Pods project had drifted apart. Roughly a day
      went into diagnosing it. Worth saying plainly that a stale build can crash inside
      Hermes or React's C++ and look nothing like a dependency problem, and that the
      fix is `pod install` plus clearing DerivedData — not an incremental rebuild.
- [ ] The approved look-and-feel mockup no longer matches what shipped. Two deviations
      were agreed while building — the mobile detail sheet is a plain positioned view
      rather than a draggable sheet with detents, and web keeps its existing layout
      rather than the list rail — and the published artifact still shows the original.
      Republish rather than mint a new URL.
- [ ] No way to see the places you disagree about. Ticking names asks for agreement,
      and there is no tick meaning "and not the other" — so "only one of you wants
      this", the negotiation pile, is the one thing the rejected filter designs could
      express and the shipped one cannot. Revisit once it has been missed in real use
      rather than in anticipation; the predicate is a pure function in
      `@pinpoint/core`, so the cost is a control, not a model.
- [ ] Six Expo packages lag the SDK: `expo` 57.0.9 against ~57.0.12, plus
      `expo-router`, `expo-constants`, `expo-dev-client` and `expo-linking`
      (`npx expo install --check` lists them). Worth doing deliberately, with a clean
      rebuild afterwards, rather than picking them up incidentally alongside other
      work — see the codegen loose end above for why.

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
