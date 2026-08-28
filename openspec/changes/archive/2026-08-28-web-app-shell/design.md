## Context

`apps/web/app/page.tsx` is a server component that awaits the auth guard, then the trip
list, then four reads in parallel, and only then renders `TripWorkspace` — a 1,600-line
client component that holds the header, the tools, the map and every panel. Until all of
that settles, the route shows `app/loading.tsx`, which is a `LoadingState` panel inside
`.full`. `.full` is `height: 100dvh` and nothing else, so the panel is a block child that
shrinks to its content and pins itself to the top of an otherwise empty page.

Three shapes decide this change and none of them is negotiable:

- **The chrome is almost entirely data.** Of eight things in the bar, only the mark and
  the path separator need nothing fetched. The trip and city controls, the filter and the
  account all name something that has to be read first.
- **The phone shape is the same markup.** `@media (max-width: 700px)` re-grids the one
  `<header>` and lifts the one `.tools` span to the bottom edge. There is no second
  component and no JavaScript test of viewport width, which is deliberate — #72 records
  why. A shell built once therefore gets the phone's header and tab bar for free.
- **`requireUserId()` is a network round trip and it gates the route.** It calls
  `getUser()` against the auth server and may `redirect()`, so nothing in the route can
  render before it resolves. `proxy.ts` refreshes the session on every matched request but
  does **not** redirect, so the page's guard is the only gate there is.

A mock was built and looked at before any of this was written; it lives in `mock/` and its
README records what it settled and the four defects found inside it.

## Goals / Non-Goals

**Goals:**

- The workspace's frame is on screen, in final position, at both widths, before the trip
  and its places have been read.
- Every control in it is inert until the act it starts can complete — which is a wider set
  than "until its data arrives".
- One definition draws the waiting state and the loaded state, so they cannot drift.
- The map's wait happens in the map's own area, on the map's own ground.
- `.full` and `.centred` stop discarding the height they were given.

**Non-Goals:**

- **A laptop-bar truncation defect — which turned out not to exist.** The mock showed
  `All places` and the account drawing on top of one another with a 37-character trip name,
  and this document originally carried it as a thing to file. It does not reproduce: the
  real `.name` is pinned to `12ch` with `text-overflow: ellipsis`, where the mock's sized
  itself to its text. Measured in the running application at 1600px, the name truncates and
  there is 301px of clearance. The lesson is the mock's own: a board is a model, and a model
  that omits a `width` invents a defect as readily as it finds one. The narrow end — the
  same names just above the 700px breakpoint — is still unmeasured.
- **Mobile.** `apps/mobile` seeds its screen differently and its states are `flex: 1`. The
  rules added here are written for the web application.
- **Removing the auth round trip.** `guards.ts` already argues for `getUser()` over
  `getSession()` and for revisiting the cost only if it shows up in a page load. This
  change makes that window visible; it does not close it.

## Decisions

### One header that draws both states, rather than a separate skeleton

Three shapes were considered.

**A — a `WorkspaceSkeleton` component rendered by `loading.tsx`.** Cheapest: no change to
`page.tsx` or to `TripWorkspace`. Rejected because it is a second markup that has to be
kept in agreement with the first by hand, in a repo whose change log is largely made of
defects of exactly that kind — and because the two are exchanged at the precise moment
the transition is meant to feel settled, so any disagreement between them reads as a
flinch.

**C — per-slot streaming with React 19 `use()`.** Each name is its own `<Suspense>` around
a component that `use()`s a promise handed down from the server, so a name appears the
instant its own query lands. Available here — Next 16.2.12, React 19.2.3. Not chosen as
the starting shape because the four reads are already `Promise.all`'d and finish together,
so it buys nothing today. It is not foreclosed: B's boundaries are where C's would go.

**B — one chrome, data-optional.** Chosen. The header and tools band lift out of
`TripWorkspace` into a chrome that takes its names as nullable and renders the same
elements either way.

### What "not replaced" can actually promise

The ideal — the chrome element is created once and literally never unmounted — is not
reachable while the auth guard gates the route. Something has to be on screen during that
round trip, that something is the `loading.tsx` segment, and Next replaces the segment
when the page resolves.

So the guarantee is stated as what can be seen: **one definition draws both states, and
nothing in the chrome moves when the data arrives.** `loading.tsx` renders the same
`WorkspaceChrome` with no data that the workspace renders with data. The segment swap
still happens; because both sides are one component with one stylesheet, its output is
identical and there is nothing to see. The specification was written this way on purpose —
"is not unmounted" is a fact about a framework and is not testable; "does not move" is
what is actually being promised.

### The `<header>` must stay a sibling of `<main>`

`page.tsx` carries a comment recording that a `<header>` nested inside `<main>` exposes no
`banner` landmark, which is why `TripWorkspace` renders both rather than being wrapped in
`Shell`. Lifting the header out must not put it back inside `<main>`. The chrome renders
`<header>` and the workspace renders `<main>`; whatever composes them keeps them siblings.

### Inert is `aria-disabled`, and the text stays readable

DESIGN.md:636 is explicit: keep an unavailable control in the tab order with
`aria-disabled="true"`, styled inert, with a no-op handler — the `disabled` attribute
leaves the tab order and is skipped by screen readers. The difference has to survive
greyscale, so it is carried by fill and weight as well as by colour.

The text of an inert control still has to clear 4.5:1 (`styling`, "A token used for text
clears the text contrast floor", which names inert control text explicitly). So inert text
is `ink-muted`, never `ink-faint`.

**This exposes a documentation defect.** DESIGN.md's prose says Muted Ink, the shipped
`filter-bar.module.css` uses `--pp-ink-muted` with a comment explaining why, and
DESIGN.md's own `clear-inert` token block still says `{colors.ink-faint}` — a value
`styling` forbids for text. The block is corrected here, because this is the change that
establishes the inert vocabulary and the next reader will take the block at its word. The
mock took it at its word and got it wrong, which is the evidence.

### The map's ground, not a second band of chrome

The waiting area takes `--pp-map-land` — the colour the map itself will be — rather than
`surface-muted`. On the light ground that makes the hole map-shaped before the map
arrives; on the dark ground the header and the map area sit close enough in value that the
hairline does the separating, which reads as one field rather than a seam. Both were
checked in the mock.

### `.full` and `.centred`

`.full` gets what `.boundary` already has — `display: flex`, centred — and `.centred` gets
`display: flex` so it passes on the height it correctly takes from `.shell`. This is
independent of the shell and outlives it: the failed state, the empty state and
`TripSetup` all route through `.centred` and none of them goes near the chrome.

## Risks / Trade-offs

- **`TripWorkspace` seeds client state from props on mount, and the header is being pulled
  out of it.** The filter, the open panel and the selected city all live in that component,
  and the header's controls read and write them. → Move the chrome's *rendering* out, not
  its state: the chrome takes what it draws and what to call as props. If the split starts
  requiring state to move, stop and reconsider rather than pushing through — that is the
  point at which C's shape is worth reopening.

- **The `banner` landmark is easy to lose and nothing catches it.** → Verify with an
  accessibility tree inspection, not by reading the JSX. It is in the task list as a
  looking task.

- **A chrome full of inert controls promises things it cannot do.** Somebody will press
  one. → That is what the inert treatment is for, and it is why the rule is "inert until
  the act can complete" rather than "until the data arrives": the two controls that would
  otherwise be live are exactly the two whose failure would be confusing.

- **The auth round trip still gates first paint.** The shell does not make the application
  appear sooner; it makes the wait legible. → Worth saying plainly rather than claiming a
  performance win this change does not deliver.

- **Everything here type-checks and lints whether or not it is right.** The last two
  changes each shipped three defects visible only by opening the app, and building the
  mock for this one produced four more. → Looking tasks are in `tasks.md` and are not
  optional.

## Settled Questions

Both were open when this document was written and are closed here, with what settled them.

### The placeholder takes the label's own measure, and does not guess

Written before the code existed, this document assumed the width would have to be guessed
and that a wrong guess would be absorbed by the search field. Both halves were wrong.

Every name in this bar is already pinned in `ch` — the trip to `12ch`, the city to `11ch`,
the account to `13ch` — for the same reason `.drop` reserves a slot for its longer label: a
control whose width follows its contents moves whatever sits after it. So the measure is
handed to the placeholder rather than invented, and the label's own class is worn for the
type, so `1lh` is the line box the name would have had.

Guessing was measured and it was wrong in both directions: the city came out 24px narrow,
which pushed search, drop and filter 24px right, and the header stood 5px shorter than it
would once the name arrived. With the measure borrowed, every number is identical in both
states — six controls at the same x, width and height, and a 61px bar either way.

Two things this only found by running:

- **The filter needs no placeholder at all.** Its trigger reads `Filter` — a glyph and a
  word, both fixed — and gains a count only once a filter has been applied, which cannot
  have happened yet. The waiting label *is* the loaded label. A placeholder there was 33px
  wider than the word it replaced and moved everything after it.
- **An empty box does not hold a width open.** At a phone width `.name` becomes
  `width: auto`, and a flex item's automatic minimum is its content — a word for the live
  label, nothing for a box holding a bar sized in per cent. The whole chain collapsed and
  the placeholder measured zero: control drawn, class applied, rule correct, nothing on
  screen. The measure is therefore given inline, where it wins at both widths.

### The block's fill is `--pp-ink-faint` at full strength

Measured rather than eyeballed, against `--pp-surface` on both grounds:

| Candidate | Light | Dark |
| --- | --- | --- |
| `--pp-line` | 1.30:1 | 1.27:1 |
| `--pp-surface-sunk` | 1.17:1 | **1.05:1** |
| `--pp-ink-faint` at 50% | 1.62:1 | 1.89:1 |
| `--pp-ink-faint` | 2.90:1 | 3.70:1 |

**`--pp-surface-sunk` is disqualified**: at 1.05:1 against `surface` it is the same colour
as the bar on the dark ground, so the placeholder would vanish and the waiting bar would
read as an empty one. Section 04 of the mock drew all three candidates on the light ground
and section 05 drew only `--pp-line` on the dark, so nothing on the board showed this — it
came out of measuring, which is worth remembering the next time a colour is chosen by
looking at one ground.

`--pp-ink-faint` at full strength is the only candidate that clears the 3:1 non-text floor
on the dark ground and effectively reaches it on the light. A loading placeholder is
arguably decorative — the spinner, its words and `aria-busy` carry the meaning, so
WCAG 1.4.11 need not bind — but a value that would pass if it did bind is the one to take
when it costs nothing. Using `ink-faint` for this is exactly what the token is for:
`styling` forbids it for text and reserves it for what is drawn.

### The account slot carries a placeholder at a laptop width

So the bar's right edge holds still when the name arrives. It is the only element in the
bar that would visibly move otherwise, since everything else is either fixed-width or
absorbed by the search field. The extra width guess costs nothing for the reason the
placeholder finding above gives.

At a phone width it carries none, because the name is already replaced there by a static
glyph — which is what the fourth requirement in `workspace-chrome` allows for.
