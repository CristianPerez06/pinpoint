# markers Specification

## Purpose

Define the saved-place model: a marker is somewhere a traveller wants to go, positioned
on the map. Cities group markers coarsely, for deciding which day is spent where; the
map itself answers the finer question of what is close to what, which is the job a
"neighbourhood" column does badly. Types give the map its legibility, and per-member
interest records who actually wants to go.

## Requirements

### Requirement: A marker is a named place with a position on a trip

The system SHALL model a marker with a name, a longitude and a latitude, and the trip it
belongs to. Longitude SHALL be within -180 to 180 and latitude within -90 to 90.

A marker SHALL additionally support an optional free-text note, an optional link, and an
optional price.

The link exists because a saved place is usually found somewhere — a video, an article,
a recommendation — and months later "why did we save this" is answered better by the
source than by a description.

#### Scenario: A marker is created

- **WHEN** a marker is created with a name, a position, and a trip
- **THEN** it is stored and appears among that trip's markers

#### Scenario: A position outside the valid range

- **WHEN** a marker is submitted with a longitude or latitude outside the valid range
- **THEN** it is rejected
- **AND** the rejection names the offending field

#### Scenario: The optional fields are omitted

- **WHEN** a marker is created without a note, a link, or a price
- **THEN** it is valid
- **AND** those fields are recorded as absent rather than as empty text

### Requirement: Cities group markers within a trip, and grouping is optional

The system SHALL model a city as a named grouping that belongs to a trip. A marker SHALL
reference at most one city.

A city SHALL belong to exactly one trip, and SHALL NOT be shared between trips. Two trips
visiting the same place SHALL each have their own city record, so that renaming or
removing one never affects the other.

A marker SHALL be valid with no city. Markers without one SHALL remain visible and
addressable rather than being hidden until they are filed.

#### Scenario: A marker is created without a city

- **WHEN** a marker is created with no city
- **THEN** it is valid
- **AND** it appears among the trip's markers, grouped as unassigned

#### Scenario: The same place name across two trips

- **WHEN** two trips each have a city with the same name
- **THEN** they are separate records
- **AND** renaming one leaves the other unchanged

#### Scenario: A city is removed while it still has markers

- **WHEN** a city that markers reference is removed
- **THEN** those markers remain
- **AND** they become unassigned rather than being removed with the city

### Requirement: Interest is recorded per member; visited is recorded for the trip

The system SHALL record interest in a marker per member — each person on the trip
independently indicates whether they want to go — and SHALL NOT collapse it to a single
flag on the marker.

A member SHALL have at most one interest record per marker. The absence of a record SHALL
mean undecided, which is distinct from not interested.

The system SHALL record whether a marker has been visited as a single value on the
marker, shared by everyone on the trip, because travelling companions visit a place
together.

#### Scenario: Two members disagree

- **WHEN** one member marks interest in a marker and the other marks disinterest
- **THEN** both records are stored
- **AND** neither overwrites the other

#### Scenario: Undecided is distinguishable from not interested

- **WHEN** a member has expressed nothing about a marker
- **THEN** their state is undecided
- **AND** it is distinguishable from a recorded lack of interest

#### Scenario: A marker is marked visited

- **WHEN** any member of the trip marks a marker visited
- **THEN** it is visited for everyone on the trip
- **AND** there is no per-member visited state

### Requirement: A marker's city belongs to the same trip as the marker

The system SHALL reject a marker that references a city belonging to a different
trip. This SHALL be enforced by the store itself and not only by the code that
writes markers, because more than one application writes and the trip is the
single boundary every access rule resolves to.

A marker whose city reference is rejected SHALL NOT be stored at all, rather than
being stored unassigned. Silently dropping the city would file a place somewhere
the person did not choose and give no sign of it.

#### Scenario: A marker references another trip's city

- **WHEN** a marker on one trip is submitted referencing a city belonging to another
- **THEN** it is rejected
- **AND** no marker is stored

#### Scenario: A write bypasses the application

- **WHEN** such a marker is written directly to the store, without passing through the applications
- **THEN** the store refuses it
- **AND** the refusal does not depend on which client issued the write

### Requirement: Marker type is a code-defined value, and each type carries its own colour

The system SHALL define the available marker types in shared code rather than as
user-editable data, and SHALL expose them from a shared package consumed by both
applications.

Each type SHALL carry exactly one colour and exactly one icon identifier. Colour
SHALL be determined by the type itself, and no grouping SHALL sit between a type
and its colour. Two distinct types SHALL NOT share a colour.

The set of types SHALL remain small enough that every type stays distinguishable
from every other by colour alone at normal map zoom. Adding a type therefore
costs a colour, and SHALL be treated as a palette decision rather than as an
addition to a list. A type SHALL NOT be added on the grounds that the list has
room for one more.

The icon identifier SHALL name an icon rather than being one. The shared package
SHALL NOT hold a glyph, a character, or a drawable that either application renders
directly; each application SHALL map the identifier to an icon from its own
platform's icon set. Identifiers SHALL be stable, because they are the contract
between the shared type list and two separate icon mappings.

**The same SHALL hold for what a type is called.** The shared type list SHALL NOT hold
the words a person reads for a type; each application SHALL resolve the type's own
identifier to those words, exactly as it resolves the icon. A type SHALL therefore be
three things in the shared list — an identifier, a colour, and an icon's name — and
nothing in it SHALL be showable without an application resolving it first.

Rationale: the name was the one value in that list that a screen could draw as it
stood, and being drawable as it stands is what made it English. The type list is the
single source of what a type *is*; what it is called is a different question with a
different answer per language, and the identifier is already the contract that joins
them.

The icon SHALL reinforce what the colour already says and SHALL NOT be the only
channel separating one type from another. A person SHALL be able to tell any two
types apart without resolving a glyph.

The types SHALL be: place, temple, culture, nature, food, shopping, stay, and
transport.

Every marker SHALL have a type. A marker whose type cannot be determined SHALL
take a defined fallback type rather than none, so that no marker is unrenderable.

The fallback SHALL be `place`, and `place` SHALL mean only that nothing more was
determined. No type whose meaning a person or the geocoder actually established
SHALL resolve to the fallback, so that the fallback stays rare and a marker
carrying it is genuinely unclassified rather than merely unspecific.

#### Scenario: A type is proposed for addition

- **WHEN** a new type is proposed for the shared list
- **THEN** it requires a colour distinguishable from every existing one
- **AND** it is not accepted merely because the type set is under its bound

#### Scenario: Two types are compared

- **WHEN** any two markers of different types are rendered
- **THEN** they show different colours
- **AND** they are distinguishable without reading either icon

#### Scenario: A type cannot be determined

- **WHEN** a marker is created without a determinable type
- **THEN** it takes the fallback type `place`
- **AND** it renders with that type's colour and icon

#### Scenario: A place established as worth seeing

- **WHEN** a marker is classified as somewhere worth seeing without a more
  specific kind being established
- **THEN** it does not take the fallback type
- **AND** it is distinguishable from a marker about which nothing was determined

#### Scenario: Types are not user data

- **WHEN** a person uses either application
- **THEN** there is no interface for creating, renaming, or deleting a type

#### Scenario: A type's icon is inspected in the shared package

- **WHEN** the shared type list is read
- **THEN** each type carries a name identifying its icon
- **AND** nothing in the shared package can be rendered as an icon without an
  application resolving it first

#### Scenario: A type's name is inspected in the shared package

- **WHEN** the shared type list is read
- **THEN** it holds no words a person reads for any type

#### Scenario: A type is named on screen

- **WHEN** either application shows what a marker's type is called
- **THEN** it resolves the type's identifier to those words
- **AND** both applications show the same words for the same type

### Requirement: A retired type identifier resolves to the type that replaced it

The stored type is unconstrained text and rows exist that were written by earlier
builds. The shared package SHALL hold a table mapping every identifier it has ever
defined to a currently defined type, and SHALL resolve a stored value through that
table before applying the fallback.

A retired identifier SHALL NOT reach the fallback. Resolving a retired identifier
through the fallback loses the meaning a person recorded, and does so silently: a
saved castle would render as an unclassified place, which raises no error, fails
no typecheck, and is visible only by recognising that a map looks wrong.

The mapping SHALL be defined once in the shared package and SHALL be the only
answer to what a stored identifier means, so that the two applications and the
geocoder cannot disagree.

An identifier that names a currently defined type SHALL NOT appear in the
mapping. A live identifier resolves to itself, and an entry claiming otherwise
would be a standing assertion that it means something else — which the
completeness check above cannot detect, because such an entry satisfies it.

Resolution SHALL happen on read. No stored value SHALL be rewritten, and the
mapping SHALL be permanent rather than transitional — a row may carry a retired
identifier indefinitely.

A stored value that was never a defined identifier SHALL still take the fallback,
and SHALL still render.

#### Scenario: A marker saved by an earlier build

- **WHEN** a marker whose stored type is `castle` is rendered
- **THEN** it renders as `culture`
- **AND** it does not render as the fallback type

#### Scenario: An identifier that was never defined

- **WHEN** a marker's stored type matches no identifier the system has ever defined
- **THEN** it takes the fallback type
- **AND** it is not omitted from the map

#### Scenario: A retired identifier is checked against the table

- **WHEN** the set of identifiers the system has ever defined is enumerated
- **THEN** every one of them resolves to a currently defined type
- **AND** none of them reaches the fallback by omission

#### Scenario: A retired identifier is defined again

- **WHEN** an identifier that was previously retired names a type the system
  offers again
- **THEN** it resolves to that type rather than to the one it was retired into
- **AND** it does not appear in the mapping of retired identifiers

#### Scenario: Reading does not write

- **WHEN** a marker carrying a retired identifier is read and rendered
- **THEN** the stored value is unchanged
- **AND** an older build reading the same row still renders it

### Requirement: A marker may carry the date it is planned for

A marker SHALL support an optional date, naming the day the place is planned for. It
SHALL be a calendar date and SHALL NOT carry a time of day.

A marker MAY additionally carry a **last day**. Where it does, the place SHALL be planned
for every day from its date through that last day, both included. The last day SHALL also
be a calendar date and SHALL NOT carry a time of day.

A last day SHALL NOT be storable without a date, and SHALL NOT fall before it. A
submission breaking either rule SHALL be refused, and the refusal SHALL name the offending
field. A last day equal to the date SHALL be recorded as absent: a place planned for one
day carries one date, and the same day SHALL NOT have two ways of being recorded.

Clearing a marker's date SHALL clear its last day with it. A last day left behind would
describe a run with no beginning, which the paragraph above forbids storing.

A run of days SHALL NOT be longer than a year. A last day falling more than 365 days after
the date SHALL be refused, and the refusal SHALL name the offending field.

Rationale for the bound: these dates are typed by hand, and a slipped year turns a
three-night stay into a run of some thirty-six thousand days — one place claiming every
day of a century, which no calendar can draw and which would make the day being read take
as long to work out as the trip itself. Nothing anybody plans on a trip runs longer than a
year, so the bound refuses typos and nothing else. It is stated here, as a refusal that
names its field, rather than left to each application to guard quietly: a run silently
shortened to fit would put the place on some of its days and not others, with nothing on
screen to say why.

A marker with no date SHALL be valid, SHALL remain visible and addressable, and SHALL be
distinguishable from one whose date has been chosen — the absence of a date means the
decision has not been made, which is not the same as any particular day.

A marker's dates SHALL be independent of the trip's dates, and SHALL be able to fall
outside them, wholly or in part. The store SHALL NOT reject them on those grounds, SHALL
NOT adjust them, and SHALL NOT truncate a run to the trip's own dates.

A marker's dates SHALL be independent of the city it is filed under. Neither SHALL
constrain, derive, or default the other.

Rationale for the last part: a city and a date are two groupings of one set of places,
sitting beside each other rather than one inside the other. A date that had to agree
with a city would make the day a level underneath the city, which is the arrangement
this product has decided against — a place can be "Kyōto" and "Thursday", and a day trip
that crosses a city boundary is an ordinary thing to plan.

Rationale for a run of days rather than an arbitrary set of them: the case this exists for
is somewhere you sleep, which is continuous by its nature — a booking has a first night
and a last one and no gaps. Days that are not next to each other remain two markers, as
they are today. A run is a set of days that happen to be adjacent, so nothing here forecloses
widening it later; the reverse would have been a control that can hold any number of days,
built for a case nobody has yet had.

#### Scenario: A marker is created without a date

- **WHEN** a marker is created with no date
- **THEN** it is valid
- **AND** the date is recorded as absent rather than as a placeholder value

#### Scenario: A marker is given a run of days

- **WHEN** a marker is given a date of the 3rd and a last day of the 6th
- **THEN** it is planned for the 3rd, 4th, 5th and 6th
- **AND** it remains one marker with one position

#### Scenario: A last day before the date

- **WHEN** a marker is given a last day falling before its date
- **THEN** the submission is refused
- **AND** the refusal names the offending field

#### Scenario: A last day with no date

- **WHEN** a marker is given a last day and no date
- **THEN** the submission is refused
- **AND** the refusal names the offending field

#### Scenario: A run longer than a year

- **WHEN** a marker is given a last day falling more than 365 days after its date
- **THEN** the submission is refused
- **AND** the refusal names the offending field
- **AND** the run is not shortened to fit

#### Scenario: A last day equal to the date

- **WHEN** a marker is given a date and a last day that are the same day
- **THEN** it is planned for that one day
- **AND** its last day is recorded as absent

#### Scenario: Clearing the date clears the last day

- **WHEN** a marker carrying a run of days has its date cleared
- **THEN** it carries no date and no last day
- **AND** it is a place whose day has not been decided

#### Scenario: A date outside the trip's dates

- **WHEN** a marker is given a date falling before a trip's start date or after its end date
- **THEN** it is stored as given
- **AND** it is neither rejected nor adjusted

#### Scenario: A run reaching past the trip's dates

- **WHEN** a marker is given a run of days beginning within the trip's dates and ending
  after its end date
- **THEN** it is stored as given
- **AND** it is neither refused nor shortened to the trip's end date

#### Scenario: A date on a trip that has none

- **WHEN** a marker on a trip carrying no dates of its own is given a date
- **THEN** it is stored
- **AND** the trip is not required to have dates first

#### Scenario: A date and a city do not constrain each other

- **WHEN** a marker is given a date, and is filed under a city whose other markers carry
  different dates
- **THEN** both the date and the city are stored as given
- **AND** neither is changed on account of the other

#### Scenario: Markers saved before a run of days could be recorded

- **WHEN** a marker saved with only a date is read or edited
- **THEN** it has no last day and is planned for that one day
- **AND** saving it without adding one succeeds and leaves it with none

### Requirement: Every price is in US dollars, and a place can be free

A marker's price SHALL be an amount in US dollars. The system SHALL NOT attach a currency
to a trip, and SHALL NOT convert an amount from one currency to another.

A marker SHALL additionally support an optional local price: an amount in the second
currency of the city it is filed under. A marker SHALL be able to carry a local price
only while it is filed under a city that has a second currency, and the local price SHALL
always be in that city's current second currency. The price in US dollars and the local
price SHALL be independent: either, both or neither MAY be recorded, and neither SHALL be
derived from the other.

A marker SHALL be able to be free. A free marker SHALL be one whose price is zero:
recording a price of 0 and marking a place free SHALL be the same act and SHALL produce
the same record. There SHALL be no separate "free" value that could disagree with the
price. A free marker SHALL NOT carry a local price, and a local price of 0 SHALL NOT be
recorded: a place whose only cost is 0 in any currency is free.

Wherever a price is shown, both applications SHALL present it the same way:

- a free marker as `Free`;
- a whole amount as its currency's three-letter code followed by the amount with
  thousands separators and no decimals, for example `USD 25`, `USD 1,200` or `JPY 3,800`;
- an amount with cents as the code followed by the amount with two decimals, for example
  `USD 32.50` or `EUR 12.50`;
- a marker with both a price in US dollars and a local price as the two joined by ` · `,
  US dollars first, for example `USD 25 · JPY 3,800`;
- a marker with only one of the two as that one alone.

A marker with no price and no local price SHALL show neither an amount nor `Free`.

Rationale: one fixed currency is simpler to enter and to read than one that depends on
which city a place is filed under, and a trip crossing a border is not worth that extra
step. That is why the price every place shares stays in US dollars. The local price is
an addition beside it rather than a replacement, for the price seen on a menu or a ticket
booth, which is known exactly in the local currency and only approximately in dollars.
Free is a price of zero rather than a separate fact because nobody planning a trip
means anything different by the two.

#### Scenario: A price is shown

- **WHEN** a marker has a price of 25
- **THEN** it is presented as `USD 25` on both applications

#### Scenario: A price with cents is shown

- **WHEN** a marker has a price of 32.5
- **THEN** it is presented as `USD 32.50` on both applications

#### Scenario: A free place is shown

- **WHEN** a marker has a price of 0
- **THEN** it is presented as `Free` on both applications
- **AND** no amount is shown beside it

#### Scenario: A place with no price

- **WHEN** a marker has no price and no local price
- **THEN** neither an amount nor `Free` is shown for it

#### Scenario: Both amounts are shown

- **WHEN** a marker in a city whose second currency is JPY has a price of 25 and a local
  price of 3800
- **THEN** it is presented as `USD 25 · JPY 3,800` on both applications

#### Scenario: Only the local amount is shown

- **WHEN** a marker in a city whose second currency is JPY has no price and a local price
  of 3800
- **THEN** it is presented as `JPY 3,800` on both applications
- **AND** nothing is said about US dollars

#### Scenario: A free place with a local amount cannot be recorded

- **WHEN** a marker is recorded as free
- **THEN** it carries no local price
- **AND** it is presented as `Free` alone

#### Scenario: A local price without a second currency is refused

- **WHEN** a local price is submitted for a marker that is filed under no city, or under
  a city with no second currency
- **THEN** the marker is not recorded with a local price

#### Scenario: A marker changes city

- **WHEN** a marker with a price is moved to another city
- **THEN** its stored amount in US dollars is unchanged
- **AND** it is still presented in US dollars

#### Scenario: A marker with a local price changes city

- **WHEN** a marker with a local price is moved to a city whose second currency is
  different, or to a city with none, or to no city
- **THEN** its local price is cleared
- **AND** its price in US dollars is unchanged

#### Scenario: Prices recorded before US dollars

- **WHEN** this rule takes effect
- **THEN** every marker that had a price, including a price of 0, has none
- **AND** no marker is shown as `Free` until someone marks it so

### Requirement: A marker may carry the hours it is open

A marker SHALL support optional opening hours: which days of the week the place is open,
and the one time range it is open on each of those days.

A marker with no hours SHALL be valid. The absence of hours SHALL mean that they have not
been entered, and SHALL NOT mean that the place is closed. Hours naming no open day at all
SHALL NOT be storable; such hours SHALL be recorded as absent.

Where a marker has hours, every day of the week they name SHALL be a day the place is
open, and every day they do not name SHALL be a day it is closed.

Each open day SHALL carry exactly one time range, and every open day SHALL carry the same
one. A range SHALL have an opening time and a closing time, each a time of day to the
minute.

- A closing time earlier than the opening time SHALL mean the next morning. The range
  SHALL belong to the day it opens.
- An opening time equal to the closing time SHALL mean open all day.

A submission breaking any of these rules SHALL be refused, and the refusal SHALL name the
hours field.

Hours SHALL be in the place's own local time. The system SHALL NOT convert them for the
time zone of the person reading them, of their device, or of the trip.

Rationale: hours are how a place describes itself, and a sign on a door is read as
written. The absence of hours means "not filled in" rather than "closed" for the reason a
blank price means "not entered yet" rather than free: the two states need to look
different, and only one of them is something somebody decided. "Closed all week" is not a
state anybody needs to record about a place they want to go to. One range, the same every
open day, is what people actually record (#190): a second range and different hours on
some days were offered and never used, and they made the form much busier.

#### Scenario: A marker is created without hours

- **WHEN** a marker is created with no hours
- **THEN** it is valid
- **AND** its hours are recorded as absent, not as closed on every day

#### Scenario: Markers saved before hours existed

- **WHEN** a marker saved before this requirement is read or edited
- **THEN** it has no hours
- **AND** saving it without adding hours succeeds and leaves it with none

#### Scenario: A place closed on some days

- **WHEN** a marker is given hours naming Tuesday to Saturday
- **THEN** it is open on those five days
- **AND** it is closed on Monday and Sunday

#### Scenario: A place open past midnight

- **WHEN** a marker is given hours naming Friday, opening at 20:00 and closing at 02:00
- **THEN** it is stored as given
- **AND** the range belongs to Friday

#### Scenario: A place open all day

- **WHEN** a marker is given a range opening and closing at 00:00
- **THEN** it is stored as open all day on every day it names

#### Scenario: Two ranges in one day

- **WHEN** a marker is given a day with ranges 12:00–15:00 and 19:00–23:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Two ranges that overlap

- **WHEN** a marker is given a day with ranges 12:00–16:00 and 15:00–23:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Different hours on different days

- **WHEN** a marker is given Monday 09:00–17:00 and Tuesday 10:00–18:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Hours are not converted

- **WHEN** a marker's hours are read on a device set to a different time zone from the
  one they were entered on
- **THEN** they read exactly as entered

### Requirement: A city may carry a second currency

A city SHALL support an optional second currency. A city SHALL have at most one. A city
without one SHALL behave as a city did before second currencies existed.

The second currency SHALL be chosen from a fixed list of world currencies, each known by
its three-letter code and its English name, and SHALL NOT be free text. US dollars SHALL
NOT be offered, because every place's price is already in US dollars.

A city's second currency SHALL be able to be set, changed and removed. When it is changed
or removed, every local price recorded on the markers filed under that city SHALL be
cleared, and their prices in US dollars SHALL be unchanged. A local price SHALL NOT be
relabelled into the new currency.

When a city is removed, the markers it held become unassigned and SHALL lose their local
prices, for the same reason.

Rationale: a local amount means nothing once it is no longer in the currency it was
typed in. Showing `JPY 3,800` as `KRW 3,800` would present a wrong price as a right one,
which is worse than showing none. The currency is set on the city rather than on each
place so that every place in Tokyo gets a yen box without anyone choosing yen sixty
times. This differs from the per-city currency reversed in #175: there the city decided
what the one price meant, and here the dollar price means the same everywhere and the
city only adds a second box beside it.

#### Scenario: A city is given a second currency

- **WHEN** a member sets a city's second currency to JPY
- **THEN** the city carries JPY
- **AND** the markers filed under it can each record a local price in JPY

#### Scenario: A city without a second currency

- **WHEN** a city has no second currency
- **THEN** no marker filed under it carries a local price

#### Scenario: A city's second currency is changed

- **WHEN** a member changes a city's second currency from JPY to KRW
- **THEN** every local price on the markers filed under it is cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: A city's second currency is removed

- **WHEN** a member removes a city's second currency
- **THEN** every local price on the markers filed under it is cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: A city with local prices is removed

- **WHEN** a member removes a city whose markers carry local prices
- **THEN** those markers remain on the trip, unassigned
- **AND** their local prices are cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: US dollars is not a second currency

- **WHEN** a member chooses a city's second currency
- **THEN** US dollars is not among the choices
