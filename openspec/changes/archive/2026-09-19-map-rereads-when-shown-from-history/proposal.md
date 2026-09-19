## Why

On the laptop, going to Settings and back to the map shows each place as it was when
the map first loaded. Edit a place's hours, visit Settings, press **Back to the map**,
and its card shows the old hours, with nothing to say they are out of date. Only a
reload fixes it (#193).

It happens because going back replays the browser's saved copy of the map instead of
asking again. The map then counts that copy as fresh, so it doesn't read anything
again. The browser's own back and forward arrows behave the same way: back to the map
from Settings or from the Calendar, and forward onto either screen.

## What Changes

- **A screen shown again through the browser's history reads its lists again**, on
  web: the map and the Calendar, whether you got there with **Back to the map** or with
  the browser's arrows. The saved copy stays on screen while the new answer comes in,
  so for a moment you may see the old details before they update. The page never goes
  blank and never shows a loading state.
- **This read is silent**, like the one when you come back to the tab. If it fails,
  the screen keeps what it had and says nothing.
- The spec's list of what counts as "coming back" on the web gains this case.

Not being done: the phone. There, Settings and the Calendar open on top of the map, so
the map is never thrown away and keeps what it holds. That is checked on the device as
part of this change rather than assumed. Also not done: making **Back to the map** open
a fresh page instead of going back, because that would fix one button and leave the
browser's arrows broken.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-freshness`: on the web, a screen shown again from the browser's history counts
  as coming back, and the saved copy it shows does not count as a read.

## Impact

- Web: the map and the Calendar screens, and the shared piece that holds their lists
  and decides when they are fresh.
- Phone: nothing expected to change; checked on the device.
