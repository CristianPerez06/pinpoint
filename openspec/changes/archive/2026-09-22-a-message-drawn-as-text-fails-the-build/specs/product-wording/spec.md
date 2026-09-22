## ADDED Requirements

### Requirement: A named sentence used as text without being resolved fails the build

A value that names a sentence SHALL NOT be usable where a sentence is expected without
first being resolved. An automated check SHALL fail the build when one is placed into text
being assembled, or joined onto text, rather than resolved to the words it names. The
failure SHALL name the file and the position.

This SHALL cover both applications and every package under `packages/`.

The check SHALL NOT fail on a number used in the same position. A value formatted from
stored data — a day, a price, a count — is placed into a sentence as a matter of course,
and a check that refused it would be suppressed wholesale and then protect nothing.

Rationale: a name and the sentence it stands for are different things, and only one of
them is words. Using the name where the words belong produces neither a blank nor an
error: it draws a fixed piece of nonsense — `[object Object]` — which is legible as a
defect only to somebody who already knows this arrangement exists. Two shipped that way,
both in labels a screen reader announces and a person looking at the phone never sees.

Rationale: this is deliberately not the check that reads the repository as text. That one
answers whether a name has a sentence and whether a sentence has a user, which are
questions about what is written down. Whether a particular value has been turned into
words *at the point it is drawn* is a question about what that value is, which only the
type system can answer, and it cannot be answered by reading text at all.

Rationale: it covers the shared packages because that is where these names are made and
handed around, and because it is cheapest to hold now — the amount this has to check grows
with every sentence the product learns to say, and an unresolved name in an accessibility
label is invisible to every reviewer who checks by looking.

#### Scenario: A name placed into text

- **WHEN** a value naming a sentence is placed into text being assembled, without being
  resolved
- **THEN** the build fails, naming the file and position

#### Scenario: The same name resolved first

- **WHEN** that value is resolved to its sentence before being placed into the text
- **THEN** the build passes

#### Scenario: A name joined onto text

- **WHEN** a value naming a sentence is joined onto text rather than placed into it
- **THEN** the build fails in the same way

#### Scenario: A shared package does it

- **WHEN** the unresolved name is used as text inside a package under `packages/` rather
  than inside an application
- **THEN** the build fails there too

#### Scenario: A number in the same position

- **WHEN** a number is placed into text being assembled
- **THEN** the build passes, and nothing has to be suppressed to allow it
