'use client'

import { DURATION } from '@pinpoint/tokens'
import { useCallback, useEffect, useState, type TransitionEvent } from 'react'

/**
 * What a surface that is on the page is doing: arriving or standing (`open`),
 * or on its way out (`closing`).
 */
export type SurfaceState = 'open' | 'closing'

/**
 * The attributes a surface's root element carries while it is on the page.
 *
 * `data-surface` is what `ui.module.css` keys the motion on. `inert` is what
 * makes a closing surface take no presses, no keyboard focus and no screen
 * reader's attention from the moment it is dismissed (`motion`, *A surface
 * opening over a screen arrives and leaves with the shared timing*) — one
 * attribute for all three, which is why it is this and not `pointer-events`.
 */
export type SurfaceProps = {
  'data-surface': SurfaceState
  /**
   * Present from the frame after the surface first appeared. An element mounted into a
   * surface that is already open — the edit form taking the details card's
   * place — must not play the opening again, and `@starting-style` applies to
   * any element's first frame, so the stylesheet asks for this to be absent.
   */
  'data-entered': true | undefined
  inert: boolean | undefined
  onTransitionEnd: (event: TransitionEvent) => void
}

/**
 * Keeps a surface on the page for as long as it takes to leave.
 *
 * Every surface here is mounted while it is open and unmounted when it is not,
 * so it vanishes in the frame it is dismissed and no closing animation can run.
 * This holds it: when `open` turns false, `mounted` stays true and the state
 * becomes `closing`, the stylesheet transitions it out, and `mounted` clears
 * when that transition ends.
 *
 * WHY THIS AND NOT A LIBRARY
 *
 * Leaving is the revisit condition the `motion` design names for adding Motion
 * on the laptop, and the condition is that CSS cannot do it. With the element
 * kept on the page it can; this is the whole of what was missing.
 *
 * THE BACKSTOP
 *
 * `transitionend` does not fire when nothing actually transitions — a browser
 * with reduce motion collapses every transition to 0.01ms in `globals.css`, a
 * hidden tab may skip the frames, and an element whose values did not change
 * fires nothing at all. A surface that waited only for the event could stay on
 * the page, inert and invisible, for good. The timeout ends it regardless, a
 * little after the closing duration.
 *
 * Opened again while it is still leaving, it is the same element and simply
 * turns back from wherever it had got to, which is what a CSS transition does
 * when its target changes mid-flight.
 */
export function usePresence(open: boolean): { mounted: boolean; surface: SurfaceProps } {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)

  // Adjusted during render rather than in an effect, so the surface is never
  // drawn for a frame in the wrong state: it mounts in the render that opens
  // it, and turns to `closing` in the render that dismisses it.
  if (open && !mounted) setMounted(true)
  if (open && closing) setClosing(false)
  if (!open && mounted && !closing) setClosing(true)

  const finish = useCallback(() => {
    setClosing(false)
    setMounted(false)
    setEntered(false)
  }, [])

  // Entered from the frame after the first one: by then the browser has drawn
  // the starting style and the opening is under way.
  useEffect(() => {
    if (!mounted || entered) return
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [mounted, entered])

  useEffect(() => {
    if (!closing) return
    const backstop = window.setTimeout(finish, DURATION.standard + 60)
    return () => window.clearTimeout(backstop)
  }, [closing, finish])

  const onTransitionEnd = useCallback(
    (event: TransitionEvent) => {
      // Only the surface's own transitions; a control inside it changing
      // colour bubbles the same event up.
      if (closing && event.target === event.currentTarget) finish()
    },
    [closing, finish],
  )

  return {
    mounted,
    surface: {
      'data-surface': closing ? 'closing' : 'open',
      'data-entered': entered || undefined,
      inert: closing || undefined,
      onTransitionEnd,
    },
  }
}
