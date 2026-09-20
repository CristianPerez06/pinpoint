# marker-filtering Specification

## Purpose

Define how a trip's markers are narrowed to a subset worth looking at — by who wants to
go and by whether the place has been visited — and the guarantees that keep a narrowed
view from being mistaken for the whole trip.

## Requirements

### Requirement: A trip can be narrowed by who is interested

The system SHALL offer narrowing a trip's markers to those **wanted by a named set of
members**, chosen from the people on the trip.

A marker SHALL be shown when **every** named member has recorded interest in it. Naming
two people asks for the places they agree on; returning the places either of them wants
would be a different question and a much longer list, and agreement is the question this
product exists to answer.

Naming one member SHALL show the places that member wants, whatever anybody else has
recorded.

Records belonging to members outside the named set SHALL be ignored, so that somebody who
has left a trip is not still counted.

A member who has recorded *not interested* SHALL NOT count as wanting to go.

Rationale for naming members rather than offering fixed choices written for two people:
on a trip of three or more, "do all of us want this" is a much weaker question than "do
these two want this", and only the second is worth asking. A fixed set of choices can
express the first and cannot express the second.

#### Scenario: Both members want to go

- **WHEN** every member of the trip has recorded interest in a marker
- **AND** every member is named
- **THEN** the marker is shown

#### Scenario: One member wants to go and the other declined

- **WHEN** one member has recorded interest and another has recorded not interested
- **AND** both are named
- **THEN** the marker is not shown
- **AND** it is shown when only the interested member is named

#### Scenario: Asking about some of the trip

- **WHEN** a trip has three members, two of whom have recorded interest in a marker and
  the third has declined
- **AND** only those two are named
- **THEN** the marker is shown
- **AND** it is not shown when all three are named

### Requirement: A trip can be narrowed to what nobody has answered

The system SHALL offer narrowing a trip's markers to those about which **no member has
recorded anything**.

This SHALL mean the absence of every record, not that every member declined. A marker
everyone has actively declined is a decision that was made; a marker nobody has answered
is a decision waiting to be made, and collapsing the two would bury the second inside the
first. It is the triage pile — the set that is invisible in a spreadsheet and the reason
filtering is worth building.

This choice SHALL NOT combine with naming members. "Wanted by Ana, and also nobody has
answered" has no meaning, so choosing one SHALL replace the other rather than adding to
it.

#### Scenario: Nobody has answered

- **WHEN** no member has recorded anything about a marker
- **AND** the filter is set to what nobody has answered
- **THEN** the marker is shown

#### Scenario: Everybody declined

- **WHEN** every member has recorded not interested
- **AND** the filter is set to what nobody has answered
- **THEN** the marker is not shown, because a recorded decision is not an absent one

#### Scenario: One member has declined and the other has not answered

- **WHEN** one member has recorded not interested and no other record exists
- **AND** the filter is set to what nobody has answered
- **THEN** the marker is not shown, because somebody answered

### Requirement: Every marker remains reachable

The system SHALL provide a way to view a trip unfiltered, and that SHALL be the state a
trip opens in.

Rationale: the interest choices do not partition the trip — a marker every member has
declined matches none of them, whichever members are selected. Without an unfiltered view
such a marker would be unreachable through the interface while still existing in the trip,
which is the same class of defect as a marker hidden underneath another one.

#### Scenario: A trip opens unfiltered

- **WHEN** a trip is opened
- **THEN** every marker on it is shown
- **AND** no interest or visited filter is applied

#### Scenario: A marker everybody declined is still reachable

- **WHEN** every member has declined a marker
- **AND** no filter is applied
- **THEN** the marker is shown

### Requirement: A trip can be narrowed by whether a place has been visited

The system SHALL offer filtering by visited state, so that places already seen can be set
aside without being deleted.

Filtering by visited SHALL combine with filtering by interest rather than replacing it:
selecting both narrows to markers satisfying both.

#### Scenario: Hiding places already visited

- **WHEN** the filter excludes visited markers
- **THEN** visited markers are not shown
- **AND** they remain on the trip

#### Scenario: Interest and visited together

- **WHEN** the filter is set to Both and to exclude visited markers
- **THEN** only markers wanted by every member and not yet visited are shown

### Requirement: A filter applies to every view of the trip at once

When a filter is applied, the system SHALL apply it to every view of that trip's markers
**that is visible alongside the others** — the map and any list among them.

Rationale: the map and the list are two views of one set, and the roadmap treats them as
co-equal. A filter that narrowed one and not the other would make them disagree about
what the trip contains, and the person would have to work out which to believe.

A screen that replaces the workspace rather than sitting inside it SHALL NOT be bound by
this, and SHALL state for itself what it shows. The filter is a property of the workspace
the controls that set it live in, not a property of the trip, so a screen reached by
leaving the workspace does not inherit it.

Rationale for the bound: the reasoning above is about two views a person is reading at the
same moment, which is why it is stated as a guarantee against disagreement rather than as a
rule about every screen that ever lists markers. Applied to a screen a person has navigated
to, it produces the opposite of what it was written for — a view that quietly omits places
while presenting itself as complete, with the control that would explain why left behind on
another screen. `trip-calendar` states the consequence for the one such screen that exists.

#### Scenario: The map and the list agree

- **WHEN** a filter is applied while both a map and a list of the trip are visible
- **THEN** both show the same set of markers
- **AND** neither shows a marker the other has hidden

#### Scenario: A screen reached by leaving the workspace

- **WHEN** a filter is applied and a person leaves the workspace for another screen
  showing the trip's markers
- **THEN** that screen is not required to apply the filter
- **AND** it states what it shows rather than leaving it to be inferred

### Requirement: A narrowed view declares that it is narrowed

Whenever a filter is applied, the system SHALL indicate that fact, and SHALL make
clearing it reachable from where the narrowing is visible.

The indication SHALL be carried by a control that is present whether or not a filter is
applied, through a change in that control's state rather than by appearing beside the
controls when a filter is applied and vanishing when it is cleared.

Rationale: a control that appears on selection moves everything beside it, so applying
a filter rearranges the interface that applied it. It also makes the way out of a
narrowed view discoverable only once you are already in one. A control that is always
there, and becomes live, says the same thing without either cost.

The indication SHALL NOT be carried by colour alone, and SHALL be carried by at least two
signals of which at least one is not a hue.

Rationale: this repeats a decision already in force elsewhere — a visited marker is drawn
as visited without changing its colour — because a signal that survives only in hue does
not survive a greyscale display or a colour-blind reader.

**The declaration SHALL also be conveyed to somebody who is not looking at the screen.**
The control that carries it SHALL state the narrowing in words, in its own name, in every
rendering — including any rendering where the narrowing is drawn rather than written.

Rationale: this is the hole the sentence above leaves, and it is a hole a real
implementation fell through. "Not colour alone" is satisfied by a fill plus a shape, and
a shape conveys nothing to a screen reader — so a control could satisfy this requirement
to the letter and still announce only its own name, which is what an unfiltered control
announces. The declaration then does not exist for that reader at all. Words are the
only signal that reaches every way of reading a screen, so the requirement is that the
words are always there, not that they are always drawn.

Rationale, on why this is not the count's job: a count is a number, its unit is carried by
the word beside it, and a rendering is permitted below to leave it out. A requirement met
only by an optional element is not met.

**The declaration MAY report how many of the filter's criteria are active, and MAY report
it in some renderings of a control and not others.** Where it does, that count SHALL be
derived from the same shared definition of what a filter means that decides what is
drawn, so that no two interfaces can report different numbers for one filter.

Rationale for the per-rendering allowance: one control is drawn at more than one size, and
the narrow one is a glyph above a single line of words with nowhere for a third element to
go. Requiring the count everywhere would either break that shape or forbid the count
outright, and the count is worth having where there is room for it. What SHALL NOT vary
by rendering is the declaration itself.

The count SHALL be of **criteria, not of the choices within them**: naming any number of
members is one criterion, and the count SHALL NOT change as members are added to or
removed from that set.

Rationale: the number has to mean the same thing on a trip of two and a trip of ten, and
counting ticked names would make it describe the input rather than the narrowing.

**Any number the declaration carries SHALL be unambiguous about what it counts.** A bare
number beside a control named for filtering is read as counting filters; if it counts
anything else, it SHALL carry the unit that says so.

Rationale: this is a defect that shipped. The declaration first reported surviving
markers as `15 of 17`, which is two unlabelled numbers next to the word `Filter` — the
likeliest reading was that fifteen of seventeen filters were applied, when one was. A
control whose likeliest reading is false is not merely uninformative; it is misleading,
and the information it carried was not worth that. What the filter did to the map is
already visible in the map, and the matches-nothing case is already stated where the
markers would be.

**The declaration SHALL NOT enumerate the members it was built from.** A control that
lists who is ticked grows without bound as members are named, and a trip may hold many;
at that size the label is unreadable, and it changes width every time the filter is
used, which is the rearrangement this requirement already forbids.

Rationale: this is a constraint on the declaration, not a retreat from it. What has to
be conveyed is that the view is narrowed, and at most how many questions it is asking —
both bounded — rather than which people it is asking about, which is what opening the
control answers.

**The declaration and the way out MAY be separated.** The declaration SHALL remain on a
control that is visible while the narrowed result is visible. The way out MAY instead
live inside what that control opens, provided the control that declares the narrowing is
also the one that reveals the way out, and provided reaching it costs a single
deliberate action.

Rationale: a permanent way out costs a slot in the one row a thumb can reach, and the
declaration is the half that has to be permanent — a person who cannot tell they are
narrowed does not know to look for the way out, while a person who can tell will look.
Binding the two together was an artefact of one control doing both jobs, not a
conclusion about either. What SHALL NOT happen is the two being carried by different
controls, which would leave somebody able to see that places are missing and hunting for
where to undo it.

An interface MAY conceal the narrowing controls while something else occupies their
place — a sheet describing a selected marker, for instance. Where it does, the
declaration and the way out SHALL be concealed together, and either SHALL become
available again by dismissing whatever concealed them.

Rationale: hiding both is honest, because nothing is then claiming that a narrowed
trip is a whole one. Hiding only the way out would leave somebody able to see that
places are missing with no means of getting them back, which is the failure this
requirement exists to prevent, arriving by a route the wording did not cover. The
permanence required above is permanence within the controls, not a claim that the
controls are always on screen.

When a filter matches no markers, the system SHALL say that nothing matches the filter,
and SHALL NOT present it as a trip with no markers. This SHALL remain true wherever the
absence is visible, including in place of the markers themselves, which is a different
statement from the declaration above and is not replaced by it.

Rationale: a filtered trip and a trip that lost its places render identically — fewer
pins, or none. The difference between "nothing matches what you asked for" and "there is
nothing here" is not one a person can recover on their own, and the second is alarming
in a way the first is not.

#### Scenario: A filter is active

- **WHEN** any filter is applied
- **THEN** the interface indicates that the view is narrowed
- **AND** clearing the filter is reachable from there

#### Scenario: The declaration reaches somebody who cannot see it

- **WHEN** a filter is applied
- **AND** the control that declares it is examined by its name rather than its appearance
- **THEN** that name says that the view is narrowed
- **AND** it says so in every rendering of that control
- **AND** clearing the filter returns the name to one that does not

#### Scenario: The declaration reports how many criteria are active

- **WHEN** one criterion is applied
- **AND** the declaration reports a count
- **THEN** the count reads as one
- **AND** applying a second criterion makes it read as two

#### Scenario: A rendering with no room for the count still declares the narrowing

- **WHEN** a filter is applied
- **AND** the control that declares it is rendered at a size that does not show the count
- **THEN** the view is still declared as narrowed
- **AND** the declaration is carried by at least two signals, one of them not a hue
- **AND** the control's name still says the view is narrowed

#### Scenario: The count does not follow how many members are named

- **WHEN** a filter names one member
- **AND** the declaration reports a count
- **THEN** naming four more members does not change that count

#### Scenario: A number says what it counts

- **WHEN** the declaration carries a number that counts something other than criteria
- **THEN** it carries the unit naming what it counts

#### Scenario: The declaration does not name the members

- **WHEN** a filter naming several members is applied
- **THEN** the closed control does not list those members
- **AND** the control does not change size as more members are named
- **AND** opening the control shows which members are named

#### Scenario: The way out of a narrowed view lives one action away

- **WHEN** the way out is not itself on screen beside the narrowed result
- **THEN** the control that declares the narrowing is on screen
- **AND** that same control reveals the way out
- **AND** no second control has to be found first

#### Scenario: The way out is offered before it is needed

- **WHEN** a trip is opened unfiltered
- **THEN** the control that clears the filter is already present wherever the way out lives
- **AND** applying a filter does not add a control beside it
- **AND** clearing the filter does not remove one

#### Scenario: The declaration does not depend on colour

- **WHEN** a filter is applied
- **AND** the interface is read without colour
- **THEN** the fact that the view is narrowed is still conveyed

#### Scenario: The narrowing controls are covered by something else

- **WHEN** a filter is applied
- **AND** a sheet describing a selected marker takes the place of the narrowing controls
- **THEN** neither the declaration nor the way out is shown
- **AND** dismissing the sheet restores both

#### Scenario: A filter matches nothing

- **WHEN** an applied filter matches no markers on a trip that has markers
- **THEN** the interface states that no markers match the filter
- **AND** does not state or imply that the trip has no markers

### Requirement: What a filter means is defined once and shared

The meaning of each filter — which markers naming two members selects, and the rest —
SHALL be defined in shared code used by every platform that offers filtering, rather than
implemented per application.

Rationale: these are definitions, not rendering. Two implementations of "wanted by both of
us" would eventually disagree, and the disagreement would show up as a place appearing on
a laptop and missing on a phone, which reads as a data problem and is not one.

Filtering SHALL NOT be used to hide markers the reader is not entitled to see; what a
member may read is decided where the data is stored, and re-deciding it while filtering
would conceal a policy defect rather than reveal one.

#### Scenario: Both platforms agree on what a filter selects

- **WHEN** the same trip and the same filter are evaluated by either application
- **THEN** both select the same markers

#### Scenario: Filtering is not a permission boundary

- **WHEN** markers are filtered
- **THEN** the filter narrows only what is shown
- **AND** what may be read is still decided where the data is stored

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

### Requirement: A place addressed by identity stays reachable while a filter is applied

Where the system opens a named marker on the person's behalf rather than in response to
them selecting it on the map, it SHALL open that marker even when the current filter is
not showing it, and SHALL say that the place is hidden by the filter.

Two paths do this: recognising a searched place the trip already holds, and showing on the
map a place opened from the calendar (`trip-calendar`). The calendar deliberately shows every
place on the trip whatever the map is narrowed to, so the place asked for there is as likely
as any to be one the filter hides.

The system SHALL NOT change or clear the filter in order to show the place. The filter was
chosen deliberately, and altering it so the product's own output makes sense is a change
nobody asked for and would have to be noticed and undone.

The system SHALL NOT silently do nothing. A marker addressed by identity and then not
shown, with no explanation, is indistinguishable from the application failing — and where
the map has already moved to the place, the person is left looking at an empty part of the
map with nothing to read.

The place SHALL also be drawn on the map for as long as it is open, and SHALL stop being
drawn when it is closed. Saying that a place is hidden, while the map it was flown to
shows nothing, was found by looking to be insufficient: on a screen where a sheet covers
the lower half and the camera is centred on the place, there is nothing else on screen to
make the sentence land, and the map reads as having failed. A pin drawn where the sentence
points is what makes it a place rather than a claim.

That pin SHALL be drawn and counted nowhere else. It SHALL NOT contribute to framing, SHALL
NOT be treated as evidence that the trip has markers in view, and SHALL NOT appear in any
list of the trip. It is on the map because it was named, not because the filter admitted
it, and an unsaved marker already has exactly this standing.

A marker that has been **removed** from the trip SHALL NOT be opened by this path. Hidden
and gone are different states: the first is a view setting and the second is a fact about
the trip, and only the first is recoverable by the person changing their mind.

This requirement does not weaken *A filter applies to every view of the trip at once*.
That requirement governs what the map and any list report the trip to **contain**, and
both SHALL continue to exclude what the filter excludes: the place is not restored to the
trip's drawn set, is not counted among it, and disappears again the moment its card is
closed. What is added is one pin under an open card, for as long as that card is open —
the same standing an unsaved marker has, which is likewise drawn without being part of
the set. A card about one named place, and the pin under it, do not report what the trip
contains.

#### Scenario: A searched place is hidden by the current filter

- **WHEN** a person chooses a search candidate matching a marker the filter is hiding
- **THEN** that marker is opened
- **AND** it is stated that the place is hidden by the current filter

#### Scenario: A place shown on the map from the calendar is hidden by the current filter

- **WHEN** a person asks to see on the map, from the calendar, a place the filter is hiding
- **THEN** that marker is opened
- **AND** it is stated that the place is hidden by the current filter

#### Scenario: The filter is left alone

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** the filter is unchanged
- **AND** no other marker the filter excludes is drawn

#### Scenario: The place is drawn under the card that describes it

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** a pin is drawn at that place
- **AND** it is removed again when the card is closed

#### Scenario: The revealed pin counts toward nothing

- **WHEN** a marker hidden by the filter is drawn because its card is open
- **THEN** it does not affect how the map frames the trip
- **AND** it does not appear in any list of the trip

#### Scenario: The place was removed rather than hidden

- **WHEN** a marker addressed by this path is no longer on the trip
- **THEN** nothing is opened for it
- **AND** it is not presented as hidden

#### Scenario: The map and the list still agree about the trip

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** no list of the trip shows that marker
- **AND** the map and the list still report the same set as the trip's contents

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
