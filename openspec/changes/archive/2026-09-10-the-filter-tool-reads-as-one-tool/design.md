# Design

## Context

See `proposal.md` — Why. What matters here is that the shape being fixed is
already stated correctly for two of the three controls it applies to, so almost
none of this is invention. `Drop` is the worked example:

```tsx
<Button tone={dropping ? 'danger' : 'primary'}>
  <MapPinPlus aria-hidden className={styles.toolGlyph} />   {/* ≤700px only */}
  <span className={styles.wideLabel}>+ Drop a pin</span>    {/* >700px only  */}
  <span className={styles.toolLabel}>Drop</span>            {/* ≤700px only  */}
</Button>
```

Both spellings and the glyph are rendered at every width and the cascade picks
one. The header comment says why: *"neither carries state — a word is not a
control, and duplicating one costs nothing that duplicating an input would."*
**That idiom is the whole design of this change.** A dot is not state either.

The pieces are spread across four files, and which file owns what is the
constraint that shapes every decision below:

```
  ui.tsx / ui.module.css              Menu, .button, .live, .liveDot, .caret,
                                      [role='toolbar'] — the tool's shape
  trip-workspace.module.css           .toolGlyph, .toolLabel, .wideLabel,
                                      the 700px breakpoint, .tools
  workspace-chrome.tsx                the markup: Search, Drop, FilterBar
  filter-bar.tsx / .module.css        FilterLabel, .glyph, .count
```

`Menu` renders the trigger as `{label}{liveDot}{caret}`, and the call site
supplies only `label`. So the dot and the caret are **after** everything the
filter contributes, and the glyph is first:

```
  <button>  ⚙  "Filter"  ·1  ●  ⌄  </button>
            └─── label ─────┘  │   │
                               │   └─ Menu's caret, already display:none in a bar
                               └───── Menu's dot, currently a row in the column
```

## Goals / Non-Goals

**Goals**

- The trigger is two rows at every state, and the second row is one line.
- The laptop trigger's appearance is byte-identical after this change, except
  for its accessible name. The defect is phone-shaped; the laptop bar is not
  being redesigned, and `#87` is looking at it.
- `Menu`'s contract gains a name and loses nothing. Five menus were consolidated
  into it and its dismissal, focus and announcement guarantees are the reason;
  nothing here should require a call site to remember something again.
- One definition of a tool's glyph and a tool's label, read by all three tools.

**Non-Goals**

- Any change to what a filter means or what it selects. `@pinpoint/core` is not
  opened, and `activeFilterCount` still exists and is still called — the count is
  hidden by the cascade, not stopped being computed.
- Any new token. `accent`, `accent-ink`, `surface`, `surface-muted` and the label
  type role all exist.
- A shared cross-platform component. See `proposal.md` § Not in this change.

## Decisions

### 1. The dot is drawn twice and the cascade picks, rather than moved

This is the decision the rest of the change hangs off, and the obvious answer is
wrong.

The obvious answer is to move `.liveDot` out of `Menu` and into `FilterLabel`,
beside the glyph it needs to badge — `marked` has exactly one call site, so the
move is free. **It is not free, because it moves the dot on the laptop.** The dot
is currently the second-to-last child of the button, after the count; the glyph
is the first. A dot rendered next to the glyph therefore lands *before* the word:

```
  today, laptop           after moving the dot
  Filter · 1 ●            ● Filter · 1
```

That is a visible change to a bar this change has no business touching, and it
would be discovered by looking rather than by type-checking, which is this
project's standing lesson.

So instead:

- **`Menu` keeps `.liveDot` exactly as it is**, and the toolbar retires it the
  way the toolbar already retires the caret — one rule, two lines below the
  existing one, for the same reason stated the same way:

  ```css
  [role='toolbar'] .liveDot { display: none }
  ```

- **`FilterLabel` draws a pip of its own**, inside a wrapper around the glyph,
  rendered at every width and hidden above the breakpoint — which is what
  `.glyph` already does and what both of `Drop`'s labels already do.

The two dots are never on screen together: the wrapper that holds the pip is
`display: none` above 700px, and `Menu`'s dot is `display: none` at 700px and
below. `marked` still means "fill it and dot it" for any future call site, and
`Menu`'s doc comment does not need rewriting.

**Alternative considered: position `Menu`'s dot against the button.** The dot and
the glyph share no positioned ancestor other than `.button`, so this means
absolute offsets like `left: calc(50% + 8px)` computed from the glyph's 22px
width and the button's 9px top padding — written in `ui.module.css`, which cannot
see `.glyph` and has no way to notice when it changes. The three glyph sizes in
the chrome already disagree (22px, 22px, 21px), so the offset would be correct
for two of the three by luck. Rejected.

### 2. `.toolGlyph` and `.toolLabel` move to `ui.module.css`

`filter-bar.module.css` has its own `.glyph` at 22px; `trip-workspace.module.css`
has `.toolGlyph` at 22px and `.toolLabel` at 11px/600. `Filter` needs the label
type it never had, and the two ways to get it are to copy 11px/600 into a fourth
file or to read the definition that exists.

The definition moves, and it moves to the file that already claims it.
`trip-workspace.module.css` carries this comment today:

> *The shape a tool takes is stated in `ui.module.css`, keyed on this bar's
> `role`, because that is where the button vocabulary lives*

It is true of the fill, the direction, the padding and the caret, and false only
of the glyph and the label. Moving those two makes the comment true and lets
`filter-bar.tsx` reach them the way `workspace-chrome.tsx` already reaches
`.iconOnly`:

```ts
// ui.tsx, beside the existing export
export const iconOnlyLabelClass = styles.iconOnly   // exists today
export const toolGlyphClass = styles.toolGlyph      // added
export const toolLabelClass = styles.toolLabel      // added
```

`.wideLabel` does **not** move. It is the laptop spelling of one specific
control's label and has nothing to do with a tool's shape.

**Alternative considered: `filter-bar.tsx` imports `trip-workspace.module.css`.**
One component reaching into a sibling's stylesheet for two classes, with no
export saying it is allowed. Rejected — the `iconOnlyLabelClass` precedent exists
precisely because this was already answered once.

**Alternative considered: leave the classes and duplicate the two declarations.**
Cheapest, and it is the fourth copy of a value in a chrome that got five menus
built four ways by doing exactly this. Rejected.

**Discovered while implementing: `.toolGlyph` had a third consumer, and it is not
a tool.** The search screen's back arrow wears it — `<ArrowLeft>` in
`workspace-chrome.tsx`, with a `.search.searchOpen .toolGlyph` rule in
`trip-workspace.module.css` — purely to get 22px. CSS Modules scope class names
per file, so moving the class would have left that rule selecting a name nothing
carries, and the arrow would have lost its size with nothing reporting it.

It gets its own `.backGlyph` instead, which is the honest answer rather than a
workaround: that arrow is not in the toolbar's row, takes none of the column
shape a tool takes, and is drawn only while the search screen is covering the
toolbar completely. Borrowing the class made it subject to every rule about what
a tool looks like, none of which it wants — and it is why the tool glyph appeared
to have two `display: block` rules at the same breakpoint, one of them redundant.

### 3. The count is hidden by width, in the file that owns it

```css
/* filter-bar.module.css */
@media (max-width: 700px) {
  .count { display: none }
}
```

`filter-bar.module.css` already has this exact block for `.glyph`, and `.count`
is that file's class.

The truer predicate is `[role='toolbar'] .count` — *a tool has no room for a
count*, which is a statement about the control's situation rather than about the
window. It is not used, because the role is on `.tools` at **every** width: the
attribute selector alone would hide the count on the laptop bar too, so the media
query has to be there regardless, and adding a predicate that excludes nothing is
the kind of thing this codebase writes apologetic comments about. The comment
names the toolbar as the reason instead.

This is worth revisiting only if a second `FilterBar` is ever mounted outside the
toolbar at a phone width, which nothing plans.

### 4. `hint` is a new `Menu` prop, named after the phone's

```tsx
hint={narrowed ? 'Filter this trip. Some places are hidden' : 'Filter this trip'}
```

Same prop name, same two strings, same job as `Tool`'s in
`apps/mobile/components/trip-workspace.tsx`. It becomes `aria-label` on the
trigger. Omitted, the accessible name is computed from the contents as it is
today, so the trip, city and account menus are untouched.

Two things make this safe rather than merely well-meant:

- **`aria-label` overrides the visible text, and WCAG 2.5.3 asks that the
  accessible name contain the visible label.** Both strings begin with the word
  `Filter`, which is the whole of the visible label at tool width and the readable
  part of `Filter · 1` at laptop width. Mirroring the phone's wording happens to
  satisfy this; a string like *"Some places are hidden"* would not, so the wording
  is load-bearing and not a placeholder.
- **It is separate from `name`.** `Menu` already documents why those are two
  props — *"the trigger may read `Filter · 9 of 17`, which is a state, while the
  panel it opens is `Filter`"*. This is the first call site to need the mechanism
  that comment describes.

The laptop trigger's announcement changes from `Filter 1` to
`Filter this trip. Some places are hidden`. That is an improvement and is claimed
as one: `marker-filtering` § *Any number the declaration carries SHALL be
unambiguous about what it counts* rejected `15 of 17` for being two bare numbers
beside the word `Filter`, and `Filter 1` read aloud is the same defect with one
number. The visible count is unaffected.

**Alternative considered: visually-hidden text inside the label.** There is no
`sr-only` utility in this codebase, so it means introducing one, and it puts a
second copy of the sentence into the DOM where the count already is. Rejected —
`aria-label` is one attribute and `Menu` already wanted the prop.

### 5. Dropping the fill takes three rules with it, not one

`[role='toolbar'] .live` is the rule that has to change, and it is not alone.
Removing the fill leaves two states that were relying on it:

```css
.live:hover                              { background: accent-wash;
                                           border-color: accent }
[role='toolbar'] .button:hover:not(.live) { background: surface-muted }
```

The first re-introduces the wash on hover inside a toolbar, and re-introduces a
border on a control whose `border-radius` is `0` and whose border is
`transparent` — so a narrowed tool would grow a square amber outline under the
pointer. The second excludes `.live`, so with the wash gone a narrowed tool would
have **no hover feedback at all**, alone among the three.

So a narrowed tool hovers like the other two, and the `:not(.live)` exclusion
stops applying inside a toolbar. This is the kind of thing that type-checks,
renders, and is wrong, and it is in the task list as something to put a pointer
on rather than something to reason about.

### 6. The narrowed state recolours the whole tool, which `.toolLabel` resists

`.live` sets `color: var(--pp-accent-ink)` on the button, and the glyph follows
it through `currentColor`. `.toolLabel` sets `color: var(--pp-ink)` explicitly,
which wins over an inherited value — so a narrowed `Filter` would be an amber
glyph above a plain-ink word:

```css
[role='toolbar'] .live .toolLabel { color: inherit }
```

`.toolLabel` keeps its own colour otherwise, deliberately. Removing it would make
every tool's label `ink-muted` along with its glyph, which is the phone's resting
treatment and is out of scope — see `proposal.md` § Not in this change. The line
between the two is that a declaration applied to half a control is this change's
own defect one layer down, while what an *undeclared* tool looks like is a
question about three controls.

### 7. The pip's geometry is the phone's numbers, unscaled

```
  phone                              web
  glyph 24pt                         glyph 22px  (.toolGlyph, unchanged)
  pip   7pt, 2pt ring                pip   7px,  2px ring
        top: -1, right: -5                 top: -1, right: -5
        fill accent, ring surface          fill accent, ring surface
```

Absolute offsets, so the 2px difference in glyph size does not want scaling — a
corner badge sits on the corner. The ring is `surface` because that is the bottom
bar's own background and there is no fill behind the pip any more, which is the
same relationship the phone's ring has to the phone's bar.

Note that the web's existing `.liveDot` is 5px with no ring and stays that way
for the laptop. The pip is larger and ringed because it is sitting **on** a
drawing rather than beside a word, which is the phone's reasoning and it holds
here for the same reason.

## Risks / Trade-offs

- **The narrowed state is now carried by a smaller area of the screen.** The wash
  filled a third of the bottom bar; two signals remain and both are small — an
  amber recolour and a 7px pip. → This is the phone's scheme, shipped, and the
  requirement's floor is two signals with one of them not hue. The mitigation is
  that it must be *looked at*, in greyscale, on both platforms — which is already
  an open roadmap loose end for the phone and is in the task list for both. If it
  fails the greyscale read it fails on the phone too, and that is one finding
  about one scheme rather than a web-specific regression.

- **Two dots exist in the markup and only the cascade separates them.** A
  breakpoint edit that shows both would draw a dot beside the word and a pip on
  the glyph at once. → The two rules are one line each and both name 700px and
  point at `trip-workspace.module.css`, as the four stylesheets that already
  repeat that number do. The task list checks the breakpoint from both sides.

- **`aria-label` silences the count for a screen reader at laptop width.** A
  sighted reader sees `· 1`; a screen reader hears *"some places are hidden"* and
  not how many criteria. → Deliberate, and the better trade: the requirement makes
  the count a MAY and makes an ambiguous number a defect. If the criterion count
  is later judged worth announcing it belongs in the `hint` as words, which is
  where it can carry its unit.

- **Moving two classes between stylesheets touches `Search` and `Drop`.** Both
  read `styles.toolGlyph` / `styles.toolLabel` from `trip-workspace.module.css`
  today and would read them from `ui.tsx` after. → Mechanical, and a
  `pnpm typecheck` catches every miss because they become named exports rather
  than property accesses on a CSS-module object, which silently yields
  `undefined`. That difference is the reason to prefer the exports.

## Migration Plan

None. No data, no schema, no stored value, no dependency. The change is four
files of web chrome and two specification files, and it is reverted by reverting
the commit.

## Open Questions

None that can be deferred. The two that mattered — whether the count survives at
tool width, and whether the wash survives with it — were both put to the user and
answered: mirror the phone.
