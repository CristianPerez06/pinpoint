## Context

Search today is one function, `searchPlaces` in `@pinpoint/geocode`. It builds a Photon URL
(`request.ts`), parses Photon's GeoJSON into `PlaceCandidate`s (`parse.ts`) and returns a
four-state `SearchResult`. Both apps call it from a debounced effect and keep the last
answer stamped with the query it answered, so "still searching" and the dimmed previous
list are derived rather than tracked.

Photon's public instance indexes names in `default`, `de`, `en` and `fr` only, and refuses
`lang=es`. Nominatim matches every `name:*` tag in OpenStreetMap. It forbids autocomplete,
asks for at most one request per second, and asks to be told which application is asking.

Checked by hand against both services while writing this:

- Nominatim sends `Access-Control-Allow-Origin: *`, so a browser can call it directly.
- Both services return the same OSM object at the **same position to the last digit**:
  way 5013364 (Eiffel Tower) and way 215801333 (Colosseum). The exact-position match that
  recognises a place already saved therefore holds across the two services.
- `accept-language=en` returns `Eiffel Tower` / `Paris` for "Torre Eiffel" and
  `Himeji Castle` / `Himeji` for "Castillo de Himeji".
- Nominatim's `category`/`type` is the same OSM tag pair as Photon's
  `osm_key`/`osm_value`, so `guessMarkerType` applies unchanged.

## Goals / Non-Goals

**Goals:**

- One Nominatim request per explicit submit, paced and cached on the device.
- A Nominatim result is a `PlaceCandidate` like any other, so the list, the capture form
  and the already-saved check don't change.

**Non-Goals:**

- Merging or deduplicating two result sets. The spec has the submitted list replace the
  typed one.
- A server-side proxy for Nominatim. Each device calls it directly, as it already calls
  Photon.

## Decisions

### Nominatim lives in `@pinpoint/geocode`, as a second builder and parser

`nominatim.ts` holds `buildNominatimUrl` and `toNominatimCandidates`, next to Photon's
`buildSearchUrl` and `toCandidates`. It reuses the same `Fetcher` injection, `SearchResult`
shape and failure message (`search.unavailable`). It is the same package boundary: it
turns a query into candidates, with the fetch function passed in. An app-level copy would
be the same code written twice.

Request: `q`, `format=jsonv2`, `limit=8` (`DEFAULT_LIMIT`), `addressdetails=1`,
`accept-language=en`. With a bias it also sends `viewbox` (±0.25° around the bias
point) and `bounded=0`, which ranks results inside the box first without excluding
anything outside it. That is the same ranking-not-restricting rule Photon's `lat`/`lon`
follows. `bounded=1` is never sent, for the reason `buildSearchUrl` gives for `bbox`.

Parsing mirrors `parse.ts`, and is just as defensive about unknown or missing fields:

- position from `lat`/`lon` (strings in Nominatim's response, so parsed);
- name from `name`, falling back to house number + road, then to a settlement, as
  `nameOf` does;
- `typeGuess` from `guessMarkerType(category, type)`;
- `city` from `address.city ?? address.town ?? address.village`, which gives Photon's
  `city` meaning: the settlement, never a county or state;
- `context` from the settlement (or `city_district`/`county`), `state` and `country`,
  deduplicated and without the name, as `contextOf` does;
- `id` from `osm_type` + `osm_id`, prefixed with the index.

The shared helpers (`str`, `contextOf`'s join) are extracted into a small module both
parsers import, rather than copied.

### The pacer and the cache are one object an app creates once

`createEveryLanguageSearch(fetcher, { now?, wait? })` returns
`search(query, { bias, signal }) => Promise<SearchResult>`. It holds:

- **The pace.** The time of the last request sent. A call arriving sooner than one second
  waits out the remainder, and the wait is abortable by the same `signal`, so typing during
  it cancels cleanly and returns `aborted`.
- **The cache.** A `Map` from the trimmed query to the **raw payload**, capped at the 50
  most recent entries. Candidates are re-derived from the payload with the current bias,
  so a cached answer still reports distances from where the person is working now. Only
  successful responses are cached. A failure is asked again on the next submit.

Each app creates it at module scope, next to its `browserFetch`/`nativeFetch`, so it lives
as long as the page or app process. "Session" in the spec means that. The clock and the
wait are parameters, so the tests need no fake timers on a global.

Alternative rejected: module-level state inside the package. It would be invisible to
the tests and shared by anything that imports the package, and the one-per-second rule
would then depend on import order instead of on something the app constructed.

### Which list is showing is derived from one extra piece of state

Each component gains `submitted: string | null`, the trimmed query at the moment Enter or
the Search key was pressed. The list comes from the every-language search exactly when
`submitted === trimmed`, so any edit to the query returns to suggestions without anything
having to clear it. This is the same derivation the existing `answer` stamp relies on.

The `answer` stamp gains its source (`'typed' | 'everyLanguage'`), and `result` matches on
both query and source. The existing typed effect is skipped while the every-language mode
is showing. A second effect runs the every-language search when it starts. The wait,
shells, dimmed previous list, `Searching…` and the iOS announcement all come from the
existing `asking`/`pending` derivation unchanged. On submit, the typed list stays dimmed
until the every-language answer replaces it.

The hint renders when the source is `'typed'` and `result` is `ready` or `empty`. That is
the spec's condition, written directly.

### Submitting, per platform

- **Web:** `onKeyDown` on the search `<input>`, on `Enter`, **ignoring
  `event.nativeEvent.isComposing`**. With a Japanese or Chinese input method, Enter
  confirms the composed characters, and treating that as a submit would search half a
  word. That matters for a product whose first trip is Japan.
- **Phone:** `onSubmitEditing` on the existing `returnKeyType="search"` field. The
  keyboard closes on submit, which is the default and is right here: the results are
  what the person wants to see next.

### How each app identifies itself

- **Web:** by the `Referer` the browser sends. The app sets no referrer policy, so the
  browser default (`strict-origin-when-cross-origin`) sends the site's origin. That
  satisfies the policy for a web page, which cannot set `User-Agent`.
- **Phone:** `nativeFetch` sends `User-Agent: Pinpoint/<version> (ar.com.pinpoint.app)`,
  with the version read from the app's Expo config. It sends this on every request,
  Photon's included. That is harmless, and one wrapper stays one wrapper.

### Wording

Two names, because the act differs by platform:

- `search.everyLanguageEnter`: *"Not here? Press Enter to search in every language."* /
  *"¿No aparece? Presionar Enter para buscar en todos los idiomas."*
- `search.everyLanguageKey`: *"Not here? Tap Search on the keyboard to search in every
  language."* / *"¿No aparece? Tocar Buscar en el teclado para buscar en todos los
  idiomas."*

Each app resolves only its own name, which satisfies `check:wording`.

## Risks / Trade-offs

- [Nominatim's public service is shared, and can block a client that uses it heavily] →
  One request per explicit submit, one per second per device, plus the cache. If it
  blocks or starts charging, the spec's withdrawal rule applies: the submit does nothing
  and the hint goes. Typed suggestions are untouched.
- [The two services may disagree on a position for the same place in cases not checked] →
  The spec's stated limit on exact matching already covers a mismatch. A duplicate is
  visible and undone in one press. The two checks made show agreement.
- [A person on a phone may never notice the Search key does something] → The hint
  names the key. Whether people find it is checked in the running app, not assumed.
- [`localhost` sends a Referer of `http://localhost:3000/` in development] → That still
  identifies a caller, and development use is a handful of requests.
