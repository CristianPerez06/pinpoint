# Roadmap

What pinpoint is being built toward, in what order, and why that order. This is
planning context, not a specification — `openspec/specs/` holds the rules in force.

## What this replaces

A spreadsheet with one tab per city. Columns: Name, Description, Neighborhood, a
column per traveller marked with an X, and Price.

Two of those columns are the whole product:

- **Neighborhood** is not a location field. It is a proximity proxy — it exists to
  answer "can we do these three in one afternoon?". **That is the column the map
  replaces.** City stays as an explicit field, because it answers a different and
  coarser question: which day are we spending where.
- **The per-person X columns** are the feature that beats the spreadsheet at
  planning, not just at location. Two people marking interest independently makes
  "show me the places we *both* want to go" a filter instead of a squint.

## Done

- **Monorepo skeleton** — two apps, shared packages, portability boundary enforced
  by the build.
- **Auth and schema** — accounts, members, five tables, row-level security on every
  one. Sequenced first so every policy was written once against a real
  authenticated user, rather than permissively and tightened later.
- **The map renders** — both applications draw a trip's markers from one
  zero-dependency `@pinpoint/map`, read-only. This was the founding bet and it
  holds: `@maplibre/maplibre-react-native` takes the same style **URL** as
  `maplibre-gl`, so there is one style source rather than two, and `fitBounds`
  needed no change for either renderer. Mobile left Expo Go for a development
  build, which is also where the Apple Developer Program cost arrives if iOS ever
  ships to somebody else's phone.

  Three defects only surfaced by opening the apps and looking — markers drifting
  off their coordinates on zoom, taps on a pin doing nothing on iOS, and the tile
  worker 404ing so pins floated over a blank canvas. Each typechecked, rendered,
  and was wrong. Budget for looking, not just for building.

- **The write path** — search, drop, edit and remove, with cities as the grouping.
  **The app can now replace the spreadsheet.** Photon is settled as the geocoder,
  and writing is web-only by decision: the shared write functions are usable from
  either platform, and only the phone declines to offer them.

  Two things turned out differently from the plan. Cities are a name somebody
  chose for a cluster of pins, not a geographical fact — so nothing resolves a
  city's name to a position, and search biases toward the markers already filed
  under it, which say where the group is. That killed the idea below that the
  geocoder answers the "assign a city" question; it can suggest, and the person
  decides.

  Suggesting turned out to be worth a lot more than "can". `#52` — a place filed
  under whichever city happened to be selected, silently and sometimes wrongly —
  was fixed by asking both witnesses: the city name the geocoder reported, and
  failing that, whether the place is within 15 km of some city's nearest marker.
  Neither resolves a name to a position, so the decision above survives intact.
  A selection stopped being an input to filing at the same time: it frames the
  map and biases search, which are statements about what is being looked at, and
  filing is a statement about where a place is.

  And the bias is a focus point, never a bounding box. Photon offers both, and
  only the first ranks rather than excludes — a trip is mostly day trips, and the
  place an hour away has to stay findable.

  Budget for looking held again: three more defects surfaced only by opening the
  apps. One of them was a specification defect first — the camera refused to move
  to a searched place, because the rule had been written for pinning a pointed
  position and applied to both.

- **Interest and filters** — per-member interest, visited, and the filter that
  motivates the whole project. **The app now beats the spreadsheet at planning,
  not just at capture**, which was the point of the whole exercise.

  The vocabulary above did not survive contact. **Both / Either / Only one of you
  / Nobody yet** was written for two travellers, and every attempt to put it on
  screen was rejected on sight — twice. What shipped is a list of the people on
  the trip: tick names, get the places they all want. The four named piles turned
  out to be that question asked about everybody, so nothing was lost by dropping
  the names, and a trip of three can now ask about two of them, which fixed
  choices could never express.

  Two piles did not survive. "Either of you" is a longer list than no filter at
  all on a two-person trip. "Only one of you" — the disagreement pile — is a real
  loss and is recorded below, because no way of offering it fitted a list of
  people without reintroducing the second control that made the rejected attempts
  confusing.

  Budget for looking held a third time, and harder: three defects passed
  `typecheck`, `lint` and `build` untouched — a CSS class resolving to the literal
  string `"undefined"`, a detail card rendering a marker from a stale snapshot,
  and a map crashing to its error boundary because a ref survived a hot reload
  while the code that built it did not. Two were caught by reading, one only by
  clicking. Static checks have now been green over a real defect on three
  consecutive changes.

- **The phone records and filters** — interest, visited and narrowing, on mobile.
  The first change under the parity decision below, and deliberately the smallest,
  because it was the one that tested a claim.

  **The claim held.** Not one file under `packages/` changed. `matchesFilter`, the
  three write functions, `ownMemberOf` and `MarkerView`'s visited all worked
  unchanged under Metro — so the two "web only" requirements were telling the
  truth when they promised that lifting them would be a change to one application
  rather than a reimplementation. The two larger items below can be estimated on
  that basis rather than on hope.

  What was *not* a port: the phone had nowhere for a write to live. `useQuery`
  returned a result and it went straight into the map, which is everything a
  read-only screen needs. It now has a workspace, like web.

  And it holds something better than web's. The plan was to seed state from the
  query once — the React linter rejected that before anything ran, and it was
  right. Holding the overrides instead means nothing is copied, so nothing can
  re-seed; a refetch is respected for free; and reverting a refused write restores
  what is *stored* rather than a snapshot taken beforehand. Web still does the
  snapshot, which is correct today and is the weaker of the two.

  **Both halves of that are now gone**, and the second sentence turned out to be
  the interesting one. `useQuery` owned its result and gave the screen no way to
  change it, which is the whole reason the overrides existed — five piles of local
  writes and four merges, none of them chosen for its own sake. Giving the hook a
  setter deleted all of it, and left one place holding each list on both
  platforms — which is what a re-read needed in order to reach anything.

  Worth carrying forward, because the reasoning was sound and the conclusion was
  still an accident: an awkward shape had a good local justification and nobody
  looked past it at the constraint producing it. The question that dissolved it
  was not "is this shape right" but "why can't the screen just change the data".

- **Edits stop overwriting each other silently** — markers carry a last-changed
  time, maintained by a trigger, and a save based on a stale read is refused and
  said out loud rather than applied.

  The first migration since the initial schema, and the change before this one
  had written that needing one would mean something had been misunderstood. Here
  it was the point: there was no value to compare against, so the application
  could not have detected the overwrite even if it had wanted to.

  Two decisions worth carrying forward. The version goes into the update as a
  filter rather than a check beforehand, so Postgres matches and writes in one
  statement — reading first and comparing in application code leaves exactly the
  window the guarantee is about. And `conflict` is its own outcome rather than a
  rejection with recognisable wording, because matching on a message puts the
  meaning in prose and the first reword breaks the branch in silence.

  The trigger deliberately fires for visited too, so marking a place visited can
  invalidate somebody's concurrent edit of its name. Over-eager, and the right way
  to be wrong: a spurious conflict costs one retry, a missed one destroys work.

  This defect was invisible by construction — a silent overwrite leaves no error,
  no log line and no failing test — so the only way to know the fix works was to
  make two browsers collide on purpose and watch. Budget for looking, again.

- **The phone's controls come within reach** — the filter control and `Clear` move
  off the top strip and into a bar across the bottom of the map; the header keeps
  the dot, the trip name and a menu holding Sign out. No new capability. It is the
  shell capture lands in, and it was sequenced first because capture needed
  somewhere to land rather than because it was urgent on its own.

  The header was nearly full at 375pt and capture needs roughly four hundred points
  of new controls, so the arithmetic said the strip was the wrong answer rather than
  a small one. The stronger argument was reach: every control sat where a thumb
  cannot get one-handed, which is tolerable for a map you only look at and wrong
  for the moment capture is built for.

  An earlier plan deleted the header outright, on the grounds that it spent its
  width on things nobody touches. That is only true while it competes with frequent
  controls. Once those leave, what remains is exactly what should be hard to reach
  by accident — nobody wants Sign out under a thumb. Rare at the top, frequent at
  the bottom, and that split is the durable part.

  Two corrections came from looking rather than from building, and both were about
  somebody else's credit. The controls shipped first as pills floating over the map
  and read as debris; they are a bar. And the bar had to become the *floor* — flush
  to the screen edge, with MapLibre's ornaments and our own credit rising off it —
  because both earlier attempts tried to fit it between things already living at
  that edge, and both ended up on top of an attribution. A bar that stops short of
  the edge is a wide pill with a gap under it, and the gap fills with whatever it
  was clearing.

- **The phone captures** — search, dropping a pin, the whole six-field form,
  editing, removing, and cities. **The phone is a full client**, which is what the
  parity decision below was reversed in order to make true.

  The plan said this was a port. Most of it was, and one part of it could not be.
  `@maplibre/maplibre-react-native`'s `Marker` has no `draggable` and no drag
  events, so the laptop's mechanism — a pin you pick up and put down — has no
  counterpart on this renderer at all. What replaced it is a fixed sight the map
  moves under, and the deciding argument was not ergonomics. The obvious
  alternative, tapping the map to place a pin, needs `onPress` on `Map`, which
  the mobile map deliberately does not have: on iOS the annotation's tap
  recogniser and the map's own can both fire for one tap, and that already cost
  this project a change where tapping a pin did nothing at all. A sight is a
  `View` drawn over the map, so it touches no recogniser. The library decided
  this, not taste.

  That forced the second difference. The laptop does position and fields at the
  same time — a draggable pin beside a live form — and a phone cannot, because
  six fields, an eleven-pin type grid and a keyboard leave no map on screen. So
  the phone does them in sequence, and the correction step is reachable *from*
  the form rather than sitting before it. Search skips it entirely: the
  geocoder's dangerous failure is the confidently wrong result, which the
  distance in the candidate list already catches, and what survives choosing
  correctly is a building's centroid instead of its door — metres, on a map whose
  question is which three things fit in one afternoon.

  **Nothing under `packages/` had to change to make any of it work.** The write
  functions, the validation, the geocoder and the shared framing all ran unchanged
  under Metro, and `@pinpoint/geocode` had never been bundled by Metro before this.
  That is now evidence rather than hope, and the remaining items can be estimated
  on it. One function was *added* there afterwards, which is a different thing —
  see below.

  Budget for looking is still the rule, and it held twice more after the change
  was otherwise finished. The form shipped as a full screen and had to become a
  half-height sheet: covering the map made a geocoded result unconfirmable, since
  the only way to check that the place found is the place meant is to look at
  where it landed. And once it was a sheet, the pin was invisible — the camera
  centres on the middle of the map *view*, and the sheet covers that middle, so
  centring on a place is exactly how to hide it. Neither was findable by reading.

  The static checks earned something too: the React linter rejected refs read
  during render three separate times across this change, each in state handling
  that had been reasoned into place. That is now the second platform where the
  linter has caught what reasoning produced — the first was seeding state from a
  query in the interest change — and all of them were wrong in the same direction.

  One thing under `packages/` did change in the end, after the claim above held
  through the whole port. `offsetCenter` is new shared camera derivation, not a
  port of anything: no platform previously needed to centre on a point while
  something covered part of the map. Responsive web will need it the moment a
  browser window is narrow enough to want the same sheet, and two implementations
  of that arithmetic would be two chances to get a sign backwards.

- **Making a trip, and inviting somebody** — a trip can be created, renamed, and
  shared, and the empty state that used to say "You are not on any trips yet" and
  stop is where a first trip is now made. **The product can be given to somebody
  who is not already in the database**, which was the thing this file kept
  deferring and the only item without which nothing else mattered.

  Most of it turned out to be built already. `claim_trip_memberships()` has
  matched an account to a member row by verified email since the auth change, and
  on *every* sign-in rather than only at sign-up — so being invited long after
  signing up needed no branch. `trip_members` already carried a mandatory email
  and a nullable account. `newTripMemberSchema` already described an invitation
  and had never been called, and `trips_update_member` had permitted renaming
  since the initial schema with no caller. Inviting is one insert; renaming needed
  no migration at all.

  **The schema guessed wrong about its own future, and asking one question
  exposed it.** The initial migration predicted "insert allowed, with a trigger
  adding the creator as the first member". Deciding that the person names
  themselves rules that out: a trigger on `trips` sees the trip's columns and
  `auth.jwt()`, and a name somebody chose is in neither. Deriving one from the
  email's local part is how a member list ends up reading `cristian.ap84`,
  permanently, with no later moment that asks.

  Two client statements fail for the original reason — the membership's insert
  policy checks a membership that does not exist yet — and leave a worse failure
  behind: a trip with no members is unreachable by every select policy and
  unremovable, because there is no delete policy either. So creation is a
  `SECURITY DEFINER` function taking both names, and **`trips` gets no insert
  policy at all**. That is the difference between loosening a rule and declining
  to state one, and it makes "a trip always has at least one member" structural
  instead of remembered.

  It cost a specification change, which is the right way round: `trips` required
  every policy to resolve to membership, and a write that deliberately resolves to
  no policy would have contradicted it in silence.

  The invitation design has one sharp edge and it is now visible rather than
  fixed. Delivery is out of band — nothing is sent, the address is the claim key —
  so a mistyped address produces two screens that both look correct: the inviter
  sees the name they typed, the invited person sees an empty trip list. Neither
  can diagnose it and only the inviter can fix it. `TripMember.userId` had been
  fetched since the interest change and displayed nowhere; showing "not joined
  yet" with the address is the whole feedback loop, and it cost no query.

- **The phone gets a toolbar** — three icon buttons where four text pills were,
  trips opening from the trip's own name, and a trip that can be archived. The
  first change on this surface driven by a complaint rather than by a gap: the
  controls looked *unfinished*, explicitly not cluttered and not badly ordered.

  That diagnosis was worth more than the fix. The pills were built to be quiet at
  rest — right, over a map whose pins are the only saturated colour — and quiet
  had been taken as far as absent, so a control drew nothing until it was already
  being touched. The row was also a shape nobody recognises. It was called a tab
  bar, which is what it looked like and is not what it was: a tab bar switches
  between sections and every one of these fires an action, so drawing them as tab
  items would have made it confidently wrong instead of quietly wrong.

  **An HTML mock did the deciding, and that is the transferable part.** Written
  descriptions of the same design had failed twice. The mock — real tokens, real
  Figtree, real icons, real seeded data — settled three things in one pass that
  argument had not: all three tools weigh the same (an amber `Drop` was rejected
  on sight, because a fourth amber thing at the bottom competes with the pins it
  is meant to serve), the merged filter-and-trips sheet ran past the bottom of the
  screen and had to split, and the trip name beats a fourth icon in a row that
  should stay at three. Its sources are committed beside the proposal. Budget for
  drawing, not only for looking.

  Two things cost nothing because somebody had already thought about them.
  `updateTrip` took a partial patch, so archiving needed no write of its own —
  only the schema widened. And archiving the trip being viewed needed no handling
  at all: `index.tsx` already fell through for "a trip that was left behind —
  removed", and archiving arrives there by a new route.

  Two tests failed the moment the decision widened — `does not write archived,
  even when asked` and `ignores archived`, both holding since the initial schema.
  They are inverted rather than deleted, each saying it was retired on purpose.
  A guard that fires when a decision is reversed is a guard working.

  The static set was green throughout and proved nothing again: the `styling`
  requirements this change leans on were written a day earlier, off four contrast
  defects that CI had been green over for months.

- **Web at a phone width** — the browser takes the phone's arrangement below 700px:
  a two-line header, the map owning the bottom edge, three tools standing on it,
  and sheets rising from it. The wait paid, exactly as this file predicted: there
  was a built shape to port rather than a guess at one, and the two things it was
  told to inherit — the bar is the floor, and the credit rises off whatever stands
  on it — arrived as facts rather than as discoveries.

  It went the other way on one prediction. This file expected the camera to move
  to an imperative call; instead the `{ points, token }` value stayed and the
  correction went into how the camera is *derived*. Framing now picks its zoom
  against the strip of map that is not covered and then shifts the centre into it,
  which is the half the phone still does not do — filed as `#70` and recorded as a
  loose end rather than folded in.

  Almost none of it is a branch. Search turned out not to be two components but one
  field that changes where it lives, so the cascade moves it and there is no
  JavaScript test of viewport width anywhere in the change; the sheets are the
  existing `Menu` with one rule restyled. What JavaScript there is only measures.

  Four defects were found by opening it and none by the static set, which is now
  five changes running. Two are general enough to cost somebody else real time: a
  flex item's `min-width` defaults to `auto`, so text does not truncate until every
  link between it and a width says it may shrink; and a pseudo-element cannot be an
  event target, so a backdrop drawn as `::after` reports its *host* as the target
  and an "outside the anchor" test reads a press on it as inside.

## Next

Two items. The parity work is finished, the product can be given to somebody,
and what remains is one port and one piece of genuinely new design.

**The product can be handed to a person now.** That was true of nothing until
trip creation landed: there was one trip, inserted by a migration, and two member
rows inserted by the same one. Every item below is an improvement to something
somebody can already use, which is a different kind of list than this file has
held before.

**On parity: the phone gets everything the laptop has.** Decided deliberately,
reversing what this file said for the first four changes — that mobile would read
and never write, because planning happens at a laptop and a second capture
surface would cost as much as the first.

That asymmetry was the entire reason this was ever "a fraction of the work of a
second full client". Removing it means it is a second full client, and the
estimate should be read that way rather than inherited.

**Done, and it cost less than the reversal warned.** Nothing under `packages/`
changed across either half. The estimate above was written to be pessimistic and
should be remembered as having been, when the next platform question comes up.

Both settled requirements that said otherwise are gone: `marker-interest`'s went
with mobile interest, `marker-capture`'s with mobile capture. In its place is a
positive rule rather than an absence — see the decision below.

Sequenced rather than proposed as one change. A single proposal covering the whole
parity gap produces a task list nobody can review and a branch that cannot be
tested until the end, which is the opposite of how the last four shipped. Two
changes, and the second was reviewable.

### 1. What's near me right now

The one thing a spreadsheet fundamentally cannot do, and the only genuinely new
design work left: location permission, a denied state that is not a dead end, and
distance — none of which exists anywhere yet.

Brings a **distance-sorted list**, which forces a question deferred twice: web
still has no list at all, though this file has called list and map co-equal since
the beginning. Building it here first makes the phone the better client for
scanning. That may well be right — standing in a street, a sorted list is the
primary view and the map is secondary, the reverse of the laptop — but it should
be chosen rather than arrived at.

## Decisions that shape all of the above

- **Either application is sufficient on its own.** A person may use one and never
  open the other, and nothing this product can do may be reachable from only one
  of them. This is stronger than "the phone gets everything the laptop has", which
  is a statement about a direction of travel and was satisfied the moment the gap
  closed; this is a standing rule about what may be built next, and it is the one
  that decided that city management comes to the phone rather than being left as a
  laptop errand.

  It bounds convenience, not arrangement, and the phone once declined one on
  exactly that reading. The laptop's selected city was called a *convenience* —
  it frames, biases and defaults in one control — and the phone offered every
  capability underneath it by another route: the map framed on open, search
  biased on the visible map, and the form defaulted to the city last used. That
  was allowed. What is not allowed is a place where the answer is "do that on the
  other one".

  **That exception has since been reversed, and how it failed is the part worth
  keeping.** The rule was satisfied and the result was still wrong. The phone had
  a control called `Cities` that looked like the laptop's and did a third of what
  it did, and nobody experiences that as a deliberate omission — it reads as
  broken. Passing this rule is not sufficient: a capability reachable by a route
  nobody finds, next to a control that appears to offer it and does not, is a
  worse outcome than the honest gap this rule was written to forbid. Ask what the
  screen appears to promise, not only what the product can do somewhere.

  Two things fell out of reversing it, both cheap and neither anticipated. The
  laptop turned out to have its own defect in the same surface — a city could
  only be edited while it was selected — and the specifications turned out to
  already require the phone's behaviour without naming a platform, which the
  phone had been satisfying vacuously by offering no selection at all.

  Recorded here because it was decided in conversation while scoping mobile
  capture and existed nowhere in this repository, which is exactly how a rule with
  real consequences gets quietly forgotten.
- **Chrome follows the screen shape, not the platform.** A phone-shaped screen puts
  its controls at the bottom, within a thumb's reach, with the map above them; a
  laptop-shaped one has a single bar. The web application gets both,
  chosen by window width, so a browser held in a hand looks like the phone
  application because it *is* a phone — not because anybody remembered to mirror
  it. This replaces "web is one thing and mobile is another", which had no test
  and drifted; the new rule has an obvious one. It does not weaken the older rule
  that meaning is shared and controls are native: what converges here is the
  arrangement a *shape* calls for, and each platform still builds it with its own
  parts.
- **Wishlist, not itinerary.** The broken dimension is *where*, not *when*. If days
  ever arrive they arrive as a second, independent grouping — a marker can be
  "Kyoto" *and* "day 3" — never as a level underneath City. Trip planners that grew
  day-scheduling did it for strangers, not for a trip.
- **List and map are co-equal.** A map answers "what is near what"; a list answers
  "what do we have". Losing fast scanning and fast entry would make this worse than
  the tool it replaces.
- **Types are a design system, not user data.** Colour is carried by five fixed
  families, icons by a growable type list. That is what lets the list expand without
  the map degrading into confetti.
- **Members are not users.** A member exists before the account does. Everything
  attributed to a person points at the member, so an account arriving later fills in
  one column instead of rewriting every attributed row.

## Settled

- **Pin legibility.** Sixteen drawn points across Kyoto read clearly at city zoom on
  both a laptop and a phone, so no clustering. The density problem was always text,
  not geometry — which is why the `map-rendering` spec forbids permanently labelling
  every marker instead of requiring clustering. Revisit in the high hundreds per
  view, which this product will not reach.
- **Markers on one point.** Identical coordinates are the same pixel at every zoom,
  so the pin underneath is unreachable forever. Badged with a count, and selecting it
  offers the markers there to choose between. Stored positions are never moved.
- **What a price is denominated in.** The currency sits on the **city**, not the trip
  and not the marker: on the city so one trip can cross a border, on the city rather
  than each place so it is said once instead of sixty times. A city with no currency
  shows a bare amount and nothing is assumed — a price in the wrong currency is worse
  than one in none, because it looks correct. Moving a marker between cities never
  converts the stored amount; the number was transcribed off a menu.
- **Who the geocoder is.** Photon, the free public instance, held open until a change
  needed it. If it ever requires paying, search is withdrawn rather than billed —
  survivable only because dropping a pin contacts nothing, which is the real reason
  that path is primary rather than a fallback.

- **Bulk import is not a feature.** It was step one here for a long time, on the
  argument that the app is worth less than the spreadsheet until it holds
  everything. That argument is about a *migration* — one existing sheet, moved
  once — and a migration is not a product capability. Nobody pastes sixty places
  twice; after the move, places arrive one at a time, from a recommendation or a
  video, which is what the write path is for. Getting the first trip in is a
  sitting at a keyboard or a throwaway script, and neither earns permanent
  interface.

  The measurement is worth keeping even though the step is gone. Thirty-five real
  Osaka places through the geocoder: twenty-two resolved, six came back
  confidently wrong — 270 km to 16,187 km away — and seven found nothing. The
  failures were not obscure places but the notes written beside them; "Parque",
  "Templo", "Barrio" and "Tienda" are what matched, and they pulled the search to
  Spanish-speaking countries. Stripping those words and the parenthetical asides
  recovered seven of the thirteen.

  Two things follow. A pasted list would need a review step rather than trusting
  the geocoder, because a wrong match looks exactly like a right one. And the
  reason interactive search now shows how far away each result is, is that this
  is the only fact distinguishing them.

## Not built yet

Missing product capability, as distinct from the debt below. These are small
features rather than roadmap items — nobody is blocked, and none is large enough
to earn a place in `Next` — but they are things the product cannot do, not things
it does untidily.

- [ ] **Self-service password recovery.** Resetting a password is a dashboard
      operation somebody with Supabase access has to perform. Fine at two users who
      know each other; not fine the moment a third person is added by invitation.
- [ ] **The phone has nowhere to remember a preference, and two things now want
      one.** The app opens on whichever trip comes first, and the city being
      worked on is chosen fresh every launch — both held in memory, so both reset
      on a cold launch. The laptop keeps its selected city in the address, where
      a reload and a shared link both survive it; the phone has no equivalent, so
      the two are honestly different rather than accidentally so.
      Neither matters much on its own: picking a city is one tap at the top of a
      session, and this product will have one trip for a long time. What has
      changed is that it is one missing capability rather than two workarounds —
      `expo-secure-store` holds the session token and neither a city id nor a trip
      id is a secret, so closing it means choosing a store. Deliberately not
      absorbed into the change that gave the phone its city picker: choosing where
      a preference lives is a decision of its own, and taking it as a side effect
      is how it would get made badly.
- [ ] **A way to see the places you disagree about.** Ticking names asks for
      agreement, and there is no tick meaning "and not the other" — so "only one of
      you wants this", the negotiation pile, is the one thing the rejected filter
      designs could express and the shipped one cannot. Revisit once it has been
      missed in real use rather than in anticipation. The predicate is a pure
      function in `@pinpoint/core`, so the cost is a control, not a model.

## Loose ends

Debt and known limitations. Nothing here is a missing feature, and nothing here is
a defect — each is something already built that is untidy, or correct only at the
scale the product runs at today.

- [ ] **The two applications frame a covered map differently.** Where a sheet stands
      over part of the map, `map-rendering` now asks for both halves of framing to
      account for it — the zoom chosen for the strip that is visible, and the centre
      then shifted into it. Web does both. The phone shifts the centre and still
      picks its zoom against the whole surface, so a spread-out city keeps its outer
      places behind the sheet while the framing reports success. It is two lines and
      needs nothing new in `@pinpoint/map`; it was left out of the web change rather
      than widening that change's scope. Filed as `#70`.
- [ ] **The laptop bar has not been measured with long names near its breakpoint.**
      A long trip name and a long city name were checked at 1600px while the app shell
      was built: the names truncate at their declared `12ch` and `11ch`, and the filter
      clears the account by 301px. Just above the 700px phone breakpoint they were not.
      The one reading taken there was self-inconsistent — the search field reported 505px
      against its own 480px cap — and was not repeated. It is a measurement that was
      specified and not run, so it is neither a defect nor cleared. Cheap to close: give a
      trip a thirty-plus character name, narrow the window to about 760px, and look at
      whether `Filter` and the account still clear each other.

- [ ] **The phone's narrowed state has not been read in greyscale.** The filter tool
      declares a narrowed trip with the accent *and* a dot, and the dot is what is
      supposed to carry it for a colour-blind reader or a greyscale screen. That it does
      is reasoning, not observation: the check was specified and not run. Cheap to close
      — apply a filter, turn on the macOS or simulator colour filter, and look at whether
      the tool still reads as on.
- [ ] **A control's border does not clear the non-text contrast floor.**
      `lineStrong` on `surface` measures about 1.5:1, under the 3:1 WCAG asks for
      the visual information that identifies a control — so every default button
      and outlined chip is bounded by an edge that is decoration rather than a
      boundary. Found while fixing the text floor and deliberately left out of it,
      because moving `lineStrong` is a palette revision and that change was a
      contrast fix. Not urgent: every affected control also carries a fill and a
      label, so none of them is unidentifiable, which is the difference between
      this and the four defects that were fixed.

- [ ] **The web has nowhere to report a refusal inside an open menu, and below about
      934px the menu covers the place it reports instead.** Every write started from a
      panel in the chrome — rename, invite, and now archive and restore — writes its
      refusal to the note over the map, while the panel that asked stays open on top of
      it. Measured rather than assumed: at a 560px column the trip panel spans x 38–358
      and the note x 171–389, so the only part of `Could not save that trip. Dismiss`
      still visible is the last three letters. The phone does not have this because its
      sheets are modals that draw the refusal themselves; a popover cannot borrow that
      answer. Not new with archiving — rename has done it since it shipped — and not
      fixed there either, because a refusal channel inside the menu touches every panel
      in the chrome and belongs to whichever change is already in all of them. Above
      ~934px, which is every laptop, the two do not overlap.

- [ ] **Nothing appears while you are looking at the screen.** Both applications
      re-read when they become current again — the tab becomes visible, the phone
      comes back to the foreground, a sheet showing a list opens — and that is the
      whole of it. Somebody else's change lands on your screen the next time you
      come back, and not before.

      Supabase realtime is the mechanism that would close it, and it was declined
      deliberately rather than overlooked. It is in the free tier, so this is not a
      $0 decision. It is a second mechanism with failure modes this product has
      never had — reconnects, messages missed while backgrounded, channels that
      have to respect row-level security — and shipping it in the same change as
      the first invalidation the product ever had would have meant two new things
      to debug with no way to tell which one was wrong.

      **The condition for revisiting is written down**: use the return trigger on a
      real shared trip, with two people, and see whether something is still stale
      in a way that matters. Not before that.

- [ ] **The disposable Kyoto seed migration is still applied.** It was kept
      deliberately so there was something to look at; deleting it needs the rows
      gone as well as the file, since removing a migration leaves the remote's
      history untouched. **No longer blocked** — a real trip can be made now, so
      the seeded one is not the only thing there is to look at. Left for its own
      change because it is a migration that deletes rows, which is worth doing on
      its own rather than alongside something else.

## Open design questions

- **Pin legibility.** Twenty-five markers in Kyoto with six stacked on one temple
  complex. Clustering, labels only at high zoom, or something else? This decides
  whether the map is pleasant or a mess, and it is worth settling before building
  rather than after.
- **Where do saved places come from?** If mostly Instagram and YouTube, the link
  field matters more than the description, and "why did we save this" becomes the
  primary question a marker answers.
- **Offline maps.** Protomaps `.pmtiles` to carry a country in one file. Genuinely
  useful underground and on unreliable data, and uncommitted — propose only when a
  change actually needs it.
