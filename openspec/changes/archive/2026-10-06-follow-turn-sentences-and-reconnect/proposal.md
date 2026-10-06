## Why

Two findings from following a route (#279), both noticed on the Android emulator:

- A turn onto a named road showed only the road's name ("団栗通; Donguri Street"), not a
  sentence saying what to do.
- Someone standing still off the route kept seeing "No new route found yet" after their
  connection came back. A new route is only asked for again once they have walked about
  50 m, although the spec already says it is asked for once the connection returns.

## What Changes

- The turn card shows the routing service's sentence for the turn ("Turn left onto
  Donguri Street.") instead of the short text meant for a road sign. It's still the
  service's own words, in the app's language.
- When the connection returns while the person is off the route, a new route is asked
  for straight away.

## Capabilities

### New Capabilities

### Modified Capabilities
- `route-following`: *The next turn is shown* names which of the service's texts is shown;
  *Leaving the route finds a new one* asks at once when the connection returns.

## Impact

- `apps/mobile/components/following/follow-view.tsx` only.
