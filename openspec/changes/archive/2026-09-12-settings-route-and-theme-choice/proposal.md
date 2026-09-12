## Why

`#55`: `openspec/specs/styling/spec.md:101` has said from the start that both applications
render in the theme *"the person's device **or explicit choice** asks for"*, and no explicit
choice exists anywhere in either application. Half a sentence has never been implemented.

There is also nowhere to put one. Neither application has a screen that is neither the map
nor a sign-in, so the route this needs is part of the work rather than a detail of it.

## What Changes

- **One `Settings` route on both platforms**, with an `Account` section and an `Appearance`
  section. Agreed with `#49`, which adds *Change password* into the `Account` section this
  change creates. Two sibling routes were the alternative and were rejected: both menus
  currently hold exactly three rows and are deliberately mirrored, and two new rows apiece
  starts the list that `#40` just finished removing.

- **Reached from the account menu on both platforms, which already exists.** `#55` and `#49`
  were both written when web had no menu and `Sign out` was a bare header button. `#40`
  closed and shipped one: `apps/web/app/_components/workspace-chrome.tsx:433` is an account
  menu at the far end of the bar holding identity, `Refresh` and `Sign out`, described in its
  own comment as *"the same three items in the same order"* as the phone's `MenuSheet`. A
  `Settings` row goes into both, above `Sign out`, which stays last and out of a thumb's
  reach. This follows the rule already in force rather than inventing one —
  `workspace-chrome/spec.md:43`, *"A rare action lives behind the name of what it acts on"* —
  and the account menu is the name of the account.

- **A three-valued preference and a pure resolver, in `@pinpoint/tokens`.**
  `ThemePreference = 'system' | 'light' | 'dark'` beside `ThemeMode`, and
  `resolveMode(preference, deviceMode): ThemeMode`. `ThemeMode` does not change and does not
  gain a third value: it is a *resolved ground*, and a stored `'light'` that cannot be told
  apart from a device that merely happens to be light is the defect this separation exists to
  prevent. Both applications call the resolver; neither restates the precedence.

- **An override hook in the generated stylesheet.** `packages/tokens/scripts/derive.ts:243`
  emits a bare `@media (prefers-color-scheme: dark)` and nothing else, so the cascade has no
  way to be told otherwise. The derivation gains an attribute-scoped block beside it, so an
  explicit choice wins and its absence falls through to the system exactly as today.
  `src/generated/` is written by the script and `pnpm check:tokens` fails CI on a hand edit.

- **A cookie on web, read on the server.** The preference is applied to `<html>` during SSR
  and fed to `useColourScheme` as the starting value. This is the part that is not
  bookkeeping, and it is why `localStorage` is not an option — see `design.md`.

- **`color-scheme` and `viewport.colorScheme` follow the forced value.**
  `apps/web/app/globals.css:20-27` and `apps/web/app/layout.tsx:13-22` both declare
  `light dark`, which is correct while the system decides and wrong the moment somebody
  forces one: the browser would go on drawing scrollbars, select dropdowns and the address
  bar for the system preference. `globals.css` already names this as *"the tell that a theme
  was painted on rather than declared"*.

- **A preference store on the phone, and the roadmap entry it belongs to.**
  `useThemeMode` is `useColorScheme()` and nothing else (`apps/mobile/lib/theme.ts:15-20`).
  `ROADMAP.md` under *Not built yet* records that the phone has nowhere to remember a
  preference and two things want one — the city last filed under, and the trip the app opens
  on. This is the third. The store is built to hold all three; **this change writes only the
  theme**, because deciding what "the trip you were on" means when that trip is archived or
  you have been removed from it is a different question wearing the same hat. The roadmap
  entry is amended, not closed.

- **The `Account` section shows the email and no name.** `displayName` is trip-scoped —
  `trip_members.display_name`, and `packages/core/src/trip.ts:23` says so outright. A name in
  an account-scoped screen would be whatever the person is called on whichever trip happened
  to be open when they pressed `Settings`. Invisible at one trip; wrong the moment somebody
  is `Cris` on one and `Cristian` on another. The email comes from the session and is correct
  always. That the product has no account-level name is recorded as a finding, not papered
  over.

- **What is deliberately not done.** The menus keep their identity blocks. They and the
  `Account` section turn out to be different facts — *who am I on this trip* against *which
  account is this* — so neither is a duplicate of the other. Nothing is removed from either
  menu. This change also does not add a forgotten-password flow, does not touch `#49`'s
  password form, and does not sync the preference across devices: "follow the device" is
  inherently device-scoped, so an account-scoped preference holding it would be incoherent.

## Capabilities

### New Capabilities

None. A settings route is a place to put existing capabilities, not a capability.

### Modified Capabilities

- `styling`: the requirement *Every colour token is defined for both a light and a dark
  ground* already permits an explicit choice and carries only the device scenario
  (`:110-113`). The delta adds what an explicit choice means — that it overrides the device,
  that "follow the device" remains available and keeps following, that it survives a restart,
  and that the browser's own furniture follows a forced theme. Its existing wording — *"every
  surface, including the map"* — already puts the map in scope, so no new sentence is needed
  to cover it.

- `workspace-chrome`: the rule *A rare action lives behind the name of what it acts on*
  covers a row in the account menu already. What is not covered is the case this change
  introduces for the first time: a control in the chrome that leaves the workspace for
  another route, and the return from it. The delta states that such a return restores the
  workspace as it was left, which on web means the trip and city in the address.

## Impact

- `packages/tokens/src/colour.ts` — `ThemePreference` added beside `ThemeMode`.
- `packages/tokens/src/theme.ts` — `resolveMode` beside `resolveTheme`. No dependency added;
  the package still has none.
- `packages/tokens/src/index.ts` — both exported.
- `packages/tokens/scripts/derive.ts` — emits the attribute-scoped block.
- `packages/tokens/src/generated/tokens.css` — regenerated by the script, never by hand.
- `apps/web/app/layout.tsx` — reads the cookie, applies it to `<html>`, and `viewport`
  becomes `generateViewport()`. This makes the root layout dynamic, which is a change of kind
  rather than a tweak; the app is behind auth and already reads cookies at
  `apps/web/lib/supabase/server.ts:18`, so nothing is lost.
- `apps/web/app/globals.css` — `color-scheme` stops being unconditional.
- `apps/web/lib/use-colour-scheme.ts` — takes the stored preference as its starting value.
  `getServerSnapshot` can stop answering `'light'` blind, which removes the map flash that
  exists today.
- `apps/web/app/settings/` — new route. It needs **no trip data**: web reads the user with
  the existing `requireUserId`, the phone reads `useSession()`.
- `apps/web/app/_components/workspace-chrome.tsx` — one row in the account menu.
- `apps/mobile/app/settings.tsx` — new screen. `_layout.tsx` sets `headerShown: false` for
  the whole `Stack`, and `apps/mobile/app/signup.tsx:228` already records what that costs —
  *"The only way back […] dropping this line would strand"*. Settings is the first screen
  that **returns** rather than replaces, so it draws its own header with a back control.
- `apps/mobile/lib/theme.ts`, `apps/mobile/lib/preferences.tsx` (new), `app/_layout.tsx` —
  the store, and the gate. The font gate already holds the whole app behind `Blank` while
  painting the theme's ground, so an asynchronous read costs nothing extra there.
- `apps/mobile/components/menu-sheet.tsx` — one row.
- `openspec/specs/styling/spec.md`, `openspec/specs/workspace-chrome/spec.md` — via deltas.
- `openspec/ROADMAP.md` — the *Not built yet* entry amended: the store exists, two callers
  remain.
- `apps/mobile/package.json` — one new dependency,
  `@react-native-async-storage/async-storage`, chosen over the already-installed
  `expo-secure-store` because on iOS the latter is the Keychain and survives app deletion.
  Free, no signup, no key, no billing. No new dependency on web, and none anywhere under
  `packages/` — `@pinpoint/tokens` still has none, which `pnpm check:cycles` enforces.
- Closes `#55`. Unblocks `#49`, which fills the `Account` section this creates.
