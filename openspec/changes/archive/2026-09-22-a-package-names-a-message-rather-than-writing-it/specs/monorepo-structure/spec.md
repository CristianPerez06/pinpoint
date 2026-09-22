## ADDED Requirements

### Requirement: A shared package hands over an identifier, never a sentence written for a person

No package under `packages/` SHALL return, export, or hold text written to be read by
somebody using the product. Where a shared package has something to report — a refusal, a
failure, a conflict, what a value is called — it SHALL hand over a stable identifier, and
the values to be placed into the sentence where the sentence needs them. Each application
SHALL resolve that identifier to words at the point it draws them.

The one shared package holding the words themselves is exempt, and is exempt because it is
the destination: it holds sentences under names and resolves one when asked, and it renders
nothing.

This is the same boundary as the rule above it, drawn around a different thing. A rendering
library is refused from a shared package because it resolves on one platform and not the
other; a sentence is refused because it resolves for one reader and not another, and the
package cannot tell which reader it has. Both are decisions a shared package is not in a
position to make, and both look harmless at the call site — a string is valid whatever it
says.

An identifier SHALL be what any branching is done on. No code SHALL decide what to do by
matching the text of a message, because text is not a contract and the first rewording
silently breaks the branch.

**A value a shared function formats from stored data is not covered by this requirement**,
and the exclusion is deliberate rather than an omission. A day written as `28 Sept – 3 Oct
2027` and a currency named beside its three-letter code are text somebody reads, but they
are governed by the capabilities that define them — which require, for reasons that have
nothing to do with language, that both applications produce the identical string from the
identical stored value and that neither takes its wording from the device. Bringing them
under this rule means answering that first, so they come under it in the change that gives
them a second language, and not before.

#### Scenario: A day written by shared code

- **WHEN** a shared function formats a stored day for display
- **THEN** it is not in breach of this requirement
- **AND** what it produces is governed by the capability defining that wording

#### Scenario: A shared operation reports a failure

- **WHEN** an operation in a shared package fails
- **THEN** what it returns identifies the failure
- **AND** it contains no sentence written for a person

#### Scenario: A shared package is inspected for text

- **WHEN** a package under `packages/` is inspected, other than the one holding the words
- **THEN** it holds no sentence written to be read by somebody using the product

#### Scenario: A branch on what happened

- **WHEN** code decides what to do about a reported outcome
- **THEN** it branches on the identifier
- **AND** it does not match the text of any message

#### Scenario: A sentence is reworded

- **WHEN** the words behind an identifier are changed
- **THEN** no shared package is edited
- **AND** no branch changes behaviour
