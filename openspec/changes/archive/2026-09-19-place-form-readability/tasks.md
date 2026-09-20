# Tasks

## 1. Drop "(optional)" from every label

- [x] 1.1 Web: remove `(optional)` from `Day`, `Hours`, `Second currency`, `Start date`
      and `End date` — `marker-form.tsx`, `hours-field.tsx`, `currency-field.tsx`,
      `trip-setup.tsx`. Verify with `grep -rn "(optional)" apps/web` returning no label
      text.
- [x] 1.2 Mobile: the same five labels — `marker-form.tsx`, `hours-field.tsx`,
      `currency-field.tsx`, `trip-setup.tsx`. Verify with `grep -rn "(optional)" apps/mobile`
      returning no label text.
- [x] 1.3 Give the second-currency field a first line saying it can be left as None, on
      both apps — it is the one field losing the word without guidance already beneath it.
      Verify by opening the new-city detour and reading the line.

## 2. The hours group

- [x] 2.1 Web: wrap the hours in a bordered group labelled `Hours` in
      `hours-field.module.css` / `hours-field.tsx` — border `--pp-line`, radius
      `--pp-radius-md`. No background fill (see design.md). Verify the boundary is visible
      in both themes at 416px and 328px card widths.
- [x] 2.2 Mobile: the same group in `hours-field.tsx`, using `theme.colour.line` and
      `RADIUS.md`. Verify the seven day circles still fit — measure the row, do not eyeball
      it; the group leaves 315 points for 308 points of targets.

## 3. The price group

- [x] 3.1 Web `PriceField` in `ui.tsx` / `ui.module.css`: one `Price` label, both amounts
      and `Free` on one row inside a bordered group, currency code on each field. Verify at
      328px and 416px that neither amount is narrower than 8 digits.
- [x] 3.2 Web: let the row wrap rather than shrink — a flex basis on each amount, not a
      `min-width` floor (design.md says why). Verify at 328px that `Free` drops to its own
      line and nothing overflows the card.
- [x] 3.3 Mobile `PriceField` in `ui.tsx`: the same group, row and wrap behaviour. Verify
      on a 375-point device that both amounts and `Free` sit on one row.
- [x] 3.4 Make the two price field errors name their currency, on both apps — the label no
      longer does. Verify by saving a negative amount in the second field and reading the
      message.

## 4. Look at both running apps

- [x] 4.1 Web: add a place and edit one, in a city with a second currency and in one
      without, in both themes. Check the two groups read as groups, `Free` greys both
      amounts, and the clearing warning still appears when refiling to another city.
- [x] 4.2 Mobile: the same two paths on a 375-point device, in both themes. Check the
      sheet still sits on the bottom edge and the keyboard does not eat the padding —
      `KeyboardAvoidingView` must stay a bare positioner (`AGENTS.md`).
- [x] 4.3 Web and mobile: open the trip setup form and confirm the start and end date
      labels read `Start date` / `End date` with the existing sentence beneath them.

## 5. Finish

- [x] 5.1 `pnpm verify` passes.
- [x] 5.2 `openspec validate place-form-readability --strict` passes.
