## 1. Phone

- [x] 1.1 Show the next step's written sentence on the turn card (falling back to the visual text) and use it in what the screen reader is told. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.
- [x] 1.2 Ask for a new route at once when the connection returns while off the route. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 2. Check the running app

- [x] 2.1 Android emulator: follow a route with a turn onto a named road and verify the card shows a sentence. Go offline, step off the route, stand still, reconnect, and verify a new route replaces the line without moving.

## 3. Finish

- [x] 3.1 Run the checks `pnpm verify` runs, and `openspec validate follow-turn-sentences-and-reconnect --strict`. Verify both pass.
