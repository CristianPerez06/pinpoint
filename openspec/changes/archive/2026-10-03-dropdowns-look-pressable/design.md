## Context

The laptop's trip and city choosers are `Menu` with `tone="quiet"` (transparent at
rest). `quiet` is also every Cancel and Back button, the account menu and the map
credits, so changing it would fill all of those. The phone's choosers are hand-built
`Pressable`s with no background; Filter's question rows are the same on both apps.

## Decisions

**A `chooser` tone on the laptop's `Menu`, not a change to `quiet`.** It is the only
way to fill the two choosers and nothing else. At rest it is `surfaceMuted` with `ink`
lettering; on hover and while open (`aria-expanded`) it is `line`, which is visibly
deeper on both grounds. The waiting placeholder takes the same tone, so the bar does
not change shape when the data arrives, although `disabled` still draws its sunk fill.

**`surfaceMuted` for the fill, everywhere.** Its comment already names fields and chips,
which is what these are, and the user chose it in the mock. Contrast holds:
`inkMuted` on it is about 4.9:1 light and 5.9:1 dark, and `accentInk` clears 4.5:1 on
both.

**Padding moves inside the fill.** The phone's header triggers had padding only on the
right, because they sat flush with the screen edge. A filled shape needs it on both
sides, so the left padding is added and the same amount is taken back with a negative
margin, so the text does not move.

## Risks / Trade-offs

- [The header gets slightly heavier] → accepted; that is the point of the change.
