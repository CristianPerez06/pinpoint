import type { FieldErrors } from '@pinpoint/core'

/**
 * What a write of trip data produced.
 *
 * Deliberately not a `QueryState`. That type has an `empty` case, which means
 * nothing for a write — a create that stored one row is not "empty" and neither
 * is a delete that removed one. Reusing it would leave every caller with a
 * branch that cannot happen and no guidance about what to do in it.
 *
 * The shape instead matches `@pinpoint/auth`'s `AuthOutcome`, because the two
 * problems are the same problem: input the form should mark up field by field,
 * a refusal from the service that belongs above the form, and success. Rejecting
 * a marker's name is not a different kind of event from rejecting a password.
 *
 * Success carries the row. The map draws a newly saved marker from what comes
 * back rather than re-reading the trip, which is what makes a place appear
 * without a reload.
 */
export type WriteOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'invalid-input'; fieldErrors: FieldErrors }
  | { ok: false; kind: 'rejected'; message: string }
  /**
   * Somebody else changed the row while this edit was being written.
   *
   * Its own case rather than a `rejected` with recognisable wording. Matching on
   * a message would put the meaning in a string, and a string is not a contract
   * — the first reword or translation silently breaks the branch.
   *
   * Three refusals call for three different things from the person: correct what
   * you typed, you may not do this, and somebody else changed it while you were
   * working. Only the third is nobody's mistake.
   */
  | { ok: false; kind: 'conflict'; message: string }

export function wrote<T>(data: T): WriteOutcome<T> {
  return { ok: true, data }
}

export function invalidInput<T>(fieldErrors: FieldErrors): WriteOutcome<T> {
  return { ok: false, kind: 'invalid-input', fieldErrors }
}

/**
 * A refusal the person has to be told about, in words written for them.
 *
 * The database's own error text never reaches here. It is written for whoever
 * reads logs, it frequently names a constraint, and it is occasionally a
 * description of the schema — none of which helps somebody looking at a form
 * that will not submit.
 */
export function rejected<T>(message: string): WriteOutcome<T> {
  return { ok: false, kind: 'rejected', message }
}

/**
 * The row moved underneath this write, so nothing was applied.
 *
 * Nothing here decides what happens next. Merging two versions, or choosing
 * between them, would replace a disagreement two people can see with one they
 * cannot — and which version is right is a question about a trip rather than
 * about data.
 */
export function conflicted<T>(message: string): WriteOutcome<T> {
  return { ok: false, kind: 'conflict', message }
}
