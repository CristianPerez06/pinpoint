## Context

See `proposal.md` — Why, and `specs/write-feedback/spec.md` for what is being required.

What matters for the approach:

- Both applications already render a refusal identically. `fieldErrorsOf` collapses the
  validation issues into one message per field, and each form looks up
  `fieldErrors.<name>` and draws it under that field. Web and phone do the same thing
  with the same map. **Nothing in either application needs to change** — they will render
  better sentences because better sentences arrive.
- The descriptions of a place, a trip, a city and an invitation are zod schemas in
  `packages/core`. A constraint written without a message falls through to zod's default,
  which is what a person is reading today.
- The write schemas are *derived* — `newMarkerSchema` picks from `markerSchema` and
  extends it, `markerPatchSchema` picks the same list and makes it partial. A message put
  on the base description is inherited by both, which is why messages belong there rather
  than on each derived schema.
- zod is pinned at 4.4.3.

## Goals / Non-Goals

**Goals:**

- One written sentence per way a person-facing field can be refused, inherited by both
  write paths and both applications.
- A guard that fails when a new person-facing field arrives without one, without anybody
  having to remember to extend a list.
- The guard fails loudly, rather than silently passing, if a zod upgrade moves the ground
  under it.

**Non-Goals:**

- Changing where a refusal appears, how it is marked up, or how it is announced. All
  specified already, all correct.
- Messages for fields nobody can type or choose.
- Rewording the messages that are already sentences. They are the model being copied.

## Decisions

### Messages go on the base description, not on the write schemas or the forms

The message is a property of the rule, and the rule is stated once on `markerSchema`,
`tripSchema`, `citySchema` and `tripMemberSchema`. Both write schemas derive from it, so
one sentence covers creating and editing, on both platforms.

*Alternative — a message beside each form field.* Rejected: two copies, one per
application, and the repository has watched that drift before. `EMPTY_FIELD_WORDING` and
`day-wording.ts` exist for exactly this reason and say so in their own comments.

*Alternative — a shared lookup table keyed by field name.* Rejected: it separates the
sentence from the rule it explains, so a rule that changes leaves a sentence describing
the old one, and nothing connects them.

### Each record states what the *surface* supplies; everything else must answer

`MarkerFormValues` is already `Omit<NewMarker, 'tripId' | 'lng' | 'lat'>` — the position
comes from the map and the trip is whichever one is open. That exclusion list becomes a
runtime constant beside the schema, and the existing type is rebuilt from it so the two
cannot disagree. Trips, cities and invitations gain the same.

**The direction is the decision.** Stating the excluded fields keeps the property that
type's own comment calls load-bearing: a field added to a marker is automatically a field
both forms must handle. Stated the other way — a list of fields that need messages — a new
field would default to *not* needing one, and the guard would pass over precisely the case
it exists to catch.

Fields chosen from a control rather than typed — the city, the type, the second
currency — stay in the set that must answer. Both forms already render a refusal against
each of them, so each is a place a person can be shown a sentence.

### The guard reads the schema's own checks, and a probe keeps it honest

The guard walks each write schema's shape, skips the fields the record named as
surface-supplied, and asserts that every constraint on what remains carries a message of
its own. A field added with `z.string().min(1)` and no second argument fails immediately,
with nobody having written anything for it.

That reads zod's internals, which are not a public API and can move between versions. So
it is paired with a probe that does not: `z.config({ customError })` makes every message
zod would have written by default come back as a sentinel, and the probe asserts the two
methods agree on a known pair — one field with a message, one without. If a zod upgrade
changes the shape being walked, the probe disagrees and the test fails, rather than the
walk finding zero constraints and reporting everything fine.

*Alternative — the probe alone, feeding each field a bad value.* Rejected: it needs a
hand-written bad value per field, so a newly added field is simply not probed. It does not
fail for the case the guard is for.

*Alternative — scanning the source text, as `check-tables.mjs` scans SQL.* Rejected:
these schemas are assembled by `.pick()`, `.extend()` and `.partial()` across files, so
the text of a constraint and the schema a person meets are not the same thing.

### The guard is a test in `packages/core`, not a script in `.github/scripts/`

It needs to import the schemas, which are TypeScript. `packages/core` already runs vitest,
and `pnpm test` is already in `pnpm verify` and in CI — so there is no new step to add in
two places and no chance of adding it in one. The existing repository checks are scripts
because they inspect things TypeScript cannot see: SQL files, font bytes, generated
output, directory listings.

### A message says what is wrong, not which field it is about

The form marks the field and puts the message beneath its label, so naming the field
again says it twice. The two prices are the exception and are already specified as one —
`marker-capture` requires a message about one of the two amounts to name the currency,
because both sit under a single `Price` label.

This does not conflict with `workspace-chrome`, which says a refused city creation "is
said in the product's own words and names the field at fault". That requires the
*refusal* to identify the field, which is what showing it against that field does; it
does not require the sentence to contain the field's name. Worth stating because the two
readings are one word apart.

## Risks / Trade-offs

- **The walk reads zod internals and a future upgrade could move them.** → The sentinel
  probe fails when the two methods disagree, so the guard cannot quietly pass everything.
  A zod upgrade is already a deliberate act here; this makes it a noisy one.
- **`markerTypeSchema` is `z.string().refine(isMarkerType, …)` and AGENTS.md records that
  giving `isMarkerType` a type predicate silently retyped `Marker.type` and broke the data
  layer three packages away.** → This change touches the *message* on that refine and
  nothing else. `isMarkerType`'s signature is not to be touched, and the reason is written
  down.
- **Sentences can be written badly, and no check can tell.** → The guard enforces that
  somebody wrote one, not that it is good. That is the honest limit: it converts a silent
  default into a visible decision, which is all a check can do.
- **A message on the base description also reaches callers that are not forms** — a
  script, a test, the data layer. → That is the same sentence being more useful in more
  places, not a cost; nothing reads these messages programmatically.

## Migration Plan

Nothing to migrate. No stored data changes, no dependency changes, and no interface
changes — the applications render whatever arrives in the same place they already do.
Rolling back is reverting the commit.
