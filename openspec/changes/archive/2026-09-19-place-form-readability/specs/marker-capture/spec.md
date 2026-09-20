## MODIFIED Requirements

### Requirement: Saving a place captures its name, note, city, type, link, price, and the day it is planned for

One form SHALL capture a place's name, note, city, type, link, price, and the day it
is planned for, and the same form SHALL be used when editing an existing marker.

A name and a position SHALL be required. Every other field SHALL be optional, and
an optional field left blank SHALL be recorded as absent rather than as empty
text.

**No label SHALL state that a field is optional.** A field that may be left empty SHALL
say so in the guidance beneath it, in a sentence, and SHALL NOT repeat it as a
parenthetical in its own label. A field whose guidance would otherwise say nothing SHALL
gain a sentence rather than keep the parenthetical.

The price field SHALL say that it is in US dollars. Beside it the form SHALL offer a
`Free` control, on every application. Turning `Free` on SHALL empty the price field and
show it as unavailable. Turning `Free` off again, or going into the price field, SHALL
return the field to an ordinary empty price. A price and `Free` SHALL never both be set.
Saving with `Free` on SHALL record the place as free, and saving a price of 0 SHALL do the
same. A form opened on a place that is free SHALL open with `Free` on.

**The prices SHALL read as one bounded section**, carrying a single label `Price`, with
the amounts and the `Free` control inside it. Each amount field SHALL carry its currency's
code on the field itself rather than in a label above it. The section SHALL be drawn so
that where it begins and ends is visible without reading its contents.

When the city chosen in the form has a second currency, the form SHALL show a second
price field beside the price in US dollars, within the same section, carrying that
currency's code, and SHALL say beneath them that the amount is typed as seen and is not
converted. Where the two fields cannot both sit on one row at a readable width, they
SHALL wrap rather than shrink: an amount field SHALL never be narrowed past the width
its currency's plausible amounts need. When the chosen city has no second currency, or no
city is chosen, the form SHALL show no second field. The field SHALL follow the city
chosen in the form as it changes, before anything is saved.

Because the currency is no longer named in a label, any message about one of the two
amounts SHALL name the currency it concerns.

Both price fields SHALL be optional, and SHALL be independent: changing one SHALL NOT
change the other. Turning `Free` on SHALL empty and show as unavailable both fields, and
going into either field SHALL turn `Free` off. Saving a 0 in either field SHALL record the
place as free, with no amount in either currency.

A form opened on a place with a local price SHALL show it in the second field. When the
city chosen in the form would clear a local price the place already has — a city with a
different second currency, one with none, or no city — the form SHALL say so beside the
price fields, naming the amount that saving will clear, before it is saved. Choosing the
original city again SHALL restore the amount, because nothing is cleared until the place
is saved.

When a submission is rejected, the system SHALL name the offending field and SHALL
preserve everything the person typed. A rejection SHALL NOT discard the unsaved
marker or its position.

On success the saved place SHALL appear among the trip's markers without the
person having to reload or navigate away.

#### Scenario: Saving with only the required fields

- **WHEN** a person saves a place with a name and a position and nothing else
- **THEN** it is stored
- **AND** it appears among the trip's markers

#### Scenario: Optional fields left blank

- **WHEN** a person saves a place leaving the note, link, price, and day blank
- **THEN** those fields are recorded as absent
- **AND** they are not recorded as empty text
- **AND** the place is not recorded as free

#### Scenario: A submission is rejected

- **WHEN** a person saves a place with no name
- **THEN** the submission is rejected
- **AND** the rejection names the name field
- **AND** the other values they typed and the marker's position are preserved

#### Scenario: A place is saved successfully

- **WHEN** saving succeeds
- **THEN** the place is drawn on the map as an ordinary marker
- **AND** the person is not made to reload the trip to see it

#### Scenario: A place is marked free

- **WHEN** a person turns on `Free` and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`

#### Scenario: Free empties the price

- **WHEN** a person has typed a price and then turns on `Free`
- **THEN** the price field is emptied and shown as unavailable
- **AND** saving records the place as free, not with the typed price

#### Scenario: Going back to a price

- **WHEN** `Free` is on and the person goes into the price field, or turns `Free` off
- **THEN** `Free` is off
- **AND** the price field is empty and can be typed into

#### Scenario: A price of 0 is typed

- **WHEN** a person types 0 as the price and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`, not an amount

#### Scenario: Editing a free place

- **WHEN** a person opens the form on a place that is free
- **THEN** the form opens with `Free` on and the price field empty

#### Scenario: A place in a city with a second currency

- **WHEN** a person fills in the form for a place filed under a city whose second
  currency is JPY
- **THEN** the form shows one `Price` section holding a `USD` amount and a `JPY` amount
- **AND** either, both or neither can be filled in and saved

#### Scenario: A place in a city without a second currency

- **WHEN** a person fills in the form for a place filed under a city with no second
  currency, or under no city
- **THEN** the form shows one `Price` section holding a `USD` amount and `Free` only

#### Scenario: Editing a place with both amounts

- **WHEN** a person opens the form on a place with a price of 25 and a local price of
  3800, and changes the price to 30
- **THEN** saving records a price of 30
- **AND** the local price is still 3800

#### Scenario: Free empties both fields

- **WHEN** a person has typed amounts in both price fields and then turns on `Free`
- **THEN** both fields are emptied and shown as unavailable
- **AND** saving records the place as free, with no amount in either currency

#### Scenario: A 0 is typed as the local price

- **WHEN** a person types 0 in the second price field and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`, not an amount

#### Scenario: No label says a field is optional

- **WHEN** a person opens the place form
- **THEN** no field label contains the word `optional`
- **AND** the day field says beneath it that it can be left blank to decide later

#### Scenario: A message about one of two amounts

- **WHEN** a place in a city whose second currency is JPY is saved with an unacceptable
  amount in the second field
- **THEN** the refusal names the `JPY` amount rather than "the second price"

#### Scenario: Both amounts at a width too narrow for one row

- **WHEN** the form is shown in a card too narrow to hold both amount fields and `Free`
  on one row
- **THEN** the fields wrap onto a further line within the same `Price` section
- **AND** neither amount field is narrowed past a readable width

#### Scenario: A place is moved to a city with a different currency

- **WHEN** a person editing a place with a local price of 3800 in a JPY city chooses a
  city whose second currency is KRW
- **THEN** the second field carries the code `KRW` and is empty
- **AND** the form says that saving will clear `JPY 3,800`
- **AND** choosing the original city again shows `3800` in the `JPY` field

### Requirement: The place form captures one range of hours for the days a place is open

The form that saves and edits a place SHALL offer its opening hours, on every
application. It SHALL be optional and placed after the day the place is planned for.

**The hours SHALL read as one bounded section**, carrying a single label `Hours`, with
the days, the line naming them and the times inside it. The section SHALL be drawn so
that where it begins and ends is visible without reading its contents, and SHALL NOT rely
on a background fill to do so — a fill that is indistinguishable from the surface behind
it on either ground says nothing. Its fields SHALL keep the same appearance they have
elsewhere in the form.

**Days.** The form SHALL offer the seven days of the week as a row of letters in week
order, starting on Monday (`M T W T F S S`), each of which can be turned on and off.
Beneath the row the form SHALL name the days turned on in words, for example `Open Tue to
Sat`, `Open every day`, or `Open Mon, Wed, Fri`. While no day is on, it SHALL say instead
that the hours can be left empty if they are not known.

Rationale for the words: two letters in the row repeat, so the row alone cannot say which
Tuesday-or-Thursday was meant.

**Time fields appear with the first day.** While no day is on, the form SHALL show no
time fields. Saving with no day on SHALL record the place as having no hours, whatever
times had been entered before the days were turned off.

**One range.** The form SHALL offer one opening time and one closing time, which apply to
every day turned on. It SHALL NOT offer a second range, nor a way to give some days hours
of their own.

**Times** SHALL be entered and shown on a 24-hour clock.

**Hints while typing.** Where the closing time is earlier than the opening time, the form
SHALL say beneath it that the place closes at that time the next day, for example `Closes
02:00 the next day`. Where the two times are equal, it SHALL say `Open all day`.

**Refusal.** A range with only one of its two times, or a range breaking the rules for
opening hours, SHALL be refused. The refusal SHALL name the hours field and SHALL preserve
everything entered, in the hours and everywhere else in the form.

**Opening the form on a place that has hours.** The days SHALL be turned on as stored,
and the opening and closing times SHALL be those stored. Saving without changing
anything SHALL leave the hours exactly as they were.

Changing a place's hours SHALL be governed by the same rules as any other change to a
place, including the refusal of a save based on a stale read.

#### Scenario: Saving a place with hours

- **WHEN** a person turns on Monday to Friday, enters 09:00 to 17:00, and saves
- **THEN** the place is open Monday to Friday, 09:00–17:00
- **AND** it is closed on Saturday and Sunday

#### Scenario: The form offers one range only

- **WHEN** a person turns on any day
- **THEN** the form shows one opening time and one closing time
- **AND** it offers no way to add a second range
- **AND** it offers no way to give one day different hours

#### Scenario: The form opens with nothing to fill in

- **WHEN** a person opens the form on a place with no hours
- **THEN** no day is turned on
- **AND** no time fields are shown

#### Scenario: Turning every day off

- **WHEN** a person has entered times, turns every day off, and saves
- **THEN** the place is recorded as having no hours

#### Scenario: A late closing time

- **WHEN** a person enters 19:00 to 02:00
- **THEN** the form says `Closes 02:00 the next day`

#### Scenario: Open all day

- **WHEN** a person enters 00:00 to 00:00
- **THEN** the form says `Open all day`

#### Scenario: A range missing a time

- **WHEN** a person enters an opening time with no closing time and saves
- **THEN** the save is refused
- **AND** the refusal names the hours field
- **AND** everything else they entered is preserved

#### Scenario: Editing a place with hours

- **WHEN** a person opens the form on a place open Monday, Wednesday and Friday,
  09:00–17:00
- **THEN** Monday, Wednesday and Friday are turned on
- **AND** the times read 09:00 and 17:00

#### Scenario: Saving an edit that did not touch the hours

- **WHEN** a person opens the form on a place with hours, changes only its note, and saves
- **THEN** the place's hours are unchanged

#### Scenario: The hours are labelled

- **WHEN** a person opens the place form
- **THEN** the hours section is labelled `Hours`
- **AND** the label does not say that the hours are optional
- **AND** the line beneath the days says the hours can be left empty if they are not known
