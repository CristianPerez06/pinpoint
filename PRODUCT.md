# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Two applications over one set of shared packages: `apps/web` (Next.js App Router) and
`apps/mobile` (Expo, built natively for iOS and Android — not Expo Go). They share
token *values* and pure logic, never styling code or markup. Design language adapts per
platform by rule, not by drift: **chrome follows the screen shape, not the platform** —
a phone-shaped screen puts controls at the bottom within a thumb's reach with the map
above them; a laptop-shaped one has a header and a toolbar. The web application gets
both, chosen by window width.

## Users

**Anyone planning a trip.** Confirmed as the target audience, and this is a widening
of what the repository was built against — see *Capabilities and Constraints*, where
the consequences are recorded as open rather than assumed.

The person in the situation the product was designed around: someone assembling a list
of places for a trip they are taking with other people, over weeks, from
recommendations, videos and things half-remembered — then, on the trip, standing in a
street deciding what to do next. Their job is not scheduling. It is answering *can we
do these three in one afternoon* and *where do the things we both want to go actually
sit*.

Everyone on a trip is a **member**. Members are not users: a member row exists before
the account does, and an account arriving later fills in one column rather than
rewriting every attributed row. A trip is created by a person who names both the trip
and themselves; other members are added by email address, and are matched to an
account on every sign-in rather than only at sign-up.

## Product Purpose

A map you can drop markers on, for planning a trip with other people. Save the places
you want to go, see them all on one map, group them coarsely by city, record who wants
to go where, mark what has been visited, and narrow the map to the places a chosen set
of people all want.

It replaces a spreadsheet with one tab per city, whose columns were Name, Description,
Neighborhood, one column per traveller marked with an X, and Price. Success is that
nobody opens the spreadsheet again — and specifically that the two columns doing the
real work are done better: **Neighborhood**, which was never a location field but a
proximity proxy, and **the per-person X columns**, which are what makes the tool beat a
spreadsheet at planning rather than only at storage.

## Positioning

Two things a neighbouring product could not truthfully copy without making the same
two decisions:

- **Wishlist, not itinerary.** The broken dimension is *where*, not *when*. Trip
  planners that grew day-scheduling did it for strangers, not for a trip. If days ever
  arrive they arrive as a second, independent grouping — a marker can be "Kyoto" *and*
  "day 3" — never as a level underneath City.
- **The filter is the product.** Interest is recorded per member, and the map narrows
  to the places a chosen set of people *all* want. Two people marking interest
  independently turns "show me the places we both want to go" from a squint into a
  control.

Supporting it: **either application is sufficient on its own.** A person may use one
and never open the other, and nothing this product can do may be reachable from only
one of them. This is a standing rule about what may be built next, not a description of
a direction already travelled.

## Operating Context

- **Two phases, two postures.** Planning happens over weeks, mostly at a laptop, mostly
  as capture. Using happens on the trip, on a phone, one-handed, standing up — where a
  distance-sorted list is arguably the primary view and the map is secondary, the
  reverse of the laptop.
- **The map is the interface.** The majority of what a person looks at is rendered from
  a map style document, not from application styling. Tiles come from OpenFreeMap;
  attribution is required and is a permanent part of the layout. OpenFreeMap publishes
  no dark style, so the document is fetched and patched before either renderer sees it.
- **Places arrive one at a time**, from a recommendation or a video, after the initial
  list is in.
- **A trip crosses borders.** Currency sits on the *city*, not the trip and not the
  marker.
- **Names are not all Latin.** The first trip is full of macrons — Kyōto, Tōdai-ji,
  Dōtonbori — and names written in kana or kanji are expected and fall back to a system
  face by design.
- **Concurrent editing is real.** Two people plan the same trip at the same time, so a
  save based on a stale read is refused and said out loud rather than applied.

## Capabilities and Constraints

**In force today, on both platforms:** account creation and sign-in; creating,
renaming and sharing a trip; finding a place by name; dropping a pin by hand; the
six-field marker form (name, note, type, city, link, price); editing and removing;
cities as the coarse grouping; per-member interest; visited; and the people filter.

**Vocabulary that is load-bearing.** *Marker* — a saved place with a position.
*City* — a name somebody chose for a cluster of pins, not a geographical fact; nothing
resolves a city name to a position. *Member* vs *user*, as above. *Family* — one of
five fixed colour groups (`see`, `eat`, `buy`, `sleep`, `move`). *Type* — one of a
growable list of seventeen, each belonging to a family.

**Structural constraints that future work must not undo:**

- `@pinpoint/map` declares **no runtime dependencies**. Web renders with `maplibre-gl`,
  native with `@maplibre/maplibre-react-native`; no shared package may import a
  renderer, a DOM API, or a native module. Map behaviour is expressed as data and pure
  functions.
- **No cross-platform styling runtime.** Rejected by default; revisit conditions live in
  `openspec/specs/styling`.
- Membership is the **single authorization boundary** — every row-level security policy
  resolves to it. Creating a trip is the one write that cannot resolve to an existing
  membership, so it goes through a `SECURITY DEFINER` function and `trips` has no
  insert policy at all.
- **No clustering.** Sixteen drawn points across Kyoto read clearly at city zoom on both
  a laptop and a phone. The density problem was always text, not geometry, which is why
  the specs forbid permanently labelling every marker rather than requiring clustering.
  Revisit in the high hundreds per view.
- **Markers on one point** are badged with a count and offered as a choice. Stored
  positions are never moved.
- **A price is never converted** when a marker moves between cities. The number was
  transcribed off a menu. A city with no currency shows a bare amount and assumes
  nothing — a price in the wrong currency is worse than one in none, because it looks
  correct.
- **Bulk import is not a feature.** A migration is not a product capability; nobody
  pastes sixty places twice.

**Explicitly undecided:**

- **What a stranger-facing product costs.** The $0 budget is confirmed as a
  bootstrapping constraint rather than a principle — paying for what a public product
  needs is acceptable. Nothing has been chosen. Three things currently depend on the
  old assumption and are open: **invitation delivery is out of band** (nothing is sent;
  the email address is only a claim key, so a mistyped address produces two screens that
  both look correct and only the inviter can fix it); **the geocoder is Photon's free
  public instance**, with the standing decision that search is withdrawn rather than
  billed if it ever requires paying; and **there is no acquisition surface of any kind**
  — the web application has exactly three routes, and none of them is a landing page.
- **Onboarding for someone with no context.** Every existing first-run path assumes an
  invitation from someone who explained the product in person.
- **A list view on web.** List and map have been called co-equal since the beginning
  and web still has no list. The phone is expected to get one first, with distance
  sorting.
- **The disagreement pile.** "Places only one of you wants" is a real capability that
  was lost when the filter became a list of people, and no way of offering it has fitted
  without reintroducing a second control that made earlier attempts confusing.
- **Android is built but not design-verified** to the degree iOS is.

## Brand Commitments

The name, the typeface and the palette are all binding.

- **Name:** pinpoint.
- **Typeface:** Figtree, bundled with both applications rather than fetched from a third
  party, licensed at no cost, variable weight 300–900, unsubsetted so macrons render in
  the same face. `pnpm check:fonts` asserts the two copies are byte-identical.
- **Accent:** amber (`#E39A2B` light / `#F0AE4A` dark), chosen specifically so it cannot
  be mistaken for a sixth marker family — it is nowhere near slate, orange-red, violet,
  blue or teal. Anything *written* in the accent uses `accentInk` instead, because the
  accent itself clears about 2:1 on white.
- **Neutrals carry a warm bias** rather than being a pure grey ramp, and the basemap is
  warmed to match, so the map and the interface share one ground instead of looking
  stapled together.
- **The five marker family colours and their prominence ranking are a product decision,
  not a palette.** `see` is deliberately the most recessive value because it holds the
  large majority of a trip's markers; the four minority families are deliberately
  prominent because they carry the information somebody is actually looking for.
  Preserved in both themes. Changing the ranking is a product change.
- **Every colour is defined twice**, once against each ground. A theme is never derived
  by inverting or lightening the other.
- **Tone, as evidenced by the shipped copy and specs:** plain, specific, unhedged.
  It says what happened and what to do about it.

## Evidence on Hand

Real, in the repository:

- **A seeded first trip** — Kyoto, sixteen markers, deliberately lopsided at fourteen
  `see` against one each of `eat`, `buy`, `move` and `sleep`
  (`supabase/migrations/20260808120000_seed_kyoto_markers.sql`). This is the shape a
  real wishlist has, and it is the evidence the colour ranking was chosen against.
- **A measured geocoder result.** Thirty-five real Osaka places through Photon:
  twenty-two resolved, six came back confidently wrong (270 km to 16,187 km away), and
  seven found nothing. The failures were not obscure places but the notes written beside
  them — "Parque", "Templo", "Barrio", "Tienda" pulled the search toward
  Spanish-speaking countries; stripping those words recovered seven of the thirteen.
  This is why search results show how far away each result is: distance is the only fact
  distinguishing a right match from a confidently wrong one.
- **A written record of what looking caught that building did not.**
  `openspec/ROADMAP.md` documents defects that passed `typecheck`, `lint` and `build`
  untouched across five consecutive changes.
- **Nine specifications** in `openspec/specs/` — the rules actually in force.
- **The bundled typeface**, `apps/web/app/fonts/Figtree.ttf` and
  `apps/mobile/assets/fonts/Figtree.ttf`.

Absences future work must not paper over: **no logo or wordmark asset exists**; **no
users outside the founding trip**; **no testimonials, press, benchmarks, pricing or
customers**; **no marketing copy**; **no analytics**. None of these may be invented.

## Product Principles

1. **The filter is the product.** Capture is table stakes; narrowing to what a chosen
   set of people all want is the thing a spreadsheet cannot do. Anything that makes
   capture better at the cost of the filter is a bad trade.
2. **Either application is sufficient on its own.** No capability may be reachable from
   only one of them. Convenience may differ; capability may not.
3. **Chrome follows the screen shape, not the platform.** Frequent controls within a
   thumb's reach on a phone-shaped screen; a header and toolbar on a laptop-shaped one;
   the web application gets both by window width. Meaning is shared, controls are native.
4. **Types are a design system, not user data.** Colour is carried by five fixed
   families, icons by a growable type list. That is what lets the list expand without
   the map degrading into confetti.
5. **Budget for looking, not just for building.** Static checks have been green over
   real defects on five consecutive changes. Every visual claim in this product is
   verified by opening it, because the failures that matter here — a value the host
   never resolves, a font that falls back silently, a camera centring a pin behind a
   sheet — are invisible to every check that does not inspect pixels.

## Accessibility & Inclusion

**WCAG 2.2 AA on both platforms.** Confirmed as the bar, and it names a number for
rules the specifications already carry in prose.

Already in force and not to be regressed:

- **No signal is carried by colour alone.** A visited marker is drawn as visited without
  changing its colour; the filter's applied state is a change in a control's state, not
  a hue. A signal that survives only in hue does not survive a greyscale display, a
  colour-blind reader, or a screen reader.
- **Inert, not absent.** A control that has nothing to do stays in the tab order and
  keeps its name — `aria-disabled="true"` on web, `accessibilityState={{ disabled:
  true }}` on native — rather than taking the `disabled` attribute, which leaves the tab
  order and is skipped by screen readers.
- **Both themes are honoured.** Both applications render in the theme the device or an
  explicit choice asks for, and no surface presents one theme's colours over another's,
  in whole or in part — including the map.
- **Every gesture has an accessible route.** A drag is something a screen reader cannot
  perform, so anything reachable by dragging is reachable another way.
- **Text renders in one face.** The unsubsetted font file exists so a single macron does
  not silently swap typefaces mid-word.
