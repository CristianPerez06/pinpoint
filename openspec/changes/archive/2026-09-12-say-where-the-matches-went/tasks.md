## 1. See the state before changing anything

The three sections that follow all add code whose correct behaviour is often that
*nothing appears*. Without a before, "nothing appeared" cannot be told from "nothing
works". Record these, in this change directory, before touching a file.

> **Not done, and it cost exactly what this section said it would.** Implementation
> started without the before-shots. The first report from the device was "the message is
> still not being displayed", and it took a diagnostic build to learn that the condition
> was true and the note was being drawn below the bottom of the screen — along with the
> existing "No places match this filter" note, which had never been visible on the phone.
> 1.2 would have come back "that note is not there either" before any new code existed to
> suspect. 1.5 was done late, as that diagnostic; the rest of this section was not done.

- [ ] 1.1 On the phone, reproduce `#85`: open a trip with several places, apply a filter
      leaving at least one match, pan until no match is on screen. Record what the map
      shows — an empty map, the filter tool still marked, and no note — in both themes
- [ ] 1.2 On the phone, record the two notes that already work, so a regression in them is
      visible later: a trip with no places, and a filter matching nothing
- [ ] 1.3 On the laptop, record the notice working today: the wording, the count, and where
      the camera lands when the offer is accepted. This is the sentence the phone is being
      brought level with, not a new one to invent
- [ ] 1.4 On the laptop, record the two states this change withholds the notice in, both of
      which show it today: with the drop sight armed, and with an unsaved pin awaiting its
      details, in each case with the filter's matches panned off screen. These are the
      before-shots for a deliberate removal
- [x] 1.5 Log one `onRegionDidChange` event on a device, whole, and read what is actually
      in it. This answers the open question in `design.md` — whether the event fires once
      after the initial camera or only after a gesture — and confirms `bounds` is present
      at runtime rather than only in the type. Everything below is built on that field;
      nothing else in this change is worth starting until it has been seen

## 2. The containment test, in `@pinpoint/map`, with tests

- [x] 2.1 Add the function: a bounds `[west, south, east, north]` and a position in, whether
      the position lies inside out. Structurally typed on the shapes already in the package,
      so neither application has to convert into a type of its own
- [x] 2.2 Decide longitude wrap explicitly and write the reasoning above it. Bounds crossing
      the antimeridian arrive with `west > east`, and the range is then the two pieces
      either side of ±180 rather than the empty span between them. Mirror MapLibre's rule
      rather than inventing one — the web is switching off `bounds.contains()` and a trip
      that spans ±180 is the only case where the two can disagree
- [x] 2.3 Latitude needs no wrap and is a plain comparison. Say so, so nobody adds symmetry
      that does not exist
- [x] 2.4 Tests, written for the cases nobody would click: a position inside; outside on
      each of the four sides; exactly on each edge; a bounds crossing the antimeridian with
      a position on either side of it; a zero-width bounds; `-0` against `0`
- [x] 2.5 `pnpm test`, `pnpm check:cycles`, `typecheck:packages` pass, and nothing imported
      here reaches a renderer, a DOM API, or a native module

## 3. Web adopts the shared test and withholds while placing

- [x] 3.1 In `apps/web/app/_components/trip-map.tsx:641`, replace `bounds.contains()` with
      the shared function, converting the renderer's bounds object to the tuple at the call
      site. A shared function only one application calls is not shared
- [ ] 3.2 Confirm by looking that the notice still appears and still clears exactly as
      recorded in 1.3. This is a swap with no intended behaviour change, and it is the kind
      that type-checks whatever it does
- [x] 3.3 Add the placement-in-progress half to the notice's condition in
      `trip-workspace.tsx:1519` — `dropping` and `draft` are both already in scope there
- [x] 3.4 Extend the comment above that condition rather than starting a new one. It already
      records why the revealed case is withheld; this is the same reasoning reaching a
      second state, and a separate note would read as a second rule
- [ ] 3.5 Check 1.4 again: sight armed and unsaved pin awaiting details, matches off screen,
      no notice in either. Then dismiss each and confirm the notice returns

## 4. The phone reads what it is already handed

- [x] 4.1 In `apps/mobile/components/trip-map.tsx:912`, keep `bounds` off the settle event
      alongside the centre and the zoom already read there. State, not a ref — it is read
      during render, unlike the centre, which is read at the moment of a press
- [x] 4.2 Handle a missing `bounds` deliberately. Android builds it inside a `try/catch`
      and returns the view state early when the camera has no target, so the key can be
      absent while the type says it cannot be. Keep the last known value; never index into
      the tuple on the strength of the type
- [x] 4.3 Write down, where the state is declared, that nothing has been reported before the
      first settle and what is assumed in the meantime — the map opened framed on its
      markers, a filter only removes, so a subset of a framed set is still framed

## 5. One question, answered upward

- [x] 5.1 Derive, inside `trip-map.tsx`, whether there is anything on this map to look at:
      any drawn group within the bounds, **or** a revealed place's sheet open, **or** a
      position being placed — the sight armed or a draft awaiting its details. All four
      facts are already in that component
- [x] 5.2 Report it through one callback on `TripMap`, named for the question rather than
      the mechanism: `onSomethingToLookAt(something: boolean)`. Write above it what the
      boolean means and why it is one value and not three — AGENTS.md's account of `#83` is
      the reason, and the next person to draw a pin outside the filtered set is the audience
- [x] 5.3 Report from an effect on the derived value, not during render. One frame of lag,
      the same the laptop has and the same `zoom` already has here
- [x] 5.4 Hold it in the workspace as `somethingToLookAt`, defaulting to `true`
- [x] 5.5 Do **not** lift the sheet's open state out of the map. If the work starts pulling
      that way, stop — the argument against it is written on `openMarkers` and this change
      is the caller it was written about

## 6. The third note

- [x] 6.1 Add it in `trip-workspace.tsx` beside the other two, on the condition: a filter is
      applied, it matches something, and there is nothing to look at
- [x] 6.2 Use the phone's own idiom — the whole note is what is tapped, and the sentence
      says so — rather than the laptop's inline button. Singular and plural both, as the
      other two notes already handle. **Written first as a `Pressable` wrapped round the
      note, copying the "tap to clear" note, and that idiom was the defect:** the note is
      absolutely positioned against a wrapper that had collapsed to nothing at the bottom of
      the column. `MarkersOverlayNote` now takes `onPress` and is the pressed thing itself,
      and both tappable notes use it
- [x] 6.3 Accepting it calls `frameOn` on the map's handle with the matching positions, and
      passes no inset: the bar is what stands on the map and the component already measures
      it. Do not reach for the `bottomInset` parameter — it exists for things that do not
      exist yet when the call is made
- [x] 6.4 Confirm the filter is untouched by accepting. The offer moves the camera and
      nothing else
- [x] 6.5 Confirm the order the three notes are written in cannot produce two at once. They
      are mutually exclusive by their conditions; check that rather than assume it

## 7. Look at it, on a device, in both themes

Every task above type-checks and renders whether or not it is right, and four of the
states below are ones where the correct outcome is that nothing appears.

> **Partly done.** 7.1 was confirmed on the phone, after the positioning fix above. The rest
> were not run before archiving and are recorded as open rather than assumed: the withheld
> states (7.4, 7.5), the note behind the bar (7.6), and the laptop's regression check
> (7.10, with 3.2 and 3.5) are the ones where a silent failure looks like success. 7.7 no
> longer describes the intent — the filter-matching-nothing note was not unchanged, it was
> made visible for the first time.

- [x] 7.1 The repro from 1.1, now: the map says how many places match and that none are in
      view, and offers to frame them. Both themes
- [ ] 7.2 Accept the offer. The matches are framed, they land clear of the bottom bar, and
      the note goes away. It must not reappear once the camera settles
- [ ] 7.3 A single match reads as a sentence about one place, not "1 places"
- [ ] 7.4 Search a place the filter is hiding, so its sheet opens on a revealed pin with the
      matches off screen. No note, and the place being read stays the thing on screen. Close
      the sheet and the note appears
- [ ] 7.5 Arm the drop sight with the matches off screen: no note. Disarm it: the note
      appears. Then place a pin and leave the form open: no note. Save or abandon it: the
      note appears
- [ ] 7.6 A match sitting behind the bottom bar counts as on screen and raises no note. This
      is the decision from `design.md` being confirmed rather than a bug being found
- [ ] 7.7 The two existing notes are unchanged: a trip with no places, and a filter matching
      nothing, still say what 1.2 recorded
- [ ] 7.8 Applying, changing and clearing a filter moves no camera. The only motion in this
      change is accepting the offer
- [ ] 7.9 An unfiltered trip panned away from every marker raises no note — the notice is
      about a filter's matches, not about an empty view
- [ ] 7.10 Repeat 7.1 and 7.4 on the laptop, to confirm nothing regressed there while its
      containment test was swapped underneath it

## 8. Close out

- [x] 8.1 `openspec validate say-where-the-matches-went --strict`
- [x] 8.2 `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm check:cycles`, `pnpm check:tokens`
- [x] 8.3 If the settle event, the missing `bounds`, or anything else here cost real time in
      a way that reads as a different problem than it is, add it to the gotchas in
      `AGENTS.md`. Write the shape of the failure, not only the fix
- [ ] 8.4 Record in this directory what 1.5 found about `onRegionDidChange` — whether it
      fires before the first gesture — and close that open question in `design.md` either
      way. *Half answered:* the device log showed `bounds` present and well-formed on iOS
      (`[134.57, 30.56, 138.98, 37.23]`), which was the load-bearing half. Whether the event
      fires before a gesture was not established from what was captured, so the question
      stays open in `design.md`
