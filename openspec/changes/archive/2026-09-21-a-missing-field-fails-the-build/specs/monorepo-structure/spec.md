## ADDED Requirements

### Requirement: A shared write names the fields it accepts

A function in a shared package that writes a record SHALL state which fields it accepts,
so that a caller inside this repository which omits one fails to typecheck, and the
failure names the missing field and the file it is missing from.

The set of fields SHALL be derived from the single definition of that record rather than
restated beside it. Where an application collects those fields from a person, the list it
holds SHALL be derived from that same definition. Adding a field to a record therefore
obliges every application to account for it, in the same change, rather than obliging
whoever made the change to remember every application.

Stating the fields SHALL NOT replace checking the values when the write runs. The two
answer different questions — whether a caller was written correctly, and whether a value
is allowed — and every write SHALL keep both. A caller that is not typechecked SHALL be
refused at the moment of the write exactly as it is today, and what any application
accepts or refuses at runtime SHALL be unchanged by this requirement.

Where a write applies only the fields it is given, leaving the rest as they are, omitting
a field is an instruction rather than an omission and SHALL remain permitted. For such a
write the stated set is what MAY be named, not what MUST be.

This requirement governs the set of fields a write is given, not the controls an
application offers for them. An application supplying a field as empty satisfies it. What
each application must offer a person is governed by the specification of the capability
concerned, and is unaffected.

Rationale: the shared definition of a record exists so that two applications cannot drift
into two definitions. Until now the only thing that noticed a drift was the check made
while the app was running, which happens after the change has shipped and reads to the
person as a save being refused for no reason. A field added to a place was added to one
application and not the other, both applications built cleanly, and every save from the
phone was refused — the failure this states the rule against.

#### Scenario: A field is added to a shared record

- **WHEN** a field is added to the definition of a record that applications write
- **AND** one application is not updated to supply it
- **THEN** that application fails to typecheck
- **AND** the failure names the missing field

#### Scenario: Two applications write the same record

- **WHEN** a field is added to a record both applications write
- **THEN** both applications fail to typecheck until each supplies it
- **AND** neither can be built and shipped while the other is still missing it

#### Scenario: A value that is not allowed is written

- **WHEN** a caller passes a value the record does not allow
- **THEN** the write is refused before the database is contacted
- **AND** the refusal names the field, as it did before this requirement

#### Scenario: A caller outside the typechecked code writes a record

- **WHEN** a write is called with a value that was not checked by the compiler
- **THEN** it is validated at the moment of the write
- **AND** an invalid value is refused rather than stored

#### Scenario: A change is applied to a record that already exists

- **WHEN** a write that applies only what it is given is called with a subset of the fields
- **THEN** it typechecks
- **AND** the fields not given are left as they are
