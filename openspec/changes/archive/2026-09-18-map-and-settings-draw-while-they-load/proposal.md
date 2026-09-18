## Why

Two screens still wait in ways that say nothing about what is coming. Opening the phone
app shows a plain "Loading your trips" screen, then the map's header appears with
"Loading the map…" under it, and the tools along the bottom only appear once the places
have loaded, so the screen arrives in three separate jumps. Opening Settings on the
laptop by its address (a reload or a link) shows a blank page until it is ready, and
opening the phone straight onto Settings briefly says "No address on this account",
which is not true.

The laptop's map and both calendars already follow the rule that fixes this: the screen
is drawn at once with grey placeholders where the data will go. That rule is written
twice today, once for the laptop's map and once for the calendar, and neither covers the
phone's map or Settings. Issues #168 and #169.

## What Changes

- **The rule is written once**, for every screen someone sees while signed in, on both
  apps. Draw the screen at once, where it will stand. Grey bars go where names that
  haven't loaded yet will go. Nothing animates. Nothing moves when the data arrives. A
  control only works once what it does can actually happen. The map and calendar
  rules point to it instead of repeating it.
- **The phone's map is drawn from the first moment.** The header shows grey bars for the
  trip and the city, and the ☰ menu is greyed out. The map area says "Loading the map…",
  the message it already shows while a trip's places load, so it stays the same for the
  whole wait. Search, Drop and Filter stand along the bottom from the start, greyed out,
  and start working once the map is there.
- **No "Loading your trips" screen on the phone.** A brand-new account sees the map's
  frame for a moment, then "make your first trip" takes its place. That happens once, on
  first launch.
- **The flicker #169 mentions is reproduced first**, on a cold start, and fixed at
  whichever moment it turns out to happen.
- **Settings on the laptop gets its own waiting screen**: the whole page, with a grey bar
  where the email address goes.
- **Settings on the phone shows a grey bar** instead of "No address on this account"
  while it reads who is signed in.
- **Settings works while it waits.** The back control and Light/Dark need nothing that
  is loading, so they work straight away. The calendar's "Back to the map" stays greyed
  out while it loads, as it does today.

Settled in the mock the user approved (phone map, Settings on both apps, both themes):
https://claude.ai/artifact/QtA7WxW2T8vHqhYRp1RuNY

Not in this change: what any screen shows when a read *fails*; the sign-in screens; the
phone's first frame before its typeface and stored preferences are read, which is held
on purpose; and any change to what is read or when.

## Capabilities

### New Capabilities

- `waiting-screens`: how any screen someone sees while signed in behaves while its data
  loads, on both apps. It is drawn at once with still placeholders, nothing moves when
  the data arrives, controls work only once what they do can happen, one definition
  draws both states, and a screen reader is told it is loading. It also covers Settings,
  which has no spec of its own.

### Modified Capabilities

- `workspace-chrome`: *The chrome is present before the data it names* applies to the
  phone app as well as the web app, stops restating the general rule, and says what the
  map area and the tools show while the phone waits for its trips.
- `trip-calendar`: *The calendar is drawn before its data arrives* and *The waiting
  calendar and the loaded calendar are one definition* keep what is particular to the
  calendar and point to `waiting-screens` for the rest.

## Impact

- `apps/mobile`: the map's header and bottom row of tools are drawn by one definition
  that works without a trip, and the map route shows it instead of the loading screen.
  Settings draws a bar for the address while the session is read.
- `apps/web`: Settings gets a waiting screen of its own, drawn by the same code as the
  loaded page.
- No shared package, no data read, and no dependency changes.
