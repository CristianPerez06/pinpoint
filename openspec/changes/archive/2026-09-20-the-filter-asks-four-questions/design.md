## Context

`MarkerFilter` in `packages/core/src/marker-filter.ts` carries two questions, `interest`
and `visited`, and `activeFilterCount` counts them. Both applications read that one
definition, which is what stops a place appearing on a laptop and missing on a phone.
Three more questions go in the same place.

Two constraints shape everything below.

**The filter's trigger may not change width.** `#87` established this the hard way: the
trigger went from 82.93px to 122.46px the moment a filter was applied, and its own panel
is positioned against it, so the panel slid out from under whoever was choosing inside
it. The slot is now a settled `124px` in `trip-workspace.module.css:167`.

**The count counts criteria, not choices**, so it stays a single digit as questions are
added. Together these mean *new axes cost the bar nothing* — which is why #122 and #127,
grouped with these tickets on the assumption that a third control would push on the bar's
width, are not in this change.

**What was measured, because #57 asked for evidence.** Japan 2026 holds 105 places:
Kyoto 31, Osaka 44, Hiroshima 13, Hakone 9, Nara 8, Kanazawa 0, Unassigned 0. At the zoom
the application itself picks when a city is selected — Nara frames only Nara's 8, Kyoto
only Kyoto's 31, and **Osaka frames its own 44 plus seven of Nara's eight**, legible and
individually distinguishable. So cities do share a screen, in one of three cases and in
one direction only, and it happens where the two are about as far apart as the larger
one's own places are spread.

## Goals / Non-Goals

**Goals:**

- A trip can be narrowed by kind of place and by day, on both applications.
- The places filed under no city can be narrowed to, which is an obligation already in
  force and not met.
- The panel holding the questions does not grow with the trip.
- What a filter means stays in one place, so the two applications cannot disagree.

**Non-Goals:**

- Narrowing by a named city. Answered no, with the measurement above.
- A date picker. The days offered come from the trip, so nothing here waits on #145.
- The laptop bar's width or its breakpoint (#122, #127).
- Reading the phone's narrowed state in greyscale (#123) — a look, after this lands.
- Deciding how a place comes to have several days (#156). Only what such a place
  *matches* is decided here, so that #156 inherits the rule.

## Decisions

### #57 is answered no, and the evidence points the other way from the ticket

**Decision: no city axis.** The ticket reasons that if cities overlap on screen then
framing is not enough and the refusal is blocking a real case. The measurement says the
opposite once you look at *which* places overlap. Osaka's frame reaches Nara because
Osaka's own places spread about 30km and Nara is about 30km away — so those seven pins
are precisely the "genuinely around the corner" case the refusal exists to protect.
Filtering to Osaka would delete the places whose nearness is the answer. And where a
city's places do not reach its neighbours, framing has already narrowed the view without
hiding anything, so a filter would have nothing to do.

**Three of the ticket's premises had also gone stale**, which is worth recording because
two of the three tickets in the previous group were wrong about themselves in the same
way. It quotes `city-bar.tsx` saying a city selection does "three things and deliberately
not a fourth" — it does two now, filing having moved to where the place actually is. It
says the phone has no city control — it has had one, with selection and an Unassigned
row, since `#149`. **Check a ticket's quoted evidence against the file it quotes before
building on it.**

### The specification described hiding the product has never done

**Decision: correct the requirement, and move the hiding to the filter.**

*Places belonging to no city are listable as a group* has always said that selecting the
Unassigned group shows the unfiled places "and places filed under a city are not". No
application has ever done that: `markersSelectedBy` is called in exactly two roles in
each application — the camera and the place-search bias — and the drawn set is narrowed
by `matchesFilter` alone. The live trip has nothing unassigned, so the one state the row
exists for has never been entered.

This is the mirror of what `#178` turned out to be. There, two applications invented
behaviour no requirement described; here, a requirement describes behaviour no
application implemented. **Both are found the same way — by reading the requirement
beside the code rather than either alone — and neither shows up as a failing test,
because nothing tests what was never built.**

The correction has two halves. The city list goes on framing and counting, which is what
its own name — *listable* — says it is for. The hiding becomes a criterion in the filter,
where there is a control that declares its own narrowing and offers the way back. Doing
it on the city list would hide places with nothing on screen saying so, which is the
failure `marker-filtering` exists to prevent.

Framing would in any case be a weak answer here: unfiled places have no reason to be near
one another, so a camera fitted around them can be the whole trip.

### Kind composes as *any*, and the control has to say so

**Decision: ticking several kinds shows places of any of them.**

A place is exactly one kind, so the *all* reading — which is what naming two people means
one question above it — would always select nothing. That is not a real alternative; the
real risk is that two lists of tick boxes in one panel are read as meaning the same
thing. So the requirement is that the control **says which question it is asking in
words**, rather than leaving somebody to infer it from what the map does. This is the
same instinct as the token described by how it should feel: a control whose behaviour has
to be inferred licenses the wrong inference.

### The day filter is a closed set of the trip's own days

**Decision: offer the trip's days as a list, ticked like the kinds, plus the places
carrying no day.**

The alternative was a stretch between two dates. The closed set wins on three counts. It
makes every question in this panel the same kind of thing — a set of choices — where a
range would be the only control that is not. It needs no date control, so #145's
unsettled business stays out of this change entirely. And it expresses "Thursday and
Sunday", which a range cannot.

The set is drawn from the trip rather than from a calendar, which also answers the two
edge cases the schema permits: a trip carrying no dates of its own still offers the days
its places carry, and a place dated outside the trip's dates contributes its day too.

**A place on several days matches if any one of its days is chosen**, stated now although
no place can have several days yet. #158 and #156 have to agree on this and whichever
runs second would inherit it; stating it here means #156 inherits a rule rather than
setting one, which is the sequencing the roadmap flagged.

### Filtering by kind reads the kind the same way drawing does

**Decision: narrowing to a kind selects every place drawn as that kind.**

The stored column is unconstrained text and `markerTypeOf` resolves a retired identifier
to its replacement and anything unknown to a fallback, never rejecting. So a place can be
drawn as one kind while carrying another value entirely. If the filter matched the stored
string, narrowing to the kind you can see on the map would make the place you were
looking at disappear — which reads as a data problem and is not one.

Note the shape of the trap next door: `markerTypeSchema` is `z.string().refine(isMarkerType)`,
and giving `isMarkerType` a type predicate retypes `Marker.type` through every consumer
of that schema. Reads and writes want different strictness here on purpose. Whatever
resolves a kind for filtering must be the read-side answer, and must not be attached to
the predicate the schema refines on.

### The panel shows one row per question

**Decision: each question is a row stating its answer, expanding one at a time.**

Drawn at the worst case the product permits — ten members, eight kinds, twenty-one days —
every choice on screen at once is about 1,240px of content in a panel capped near 560px.
Two thirds of it sits below the fold, including *Clear the filter*, which
`marker-filtering` requires to be reachable from where the narrowing is declared. At two
questions it fits, which is why nothing has gone wrong yet; the third and fourth are what
make the panel grow with the trip.

A collapsed row **states its own answer in words** — *You and Ana*, *Food, Temple*,
*19–21 March*. This is not in tension with the rule that the declaration must not
enumerate the members: that rule is about the *closed trigger*, whose width would change
every time the filter was used, and the same requirement's own scenario says that opening
the control shows which members are named. A row inside the panel has a settled width and
truncates.

## Risks / Trade-offs

- **Two tick lists, opposite meanings.** *Wanted by* means all, *Kind* and *Day* mean
  any. The mitigation is wording rather than arrangement, and it is a requirement rather
  than a suggestion. It is still the thing most likely to be got wrong later by somebody
  making the three look consistent.
- **Correcting a requirement is a deletion.** The old scenario said selecting the
  Unassigned group hides the filed places. Anything that was relying on that sentence
  being true is relying on something that was never true, but the sentence is being
  removed rather than softened, and this document is the record of why.
- **A twenty-one-day trip makes a long list.** Grouping the days by week keeps it
  scannable, and the section is collapsed until opened, but the day list is the one
  question here whose length is set by the trip rather than by the product.
- **Four criteria can select nothing quite easily.** The "filter matches nothing" note
  already exists and is required for each new dimension, so this is a case that is
  covered rather than new — but it will be reached far more often than with two.
