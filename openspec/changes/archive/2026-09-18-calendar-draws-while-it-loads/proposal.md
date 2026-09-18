## Why

Opening the calendar never shows the calendar first, and on the phone the wait says
something false. On the laptop the calendar has no waiting screen of its own, so it shows
the map's — the map's header and "Loading your trip" — then jumps to the calendar in one
step. On the phone a plain "Loading your trips" screen comes first, and then the calendar
appears before its places have been read, so for a moment every day looks empty: a trip
with nothing planned.

The map screen already follows the rule this needs — its header is drawn before the data,
with drawn placeholders where the names will go (`workspace-chrome`). The calendar has no
such rule. Issue #167.

## What Changes

- **The whole calendar is drawn straight away**, on both applications, in the place it
  will stand: the header, the day controls, the day columns and the places waiting for a
  day.
- **Grey bars stand where names and dates will go**: the trip's name, the person signed
  in, the date in the day control, each day's name, each city's name, and the count of
  places waiting. No text stands in for any of them.
- **Grey place-shaped rows stand where places will go**: three to a day, and two city
  groups of three and two rows under "No day yet". The number never depends on the trip,
  so it cannot be read as a count.
- **Nothing moves when the data arrives.** The bars and rows are replaced where they
  stand.
- **Nothing responds until it can work.** The controls are drawn as they will look and
  do nothing until the data they act on has arrived.
- **Still, not animated.** No shimmer, no pulse — the same as the search list's waiting
  rows.
- **The phone never shows an empty day while its places are being read.** The grey rows
  stand there instead.
- Replaced: the map's waiting screen on the laptop's calendar, the phone's
  "Loading your trips" screen on the way into the calendar, and the empty-looking days.

Settled in the mock the user approved (laptop and phone, both themes):
https://claude.ai/artifact/5ut7MtaYQjDmtTyqEkNCyS

Not in this change: the map screen's own wait on the phone, which still shows a loading
screen; what the calendar shows when a read *fails*; and any change to how or when the
calendar's data is read.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trip-calendar`: gains a requirement that the calendar is drawn before its data arrives,
  with drawn placeholders for what is not yet known, from one definition shared by the
  waiting and loaded screens. It mirrors what `workspace-chrome` already requires of the
  map.

## Impact

- `apps/web`: the calendar gets a waiting screen of its own, and its screen is split so
  the waiting and loaded states are drawn by the same code, the way the map's header is.
- `apps/mobile`: the same split, plus a drawn placeholder bar the phone does not have yet.
  The calendar route shows the waiting calendar instead of the loading screen.
- No shared package, no data read, and no dependency changes.
