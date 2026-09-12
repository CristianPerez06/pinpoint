## Context

Most of this change is bookkeeping: a type, a resolver, a row in two menus, a route, three
radio-shaped options. One part is not, and it is the reason this document exists.

**Web decides the theme twice, by two different mechanisms.** The interface is decided by
the cascade — `packages/tokens/src/generated/tokens.css:118`, a bare
`@media (prefers-color-scheme: dark)` — and the map is decided in JavaScript, because its
colours live inside a style document transformed at runtime and the cascade cannot reach
them (`apps/web/lib/use-colour-scheme.ts`). The two must never disagree, and
`apps/mobile/lib/basemap.ts:51` already states the consequence: *a light map inside a dark
interface reads as a bug*.

The phone does not have this problem. Every colour on that platform flows through one
`useTheme()` — forty-odd call sites, the map included — so changing what feeds it changes the
whole application. The phone's difficulty is elsewhere and smaller: where the preference is
kept, and whether it can be read before the first frame.

## Goals / Non-Goals

**Goals**

- One preference, read by every consumer on both platforms. Two readers that could disagree
  is the defect this change is most likely to ship.
- No flash of the wrong ground when somebody has made a choice.
- "Follow the device" keeps following. The behaviour that exists today is not lost to the
  feature that extends it.

**Non-Goals**

- Syncing the preference across devices. "Follow the device" is device-scoped by definition,
  so an account-scoped store holding it would be incoherent.
- Closing the roadmap's other two waiters — the last city, the trip the app opens on. The
  store is built to hold them; this change does not write them.
- Any change to `ThemeMode`, to what colours exist, or to how they are derived.

## Decisions

### `ThemePreference` and `resolveMode` live in `@pinpoint/tokens`

The package's own rule is *platform-neutral literals, and pure functions over them*
(`packages/tokens/src/index.ts`), and `resolveTheme(mode)` already sits there.
`resolveMode(preference, deviceMode)` is the function directly before it in the same chain.

The alternative was `@pinpoint/core`, where product rules live, on the grounds that a
*preference* is a product concept rather than a token. Rejected: the resolver's entire job is
to produce a `ThemeMode`, and splitting the input from the output across two packages is how
the two come to disagree. `tokens` also takes no dependencies, which is what lets both
applications and the token derivation itself reach it.

`ThemeMode` stays `'light' | 'dark'`. It is a resolved ground. Adding `'system'` to it would
make a stored `'light'` indistinguishable from a device that merely happens to be light, and
every consumer that renders a colour would have to handle a value that is not a colour.

### Web stores the preference in a cookie, not `localStorage`

This is the load-bearing decision and it is not about durability — both survive a reload.
It is about **who can read it before the page paints**.

Today the flash is small and confined: `use-colour-scheme.ts` answers `'light'` on the
server, so on a dark device the *map* starts light while the chrome around it is already
dark, because the cascade got the chrome right without JavaScript running at all.

Add a stored choice and that inverts. The cascade can no longer be trusted on its own,
because it does not know about the choice. Whatever the server writes onto `<html>` becomes
the whole page's first frame, not just the map's. `localStorage` is unreadable on the server,
so choosing it does not leave the flash where it is — it promotes the flash from the map to
the entire interface.

A cookie is readable in the root layout. `apps/web/lib/supabase/server.ts:18` already reads
cookies, so this introduces no new mechanism.

### The cookie is a hint for the next render, not the live state

Setting the cookie through a server action would round-trip a theme toggle, which should be
instant. On change the client does three things itself:

1. writes `document.cookie`, so the *next* server render starts correct;
2. sets the attribute on `<html>`, so the interface repaints immediately through the cascade;
3. updates the React context, so the map re-themes in the same commit.

No server action, no navigation, no refetch. The cookie is never read by the client for live
state — it is read once per server render and nowhere else.

### `data-theme` carries the choice, and is absent when there is no choice

```
  no choice                        forced light              forced dark
  <html>                           <html data-theme=light>   <html data-theme=dark>
       │                                   │                         │
  :root            light               :root  light             :root  light
  @media dark      dark    ← wins       (media blocked)         [data-theme=dark] dark
       │                                   │                         │
  follows the device                  always light             always dark
```

`derive.ts` gains a `:root[data-theme='dark']` block after the media query, and the media
query is scoped `:root:not([data-theme='light'])` so an explicit light choice is not
overridden by a dark device. The absence of the attribute is the system case, which means the
behaviour with JavaScript disabled, with the cookie cleared, or on a first visit is exactly
today's behaviour. That is the property worth having: the new mechanism is additive to the
cascade rather than a replacement for it.

The attribute holds the **preference**, not the resolved ground. Putting the resolved ground
there would mean JavaScript deciding the interface's theme on every visit, and
`generated/tokens.css` is explicit that *a browser theme belongs in the cascade rather than in
JavaScript*.

### `color-scheme` is driven by the same attribute, in CSS

`apps/web/app/globals.css:20-27` declares `color-scheme: light dark` unconditionally. Correct
while the system is deciding; wrong once somebody forces one, because the browser goes on
drawing scrollbars, select dropdowns and form controls for the *system* preference. Three
rules replace one:

```css
html                      { color-scheme: light dark; }
html[data-theme='light']  { color-scheme: light; }
html[data-theme='dark']   { color-scheme: dark; }
```

No JavaScript, and it follows the attribute that is already being set.

`viewport.colorScheme` and `viewport.themeColor` in `apps/web/app/layout.tsx:13-22` cannot be
done in CSS — `themeColor` is a media-query pair and the browser picks between the two by
system preference, so a forced theme would still get the system's address bar. The static
`export const viewport` becomes `generateViewport()`, which reads the cookie and emits a
single colour when there is a choice and the pair when there is not.

**This makes the root layout dynamic**, which is a change of kind rather than a tweak. It
costs nothing here — the app is behind auth and the layout already sits above routes that
read cookies — but it should be a decision rather than a side effect, so it is recorded as
one.

### What happens to the map's first frame

With a choice made, the server knows it, `getServerSnapshot` returns the resolved ground
instead of a blind `'light'`, and the map's style document is fetched and transformed once,
for the right ground. No flash, no wasted transform.

With **follow the device**, the server still cannot know. The interface is correct from the
first frame because the cascade decides it; the map behaves exactly as it does today. That
is not a regression this change introduces, but `#55`'s acceptance criteria ask for *no
moment, first frame included, where one is light and the other dark*, so it has to be either
closed or named. **Named, and closed by the smallest thing that closes it**: the map is not
server-rendered at all — `trip-map.tsx` creates its instance in an effect — so the fix is for
the device branch to read `matchMedia` at the point the style is first requested rather than
inheriting the hydration snapshot. That is a change inside `use-colour-scheme.ts`, not a new
mechanism, and the task list requires it to be *observed* rather than reasoned about.

### The phone reads its preference inside the gate that already exists

`apps/mobile/app/_layout.tsx` holds the entire application behind `Blank` until the typeface
loads, and `Blank` already paints the theme's ground. Awaiting the stored preference in the
same gate costs nothing — the app is not rendering yet — and it removes the launch flash that
an asynchronous read would otherwise cause on every cold start.

This matters for the decision below: because the gate exists, *asynchronous* is not a reason
to reject a store. The choice can be made on what the store is for rather than on its
signature.

### The phone stores preferences in `@react-native-async-storage/async-storage`

Decided by the maintainer rather than taken as a side effect, which is what `ROADMAP.md`
asks for — it binds two later features as well as this one.

| | `expo-secure-store` | `@react-native-async-storage/async-storage` |
|---|---|---|
| Already installed | **Yes** — holds the session token | No |
| Cost | Free | Free; no signup, no key, no billing |
| Intended for | Secrets | Exactly this |
| iOS backing | Keychain — **survives app deletion** | App container — removed with the app |
| Size limit | Warns above ~2 KB per value | None that matters here |

Neither is wrong. `expo-secure-store` adds nothing to the dependency list, and the roadmap's
objection to it — *a trip id is not a secret* — is about semantics rather than correctness.
Against it: on iOS a Keychain item outlives the application, so deleting and reinstalling
would restore a theme choice from an application that is no longer there. Harmless for a
theme; odder for the last city and the current trip, which are the other two callers.

`async-storage` is the conventional answer and the one whose behaviour will not surprise
anybody, at the cost of one dependency in a repository that has been careful about them.

**Chosen: `async-storage`**, because this store is being chosen for three callers rather
than one, and "survives an uninstall" is the wrong default for all three. The dependency is
free with no signup, no key and no usage billing, so the `$0` constraint does not weigh
against it; what it costs is one line in `apps/mobile/package.json`, which is the cheaper
of the two prices on offer.

The module is `apps/mobile/lib/preferences.tsx` with one key per
preference under a shared prefix, a typed getter and setter per preference, and a provider
above the gate. Not a single JSON blob: three callers writing one value is three ways for one
write to clobber another's.

## Risks / Trade-offs

- **The two web resolution paths drifting.** The whole point of the context is that the
  cascade and the map read one value. The failure mode is a later change reading the cookie
  directly somewhere, or adding a second `matchMedia`. Mitigation is structural — the
  preference has exactly one reader on web, and the task list says to grep for a second one
  before finishing.
- **`generateViewport` making every page dynamic.** Accepted above. Worth re-checking if the
  application ever gains a public, unauthenticated page.
- **A route that leaves the map.** Navigating to `/settings` unmounts the maplibre instance;
  the style document is cached at module scope (`apps/web/lib/basemap.ts:23`) so nothing
  refetches, but the instance re-initialises and the camera re-frames on return. Accepted:
  `#49`'s password form needs a real page, and a modal holding a three-field form with error
  states is worse. The return must be history-back rather than a link to `/`, or the trip and
  city held in the address (`trip-workspace.tsx:569`) are silently dropped.
- **The phone's first screen that returns rather than replaces.** `headerShown: false` is set
  for the whole `Stack` and `signup.tsx:228` already records what that costs. Settings draws
  its own header with a back control rather than taking a per-screen native header, which
  would be a second chrome idiom to dress from tokens. If that reads wrong when looked at,
  the native header is the fallback, not a redesign.

## Migration Plan

None. There is no stored preference today, so every existing visitor and every existing
install is in the "no choice" state, which is the state that behaves exactly as the product
behaves now. Nothing to migrate, nothing to back-fill, no version to read.
