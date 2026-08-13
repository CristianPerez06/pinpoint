import type { MarkerIconName } from '@pinpoint/map'
/*
 * Imported one icon at a time, from the subpath rather than the package root.
 *
 * `lucide-react-native` ships 1767 icons and its root module re-exports every
 * one of them. Metro does not tree-shake in development, so
 * `import { Bed } from 'lucide-react-native'` pulls the whole catalogue into the
 * bundle: 1694 modules and 8.5 MB became 3391 modules and about 12 MB, for
 * sixteen glyphs.
 *
 * That is the whole claim. An earlier version of this comment blamed the barrel
 * for a startup crash we were chasing at the time; that was wrong, and the
 * crash turned out to be stale codegen artifacts from building incrementally
 * after adding native dependencies. The import style is worth keeping on bundle
 * size alone — it is just not load-bearing for correctness, and pretending
 * otherwise would send the next person down the wrong path.
 *
 * The paths come from the package's own `exports` map (`./icons/*`), so they are
 * a supported entry point rather than a reach into its internals.
 */
import Bed from 'lucide-react-native/icons/bed'
import Beer from 'lucide-react-native/icons/beer'
import Castle from 'lucide-react-native/icons/castle'
import Coffee from 'lucide-react-native/icons/coffee'
import Frame from 'lucide-react-native/icons/frame'
import Landmark from 'lucide-react-native/icons/landmark'
import MapPin from 'lucide-react-native/icons/map-pin'
import Mountain from 'lucide-react-native/icons/mountain'
import Plane from 'lucide-react-native/icons/plane'
import ShoppingBag from 'lucide-react-native/icons/shopping-bag'
import Star from 'lucide-react-native/icons/star'
import Store from 'lucide-react-native/icons/store'
import TrainFront from 'lucide-react-native/icons/train-front'
import Trees from 'lucide-react-native/icons/trees'
import Utensils from 'lucide-react-native/icons/utensils'
import UtensilsCrossed from 'lucide-react-native/icons/utensils-crossed'
import type { LucideIcon } from 'lucide-react-native'
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
