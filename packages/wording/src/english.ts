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

  // ── Days, and a stretch of them ──────────────────────────────────────────
  //
  // The worded day itself — `Friday 3 April` — is a value, formatted in
  // `@pinpoint/core` per language, and is not here. What is here is the words
  // around it. A stretch whose both ends are known has none in either language,
  // and is named anyway so every answer from `formatDayRange` is drawn one way.
  'days.stretch': (v: { days: string }) => v.days,
  'days.from': (v: { day: string }) => `From ${v.day}`,
  'days.until': (v: { day: string }) => `Until ${v.day}`,
  // Days, not nights: see `formatRunPosition`.
  'days.runPosition': (v: { index: number; total: number }) => `Day ${v.index} of ${v.total}`,

  // ── A price ──────────────────────────────────────────────────────────────
  //
  // The amounts are values, formatted per language in `@pinpoint/core`, and
  // have no words around them. `Free` is a word.
  'price.free': 'Free',
  'price.amounts': (v: { amounts: string }) => v.amounts,

  // ── Opening hours, as the form and the card word them ────────────────────
  //
  // The list of days (`Mon to Fri`, `Tue–Sat`) is written per language in
  // `@pinpoint/core` beside the weekday names it is made of.
  'hours.openEveryDay': 'Open every day',
  'hours.openOn': (v: { days: string }) => `Open ${v.days}`,
  'hours.openAllDay': 'Open all day',
  'hours.closesNextDay': (v: { time: string }) => `Closes ${v.time} the next day`,
  'hours.everyDay': 'Every day',
  'hours.days': (v: { days: string }) => v.days,
  'hours.closed': 'Closed',
  'hours.allDay': '24 hours',
  'hours.between': (v: { open: string; close: string }) => `${v.open}–${v.close}`,

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


  // ── Words used across the product ─────────────────────────────────────────

  'app.name': 'pinpoint',
  'app.description': 'A map you can drop markers on.',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.creating': 'Creating…',
  'common.back': 'Back',
  'common.backToMap': 'Back to the map',
  'common.done': 'Done',
  'common.remove': 'Remove',
  'common.discard': 'Discard',
  'common.edit': 'Edit',
  'common.settings': 'Settings',

  // ── Signing in, the account, settings and the shells around every screen ──

  // ── Cross-product words, to be consolidated into `common.ts` ─────────────
  'common.tryAgain': 'Try again',

  // ── Signing in and creating an account ───────────────────────────────────
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.repeatPassword': 'Repeat password',
  'auth.signIn': 'Sign in',
  'auth.signingIn': 'Signing in…',
  'auth.createAnAccount': 'Create an account',
  'auth.createAccount': 'Create account',
  'auth.creatingAccount': 'Creating account…',
  // Said on both platforms' sign-up screens, word for word.
  'auth.invitedHint':
    'If you were invited, use the address the invitation went to — it is what links you to your trip.',
  // The question and the link after it are two sentences, drawn side by side.
  'auth.noAccountYet': 'No account yet?',
  'auth.createOne': 'Create one',
  'auth.haveAccount': 'Already have an account?',

  // ── The menu about the person ────────────────────────────────────────────
  // The menu's name, what it shows while no membership matches, and the
  // settings section it opens onto.
  'account.label': 'Account',
  'account.signedIn': 'Signed in',
  'account.signOut': 'Sign out',

  // ── Settings ─────────────────────────────────────────────────────────────
  'settings.documentTitle': 'Settings · pinpoint',
  'settings.signedInAs': 'Signed in as',
  'settings.loadingAccount': 'Loading your account',
  'settings.noAddress': 'No address on this account',
  'settings.appearance': 'Appearance',
  'settings.language': 'Language',
  // Shared by the ground and the language: the same choice, made twice.
  'settings.followDevice': 'Follow the device',
  'appearance.systemNote': 'Changes when your system appearance does',
  'appearance.light': 'Light',
  'appearance.lightNote': 'Always the light ground',
  'appearance.dark': 'Dark',
  'appearance.darkNote': 'Always the dark ground',
  'language.systemNote': 'Uses the language your device is set to',
  // Each language is named in itself, in every catalogue: that is how somebody
  // who cannot read the language in force finds their own.
  'language.english': 'English',
  'language.englishNote': 'Always in English',
  'language.spanish': 'Español',
  'language.spanishNote': 'Always in Spanish',

  // ── Waiting and failing ──────────────────────────────────────────────────
  'loading.map': 'Loading the map…',
  'loading.trip': 'Loading your trip…',
  'error.mapFailed': 'Something went wrong loading the map.',
  'map.noPlacesYet': 'No places saved on this trip yet.',
  'calendar.noTrip': 'There is no trip here to show a calendar for.',

  // ── A price field ────────────────────────────────────────────────────────
  'priceField.label': 'Price',
  'priceField.blankHint': "Leave it blank if you don't know.",
  // Followed by the sentence naming where the second currency comes from.
  'priceField.blankHintEither': "Leave an amount blank if you don't know it.",
  'priceField.inDollars': 'Price in US dollars',
  'priceField.inCurrency': (v: { currency: string }) => `Price in ${v.currency}`,

  // ── A day field, as a screen reader hears it ─────────────────────────────
  'dayField.spokenEmpty': (v: { label: string }) => `${v.label}, no day yet`,
  'dayField.spokenDay': (v: { label: string; day: string }) => `${v.label}, ${v.day}`,
  'dayField.clear': (v: { label: string }) => `Clear ${v.label.toLowerCase()}`,

  // ── Who made the map ─────────────────────────────────────────────────────
  'credits.title': 'About this map',
  'credits.blurb': 'Four projects, none of them ours.',
  // A project's proper name, then what it does.
  'credits.spoken': (v: { name: string; does: string }) => `${v.name}. ${v.does}`,

  // ── A place: its form, its card, its pin ──────────────────────────────────

  // ── Cross-product words, to be consolidated into `common.ts` ─────────────
  'common.editNamed': (v: { name: string }) => `Edit ${v.name}`,
  'common.removeNamed': (v: { name: string }) => `Remove ${v.name}`,
  'common.opensInBrowser': 'Opens in your browser',

  // ── A place's fields, as the form and the card label them ────────────────
  'placeField.name': 'Name',
  'placeField.type': 'Type',
  'placeField.city': 'City',
  'placeField.day': 'Day',
  'placeField.until': 'Until',
  'placeField.hours': 'Hours',
  'placeField.note': 'Note',
  'placeField.link': 'Link',
  'placeField.whoWantsToGo': 'Who wants to go',
  'placeField.visited': 'Visited',

  // ── The place form ───────────────────────────────────────────────────────
  'placeForm.namePlaceholder': 'What is this place called?',
  'placeForm.notePlaceholder': 'Why is this worth going to?',
  // Example text, and the same in every language — but it is still read.
  'placeForm.linkPlaceholder': 'https://…',
  'placeForm.newCityOption': '+ New city…',
  'placeForm.newCityChip': '+ New city',
  'placeForm.dayHint': 'Which day of the trip you plan to go. Leave it blank to decide later.',
  'placeForm.moreThanOneDay': '+ More than one day',
  'placeForm.untilHint': 'The last day it is planned for. Clear it to go back to one day.',
  'placeForm.createOffered': (v: { name: string }) => `Create ${v.name}`,
  'placeForm.newCityName': 'New city name',
  'placeForm.newCityPlaceholder': 'Kyoto',
  'placeForm.newCityCurrencyHint': (v: { city: string; currency: string }) =>
    `Places in ${v.city} get a ${v.currency} price box beside the dollars.`,
  'placeForm.newCityCurrencyHintUnnamed': (v: { currency: string }) =>
    `Places in this city get a ${v.currency} price box beside the dollars.`,
  'placeForm.createCityFailed': 'Could not create that city.',
  'placeForm.localPriceHint': (v: { currency: string; city: string }) =>
    `${v.currency} is ${v.city}'s currency. Type it as you saw it; nothing is converted.`,
  'placeForm.localPriceClearedUnfiled': (v: { amount: string }) =>
    `Leaving this place without a city clears the ${v.amount} saved for it.`,
  'placeForm.localPriceClearedMoved': (v: { city: string; amount: string }) =>
    `Moving to ${v.city} clears the ${v.amount} saved for this place.`,
  'placeForm.discardQuestion': 'Discard what you typed?',
  'placeForm.discardCapture': 'The place you found on the map goes with it.',
  'placeForm.discardEdit': 'Your changes to this place are not saved.',
  'placeForm.save': 'Save place',
  'placeForm.sheetHeight': 'Sheet height',
  'placeForm.sheetHalf': 'Half screen',
  'placeForm.sheetFull': 'Almost full screen',
  'placeForm.adjustPosition': 'Adjust position on the map',
  'placeForm.removeQuestion': 'Remove this place?',
  'placeForm.remove': 'Remove this place',

  // ── The place's card ─────────────────────────────────────────────────────
  // The laptop quotes the name and the phone does not; carried across as each
  // reads today.
  'placeCard.removeQuestionQuoted': (v: { name: string }) => `Remove “${v.name}”?`,
  'placeCard.removeQuestion': (v: { name: string }) => `Remove ${v.name}?`,
  'placeCard.cannotBeUndone': 'This cannot be undone.',
  'placeCard.othersHere': '← Others at this point',
  'placeCard.hidden':
    'Already saved on this trip. Your filter is hiding it, so it is not drawn on the map.',
  // Only ever drawn for a group of two or more.
  'placeGroup.count': (v: { count: number }) => `${v.count} places here`,
  'placeGroup.note':
    'They share the same coordinates, so zooming will not separate them. Nothing has been moved — pick one.',

  // ── Pins ─────────────────────────────────────────────────────────────────
  'pin.label': (v: { name: string; type: string }) => `${v.name} (${v.type})`,
  'pin.draft': 'The place being added',

  // ── Opening hours, in the form ───────────────────────────────────────────
  'hoursField.empty': "Leave empty if you don't know. Pick the days it opens to add hours.",
  'hoursField.opens': 'Opens',
  'hoursField.closes': 'Closes',
  'hoursField.to': 'to',

  // ── A city's second currency ─────────────────────────────────────────────
  'currencyField.label': 'Second currency',
  'currencyField.none': 'None',
  'currencyField.searchPlaceholder': 'None · search by name or code',
  'currencyField.searchPlaceholderShort': 'Search by name or code',
  'currencyField.search': 'Search currencies',
  'currencyField.noMatch': 'No currency matches that.',
  'currencyField.noneHint': 'Leave it as None if prices here are only in US dollars.',
  'currencyField.chooseLabel': 'Second currency: none. Choose one',
  'currencyField.changeLabel': (v: { currency: string }) =>
    `Second currency: ${v.currency}. Change it`,

  // ── Who wants to go, and whether anyone has been ─────────────────────────
  'interest.you': 'You',
  'interest.wantToGo': 'Want to go',
  'interest.notForMe': 'Not for me',
  'interest.wantsToGo': 'Wants to go',
  'interest.notForThem': 'Not for them',
  'interest.undecided': 'Undecided',
  'interest.youWantToGo': 'You want to go',
  'interest.notForYou': 'Not for you',
  'interest.youHaveNotSaid': 'You have not said',
  'visited.on': '✓ Visited',
  'visited.mark': 'Mark visited',

  // ── Trips, cities and the people on a trip ────────────────────────────────

  'common.clear': 'Clear',
  'common.name': 'Name',
  'common.dismissMessage': 'Dismiss this message',
  'common.dismissesMessage': 'Dismisses this message',

  // ── The trip menu (laptop) and the trips sheet (phone) ───────────────────
  'trip.menuName': 'Trip',
  'trip.trips': 'Trips',
  'trip.currentNote': 'Open',
  /** A trip in the switcher, as a screen reader announces it. */
  'trip.rowLabel': (v: { name: string; dates: string }) => `${v.name}, ${v.dates}`,
  'trip.renameThis': 'Rename this trip',
  'trip.rename': 'Rename',
  'trip.name': 'Trip name',
  'trip.dates': 'Trip dates',
  'trip.datesNone': 'None',
  'trip.datesSet': 'Set',
  'trip.startDate': 'Start date',
  'trip.endDate': 'End date',
  'trip.datesHint':
    'Both are optional. They decide which day the calendar opens on and nothing else.',
  'trip.people': 'People',
  'trip.new': 'New trip',
  'trip.newNote':
    'A trip is one shared map, separate from this one. Nothing here moves across.',
  'trip.archiveThis': 'Archive this trip',
  'trip.archive': 'Archive trip',
  'trip.archiving': 'Archiving…',
  'trip.archiveNamed': (v: { name: string }) => `Archive ${v.name}`,
  'trip.archiveHint': 'Puts the trip away. Nothing is deleted and it can be restored.',
  'trip.archivedTrips': 'Archived trips',
  'trip.archivedLooking': 'Looking…',
  'trip.showArchived': 'Show archived trips',
  'trip.showingArchived': 'Showing…',
  'trip.archived': 'Archived',
  'trip.nothingArchived': 'Nothing archived.',
  'trip.restoreNote': 'Nothing was deleted. Restoring one brings back everything it held.',
  'trip.restore': 'Restore',
  'trip.restoring': 'Putting back…',
  'trip.restoreNamed': (v: { name: string }) => `Restore ${v.name}`,

  // ── Starting a trip ──────────────────────────────────────────────────────
  'tripSetup.title': 'Start a trip',
  'tripSetup.lead': 'A trip is one shared map. Everyone you add to it sees the same places.',
  'tripSetup.expectingQuestion': 'Expecting to be on someone else’s trip?',
  'tripSetup.expectingAnswer':
    'You are added by email address, and the trip appears when you sign in with the same one. If it has not appeared, check that the address you signed up with is the address they added — and ask them to look at the trip’s people, where anyone who has not joined yet is shown with the address they were added at.',
  'tripSetup.nameLabel': 'What is the trip called?',
  'tripSetup.namePlaceholder': 'Japan 2026',
  'tripSetup.displayNameLabel': 'What should we call you on it?',
  'tripSetup.displayNamePlaceholder': 'Your name, as the others would say it',
  'tripSetup.create': 'Create trip',

  // ── The people on a trip ─────────────────────────────────────────────────
  /** The reader's own row in the list. */
  'people.you': 'You',
  'people.notJoined': (v: { email: string }) => `not joined yet · ${v.email}`,
  'people.takeBackNamed': (v: { name: string }) => `Take back ${v.name}'s invitation`,
  'people.inviteHint':
    'Adding somebody puts them on the trip straight away. Nothing is sent — tell them yourself, and the trip appears when they sign in with this address.',
  'people.email': 'Email',
  'people.namePlaceholder': 'What to call them on this trip',
  'people.emailPlaceholder': 'The address they will sign in with',
  'people.add': 'Add to trip',
  'people.adding': 'Adding…',

  // ── The cities of a trip ─────────────────────────────────────────────────
  'city.menuName': 'City',
  'city.cities': 'Cities',
  'city.workingOn': 'Working on',
  'city.allPlaces': 'All places',
  'city.unassigned': 'Unassigned',
  'city.placeCount': (v: { count: number }) =>
    v.count === 1 ? '1 place' : `${v.count} places`,
  'city.allPlacesMeta': (v: { count: number }) =>
    `${v.count === 1 ? '1 place' : `${v.count} places`} · the whole trip`,
  'city.none': 'No cities yet. Name the places you’re going, or file one while you save a place.',
  'city.new': 'New city…',
  'city.newHint': 'Adds a city to this trip',
  'city.create': 'Create city',
  'city.editNamed': (v: { name: string }) => `Edit ${v.name}`,
  'city.pickNamed': (v: { name: string }) => `${v.name}. Work on this city`,
  /** Under the currency field. `city` is empty while the city has no name yet. */
  'city.currencyHint': (v: { city: string; currency: string }) =>
    `Places in ${v.city === '' ? 'this city' : v.city} get a ${v.currency} price box beside the dollars.`,
  'city.remove': 'Remove city',
  'city.changeCurrency': 'Change',
  // The laptop quotes the city's name in its questions and the phone does not.
  'city.removeQuestionQuoted': (v: { name: string }) => `Remove “${v.name}”?`,
  'city.removeQuestion': (v: { name: string }) => `Remove ${v.name}?`,
  'city.removeCurrencyQuestionQuoted': (v: { name: string; currency: string }) =>
    `Remove ${v.currency} from “${v.name}”?`,
  'city.removeCurrencyQuestion': (v: { name: string; currency: string }) =>
    `Remove ${v.currency} from ${v.name}?`,
  'city.changeCurrencyQuestionQuoted': (v: { name: string; currency: string }) =>
    `Change “${v.name}” to ${v.currency}?`,
  'city.changeCurrencyQuestion': (v: { name: string; currency: string }) =>
    `Change ${v.name} to ${v.currency}?`,
  /** `count` places hold a price in `currency`, which removing it clears. */
  'city.currencyRemovedConsequence': (v: { count: number; name: string; currency: string }) =>
    v.count === 1
      ? `1 place in ${v.name} has a ${v.currency} price. It will lose it. Its USD price stays.`
      : `${v.count} places in ${v.name} have a ${v.currency} price. They will lose it. Their USD prices stay.`,
  /** The same, where the currency is replaced rather than removed. */
  'city.currencyChangedConsequence': (v: { count: number; name: string; currency: string }) =>
    v.count === 1
      ? `1 place in ${v.name} has a ${v.currency} price. It will lose it, not have it converted. Its USD price stays.`
      : `${v.count} places in ${v.name} have a ${v.currency} price. They will lose it, not have it converted. Their USD prices stay.`,
  /**
   * What removing a city costs, on the laptop. `local` is how many of its
   * places lose a local price in `currency` — 0 where none do.
   */
  'city.removeConsequence': (v: { places: number; local: number; currency: string }) => {
    if (v.places === 0) return 'It holds no places.'
    const unassigned =
      v.places === 1
        ? '1 place will become unassigned. They are not deleted.'
        : `${v.places} places will become unassigned. They are not deleted.`
    if (v.local === 0) return unassigned
    const lead = v.places === 1 ? 'It' : `${v.local} of them`
    const loss =
      v.local === 1
        ? `loses its ${v.currency} price; its USD price stays.`
        : `lose their ${v.currency} price; their USD prices stay.`
    return `${unassigned} ${lead} ${loss}`
  },
  /** The same, as the phone says it. */
  'city.removeConsequenceStays': (v: { places: number; local: number; currency: string }) => {
    if (v.places === 0) return 'Nothing is filed under it.'
    const stays =
      v.places === 1
        ? '1 place stays on the trip and becomes unassigned.'
        : `${v.places} places stay on the trip and become unassigned.`
    if (v.local === 0) return stays
    const lead = v.places === 1 ? 'It' : `${v.local} of them`
    const loss =
      v.local === 1
        ? `loses its ${v.currency} price; its USD price stays.`
        : `lose their ${v.currency} price; their USD prices stay.`
    return `${stays} ${lead} ${loss}`
  },

  // ── The map, finding a place, and the filter ──────────────────────────────

  // ── The map itself ───────────────────────────────────────────────────────
  'map.zoom': 'Zoom',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.reread': 'Read everything again',
  'map.loading': 'Loading the map',
  /** A pin standing for several places at one point. Always more than one. */
  'map.placesHere': (v: { count: number }) => `${v.count} places here`,
  /** A pin's spoken name: the place, then its kind. */
  'map.placeOfType': (v: { name: string; type: string }) => `${v.name} (${v.type})`,
  'map.draftPin': 'New place, not yet saved',
  'map.draftPinHint': 'Drag to adjust, then save',
  'map.styleFailed': 'The map could not be loaded',
  /** `reason` is lower case and ends without a full stop. */
  'map.styleFailedDetail': (v: { reason: string }) =>
    `The place data is fine — ${v.reason}. Your saved places are still here; only the map underneath them is missing.`,
  'map.styleFailedReason': 'the map style could not be loaded',
  /** The tile service refused the style, with its HTTP status. Lower case, no full stop. */
  'map.styleRefused': (v: { status: number }) => `the tile service answered ${v.status}`,
  'map.credits': 'Map data credits',
  'map.creditsHint': 'Opens the projects this map is built from',

  // ── The tools and the sight ─────────────────────────────────────────────
  'map.tools': "This trip's tools",
  'map.searchTool': 'Search',
  'map.closeSearch': 'Close search',
  'map.dropPin': '+ Drop a pin',
  'map.dropPinShort': 'Drop',
  'map.dropPinHint': 'Drop a pin on the map',
  'map.dropBanner': 'Click the map where the place is. You can drag the pin afterwards.',
  'map.sightHint': 'Move the map to put the place under the ring.',
  'map.useSpot': 'Use this spot',
  'map.otherViewCalendar': 'Calendar',
  'map.backToCalendar': '← Back to Calendar',
  'map.cityHintAll': 'All places. Choose a city to work on',
  'map.cityHint': (v: { name: string }) => `${v.name}. Change which city you are working on`,
  'map.editPlaceTitle': 'Edit this place',
  'map.savePlaceTitle': 'Save this place',

  // ── Notes over the map ──────────────────────────────────────────────────
  'map.dismiss': 'Dismiss',
  'map.noMatches': (v: { count: number }) =>
    `No places match this filter. The trip still has ${v.count} ${v.count === 1 ? 'place' : 'places'}.`,
  'map.noMatchesTap': (v: { count: number }) =>
    `No places match this filter. The trip still has ${v.count} ${v.count === 1 ? 'place' : 'places'} — tap to clear.`,
  'map.matchesOutOfView': (v: { count: number }) =>
    `${v.count} ${v.count === 1 ? 'place matches' : 'places match'}, none of them in view.`,
  'map.matchesOutOfViewTap': (v: { count: number }) =>
    `${v.count} ${v.count === 1 ? 'place matches' : 'places match'}, none of them in view — tap to show ${v.count === 1 ? 'it' : 'them'}.`,
  'map.showMatches': (v: { count: number }) => (v.count === 1 ? 'Show it' : 'Show them'),

  // ── Refusals of the writes made from the map ────────────────────────────
  'map.rereadFailed': 'Could not read the trip again. Check your connection.',
  'map.saveCityFailed': 'Could not save that city.',
  'map.removeCityFailed': 'Could not remove that city.',
  'tripActions.renameFailed': 'Could not rename this trip.',
  'tripActions.datesFailed': 'Could not save these dates.',
  'tripActions.archiveFailed': 'Could not archive this trip.',
  'tripActions.restoreFailed': 'Could not restore this trip.',

  // ── Place search ────────────────────────────────────────────────────────
  'search.label': 'Search for a place',
  'search.placeholder': 'Search for a place…',
  'search.searching': 'Searching…',
  'search.announceSearching': 'Searching for places',
  'search.intro':
    'Search for somewhere by name. If it cannot be found — and small, new, or locally-named places often cannot — close this and drop a pin instead.',
  /** `reason` is a whole sentence, already resolved. */
  'search.failed': (v: { reason: string }) =>
    `${v.reason} You can still add a place by dropping a pin.`,
  'search.empty': 'No matches. Try fewer words, or drop a pin.',
  /** `distance` is already formatted for the language — see `formatDistance`. */
  'search.distance': (v: { distance: string }) => `${v.distance} km`,

  // ── The filter ──────────────────────────────────────────────────────────
  'filter.name': 'Filter',
  'filter.hint': 'Filter this trip',
  'filter.hintNarrowed': 'Filter this trip. Some places are hidden',
  /** A collapsed question, spoken: its name, then what it is set to. */
  'filter.questionSpoken': (v: { name: string; said: string }) => `${v.name}. ${v.said}`,
  'filter.wantedBy': 'Wanted by',
  'filter.wantedByHeading': 'Places all of them want',
  'filter.everyone': 'Everyone',
  'filter.anyone': 'Anyone',
  'filter.nobodyAnswered': 'Nobody has answered yet',
  'filter.nobodyAnsweredSaid': 'Nobody has answered',
  'filter.kind': 'Kind of place',
  'filter.kindHeading': 'Places of any of these',
  'filter.anyKind': 'Any kind',
  'filter.day': 'Day',
  'filter.dayHeading': 'Places on any of these days',
  'filter.anyDay': 'Any day',
  'filter.noDay': 'No day yet',
  'filter.noDays': 'Nothing is planned for a day yet.',
  'filter.unfiled': 'Not filed under a city',
  'filter.hideVisited': 'Hide visited',
  'filter.clear': 'Clear the filter',
  'filter.clearShort': 'Clear',
  /** What a collapsed question is set to, when that is one thing or none. */
  'filter.listOne': (v: { word: string }) => v.word,
  /** …and when it is several: `head` is every word but the last, comma-joined. */
  'filter.listAnd': (v: { head: string; last: string }) => `${v.head} and ${v.last}`,

  // ── The calendar ──────────────────────────────────────────────────────────

  'calendar.loading': 'Loading the calendar',
  // The tab list's own name, which only a screen reader hears.
  'calendar.views': 'Calendar',
  'calendar.days': 'Days',
  // The tab and the heading over the places with no day. Kept apart from
  // `empty.day`, which is what a place's card says about one of them.
  'calendar.noDayYet': 'No day yet',
  // What the count's badge says aloud on the laptop, after the tab's own name.
  'calendar.waitingCountSpoken': (v: { count: number }) =>
    v.count === 1 ? ', 1 place' : `, ${v.count} places`,
  // The phone's tab, named whole: its label and its count as one sentence.
  'calendar.noDayYetCounted': (v: { count: number }) =>
    v.count === 1 ? 'No day yet, 1 place' : `No day yet, ${v.count} places`,
  'calendar.nothingWaiting': 'Nothing waiting for a day.',
  'calendar.cityGroup': (v: { city: string; count: number }) => `${v.city} · ${v.count}`,
  'calendar.nothingPlanned': 'Nothing planned.',
  // The step controls. Without a day while the screen waits for one; with the
  // day they lead to, year and all, once it is known.
  'calendar.previousDay': 'Previous day',
  'calendar.nextDay': 'Next day',
  'calendar.previousDayTo': (v: { day: string }) => `Previous day, ${v.day}`,
  'calendar.nextDayTo': (v: { day: string }) => `Next day, ${v.day}`,
  'calendar.dayField': 'Day',
  'calendar.visited': 'Visited',
  // The phone's pill, drawn in capitals.
  'calendar.visitedPill': 'VISITED',
  // A place's row as the phone announces it: everything it draws, in order.
  'calendar.placeRowSpoken': (v: { name: string; run: string; visited: number }) =>
    [v.name, v.run === '' ? null : v.run, v.visited ? 'visited' : null]
      .filter((part) => part !== null)
      .join(', '),
  // The phone's header.
  'calendar.tripButton': (v: { name: string }) => `${v.name}. Switch or manage trips`,
  'calendar.tripButtonWaiting': 'Trip',
  'calendar.menu': 'Menu',
  // The row in the trip's menu naming the view this screen is not.
  'calendar.otherViewMap': 'Map',
  'calendar.viewOnMap': 'View on map',
  'calendar.editPlace': 'Edit place',
  'calendar.removeFailed': 'Could not remove that place.',
} as const
