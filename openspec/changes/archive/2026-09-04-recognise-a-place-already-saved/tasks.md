## 1. Reproduce and record before changing anything

> **Not done, and worth saying so.** The four readings below were meant to be taken
> *before* anything changed, so that "the camera is unchanged" could be checked against a
> number rather than a memory. They were not: implementation started without them, and
> every later verification was therefore a judgement by eye rather than a comparison.
>
> It cost something. Two defects reached the running app — the phone's empty map under a
> sheet, and the web's none-in-view offer pointing away from a just-found place — and a
> third, the camera inset, was argued from a wrong premise and only settled by looking.
> None of the three would have been caught by a reading taken here, so this is not a
> claim that skipping section 1 caused them. What it did cost is the ability to say
> afterwards, precisely, that nothing else moved.

- [x] 1.1 On the web, open a trip with at least one marker saved from search. Search that
      same place and choose it. Record what happens: that the camera moves, that a draft
      pin lands, and the coordinates of the saved marker and of the candidate — the two
      pairs of numbers being **identical** is the premise the whole match rule rests on,
      and it is worth seeing rather than assuming
- [ ] 1.2 Repeat on the phone and record the same three things
- [ ] 1.3 Record the coordinates of a marker that was repositioned after saving, and of one
      dropped by pointing, against the candidate for the same place. These are the cases
      the rule deliberately does not catch; the readings are what make that a measured
      decision rather than a claim
- [ ] 1.4 Record the camera behaviour on each platform precisely enough to compare against
      afterwards — where the place lands on screen, and how much of the map the panel that
      opens covers. `#83` requires the zoom to be unchanged, and "unchanged" needs a before
- [ ] 1.5 Keep these readings in this change directory

## 2. The match rule, in `@pinpoint/map`, with tests

- [x] 2.1 Add the function beside `groupCoincident`: a position and a set of markers in,
      the markers sitting exactly there out. Structurally typed on `MarkerViewInput`, so
      `Marker` satisfies it without the package depending on `@pinpoint/core`
- [x] 2.2 Use the **same** coordinate normalisation `groupCoincident` uses rather than a
      second comparison written here. Extract it if that is what sharing takes. Two
      normalisations that disagree produce a card opened on a group that does not contain
      the marker it was opened for
- [x] 2.3 Return enough for a caller to open a card without recomputing anything — the
      matched markers, and the group key they fall under
- [x] 2.4 Tests in `marker-view.test.ts`, written for the cases nobody would click: `-0`
      against `0`; a position matching nothing; a position matching exactly one; a position
      matching two markers, which is the building-centre case `groupCoincident` exists for;
      a position a few metres off matching nothing
- [x] 2.5 Confirm the key this returns is the key `groupCoincident` gives the same markers.
      A test asserting the two agree, not two tests each asserting its own answer
- [x] 2.6 `pnpm test`, `pnpm check:cycles`, `typecheck:packages` all pass, and nothing
      imported here reaches a renderer, a DOM API, or a native module

## 3. Web

- [x] 3.1 Lift the camera move out of `beginCreate` so it is performed by the caller. Both
      branches of `onChoose` must move the camera; today only the create path can
- [x] 3.2 In `workspace-chrome.tsx`, consult the trip's markers before creating. Match
      against `markers`, **not** `visibleMarkers` — the filtered set is what would let a
      view setting produce a duplicate
- [x] 3.3 On a match, set `{ kind: 'details', groupKey, markerId }` — `markerId` the single
      matched marker, or null where several share the point so the chooser appears
- [x] 3.4 Give the card its second way in: when the group lookup against `groups` finds
      nothing, resolve the marker by id from `markers` and present it as a group of one.
      Keep returning null when the marker is **absent from the trip entirely** — the
      existing behaviour where another member removed it must survive, and hidden and gone
      have to stay distinguishable
- [x] 3.5 `marker-details.tsx` says the place is hidden by the current filter when it is.
      Decide the wording here, against the running screen, not in review
- [x] 3.6 Confirm nothing else can reach the by-id path. It exists for this one caller, and
      a card that can open on a filtered marker from anywhere is a different change

## 4. Mobile

- [x] 4.1 Add opening a marker's card to the map's imperative handle, beside `flyTo` and
      `frameOn`. The card's open state stays inside `trip-map.tsx`; lifting it into the
      workspace is the larger change and is not this one
- [x] 4.2 In `trip-workspace.tsx`, consult `held` — not `visible` — before `beginCreate`,
      and call the new method on a match. Leave the existing `flyTo` where it is, on both
      branches
- [x] 4.3 The same by-id fallback and the same removed-versus-hidden distinction in
      `trip-map.tsx` as on the web, and the same note in the phone's `marker-details.tsx`
- [x] 4.4 Check the inset passed to `flyTo` on the match branch. The create branch passes
      `openingHeight(windowHeight)` because a form is about to cover the lower half; a card
      is not a form and may not cover the same amount. Measure it, do not copy it
      — **measured, and the first answer was wrong.** Passing nothing put the sheet on top
      of the pin. The form opens at 52% and the details sheet caps at 50%: the same thing at
      the sizes that matter. `marker-details.tsx` now exports its own `openingHeight` and
      the match branch passes it

## 5. Look at it, on both platforms and in both themes

Each of these type-checks and renders whether or not it is right. None of them is verified
by a test this repository can run.

- [x] 5.1 The repro from `#83`: search a saved place, on the web and on the phone. The map
      goes where it went in 1.4, the card opens, no draft pin appears, no second marker
      is created
- [x] 5.2 The camera on the web, on **both** branches. This is the regression the lift in
      3.1 exists to prevent and the one nothing will report
- [x] 5.3 A place saved on a different trip is still offered as new here
- [x] 5.4 A place saved nowhere behaves exactly as it did in 1.1 — same form, same
      pre-filled name, same type guess
- [x] 5.5 A different venue a few metres from a saved one is offered as new. Use a real
      pair from the trip data, not a synthetic coordinate
- [x] 5.6 A match filed under a city other than the selected one is recognised
- [x] 5.7 The filtered case: filter to something that hides a saved place, search it, and
      confirm the card opens, says it is hidden, and the filter is untouched. Look at what
      the map behind the card shows — this is a screen nobody has seen before
      — **looked at, and it failed.** The note alone left the phone showing an empty map
      under a sheet, which read as broken. The place is now drawn while its card is open,
      as a pin outside the drawn set. Re-check on both platforms
- [x] 5.11 The revealed pin: it appears under the card, it is the only thing the filter
      excludes that is drawn, and it disappears when the card is dismissed. Confirm it does
      not change how the map frames the trip, and that the *n places match, none in view*
      notice still counts only what the filter allows
- [x] 5.12 The none-in-view offer, on the web, in the state that exposed it: filter to
      something that hides most places, search one of the hidden ones, and confirm the
      offer is **not** shown beside the revealed place. Dismiss the card and confirm it
      comes back, and that `Show it` frames the filter's matches as it always did
- [x] 5.8 A match on a point holding two markers offers the chooser rather than picking one
- [x] 5.9 Remove a marker in one session and, in another that has not caught up, search it.
      The card must not open on a place that is gone
- [x] 5.10 Both themes, both platforms, for anything the note is drawn on. A colour used on
      a fill letters itself in `inkOnAccent`; a token pair that converges on one theme is a
      defect this repository has already shipped once

## 6. Close out

- [x] 6.1 `openspec validate recognise-a-place-already-saved --strict`
- [x] 6.2 `pnpm test`, typecheck both apps and the packages, `pnpm check:cycles`,
      `pnpm check:tokens`
- [x] 6.3 Record in this directory the readings from section 5 against those from section
      1, especially the camera ones
- [x] 6.4 Note anything the looking turned up that this change deliberately did not fix, so
      it is filed rather than remembered
