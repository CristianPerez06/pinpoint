import type { MarkerView } from '@pinpoint/map'
import { MARKER_BADGE_SIZE, MARKER_GLYPH_SIZE, MARKER_PATH, RADIUS } from '@pinpoint/tokens'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { MarkerGlyph } from '@/components/marker-icon'
import { useTheme } from '@/lib/theme'

/**
 * The teardrop, drawn from the same definition as web.
 *
 * The path was written out here and again in `apps/web/app/_components/pin.tsx`,
 * and this comment argued the duplication was required — that an SVG path in a
 * shared package would be the rendered markup `styling` forbids. It is not: that
 * requirement forbids styling code, a class-name vocabulary and component
 * markup, and the box this is drawn in was already a shared token. `MARKER_PATH`
 * sits beside it, and each platform still draws it with its own parts.
 *
 * The head is an arc of radius 13 whose centre SVG derives from the endpoints —
 * (16, 17.47), not the (16, 15) the old comment claimed.
 *
 * View-based rather than a symbol layer, as before. A symbol layer draws from a
 * sprite atlas, and rasterising these per platform would produce output that
 * differs between the two platforms it is meant to unify.
 */

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: MARKER_BADGE_SIZE,
    height: MARKER_BADGE_SIZE,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  // Bottom-left, clear of the count badge at the top-right: a place can be both
  // visited and one of several sharing a point.
  visited: {
    position: 'absolute',
    bottom: 6,
    left: -5,
    width: MARKER_BADGE_SIZE,
    height: MARKER_BADGE_SIZE,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitedMark: { fontSize: 10, fontWeight: '700' },
  glyph: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

/**
 * The place being added, before it is a place.
 *
 * The same teardrop as a saved marker, drawn hollow with a dashed outline and a
 * plus where a type glyph would be — so it reads at a glance as "not yet one of
 * these" rather than as a marker of some family nobody recognises. Web draws the
 * identical treatment from its own stylesheet; the duplication is the `styling`
 * spec working as intended, since an SVG path in a shared package would be
 * shared rendered markup.
 *
 * No family colour, deliberately. Colour on this map means a type, and the type
 * is being chosen in the form at the moment this is on screen — a coloured draft
 * would be claiming an answer that has not been given.
 */
export function DraftPin() {
  const theme = useTheme()
  const { width, height } = { width: 32, height: 42 }

  return (
    <View
      // Explicit size for the same reason `Pin` has one: the iOS annotation
      // derives its frame from this view and bails out on a zero dimension.
      style={{ width, height }}
      accessibilityLabel="The place being added"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={MARKER_PATH}
          fill={theme.colour.surface}
          stroke={theme.colour.ink}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
        <Path
          d="M16 11v8M12 15h8"
          stroke={theme.colour.ink}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  )
}

export function Pin({
  view,
  count = 1,
  selected = false,
}: {
  view: MarkerView
  count?: number
  selected?: boolean
}) {
  const theme = useTheme()

  const { width, height } = view.size

  return (
    /*
     * Explicit size rather than sizing to content. The iOS annotation derives
     * its frame from this view, and `_setCenterOffset:` bails out on a zero
     * width or height — which leaves the pin anchored wrong and its tap target
     * somewhere other than where it is drawn.
     */
    <View
      // The muting comes from the shared description rather than being chosen
      // here, so this pin and the web one cannot disagree about how faint a
      // visited place looks.
      style={{ width, height, opacity: view.opacity }}
      accessibilityLabel={
        count > 1 ? `${count} places here` : `${view.label} (${view.typeLabel})`
      }
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {selected ? (
          <Circle cx={16} cy={15} r={17} fill={theme.colour.accentRing} />
        ) : null}
        <Path d={MARKER_PATH} fill={theme.markerType[view.type]} />
      </Svg>

      {/*
        The glyph is a React Native component rather than an SVG child, so it is
        positioned over the drop instead of nested inside it. The teardrop's head
        is centred at (16, 15) in a 32×42 box, which is not the centre of the box.
      */}
      <View
        style={[
          styles.glyph,
          {
            left: 16 - MARKER_GLYPH_SIZE / 2,
            top: 15 - MARKER_GLYPH_SIZE / 2,
            width: MARKER_GLYPH_SIZE,
            height: MARKER_GLYPH_SIZE,
          },
        ]}
      >
        <MarkerGlyph
          icon={view.icon}
          size={MARKER_GLYPH_SIZE}
          colour={theme.markerForeground}
          strokeWidth={2.4}
        />
      </View>

      {/* A tick as well as the muting: faintness only reads as "visited" when
          there is a solid pin nearby to compare against, and filtered down to
          visited places there would be none. */}
      {view.visited ? (
        <View
          style={[
            styles.visited,
            { backgroundColor: theme.colour.ink, borderColor: theme.basemap.land },
          ]}
        >
          <Text style={[styles.visitedMark, { color: theme.colour.ground }]}>✓</Text>
        </View>
      ) : null}

      {count > 1 ? (
        /*
         * The badge is the entire mechanism that stops the marker underneath
         * from being invisible forever — identical coordinates are the same
         * pixel at every zoom, so nothing about panning or zooming reveals it.
         */
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colour.ink, borderColor: theme.basemap.land },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme.colour.ground }]}>
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
