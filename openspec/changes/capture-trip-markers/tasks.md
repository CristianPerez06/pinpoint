## 1. Database

- [x] 1.1 Query for markers whose `city_id` references a city belonging to a different trip. Expected to return nothing; unassign any that come back before adding the constraint.
- [x] 1.2 Write the migration: `unique (id, trip_id)` on `cities`; drop `markers_city_id_fkey` and recreate it over `(city_id, trip_id)` with `on delete set null (city_id)`; add `cities.currency text` nullable, checked as three uppercase letters.
- [x] 1.3 Apply it and confirm the guarantee this constraint nearly broke: deleting a city that still holds markers unassigns them rather than failing. If the column-list form is rejected, fall back to the trigger described in design.md.
- [x] 1.4 Regenerate `packages/supabase/src/database.types.ts` so `cities.currency` is typed.

## 2. @pinpoint/core

- [x] 2.1 Move `FieldErrors` and the zod-issues-to-field-errors conversion out of `@pinpoint/auth` into `@pinpoint/core`; have auth consume it. Auth's existing tests must still pass untouched.
- [x] 2.2 Add `currency` to `citySchema` and `newCitySchema` — nullable, three uppercase letters — and add a patch schema covering a city's name and currency.
- [x] 2.3 Add `formatPrice(amount, currency | null)`. Tests: a known currency, a null currency (bare amount, no symbol invented), zero, and a well-formed code `Intl` does not recognise.
- [x] 2.4 Add a marker patch schema for edits, derived from `newMarkerSchema` so the two cannot drift.

## 3. @pinpoint/geocode

- [ ] 3.1 Create `packages/geocode` with its manifest declaring only `@pinpoint/map`, and a package comment recording why this package may perform network I/O when `@pinpoint/map` may not.
- [ ] 3.2 `buildSearchUrl` — `q`, `lat`, `lon`, `zoom`, `location_bias_scale`, `limit`, `lang`. Test that `bbox` is never sent, because it filters where the spec requires ranking.
- [ ] 3.3 `toCandidates` — parse the FeatureCollection. Tests: a named place; an address with no `name` (synthesised from `housenumber`/`street`); a feature with no geometry (dropped, batch survives); unknown extra properties (ignored); malformed JSON (no throw).
- [ ] 3.4 `guessMarkerType` — `osm_value` first, then `osm_key`, then `FALLBACK_MARKER_TYPE`. Tests including an unmapped value, which must still yield a usable candidate.
- [ ] 3.5 `searchPlaces(fetcher, query, bias)` returning a discriminated result. Tests with a fixture fetcher: success, non-2xx, thrown, aborted.
- [ ] 3.6 Export the package surface, add it to the workspace, and confirm `pnpm check:cycles` still passes.

## 4. @pinpoint/data writes

- [ ] 4.1 Add `WriteOutcome<T>` alongside the existing query states, carrying the written row on success.
- [ ] 4.2 `createMarker`, `updateMarker`, `deleteMarker` — validating input, unlike the reads beside them.
- [ ] 4.3 `fetchTripCities`, `createCity`, `updateCity`, `deleteCity`.
- [ ] 4.4 Tests: a valid create returns the row; invalid input returns field errors and issues no request at all; a refused write returns a message that is not the database's error text.

## 5. Web — cities and framing

- [ ] 5.1 Fetch the trip's cities on the page and pass them to the map alongside the markers.
- [ ] 5.2 City selector reading and writing `?city=<id>`, with absent meaning all cities.
- [ ] 5.3 Re-frame on city selection through the shared `fitBounds`. A city holding no markers must leave the camera where it is.
- [ ] 5.4 Confirm nothing else moves the camera: pan away, save a marker, and verify the view stays put.

## 6. Web — search

- [ ] 6.1 Search box that queries after a pause rather than per keystroke, and aborts a superseded request.
- [ ] 6.2 Derive the focus point from the selected city's markers via `boundsOf`, falling back to the viewport centre when no city is selected or it holds no markers.
- [ ] 6.3 Render searching, no matches, and unavailable as three visibly distinct states.
- [ ] 6.4 Choosing a candidate produces the unsaved marker with its name and guessed type pre-filled.

## 7. Web — dropping and the form

- [ ] 7.1 Arm and disarm drop mode. Panning, zooming, and selecting an existing marker must create nothing.
- [ ] 7.2 Draw the unsaved marker distinguishably and above saved markers, draggable, excluded from framing and from anywhere markers are counted.
- [ ] 7.3 The marker form — name, note, city, type, link, price — with name and position required and blank optional fields stored as absent.
- [ ] 7.4 Create a city from inside the form without losing the place being added; the new city is selected for it.
- [ ] 7.5 On success apply the returned row to client state so the marker draws without a reload. On rejection keep every typed value and the marker's position.

## 8. Web — editing and removing

- [ ] 8.1 Edit affordance on the details panel, reusing the same form prefilled from what is stored.
- [ ] 8.2 Remove a marker behind a confirmation that says it cannot be undone.
- [ ] 8.3 Rename a city, set or change its currency, and remove one — the removal confirmation naming how many markers it will unassign.

## 9. Mobile

- [ ] 9.1 Fetch cities and render each price through `formatPrice` with its city's currency.
- [ ] 9.2 Confirm no add, edit, or remove affordance reached mobile, and that every marker written from web reads correctly.
- [ ] 9.3 Verify `Intl.NumberFormat` currency formatting on an actual device. If Hermes gets it wrong, fall back to `CODE amount`.

## 10. Verification pass

The last change shipped five defects that typechecked, rendered, and were wrong.
These are done by opening the apps and looking, not by reading the diff.

- [ ] 10.1 Search a real place, add it, and see it drawn without a reload.
- [ ] 10.2 Drop a pin, drag it somewhere else, save, reload — the stored position is where it was left, not where it first appeared.
- [ ] 10.3 Create a city inline, give it a currency, and confirm its markers' prices show it while an unassigned marker's price stays bare.
- [ ] 10.4 Edit a marker and delete another; read the confirmation copy as a stranger would.
- [ ] 10.5 Exercise all three search states, including with the network actually offline — a failure must not read as "no matches".
- [ ] 10.6 Delete a city that still holds markers and confirm they survive, unassigned.
- [ ] 10.7 Open the trip on mobile: prices carry their currency, markers still read, and nothing offers to edit.

## 11. Closing

- [ ] 11.1 `pnpm lint`, `typecheck`, `test`, `build`, and `check:cycles` all green.
- [ ] 11.2 Record in `AGENTS.md` anything the build taught that the next person would otherwise rediscover — the column-list `SET NULL` requirement is already a candidate.
- [ ] 11.3 Update `openspec/ROADMAP.md`: move the write path into Done, strike the `price` currency loose end, and correct the line claiming the geocoder answers the assign-a-city step, which this change decided against.
