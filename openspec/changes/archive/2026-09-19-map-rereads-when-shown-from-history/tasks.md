## 1. Reproduce

- [x] 1.1 On web, edit a place's hours, open Settings, press **Back to the map**, and confirm the card shows the old hours. Repeat with the browser's back arrow from the Calendar, and note which fields (name, note, price) are affected.

## 2. Detect a screen rebuilt from history

- [x] 2.1 Add the hook in `apps/web/lib/` that remembers every `readId` a screen has mounted with, guarded by a ref against the development double mount, and returns whether this mount is a rebuild. Verify with `pnpm typecheck` and the lint.
- [x] 2.2 Have the map page and the Calendar page issue a new `readId` on each server render and pass it to their screens. Verify with `pnpm typecheck`.

## 3. Re-read on a rebuilt mount

- [x] 3.1 In the map workspace and the Calendar screen, run the silent `rereadEverything()` when the mount is a rebuild. Verify in the browser's network panel that returning through history sends one round of reads, and that a first visit or a reload sends none beyond the server's.
- [x] 3.2 Verify in development (Strict Mode) that a first visit to the map sends no client re-read.

## 4. Look at the running apps

- [x] 4.1 On web, repeat 1.1: the card shows the new hours after **Back to the map**, after the browser's back arrow from Settings and from the Calendar, and after going forward onto the Calendar. The map does not blank or show a loading state. Check both themes.
- [x] 4.2 On web, go offline in the network panel and go back to the map: it keeps what it showed and reports nothing.
- [x] 4.3 On the phone, edit a place, open Settings and go back, then do the same through the Calendar: the card shows the edit. If it doesn't, stop and raise it as a blocker to this change's scope.

## 5. Finish

- [x] 5.1 Run `openspec validate map-rereads-when-shown-from-history --strict` and `pnpm verify`, and both pass.
