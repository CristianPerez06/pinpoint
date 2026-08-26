## Context

See `proposal.md — Why` for motivation and the measurements behind it.

What shapes the approach, beyond that:

- **There is no menu primitive.** `ui.tsx` has `Button`, `TextField`, `FormError` and
  `overlayPanelClass`. Every panel in the chrome today is hand-rolled in the component
  that raises it, which is exactly why there are five of them built four different ways.
- **One of the five is already right.** `filter-bar.tsx` installs a `pointerdown` and
  `Escape` dismisser and positions its menu against a `position: relative` `.picker`,
  with a comment explaining both. The other four resolve against `.toolbar` because
  their `.bar` never declares `position`. This change does not need to invent the
  contract; it needs to lift the one that exists into a primitive so no call site can
  get it wrong — the same move `Button` already made for `aria-disabled`.
- **The filter's meaning is not ours to hold.** `matchesFilter` and `isFiltered` live in
  `@pinpoint/core` and are what the map already draws from. Anything the control says
  *about* a filter belongs there too, or the two applications will eventually say
  different things about the same filter.
- **`page.tsx` is a server component and the trip name changes.** The name was moved out
  of the header into the toolbar for exactly this reason. Folding the toolbar back into
  the header means the header can no longer be rendered on the server, which is what the
  original comment recorded as the constraint.
- **`useState` updaters must stay pure.** `city-bar.tsx` already carries a comment about
  this: a read fired from inside an updater is sent twice in development. Any
  open-panel state that also triggers a refetch has to fire the read outside the updater.

## Goals / Non-Goals

**Goals**

- One bar, one open-panel state, one menu primitive, one dismissal contract.
- The filter's count defined in `@pinpoint/core`, so no two interfaces can report a
  different number for one filter.
- The menus that #49, #55 and web archive parity will hang from, built once here.
- One addition to `@pinpoint/core` — the filter count — and nothing else outside
  `apps/web`. No change to `apps/mobile`.

**Non-Goals**

- **The phone-width layout (#41).** This makes the bar collapsible rather than
  collapsing it. The `max-width: 700px` holding rule in `trip-workspace.module.css` stays
  and keeps its comment saying it is temporary.
- **A generic dropdown/popover library.** The primitive covers the cases in this chrome
  and nothing more; a portal, collision detection and placement flipping are not needed
  for controls anchored inside a single 64px bar.
- **Rewriting the marker details and marker form panels.** They float over the map from
  `overlayPanelClass`, not from the chrome, so `workspace-chrome`'s dismissal rules do
  not reach them. Their own dismissal gap is real and is left to the follow-up a11y
  ticket, so this change is not two changes.

## Decisions

### One `Menu` primitive in `ui.tsx`, owning the whole contract

A single component takes a trigger label and its content, and owns: the
`position: relative` anchor, `aria-expanded` and `aria-haspopup` on the trigger,
`role="group"` with `aria-label` on the panel, `pointerdown`-outside and `Escape`
dismissal, and focus return to the trigger on close.

Chosen over leaving each component to build its own — which is the incumbent and
produced five contracts — and over a third-party popover library, which the `$0`
constraint tolerates but which brings a dependency for behaviour that is roughly thirty
lines and already written once in `filter-bar.tsx`.

`pointerdown` rather than `click`, kept from `filter-bar.tsx` along with its reason: a
`click` listener fires after the map has already decided what the press meant, so
pressing the map to dismiss a menu would also drop a pin while armed.

### One open-panel state, lifted to the bar

A single `open: 'trip' | 'city' | 'filter' | 'account' | null` held by the bar, passed
down. `TripBar`'s internal `open(which)` helper already does this within itself; the
defect is that `CityBar` holds a separate `editing` flag and nothing reconciles them.

Chosen over each menu holding its own state and closing others through callbacks, which
is the same invariant expressed in N places and is how the current bug exists. The
`workspace-chrome` spec requires this across the whole chrome, not per group, and one
variable is the only way to state that once.

The refetch-on-open signals (`onShowPeople`, `onEditCity`) fire from the event handler,
outside the state updater, per the note in Context.

### The count comes from `@pinpoint/core`, and counts criteria

`activeFilterCount(filter)` beside `isFiltered`, returning the number of the filter's
questions currently being asked: naming members is one however many are named, the
triage pile is that same one seen from the other side, and hiding visited places is the
other. The control renders `Filter · {n}` while `isFiltered(filter)`, and `Filter` alone
otherwise. Tabular figures, so it does not shift as it counts.

In `@pinpoint/core` rather than in the component, by the rule that already governs this
file: what a filter *means* is defined once so the map, the card and both applications
agree. A number computed in the web control would be a second definition, and the phone
would eventually grow a third.

**This replaces a first attempt that shipped and was wrong**, and the reason is worth
keeping. It reported surviving markers — `15 of 17` — on the argument that a count of
what survives answers the question an emptier map raises. It does, but nobody reads it
that way: two unlabelled numbers beside a control called `Filter` are read as counting
filters, so a single active filter announced itself as fifteen of seventeen. The
information was real and the reading was false, and a false reading costs more than the
information was worth. What the filter did to the map is already visible in the map.

Alternatives considered and rejected: labelling the marker count (`15 of 17 places`),
which removes the ambiguity but grows the control and restates what the map shows; and
counting hidden markers with a unit (`2 hidden`), which is unambiguous and informative
but was not what was wanted — the number people wanted was about the filter, not about
its consequences.

### The header becomes a client component

`Shell` in `page.tsx` currently renders the wordmark and a `Sign out` form on the
server. The bar needs the trip name, which can be renamed, so the bar is
`'use client'` and lives in the workspace. `page.tsx` keeps the `<main>` and the
loading/failed/empty states.

The sign-out server action stays a server action; the account menu renders a `<form>`
around it exactly as the header does today, so nothing about how signing out works
changes.

While here: the `<header>` moves out from inside `<main>`, which is what currently stops
it exposing a `banner` landmark. That is one line and fixes a finding the review raised.

### `Hide visited` goes inside the filter menu

The mock that was approved shows it there, and the spec's declaration/way-out separation
already permits it: the `Filter` control declares, and reveals everything that narrows.
It costs one click.

**This is the one decision the review left explicitly open.** It is implemented as
approved rather than deferred, because leaving it in the bar would make the bar four
tools wide and split narrowing across two controls, which `marker-filtering` forbids —
the control that declares must be the one that reveals. If it turns out to be pressed
constantly while on a trip, it earns promotion back and the spec permits that; nothing
here is hard to reverse.

## Risks / Trade-offs

- **Two menus in the bar could read as one control at a glance** (`Japan 2 ▾ / Kyoto ▾`).
  → The separator and the city being a narrowing of the trip is the intended reading; if
  it fails, the city becomes a labelled control again at the cost of a little width.
- **A long trip name pushes the bar.** Sixty characters is the stored maximum and the
  mock shows nine. → The trip name is the only element that yields, exactly as the phone
  header already does it; it truncates rather than pushing the tools off the edge.
- **Discoverability of `Cities` and `People` now rests entirely on two names reading as
  controls.** → Both carry a caret, which the phone's comment names as the thing that
  makes a label-shaped control findable. Worth a look at the running app rather than a
  reasoned answer.
- **Focus return can fight React's unmount order** — restoring focus to a trigger that
  has just re-rendered. → Restore in a layout effect keyed on the panel closing, and
  check it by keyboard rather than by reading the code.
- **The bar is denser, so a mis-aimed press is likelier.** → The 64px bar keeps the
  existing control padding; nothing shrinks. The tools stay separated from the account.
- **`prefers-reduced-motion`.** If the menus animate at all, they honour it. The safer
  default is that they do not animate.

## Migration Plan

No data migration and no released contract, so this is a straight replacement on a
branch. The detour anchoring fix (`position: relative`, one open state) is written first
and is independently correct, so if the reorganisation is abandoned the bug fix survives
as its own commit.

Rollback is reverting the branch; nothing is persisted differently and no stored state
changes shape.

## Open Questions

- **Does `Cities` want its own entry, or is `Edit city` behind the city name enough?**
  The chrome has never offered creating a city at all — the only route is the marker
  form. That gap is real but it is capture, not chrome, and answering it does not change
  these specs, this approach, or the tasks. Left for the look at the running app.
