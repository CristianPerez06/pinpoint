## Why

`#160`: an empty field on a place's card should say what is missing, the same way on
both applications, following the one wording they already shared — `No day yet`.

The ticket describes the laptop drawing a dash. That has since changed: both cards now
say `Not recorded` for an empty note or link. So the two already agree, but on a
catch-all phrase, and each application holds its own copy of it and of `No day yet` —
which is how they came to disagree the first time.

## What Changes

- **Each empty field names what is missing**: `No day yet`, `No note yet`, `No link yet`.
  Decided here rather than left open, since the ticket named this shape as the direction.
- **The words live once**, in `@pinpoint/core` as `EMPTY_FIELD_WORDING`, beside the day
  and price wording both cards already share. Both cards read from it.
- **The price is unchanged**: a place without one shows no price pill. It is not a field
  under a heading, so there is nothing for a phrase to sit in.
- **`map-rendering` states it**, so a third wording cannot come back unnoticed.

Not done: the calendar's `No day yet` view and the date control's empty state keep their
own copies of the words. They name a view and a control, not an empty field on the card.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `map-rendering`: an empty field on a selected marker says in words which value is
  missing, the same on every application.

## Impact

- `packages/core/src/empty-field-wording.ts` — new, with a test.
- `apps/web/app/_components/marker-details.tsx` and
  `apps/mobile/components/marker-details.tsx` — read the shared words.
- `openspec/specs/map-rendering/spec.md` — via the delta.
- No database change.
- Closes `#160`.
