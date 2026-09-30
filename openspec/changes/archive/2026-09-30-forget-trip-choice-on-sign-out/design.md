## Context

The chosen trip lives in React state in `TripChoiceProvider` (`apps/mobile/lib/trip-choice.tsx`),
mounted inside `SessionProvider` in `app/_layout.tsx`. The comment there says signing out
unmounts everything below `SessionProvider`, but `SessionProvider` always renders its
children and `app/index.tsx` only redirects to `/login`. So the provider, and its choice,
outlive the session. Confirmed by reading; the repro is a task.

*Sign out* is offered from two screens, both inside the provider: the map
(`components/trip-workspace.tsx`) and the calendar (`components/trip-calendar.tsx`). Both call
`signOutHere()` in `lib/sign-out.ts`, a plain function that forgets the kept copies and then
signs out. A plain function cannot reach React state.

## Goals / Non-Goals

**Goals:** one place that does everything *Sign out* means on the phone, so #128 has a
single spot to add "and delete the stored choice".

**Non-Goals:** persisting the choice (#128); changing what happens when a session ends
without the button being pressed.

## Decisions

**Forget the choice when *Sign out* is pressed, not when the session ends.** `lib/sign-out.ts`
becomes a hook, `useSignOut()`, returning a function that clears the trip choice, forgets the
kept copies, then signs out. `TripChoiceProvider` gains a `forgetTrip()` that sets the choice
back to null ("whichever trip is first"). Both screens call the hook instead of
`signOutHere()`.

This keeps sign-out tied to the button for the reason `sign-out.ts` already gives: Supabase
also ends a session when a token cannot be refreshed, which is most likely on a phone that
has been without a signal, and the offline-use behaviour deliberately does not treat that as
a sign-out. Keeping every "forget" in one function means the trip choice follows the same
rule as the kept copies.

Alternative considered: resetting the provider whenever the session becomes null (keying it
on the session). Smaller, but it forgets on an expired session too, and once #128 stores the
choice a remount would clear memory but not the store — so the button would still need its
own step, and there would be two places to keep in step.

**Correct the `_layout.tsx` comment** to say the choice is forgotten by signing out, not by
unmounting, so #128 does not rely on an unmount that never happens.

## Risks / Trade-offs

- [A future *Sign out* button calls `signOut` from `@pinpoint/auth` directly and skips the
  hook] → The hook's comment says it is the only way the phone signs out; both current
  callers move to it, and `signOutHere` is removed so nothing is left to call by mistake.
- [Clearing the choice before signing out re-renders the map on the first trip for a moment
  before the redirect] → Harmless: the same account still owns that trip, and the screen is
  replaced by sign-in as soon as the session ends. Checked in the running app.
