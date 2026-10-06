## Why

A calculated route shows the way once. To follow it on the move, the person has to
leave Pinpoint today. #279 asks for both ways out: follow the route inside Pinpoint
like a GPS app, or hand it to another maps app. The groundwork (#282) showed that
Ferrostar can follow a route under Pinpoint's own map on the phone.

## What Changes

- **Start** on the phone. Once a street route is drawn, the place's details offer
  *Start*. Pressing it closes the details and follows the route:
  - the map keeps the person in view, with north at the top;
  - a card at the top shows the next turn and how far away it is, in the routing
    service's own words;
  - a bar at the bottom shows the time and distance left, the expected arrival, and
    *Stop*.
- **Leaving the route** gets a new route from where the person is, by itself. The card
  says so while it waits.
- **Arriving** shows a note saying so. Following stops by itself, the route is cleared,
  and the place's details come back.
- **The screen stays on** while following. Locking the phone or leaving the app pauses
  following, and it picks up again on return. There is no voice.
- **Open in…** next to *Start*, on the phone. It offers Google Maps and Apple Maps on an
  iPhone, or Google Maps and *Another maps app* on Android. Whichever is chosen opens
  with the same destination and, where that app supports it, the same travel mode.
  Google Maps opens its website when the app isn't installed, so pressing it always
  does something. It is offered with no connection too, unlike *Start*.
- **The laptop** gets *Open in Google Maps*, which opens a new tab. Following stays a
  phone feature.
- If Stadia doesn't answer during a trip, FOSSGIS's Valhalla is asked, as
  *Calculate route* already does.
- The development-only trial screen from #282 is removed, now that the real thing
  exists. Ferrostar still loads only once *Start* is pressed. Why loading it at launch
  made the app reload itself is found and dealt with before this ships.

**Not done here:** spoken instructions; following with the phone locked or the app in
the background; following on the laptop; carrying Pinpoint's exact route into another
app (they work out their own); our own wording for turns.

## Capabilities

### New Capabilities
- `route-following`: following a street route on the phone. Covers starting, the turn
  card, time and distance left, getting a new route when off it, arriving, stopping,
  keeping the screen on, and leaving and coming back to the app.

### Modified Capabilities
- `place-route`: the route card offers *Start* (phone, street route only) and opening
  the route in another maps app (phone and laptop).
- `device-location`: while following, the camera moves with the person, and their
  position is sent to the routing service to get a new route.
- `product-wording`: turn instructions from the routing service are shown as the
  service writes them, not as named sentences.

## Impact

- `apps/mobile`: route card, a new following view over the map, the *Open in…* sheet,
  and Ferrostar loaded on demand. Adds `expo-keep-awake`. Removes `app/dev/follow.tsx`
  and `components/follow-trial.tsx`.
- `apps/web`: *Open in Google Maps* in the route card.
- `@pinpoint/routing`: builds the address that opens a route in Google Maps, Apple Maps
  or a `geo:` app, shared by both apps.
- `@pinpoint/core`: words the time and distance left, and the arrival time, per
  language.
- `@pinpoint/wording`: new sentences in English and Spanish. The `trial.follow.*`
  sentences go.
- Stadia: *Start* asks for one more route (with turns) from where the person is, and
  each return to the route asks for another, each at 20 of the 200,000 free monthly
  credits. Measured on #279: about 320 hours on foot a month.
