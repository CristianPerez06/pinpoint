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

The shared source SHALL hold that sentence in every language the product is offered in,
and a name SHALL resolve to the sentence belonging to the language in force where it is
drawn. A name SHALL be the same name in every language: what a sentence is called SHALL
NOT depend on which language it is being said in.

Every language SHALL hold a sentence for every name. A language holding fewer names than
another SHALL be a failure rather than something resolved to a blank, or to another
language's words, at the moment somebody reads it.

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

Rationale for a complete catalogue rather than a fallback: a missing sentence that falls
back to another language is a defect that renders. It draws words somebody can read, on a
screen that otherwise looks finished, so nobody reports it and nobody looking for it finds
it — whereas a missing sentence that fails is found once, by the person who forgot it,
before anyone else sees the screen.

#### Scenario: The same event on both platforms

- **WHEN** the same event is reported on the phone and on the laptop
- **AND** both are in the same language
- **THEN** both resolve the same name
- **AND** both show the same sentence

#### Scenario: A sentence is reworded

- **WHEN** the words of an existing sentence are changed
- **THEN** its name is unchanged
- **AND** no code that reports that event is edited

#### Scenario: The shared source is inspected

- **WHEN** the package holding the sentences is inspected for what it exports
- **THEN** it exports no component and nothing either application renders directly

#### Scenario: The same name in two languages

- **WHEN** the same event is reported to one person reading English and another reading
  Spanish
- **THEN** the same name is resolved for both
- **AND** each reads the sentence belonging to their own language

#### Scenario: A language missing a sentence

- **WHEN** a language is added or edited so that it holds no sentence for some name
- **THEN** that is a failure
- **AND** nothing falls back to another language's words

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

Text a person entered SHALL NOT be translated, and SHALL be shown in every language
exactly as it was entered.

The attribution required for the tile data SHALL NOT be held as a named sentence either,
and SHALL NOT be reworded. It is a condition of using the data and has a fixed form. It
SHALL NOT be translated.

Rationale: stating this now is what stops the list becoming the place text goes. The
boundary is not obvious from either side — a city name and a refusal about a city name sit
next to each other in the same form — and a person's own words placed under a name is a
person's own words queued up to be rewritten.

A value formatted from stored data — a day, a price, a currency's name — is neither a
named sentence nor a person's own text. It is worded by the capability that defines it,
which already requires both applications to produce the identical string from the identical
stored value without consulting the device. That deferral has now expired: such a value
SHALL be worded in the language in force, from one definition per language, and the
capability defining it SHALL say what each language's wording is. What does not change is
where the wording lives, or that the device is not asked — the two applications SHALL
still produce the identical string from the identical stored value and the identical
language.

#### Scenario: A city somebody named

- **WHEN** a city name a person typed is shown
- **THEN** it is shown as entered
- **AND** it has no entry in the shared source of sentences

#### Scenario: A person's own words in the other language

- **WHEN** the language is changed while a place somebody named and noted is on screen
- **THEN** that name and that note read exactly as they were entered
- **AND** only the words the product wrote around them change

#### Scenario: The tile attribution

- **WHEN** the map's attribution is drawn
- **THEN** its text is the fixed form the data requires
- **AND** it is not resolved from the shared source of sentences
- **AND** it is the same text in every language

#### Scenario: A day or a price under a second language

- **WHEN** a day or a price is shown in a language other than English
- **THEN** it is worded in that language, from the definition held by the capability that
  defines it
- **AND** the phone and the laptop produce the identical string for that stored value and
  that language

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

### Requirement: The product is offered in more than one language, and a person chooses which

Both applications SHALL be offered in English and in Spanish, and SHALL say everything
they say in the language in force.

Both applications SHALL offer an explicit choice between following the device, English and
Spanish. The choice SHALL be remembered on the device it was made on, and SHALL survive a
reload, a restart and a cold launch. Following the device SHALL be available as a choice
rather than only as the absence of one, and SHALL remain the behaviour when nothing has
been chosen.

Where following the device is in force, the language the device or the browser asks for
SHALL choose between the languages the product is offered in. Where it asks for one the
product is not offered in, English SHALL be used.

**The device SHALL be consulted for nothing else.** It SHALL NOT be consulted for how a
day, a price, a number or a currency is written, and it SHALL NOT be consulted at all
where a language has been chosen explicitly.

A change of language SHALL take effect across every surface together. There SHALL be no
moment, including the first frame after a load or a launch, at which one surface is drawn
in one language and another in the other.

Where the host is told what language a document is in, it SHALL be told the language in
force rather than a fixed one.

Rationale: the device is asked once, to make a first launch land in a language somebody
reads, and is then out of the way. Consulting it for anything after that reintroduces
precisely the failure the day and price wordings were written to prevent — a phone set to
one language and a laptop set to another disagreeing about the same stored trip, which
reads as two people looking at two different plans.

Rationale for the three-valued choice rather than two: the same argument the ground
already makes. A stored language cannot be told apart from a device that happens to agree
with it, and the difference is what makes *follow the device* expressible at all.

#### Scenario: A first launch on a device set to Spanish

- **WHEN** a person opens either application for the first time
- **AND** their device or browser asks for Spanish
- **THEN** the application is in Spanish

#### Scenario: A first launch on a device set to a language the product does not offer

- **WHEN** a person opens either application for the first time
- **AND** their device or browser asks for a language the product is not offered in
- **THEN** the application is in English

#### Scenario: A person chooses a language explicitly

- **WHEN** a person chooses English or Spanish in either application
- **THEN** that application says everything in that language
- **AND** it does so regardless of what the device asks for

#### Scenario: The choice outlives the session

- **WHEN** a person has chosen a language, and later reloads the page or launches the
  application again from cold
- **THEN** the application is in the chosen language from its first frame
- **AND** no other language is drawn first

#### Scenario: The language changes

- **WHEN** a person changes the language while looking at the product
- **THEN** every surface changes together
- **AND** no surface is left in the previous language

#### Scenario: The device is set to another language after a choice was made

- **WHEN** a person has chosen a language explicitly
- **AND** their device is later set to a different one
- **THEN** the application stays in the chosen language

#### Scenario: A stored value under two devices

- **WHEN** one person's phone and another person's laptop are set to different device
  languages
- **AND** both are reading the same trip in the same chosen language
- **THEN** every day and every price reads identically on both

#### Scenario: The document declares its language

- **WHEN** the product is drawn where the host is told what language a document is in
- **THEN** it is told the language in force

### Requirement: Words written into a component fail the build

Words a person reads SHALL NOT be written into a component. This SHALL cover both words
drawn on a screen and words only a screen reader announces — the name given to a control,
and the text standing in a field before it is filled.

An automated check SHALL fail the build when words are written into a component, naming
the file and the position. It SHALL cover both applications.

The check SHALL permit what is not words: punctuation, a separator, a symbol standing
between two values. What it permits SHALL be written down, and SHALL stay short enough to
read.

Rationale: this is the half of the arrangement nothing was watching. A name with no
sentence already fails, and a sentence with no name already fails, but words never given a
name at all are invisible to both — they are simply a component that works. Every one of
them is a sentence one language has and the other does not, found by whoever is reading
the product in the language that does not have it.

Rationale for a check about *position* rather than about what a string means: whether a
run of characters is English prose cannot be decided by reading it. A check that guessed
would flag a style name, a fixture, a web address and the word `button`, would need a list
of exceptions to stay usable, and a list of exceptions is where a check goes to die.
Whether there is a literal in the place a sentence is drawn has a definite answer.

Rationale for what it does not catch, stated so nobody reads it as more than it is: a
sentence assembled somewhere else and handed to a component passes it. The check sees the
drawing, not the assembling. It is worth having anyway, because writing words straight
into the markup is how nearly all of them arrive, and because text a person typed reaches a
component as a value rather than as written-out words and so cannot trip it — which is what
keeps the list of permitted things about punctuation instead of becoming the place
somebody's name goes.

#### Scenario: Words written between elements

- **WHEN** a component is written with words a person reads between its elements
- **THEN** the build fails, naming the file and the position

#### Scenario: Words written as a control's name

- **WHEN** a component is written with words that name a control for a screen reader, or
  that stand in a field before it is filled
- **THEN** the build fails in the same way

#### Scenario: The same words resolved from a name

- **WHEN** those words are resolved from the shared source instead
- **THEN** the build passes

#### Scenario: A separator between two values

- **WHEN** a component draws punctuation or a separator that is not words
- **THEN** the build passes
- **AND** what was permitted is written down

#### Scenario: Text a person typed

- **WHEN** a component draws a trip's name, a place's note or a city's name
- **THEN** the build passes
- **AND** nothing had to be added to what the check permits
