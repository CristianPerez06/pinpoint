## ADDED Requirements

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

#### Scenario: A trip with places belonging to no city

- **WHEN** a trip's cities are listed and some places belong to no city
- **THEN** an Unassigned group is offered alongside the cities
- **AND** it states how many places it holds

#### Scenario: Selecting the unassigned group

- **WHEN** the Unassigned group is selected
- **THEN** the places belonging to no city are shown
- **AND** places filed under a city are not

#### Scenario: A trip with nothing unassigned

- **WHEN** a trip's cities are listed and every place belongs to a city
- **THEN** the Unassigned group is still offered
- **AND** it states that it holds no places

#### Scenario: The counts account for the trip

- **WHEN** a trip's cities are listed
- **THEN** the city counts and the unassigned count together equal the trip's places
