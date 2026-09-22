## Context

See `proposal.md` — Why. What shapes the approach is three measurements taken before this
was written, not guesses:

- **Neither application asks the linter to understand types.** `eslint-config-next/typescript`
  and `eslint-config-expo/flat` both stop short of it; neither sets `projectService` or
  `parserOptions.project`. Without type information the rules this change needs cannot run
  at all, which is why the ticket suspected the wiring would be the bulk of the work.
- **The shared packages are linted by nothing.** There is no `eslint.config.*` under
  `packages/`, no `lint` script in any of the eight manifests, and no step for them in
  `.github/workflows/ci.yml`. CI does typecheck them and run their tests.
- **There is nothing to fix.** Both rules were run across `apps/web`, `apps/mobile` and all
  eight packages: zero violations. On a deliberately bad line the rule reports
  `Invalid type "Message" of template literal expression`, naming the type by name.

## Goals / Non-Goals

**Goals:**

- The two rules run over both applications and all eight shared packages, in `pnpm verify`
  and in CI.
- The guard is proved to work, once, rather than assumed to.

**Non-Goals:**

- Any other rule for the shared packages. They acquire a linter in this change; deciding
  what else it should say about them is a separate conversation with a separate argument.
- Tightening the rules past their defaults — see the decision on options below.
- Anything in #45.

## Decisions

### Type information comes from the project service, not a list of projects

`parserOptions.projectService: true` rather than `project: [...]`. The service finds the
`tsconfig.json` that owns each file, so nothing has to enumerate projects and nothing rots
when a file moves. The alternative is a hand-maintained list per configuration, which is
the same shape as the `paths` entries `AGENTS.md` already refuses for workspace packages,
and for the same reason: a second list of where things are, drifting from the first.

Both applications already load the TypeScript parser through their presets, so each gets
one added configuration object naming the TypeScript files and setting the parser options.
The presets' own rules are untouched.

### One lint configuration at the repository root serves all eight packages

Not eight configurations and eight `lint` scripts. The packages need no framework rules —
no React, no Next, no Expo — so the entire content is a parser, two rules, and the files
they apply to. Eight copies of that is eight things to edit in step.

`tsconfig.base.json` is the precedent: shared tooling configuration at the root, extended
by everything under it. `AGENTS.md`'s rule is that no *product code* lives at the root, and
a lint configuration is no more product code than that file is. The root manifest gains
`eslint` and `typescript-eslint` as **dev** dependencies, which leaves *"the repository root
declares no runtime dependencies"* untouched.

One root script — `lint:packages` — runs it over `packages/`.

### The rules keep their default options

`restrict-template-expressions` allows numbers, booleans, nullish values and regular
expressions by default. Numbers are the one that matters: `${count} places` is ordinary and
correct, and a rule that refused it would be turned off wholesale within a week and then
protect nothing. The defaults draw the line in the right place for what this guards — an
object where words belong.

The defaults also allow `any`, which is a genuine hole: a value the compiler has lost track
of passes. Tightening that is a different argument about a different problem, it would
report on files this change has no business editing, and it is not what shipped
`[object Object]` twice. Left alone deliberately rather than by omission.

### `restrict-plus-operands` goes in beside it

The same defect written with `+` instead of a template produces the identical
`[object Object]`, and the template rule cannot see it. It was measured clean across the
whole workspace, so it costs nothing today and closes the other half of the same door.

### `@pinpoint/tokens`' build script joins the typechecked set

`packages/tokens/tsconfig.json` includes `src/**/*.ts` only, so `scripts/derive.ts` — the
script that generates every token file — belongs to no TypeScript project. The parser
refuses a file it cannot place, so the check cannot read it.

Adding `scripts/**/*.ts` to that `include` fixes it, and was verified to typecheck cleanly
as it stands. The alternative, excluding the file from linting, would leave the one script
that writes generated source as the only thing in the workspace nothing reads at all.

### Proving it works is part of the change, not a follow-up

Because there is nothing to fix, a configuration that silently does nothing would look
exactly like success. So the change deliberately introduces one bad line, watches the build
fail naming it, and removes it — once in an application and once in a package, since those
are two different configurations. `AGENTS.md` asks for exactly this habit with database
behaviour: a probe that reports and then rolls back, rather than reasoning.

## Risks / Trade-offs

- **Linting with type information is slower than without.** → Measured on the phone app:
  the current type-free lint takes about 5s, and the type-aware probe about 3s for one
  rule. Type information is not the dominant cost here, and `pnpm verify` already pays for
  a full typecheck and a production build. No mitigation needed beyond having measured it.

- **A root lint configuration could be picked up by something that did not ask for it.** →
  It is scoped to the package files it names, and both applications keep their own
  configurations, which take precedence when lint runs from their directory. The packages'
  step is a separate script over `packages/` rather than a bare `eslint` from the root.

- **The guard is only as wide as where it runs.** → It runs everywhere TypeScript lives in
  this workspace after this change, and the new CI step is the thing that keeps that true.
  `AGENTS.md` already requires any new CI step to be added to `pnpm verify` as well, which
  is what stops the two drifting.

- **The packages acquire a linter, and with it the temptation to add rules.** → Named as a
  non-goal above so the next change has to argue for them rather than inherit them.
