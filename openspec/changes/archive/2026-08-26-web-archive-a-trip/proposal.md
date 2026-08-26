## Why

The phone can archive a trip, put an archived one back, and reveal archived trips. The
web can do none of the three. Everything underneath already exists and is already
shared: `trips.archived` has been in the schema since the initial migration,
`fetchTrips` takes `includeArchived`, `updateTrip` takes `archived` in its patch, and
`apps/mobile/components/trip-sheet.tsx` has the whole interface. The web has no control
anywhere — its own workspace even documents the behaviour, listing "archiving one" among
the optimistic writes and "revealing archived trips" among the pending reads, while
nothing on screen reaches either.

What that costs a person is plain. Archiving a trip on the phone makes it vanish from
the web with no way to bring it back. Somebody who only uses the web cannot tidy their
trip list at all, and somebody who uses both has to pick up a phone to undo something a
phone did.

**The `trips` spec is missing the requirement that would have caught this.**
`marker-capture` and `marker-interest` each carry a *Both applications offer…*
requirement, written when the phone gained those capabilities and stated as a positive
rule rather than left as an absence — "an application SHALL NOT be the only place a
capability of this specification can be exercised". `trips` has no such requirement, so
*A trip can be archived, and archiving is reversible* says "any member SHALL be able to
archive it" without naming a platform, and the phone alone satisfies its letter. That
absence is why this gap is arguable at all, and it applies to every trip action rather
than only to archiving. Closing it in words is half of this change.

## What Changes

- **`Archive this trip` joins the trip menu**, last, under a rule, in the danger colour
  — the same position the phone gives it. No confirmation step: archiving is reversible
  by any member, and a confirmation on a reversible act teaches people to dismiss the
  ones that are not. The phone already made this call and this does not reopen it.
- **`Archived trips` sits beneath it and opens a page inside the same menu**, listing
  archived trips with a `Restore` beside each and a `Back` at the bottom.
  **Deliberately not the phone's arrangement**: the phone unfolds the list at the bottom
  of one long sheet, which works because that sheet is 85% of a tall screen. The web
  menu is a popover capped at 520px and is a stack of pages already — rename, people and
  new trip are each one. Unfolding in place puts twenty-one rows in the single panel
  that is used most often for switching trips, so the list somebody opened once would
  have to be scrolled past every time afterwards. As its own page the root menu is the
  same length however much is archived.
- **The row answers the press before the answer arrives.** Archived trips are not
  fetched until somebody asks, so the row reads `Looking…` and is inert while the read is
  in flight; the page opens once, with its result, rather than opening empty and filling.
  A count on the row is deliberately **not** shown — a count means reading archived trips
  on every menu open, which is the read this defers.
- **Restoring is per row.** The row that was pressed says `Putting back…`; the others
  stay pressable. One flag for the panel is what `write-feedback` forbids.
- **Archiving the trip being viewed moves off it.** The web resolves the trip on the
  server from the URL, so this is a navigation to `/` and a refresh: the server re-reads
  the trips, archived excluded, and lands on the first remaining one — or renders the
  no-trips state, which is where a first trip is made. No archived trip's markers are
  left on screen, and nothing new has to be built to arrive there.
- **Both writes are optimistic and the reveal is pending**, which the workspace's own
  documentation already states. Archiving drops the trip from the list at once and puts
  it back if the database refuses; restoring moves it out of the archived list and into
  the trips list at once, and reverses both if refused. A refusal is reported over the
  map, where every other refused write on this screen already reports.
- **No way to remove a trip is added, on either platform.** Archiving is the product's
  answer to removal and no table gains a delete policy.

Out of scope: the phone. Its interface is the one being ported and nothing about it
changes here. Whether the phone's reveal should also become a page rather than an
unfold is a question about a tall sheet, not about this gap, and it is not opened.

## Capabilities

### New Capabilities

None. Every capability this exercises is specified; one of them is specified without a
platform rule, which is what the delta below adds.

### Modified Capabilities

- `trips`: gains a requirement — **Both applications offer every action on a trip** —
  stating that an application SHALL NOT be the only place a trip can be created,
  renamed, archived, restored, revealed when archived, or have somebody added to it.
  This is the same positive rule `marker-capture` and `marker-interest` already carry,
  for the one specification that lacks it. The existing *A trip can be archived, and
  archiving is reversible* requirement is unchanged in what it demands; it gains one
  scenario asserting that a trip archived on one application is found and restored from
  the other.

## Impact

**Code** — `apps/web/app/_components/trip-bar.tsx` and its module (two rows, one new
view, and the styles for an archived row); `apps/web/app/_components/trip-workspace.tsx`
(the two writes, the reveal read, the state holding revealed trips, and the navigation
off an archived trip).

**Packages** — none. `fetchTrips({ includeArchived: true })` and
`updateTrip(client, id, { archived })` already exist, are already tested, and are already
what the phone calls.

**Database** — none. No migration, no policy change. `trips_update_member` permits a
member to update the trip, and row-level security in Postgres is per row rather than per
column, so the column this writes was already covered.

**Not affected** — `apps/mobile`, every other package, and every other spec.
`write-feedback` already decides both writes and the read; `workspace-chrome` already
puts rare trip actions behind the trip's name. Neither is amended.
