## Why

The phone app keeps its login fresh with a timer it never pauses. When the app goes to the background, nothing tells it to stop, so whether that timer runs on, freezes or fires late is left to iOS and Android. Supabase's own instructions for phone apps say the app has to start and stop it. Nobody has hit a problem yet; this closes the gap before somebody comes back to the phone after an hour and finds a request failing or sign-in waiting (#241).

## What Changes

- The phone stops renewing its login while it is not in front, and renews it straight away whenever it comes back.
- A person returning after more than an hour (the login lasts one hour) lands where they were, signed in, with the trip loading normally.
- Coming back with no signal does not sign anybody out; the renewal waits for the connection.
- Not changing: the check from #230 that notices a session ended on another device — when it asks, and what it does with the answer, stay as they are. The laptop is untouched.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `auth`: *A person signs in and stays signed in* gains what "refreshed before it expires" means on the phone — renewed only while in front, at once on return, and never ended for lack of a connection.

## Impact

- `apps/mobile/lib/supabase.ts` — where the phone creates its connection to Supabase; the pause and resume are registered there once.
- No new dependency, no database change, nothing in `packages/`.
