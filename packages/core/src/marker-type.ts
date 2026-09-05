import { isMarkerType } from '@pinpoint/map'
import { z } from 'zod'

/**
 * Validation for a marker's type. The types themselves — their icons, their
 * colours, and the fallback — live in `@pinpoint/map`, because an icon and a
 * colour are presentation and belong beside the function that turns a marker
 * into something drawable.
 *
 * What stays here is the half that is a domain rule: what may be written. The
 * split is deliberate and one-directional. `@pinpoint/map` declares no
 * workspace dependencies, so this package may read from it and never the
 * reverse; `pnpm check:cycles` enforces that the direction holds.
 *
 * Reads do not come through here. `markerTypeOf` in `@pinpoint/map` resolves a
 * retired identifier to the type that replaced it, and anything else to the
 * fallback, and never rejects — the database column is unconstrained text and a
 * value written by an older version of the app must still render.
 *
 * The two are deliberately asymmetric. A *read* accepts a retired identifier
 * because rows carry them; a *write* does not, because nothing should be storing
 * one any more. `isMarkerType` answers the write question and covers only the
 * seven types offered today; `isKnownMarkerType` answers the read question.
 */
export const markerTypeSchema = z
  .string()
  .refine(isMarkerType, 'Unknown marker type.')
