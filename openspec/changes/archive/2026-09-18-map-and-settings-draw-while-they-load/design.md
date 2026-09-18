## Context

**Phone map.** `apps/mobile/app/index.tsx` returns `LoadingState what="pinpoint"` while
the session is read and `LoadingState what="your trips"` while the trips are. Only then
does it mount `TripWorkspace`, an 1,800-line component that holds the trip's state, its
reads and writes, *and* draws the header (`trip-workspace.tsx`, the `return` at the
`styles.header` view). The header can't be drawn without a trip. Inside, `Body` returns
a bare `LoadingState` ("Loading the map…") while the places load, and the row of tools is
not drawn then: the row is handed to `TripMap` as `bottomRow`, and `TripMap` draws the
bar that holds it (surface, top border, bottom inset, `onLayout` for the credit's
offset), so there is no bar until the map mounts.

**Phone Settings.** `apps/mobile/app/settings.tsx` already draws the whole screen during
the session read. The only defect is `session?.user.email ?? 'No address on this
account'`, which says the account has no address while `session` is still unread.

**Laptop Settings.** `apps/web/app/settings/page.tsx` is a server component that awaits
`requireUser()` and renders inline markup. There is no `loading.tsx` under `settings/`,
and since #170 moved the map's loading file into `(map)`, nothing covers it. `BackToMap`
and `Appearance` are client components that need nothing from the account;
`ThemePreferenceProvider` is in the root layout, so it is there for a loading file too.

**What already exists to reuse.** #170 left both apps a pattern and the parts for it:
screen components taking `live: … | null` (web `WorkspaceChrome`, both `CalendarScreen`s),
a `NamePlaceholder` on each app, the inert look (sunk fill, no outline, `aria-disabled` /
`accessibilityState.disabled`), and the way a waiting body announces itself
(`aria-busy` with a visually hidden status on web; `accessible` + `accessibilityLabel` +
`busy` on the phone).

## Goals / Non-Goals

**Goals:**

- The phone's map header and row of tools are drawn by one definition, with or without a
  trip.
- The map route shows that definition during both of its waits, with the same loading
  message in the map area from launch until the map appears.
- Settings on the laptop gets a waiting screen from the same code as the loaded page.
- The flicker named in #169 is reproduced and its moment identified before any fix for
  it is written.

**Non-Goals:**

- The laptop's map. It already follows the rule; its two map-area messages ("Loading
  your trip", then "Loading the map…") are not brought into line here.
- Failure states, the sign-in screens, and the phone's launch gate (typeface and stored
  preferences), which holds the system launch screen on purpose.
- When or how anything is read.

## Decisions

### 1. The phone gets a `WorkspaceChrome` of its own, taking `live: … | null`

Split `TripWorkspace` the way #170 split `TripCalendar`: a new
`apps/mobile/components/workspace-chrome.tsx` draws the header (point, trip control, ☰,
city line), a slot for the body, and the contents of the row of tools. It takes
`live: ChromeBindings | null`: names and handlers when there is a trip, `null` before.
`TripWorkspace` keeps every piece of state, read and write, and passes bindings in.
`index.tsx` renders `<WorkspaceChrome live={null}>` with the loading state in its body
during the session read and the trips read.

Named after the web's component on purpose: it is the same thing on the other platform,
and `workspace-chrome` is the spec both answer to. No markup is shared. Each app draws
its own, as the styling rules require.

*Alternative considered:* a separate `WaitingWorkspace` that copies the header's layout.
That is exactly the second rendering `waiting-screens` forbids, and it would drift the
first time the header is edited.

### 2. The bar the tools stand on becomes a small shared piece, used by the map and by the wait

The bar (surface, top border, bottom inset, its measured height) is currently written
inside `TripMap`, which has good reasons to own that edge: it swaps in the drop
confirmation, gets out of the way of sheets, and lifts the map credit above the bar. It
keeps all of that. Only the bar's own look is pulled out into one `ToolBar` component,
used by `TripMap` around whatever stands in it, and by the waiting body around the inert
tools. One definition of what the bar looks like, and `TripMap` still decides when it
shows.

The waiting body is therefore the loading state with a `ToolBar` over its bottom edge.
`Body` in `TripWorkspace` uses the same waiting body while the places load, so the
second wait looks exactly like the first.

`Tool` moves into the chrome file and takes `onPress: null` as its inert form. It gets
the sunk-fill tile from the mock, no outline, `accessibilityState={{ disabled: true }}`,
and stays in the accessibility order. The tile sits inside the tool's existing
`BAR_HEIGHT`, so the bar is the same height either way.

### 3. Which controls wait for what

- **Before the trip is known** (session or trips unread): every control in the header
  and every tool is inert.
- **Trip known, places loading:** the header is live, as it is today. Its acts (switch
  trip, the menu, choose a city) can complete. The tools stay inert until `TripMap` is
  mounted, because Search and Drop act on the map. The mock drew the ☰ menu greyed out
  in this moment too. The spec's rule makes it live once the trip is known, and that is
  what gets built.
- **Map shown:** everything is live.

### 4. The same loading message throughout

The body's loading state is `LoadingState` with its default, "Loading the map…", in all
three places it can appear: the session wait, the trips wait, and the places wait.
`what="pinpoint"` and `what="your trips"` go away from `index.tsx`.

### 5. Laptop Settings: the page draws at once, and only the address waits

Move the page's markup into `apps/web/app/settings/settings-screen.tsx`:
`SettingsScreen` draws the page and takes the account's row as a slot, and
`AccountRow` takes `account: { email: string | null } | null`. With `null` it draws a
`NamePlaceholder` where the address goes, and marks the row `aria-busy` with a visually
hidden "Loading your account" status. The page doesn't wait for the account. It renders
`SettingsScreen` at once, with the row behind its own `<Suspense>`: the fallback is
`<AccountRow account={null} />`, and the content is a small async component that awaits
`requireUser()`.

*Why not a `loading.tsx`, which was the first plan:* a route's loading file is the
fallback for the whole page. On a full page load, React does not hydrate a fallback
whose boundary is still pending, so `BackToMap` and `Appearance` were drawn, looked
usable, and did nothing, without being announced as unavailable. That broke *A control
acts only once its act can complete*. Found by pressing Light during a delayed load. With
the boundary around the row alone, everything else is outside it and hydrates at once.

*Cost:* `requireUser()` now runs inside the row, so a signed-out visitor sees the
Settings frame for as long as the check takes, then is sent to sign in. The proxy only
refreshes the session and does not redirect.

### 6. Phone Settings: a placeholder while the session is unread

In `settings.tsx`, `loading` → `NamePlaceholder` in the address's line, with the row made
one accessible element labelled "Loading your account" and marked busy. `session` with no
email → "No address on this account", as today. Nothing else in the file changes.

### 7. The flicker is found before it is fixed

The first task reproduces a cold start on the simulator, recorded, and names the moment
the flicker happens: the loading screen's text changing, the header arriving, the tools
arriving, the map appearing, or the map's own first frame. The first three are removed by
decisions 1–4 anyway. If it is one of those, confirming it is gone after the change is
the fix.

If it is the map's own first frame, that is the renderer drawing before its style or
tiles are ready. That is outside the waiting rule, and the fix would be in `TripMap`. It
gets brought to the user with what was seen before anything is built, because it could
widen this change.

## Risks / Trade-offs

- [Splitting an 1,800-line component moves a lot of code whose behaviour must not
  change] → Move markup only. State, effects and handlers stay in `TripWorkspace`, and
  the chrome receives values and callbacks. Check every sheet, the drop sight, and the
  filter pip on the running app afterwards, not just the waiting state.
- [The bar's measured height feeds the map credit's offset; the waiting bar must not
  disturb that] → The waiting bar is drawn only where `TripMap` isn't mounted, so there
  is no credit to offset. `TripMap` keeps its own `onLayout`.
- [A new account sees the map frame, then setup] → Accepted in explore. It happens once
  per account, on first launch.
- [The flicker is in the renderer] → Decision 7: stop and bring it back.
- [The phone in light mode was not checked by hand last time] → The tasks set the app to
  light in its own Settings before checking.

## Open Questions

None.
