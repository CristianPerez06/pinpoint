## Decisions

### The sentence comes from the step after the current one

Ferrostar hands over the route's remaining steps; the first is the stretch the person is
on, and the turn at its end is the start of the next step. Each step carries Valhalla's
written `instruction` for the turn it starts with. The card shows the second remaining
step's `instruction`, and falls back to the visual instruction's text when there is no
second step or it has no sentence.

### Asking again on reconnecting is done by the view, not by Ferrostar

Ferrostar only reconsiders the route when a position arrives, and will not ask again
within 50 m of where it last asked. The view watches the connection (`useOnline`). When
it comes back while the trip is off the route and no request is in flight, the view asks
once with Ferrostar's own `getRoutes` (the same providers and limits) from the last
position to the remaining waypoints, and hands the result to `replaceRoute`, as
Ferrostar's own recalculation does.
