# Tasks

Ordered by dependency. Section 1 makes every candidate row one height, because a
placeholder cannot match a row whose height depends on data that has not arrived.
Sections 2 and 3 build the states, laptop first — it is the rendering with two
viewports and the one where the width jump is measurable. Section 4 is the spec.
Section 5 is looking, which this repo has learned three times is where the
defects are, and it is the only section that can find the ones that matter here.

## 1. One height per candidate row

- [x] 1.1 `apps/web/app/_components/place-search.module.css` — give `.candidate` a
      `min-height` inside the `max-width: 700px` block, set to the height of a row
      carrying a surrounding place name. Above 700px the row is one line and the
      26px glyph already sets it; add nothing there and say so in a comment, or
      the next person will add a floor that does nothing.
- [x] 1.2 `apps/mobile/components/place-search.tsx` — `minHeight` on
      `styles.candidate`, set to the height of a row carrying a surrounding place
      name. Comment the arithmetic: it is the glyph against two lines of type plus
      the row's own padding, and the number is meaningless without that.
- [x] 1.3 Confirm by measuring, not by eye: a query returning a mix of candidates
      with and without a surrounding place name draws rows of equal height in both
      renderings that have a floor.

## 2. The laptop

- [x] 2.1 `place-search.tsx` — hold whether a request is in flight. Set it where
      the debounce timer fires, clear it where the answer is stamped, and clear it
      on abort. It lives beside `searching` rather than replacing it; the comment
      above the derivation explains why that derivation stays and should be left
      standing.
- [x] 2.2 Stop rendering `.results` while a query is being typed and nothing has
      answered. The panel's first appearance becomes the placeholder rows, so the
      narrow `Searching…` state it used to open at — and the ~180px jump off it —
      is gone. The panel is `width: max-content` and still follows its content;
      design.md § 5 is where that is argued and sized.
- [x] 2.3 Three placeholder rows, written inline. Blocks at the row's own radius
      in `--pp-surface-muted`: a glyph square, a name bar, and — above 700px — a
      meta bar at the right. Vary the name bar's width across the three rows;
      equal widths read as a table rather than as a list of names.
- [x] 2.4 The placeholder rows carry `aria-hidden`, and the `Searching…` message
      keeps `role="status"`. A screen reader gets the sentence it gets today, not
      three empty rows.
- [x] 2.5 Keep the previous candidates while a newer query is in flight. Dim them,
      set `aria-busy` on the list, and put `Searching…` above it — outside
      `.results`' `overflow-y: auto`, or it scrolls away from the rows it
      describes.
- [x] 2.6 Check the two viewports against each other at the breakpoint. The
      placeholder above 700px is a one-line row with a meta bar on the right; below
      it is the stacked two-line row. They are the same component and must follow
      the same breakpoint the candidates do.

## 3. The phone

- [x] 3.1 The same in-flight state, in the same place in the same effect. Mirror
      2.1 exactly — the two files are already parallel and the next person to read
      one will read the other.
- [x] 3.2 Three placeholder rows in React Native's idiom: `surfaceMuted` `View`s
      at the row's radius, a 28pt glyph square and two bars of unequal width. Not
      imported from web, for the reason both `states.tsx` files already give.
- [x] 3.3 Placeholders are not exposed individually —
      `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"` on the group.
- [x] 3.4 Announce the wait. `Note` currently renders `Searching…` with
      `accessibilityRole="text"`, which is not a live region and says nothing;
      this is a gap the laptop does not have. Use `accessibilityLiveRegion` and
      confirm on a real device, because the Android and iOS behaviour differs.
- [x] 3.5 Keep the previous candidates while a newer query is in flight, dimmed,
      with the message above them.
- [x] 3.6 The empty-query guidance note stays exactly as it is. It is the state
      before anything is typed, not the state during a wait, and it is the only
      place the product says a pin can be dropped when search cannot find
      something.

## 4. The specification

- [x] 4.1 `pnpm check:specs` and `openspec validate --strict
      the-search-list-keeps-its-shape`.
- [x] 4.2 Re-read the modified requirement against the code once the code exists.
      The sentence it replaces was narrowed rather than deleted, and the point of
      the narrowing is lost if the implementation ends up matching the old one.

## 5. Looking

Every item here means opening the running product with the network throttled.
None of this is visible at full speed, and none of it is caught by a type check.

- [x] 5.1 Laptop, throttled, window at ~900px — the width the jump was measured
      at. Search from an empty field. The panel appears with placeholders already
      in it, never at the width of a two-word message, and the step to the settled
      width is small enough not to read as the panel redrawing itself. Measure it;
      design.md § 5 predicts about 390px against about 470px.
- [x] 5.2 The same, at ~1400px and at ~750px. The jump was width-dependent; so is
      the check.
- [x] 5.3 Laptop narrowed under 700px. The list is the screen, the placeholder is
      the stacked row, and the guidance and failure states still read correctly.
- [x] 5.4 Type a long query slowly, in both applications. Placeholders must not
      appear between keystrokes — this is the whole point of section 2.1 and the
      only way to see whether it worked.
- [x] 5.5 Refine a query that has already answered, in both applications. The
      previous candidates stay, dimmed, with the message above them; they are
      replaced when the answer lands.
- [x] 5.6 Refine a query into one that finds nothing. The previous candidates must
      go, and `No matches` must appear — a pending list that never resolves is the
      worst outcome available here.
- [x] 5.7 Take the geocoder away — block the host in the browser, put the phone in
      airplane mode. Searching, no matches, and unreachable must remain three
      distinguishable things in all three renderings.
- [x] 5.8 On the phone, refine a query while reaching for a row. This is the risk
      design.md names and the only way to find out whether it matters.
- [x] 5.9 VoiceOver on the phone and a screen reader on the laptop: starting a
      search is announced in words, and the placeholder rows are not read out as
      empty items.
- [x] 5.10 Both themes, both applications. The placeholder blocks are
      `surfaceMuted` and the dark value is a different relationship to its ground
      than the light one.
