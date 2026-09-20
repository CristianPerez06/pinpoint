## ADDED Requirements

### Requirement: A trip can be narrowed by what kind of place it is

The system SHALL offer narrowing a trip's markers to one or more **kinds of place**,
chosen from the kinds the product offers.

A marker SHALL be shown when its kind is **any** of those chosen. This composes as *any*
where *wanted by* composes as *all*, and the difference is not an inconsistency: a place
has exactly one kind, so requiring every chosen kind at once would always select nothing.
Because two lists of tick boxes in one control would otherwise be read as meaning the
same thing, the control SHALL say which question it is asking in words rather than
leaving it to be inferred from behaviour.

Choosing no kind SHALL be the same as not narrowing by kind, and SHALL be the state a
trip opens in.

What a marker's kind is for the purpose of filtering SHALL be decided by the **same
resolution that decides how it is drawn**. A stored kind is unconstrained text: an
identifier that has been retired resolves to its replacement, and one the product does
not know resolves to a fallback kind. Narrowing to a kind SHALL therefore select every
place that is *drawn* as that kind, including places whose stored value is a retired or
unknown identifier resolving to it.

Rationale: any other reading lets a place render as one kind and filter as another, which
is invisible until somebody narrows to the kind they can see on the map and the place
they were looking at disappears. That reads as a data problem and would not be one.

#### Scenario: Narrowing to one kind

- **WHEN** a trip is narrowed to one kind of place
- **THEN** the places of that kind are shown
- **AND** places of every other kind are not

#### Scenario: Narrowing to several kinds at once

- **WHEN** two kinds are chosen
- **THEN** a place of either kind is shown
- **AND** the control states that it is asking for any of the chosen kinds

#### Scenario: Choosing no kind

- **WHEN** no kind is chosen
- **THEN** the kind of a place does not affect whether it is shown
- **AND** a trip opens in that state

#### Scenario: A kind no place on the trip has

- **WHEN** a trip is narrowed to a kind no place on it has
- **THEN** it is stated that no places match the filter
- **AND** it is not stated or implied that the trip has no places

#### Scenario: A place whose stored kind is retired or unknown

- **WHEN** a place's stored kind is an identifier the product does not offer
- **AND** the trip is narrowed to the kind that place is drawn as
- **THEN** that place is shown

### Requirement: A trip can be narrowed by the day a place is planned for

The system SHALL offer narrowing a trip's markers to the places planned for one or more
**days**, and SHALL offer singling out the places carrying **no day**.

The days offered SHALL be a closed set drawn from the trip itself — the days the trip
spans, together with any day a place on it carries. A day a place carries SHALL be
offered even when it falls outside the trip's own dates, which the system permits, and a
trip carrying no dates of its own SHALL still offer the days its places carry.

Rationale for a closed set rather than a pair of dates: every other question this filter
asks is a set of choices, and a free range would be the only control here that is not.
The set is also bounded by the trip, which a range is not.

A marker SHALL be shown when it is planned for **any** of the days chosen, which is how
narrowing by kind composes and is what lets two days that are not next to each other be
asked for together.

**Where a place is planned for more than one day, it SHALL be shown when any one of its
days is chosen.** This rule is stated here although a place carries a single day today,
so that whatever later lets a place span several days inherits it rather than deciding it
a second time.

Choosing **no day** SHALL be the same as not narrowing by day, and SHALL be the state a
trip opens in. Singling out the places carrying no day SHALL be a choice a person makes,
distinct from having made no choice at all.

Rationale for offering the undated places: they are the same kind of pile as the places
nobody has answered about — a decision waiting to be made rather than one that was made —
and that pile is already the reason this specification says filtering is worth building.

#### Scenario: Narrowing to one day

- **WHEN** a trip is narrowed to one day
- **THEN** the places planned for that day are shown
- **AND** places planned for another day are not
- **AND** places carrying no day are not

#### Scenario: Narrowing to several days at once

- **WHEN** two days are chosen
- **THEN** a place planned for either day is shown
- **AND** the two days need not be next to each other

#### Scenario: Singling out the places carrying no day

- **WHEN** the choice for places carrying no day is made
- **THEN** the places carrying no day are shown
- **AND** places planned for a day are not

#### Scenario: Choosing no day at all

- **WHEN** no day is chosen
- **THEN** the day a place carries does not affect whether it is shown
- **AND** a trip opens in that state

#### Scenario: A place planned for more than one day

- **WHEN** a place is planned for several days
- **AND** any one of those days is chosen
- **THEN** that place is shown

#### Scenario: A day holding no places

- **WHEN** a trip is narrowed to a day no place on it is planned for
- **THEN** it is stated that no places match the filter
- **AND** it is not stated or implied that the trip has no places

#### Scenario: A trip carrying no dates of its own

- **WHEN** a trip carries no dates and its places carry days
- **THEN** those days are offered
- **AND** the trip can be narrowed by them

#### Scenario: A place dated outside the trip's dates

- **WHEN** a place carries a day outside the trip's own dates
- **THEN** that day is offered
- **AND** narrowing to it shows that place

#### Scenario: The calendar is not narrowed by this

- **WHEN** the map is narrowed to a day
- **THEN** the calendar still shows every place on the trip

### Requirement: A trip can be narrowed to the places filed under no city

The system SHALL offer narrowing a trip's markers to those **filed under no city**, as a
choice among the narrowing controls.

This is the only way the system narrows by city, and that is deliberate. A place filed
under no city is a **state of the record** rather than a location: hiding the places that
do have a city says nothing false about what is near what, because the question being
asked is about the filing and not about the map. Narrowing to a named city is a different
matter and SHALL NOT be offered — see the rationale carried by *Selecting a city does not
narrow the trip*.

It SHALL be offered whether or not the trip holds any such place, for the reason *A
narrowed view declares that it is narrowed* already gives: a control that appears on
selection moves everything beside it, and this is the control somebody reaches for to
check whether anything went unfiled, so withdrawing it when the answer is *nothing*
withdraws it exactly when they came to look.

Rationale for it living here rather than on the city list: the city list neither declares
that it has narrowed anything nor offers a way back, so narrowing from there would hide
places with nothing on screen saying so — which is the failure this specification exists
to prevent. The control that narrows must be the one that declares it and reveals the way
out.

#### Scenario: Narrowing to the unfiled places

- **WHEN** a trip is narrowed to the places filed under no city
- **THEN** those places are shown
- **AND** places filed under a city are not

#### Scenario: A trip with nothing unfiled

- **WHEN** a trip is narrowed to the places filed under no city and every place has one
- **THEN** the choice is still offered
- **AND** it is stated that no places match the filter
- **AND** it is not stated or implied that the trip has no places

#### Scenario: Narrowing by a named city is not offered

- **WHEN** the narrowing controls are examined
- **THEN** no choice narrows the trip to a named city

### Requirement: Selecting a city does not narrow the trip

Selecting a city, or the group of places belonging to no city, SHALL change what the map
is **framed on** and what place search is biased toward. It SHALL NOT hide any marker.

Rationale, and it was measured rather than argued. A city in this product is a name
somebody chose for a cluster of places, not a geographical fact — nothing resolves a city
name to a position — so hiding everything filed under a different name can hide a place
that is genuinely around the corner, which is the question the product exists to answer.
On a real six-city trip, framing on the largest city put seven of a neighbouring city's
eight places on screen, legible and individually distinguishable, because the two are
about as far apart as the larger one's own places are spread. Those are exactly the
places whose nearness is the answer somebody came for.

Where a city's places do not reach its neighbours, framing has already narrowed the view
without hiding anything, so a filter would have nothing left to do. Framing therefore
narrows where narrowing is honest and shows the neighbour where hiding it would lie.

#### Scenario: Selecting a city frames rather than hides

- **WHEN** a city is selected
- **THEN** the map is framed on that city's places
- **AND** a place filed under a different city that falls inside that frame is still drawn

#### Scenario: Selecting the unassigned group frames rather than hides

- **WHEN** the group of places belonging to no city is selected
- **THEN** the map is framed on those places
- **AND** places filed under a city are still drawn

## MODIFIED Requirements

### Requirement: Places belonging to no city are listable as a group

Where a trip's cities are listed, the system SHALL offer **Unassigned** as a group
alongside them, selecting the places no city holds.

`marker-capture` and `markers` both state that a place saved without a city "appears among
the trip's markers, grouped as unassigned". A list offering only *all places* and one row
per city does not group them at all: such a place sits in no bucket that can be selected,
and is findable only by opening it or by noticing that the rows do not sum to the total.

The group SHALL state how many places it holds, as the city rows do, so that the counts
account for the whole trip.

It SHALL be offered whether or not it holds anything, and SHALL state `0 places` rather
than being withdrawn. *A narrowed view declares that it is narrowed* has already settled
this shape of question for the filter control: a control that appears on selection moves
everything beside it, and makes the way out discoverable only once you are already in the
state it leads out of. The same holds here and more sharply — this row is how somebody
checks whether anything went unfiled, so withdrawing it in the one state where the answer
is *nothing* withdraws it exactly when they came to look.

This is the same guarantee *Every marker remains reachable* already makes about a marker no
filter selects. A place is not reachable in any useful sense if the only way to find it is
to already know where it is.

Rationale for stating it now: an unfiled place has until now been a rare accident, which is
why an unlistable one was survivable. A product that deliberately declines to guess a city —
which is what filing a place under where it actually is requires — produces them on purpose,
and the silence would simply move.

**Selecting this group frames the map on those places; it does not hide the rest.** This
requirement said the opposite for as long as it existed — that selecting the group showed
the unfiled places "and places filed under a city are not" — and no application ever did
it, because selecting anything in the city list has only ever moved the camera. Listing
is what this requirement is for, and it is what its own name says; the hiding belongs to
*A trip can be narrowed to the places filed under no city*, on the control that declares
its narrowing and offers the way back. Framing alone would in any case be a poor answer
here: unfiled places have no reason to be near each other, so a camera fitted around them
can be the whole trip.

#### Scenario: A trip with places belonging to no city

- **WHEN** a trip's cities are listed and some places belong to no city
- **THEN** an Unassigned group is offered alongside the cities
- **AND** it states how many places it holds

#### Scenario: Selecting the unassigned group

- **WHEN** the Unassigned group is selected
- **THEN** the map is framed on the places belonging to no city
- **AND** places filed under a city are not hidden
- **AND** narrowing the trip to them is offered among the narrowing controls

#### Scenario: A trip with nothing unassigned

- **WHEN** a trip's cities are listed and every place belongs to a city
- **THEN** the Unassigned group is still offered
- **AND** it states that it holds no places

#### Scenario: The counts account for the trip

- **WHEN** a trip's cities are listed
- **THEN** the city counts and the unassigned count together equal the trip's places

### Requirement: Every application that shows a trip offers filtering

Every application that displays a trip's markers SHALL offer narrowing them, by who wants
to go, by whether a place has been visited, by what kind of place it is, by the day it is
planned for, and to the places filed under no city.

Each application SHALL present the control in the form native to it. What each choice
selects SHALL remain defined once and shared, so that the same trip narrowed the same way
shows the same places on either platform.

Rationale: the other requirements here say what a filter *selects*, not who offers one —
deliberately, because meaning is shared and controls are not. That leaves a gap this
requirement closes: an application that never offered a filter at all would satisfy every
other word in this specification, which was true of the phone until now and should not
become true again by omission.

The guarantees already stated apply wherever filtering is offered: a trip opens
unfiltered, a narrowed view says it is narrowed and can be cleared from there, and a
filter matching nothing is distinguished from a trip with nothing in it. They are
properties of filtering rather than of a platform.

**Where the controls are gathered into one panel, every question SHALL be reachable
without the way out of the narrowing leaving the screen.** A trip may hold many members
and span many days, so a panel that draws every choice of every question at once grows
with the trip until what is at the bottom — which is where clearing the filter lives —
cannot be reached without scrolling past everything above it. An interface MAY therefore
show each question as a single row that expands, provided each such row **states what its
question is currently set to, in words**.

Rationale: this is the same concern *A narrowed view declares that it is narrowed*
already has about the closed control, arriving one level in. That requirement forbids the
closed control from naming the members it was built from, because it would change width
every time the filter was used; a row inside an opened panel has a settled width and can
truncate, so it may say what the trigger may not — and it is the answer to that
requirement's own scenario that opening the control shows which members are named.

#### Scenario: Filtering on either platform

- **WHEN** a trip with markers is opened on either application
- **THEN** a way to narrow it by who wants to go is offered
- **AND** a way to narrow it by visited is offered
- **AND** a way to narrow it by kind of place is offered
- **AND** a way to narrow it by day is offered
- **AND** a way to narrow it to the places filed under no city is offered

#### Scenario: The same filter on both platforms

- **WHEN** the same trip is narrowed the same way on either application
- **THEN** both show the same markers

#### Scenario: A narrowed view on a phone

- **WHEN** a filter is applied on the mobile application
- **THEN** it indicates that the view is narrowed
- **AND** clearing the filter is available from there
- **AND** a filter matching nothing is not presented as a trip with no markers

#### Scenario: Every question is reachable beside the way out

- **WHEN** a trip holding many members and spanning many days is narrowed
- **AND** the narrowing controls are gathered into one panel
- **THEN** every question is reachable within that panel
- **AND** the way out of the narrowing is reachable without the questions being scrolled past

#### Scenario: A collapsed question says what it is set to

- **WHEN** a question in the panel is shown as a row that expands
- **THEN** that row states what the question is currently set to, in words
- **AND** expanding it shows the choices that answer was built from
