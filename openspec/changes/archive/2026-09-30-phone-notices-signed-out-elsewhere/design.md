## Context

See proposal.md for why. What the code does today:

- `apps/mobile/lib/session.tsx` reads the session from the keychain at launch and follows
  `onAuthStateChange`. It never asks the service whether the session still stands.
- `apps/mobile/lib/sign-out.ts` (`useSignOut`) is the only place the phone forgets what it
  kept (`forgetTrip`, `forgetKept`). Its comment ties forgetting to the button on purpose,
  so that a session dropped while the phone had no signal would not erase the trip.
- `apps/mobile/lib/use-active-again.ts` fires when the app returns from `background`.
- `supabase-js` 2.111 already does most of the work. `auth.getUser()` calls `/user`. When
  the server answers `session_not_found`, the library turns that into
  `AuthSessionMissingError`, removes the stored session and emits `SIGNED_OUT`. A network
  failure comes back as `AuthRetryableFetchError` and leaves the session alone. The token
  refresh behaves the same way: a refresh the server refuses (`refresh_token_not_found`
  once the session is deleted) removes the session and emits `SIGNED_OUT`, and a failed
  fetch keeps it and retries.

## Goals / Non-Goals

**Goals:** the checks named in the `auth` delta, and forgetting whenever the session ends,
not only when the button is pressed.

**Non-Goals:** a push from the server when the session ends (Supabase Realtime or
similar). A check every 5 minutes meets the requirement with one request and nothing
new to run.

## Decisions

**1. Forget on `SIGNED_OUT`, not on our own check's answer.** One listener, inside the
providers that own what is forgotten, runs the same forgetting as `useSignOut` whenever
the library emits `SIGNED_OUT`. Our check therefore only has to call `getUser()`: when the
session is gone, the library removes it and the listener forgets.

Why not act on the check's result: a phone brought back after more than an hour in the
background has an expired access pass. The library may refresh it before our check runs,
the server refuses the refresh, and the session is removed without our check ever seeing
an answer. The phone would reach sign-in with every trip still kept. `SIGNED_OUT` covers
both routes, and the button's too, so forgetting happens in one place.

This replaces the reasoning in `sign-out.ts`'s comment, which assumed a session can end
because of no signal. In this library it cannot. A failed fetch is retried and keeps the
session, and `SIGNED_OUT` only follows an answer from the server. That comment is rewritten
to say so. The button still calls the same forgetting, before `signOut`, so nothing is sent
in the moment between.

**2. The check is a shared operation.** `confirmSession(client)` in `@pinpoint/auth` calls
`getUser()` and returns nothing the caller needs to read. Calling the authentication service
lives in the shared package (`auth` — *Authentication operations are shared*). Deciding what
the answer means is left to the library, which keys it on the error code, not on message
text.

**3. When the phone asks.** It asks at launch once a stored session has been read, on
`useActiveAgain`, and on a 5-minute timer that runs only while the app is in the front. The
timer restarts whenever the app comes back, so it never adds a second request just after the
return check. It never asks while nobody is signed in. All of it lives in one component
mounted inside `TripChoiceProvider` in `app/_layout.tsx`, beside the listener from
decision 1.

## Risks / Trade-offs

- [A `SIGNED_OUT` the server did not cause would now erase kept trips] → in 2.111 the
  library only emits it after a definite server answer or `signOut()`.
  `session-ending.test.ts` in `@pinpoint/supabase` fails if the library ever emits it
  after a network failure.
- [Taps made with no signal, not yet sent, are lost when the session is ended elsewhere]
  → accepted with the user, in exchange for the phone keeping nothing (see proposal).
- [An extra request every 5 minutes] → a few hundred bytes, only while the app is in the
  front. Supabase's free tier does not count auth requests against any quota the app is
  near.
