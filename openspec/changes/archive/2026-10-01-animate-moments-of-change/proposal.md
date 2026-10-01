## Why

Most changes on screen in Pinpoint happen in a single frame: a place's details pop in and
vanish, a deleted place is simply gone, and on the phone a newly placed pin appears from
nowhere. Motion at those moments shows where something came from and where it went. The
`motion` spec now sets the speeds and the tools, so these moments can be built against it
(#235).

## What Changes

Both applications. Approved mock: `mock/index.html` in this change (open it through a local
server; it lets you switch theme, reduce motion and slow motion).

- **Sheets, panels and menus slide in and out instead of popping.** On the laptop, a place's
  details, the add and edit form, the filter panel, the search results and the account menu
  rise a little as they fade in. On the phone, sheets slide up from the bottom edge: a place's
  details, the filter, search and every other sheet. Opening is quick with a soft landing;
  closing is quicker, so dismissing never feels like waiting. The same speed and curve on both
  apps.
- **A pin being put down drops onto the map**, on both apps. The laptop already does this
  when you place a pin; the phone gets the same drop at the same speed.
  Note: the explore described this as "a newly saved place drops". In the code, the drop
  plays when the pin is put down, before the details are filled in and saved, and saving
  does not drop it again. That is kept, and the phone copies it.
- **A deleted place fades away**, shrinking toward its point, while its details close. If
  other places share its point, the pin stays and its count goes down.
- **The map's waiting area shows a turning globe instead of a spinner.** It is the opening's
  globe drawn flat: the amber sphere with darker continents turning under the dark pin, with
  the words beside it ("Loading your trip…", "Loading the map…").
- **With "reduce motion" on, nothing moves.** Sheets, panels and pins appear and disappear at
  once or by a fade of at most 120 milliseconds, and the globe stands still.

Not being done:
- **Animated placeholders.** Placeholders on a waiting screen stay still, as `waiting-screens`
  requires.
- **Animated save confirmations.** `write-feedback` already says how a save reports itself,
  on the button that was pressed.
- **The small spinners inside buttons** (saving, signing in, rereading the map) stay as they
  are. A globe 20 pixels across reads as a smudge.
- **The phone's "add a place" form.** It keeps its own spring for now. #245 moves it to the
  phone's animation tool and decides how it behaves under reduce motion; it joins this timing
  then.
- **Places removed from the calendar's lists**, places hidden by a filter, and places that
  arrive or leave because somebody else changed the trip. They appear and disappear as they
  do today. Only a deletion made here fades.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `motion`: adds how surfaces open and close, how a pin arrives when put down and leaves when
  deleted, and the turning globe in the map's waiting area.

## Impact

- **Laptop:** the corner panels, filter panel, search results and account menu get opening and
  closing animations, which means each stays on screen for the length of its closing animation
  after it is dismissed. The map's pins learn which place was just deleted. The waiting area in
  `states.tsx` draws the globe.
- **Phone:** every sheet except the add form opens through one shared sheet, animated with
  Reanimated rather than the system's own slide. The details sheet, which pops today, joins
  them. The pin being placed gets the drop. The waiting area draws the globe.
- **Shared:** one new speed in `@pinpoint/tokens`, one full turn of the globe (4 seconds). The
  continents' darker amber moves from the opening's code into the tokens, because the globe
  now draws it too. The globe's frames are cut by the icon tooling, like every other image of
  the mark, so `pnpm check:icons` keeps them honest.
- **Cost:** none. No new dependency on either app.
