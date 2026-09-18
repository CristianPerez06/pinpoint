## Context

See `proposal.md` for why. What shapes the approach:

- Both calendars already group a trip's places with `groupMarkersByDay` from
  `@pinpoint/core`, which hands back `undated` sorted by name then id. The waiting list is
  a `Waiting` component in each app: a `<details>` on web, a `Pressable` plus a capped
  `ScrollView` on the phone.
- The web calendar decides its shape in CSS alone: `.dayNeighbour` is hidden below 900px.
  No JavaScript reads the window's width, so the first paint from the server and the
  first render in the browser always agree (#152 is about exactly that kind of mismatch).
- Both calendars are rendered with `key={trip.id}` (`apps/web/app/calendar/page.tsx`,
  `apps/mobile/app/calendar.tsx`), so changing the trip remounts the screen and resets
  its state.
- The phone is always the narrow shape.

## Goals / Non-Goals

**Goals:**

- One definition of how the waiting places are grouped and ordered, used by both apps.
- The web shape stays decided by CSS, with no width read in JavaScript.

**Non-Goals:**

- Any change to how a place is opened, edited, or given a day.
- Remembering the chosen view anywhere, including the address.

## Decisions

### Grouping by city is a pure function in `@pinpoint/core`

`groupUndatedByCity(undated, cities)` returns ordered groups, each with its city (or none)
and its places. The groups are sorted by city name with the no-city group last, and the
places inside keep the order `groupMarkersByDay` gave them. A place whose `cityId` names a
city that isn't in the list (deleted under a re-read) goes into the no-city group, not a
group with no name.

It lives in core, beside `groupMarkersByDay` in `marker-day.ts`, because the spec fixes
the order and two apps each sorting their own way is exactly how they would drift. It
takes the cities as an argument rather than reading them, so it stays a pure function and
is tested beside the other day groupings.

City names are compared with `localeCompare`, the way the city chooser already orders
them. If the chooser has a helper for that, reuse it.

### Web: the tab choice is React state, and CSS decides whether it matters

The screen carries the chosen view as an attribute (`data-view="days" | "waiting"`) on
the screen's root. Below 900px the stylesheet shows only the chosen view's parts: the day
band and the days for `days`, and the waiting list for `waiting`. At 900px and up the
stylesheet hides the tab control and shows everything, whatever the attribute says.

That keeps the shape a matter of CSS alone, so the server's first paint and the browser's
first render can't disagree about it. The alternative, reading the width with
`matchMedia` and rendering either the tabs or the column, would render one shape on the
server and possibly the other in the browser.

The state starts at `days` and isn't written to the address, so every arrival opens on
Days. `key={trip.id}` remounts the screen on a trip change, which resets it for free.

Accessibility: the control is a `role="tablist"` with two `role="tab"` buttons, each
controlling its panel through `aria-controls`. At the wide shape the tablist is
`display: none`, so assistive technology does not announce tabs that do nothing there,
and the panels read as ordinary regions.

### Web wide shape: a grid with the waiting column first

`.board` becomes `grid-template-columns: 18.75rem minmax(0, 1fr)` at 900px and up. The
existing `max-width: 90rem` cap moves from the individual blocks to the board, so the
waiting column and the days stay aligned.

Below 900px the board is one column and only the chosen view is drawn.

### Every column scrolls by itself, and the screen never does

At every width the body below the day controls is `overflow: hidden`, and each column
scrolls inside itself: the waiting list, and each day's list beneath its name, which
stays put. Scrolling the row of three together would move the neighbouring days while
somebody reads to the bottom of one, and scrolling the screen on a phone carries the
day's name away from its places. The phone does the same: the body is a plain `View`,
and the day card and the waiting card each hold their own `ScrollView`, sized by
`flex: 1` so their height is definite.

### Thin scrollbars across the web app

`scrollbar-width: thin` and `scrollbar-color: var(--pp-ink-muted) transparent` on `*` in
`globals.css`, so a laptop draws the same slim bar a phone-width browser does instead of
a full gutter in every column. App-wide rather than calendar-only, because a scrollbar
that changes shape between screens reads as a defect. The thumb is `ink-muted` because
`ink-faint` is under the 3:1 a control needs (#124).

### Phone: a segmented control above the day band, and one scroll per view

The tabs are a row of two `Pressable`s with `accessibilityRole="tab"` inside an
`accessibilityRole="tablist"` view, placed between the header and the day band. The day
band renders only when the view is `days`. The body shows the day card or the grouped
waiting list, each scrolling inside itself as described above, so `WAITING_CAP` goes
away. Both cards take `flex: 1` of a `flex: 1` body, a definite height, so the
`ScrollView` collapse described in `AGENTS.md` does not apply.

The view is `useState('days')`, reset by the existing `key={trip.id}` remount.

### The count on the tab uses the accent wash

The count badge beside "No day yet" uses `accentWash` with `accentInk` lettering while
places are waiting, and `surfaceMuted` with `inkMuted` when nothing is. That is the pairing
the mock showed. Text on a filled themed colour takes its lettering from the same rule, per
`AGENTS.md`. `accentInk` on `accentWash` is the pair already used for text on the wash,
not the `accentInk`-on-`accent` pair that disappears in the dark theme.

## Risks / Trade-offs

- [A no-city group title has no city to name] → It reads "Unassigned", the wording the
  city control already uses for places filed under no city (`city-bar.tsx`), so the
  product has one name for them.
- [Hiding a tab panel with CSS keeps it in the DOM] → Hidden with `display: none`, which
  also removes it from the accessibility tree. Nothing inside it holds focus across a
  switch, because switching is done by pressing the tab.
- [Between 700px and 899px the web bar is laptop-shaped but the calendar is narrow] → That
  is already true today (the three days appear at 900px, the bar changes at 700px). The
  tabs follow the calendar's 900px, not the bar's 700px, because they are about the
  calendar's shape.
