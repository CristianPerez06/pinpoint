## Context

Whether the form holds work, and the question itself, live inside `MarkerFormSheet`
(#259). The pin tap is handled in `trip-map.tsx`, which today calls `onAbandonCapture`
(the workspace's `cancelPanel`) and then selects the pin.

## Decisions

**The form hands its `leave` out through a ref, and the map calls it.** The form keeps
deciding whether to ask, so ✕, Cancel, the dim and a pin tap cannot drift apart. A ref
the workspace holds (`leaveForm`) is set to the form's current `leave` on every commit;
`trip-map` gets an `onLeaveForm` callback that calls it. Lifting the form's values into
the workspace just to answer "is there anything to lose" would move the whole form's
state for one question.

**With the form open, the tap stops there.** It does not select, matching the spec and
the laptop. With only the sight armed, the tap still abandons the sight and selects, as
now. That is not a panel being dismissed, and #265 is about the form.

`onAbandonCapture` keeps its name and now only serves the armed-sight case; its comment
says so.
