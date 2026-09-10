# The filter tool reads as one tool

## Why

At a phone width the web's bottom bar draws three tools. Two of them — `Search`
and `Drop` — are a glyph above a short word. The third, `Filter`, breaks into a
column of four when a filter is applied: the glyph, the word, `· 1`, and a 5px
dot, each on its own line. `#88` reports it as a pill turning into a four-line
block, and it is worse than a layout defect, because the control that is
supposed to declare a narrowed trip is the one that stops looking like a control.

The cause is not what the ticket guesses, and it is worth stating plainly because
the hypothesis sends the reader to the wrong file. **Nothing wraps.** The bottom
bar deliberately turns every tool into a column — `ui.module.css` § *The shape a
control takes when it is standing in the bar at the bottom* sets
`flex-direction: column` on any `.button` inside `role="toolbar"`, which is what
puts `Search`'s glyph above its word. `Filter`'s label was written as a
horizontal run of four things, so in a column each of the four becomes a row.

```
  laptop, one row                      phone, one column per child
  ┌──────────────────┐                 ┌──────────┐
  │ ⚙ Filter · 1 ● ⌄ │                 │    ⚙     │  glyph
  └──────────────────┘                 │  Filter  │  word
    │   │      │  │ └ hidden in a bar  │   · 1    │  count      ← not a tool shape
    │   │      │  └── the dot          │    ●     │  dot        ← not a tool shape
    │   │      └───── the count        └──────────┘
    │   └──────────── the word
    └──────────────── the glyph
```

Three things follow from that reading, none of which the ticket anticipated.

**The fourth line is not the caret.** The caret is already `display: none` inside
a toolbar. What stands at the bottom is `.liveDot`, drawn by `Menu` as a sibling
of the label — a 5px accent circle, which in a column reads as a small second
chevron. So the ticket's fourth line and its guess about the caret are the same
element misidentified, and the caret needs no work.

**It only breaks when a filter is applied.** Both extra children are conditional
on `narrowed`. Unfiltered, the control is already correct at two lines. This
answers the ticket's third question — the count is what pushes it over, and the
length of the label has nothing to do with it — and it is the reason the defect
survived: the bar looks right until somebody uses the thing the bar is for.

**`Filter` is the one tool in the row that was not built like a tool.** `Drop`
carries two spellings and lets the cascade pick: `.wideLabel` for the bar,
`.toolLabel` for the tool, plus `.toolGlyph` for its icon. `Search` is built the
same way. `Filter` invented a third mechanism — a bespoke `.glyph` at 22px — and
never adopted `.toolLabel` at all, so even once the stacking is fixed its word
renders at `--pp-type-control-size` (13.5px) beside two words at 11px/600. The
stacking is the symptom; the drift from the tool vocabulary is the defect.

There is also a gap the ticket could not see, and it is the most serious thing
here. The trigger carries no `aria-label`, so its accessible name is computed
from its contents — and the count is the only child that is not `aria-hidden`.
Hiding the count therefore removes the narrowing from the accessibility tree
entirely: the control would announce `Filter`, with the state left to a fill and
an `aria-hidden` dot. `marker-filtering` § *A narrowed view declares that it is
narrowed* forbids the declaration being carried by colour alone and names screen
readers in its rationale, but its normative sentence only forbids *colour*, and a
dot is a shape. The requirement has a hole, this change would fall through it,
and the phone already does the right thing — its tool takes a `hint` that says
`Filter this trip. Some places are hidden`.

## What Changes

The decision is to mirror the phone. `apps/mobile/components/trip-workspace.tsx`
§ `Tool` is the reference, and the web adopts it whole rather than approximating
it.

- **The trigger becomes a glyph above a single-line word, and nothing else.** The
  column holds two rows at every state. Whatever the trigger has to say beyond
  its name is said on the glyph or in its accessible name, never as a third row.

- **The narrowed state is badged onto the glyph.** `.liveDot` stops being a
  sibling of the label and becomes what the phone calls a `pip` — a ringed dot on
  the glyph's top-right corner. This requires the dot to move from `Menu` to the
  call site, because only the call site knows there is a glyph to badge; see
  `design.md` § 2. `marked` has exactly one call site, so nothing else is
  affected.

- **The count is not shown on a tool.** `marker-filtering` makes the count a
  **MAY**, and the phone declines it. `· 1` is a third row in a two-row control
  and there is nowhere else in the column for it to go. It is unchanged on the
  laptop bar, where it has a row to sit in.

- **The narrowing reaches a screen reader in words.** `Menu` gains a `hint` that
  becomes the trigger's `aria-label` — the same name and the same job as the
  phone's, carrying the same two sentences. This is what replaces the count, and
  it is a strict improvement at every width: today the laptop trigger announces
  `Filter 1`, which is the bare-number reading the specification already rejected
  for what it is worth in words.

- **The narrowed tool loses its fill.** `[role='toolbar'] .live` fills with
  `accent-wash`; the phone does not fill, it recolours the glyph *and* the label
  to `accentInk` and lets the pip carry the rest. Two signals, one of them a
  shape, which is what the specification asks for — the wash was a third. The
  rule's own comment argues for keeping it and is rewritten rather than deleted,
  because the argument it makes was true of a control that had no other second
  signal.

- **`Filter` adopts the tool vocabulary the other two use** — `.toolGlyph` and
  `.toolLabel` instead of its own `.glyph` and a bare text node. Those two
  classes move to `ui.module.css` beside the `[role='toolbar']` rules that
  already shape a tool, and are exported the way `iconOnlyLabelClass` already is,
  so all three tools read one definition. This also collapses the three
  disagreeing glyph sizes in the chrome — `.glyph` 22px, `.toolGlyph` 22px,
  `.iconOnly` 21px — to the two that mean different things.

- **MODIFIED** `marker-filtering`'s declaration requirement closes the hole
  described above: the declaration SHALL be perceivable without sight, not merely
  not-colour-alone. A count shown at one width and not another is permitted; a
  declaration that exists only in pixels is not.

- **ADDED** `workspace-chrome` gains a requirement for a tool's shape in the
  bottom bar. The shape was a CSS convention documented only in comments, which
  is exactly how `Filter` drifted out of it while type-checking and rendering.

## Capabilities

### New Capabilities

None. Both requirements land on capabilities that already exist.

### Modified Capabilities

- **`marker-filtering`** — *A narrowed view declares that it is narrowed* is
  modified. The colour-alone prohibition is widened to a positive requirement
  that the declaration be perceivable without sight, and the count's optionality
  is stated per-rendering rather than per-interface, so one platform showing it
  in one place and not another is explicitly allowed. Nothing about what a filter
  *means* changes; `@pinpoint/core` is untouched.

- **`workspace-chrome`** — one requirement added: *A tool in the bottom bar is a
  glyph above one line of words*. It constrains the shape, the single line, and
  where a state may be carried, and it forbids a third row. The existing
  requirements about placement, dismissal, focus and inertness are unaffected —
  this change touches none of `Menu`'s contract except to add a name.

## Impact

**Applications — web only.** The phone is the reference and does not change.

- `apps/web/app/_components/filter-bar.tsx` — `FilterLabel` gains the glyph
  wrapper and the pip, loses the count at tool width, and passes the `hint`. Its
  header comment argues at length for `Filter · 1` as the honest label and needs
  the per-width qualification the argument was always missing.
- `apps/web/app/_components/filter-bar.module.css` — `.count` hidden in a
  toolbar; `.glyph` deleted in favour of the shared class; the pip's geometry.
- `apps/web/app/_components/ui.tsx` — `Menu` gains `hint`; `marked` stops drawing
  the dot and its doc comment says the label now owes the second signal;
  `toolGlyphClass` and `toolLabelClass` exported beside `iconOnlyLabelClass`.
- `apps/web/app/_components/ui.module.css` — `.toolGlyph` and `.toolLabel` move
  in; `[role='toolbar'] .live` loses its fill and gains a rule making the label
  yield its own colour to it.
- `apps/web/app/_components/workspace-chrome.tsx` and
  `trip-workspace.module.css` — `Search` and `Drop` read the moved classes;
  `.toolGlyph` and `.toolLabel` leave the workspace stylesheet, and the comment
  there that already says *"the shape a tool takes is stated in
  `ui.module.css`"* becomes true of the type as well as the fill.

**Shared packages** — none. Nothing here is about what a filter means, so
`@pinpoint/core` and `@pinpoint/map` are not touched, and no token changes: the
values needed are `accent`, `accent-ink`, `surface` and the label type role,
which all exist.

**Data, dependencies, migrations** — none.

**Specifications**

- `openspec/specs/marker-filtering/spec.md`
- `openspec/specs/workspace-chrome/spec.md`

**Roadmap**

- Closes the loose end *The phone's narrowed state has not been read in
  greyscale* for the web, and puts the phone within one gesture of the same
  check, because after this change both platforms carry the state the same way.
  The task list runs it on both.

### Not in this change

- **The resting colour of a tool's glyph against its label.** On the web every
  tool draws a `ink-muted` glyph under an `ink` label; the phone draws both in
  one colour. Mirroring the phone here would change `Search` and `Drop` as well,
  which is a look-and-feel decision about three controls rather than a fix to
  one. What *is* in scope is the narrowed state recolouring the whole tool —
  glyph and word together — because a declaration applied to half a control is
  the defect this change is about, one layer down.

- **`#87`, the count moving the open panel on the laptop bar.** Adjacent and
  deliberately separate. This change does not alter what the laptop trigger shows,
  so `#87` neither blocks it nor is blocked by it. The one overlap is the
  `aria-label`, which improves the laptop announcement as a side effect and should
  be left alone by `#87`.

- **A shared `Tool` component across platforms.** `styling` forbids sharing
  markup across the two, and the shape is now stated in a specification instead,
  which is the form of sharing this project uses.
