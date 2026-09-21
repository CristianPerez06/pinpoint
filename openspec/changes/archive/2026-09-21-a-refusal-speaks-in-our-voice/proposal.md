## Why

Type `-5` into a price and save, and the place answers:

> JPY: Too small: expected number to be >0

The `JPY:` is ours. The rest is the validation library's own wording, handed to the
person unchanged. It reads as something broken rather than as something to correct.

About fifteen fields answer this way, across places, trips, cities and invitations. The
handful that answer properly — signing in, opening hours, an end date before a start
date — are the exceptions, written one at a time by whoever happened to think of it.
Nothing asks for the rest, so the dollar price has read like this since prices existed
and nobody noticed until #191 put a currency code beside it.

Two specifications already require better. `write-feedback` says a refusal is reported
"in words written for the person", and `workspace-chrome` says a refused creation "is
said in the product's own words". So this is not a new rule being proposed — it is an
existing rule that nothing enforces, being met and then held.

## What Changes

- **Every field a person can fill in answers in a sentence when it is refused.** A place
  with no name, a link that is not a link, a price below nothing, a trip or city with no
  name, an invitation to a malformed address — each says what is wrong in plain words,
  ending in a full stop, the way the good ones already do.
- **Both applications get it at once**, because the wording lives with the shared
  description of the data rather than beside either form. The phone and the laptop cannot
  disagree about what a refused field says.
- **A message does not repeat its field's name.** The form already marks the field at
  fault and puts the message under it, so "Name: A place needs a name" says the word
  twice. The two prices keep their `JPY:` prefix — they share one `Price` label, and
  `marker-capture` already requires a message about one of the two amounts to name the
  currency it concerns.
- **A new check stops it coming back.** Each kind of record states which of its fields a
  person fills in, as opposed to the ones the app supplies — its position on the map,
  which trip it belongs to, when it was created. Places already say this; trips, cities
  and invitations start saying it too. The check then requires a written message for
  exactly those fields, and fails the build when one is missing.

Not in scope: translating any of this (#45), and changing where a refusal appears or how
it is marked up — both are already specified and already correct.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `write-feedback`: the requirement "A refused write says so, wherever it happened" gains
  what "words written for the person" excludes — a message a validation library wrote by
  default — and says when a message should name its own field.

## Impact

- `packages/core` — the descriptions of a place, a trip, a city and an invitation gain
  written messages, and each gains a stated list of the fields a person fills in.
- Both applications render what they are given, so neither form changes.
- The guard is a test in `packages/core`, beside the descriptions it reads, so it runs
  under `pnpm test` — already part of `pnpm verify` and of CI. No new step to wire up.
- No database change, no dependency change, nothing stored differently.
