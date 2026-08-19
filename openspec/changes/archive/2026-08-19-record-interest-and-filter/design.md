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
type InterestFilter =
  | { kind: 'anyone' }
  | { kind: 'wanted-by'; members: string[] }
  | { kind: 'unanswered' }
type VisitedFilter  = 'any' | 'unvisited' | 'visited'
matches(marker, interestForMarker, filter): boolean
```

The filter names the members it asks about, so the trip's membership is not a parameter.
That also retires a rule that used to need stating: records from somebody outside the
selection are ignored, which is what stops a member who has left from still casting a
vote.

Three states rather than a set plus a mode, because they are mutually exclusive and a
shape that can hold two at once is a shape somebody eventually puts two in. "Nobody has
answered" is not a person, so it cannot be one of the people.

**Alternative considered:** computing a per-marker summary (`bothWant: true`) at fetch
time and filtering on that. Rejected — it bakes the member count into stored-looking
data, so a member joining silently invalidates every summary, and it puts a derived
value where a reader would reasonably expect a fact.

### Naming members, rather than choosing from fixed piles

The first two attempts offered fixed choices — Both / Either / Only one of you / Nobody
yet, then a quantifier applied to a selection. Both were rejected on sight, and the second
was the worse mistake: it kept the fixed choices *and* added the names, so the control had
two halves that could be set to contradict each other and the names appeared as a
consequence of choosing something else.

What the filter actually is: **pick the people, get the places they all want.** Two names
is the headline question. One name is that person's list. Nobody named is no filter.

`wanted-by` means *every* named member, not any of them. Both readings are plausible —
assignee filters in other tools usually mean *any* — so the closed control says which,
joining two names with "and". Agreement is the question the product exists to answer, and
returning the union would give a longer list than the trip.

**Consequence worth stating:** naming nobody would be vacuously true of every marker,
which would fill the agreement pile with the whole trip. The control cannot reach that
state — unticking the last person returns it to `anyone` — and the predicate guards it
anyway.

**What was dropped:** "either of you" and "only one of you" are no longer offered. The
first is a longer list than no filter on a two-person trip; the second is a disagreement
view worth having, and it is recorded as an open question rather than kept as a control
nobody asked for. Neither is expressible by ticking names, which is the cost of a list of
people, and it was accepted deliberately.

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

It is a button and a panel rather than a `<select>`, because the list holds checkboxes and
one entry that is not a person. It is styled as the city selector regardless — matching by
eye rather than by element, since it does the same job in the same row. The panel reuses
the city editor's treatment for the same reason.

The label is `Wanted by` because it parses with a name: `Wanted by: Ana`, `Wanted by: You
and Ana`. The first attempt was `Who`, whose unfiltered option had to read `No filter` —
and `Who: no filter` does not parse at all, which is what made it confusing.

The closed control names people rather than counting them, up to three. "Two people"
answers a question nobody asked; the entire reason interest is stored per member is that
*which* of you is the interesting part.

**Alternative considered:** a segmented control of five options. Rejected on width — five
segments plus a visited toggle crowds the toolbar at laptop widths and pushes the search
field into the actions, and the choice is not frequent enough to earn permanent
horizontal space.

**Alternative considered:** a native `<select multiple>`. Rejected as unusable — it renders
as an always-open scrolling box, loses its selection to a stray click, and cannot hold an
entry that is not one of the people.

### Per-member interest is shown as a row per member on the detail card

Each member of the trip gets a row: their name, and their state. The reader's own row is
interactive — want / not / withdraw; other members' rows are read-only, which mirrors the
policy rather than restating it in words.

Undecided renders as its own thing, not as an unfilled version of "not interested",
because the specification makes that distinction load-bearing and the whole "Nobody yet"
pile depends on a person being able to see it.

### The people are named, not described

The roadmap describes this feature in two-traveller vocabulary — "Both", "Only one of
you" — and the first attempt used it as menu labels. Naming the actual people is better
than any of that wording, and it is the wording problem going away rather than being
solved: there is nothing to phrase.

The reader's own row is rendered as `You`, matching the detail card, so the toolbar and
the card use one vocabulary for one concept. `Anyone` is the unfiltered state.

## Risks / Trade-offs

- **A member who has never claimed their invitation can never record interest, so naming
  them can never match.** → The detail card shows every member's state, so an unanswered
  member is visible rather than mysterious. The member list is a second way out: unticking
  them asks the question of the people who can actually answer it, which fixed choices
  could not express. Worth confirming against a trip whose second member has not claimed,
  since that is the state a new trip starts in.
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
- **Whether a disagreement view is worth a control.** "Only one of you wants this" is the
  negotiation pile, and it is the one thing the previous designs could express that this
  one cannot — ticking names asks about agreement, and there is no tick that means "and
  not the other". It was dropped rather than kept, because no control for it fitted the
  list of people without reintroducing the second half that made the last attempt
  confusing. Worth revisiting once the pile has been missed in real use rather than in
  anticipation.
