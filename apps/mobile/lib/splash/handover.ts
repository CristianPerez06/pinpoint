/**
 * Who wins between the opening's first frame and its deadline, settled once.
 *
 * The opening gives up on the 3D view if it has not drawn in time, and giving
 * up takes the view away — and with it the view's graphics context. But the
 * context can arrive, and its first frame be queued, in the moment between the
 * deadline passing and the view being removed. That frame then draws on a
 * context that no longer exists, where `expo-gl` answers every call with
 * `undefined`: asked for a framebuffer, it hands back nothing, and `three` files
 * that nothing in a `WeakMap` and throws "WeakMap key must be an Object" (#285).
 * Slow launches are where this happens, which is to say Android, and above all
 * a development build on an emulator.
 *
 * So whichever comes first decides: a frame drawn keeps the deadline from
 * giving up, and a deadline passed keeps any frame from being drawn.
 */
export interface Handover {
  /** True once the deadline has won: nothing more is to be drawn. */
  readonly abandoned: boolean
  /** The first frame is about to be drawn. False if the opening has already given up on it. */
  draw(): boolean
  /** The deadline has passed. False if a frame got there first. */
  abandon(): boolean
}

export function createHandover(): Handover {
  let state: 'waiting' | 'drawn' | 'abandoned' = 'waiting'
  return {
    get abandoned() {
      return state === 'abandoned'
    },
    draw() {
      if (state === 'abandoned') return false
      state = 'drawn'
      return true
    },
    abandon() {
      if (state === 'drawn') return false
      state = 'abandoned'
      return true
    },
  }
}
