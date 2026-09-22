## 1. Type information in the two applications

- [x] 1.1 Add a TypeScript-files configuration object to `apps/web/eslint.config.mjs` setting `parserOptions.projectService` and `tsconfigRootDir`, and verify `pnpm --filter web lint` still passes with the preset's own rules unchanged
- [x] 1.2 Do the same in `apps/mobile/eslint.config.js`, keeping the existing icon-barrel rule intact, and verify `pnpm --filter mobile lint` passes
- [x] 1.3 Turn on `@typescript-eslint/restrict-template-expressions` and `@typescript-eslint/restrict-plus-operands` in both, at their default options, and verify both apps lint clean

## 2. A linter for the shared packages

- [x] 2.1 Add `scripts/**/*.ts` to `include` in `packages/tokens/tsconfig.json` and verify `pnpm --filter @pinpoint/tokens typecheck` passes with `derive.ts` now in the project
- [x] 2.2 Add `eslint` and `typescript-eslint` as dev dependencies of the root manifest and verify `pnpm check:root-prebuild` and `pnpm check:duplicate-deps` still pass
- [x] 2.3 Write the root lint configuration — the TypeScript parser, the project service, and the two rules, scoped to `packages/` — with a comment recording why it is one file at the root rather than eight, and why the packages have no framework rules
- [x] 2.4 Add a `lint:packages` script to the root manifest and verify it runs clean over all eight packages

## 3. Wiring it in

- [x] 3.1 Add `lint:packages` to `pnpm verify`, placed with the other fast checks, and verify `pnpm verify` passes end to end
- [x] 3.2 Add the matching step to `.github/workflows/ci.yml` beside the two applications' lint steps, as `AGENTS.md` requires of every new CI step

## 4. Proving the guard works

- [x] 4.1 Introduce one unresolved message in a template literal in an application, confirm `pnpm lint` fails naming the file and the `Message` type, then remove it
- [x] 4.2 Do the same inside a package, confirm `pnpm lint:packages` fails there, then remove it — the two configurations are separate and only one of them has been proved by 4.1
- [x] 4.3 Introduce the same mistake written with `+`, confirm it fails, then remove it
- [x] 4.4 Confirm a number in a template literal still passes and needs no suppression

## 5. Looking at the running applications

- [x] 5.1 Run the web app and the phone app and confirm both start and render as before — no source file should have changed, so any difference is a defect in this change
- [x] 5.2 On the phone, open a trip's People sheet and the attribution sheet — the two places #215 names — and confirm the screen-reader labels read as sentences, with no `[object Object]` and no bare name such as `markerType.temple`

## 6. Finishing

- [x] 6.1 Run `openspec validate a-message-drawn-as-text-fails-the-build --strict` and confirm it passes
- [x] 6.2 Archive on the same branch once the tasks are done, then present `findings.md`
