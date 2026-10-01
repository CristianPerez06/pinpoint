## Context

- **The laptop** animates with CSS only (`motion` design, decision 1). Its corner panels
  (`overlayPanelClass` in `ui.module.css`: details and the add/edit form, in the workspace
  and the calendar), the panels hanging from the bar's shared popover button in `ui.tsx`
  (the filter, the account menu and the other bar panels) and the search results are
  mounted and unmounted by React, so today they pop. The currency list is not a surface: it
  sits inside the form and pushes the form down, so it is left as it is. `globals.css` already collapses every
  animation and transition to 0.01ms under `prefers-reduced-motion`.
- **The laptop's pins** are `maplibre-gl` `Marker`s holding DOM elements. The effect in
  `trip-map.tsx` removes and re-adds *every* marker whenever the shown set or the selection
  changes, so it cannot tell a deleted place from one that was filtered away. The draft pin
  (`styles.draft`) already plays the `drop` keyframes when it is created.
- **The phone** animates with Reanimated (`motion` design, decision 2). Its sheets are React
  Native `Modal`s with `animationType="slide"`: the filter, search, trip, city, people, menu,
  attribution and currency sheets. The date picker in `ui.tsx` is a `Modal` that fades. Those
  animations are the system's, with their own timing, and no token reaches them. The details sheet (`marker-details.tsx`) is an absolutely positioned view and pops. The
  add form (`marker-form.tsx`) springs with React Native's own `Animated` and is #245's.
- **The phone's pins** are `@maplibre/maplibre-react-native` v11 `Marker`s holding React
  views (`Pin`, `DraftPin`). The draft does not drop.
- **The waiting area** is `LoadingState` in both apps' `states.tsx`, used only for the map's
  waits: a 20px CSS spinner on the laptop, `ActivityIndicator` on the phone. The small
  spinners inside controls are separate and stay.
- **The globe's look** comes from the opening (`apps/mobile/lib/splash/`): the sphere is
  `COLOUR.accent.light`, the pin `COLOUR.inkOnAccent.light`, and the continents are a literal
  `LAND = '#B8741A'` in `scene.ts`, drawn from the land mask in `land.generated.ts`. The
  icon tooling in `.github/scripts/` already renders and encodes PNGs of the mark without a
  dependency, and `pnpm check:icons` compares committed images with what it would produce.

## Goals / Non-Goals

**Goals:**
- One way to open and close a surface on each platform, so that every sheet, panel and menu
  gets the timing by using it rather than by repeating it.
- The globe drawn once, as images, by the tooling that draws every other image of the mark.

**Non-Goals:**
- A second animation mechanism on either platform. Nothing here meets a revisit condition.
- Gestures on sheets (dragging one down to dismiss). Nothing has them today.
- The add form on the phone (#245).

## Decisions

### 1. The laptop keeps a closing surface mounted with a small presence hook, not a library

Leaving is the revisit condition the `motion` design names for adding Motion: "an element has
to animate as it *leaves* the page". The condition is met only if CSS cannot do it, and it can,
once the element is kept on the page until its transition ends. A hook,
`usePresence(open)`, returns `{ mounted, state }`: on close it keeps `mounted` true, sets
`state` to `closing` (a `data-state` attribute the CSS keys on), and clears `mounted` on
`transitionend`, with a timeout of the closing duration as a backstop. The timeout matters
because `transitionend` does not fire when nothing actually transitions, and under
`globals.css`'s reduce-motion rule the transition is 0.01ms. While `closing`, the element gets
`inert`, which removes it from presses, the keyboard and assistive technology at once.

Opening uses `@starting-style`, so a newly mounted element transitions from its starting
style without a frame of JavaScript (Chrome 117, Safari 17.5, Firefox 129). A browser without
it shows the surface at once, which is the reduce-motion behaviour and harms nothing.

The CSS lives in one place, a `surface` class pair in `ui.module.css` (`[data-state=open]`
and `[data-state=closing]`) reading `--pp-duration-arrive`, `--pp-ease-settle`,
`--pp-duration-standard` and `--pp-ease-standard`, with the 16px rise from the mock.
Surfaces that hang from the bar rise *downward* into place, the opposite of corner panels,
via one custom property for the direction.

**Not chosen:** Motion's `AnimatePresence`. It is the expected candidate if the condition is
ever met, but adding it for a job a short hook does would spend the one second mechanism the
laptop is allowed. View Transitions: a page-level snapshot is the wrong tool for a panel in a
corner, and Firefox's support is recent.

### 2. The phone opens every sheet through one `Sheet` component on Reanimated

A new `components/sheet.tsx` wraps `Modal` with `animationType="none"` and draws the surface
inside with Reanimated: `translateY` from the sheet's height to 0 on open (`withTiming`,
`DURATION.arrive`, `Easing.bezier(...EASING.settle)`), and back on close (`DURATION.standard`,
`EASING.standard`). The backdrop fades with the same timings. Like the laptop, it keeps the
`Modal` visible until the closing animation ends (the callback to `withTiming`), because a
`Modal` set invisible unmounts its children before any exit animation can run. Under
`useReducedMotion()` it animates only opacity, over `DURATION.brief`.

The filter, search, trip, city, people, menu, attribution and currency sheets move onto it.
The date picker, which floats in the middle rather than sitting on the edge, uses `Sheet`'s
floating placement: it rises a short distance while fading, as the laptop's panels do. Each keeps
its own contents and its `KeyboardAvoidingView` layout (the `AGENTS.md` gotcha stands:
`Sheet` positions, the sheet's own surface view carries the padding and `maxHeight`). The
details sheet is not a `Modal`; it gets the same timings through Reanimated's
`entering`/`exiting` on its surface, built from the same tokens by the same helper, so the
two cannot drift.

**Not chosen:** keeping `animationType="slide"`. It cannot take a token, and it does not
read reduce motion.

### 3. Pins: the map is told which place was just deleted

The workspace already knows when a deletion succeeds (`deleteMarker` returns). It passes the
deleted place's id to the map as `departing`. On the laptop, the marker effect diffs against
the previous render by group key: a group that vanished *and* contained `departing` keeps
its marker for `DURATION.standard` with a `leaving` class (opacity to 0, scale to 0.6 from
the bottom centre), then removes it. Every other vanished group is removed at once, as
today. A group that only lost a member is still present, so it simply re-renders with the
lower count. On the phone, the same rule keeps the departing group in the rendered list for
the same duration, with Reanimated fading and scaling the `Pin` view inside its `Marker`.

The drop on the phone: `DraftPin` mounts with Reanimated `entering` built from
`DURATION.arrive` and `EASING.overshoot`, falling the laptop's 14px. Its key does not change
when it moves or when the place is saved, so neither replays it. The laptop is unchanged
except that its `drop` keyframes read the tokens instead of the literal `0.42s
cubic-bezier(...)`.

### 4. The globe is a sprite sheet cut by the icon tooling

`.github/scripts/icon-globe.mjs`, beside `icon-mark.mjs`, renders the globe: an orthographic
projection of the land mask, 72 frames of one full turn, tilted toward the viewer by the
opening's tilt, with the soft light of the mock. It is laid out as a 9 × 8 grid, because a
single row 72 frames long would exceed the 8192px texture limit some Android phones have at
3× density. The phone's copy has 144px frames (3×, 365 KB); the laptop's has 96px frames (2×,
211 KB), because a browser downloads it while it is waiting for everything else. The pin is **not** in the image: each app draws it on top from `MARKER_PATH` and
`MARKER_HOLE`, so `product-mark` keeps one definition of the mark and the hole shows the
turning globe through it. `icon-assets.mjs` lists two copies, `apps/web/public/globe.png` and
`apps/mobile/assets/globe.png`, and `pnpm check:icons` covers them like every other asset.

The script reads the land mask from `apps/mobile/lib/splash/land.generated.ts` (Node 24
strips the types), and the darker amber moves from `scene.ts` into `@pinpoint/tokens` as a
non-themed `MARK_LAND`, beside the other mark values, since two things now draw it.

The laptop steps through the grid with CSS: two `steps()` animations on
`background-position`, one per axis, over `--pp-duration-turn`. The phone does the same with a
clipped `Image` whose offset is derived from a Reanimated value running linearly from 0 to 72
over `DURATION.turn`, repeated. Under reduce motion both show frame 0 and do not animate.

`DURATION.turn = 4000` is added to `motion.ts`, documented as the one duration that is a
period rather than a transition.

**Not chosen:** sliding a flat strip under a round clip (cheaper, but it reads as scrolling,
not turning); drawing frames at runtime (the phone has no canvas to draw them on).

## Risks / Trade-offs

- [A closing surface on the laptop is still on the page for 180ms, and a second open in that
  window could show two] → `usePresence` reopens the same element rather than mounting
  another: if `open` comes back while `closing`, the state returns to `open` from where it is.
- [Animating views inside a v11 `Marker` on the phone may not render on one platform,
  because the native side may draw the view once and not follow its changes] → Spike first
  (task 3.1) on both platforms. If it fails, the phone keeps its pins instant and the
  requirement is reported as a blocker, not quietly dropped.
- [Nine phone surfaces change at once, each with keyboard handling that has broken before] →
  Each is checked on the device with the keyboard up (tasks), and `Sheet` holds only the
  positioning, so no sheet's own layout moves.
- [The laptop's sheet is 211 KB, downloaded while the page is already waiting] → It is a
  static file the browser caches after the first visit. If it shows up as slow on a first
  load, drop to 48 frames.
- [The add form on the phone keeps its spring until #245, so one sheet out of nine opens
  differently] → Recorded in the proposal. #245 moves it onto `Sheet`'s timing.
