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

/**
 * What the card calls a place filed under no city.
 *
 * Deliberately **not** in the map above, and deliberately not `No city yet`.
 * Every wording there names something missing that can still be filled in, and
 * `yet` is the word doing that work. Being filed under no city is not missing
 * information — it is a state a place may rest in, reached on purpose by
 * choosing it in the form, and it is what the rule produces whenever no city
 * claims a place or two of them do.
 *
 * `Unassigned` rather than a phrase of its own because the product already has
 * this word for exactly this group: it is the option in the place form, and it
 * is the row in the city control that gathers them. A third name for one idea
 * is how a person ends up wondering whether they are the same thing.
 */
export const UNFILED_CITY_WORDING = 'Unassigned'
