## 1. Stadia account (the user's)

- [x] 1.1 The user creates a Stadia Maps account on the free plan and one key, set in `apps/web/.env`, `apps/mobile/.env`, the laptop's hosting environment and EAS — verified by a keyed request from the terminal answering 200

## 2. Routing package

- [x] 2.1 Add a Stadia endpoint to `packages/routing`, building the same Valhalla request against `https://api.stadiamaps.com/route/v1` with an optional `api_key`, and reusing `parseValhalla` / `isValhallaNoRoute` — verified by a unit test over the existing `valhalla-walk.json` fixture and a test that the key is only in the URL when given
- [x] 2.2 Change `createRouter` to take an ordered list of services, each with its own URL builder, parser and headers, keeping one deadline, one pacing slot and one cache across them — verified by `router.test.ts`: the first failing passes to the next (including a 401 and a 429), a *no way* from the first ends it, the deadline covers all three, and pacing stays at one a second across services
- [x] 2.3 Update the package's comments and `index.ts` exports to describe Stadia → Valhalla → OSRM — verified by `pnpm --filter @pinpoint/routing test` and typecheck

## 3. Applications

- [x] 3.1 Laptop: add `NEXT_PUBLIC_STADIA_API_KEY` to `apps/web/lib/config.ts` (required, named on failure) and `apps/web/.env.example`; `apps/web/lib/street-route.ts` asks Stadia with that key and no custom header, then FOSSGIS as today — verified on `localhost` in the browser's network panel: one request to `api.stadiamaps.com` carrying `api_key`, answering 200, none to FOSSGIS
- [x] 3.2 Phone: add `EXPO_PUBLIC_STADIA_API_KEY` to `apps/mobile/lib/config.ts` (required, named on failure) and to `apps/mobile/.env.example` with a placeholder and a note on why it is publishable — verified by starting the app without it and reading the error naming the variable
- [x] 3.3 Phone: `apps/mobile/lib/street-route.ts` asks Stadia with the key, then FOSSGIS as today — verified by a route on the simulator with a Metro log or network inspector showing Stadia answered

## 4. Credits and words

- [x] 4.1 Add `Stadia Maps` to `MAP_CREDITS` in `packages/map` with role `credit.stadia`, and reword `credit.valhalla` and `credit.osrm` to say FOSSGIS is asked when Stadia cannot, in `english.ts` and `spanish.ts` (Spanish impersonal) — verified by `pnpm check:wording`
- [x] 4.2 Look at the credits on the laptop and on the phone, on the light and the dark ground — Stadia Maps is listed with its link and the FOSSGIS lines read correctly

## 5. Records

- [x] 5.1 `PRODUCT.md`: street routes come from Stadia Maps' free plan first, FOSSGIS behind it; the "no key" assumption dropped for routing on purpose (#281), with the *withdraw rather than bill* terms unchanged
- [x] 5.2 `docs/spikes/2026-10-04-routes-between-places.md`: a dated note at the top saying the $0 / no key rule was relaxed to $0 / cannot bill by #281, and that Stadia is now first
- [x] 5.3 `openspec/config.yaml` context: the hard constraint reads "no usage billing", allowing a free plan that needs an account when it stops rather than bills — verified by reading it back

## 6. Running it

- [x] 6.1 On the laptop and the phone, route walking, cycling and driving to the same place from the same position — same figures on both, and the same as FOSSGIS gave before
- [x] 6.2 With Stadia made to fail (a wrong key on the phone; a blocked `api.stadiamaps.com` on the laptop), a route still arrives from FOSSGIS with nothing different on screen; with every service blocked, the straight line stays with the *no route along the streets* line
- [x] 6.3 `pnpm verify` passes and `openspec validate route-through-stadia --strict` passes
