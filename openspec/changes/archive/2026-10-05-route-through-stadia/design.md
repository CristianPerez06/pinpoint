## Context

`@pinpoint/routing` has one router per app (`createRouter`) that asks FOSSGIS Valhalla, then FOSSGIS OSRM, inside one 8-second deadline, paced to one request a second, with a 50-entry cache. Each app builds it in `lib/street-route.ts` with its own `fetch` and headers.

Checked on 2026-10-05 against `https://api.stadiamaps.com/route/v1`:

- It accepts today's Valhalla GET request (`?json=…`) unchanged, and the answer parses with the existing `parseValhalla`. Kyoto test walk: 4.42 km, 3,200 s, the same as FOSSGIS.
- With no key it answers 401. From an `Origin` of `http://localhost:3000` it answers 200 with no key.
- CORS: `Access-Control-Allow-Origin: *`; allowed request headers are `Stadia-Auth` and `Content-Type` only.
- Free plan: 200,000 credits a month, 20 per route (≈10,000 routes), non-commercial, and no overflow into billing.
- Attribution: a credit to Stadia Maps and to the data source; OpenStreetMap is already credited.

## Goals / Non-Goals

**Goals:** Stadia first on both apps, with one key; FOSSGIS unchanged behind it.

**Non-Goals:** reading Stadia's manoeuvres or spoken instructions (#279/#282); its OSRM-format answer; any server of ours in the middle.

## Decisions

**1. Stadia is a third service in the same router, asked first.** The order becomes Stadia → FOSSGIS Valhalla → FOSSGIS OSRM, all inside the existing deadline and pacing. A service that *fails* (no answer, a refusal — including 401 and the allowance running out — or an unreadable answer) passes to the next; a service that answers *no way* ends it, as Valhalla's does today. The router takes its services as an ordered list rather than growing a third hard-coded branch, so each app can leave Stadia out when it has no way to authenticate. Stadia's request and parsing reuse the Valhalla functions with a different endpoint; nothing new is decoded.

**2. One key, shared by both apps.** Each app reads the same Stadia key from its own config — `NEXT_PUBLIC_STADIA_API_KEY` on the laptop, `EXPO_PUBLIC_STADIA_API_KEY` on the phone — required and validated at startup naming the variable, and sends it as the `api_key` query parameter. The laptop sends no custom header: Stadia's preflight allows only `Stadia-Auth` and `Content-Type`, so `X-Client-Id` would be refused before the request leaves.

The key is publishable by the spec's definition: the free plan caps rather than bills, so a key read out of the site or the app can only spend the month's allowance, after which routes come from FOSSGIS. The user chose one key over Stadia's domain authentication for the laptop, which would have kept the key out of the site's code but left previews and other addresses on FOSSGIS. No proxy of ours: it would need a server the phone does not have and buys nothing the cap does not already give.

**3. Credits.** `MAP_CREDITS` gains `Stadia Maps` (`https://stadiamaps.com/`) as the service finding the route; the Valhalla and OSRM roles are reworded to say FOSSGIS is asked when Stadia cannot. New and changed sentences in English and Spanish.

## Risks / Trade-offs

- [Stadia stops offering the free plan] → FOSSGIS still answers; nothing the person sees changes except reliability.
- [The key is read out of the site or the app and the allowance spent] → routes fall back to FOSSGIS until the month resets; the key can be rotated in Stadia's dashboard, redeployed on the laptop at once and shipped in the phone's next build.
- [Stadia's driving times are shorter than FOSSGIS's in a city — Shibuya to Meiji Jingu 7 min against 13 over the same 3.7 km] → accepted by the user on 2026-10-05: the spec shows the routing service's own figures, and neither service knows about traffic. Walking and cycling agree to within a minute.
- [The free plan is non-commercial] → same condition FOSSGIS already sets; `PRODUCT.md`'s *withdraw rather than bill* decision covers it.
- [A missing key stops either app from starting] → that is the config module's contract; both `.env.example` files document it.

## Migration Plan

Before merging: create the Stadia account and one key, and set it in both apps' local environments, in the laptop's hosting environment and in EAS for the phone's builds. Rollback is reverting the change; FOSSGIS needs nothing.
