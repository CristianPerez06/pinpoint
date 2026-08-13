import type { MarkerIconName } from '@pinpoint/map'
import {
  Beer,
  Bed,
  Castle,
  Coffee,
  Frame,
  Landmark,
  MapPin,
  Mountain,
  Plane,
  ShoppingBag,
  Star,
  Store,
  TrainFront,
  Trees,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import { createElement } from 'react'

/**
 * Which glyph each icon name gets, on this platform.
 *
 * The shared package names an icon and stops there — it declares no
 * third-party dependencies, so it cannot hold a component, and naming a
 * vendor's catalogue in the shared contract would make swapping catalogues a
 * change to both applications at once.
 *
 * `Record<MarkerIconName, LucideIcon>` is doing real work: it is exhaustive, so
 * adding a name to the shared list without adding a glyph here is a type error
 * on the next build rather than an empty pin somebody notices on a map. The
 * mobile application holds the same record against its own icon set, and fails
 * the same way.
 */
const GLYPHS: Record<MarkerIconName, LucideIcon> = {
  pin: MapPin,
  star: Star,
  landmark: Landmark,
  castle: Castle,
  // A frame rather than a photograph: a museum is the thing on the wall.
  picture: Frame,
  trees: Trees,
  mountain: Mountain,
  utensils: Utensils,
  coffee: Coffee,
  beer: Beer,
  // Crossed utensils for street food — the closest thing to a skewer that still
  // reads at 15px, where anything more literal turns to noise.
  skewer: UtensilsCrossed,
  'shopping-bag': ShoppingBag,
  storefront: Store,
  bed: Bed,
  // The front of a train, not its side: it survives being shrunk.
  train: TrainFront,
  plane: Plane,
}

/**
 * The glyph for an icon name.
 *
 * A component rather than a function returning one. Handing a component back to
 * be held in a caller's variable and rendered as `<Glyph />` is a pattern the
 * React Compiler rejects — it cannot tell a lookup in a static record from a
 * component defined during render, and the second really is a bug. Resolving
 * inside a component and calling `createElement` says what is actually
 * happening.
 *
 * Falls back rather than rendering nothing. A missing name cannot happen while
 * the record above typechecks, but it can if a stored value is cast past the
 * type system — and an empty pin looks like a rendering bug, where a map pin
 * looks like a place whose type is unknown, which is what it is.
 */
export function MarkerGlyph({
  icon,
  size,
  strokeWidth = 2.2,
  className,
}: {
  icon: MarkerIconName
  size: number
  strokeWidth?: number
  className?: string
}) {
  const resolved: LucideIcon = GLYPHS[icon] ?? MapPin

  return createElement(resolved, { size, strokeWidth, className, 'aria-hidden': true })
}
