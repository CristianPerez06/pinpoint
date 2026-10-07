/**
 * How tall a sheet stands, given whether the keyboard is up.
 *
 * While the keyboard is down a sheet stands at its resting height — half the
 * window for most, a detent for the place form. While it is up, the half kept
 * for the map is behind the keyboard anyway, so the sheet takes the room above
 * it instead, short of `gap` below the top safe area so it still reads as a
 * sheet over the screen rather than a screen of its own (`workspace-chrome`,
 * *A panel raised on a phone-shaped screen rises from the edge*).
 *
 * Exactly that room, even for a sheet resting taller than it — the place form
 * at its full height, the currency picker. Lifted onto the keyboard at its
 * resting height, such a sheet would put its own top, and the field in it,
 * above the top of the screen.
 *
 * Measured from the keyboard's top edge, not from the window's height less the
 * keyboard's. The sheet's `KeyboardAvoidingView` lifts it by the keyboard's
 * overlap, which it works out from that same edge; Android's window height and
 * keyboard height do not add up to it under edge-to-edge, and a sheet sized
 * from them ran into the status bar.
 *
 * Pure, so the arithmetic is tested without a keyboard.
 */
export function sheetHeightAbove({
  resting,
  keyboardTop,
  topInset,
  gap,
}: {
  resting: number
  /** Where the keyboard's top edge is, from the top of the window, or null while it is down. */
  keyboardTop: number | null
  /** Where the space the sheet may grow into begins, from the top of the window. */
  /** Where the space the sheet may grow into begins, from the top of the window. */
  topInset: number
  gap: number
}): number {
  if (keyboardTop === null) return resting
  return Math.max(0, Math.round(keyboardTop - topInset - gap))
}

/**
 * How tall a sheet with a full height of its own stands at it, given the space
 * it is drawn in.
 *
 * The place form's full height is a fraction of the window, but the form is
 * drawn over the map, below the trip header — so on every phone the fraction
 * asked for more than there was, and the top of the sheet, its handle with it,
 * went under the header (#293). This takes the smaller of the two, short of the
 * same `gap` the sheet leaves when it grows over the keyboard, and never less
 * than its lower height.
 *
 * `room` is null until the space has been measured; until then the fraction
 * stands, which is only ever the case before anybody could have dragged.
 */
export function fullHeight({
  wanted,
  lower,
  room,
  gap,
}: {
  /** The full height as a fraction of the window, already in points. */
  wanted: number
  /** The sheet's lower height, which the full one never falls below. */
  lower: number
  /** The height of the space the sheet stands in, from the top it may grow to, or null before it is measured. */
  room: number | null
  gap: number
}): number {
  if (room === null) return wanted
  return Math.max(lower, Math.min(wanted, Math.round(room - gap)))
}
