# Design

## Context

The diagnosis came from the person who uses the application, in one word: the phone's
controls look **unfinished**. Explicitly not cluttered, not badly ordered, not out of
reach. That narrows the work considerably — this is not a rearrangement and not a
density problem, and nothing here moves a control for the sake of moving it.

A mock was built at real phone width in both themes, with the real tokens, the real
typeface, the real icons and the real seeded data, and was reviewed before this file was
written. Three of the decisions below were settled by looking at it.

## Decisions

### A toolbar, not a tab bar

The row was described as a tab bar that "does not look like any tab bar I have ever
seen", and that is the right observation with the wrong diagnosis. A tab bar switches
between *sections* of an application; every item in this row fires an *action*. Apple's
guidance is explicit that tab bars carry sections and never actions, so drawing these
as tab items would have made the row confidently wrong instead of quietly wrong.

A bottom toolbar is the pattern that fits, delivers exactly what was asked for — big,
obvious, icon-led targets — and does not promise navigation that does not exist.

### Three, not four

`Clear` leaves the row. Four targets across a phone leaves each one narrow, and `Clear`
is the least earned of the four: it does nothing at all most of the time, and it is the
only one that is *about* another control rather than about the map.

Sliders rather than a funnel for `Filter`. A funnel means *narrow a list*; sliders means
*options you can change*. The sheet it opens does the second.

### All three weigh the same

The mock first drew `Drop` in the accent, on the argument that dropping a pin is what
somebody opened the application to do while standing in a street. That was rejected on
sight, and the rejection is worth recording rather than the argument: the row sits over
a map whose pins are the only saturated colour in the entire system, and a fourth amber
thing at the bottom competes with the thing it is meant to be serving.

The cost is real and accepted: nothing in the row says which control is the important
one. It is bought back by the row having only three things in it.

### The declaration stays; the way out moves

This is the one settled rule this change amends, so the reasoning matters.

`Clear` was doing two jobs: saying *you are not seeing everything*, and *undoing it*.
The first has to be permanent — somebody who cannot tell they are narrowed does not know
to go looking. The second does not: somebody who can tell will look, and looking is one
tap.

So the Filter button takes the declaration, by two signals rather than one. It goes to
the accent **and** grows a dot above the icon, because the requirement forbids a signal
that survives only in hue, and because that rule is the same one that keeps a visited
marker from being recoloured.

The amended requirement is deliberately narrow. The declaration and the way out may
separate, but only where the control that declares is the control that reveals. Two
different controls would be worse than today: a person could see that places are missing
and have to hunt for where to undo it.

### Trips hang off the trip name

The alternatives were a fourth icon in the row, or a row inside the filter sheet.

A fourth icon spends a permanent slot in thumb reach on something rare — and with one
trip, mostly on something that does nothing. A row inside the filter sheet was tried in
the mock and produced the sheet that had to be split: filters plus trip management ran
past the bottom of a 390×844 screen, so *New trip*, *People* and *Cities* sat below the
fold on the sheet you open constantly.

The header already names the trip. Tapping the thing you are changing is the shortest
line between the two, it costs no new element on screen, and it keeps the row at three.

### People and Cities go with the trip, not the filter

Both belong to a trip rather than to the person, so they belong wherever the trip is
managed. There is a second reason: the filter sheet already lists people to tick, and a
`People ›` row underneath that list would read as a second, different people control in
one sheet.

Moving them also leaves the filter sheet holding only what narrows the map — which makes
the button's label `Filter` an honest promise. The naming problem that the first mock
raised was solved by this move rather than by renaming anything.

**Note that `People` is not a filter.** The filter ticks members who already exist; the
People sheet is two fields and an invite. Removing it would make inviting laptop-only
and break the standing rule that either application is sufficient on its own.

### Archiving, and why it must be reversible

`trips.archived` has existed since the initial migration, no table has a delete policy,
and `packages/core/src/trip.ts` says archiving "is the answer to 'delete a trip' and is
its own change". This is that change. Nothing in the database moves.

The design question archiving actually raises is not how to hide a trip but how to get
it back. A one-way archive recreates precisely the failure the initial schema was written
to prevent — a trip that exists, that no select path reaches, and that no policy can
remove — reached deliberately instead of by accident. So archived trips stay reachable
behind an explicit act, and restoring is a member's right rather than a support request.

Archiving the trip being viewed is not a special case in the specification: `trips`
already has a scenario for the trip you were viewing no longer being among the ones you
belong to, and archiving arrives at that state by a new route.

### The hamburger holds an account and nothing else

Everything in it was there because it had nowhere else to go. With trips on the trip name
and People and Cities with the trip, what is left is the account and the way out — which
is what a menu in the top corner should have been all along. `Sign out` stays deliberately
far from a thumb.

There is no first and last name to show. A member has one `displayName`, up to sixty
characters, that they chose or that whoever invited them typed.

## Risks

- **The dot is the only thing standing between a narrowed map and a confusing one.** It
  is small. If it turns out to be missable in real use, the fallbacks are a count on the
  button or a pill over the map, both of which were considered and set aside as noisier
  than the problem.
- **`Drop` loses its emphasis.** Accepted deliberately; see above. Worth watching whether
  the drop flow gets used less on the phone.
- **Archiving widens what a single member can do to shared work.** It is reversible by
  every member, which is the mitigation, but it is still an action one person takes on
  behalf of everyone. No confirmation step is specified; if one proves necessary it is a
  small addition.
- **The icons are a first pass.** `search` and `map-pin-plus` are unambiguous;
  `sliders-horizontal` for filter is a convention rather than a picture of the thing, and
  is the one most likely to want changing after real use.
