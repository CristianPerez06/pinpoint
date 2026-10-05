import { walkingMinutes, type RouteForm, type TravelMode } from '@pinpoint/map'
import { message, type Language, type Message } from '@pinpoint/wording'

import { formatTravelTime, formatWalkingDistance, formatWalkingTime } from './distance'

/**
 * What the route card says, worked out once for both applications
 * (`place-route`).
 *
 * The rules for which figures to show — the walking estimate only on foot, a
 * distance alone for a bike or a car on the straight line, *About* only on the
 * estimate, walking alone with no connection — live here, so the laptop and the
 * phone cannot disagree about any of them. Each application draws the result
 * and resolves its names with `say`.
 */

/** Where asking for a street route has got to. */
export type StreetState =
  | { kind: 'idle' }
  | { kind: 'finding' }
  | { kind: 'ready'; km: number; minutes: number }
  | { kind: 'none' }

export interface RouteFigures {
  /** Which line the map draws. */
  form: RouteForm
  /** The way of travelling the figures are for, and the icon beside them. */
  mode: TravelMode
  /** The time, or null where no honest one is known. */
  time: Message | null
  /** The distance, already written for the language. */
  distance: Message
  /**
   * What the distance is measured along. Each application places `distance` in
   * `route.straightLine` or `route.alongStreets` by this — a value cannot hold a
   * sentence, so the two are joined where they are said.
   */
  measured: 'straight' | 'streets'
  /** One line under the choices, or null. */
  note: { kind: 'finding' | 'none' | 'offline'; message: Message } | null
  /** Which ways of travelling can be pressed. */
  available: Readonly<Record<TravelMode, boolean>>
}

const NONE_FOUND: Readonly<Record<TravelMode, Message>> = {
  walk: message('route.noneWalk'),
  bike: message('route.noneBike'),
  car: message('route.noneCar'),
}

/** The three choices' words, written out so `check:wording` can read them. */
export const TRAVEL_MODE_NAMES: Readonly<Record<TravelMode, Message>> = {
  walk: message('route.modeWalk'),
  bike: message('route.modeBike'),
  car: message('route.modeCar'),
}

export function routeFigures(
  language: Language,
  {
    km,
    mode: chosen,
    street,
    online,
    switched,
  }: {
    /** The straight-line distance from where the person was to the place. */
    km: number
    mode: TravelMode
    street: StreetState
    online: boolean
    /** The application changed the mode to walking because the connection dropped. */
    switched: boolean
  },
): RouteFigures {
  // With no connection only walking is offered, whatever was chosen, and a
  // street route already on screen gives way to the straight line.
  const mode: TravelMode = online ? chosen : 'walk'
  const available = { walk: true, bike: online, car: online }

  if (online && street.kind === 'ready') {
    return {
      form: 'street',
      mode,
      time: formatTravelTime(language, street.minutes, mode),
      distance: formatWalkingDistance(language, street.km),
      measured: 'streets',
      note: null,
      available,
    }
  }

  const minutes = mode === 'walk' ? walkingMinutes(km) : null
  return {
    form: 'straight',
    mode,
    time: minutes === null ? null : formatWalkingTime(language, minutes),
    distance: formatWalkingDistance(language, km),
    measured: 'straight',
    note: !online
      ? {
          kind: 'offline',
          message: message(switched ? 'route.switchedToWalk' : 'route.needsConnection'),
        }
      : street.kind === 'finding'
        ? { kind: 'finding', message: message('route.findingStreets') }
        : street.kind === 'none'
          ? { kind: 'none', message: NONE_FOUND[mode] }
          : null,
    available,
  }
}
