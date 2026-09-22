## MODIFIED Requirements

### Requirement: Automated checks gate every change

Continuous integration SHALL run on every proposed change and on every commit to the default branch, and SHALL verify: linting and typechecking for each application and for the shared packages, a production build of the web application, the shared packages' tests, that the lockfile is current with respect to every manifest in the workspace, that no dually-bundled runtime dependency is duplicated, that the repository root declares no runtime dependencies and holds no generated native build output, and that the workspace dependency graph contains no cycle.

Checks SHALL NOT require credentials for external services. Where a build step demands configuration values, placeholders SHALL be used and no external service SHALL be contacted.

Rationale for the shared packages being linted rather than only typechecked: until this was stated they were the one part of the workspace nothing read at all, while being the part most code passes through. A rule that holds in both applications and not in the code they share is a rule with a hole in the middle of it.

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

#### Scenario: A shared package breaks a lint rule

- **WHEN** a file under `packages/` breaks a rule the applications are held to
- **THEN** continuous integration fails
- **AND** the change cannot merge
