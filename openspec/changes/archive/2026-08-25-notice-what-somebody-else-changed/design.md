## Context

Neither application causes a list to be read a second time. Web reads on the server per
navigation (`apps/web/app/page.tsx:52`); mobile's five queries re-run only when their
dependencies change (`app/index.tsx:42`, `components/trip-workspace.tsx:215-218`).

The two applications also hold their data differently, and only one of the two shapes is
deliberate.

- **Web holds each list in state and writes into it** (`trip-workspace.tsx:167-171`).
  Ordinary, and it is what makes a rename show everywhere at once.
- **Mobile holds the query result *and* a separate pile of local writes**, merged at
  render time in four places (`:354`, `:373`, `:397`, `:434`). This was not chosen for its
  own sake: `useQuery` owns its result and offers no way to change it, so a write had
  nowhere else to go.

An earlier draft of this design generalised mobile's shape onto web and added stamps to
decide when a local write should stop being laid over the read. That was solving a problem
created by the second layer. Removing the layer removes the problem, and the code gets
smaller on both platforms.

## Goals / Non-Goals

**Goals:**

- One place per list. Writes put the stored row into it; a re-read replaces it.
- `useQuery` can be asked to run again and can be updated, so mobile's second layer can go.
- One stated trigger per platform — coming back — and no other.
- All five lists, both platforms: trips, markers, cities, members, interest.

**Non-Goals:**

- Live updates: no websocket, no Supabase realtime, no server-sent events.
- Polling, intervals, or any re-read on a timer.
- A query library, a cache, a normalised store, or global request state.
- Any change to `QueryState`, to the write functions, to the schema, or to row-level
  security.
- Batching mobile's five reads into one round trip.

## Decisions

### The list lives in one place, and a re-read replaces it

No override map, no merge, no stamps. A write sets the row it got back; a re-read sets the
whole list.

*What this costs, stated once.* A re-read landing while a write is still in flight briefly
replaces what that write showed optimistically, and the write puts it back when it settles.
The window is a fraction of a second, it needs a re-read and an unsettled write at the same
instant, and it self-corrects. The alternative is a second layer plus a rule for when its
entries expire — which is more machinery than the defect is worth, and machinery that has
to be understood by everybody who touches a write afterwards.

*Alternative considered.* Keeping mobile's override shape and generalising it. It survives
that race, and it costs: a merge per list, a rule for retiring an entry that is wrong in
two plausible ways, and a shared package to hold both. Rejected as more than the problem.

### `useQuery` gains a `refetch` and a way to be set

Two additions to `apps/mobile/lib/use-query.ts`, both small.

`refetch` re-runs the same query and, critically, does **not** return to `loading`: the
hook already derives staleness from whether the stored dependencies still match the
current ones (`:60-64`), so an identical re-run keeps the current answer on screen for
free. A failed re-run is discarded rather than replacing a good result.

The setter is what lets the five override maps and four merges delete. It is not seeding
state from a query — the hook keeps owning its data and the screen asks it to change,
which is the distinction the React linter cares about and the reason the overrides existed
in the first place.

### Web re-reads from the client rather than through `router.refresh()`

`router.refresh()` re-renders the server page and hands down props that the existing
`useState` initialisers never read again, and the component is keyed by `trip.id` so it
does not remount. It would refresh the trips prop and nothing else — one list in five,
looking like it worked.

The workspace already builds a Supabase client for its writes (`:154`). The same five
`fetch*` functions run there and set the five states directly, which is the same code path
mobile takes and the same one place holding each list. The server still does the first
read, so first paint and the row-level security story are unchanged.

The trips list becomes state alongside the other four, and the derived override at
`:305-308` deletes with it.

*Alternative considered.* Making the props authoritative and syncing them into state on
every server render. That is copying props into state, which is the pattern the linter has
rejected twice in this repository, and it would have to be right about which of the five
lists a given render actually re-read.

### The trigger is coming back, and nothing else

Web listens for `visibilitychange` and re-reads when the document becomes visible. Native
listens to `AppState` and re-reads on `background` → `active`.

**From `background` specifically, not from `inactive`.** iOS reports `inactive` for a
notification-centre pull, a control-centre pull, the app switcher and a permission dialog.
Treating those as a return would re-read several times during one uninterrupted session.

*Alternatives considered.* An interval: cheap to write, and it spends requests exactly when
nobody is looking. `useFocusEffect` on mobile: there are two routes, `index` and `login`,
and moving between them changes the session, which already re-runs the trips query — so it
would fire only where something else already fires. If a third route arrives, reconsider
here.

### Opening a sheet is the same signal, smaller

A surface whose purpose is to show a list re-reads that list as it opens, under the same
floor and the same no-blanking rule. It is the return trigger at the scale of one list, it
lands on exactly the surfaces where staleness is visible — the trips sheet, the people
sheet, the cities sheet — and it costs nothing to learn.

Web's trip picker is a native `select`, which reports no open moment. That is stated as
covered by the visibility trigger rather than worked around with a pointer-down listener on
a control the platform owns.

### One manual control, on native only

Mobile's header menu — the one already holding People, Cities and Sign out — gains
`Refresh`. It exists for one case: a re-read that failed while the device was offline,
after which the only recovery today is force-quitting the application.

Deliberately among the rare controls rather than the frequent ones. The bottom row already
rejected a fourth icon on sight during the toolbar change, and the reason given then holds
here: what stays at the top is what should be hard to reach by accident.

Web gets nothing. Reloading is a control the browser already provides, sitting a few
pixels above wherever a second one would go.

*Alternative considered.* Pull-to-refresh. `RefreshControl` needs a `ScrollView` or a
`FlatList` and the map is neither; wrapping the map in one is not available because
MapLibre consumes pan gestures, so the pull and the pan would fight. It would work in the
sheets, where `ScrollView`s already exist for cities, people and marker details — and the
trips sheet has none, so it would need one, which is the container trap `AGENTS.md`
records. Declined there anyway, because opening the sheet already re-reads it.

### A ten-second floor, held by the list rather than by the trigger

A list is not read again within ten seconds of its last read, whoever asked.

The first draft put the floor beside each listener, which is wrong once there is more than
one trigger: returning to the application reads all five lists, and opening the trips sheet
two seconds later reads trips again, because the two hooks share no timer. The floor is a
fact about the list — how recently it was read — not about the thing that asked.

Ten seconds because the events being defended against are flapping: a tab switched to and
away, a phone unlocked and immediately locked, a sheet opened straight after a return. All
of those are well inside it, and somebody who leaves to read a message and comes back to
keep planning is well outside it.

The manual `Refresh` ignores the floor. Somebody pressed something, and a control that
declines because a read happened eight seconds ago looks broken.

*Not a cache, deliberately.* Nothing stores an answer to serve in place of a read. The
floor declines to read; what stays on screen is what was already there. A cache's job is to
answer with something older than the truth, which is precisely the defect this change is
about — and there is no cost argument for one either, since the free tier does not bill per
request. What is worth having from a cache is "do not ask again yet", and that is the whole
of this decision.

*Alternative considered.* Debouncing: it delays the first re-read, the one that matters, in
order to be tidy about the ones that do not.

### Supabase realtime is declined, with the condition for revisiting written down

It is in the free tier, so this is not a $0 decision. It is declined because it is a second
mechanism with failure modes this product has never had — reconnects, messages missed while
backgrounded, channels that must respect row-level security — and shipping it in the same
change as the first invalidation the product has ever had means two new things to debug and
no way to tell which is wrong.

Revisit when the trigger above has been used on a real shared trip and something is still
stale in a way that matters. Recorded in `ROADMAP.md` under loose ends with that condition.

## Risks / Trade-offs

- **A re-read can briefly undo an unsettled optimistic write.** → Accepted, stated in the
  proposal, self-correcting. Removing the layer that prevented it is the point.
- **Mobile loses the shape `ROADMAP.md` called the better of the two.** → It was better
  than web's *snapshot-and-restore*, and that comparison is what the roadmap note is about.
  Neither application snapshots after this: both hold one list and replace it. The note gets
  corrected rather than left to read as a regression.
- **Five requests per return on mobile, one round of five on web.** → What a full re-read of
  a trip already costs. It happens on returning rather than in a loop, and the floor bounds
  it.
- **Nothing here makes a change visible while somebody is looking at the screen.** → True,
  stated, and the reason realtime is declined *for now* rather than rejected. The
  specification says "come back", not anything faster.
- **This is not observable with one session.** → Every validation task names two accounts
  and two devices. The last three changes each shipped defects that passed every static
  check; a defect in this one is invisible even to somebody clicking, unless there are two
  of them.
