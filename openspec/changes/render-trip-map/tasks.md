## 1. Seed data

- [x] 1.1 Migration inserting one city (`Kyoto`) for the seeded trip, and roughly sixteen markers across it — several within a kilometre downtown, others five to nine kilometres out, so the density is realistic rather than evenly spaced (design D8)
- [x] 1.2 Include at least two markers with **identical** coordinates, so the coincident-marker requirement has something to exercise (design D4)
- [x] 1.3 State in the migration text that the data is disposable and name the change that removes it. Make it idempotent, like the existing seed
- [x] 1.4 Apply with `pnpm db:push` and confirm the rows are visible to a signed-in member and invisible to everyone else

## 2. Shared tokens

- [x] 2.1 Create `packages/tokens` (`@pinpoint/tokens`): source-only, **no dependencies**, platform-neutral literals only (design D5, spec `styling`)
- [x] 2.2 Define one colour per marker family. `see` takes the most recessive value; `eat`, `buy`, `move`, `sleep` are more prominent — a real wishlist is mostly `see`, and the minority is the signal (design D2)
- [x] 2.3 Confirm every value is a concrete literal renderable by both platforms — no custom-property references, no aliases resolved by a host (spec `styling`)
- [x] 2.4 Confirm no derived platform representation is generated, and record why: neither app has styling yet, so there is nothing to derive into (design D5)

## 3. Shared map logic

- [x] 3.1 Resolve D7: move marker presentation (icons, families) into `@pinpoint/map`, leaving validation in `@pinpoint/core` reading the valid identifiers from it. Run `pnpm check:cycles` to confirm the direction holds (design D7)
- [x] 3.2 `@pinpoint/map` depends on `@pinpoint/tokens`. It still declares no runtime dependency outside the workspace — that is the property the boundary protects
- [x] 3.3 Implement the marker view descriptor: marker in, `{ lng, lat, icon, colour, label }` out. Pure, no renderer, no DOM, no native module (spec `map-rendering`)
- [x] 3.4 Descriptor resolves an unrecognised stored type to the fallback rather than omitting or throwing (spec `map-rendering`)
- [x] 3.5 Implement coincident-marker grouping: markers sharing a position collapse into one rendered point carrying the count and every underlying marker. Stored coordinates are never modified (design D4, spec `map-rendering`)
- [x] 3.6 Unit-test the descriptor and the grouping — two types, two families, an unknown type, two markers at one position, three at one position, and markers merely close but not identical
- [x] 3.7 Settle where shared query functions live (design, Open Questions), then implement reading a trip's markers: take an already-constructed client, return a discriminated result — the `@pinpoint/auth` shape (design D11)
- [x] 3.8 The result distinguishes **loading, ready, empty, and failed**. Empty is a distinct state from failed, and both are distinct from loading (design D11, spec `map-rendering`)
- [x] 3.9 Unit-test the query function against a stubbed client: success, failure, and a trip with no markers
- [x] 3.10 Verify `packages/map` and `packages/tokens` import no renderer, no DOM API, and nothing under `apps/`; run `pnpm check:cycles`

## 4. Web map

- [x] 4.1 Add `maplibre-gl` to `apps/web`, and `@pinpoint/tokens` to `transpilePackages` in `next.config.ts` — a missing entry fails the build with an unhelpful parse error (AGENTS.md — gotchas)
- [x] 4.2 A client-side map component. The renderer needs a DOM, so it cannot server-render; mount the map in an effect and tear it down on unmount so a remount does not leak an instance (design, Open Questions)
- [x] 4.3 Import the renderer's stylesheet. Without it the map renders as a blank box with no error
- [x] 4.4 Frame on open using `fitBounds` with the **measured** surface size, not the default viewport. Frame once — do not re-frame after the person pans (spec `map-rendering`)
- [x] 4.5 Render one marker per descriptor, positioned by coordinates, showing the type's icon and the family's colour
- [x] 4.6 Render coincident groups with their count, and make every marker in a group reachable (spec `map-rendering`)
- [x] 4.7 Attribution visible in the default state without interaction. Confirm it survives a production build, not just `dev` (spec `map-rendering`)
- [x] 4.8 Selecting a marker shows its name, note, link, price, and type, without leaving the map. Absent values render as absent, not as empty text (spec `map-rendering`)
- [x] 4.9 Selecting a coincident group offers the markers there to choose between, then shows the chosen one's details (design D4, spec `map-rendering`)
- [x] 4.10 Dismissing a selection returns to the unobstructed map without moving the camera (spec `map-rendering`)
- [x] 4.11 Add route-level loading and error boundaries — the app currently has neither. Loading, failure, and "no markers yet" must be visibly different from one another (design D11, spec `map-rendering`)
- [x] 4.12 Build the loading and error surfaces from `@pinpoint/tokens` values in web's own idiom. **Do not create a shared component** — sharing rendered markup is what the `styling` spec forbids (design D11)
- [x] 4.13 Replace the trips list on the signed-in page with the map for the current trip, keeping the existing auth guard so no map data is sent to a client without a session

## 5. Mobile map

- [x] 5.1 Add `@maplibre/maplibre-react-native` to `apps/mobile` and move to a development build — it contains native code and Expo Go cannot load it (design D6)
- [x] 5.2 Update `pnpm dev:mobile` and the README: the app no longer runs under Expo Go, and the first run now requires a native build
- [x] 5.3 Render the map with the same style reference from `@pinpoint/map`. **Confirm the native library accepts a style URL rather than requiring a style document** — this is the specific unknown the change exists to retire
- [x] 5.4 Apply the same `fitBounds` result to the native camera, from the measured surface size (spec `map-rendering`)
- [x] 5.5 Render markers from the same descriptors, using view-based markers so the emoji icons render (design D1)
- [x] 5.6 Render coincident groups as web does, reachable the same way
- [x] 5.7 Confirm attribution renders. If the native library does not show it by default, draw it — it is a licence condition, not a default (spec `map-rendering`)
- [x] 5.8 Selecting a marker shows the same fields as web, in mobile's own idiom. A bottom sheet is the expected form; a plain screen is acceptable if the gesture handling it implies turns out to pull in more than expected (design D9)
- [x] 5.9 Selecting a coincident group offers a chooser, as web does (spec `map-rendering`)
- [x] 5.10 Consolidate the `loading` flag currently re-derived in `app/index.tsx` and `lib/session.tsx`, and render loading, failed, and empty as distinct states (design D11)

## 6. Verification

- [x] 6.1 Open the same trip on both platforms at a comparable viewport; confirm the same style, the same centre and zoom, and the same icon and colour per marker (spec `map-rendering`)
- [x] 6.2 Confirm a trip with no markers opens at the default position on both, with no error
- [x] 6.3 Confirm a trip with one marker centres on it at a usable zoom, not maximum zoom
- [x] 6.4 Pan and zoom away on both; confirm the view is not snapped back
- [x] 6.5 Zoom to maximum on the two identical-coordinate markers; confirm they do not separate, and that both are still reachable (design D4)
- [x] 6.6 Confirm no marker carries a permanent label at city zoom, and that a marker's identity is still discoverable (spec `map-rendering`)
- [x] 6.7 Change one family colour in `@pinpoint/tokens`; confirm both applications render the new colour and neither contains the literal (spec `map-rendering`, `styling`)
- [ ] 6.8 Look at the seeded Kyoto data on both platforms and judge whether the density is legible. This is the question the change was scoped around — record the answer even if it is "clustering is needed after all"
- [x] 6.9 Select a marker on both platforms; confirm the same fields with the same values, and that a marker with only a name shows the rest as absent (spec `map-rendering`)
- [x] 6.10 Select the coincident group on both; confirm a chooser appears and each marker is reachable through it (design D4)
- [x] 6.11 Confirm loading, failed, and empty are visibly different on both platforms. Force the failed state by pointing at an unreachable project or breaking the query — an untested error branch is the one that will be wrong (spec `map-rendering`)
- [x] 6.12 Confirm no shared component renders markup for both platforms; the shared code is state and queries only (design D11, spec `styling`)
- [x] 6.13 Run `pnpm lint`, `pnpm lint:mobile`, `pnpm typecheck`, `pnpm typecheck:mobile`, `pnpm test`, `pnpm check:cycles`, `pnpm check:specs`, and a web production build
- [x] 6.14 `openspec validate render-trip-map --strict`

### What the verification pass actually found

Every item was checked by opening both applications and looking, which is the
only way three of these could have been found — each typechecks, renders, and
is wrong:

- **Markers drifted off their coordinates on zoom** (web). An inline
  `position: relative` beat MapLibre's `.maplibregl-marker { position:
  absolute }`, so every pin carried a fixed screen-pixel error. Panning looked
  convincing; zooming gave it away.
- **Tapping a pin did nothing** (mobile). On iOS the annotation and the map
  each carry a tap recogniser, and the map-level dismiss handler cleared the
  selection the marker had just set.
- **The map disappeared when markers failed to load.** Corrected during the
  pass: the tiles come from a different service over a different connection, so
  a database failure has no business blanking a working map. Both states now
  keep the map and differ by the note's tone.

Only 6.8 is left, and it is a judgement rather than a check.
