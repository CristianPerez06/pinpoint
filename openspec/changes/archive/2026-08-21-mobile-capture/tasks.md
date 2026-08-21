## 1. The portability claim, tested before anything is built on it

- [x] 1.1 Add `@pinpoint/geocode` to `apps/mobile/package.json` and install.
- [x] 1.2 Call `searchPlaces` from the mobile app with React Native's `fetch` and
      confirm it returns candidates under Metro. Check the three outcomes
      separately — ready, empty, and failed with the device offline — because the
      whole point of that return type is that they are distinguishable.
      *Verified two ways, neither of them Hermes on a device: the live geocoder
      through `apps/mobile`'s own module resolution returned all four outcomes
      distinguishable (ready 8 candidates, empty, aborted, failed), and
      `expo export --platform ios` bundles the package — `photon.komoot.io` and
      `location_bias_scale` are both in the emitted bytecode, so the
      "Cannot find module" failure mode is ruled out. Running it in Hermes is
      folded into 9.2.*
- [x] 1.3 **Stop if any shared package needed a change.** Nothing under
      `packages/` should have to move. If something did, that means a
      reimplementation is starting rather than a port, and it is worth
      understanding before the screens are built on top of it.

## 2. The camera learns to move

- [x] 2.1 Give `Camera` a ref in `apps/mobile/components/trip-map.tsx` and expose
      a `flyTo` upward, keeping `initialViewState` for the opening frame so the
      camera stays uncontrolled and cannot fight a pan.
- [x] 2.2 Verify on a device that flying to a position does not disturb the
      framing the map opened with, and that panning during a flight is not fought.

## 3. Search, as a screen

- [x] 3.1 Add a `Search` pill to the bottom row in `trip-workspace.tsx`, beside
      `Filter`. Leave `Clear` exactly where it is.
- [x] 3.2 Build the full-screen search: query field, the three states search can be
      in (searching, empty, failed) kept distinct, and candidates carrying name,
      context, guessed type as a drawn pin, and distance.
- [x] 3.3 Debounce to one request per typing pause and cancel every superseded
      request, matching web's quiet period. Photon's public instance throttles
      heavy use and this is the second client pointed at it.
- [x] 3.4 Bias each query with the map's current centre, taken from the
      `onRegionDidChange` state added in group 4.
- [x] 3.5 Choosing a candidate closes the screen, flies the camera to it, and opens
      the form with the name and guessed type filled in.
- [x] 3.6 Look at it on a device: the keyboard must not cover the first candidate,
      and a long place name must not push the distance off the row.

## 4. The sight

- [x] 4.1 Add a `Drop` pill that arms the sight and swaps the bottom row for a
      confirm bar in the same slot, so `barHeight`, the ornament lift and the
      credit offset keep working unchanged.
- [x] 4.2 Draw the sight as an absolutely positioned `View` with
      `pointerEvents="none"`. **Not a `Marker`** — the annotation layer must stay
      untouched, and no `onPress` may be added to `Map`.
- [x] 4.3 Centre it on the map as drawn, not on the screen. The header sits above
      and the confirm bar below; centring on the screen puts every dropped pin
      consistently off-target in one direction.
- [x] 4.4 Track the position from `onRegionDidChange`'s `event.nativeEvent.center`.
      *`userInteraction` is deliberately not branched on, against what this task
      originally said. The position under the sight is wherever the map is, and
      how it got there does not change what is under the ring — recording only
      person-driven settles would leave the centre stale after a flight and hand
      the next press a position from before it. The flag is named in a comment
      with that reasoning rather than used.*
- [x] 4.5 Confirming opens the form with no name; cancelling restores the bottom
      row and stores nothing.
- [x] 4.6 **Verify on iOS specifically** that tapping an existing pin while the
      sight is armed still selects it, and that tapping one while it is not armed
      still opens its sheet. This is the recogniser defect's neighbourhood.
      *Selecting now also disarms the sight — see group 12.*
- [x] 4.7 Verify the sight is over the point it appears to be over: drop a pin on a
      recognisable feature, save it, and check the saved marker lands on it.

## 5. The form

- [x] 5.1 Build the full-screen marker form with all six fields: name, type as a
      grid of drawn pins, city, note, link, price. Same fields as web, filled from
      the same `MarkerFormValues` shape.
- [x] 5.2 Give it a definite height and keyboard avoidance so the save action stays
      reachable with the keyboard up. Do not put a `ScrollView` inside a
      content-sized container — see `AGENTS.md` and the fix already carried in
      `marker-details.tsx`.
- [x] 5.3 Blank optional fields record as absent, never as empty text. A typed zero
      price is a real answer and must not collapse into absent.
- [x] 5.4 Add `Adjust position`, which returns to the sight centred on the current
      position and comes back with every typed value intact.
- [x] 5.5 Wire `createMarker` and `updateMarker` from `@pinpoint/data`. A saved
      place appears among the trip's markers without re-reading the trip.
- [x] 5.6 Handle all three refusals distinctly: invalid input names the offending
      field and preserves everything typed; a conflict says somebody else changed
      the place; anything else is a plain message. Do not match on wording.
- [x] 5.7 The city select offers the trip's cities, defaults to the last city used
      on this device, and offers creating a new one inline without losing the place
      being saved.

## 6. Editing, removing, and the stale-read refusal

- [x] 6.1 Add edit and remove to `marker-details.tsx`, reached from the sheet that
      already shows what was recorded.
- [x] 6.2 Editing opens the form filled from what is stored, and carries the
      `updatedAt` the edit was based on — captured when the form opened, never
      re-read at save time, which would make the check pass by construction.
- [x] 6.3 Removing asks for confirmation and says it cannot be undone.
- [x] 6.4 **Make two devices collide on purpose.** Edit one marker on web and on the
      phone from the same starting state, save the phone's second, and confirm it
      is refused, said out loud, and that what was typed survives. This defect is
      invisible by construction — a silent overwrite leaves no error and no log
      line — so watching it is the only verification there is.

## 7. Cities

- [x] 7.1 Add a cities section to `menu-sheet.tsx`: the trip's cities, each
      renameable and able to be given a currency.
- [x] 7.2 Removing a city confirms first and states how many markers it will
      unassign. Those markers stay on the trip, unassigned.
- [x] 7.3 Changing a currency changes no stored amount, and prices under that city
      are read in it afterwards.
- [x] 7.4 A city created from inside the form appears here without re-reading the
      trip.

## 8. The specification catches up

*8.1 to 8.3 were written as work and are not: `openspec archive` applies the
deltas to `openspec/specs/` itself, which is how every previous change did it —
no archived change has a task for it. Hand-editing the main specs now would make
the archive step apply them twice. They are left here as a record of what the
delta contains, to be checked after archiving rather than done before it.*

- [ ] 8.1 Delete `marker-capture`'s "Capture is offered by the web application
      only" and add "Both applications offer capture" in its place.
      *Performed by `/opsx:archive`.*
- [ ] 8.2 Apply the four modified requirements in the `marker-capture` delta and the
      one in `map-rendering`. *Performed by `/opsx:archive`.*
- [ ] 8.3 Remove the superseded no-conflict paragraph and its scenario from "A
      marker can be edited and removed by any member of the trip". It contradicts
      "A save based on a stale read is refused", which is the one that is built.
      *Carried by the `MODIFIED` requirement in the delta, so `/opsx:archive`
      performs it.*
- [x] 8.4 Record the sharpened parity rule in `ROADMAP.md`'s decisions — either
      application is sufficient on its own; a person may use one and never open the
      other. It is what decided this change's city scope and it is not written down
      anywhere yet.
- [x] 8.5 Move mobile capture from `Next` to `Done` in `ROADMAP.md`, saying what
      turned out differently from the plan — the missing draggable marker above all,
      since it is the reason the phone's mechanism is not the laptop's.

## 9. Looking, before it is called done

- [x] 9.1 `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:cycles`,
      `pnpm check:tokens`. Necessary and, on the evidence of four consecutive
      changes, not close to sufficient.
- [x] 9.2 Capture a place by search and a place by dropping, on a device, and check
      both land where intended.
- [x] 9.3 Walk the whole path once with the filter on: capture something the filter
      hides, and confirm the app says why it vanished rather than appearing to have
      lost it.
- [x] 9.4 Check the bottom bar at 375pt with all four controls present, and confirm
      nothing clips and the licence credit is still legible above the bar.
- [x] 9.5 Confirm nothing under `packages/` changed. If something did, say so
      explicitly in the change's summary rather than letting it pass — the estimate
      for the rest of the roadmap rests on this claim.

## 10. The form becomes a sheet, after using it

Raised from using the built app: a form covering the whole screen leaves a geocoded
result unconfirmable, because the only way to check that the place found is the
place meant is to look at where it landed. Search stays a full screen — the keyboard
takes roughly 40% of the height, so a half-height search would show a strip of map
that is not answering anything.

- [x] 10.1 Draw the unsaved marker. `DraftPin` in `pin.tsx` — the same teardrop,
      hollow with a dashed outline and a plus, no family colour, because colour on
      this map means a type and the type is still being chosen. Drawn after the
      saved markers so it sits above them, and outside `groups` so it is framed and
      counted nowhere.
- [x] 10.2 Convert the form from a full-screen `Modal` to a sheet at one of two
      heights (0.52 and 0.92 of the window), dragged by a grabber that carries its
      own `PanResponder`. Not the whole sheet: a responder over the fields would
      take every scroll gesture and turn it into a resize.
- [x] 10.3 Give the two heights an accessible route as well as a gesture — a drag is
      something a screen reader cannot perform.
- [x] 10.4 Lift the licence credit and MapLibre's ornaments clear of the sheet,
      reported on settle rather than followed frame by frame. Their positions take
      a number and cannot be animated.
- [x] 10.5 Record the guarantee in the `map-rendering` delta: the position stays
      visible while its form is open, and enough map shows to read it against its
      surroundings.
- [x] 10.6 Correct `design.md`, which argued for a full screen partly on the
      `ScrollView` gotcha. That gotcha is about containers sizing to their children;
      a fraction-of-window height is definite and does not have the problem.
- [x] 10.7 On a device: the sheet opens at half height with the draft pin visible,
      drags to full and back, and the credit is legible at both heights.
- [x] 10.8 On a device: with the keyboard up, the save action is still reachable.
      `KeyboardAvoidingView` now hosts an absolutely-positioned sheet and is
      `box-none` so the map above it still takes touches — both worth watching.

## 11. The pin behind the sheet

Found by using it: after choosing a search result the pin was invisible, because
the camera centres on the map view's own middle and the sheet covers the lower
half of that view. Not only the search path — dropping and correcting land the
draft at the view centre too, which is just inside the covered strip.

- [x] 11.1 Add `offsetCenter` to `@pinpoint/map`: the camera centre that puts a
      point somewhere other than the middle of the view, as pure Mercator
      arithmetic. **This is a change under `packages/`** — see the note in the
      report for why it is new shared behaviour rather than a reimplementation.
- [x] 11.2 Test it, including both signs, reversibility, the halving of ground
      per zoom level, and the two ways it can run off the world. A sign error here
      hides the pin further and looks entirely plausible.
- [x] 11.3 Apply it on the fly path. `flyTo` takes the inset as a parameter,
      because the form does not exist to be measured at the moment search moves
      the camera.
- [x] 11.4 Apply it on the paths that do not fly — dropping and correcting — with
      a short ease once the sheet's height is known. Zoom is unchanged and the
      chosen point does not move; only how much of it can be seen.
- [x] 11.5 On a device: search a place and confirm the pin sits in the middle of
      the visible strip rather than behind the sheet, at both sheet heights.
- [x] 11.6 On a device: drop a pin and confirm the same, and that the small lift
      does not read as the map running away from the spot just chosen.

## 12. Reading a place gives up on adding one

Found by using it: with the form open, tapping a saved pin appeared to do nothing.
It was not nothing — the selection was being set behind the form, invisible, and
then surfaced as a sheet from nowhere when the form was closed. The same muddle
existed with the sight armed, where a tap could open a details sheet while the
crosshair was still up.

- [x] 12.1 Tapping a saved marker while a place is being added abandons the
      addition: the form closes, the sight disarms, and the draft goes with the
      panel that held it. The tapped place's sheet then opens as it always does.
- [x] 12.2 Keep the two mutually exclusive by construction rather than by hiding
      one of them. The render gate that suppressed the details sheet was treating
      the symptom; the state was still being set.
- [x] 12.3 On a device: tap a saved pin while the form is open and confirm the
      form closes, the draft pin disappears, and the tapped place's sheet opens.
- [x] 12.4 On a device: the same with the sight armed — the crosshair goes and the
      confirm bar is replaced by the place's sheet.

*Known trade, accepted deliberately: a stray tap on a pin discards whatever had
been typed into the form. Nothing is stored either way, so the trip is untouched,
but the typing is gone. The alternative — a confirmation when the form has been
edited — was not built, on the grounds that a prompt on every pin tap during
capture costs more than it saves. Revisit if it bites in real use.*
