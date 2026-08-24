# EAS setup — Pinpoint mobile

How this app is configured for [EAS](https://docs.expo.dev/eas/) (Expo Application
Services), from an empty account to an installable build. EAS is Expo's hosted pipeline
for native builds, credential storage and internal distribution — it compiles on Expo's
machines, so an Android build needs no Android SDK locally and an iOS build needs no Mac.

The configuration already exists in the repository. This document is here so the next
person can tell what was decided from what merely happened, and so a rebuild from
scratch — a new account, a second app — does not have to rediscover it.

## Decisions in force

| Decision | Value | Why |
|---|---|---|
| Bundle ID / Android package | `ar.com.pinpoint.app` | Reverse DNS under a domain we control. **Immutable once published** — the stores use it as the app's primary key, and changing it makes the app a different product with zero installs. |
| EAS project | `@cristian.perez.06/pinpoint` | Personal account, free tier. A project can be transferred later; the `projectId` survives the move. |
| Build profiles | `production` only | One audience. A second profile is worth adding when a second audience exists, not before. |
| Distribution | `internal` | Installable from a link or QR. No TestFlight, no Play Console, no paid account for Android. |
| Android artifact | APK | Sideloadable directly. Play Store needs `app-bundle` instead. |
| iOS artifact | Simulator `.app` | **Requires no Apple Developer membership.** A build for a physical iPhone does, because EAS provisions it ad-hoc. |
| Environments | `production` only | One Supabase project, so one environment. Separate data would justify a second. |

Apple Developer ($99/yr) is required only for iOS on real hardware. Google Play ($25
once) is required only to publish — internal Android distribution needs neither.

## Prerequisites

Node and pnpm as the root `README.md` describes, plus an account on
[expo.dev](https://expo.dev). The free tier is enough.

Nothing else. In particular the Xcode requirements in the root README govern **local**
builds (`pnpm --filter mobile ios`); EAS compiles on its own machines with its own
toolchain.

---

## 1. Install the CLI as a dev dependency

```bash
pnpm --filter mobile add -D eas-cli
```

**Not globally, and not with npm.** `eas-cli` is built on [oclif](https://oclif.io),
which `require()`s its own submodules lazily at runtime and so assumes a flat,
npm-style `node_modules`. pnpm's global store is symlinked, so `pnpm add -g eas-cli`
fails with `Cannot find module 'debug'`. Installed into `apps/mobile` it lands under
this repository's `nodeLinker: hoisted` layout, which is flat, and works. It also pins
the version in the lockfile, so the CLI is the same on every machine.

Installing it pulls in `dtrace-provider` (through bunyan, its logger), whose install
script pnpm blocks pending an answer. The answer is in `pnpm-workspace.yaml`:
`dtrace-provider: false`. It compiles native bindings for a tracing facility nothing
here uses, and bunyan logs identically without them. Leaving the question unanswered is
not neutral — the next `pnpm exec` fails outright with `ERR_PNPM_IGNORED_BUILDS`.

```bash
pnpm --filter mobile exec eas --version   # eas-cli/22.2.0 darwin-arm64 node-vXX
```

## 2. Log in

```bash
pnpm --filter mobile exec eas login
pnpm --filter mobile exec eas whoami
```

`whoami` lists every account you can act for, which is worth reading before the next
step — this login can reach more than one.

## 3. Register the project

Set the identity fields in `app.json` **first**, because two of them are expensive to
change afterwards:

| Field | Value | Note |
|---|---|---|
| `expo.name` | `Pinpoint` | The label under the icon. Free to change. |
| `expo.slug` | `pinpoint` | Names the project on EAS. Changing it after `eas init` breaks the link and means recreating the project. |
| `expo.ios.bundleIdentifier` | `ar.com.pinpoint.app` | Immutable once published. |
| `expo.android.package` | `ar.com.pinpoint.app` | Immutable once published. |

Then:

```bash
pnpm --filter mobile exec eas init
```

It asks which account owns the project and confirms the name, then writes back into
`app.json`:

- `expo.extra.eas.projectId` — the UUID tying this code to the EAS project. **Commit
  it. It is not a secret**; it appears in public build URLs.
- `expo.owner` — the owning account.
- `expo.extra.router` — an empty slot expo-router uses internally.

Verify both ends agree, rather than trusting the command's output. An interrupted
`eas init` can create the remote project without writing the local link, and the
mismatch surfaces much later as a confusing build error:

```bash
pnpm --filter mobile exec eas project:info
node -e "const c=require('./apps/mobile/app.json').expo; console.log(c.owner, c.extra?.eas?.projectId)"
```

## 4. Write `eas.json`

`app.json` says what the app *is*. `eas.json` says how EAS *builds* it.

```json
{
  "cli": { "version": ">= 22.2.0", "appVersionSource": "remote" },
  "build": {
    "production": {
      "distribution": "internal",
      "autoIncrement": true,
      "environment": "production",
      "node": "22.13.0",
      "pnpm": "11.18.0",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    }
  }
}
```

| Field | Why |
|---|---|
| `cli.version` | An older CLI gets a clear refusal instead of an unexplained build failure. |
| `cli.appVersionSource: "remote"` | EAS owns `versionCode` and `buildNumber`; `app.json` keeps only the human-readable `version`. No commit every time a build number moves. |
| `autoIncrement` | Stores reject a repeated build number. This is the cheap way never to meet that. |
| `environment: "production"` | **Not redundant — load-bearing.** With `distribution: "internal"`, EAS's heuristic resolves the `preview` environment *regardless of the profile being named `production`*. Without this line the Supabase variables are simply absent, and `lib/config.ts` throws at startup naming one of them. **Learn the shape of this failure**: the build is green, the crash is at launch, and it reads as a bad build rather than a resolved environment. |
| `node`, `pnpm` | EAS wants exact versions. `.nvmrc` says `22` and `packageManager` says `11.18.0`; these pin the builder to the same pair rather than to whatever its image defaults to. |
| `ios.simulator: true` | Builds a simulator `.app`, which needs no Apple Developer account. Set `false` once enrolled. |
| `android.buildType: "apk"` | Directly sideloadable. `app-bundle` for Play. |

Check the profile resolves, and check *which environment* it resolved:

```bash
pnpm --filter mobile exec eas config --profile production --platform android
```

The output names the environment it picked. If it says `preview`, the `environment`
field is missing or misspelled.

## 5. Create the environment variables

The app reads exactly two, both declared in `apps/mobile/lib/config.ts`:

| Variable | |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | The Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key. Row-level security is the boundary, not this key. |

`apps/mobile/.env` is gitignored and **never reaches EAS** (see §7 for why). Without
these the build compiles and the app dies at launch.

```bash
pnpm --filter mobile exec eas env:create \
  --environment production \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value '<value>' \
  --type string --visibility plaintext --scope project --non-interactive
```

Repeat for the key. `plaintext` is correct for both: Expo inlines `EXPO_PUBLIC_*` into
the JS bundle that ships inside the installed app, so there is nothing here to hide from
a build log that is not already extractable from the APK. A `service_role` key must
never be given the prefix and so can never be one of these.

```bash
pnpm --filter mobile exec eas env:list --environment production --format short
```

Note that `--format short` shortens the *listing*, not the values — it prints them.
Fine for these two, worth knowing before running it on an environment holding a secret.

If they are already present — recent `eas-cli` versions can offer to import a local
`.env` during `eas init` — verify them instead of creating duplicates.

## 6. Icons

`app.json` points at `assets/icon.png` (1024×1024, **no alpha channel**: App Store
review rejects an iOS icon that has one) and `assets/adaptive-icon.png` (1024×1024,
transparent, artwork inside the centre safe zone). Android's ground comes from
`android.adaptiveIcon.backgroundColor`, not from the image, which is what lets a
launcher mask and parallax the two layers.

The ones committed today are placeholders — an amber pin on the ink ground, drawn from
`accent` and `ink` in `packages/tokens/src/colour.ts`. Replacing them is a file
overwrite at the same two sizes; no configuration changes.

## 7. Build

```bash
pnpm --filter mobile exec eas build --profile production --platform android
```

The first Android build asks to generate a keystore. Answer **yes** — EAS stores it and
reuses it forever, and Android refuses to install an update signed with a different key,
which makes the choice effectively permanent. Under `--non-interactive` EAS generates it
without asking.

**What gets uploaded is the working tree, honouring `.gitignore`** — not `HEAD`. So
uncommitted changes *do* go into the build, and gitignored files never do. Two
consequences worth holding onto:

- `apps/mobile/.env` cannot reach the builder. That is why §5 exists.
- `ios/` and `android/` are gitignored, so EAS runs its own prebuild from `app.json`.
  Stale local native folders — after a bundle ID change, say — cannot contaminate a
  cloud build. They do still affect local `expo run:*`; regenerate with
  `pnpm --filter mobile exec expo prebuild --clean`.

Expect **30–60 minutes** for a first build. The published estimate of 10–20 assumes a
warm cache and no large native module; this app compiles MapLibre from source.

Closing the CLI does not stop anything. It waits on a build that is already running on
EAS's servers, so `Ctrl+C` returns your terminal and nothing else:

```bash
pnpm --filter mobile exec eas build:list --limit 5
pnpm --filter mobile exec eas build:view <build-id>
pnpm --filter mobile exec eas build:cancel <build-id>   # what actually stops it
```

When it finishes, the dashboard page carries a QR code and a direct APK link. Scan it
with the phone's camera, or open the same page in the phone's browser and tap the file.

## 8. Smoke test

A green build is not a working app, and the three failures below are distinguishable
only by testing in this order:

1. **Icon and name on the home screen.** Confirms the assets travelled with the upload.
2. **The app opens without a red box.** A native module that failed to link shows here
   and nowhere earlier.
3. **The login screen reaches Supabase.** Sign in with deliberately wrong credentials:
   the right answer is an *invalid credentials* error. A **network** error means the
   variables are present but wrong. Their being *absent* cannot produce this — the app
   would already have crashed at step 2, naming the variable.

## Deliberately not configured

- **No `submit` block.** Store uploads need the paid accounts first.
- **No `development` or `preview` profile.** A dev build comes from
  `pnpm --filter mobile ios|android` locally, at no EAS cost. A `developmentClient`
  profile earns its place when a device needs one and cannot be plugged in.
- **No splash screen.** In SDK 57 that is the `expo-splash-screen` config plugin, not a
  bare `splash` key, and the plugin is not a dependency here.
- **No iOS build yet.** The configuration is in place and untried. Note that the Xcode
  26.2 defect described in `AGENTS.md` is a property of a *toolchain*, not of this
  machine — if an EAS image ever ships it, an EAS iOS build meets the same ambiguous
  `abs` error, in a package nobody here wrote.

## When to revisit

| Change | What to do |
|---|---|
| Supabase project moves, or the key is rotated | `eas env:update`. Builds already installed keep the old value until rebuilt. |
| A second environment (staging) appears | Create the variables again for it — EAS copies nothing between environments — and add a profile pointing at it. |
| Publishing to Play Store | `android.buildType` → `app-bundle`, add a `submit` block. |
| Publishing to the App Store, or testing on a real iPhone | Enrol in the Apple Developer Program, set `ios.simulator` → `false`. |
| A new machine | Nothing. Credentials and variables live on EAS; `pnpm install` and `eas login` is the whole setup. |
