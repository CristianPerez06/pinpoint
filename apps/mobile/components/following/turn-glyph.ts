import {
  DrivingSide,
  ManeuverModifier,
  ManeuverType,
} from '@stadiamaps/ferrostar-uniffi-react-native'
// Deep imports, not the package root — see marker-icon.tsx.
import ArrowUp from 'lucide-react-native/icons/arrow-up'
import ArrowUpLeft from 'lucide-react-native/icons/arrow-up-left'
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right'
import CornerUpLeft from 'lucide-react-native/icons/corner-up-left'
import CornerUpRight from 'lucide-react-native/icons/corner-up-right'
import Flag from 'lucide-react-native/icons/flag'
import Merge from 'lucide-react-native/icons/merge'
import RotateCcw from 'lucide-react-native/icons/rotate-ccw'
import RotateCw from 'lucide-react-native/icons/rotate-cw'
import Split from 'lucide-react-native/icons/split'
import Undo2 from 'lucide-react-native/icons/undo-2'

type Glyph = typeof ArrowUp

/** The way to turn, which is what most turns are drawn by. */
const BY_MODIFIER: Readonly<Record<ManeuverModifier, Glyph>> = {
  [ManeuverModifier.UTurn]: Undo2,
  [ManeuverModifier.SharpRight]: CornerUpRight,
  [ManeuverModifier.Right]: CornerUpRight,
  [ManeuverModifier.SlightRight]: ArrowUpRight,
  [ManeuverModifier.Straight]: ArrowUp,
  [ManeuverModifier.SlightLeft]: ArrowUpLeft,
  [ManeuverModifier.Left]: CornerUpLeft,
  [ManeuverModifier.SharpLeft]: CornerUpLeft,
}

/**
 * Kinds of turn that have a shape of their own whichever way they go. Null
 * leaves it to the way to turn.
 *
 * Exhaustive, so a kind Ferrostar adds is a compile error here rather than an
 * arrow nobody chose.
 */
const BY_TYPE: Readonly<Record<ManeuverType, Glyph | 'roundabout' | null>> = {
  [ManeuverType.Turn]: null,
  [ManeuverType.NewName]: null,
  [ManeuverType.Depart]: null,
  [ManeuverType.Arrive]: Flag,
  [ManeuverType.Merge]: Merge,
  [ManeuverType.OnRamp]: null,
  [ManeuverType.OffRamp]: null,
  [ManeuverType.Fork]: Split,
  [ManeuverType.EndOfRoad]: null,
  [ManeuverType.Continue]: null,
  [ManeuverType.Roundabout]: 'roundabout',
  [ManeuverType.Rotary]: 'roundabout',
  [ManeuverType.RoundaboutTurn]: 'roundabout',
  [ManeuverType.Notification]: null,
  [ManeuverType.ExitRoundabout]: 'roundabout',
  [ManeuverType.ExitRotary]: 'roundabout',
}

/**
 * The glyph beside the next turn (`route-following`, *The next turn is shown*).
 *
 * A roundabout turns the way traffic goes round it: anticlockwise where people
 * drive on the right, clockwise where they drive on the left. Anything Ferrostar
 * does not say is drawn as straight on.
 */
export function turnGlyph(
  type: ManeuverType | undefined,
  modifier: ManeuverModifier | undefined,
  side: DrivingSide | undefined,
): Glyph {
  const own = type === undefined ? null : BY_TYPE[type]
  if (own === 'roundabout') return side === DrivingSide.Left ? RotateCw : RotateCcw
  if (own) return own
  return modifier === undefined ? ArrowUp : BY_MODIFIER[modifier]
}
