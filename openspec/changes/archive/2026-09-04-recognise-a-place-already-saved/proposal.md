## Why

Searching for a place that is already saved on the current trip offers to save it again.
The map flies to it, a draft pin lands on top of the marker that is already there, and
the form opens asking for a name the trip already holds. Nothing on the path from a
search candidate to a new marker ever asks whether the trip already contains the place.

The two `onChoose` handlers — `apps/web/app/_components/workspace-chrome.tsx:287` and
`apps/mobile/components/trip-workspace.tsx:1308` — call `beginCreate` unconditionally.
Both sit inside the component that already holds the trip's markers (`markers` on web,
`held` on the phone), so the fact needed to answer the question is in scope at the call
site and simply not consulted.

The result is worse than a wasted step. The two markers hold identical coordinates, so
`groupCoincident` collapses them into one drawn point and the duplicate is invisible on
the map — it shows up later as two rows in a list nobody expected to have two rows.

Tracked by `#83`.

## What Changes

**A search candidate is checked against the trip's saved markers before anything is
created.** The check happens where `onChoose` already runs, against the markers the trip
holds rather than against the ones currently drawn.

**The match is exact coordinate equality, and deliberately nothing more.** A marker saved
from search stores the geocoder's coordinates unchanged, so searching the same place again
produces the identical pair of numbers. This is the same test `groupCoincident` already
applies to decide whether two markers are the same point, and the reasoning written above
it holds here without modification: *"Equality is exact, not 'within a few metres'."*

No tolerance is introduced. `#83` requires that a different venue a few metres away is not
swallowed as a match, and the gap between two neighbouring shops is the same distance as a
pin nudged onto the right doorway — there is no radius that separates them. Two cases
therefore keep behaving exactly as they do today, and that is accepted rather than
overlooked: a marker whose position was corrected after saving, and a marker added by
pointing at the map, are both offered as new. Neither is a regression, and a radius that
hid a place somebody meant to add would be a worse failure than the one being fixed.

**A match opens the place the way selecting its pin already does, on both platforms.**
Both applications answer a pin with the same thing — a card resolved from a `groupKey` and
a `markerId`, with a chooser while several places share the point (`trip-workspace.tsx:580`
on the web, `trip-map.tsx:683` on the phone). Editing is a press further in, on both. So
this change routes a match to that card and stops; it does not open a form.

That is not only consistency for its own sake. A geocoder answers with a building's
centre, so a single point routinely holds more than one saved place — that is why
`groupCoincident` exists — and a coordinate match can therefore match two markers at once.
The card renders exactly that. Opening an edit form directly would have to pick one of
them arbitrarily, on either platform.

It is also what somebody searching a place they have already saved is usually asking:
*did we add this?* The card answers that. A form assumes they came to change something.

**A matched place hidden by the current filter is opened and says so.** Both cards find a
place by looking it up among the drawn points — the web's `groups` is built from
`visibleMarkers`, the phone's from the `visible` set it is handed — so a marker the filter
is hiding has no group, the lookup returns nothing, and the card silently does not open.
The camera would fly to an empty patch of map and nothing would happen, which is worse
than the duplicate this change exists to remove. Both cards gain a second way in,
resolving the marker by id from the full set, and say that the place is hidden by the
filter. The filter itself is not changed: it was chosen deliberately, and altering it to
reveal one place is a side effect nobody asked for.

**The camera does not change, which is not free on the web.** The phone's `flyTo` is
already outside `beginCreate` and is untouched. The web's camera move lives *inside*
`beginCreate`, behind its `moveThere` flag, so a branch that no longer calls it loses the
zoom silently. Lifting the move out is part of this change rather than a consequence of it.

**Not breaking.** Nothing stored changes, no schema moves, no column is added, and no
capability is added or removed. A candidate that matches nothing behaves exactly as it
does today.

## Capabilities

### Modified Capabilities

- `place-search`: gains a requirement. The spec covers querying, biasing, ranking,
  distance and failure, and says nothing at all about a candidate the trip already holds
  — a candidate is currently defined only by what it carries, never by what it duplicates.
  The new requirement states the match rule in words (exact position), its scope (this
  trip, every city, regardless of what the filter is showing), that recognition changes
  where choosing leads and never what is offered or how it is ranked, and that a candidate
  saved on a *different* trip is not a match.

- `marker-capture`: one requirement is qualified. *A place can be added by searching or by
  pointing at the map* currently says without condition that choosing a candidate takes an
  unsaved position and opens the form; its scenario *A candidate is chosen from search*
  asserts the same. Both become conditional on the candidate not already being saved here,
  and a sibling scenario covers the match. The two ways of *beginning* are unchanged —
  this narrows when the search path produces an unsaved position, not how it works when it
  does.

- `marker-filtering`: gains a requirement, because this change puts a place on screen that
  the filter is hiding, which the spec does not currently allow for. What is stated is the
  narrow rule: a filter decides what the map draws, it does not decide what the trip
  contains, so a place addressed by identity — as a search match addresses it — is still
  reachable and is told to be hidden rather than silently withheld. This does not weaken
  *A filter applies to every view of the trip at once*: that requirement is about views of
  the trip's **set**, and a card about one named place is not one of them. The filter is
  never altered on the product's initiative.

- `map-rendering`: one requirement is qualified. *Changing a filter does not move the
  camera* requires that when a filter leaves matches but none are in view, the map says so
  and offers to frame them. That offer and an open description could not previously
  coexist — a marker selected by pointing is necessarily in view — so the condition never
  had to say more than that the drawn set was off screen. A place drawn *outside* the
  drawn set breaks that coincidence: found by looking, the offer appeared beside a
  just-found place and led away from it by name. The requirement gains the missing half.

`groupCoincident` and its exact-equality rule are used as they are, and no camera movement
changes.

## Impact

**Shared packages** — `@pinpoint/map` gains one pure function beside `groupCoincident`:
given a position and a set of markers, which of them sit exactly there. It belongs there
rather than in either application for a reason stronger than tidiness — the web's card and
the phone's are both addressed by the `groupKey` that `groupCoincident` derives through
its own coordinate normalisation, including the `-0` case. A match computed by a
comparison written separately could disagree with that key, and the failure would be a
card opening on a group that does not contain the marker it was opened for. One
normalisation, used by both. `apps/web` has no test runner, so this is also the only way
the rule gets a test at all.

**Web** — `workspace-chrome.tsx` (the `onChoose` handler consults the trip before
creating), `trip-workspace.tsx` (the camera move comes out of `beginCreate` so both
branches keep it; the details card resolves a marker by id when it is not among the drawn
points; the revealed point is derived and the none-in-view offer is withheld while it is
showing), `trip-map.tsx` (draws the revealed point, and lifts it clear of chrome, without
letting it frame anything or count as a marker in view), `marker-details.tsx` (says when
the place it is showing is hidden by the filter).

**Mobile** — the same changes in a different arrangement, and the arrangement is the
work. It has no none-in-view offer, so that half is web-only. The card's open state lives inside `trip-map.tsx` rather than in the workspace, so
the workspace — which is where `onChoose` runs — cannot set it directly. The map already
exposes an imperative handle (`flyTo`, `frameOn`); opening a place is a third method on
it. `trip-workspace.tsx` decides the match, `trip-map.tsx` opens the card and gains the
by-id fallback, `marker-details.tsx` carries the note.

**Database, dependencies, configuration** — none. No column, no query, no new service. The
`$0` constraint is untouched and no credential is involved.

**Documents** — none expected. `DESIGN.md` describes shapes; this changes where a press
leads, not what anything looks like.

**Verified by looking, and it has to be** — every part of this type-checks and renders
whether or not it is right. The camera regression on the web is invisible to a type
checker, the filtered-marker case produces a screen where *nothing happens*, and the match
itself is a comparison of two numbers that will look correct while matching nothing. The
repro in `#83` is run on both platforms and in both themes, along with the three cases
that must keep working: a place saved on another trip, a place saved nowhere, and a
different venue a few metres from a saved one.

**Adjacent** — `#52`, which is also about a search candidate's relationship to what the
trip already holds, but asks a different question of it (which city it is in). It reads
structured fields off the candidate that this change does not need. They do not conflict
and neither blocks the other.
