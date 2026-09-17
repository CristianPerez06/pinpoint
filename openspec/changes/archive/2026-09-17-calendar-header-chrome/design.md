## Context

See `proposal.md` — Why. What shapes the approach:

- `WorkspaceChrome` (`apps/web/app/_components/workspace-chrome.tsx`, ~450 lines) renders
  the bar and takes a single `ChromeBindings` object of about thirty fields. Roughly twenty
  of them exist for controls the calendar will not show: the cities, the markers, the
  filter, the search bias, the drop state, the refs the toolbar measures itself with.
- The account menu is not a component. It is written inline inside that file.
- At a phone width the bar becomes a two-row grid, because the trip's name and the city's
  each need a line of their own. The calendar has no city.
- `TripBar` already takes `calendarHref` and renders a row pointing at this screen.

## Goals / Non-Goals

**Goals:**

- One definition of the bar, so the two screens cannot drift into two bars.
- The calendar supplies only what it has, rather than stubbing out what it does not.
- No behaviour change to the map's header.

**Non-Goals:**

- No redesign of the bar itself. The arrangement, the breakpoint and the phone shape stay
  as they are.
- No change to what the trip's menu holds, beyond the one row that names the other view.

## Decisions

### The bar becomes a shell with slots, and both screens fill it

Extract the `<header>`, the mark, the grid and its breakpoint into a component that takes
what goes in each position — scope, session, account — and let each screen pass its own.
The map passes the trip, the city, the three tools and the account. The calendar passes
the trip, the way back, and the account.

The alternative was a mode flag on `WorkspaceChrome`, with the calendar handing it a
`ChromeBindings` two-thirds full of stubs. Rejected: a stub is indistinguishable from a
value at the type level, so the next field added to that object gets a stub on the
calendar and nobody finds out. Slots make the calendar's bar say what it holds.

A third option — a separate calendar header sharing only the stylesheet — is what the
chrome's own "one definition" rule exists to prevent. Two bars agree on the day they are
written.

**This is a refactor of code that already ships, and the risk lands on the map**, which is
the screen the product is. The extraction should move code rather than rewrite it, and the
map should be looked at before the calendar is.

### The account menu comes out into its own component

It has to, for the bar to be composable — the calendar needs it and cannot reach inside
`workspace-chrome.tsx` for it. Moved rather than rewritten, including the two states it
already has: the address spelled out where there is room, and a glyph where there is not.

### `TripBar` is told which view to offer, not which screen it is on

One prop carrying the other view's name and address, rather than `calendarHref` plus a
flag. The bar then holds no opinion about where it is: whoever renders it knows, and says
so once.

### Switching trips drops the day

The day lives in the address as `?day=`. Changing trip navigates to that trip's calendar
**without** it, so the opening-day rule decides afresh.

Carrying it across is the failure worth naming: two trips rarely cover the same dates, so
the day from one lands outside the other, the calendar opens on an empty day, and it reads
as a trip with nothing planned rather than as the wrong day.

### The day band is a third row of the screen, not part of the scroll

`.screen` is a flex column of header and a scrolling body. It becomes header, day band,
body — the band pinned between them. That satisfies the requirement that the navigation
stays reachable without it being inside the header.

## Risks / Trade-offs

- **Extracting a working 450-line component can regress the map** → move the code rather
  than retype it; keep the map's bindings object and its markup identical; look at the map
  at a laptop width and a phone width before touching the calendar.
- **The phone-shaped bar is a two-row grid built for two names, and the calendar has one**
  → the grid must collapse to one row rather than leave an empty cell. `AGENTS.md` records
  that a control's width here is decided by flex defaults nobody wrote; measure the row
  rather than trusting that it looks right.
- **Dropping `?day=` on a trip switch is one line, and forgetting it produces a screen that
  looks correct** → an empty day on the wrong date reads as a trip with nothing planned.
  Worth a test on the grouping helper's caller rather than only an eye.
- **The way back moves from where it is today** → it currently sits at the far left, which
  is where a back control is conventionally looked for. Moving it to the session band is
  what the chrome's placement rule asks for, but it is a change to something people may
  already have learned. Worth looking at before it ships.
