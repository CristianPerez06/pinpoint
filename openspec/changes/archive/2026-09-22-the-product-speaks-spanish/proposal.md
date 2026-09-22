## Why

Pinpoint only speaks English, and the people it was built for do not all read it. A trip
is planned by several people together, and one of them reading the interface in their own
language is the difference between using the product and being shown it.

The groundwork is done. Every sentence a shared package reports already travels as a name
rather than as words, `say` already takes a language as its first argument, and a check
already fails on a name with no sentence behind it. What is missing is a second language
to pass it — and the words the two applications still write into themselves, which never
left the components they are drawn in.

Doing it with one language proves nothing. The second catalogue is what finds the gaps.

## What Changes

**Pinpoint speaks Spanish.** Every sentence in the product is written a second time, and
the whole interface changes when the language does — headings, buttons, refusals, empty
states, and the labels a screen reader announces, which are where the leftovers always
turn out to be.

**A person chooses their language, and Pinpoint remembers.** Three choices, in the
account menu beside the choice of light or dark: follow the device, English, Spanish.
Opening the app for the first time on a phone set to Spanish opens it in Spanish. The
device is asked once, for that first launch, and never again — a phone set to German
showing a laptop's trip still agrees with the laptop about every date and price.

**The words the applications still hold move out of them.** Roughly a hundred sentences
today, all of them reported by shared code. The rest — every button, heading and empty
state in both applications, plus about 126 accessibility labels and placeholders — are
written into the components and move into the same one place.

**Writing a sentence into a component stops being possible.** A lint rule fails the build
on words written between tags and on words written into the attributes a screen reader
reads. This is the part that keeps the change true a year from now; without it the second
language rots the first time somebody is in a hurry.

**Days and prices follow the chosen language.** A day reads `Friday 3 April` in English
and `viernes 3 de abril` in Spanish. A price reads `USD 1,200` in English and
`USD 1.200` in Spanish, which is how the number is written there. The rule that has
always governed both is unchanged and gets sharper: both applications produce the same
string from the same stored value, and neither asks the device anything.

**The Spanish is written impersonally.** It never addresses the person — *Ingresar un
email válido*, not *Ingresá* or *Ingresa*. This is a voice decision: it reads naturally
to anyone on a trip rather than to one country, and it is what most of the existing
English already does anyway.

### What this does not do

- **No third language, and no machinery for one.** Adding a third is adding a file.
- **No right-to-left.** Neither language needs it, and it is not a translation job —
  it is its own change with its own budget.
- **Nothing a person typed is touched.** Trip names, place names, notes, links, city
  names, the name somebody is called on a trip. Nor the map's attribution line, which is
  a licence condition with a fixed form.
- **No language in the address bar.** The laptop remembers the choice the same way it
  already remembers light or dark.

## Capabilities

### New Capabilities

None. Everything here extends `product-wording`, which was written for exactly this.

### Modified Capabilities

- `product-wording`: the shared source holds more than one language and a name resolves
  in the one currently in force; a person chooses that language and it is remembered;
  words written into a component fail the build; and the clause deferring formatted
  values — *"it comes under this capability when it gains a second wording, and not
  before"* — now fires.
- `trip-calendar`: a day is worded from one shared definition **per language**, still
  identically on both platforms and still never from the device.
- `markers`: a price is presented in the chosen language's way of writing a number, still
  identically on both platforms, and `Free` becomes a named sentence.

## Impact

- `@pinpoint/wording` gains a Spanish catalogue and a second entry in `LANGUAGES`. It
  roughly triples in size, because the applications' own words arrive.
- Both applications: nearly every component, since nearly every component draws words.
- `@pinpoint/core` formats days and prices and takes the language as an argument, which
  `price.ts` has carried written instructions for since it was written.
- The phone gains one dependency, `expo-localization`, read once at first launch, and one
  more key in its preference store. The laptop reads one more cookie in the root layout,
  where it already reads the theme, and sets `<html lang>` from it.
- ESLint configuration in both applications and in the shared packages gains the rule.
- No new service, no cost, nothing sent anywhere.
