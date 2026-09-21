## Why

Saving a place is the one thing every other capability depends on, and it can be broken
by a change that the build says is fine.

It already was. Adding a day to a place meant adding that field to the laptop's form and
to the phone's, and only one of them was done. Both applications type-checked, linted and
built. **Every save from the phone was refused**, and what said so was a test somebody
happened to write, not the compiler.

The reason is that the shared code which writes a place accepts *anything* and works out
whether it is valid once the app is running. That is deliberate and is not the problem —
a bad value should still be caught before it reaches the database. The problem is that it
is the **only** check, so a form and the record it writes can drift apart and nothing
notices until somebody taps Save.

The same shape exists in every write the shared code offers — places, cities, trips,
invitations, interest — so the next field added to any of them can fail the same way.

## What Changes

- **Nothing changes for the person using the app.** No screen, no field and no wording
  moves. This is about which mistakes are possible to ship.
- The eight shared functions that write something — a place, a city, a trip, an
  invitation, a mark of interest — stop accepting anything at all and say exactly which
  fields they expect. Leaving one out stops the build and names the field.
- The check that happens while the app is running stays exactly as it is. Nothing about
  what the app accepts or refuses changes; a second, earlier check is added for the code
  in this repository, and the existing one still answers for anything else.
- The two forms for a place stop keeping their own hand-written list of fields. Both take
  the one list from the shared definition, so a field added there appears as missing in
  both applications at once rather than in whichever one somebody remembered.
- One real gap this immediately exposes: on the laptop, a new place is saved with a
  position the code cannot prove exists. It always does today, but nothing says so, and
  the compiler will now insist.

**Not doing:** this does not make the two applications offer the same *controls*. It
guarantees that both send every field, not that both have somewhere to type it — a field
could still be sent as empty from one of them. That obligation already exists in
`marker-capture` and stays a matter of review.

**Not doing:** the shared definition still tolerates four fields being left out entirely
(a day, opening hours, a local price and its currency), and that is left alone. It only
ever applies to a caller outside this repository, and the change above means the two
applications are no longer such callers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `monorepo-structure`: gains a requirement that the shared write functions name the
  fields they accept, so that a field added to a shared record obliges every application
  to supply it and fails the build where one does not. This is the boundary that
  specification exists to protect — one definition serving two platforms rather than two
  that drift — and today nothing there prevents the drift arriving by omission.

## Impact

- `packages/data/` — eight write signatures, no change to what any of them does.
- `packages/core/src/marker.ts` — the shared list of fields a person fills in for a
  place, named once so both forms can take it.
- `apps/web/` and `apps/mobile/` — each form stops declaring its own field list; the
  laptop's save gains the position guard the compiler now requires.
- No dependency, no migration, no configuration.
- Sequence before #156 (a place planned for more than one day), which changes this exact
  field list and is the next chance to make the same mistake.
