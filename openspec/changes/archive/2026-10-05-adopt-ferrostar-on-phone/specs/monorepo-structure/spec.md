## ADDED Requirements

### Requirement: A native package that is not published is built once and installed ready-made

When an application needs a third-party package with native code that its authors have
not published, the package SHALL be built from a pinned, tagged release of its source by
a script committed to the repository's automation, and SHALL be installed from the
ready-made archive that script produces. The application's manifest SHALL name that
archive by an address that pins its exact contents, so that two installs cannot receive
different builds under the same name.

Installing the workspace SHALL NOT require the toolchain that builds such a package. Only
the person who rebuilds the archive needs it, and the script SHALL say what it needs and
fail naming whatever is missing.

The archive SHALL be downloadable without credentials, so that continuous integration
installs it exactly as a contributor does.

Where the package refers to another unpublished package by name, the application SHALL
supply that package from its own archive, and the built package SHALL ask for it as
something the application provides rather than something it fetches itself. Neither
SHALL be done by relaxing the package manager's refusal to fetch a dependency's own
dependencies from an arbitrary address: that protection holds for the whole workspace,
and one package's convenience is not a reason to lift it.

Such a package SHALL be a dependency of the one application that uses it, and of no
shared package.

When the authors publish the package, the archive SHALL be replaced by the published
version in a single change.

Rationale: building a native package from source needs a compiler toolchain for each
platform, which is far more than anyone installing the workspace has or should need. The
script is what makes the archive reproducible rather than a file of unknown origin.

#### Scenario: A contributor installs the workspace

- **WHEN** a contributor without the package's build toolchain installs the workspace
- **THEN** the install succeeds
- **AND** the application builds with the package present

#### Scenario: One unpublished package needs another

- **WHEN** a built package needs another package that is also unpublished
- **THEN** the application supplies it from its archive
- **AND** the workspace still refuses a dependency's own dependency from an arbitrary address

#### Scenario: Continuous integration installs the workspace

- **WHEN** continuous integration installs the workspace with no credentials
- **THEN** the archive is downloaded and installed

#### Scenario: The archive is rebuilt

- **WHEN** a contributor runs the build script on a machine missing part of its toolchain
- **THEN** it fails before building anything
- **AND** the failure names what is missing

#### Scenario: A shared package reaches for it

- **WHEN** a package under `packages/` declares or imports such a package
- **THEN** the change is rejected as a violation of the portability boundary

#### Scenario: The authors publish it

- **WHEN** the package becomes available from the registry
- **THEN** the application's manifest names the published version
- **AND** the archive is no longer referred to

### Requirement: A screen built to try something out is not reachable in a build anyone installs

A screen that exists only to try something out in development SHALL be reachable only in
a development build. In any other build, including through a link that names it, it SHALL
draw nothing of its own and SHALL send the person to the map.

It SHALL NOT be offered by any control in the application. It SHALL be reached by a link.

Its words SHALL follow the same rules as every other screen's.

Rationale: a development build and an installed one run the same code, so a screen left
reachable is one a link can open for anyone. Keeping it out of every menu also keeps it
from becoming a feature nobody decided to ship.

#### Scenario: Opened in a development build

- **WHEN** a developer opens the trial screen's link in a development build
- **THEN** the trial screen is shown

#### Scenario: Opened in an installed build

- **WHEN** the same link is opened in a build that is not a development build
- **THEN** the map is shown
- **AND** nothing of the trial screen is drawn

#### Scenario: Looking for it in the application

- **WHEN** a person looks through every screen and menu of the application
- **THEN** no control leads to the trial screen
