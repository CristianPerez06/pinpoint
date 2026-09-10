## 1. The slot

- [x] 1.1 Wrap `FilterBar` in `apps/web/app/_components/workspace-chrome.tsx` in a
      `<span className={styles.filter}>`, both the live and the waiting branch. They are two
      call sites of one control and a slot that covers only one of them changes width when
      the data lands.
- [x] 1.2 Add `.filter` to `apps/web/app/_components/trip-workspace.module.css`:
      `display: flex; flex: none; width: 124px`, beside `.drop` and reading as its pair.
- [x] 1.3 Make the anchor and the trigger fill the slot — `.filter > div` and
      `.filter button` at `width: 100%`, the trigger's contents centred. `.drop > button`
      is the precedent; the extra level is `Menu`'s `.menuAnchor`, which `.drop` does not
      have.
- [x] 1.4 Comment the number with its derivation, not just its value: 122.46px measured at
      the narrowed maximum, `activeFilterCount` capped at 2, `· 2` the width of `· 1` by
      `tabular-nums`, 124px chosen to match `.drop`. A future criterion makes this wrong
      silently, so say what would have to be re-measured.

## 2. What the comments claim

- [x] 2.1 `filter-bar.tsx` says a label naming people is refused because *"the control
      changes width every time the filter is used, which rearranges the bar that applied
      it"*. The reasoning was right and the control did it anyway. Say that the width is
      settled by the slot now, and name it.
- [x] 2.2 The waiting branch's comment argues at length that the waiting label *is* the
      loaded label because the count "arrives into a row that is already the width of the
      word". That was the defect, stated as a reassurance. Correct it: the row was the
      width of the word, the count did not fit in it, and what makes the claim true now is
      the slot.
- [x] 2.3 `.count` in `filter-bar.module.css` explains `tabular-nums` as stopping the
      control shifting "as it counted". True and incomplete — it never covered the segment
      appearing at all. Point at the slot for that half.
- [x] 2.4 `.drop`'s comment names the filter as what it is protecting from movement. Note
      that the filter now protects what is beside it the same way, so the two read as one
      decision rather than as one control's special case.

## 3. The specification

- [x] 3.1 Apply the delta to `openspec/specs/workspace-chrome/spec.md` — one requirement
      added, none modified.
- [x] 3.2 Check the new requirement against the four other menus in the chrome — trip,
      city, account, and the marker panel. Any trigger whose width follows its own state is
      now non-conforming and this change should say so rather than leave it for the next
      reader. The city control is already fixed-width; confirm rather than assume.
      *Checked, all conform:* trip `.name` 12ch, city `.name` 11ch, account `.you` 13ch,
      all fixed and truncating. The map's credit menu takes a constant string. And `marked`
      is passed by exactly one call site — the filter — so the `liveDot` term in the 39.53px
      is unique to it. The filter was the only non-conforming trigger in the chrome.
- [x] 3.3 `DESIGN.md`: if it states the bar's reserved-width practice, add the filter. If it
      does not state it at all, that is the gap worth closing while this is fresh.

## 4. Looking at it — the laptop

The symptom depends on viewport width, so a fix confirmed at one width is confirmed at one
width. These are three tasks, not one.

- [x] 4.1 **Above 1347px** (measure at 1400px). Open the panel, apply `Hide visited`
      without moving the pointer. The panel does not move; the pointer is still over the
      row it pressed. Before this change it moved 39.54px. *Verified: panel right edge 1159.30px before and after, 0.00px move. Trigger 124.00px in both states.*
- [x] 4.2 **Inside 1307–1347px** (measure at 1330px), the band where the panel moved
      22.95px and the search field took the other 16.59px. Both halves are gone. *Verified by constraining the bar to 1330px (the window would not resize — see the note under section 5). Search 461.88px, so this is the transition regime; panel moved 0.00px and the search field did not change width.*
- [x] 4.3 **Below 1307px** (measure at 1150px). The panel never moved here; what must stop
      is the search field and `Drop` shifting 39.54px left. Watch the search field's left
      edge, not the panel. *Verified the same way at a 1150px bar. Search 281.88px — the fully-absorbing regime — and it did not change width when the filter was applied. Was 39.54px.*
- [x] 4.4 **Clear from inside the panel**, at each of the three widths. This is the case
      with no lucky pointer position — `Clear the filter` is inside the panel and pressing
      it changed the trigger's width by definition. *Verified at all three: `Clear` pressed from inside the panel moves it 0.00px. Was 39.54px in the opposite direction.*
- [x] 4.5 `1` to `2` and back, and ticking a further member with a criterion already on.
      Nothing moved before and nothing may move now; this is the regression check on
      `tabular-nums` and on criteria-not-choices. *Verified: `1`, `2`, a second member, a third, `Everyone`, then `Clear` — trigger 124.00px and panel right 1159.30px at every step.*
- [x] 4.6 The waiting state into the loaded state: reload with the panel closed and watch
      the row settle. The slot must be the same width before and after the data arrives. *Verified: the waiting trigger and its slot both measure 124.00px, identical to the loaded pair.*
- [x] 4.7 Both themes. The dark ground is where `accent` and `accent-ink` converge and
      where `.live` has surprised this control before. *Confirmed by the maintainer. Not measured here — the theme follows `prefers-color-scheme` with no toggle, and this environment could not emulate it. The change touches no colour, only `width`, `display` and `flex`.*
- [x] 4.8 **The word shifting inside the slot**, which is what this change trades for. Look
      at `Filter` moving about 20px as the count appears and decide it reads better than
      the jump it replaces. `.drop` says yes; `.drop` changes state rarely and this does
      not. *Confirmed by the maintainer as reading better than the jump it replaces. Measured shift: 19.77px, matching the prediction.*
- [x] 4.9 **The 1024px derivation in `DESIGN.md`, which this change moves.** That file
      derives the one-row breakpoint from what cannot shrink in the bar — *"the two fixed
      scope names, the drop slot, the filter, the account, the gaps and the padding — comes
      to about 764px"* — and counts the filter at its unnarrowed width. The slot makes it
      124px at all times, so the total rises and the row runs out later than 1004px.
      Note this was already the arithmetic whenever a filter was applied; the slot makes the
      narrowed case the only case. Measure the search field at 1024px, and either correct
      the number in `DESIGN.md` or record why it still holds.
      *Measured and corrected in `DESIGN.md`:* what cannot shrink is 868px, not 764px, so the
      row runs out at ~1108px against a 1024px breakpoint, where the search field is 156px —
      under the 240px floor the same sentence names. The slot moved this by 41px (it was
      ~1067px before), so the gap predates this change. **Left as found and recorded, not
      fixed — moving the breakpoint is a decision about the wrapped bar, not about the
      filter. Open question for the maintainer.**

## 5. Looking at it — the phone width, which is where this breaks

`#101` rewrote this trigger below 700px four days ago, and the new wrapper changes which
element `.tools > * { flex: 1 1 0 }` applies to. Nothing in section 4 would catch a
regression here.

- [x] 5.1 At 390px: three tools of equal width on the bottom bar, the filter the same size
      as `Search` and `Drop`. Not "about the same" — the rule is one third each. *Confirmed by the maintainer. Not measured here — the browser window would not resize below 1400px, so no phone-width viewport was reachable.*
- [x] 5.2 The filter's glyph and word still centred in its third, and the tap target still
      the full third rather than the anchor's content width. *Confirmed by the maintainer.*
- [x] 5.3 Apply a filter at 390px: the pip on the glyph, the recolour, one line of words,
      and no count. Four lines is `#88` returning. *Confirmed by the maintainer.*
- [x] 5.4 The sheet still rises from the bottom edge and spans the width, and dismissing by
      pressing the backdrop still works — the anchor's `::after` is the backdrop, and it now
      sits one element deeper than the outside-press test expects. Read that test in
      `ui.tsx` before trusting the gesture. *Confirmed by the maintainer. This was the flagged risk: the backdrop is the anchor's `::after` and the outside-press test in `ui.tsx` measures against the trigger and the panel, which the new wrapper does not sit between.*
- [x] 5.5 Armed for a drop at 390px: `.tools.armed > *:not(.confirm)` hides the tools by
      selecting children of `.tools`. The filter is now a wrapper, so confirm it is still
      hidden and the confirm row still spans the bar.

## 6. Close out
 *Confirmed by the maintainer. `.tools.armed > *:not(.confirm)` now selects the wrapper rather than the anchor, which hides the same control.*
- [x] 6.1 `pnpm verify` green. *Green: lint, lint:mobile, typecheck, typecheck:mobile, typecheck:packages, test, build, check:tokens, check:fonts, check:icons, check:rls, check:cycles, check:specs.*
- [ ] 6.2 Close `#87`, saying what it turned out to be: 39.53px from four causes, of which
      the count named in the ticket was 20.93px, and a symptom that changes shape at 1307px
      and 1347px because of `.search`'s maximum width.
- [x] 6.3 `openspec archive the-filter-trigger-keeps-its-width`. *Archived as `2026-09-10-the-filter-trigger-keeps-its-width`. The delta was applied by the tool and moved to sit beside the panel requirement it cross-references, rather than appended at the end of the file.*
