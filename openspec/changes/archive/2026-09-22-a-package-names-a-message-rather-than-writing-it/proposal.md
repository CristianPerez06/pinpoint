## Why

Both applications are going to be offered in Spanish (#45), and today there is no point
at which a second language could be chosen. A great deal of what this product says is
not written where it is shown — a failed save, a refused password, the name of a place's
type and the words on an empty field all arrive from the shared packages already written
out in English. Code that has no idea who is reading has already decided what language
they read in.

This change moves the words to where a language can be chosen, and does nothing else.
**Nobody using either application sees any difference.** That is the point: it is the
groundwork, reviewed on its own, so that the change which actually adds Spanish is about
Spanish.

## What Changes

- **One list of everything the product says.** A new shared package holds every sentence
  under a short name — `place.saveFailed`, `auth.invalidCredentials`, `city.needsAName`
  — with the English beside it. It is a list of words and a way to look one up. It draws
  nothing and is never a component, which is the same cut already made for colours: one
  source of values, two applications rendering them their own way.

- **Shared code names a message instead of writing it.** When a save fails, the data
  layer says *which* failure it was; the application looks up the sentence and shows it.
  Same for a refused form field, an authentication failure, and the name of a marker's
  type — which becomes exactly what its icon already is, a name the application resolves
  rather than a thing the shared package holds.

- **The words themselves do not change.** Every sentence is moved, not rewritten. If a
  screen says something different afterwards, that is a mistake, not this change.

- **The sharing is kept, not undone.** Wording was deliberately moved *into* shared code
  four times, because a sentence written twice drifts the first time one copy is edited.
  It stays shared — one list, both applications — and what stops being shared is only the
  assumption that the sentence is in English.

- **A check that this stays true.** CI fails if a name a package hands over has no
  sentence, or if a sentence is in the list with nothing using it. Same habit as the
  existing icon and token checks: a rule with no check rots.

**BREAKING** for code inside this repository only: the shared read and write results carry
a message name where they used to carry a message. Nothing stored in the database changes,
and no screen changes.

## Capabilities

### New Capabilities

- `product-wording`: every sentence the product says has one name and one source. Covers
  what belongs in the list, what is never translated (anything a person typed, and the
  map's attribution), and the check that keeps the list and its users in agreement.

### Modified Capabilities

- `write-feedback`: the requirement *A refused write says so, wherever it happened* says
  the wording of a field refusal is shared by both applications rather than written beside
  either form. It becomes a shared **name** that both applications resolve to the same
  sentence — the guarantee it was protecting, that one mistake is answered the same way on
  the phone and the laptop, is unchanged.
- `markers`: the requirement *Marker type is a code-defined value* already says the icon
  identifier names an icon rather than being one, and that nothing in the shared list can
  be rendered without an application resolving it first. The type's own name is the single
  value in that list that escaped the rule; it comes under it.
- `monorepo-structure`: a new requirement beside *Shared packages stay free of
  platform-specific rendering* — a shared package hands over an identifier, never a
  sentence written for a person.

`auth` is deliberately **not** modified. Its requirement *Authentication failures are
identified by code, not by message* already describes the shape everything else is moving
to, and is the evidence that the shape works.

## Impact

- **New** `packages/i18n` — the list and the lookup. No rendering, no framework.
- `packages/data` — eighteen exported message constants become names; `WriteOutcome`'s
  `rejected` and `conflict` and `QueryState`'s `failed` carry a name.
- `packages/core` — the sentences currently inside the validation schemas, and the four
  wording modules (`city-wording`, `invitation-wording`, `empty-field-wording`,
  `day-wording`).
- `packages/supabase` — `AUTH_FAILURE_MESSAGES` is already a table from a code to a
  sentence; it moves into the list unchanged in substance.
- `packages/map` — a marker type drops its English name. **The package still declares no
  runtime dependencies**, and must not import the new one: the type's own identifier is
  what the list is keyed by, so nothing new is added to that file at all.
- `apps/web`, `apps/mobile` — both resolve names to sentences; no visible change.
- `.github/scripts/` — the new check, wired into `pnpm verify` as well as the workflow.

Not in this change: Spanish, choosing a language, remembering one, the Language section in
Settings, and the several hundred English words typed directly into the two applications'
own components. All of that is the change that follows.
