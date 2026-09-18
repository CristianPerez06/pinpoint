## 1. The laptop's card

- [x] 1.1 Draw the link in `apps/web/app/_components/marker-details.module.css` on one
      line with an ellipsis, and make sure its field cannot grow wider than the card to
      fit it. *`minmax(0, 1fr)` columns on `.fields` and `.field`; the anchor is a capped `inline-block`, so a short link is clickable over its words only.*
- [x] 1.2 Give the anchor a `title` carrying the full address, so it shows on hover.

## 2. The phone's card

- [x] 2.1 Limit the link's `Field` in `apps/mobile/components/marker-details.tsx` to one
      line, cut short at the end, and open the address when tapped. *An optional `isLink` on `Field`, passed by the link alone: one line, `accentInk` at the laptop's weight, `Linking.openURL` on press, as the credits sheet does.*

## 3. The specification

- [x] 3.1 Apply the delta to `openspec/specs/map-rendering/spec.md`. It is a `MODIFIED`
      requirement, so check every sentence of the old text is carried forward. *The delta carries the whole requirement word for word and adds one paragraph, its rationale and four scenarios; applied by the archive.*

## 4. Looking at it

- [x] 4.1 Laptop, desktop width: a link several hundred characters long takes one line,
      ends in "…", and nothing spills past the card. *Verified on a real card in the running app, on screen only: a 344-character link is 21px tall, 446px wide against 2536px of text, and the 478px card does not overflow.*
- [x] 4.2 Clicking it opens the full address; hovering shows it. *In the running app, a real place's link renders with `title` equal to its `href`. The browser's tooltip itself was not captured.*
- [x] 4.3 A short link shows whole, with no "…". *Verified: a real 44-character link and a short injected one render at their own width, nothing clipped.*
- [x] 4.4 The same at a narrow width, and in both themes. *Verified at 390px wide (the narrow layout, loaded in a frame because the window could not be resized): one line, 345px of 1642px shown, no page overflow. Light and dark both checked at desktop width.*
- [x] 4.5 Phone: a long link takes one line and ends in "…", and tapping it opens the
      browser. *By reading, not by looking: `numberOfLines={1}` with `ellipsizeMode="tail"`, and `Linking.openURL` on press as the credits sheet already does. Not run on a simulator: no real place has a long link, and nothing was installed to drive the tap.*

## 5. Close out

- [x] 5.1 `pnpm verify` green.
- [x] 5.2 `openspec validate long-links-fit-on-one-line --strict`.
- [x] 5.3 `openspec archive long-links-fit-on-one-line`.
