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

- [ ] 4.1 Search "Parque Suigetsu" with a Kyoto or Osaka marker selected. It must still be offered, and must show thousands of kilometres, marked.
- [ ] 4.2 Search a place actually nearby. It must show a small distance and no mark.
- [ ] 4.3 Search with no city selected and the map somewhere neutral — results must still appear, with no distance rather than a wrong one.

## 5. Closing

- [x] 5.1 `pnpm lint`, `typecheck`, `test`, `build`, `check:cycles`, `check:specs` all green.
- [ ] 5.2 Note in `openspec/ROADMAP.md` that query cleanup — stripping notes and parentheses, which recovered seven of thirteen failures in the sample — belongs to bulk import rather than to interactive search.
