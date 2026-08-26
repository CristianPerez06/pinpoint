## Why

The web trip workspace spends **205px of a 929px viewport** on chrome — a header plus
three toolbar rows — to hold **558px of controls**, leaving 78–86% of every row empty.
At phone width it takes 293px, 35% of the screen, all of it at the top. That cost buys
an arrangement in which prominence runs almost exactly opposite to what the product
says matters: the top-left corner holds `Rename`, `People` and `New trip` — done about
once per trip in total — while `Wanted by`, which PRODUCT.md calls "the filter is the
product", is the second grey pill in the second row and looks identical whether it is
filtering or not.

Nothing here was decided. Each band arrived for a good reason and none was ever weighed
against the others, so the chrome is ordered by when each control was built. The phone
application went through this reorganisation already and left four rules in its files;
the web follows none of them. DESIGN.md's own *Navigation & Chrome* section specifies
"a menu holding rare actions" for the phone header and nothing at all for the web's,
which is where the drift is recorded.

Two defects fall out of the same cause and are fixed here rather than separately:
`.detour` and `.editor` are positioned `top: 100%` against a `.bar` that declares no
`position`, so every trip and city panel resolves its containing block to the whole
toolbar and opens at a fixed x, ~150px below whatever was pressed; and because `TripBar`
enforces one-panel-at-a-time only within itself while `CityBar` holds separate state,
`People` and `Edit city` can render on top of each other at identical coordinates and
z-index.

## What Changes

- **One bar replaces the header and the three-row toolbar.** Scope on the left (trip,
  then city), the three things a session is made of in the middle (search, drop,
  filter), the account on the right. Chrome drops from 205px to ~64px.
- **Rare trip-scoped actions move behind the trip's own name** — rename, invite and see
  people, new trip, and edit city behind the city's name. This is the phone's rule,
  and the menu it needs is the one DESIGN.md already specifies for the phone header.
- **`Wanted by`, `Hide visited` and `Clear` consolidate into one `Filter` menu.** The
  control declares narrowing by fill, a dot, **and a count of how many of the filter's
  questions are being asked** — `Filter · 1` — and **never by naming the members who are
  ticked**. Naming them is unbounded: ten members ticked is a label nobody reads on a
  control that changes width every time it is used. The count is of criteria rather than
  choices, so it means the same thing on a trip of two and a trip of ten.
- **An account menu is introduced**, holding `Sign out` today. It is the entry point
  #49 (profile) and #55 (settings and theme) are waiting on.
- **The detour anchoring defect is fixed**: `position: relative` on the bars that own a
  panel, and one open-panel state across the whole bar so two panels cannot occupy the
  same place.
- **Anything that opens gains a dismissal contract**: Escape and outside-click close it,
  and focus returns to the control that opened it. Only the filter menu does any of
  this today; `.focus()` is never called anywhere in the application.
- **Removals**: the `CITY` micro-label, the permanent `(4)` count on People, and the
  `title` tooltips that carry the only explanation several buttons have.
- **BREAKING (documentation only)**: DESIGN.md's Layout section says a laptop gets "a
  header plus a two-row toolbar". That sentence is amended to describe one bar. The
  header-menu pattern it gains is not new — the document already specifies one.

Out of scope, deliberately, each with its own reason: **archiving a trip from the web**
(a real parity gap against the `trips` spec, own ticket); **moving the accent off
`Drop a pin`** (held back so this arrangement can be judged without a second change
confusing it); **removing the city control** (it does three jobs on the laptop the phone
answered another way); **the phone-width layout** (#41, which this makes into a
breakpoint rather than a second design problem).

## Capabilities

### New Capabilities

- `workspace-chrome`: Where a trip's controls live and what they owe the person using
  them — what must remain permanently reachable, what may sit behind a menu, and the
  dismissal and focus guarantees anything that opens has to meet. Written for both
  applications, because the rule is about screen shape rather than platform, and
  because the phone already obeys most of it from code comments alone.

### Modified Capabilities

- `marker-filtering`: The requirement *A narrowed view declares that it is narrowed*
  gains three rules — the declaration MAY count how many of the filter's criteria are
  active, any number it carries SHALL be unambiguous about what it counts, and it SHALL
  NOT enumerate the members that produced it.

## Impact

**Code** — `apps/web/app/page.tsx` and `page.module.css` (the Shell's header becomes
the bar); `apps/web/app/_components/trip-workspace.tsx` and its module (three rows
become one); `trip-bar.tsx`, `city-bar.tsx`, `filter-bar.tsx` and their modules
(rewritten as menus); `ui.tsx` and `ui.module.css` (a menu primitive, which does not
exist today, plus `position: relative` on the panel-owning bars).

**Documentation** — DESIGN.md's Layout section, one sentence, plus its *Navigation &
Chrome* entry for the web header.

**Packages** — one addition to `@pinpoint/core`: `activeFilterCount`, beside
`isFiltered`, because what a filter means is defined once and shared rather than counted
again in each interface.

**Not affected** — no database change, no new dependency, and nothing in `apps/mobile`.
The phone already arranges itself this way, and the new spec is written to describe what
it does rather than to ask it to change.
