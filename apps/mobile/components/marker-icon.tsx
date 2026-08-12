import type { MarkerIconName } from '@pinpoint/map'
import {
  Bed,
  Beer,
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
} from 'lucide-react-native'
import { createElement } from 'react'

/**
 * Which glyph each icon name gets, on this platform.
 *
 * The web application holds the same record against `lucide-react`. They are
 * two mappings on purpose: the shared package names an icon and stops there,
 * because it declares no third-party dependencies and cannot hold a component.
 *
 * `Record<MarkerIconName, LucideIcon>` is exhaustive, so a name added to the
 * shared list without a glyph beside it fails to typecheck here — and, being a
 * separate record, fails on web too. Both applications break, which is what
 * makes the omission impossible to ship rather than merely likely to be caught.
 */
const GLYPHS: Record<MarkerIconName, LucideIcon> = {
  pin: MapPin,
  star: Star,
  landmark: Landmark,
  castle: Castle,
  picture: Frame,
  trees: Trees,
  mountain: Mountain,
  utensils: Utensils,
  coffee: Coffee,
  beer: Beer,
  skewer: UtensilsCrossed,
  'shopping-bag': ShoppingBag,
  storefront: Store,
  bed: Bed,
  train: TrainFront,
  plane: Plane,
}

/**
 * Falls back rather than rendering nothing. A missing name cannot happen while
 * the record typechecks, but it can if a stored value is cast past the type
 * system — and an empty pin looks like a rendering bug, where a map pin looks
 * like a place whose type is unknown, which is what it is.
 */
export function MarkerGlyph({
  icon,
  size,
  colour,
  strokeWidth = 2.2,
}: {
  icon: MarkerIconName
  size: number
  colour: string
  strokeWidth?: number
}) {
  const resolved: LucideIcon = GLYPHS[icon] ?? MapPin

  return createElement(resolved, { size, color: colour, strokeWidth })
}
