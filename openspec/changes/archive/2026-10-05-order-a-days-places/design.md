## Context

A day's places are listed by `byNameThenId` in `packages/core/src/marker-day.ts`
(`groupMarkersByDay`). A marker carries its day as `planned_on` and, for a run,
`planned_until`, so one marker can sit on many days — which is why a position cannot be a
column on `markers`: the hotel on the 3rd–6th needs four independent positions.

Every update to a marker bumps `updated_at` (`markers_touch_updated_at`), and that
timestamp is what refuses a save made against a stale read. Anything stored on the marker
row would make every reorder invalidate whoever is editing that place at the same moment.

## Goals / Non-Goals

**Goals:** a stored order per (trip, day), saved as one write per day; every place on a
day has a position without a backfill per place; the map can read the same positions.

**Non-Goals:** times (#283); dragging across days; reordering the places waiting for a
day; resolving concurrent reorders beyond "the later save wins".

## Decisions

### 1. One row per day, holding the day's order as a list of place ids

New table `public.day_orders (trip_id uuid, day date, marker_ids uuid[] not null,
updated_at timestamptz)`, primary key `(trip_id, day)`, `trip_id` referencing `trips` with
`on delete cascade`. Saving a day's order is a single upsert of that row — which is
exactly "one write for the whole day". Reordering never touches `markers`, so it cannot
cause a stale-read refusal on somebody's edit of a place.

Row-level security: select, insert and update for `is_trip_member(trip_id)`; no delete
policy (rows go with the trip). The grant is stated in the same migration
(`pnpm check:tables`).

### 2. The database keeps every day's list complete

An `after insert or update of planned_on, planned_until or delete` trigger on `markers`
works out the days the place left and the days it joined (from the old and new run), then:

- removes its id from the rows of the days it left — this is what closes the gap;
- appends its id to the rows of the days it joined, creating the row when there is none —
  this is what puts a newcomer last.

In the database rather than in the applications for the reason `updated_at` is: it then
holds for every writer, including a save from the place's form that knows nothing about
ordering. The trigger runs as the person saving the marker, who is a member, so the
policies above admit it.

The migration fills a row for every day that already holds places, in name order, so
every day starts complete and keeps the order it was shown in. It sorts with
`collate "und-x-icu"`, the closest Postgres has to the root `localeCompare` the
applications sort with today (then by id, as the applications do).

### 3. Reading tolerates a list that disagrees with the places

`@pinpoint/core` orders a day's places by their index in that day's `marker_ids`, ignoring
ids that are not on the day. A place on the day but missing from the list — the result of
two people saving at once (decision 5) or any writer the trigger didn't see — comes after
the listed ones, by name then id. A day with no row at all therefore reads exactly as it
does today. Positions are 1-based indexes into that derived order, so a gap can never
show.

`groupMarkersByDay` takes the day orders as a second argument, and a new
`positionsOnDay(grouped, day)` returns `Map<markerId, number>` for the map. Both
applications read only these.

### 4. Saving: one second, per day, kept on screen until it settles

Each calendar holds a pending order per day. A change replaces it and restarts a
one-second timer; when the timer fires, the day's full list is upserted. Leaving the day
or unmounting the calendar fires it straight away. While an order is pending or in
flight, it takes precedence over the day order read from the server, so a re-read cannot
put the old order back under the person. On failure, the pending order is dropped (so the
last read order shows again) and the calendar reports `calendar.orderNotSaved` in its
status line. On success, the day orders are re-read like any list after a write.

### 5. Concurrent reorders: the later save wins

There's no stale-read check on `day_orders`. Two people reordering the same day within
the same second is rare, and refusing one of them would show an error for something
neither can do anything about. A place somebody else added meanwhile is not lost: the
trigger appended it, the other person's save omits it, and decision 3 puts it last.

### 6. Web drag: `@dnd-kit/sortable`

Free and MIT-licensed, built for vertical lists, and it already has keyboard sorting
(focus the handle, Space, arrow keys) and live-region announcements — the second route
`PRODUCT.md` requires. Its announcements are given our own sentences from
`@pinpoint/wording`. Only the handle is the drag activator; the row stays the button that
opens the place.

### 7. Phone drag: `react-native-gesture-handler` with the existing Reanimated

Added with `pnpm --filter mobile exec expo install react-native-gesture-handler` so that
the version matches SDK 57; the root needs a `GestureHandlerRootView`. A pan on the handle
alone starts a drag immediately — no long press — so the rest of the row scrolls and opens
as it does now. A day holds a handful of places, so the list is drawn in-house rather than
through a sortable-list library. The second route is `accessibilityActions` on each row:
`moveUp` and `moveDown`, labelled from wording, offered only where the move is possible,
with `AccessibilityInfo.announceForAccessibility` stating the new position.

This adds a native module, so **a new development build is required** — and the stale-build
gotcha in `CLAUDE.md` applies if "Unimplemented component" appears.

### 8. The map: a position on the description, not a decision in each app

`MarkerViewInput` gains an optional `position?: number | null`; `markerView` copies it to
`MarkerView.position`. Each app's `Pin` draws the number in the glyph's place, in the
glyph's colour, when `position` is set — style A from the mock, chosen by the user over a
number on a disc; the light-ground contrast of the two grey types (about 3.6:1) is accepted
and stated in the spec. The map screen passes positions only when the
filter is `{ kind: 'on', days: [oneDay] }`. For a shared drawn point, `groupCoincident`
gets the day's places in day order so that `view` (the first) carries the lowest position.

## Risks / Trade-offs

- **The first order may differ from today's for unusual names**, if ICU in Postgres and
  `localeCompare` in Hermes or V8 disagree on some punctuation or script. It only affects
  the order a day starts with, and can be dragged back. → Accepted; check the seed data
  in the probe (task 1.4).
- **A run of up to 365 days writes up to 365 rows in the trigger.** That's bounded by
  `markers_planned_run_valid`, and only happens when a run is saved. → Accepted.
- **Orphan ids** stay in `marker_ids` if a write bypasses the trigger. → Harmless:
  decision 3 ignores them, and the next save of that day drops them.
- **The new native module** means anyone running an old development build sees the
  calendar fail. → Task to rebuild, and a note in the PR.

## Migration Plan

One migration: table, policies, grant, trigger, backfill. It only adds things, so the
current applications keep working against it (they ignore the table, and the trigger only
writes to the new table). Rolling back means dropping the trigger and the table.
