import type { MarkerView } from '@pinpoint/map'
import { MARKER_BADGE_SIZE, MARKER_GLYPH_SIZE, RADIUS } from '@pinpoint/tokens'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { MarkerGlyph } from '@/components/marker-icon'
import { useTheme } from '@/lib/theme'

/**
 * The teardrop, drawn with the same geometry as web.
 *
 * The path is identical to the one in `apps/web/app/_components/pin.tsx` and
 * that duplication is deliberate — the `styling` spec forbids sharing rendered
 * markup between the platforms, and an SVG path in a shared package would be
 * exactly that. What is shared is the box it is drawn in and the point that
 * sits on the coordinate, both of which arrive in the marker description.
 *
 * View-based rather than a symbol layer, as before. A symbol layer draws from a
 * sprite atlas, and rasterising these per platform would produce output that
 * differs between the two platforms it is meant to unify.
 */

const PATH =
  'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'

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
        <Path d={PATH} fill={theme.markerFamily[view.family]} />
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
