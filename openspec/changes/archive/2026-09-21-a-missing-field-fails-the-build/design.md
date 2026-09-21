## Context

See proposal.md — Why. The shape in the code today:

- `packages/core` defines each record once, as a zod schema, and exports the type it
  infers (`NewMarker`, `MarkerPatch`, `NewCity`, `NewTrip`, and so on).
- `packages/data` holds eight write functions. Every one takes `input: unknown` or
  `patch: unknown`, calls `validate(schema, input)`, and returns a `WriteOutcome`.
- `apps/web` and `apps/mobile` each declare their own `MarkerFormValues` interface — ten
  fields, written out by hand, twice.

Four fields of `newMarkerSchema` carry `.default(null)`: `plannedOn`, `hours`,
`localPrice`, `localCurrency`. A schema with a default has two types — what a caller may
pass in, and what comes out after the default is applied. That distinction is the whole
design decision below.

## Goals / Non-Goals

**Goals:**

- A missing field fails `pnpm typecheck` / `typecheck:mobile` and names the field.
- Nothing about what either application accepts or refuses at runtime changes.
- The change is mechanical enough to read in one sitting.

**Non-Goals:**

- Changing any schema. No `.default()` is added or removed, no field becomes required or
  optional, no validation message changes.
- Restructuring the web workspace's panel state. The position guard is a guard.
- Typing the Supabase client, the query helpers, or anything that reads.

## Decisions

### Type each write against the schema's *output* type, not its input type

`createMarker(client, input: NewMarker)`, where `NewMarker` is `z.infer<typeof
newMarkerSchema>` — the type after defaults are applied, in which all thirteen fields are
required.

The input type (`z.input<…>`) is the one that looks correct and is wrong here: it marks
the four defaulted fields optional, which means a form that stopped supplying `plannedOn`
would still compile. That is precisely the failure this change exists to prevent. The
output type is the one that says "a caller in this repository supplies everything".

This needs no change to any schema, which is why it is the whole of the decision. The
defaults stay; they simply stop being reachable from the two applications, which is
correct — they were written for a caller that predates a field, and neither application
can be one. Both compile the schema into themselves from this same tree.

### Patches keep every field optional, and that is the point

`updateMarker`, `updateCity` and `updateTrip` apply only what they are given, so
`patch: MarkerPatch` (already all-partial) is the right type. It catches a misspelled key
and a wrong value type; it does not catch an omission, because an omission there is an
instruction to leave a field alone. The spec delta says this explicitly so nobody later
"fixes" it.

### The field list a person fills in is named once, in `@pinpoint/core`

```ts
export type MarkerFormValues = Omit<NewMarker, 'tripId' | 'lng' | 'lat'>
```

The trip and the position come from the workspace, not from the form; everything else is
typed by a person. Both forms import it and delete their own copy, and the six files that
import the type from the form module import it from core instead.

It lives in core rather than in a package of its own because core already holds the
neighbours of this idea — `CityNotice`, `FieldErrors`, the price draft, the empty-field
wording. None of them touch a renderer, and neither does a list of field names.

### The web workspace guards the draft position instead of moving it onto the panel

`createMarker(supabase, { …values, tripId, lng: draft?.lng, lat: draft?.lat })` stops
compiling: `draft` is `DraftPosition | null`, so `draft?.lng` is `number | undefined`.
The invariant holds today — `beginCreate` always sets the draft — but nothing states it.

An early `if (!draft) return` in `save`, before the create branch, is the fix. Moving the
position onto the `create` panel variant (the way mobile does) would state the invariant
in the type, but web keeps `draft` as separate state because the draft pin is draggable
and repositioning has to survive the form being open. Two sources for one position is how
they would drift.

### All eight writes, not just the two for a place

`createMarker`, `updateMarker`, `createCity`, `updateCity`, `createTrip`, `updateTrip`,
`inviteMember`, `recordInterest`. The edit is identical in each and every existing call
site already passes every field, so seven of the eight change nothing but the signature.
Leaving the others as `unknown` would make the rule an exception, and the next field
added to a trip or a city fails exactly the way a field added to a place did.

### The data package's tests become the untyped caller

Several tests exist to prove the runtime gate still answers — "refuses a local price
without its currency", "saves a place with no hours key as having none". Those must keep
passing a value the compiler would reject, so they go through one named helper in the
test file:

```ts
/** What a caller the compiler never saw would send. The runtime gate is what answers. */
const untyped = <T,>(value: unknown) => value as T
```

Generic rather than fixed to `NewMarker`: the tests that deliberately send something the
compiler would reject are spread across four of the schemas — a marker, a marker patch, a
new city, a city patch — and one helper per schema would be four names for one idea. The
type argument is inferred from the parameter it is passed to, so the call sites read as
`createMarker(client, untyped({ … }))` with nothing else written down.

A cast in the tests whose subject *is* the runtime gate is the cast doing its job, and
naming it stops it spreading. `VALID_MARKER` itself gains the three keys it currently
omits, so the ordinary tests stay honest about what a real caller sends.

## Risks / Trade-offs

- **A field can still be supplied as an empty value from one application, with no control
  to type it in.** → Not solvable by a type; the field exists either way. `marker-capture`
  already requires both applications to capture the same fields, and the spec delta says
  this requirement does not replace it.
- **`NewMarker` as a parameter type makes the four defaults unreachable from the apps, so
  a reader may conclude they are dead and delete them.** → The comment in
  `packages/core/src/marker.ts` currently says the type system cannot see this class of
  mistake and that a test is the only thing that would. That is about to stop being true,
  so it is rewritten to say why the defaults remain.
- **Eight signatures at once is a wide diff for a change with no visible effect.** →
  Every one is the same two-word edit, and `pnpm verify` is the whole proof. The risk of
  splitting it is worse: a half-typed data layer reads as an oversight rather than a rule.
