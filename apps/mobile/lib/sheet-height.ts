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
