## Why

On the phone, a search that finds seven or eight places lists some of them behind the
keyboard, along with the "search in every language" hint beneath them (#219). The list
doesn't scroll, and nothing on the screen lowers the keyboard — its search key now runs
the every-language search, and the back arrow closes search. So a place can be found,
listed, and still be impossible to choose (#222).

## What Changes

- On the phone, the search results scroll, and the list ends where the keyboard begins,
  so every result and the hint can be brought into view.
- Dragging the list lowers the keyboard.
- One tap on a result chooses it, with the keyboard up or down — as it does today.
- A short list that already fits looks and behaves exactly as it does today.
- A written rule in the place-search spec: every result, and the hint beneath them, can
  be reached and chosen in one tap while the keyboard is up.

Not in this change: the laptop, whose list already scrolls; any change to what search
returns, how many results it shows, or how a row looks.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `place-search`: adds a requirement that every candidate and the hint beneath them stay
  reachable, and choosable in one tap, while the on-screen keyboard is up.

## Impact

- `apps/mobile/components/place-search.tsx` — the results body becomes a scrolling list.
- No change to shared packages, the web app, wording, or data.
