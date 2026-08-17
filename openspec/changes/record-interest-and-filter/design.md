# Design

## Context

See `proposal.md` — Why. The data model is already in place and specified: `markers.visited`
is trip-wide, `marker_interest` is keyed `(marker_id, member_id)` with four row-level
security policies, and `markers`' own specification already states that an absent record
means undecided. What is missing is everything above the table.

Two constraints shape the approach. `@pinpoint/map` declares no third-party runtime
dependencies and cannot import a renderer, so anything shared has to be data and pure
functions. And the web workspace already owns the trip's markers in client state — the
write path put them there so a saved place appears without re-reading the trip — so
interest has to fit that pattern rather than introduce a second one.

## Goals / Non-Goals

**Goals:**

- One definition of what each filter selects, usable from either platform.
- Interest loaded and written without changing the shape of `Marker`.
- Toggling interest feels immediate, consistent with how saving a place already behaves.
- A filter control that reads as part of the toolbar it joins, not bolted beside it.

**Non-Goals:**

- Any mobile interface for recording or filtering. The shared pieces stay importable
  there; only the controls are absent.
- Persisting a filter across reloads. A filter you forgot you set is a trip that appears
  to have lost places.
- Filtering by type, city or price. The city selector already exists and is untouched;
  the rest is not asked for.

## Decisions

### The filter is a pure predicate in `@pinpoint/core`, not in `@pinpoint/map`

`@pinpoint/map` is about drawing: camera, marker geometry, basemap. What "Both" means is
a fact about markers and members, and the list on web needs it just as much as the map
does — a predicate living in the map package would be imported by a list that draws no
map.

The shape is a value plus a function:

```
type InterestFilter = 'any' | 'both' | 'either' | 'only-one' | 'nobody'
type VisitedFilter  = 'any' | 'unvisited' | 'visited'
matches(marker, interestForMarker, members, filter): boolean
```

`members` is a parameter rather than something the predicate reaches for, because "every
member has recorded interest" cannot be evaluated without knowing how many members there
are, and a pure function must be told.

**Alternative considered:** computing a per-marker summary (`bothWant: true`) at fetch
time and filtering on that. Rejected — it bakes the member count into stored-looking
data, so a member joining silently invalidates every summary, and it puts a derived
value where a reader would reasonably expect a fact.

### Interest travels beside markers, not inside them

`fetchTripInterest(supabase, tripId)` returns the trip's interest records; the workspace
holds them keyed by marker id, alongside the markers it already holds.

`Marker` stays exactly as it is. It is the write contract as well as the read shape, it
is validated by a zod schema, and it crosses into `@pinpoint/map` and the mobile app —
none of which need interest. Adding an array of per-member records to it would push the
concept into three places that do not use it, and would make the create and edit schemas
answer a question they should not be asked.

**Alternative considered:** a Postgres view joining markers to their interest. Rejected
for now — it moves shape decisions into a migration, and the proposal is explicit that
this change should not need one.

### Withdrawing interest deletes the row

Recording writes `interested` true or false; withdrawing deletes the row. The model
already defines absence as undecided, so storing a third value would give one state two
representations and guarantee that some code eventually checks the wrong one.

### Interest is written optimistically, like everything else in the workspace

The workspace updates its local state and issues the write, matching how saving, editing
and removing a place already behave. A toggle that waited for a round trip would feel
worse than the spreadsheet it replaces.

On failure the local change is reverted and the failure is reported, which is the pattern
the write path already established.

### The control joins the toolbar as a second selector

The toolbar today is `CITY [All places ▾]` · search · spacer · `+ Drop a pin`, and the
visual language change left the spacer as the reserved slot. The filter goes in as a
second labelled selector of the same construction — `WHO [Anyone ▾]` — plus a `Hide
visited` toggle beside it.

Reusing the city selector's construction is the point: two selectors that narrow the same
trip should not be two different kinds of control, and the city bar already solved the
label-plus-select shape in this type scale.

**Alternative considered:** a segmented control of five options. Rejected on width — five
segments plus a visited toggle crowds the toolbar at laptop widths and pushes the search
field into the actions, and the choice is not frequent enough to earn permanent
horizontal space.

### Per-member interest is shown as a row per member on the detail card

Each member of the trip gets a row: their name, and their state. The reader's own row is
interactive — want / not / withdraw; other members' rows are read-only, which mirrors the
policy rather than restating it in words.

Undecided renders as its own thing, not as an unfilled version of "not interested",
because the specification makes that distinction load-bearing and the whole "Nobody yet"
pile depends on a person being able to see it.

### Labels use the roadmap's two-traveller vocabulary

"Both" and "Only one of you" are written for two people, while the predicate is defined
over any number of members. This is deliberate: the product is a two-traveller product
and the vocabulary is what the roadmap uses to describe the feature.

The semantics stay general so a third member does not produce wrong *results* — only
labels that read oddly. That is the signal to revisit the wording, and it is cheap
because the meaning does not move.

## Risks / Trade-offs

- **A member who has never claimed their invitation can never record interest, so "Both"
  can never match.** → The detail card shows every member's state, so an unanswered
  member is visible rather than mysterious. Worth confirming against a trip whose second
  member has not claimed, since that is the state a new trip starts in.
- **Interest is a second query on a path that already makes three.** → It is independent
  of markers and cities, so it joins the existing `Promise.all` rather than extending the
  chain. If it ever matters, the fix is a view, not a client-side join.
- **Optimistic writes can disagree with the database.** → Same exposure the write path
  already carries, handled the same way: revert and report. Interest is also the cheapest
  possible thing to get wrong — one row, re-assertable by clicking again.
- **Filtering could be mistaken for a permission boundary.** → The specification states
  it is not, and reads stay unfiltered in application code so a policy defect surfaces as
  a visible extra marker instead of being quietly hidden.

## Open Questions

- Whether "Hide visited" should default to on once a trip is underway. It changes no
  specification and no task — the filter defaults to unfiltered either way — and the
  answer wants a trip with visited places on it, which does not exist yet.
