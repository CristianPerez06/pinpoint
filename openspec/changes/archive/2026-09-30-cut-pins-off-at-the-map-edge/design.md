## Context

See proposal.md — Why.

On the phone, pins are `Marker`s from `@maplibre/maplibre-react-native` (v11), drawn as
ordinary native views over the map rather than inside its canvas. On Android the library
adds each one as a child of the map's native view and, in the same place, turns that
view's clipping off on purpose (`MarkerViewManager.kt`: `mapView.clipChildren = false`,
`clipToPadding = false`, `clipToOutline = false`), so a pin can hang past its own anchor.
The consequence is that nothing inside the map cuts anything off at the map's edge.

Outside it, nothing does either. The map's wrapper in `apps/mobile/components/trip-map.tsx`
(`styles.fill`) and the body in `workspace-chrome.tsx` (`styles.body`) are both plain
`flex: 1` views, and React Native on Android leaves `overflow` visible by default. The
header and the offline note are earlier siblings of the body, so the body — and a pin
hanging out of it — is drawn above them.

iOS does not show the defect, because its map view clips to its bounds itself. The laptop
does not either: `maplibre-gl` gives its container `overflow: hidden`.

## Goals / Non-Goals

**Goals:**
- Cut off whatever the map draws at the map's own edge, on Android, without depending on
  the renderer to do it.
- Leave what is drawn *over* the map by us (zoom, re-read, credit, the drop sight) exactly
  as it is.

**Non-Goals:**
- Changing the library, patching it, or replacing `Marker` with a symbol layer.
- Any change to the laptop.

## Decisions

**Clip at the map's own wrapper in `trip-map.tsx`, with `overflow: 'hidden'`.** That view
is the map's parent and is exactly the map's area, so clipping it cuts pins off at the
map's edge and nowhere else. It also makes React Native's own touch handling stop at that
edge, so a press on the header is not given to a pin hanging over it.

It is chosen over the workspace body because the body holds more than the map — sheets
and overlays that are measured against it — and clipping there would cut off whatever of
those reaches past it, which is a second defect waiting to be found. The wrapper holds
only the map and what we draw over it, all of it inset from the edge.

The existing warning in `trip-map.tsx` about `overflow: 'hidden'` removing shadows on iOS
is about the zoom group itself, where the clip would sit on the view casting the shadow.
Here the controls' shadows are inside the wrapper, inset by `SPACE.md`, so they are not
reached. The comment on the wrapper says so, so the two are not read as contradicting.

## Risks / Trade-offs

- [The clip is on the wrapper but Android still draws pins past it] → Checked on a real
  Android phone before anything else. If it happens, the same style goes on the `Map`
  itself, which is the view the pins are children of.
- [A shadow of a control near the edge is cut off] → Looked at on both phones, in both
  themes, as part of the checks.
- [Behaviour that only shows on a production build] → The defect was seen on an EAS
  production build; the check is repeated on one, not only on a development build.
