## Context

See `proposal.md` — Why. The arrangement this change completes is already built:
`@pinpoint/wording` holds every sentence a shared package reports, `say(language, message)`
already takes a language, and `check:wording` already fails on a name with no sentence and
a sentence with no name. `LANGUAGES` holds one value and `say.ts` says in as many words
that taking the argument early is what keeps this change to replacing a value.

Two constraints shape everything below:

- **Both applications must produce the identical string from the identical stored value
  and the identical language.** `price.ts` and `day-wording.ts` each carry this written
  down, with the failure that taught it. The device is not a source of language for
  anything except the very first launch.
- **The package renders nothing and holds no framework.** Where the language is *decided*
  is each application's business, exactly as where a colour is applied is.

## Goals / Non-Goals

**Goals:**

- A second catalogue that cannot be incomplete.
- One place per application where the language is decided, read once, with nothing painted
  before it is known.
- A check that makes writing words into a component impossible rather than discouraged.

**Non-Goals:**

- A message-formatting library, plural rules, or gender agreement machinery. Neither
  language's catalogue needs them today; the one entry taking a value places a name into a
  sentence and nothing more.
- Any third language. Adding one is adding a file, and this design is what makes that true.
- Right-to-left, and any change to how the chrome is anchored.

## Decisions

### The catalogue is a second file, typed against the first

`SPANISH` is a second module shaped by `Catalogue = typeof ENGLISH`, added to the
`CATALOGUES` record. The type already refuses a language holding fewer names than English,
or a plain sentence where a value has to go — `say.ts` says so and was built for this.

No formatter dependency. The existing arrangement is a record of strings and small
functions, which is all either language needs, and it keeps the Hermes question off the
table entirely.

### The language reaches a call site through each application's own provider

`say(language, message)` does not change. What changes is that the 107 call sites passing
`ENGLISH_LANGUAGE` pass a value read from a hook instead — `useLanguage()` on both
platforms, served by the same provider that already serves the theme.

This is deliberately the shape the theme already has rather than a new one: on the laptop
the server reads the cookie, seeds the provider, and the client never reads the cookie
itself, because a second reader is a second thing that can be stale. On the phone the value
is read inside the launch gate in `_layout.tsx`, so nothing paints before it is known.

**This is not an optional resemblance.** `day-wording.ts` documents a hydration mismatch
that left the calendar as dead markup — a day worded one way on the server and another in
the browser — and a language resolved independently on both sides is the same defect with a
larger surface. One reader, on the server, seeded in.

### Days and prices keep `Intl` with a stated locale, one per language

`day-wording.ts` and `price.ts` take the language as their first argument and map it to a
stated locale — `en-GB` and `es-ES`. The existing fallback to the stored `YYYY-MM-DD`
string stays, for the reason it was written.

The Spanish forms were probed rather than reasoned about, and two of them are not what
substituting words would give:

- Spanish carries a comma the English forms do not: `viernes, 3 de abril`, `vie, 3 abr`.
  `formatDayFull` composes from `formatDay` and so stays consistent by construction, which
  is what that composition was for.
- Spanish writes **no** thousands separator at four digits — `1200`, `3800` — and a full
  stop from five: `12.000`. Prices on this product mostly land in the range where the
  exception applies, not the rule.

Both are recorded in the specs with examples, so a reviewer can tell a wording decision
from whatever a runtime happened to answer.

### The check is a lint rule about position, not a script about prose

Two rules, added to the ESLint configuration both applications and the shared packages
already run since #216:

- `react/jsx-no-literals` for words written between elements.
- A `no-restricted-syntax` selector for a string literal in `aria-label`, `placeholder`,
  `title`, `alt`, `accessibilityLabel` and `accessibilityHint`.

Alternatives were compared at the user's request and both were rejected:

- **A script scanning for English-looking prose**, in the manner of `check-wording.mjs`. It
  would catch sentences assembled outside the markup, which the lint rule misses. Rejected
  because deciding whether a run of characters is prose is a guess: it flags style names,
  fixtures, web addresses and the word `button`, needs an exemption list to stay usable,
  and an exemption list is where a check goes to die. `check-wording.mjs` gets away with
  reading text because it looks for *names*, which have a fixed shape.
- **A typed primitive that only accepts a named sentence**, so a literal does not compile.
  This is the strongest of the three and is the shape #216 chose for its own problem.
  Rejected for now on size: it routes every text site in both applications through a new
  component, which is a larger sweep than moving the words. It is cheaper after this change
  than before it, because every text site will already have been visited once.

The rule runs in the editor, which is most of its value — a violation is a squiggle while
it is being typed rather than four minutes into CI.

### The words move first, the rule goes on last

Turning the rule on before the sweep would report a few hundred violations at once and
tell nobody anything. The sweep happens application by application, the rule goes on at
the end of it, and the build then proves the sweep was complete — which is the only proof
available, since nothing else can distinguish a sentence that was moved from one that was
missed.

## Risks / Trade-offs

- **Hermes may not hold `es` locale data, in which case every Spanish date falls back to
  `2026-04-03`.** `price.ts` already records that the data behind `Intl` is thinner on a
  React Native runtime than in a browser. The fallback is correct behaviour and would still
  be a visibly broken Spanish app. → Verify on a real Android device and a real iOS device
  **first**, before any other work, with all five day forms and a price at four and five
  digits. If the data is absent, the wording moves to hand-written month and weekday tables
  in `@pinpoint/core`, which is more code and no less correct. Do not verify this in Node
  or in a browser; neither answers the question.

- **A language resolved independently on the server and in the browser reproduces the dead
  calendar.** → One reader, on the server, seeded into the provider. Same as the theme.
  Covered by the "no surface is left in the previous language" scenario, which is only
  observable by looking.

- **Spanish runs roughly a fifth longer and this interface has controls tuned to English
  lengths.** The phone's bottom bar, the selector pills, the trip name that truncates so
  the menu is not pushed off, and the filter trigger whose width is pinned in
  `trip-workspace.module.css` for reasons written there. → Look at the tightest ones in
  Spanish on a real phone, not at a resized browser.

- **The lint rule misses a sentence assembled outside the markup.** Accepted, stated in the
  spec, and the reason the typed primitive stays on the table.

- **`react/jsx-no-literals` is noisy about punctuation and whitespace.** → The permitted
  list is written down and kept short; the spec requires that it stay readable.

- **The sweep touches nearly every file in both applications**, so it will conflict with
  anything else in flight. → Nothing else is in flight; `openspec list` is empty.
