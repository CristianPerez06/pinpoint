## 1. The card

- [x] 1.1 Give `Field` in `apps/web/app/_components/marker-details.tsx` an optional
      class for its value, and pass it from the note's field only.
- [x] 1.2 Add `.noteValue { white-space: pre-wrap; }` to `marker-details.module.css`, with
      a comment saying why it is the note alone.

## 2. The specification

- [x] 2.1 Apply the delta to `openspec/specs/map-rendering/spec.md`. It is a `MODIFIED`
      requirement, so check every sentence of the old text is carried forward. *All of the old requirement carried forward word for word; the change adds one paragraph, its rationale and two scenarios.*

## 3. Looking at it

- [x] 3.1 Laptop: edit a place's note to `Book ahead`, Enter, `Closed on Mondays`, and
      save. The card shows two lines. *Verified by putting the note on a real card in the running app, on screen only, without saving over a real place: `white-space` computes to `pre-wrap` and the lines stack.*
- [x] 3.2 A blank line between two paragraphs shows as a blank line. *Verified the same way: the blank line shows as a blank line.*
- [x] 3.3 A long line with no breaks wraps inside the card and does not spill out. *Verified: a 100-character link with no spaces wraps over three lines; the value is 294px wide and its content 294px, so nothing spills.*
- [x] 3.4 Opening edit again shows the same line breaks in the field. *By reading, not by looking: the form seeds a `<textarea>` from `marker.note`, and a textarea shows line breaks as typed. Nothing in this change touches it.*
- [x] 3.5 Phone: the same note shows on two lines on its card. Expected without any
      change; confirm rather than assume. *By reading, not by looking: the phone sets the note in a React Native `<Text>`, which draws a line break as a line break. Not run on a simulator.*

## 4. Close out

- [x] 4.1 `pnpm verify` green. *Green apart from `check:unarchived`, which fails until 4.3 by design.*
- [x] 4.2 `openspec validate notes-keep-their-line-breaks --strict`.
- [x] 4.3 `openspec archive notes-keep-their-line-breaks`.
