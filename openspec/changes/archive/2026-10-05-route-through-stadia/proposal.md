## Why

Street routes come from FOSSGIS's free public servers, which are run by volunteers and promise nothing; one was down for a whole day on 2026-09-02. That is fine for showing a route once, but not for a route someone depends on in the street, and not for following one on the move (#279), which asks for a new route each time the person strays. Stadia Maps runs the same routing software as a service meant to be relied on, with a free plan that stops at its allowance instead of billing.

## What Changes

- Street routes on the laptop and the phone come from **Stadia Maps** first. The person sees the same routes, figures and words as today — Stadia answers today's request unchanged (the Kyoto test walk: 4.42 km, 53 min on both).
- **FOSSGIS stays behind it**: when Stadia does not answer, refuses, or the month's free allowance is used up, the app asks FOSSGIS's Valhalla and then its OSRM, as it does today. Only when all of them fail does the person get the straight line and the existing *no route along the streets* line.
- The **map's credits** name Stadia Maps as the service finding the route, and FOSSGIS as the one asked when Stadia cannot.
- **The "no key, no account" rule is dropped for routing**, on purpose. What stays: it costs nothing, and nothing can bill — Stadia's free plan has a fixed allowance with no overflow into charges. Recorded in `PRODUCT.md`, in the spike for #244, and in the project context.
- Both apps carry the same Stadia key, set through each app's config and validated at startup. Anyone can read it out of the site or the app; the free plan's cap means it can only spend that month's routes.

Not in this change:

- **Ferrostar** and anything about following a route on the move — #282, then #279.
- Turn-by-turn instructions. Stadia sends them; nothing shows them yet.
- Traffic and public transport, which Stadia does not offer either.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `place-route`: *A street route replaces the straight line when there is a connection* — the routing service may now need an account, provided it cannot bill; a second service is asked when the first fails; credits follow whichever services are used.

## Impact

- `packages/routing` — a Stadia request beside the Valhalla and OSRM ones, and the router asking it first.
- `apps/web/lib/street-route.ts`, `apps/mobile/lib/street-route.ts` — wire Stadia in.
- Both apps' `lib/config.ts` and `.env.example` — the same Stadia key as `NEXT_PUBLIC_STADIA_API_KEY` and `EXPO_PUBLIC_STADIA_API_KEY`.
- `packages/map` `MAP_CREDITS` and `@pinpoint/wording` — a Stadia Maps credit, in English and Spanish.
- Outside the code: a Stadia account (free, non-commercial plan) and one key for both apps — the user's to create.
- `PRODUCT.md`, `docs/spikes/2026-10-04-routes-between-places.md`, `openspec/config.yaml` — the dropped rule recorded.
