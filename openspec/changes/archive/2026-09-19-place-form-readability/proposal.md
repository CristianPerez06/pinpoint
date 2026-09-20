## Why

The form you fill in to save a place has grown with each change — a day, then opening
hours (#176), then a second currency (#186) — and it now reads as one long list of
boxes. Nothing shows which boxes belong together, so the hours look like four separate
fields rather than one question. The two price boxes each take the full width of the
card, which is far more room than an amount ever needs. And half the labels carry the
word "(optional)" while the line underneath them already says the same thing.

Issue #191. The look was settled on a mock first: `mock/place-form-mock.html`.

## What Changes

- **No label says "(optional)" any more.** `Day (optional)` becomes `Day`, `Hours
  (optional)` becomes `Hours`, `Second currency (optional)` becomes `Second currency`,
  and the trip's `Start date (optional)` / `End date (optional)` become `Start date` and
  `End date`. Every field that loses the word has, or gains, a line beneath it saying it
  can be left empty — so nothing is lost, it is just said once instead of twice.
- **The hours become one bordered group** labelled `Hours`, holding the day letters, the
  line naming the open days, and the two times. You can see where they start and stop.
- **The prices become one bordered group** labelled `Price`, holding both amounts on one
  short row with `Free` beside them. The currency code moves onto the box — `USD 25`,
  `JPY 3800` — instead of sitting above it as `Price (USD)` and `Price (JPY)`.
- Everything else in the form stays a plain field. The border is what marks a section
  built from more than one control.

Not doing: any change to what is saved, to what a place's card shows afterwards, or to
which fields the form has. This is how the form reads, nothing else.

A note on the trade: this does not make the form shorter. Measured on the mock it is
17px taller on the laptop and 9px taller on the phone — the one-row prices give back
about 60px and the two borders' padding takes slightly more than that again. What it
buys is being able to see which fields belong together.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marker-capture`: two requirements change.
  - *Saving a place captures its name, note, city, type, link, price, and the day it is
    planned for* — a new rule that no field label states that the field is optional;
    and the second price field moves from under the first to beside it, under one
    `Price` label, with the currency code on the field rather than in the label.
  - *The place form captures one range of hours for the days a place is open* — the
    phrase requiring the hours to be "labelled as optional" goes, and the hours are
    required to read as one bounded group.

The trip's start and end dates also lose "(optional)", but no spec states those labels,
so that needs no delta.

## Impact

- `apps/web/app/_components/` — `marker-form.tsx`, `hours-field.tsx`, `currency-field.tsx`,
  `trip-setup.tsx`, `ui.tsx` (`PriceField`) and their CSS modules.
- `apps/mobile/components/` — the same set: `marker-form.tsx`, `hours-field.tsx`,
  `currency-field.tsx`, `trip-setup.tsx`, `ui.tsx` (`PriceField`).
- No change to `packages/`, to the database, or to anything that reads a saved place.
- No new dependency.
