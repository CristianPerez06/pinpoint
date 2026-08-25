## ADDED Requirements

### Requirement: Zoom is reachable from a visible control, not only a gesture

Each application SHALL offer a visible control that zooms the map in and out. The
control SHALL be present whenever the map is, without any prior interaction, and SHALL
NOT be the only way to zoom — the platform's own gestures SHALL continue to work
unchanged.

Rationale: a gesture is not an affordance. On a pointer it is a scroll over a
full-bleed canvas, which is easy to trigger by accident and zooms about the pointer, so
the view slides while it scales; on a phone it is a pinch, which needs two hands or a
grip that cannot be held while walking, and the phone is the platform used *during* the
trip. A control is also the only form of zoom a screen reader or a keyboard can reach.

Zooming from the control SHALL be about the centre of the view, and the centre
coordinate SHALL NOT move. Where an application shows a position under a fixed sight,
zooming SHALL leave the position under that sight unchanged.

Rationale: this is what makes the control a way of *looking* rather than a way of moving
the camera. It is also what keeps it inside the rule that nothing but a person's request
moves the camera — the person asked, with a button instead of a gesture.

The step SHALL come from the shared map package. Neither application SHALL define its
own step or its own bounds.

The shared minimum and maximum zoom SHALL be in force for **every** instrument that can
change zoom, not only for the control and for framing. An application SHALL bind the
shared range to its renderer rather than relying on the renderer's own defaults.

Rationale: the range belongs to the product, and the renderers do not share it —
`maplibre-gl` allows more zoom than the shared framing logic will ever return. Without
binding it, the end of the range depends on which instrument was last used, and a camera
can be left somewhere no framing can return to.

At either end of the range the control that can do nothing SHALL be drawn as
unavailable and announced as unavailable, and SHALL NOT be removed. Where the platform
has a focus or accessibility order, the unavailable control SHALL remain in it.

Rationale: removing it tells somebody arriving by keyboard or by screen reader that
zoom is gone, and says nothing about why.

#### Scenario: The control is visible with the map

- **WHEN** a person views a screen showing the map on either platform
- **THEN** a control for zooming in and a control for zooming out are visible without
  interacting with anything

#### Scenario: Zooming in from the control

- **WHEN** a person uses the control to zoom in
- **THEN** the map zooms in by the shared step
- **AND** the centre coordinate of the view is unchanged

#### Scenario: Zooming while a position is under a fixed sight

- **WHEN** a person zooms from the control while a position is shown under a fixed sight
- **THEN** the position under the sight is unchanged
- **AND** confirming afterwards saves the same coordinate it would have saved before

#### Scenario: The end of the range is reached

- **WHEN** the map is at the shared maximum zoom
- **THEN** the control for zooming in is drawn as unavailable and announced as such
- **AND** it is still present and still reachable
- **AND** using it does nothing

#### Scenario: A gesture reaches the end of the range

- **WHEN** a person zooms past the shared maximum with a gesture rather than the control
- **THEN** the map stops at the shared maximum
- **AND** it does not stop at the rendering library's own limit

#### Scenario: Gestures still work

- **WHEN** a person zooms by scroll, by pinch, or by the rendering library's own
  keyboard shortcut
- **THEN** the map zooms as it did before the control existed

#### Scenario: The control does not cover the attribution

- **WHEN** the map is rendered at any window or device size
- **THEN** the attribution for the tile data is fully visible
- **AND** the zoom control overlaps neither it nor anything else standing on that edge
