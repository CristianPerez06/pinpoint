import { message, type Message, type MessageKey } from '@pinpoint/wording'

/**
 * One named message per offending field, keyed by field name.
 *
 * This lives here rather than beside the authentication outcome that first
 * needed it, because writing a marker rejects input for exactly the same reason
 * signing in does, and rendering that rejection is the same problem both times:
 * mark up the field, not the form.
 *
 * Kept as a plain record rather than a class or a branded type — every consumer
 * either looks up one key or iterates, and both are what a record is for.
 *
 * **It used to carry the sentence.** A form received this map ready to print,
 * which is exactly the state `product-wording` exists to undo: the sentence had
 * been chosen inside a schema, by code that has no idea who is reading. It
 * carries the name now and the form resolves it where it draws it.
 */
export type FieldErrors = Record<string, Message>

/**
 * What this needs from a validation issue, described structurally.
 *
 * Zod's issues satisfy it. Saying so structurally rather than importing the type
 * means this function does not pin a validation library, which matters because
 * it is now shared by two packages that both hold their own schemas.
 *
 * `message` holds one of our **names**, not a sentence — see `refusal` below
 * for why a string slot is what a name travels in.
 */
export interface ValidationIssue {
  path: PropertyKey[]
  message: string
}

/**
 * Put one of our names where a validation library expects a sentence.
 *
 * A schema's message slot takes a string and nothing else, so a name travels in
 * it. This function exists so the name is *checked* on the way in: `refusal`
 * accepts a `MessageKey` and returns it unchanged, which turns a typo into a
 * compile error at the schema rather than a blank on a form somebody happens to
 * open. `check:wording` covers the same ground from the other side, for the
 * places a type cannot reach.
 *
 * Nothing here resolves anything. What comes out of a schema is still a name,
 * and stays one until an application draws it.
 */
export function refusal(key: MessageKey): string {
  return key
}

/**
 * Collapse a list of validation issues into one message per field.
 *
 * The first message per field wins. A field with three broken rules should say
 * one thing, not stack three — the person fixes the first problem and the next
 * attempt tells them the next one, which is the order they can act on anyway.
 *
 * An issue with no path is filed under `_`, so a whole-object rule ("passwords
 * do not match") has somewhere to land instead of being dropped.
 */
export function fieldErrorsOf(issues: readonly ValidationIssue[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : '_'
    // The slot held a name on the way in, put there by `refusal`, which is
    // where it was checked. Nothing revalidates it here: a schema is the only
    // thing that fills this in, and `check:wording` reads every call.
    errors[field] ??= message(issue.message as MessageKey)
  }
  return errors
}
