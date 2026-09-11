## Why

`#64`: with the system in dark mode, switching trips or creating one leaves a light
basemap — cool grey water, white land — under dark chrome. Everything else on the screen
is correct, because everything else is CSS and the cascade repainted it without asking
anyone. Only the tiles disagree, and they stay wrong until the page is reloaded.

The ticket's diagnosis holds up against the code. What it does not say is how narrow the
window is, and the narrowness is the whole defect.

**`map` is state, and that is what opens the hole.** The creation effect calls
`setMap(instance)`, so `map` is still `null` for the rest of that commit. The repaint
effect's first line is `if (!map || !style) return` — so on the render where the map is
actually built, the repaint effect returns before reaching the `appliedStyle.current ===
null` branch and latches nothing. One render later the dark document has already arrived,
and the branch that was meant to record *what the map was built with* records the document
the map was never given:

```
microtask   the light document resolves from the module cache  → setStyle(light)
effect      useColourScheme corrects on mount                  → setMode('dark')
  │
  ├─ render  style=light, mode=dark
  │    ├─ fetch effect re-runs for 'dark'     → microtask queued
  │    ├─ create effect  → new MapLibreMap(light), setMap(instance)
  │    └─ repaint effect → map is STILL null  → returns, latches nothing
  │
  ├─ microtask  the dark document resolves    → setStyle(dark)
  │
  └─ render  map=instance, style=dark
       └─ repaint effect → appliedStyle.current === null
                         → adopts dark, returns              ← never applied
```

The renderer holds light. React believes dark. Neither half is wrong on its own terms —
both effects ran, neither threw, the state is correct. The map is not failing to repaint;
it is repainting into a ref.

And it stays broken, because the ref now claims the map holds a document it does not. The
next genuine appearance toggle compares dark against dark and does nothing either. The
first symptom is a light map; the second is a theme switch that needs pressing twice.

**Why only on a remount, and why a reload fixes it.** `fetchStyleDocument` caches the
document for the session (`apps/web/lib/basemap.ts:23`). On a cold load the network is slow
enough that `useColourScheme` has long since corrected, only the dark document is ever
requested, and the map is built dark — the race is unreachable. On a remount the cache
answers in a microtask, which runs before React flushes the `setMode` scheduled from the
mount effect, and therefore before the fetch effect's `live = false` can cancel it. The
light document reaches state and the map is constructed from it.

**Why a remount happens at all.** `apps/web/app/page.tsx:133` keys `TripWorkspace` on
`trip.id`, deliberately and correctly — the workspace seeds client state from its props
once, and without the key a new trip would show the previous trip's places. But `TripMap`
goes with it, and `useColourScheme` starts every mount on `'light'` by design
(`apps/web/lib/use-colour-scheme.ts:20`), because the server cannot know the preference and
guessing produces markup the client disagrees with. That reasoning is sound for the first
mount and vestigial for every one after it: a mount that happens after a client-side
navigation is long past hydration and has no reason to pretend it does not know.

Mobile is not affected, and the reason is instructive rather than incidental.
`useColorScheme` answers correctly on the first render (`apps/mobile/lib/theme.ts:20`) and
`@maplibre/maplibre-react-native` takes the style as a prop, so there is no first-style
latch to be stuck on and no ref to disagree with. The defect is specific to the web app's
imperative renderer handoff.

## What Changes

- **The ref is made to mean what its name says.** `appliedStyle.current` is set to the
  exact document handed to the `MapLibreMap` constructor, inside the creation effect, and
  cleared in that effect's teardown. The `appliedStyle.current === null` branch then has
  nothing to do and goes away, and a style arriving while the map is being built is applied
  like any other.

  There is no way to ask the renderer instead. `map.getStyle()` returns the *resolved*
  style, not the document that was passed in, so it is not comparable by reference. What
  the renderer holds can only be known by recording it at the moment it is given — which
  is what this change does, and what the ref was always supposed to be.

- **`useColourScheme` reads the media query synchronously wherever it legitimately can**,
  via `useSyncExternalStore` with a `'light'` server snapshot. Hydration stays honest —
  React uses the server snapshot for the initial client render too — while a mount that
  happens after a client-side navigation starts on the ground the browser actually asked
  for.

- **Both, not either.** The first is the defect and fixes it on its own. The second closes
  the route by which the defect is reachable, stops the map spending the first frames of
  every trip switch on the wrong palette, and saves a fetch-and-transform of the whole
  OpenFreeMap document on every trip switch. Keeping only the second would leave the latch
  in place, still reachable by an appearance toggle landing inside map construction — rare,
  but the kind of rare this ticket already spent a reload discovering.

- **No test.** Excluded by the maintainer. Recording why, because the ticket asked for one:
  `apps/web` has no test runner and no `test` script — every test in this repo lives in
  `packages/*` — and the bug is in effect ordering, which a pure function extracted to
  `@pinpoint/map` could not see. A test worth having here is a real one against a mounted
  component, and standing that up is a change of its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-rendering`: the requirement that the map is drawn in the interface's theme already
  covers this, and is what the defect violates. What it does not cover is *arrival* — both
  its scenarios describe a map that is already open. The delta adds the case that broke:
  a map opening into a tree that is already running must be drawn in the current theme, not
  in whichever one a fresh mount happens to start on.

## Impact

- `apps/web/app/_components/trip-map.tsx` — the creation effect records what it hands the
  constructor; the repaint effect loses its null branch. The comment on
  `// eslint-disable-next-line react-hooks/exhaustive-deps` above `[style !== null]` stays
  and stays true: the map is still created from the first style only.
- `apps/web/lib/use-colour-scheme.ts` — rewritten onto `useSyncExternalStore`. Its
  docstring currently argues for the light-first behaviour this change is removing, so the
  reasoning has to be rewritten rather than trimmed: the hydration argument is still right,
  it just no longer applies to every mount.
- `apps/web/app/page.tsx` — untouched. The `key={trip.id}` is upstream of the symptom and
  is not the bug; its comment is a correct argument for a remount, and removing it would
  trade a wrong-coloured map for a wrong trip's markers.
- No change to `@pinpoint/map`, `@pinpoint/tokens`, `apps/mobile`, or the shared style
  transformation. Nothing in the fix leaves `apps/web`, and the portability boundary is not
  touched — the fetch, the mode, and the renderer handoff are all app-side by design.
- `openspec/specs/map-rendering/spec.md` — via the delta.
- Closes `#64`.
