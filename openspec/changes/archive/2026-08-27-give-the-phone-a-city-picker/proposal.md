## Why

The phone can edit cities but cannot choose one. On the laptop, choosing a city frames
the map on its places, biases place search toward them, and fills in the next place
saved; on the phone the same-looking **Cities** screen does none of that. The result is
a control that reads as broken rather than as deliberately absent — which is what
`#68` was filed about.

The laptop has its own defect in the same surface, found while scoping this: `Edit
"<city>"` renders only when a city is selected, so under **All places** no city can be
edited at all, and renaming Osaka requires selecting Osaka — which moves the camera to
Osaka. Editing is wrongly conditional on working there. Both halves are one change
because the answer to both is one shared way of listing a city: name, how many places,
what they cost in, and a way to fix it that does not depend on standing in it.

## What Changes

**The phone gains city selection.**

- A city control on a **second line of the header**, under the trip's name. Chosen from
  a mock reviewed before this was written: the laptop's one-row `Trip / City` truncates
  both names to unreadable stubs at 320 pt, which is the narrowest screen still sold.
- Selecting a city **frames the map on that city's visible markers**, **biases place
  search** toward them, and becomes the **save form's default city**, replacing the
  city-last-used fallback the phone uses today.
- Selecting a city **does not filter the map**. Nothing is hidden. That remains the
  Filter control's job, and the reason is unchanged: a city is a name somebody chose,
  so hiding everything filed under a different one can hide a place around the corner.

**Both applications list and edit a city the same way.**

- One row shape: the city's name, how many places are filed under it, and its currency.
  The laptop shows only a currency today; the phone already shows both.
- Every row carries its own way into the editor, on both platforms. **Editing a city no
  longer requires selecting it first.**
- On the phone, the Cities sheet absorbs the picking half and the **Cities** entry
  inside the trip sheet is retired — cities stop being an errand filed under the trip
  and become the thing being worked in.

**Held in memory, not stored.** The phone's selection resets on a cold launch, exactly
as the city-last-used default already does. No storage dependency is introduced. The
`ROADMAP.md` gap "the phone has nowhere to remember a preference" stays open and now
names three things instead of two.

**Not breaking.** Nothing stored changes, no schema moves, and both applications keep
every capability they have.

## Capabilities

### New Capabilities

None. This adds no capability the product did not already describe — it removes an
exemption that let one application skip one.

### Modified Capabilities

- `marker-capture`: the exemption "*An application SHALL NOT be required to offer city
  selection in order to satisfy this specification*" is removed, and with it the
  scenario covering an application that offers none. Editing a city gains a requirement
  that it not depend on that city being selected.
- `workspace-chrome`: a new requirement placing the city being worked in beside the trip
  it narrows, and stating what happens when both names cannot share a line.

`map-rendering` and `place-search` are deliberately **not** modified. Both already
require this behaviour without naming a platform — "*Selecting a city, which SHALL frame
that city's markers using the same shared logic*", and bias derived from a selected
city's markers. The phone satisfies them vacuously today by offering no selection. This
change makes them bite; it does not change what they say.

## Impact

**Mobile** — `trip-workspace.tsx` (selection state, framing, bias, save default),
`city-sheet.tsx` (picking rows beside the editor), `trip-sheet.tsx` (the Cities entry
goes), `trip-map.tsx` (`TripMapRef` needs a way to frame a *set* of points, honouring a
bottom inset so the framed city does not land behind the toolbar).

**Web** — `city-bar.tsx` (a way into the editor on every row, place counts) and its
stylesheet.

**Shared packages** — none expected. Framing already resolves through `fitBounds` in
`@pinpoint/map`, and the portability boundary is unaffected: no renderer, DOM API, or
native module moves.

**Documents** — `openspec/ROADMAP.md`, whose paragraph under "Either application is
sufficient on its own" records the decision this change reverses, and which must say why
rather than quietly disappear.

**Dependencies** — none added. The `$0` constraint is untouched.

**Tracked by** — `#68`. Adjacent to `#57` (whether to *filter* by city), which this
change deliberately does not answer, and `#58` (web at phone width), which will inherit
the arrangement chosen here.
