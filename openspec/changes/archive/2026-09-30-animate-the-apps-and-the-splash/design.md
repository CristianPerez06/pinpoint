## Context

- **Motion today.** The laptop animates in about twenty places with CSS `transition` and
  `@keyframes`, and `apps/web/app/globals.css` already shortens every animation under
  `prefers-reduced-motion`. The phone has one animation: the capture form's sheet in
  `apps/mobile/components/marker-form.tsx`, which uses React Native's built-in `Animated`
  with a literal spring. No duration or curve is shared.
- **Launch today.** `apps/mobile/app/_layout.tsx` renders `Blank` (the theme's ground) until
  the Figtree font has loaded and `PreferencesProvider` has read the stored preferences. There
  is no native launch screen, and `EAS_SETUP.md` lists that as deliberately not configured.
- **The mark.** `MARKER_PATH` lives in `packages/tokens/src/layout.ts`. The hole in the head
  (`HOLE = { cx: 16, cy: 15, r: 6 }`) is defined only in `.github/scripts/icon-mark.mjs`, which
  cuts every icon asset. `pnpm check:icons` fails if a committed asset differs from what the
  mark would cut.
- **The approved mock** is saved as `mock/splash.html` in this change (the continent outline
  is left as a placeholder there; see decision 6). It is Three.js, and it is the reference for
  every value below.

## Goals / Non-Goals

**Goals:**
- Port the mock's scene to the phone with the same geometry, colours and timings.
- Put shared speeds, curves and springs in `@pinpoint/tokens` so the next animation on either
  platform has names to use.

**Non-Goals:**
- Moving the capture form's sheet, or any laptop animation, to the new tokens or library. They
  move when their code is next touched.
- Any 3D anywhere but the opening.

## Decisions

### 1. The laptop animates with CSS only

It already does, and nothing it animates needs more. **Revisit condition:** an element has to
animate as it *leaves* the page (a removed list row, a closing panel unmounted by React), or two
layouts have to be animated between, and the View Transitions API cannot do it in every browser
the laptop supports. Then one library may be added. Motion (formerly Framer Motion) is the
expected candidate.

### 2. The phone animates with `react-native-reanimated`

Expo's standard library. It runs animations on the UI thread, so they don't stutter while
JavaScript is busy, and it reads the system's reduce-motion setting (`useReducedMotion`,
`ReduceMotion.System`). Installed with `pnpm --filter mobile exec expo install
react-native-reanimated react-native-worklets`, so the versions match SDK 57, plus its Babel
plugin. **Revisit condition:** none foreseen. Gestures are a separate concern
(`react-native-gesture-handler`) and not an animation mechanism.

### 3. Motion tokens: a new `packages/tokens/src/motion.ts`

- `DURATION`: named milliseconds, for example `quick: 150`, `standard: 240`, `slow: 400`. The
  values are chosen from what the laptop already uses (0.15 s, 0.16 s, 0.18 s, 0.24 s), not
  invented.
- `EASING`: named cubic-bézier control points as four numbers, for example `standard`,
  `enter`, `exit`. The laptop gets `cubic-bezier(x1, y1, x2, y2)` and the phone gets
  `Easing.bezier(...)` from the same four numbers.
- `SPRING`: `{ damping, stiffness, mass }` for the hard-stop bounce. Reanimated takes these
  directly. CSS has no spring, so the laptop has none until it needs one.
- `derive.ts` emits `--duration-*` and `--ease-*` custom properties into `tokens.css`.
  `cubic-bezier()` is a literal function, not a host-resolved reference, so the `styling` rule
  against `var()` in derived values is not affected. Native consumes the module directly, as it
  does colours.

### 4. The hole moves into the tokens

`MARKER_HOLE = { cx: 16, cy: 15, r: 6 }` goes into `packages/tokens/src/layout.ts` beside
`MARKER_PATH`. `icon-mark.mjs` reads it with the same fail-loudly regex it uses for the path,
so the icons, the opening's flat frame and its 3D pin share one definition. This is what the
`motion` requirement "The 3D pin is the product's mark given depth" needs.

### 5. The opening draws with `expo-gl` and plain `three`

The mock's scene ports almost line for line. `expo-gl` provides a `GLView` whose context
`three`'s `WebGLRenderer` draws into (`renderer` created from `{ context: gl }` with a
canvas-shaped stub, and `gl.endFrameEXP()` after each render). No `@react-three/fiber` and no
`expo-three`: the scene is imperative, it lives for three seconds, and a declarative layer or a
lightly maintained wrapper would add dependencies to the launch path without adding anything.

The frame loop runs on the JavaScript thread, which is the thread the launch gate also uses.
The gate's work is asynchronous I/O (a font file and one AsyncStorage read), so it should not
contend. The risk below covers what happens if it does.

What building it taught, all recorded in `scene.ts` where it applies:
- **`three` refuses `expo-gl`'s WebGL 2 context as WebGL 1.** Its check is `context instanceof
  WebGLRenderingContext`, and `expo-gl` makes its WebGL 2 class inherit from the WebGL 1 one, as
  the specification describes. The global name is hidden for the length of the constructor, and
  only once `gl.supportsWebGL2` says the context really is WebGL 2.
- **Every surface shares one shading program.** Each distinct kind of material is a program the
  phone compiles before the first frame, and that frame is what the launch waits on. With
  `MeshStandardMaterial` and a separate kind per surface the first frame took 8 s in the iOS
  simulator; with every surface a `MeshPhongMaterial` carrying a colour map and a glow map (a
  one-pixel white texture where there is no pattern) it takes about 80 ms there and 400–500 ms
  on the Android emulator. The pin's shadow on the globe stays: it costs no measurable time.
- **Colour management is off.** The mock's `three` predates it, so lighting there is worked out
  on the colours as written. Converting to linear light and back washed the lit amber out, and
  leaving it off also makes the first, unlit frame exactly the hex values of the still image.
- **The 3D view is a 360-point square**, `SPLASH_STAGE_WIDTH`, centred, not the whole screen.
  Everything the opening draws fits in it; the ground around it is an ordinary view.
- **One blocking call per frame for back-pressure.** `expo-gl` queues drawing for a thread of its
  own and returns at once, so a phone slower than the frames asked of it would build a queue.
  `gl.getError()` after `endFrameEXP()` waits for that thread, so the next frame is only asked
  for once this one is drawn. The clock is time-based, so a slow phone drops frames rather than
  playing slowly.

Geometry, the same as the mock:
- **Flat frame:** the teardrop parsed from `MARKER_PATH` into a `THREE.Shape` (move, cubic,
  arc, cubic; the arc converted from endpoint form to a centre and angles, which gives the head
  centre (16, 17.47) as `layout.ts` documents), with the hole from `MARKER_HOLE`, extruded
  almost flat and drawn unlit in `inkOnAccent`.
- **3D pin:** a ball of the head's radius with a hole of `MARKER_HOLE.r` drilled through it
  along the view axis (a lathe of the sphere's profile outside the hole's radius), on a lathe
  cone from the tip to just under the hole. Both proportions come from the parsed path and
  `MARKER_HOLE`, never literals.
- **Globe:** an amber sphere plus a second, slightly larger sphere carrying the continents
  texture, which fades in.
- **Camera:** rises 22° while the pin fills out. The pin's point sits on the sphere's surface
  point facing the camera, tipped 0.3 rad toward the viewer.
- **First frame:** lights at zero and emissive at one, so the sphere and the pin are flat
  `accent` and `inkOnAccent`, identical to the still image.

The timings live in one table, `SPLASH_TIMING`, in the splash module. The spring constants of
the three hard stops come from `SPRING` in the tokens.

### 6. Continents: a generated one-bit texture in a TypeScript module

The mock draws the outline to a browser canvas, which the phone doesn't have. The phone also
can't load a PNG into `three` without a helper from `expo-three`. So a script
(`apps/mobile/scripts/build-splash-land.mjs`) rasterises Natural Earth's public-domain 1:110m
land polygons to a 1024 × 512 equirectangular mask. It stores the mask run-length encoded in
`apps/mobile/lib/splash/land.generated.ts`, and the phone expands it into a
`THREE.DataTexture`. The script records the source URL and version in its header, the output
is committed, and it is regenerated only by hand, because the land does not change.

### 7. Still launch image: `expo-splash-screen`, cut by the icon tooling

`expo-splash-screen` is added as a config plugin in `app.json`, with `backgroundColor` set to
`ground.light`, a `dark.backgroundColor` of `ground.dark`, and an image that is a new entry in
`.github/scripts/icon-assets.mjs`: `apps/mobile/assets/splash-icon.png`, the drop on an amber
circle (tile radius 0.5), transparent outside it. `pnpm check:icons` then covers it. The image's
`imageWidth` matches the size the animated opening draws the sphere at: `SPLASH_SPHERE_WIDTH`,
192 points, in `apps/mobile/lib/splash/geometry.ts`. That is the circle Android 12+ shows out
of its 288-point launch-icon box, so the system's mask and the sphere coincide. `app.json`
cannot import it, so `geometry.test.ts` compares the two, and the grounds against `COLOUR`.
The phone app gains a `vitest` test script, and the root `pnpm test` runs it.

`SplashScreen.preventAutoHideAsync()` runs at module load in `components/opening.tsx`. The
handover has two steps, not one. The system image cannot wait for the 3D view's first frame,
because on Android the 3D view is only created once the app's own window draws, which it does not
while the system's launch screen is held up; each would wait for the other. So the opening draws
its own copy of the icon, identical in size and place, and hides the system image once that copy
has loaded; the copy is then removed once the 3D view has drawn its first frame, which is the same
icon. If the 3D view has not drawn within 2 s, the copy stays and fades into the app as it does
with reduce motion on.

### 8. The launch gate plays the opening instead of `Blank`

`_layout.tsx` replaces `Blank` with `<Opening ready={…} onDone={…} />`, drawn above the app
rather than instead of it once the gate opens, so the app mounts and loads underneath while the
globe finishes. `ready` is the existing gate condition. The opening chooses full, short or
still from a new preference, `pinpoint.preference.openingPlayed`, and from
`useReducedMotion()`, and writes the preference when the full version's last spin has settled.
The preference is read in the same `multiGet` as theme and language, so it adds no read.

## Risks / Trade-offs

- [Four native modules at once: `expo-gl`, `expo-splash-screen`, `react-native-reanimated` and
  `react-native-worklets`] → One rebuild. Before testing, uninstall the stale
  `com.pinpoint.app` from the simulator (see `AGENTS.md`), or the old binary takes the link
  and shows "Unimplemented component".
- [`three` in the launch bundle, about 600 KB of JavaScript parsed before the first 3D frame] →
  The still image covers the parse, since it stays until the first frame is drawn. If launch
  measurably slows, import only the classes used from `three/src/…` so the bundle keeps only
  those. Measure on the Android emulator, which is the slower target.
- [The GL frame loop stutters while the JavaScript thread is busy] → Measure on a device first
  (task 3.1). If it stutters, move the frame loop onto a worklet (`expo-gl` supports rendering
  from Reanimated's UI runtime) before building further.
- [`expo-gl` and `three` versions drift, since `three` changes its WebGL setup between releases]
  → Pin `three` to an exact version and record in the splash module's header which versions
  were tested together.
- [Android 12+ draws its own launch screen: the app icon in a circle on the background colour]
  → The sphere *is* a circle, so the still image is chosen to match that shape. Confirm on an
  Android 12+ emulator that the system's circle and ours coincide (task 6.3).
- [The iOS simulator never shows the 3D frames while the loop runs] → It shows the icon, then the
  last frame once the loop stops, whatever the frame rate and with back-pressure in place. A
  single frame drawn outside a loop appears at once, and the same code plays correctly on the
  Android emulator, which uses the computer's graphics chip; the simulator draws OpenGL ES in
  software. Whether a real iPhone plays it has to be seen on one. **Decided (2026-09-30): the
  animation ships on iOS as it is.** No physical iPhone is available and the iOS app has not
  shipped; if it does not play on a device, whoever sees it reports it, and the fallback then is
  the still icon on iOS, which the opening already falls back to when 3D fails to draw.
