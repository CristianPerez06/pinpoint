## 0. Before anything is written

- [x] 0.1 **Settle the phone's store.** It binds the last city and the current trip as well
      as the theme, so it was not this change's decision to take quietly.
      *Answered by the maintainer: `@react-native-async-storage/async-storage`, over the
      already-installed `expo-secure-store`. The deciding argument is that on iOS SecureStore
      is the Keychain, which survives app deletion — a reinstall would restore a preference
      from an application that is no longer there. Tolerable for a theme, wrong for a stale
      trip id. Free with no signup, key or billing, so the `$0` constraint does not weigh
      against it.*

## 1. The shared half

Both applications call this and neither restates it. It goes first so that no platform's
shape gets to decide the type's shape.

- [x] 1.1 Add `ThemePreference = 'system' | 'light' | 'dark'` to
      `packages/tokens/src/colour.ts`, beside `ThemeMode` at `:29`. Do **not** widen
      `ThemeMode`. It is a resolved ground, and every consumer that renders a colour would
      otherwise have to handle a value that is not one.
- [x] 1.2 Add `resolveMode(preference: ThemePreference, device: ThemeMode): ThemeMode` to
      `packages/tokens/src/theme.ts`, above `resolveTheme`. Pure, total, no default
      arguments — the caller supplies the device's answer, because only the caller knows how
      to ask on its platform.
- [x] 1.3 Export both from `packages/tokens/src/index.ts` alongside `pick` and
      `resolveTheme`.
- [x] 1.4 Test `resolveMode` in the package's own test file: all three preferences against
      both device answers, six cases. This is the one piece of logic in the change that can
      be tested without a screen, so it is the one piece that should be.

## 2. The cascade hook

`packages/tokens/src/generated/` is written by `scripts/derive.ts` and `pnpm check:tokens`
fails CI on a hand edit. The work is in the script.

- [x] 2.1 In `packages/tokens/scripts/derive.ts`, scope the existing dark media query at
      `:243` to `:root:not([data-theme='light'])`. Without this, a person on a dark device
      who explicitly chooses light still gets dark — the media query would outrank a plain
      `:root` block on specificity alone.
- [x] 2.2 Emit a `:root[data-theme='dark']` block after the media query carrying the same
      `customProperties('dark')` output. One call, two emissions — do not build the string
      twice, or the two drift the first time a token is added.
- [x] 2.3 Extend the header comment in `GENERATED_CSS`. It currently says the media query
      chooses; it now says the media query chooses *unless the attribute does*, and that the
      attribute's absence is the system case.
- [x] 2.4 Run the derivation. `pnpm check:tokens` green, and `git diff` on
      `src/generated/tokens.css` shows only the two blocks and the comment.

## 3. Web: where the preference lives and who reads it

- [x] 3.1 Read the cookie in `apps/web/app/layout.tsx` and put it on `<html>` as
      `data-theme`, **omitting the attribute entirely** when the preference is `system`. An
      empty or `"system"` attribute value would have to be excluded by every selector
      written in section 2.
- [x] 3.2 Replace `export const viewport` with `generateViewport()`, reading the same
      cookie. One `themeColor` when there is a choice, the existing media-query pair when
      there is not; `colorScheme` likewise. Keep the existing comment's reasoning — it
      explains why there are two entries, and that reason still holds for the no-choice case.
- [x] 3.3 In `apps/web/app/globals.css`, replace the unconditional `color-scheme: light dark`
      at `:20-27` with the three rules from `design.md`. Keep the comment; it already says
      why this matters better than a new one would.
- [x] 3.4 A client provider holding the preference, seeded from the server. On change it
      writes `document.cookie`, sets `document.documentElement.dataset.theme` (or deletes it
      for `system`), and updates its own state. No server action and no `router.refresh()` —
      a theme toggle that round-trips is a theme toggle that stutters.
- [x] 3.5 Rework `apps/web/lib/use-colour-scheme.ts` to resolve through the provider:
      `resolveMode(preference, deviceMode)`. Keep `useSyncExternalStore` and keep the
      module-level `subscribe` / `getSnapshot` constants — the file's own comment records
      that defining them in the hook body is a render loop, not a style question.
- [x] 3.6 With a choice in force, `getServerSnapshot` returns the resolved ground rather
      than a blind `'light'`. With `system` it cannot, and that is the case 5.6 has to look
      at rather than reason about.
- [x] 3.7 Grep for a second reader before moving on: `matchMedia`, `prefers-color-scheme`
      and the cookie name across `apps/web`. There must be exactly one of each outside the
      generated stylesheet. Two readers that can disagree is the defect this change is most
      likely to ship.

## 4. Web: the route and the way into it

- [x] 4.1 `apps/web/app/settings/page.tsx`. A server component reading the user with the
      existing `requireUserId`. It needs **no trip data** — no markers, no cities, no
      membership. If this file imports anything from `@pinpoint/data` beyond the user,
      something has gone wrong.
- [x] 4.2 `Account` section: the email from the session, read-only. No name — `displayName`
      is `trip_members.display_name` and `packages/core/src/trip.ts:23` says so. A name here
      would be whatever the person is called on whichever trip was open when they pressed
      `Settings`.
- [x] 4.3 `Appearance` section: three options, current one marked. Not a two-state switch —
      the third state is the one most people are in. Per `DESIGN.md`, no state may live in
      hue alone, so the current option carries a mark as well as a colour.
- [x] 4.4 The way back is `router.back()`, not `<Link href="/">`. The workspace holds the
      trip and city in the address (`trip-workspace.tsx:569`); a link to `/` drops the city
      silently and lands somebody in a different one.
- [x] 4.5 A `Settings` row in the account menu in `apps/web/app/_components/workspace-chrome.tsx`,
      between `Refresh` and `Sign out`. `Sign out` stays last — that placement is a rule
      (`workspace-chrome/spec.md:16`), not a layout preference.
- [x] 4.6 Leave the menu's identity block alone. It answers *who am I on this trip*; the
      route's `Account` section answers *which account is this*. Different facts, not a
      duplicate. Recorded here so the next person reads a decision rather than an oversight.

## 5. The phone

- [x] 5.0 Add `@react-native-async-storage/async-storage` to `apps/mobile/package.json` at
      the version Expo 57 expects — `npx expo install`, not `pnpm add`, so the SDK picks the
      compatible range rather than latest.
- [x] 5.1 `apps/mobile/lib/preferences.tsx` over `async-storage`. One key per
      preference under a shared prefix, a typed getter and setter each. **Not a single JSON
      blob** — three callers writing one value is three ways for one write to clobber
      another's.
- [x] 5.2 Provide the preference above the font gate in `apps/mobile/app/_layout.tsx`, and
      hold `Blank` until it has been read as well as until the font has loaded. The gate
      already paints the theme's ground, so an asynchronous read costs nothing here and
      removes the cold-launch flash it would otherwise cause.
- [x] 5.3 `useThemeMode` in `apps/mobile/lib/theme.ts` becomes
      `resolveMode(preference, useColorScheme() === 'dark' ? 'dark' : 'light')`. Keep the
      comment about `useColorScheme` answering null — *light is the right answer to "no
      opinion"* is still true and is still the non-obvious part.
- [x] 5.4 Nothing else on the phone changes. Every colour already flows through `useTheme()`,
      map included. If this section touches a component file, ask why before continuing.
- [x] 5.5 `apps/mobile/app/settings.tsx`, the same two sections as web. It draws its own
      header with a back control: `_layout.tsx` sets `headerShown: false` for the whole
      `Stack`, and `signup.tsx:228` already records that dropping the way back strands
      somebody. A text link at the bottom is what login and sign-up use and is the wrong
      gesture here — those are a lateral pair, this one returns.
- [x] 5.6 Give the back control a 44pt target, and check it clears the notch —
      `useSafeAreaInsets`, as the sheets already do.
- [x] 5.7 A `Settings` row in `apps/mobile/components/menu-sheet.tsx`, between `Refresh` and
      `Sign out`, matching web's order. The two menus are deliberately mirrored and the
      file's header comment says so.

## 6. Looking at it

The standing lesson: each of the last two changes shipped three defects that type-checked,
rendered, and were wrong. Everything below is a thing to open, not a thing to reason about.

> **Looked at by the maintainer, on both platforms, and reported as all validated.**
>
> Recorded that way deliberately rather than as eleven ticks in my own voice. The Chrome
> extension that drives the browser would not connect from this session and the phone half
> needs a development build on a simulator, so I looked at none of these — the maintainer
> did, and the confirmation is theirs.
>
> What I *did* measure is the server's half of the web behaviour, by probing the running dev
> server rather than by reasoning about it. That is recorded under 6.2 and 6.7 because it is
> a different kind of evidence: it proves the right markup and the right stylesheet are sent,
> and says nothing about what a browser draws from them. Both halves are in the record so
> that a later reader can tell which claim rests on which.

- [x] 6.1 **Each of the three options, on each platform, with the map on screen.** Nine
      looks per platform is the honest count; do them. The map and the interface agree in
      every one.
- [x] 6.2 **Reload on web with each choice in force.** Watch the first frame, not the
      settled state — a flash is a few frames and is invisible to anybody who blinks. Throttle
      the network if that helps make it visible.
      *Not looked at. The server half was measured instead, by curling the running dev server
      with each cookie state — this is what the first frame is built from, so a defect here
      would have guaranteed a flash, and its absence is necessary but not sufficient:*
      - *no cookie → no `data-theme` attribute at all, `<meta name="color-scheme" content="light dark">`, both `theme-color` entries with their media queries. Byte-identical in effect to the behaviour before this change.*
      - *`pp-theme=dark` → `<html … data-theme="dark">`, one `theme-color` of `#171614`, `color-scheme: dark`.*
      - *`pp-theme=light` → `data-theme="light"`, one `theme-color` of `#FBFAF8`, `color-scheme: light`.*
      - *`pp-theme=dusk` → falls back to the system case exactly as an absent cookie does.*

      *The attribute is present in the server's HTML, so the cascade has it before any
      JavaScript runs — which is the property the cookie was chosen for. Whether a browser
      then paints it without a flash is the part that still needs an eye.*
- [x] 6.3 **Cold launch the phone with each choice in force.** Kill the app properly, not
      background it. Same question: the first frame, not the settled one.
- [x] 6.4 **Change the system appearance with the app open, on "follow the device", on both
      platforms.** This is the behaviour that exists today and the one most likely to be lost
      to the feature extending it.
- [x] 6.5 **Change the system appearance with a forced choice in force.** Nothing moves.
      That is the whole point of the choice and it is the case nobody tests.
- [x] 6.6 **The device case on web, which `design.md` names as the residual.** On a dark
      device with no choice made, watch the map's first frame. If it is light while the chrome
      is dark, 3.6 is not done. Acceptance criterion in `#55` is explicit that the first frame
      counts.
- [x] 6.7 **The host's own furniture on web with a forced theme.** Force light on a dark
      machine: scrollbars, a `<select>` dropdown, and the address bar are light. Then the
      reverse. This is what `globals.css` calls *the tell that a theme was painted on rather
      than declared*, and it is invisible unless specifically looked for.
      *Not looked at. The stylesheet that decides it was read off the running server: the
      three `color-scheme` rules are present and in the right order, and Lightning CSS's own
      `light-dark()` shim was checked at the same time because it emits a second, unscoped
      `@media (prefers-color-scheme: dark)` block of its own. It resets its variables in both
      attribute rules, so it agrees rather than fighting — worth having checked, since a
      bundler-emitted media query is exactly the second reader this change is trying not to
      have. The tokens' own dark block is correctly scoped `:root:not([data-theme="light"])`.*
- [x] 6.8 **Leave and return on web.** Pick a city that is not the first, open `Settings`,
      come back. Same trip, same city. Then do it with the browser's own back button as well
      as the screen's.
- [x] 6.9 **Leave and return on the phone.** Nothing stranded, nothing double-pushed, and
      the back control reachable with one thumb.
- [x] 6.10 **Both grounds on the Settings screen itself**, both platforms. The screen that
      changes the theme is the screen most likely to be checked in only one of them.
- [x] 6.11 **Greyscale.** Turn on the macOS or simulator colour filter and confirm the
      current option is still identifiable. `DESIGN.md` forbids state living in hue alone, and
      this repository has two open loose ends from exactly this check being specified and not
      run.

## 7. Close out

- [x] 7.1 Apply both deltas: `openspec/specs/styling/spec.md` and
      `openspec/specs/workspace-chrome/spec.md`.
      *Applied by `openspec archive` rather than by hand: one requirement modified
      (`styling`), one added (`workspace-chrome`), none removed. Checked afterwards for the
      failure `AGENTS.md` warns about — a `MODIFIED` delta silently deleting every sentence
      not carried forward. Diffed both specifications against a snapshot taken before the
      archive: **70 lines added, zero removed**, so nothing was dropped.*
- [x] 7.2 Amend `ROADMAP.md`'s *Not built yet* entry. The store exists and the theme is
      written through it; the last city and the current trip remain. The entry shrinks rather
      than closing, and it should say which store was chosen and why, so the next caller
      inherits the decision instead of re-taking it.
- [x] 7.3 `pnpm verify` green — which includes `check:tokens`, `check:specs` and
      `check:cycles`. The last one matters here: `@pinpoint/tokens` must still have no
      dependencies.
- [x] 7.4 `openspec validate --strict`.
      *16 passed, 0 failed, after the archive.*
- [x] 7.5 Close `#55`. Note on `#49` that the `Settings` route and its `Account` section
      exist, and that its password form drops into the section rather than creating one.
