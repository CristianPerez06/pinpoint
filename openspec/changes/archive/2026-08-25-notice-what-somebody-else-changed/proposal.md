## Why

A trip is a **shared** map. Two people planning together is the whole product, so
"somebody else changed it" is the ordinary case — and neither application has anything
that causes a list to be read a second time.

**Web reads once per navigation.** `apps/web/app/page.tsx:52` reads the trips on the
server and `Promise.all`s the trip's markers, cities, interest and members beside them.
The only things that re-run it are switching trips, creating one, and a reload.

**Mobile reads once per key change.** `apps/mobile/app/index.tsx:42` is
`useQuery(() => fetchTrips(supabase), [session, createdCount])`, and the workspace's four
queries (`trip-workspace.tsx:215-218`) are keyed on `trip.id` alone. `useQuery` re-runs
when its dependencies change and offers no other way to ask.

So a rename by somebody else, an archive by somebody else, or being added to a trip is
invisible until the application is relaunched.

**What is *not* wrong, and was the original complaint.** A rename made on this device
showing an old name in the picker was fixed by the previous change: both workspaces lay
the trip being viewed over the stored list (web `trip-workspace.tsx:305-308`, mobile
`:210-213`). Every place a trip name renders was re-checked and they all read the live
value. This change is about the other half — changes made somewhere else.

**Mobile keeps its writes in a pile beside the data, and that is an accident.**
`renamed` (`:195`), `invited` (`:352`), `cityWrites` (`:280`), `markerWrites` (`:276`) and
`visitedWrites` (`:238`) exist, with four hand-written merges at `:354`, `:373`, `:397`
and `:434`, for one reason: `useQuery` owns the result and gives the screen no way to
change it, so a write had nowhere else to go. Web has never needed any of it — it holds
each list in state and writes into it (`:167-171`), which is the ordinary shape.

## What Changes

**One place holds each list, and everything on screen reads that place.** A write puts
the row the database returns into it. A re-read replaces it. There is no second layer, no
merge, and nothing to keep in step — which is the shape web already has, and the shape
mobile could not have.

**`useQuery` can be asked to run again, and can be updated.** Two additions to
`apps/mobile/lib/use-query.ts`: a `refetch`, and a way for the screen to set what it
holds. The five override maps and their four merges then delete, because the writes have
somewhere to go. This is a **removal of roughly 150 lines** from mobile, not an addition.

A re-run deliberately does not return to `loading`. The hook already derives staleness
from whether the stored dependencies still match, so an identical re-run keeps the current
answer on screen while the new read is in flight — a map that blanks to a spinner every
time the application is opened would be a worse screen than a slightly old one.

**The trigger is coming back, and nothing else.** Native re-reads when the application
returns to the foreground from the **background** — not from `inactive`, which iOS also
reports for a notification pull, a control-centre pull and a permission dialog, none of
which is somebody coming back. Web re-reads when the tab becomes visible. Both ignore a
trigger arriving within ten seconds of the last re-read, so a flapping tab or a phone
picked up and put down sends one request rather than one per event.

**Web re-reads from the client, into the same state it already holds.** Not
`router.refresh()`: that re-renders the server page and hands down props the existing
`useState` initialisers never read again, so it would refresh one list out of five and
look like it worked. The workspace already builds a Supabase client for its writes
(`:154`), so the same five `fetch*` functions run there and set the five states directly.
The server still does the first read, so the first paint and the row-level security story
are unchanged.

The trips list becomes state on web like the other four, which lets the derived override
at `:305-308` delete — the same simplification mobile gets, for the same reason.

**Opening a sheet re-reads the list it shows.** The trips sheet, the people sheet and
the cities sheet on mobile, and the People and city panels on web. Opening one is a person
saying "show me this", which is the return trigger at a smaller scale, and it lands on the
surfaces where a stale list is actually visible. It needs no gesture and nothing to
discover. Web's trip picker is a native `select` and reports no open moment, so it is
covered by the visibility trigger alone rather than worked around.

**Mobile's header menu gains `Refresh`; web gets no such control.** On web, reloading is
something the browser already offers, and a second refresh inside the page duplicates it.
On native there is no equivalent, so a person whose re-read failed while they were offline
has no way back short of force-quitting. It goes in the menu that already holds People,
Cities and Sign out — deliberately out of a thumb's reach, because it is an escape hatch
rather than an ordinary control, and because a fourth icon in the bottom row was already
rejected on sight once.

**Pull-to-refresh is not built, and the reason is not taste.** `RefreshControl` needs a
`ScrollView` or a `FlatList`, and the map is neither. Wrapping the map in one is not
available either: MapLibre consumes pan gestures, so dragging to pan would fight the pull.
It would work inside the sheets, and is declined there because opening the sheet already
re-reads it — the gesture would be a second way to ask for something that has just
happened.

**Every list, both platforms**: trips, markers, cities, members, interest. Answering this
for the trips list alone would have left four call sites to answer it again, differently.

**Supabase realtime is declined, in writing.** It is in the free tier, so this is not a
$0 decision. It is declined because it is a second mechanism with failure modes this
product has never had — reconnects, messages missed while backgrounded, channels that
must respect row-level security — and shipping it in the same change as the first
invalidation the product has ever had means two new things to debug and no way to tell
which one is wrong. Recorded as a loose end with the condition for revisiting.

**Not changing.** No polling, no interval, no websocket, no query library, no cache, no
global store, no new package, no dependency, no migration, no row-level security change.
`QueryState` is untouched. None of web's twenty-two write sites is touched — they already
do the right thing.

**The accepted trade, stated once.** A re-read that lands while a write is still in
flight briefly replaces what that write showed, and the write puts it back when it
settles. That is what ordinary applications do, the window is a fraction of a second, and
the alternative is the second layer this change exists to remove.

## Capabilities

### New Capabilities

- `data-freshness`: how a screen learns that stored data has changed somewhere else.

  A new capability rather than a scenario added to `trips`, because it is one answer
  covering five lists across two applications, and split five ways it would be restated
  five times and drift. It states four things: where a list is held and who may change
  it, when a re-read happens, that a re-read never blanks what is on screen, and which
  lists are covered.

### Modified Capabilities

None. Every existing requirement about writes still holds word for word: a refused
optimistic write restores what was displayed before, and interest still appears without
re-reading the trip.

## Impact

Two applications. No packages, no dependency, no migration.

- `apps/mobile/lib/use-query.ts` — a read can be asked for again and can be set, without
  returning to `loading`.
- `apps/mobile/lib/use-active-again.ts` (new) — `background` → `active`, with the
  ten-second floor.
- `apps/mobile/app/index.tsx` — `createdCount` retires; the trips query is re-read
  directly.
- `apps/mobile/components/trip-workspace.tsx` — the five override maps and four merges
  delete; writes set the query's data; the four lists re-read on return, and each sheet
  re-reads its own list as it opens.
- `apps/mobile/components/menu-sheet.tsx` — a `Refresh` item beside Sign out.
- `apps/web/lib/use-visible-again.ts` (new) — `visibilitychange`, the same floor.
- `apps/web/app/_components/trip-workspace.tsx` — trips joins the other four as state,
  the derived override deletes, and one function re-reads all five from the client.
