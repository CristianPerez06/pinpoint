## Context

`TripMap` binds a React tree to an imperative renderer. Three effects share the job, and
each is defensible read alone:

| effect | dependency | what it does |
| --- | --- | --- |
| fetch | `[mode]` | `themedBasemap(mode)` → `setStyle(document)` |
| create | `[style !== null]` | `new MapLibreMap({ style, … })` → `setMap(instance)` |
| repaint | `[map, style]` | `map.setStyle(style)` when it differs from `appliedStyle.current` |

The create effect's dependency is the interesting one, and it is deliberate: keying on
`style` itself would tear the map down and rebuild it on every theme change, throwing away
the camera. So the map is created from the first style to arrive and every later style goes
through `setStyle`, which swaps the document without touching the camera or the markers.

That split needs someone to know which document the renderer is currently holding, because
React state cannot answer it — state holds the latest style, not the applied one, and
`map.getStyle()` returns the renderer's *resolved* style rather than the document it was
given, so it is not comparable by reference. `appliedStyle` is that record. It was
initialised to `null` and taught to read `null` as "the map was built with whatever `style`
is now", which is true exactly when the repaint effect's first run coincides with the map's
creation.

It does not. `setMap` is state, so `map` is `null` for the remainder of the commit in which
the map is built, and the repaint effect returns at `if (!map || !style)` without recording
anything. By the time it runs with a live map, `style` may already have moved on — and on a
warm style cache it has. The proposal traces the ordering.

## Goals / Non-Goals

**Goals:**

- A map created after a client-side navigation draws in the current theme on its first
  frame.
- `appliedStyle` means what its name says: the document the renderer was given.
- A theme change is honoured the first time it is made, in every state the map can be in.
- No second fetch-and-transform of the OpenFreeMap document per trip switch.

**Non-Goals:**

- Changing how the map is created, or when. The create effect keeps `[style !== null]` and
  keeps its `exhaustive-deps` suppression; a theme change must still repaint in place.
- Removing `key={trip.id}` from `page.tsx`. It is upstream of the symptom and is not the
  bug — see Decisions.
- Automated tests. Excluded by the maintainer; the reasoning is recorded in the proposal.
- Anything in `@pinpoint/map`, `@pinpoint/tokens` or `apps/mobile`. The shared style
  transformation is correct and is not involved.

## Decisions

### Record the style at the constructor, not at the first repaint

`appliedStyle.current` is assigned the exact document passed to `new MapLibreMap`, inside
the create effect, and cleared to `null` in that effect's teardown. The
`appliedStyle.current === null` branch in the repaint effect is deleted; the effect becomes
a plain comparison.

The write happens where the fact is known. Nothing else in the component can observe the
handoff, and the one-render lag of `setMap` is exactly what made the deferred version
wrong.

Clearing on teardown matters for two reasons and not for the obvious one. Under React's
development double-invoke the sequence is create → teardown → create, and a stale record
across that pair would make the second map's first genuine repaint a no-op. It also keeps
the ref honest rather than merely convenient: while there is no map there is no document
being held, and the ref should say so.

*Alternative — key the create effect on `style` and rebuild.* Correct by construction and
much simpler, and rejected for the reason the existing comment gives: it throws the camera
away on every theme change. Somebody toggling appearance while looking at a place would be
returned to the trip's framing.

*Alternative — ask the renderer.* `map.getStyle()` is not the document that was passed in;
MapLibre returns its resolved style. There is no identity to compare, and comparing by
value means deep-equalling a full OpenFreeMap document on every render. Rejected.

*Alternative — hold the map in a ref instead of state, so `map` is non-null immediately.*
This would close the gap too, and it is a larger change than the defect warrants: `map` is
read by roughly a dozen effects and by render, and moving it out of state means each of
those needs its own way of learning when the map appears. It also fixes this instance
without fixing the rule — a style resolving between creation and the first repaint is
legitimate whatever `map` is stored in. Rejected as scope.

### `useSyncExternalStore`, with `'light'` as the server snapshot

```
useSyncExternalStore(
  subscribe,        // matchMedia('(prefers-color-scheme: dark)') change events
  getSnapshot,      // query.matches ? 'dark' : 'light'
  getServerSnapshot // 'light'
)
```

React uses `getServerSnapshot` when rendering on the server *and* for the initial client
render that hydrates it, then `getSnapshot` from then on. A component mounted later — which
is every `TripMap` after a trip switch — uses `getSnapshot` and starts correct. The
hydration argument in the current docstring survives intact; it simply stops applying to
mounts it was never about.

This is the hook's whole purpose. It exists so that a value read from outside React can be
read *during* render without tearing, which is precisely what the current
`useState` + `useEffect` pair is working around.

*Alternative — `useState` with a lazy initialiser that reads `matchMedia`.* Shorter, and
wrong on the first client render: the initialiser would return `'dark'` where the server
produced `'light'`, which is the hydration mismatch the current code is avoiding.

*Alternative — leave the hook alone and rely on the ref fix.* Sufficient to close the
ticket. Rejected because it leaves every trip switch fetching and transforming the style
document twice and painting the first frames on the wrong ground, and leaves the latch
reachable by an appearance change landing inside map construction.

### `page.tsx` is not touched

`key={trip.id}` is the reason a trip switch is a remount, and the remount is the reason the
warm cache is reachable — so it is tempting to call it the root cause. It is not. The key is
load-bearing and its comment argues for it correctly: the workspace seeds client state from
props once, and without the key a new trip would render the previous trip's markers, cities
and filter. Removing it trades a wrong-coloured map for a wrong trip's places.

The map should tolerate being remounted. After this change it does, and the key stays a
decision about state seeding rather than about tiles.

## Risks / Trade-offs

- **The race is timing-dependent, so "it works now" is weak evidence.** The bug needs a warm
  module-level cache, which means the first trip opened in a session cannot show it. →
  Verification is written to open a trip *first* and switch second, and to check both
  orders. The `useSyncExternalStore` half also removes the trigger, so a passing test after
  both changes does not prove the ref fix works. → Verify the ref fix in isolation, before
  the hook is touched. This is why the tasks are ordered ref-first.

- **Clearing `appliedStyle` on teardown could strand a repaint.** If the create effect tears
  down and re-runs while a style is in flight, the new map is built from the current `style`
  and the record is rewritten to match — no repaint is owed. The only re-run is
  `style !== null` flipping, which cannot go back to `false`, and unmount. → Low, but named
  because it is the kind of thing a later refactor of the create effect's dependency would
  quietly break.

- **`getServerSnapshot` must be a stable reference returning a stable value.** Returning a
  fresh object, or defining the function inside the hook body without care, produces an
  infinite render loop rather than a subtle bug. → Module-level constants for the snapshot
  functions; the value is a string, so identity is free.

- **`matchMedia` at module scope would break SSR.** The subscribe and snapshot functions run
  only on the client, but a module-level `window.matchMedia(...)` call would execute during
  the server render of any module that imports the hook. → The query is created inside the
  functions, or lazily; never at module top level.

- **The theme cannot be emulated in the verification environment.** The last change hit this
  exactly: appearance follows `prefers-color-scheme` with no in-app toggle, and the browser
  used for verification could not emulate it. → Verification steps that need a real
  appearance change are marked as the maintainer's to confirm rather than assumed, and the
  measurable parts (which style document reaches the renderer, how many times
  `themedBasemap` is called per switch) are checked from the console instead.

## Open Questions

- **Should `useColourScheme` move to a package?** It is a web-only hook with one consumer,
  and `apps/mobile` has its own. Nothing forces the question now; raising it because the
  `styling` spec calls the asymmetry deliberate, and this change makes the two hooks look
  more alike rather than less. Left alone.

- **`apps/web` has no test runner.** Excluded from this change, but the ticket asked for a
  test and the reason it cannot have one is a gap rather than a decision. Worth its own
  change if a second effect-ordering defect turns up here.
