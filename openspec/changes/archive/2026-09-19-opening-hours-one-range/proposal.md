## Why

The hours part of the place form offers **Add a second range** and **Different on some
days**. Nobody uses either, and together they make the form much busier. The most
common case is one time on every open day, and that case should be the whole form (#190).

## What Changes

- **The form's hours part becomes the days plus one time range**, on web and on the
  phone. The day letters, the line naming the picked days, the `Closes 02:00 the next
  day` and `Open all day` hints, and the refusal all stay. **Add a second range**,
  **Different on some days** and the `Usual hours` heading go, since there is nothing
  "unusual" left for the heading to set against.
- **A place's hours are one range, the same on every open day.** The app no longer
  saves a second range or different hours on some days.
- **The card shows the hours on one line**, followed by the `Closed` line when there are
  closed days. Days that are not next to each other share the line:
  `Mon, Wed, Fri 09:00–17:00`. Neighbouring days still read as a span (`Tue–Sat`), and
  all seven still read `Every day`. The card never needs more than two lines. The user
  chose this in the explore on #190.
- **Places saved before this change** open, show their hours and save again unchanged.
  The first step checks the live data to confirm that no saved place uses a second range
  or different days. If one does, the work stops there and it comes back to the user as a
  question.

Not being done: any database change. The hours are already one value per place, so
nothing needs dropping or converting (see design.md). The form's layout and its
`(optional)` label are left alone, because that is #191.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markers`: every open day carries exactly one range, the same one on each open day.
- `marker-capture`: the hours part of the form offers the days and one range. Different
  days, the second range and the rule for opening mixed hours are removed.
- `map-rendering`: the card shows the open days on one line with their range, and the
  worst-case scenario is replaced.

## Impact

- `@pinpoint/core`: the hours rules, the form's draft and the card's wording are
  simplified, along with their tests.
- Web and phone: the hours part of the place form, and the place card, which the
  calendar also uses.
- `PRODUCT.md`: the hours line records the one-range rule.
- Database: none. The column, its check and the data layer are unchanged.
