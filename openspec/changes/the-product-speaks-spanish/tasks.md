## 1. Settle the runtime question before building on it

- [ ] 1.1 Build the phone app to a real iOS device and a real Android device and print all
      five day forms and a price at 999, 1200, 12000 and 32.5 under `es-ES`, from a scratch
      screen. Verify the output matches the specs' examples — `viernes, 3 de abril`,
      `vie, 3 abr`, `3 abr`, `viernes, 3 de abril de 2026`, `USD 1200`, `USD 12.000`,
      `USD 32,50`. Node and a browser do not answer this question; only a device does.
- [ ] 1.2 If any form fell back to `2026-04-03` or a separator was wrong, add hand-written
      month and weekday tables per language to `@pinpoint/core` and verify 1.1 again. If
      everything matched, record that in the change and keep `Intl`.

## 2. A second language in the shared source

- [ ] 2.1 Add `'es'` to `LANGUAGES` and a `SPANISH` catalogue typed as `Catalogue`, with
      every name English holds, written impersonally — infinitives and `se` forms, never
      addressing the person. Verify `pnpm typecheck:packages` fails while any name is
      missing and passes once none is.
- [ ] 2.2 Translate the conflict sentence and the two others that name the person
      (`password.missing`, `trip.loadFailed`) and verify each reads as a statement rather
      than an instruction addressed to somebody.
- [ ] 2.3 Extend `say.test.ts` to resolve every name in both languages and verify no
      entry returns an empty string or the name itself.
- [ ] 2.4 Verify `pnpm check:wording` still passes with two catalogues present.

## 3. Days and prices take the language

- [ ] 3.1 Give `day-wording.ts` a language argument mapping to a stated locale per
      language, keeping the fallback to the stored string. Verify `day-wording.test.ts`
      covers all five forms and all four stretch forms in both languages, with the Spanish
      comma and the composed full form asserted explicitly.
- [ ] 3.2 Give `price.ts` and `formatMoney` a language argument. Verify `price.test.ts`
      asserts `USD 1200` and `JPY 3800` carry no separator in Spanish, `USD 12.000` does,
      and `USD 32,50` uses a comma.
- [ ] 3.3 Move `Free` into the catalogue as a named sentence resolved by each application,
      and verify no package returns the word.
- [ ] 3.4 Replace the two hardcoded `toLocaleString('en')` distance formatters in both
      applications' place search with the language in force, and verify a distance reads
      in Spanish form.

## 4. The laptop decides and remembers a language

- [ ] 4.1 Add a language cookie read in the root layout beside the theme cookie, seeded
      into a provider, with `<html lang>` set from it. Verify the page source carries
      `lang="es"` when the cookie says Spanish.
- [ ] 4.2 Fall back to the browser's `Accept-Language` when nothing is stored, choosing
      English for any language the product is not offered in. Verify both cases by
      changing the browser's language and loading with no cookie.
- [ ] 4.3 Add the three-way control to the account menu beside the theme control. Verify
      choosing a language repaints every surface at once with no reload, and that the
      choice survives a reload.

## 5. The phone decides and remembers a language

- [ ] 5.1 Add `expo-localization`, read once for the initial language only, and a language
      key in `apps/mobile/lib/preferences.tsx` read inside the launch gate. Verify a cold
      launch on a Spanish device opens in Spanish and paints nothing first.
- [ ] 5.2 Add the three-way control to the account sheet. Verify the choice survives a
      cold launch and that changing the device language afterwards does not override it.
- [ ] 5.3 Verify a phone set to German, reading a trip in Spanish, shows the same days and
      prices as a laptop set to English reading the same trip in Spanish.

## 6. The applications' own words move out of them

- [ ] 6.1 Move every visible string in `apps/web` into the catalogue in both languages,
      including the aria labels and placeholders. Verify by reading each screen in Spanish
      in the browser — every word changed.
- [ ] 6.2 Move every visible string in `apps/mobile` the same way, including all
      `accessibilityLabel` and `accessibilityHint` values. Verify by reading each screen in
      Spanish on a device.
- [ ] 6.3 Verify with a screen reader on both platforms that no control announces an
      English name while the product is in Spanish. This is where the leftovers are, and
      looking at the screen will not find them.

## 7. Writing words into a component stops being possible

- [ ] 7.1 Add `react/jsx-no-literals` and the attribute rule to both applications' ESLint
      configurations and to `eslint.config.packages.mjs`. Verify the build fails on a
      literal added to a component and on one added to an `accessibilityLabel`.
- [ ] 7.2 Write down what the rule permits, keeping it to punctuation and separators, and
      verify the list is short enough to read at a glance.
- [ ] 7.3 Verify `pnpm lint`, `pnpm lint:mobile` and `pnpm lint:packages` all pass with the
      rule on, and that nothing was suppressed to get there.
- [ ] 7.4 Add the rule to the CI workflow if it needs its own step, and verify `pnpm verify`
      covers everything CI runs.

## 8. Look at it

- [ ] 8.1 Read every screen of the phone app in Spanish on a real device and check the
      tightest controls for overflow: the bottom bar's three tools, the city and filter
      pills, and a long trip name beside the account control.
- [ ] 8.2 Read every screen of the laptop app in Spanish at 900px, 1080px and full width,
      and check the chrome bar, the filter trigger's pinned width, and the place form.
- [ ] 8.3 Switch language with a place's details open on both platforms and verify the
      place's own name and note are unchanged while everything around them is not.
- [ ] 8.4 Verify the map attribution reads identically in both languages.
- [ ] 8.5 Run `pnpm verify` and `openspec validate the-product-speaks-spanish --strict`.
