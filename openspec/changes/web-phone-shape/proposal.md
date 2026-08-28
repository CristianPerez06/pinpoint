## Why

At a phone width the web application is a laptop bar folded onto three lines. It is not
a design and has never been claimed as one: the rule that produces it carries a comment
naming itself temporary and naming the work that deletes it, and `web-one-bar-chrome`
put this width out of scope on purpose so that shipping one bar on a laptop was not
blocked behind it.

What is left is a list of things that are right on a laptop and wrong in a hand. Menus
hang under their triggers at 320px on a 390px screen. The marker details and the save
form are a 328px card floating in the bottom-left corner of the map. Place search is a
420px dropdown. Each is correct where it was designed and none of them was designed
here.

`DESIGN.md` already says what the answer is — *chrome follows the screen shape, not the
platform* — and the phone application is already that answer, built and in use. This
change makes the browser take the same shape when it is being held in a hand, because it
**is** a phone, not because anybody remembered to mirror it.

## What Changes

**The web application takes the phone's arrangement below 700px.** A header, the map in
the middle, a bar of tools on the bottom edge, sheets rising from that edge. Two
implementations of one shape, never a shared component — `styling` forbids that, and
what is shared is token values.

- **The header takes two lines.** The mark, the trip's name with its caret, and `☰` at
  the far end; the city on its own line beneath. Not a choice this change makes —
  `workspace-chrome` already requires the second line for any chrome taking this shape,
  and the reason is that two typed names sharing a 390px row leave each other about
  eleven characters and neither answers its question.
- **The account name is replaced by `☰`**, holding the phone's three items: who you are,
  `Refresh`, and `Sign out`. The name costs about 130px of a 390px header to answer a
  question nobody asked.
- **The three session tools drop to a bar over the bottom of the map** — `Search`,
  `Drop`, `Filter`, at equal weight, flush to the edge, with `Filter` declaring any
  narrowing by fill **and** a dot. A toolbar and deliberately not a tab bar: every item
  fires an action, and drawing them as tabs would promise navigation that does not
  exist.
- **Sheets, in both kinds the phone has.** *Dimmed and dismissed* — filter, trips,
  cities, the `☰` menu, the credits — where dimming is what says the map is waiting.
  *Not dimmed, and it must not cover the pin it describes* — the marker details and the
  save form.
- **Search becomes a tool that opens the whole screen**, rather than a field living in
  the bar. This is the one place the two shapes need different markup rather than
  different positions, and the only planned branch on viewport width in the render.
- **Dropping a pin is done by framing the map under a fixed sight**, as the phone does,
  with the toolbar replaced by `Cancel` / hint / `Use this spot` while it is armed.
  Web's arm-then-tap model stays at laptop widths. Not new licence — `marker-capture`
  already says how a position is indicated follows the shape of the screen, and already
  carries the sight; this is the first time the web application meets that clause.
- **The licence credit becomes ours rather than the renderer's** at this width, riding
  above whatever is standing on the floor — the toolbar, or the marker sheet when it
  takes the edge — and opening the four projects when pressed, exactly as the phone
  does. A bottom bar flush to the edge covers MapLibre's own control, and that is a
  licence condition rather than a cosmetic one.
- **The document opts into drawing edge to edge**, so that `env(safe-area-inset-bottom)`
  returns a real number and the toolbar clears the home indicator. It returns `0px`
  today and the declaration the ticket asks for would silently do nothing.
- **Framing accounts for the part of the map that is covered.** Where a sheet stands
  over the map, the zoom is chosen for the strip that is actually visible and the centre
  is then shifted, so a spread-out group does not lose its outliers behind the sheet.

**Three bands, not two.** Above 1024px the single bar is untouched. Between 700 and 1024
the existing wrap is untouched, and is its own task — the only thing this change owes it
is horizontal safe-area padding, because turning edge-to-edge on is what puts that bar
under the notch when a phone is held in landscape.

**Chosen by width alone**, as `DESIGN.md` says. A phone in landscape is about 900px wide
and therefore gets the laptop bar. That is a known consequence and is accepted rather
than overlooked.

**The 700px stopgap is deleted, not amended.** It is one literal in one place precisely
so this change has one place to look.

**Not breaking.** Nothing stored changes, no schema moves, the laptop layout is
untouched, and both applications keep every capability they have.

## Capabilities

### New Capabilities

None. Every behaviour here is one the product already describes; what changes is which
screen shapes the web application satisfies them in.

### Modified Capabilities

- `workspace-chrome`: the requirement that *a panel opens beside the control that opened
  it* is scoped to the laptop shape and given a counterpart for the phone shape, where a
  panel rises from the bottom edge and may cover the toolbar while it is open. The
  requirement as written is already false of the phone application — its trip sheet is
  raised from a header control and appears at the opposite edge — so this states a rule
  that has been in force in the code and absent from the document.
- `map-rendering`: framing is stated against the *uncovered* part of the map rather than
  the whole surface, so that "every marker is within the visible area" keeps meaning
  what it says once a sheet stands over the lower half.

`marker-capture` is deliberately **not** modified. It already requires that how a
position is indicated follows the shape of the screen, already describes the fixed
sight, and already requires the sight be centred on the map as drawn rather than on the
screen. The web application has satisfied it vacuously by only ever being a pointer-
driven screen. This change makes that clause bite; it does not change what it says.

`styling` and `place-search` are **not** modified. No styling code is shared, no token
representation changes, and search asks and ranks exactly as it does today — only where
it is typed moves.

## Impact

**Web** — `trip-workspace.tsx` and its stylesheet (the header's two lines, the toolbar,
the breakpoint, the sight and its confirm row), `ui.tsx` / `ui.module.css` (`.menuPanel`
becomes a bottom sheet inside the media query; the `Menu` primitive itself is unchanged
and its dismissal contract is reused rather than reimplemented), `trip-map.tsx` (our own
credit, the covered-height measurement, framing against the uncovered strip),
`marker-details.tsx` and `marker-form.tsx` (sheet rather than corner card, and reporting
their height), `place-search.tsx` (a full screen at this width), `layout.tsx` (drawing
edge to edge). A new attribution sheet, and a hook that answers whether the viewport is
phone-shaped.

`TripBar`, `CityBar` and `FilterBar` are expected to need **no changes**: they call
`Menu`, and what moves is where `Menu` draws its panel.

**Mobile** — none. The phone is the reference, not the subject.

**Shared packages** — none expected. `fitBounds` has taken a viewport since it was
written and `offsetCenter` is already exported with a comment recording that it is
waiting for exactly this; the composition of the two lives in the application. The
portability boundary is unaffected: no renderer, DOM API, or native module moves.

**Documents** — `DESIGN.md`, whose Responsive paragraph describes the 700px rule as
temporary and must describe the three bands instead.

**Dependencies** — none added. The `$0` constraint is untouched.

**Reviewed before written** — the mock in `mock/`, at real widths on both grounds, with
a forty-character trip name against a twenty-seven-character city and thirty-four
places. It settled the `☰`, the two-line header at 320px, and the drop model; it is kept
so the next change to this surface starts from something.

**Tracked by** — `#58`, which closed `#41` into itself. Adjacent to `#40` (the
wide-layout menu review), which `#41` asked to land as one system with this and which
this change does not answer. Deletes the stopgap that `web-one-bar-chrome` left behind.
