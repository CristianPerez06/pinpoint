## Why

Fourteen writes across two applications. Four of them say something while they are
happening; the other ten do not, and the control stays live for the whole round trip.
On a phone on hotel wifi that is the difference between "it worked" and pressing it
again.

The gap is invisible at localhost latency, which is why every one of these is still
here.

Three things were found while auditing that the ticket did not have, and they change
what this change has to cover.

**Web has nowhere to put a failure that happens outside a form.** `message` is rendered
in exactly one place — `MarkerForm`'s `message` prop (`trip-workspace.tsx:816`). Five
handlers write into it from paths where no form is open: `answer` (`:336`), `unanswer`
(`:356`), `markVisited` (`:371`), `renameTrip` (`:405`) and `remove` (`:572`). Those are
the optimistic rollbacks — the screen quietly puts back what the database refused and
never says why. They are not new to this change and they are the most misleading failure
in either application, because the person watched something happen and then watched it
un-happen. Mobile has the surface web is missing (`problem` → a dismissible
`MarkersOverlayNote`, `trip-workspace.tsx:1038`).

**`busy` is wired backwards on *both* platforms, not only on web.** Mobile passes the
same marker-save flag to `TripSheet` (`:1073`), which disables the rename `Save`
(`trip-sheet.tsx:233`), and to `PeopleSheet` (`:1088`), which disables `Add to trip`
(`people-sheet.tsx:180`). Both applications therefore go dead on two controls during an
operation that has nothing to do with either, and stay live during their own. One
boolean per workspace meaning "some write is in flight" cannot correctly disable one
specific button, and it has now failed the same way twice.

**A duplicate press does not create a duplicate row.** `trip_members_trip_email_key` and
`cities_trip_name_key` are unique indexes, and `inviteMember` maps `23505` to an
`invalid-input` on the email field (`interest.ts:146-153`). So a double invite is not
two people on the trip — it is the person being told they have already added somebody,
in response to their own second click, with no indication that the first one is still
in flight. The database is the backstop it should be. The defect is the feedback, and
saying so accurately matters: it is the reason this change adds no idempotency
machinery.

Two smaller corrections. Mobile's `addCity` is silent too (`:750`, `if (!outcome.ok)
return null`) — the ticket has all three silent city failures on web and mobile has two
of three. And `CreateTripForm` already does the target pattern on both platforms
(`trip-setup.tsx` web `:161`, mobile `:160`, both `Creating…`), so there are two worked
examples per application to copy rather than one.

## What Changes

**The rule is written down, and it decides every case.** Two answers, and choosing
between them is not a matter of taste:

- **Optimistic** — the write touches one row, is reversible, and the screen can show its
  outcome immediately. Apply it at once, roll back on refusal, and say so.
- **Pending** — anything else: the outcome cannot be drawn before it arrives, or what
  follows depends on the stored row, or the act is irreversible. The control says what
  it is doing and is inert until it settles.

Applied, that is:

| Write | Answer | Why |
| --- | --- | --- |
| Interest, withdrawing it | optimistic | one row, reversible, already correct |
| Marking visited | optimistic | as above |
| Renaming a trip | optimistic | one row, reversible, already correct |
| Archiving / restoring a trip | optimistic | one row, reversible, already correct |
| Renaming a city / its currency | optimistic | **changed** — one row, reversible, and the picker can show it |
| Saving a place | pending | already correct; the form cannot close until the row exists |
| Deleting a place | pending | irreversible, and already behind a confirmation |
| Creating a city | pending | the form that called it has to select the row that comes back |
| Deleting a city | pending | irreversible, and it unassigns rows nobody is looking at |
| Inviting somebody | pending | the outcome is a member row with an id, and a refusal is about the address |
| Creating a trip | pending | already correct |

Revealing archived trips is a read rather than a write and takes the pending treatment
for the same reason: the press has to be answered.

**Every pending flag moves to the control that owns it.** No workspace-wide `busy` on
either platform. Each write handler returns its outcome, and the component holding the
button holds its own state. This is the shape `People.invite` (`trip-bar.tsx:210-223`)
and `CreateTripForm` already use, and it makes disabling an unrelated control
structurally impossible rather than merely fixed once.

It is a ref beside that state rather than state alone, and that half was added after
measuring rather than from the plan. With the flag held only in React state, three
presses inside one tick sent three writes: `pending` is false until the next render, so
every press in that window reads a stale value. Three presses a macrotask apart already
sent one, so nobody with a mouse would ever have found it — but "you need a fast machine
to be safe" is the opposite of what this change is for. Each application gets a
twenty-line `usePending` holding both; the ref flips synchronously inside the press that
started the write, so a second press cannot see a stale value however far behind the
renderer is. Written once per application, like the four loading states beside it: no
package depends on React today, and making one do so to save twenty lines is a bigger
decision than this change should make.

**A city rename and its currency become one write.** Both editors fire `patchCity` twice
from one `Save` press (`city-bar.tsx:124-129`, `city-sheet.tsx:245-249`). `updateCity`
already takes a partial patch, so one call carries both. This is a simplification, and
it removes a state that has no way of being reported: name stored, currency refused.

**Web's `Button` stops using the `disabled` attribute.** `ui.tsx:41` renders it, which
leaves the tab order and is skipped by screen readers — the exact thing `DESIGN.md:592`
forbids. `aria-disabled`, the existing inert styling, and a no-op guard, in the
primitive, so every current call site is corrected at once and no future one can get it
wrong. Mobile's `Button` (`ui.tsx:130-140`) already does this and is the reference.

**Web gains the failure surface it is missing.** The existing `MapOverlayNote` in danger
tone, dismissible, fed by `message` — mirroring mobile, which already has it. Every
failed branch in both applications then reports: the three silent city writes on web,
the silent `addCity` on mobile, and the five optimistic rollbacks on web that have been
silent since they were written.

**One vocabulary, both platforms.** `Saving…`, `Removing…`, `Adding…`, `Showing…` on the
control itself. Left as literals rather than collected into a strings module — #45 is
where translation is decided, and inventing half a mechanism for it here would prejudge
that.

**Not changing.** No toast system, no global request-state store, no retry, no
idempotency key, no library. Sign-in and sign-up on both platforms are already correct
through `useActionState` and their own local flags and are not touched. The read-side
four-state result from `@pinpoint/data` is not touched, and neither is anything #39
covers beyond the archived-trips press itself.

## Capabilities

### New Capabilities

- `write-feedback`: what a person is owed while a write is in flight and when it fails.

  A new capability rather than scenarios spread across `trips`, `marker-capture` and
  `marker-interest`, because the rule is one rule and it governs all three. Split three
  ways it would be restated three times and would drift, which is how two applications
  came to wire the same flag backwards independently.

  It states four things: a write says it is happening, a write cannot be fired twice, a
  refusal is reported wherever it happens, and the choice between optimistic and pending
  is made by a stated rule rather than per call site. Contrast with `place-search`, which
  already has "a query is in flight" for the read side — this is that requirement's
  missing half.

## Impact

Two applications, no packages, no dependency, no migration, no row-level security
change. `@pinpoint/data` is unchanged: every handler already returns a `WriteOutcome`
carrying everything needed, and nothing here needs a new one.

- `apps/web/lib/use-pending.ts`, `apps/mobile/lib/use-pending.ts` — one write's pending
  state, guarded by a ref so the guarantee does not depend on render timing.
- `apps/web/app/_components/ui.tsx` — `Button` goes inert rather than `disabled`.
- `apps/web/app/_components/trip-workspace.tsx` — `busy` retired; handlers return their
  outcome; `message` reaches the map; city writes report; the two city patches become
  one.
- `apps/web/app/_components/trip-bar.tsx` — `busy` prop removed; the rename detour and
  `People` hold their own pending state.
- `apps/web/app/_components/city-bar.tsx` — the editor holds pending state for create,
  save and remove, and stays open until each settles.
- `apps/web/app/_components/marker-details.tsx` — `Remove` holds its own pending state.
- `apps/web/app/_components/marker-form.tsx` — `busy` becomes a locally-owned pending
  flag; `Add city` gets its own.
- `apps/mobile/components/trip-workspace.tsx` — the same retirement, plus `addCity`
  reporting and `revealArchived` answering its press.
- `apps/mobile/components/trip-sheet.tsx`, `people-sheet.tsx`, `city-sheet.tsx`,
  `marker-details.tsx`, `marker-form.tsx` — the same move, control by control.
