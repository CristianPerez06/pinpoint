## ADDED Requirements

### Requirement: The repository root is not an application project, and a tool that treats it as one is caught

The repository root manifest SHALL declare no runtime dependencies. The root is a
workspace container and a home for tooling; every runtime dependency belongs to the
application or package that bundles it.

No generated native build output — an `ios/` or `android/` directory produced by a
native build toolchain — SHALL exist at the repository root. Such output belongs to
the application it was generated for.

Both SHALL be enforced by an automated check rather than by convention, because an
application toolchain run from the wrong directory produces exactly this state
without reporting an error, and the repository's ignore rules hide part of it from
the working tree.

That check SHALL run when workspace dependencies are installed, and not only in
continuous integration. A toolchain that mistakes the root for an application
installs dependencies as part of its own work, so the install is the earliest
moment the mistake can be named, and naming it there SHALL stop that install
rather than report on it afterwards. Waiting for continuous integration defers the
failure to a proposed change, by which point it is an unexplained difference in
unrelated work.

Running at install time is a second place to fail, not the only one. An install
that has nothing to do may do nothing at all, and a marker left behind by an
earlier mistake SHALL still be caught by the check as it runs in continuous
integration and in the repository's single local verification command.

When the check fails it SHALL name what was found, and SHALL state both how to undo
it and the correct directory from which to run the command that caused it. A guard
that reports only that something is wrong leaves the person who tripped it to
rediscover the cause that the guard already knows.

#### Scenario: An application toolchain is run from the repository root

- **WHEN** a native build command that belongs to an application is run from the repository root
- **AND** it adds that application's dependencies to the root manifest and installs them
- **THEN** the install fails
- **AND** the failure names the dependencies that were added and the directory the command should have been run from

#### Scenario: Generated native output is left at the root

- **WHEN** an `ios/` or `android/` directory exists at the repository root
- **THEN** the check fails, whether or not the repository's ignore rules conceal that directory from the working tree
- **AND** the failure names the directory and says to remove it

#### Scenario: A clean workspace is installed

- **WHEN** a contributor installs workspace dependencies on a checkout with no such output and no root runtime dependencies
- **THEN** the check passes and the install proceeds
- **AND** the check requires nothing to be installed in order to run

## MODIFIED Requirements

### Requirement: Automated checks gate every change

Continuous integration SHALL run on every proposed change and on every commit to the default branch, and SHALL verify: linting and typechecking for each application, a production build of the web application, the shared packages' tests, that the lockfile is current with respect to every manifest in the workspace, that no dually-bundled runtime dependency is duplicated, that the repository root declares no runtime dependencies and holds no generated native build output, and that the workspace dependency graph contains no cycle.

Checks SHALL NOT require credentials for external services. Where a build step demands configuration values, placeholders SHALL be used and no external service SHALL be contacted.

#### Scenario: A change updates a dependency without updating the lockfile

- **WHEN** a contributor edits a manifest and does not commit the resulting lockfile change
- **THEN** the install step fails in continuous integration
- **AND** the change cannot merge

#### Scenario: Continuous integration runs without secrets

- **WHEN** the web application's production build runs in continuous integration
- **THEN** it completes using placeholder configuration values
- **AND** no request is made to any external service

#### Scenario: A change carries application dependencies at the repository root

- **WHEN** a proposed change adds runtime dependencies to the root manifest
- **THEN** continuous integration fails
- **AND** the change cannot merge
