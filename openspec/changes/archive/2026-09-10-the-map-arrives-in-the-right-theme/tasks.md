## 1. The record the renderer disagrees with

Ordered first and verified before section 2 exists. Section 2 removes the trigger, so a map
that arrives dark after both changes proves nothing about this one.

- [x] 1.1 In `apps/web/app/_components/trip-map.tsx`, move the `appliedStyle` ref
      declaration above the create effect. It is currently declared between the two effects
      that use it, which was fine while only one wrote to it.
- [x] 1.2 In the create effect, assign `appliedStyle.current = style` next to the
      `new MapLibreMap({ … })` call, from the same `style` binding handed to the
      constructor. The same value, not a re-read — the point is that the record and the
      handoff cannot drift.
- [x] 1.3 In that effect's teardown, beside `instance.remove()` and `setMap(null)`, clear
      `appliedStyle.current = null`. While there is no map there is no document being held.
- [x] 1.4 Delete the `if (appliedStyle.current === null) { appliedStyle.current = style;
      return }` branch from the repaint effect. What remains is the equality check, the
      assignment and `map.setStyle(...)`.
- [x] 1.5 Rewrite the comment above `appliedStyle`. It currently explains `setStyle`'s
      camera-preserving property, which is still true and is not the thing that needed
      saying. Say what the ref is: the document the renderer was given, written where it was
      given, because React state holds the latest style and not the applied one, and
      `map.getStyle()` returns a resolved style that cannot be compared by reference.
- [x] 1.6 Note in the create effect's existing `exhaustive-deps` comment that it now also
      owns the record. The suppression's justification is unchanged; what changed is that
      this effect has a second job, and the next person to key it differently needs to know
      the ref goes with it.

## 2. The mode a remount starts on

- [x] 2.1 Rewrite `apps/web/lib/use-colour-scheme.ts` onto `useSyncExternalStore`:
      `subscribe` binds a `change` listener on
      `window.matchMedia('(prefers-color-scheme: dark)')` and returns the unsubscribe;
      `getSnapshot` returns `query.matches ? 'dark' : 'light'`; `getServerSnapshot` returns
      `'light'`.
- [x] 2.2 Define all three at module scope, not inside the hook. `getSnapshot` returning a
      fresh value or an unstable identity is an infinite render loop rather than a subtle
      bug, and the value here is a string, so identity costs nothing.
- [x] 2.3 Do not touch `window.matchMedia` at module top level. The query must be created
      inside the functions or lazily on first call — a module-level call runs during the
      server render of anything importing this file.
- [x] 2.4 Rewrite the docstring. Its hydration argument is still correct and is now narrower
      than it reads: the server cannot know the preference and the first client render must
      match what the server produced, but every mount after that can and should read the
      real value. Say which mounts those are and why there are any — `page.tsx` keys the
      workspace on the trip.
- [x] 2.5 Confirm `trip-map.tsx` is still the only consumer, and that the hook's claim to be
      "the exception, and the only one" is still true. It was true when checked; it is a
      claim worth re-checking whenever the file is edited.

## 3. The specification

- [x] 3.1 Apply the delta to `openspec/specs/map-rendering/spec.md` — two requirements
      added, none modified. Place them beside the existing
      *The map is drawn in the same theme as the interface around it*, which they extend,
      rather than appended at the end of the file. *Applied: two requirements added, placed directly after *The map is drawn in the same theme as the interface around it* rather than at the end of the file. 69 insertions, nothing removed; `pnpm check:specs` green.*
- [x] 3.2 Check the second new requirement — that the renderer holds what the application
      believes it holds — against the other place a style reaches a renderer:
      `apps/mobile`. The style is a prop there and there is no record to disagree with, so
      it should conform trivially. Confirm rather than assume, and note which it was. *Checked, conforms trivially: `apps/mobile/components/trip-map.tsx:875` passes `mapStyle={basemap.style}` as a prop. React Native reconciles it declaratively, so there is no imperative handoff and no record that could disagree with the renderer. `useThemeMode` also answers correctly on the first render, so the first new requirement holds there too.*
- [x] 3.3 `AGENTS.md`: the effect-ordering shape here is the kind of thing that file exists
      for — a cached promise resolving in a microtask beats a `setState` scheduled from a
      mount effect, so a cleanup's `live = false` cannot cancel it. Add it if the file does
      not already say something equivalent.
 *Added two entries under "Gotchas that cost real time": the microtask-beats-effect ordering, and imperative state lagging a render behind. Neither was stated.*
## 4. Looking at it — the defect itself

The bug needs a warm style cache, so the first trip opened in a session cannot show it.
Every step below opens a trip *first*.

- [x] 4.1 **Before touching anything, reproduce it.** System appearance dark, open a trip,
      switch to another. Confirm the light map under dark chrome. A fix for a bug that was
      not seen failing is a fix for a guess.
- [x] 4.2 **After section 1 only, with section 2 not yet written.** Repeat 4.1. The map must
      arrive dark. This is the only step that isolates the ref fix, and it stops being
      available the moment section 2 lands. *Verified before section 2 existed: with only the ref fix in place, switching Japan → Europe with the system dark arrived dark, and switching back arrived dark. The same two steps produced the light map in 4.1.*
- [x] 4.3 In the same state as 4.2, watch for the light frame. The fix applies the dark
      style to a map that was built light, so a brief light frame is expected here and is
      what section 2 removes. Note whether it is visible to the eye or only to a recording —
      it is the difference between section 2 being a polish and being part of the fix.
      *Not caught: three switches screenshotted as fast as the tool allows all showed the
      dark map already drawn. Screenshot latency is far longer than a frame, so this is not
      evidence of absence — the code path guarantees the map is constructed from the light
      document whenever the cache is warm. Recorded as "below what could be observed here",
      not as "did not happen"; section 2 removes it by construction either way.*
- [x] 4.4 **Create a trip**, with the system dark and a trip already open. The map arrives
      dark. Creating goes through the same remount as switching but with different data in
      flight, and the ticket names both. *Verified: created "Theme check (delete me)" with the system dark; the new trip's map arrived dark on its first frame. The trip was archived afterwards — see the note at the end of this file.*
- [x] 4.5 Repeat 4.1 and 4.4 with the system in **light** mode. Nothing here is symmetric by
      construction — `'light'` is the server snapshot and the value a failure falls back to,
      so a light-mode pass is the weaker of the two and is worth having precisely because a
      bug in this area could hide in it.
 *Confirmed by the maintainer. Not measured here — system appearance follows the OS with no in-app toggle, and this environment could not set it to light; everything verified here was verified in dark.*
## 5. Looking at it — what the fix must not have broken

- [x] 5.1 **Cold load, every path.** Hard reload a trip in each theme. This is the path that
      always worked, and it is the one where `style` now goes non-null with the map's record
      written in the same effect. The map must draw, in the right theme, with no repaint. *Verified in both dev and a production build: hard reload draws the map dark with markers, no repaint, no light frame.*
- [x] 5.2 **A theme change while the map is open, having switched trips at least once.** The
      map follows on the *first* change. This is the second symptom in `#64` and the one the
      ticket's repro does not cover; before the fix the comparison was dark-against-dark and
      did nothing. *Confirmed by the maintainer: the map follows on the first appearance change, having switched trips beforehand. This was the load-bearing check — after section 2 a trip switch resolves only the correct document and never calls `setStyle`, so a real appearance change is the only thing that exercises the repaint path and the ref that gates it.*
- [x] 5.3 **The camera survives a theme change.** Pan and zoom somewhere unlike the trip's
      framing, then change appearance. The view does not move. `setStyle` is what makes this
      true and section 1 changes when it is called, not whether. *Confirmed by the maintainer: the camera does not move across a theme change.*
- [x] 5.4 **Markers survive a theme change**, in the new theme's colours. They are DOM
      elements the renderer only positions, so they should — but `setStyle` is now reachable
      in a state it was not reachable in before. *Confirmed by the maintainer: the markers survive the repaint, in the new theme's colours.*
- [x] 5.5 **`themedBasemap` is called once per trip switch, not twice.** Count it from the
      console. Two calls means the mode is still correcting after mount and section 2 did
      not take, even if the map looks right. *The criterion as written was wrong, and measuring it corrected it. In development a switch calls `themedBasemap` **twice**, but both calls are `dark` — the doubling is React StrictMode double-invoking the mount effect, not the mode correcting. Settled against a production build (`pnpm build && pnpm start`), where a switch makes **exactly one** call, `dark`. A cold page load is `light, dark` in both: that first light call is the hydration render, is by design, and is the one case the server snapshot must cover.*
- [x] 5.6 **The style failure path.** Block the tile request and confirm the map still
      reports that it could not load the map style, rather than presenting a blank canvas.
      `setStyleError` is untouched, and the create effect now writes a ref before that
      branch can matter; confirm the order is still right. *Verified: with the style forced to reject, the map shows "The map could not be loaded — the tile service answered 503. Your saved places are still here; only the map underneath them is missing." No blank canvas. The temporary failure was reverted.*
- [x] 5.7 **The phone application**, opened once. Nothing in this change reaches it and the
      standing lesson is that things which type-check are wrong anyway. A trip opens, the
      map draws in the device's theme.
 *Confirmed by the maintainer. Not run here — no development build on the booted simulator and no `ios/` directory, so it needed `expo prebuild` and a full native build. The change touches no file under `apps/mobile` and no shared package, but that is an argument rather than a look, which is why it went to the maintainer instead of being waved through.*
## 6. Close out

- [x] 6.1 `pnpm verify` green — lint, lint:mobile, typecheck, typecheck:mobile,
      typecheck:packages, test, build, check:tokens, check:fonts, check:icons, check:rls,
      check:cycles, check:specs. *Green, exit 0: lint, lint:mobile, typecheck, typecheck:mobile, typecheck:packages, test, build, check:tokens, check:fonts, check:icons, check:rls, check:cycles, check:specs. Note on `apps/web/next-env.d.ts`: it is generated, and running `next dev` rewrites its import from `./.next/types/routes.d.ts` to `./.next/dev/types/routes.d.ts`. `next build` does **not** put it back, so it shows as a modified file after any dev session and was reverted by hand here. Pre-existing, unrelated to this change, and worth a `.gitignore` entry or a committed dev-variant decision at some point.*
- [x] 6.2 Close `#64`, saying what it turned out to be: not a missing repaint but a repaint
      into a ref, reachable only because `setMap` is state and the repaint effect returns at
      `!map` before it can record what the map was built with. Note that the ticket's fix
      plan was right and that its second half is what removes the light first frame. *Closed, with the refined trace: the defect was a repaint into a ref, reachable because `setMap` is state and the repaint effect returns at `!map` before it can record what the map was built with. Noted there that the ticket's fix plan was right and that its second half is part of the fix rather than polish — without it the map is still constructed light on a warm cache and corrected a frame later.*
- [x] 6.3 `openspec archive the-map-arrives-in-the-right-theme`.
 *Archived with `--skip-specs`: the delta had already been applied to `openspec/specs/map-rendering/spec.md` in 3.1, so letting archive apply it again would have added both requirements a second time.*
## Note — the trip created by 4.4

`Theme check (delete me)` was created against the real Supabase project to verify 4.4 and
**archived immediately afterwards**. It is in *Archived trips*, not deleted; remove it there
if you would rather it were gone.

## Note — where the real coverage came from

Everything verified from this session exercised the map's *creation* path. The repaint path
— `setStyle`, and the ref that decides whether it is called — is exercised by nothing that
can be reached without a real system appearance change, and after section 2 a trip switch
resolves only the correct document and never calls `setStyle` at all.

So 5.2, 5.3 and 5.4, all confirmed by the maintainer, are the steps that actually cover the
defect's second symptom. 4.1 through 4.4 cover the first.
