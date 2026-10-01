## 1. Pause and resume the refresh

- [x] 1.1 In `apps/mobile/lib/supabase.ts`, register one `AppState` listener at module level that calls `supabase.auth.startAutoRefresh()` on `active` and `stopAutoRefresh()` on any other state, with a comment saying why (the library only does this itself in a browser). Verify with `pnpm typecheck:mobile` and `pnpm lint`.

## 2. Check it in the running phone app

- [x] 2.1 Sign in on the phone, send the app to the background for more than an hour, bring it back: still signed in, the trip loads, no error. (To avoid waiting an hour, a shorter `jwt_expiry` on a local Supabase is acceptable; say which was used.)
- [x] 2.2 Repeat 2.1 with the device offline on return: still signed in; turn the connection back on and the session renews on its own, with no sign-in prompt and nothing pressed.
- [x] 2.3 With the app in the background, change the password on the laptop, bring the phone back: it shows sign-in (the check from #230 still works).

## 3. Finish

- [x] 3.1 Run `openspec validate pause-login-refresh-in-background --strict` and `pnpm verify`; both pass.
