# product-wording Specification

## Purpose
Every sentence this product says to a person has one name and one source, so that the
same event is worded the same way on the phone and on the laptop, and so that the words
sit somewhere a language can be chosen rather than inside code that has no idea who is
reading.

## Requirements

### Requirement: Every sentence the product says is named, and the names have one source

Each sentence this product says to a person SHALL be held once, in a shared package, under
a stable name. Both applications SHALL resolve a name against that one source.

The name SHALL be what code passes around, and the sentence SHALL be what is resolved from
it at the point something is drawn. A name SHALL be stable across a rewording: changing
what a sentence says SHALL NOT change its name, and SHALL NOT require any code that
reports the event to be edited.

**That package SHALL render nothing.** It SHALL hold the sentences and the means of
looking one up, and SHALL NOT export a component, an element, or anything either
application draws directly. This is the same cut already made for colour and type: one
source of values, two applications rendering them in their own idiom, and nothing
crossing between them.

Rationale: wording was deliberately moved into shared code four separate times, each time
because a sentence written twice agrees on the day it is written and not afterwards — two
applications refusing the same city name had already drifted to differ in their quotation
marks within a day. That property is what this requirement keeps. What it removes is the
assumption baked in beside it, that the one shared copy is in English.

#### Scenario: The same event on both platforms

- **WHEN** the same event is reported on the phone and on the laptop
- **THEN** both resolve the same name
- **AND** both show the same sentence

#### Scenario: A sentence is reworded

- **WHEN** the words of an existing sentence are changed
- **THEN** its name is unchanged
- **AND** no code that reports that event is edited

#### Scenario: The shared source is inspected

- **WHEN** the package holding the sentences is inspected for what it exports
- **THEN** it exports no component and nothing either application renders directly

### Requirement: Shared code reports what happened; the application says it in words

A shared package under `packages/` SHALL report an outcome as a name and, where the
sentence needs them, the values to be placed into it. It SHALL NOT return a sentence
written for a person, and it SHALL NOT resolve one.

The application SHALL resolve that name to a sentence at the point it is drawn.

Rationale: which language somebody reads is not a fact a read or a write can know. A
shared package that resolved its own sentences would have to be handed a language by every
caller of every operation, which gives code deliberately kept free of presentation an
opinion about presentation, in order to answer a question only the surface has. Reporting
a name costs the package nothing and leaves the choice where the choice is.

This is the shape authentication already has, where a failure is identified by a code and
the displayed text is derived from that code rather than from the service.

#### Scenario: A write is refused

- **WHEN** a shared write cannot be applied
- **THEN** the outcome names which refusal it was
- **AND** it carries no sentence written for a person

#### Scenario: A read fails

- **WHEN** a shared read fails
- **THEN** the outcome names the failure
- **AND** the application resolves that name to the sentence it shows

#### Scenario: A sentence that quotes something

- **WHEN** a reported outcome concerns a particular city, place or person
- **THEN** the outcome carries that value beside the name
- **AND** the application places it into the resolved sentence rather than receiving it
  already joined

### Requirement: What a person typed is never held as a named sentence

Text a person entered SHALL NOT be held in the shared source of sentences, and SHALL NOT
be given a name. This covers trip names, place names and notes, links, city names, and the
names members are called on a trip.

The attribution required for the tile data SHALL NOT be held as a named sentence either,
and SHALL NOT be reworded. It is a condition of using the data and has a fixed form.

Rationale: stating this now is what stops the list becoming the place text goes. The
boundary is not obvious from either side — a city name and a refusal about a city name sit
next to each other in the same form — and a person's own words placed under a name is a
person's own words queued up to be rewritten.

A value formatted from stored data — a day, a price, a currency's name — is neither a
named sentence nor a person's own text. It is worded by the capability that defines it,
which already requires both applications to produce the identical string from the identical
stored value without consulting the device. It comes under this capability when it gains a
second wording, and not before.

#### Scenario: A city somebody named

- **WHEN** a city name a person typed is shown
- **THEN** it is shown as entered
- **AND** it has no entry in the shared source of sentences

#### Scenario: The tile attribution

- **WHEN** the map's attribution is drawn
- **THEN** its text is the fixed form the data requires
- **AND** it is not resolved from the shared source of sentences

### Requirement: A name with no sentence, or a sentence nothing uses, fails the build

An automated check SHALL fail when a name used in the repository has no sentence in the
shared source, and when the shared source holds a sentence no code resolves.

The check SHALL read the repository rather than a list kept beside it.

**A name assembled at runtime SHALL be a failure rather than something the check passes
over.** Every name SHALL be written out where it is used. Where one of a set of things
each needs its own name — the marker types are the case — the mapping SHALL be an
exhaustive record from the thing to a written-out name, so that adding one without a
sentence beside it fails to build.

Rationale: a name built from a variable cannot be read by anything that reads text, so a
single such call stops the check being able to answer *either* question — the assembled
name is never checked for existing, and every sentence it might have reached looks unused
and is offered for deletion. It makes the check unsound rather than slightly less
complete, which is why it cannot be tolerated. The exhaustive record that replaces it is
also the better thing to have written: it is the shape both applications already use to
map an icon's name to a glyph, and it fails at the compiler rather than at the screen.

Rationale: the same habit the icon and token checks already follow. A list of known names
kept next to the check is a second list, and the two drift the first time only one of them
is edited — and a check comparing a set of known copies cannot see a copy nobody added to
the list. The failure both halves prevent is silent: a name with no sentence draws nothing
where a sentence belongs, and a sentence nothing uses is a sentence that will be kept
correct, and later translated, for no reason.

#### Scenario: A name with nothing behind it

- **WHEN** code reports an outcome under a name the shared source does not hold
- **THEN** the check fails, naming it

#### Scenario: A sentence left behind

- **WHEN** the shared source holds a sentence no code resolves
- **THEN** the check fails, naming it

#### Scenario: A name introduced without being registered anywhere

- **WHEN** a new name is used in a file the check was not told about
- **THEN** it is still found, because the check reads the repository

#### Scenario: A name built out of a value

- **WHEN** code forms a message name by joining text to a variable
- **THEN** the check fails, naming the file
- **AND** it does not pass the call over as one it cannot read

#### Scenario: One name per member of a set

- **WHEN** each member of a defined set needs a name of its own
- **THEN** the mapping from member to name is exhaustive and each name is written out
- **AND** adding a member without a sentence beside it fails to build
