/**
 * A tap made with no signal, kept until it can be sent.
 *
 * Only the two things the phone allows offline: whether a place was visited,
 * and whether a member wants to go. Each carries the state the person chose,
 * never a change relative to what was stored — *visited*, not *the opposite of
 * what it was* — so that a tap made hours ago cannot undo a tick somebody else
 * made since.
 *
 * `interested: null` is withdrawing an answer, which the model stores as no row
 * at all.
 */
export type WaitingTap =
  | { readonly kind: 'visited'; readonly markerId: string; readonly visited: boolean }
  | {
      readonly kind: 'interest'
      readonly markerId: string
      readonly memberId: string
      readonly interested: boolean | null
    }

/**
 * What a tap is about: one place's visited state, or one member's answer on one
 * place. Two taps with the same target are two versions of one choice.
 */
export function waitingTarget(tap: WaitingTap): string {
  return tap.kind === 'visited'
    ? `visited:${tap.markerId}`
    : `interest:${tap.markerId}:${tap.memberId}`
}

/**
 * The queue with one more tap.
 *
 * A tap replaces any earlier one with the same target, where that one stood —
 * only the last choice about a thing is worth sending, and sending the earlier
 * ones first would briefly show everybody else a choice the person already took
 * back.
 */
export function waitAlso(
  queue: readonly WaitingTap[],
  tap: WaitingTap,
): readonly WaitingTap[] {
  const target = waitingTarget(tap)
  const at = queue.findIndex((each) => waitingTarget(each) === target)
  if (at === -1) return [...queue, tap]
  return queue.map((each, index) => (index === at ? tap : each))
}

/** The queue without the tap that was just sent, or just refused. */
export function doneWaiting(
  queue: readonly WaitingTap[],
  tap: WaitingTap,
): readonly WaitingTap[] {
  const target = waitingTarget(tap)
  return queue.filter((each) => waitingTarget(each) !== target)
}

/** Whether something about this place is still waiting to be sent. */
export function isWaiting(
  queue: readonly WaitingTap[],
  target:
    | { readonly kind: 'visited'; readonly markerId: string }
    | { readonly kind: 'interest'; readonly markerId: string; readonly memberId: string },
): boolean {
  const wanted =
    target.kind === 'visited'
      ? `visited:${target.markerId}`
      : `interest:${target.markerId}:${target.memberId}`
  return queue.some((each) => waitingTarget(each) === wanted)
}

/** A stored queue as text. */
export function keepWaiting(queue: readonly WaitingTap[]): string {
  return JSON.stringify({ v: 1, queue })
}

/**
 * A stored queue read back. Anything unreadable is an empty queue, and entries
 * that are not a tap this build knows are left out rather than sent.
 */
export function readWaiting(text: string | null | undefined): readonly WaitingTap[] {
  if (text == null || text === '') return []

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }

  if (typeof parsed !== 'object' || parsed === null) return []
  const { v, queue } = parsed as Record<string, unknown>
  if (v !== 1 || !Array.isArray(queue)) return []

  return queue.filter(isTap)
}

function isTap(value: unknown): value is WaitingTap {
  if (typeof value !== 'object' || value === null) return false
  const tap = value as Record<string, unknown>
  if (typeof tap.markerId !== 'string') return false
  if (tap.kind === 'visited') return typeof tap.visited === 'boolean'
  if (tap.kind === 'interest') {
    return (
      typeof tap.memberId === 'string' &&
      (typeof tap.interested === 'boolean' || tap.interested === null)
    )
  }
  return false
}
