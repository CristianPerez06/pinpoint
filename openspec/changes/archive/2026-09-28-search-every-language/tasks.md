## 1. Nominatim in `@pinpoint/geocode`

- [x] 1.1 Extract the helpers `parse.ts` and a Nominatim parser would share (`str`, `num`, `isRecord`, the context join) into a module both import; verify `pnpm --filter @pinpoint/geocode test` still passes unchanged
- [x] 1.2 Add `buildNominatimUrl` (`q`, `format=jsonv2`, `limit`, `addressdetails=1`, `accept-language=en`, and `viewbox` ±0.25° with `bounded=0` only when biased; never `bounded=1`); verify with unit tests for the biased and unbiased URLs and for encoding
- [x] 1.3 Add `toNominatimCandidates` per design (string `lat`/`lon`, name fallback, `guessMarkerType(category, type)`, `city ?? town ?? village`, context without the name, index-prefixed OSM id, distance from bias); verify with fixture tests including the real "Torre Eiffel" and "Coliseo" responses, a missing name, a county-only address carrying no city, and malformed entries dropped singly
- [x] 1.4 Add `createEveryLanguageSearch(fetcher, { now, wait })` with the one-per-second pace (abortable wait), the 50-entry payload cache re-derived with the current bias, failures not cached, and the same four `SearchResult` states; verify with tests for: two submits under a second apart, a repeat query served without a fetch, a cached answer's distance following a new bias, an abort during the wait, and a failure retried
- [x] 1.5 Export the new functions from `index.ts`, and update `request.ts`'s header comment and `package.json`'s `comment` so they no longer say the package talks to one service; verify `pnpm --filter @pinpoint/geocode typecheck`

## 2. Wording

- [x] 2.1 Add `search.everyLanguageEnter` and `search.everyLanguageKey` to `english.ts` and `spanish.ts` with the sentences in design.md (Spanish impersonal); verify `pnpm check:wording` passes once both apps resolve them (after 3 and 4)

## 3. Web

- [x] 3.1 Create the every-language search once at module scope beside `browserFetch`, add `submitted` state, stamp `answer` with its source, skip the typed effect while showing a submitted search, and run the every-language effect; verify `pnpm typecheck` and `pnpm lint`
- [x] 3.2 Submit on `Enter` in the search input, ignoring `isComposing` and an empty field; verify in the browser that Enter during a Japanese IME composition does not search, and Enter with text does
- [x] 3.3 Render the hint under the list when the source is typed and the answer is candidates or no matches; verify in the browser that it is absent while empty, while waiting, on failure and after a submit

## 4. Phone

- [x] 4.1 Send `User-Agent: Pinpoint/<version> (ar.com.pinpoint.app)` from `nativeFetch`, with the version from `expo-constants`; verify by pointing a dev build's request at a header-echo URL once and reading the header back, then removing the probe
- [x] 4.2 Create the every-language search at module scope, add `submitted`/source state and the second effect as on web, and submit through `onSubmitEditing`; verify `pnpm typecheck:mobile` and `pnpm lint`
- [x] 4.3 Render the hint (`search.everyLanguageKey`) under the list under the same condition as web; verify `pnpm check:wording`

## 5. Looking at the running apps

- [x] 5.1 Web, both themes, English and Spanish: type "Torre Eiffel" (Mexico offered, hint showing), press Enter (list replaced by Paris, hint gone), type a letter (suggestions return); save the result and confirm the type guess and the city "Paris"
- [x] 5.2 Phone (iOS simulator), both themes, English and Spanish: the same walk-through using the keyboard's Search key; confirm the hint's wording names the key and that it doesn't crowd the list at the smallest supported screen
- [x] 5.3 On both: search a place already saved on the trip through the Enter/Search key and confirm the saved marker opens rather than a new capture
- [x] 5.4 On both: block `nominatim.openstreetmap.org` (devtools request blocking on web; an unreachable endpoint in a dev build on the phone), submit, and confirm "search is unavailable" appears and typed suggestions still work after editing the query
- [x] 5.5 On web, submit two different queries within a second and confirm in the network panel that the second request leaves no sooner than a second after the first, and that resubmitting the first sends no request

## 6. Records

- [x] 6.1 Update `PRODUCT.md`'s geocoder line to name both services and the per-service withdrawal rule; verify by reading it against the spec
- [x] 6.2 Run `openspec validate search-every-language --strict` and `pnpm verify`; both pass
