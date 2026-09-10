# Tasks

Ordered by dependency. Section 1 moves the tool vocabulary, because `Filter`
cannot be given the label type it never had until there is one definition of it
to read. Section 2 is the shape. Section 3 is the name a screen reader gets,
which is the part with no visual symptom and therefore the part most likely to
be skipped. Section 4 is the specification. Section 5 is looking, which is where
this change's defects will be — every rule involved in the original defect was
present and correct, so a type check clears nothing here.

Web only. `apps/mobile/components/trip-workspace.tsx` § `Tool` is the reference
and is not edited; if a task below seems to need a change there, the change has
gone wrong.

## 1. One definition of a tool's glyph and a tool's label

- [x] 1.1 Move `.toolGlyph` and `.toolLabel` from
      `apps/web/app/_components/trip-workspace.module.css` to
      `ui.module.css`, beside the `[role='toolbar']` rules that already state a
      tool's shape. `.wideLabel` stays — it is one control's laptop spelling, not
      part of a tool's shape. Update the comment in `trip-workspace.module.css`
      that already claims the shape is stated in `ui.module.css`: it becomes true
      of the type as well as the fill, which is the reason for the move.
- [x] 1.2 `ui.tsx` — export `toolGlyphClass` and `toolLabelClass` beside the
      existing `iconOnlyLabelClass`. Named exports rather than reaching into
      another component's stylesheet object, because a missing property on a
      CSS-module object is `undefined` and silent, and a missing export is a
      type error. That is the whole reason for this form; say so in a comment.
- [x] 1.3 `workspace-chrome.tsx` — `Search` and `Drop` read the two new exports.
      Purely mechanical; `pnpm typecheck` finds every miss.
- [x] 1.4 Delete `.glyph` from `filter-bar.module.css`. It was a third 22px glyph
      definition and `.toolGlyph` is the same value. The `@media` block in that
      file stays — the pip and the count still need it.

## 2. The shape

- [x] 2.1 `ui.module.css` — retire `Menu`'s dot inside a toolbar:
      `[role='toolbar'] .liveDot { display: none }`. Put it directly beneath the
      existing `[role='toolbar'] .caret` rule and give it the same shape of
      comment, because it is the same reason — a sibling of the label becomes a
      row once the label is a column.
- [x] 2.2 `filter-bar.tsx` — wrap `FilterLabel`'s glyph in a positioned span and
      put the pip inside it, rendered whenever `narrowed` and hidden above the
      breakpoint by the wrapper. Both dots therefore exist in the markup and the
      cascade picks one; design.md § 1 argues why this is right and why moving
      `Menu`'s dot instead is wrong. Note in the comment that the two are never
      both drawn, and that the two rules controlling that are one line each.
- [x] 2.3 `filter-bar.module.css` — the pip. The phone's numbers unscaled: 7px,
      a 2px ring, `top: -1px`, `right: -5px`, `accent` fill, `surface` ring.
      Comment that the ring is `surface` because that is the bar's own ground and
      there is no fill behind the pip any more.
- [x] 2.4 `filter-bar.tsx` — wrap the word `Filter` in a span carrying
      `toolLabelClass`, so it is 11px/600 like `Search` and `Drop` rather than
      13.5px alone among the three. It is drawn at every width; above the
      breakpoint `.toolLabel` is `display: none`, so add the laptop spelling as a
      plain text node the way `Drop` does, or the laptop trigger loses its word
      entirely. **This is the step most likely to go wrong silently** — check the
      laptop bar immediately after making it, not at section 5.
- [x] 2.5 `filter-bar.module.css` — hide `.count` inside the existing
      `@media (max-width: 700px)` block. Comment names the real condition — a
      tool has no room for a count — and records why the media query carries it
      rather than `[role='toolbar']`: the role is on the bar at every width, so
      that predicate would take the count off the laptop bar too. design.md § 3.
- [x] 2.6 `ui.module.css` — `[role='toolbar'] .live` loses its `background` and
      keeps `color: var(--pp-accent-ink)`. Rewrite the comment above it rather
      than deleting it: the argument it makes — that a dot alone is one signal —
      was true of a control whose dot sat beside a word, and is answered now by
      the pip plus the recolour of the whole tool, which is the phone's scheme.
- [x] 2.7 The three rules that were relying on that fill, all of which
      type-check and render (design.md § 5):
      - `[role='toolbar'] .live:hover` — must not re-introduce the wash, and must
        not re-introduce `.live:hover`'s accent border on a control whose
        `border-radius` is `0`.
      - `[role='toolbar'] .button:hover:not(.live)` — the `:not(.live)` stops
        applying here, or a narrowed tool is the only one of the three with no
        hover feedback.
      - `[role='toolbar'] .live .toolLabel { color: inherit }` — `.toolLabel`
        sets `--pp-ink` explicitly and would beat the inherited `accent-ink`,
        leaving an amber glyph above a plain-ink word. `.toolLabel` keeps its own
        colour otherwise; design.md § 6 draws the line and it is deliberate.

## 3. The name a screen reader gets

- [x] 3.1 `ui.tsx` — `Menu` gains an optional `hint` that becomes `aria-label` on
      the trigger. Omitted, the name is computed from the contents as today, so
      the trip, city and account menus are untouched. Document it against the
      `name` prop's existing comment, which already anticipated this — *"the
      trigger may read a state while the panel it opens is `Filter`"* — and this
      is the first call site to need it.
- [x] 3.2 `filter-bar.tsx` — pass the phone's two strings verbatim:
      `Filter this trip. Some places are hidden` when narrowed,
      `Filter this trip` when not. Verbatim is load-bearing twice: it is what
      makes the two platforms one control, and both strings begin with `Filter`,
      which is what keeps the accessible name containing the visible label
      (WCAG 2.5.3). A string that dropped the word would break that; note it.
- [x] 3.3 Rewrite the `FilterLabel` and `FilterBar` header comments. They argue
      at length for `Filter · 1` as the honest label and for the waiting form
      needing no placeholder — the first argument now needs its per-width
      qualification, and the second is still true and should be checked rather
      than assumed, because the label's children changed.
- [x] 3.4 Note in `filter-bar.tsx` that `activeFilterCount` is still called and
      still correct. The count is hidden by the cascade, not stopped being
      computed, and the next reader should not go looking for a dead call.

## 4. The specification

- [x] 4.1 `pnpm check:specs` and
      `openspec validate --strict the-filter-tool-reads-as-one-tool`.
- [x] 4.2 Read the modified `marker-filtering` requirement against the finished
      code. The point of the modification is the sentence about the declaration
      reaching somebody who is not looking; if the implementation ends up
      satisfying only the old wording, the modification has failed and section 3
      is where it failed.
- [x] 4.3 Read the added `workspace-chrome` requirement against all three tools,
      not just `Filter`. It is written to constrain the bar, and `Search` and
      `Drop` are the evidence it is describing something real rather than
      generalising from one control.

## 5. Looking

Every item is a browser at a phone width with a filter applied. None of it is
caught by a type check, and the original defect was invisible until a filter was
applied — so *apply one* before believing any of these.

- [x] 5.1 Narrow the window under 700px, open a trip, apply one filter. The
      trigger is a glyph above one line, the same height as `Search` and `Drop`,
      with the pip on the glyph's corner. No third row, no dot on its own line.
- [x] 5.2 Apply two filters, then three. `· 2` must not appear anywhere, and the
      control must not change height or width as the count changes — which is the
      original reason the count was preferred over naming members, still holding.
- [x] 5.3 Clear the filter. The pip goes, the recolour goes, the shape does not
      change, and nothing beside it moves.
- [x] 5.4 Put the three tools side by side and read the words. `Search`, `Drop`
      and `Filter` at one size, one weight, one baseline. This is the check that
      2.4 worked and it cannot be done by looking at `Filter` alone.
- [x] 5.5 The laptop bar, above 700px, filtered and unfiltered. `Filter · 1` with
      the dot after the count, at its old size — the assertion is that nothing
      changed. If the word `Filter` is missing, 2.4 went wrong.
- [x] 5.6 Cross the breakpoint slowly in both directions, filtered. Exactly one
      dot at every width; two at any point means the pair of `display` rules
      disagree, which design.md names as the standing risk of drawing it twice.
- [x] 5.7 Hover the narrowed tool. It must respond, and it must not grow a square
      amber border. Then hover the other two and confirm all three respond the
      same way. Task 2.7 is two rules and this is the only thing that finds them.
- [x] 5.8 Both themes. `accent` and `accent-ink` are the same value on the dark
      ground, which is why the wash existed — with the fill gone, confirm the
      recoloured glyph and word are still readable against `surface` on both, and
      that the pip's `surface` ring still separates it from the glyph.
- [x] 5.9 **Greyscale — web.** (Was "both platforms"; the phone half is struck, see below.) Apply a filter, turn on the macOS or
      simulator colour filter, and read the tool. Two signals remain and only the
      pip survives greyscale, so this is now the load-bearing check rather than a
      formality — and it closes the roadmap loose end *The phone's narrowed state
      has not been read in greyscale*, which was specified and never run. Run it
      on the phone in the same sitting: after this change both platforms carry the
      state the same way, so a failure is one finding about one scheme.
- [x] 5.10 A screen reader, at both widths. Filtered, the trigger announces
      *"Filter this trip. Some places are hidden"*; unfiltered, *"Filter this
      trip"*. Then open it and confirm the panel is still announced as `Filter` —
      `name` and `hint` are separate props and this is the check that they stayed
      separate.
- [x] 5.11 Arm the map at a phone width, and select a marker. The confirm row
      replaces the tools and the marker sheet takes the edge from them; both
      already worked and both touch `.tools`' children, so confirm the filter
      tool comes back unchanged from each.
- [x] 5.12 The narrowest viewport the app supports, not 699px. `#88` asks for
      this explicitly, and the tools are `flex: 1 1 0` — three of them at 320px
      leaves each about 106px, and `Filter` is now lettered at 11px like the
      other two rather than 13.5px, so this is the width where that stops being
      cosmetic.
- [~] 5.13 Struck — see below. Side by side with the phone. Same glyph, same stacking, same pip in
      the same corner, same words. The one accepted difference is the resting
      colour of a glyph against its label — the web draws a muted glyph under an
      ink label on all three tools; `proposal.md` § Not in this change says why
      that is out of scope, and this is where somebody will notice it, so it is
      recorded here rather than reported as a defect.

### What looking found

Run in a browser against the dev server, at a real 386–390px viewport (the app
loaded in a same-origin iframe of that width, so the media queries and the whole
cascade are the real ones; the window itself would not resize). Measured rather
than eyeballed wherever a number settles it.

**Confirmed.** Two rows in every state and at every width from 316px to 700px;
`Filter` never reads anything but `Filter` below the breakpoint; the three tools
are equal thirds (130px each at 390px, 105.3px at 316px) with their words all at
11px/600; the count and `Menu`'s dot and the caret are all `display: none` in the
bar; the pip is 7px at the glyph's top-right (`top: -1px`, `right: -5px`), amber
with a ring in the bar's own surface. Geometry is byte-identical across one
criterion, two criteria and cleared — `x: 257.3, w: 128.7, h: 61.7` in all three
— so nothing moves as the filter is used. Above the breakpoint the trigger is
unchanged: `Filter · 1`, dot after the count, caret last, wash intact.

**The breakpoint pair agrees exactly.** Sampling 698/699/700/701px, the number of
visible dots is **1 at every width** — never none, never two. The count and the
column arrive together at 701.

**Hover was the defect this would have shipped.** Both rules in task 2.7 were
needed and both are confirmed by pointer: the narrowed tool fills with
`surface-muted` like its neighbours, and its border stays transparent — without
the second rule it grew a square amber outline, which is what `border-radius: 0`
does to `.live:hover`'s accent border.

**Not a defect, worth writing down.** The narrowed trigger draws a 2px amber
`:focus-visible` outline after the sheet is dismissed, because `Menu` returns
focus to the trigger. It looks exactly like the border defect above and is not
one — `border-color` is transparent throughout. Check `document.activeElement`
before believing that outline.

**5.2 cannot be run as written.** `activeFilterCount` is interest + visited, so
the count caps at **2**; there is no third criterion to apply. Two was checked.

### The finding: in greyscale the recolour does not merely fail, it inverts

The pip is visible in both themes and the requirement's floor — two signals, one
of them not a hue — is met. But the hue signal contributes *nothing* in
greyscale, and reads backwards:

| | narrowed word | a plain tool's word |
| --- | --- | --- |
| dark | `accent-ink`, luminance **0.493** | `ink`, luminance **0.873** |
| light | `accent-ink`, luminance **0.129** | `ink`, luminance ~0.014 |

On both grounds the *active* tool is the lowest-contrast of the three against its
bar, so desaturated it reads as the **quietest** — as though it were the disabled
one. Confirmed by looking, not only by arithmetic. On the light ground
`accent-ink` (0.129) and `ink-muted` (0.145) are within 0.016 of each other, so
the recolour is very nearly invisible there even as a lightness change.

So in greyscale the 7px pip is carrying the whole visual declaration on its own.

This is **inherited from the phone unchanged**, not introduced here — it is the
same scheme, and it is exactly the open roadmap loose end *The phone's narrowed
state has not been read in greyscale*, which now has an answer for the web half.
It is not a blocker for this change: the change was asked to mirror the phone, it
does, and the spec's floor is met with the accessible name as a third signal that
does not depend on sight at all. But it is a real finding about the shared
scheme, and the loose end should be closed with this rather than left open.

### Still outstanding

- [x] 5.10 — validated by the user. Everything that determines what
      one says was verified programmatically instead: the trigger's accessible
      name is `Filter this trip. Some places are hidden` when narrowed and
      `Filter this trip` when not, at **both** widths; `aria-expanded` toggles
      `true`/`false`; `aria-haspopup` is `dialog`; and the panel is still named
      `Filter`, so `name` and `hint` stayed separate. What is unverified is the
      announcement itself was checked separately by the user, who confirmed it.

### Struck: the two phone checks

Both were written into this list and neither belongs to this change. Recorded
rather than deleted, because the reasoning is what stops them being re-filed.

- **5.9's phone half — greyscale on the simulator.** Struck. The phone is not
  touched by this change and was not defective; its greyscale question is the
  pre-existing roadmap loose end *The phone's narrowed state has not been read in
  greyscale*, which predates this work. Bundling it here was opportunism — one
  sitting answering both platforms — not validation. It stays where it was, on
  the roadmap. What this change contributes to it is evidence rather than a
  check: the web measurement above is of the phone's own scheme, so whoever
  closes that loose end can start from a prediction instead of a blank.

- **5.13 — side by side with the phone.** Struck. It came from `#88`'s
  verification steps, written when the fix was still undecided and "match the
  phone" needed confirming by eye. It is answered by construction now: the web
  reads the phone's numbers (7px pip, 2px ring, `top: -1`, `right: -5`), its two
  `hint` strings verbatim, and its no-count, no-fill, recolour-both-halves
  treatment. `design.md` § 7 is the comparison. Two apps in front of each other
  would confirm what the values already say.

**Neither is a gate.** The phone renders no shared styling code — `styling`
forbids it — and this change touched no package, so nothing in `apps/mobile`
could have moved. Nor do the spec deltas create phone work: its `Tool` already
passes `accessibilityLabel={hint}` carrying those two sentences, and already
draws a glyph above a `numberOfLines={1}` label with no count, so it satisfies
the modified `marker-filtering` requirement and the added `workspace-chrome` one
as it stands.
