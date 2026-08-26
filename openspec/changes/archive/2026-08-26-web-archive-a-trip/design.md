## Context

Three capabilities exist on the phone and nowhere on the web: archiving a trip,
restoring an archived one, and revealing archived trips. Nothing under `packages/` is
missing — `fetchTrips({ includeArchived: true })` and `updateTrip(client, id, {
archived })` are built, tested, and are what `apps/mobile/components/trip-workspace.tsx`
already calls. The database is untouched: `trips.archived` has existed since the initial
migration, and `trips_update_member` already permits it, because row-level security in
Postgres is per row rather than per column.

So this is a port, and the interesting part is where the two applications genuinely
differ rather than where they are alike. There are two such places and both can ship a
defect that type-checks:

- **The phone's trips sheet is one long scrolling surface; the web's trip menu is a
  stack of pages.** Rename, People and New trip are each a page inside the popover with
  a `Back` at the bottom. Copying the phone's unfold-in-place reveal into that popover
  is the shape mistake available here.
- **The phone resolves the trip being viewed from its own state; the web resolves it on
  the server from the URL.** Dropping an archived trip from the client's list is
  sufficient on the phone and is *deliberately insufficient* on the web — see the
  decision below. This is the correctness mistake available here.

A throwaway HTML mock settled the first before this document was written, using the real
token values, the real bundled Figtree and the real panel geometry (320px wide, capped
at 520px, scrolling), and showing a worst case of six trips with nine archived and names
at sixty characters.

## Goals / Non-Goals

**Goals:**

- Archive, restore and reveal, reachable from the web, with the states each write and
  read owes the person per `write-feedback`.
- Archiving the trip being viewed lands somewhere real — another trip, or the no-trips
  state — with none of the archived trip's markers left on screen.
- The `trips` specification gains the platform-parity requirement that
  `marker-capture` and `marker-interest` already carry.

**Non-Goals:**

- **The phone changes in no way.** Its interface is the one being ported. Whether its
  reveal should also become a page rather than an unfold is a question about a tall
  sheet and is not opened here.
- **No new package code.** Everything this calls exists.
- **No database change.** No migration, no policy, and specifically no delete policy —
  archiving is the answer to removal.
- **No way to remove a trip**, on either platform.
- **No new refusal channel inside the web menu.** See Risks.

## Decisions

### The archived list is a page inside the menu, not an unfold at the bottom of it

The phone puts the reveal at the bottom of the trips sheet and unfolds the list in
place. That works because the sheet is 85% of a tall screen and is the whole surface
while it is open.

The web menu is a 320px popover capped at 520px, and it is the control used most often
for switching trips. The mock's worst case — six trips, nine archived — put **twenty-one
rows in one panel** when unfolded, so an archive somebody revealed once would sit
underneath the trip list forever afterwards and have to be scrolled past to switch
trips. As a page the root menu is eleven rows at that same worst case, about 450px, and
stays that length however much is archived.

It is also the shape the panel already uses three times. Rename, People and New trip are
each a page with `Back`; a fourth is the pattern rather than an addition to it.

**Alternative considered — unfold in place, matching the phone exactly.** Rejected on
the worst case above. Parity is about capability, not arrangement: the new `trips`
requirement says so in as many words, and `marker-capture` has said the same thing about
capture since the phone got it.

### Two rows, text only, and the archive row last and in the danger colour

`Archive this trip` goes last in the root, under a rule, lettered in `danger` —
the position and the colour the phone gives it. `Archived trips` sits beneath it, muted,
and opens the page.

Rows stay plain text. The phone's sheet rows carry Lucide icons and the web's menu rows
never have; each application keeps the form native to it, which is what the styling rule
already requires. Introducing icons to this one panel would make it the only one in the
web chrome with them.

**No count on the `Archived trips` row.** `Archived trips · 3` would have to read the
archived trips on every menu open, which is exactly the read this defers — the whole
point of a deliberate act is that nothing is fetched until somebody asks.

### Archiving the trip being viewed is a navigation, not a state change

This is the one place the port cannot be a copy.

The phone drops the trip from its list and lets the resolver upstream fall through to
the first remaining trip, or to the no-trips screen. `apps/web/app/page.tsx` resolves
the trip on the server from `?trip=`, and `trip-workspace.tsx` then holds

```
const trip = trips.find((each) => each.id === initialTrip.id) ?? initialTrip
```

with a comment saying that fallback exists precisely so that a trip leaving the list
under a re-read — *somebody else archived it* — does not empty the screen out from under
whoever is looking at it. So dropping the archived trip from `trips` on the web changes
nothing visible: the name, the markers and the cities all keep rendering. The screen
would go on showing an archived trip's records, which is the one thing the requirement
forbids by name.

The fix is `router.replace('/')` followed by `router.refresh()` — the same pair
`selectTrip` already uses. The server re-reads the trips with archived excluded and
either resolves the first remaining one or renders `TripSetup`, and `key={trip.id}`
remounts the workspace so no list survives the move. Nothing new is built to reach
either outcome.

**Only on success.** A refused archive must not navigate: the workspace is keyed by
trip and would remount, taking the refusal message with it, so the person would be moved
somewhere else and told nothing. The write settles first, then the navigation happens or
the list is put back.

### Archiving is optimistic and the row awaits; the reveal is pending; restoring is optimistic per row

All three follow the stated rule rather than a preference, and the workspace's own
documentation already names two of them.

- **Archive** — one column on one row, reversible, and the outcome is drawable, so it is
  optimistic: the trip leaves `trips` at once and goes back exactly as it was if the
  database refuses. The row also *awaits*, reading `Archiving…` and inert until it
  settles, for the same reason `Rename` does: the control that started the write is
  still on screen and is the honest place to say the round trip has not finished. The
  menu closes when it settles, not when it is sent.
- **Reveal** — a read, treated as a write is: the press has to be answered. The row
  reads `Looking…` and is inert until the trips come back, then the page opens with its
  result. It does not open empty and fill, because a page that appears and then changes
  under the reader is a worse answer than a row that says it is working.
- **Restore** — the same write as archive with the flag inverted, so the same answer:
  optimistic, and per row. The optimistic change lands on `trips` — that list is what
  *restored* means — and is taken back exactly if refused. Only the pressed row says
  `Putting back…`; the others stay live, which is `write-feedback`'s rule that pending
  state belongs to the control.

  **The archived row stays until the write settles**, and that took a second pass to get
  right. Removing it on the press is the obvious reading of "optimistic" and is what was
  built first — but the row *is* the control, so removing it destroys the only thing on
  screen that could report anything. `Putting back…` was written, type-checked, and could
  never once have rendered. It was found by throttling the connection and looking for it,
  which is the only way it could have been found. The trip is therefore briefly in both
  lists, and that reads correctly: in the switcher because it is back, still on the
  archived page saying it is on its way.

Each of these is a `usePending` in the control, never a flag in the workspace. There is
no screen-level `busy` on this page and this change does not add one back.

**The archived list is not dropped when a restore settles**, and this is the one place
copying the phone is wrong. The phone nulls it, which it can afford to: its reveal
collapses back to a single row, so null renders as *ask again*. Here the reveal is a page
that stays open, and null renders as *Nothing archived.* — so restoring one of three
would claim there were none while two were still in the database. It was built the
phone's way and caught by opening it. The optimistic removal is already the correct list,
and the next press of `Archived trips` re-reads it, so nothing goes stale anywhere
somebody can see.

### Nothing is amended outside `trips`

`write-feedback` already decides all three states — optimistic versus pending, pending
held in the control, a refusal reported wherever it happened. `workspace-chrome` already
requires rare trip actions to live behind the trip's name and already governs dismissal,
focus return and one-panel-at-a-time; two more rows and a fourth page inside an existing
menu are that requirement being obeyed rather than extended. Neither gets a delta.

The `trips` delta is a new requirement plus one added scenario, and the new requirement
is deliberately about *every* trip action rather than only about archiving. The gap this
change closes was possible because the specification for trips never said an application
may not be the only place a trip capability lives; fixing that for archiving alone would
leave the next one open.

## Risks / Trade-offs

- **A refusal is reported over the map while the menu is still open, and below about
  934px the menu covers it.** → Measured rather than guessed: at a 560px column the panel
  spans x 38–358 and the note x 171–389, so all that survives is the last three letters
  of `Dismiss`. The note is centred in `<main>` and the panel hangs off the header at the
  left, so they collide as soon as the column is narrow enough. This is not new — it is
  what `renameTrip` has done on this exact panel since it shipped, and the phone avoids
  it only because its sheet is a `Modal` covering the map, which a popover is not. Not
  fixed here: a refusal channel inside the web menu is its own piece of work touching
  every panel, and it is recorded as a loose end. Above ~934px, which is every laptop,
  the two do not overlap.

- **The archived page can be opened, the trips re-read behind it, and the two disagree.**
  → `useVisibleAgain` re-reads `trips` when the tab is returned to, and that read
  excludes archived trips, so it cannot contradict the archived list. The archived list
  is its own state, read only when asked for and dropped after a restore.

- **Somebody archives the last trip and lands on `TripSetup`, which has no trip menu and
  therefore no way to reveal the archive.** → Not a dead end, and the specification's
  scenario is about reachability rather than about immediacy: making a trip from that
  screen restores the menu, and the archive is behind it. Worth stating out loud because
  it reads like the trap the requirement was written against and is not one — but it is
  the state to check by opening the app rather than by reasoning, and it is a task.

- **A trip archived by somebody else while this person has it open.** → Already handled
  by the `?? initialTrip` fallback and unchanged by this: they keep seeing it until the
  next navigation, which the existing comment argues is better than emptying the screen.
  This change does not make that worse and does not try to fix it.

- **The mock's worst case is invented.** → There is one trip in the database. Six trips
  with nine archived is a guess at a future, and the decision it settled — a page rather
  than an unfold — is the conservative one either way: at one archived trip both shapes
  look the same, and only the page still works at nine.
