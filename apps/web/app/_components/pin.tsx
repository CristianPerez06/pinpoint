import type { MarkerView } from '@pinpoint/map'
import { MARKER_GLYPH_SIZE } from '@pinpoint/tokens'

import { MarkerGlyph } from '@/app/_components/marker-icon'

import styles from './pin.module.css'

/**
 * The teardrop.
 *
 * The path is drawn in the box the shared description names, and its point is
 * at the bottom centre — which is the coordinate. Nothing here decides where
 * that point goes: the anchor comes from `@pinpoint/map` and is handed to
 * MapLibre, so this component and the mobile one cannot disagree about it.
 *
 * The head is a circle of radius 13 centred at (16, 15) in a 32×42 box; the
 * two curves fall from its sides to the point at (16, 41). Drawn rather than
 * composed from a circle and a triangle so the join is a single smooth outline
 * at every size.
 */

const PATH =
  'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'

export function Pin({
  view,
  count = 1,
  selected = false,
}: {
  view: MarkerView
  count?: number
  selected?: boolean
}) {
  return (
    <span
      className={styles.pin}
      data-selected={selected || undefined}
      data-visited={view.visited || undefined}
      style={{
        width: view.size.width,
        height: view.size.height,
        // From the shared description, not chosen here — the two applications
        // have to mute a visited marker by the same amount.
        opacity: view.opacity,
        // The family is a name; this is where it becomes a colour, for whichever
        // ground the cascade has chosen.
        ['--family' as string]: `var(--pp-pin-${view.type})`,
      }}
    >
      <svg
        viewBox={`0 0 ${view.size.width} ${view.size.height}`}
        className={styles.body}
        aria-hidden="true"
      >
        <circle className={styles.ring} cx="16" cy="15" r="17" />
        <path d={PATH} className={styles.drop} />
        <g
          transform={`translate(16 15) scale(${MARKER_GLYPH_SIZE / 24}) translate(-12 -12)`}
        >
          <MarkerGlyph
            icon={view.icon}
            size={24}
            strokeWidth={2.4}
            className={styles.glyph}
          />
        </g>
      </svg>

      {count > 1 ? (
        /*
         * The badge is the entire mechanism that stops the pin underneath from
         * being invisible forever. Identical coordinates are the same pixel at
         * every zoom, so nothing about panning or zooming can reveal it.
         */
        <span className={styles.badge}>{count}</span>
      ) : null}

      {/*
        A tick as well as the muting, because muting alone is a comparison: it
        only reads as "visited" when there is an unvisited pin nearby to compare
        against. Filtered down to visited places, every pin would be faint and
        none of them would say why.
      */}
      {view.visited ? (
        <span className={styles.visited} aria-hidden="true">
          ✓
        </span>
      ) : null}
    </span>
  )
}

/**
 * The unsaved marker.
 *
 * Deliberately unlike a saved pin: hollow, dashed, and carrying no type icon,
 * because it is not yet a place and showing it as one would make a person think
 * they had already saved it. Same silhouette and same anchor, so the point it
 * names is the point it will keep once it is saved.
 */
export function DraftPin() {
  return (
    <span className={`${styles.pin} ${styles.draft}`} style={{ width: 32, height: 42 }}>
      <svg viewBox="0 0 32 42" className={styles.body} aria-hidden="true">
        <path d={PATH} className={styles.dropDraft} />
        <path
          d="M16 11v8M12 15h8"
          className={styles.plus}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/**
 * A place's icon without the pin around it — for a list row or a panel heading,
 * where the teardrop's point would be meaningless.
 */
export function TypeChip({ view, size = 34 }: { view: MarkerView; size?: number }) {
  return (
    <span
      className={styles.chip}
      style={{
        width: size,
        height: size,
        backgroundColor: `var(--pp-pin-${view.type})`,
      }}
      aria-hidden="true"
    >
      <MarkerGlyph
        icon={view.icon}
        size={Math.round(size * 0.52)}
        className={styles.glyph}
      />
    </span>
  )
}
