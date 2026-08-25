## 1. The rule, and the primitives that carry it

- [x] 1.1 Record the classification table from the proposal where the code can see it —
      a comment block at the head of each workspace, beside the existing note about why
      writes go through `@pinpoint/data` from the browser. Both applications get the same
      table; a rule kept only in an archived proposal is rediscovered per call site.
- [x] 1.2 Web `Button` (`ui.tsx:26-47`): stop rendering the `disabled` attribute. Take
      `disabled` as before, render `aria-disabled={disabled || undefined}`, guard
      `onClick` so a press does nothing, and keep the existing inert styling. Six
      selectors in `ui.module.css` move with it — `.button:disabled` (`:51`) and the five
      `:not(:disabled)` guards on `:active` and the four tones (`:47,66,76,85,95`) — to
      `[aria-disabled='true']`. `filter-bar.module.css:172-177` already does exactly this
      for `Clear` and is the precedent to copy rather than invent against.
- [x] 1.3 Check every existing web call site still behaves: `CreateTripForm`
      (`trip-setup.tsx:161`), `TripBar` rename `Save` (`:131`), `People` `Add to trip`
      (`:267`), `MarkerForm` submit (`:287`), `CityEditor` `Save` (`city-bar.tsx:129`). None of them
      relies on the browser suppressing the event — the guard is in the primitive — but
      confirm the submit button, which is `type="submit"`: `aria-disabled` does not stop
      a form submitting, so the guard has to be on the form's `onSubmit` too.
- [x] 1.5 **Not in the plan, and found by measuring rather than by reading.** With the
      pending flag held only in React state, three presses in one tick sent **three
      writes** — `pending` is false until the next render, so every press in that window
      reads a stale value. Three presses one macrotask apart already sent one, so a
      human with a mouse never saw it; "hard to provoke by hand" is a statement about a
      fast machine, and this change exists because the slow one behaves differently. Each
      application now has a twenty-line `usePending` (`apps/web/lib/use-pending.ts`,
      `apps/mobile/lib/use-pending.ts`) holding a ref beside the state: the ref flips
      synchronously inside the press. Re-measured after: three same-tick presses send one
      write. Written twice rather than shared, like the four loading states — no package
      depends on React today and making one do so to save twenty lines is a bigger
      decision than this change is entitled to make.

- [x] 1.4 Web failure surface: render `message` as a dismissible `MapOverlayNote` with
      `tone="danger"` in the stage, mirroring mobile (`trip-workspace.tsx:1038`). It has
      to be dismissible and it has to not fight the two notes already there — decide the
      precedence rather than letting them stack, and say which wins in a comment.

## 2. Web: retire `busy`

- [x] 2.1 Delete the `busy`/`setBusy` state (`trip-workspace.tsx:170`) and its two
      passes into `TripBar` (`:632`) and `MarkerForm` (`:814`). Remove the `busy` prop
      from `TripBar` and from `People`.
- [x] 2.2 Change every write handler to return its result instead of swallowing it.
      `save`, `remove`, `renameTrip`, `addCity`, `patchCity`, `removeCity` return the
      `WriteOutcome` (or a narrowed `{ ok }`); `invite` already returns a problem. The
      `void` at each call site goes with them — the caller now awaits.
- [x] 2.3 `MarkerForm` holds its own pending flag for the submit, and a second one for
      `Add city` (`:246`), which awaits `onCreateCity` and is live throughout today.
      Two flags, not one — they are two writes and the form offers both at once.
- [x] 2.4 `MarkerDetails` holds a pending flag for `Remove` (`:164-169`). The panel stays
      open with `Removing…` until it settles, and closes only on success.
- [x] 2.5 `TripBar`: the rename detour holds its own flag and stays open until the
      rename settles — it currently calls `open(null)` in the same breath as `onRename`
      (`:135-137`), so there is nothing left on screen to report to. `People.invite`
      already has the structure; add the flag and the `Adding…` label.
- [x] 2.6 `CityEditor` (`city-bar.tsx:97-164`): one pending flag for `Save`, one for
      `Remove city`. Both keep the editor open until they settle; both close on success.
      `onRename` and `onSetCurrency` collapse into a single `onSave(name, currency)`
      producing one `patchCity` call — the two-call version can half-succeed and has no
      way to say so.
- [x] 2.7 `addCity`, `patchCity`, `removeCity` (`trip-workspace.tsx:579-600`) report
      their refusals. Today all three are `if (!outcome.ok) return`.
- [x] 2.8 City rename and currency become optimistic per the rule: apply to `cities`
      state at once, roll back and report on refusal. The editor still holds pending
      state for the round trip, because it is the thing that closes.

## 3. Mobile: the same retirement

- [x] 3.1 Delete `busy`/`setBusy` (`trip-workspace.tsx:238`) and its three passes —
      `MarkerFormSheet` (`:803`), `TripSheet` (`:1073`), `PeopleSheet` (`:1088`). The
      last two are the same backwards wiring web has and the ticket attributes to web
      alone.
- [x] 3.2 Handlers return their outcome, as on web. `save`, `remove`, `renameTrip`,
      `setTripArchived`, `revealArchived`, `addCity`, `patchCity`, `removeCity`.
- [x] 3.3 `MarkerFormSheet`: its own submit flag, plus one for the `Add city` path
      (`marker-form.tsx:271`).
- [x] 3.4 `MarkerDetails`: a pending flag on `Remove` (`:375-381`), matching web's
      answer for the same write.
- [x] 3.5 `TripSheet`: rename `Save` holds its own flag; `Archive trip` stays optimistic
      and keeps closing the sheet, per the rule — a refusal then lands on the overlay
      note, which is what makes closing acceptable.
- [x] 3.6 `TripSheet` `Show archived trips` (`:302-316`): inert with `Showing…` from the
      press until `fetchTrips` settles. A `Pressable` rather than a `Button`, so it needs
      `accessibilityState={{ disabled: true }}` written explicitly. **What fills the
      space while it loads belongs to #39** — this task is the press being answered, not
      the shape of what lands.
- [x] 3.7 `PeopleSheet`: its own `Adding…` flag on `Add to trip` (`:176-182`).
- [x] 3.8 `CitySheet` editor (`:240-256`): pending on `Save` and on `Remove`, and the
      same collapse of `onRename` + `onSetCurrency` into one write.
- [x] 3.10 **Not in the plan, found while writing it.** The optimistic city rename on
      this platform cannot revert by dropping its override, which is what the interest
      writes do. Dropping is only safe when a stored row is underneath to fall back to,
      and a city created on this device has none — its override *is* the city, so a
      refused rename would have answered by making the city disappear. It restores the
      previous override instead.

- [x] 3.9 `addCity` (`trip-workspace.tsx:750`) reports its refusal. It is the one silent
      failure on this platform and the ticket does not have it.

## 3b. A rename that reported success and changed nothing visible

- [x] 3b.1 **Not in the plan, found while validating §5.** Both applications hold the
      trip's name twice: the trip being viewed, which a rename updates, and the list of
      trips, which is read once and never hears about it. On web that list *is* the
      visible name as soon as an account has two trips (`trip-bar.tsx:78` renders the
      picker from `trips`), so the rename said `Saving…`, succeeded, and left the old
      name on screen forever. On the phone the header is live but the trips sheet — the
      thing actually on screen when Save is pressed — showed the old name in its row.
      Fixed at the producer rather than at the controls that render it: each
      workspace derives the list it hands down as the stored list with the live trip
      laid over it — the override shape the phone already uses for cities and markers.
      Derived rather than copied into state, so a fresh read from the server and a
      fresh rename both flow through on the next render with nothing to keep in step.
      Patching the picker and the row instead would have left the next thing that
      displays a trip name wrong on the day it was written.

      Older than this change and adjacent to it, but it is a screen left claiming
      something that is not true, which is this capability's subject. The single-trip
      branch on web never had it, which is exactly why it survived: it reads `trip`.

## 3c. A refusal reported to a surface nobody could see

- [x] 3c.1 **Found by looking, and invisible to every static check.** On the phone a
      refusal is drawn over the map by the workspace, and the trips and cities sheets are
      `Modal`s covering it. So every write reached from inside one — rename, archive,
      restore, revealing the archived trips, saving a city, removing one — called
      `setProblem` correctly and reported into a surface behind the sheet that started
      it. The name sprang back with no explanation, which is the exact defect this
      change exists to remove, reintroduced one layer up.

      It typechecks, it lints, and the handler is right. Only opening the app finds it.

      Both sheets now render the refusal themselves, above their list and outside the
      scroll so it cannot be scrolled away — the answer `PeopleSheet` already had for its
      own invite. One piece of state, rendered wherever the person actually is.

      `MarkerFormSheet` and `MarkerDetails` are not modals and were never affected, and
      `FilterSheet` is one but starts no writes.

- [x] 3c.2 **And the message then outlived its context.** Cleared only by the next write
      or by a tap, a refusal came back the next time the sheet was opened — attached to
      nothing the person was doing, which is its own way of saying something untrue. The
      rule: a refusal belongs to the surface it was raised in, and opening or closing a
      surface ends it. Every sheet toggle goes through one `showSheet` helper rather than
      each remembering, so a sheet added later cannot forget.

      Considered and rejected: reporting refusals through `Alert` instead, which would
      need no clearing at all. `Alert` currently means one thing in this application —
      confirming something irreversible — and a confirmation that shares its shape with
      "that didn't work" is one the person learns to dismiss unread. It is also
      interruptive for something recoverable, it is a fourth thing beside the three
      `DESIGN.md` names, and web cannot do it, so the same refusal from the same function
      would read differently on the two platforms.

## 4. Vocabulary and accessibility

- [x] 4.1 One set of words on both platforms: `Saving…`, `Removing…`, `Adding…`,
      `Showing…`, and `Creating…`, which the two trip forms already said and which the
      city detours now say too. Left as literals — #45 decides translation, and half a strings
      mechanism invented here would prejudge it.
- [x] 4.2 Every inert control announced: `aria-disabled` on web through the primitive,
      `accessibilityState={{ disabled: true }}` on native. Anything built from a bare
      `Pressable` rather than from `Button` states it itself — `Show archived trips` and
      `Restore` are the two.
- [x] 4.3 Nothing leaves the tab or accessibility order while it is pending. Checked by
      tabbing rather than by reading the diff: web reports `aria-disabled="true"` with
      `tabIndex` 0 and the `disabled` property false, and the native controls carry
      `accessibilityState={{ disabled: true }}` with a no-op press.

## 5. Looking at it, which is where this project's defects have been

Web was driven under a throttled connection with every write forced to fail and to
succeed. Mobile was not, and 5.7 says exactly why.

- [x] 5.1 Web, throttled — a 4s delay injected in front of every Supabase request, with
      a switch to refuse them. Not localhost latency, which is what hides all of this.
- [x] 5.2 Each web write: the control says what it is doing, a second press sends
      nothing, and it returns to rest on both outcomes. Measured rather than watched —
      three presses of `Save` produced exactly one `PATCH`, three of `Remove` exactly one
      `DELETE`.
- [x] 5.3 Failures forced and the message found on screen: a refused rename reported
      `Could not save that trip.` over the map with a `Dismiss`, and a refused delete
      reported `Could not remove this place.` with the card still open and the control
      pressable again. Both of those were silent before this change.
- [x] 5.4 The optimistic cycle watched end to end, which is the thing that had never
      been visible: the toolbar read `Japan 2027XYZ` while the write was in flight and
      `Japan 2027XY` after it was refused, with the note beside it. The city rename did
      the same in the picker — `KyotoX (JPY)` during, and one `PATCH` for both fields
      where there used to be two calls.
- [x] 5.5 Web, both themes. The dark one on screen; the light one by forcing the light
      custom properties over the media query, since the theme follows
      `prefers-color-scheme` and nothing in the product toggles it. The note is the
      existing danger pair on the existing overlay component, so no new composition was
      introduced — which is the reason to check it and also the reason it holds.
- [x] 5.6 Web keyboard: the inert `Save` reports `aria-disabled="true"`, `tabIndex` 0,
      the `disabled` property false, 0.55 opacity and `not-allowed`, and a click on it
      does nothing. That is the DESIGN.md rule the shared `Button` was breaking at every
      call site.

- [x] 5.7 **Mobile, on a device, by the repository owner.** Nothing in this session could
      reach it: `osascript` is refused assistive access (`-1719`), `idb` is not installed,
      and every sheet this change touches is behind at least one tap. So the whole mobile
      list was walked through by hand instead — the writes, the refusals with the network
      off, the archived-trips press, both themes.

      It found two defects that nothing static could, which is the third change running
      that this has been true of:

      - the trips list showing a name a rename had already changed (§3b), and
      - a refusal reported to a surface behind the sheet that raised it, then outliving
        the context it belonged to (§3c).

      Both typechecked, both linted, and both were wrong. Note what they have in common:
      neither is in a handler. The handlers were correct in every case — the defects were
      in *where the result was shown*, which is the half no type can hold.

## 6. Close out

- [x] 6.1 `pnpm verify` — lint and typecheck for both applications and the packages,
      tests, the web build, tokens, fonts, row-level security, cycles, specs.
- [x] 6.2 `openspec validate say-what-a-write-is-doing --strict`.
- [x] 6.3 Archived after both platforms were validated by hand, ahead of landing on
      `main` rather than after it — the branch is still unmerged. Recorded because the
      previous change archived in its own commit *after* merging, and this one did not.
