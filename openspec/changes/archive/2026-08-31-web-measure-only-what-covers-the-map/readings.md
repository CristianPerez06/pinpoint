# Measured before the change

Taken from the running web application against the "Japan 2" trip (16 markers), Chrome,
dark theme, `pnpm dev`. Every number here was read out of the live DOM, not computed from
the source. Task 1 re-takes them; sections 6 and 7 compare against them.

## Laptop width — 1470px inner width

Two window heights were used; both are recorded because the defects scale with the map's
height.

| | map 666px tall | map 614px tall |
|---|---|---|
| `stage` (the `<main>` map) top / bottom | 61 / 727 | 61 / 675 |
| overlap reported by the toolbar | **716** | **664** |
| overlap reported by the save form | — (closed) | 446 |
| `floor` the application used | **716** | **664** |

The toolbar covers none of the map: its own box is 10.7 → 49.2, entirely above the map's
top edge at 61.

### What that produced

- **Dropped pin.** Pin tip at **y = −25** in map coordinates, i.e. 25px above the map's
  top edge. Predicted by `614/2 − 664/2 = −25`.
- **Fresh load.** All 16 markers at **y ≈ 22–29**, pin bodies clipped by the top edge,
  the lower 95% of the map empty.
- **Zoom control.** Inline style `bottom: calc(736px + var(--pp-space-md))` on a 666px
  map — `cornerHeight 20 + floor 716 + creditHeight 0`. Its box sat at viewport
  **y −95 to −25**: above the map and above the document. `display` still reported
  `grid`, so it remained in the accessibility tree while being unreachable.
- **Licence credit.** Handed `bottom: calc(716px + …)` but `display: none` at this width,
  so unaffected in practice. MapLibre's own attribution carried the licence, correctly
  placed at y 646–666.

## Phone width — 512px inner width

| | |
|---|---|
| `stage` top / bottom / height | 103 / 675 / 572 |
| toolbar box top / bottom / height | 608 / 675 / **67** |
| overlap reported by the toolbar | **67** |

Correct: the toolbar stands on the map's bottom edge, so `stage.bottom − toolbar.top` is
its own height. The formula has only ever been right by accident of position.

**These are the numbers that must not change.**
