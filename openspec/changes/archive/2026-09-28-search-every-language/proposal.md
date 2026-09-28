## Why

Place search only knows names in English, German, French and the local language. Typing
**"Torre Eiffel"** offers a building in Mexico, not the tower in Paris. Since the product
now speaks Spanish (#217), people planning in Spanish can't find famous places by the
names they know. The service behind search can't be asked for Spanish, so changing a
setting won't fix it (#219).

## What Changes

- Suggestions while typing stay exactly as they are.
- **Pressing Enter runs a second, deeper search** that knows names in every language
  entered in OpenStreetMap. On the laptop that is the Enter key. On the phone it is the
  keyboard's existing "Search" key, which does nothing today.
- **Its results replace the list.** Typing another letter brings the normal suggestions
  back. The two lists are never mixed, so the same place can't appear twice.
- **A hint under the suggestions** tells people this exists: *"Not here? Press Enter to
  search in every language."* The phone's wording names the keyboard key instead. It shows
  only while there is an answer to what's typed: some results, or no matches.
- **Results come back with English names**, the same as the suggestions. Searching
  "Coliseo" shows *Colosseum, Rome*. That way, a place is filed under the cities the
  trip already has, instead of being offered a new "Roma" next to "Rome".
- Everything a result carries today still works: the guessed type, the city, the distance,
  and recognising a place already saved on the trip. Both searches give the same place the
  exact same position, as checked on the Eiffel Tower and the Colosseum.
- If the deeper search is down, pressing Enter says search is unavailable, the same way it
  does today, and typed suggestions keep working.

**Not being done:**

- Suggestions in every language while typing. The deeper search's rules forbid being
  called on every keystroke.
- Names shown in the app's language. They are deliberately kept in English (see above).
- Hosting our own search server, or paying for Google or Mapbox. Both were rejected on
  cost.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `place-search`: a submitted query runs one search against a second free service that
  matches names in every language, and its results replace the list. A hint says so. The
  no-cost rule now covers every service search uses, and the second service's usage limits
  are part of the requirement.

## Impact

- `@pinpoint/geocode`: a second request builder and parser (Nominatim), beside Photon's.
  Also a per-device pacer and cache for it.
- `apps/web/app/_components/place-search.tsx` and
  `apps/mobile/components/place-search.tsx`: Enter or the keyboard's Search key, the
  replaced list, and the hint.
- `@pinpoint/wording`: the hint for each platform, in English and Spanish.
- The phone identifies itself to the new service by its app name. The laptop is identified
  by the address the browser already sends.
- No new dependency, account, key or cost.
