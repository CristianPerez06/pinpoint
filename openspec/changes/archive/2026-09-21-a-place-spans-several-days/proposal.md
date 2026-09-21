## Why

A place carries exactly one day, so somewhere you sleep cannot be recorded truthfully. A
hotel booked for three nights leaves two bad options: date it to the first night and have
it vanish from the calendar for the rest of the stay, or save it three times — three pins
on one spot, three entries in every count, three places to edit when the booking changes.

The days a place is on are the one thing the calendar exists to arrange, and it currently
cannot express the longest-running entry on most trips.

## What Changes

- **A place can be given a run of days** — a first day and a last day — instead of only
  one. A hotel set from the 3rd to the 6th is one saved place, appearing on all four days.
- **The form keeps its single Day field.** Once a day has been chosen, a quiet
  **"+ More than one day"** appears beneath it; pressing it puts an **Until** field in
  place, ready to type. A place that is one day looks exactly as it does today, because
  almost every place is one day and the form must not get busier for them.
- **Clearing Until** puts the field away again and returns the place to a single day.
  **Clearing Day** clears both, and the place rejoins the ones waiting for a day.
- **An Until falling before the Day is refused**, naming the field, the way a trip's own
  end date already is. An Until with no Day cannot be stored.
- **Each day of a stay says where you are in it** — the row reads `Day 2 of 4` — so a day
  in the middle is plainly not empty and plainly not something new.
- **One place, one pin.** Nothing changes on the map: it has never read a place's day.
- Both applications get all of it, as the calendar already requires.

Not in this change: days that are not next to each other. A market you mean to visit on
Tuesday and again on Friday is still two entries. A run of days is a set of days that
happen to be adjacent, so this can widen later without any of the above being re-decided.

## Capabilities

### New Capabilities

None. Every rule this touches already exists.

### Modified Capabilities

- `markers`: *A marker may carry the date it is planned for* says in as many words that a
  marker carries **at most one** date. That is the sentence this change overturns — a
  marker may carry a first day and, optionally, a last day.
- `trip-calendar`: *A place is given its day on the place itself* and *A trip's places can
  be read one day at a time* are written in the singular throughout. The first gains the
  revealed Until field and how it is cleared; the second gains what a day holding a
  spanning place shows.

Two specs are deliberately **not** in this list:

- `marker-filtering` already reads *"Where a place is planned for more than one day, it
  SHALL be shown when any one of its days is chosen"*, stated early so that whatever added
  spans would inherit it rather than decide it a second time. It is inherited.
- `marker-capture`'s form requirement enumerates fields in its title and does not list
  every one: opening hours were added later and got a requirement of their own rather than
  joining that list. A field with behaviour of its own is specified where that behaviour
  is, which for the day is `trip-calendar`.

## Impact

- **Database** — one new nullable date column beside `markers.planned_on`, with a check
  that it is absent unless a first day is set and does not fall before it. Nothing to
  backfill: every place already saved is a one-day place. `create_trip` is untouched; it
  writes trips, not places.
- **Shared code** — the grouping that answers "what is on Thursday" now puts one place on
  several days, and the list of days a trip offers covers the days a stay spans.
- **Both applications** — the place form on each gains the revealed field; the calendar on
  each shows the day-of-stay line.
- **A phone build installed before this ships** reads the first day and shows the place on
  that day only. Less than the whole, but it opens and does not fail.
