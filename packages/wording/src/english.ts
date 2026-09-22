/**
 * Everything this product says, in English.
 *
 * WHAT IS IN HERE AND WHAT IS NOT
 *
 * Sentences the product says to a person. Not text a person typed — trip names,
 * place names and notes, links, city names, the name somebody is called on a
 * trip — and not the tile attribution, which is a condition of using the data
 * and has a fixed form. `product-wording` states that boundary; it is written
 * down because it is not obvious from either side, since a city's name and a
 * refusal about a city's name sit next to each other in the same form.
 *
 * WHY A KEY NAMES THE REFUSAL RATHER THAN THE FIELD
 *
 * `email.invalid` is one entry, resolved by the sign-in form, the sign-up form
 * and the invitation form. Three fields, one refusal, one sentence — which is
 * what `write-feedback` already required of the wording and what three copies
 * would quietly stop being true of. Where two fields are refused for genuinely
 * different reasons they get two entries, however alike the sentences read.
 *
 * WHY THE NUMBERS ARE STILL WRITTEN INTO THE SENTENCES
 *
 * `A name can be 200 characters at most.` holds its own limit, which duplicates
 * the constant the schema enforces it with. That duplication arrived with these
 * sentences and is carried across unchanged, because this change moves words and
 * does not rewrite them — a sentence that reads differently afterwards is a
 * mistake here, not an improvement. The one entry taking a number is the one
 * that already interpolated it.
 */

/**
 * A sentence, or a sentence with somewhere for a value to go.
 *
 * The values stay out of the sentence until the sentence has been chosen,
 * because where a name sits in a sentence is not the same in every language —
 * which is the whole reason a package reports `{ key, values }` rather than
 * handing over something already joined up.
 */
export const ENGLISH = {
  // ── Signing in and signing up ────────────────────────────────────────────
  'email.invalid': 'Enter a valid email address.',
  'password.missing': 'Enter your password.',
  // The number is written in rather than placed in, because a schema's message
  // slot carries a bare name and nothing else. `auth.test.ts` asserts this
  // sentence still names `MIN_PASSWORD_LENGTH`, so the two cannot drift apart
  // the way they could if nothing were watching.
  'password.tooShort': 'Use at least 8 characters.',
  'password.needsLetter': 'Include at least one letter.',
  'password.needsNumber': 'Include at least one number.',
  'password.repeatMissing': 'Repeat your password.',
  'password.mismatch': 'Both passwords must match.',

  // ── Authentication failures, by the code the service gave ────────────────
  //
  // `auth.invalidCredentials` deliberately does not distinguish a wrong
  // password from an unregistered address — saying which would confirm to
  // anyone asking that an account exists.
  'auth.invalidCredentials': 'That email and password do not match an account.',
  'auth.emailTaken': 'There is already an account with that email address.',
  'auth.weakPassword': 'That password is too weak. Try a longer one.',
  'auth.emailNotConfirmed': 'That account has not been confirmed yet.',
  'auth.rateLimited': 'Too many attempts. Wait a moment and try again.',
  'auth.signupDisabled': 'New accounts are not being accepted right now.',
  'auth.generic': 'Something went wrong. Try again.',

  // ── Trips ────────────────────────────────────────────────────────────────
  'trip.needsName': 'A trip needs a name.',
  'trip.nameTooLong': 'A trip name can be 120 characters at most.',
  'trip.startMalformed': 'A start date should look like 2026-04-03.',
  'trip.endMalformed': 'An end date should look like 2026-04-03.',
  'trip.endBeforeStart': 'The end date cannot be before the start date.',
  'trip.loadFailed': 'Could not load your trips.',
  'trip.createFailed': 'Could not create that trip.',
  'trip.saveFailed': 'Could not save that trip.',

  // ── Cities ───────────────────────────────────────────────────────────────
  'city.needsName': 'A city needs a name.',
  'city.nameTooLong': 'A city name can be 120 characters at most.',
  // `citySchema` says this in its own words for anything reaching the data
  // layer without passing through a form; the form answers with the one above.
  'city.nameEmpty': 'Give the city a name.',
  // Quoted because the name is somebody's text dropped into the middle of a
  // sentence, and a trip may well hold a city called `Kyoto Day 2`.
  'city.nameTaken': (v: { name: string }) => `This trip already has a city called “${v.name}”.`,
  'city.loadFailed': 'Could not load this trip’s cities.',
  'city.saveFailed': 'Could not save this city.',
  'city.deleteFailed': 'Could not remove this city.',

  // ── Where a place gets filed ─────────────────────────────────────────────
  'cityClaim.filedUnder': (v: { city: string }) =>
    `Filed under ${v.city}, which is where this place is.`,
  'cityClaim.several': (v: { cities: string }) =>
    `More than one city is near enough to hold this: ${v.cities}. Choose one.`,
  'cityClaim.none': 'Not near any city on this trip. Choose one, or leave it unassigned.',
  'cityClaim.noneButNamed': (v: { place: string }) =>
    `Not near any city on this trip. This place is in ${v.place}.`,

  // ── Places ───────────────────────────────────────────────────────────────
  'place.needsName': 'A place needs a name.',
  'place.nameTooLong': 'A name can be 200 characters at most.',
  'place.noteTooLong': 'A note can be 2,000 characters at most.',
  'place.linkMalformed': 'A link should look like https://example.com.',
  'place.linkTooLong': 'A link can be 2,000 characters at most.',
  'place.cityNotOnList': 'Choose a city from the list.',
  'place.priceNegative': 'A price cannot be less than nothing.',
  'place.priceNegativeWithFree':
    'A price cannot be less than nothing. Turn on Free for a place that costs nothing.',
  'place.localPriceNeedsCurrency': 'A local price needs the currency it is in.',
  'place.dayMalformed': 'A day should look like 2026-04-03.',
  'place.lastDayMalformed': 'A last day should look like 2026-04-03.',
  'place.lastDayNeedsFirst': 'A last day needs a day to start from.',
  'place.lastDayBeforeFirst': 'The last day must fall after the day.',
  'place.spanTooLong': 'A place cannot be planned for more than a year. Check the year.',
  'place.loadFailed': 'Could not load the places on this trip.',
  'place.saveFailed': 'Could not save this place.',
  'place.deleteFailed': 'Could not remove this place.',
  'place.conflict':
    'Somebody else changed this place while you were editing it. Nothing you typed has been lost — open it again to see their version.',
  'place.typeUnknown': 'Unknown marker type.',

  // ── Opening hours ────────────────────────────────────────────────────────
  'hours.needsADay': 'Pick at least one day it opens.',
  'hours.needsOneRange': 'Every open day needs one set of hours.',
  'hours.rangesDiffer': 'Every open day needs the same hours.',
  'hours.needsBothTimes': 'Enter both times.',
  'hours.timeMalformed': 'Write the times like 09:00.',

  // ── A second currency on a city ──────────────────────────────────────────
  'currency.malformed': 'A currency is a three-letter code, like JPY.',
  'currency.alreadyDollars': 'US dollars is already the first price.',

  // ── The people on a trip ─────────────────────────────────────────────────
  'member.needsDisplayName': 'Enter the name to show on this trip.',
  'member.displayNameTooLong': 'A name can be 60 characters at most.',
  'member.loadFailed': 'Could not load the people on this trip.',
  'member.inviteFailed': 'Could not add that person.',
  'member.duplicate': 'Somebody with that email address is already on this trip.',
  'member.removeFailed': 'Could not take back that invitation.',
  'member.alreadyClaimed':
    'They joined while this list was open, so their invitation is a membership now and was not taken back.',
  // Not `Remove`: this undoes a typo, it does not eject a person.
  'member.takeBackLabel': 'Take back',
  // The confirming control, which restates the act rather than saying `Yes`.
  'member.takeBackConfirm': 'Take it back',
  'member.takeBackDecline': 'Cancel',
  // A possessive rather than "this invitation", because a list can hold
  // several and "this" names none of them.
  'member.takeBackQuestion': (v: { name: string }) => `Take back ${v.name}'s invitation?`,
  'member.takeBackConsequence': (v: { email: string }) =>
    `${v.email} comes off the trip. Nothing else changes, and you can invite that address again.`,

  // ── Who wants to go where, and what has been seen ────────────────────────
  'interest.loadFailed': 'Could not load who wants to go where.',
  'interest.saveFailed': 'Could not save that.',
  'visited.saveFailed': 'Could not change whether this place is visited.',

  // ── What an empty field on a place's card says ───────────────────────────
  //
  // Every one names what is missing rather than using one catch-all phrase, and
  // `yet` is the word carrying that each can still be filled in from the card.
  'empty.day': 'No day yet',
  'empty.note': 'No note yet',
  'empty.link': 'No link yet',
  'empty.hours': 'No hours yet',
  // Deliberately not `No city yet`. Being filed under no city is not missing
  // information — it is a state a place may rest in, chosen on purpose in the
  // form. `Unassigned` because the product already has this word for exactly
  // this group, in the place form and in the city control.
  'empty.city': 'Unassigned',

  // ── Finding a place by name ──────────────────────────────────────────────
  'search.unavailable': 'Place search is unavailable right now.',

  // ── What each thing the map is built from does ───────────────────────────
  //
  // Our own prose, in one line somebody who is not a cartographer can read, so
  // it is named like any other sentence. What is **not** here is the
  // attribution line itself — `© OpenMapTiles © OpenStreetMap contributors` —
  // which is a condition of the ODbL licence, has a fixed form, and stays in
  // `@pinpoint/map` where neither application can invent its own version. The
  // four names and their links are proper nouns and are not here either.
  'credit.openstreetmap': 'The map data, contributed by its community.',
  'credit.openmaptiles': 'The schema the data is packed into.',
  'credit.openfreemap': 'Serves the tiles, at no cost and without an account.',
  'credit.maplibre': 'Draws the map on the screen.',

  // ── What a marker's type is called ───────────────────────────────────────
  //
  // Keyed by the type's own identifier. `@pinpoint/map` holds the identifier,
  // the colour and an icon's name, and nothing that can be drawn as it stands.
  'markerType.place': 'Place',
  'markerType.temple': 'Temple',
  'markerType.culture': 'Culture',
  'markerType.nature': 'Nature',
  'markerType.food': 'Food',
  'markerType.shopping': 'Shopping',
  'markerType.stay': 'Stay',
  'markerType.transport': 'Transport',
} as const
