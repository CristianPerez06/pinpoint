import { isMarkerType } from '@pinpoint/map'
import { z } from 'zod'

/**
 * Validation for a marker's type. The types themselves — their icons, their
 * families, and the fallback — live in `@pinpoint/map`, because an icon and a
 * colour family are presentation and belong beside the function that turns a
 * marker into something drawable.
 *
 * What stays here is the half that is a domain rule: what may be written. The
 * split is deliberate and one-directional. `@pinpoint/map` declares no
 * workspace dependencies, so this package may read from it and never the
 * reverse; `pnpm check:cycles` enforces that the direction holds.
 *
 * Reads do not come through here. `markerTypeOf` in `@pinpoint/map` resolves an
 * unrecognised value to the fallback and never rejects, because the database
 * column is unconstrained text and a value written by an older version of the
 * app must still render.
 */
export const markerTypeSchema = z
  .string()
  .refine(isMarkerType, 'Unknown marker type.')
