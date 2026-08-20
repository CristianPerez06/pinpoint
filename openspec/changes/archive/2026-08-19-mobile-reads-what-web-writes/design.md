# Design

## Context

See `proposal.md` — Why. The shared halves are already in place: `matchesFilter` is a pure
function, the write functions take a client, and `MarkerView` already carries visited. What
is missing is entirely on the phone.

Two facts about the mobile application shape everything below.

**It has no writable state.** `index.tsx` runs `useQuery` and passes the result into
`TripMap` as a prop. `useQuery` returns a `QueryState` and nothing holds what it returned,
so there is no place for an optimistic write to live. The web workspace has held markers
in `useState` since the write path landed, for exactly this reason.

**Its screen is divided differently.** `TripMap` owns the selection, the viewport, the
grouping and the sheet height; `index.tsx` owns the header and the queries. On web those
responsibilities sit the other way round — `TripWorkspace` owns state and `TripMap` is a
renderer that decides nothing.

## Goals / Non-Goals

**Goals:**

- Interest, visited and filtering on the phone, from the same definitions the laptop uses.
- One place on mobile that owns what a write changes, so the next two roadmap items have
  somewhere to put theirs.
- A filter control that costs the map no permanent vertical space.

**Non-Goals:**

- Changing anything in `packages/`. If a shared package needs editing, that is a finding
  about the portability claim rather than a task — see Risks.
- Changing the web application. Parity here is the phone catching up.
- A list, a distance sort, or anything to do with location. Roadmap item 2, and its list
  question must not be pre-empted by a control added here.
- Reworking how the mobile sheet is presented. It is a positioned view rather than a
  draggable sheet with detents, which is a known deviation already recorded as a loose
  end; this change adds rows to it and does not relitigate its form.

## Decisions

### Mobile gains a workspace, mirroring the web one

A component between `index.tsx` and `TripMap` owns the trip's markers, its interest
records and the current filter, seeded from the queries and mutated by writes.

This is where the web application already keeps them, and the reason is the same on both:
a write has to show without re-reading the trip. Putting it in `index.tsx` instead was
rejected — that file is the route, it owns the session, the redirect and the header, and
giving it the trip's mutable data as well would make the one file that must stay legible
the one that changes most.

`TripMap` keeps the selection, the viewport and the sheet height. Those are view state
that nothing outside it reads, and moving them would be a refactor this change does not
need. It stops receiving `markers` and starts receiving the already-filtered set, so it
cannot draw something the filter excluded.

**Alternative considered:** giving `useQuery` a writable variant used by both platforms.
Rejected — the platforms do not share a state layer today, and inventing one to serve two
call sites would put a new abstraction between every screen and its data for the benefit
of this change alone.

### State holds what writes changed, not a copy of the query

**Revised during implementation.** This decision originally said to seed marker and
interest state from the query once and never re-seed, mirroring web. That was wrong, and
the React linter said so before anything was run: copying a query result into state inside
an effect is the pattern React tells you not to write, and it carried the exact hazard it
was introduced to avoid — a later seed replacing an answer somebody had just recorded.

What is held instead is the overrides: a map of marker id to local visited value, and a
map of marker id to the reader's own answer, where `null` means withdrawn. The query
result is read directly and the overrides are laid over it on the way out.

This is better than the web workspace's shape rather than merely equivalent to it:

- There is nothing to re-seed, because nothing is copied. The hazard does not exist rather
  than being avoided by a rule somebody has to keep.
- A refetch is respected for free, which the original decision explicitly deferred.
- Reverting a refused write drops the override, restoring **what is stored** rather than a
  snapshot captured before the write. Web restores a captured copy, which is correct today
  and would resurrect a stale value if anything else had changed in between.

Withdrawn has to be a value the map can hold rather than an absent key: absence means "no
local opinion", and withdrawing is very much an opinion.

**Worth noting for the two changes after this one:** the same shape would suit web, and
the web workspace is where the snapshot-restore still lives. Not changed here — this
change does not touch web — but it is the better pattern and the reason is written down.

### The filter lives behind a control in the header, not in a bar under it

The phone opens the filter from the header and picks it in a sheet, rather than gaining a
second row beneath the header.

A permanent toolbar costs vertical space on every screen for a control used occasionally,
and the map is what the phone is for — standing in a street looking at where things are.
The header already holds the trip name and sign-out, so a control there is a row that
already exists.

**When a filter is applied, the header states it and offers to clear it.** That is not a
nicety: the specification requires a narrowed view to declare that it is narrowed, and a
filter chosen in a sheet and then dismissed would otherwise leave a trip looking emptier
than it is with nothing on screen saying why. This is the phone's version of the web
toolbar's `Showing 7 of 19 · Clear`.

**Alternative considered:** a floating control over the map, like the drop-a-pin button on
web. Rejected — it would sit over the thing it filters, and the map's corners are already
carrying attribution and the system's home indicator.

### Interest rows go on the existing sheet, in its idiom

The marker sheet gains the per-member rows and the visited control, drawn with
`Pressable` and the shared tokens rather than by porting the web components.

This is the `styling` rule rather than a preference: parity travels as data and pure
functions, and a shared control would be shared rendered markup. The states, the labels
and the rule about whose row is interactive all come from `@pinpoint/core`, so what is
duplicated is the drawing and nothing else.

## Risks / Trade-offs

- **The portability claim is being tested, and it might not hold cleanly.** If any of
  `matchesFilter`, `recordInterest`, `withdrawInterest` or `setMarkerVisited` needs
  changing to work under Metro or React Native, that is the finding this change exists to
  produce, and it belongs in the roadmap rather than being quietly absorbed. → Nothing is
  planned for `packages/`; a diff touching one is a signal to stop and write down why.
- **The phone's screen cannot hold what the toolbar holds.** Web shows the filter, its
  state, the count and the clear action at once. The phone shows a control and, when
  narrowed, a statement — the choice itself lives in a sheet. That is less legible and it
  is the cost of the map keeping the screen. → The narrowed statement is what stops it
  becoming invisible, which is why it is a decision above rather than a detail.
- **Optimistic writes can disagree with the database, now on two platforms.** → Same
  exposure, handled the same way: revert and report. Interest is the cheapest thing in the
  product to get wrong — one row, re-assertable by pressing again.
- **A trip whose second member has not claimed their invitation still cannot satisfy a
  filter naming them.** Unchanged by this, and now visible on a second platform. → The
  member list in the filter is the way out, and it arrives on the phone with everything
  else.

## Open Questions

- Whether the phone should remember a filter across launches. Web deliberately does not —
  a filter you forgot you set is a trip that appears to have lost places — and the same
  argument applies more strongly to an application opened for thirty seconds in a street.
  Recorded rather than decided, because nothing here depends on it.
