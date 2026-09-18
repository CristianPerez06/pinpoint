## 1. Find the flicker

- [x] 1.1 On the simulator, uninstall any stale `com.pinpoint.app` build, then record a cold start of the current app signed in with a trip. Write in `findings.md` the moment the flicker happens: the loading text changing, the header arriving, the tools arriving, the map appearing, or the map's own first frame. Verify: the recording shows the moment, and the note names it
- [x] 1.2 If the flicker is the map's own first frame, stop and bring it to the user with the recording before going on (design decision 7). Otherwise continue. Verify: the user has answered, or the note says it is one of the moments this change removes

## 2. Phone: one chrome for both states

- [x] 2.1 Pull the bar's own look (surface, top border, bottom inset) out of `TripMap` into a `ToolBar` component that `TripMap` wraps its bottom row in, keeping `TripMap`'s `onLayout`, the drop confirmation swap and the sheet hiding as they are. Verify: `pnpm typecheck:mobile` passes, and in the simulator the bar, the drop confirmation and the map credit's position look unchanged
- [x] 2.2 Create `apps/mobile/components/workspace-chrome.tsx` taking `live: ChromeBindings | null` and a body. Move the header markup (point, trip control, ☰, city line) and `Tool` into it from `trip-workspace.tsx`, and have `TripWorkspace` render it with bindings, keeping every piece of state, read and write where it is. Verify: `pnpm typecheck:mobile` passes, and the trip sheet, city sheet, menu, filter pip, drop sight and marker sheet all still work in the simulator
- [x] 2.3 Draw the waiting header when `live` is null: `NamePlaceholder`s for the trip's and city's names in their own lines' size, the trip control, city control and ☰ inert (sunk fill, no outline, `accessibilityState.disabled`). Verify in the simulator against the mock: the header is the same height waiting and loaded
- [x] 2.4 Give `Tool` an inert form (`onPress: null`): sunk-fill tile inside the existing `BAR_HEIGHT`, no outline, disabled for VoiceOver, still in its order. Add a waiting body to the chrome: "Loading the map…" above a `ToolBar` holding the three inert tools. Verify: the waiting bar is the same height as the live one, measured in the simulator's inspector
- [x] 2.5 In `TripWorkspace`'s `Body`, use the waiting body while the places load instead of the bare `LoadingState`. Verify: with the trip known and places loading, the tools stand at the bottom, inert, and the header is live
- [x] 2.6 In `apps/mobile/app/index.tsx`, render `<WorkspaceChrome live={null}>` with the waiting body while the session and the trips are read, replacing both `LoadingState`s. Leave the redirect, the failure state and the first-trip setup as they are. Verify: a cold start goes straight to the map's shape with no "Loading your trips", and a new account (sign up in the simulator) sees the frame, then the setup
- [x] 2.7 Make the waiting body one accessible element labelled "Loading the map", marked busy, with the placeholders hidden from VoiceOver. Verify with VoiceOver in the simulator: the header's controls are announced as unavailable, and the map area as loading

## 3. Phone Settings

- [x] 3.1 In `apps/mobile/app/settings.tsx`, while the session is loading, draw a `NamePlaceholder` in the address's line and make the row one accessible element labelled "Loading your account", marked busy. Keep "No address on this account" for a session with no email. Verify: opening the app straight onto Settings (`xcrun simctl openurl booted pinpoint://settings` on a cold start) never shows "No address on this account", and Back and Light/Dark work while it waits

## 4. Laptop Settings

- [x] 4.1 Move the page's markup into `apps/web/app/settings/settings-screen.tsx`: `SettingsScreen` with the account's row as a slot, and `AccountRow` taking `account: { email: string | null } | null`. Verify: `pnpm typecheck` passes and the loaded page looks unchanged at 1280px and 400px, both themes
- [x] 4.2 Draw the waiting account row: a `NamePlaceholder` where the address goes, `aria-busy` on the row with a visually hidden "Loading your account" status, the bar `aria-hidden`. `BackToMap` and `Appearance` stay live. Verify: the accessibility tree in DevTools shows the status and no bar
- [x] 4.3 Render `SettingsScreen` from `page.tsx` at once, with the row behind its own `<Suspense>` (fallback `<AccountRow account={null} />`, content awaiting `requireUser()`), and no `loading.tsx` (design decision 5 says why). Verify: with the address delayed, reloading `/settings` shows the Settings screen with a grey bar for the address, never a blank page, Light/Dark works before the address arrives, and nothing moves when it does, at full width and 400px

## 5. Checks

- [x] 5.1 Look at both apps in both themes during the wait and after it, side by side with the mock (https://claude.ai/artifact/QtA7WxW2T8vHqhYRp1RuNY). On the phone, set light and dark in the app's own Settings, not only the simulator's. Verify: nothing moves or resizes when the data lands, on the phone and at 1280px and 400px on the laptop
- [x] 5.2 Repeat the cold-start recording from 1.1 on the changed app. Verify: the flicker found in 1.1 is gone
- [x] 5.3 Run `pnpm verify` and `openspec validate map-and-settings-draw-while-they-load --strict`. Verify: both pass
