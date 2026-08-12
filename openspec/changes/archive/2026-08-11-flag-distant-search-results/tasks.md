## 1. @pinpoint/map

- [x] 1.1 Add `distanceKm(a, b)` — great-circle distance between two `LngLat` points — beside `boundsOf` and `fitBounds`, and export it.
- [x] 1.2 Tests: a known short distance, a known intercontinental one, identical points as zero, symmetry, and a pair spanning the antimeridian (where naive longitude subtraction gives an answer most of the way round the planet).

## 2. @pinpoint/geocode

- [x] 2.1 Add `distanceKm: number | null` to `PlaceCandidate`, stamped by `toCandidates` from the bias point, null when no bias was supplied.
- [x] 2.2 Thread the bias through `searchPlaces` to `toCandidates` — it already has it for the request and currently drops it after building the URL.
- [x] 2.3 Tests: a candidate with a bias carries a plausible distance; without a bias carries null; a real far-away fixture carries a large one.

## 3. Web

- [x] 3.1 Show the distance on each result in the search list, formatted for the magnitude — a nearby place does not want the precision a distant one needs.
- [x] 3.2 Mark a candidate beyond the threshold so it is distinguishable while scanning. Marked, never removed.
- [x] 3.3 Show nothing where the distance is null, rather than a zero or a dash that reads as a measurement.

## 4. Verification

- [x] 4.1 Search "Parque Suigetsu" with a Kyoto or Osaka marker selected. It must still be offered, and must show thousands of kilometres, marked.
- [x] 4.2 Search a place actually nearby. Its distance is muted grey rather than red — the mark is the emphasis on the distance itself, not a separate badge.
- [x] 4.3 Not reachable through the interface, and that is correct. Choosing "All
      places" does not remove the bias — it falls back to the map's viewport
      centre, which is set as soon as the map exists — so there is always a
      reference point, and losing it would mean losing locality entirely. The
      null case is defensive, for the instant before the map reports where it is
      looking, and is covered by a unit test rather than by looking.

## 5. Closing

- [x] 5.1 `pnpm lint`, `typecheck`, `test`, `build`, `check:cycles`, `check:specs` all green.
- [x] 5.2 Note in `openspec/ROADMAP.md` that query cleanup — stripping notes and parentheses, which recovered seven of thirteen failures in the sample — belongs to bulk import rather than to interactive search.
