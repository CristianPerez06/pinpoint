/**
 * One message per offending field, keyed by field name.
 *
 * This lives here rather than beside the authentication outcome that first
 * needed it, because writing a marker rejects input for exactly the same reason
 * signing in does, and rendering that rejection is the same problem both times:
 * mark up the field, not the form.
 *
 * Kept as a plain record rather than a class or a branded type — every consumer
 * either looks up one key or iterates, and both are what a record is for.
 */
export type FieldErrors = Record<string, string>

/**
 * What this needs from a validation issue, described structurally.
 *
 * Zod's issues satisfy it. Saying so structurally rather than importing the type
 * means this function does not pin a validation library, which matters because
 * it is now shared by two packages that both hold their own schemas.
 */
export interface ValidationIssue {
  path: PropertyKey[]
  message: string
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
    errors[field] ??= issue.message
  }
  return errors
}
