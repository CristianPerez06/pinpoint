## Context

See `proposal.md` — Why. What shapes the approach is where the English actually is, which
is four different kinds of place rather than one:

- **Fixed sentences exported as constants** — eighteen in `@pinpoint/data`
  (`MARKERS_FAILED_MESSAGE` and the rest), the four wording modules in `@pinpoint/core`,
  and `AUTH_FAILURE_MESSAGES` in `@pinpoint/supabase`, which is already a table from a code
  to a sentence and therefore already the target shape with one language in it.
- **Sentences inside validation schemas** — `zod` messages in `@pinpoint/core`, which reach
  a form as a `FieldErrors` map already written out, with no code left to translate from.
- **Sentences with a value in the middle** — `city-claim.ts` builds `Filed under
  ${name}, which is where this place is.`
- **A name on a shared list** — a marker type's `label`, the one value in
  `@pinpoint/map`'s type list a screen can draw as it stands.

Two constraints bound everything below. `@pinpoint/map` declares no runtime dependencies
and may not import the new package. And `packages/` may not depend on `apps/`, so the
resolution cannot live in either application.

## Goals / Non-Goals

**Goals:**

- One shared source of sentences, keyed by stable names, that renders nothing.
- Every shared package reports an identifier; no shared package returns a sentence.
- A contract that change 2 extends by adding a value, never by changing a signature.
- Zero visible difference, provable by reading the diff rather than by looking at the app.

**Non-Goals:**

- Spanish, choosing a language, remembering one, the Language section in Settings.
- The several hundred English words typed directly into the applications' own components,
  and the accessibility labels beside them.
- Anything a shared function *formats* from stored data — days, prices, currency names.
  Both specs carve this out explicitly; it comes in the change that gives it a second
  wording, because bringing it in now means answering how two applications keep producing
  the identical string, which is a question about that capability and not about this one.
- Plural rules and any message-formatting library. With one language there is nothing to
  decide, and deciding it now would be deciding it against English.

## Decisions

### The package is `@pinpoint/wording`, not `@pinpoint/i18n`

#45 proposes `@pinpoint/i18n`. This repository names packages after what they hold —
`tokens`, `map`, `data`, `core` — and already calls this thing wording, in four module
names and in the specs. `i18n` is a term of art that says how many languages there are
rather than what is inside, and the capability this change creates is `product-wording`.

### The lookup takes a language from the first day, and there is one to give it

`say(language, message)` ships in this change with exactly one language to pass. No
provider, no context, no threading — each call site names the single language constant.

The alternative is `say(message)` now and a language parameter later, which is smaller
today and changes the signature of every call in the repository in the change that is
already the larger one. `price.ts` has the instruction for this case written into it
already: *"`en` because the interface is English. When the interface is translated this
becomes an argument threaded from wherever the language is decided."* Taking the argument
now means change 2 replaces a constant with a value at sites it is visiting anyway.

### A reported message is `{ key, values }`, and the field is renamed

`WriteOutcome`'s `rejected` and `conflict` and `QueryState`'s `failed` carry `message:
string` today. They will carry `reason: Message`, where `Message` is `{ key: MessageKey;
values?: Record<string, string | number> }`.

One shape rather than two covers the sentence with a city name in the middle without a
second kind of outcome, and keeps the value out of the sentence until the sentence is
chosen — which is the whole point, because where a name sits in a sentence is not the same
in every language.

**The field is renamed rather than retyped in place.** Changing `message`'s type from
`string` to an object breaks every consumer at compile time except the one that matters
most: `` `${message}` `` keeps compiling and starts printing `[object Object]`. A rename
makes the compiler name every site instead, which is the same reasoning as #210.

### `@pinpoint/map` loses `label` and gains nothing

A marker type's `label` is deleted from `MarkerTypeDefinition`, and the wording package
holds an entry per type identifier. Adding a `labelKey` field would be a second name for
something the type already has — unlike `icon`, whose name genuinely differs from the type
(`temple` draws `landmark`). The type list stays three things: an identifier, a colour and
an icon's name, and the package's dependency count stays zero because nothing is added to
that file at all.

### The check reads the repository, not a list beside it

`.github/scripts/check-wording.mjs`, run early in `pnpm verify` because it only reads
files and answers in milliseconds. It fails on a key nothing defines, a sentence nothing
uses, and a marker type with no entry.

Reading the repository rather than holding a manifest is the shape `check-icons.mjs`
argues for at length: a comparison over a list of known copies cannot see a copy nobody
added to the list.

### The sentences are moved with a test that says what they were

Nothing in a typecheck can tell whether the sentence now behind `place.saveFailed` is the
one `MARKER_SAVE_FAILED_MESSAGE` used to hold, and the old constant is deleted in the same
commit. The wording package gets a snapshot test listing every key against its English, so
the move is reviewable as a table in the diff rather than by chasing eighteen deletions
across four packages.

## Risks / Trade-offs

**A key assembled at runtime is invisible to a check that greps for keys** → keys are
written as literals at every call site, and the check fails on a computed key rather than
skipping it. A key built from a variable is the one thing that makes both halves of the
check unsound, so it is refused rather than tolerated.

**The wording package becomes the place any string goes** → the spec states what is never
a named sentence — anything a person typed, and the tile attribution — before the package
exists, so the boundary is written down rather than discovered when somebody puts a city
name in it.

**A `MODIFIED` delta silently drops the sentences it does not carry forward** → both
modified requirements were copied whole out of the current spec and edited in place, not
retyped. The refusal requirement in `write-feedback` is long and mostly about where a
message is shown rather than what it says; none of that is touched.

**This change is reviewed by reading, because there is nothing to look at** → that is what
makes it worth separating. A reviewer checking that the app still works proves nothing
here; the test above and the diff are the review.

**`FieldErrors` stops arriving ready to print** → this is the fiddliest tier and the one
most likely to be half-done, because a form that renders a key instead of a sentence looks
broken immediately on the field somebody tests and silently on the twelve they do not. The
check catches an unknown key; the snapshot test catches a missing sentence. Every field
that can be refused already has a message and an automated check asserting it does
(`write-feedback`), so the list of what must be covered already exists and is enforced.

## Migration Plan

Nothing is deployed and nothing is stored differently — this is entirely internal to the
repository. The database is untouched, so there is no rollback beyond reverting the commit.

The one ordering constraint is that the wording package must exist and hold every sentence
before any package deletes one, so that no commit in the middle of the branch has a
sentence in neither place.
