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
type InterestQuantifier = 'unfiltered' | 'all' | 'at-least-one' | 'exactly-one' | 'none'
type InterestFilter = { members: string[]; quantifier: InterestQuantifier }
type VisitedFilter  = 'any' | 'unvisited' | 'visited'
matches(marker, interestForMarker, filter): boolean
```

The filter names the members it asks about, so the trip's membership is not a parameter.
That also retires a rule that used to need stating: records from somebody outside the
selection are ignored, which is what stops a member who has left from still casting a
vote.

**Alternative considered:** computing a per-marker summary (`bothWant: true`) at fetch
time and filtering on that. Rejected — it bakes the member count into stored-looking
data, so a member joining silently invalidates every summary, and it puts a derived
value where a reader would reasonably expect a fact.

### Who is asked is separate from how many must agree

The four questions a pair of travellers asks — do we both want this, does either of us,
do we disagree, has neither of us looked — are one quantifier applied to *everybody* on
the trip. Naming them as four fixed choices works for two people and stops working at
three: "do all five of us want this" is a much weaker question than "do these two want
this", and only the second is worth asking on a group trip.

Separating the two parts costs nothing at two members, where selecting everybody is the
default and the menu reads exactly as the pair's four questions. It is what makes the
group case expressible at all.

**Consequence worth stating:** selecting nobody has to select nothing. `all` and `none`
are both vacuously true of an empty set, so either would fill a pile that means agreement,
or one that means silence, with the whole trip. Falling back to unfiltered instead was
rejected: the filter would appear to switch itself off while the control still read as
set, and nothing on screen would explain why.

**Alternative considered:** keeping the four named choices and adding member checkboxes
beside them. Rejected — the two halves can be set to contradict each other ("Both of you"
with one person ticked), and there is no reading of that state which is not a guess.

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
second labelled selector of the same construction — `WANTED BY [Anyone ▾]` — plus a
`Hide visited` toggle beside it.

Reusing the city selector's construction is the point: two selectors that narrow the same
trip should not be two different kinds of control, and the city bar already solved the
label-plus-select shape in this type scale.

The member checkboxes appear only once a quantifier other than `Anyone` is chosen.
Unfiltered is the state a trip opens in and by far the most common one, and a row of
ticked boxes that change nothing is a control that has to be understood before it can be
ignored. Choosing everybody the first time a real question is asked keeps the two-person
case to a single interaction.

The label is `Wanted by` rather than `Who` for a reason that outlives the current design:
it parses with a quantifier *and* with a name, so `Wanted by: All of them` and
`Wanted by: Ana` both read. `Who: no filter` does not parse at all, which is what made the
first attempt confusing.

**Alternative considered:** a segmented control of five options. Rejected on width — five
segments plus a visited toggle crowds the toolbar at laptop widths and pushes the search
field into the actions, and the choice is not frequent enough to earn permanent
horizontal space.

**Alternative considered:** a popover holding the members and the quantifier together.
Rejected for now — it hides the current selection behind a click on the one control whose
whole job is to explain why places are missing, and the toolbar has room at the sizes this
is used at. Worth revisiting when a trip has enough members that the names wrap.

### Per-member interest is shown as a row per member on the detail card

Each member of the trip gets a row: their name, and their state. The reader's own row is
interactive — want / not / withdraw; other members' rows are read-only, which mirrors the
policy rather than restating it in words.

Undecided renders as its own thing, not as an unfilled version of "not interested",
because the specification makes that distinction load-bearing and the whole "Nobody yet"
pile depends on a person being able to see it.

### Labels name no pronouns

The roadmap describes this feature in two-traveller vocabulary — "Both", "Only one of
you" — and the first attempt used it. It was wrong beside a member list: "Both of you"
stops being true the moment somebody unticks themselves, and the words would have to
change with the selection.

So the quantifiers are phrased about the selection rather than about the reader: `All of
them`, `At least one`, `Just one`, `None of them yet`. The names are shown next to them
and say who "them" is. The reader's own name is rendered as `You`, matching the detail
card, so the toolbar and the card use one vocabulary for one concept.

`Anyone` is the unfiltered choice. The pair it must not be confused with is `At least
one` — one narrows the trip and the other does not, and those were the two the first
attempt conflated by calling them "Anyone" and "Either of you".

## Risks / Trade-offs

- **A member who has never claimed their invitation can never record interest, so "All of
  them" can never match.** → The detail card shows every member's state, so an unanswered
  member is visible rather than mysterious. The member list in the filter is a second way
  out: unticking them asks the question about the people who can actually answer it, which
  the fixed choices could not express. Worth confirming against a trip whose second member
  has not claimed, since that is the state a new trip starts in.
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
