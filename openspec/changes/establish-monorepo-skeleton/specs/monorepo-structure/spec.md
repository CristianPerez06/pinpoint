## ADDED Requirements

### Requirement: The repository is a single workspace with apps and shared packages

The repository SHALL be a single package-manager workspace containing exactly two kinds of member: applications under `apps/<name>/`, which are deployable and platform-specific, and shared packages under `packages/<name>/`, which are not deployable and are consumed by applications.

Shared packages SHALL be referenced by workspace-internal version specifiers rather than by registry versions or relative file paths, so that a package is always resolved from the working tree and never from a published artifact.

Applications SHALL NOT import from another application. All code shared between applications SHALL live in a shared package.

Product code SHALL NOT live at the repository root. Every source file SHALL reside under an `apps/<name>/` or `packages/<name>/` directory. The root SHALL contain only workspace configuration, tooling configuration, specifications, and repository metadata.

#### Scenario: A shared package is added

- **WHEN** a contributor adds a directory under `packages/`
- **THEN** it is picked up as a workspace member without editing a central registry of packages
- **AND** an application can depend on it using a workspace-internal specifier

#### Scenario: One app tries to import from the other

- **WHEN** code in `apps/web` imports a module from `apps/mobile`, or the reverse
- **THEN** the import does not resolve
- **AND** the contributor must move the shared code into a package under `packages/`

#### Scenario: A contributor adds source at the repository root

- **WHEN** a contributor creates a source directory at the root, such as `lib/` or `components/`
- **THEN** the placement violates this requirement
- **AND** the code is moved into the application or package that owns it

### Requirement: The shared package graph is acyclic and directed away from applications

Dependencies between workspace members SHALL form a directed acyclic graph. No shared package SHALL depend, directly or transitively, on itself.

Dependencies SHALL point in one direction only: applications depend on packages, and packages depend on other packages. No package under `packages/` SHALL import from any application under `apps/`.

The map package SHALL sit at the base of the graph, depending on no other workspace member.

When code that lives inside an application is later needed by the other application, it SHALL be promoted into a shared package and consumed by both. It SHALL NOT be copied into the second application.

#### Scenario: A dependency would introduce a cycle

- **WHEN** a contributor adds a workspace dependency that would make a package reach itself through the dependency graph
- **THEN** the cycle is detected and the change is rejected
- **AND** the shared portion is extracted into a package lower in the graph instead

#### Scenario: A package needs something that lives in an application

- **WHEN** a shared package requires behavior that currently lives under `apps/`
- **THEN** that behavior is moved down into a package rather than imported upward
- **AND** the application consumes it from the package afterwards

#### Scenario: Web-only code becomes needed on mobile

- **WHEN** a module under `apps/web/` is discovered to be needed by `apps/mobile/` as well
- **THEN** it is promoted to a package under `packages/` with its own manifest
- **AND** both applications import it by package name
- **AND** the module is not duplicated into the mobile application

### Requirement: Shared packages are consumed as source, not as build output

Shared packages SHALL expose TypeScript source directly as their entry point and SHALL NOT require a compilation step before an application can consume them. No shared package SHALL produce or publish a build artifact directory.

Applications SHALL be responsible for transpiling the shared source they consume, using their own bundler.

#### Scenario: A shared package is edited during development

- **WHEN** a contributor edits a file inside `packages/<name>/src/` while an application dev server is running
- **THEN** the application picks up the change without a separate package build command
- **AND** no intermediate build output is written into the package directory

#### Scenario: A fresh clone is installed

- **WHEN** a contributor clones the repository and installs dependencies
- **THEN** both applications can be typechecked and built with no package build step in between

### Requirement: Shared packages stay free of platform-specific rendering

No package under `packages/` SHALL depend on, import, or reference a rendering library, UI framework, or platform API that is available on only one of web and native. This includes map rendering libraries, DOM APIs, and native-only modules.

Map behavior that both platforms need — style definitions, camera derivation, and marker geometry — SHALL be expressed as data and pure functions in a shared package. Each application SHALL perform its own imperative binding of that data to its platform's renderer.

The map package SHALL declare no runtime dependencies. A change that requires adding one is a signal that the code belongs in an application instead, and SHALL be justified explicitly.

#### Scenario: Map camera behavior is needed on both platforms

- **WHEN** a feature needs to frame the viewport around a set of markers
- **THEN** the derivation from markers to a camera position is implemented as a pure function in the shared map package
- **AND** each application passes that result to its own map renderer
- **AND** the shared package does not import either renderer

#### Scenario: A contributor adds a renderer import to a shared package

- **WHEN** a module under `packages/` imports a web-only or native-only rendering library
- **THEN** the change is rejected in review as a violation of the portability boundary
- **AND** the logic is relocated into the application that needs it

### Requirement: Both applications demonstrably resolve shared packages

Each application SHALL import from at least one shared package and use its result in a way that fails the build or the typecheck if resolution breaks. An application that depends on a shared package only in its manifest, without importing it, SHALL NOT be considered to satisfy this requirement.

This requirement exists because the two applications use different bundlers with different resolution behavior. A shared package that resolves under one is not evidence that it resolves under the other.

#### Scenario: The mobile application is scaffolded before it has features

- **WHEN** the mobile application exists as a shell with no product functionality
- **THEN** it still imports a shared package and renders a value derived from it
- **AND** breaking workspace resolution causes the mobile typecheck to fail

#### Scenario: Shared package resolution regresses

- **WHEN** a dependency, bundler configuration, or module-resolution setting changes such that an application can no longer resolve a shared package
- **THEN** automated checks fail for the affected application
- **AND** the failure is attributable to that application rather than appearing only at runtime

### Requirement: Exactly one version of each dually-bundled runtime dependency

The workspace SHALL contain exactly one installed version of any runtime dependency that is bundled into more than one application, specifically the React runtime and the React Native runtime.

Applications SHALL pin these dependencies to exact versions rather than to ranges, so that resolution cannot drift between installs.

A dependency bundled into only one application MAY exist at multiple versions in the workspace where a transitive requirement makes that unavoidable, provided the duplication cannot reach a shipped bundle.

#### Scenario: A dependency upgrade introduces a second React version

- **WHEN** a contributor changes a dependency in one application and the install resolves a second version of the React runtime
- **THEN** automated checks fail before the change can merge
- **AND** the failure message identifies the duplicated dependency and the versions installed

#### Scenario: Both applications are upgraded together

- **WHEN** the React runtime is upgraded
- **THEN** both applications are moved to the same exact version in the same change

### Requirement: Configuration values declare their visibility, and secrets never reach a bundle

Every configuration value an application reads SHALL have a declared visibility: **publishable**, meaning it is safe to embed in a shipped client artifact, or **secret**, meaning it is not.

Only publishable values SHALL carry a bundler-public prefix. Both applications' bundlers inline every publicly-prefixed variable into the artifact they emit, so such a value is readable by anyone with the deployed site or the installed application. A secret value SHALL NOT be given a public prefix, and SHALL NOT be read from any code that can reach a client bundle.

Real configuration files SHALL be untracked, and the ignore rule SHALL cover every variant filename the applications' toolchains load, not only the base filename. The committed example file SHALL be explicitly exempted from that rule.

Each application SHALL commit an example configuration file listing every variable it requires, with placeholder values that convey the expected shape rather than being blank.

Every required configuration value SHALL be validated where the application starts. When one is missing or empty, the application SHALL fail immediately with a message naming the variable. An application SHALL NOT assert that a configuration value is present without checking it, because doing so defers the failure to an unrelated-looking error at the point of use.

#### Scenario: A local override file is created

- **WHEN** a contributor creates any local configuration file the toolchain loads, including variant filenames beyond the base one
- **THEN** the file is untracked
- **AND** committing every file in the working tree cannot add it

#### Scenario: A required variable is missing at startup

- **WHEN** an application starts with a required configuration variable unset
- **THEN** it fails immediately
- **AND** the error names the missing variable
- **AND** the failure does not surface as a malformed request, a client construction error, or an authentication failure

#### Scenario: A contributor onboards

- **WHEN** a contributor clones the repository and copies each example configuration file
- **THEN** every variable an application requires is present in the copy
- **AND** each placeholder shows the expected shape of the value

#### Scenario: A value that bypasses access control is introduced

- **WHEN** a configuration value that bypasses database access control is needed by some future server-side workload
- **THEN** it is declared secret, given no public prefix, and read only from code that cannot reach a client bundle
- **AND** it is absent from every example file and from every client-side module

### Requirement: The toolchain is pinned in the repository and consumed by automation

The repository SHALL pin the Node.js runtime version and the package manager version. Both pins SHALL live in the repository, SHALL be discoverable by a contributor's local environment, and SHALL each be declared in exactly one place.

Continuous integration SHALL consume those pins rather than restating a version of its own. A version SHALL NOT be duplicated across jobs.

#### Scenario: A contributor uses a different runtime version

- **WHEN** a contributor's local Node.js version differs from the pinned version
- **THEN** the mismatch is detectable from the repository without consulting the continuous integration configuration

#### Scenario: The runtime version is upgraded

- **WHEN** the Node.js version is upgraded
- **THEN** exactly one file changes
- **AND** every continuous integration job uses the new version without further edits

### Requirement: Automated checks gate every change

Continuous integration SHALL run on every proposed change and on every commit to the default branch, and SHALL verify: linting and typechecking for each application, a production build of the web application, the shared packages' tests, that the lockfile is current with respect to every manifest in the workspace, that no dually-bundled runtime dependency is duplicated, and that the workspace dependency graph contains no cycle.

Checks SHALL NOT require credentials for external services. Where a build step demands configuration values, placeholders SHALL be used and no external service SHALL be contacted.

#### Scenario: A change updates a dependency without updating the lockfile

- **WHEN** a contributor edits a manifest and does not commit the resulting lockfile change
- **THEN** the install step fails in continuous integration
- **AND** the change cannot merge

#### Scenario: Continuous integration runs without secrets

- **WHEN** the web application's production build runs in continuous integration
- **THEN** it completes using placeholder configuration values
- **AND** no request is made to any external service
