import Svg, { Circle, Path } from 'react-native-svg'

/**
 * The Nearby tool's glyph: a pin beside the lines of a list.
 *
 * Drawn here because no icon in the set says "places, by distance" — a list
 * alone says the shape and not the purpose, and a pin alone is already the drop
 * tool. Drawn to the set's own grid and stroke so it stands among them as one of
 * them; the laptop draws the same paths in `nearby-glyph.tsx` beside its tools.
 */
export function NearbyGlyph({
  size,
  color,
  strokeWidth = 2,
}: {
  size: number
  color: string
  strokeWidth?: number
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M14 6h7M14 12h7M14 18h7" />
      <Path d="M10 9c0 3.5-4 7.5-4 7.5S2 12.5 2 9a4 4 0 0 1 8 0Z" />
      <Circle cx="6" cy="9" r="1.2" />
    </Svg>
  )
}
