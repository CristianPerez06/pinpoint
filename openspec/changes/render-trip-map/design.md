## Context

`@pinpoint/map` already holds the hard part — `fitBounds` handles antimeridian
crossing, Mercator zoom derivation, viewport and padding, and has eighteen tests. What
it has never done is drive a renderer.

Two constraints frame everything below. `maplibre-gl` and
`@maplibre/maplibre-react-native` have similar APIs but are separate libraries, and no
shared package may import either. And the map is the only unproven thing left in the
stack: Postgres, authentication, and forms are known technology, whereas one
zero-dependency package producing identical output through two bundlers and two
renderers is the bet this repository is built around.

There is also a practical blocker. The `markers` table is empty — the existing seed
creates a trip and two members and nothing else — so a map reading from the database
would correctly render nothing.

## Goals / Non-Goals

**Goals:**

- A map renders on both platforms, from the same shared logic, framing a trip's
  markers.
- The portability claim is exercised rather than asserted: same package, two
  renderers, same output.
- Marker appearance is derived once, in shared code, from data both platforms read.
- Markers that a geocoder placed at identical coordinates stay reachable.
- Attribution is visible wherever tiles are.

**Non-Goals:**

- Adding, editing, or deleting markers. This change is read-only.
- Place search and geocoding.
- Cities, interest, visited, or any filtering interface.
- Offline tiles.
- Clustering. See D3.
- Shipping to anyone else's device.

## Decisions

### D1 — View-based markers, not a symbol layer

MapLibre offers two ways to draw markers, and they are different architectures rather
than stylistic variants:

- **View-based** — `new Marker({element})` on web, a marker view component on native.
  The content is a real element.
- **Symbol layer** — a GeoJSON source plus a symbol layer. The content is an image
  from a loaded sprite atlas.

`MARKER_TYPES` in `@pinpoint/core` already gives every type an **emoji** icon. A symbol
layer cannot render those without rasterising emoji into a sprite atlas at build time,
per platform, using each platform's emoji font — an unpleasant pipeline producing
output that differs between the platforms it is meant to unify.

View-based markers render emoji directly on both. Their weakness is volume: they
degrade in the hundreds where symbol layers scale to hundreds of thousands. A trip
holds tens. The constraint that would force symbol layers does not apply and will not.

So a decision made in passing while writing `marker-type.ts` has already chosen the
rendering architecture. Recorded here so that changing the icon set later is understood
to also mean changing how both platforms render.

### D2 — `see` is the quietest colour

Real trip data is lopsided. A representative Kyoto wishlist is roughly twelve `see`,
one `eat`, one `buy`, one `move`, no `sleep`.

The instinct when assigning five family colours is an even, balanced palette. That
would be wrong here: twelve markers in the loudest colour would drown the three that
carry information. The useful signal is the minority — finding the one `eat` marker
among twelve temples is exactly the question asked at lunchtime.

So `see` takes the most recessive colour available, and `eat`, `buy`, `move` and
`sleep` are more prominent. This is a token-value decision, not a code one, and it is
why the family colours are worth choosing deliberately rather than picking five hues
off a wheel.

### D3 — No clustering

Clustering is the standard answer to marker density and it is the wrong one here.

At the zoom level showing one city, the map's job is to answer "can we do these
together?". Collapsing eight markers around Gion into a bubble reading "8" destroys
precisely the information that question needs.

The arithmetic also says it is unnecessary. With 512-pixel tiles, Kyoto's sights span
roughly 715 by 580 pixels at zoom 12; twenty markers of about thirty pixels have room.
Pins do not fight at this scale.

**Labels do.** Twenty labels of roughly ninety pixels in that same box are unreadable.
That is why the specification forbids permanently labelling every marker rather than
requiring clustering — the density problem is text, not geometry.

Clustering becomes worth revisiting somewhere in the high hundreds of markers per view,
which this product will not reach.

### D4 — Coincident markers are badged, not moved or spiderfied

A geocoder frequently answers with a building's centre point rather than the place
inside it, so two markers can hold genuinely identical coordinates. Identical
coordinates render to the same pixel at every zoom, so the marker drawn underneath is
unreachable forever and looks like it was never saved.

Three options were considered:

- **Spiderfy** — click a stack and its members fan out on leader lines. Familiar, and
  real implementation work on two different renderers.
- **Nudge on write** — offset duplicates by a few metres. Trivial, and the map then
  shows a position that is false. Rejected: the map's value depends on positions being
  true.
- **Badge and defer to the list** — mark the pin with the count, and let selecting it
  surface every marker at that point.

The third is chosen. The list and the map are already co-equal by design, with the map
answering "where roughly" and the list answering "which exactly". Coincident markers
are the case where that division does the most work.

The specification states the property — every marker reachable, positions unmodified,
zoom not the only mechanism — rather than the badge, so a later change may adopt
spiderfying without a spec change.

Selecting a marker opens its details (D9), which makes the badge concrete rather than
hand-waved. A group simply inserts a chooser in front of the same detail view:

```
  one marker      →  detail
  a "2" marker    →  choose between two names  →  detail
```

No separate mechanism, and nothing about the group case is special beyond one extra
step.

### D5 — `@pinpoint/tokens`, created now because a colour is finally shared

The `styling` spec forbids a token package until a value is needed by both
applications, and requires one the moment such a value appears. Family colours are that
value.

The package is deliberately small: platform-neutral literals, no dependencies, imported
directly by both applications. The spec's derivation machinery governs
*platform-specific representations* — CSS custom properties, a native stylesheet — and
this change produces none, because neither application has any styling yet. Both
consume the same literals.

That is not a loophole. The requirement that matters immediately is single source of
truth, and it is satisfied. The derivation requirements apply in full the moment
someone wants these colours in CSS.

### D6 — Mobile moves to a development build

`@maplibre/maplibre-react-native` contains native code. Expo Go ships a fixed set of
native modules and cannot load it, so the mobile app must move to a development build.

The cost is smaller than it appears: simulator and local device builds are free, and a
free Apple ID signs a build onto a personal device for seven days. The Apple Developer
Program is required only to put the app on someone else's phone for longer than that,
which this change does not do.

Deferring mobile to a later change was considered and rejected. Every change so far has
proven itself on both platforms, and this is the change whose entire purpose is the
boundary that exists between them. Proving half of it would leave the founding risk
open while building the abstractions that depend on it being closed.

### D7 — Where marker presentation lives

`marker-type.ts` currently sits in `@pinpoint/core` alongside domain schemas, but icons
and colour families are presentation data, and the descriptor function that consumes
them belongs in `@pinpoint/map` beside `fitBounds`.

Splitting them — validation in `core`, appearance in `map` — means a marker's type is
described in two packages. Moving the whole file to `map` means `core`'s marker schema
must validate a type it does not define.

Preference is to move the presentation half to `@pinpoint/map` and have `core` keep
only the validation, taking the list of valid identifiers from `map`. That inverts no
dependency: `map` declares no workspace dependencies, so `core` may depend on it.
Confirm against the cycle check during implementation.

### D8 — Seed data is disposable and says so

Roughly sixteen well-known Kyoto places, and one city, inserted by a migration so the
map has something to draw. Coordinates are approximate and were not geocoded.

Its purpose is to exercise realistic density: several markers within a kilometre
downtown, others five to nine kilometres out. A handful of evenly spaced points would
make the map look better than it will be.

The migration states in its own text that it is disposable and names the change that
removes it, so it is not mistaken later for real trip data.

Starting set, approximate to about a hundred metres and deliberately not geocoded:

| Place | lat | lng | type |
| --- | --- | --- | --- |
| Fushimi Inari Taisha | 34.9671 | 135.7727 | temple |
| Kiyomizu-dera | 34.9949 | 135.7850 | temple |
| Kinkaku-ji | 35.0394 | 135.7292 | temple |
| Ginkaku-ji | 35.0270 | 135.7982 | temple |
| Ryoan-ji | 35.0345 | 135.7182 | temple |
| To-ji | 34.9812 | 135.7476 | temple |
| Sanjusangen-do | 34.9879 | 135.7717 | temple |
| Yasaka Shrine | 35.0036 | 135.7786 | temple |
| Nijo Castle | 35.0142 | 135.7481 | castle |
| Kyoto Imperial Palace | 35.0254 | 135.7621 | attraction |
| Arashiyama Bamboo Grove | 35.0170 | 135.6716 | park |
| Philosopher's Path | 35.0270 | 135.7947 | park |
| Gion / Hanamikoji | 35.0036 | 135.7752 | attraction |
| Pontocho Alley | 35.0050 | 135.7707 | restaurant |
| Nishiki Market | 35.0050 | 135.7649 | market |
| Kyoto Station | 34.9858 | 135.7588 | station |

Two further markers share Kyoto Station's coordinates exactly, standing in for the
geocoder returning a building's centre point for the places inside it.

Note the distribution: twelve `see` against one each of `eat`, `buy` and `move`. That
lopsidedness is the point — it is what D2 responds to, and a tidier spread would hide
the problem.

### D9 — Selecting a marker shows what was recorded, and the two platforms may differ

A map you cannot interrogate is a constellation of anonymous dots. Selecting a marker
shows the fields already held about it — name, note, link, price, type.

The presentations deliberately diverge. A popup anchored to the pin reads naturally on
a laptop; on a phone it fights the pin it is anchored to, and a sheet rising from the
bottom is the idiom people expect. Forcing one shape onto both would produce something
mediocre on each, and the `styling` spec already establishes that platforms share
values rather than markup.

What *is* shared is which fields exist and how an absent one is treated — that comes
from the domain schema, not from either application.

This grows the change. It is accepted because a read-only map with no way to ask "what
is this?" does not answer any question worth opening it for, and because a detail view
is what makes the coincident-marker decision in D4 implementable rather than
theoretical.

Note the ordering constraint it creates on mobile: a bottom sheet implies gesture and
animation handling that this app does not currently have. If that turns out to pull in
more than expected, a plain screen is an acceptable first form — the specification
requires the information be reachable without leaving the map, not that it arrive on a
sheet.

### D10 — The map filters and frames; it does not know about cities

There is no city mode, no city view, and no branch in the rendering code on which city
is active. The map holds a camera and a set of markers. City is a filter that decides
which markers exist and where the camera is sent.

The rendering path is therefore identical whether one city, several, or none are in
view, and adding the city filter later changes what is passed in rather than how
anything draws.

One consequence worth protecting now: "filtered out" should mean *rendered differently*
with "not at all" as one option, rather than *absent from the data the renderer sees*.
The difference costs nothing today and matters later — for a trip whose cities are
close together, showing another city's markers de-emphasised answers a real question
("is Nara worth a day trip, and what is near it?") that a hard filter cannot.

This change has one seeded city and no filter interface, so framing is the whole trip.
The principle is recorded so that the filter, when it arrives, is a change of input
rather than a rewrite.

### D11 — Share the async state, not the surface

Loading and failure states are wanted from the start rather than retrofitted. The
tempting shape — shared loading components — is the one thing the `styling` spec
forbids: platforms share token values and explicitly not styling code, class-name
vocabulary, or component markup. A component must render something, and `<div>` and
`<View>` are not the same something. A shared spinner is not a shortcut past that rule;
it is the rule's subject.

The half that carries the bugs is shareable anyway:

```
  SHARED                              PER PLATFORM
  ──────                              ────────────
  the async result shape              the spinner
  loading │ ready │ empty │ failed    the skeleton, the layout
  query functions taking a client
  and returning a discriminated       rendered with shared tokens,
  result — the @pinpoint/auth pattern so they still look like one product
```

Forgetting the failed branch, spinning forever because a state never resolves, showing
"nothing saved yet" while a request is still in flight — those are logic bugs, they are
identical on both platforms, and they live entirely on the left. The spinner is not
where things go wrong.

The two applications start from different places. Web has no loading or error
boundaries at all; its page awaits a query and renders. Mobile already re-derives a
`loading` boolean in two separate screens. So "from scratch" means adding boundaries on
one side and consolidating a duplicated pattern on the other.

## Risks / Trade-offs

- **The portability bet may not survive contact.** The native library may want a style
  document rather than a URL, or a camera expressed differently. That is the risk this
  change exists to retire; if the shape has to change, better now than after two more
  changes assume it.
- **The dev build is a step change in mobile friction.** Iteration stops being "scan a
  QR code" and becomes a native build. Expected, but it lands in this change and will
  be felt in every mobile change after it.
- **View-based markers cap growth.** Acceptable at tens, and the ceiling is far above
  any real trip. Recorded so the cap is a known bound rather than a surprise.
- **Emoji render differently across platforms.** The same marker will not look
  pixel-identical on iOS and Android and web. Acceptable for a personal tool, and the
  reason a real icon set might eventually replace them — which per D1 also means
  revisiting D1.
- **Seed data can be mistaken for real data.** Mitigated by the migration saying so,
  but somebody will still see Kyoto markers and wonder who added them.

## Open Questions

- Where do the shared query functions live — inside `@pinpoint/supabase` next to the
  client factory, or in a package of their own? `@pinpoint/auth` set the precedent of a
  separate package per concern, which argues for a data package; against it, one
  function does not justify one package.
- Does the detail view from D9 become what the list later shows for a selected marker,
  or do the two stay separate? Building it as a presentation of a marker rather than as
  a map popup keeps the option open.
- Should another city's markers be visible while a city filter is active, de-emphasised
  rather than absent? D10 keeps the door open; nothing in this change decides it.
- On mobile, is a bottom sheet worth the gesture and animation handling it implies, or
  is a plain screen the right first form? The specification permits either.
