## Why

Pinpoint has almost no motion, and what it has was never written down, so each new
animation would get its own tool and its own timing. The phone app also opens on a blank
screen in the background colour. This change sets the rules for animating either app, and
uses them first on something everybody sees: an animated opening on the phone that turns
the icon into a spinning 3D globe with a 3D pin on it.

## What Changes

Both applications, and the phone's opening.

- **One set of speeds and motion curves** for both apps, so a sheet sliding up feels the same
  on the laptop and on the phone. A number typed straight into a component is not allowed.
- **"Reduce motion" is always respected.** With it on in the device settings, nothing moves:
  the change happens at once.
- **A chosen tool per platform, and a rule for adding another.** The laptop animates with
  plain CSS. The phone animates with one animation library, which moves things on the phone's
  display thread so they stay smooth while the app is busy.
- **The phone opens with an animated splash** (approved mock:
  https://claude.ai/artifact/SQxiEN5ThCLQk4j6cyg1A8):
  1. The phone shows the icon: an amber sphere with the dark pin, still.
  2. The pin fills out into a 3D pin with a round head, keeping its hole. It grows a little
     and rises until its point sits on the middle of the sphere, tipped toward you. The view
     rises to look down on the globe, and the continents appear in a darker amber.
  3. The globe spins right, stops hard and bounces. It spins back to where it started, stops
     hard and bounces. Then it spins left as far as the first spin, stops hard and bounces.
  4. The globe lifts and fades into the app.
- **The full version plays on the first launch only.** Later launches play a short version
  (step 2 alone, about two thirds of a second). With "reduce motion" on, the icon stays still
  and fades into the app.
- **It never makes a slow launch slower.** The animation runs while the app is already
  loading. If the app isn't ready when it ends, the globe waits, still. It never loops and
  never spins while waiting.

Not being done:
- **A splash on the laptop.** A browser tab never shows one, and an installed copy's splash
  is drawn by the device and can't be animated.
- **Animating anything else yet.** The rules apply from now on. Existing animations move over
  when their code is next worked on, not in this change.
- **A splash that follows the in-app light/dark choice from the very first moment.** The
  phone's still image before the app starts follows the device's setting, because the app
  hasn't read its own yet. Someone who chose the opposite of their device sees the background
  change as the animation takes over.

## Capabilities

### New Capabilities

- `motion`: how either app animates, with shared speeds and curves, "reduce motion", one tool
  per platform and when another may be added, plus the phone's animated opening.

### Modified Capabilities

_None._ The still image the phone shows first is a new icon asset cut from the existing mark,
which `product-mark` already requires. The 3D pin is that same mark given depth, and the
`motion` spec says so.

## Impact

- **Phone:** four new native pieces (the animation library, the still launch screen, a 3D
  drawing surface, and a 3D engine), so the phone app has to be rebuilt and reinstalled once.
  The download grows by about 1 MB. The opening replaces the blank screen in `_layout.tsx`, and
  whether the full version has played is remembered with the other preferences.
- **Laptop:** no visible change. Its existing animations read the shared speeds when next
  touched.
- **Shared:** speeds and curves are added to `@pinpoint/tokens`, and the icon tooling cuts one
  more asset: the still launch image.
- **Cost:** none. Every new piece is free and open source, and the continent outlines come
  from public-domain data that needs no credit line.
