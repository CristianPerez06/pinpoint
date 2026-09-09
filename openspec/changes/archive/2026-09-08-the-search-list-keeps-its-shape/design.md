# Design

## Context

See `proposal.md` — Why. What matters here is the shape of the code the change
lands in, which is unusually symmetric: the same list is written three times, and
two of those three are one component.

```
  apps/web/app/_components/place-search.tsx        one component,
  apps/web/app/_components/place-search.module.css one stylesheet,
                                                   two renderings, split at 700px
  apps/mobile/components/place-search.tsx          a third rendering
```

Both applications derive the wait the same way, and the derivation is the thing
this change has to take apart:

```js
const result = answer?.query === trimmed ? answer.result : null
const searching = trimmed !== '' && result === null
```

The comment above it is worth keeping and worth reading, because it explains why
this is derived rather than flagged: two pieces of state that can disagree
produce a render where the list claims to have found nothing before it has
looked. That argument still holds. What the derivation cannot express is the
difference between a query being typed and a query being sent, because the
request goes out on a timer 300ms later:

```
  type   k    y    o    t    o          (pause)              answer
         │    │    │    │    │              │                   │
  ───────┼────┼────┼────┼────┼──────────────┼───────────────────┼──────▶
         │◀────── still typing ────────────▶│◀─── request out ─▶│
         │        nothing has been asked    │       300ms       │
         └──────────────── searching === true ──────────────────┘
```

The left half is unbounded. It lasts as long as somebody keeps typing.

## Goals / Non-Goals

**Goals**

- One indication of waiting per situation, each true of the situation it is in.
- The list does not change size or width because of the wait.
- Nothing in `@pinpoint/geocode` changes. The request, the quiet period, the
  abort and the four-state result are all correct.

**Non-Goals**

- Any shared component. `styling` forbids sharing markup across platforms, and
  the header comments in both `states.tsx` files already carry the argument.
- Any new token. The values this needs are two row heights, and they are facts
  about two particular rows rather than a scale anything else would draw from.
- Animation. See *Decision 5*.

## Decisions

### 1. Add one piece of state for "a request is out", rather than reworking the derivation

`searching` stays exactly as it is and keeps its comment. Beside it goes a second
value, set when the debounce timer fires and cleared when the answer is stamped —
inside the existing effect, which already owns the timer and the abort.

The two compose into the three situations the specs describe:

```
  requestOut   settled answer on screen   →  what shows
  ─────────────────────────────────────────────────────────────────
     false             none               →  nothing
     false             yes                →  the answer, marked pending
     true              none               →  shells + "Searching…"
     true              yes                →  the answer, marked pending
```

*Alternative considered:* replacing the derived flag with an explicit state
machine covering idle / typing / requested / answered. Rejected because it
reintroduces exactly the disagreement the current comment warns about — the
answer's stamp is the source of truth for "does what is shown match what is
typed", and a parallel machine can drift from it. The added value is a fact about
the network, not about the answer, so it does not overlap.

*Alternative considered:* deriving "a request is out" from a timestamp of the
last keystroke. Rejected as a clock where an event will do; the timer already
fires at exactly the right moment.

### 2. A query in flight keeps the previous answer, marked pending

This is the decision the spec change exists for. The requirement being narrowed
said *what is displayed SHALL always correspond to what is currently typed*,
which forbids it. Read against its own scenarios, that sentence is defending one
thing: a late response must not be presented as the answer to a newer query. It
was written when nothing else could have been on screen during a wait, so it did
not have to distinguish an answer from the list showing it. Now it does.

The cost is real and is accepted: a person can tap a candidate belonging to the
previous query. What they get is the place they tapped, which is not a lie — the
row said what it was. What is genuinely uncomfortable is a list swapping under a
finger already descending, which is a phone problem and is in the task list as
something to look at rather than something to design against in advance.

*Alternative considered:* shells that mime the count and height of the list they
replace, so nothing stale is shown and nothing resizes. Rejected because it
throws away information to satisfy the letter of a requirement that is being
rewritten anyway: the previous rows tell you the search is finding places of
roughly the right kind, and grey blocks tell you nothing.

### 3. Pending is shown, and only sometimes said

`aria-busy` alone is invisible, so a refinement would give a sighted person less
than the `Searching…` they get today. The words stay; they move. Instead of
replacing the list they stand above it, and the list is dimmed beneath them.

On the laptop this label has to sit outside the scrolling box —
`max-height: 320px; overflow-y: auto`, moved off `.results` onto a `.scroll`
inside it — or it slides away from the rows it describes at the first flick of a
wheel.

The dimming and the words are not on the same switch, and this is the same
distinction *Decision 1* turns on. A list goes stale on the keystroke and stays
stale until the answer lands, so it is dimmed for that whole span. `Searching…`
is only true once something has been asked, so it appears with the request and
not before. In the quiet period between them the list is dimmed and silent,
which is exactly the claim being made: this is not an answer to what you have
now typed, and nothing further is known yet.

*Alternative considered:* an indeterminate progress line across the top of the
panel. Rejected under `DESIGN.md`, and because a line says less than a word.

### 4. Three shells

`DEFAULT_LIMIT` is 8, but it is a ceiling: Photon commonly returns one to three
for a specific name, and eight shells collapsing to two is a worse movement than
three growing to eight. Three also fits every rendering without scrolling, which
means the shell state never shows a scrollbar the answer will not need.

### 5. The panel's width still follows its content, and the shells are content

`.results` is `width: max-content` over a `min-width` of the field, which is a
deliberate rule with its own argument in the stylesheet: a list cut to the
field's width truncated the region on every row, and the region is how two
same-named places on different continents are told apart. That rule is not
negotiable here, and it has a consequence — a surface sized by what is in it is
resized by anything put in it, placeholder rows included.

So the width moves. What this change does is make the movement small rather than
pretend it is gone. Today the panel opens on the first keystroke sized to the
words `Searching…` and jumps roughly 180px when rows arrive. With the panel
withheld until a request is out and the shells sized to a plausible row, it opens
at about 390px against a typical settled list of about 470px.

*Alternative considered:* fixing the panel's width for the duration of the wait.
Rejected — it trades a small movement for a predictable one in the wrong
direction, and any fixed value is wrong for most queries.

*Alternative considered:* sizing the shells to the 560px cap so results almost
never widen the panel. Rejected because it inverts the problem: short answers,
which are the common ones, would make the panel visibly shrink, and a panel that
collapses reads worse than one that grows.

What must not move is the panel itself and the height of a row. Both are held,
and both are what is actually read as a list jumping.

### 6. The shells do not move

`DESIGN.md` names gradient fills and decorative blur among the things this
product does not do, and a sweeping shimmer is both.

This also retires a spinner rather than merely declining to add one. The phone's
`Searching…` stood beside an `ActivityIndicator`, which earned its place while
that message was the whole state: motion was the only thing separating a wait
from a screen that had given up. The shells say that and say what is coming, so
the spinner became a third element restating the other two and the only turning
thing on the screen. The laptop's message never had one, so removing it also
stops the two platforms disagreeing about what a wait looks like. A slow opacity pulse would
be permissible in principle, and is not worth what it costs: web is already
covered by the blanket `prefers-reduced-motion` rule in `globals.css:104`, but
the phone has no reduce-motion check anywhere in the codebase and would need
`AccessibilityInfo.isReduceMotionEnabled` plus its change subscription — a new
capability on that platform, introduced for a pulse. Static blocks need none of
it.

### 7. Written inline in each file, not extracted

There is one list. Extracting a primitive would produce a component per platform
whose only caller is the file it was extracted from, and it could not be shared
across platforms anyway. If a second caller ever appears, that is the moment to
extract, and `states.tsx` is where it would go.

### 8. The row floor is set per rendering, from what that row already is

The height is not a shared value. The three renderings are three layouts and the
taller variant is a different number in each:

```
                       today            floor      set by
  ───────────────────────────────────────────────────────────────────
  phone app          53 / 61pt          61pt       two text lines vs a 28pt glyph
  web ≤700px         42 / 52px          52px       a stacked grid vs a 26px glyph
  web >700px         42px flat          —          the 26px glyph, always
```

Above 700px the row is already one height, because it is one line and the glyph
is taller than the text. It needs no floor and gets none.

*Alternative considered:* a `SEARCH_ROW_HEIGHT` token in `@pinpoint/tokens`.
Rejected on its own terms: there is no single value, so it would be three
tokens, and three constants naming three particular rows in two applications is
not a scale — a token is a value the product reasons in, and these are
measurements of two specific layouts.

This originally cited `styling` § *Shared styling infrastructure is introduced
only when a token is shared* as agreeing. It does not. That requirement governs
when a token **package** may first be created, and the package has existed since
the first shared colour; it says nothing about what may be added to one that
exists. The citation was decoration on an argument that did not need it, which
is the failure `#99` recorded on its way out — a requirement named rather than
read. The reason above stands without it.

## Risks / Trade-offs

- **A stale row is tapped during a refinement, or the list swaps under a
  descending finger.** → The tap yields the place named on the row, so the
  outcome is never wrong, only possibly unintended. Mitigated by dimming the
  pending list so it does not read as settled; scheduled to be looked at on the
  phone specifically, on a throttled connection, in section 5.
- **The floor makes short rows taller, so fewer candidates fit without
  scrolling.** → Eight rows at 61pt is 488pt, which still fits the phone's modal
  body; the laptop's panel scrolls at 320px today and will continue to.
- **The live region re-announces on every refinement.** → The pending label is
  not itself a live region; the announcement is made when the wait begins and not
  repeated for each keystroke.
- **The shell is now rare — only the first search of a session.** → That is the
  intent, and it is worth naming as a trade the change makes deliberately: most
  of the benefit here comes from the retained list and the row floor, and the
  shells are what the remaining case deserves.
- **`one-colour-per-place-type` is in flight and edits both `place-search.tsx`
  files.** → The overlap is a glyph colour and this change draws its shells in
  `surfaceMuted`, so there is no semantic conflict. Land that change first; this
  one rebases cheaply, and its task 5.5 already involves looking at the search
  results.

## Migration Plan

None. No data, no schema, no stored preference, no dependency. The change is
reversible by reverting it.

## Open Questions

None that can be deferred without changing the specs or the tasks.
