## 1. The wording package

- [x] 1.1 Create `packages/wording` following the shape of `packages/tokens` — same
  `package.json` fields, `main` pointing at source, its own `tsconfig.json` and test
  script — declaring no runtime dependencies; verify `pnpm --filter @pinpoint/wording
  typecheck` passes and `pnpm check:cycles` still succeeds
- [x] 1.2 Define `Language` with one member, `Message` as `{ key, values? }`, the
  `MessageKey` union, and `say(language, message)`; verify a unit test covers a plain
  sentence, a sentence taking a value, and that an unknown key fails to typecheck
- [x] 1.3 Move every fixed sentence into the catalogue under its name — the eighteen
  `*_MESSAGE` constants in `packages/data/src/{trips,cities,markers,interest}.ts`,
  `AUTH_FAILURE_MESSAGES` in `packages/supabase/src/auth-errors.ts`, and the four wording
  modules in `packages/core` (`city-wording`, `invitation-wording`, `empty-field-wording`,
  and the refusal sentences only — **not** `day-wording`, which is out of scope per
  `design.md`); verify the snapshot test lists every key against its English and the diff
  reads as a table
- [x] 1.4 Add an entry per marker type identifier, carrying the words currently in
  `MARKER_TYPES[].label`; verify the snapshot test shows all eight unchanged
- [x] 1.5 Add `@pinpoint/wording` to `transpilePackages` in `apps/web/next.config.ts` —
  a missing entry fails the build with an unhelpful parse error — and verify `pnpm build`
  succeeds

## 2. Shared packages report names

- [x] 2.1 Change `WriteOutcome`'s `rejected` and `conflict` and `QueryState`'s `failed` to
  carry `reason: Message` in place of `message: string`, renaming the field so the compiler
  names every consumer; verify `pnpm typecheck:packages` fails at each site rather than
  anywhere silently succeeding
- [x] 2.2 Update `packages/data` so every read and write reports a name, and delete the
  eighteen constants; verify `pnpm --filter @pinpoint/data test` passes and the package
  holds no sentence
- [x] 2.3 Replace the `zod` messages in `packages/core` with names, keeping `FieldErrors`
  as the shape a form consumes; verify `refusal-messages.test.ts` still asserts every
  refusable field answers, and that it asserts a *name* rather than a sentence
- [x] 2.4 Convert `city-claim.ts` to report `{ key, values }` with the city name as a
  value rather than joined into the sentence; verify its tests cover the one-city and
  several-cities wordings
- [x] 2.5 Replace `AUTH_FAILURE_MESSAGES` and `authFailureMessage` in
  `packages/supabase` with the catalogue entries, leaving `authFailureOf` and the code
  mapping untouched; verify `packages/auth`'s `rejected(failure, …)` now carries only the
  failure identifier
- [x] 2.6 Delete `label` from `MarkerTypeDefinition` and from all eight entries in
  `packages/map/src/marker-type.ts`; verify `packages/map/package.json` still declares no
  runtime dependencies and the package imports nothing new

## 3. The applications say it in words

- [x] 3.1 Resolve names to sentences everywhere `apps/web` shows a failure, a refusal, a
  conflict or a marker type's name; verify `pnpm lint && pnpm typecheck` pass and no call
  site holds a sentence that came out of a package
- [x] 3.2 The same for `apps/mobile`, including the marker type names in the capture form
  and the filter; verify `pnpm lint:mobile && pnpm typecheck:mobile` pass
- [x] 3.3 Confirm both applications pass the single `Language` constant at each call site
  rather than defaulting it inside `say`, so change 2 replaces a value and not a signature

## 4. The check

- [x] 4.1 Write `.github/scripts/check-wording.mjs` reading the repository: fail on a key
  nothing defines, a sentence nothing resolves, a marker type with no entry, and a key
  assembled from a variable rather than written as a literal; verify its own
  `check-wording.test.mjs` covers all four failures and the passing case
- [x] 4.2 Wire it into `pnpm verify` among the fast checks and into the CI workflow —
  both, per `comment:verify`; verify `pnpm verify` runs it before the build steps

## 5. Looking at it

- [x] 5.1 On the laptop, provoke a refused save, a stale-edit conflict, a failed load and
  an invalid form field, and confirm each reads exactly as it did before this change
- [x] 5.2 On the phone, do the same, and confirm the marker type names read correctly in
  the capture form, the filter and a place's card — this is where a resolved-to-nothing
  key shows as a blank rather than as an error. **Done by the user.** The app was launched
  on the booted simulator against today's code and the map, pins, header and attribution
  were confirmed by screenshot; driving the sheets from here could not be made to work, so
  the four surfaces were handed over
- [x] 5.3 Sign in with a wrong password and confirm the authentication failures still read
  as their own sentences rather than the generic one. **Done by the user.** Provoking it
  from here meant signing the session out with no way to restore it; covered by
  `auth-errors.test.ts`, which resolves every failure to a sentence and resolves the words
  before asserting that a failed sign-in does not reveal whether an account exists
- [x] 5.4 Run `openspec validate a-package-names-a-message-rather-than-writing-it --strict`
  and `pnpm verify`, and confirm both pass
