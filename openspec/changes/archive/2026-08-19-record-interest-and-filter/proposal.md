# Record interest, and filter by it

## Why

The spreadsheet this replaces has a column per traveller, marked with an X. That column
— not the location — is the part that beats the spreadsheet at *planning*: two people
marking interest independently turns "show me the places we both want to go" into a
filter instead of a squint down two columns.

The database has carried it since the first migration. `marker_interest` exists, it is
keyed per member, its four row-level security policies are written, and the `markers`
specification already states that an absent record means *undecided* rather than *not
interested*. None of it is reachable from the product: there is no way to say you want
to go somewhere, and nothing reads the table.

Now, because this was deliberately sequenced late. Interest is worthless until there is
something to be interested in, and the write path — which landed two changes ago — is
what puts places on the map. That precondition is met, and this is the highest-value
change remaining.

## What Changes

- **Recording interest.** A member marks a marker as wanted or not wanted, and can
  return to undecided by withdrawing the record. One member's answer never overwrites
  another's.
- **Recording visited.** A marker is marked visited for the whole trip, not per person,
  because travelling companions visit a place together.
- **Filtering by who wants to go.** The filter the project exists for: pick the people,
  get the places they all want. Two names is the headline question — the places you both
  want to go — and one name is that person's list. Naming people rather than offering
  fixed two-person choices is what lets a trip of three ask about two of them, which is
  the question worth asking once a trip is bigger than a pair.
- **Filtering to what nobody has answered.** The triage pile, kept separate because it is
  not a person: the set that is invisible in a spreadsheet and obvious here.
- **Filtering by visited**, so places already seen can be set aside without deleting
  them.
- **The filter narrows the map and the list together.** They are two views of one set,
  and a filter that applied to only one of them would make them disagree about what the
  trip contains.
- **A filter that matches nothing says so** — and says something different from a trip
  with no markers in it.
- **Designing the control.** The visual language change reserved a slot in the web
  toolbar for this and explicitly deferred designing what goes in it. That design is in
  scope here.

**Web only**, matching how capture is scoped. Planning happens at a laptop. The mobile
reader — filters and marking visited on the phone, where "visited" is actually decided —
is the next roadmap item and deliberately not this one.

**No schema change.** The tables, constraints and policies already exist. If this change
finds itself writing a migration, something has been misunderstood and it is worth
stopping to find out what.

## Capabilities

### New Capabilities

- `marker-interest`: how a member records that they want to go somewhere, how they
  withdraw that, how undecided stays distinct from declining, and how a marker is
  marked visited for the trip.
- `marker-filtering`: narrowing which of a trip's markers are shown, by the combination
  of members interested and by visited state, applied to every view of the trip at once.

### Modified Capabilities

- `map-rendering`: today the map distinguishes loading, failed and genuinely-empty. A
  filter that matches nothing is a fourth state and currently indistinguishable from the
  third — "no places match this filter" and "this trip has no places" call for different
  words and different recovery. The camera's behaviour when the filter changes also
  needs stating, since re-framing on every toggle would fight someone who has panned
  somewhere deliberately.

## Impact

- `packages/core` — interest as a domain type, and the filter as a named predicate over
  a marker plus its interest records, so both platforms can agree on what "Both" means
  without either owning the definition.
- `packages/data` — reading a trip's interest records alongside its markers, and writing
  one member's record. Reads must not be filtered in the client: the policies already
  decide what a member may see, and re-filtering in application code would hide a policy
  defect rather than expose it.
- `apps/web` — the control in the reserved toolbar slot, an interest control on the
  marker detail card, and the filtered set feeding both the map and the list.
- `apps/mobile` — drawing only. It gains no way to record or filter, but a visited marker
  has to be muted there too: `map-rendering` requires both applications to draw the same
  map from the same data, so a rule about how a marker looks cannot be adopted by one of
  them alone.
- `@pinpoint/map` — the drawn description gains whether a marker is visited and how much
  to mute it, carried there for the same reason the box and the anchor already are: the
  last defect from letting each application decide was markers drifting off their
  coordinates.
- No migration. No new dependency.
