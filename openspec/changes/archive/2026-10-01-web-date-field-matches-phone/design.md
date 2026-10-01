## Context

The laptop's seven date fields go through `TextField` with `type="date"`
(`apps/web/app/_components/ui.tsx`), except the calendar screen's day, which is a bare
`<input type="date">` in `calendar-screen.tsx`. The phone's `DayField`
(`apps/mobile/components/ui.tsx`) is the reference. It is a pressable field showing
`formatDayNumeric` or `No day yet` with a Lucide calendar icon, a `Clear` beside it when
`clearable` and holding a day, a `standalone` look for the calendar band, and on iOS a
calendar in a `floating` sheet centred on the screen.

Two web mechanisms constrain the approach:

- **Every web surface dismisses on an outside press and on Escape** through
  `useDismissible`, which decides "inside" by DOM containment in the panel's element. A
  calendar mounted anywhere else would close the place form the moment it was pressed.
- **Surfaces animate with a transform** (`surfaceClass`, `usePresence`). A
  `position: fixed` child of a transformed ancestor is positioned against that ancestor,
  not the viewport, so a calendar drawn as a fixed overlay inside the form would centre on
  the form, not on the screen.

## Goals / Non-Goals

**Goals:**

- One web `DayField` that every laptop date field uses, so the seven fields cannot drift
  apart.
- The calendar's words come from `@pinpoint/core` and `@pinpoint/wording`, never from the
  library or the browser.

**Non-Goals:**

- Sharing anything rendered with the phone. The phone's `DayField` is untouched.
- Typing a date. The field is a button, as on the phone.

## Decisions

**The month grid is `@daypicker/react` (v10).** It is the current name of
`react-day-picker`: MIT, no service behind it, and its only dependencies are `date-fns`
and `@date-fns/tz`. It renders in place in the DOM with no portal, follows the WAI-ARIA
grid pattern (a roving tab index, arrow keys, Page Up/Down for months, Home/End for the
week), and every visible and spoken string can be replaced through `formatters` and
`labels`. A hand-built grid was the alternative. The keyboard and screen-reader behaviour
is most of that work and the easiest part to get subtly wrong, which is why the user chose
the library.

**The library's stylesheet is not imported.** Its parts are styled through `classNames`
with a CSS module of our own, reading only `--pp-*` custom properties. The theme then
switches through the cascade as everything else does, and no second palette ships.

**The calendar opens in a `<dialog>` with `showModal()`, nested inside the field.** This
answers both constraints above with no portal and no change to `useDismissible`:

- The dialog stays a DOM descendant of the form. Presses on the calendar, and on its
  backdrop (whose events target the dialog element), count as inside the form, so the form
  is never dismissed by choosing a date.
- `showModal()` draws in the browser's top layer, which escapes every transformed
  ancestor. It centres on the viewport and supplies `::backdrop` for the dimming, and it
  makes the rest of the page inert while open, which keeps focus inside the calendar.

Escape is handled on the dialog's `cancel` event and stopped from propagating, so it
closes the calendar and not the form underneath. A press whose target is the dialog
itself (the backdrop, outside the inner panel) closes it.

**Motion follows `motion`'s surface rule with the phone's `floating` movement.** The
calendar rises a short distance as it fades, using the shared arrive pairing to open and
the standard pairing to close. The closing animation is held with `usePresence` as other
surfaces are. Reduce motion is already handled globally in `globals.css`.

**Days cross into and out of the library as local dates through `dateOfDay` and
`dayOfDate`** from `@pinpoint/core`, never through `toISOString`, which shifts the day for
anyone east of Greenwich. The field's value stays an `IsoDay | null` on its way
in and out, which is the phone's `DayField` signature. The web call sites hold `''` for
"no day" today, so they convert at the boundary rather than the field accepting both.

**Words:**

- `@pinpoint/core` gains `formatMonth(language, date)` (`August 2027` / `agosto de 2027`)
  and `formatWeekdayShort(language, date)` (`Mon` / `lun`). They sit beside the existing
  day wording, with the stated `en-GB` / `es-ES` locales and the same fall-back-not-throw
  rule, plus tests writing both languages out.
- These feed the library's `formatCaption` and `formatWeekdayName`. `weekStartsOn={1}`
  is fixed, not taken from a locale.
- Each day's spoken label is `formatDayFull(language, day)`, which the spec's keyboard
  scenario requires. A chosen day adds a named sentence.
- `@pinpoint/wording` gains `dayField.previousMonth`, `dayField.nextMonth` and
  `dayField.dayChosen` in both languages. The field's own spoken label and `Clear` reuse
  the existing `dayField.spokenEmpty`, `dayField.spokenDay` and `dayField.clear`.
- The dialog is labelled with the field's label.

Nothing is rendered until the calendar is opened, and it is always opened in the browser,
so the server never renders a month and there is nothing for hydration to disagree about.

**`TextField` loses its `date` type.** Leaving it would leave a second way to draw a date
field, which is how the seven fields would drift apart again.

## Risks / Trade-offs

- **[Bundle size]** The library and the parts of `date-fns` it uses add to every page with
  a form. → Measure first-load JS for `/` before and after in `next build`, and record the
  difference in the pull request. Load the calendar on first open (`next/dynamic`) if the
  difference is noticeable.
- **[A library's own strings leaking through]** Any `formatters` or `labels` entry not
  replaced falls back to the library's English. → Replace every one that renders or is
  spoken, and check by reading the calendar in Spanish with a screen reader, not by
  reading the code.
- **[`<dialog>` inside a `<label>`]** `TextField` wraps its input in a `<label>`, and a
  press anywhere inside a label activates its control. → `DayField` labels its button with
  `aria-labelledby` instead of wrapping it, as the phone's field is a labelled button
  rather than an input.
- **[Two Escape handlers]** If `cancel` is not stopped, one Escape closes the calendar and
  the form together, or asks to discard what was entered. → Covered by a task that tests
  exactly this on the place form with something typed in it.
