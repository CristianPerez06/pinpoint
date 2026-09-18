## Why

`#172`: a note written on several lines shows on the laptop's details card as one run-on
paragraph. `Book ahead`, Enter, `Closed on Mondays` reads as `Book ahead Closed on
Mondays`.

The ticket asked where the line breaks are lost. They are not lost at all:

- **Saving keeps them.** Both forms write the note through `absentIfBlank`, which trims
  only the ends of the text. The data layer passes the column through untouched.
- **Both forms can type them.** The laptop's note field is a `<textarea>`, and the phone's
  is a `multiline` `TextInput`; Return is a new line in both, never a submit.
- **The phone already shows them.** React Native's `<Text>` draws a line break as a line
  break.
- **The laptop's card drops them on display.** The note is set inside a `<p>`, and a
  browser folds every run of whitespace in ordinary text — line breaks included — into
  one space.

So this is one CSS rule on the laptop, and the stored notes are already right: every note
written with line breaks shows them the moment this ships, with nothing to migrate.

## What Changes

- **The laptop's card draws the note with `white-space: pre-wrap`.** Line breaks and blank
  lines show as typed, and a long line still wraps inside the card — the field already has
  `overflow-wrap: anywhere`, which keeps doing its job under `pre-wrap`.
- **Only the note.** The name, link, price and day are single-line values; giving the rule
  to them would change nothing today and would start drawing stray whitespace the moment
  one of them held any.
- **`map-rendering` states it.** *Selecting a marker shows what was recorded about it*
  lists the note among the things shown but says nothing about its shape, which is how a
  card that shows the words in the wrong shape met the requirement. The phone meets the
  new sentence already.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-rendering`: the note on a selected marker is shown with the line breaks it was
  written with.

## Impact

- `apps/web/app/_components/marker-details.tsx` — the note's `Field` takes the class.
- `apps/web/app/_components/marker-details.module.css` — a `.noteValue` rule.
- `openspec/specs/map-rendering/spec.md` — via the delta.
- No change to the phone, the packages, or the database.
- Closes `#172`.
