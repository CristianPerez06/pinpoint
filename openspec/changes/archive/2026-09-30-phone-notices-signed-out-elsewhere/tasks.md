## 1. Shared check

- [x] 1.1 Add `confirmSession(client)` to `packages/auth/src/operations.ts` and export it from `index.ts`. It calls `client.auth.getUser()` and returns nothing. Verify with a test in `operations.test.ts` that it calls `getUser` once and does not throw when `getUser` returns an error.
- [x] 1.2 In `packages/supabase` (`session-ending.test.ts`, beside the client it tests), test the library behaviour the design depends on. Use a real client whose `fetch` is faked and a signed-in session in memory. A `session_not_found` answer from `/user` emits `SIGNED_OUT`, and so does a refused refresh of an expired session. A fetch that rejects (no connection) keeps the session and emits nothing. Verify with `pnpm --filter @pinpoint/supabase test`.

## 2. Phone

- [x] 2.1 Split the forgetting out of `useSignOut` in `apps/mobile/lib/sign-out.ts` so it can run on its own. The button still forgets first, then signs out. Rewrite the file's comment for decision 1 of the design. Verify: pressing Sign out still returns to sign-in, and a trip no longer opens offline afterwards.
- [x] 2.2 Add one component, mounted inside `TripChoiceProvider` in `apps/mobile/app/_layout.tsx`. It runs the forgetting on every `SIGNED_OUT`, and while a session exists it calls `confirmSession` at launch, on `useActiveAgain`, and every 5 minutes while the app is in the front, restarting the timer on each return. Verify with `pnpm typecheck:mobile`.

## 3. Looking at the running phone

- [x] 3.1 Background the app, change the password on the laptop, and bring the phone back. The phone shows sign-in. With airplane mode then on, no trip opens.
- [x] 3.2 Leave the phone open on the map and change the password on the laptop. The phone shows sign-in within 5 minutes without being touched.
- [x] 3.3 ~~Airplane mode on, close and reopen the app.~~ Not run on a device: the simulator shares the Mac's connection. Decided with the user to rely on `session-ending.test.ts`, which asserts that a missing connection keeps the session and emits no `SIGNED_OUT`.
- [x] 3.4 Sign back in after 3.1. The account's first trip opens and loads normally.

## 4. Done

- [x] 4.1 `openspec validate phone-notices-signed-out-elsewhere --strict` and `pnpm verify` both pass.
