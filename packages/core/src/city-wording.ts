import { message, type Message } from '@pinpoint/wording'

/**
 * What the product says when creating a city is refused.
 *
 * Here rather than in each application for the reason `invitation-wording.ts`
 * gives, and this is the case that proves it: both of these were written twice
 * on the same day, and the second one had already drifted by the time anybody
 * looked. The laptop wrapped the name in quotation marks and the phone did
 * not — one refusal, two wordings, neither of them wrong on its own.
 *
 * Neither message comes from `citySchema`, and that is deliberate rather than
 * an oversight. The form answers both of these without asking the database,
 * because one of them cannot be asked: whether a trip already holds a city of
 * this name is a question about the other cities, which the schema describing a
 * single city has no way to see. The empty name sits beside it so that the two
 * refusals a person can meet here are answered in one place and read alike.
 */

/** An empty name. `citySchema` says the same thing in its own words for
 *  anything reaching the data layer without passing through a form. */
export const CITY_NEEDS_A_NAME = message('city.nameEmpty')

/**
 * A name the trip already holds, naming it.
 *
 * Quoted because the name is somebody's text dropped into the middle of a
 * sentence, and a trip may well hold a city called `Kyoto Day 2`. The name
 * rides beside the sentence rather than being joined into it, because where
 * it sits inside the sentence is not the same in every language.
 */
export function cityNameTaken(name: string): Message {
  return message('city.nameTaken', { name })
}
