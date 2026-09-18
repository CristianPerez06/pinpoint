## Context

**Laptop.** `apps/web/app/calendar/page.tsx` is a server component that reads the trips,
then the trip's places, cities, interest and members, and only then renders
`TripCalendar`. The calendar route has no `loading.tsx`, so while those reads run Next
falls back to the root `app/loading.tsx` — the map's header (`WorkspaceChrome live={null}`)
over "Loading your trip". The page's own `<Suspense>` fallback is a centred
`LoadingState`.

The map already has the machinery this needs: `WorkspaceChrome` takes `live: … | null`
and draws `TripBar waiting` and `AccountMenu waiting` in place of the live controls;
`NamePlaceholder` draws the bar that stands in for a name (`ink-faint`, 11px, sized to the
label's own width so the box does not move); inert buttons use `aria-disabled` and the
`surface-sunk` inert look in `ui.module.css`. The search list's waiting rows
(`place-search.module.css` `.block`) are the precedent for place-shaped rows:
`surface-muted`, the row's own radius, no animation.

**Phone.** `apps/mobile/app/calendar.tsx` returns `LoadingState` while the session is
read and again while the trips are read. `TripCalendar` then starts its own reads for
places, cities, interest and members with `useQuery`, and renders from `query.rows`
straight away — which is an empty list while loading, so every day reads as empty until
the places arrive. The phone has no drawn name placeholder yet.

## Goals / Non-Goals

**Goals:**

- One definition per application that draws both the waiting and the loaded calendar,
  on the pattern of `WorkspaceChrome`.
- The laptop's calendar gets its own waiting screen; the phone's calendar route and its
  places read both show the waiting calendar instead of a loading screen or empty days.
- Nothing moves or resizes when the data lands.

**Non-Goals:**

- The phone's map screen, which still shows `LoadingState` (see `findings.md`).
- A failed read on the calendar. It keeps the behaviour it has.
- When or how the data is read. No read moves, merges or streams.

## Decisions

### Split each app's calendar into a stateful owner and a screen that takes `live | null`

On both applications, `TripCalendar` keeps every piece of state, every read and every
write, and renders a new `CalendarScreen` that owns all the markup. `CalendarScreen`
receives the header's bindings as `live: CalendarBindings | null` and the listed data as
`days: … | null` and `waiting: … | null`, and draws the placeholder wherever a value is
`null`. The waiting screen is `CalendarScreen` with everything `null`.

That is the shape `WorkspaceChrome` already has, and the spec's "one definition" is
satisfied the same way: there is no second tree to keep in agreement. On the laptop the
page reads everything before rendering, so the lists arrive with the trip and one `live`
carries them all. The phone splits the lists into their own `null`s, because there the
trip arrives before its places and the header goes live while the rows are still drawn.

### Laptop: `app/calendar/loading.tsx` renders the waiting screen

A route-level `loading.tsx` beside `page.tsx` replaces the root one for this route, and
it is the only place Next shows during a server component's reads. It renders
`CalendarScreen` with every prop `null`. The `<Suspense>` fallback in `page.tsx` (there
because the client reads `useSearchParams`) renders the same thing, so neither path shows
a different screen.

**The map's `loading.tsx` moves into a `(map)` route group with the map's page.**
Found while checking this in the browser: at the root of `app/` it was the loading
boundary of every route beneath it, and on a full page load Next shows the outermost
boundary. Opening the calendar by its address therefore showed the map's waiting frame
for the whole of the calendar's reads, with the calendar's own screen streamed in hidden
underneath. In the group it belongs to the map alone. No address changes.

The waiting screen does not know which trip it is for — `loading.tsx` receives no search
parameters — so "Back to the map" is drawn inert rather than guessing a link.

### Phone: the route renders the waiting screen, and `TripCalendar` passes `null` until its places are read

`calendar.tsx` renders `CalendarScreen` with everything `null` while the session or the
trips are being read, instead of `LoadingState`. The redirect for no session and the
redirect for no trips stay exactly as they are; only the waiting frame changes.

Inside `TripCalendar`, `days` and `waiting` are `null` until both the places and the
cities have finished their first read, since the places waiting are grouped by city. The
header and the day controls are live as soon as the trip is known, because stepping a
day is an act that can complete without the places. A later re-read never goes back to
`null` — `useQuery` already keeps rows on screen through a re-read (`data-freshness`),
and the check is on the first read only.

### A drawn placeholder on the phone, and the place-shaped row on both

The phone gets `NamePlaceholder` in `components/ui.tsx` with the web's arithmetic: an
11px `inkFaint` bar, vertically centred in the line height of the text it replaces, in a
box as wide as that text's declared width. The place-shaped row on each app is `WaitingRow`,
beside `PlaceRow` and built from its styles: a block the chip's own size (26px) and a
block one line of the name's type tall, so the waiting row and the real row come to the
same height through the same styles.

Row blocks are `surface-muted` on a day's own `surface`. On the laptop's neighbouring
days, which sit on `surface-sunk`, they are `line` — `surface-muted` on `surface-sunk`
is 1.02:1 on the light ground, which is to say invisible. This was checked in the mock
on both grounds.

The block widths vary per row from a fixed list, so the column does not read as a
barcode. The row counts (three per day; two city groups of three and two) are constants
beside the component.

### Inert controls use the inert look already in the chrome

The step buttons, the date field and "Back to the map" take `aria-disabled` and the
existing inert look (`surface-sunk` fill, muted ink, no border), as the map's tools do.
`workspace-chrome` requires an inert control to differ from its live state by more than
colour, and this change reuses that answer rather than inventing a second one. The
approved mock drew these controls in their live look; this is the one visible difference
from it, and it is the map's rule rather than a new decision.

### Assistive technology

The waiting `<main>` carries `aria-busy="true"` and a visually hidden "Loading the
calendar" status. On the phone, the body carries
`accessibilityState={{ busy: true }}` and the same label. Every drawn block is
`aria-hidden` / `importantForAccessibility="no-hide-descendants"`.

## Risks / Trade-offs

- **The split is a large diff in two ~1000-line files.** Mitigated by moving markup
  without changing it: the loaded screen must look identical before and after, which the
  visual checks in the tasks cover.
- **A phone with a warm cache resolves the places in a microtask** (see *A resolved
  promise beats a `setState`*, `AGENTS.md`), so the waiting rows may never paint on a
  second visit. That is correct behaviour — nothing to wait for — but it means the
  waiting state has to be checked on a cold start.
- **`loading.tsx` shows for any slow navigation into `/calendar`**, including changing
  trip from the calendar's own trip menu. That is the intended behaviour: it is arriving
  at a different trip's calendar.
