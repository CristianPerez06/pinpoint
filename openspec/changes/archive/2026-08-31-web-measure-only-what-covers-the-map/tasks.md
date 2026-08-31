## 1. Record the defects before changing anything

- [x] 1.1 At a laptop width, with the save form open, record `stage.height`, each
      standing element's reported overlap, and the resulting `floor`. The reference
      reading is a 666px map reporting 716 from the toolbar and 446 from the form
- [x] 1.2 Record where a dropped pin lands, in map coordinates, and where the zoom
      control's box lands. Reference: pin tip at y = −25 on a 614px map, zoom control at
      viewport y −95 to −25 on a 666px map
- [x] 1.3 Record where all of a trip's markers land on a fresh load at a laptop width.
      Reference: sixteen markers at y ≈ 22–29, clipped by the top edge
- [x] 1.4 Record the same four readings at a phone width. These are the numbers that must
      **not** change, so take them now rather than reconstructing them afterwards.
      Reference: a 572px map reporting 67 from a 67px toolbar
- [x] 1.5 Keep these readings in the change directory. Every later verification task
      compares against them, and "it looks right now" is what let four defects ship

## 2. The arithmetic, in the shared package with tests

- [x] 2.1 Add a rectangle type to `@pinpoint/map` alongside `LngLat` and `Viewport` —
      plain numbers, no DOM type, no renderer type
- [x] 2.2 Add the function that reduces a framing viewport for a covered rectangle: full
      height when the rectangle does not span the map's width, the uncovered height when
      it does, and the existing floor under that strip kept intact
- [x] 2.3 Add the function that answers what vertical offset lifts a point clear of a
      covered rectangle: zero when the point is outside it, the middle of the uncovered
      strip when the rectangle spans the width, the least that clears its top edge plus
      the margin when it does not
- [x] 2.4 Tests in `camera.test.ts`, and write the ones that would have caught each of
      the four defects first: an empty rectangle covers nothing; a rectangle taller than
      the map is impossible to express; a point beside a corner rectangle does not move;
      no offset ever carries a point outside the map
- [x] 2.5 Confirm `pnpm test` runs them and that nothing imported here reaches for a DOM
      or renderer type — `pnpm check:cycles` and `typecheck:packages` both have to pass

## 3. The measurement, in the application

- [x] 3.1 Replace the `bottom - element.top` subtraction with the intersection of each
      standing element's box and the map's own box, and delete the comment claiming the
      overlap "comes out negative and clamps to zero" — it is the reason nobody looked
      again, so removing it is part of the fix rather than tidying afterwards
- [x] 3.2 Union the intersections into one rectangle and keep it in state, in map-local
      coordinates so nothing downstream has to know where the map sits on the page
- [x] 3.3 Rename `floor` to whatever now describes it, on the state, on the prop, and in
      the comments that explain it. Decide the name in this task, not in review
      — **kept as `floor`.** It now carries only the band standing right across the map,
      which is exactly what its documentation always claimed ("how much of the bottom of
      the map is covered by chrome standing on it") and never was. The rectangle is a
      second value beside it, `covered`, because the two consumers ask different
      questions and one of them cannot be answered by a height
- [x] 3.4 Keep the `ResizeObserver` and the `resize` listener behaving as they do: the
      rectangle changes on the same events the height did, including the one that moves
      the bar without resizing either element

## 4. Framing and the lift

- [x] 4.1 `frameAround` takes the rectangle and reduces the viewport only for chrome
      spanning the map's width. Keep the existing clamp that stops a tall sheet driving
      the zoom to the end of the range — `map-rendering` requires it by name
- [x] 4.2 The lift asks whether the described place is inside the rectangle before moving,
      and returns early when it is not
- [x] 4.3 The lift's travel: the middle of the uncovered strip where the rectangle spans
      the width, the least that clears its top edge plus the existing 32px margin where
      it does not
- [x] 4.4 Confirm the lift is still idempotent — it computes an absolute target from the
      place's own position, so re-running it while its own animation is in flight must
      still converge rather than accumulate

## 5. The two corner controls

- [x] 5.1 Answer the design document's open question about the zoom control — the covered
      height at its own corner, or zero at a laptop width — and write the reason into the
      code beside it — **neither, and better than both: the band height.** A control on
      the bottom edge has to clear what stands across that edge; a card in a corner is
      cleared by not being under it. That is zero at a laptop width and the standing
      chrome's height at a phone width, with no per-corner arithmetic and no width branch
- [x] 5.2 Re-derive the `cornerHeight + floor + creditHeight` sum. Its comment says the
      sum is safe because at most two terms are ever non-zero; either that still holds
      and the comment says why, or it does not and the sum goes — **it holds, and the sum
      is unchanged.** It was the comment that was false, not the arithmetic: `floor` was
      non-zero at a laptop width when the comment said it belonged to the phone. Now it
      is zero there, so the claim is true and the comment records why it was not
- [x] 5.3 Confirm the licence credit still rises off whatever stands on the floor at a
      phone width, and that stopping it being fed a number larger than the map does not
      move it. It is a licence condition, not a cosmetic one

## 6. Look at both shapes, against the numbers from section 1

- [~] 6.1 Laptop width: drop a pin near each edge and near the centre, at two zoom levels.
      Every dropped pin stays on the map and is not behind the panel — **partly done.**
      A pin dropped clear of the panel now leaves the camera completely still
      (`maxShift: 0` across all sixteen saved markers). The edges and the second zoom
      level are not yet covered
- [x] 6.2 Laptop width: drop a pin in the bottom-left corner, behind the panel. Confirm it
      rises just clear of the panel rather than to the middle of the map — **confirmed in
      the running app.** An earlier reading in this session recorded this as failing; that
      reading was taken while the application had stopped fetching its trip and is
      withdrawn. `covered` reaches `TripMap` as `168,16,344,598` on a 614px map and
      `liftOffset` returns 171 for a place behind it, which is the arithmetic under test

- [x] 6.3 Laptop width: fresh load. Every marker is on the map, none clipped by an edge,
      and the map is not opening on empty space
- [ ] 6.4 Laptop width: select a saved marker, and select a stacked group. The camera
      behaves as it does for a dropped pin — **not verified.** It shares one code path
      with the dropped pin (`draft ?? the selected group's first marker`), which is
      verified, so the risk is low; but it was not looked at and is not being claimed
- [x] 6.5 Laptop width: the zoom control is on the map, in the bottom-right, clear of
      MapLibre's attribution, and both buttons work
- [x] 6.6 A short window as well as a tall one — a laptop with the browser not maximised —
      because the covered height relative to the surface is what changes — **checked at
      three map heights across the session: 666, 620 and 568.** The zoom control sits at
      `calc(20px + space-md)` and inside the map at each, and the tools contribute nothing
      at each. The defect scaled with the map's height, so holding across a 100px range is
      the reading that matters
- [x] 6.7 Phone width: every reading from 1.4 is unchanged, and dropping a pin, opening
      the marker sheet, the toolbar, the credit and the zoom control all behave exactly as
      they did. This is the regression that matters most — **verified, unchanged.** At
      360px the toolbar reports an overlap of 67 for its own 67px height, exactly the
      baseline. Dropping under the sight opens a sheet spanning the full width (0–360),
      read correctly as a band; the camera lifts by 192 and the pin comes to rest at
      y = 126, which is `sheetTop / 2` — the landing spot the old arithmetic produced
- [ ] 6.8 Both themes at both widths. The symptom is positional and must be identical in
      each; if it is not, stop and record it rather than fixing it here — **not verified.**
      Nothing on this path reads a colour or a token, so the geometry cannot differ by
      theme; recorded as unchecked rather than ticked on that reasoning
- [x] 6.9 The 700–1024px band, which nothing above mentions and which has a wrapped bar of
      its own — **checked at 1020px.** The wrapped bar's tools are `position: static` and
      entirely above the map, so they intersect it in nothing and `floor` is zero; the
      panel is the same bottom-left corner card as at a wider laptop width and takes the
      same path. The zoom control is on the map at `calc(20px + space-md)`. Framing on a
      *fresh load* at this width was not re-taken, because the running app had an unsaved
      pin open in its form and a reload would have discarded it

## 7. Finish

- [x] 7.1 `pnpm verify` — passes end to end, including `openspec validate --all --strict`
- [x] 7.2 Confirm the mobile application is untouched, and that `#70` is still an accurate
      description of how the two applications differ — `git diff apps/mobile` is empty.
      The phone still derives its covered height from the sheet heights it knows rather
      than by measuring overlap, and still shifts without shrinking, so `#70` reads
      exactly as it did
- [ ] 7.3 Close `#79` naming all four defects, since three of them are not in the ticket
      and would otherwise be lost — **deferred to the merge.** An issue closes when the
      fix lands on `main`, not when the change is archived, and this is not committed yet.
      The four defects are named in `proposal.md` and measured in `readings.md`, so the
      pull request has them to hand
