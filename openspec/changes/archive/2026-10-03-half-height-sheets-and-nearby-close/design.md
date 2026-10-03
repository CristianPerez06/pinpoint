## Context

The phone's sheets each chose their own cap (`SHEET_CAP` 0.8 / 0.85 / 0.5,
`SHEET_FRACTION` 0.62) and most sized to their content up to it. Nearby's return to the
list was decision 6 of `2026-10-02-nearby-places`: a `nearbyReturn` field in each
workspace, set when a row is chosen and consumed when the details are dismissed.

## Decisions

**1. One fixed height, exported from `components/sheet.tsx`.** `SHEET_HEIGHT = 0.5` and
`sheetHeight(windowHeight)`, decided by the user for Filter, Nearby, Trips, Cities, People
and a place's details. Each sets it as `height`, not `maxHeight`, so every scroller inside has a
definite height to fill (`AGENTS.md`, *A `ScrollView` inside a content-sized container
collapses*).

**2. The details sheet always scrolls.** It used to size to its content, measure itself
against the cap, and switch to a scroller only once it overflowed. At a fixed height that
measurement has nothing to decide, so it is removed and the fields always sit in a
`ScrollView`. `openingHeight` — what the camera is told when it flies to a place — is now
exactly the sheet's height rather than an upper bound. The chooser for several places at
one point keeps its content-sized form under the same height as a ceiling.

**3. The menu, the credits and the form are unchanged.** They are short or, for the form,
already have their own two heights.

**3a. The site at a phone's width: a `half` option, not a new rule for every menu.**
`Menu` takes `half`, and `halfSheetClass` is exported for the place card. Under the
`max-width: 700px` block, `.menuPanel.half` and `.panel.half` set `height: 50dvh` and
drop the ceiling; `align-content: start` stops the menu's grid stretching its rows to
fill. Opted into by the trips (which holds People as a view), cities, Filter and Nearby
menus and the single-place card. The account menu and the credits leave it off. Above
the breakpoint nothing changes: the class only has rules inside the phone block.

**3b. A sheet waits for a closing one.** Since `#247` a `Sheet` keeps its `Modal` up for
its closing animation, and iOS ignores a second modal presented while one is on its way
out — so `onOpenPeople`, which closes the trips sheet and opens People in one press,
closed one and showed nothing. `sheet.tsx` keeps a module-level set of sheets that are
closing, marked while rendering; a sheet asked to open decides in a layout effect,
after every sheet in that render has been marked, and waits until the set is empty.
Only closing sheets count: a picker opened on top of an open sheet is allowed by iOS
and still opens at once. A first attempt marked closing from an effect, which ran after
People had already looked, and changed nothing.

**4. The Nearby return is removed, not disabled.** `NearbyReturn`, `resume`, the
`nearbyReturn`/`nearbyResume` state and `onDismissDetails` go, in both apps. Every opening
is then ordered fresh, as the spec already asked of every opening but this one.

**5. No camera easing.** A version that eased the map so a pressed pin or the person's
dot stayed above an opening sheet was built and then dropped at the user's decision.

## Risks / Trade-offs

- **[A short place leaves empty space]** → A place with only a name now stands at half the
  screen with space under its fields. Accepted: one height everywhere is the point.
