/**
 * What an empty field on a place's card says.
 *
 * Shared rather than one copy per application for the reason `price.ts` and
 * `day-wording.ts` give: both cards must say the same thing about the same
 * place, and two copies of a sentence drift the first time somebody edits one.
 *
 * Every field that can be empty says *what* is missing, in the shape the day
 * already had — `No day yet` — rather than one catch-all phrase. "Not recorded"
 * under a heading that says `Link` repeats nothing the heading did not, and a
 * screen reader that lands on the value alone hears a sentence with no subject.
 * `yet` because every one of these can be filled in later from the same card.
 *
 * The price is not here: it is a pill beside the place's type, and a place
 * without one simply has no pill.
 */
export const EMPTY_FIELD_WORDING = {
  day: 'No day yet',
  note: 'No note yet',
  link: 'No link yet',
  hours: 'No hours yet',
} as const
