## Why

Asking for everything on screen to be read again is a property of the **screen being
read**, not of the account — but it lived in the account menu, where it looked like
something you do to your account. That only became visible once a second screen wore the
same menu.

The rule that put it there says the web gets no such control, because reloading the page
is a control the browser already provides. At a laptop width that is true, and this change
does not touch it. At a phone width it is not: reload sits behind a collapsed toolbar or a
pull gesture the page can swallow — and this site declares itself installable, so a copy
added to a home screen has no browser furniture at all and therefore no reload of any kind.

## What Changes

- **A button on the map that re-reads everything**, wherever the chrome takes its phone
  shape: the web application below its phone breakpoint, and the phone application. One
  press reads the trips, the places, the cities, the members and the interest answers
  again, however recently any of them was last read.
- **It floats on the map's right edge, above the zoom control and clear of it.** A stated
  gap, not a hairline: stacked against zoom, a thumb that misses re-reads the trip when it
  meant to zoom in. Clear of the licence credit and of the bar of tools, both of which
  stand on that same edge.
- **It carries no fill.** The accent fills what commits an act inside a form or a panel,
  and a re-read commits nothing.
- **The phone application's `Refresh` menu row goes.** One rare thing in two places, in
  different parts of the screen, is worse than one.
- **A check that the web account menu never grows one back.** The row this change is
  undoing was added eighteen pull requests after the rule forbidding it landed, and
  nothing caught it, because no check reads the rows of a menu.

### What is not being done

- **The web at a laptop width gets nothing.** Reload is one pixel above where a second
  button would go, and a second one is duplication. That half of the rule is right and
  stays.
- **The calendar gets nothing**, on either ground and at any width. The way back to the
  map is already the most visible control on that screen, and the button there re-reads
  the same five lists — so recovery is two presses rather than one, and the calendar is
  not stranded.
- **Nothing about how a screen re-reads itself changes.** Coming back is still the only
  automatic trigger; there is still no polling and no live subscription.
- **No new state, no new failure report.** A re-read somebody asked for and is waiting on
  is already answered by `write-feedback`, and this control is bound by it unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-freshness`: *The native application offers a way to ask for a re-read* becomes a
  rule about the **shape of the screen** rather than about the platform. The control
  belongs to the map screen wherever reload is not at hand — the phone application and the
  web at a phone width — and the sentence forbidding it to the web narrows to the width at
  which reload is genuinely already there. The sentence placing it among the rare controls
  is replaced by placement stated in `workspace-chrome`, where placement lives.
- `workspace-chrome`: *Controls are placed by how often they are used* gains its one
  stated exception — a control that is the only way out of a state the screen cannot
  otherwise leave may be permanently placed despite being rare. A new requirement then
  says where this one stands: floating on the map's right edge, separated from the zoom
  control by a gap wide enough that neither is reached while aiming for the other, and
  covering neither the attribution nor the session's tools.

## Impact

- **`apps/web`**: the map route gains the control below its phone breakpoint; the account
  menu is unchanged, having already lost its row in #153. The calendar is untouched.
- **`apps/mobile`**: the map screen gains the control; `menu-sheet.tsx` loses the
  `Refresh` row and the pending state that went with it. The sheet keeps `onRefresh`'s
  behaviour, moved rather than rewritten — it already ignores the freshness floor and
  already reports its own pending state, which is what this control needs.
- **Repo automation**: one check in `.github/scripts/`, added to `pnpm verify` as well as
  to the workflow, asserting the web account menu carries no re-read row.
- **No database, no dependency and no token changes.** The control is built from
  vocabulary both applications already have.
