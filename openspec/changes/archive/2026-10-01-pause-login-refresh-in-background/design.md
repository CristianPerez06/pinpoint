## Context

`apps/mobile/lib/supabase.ts` creates the client with `autoRefreshToken: true`. In `@supabase/auth-js` (2.111 here) that starts a ticker that checks the session every 30 seconds and refreshes it near expiry. On the web the library pauses that ticker itself when the tab is hidden; on any other platform it only says, in its own documentation, that the ticker "works continuously in the background" and that the app should call `startAutoRefresh()` / `stopAutoRefresh()` from its foreground signal. Nothing in the phone app does.

`startAutoRefresh()` runs one tick immediately, so a session that expired while the app was away is refreshed on return. A refresh that fails for lack of a connection is a retryable error: the library keeps the session and tries again on the next tick. The spec delta relies on both.

## Goals / Non-Goals

**Goals:** tie the client's refresh to the app being in front, using the library's documented pattern.

**Non-Goals:** changing the session check from #230 (`lib/session-watch.tsx`); anything on the laptop; changing how long a session lasts.

## Decisions

**Registered once, beside the client, in `lib/supabase.ts`.** The refresh belongs to the client, not to any screen or to whether someone is signed in, and the library's example says to register it exactly once. A module-level `AppState` listener next to `createPinpointClient` lives as long as the client does. Putting it in `SessionWatch` would tie it to a mounted component and to the signed-in state, which the check from #230 does not need; putting it in `useActiveAgain` would be wrong in kind, since that hook reports returns only and has no "went away" edge.

**Start on `active`, stop on anything else — `inactive` included.** This is the library's pattern as written. `useActiveAgain` deliberately ignores iOS's `inactive` (notification centre, app switcher, permission dialogs) because treating those as a return would re-read data. Here the cost is the other way round: stopping on `inactive` and starting again on `active` runs one immediate tick, which does nothing unless the session is near expiry. No data is read.

**No unit test.** The mobile app's tests cover pure modules only and nothing mocks `react-native`; the logic is one comparison. The behaviour that matters — a return after the session expired, with and without signal — is checked in the running app.

## Risks / Trade-offs

- [The app is already in front when the module loads, so no `change` event fires for it] → `autoRefreshToken: true` stays on, so the client starts its own ticker at creation, as it does today; the listener only governs later transitions.
- [A request fired on return races the immediate refresh] → the client's `getSession()` already refreshes an expired session on demand and the library serialises refreshes behind one lock, so the request waits for the new token rather than using the old one.
