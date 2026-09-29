## MODIFIED Requirements

### Requirement: What a person typed is never held as a named sentence

Text a person entered SHALL NOT be held in the shared source of sentences, and SHALL NOT
be given a name. This covers trip names, place names and notes, links, city names, and the
names members are called on a trip.

Text a person entered SHALL NOT be translated, and SHALL be shown in every language
exactly as it was entered.

The attribution required for the tile data SHALL NOT be held as a named sentence either,
and SHALL NOT be reworded. It is a condition of using the data and has a fixed form. It
SHALL NOT be translated.

The text of an email the authentication service sends SHALL NOT be held as a named
sentence either. It is written into the service's email template, and is sent in Spanish
only, whatever language the recipient reads the product in. Rationale: that template is
not drawn by either application, and the service keeps one version of each email with no
way to learn which language the recipient chose, since that choice lives on their device.
Holding the words under a name would not change what is sent. This is temporary. Sending
each person the email in their own language belongs with a real email service (#78), and
when that lands, this paragraph is replaced by the rule it follows.

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

#### Scenario: The password reset email

- **WHEN** a person using the product in English asks for a password reset code
- **THEN** the email they receive is in Spanish
- **AND** its words are not resolved from the shared source of sentences

#### Scenario: A day or a price under a second language

- **WHEN** a day or a price is shown in a language other than English
- **THEN** it is worded in that language, from the definition held by the capability that
  defines it
- **AND** the phone and the laptop produce the identical string for that stored value and
  that language

