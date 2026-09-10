## Context

See `proposal.md` — Why. Everything below rests on measurements taken in the running
application at 1710px, 1400px, 1330px, 1150px and 580px, not on reading the stylesheets.

Four things in the repository shape the approach:

- **`Menu` positions its panel with CSS alone.** `.menuAnchor` is
  `position: relative; display: inline-flex`, the panel is `position: absolute; right: 0`
  under `align="end"`. Nothing measures anything, so the panel re-anchors on every layout
  pass — which is why the movement is live rather than only on open.
- **`.drop` already solved this exact problem**, with a reserved 124px slot and a comment
  naming the filter as the thing it was protecting.
- **`.tools > * { flex: 1 1 0 }` below 700px**, which is what neutralises `.drop`'s fixed
  width there. A slot declared the same way dissolves the same way.
- **`#101` landed four days ago** and rewrote how this trigger renders below 700px. The
  phone bottom bar is the part of this change most likely to break and least likely to be
  noticed.

## Goals / Non-Goals

**Goals:**

- The panel does not move, at any window width, on applying or on clearing.
- The controls beside the filter do not move either. It is one cause.
- The mechanism is the one already in the file, so there is one way this bar reserves room
  rather than two.
- The specification says the rule, so the next control that declares a state inherits it.

**Non-Goals:**

- Changing what the count says, where it is shown, or when. `marker-filtering` settled
  that and the measurements say it was not the problem.
- Changing `Menu` for every panel in the chrome. Four other menus use it and none of them
  has a trigger whose width follows its state.
- Any JavaScript measurement of position or width. See below.
- Touching the phone application, which is already immune.

## Decisions

### A reserved slot in the bar, not reserved space inside the button

The wrapper carries the width; the anchor and the trigger fill it.

*Why not reserve inside the button* — draw the count at `visibility: hidden` when not
narrowed, keep the dot in the layout, and so on. It is more surgical and it is the wrong
shape for what was measured. Four things change width simultaneously, and one of them is
**two flex gaps** that belong to no element: they appear because the button goes from two
visible children to four. Reserving space inside the button therefore means reserving for
a count, a dot, a font weight *and* a child count — the last of which has no element to
hang a rule on, and reappears the moment anybody adds a fifth child. A slot is indifferent
to all four; it fixes the edges and lets the contents do what they like inside them.

*The cost, stated plainly.* The trigger's contents re-centre inside a fixed box as the
count appears, so the word `Filter` shifts by about 20px when a filter is applied. `.drop`
has had exactly this property since it was built — `Cancel` floats in a slot cut for
`+ Drop a pin` — and nobody has filed it. Accepted on that precedent, and worth looking at
rather than assuming.

### The slot is 124px, and that number is `.drop`'s

The measured maximum is 122.46px, and it is a true maximum rather than the widest seen:
`activeFilterCount` returns at most 2, `tabular-nums` makes `· 2` the width of `· 1`, and
the four contributors above are all present at that point.

124px is `.drop`'s width. Two controls sitting side by side at the same size is worth more
than 1.54px of tightness, and it removes the question of why they are nearly-but-not-quite
equal. If a criterion is ever added and the count can reach a second digit, this number is
re-measured rather than guessed — record it as the reason it is written down.

### No `margin-left: auto`, and no removing `.search`'s `max-width`

Two mechanisms would fix the panel with no magic number, and both spend something the bar
has already decided.

*`margin-left: auto` on the filter* pins its right edge to the toolbar's right edge at
every width, so the anchor cannot move. It also pushes the filter away from `Drop` — at
1710px, 363px away, and hard against the account menu. *Controls are placed by how often
they are used* groups the session's tools together; this would ungroup them to fix a
layout bug.

*Removing `.search`'s `max-width: 480px`* would let the field absorb all spare room at
every width, so there is never room after the filter and its right edge is always pinned.
That fixes the panel by breaking a decision made deliberately and recorded in the file:
the field grows *"up to a width past which a search field stops reading as one"*. It also
leaves the trigger still changing width, so the narrow-window symptom — search and `Drop`
shifting 39.5px — survives untouched.

Both are worth writing down because both look cheaper than a reserved width, and neither
is.

### The panel's position is not frozen in JavaScript

Freezing the panel where it opened would fix the panel and leave the neighbours moving, so
it treats one symptom of the two. It also needs a measurement, a stored offset, and a
resize subscription inside `Menu` — for a panel that four other controls position with two
lines of CSS today. `Menu`'s value is that the contract lives in one place; adding a
measurement path there to fix one call site's stylesheet inverts that.

### The requirement is about what is seen, not about reserved widths

The delta says the panel and its neighbours do not move. It does not say a control has a
fixed width, though that is how this change satisfies it. A specification that named the
mechanism would forbid a future panel anchored to something that does not resize, which is
a perfectly good answer to the same rule.

## Risks / Trade-offs

- **The phone bottom bar breaks and nobody sees it.** The highest risk here by a distance.
  Wrapping the filter changes which element `.tools > * { flex: 1 1 0 }` applies to — it
  becomes the new wrapper rather than `.menuAnchor` — so without an explicit `width: 100%`
  the anchor sits content-sized inside a third-of-the-bar span and the tool's target and
  centring shift. `#101` fixed this bar four days ago. → Tasks that open it at a phone
  width, not a claim that the cascade handles it.
- **The count is a second digit one day** → 124px stops being enough silently, because a
  too-narrow slot does not error, it just resumes the bug. → Write the maximum and its
  derivation into the stylesheet comment, beside the number.
- **The word shifting inside its slot reads worse than the jump it replaces** → Look at it
  before accepting. `.drop`'s precedent says no, and `.drop` is a two-state control that
  changes rarely, where this one changes whenever the filter does.
- **The fix appears to work because the window is narrow.** Every measurement here says the
  symptom depends on the viewport, so a fix confirmed at one width is confirmed at one
  width. → Verify above 1347px, inside 1307–1347px, and below 1307px, named as three
  separate tasks.
- **A regression has no test that would catch it.** Nothing in this repository asserts
  layout geometry, and this change does not add that machinery. → The tasks carry the
  measurements, so the next reader can re-take them rather than re-derive them.

## Migration Plan

None. One wrapper element, one stylesheet rule, comments, and a specification delta.
Nothing persisted, nothing deployed differently, no change to any published behaviour on
the phone.
