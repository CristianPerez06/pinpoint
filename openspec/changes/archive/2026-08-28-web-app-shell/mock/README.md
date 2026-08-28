# The mock this change was designed against

A single self-contained HTML page: the web application's chrome at a real laptop width and
at 390px, in the state it is in **before its data arrives** and in the state it reaches
afterwards, on both grounds — using the real tokens, the real bundled Figtree, real Lucide
path data, and a trip whose names run to thirty-seven characters rather than the seed's.

Build it:

    python3 build-mock.py && open pinpoint-app-shell-mock.html

`build-mock.py` walks up to the repository root, embeds `apps/web/app/fonts/Figtree.ttf`,
and parses both grounds out of `packages/tokens/src/generated/tokens.css`, so the colours
are the real ones and go stale only when the tokens do. The output needs no network and
nothing installed. The generated HTML is not committed — it is ~150 KB of embedded font
and regenerates in under a second.

## What it settled

**The placeholder should not have a width of its own — and the mock could not have told
us that.** Section 03 was built to show drawn-blocks-at-name-width failing in both
directions, and concluded the search field absorbs a wrong guess. The application says
otherwise on both counts: every name in the bar is already pinned in `ch` (`12ch` for the
trip, `11ch` for the city, `13ch` for the account), so there was never a width to guess,
and at a wide viewport the search field is at its 480px cap and absorbs nothing. Measured,
guessing put the city 24px narrow and pushed three controls right. The placeholder now
takes the label's own measure and every number matches in both states.

**It also reported a defect in the shipped laptop bar that does not exist.** With a
thirty-seven character trip name the mock drew `All places` and the account on top of one
another, and that went into the proposal as something to file. Measured in the running
application at 1600px it does not reproduce: the real `.name` is pinned to `12ch` with
`text-overflow: ellipsis`, the name truncates, and there is 301px of clearance. The mock's
`.name` carried no width and sized itself to its text, so the overflow was the board's and
not the product's.

Worth keeping rather than deleting, because it is the sharper half of the lesson: a mock
finds real defects *and* invents them, and the two are indistinguishable on the board. The
four below were found by looking at the mock; this one could only be found by looking at
the application. Anything a mock reports about layout is a hypothesis until the real
stylesheet has been asked.

**The loader does not read as two grey bands.** The worry was that a `surface-muted`
loading panel under a `surface` header would stack into two greys. Giving the map's area
`map-land` — the colour the map itself will be — makes the hole map-shaped before the map
arrives, on both grounds. On the dark ground the header and the map area sit close enough
in value that the hairline does the separating, which reads as one continuous field rather
than a seam.

**The account slot needs no placeholder at a phone width.** `youAre` and the initials both
derive from `members`, so the slot is data on a laptop — but at ≤700px the phone already
replaced the name with `☰`, which is static. It is the only place the two widths differ.

## Defects found in the mock itself

Recorded because it is the same lesson the change list keeps carrying, and every one of
these rendered without complaint:

- **The theme class never reached `.device`.** It was on the row, and custom properties
  inherit, so it worked — until a frame sat in a row that had none, at which point every
  token resolved to nothing, the device painted transparent, and the board's own dark
  ground showed through looking like a deliberate dark mock.
- **The bottom bar covered the header it was supposed to be far away from.** `.bar` is
  `position: relative`, so an absolutely-positioned `.tools` resolved `bottom: 0` against
  the bar rather than the screen and painted its `surface` background over the names. The
  application does not have this because it uses `position: fixed`, and the real
  stylesheet carries a comment saying precisely why. Walking into it anyway is the
  argument for that comment.
- **The phone's account glyph was invisible.** Lucide's `menu` is three `<line>`s, and the
  rule giving the icons their stroke did not name that class — so the control was present,
  sized, in the layout, and drew nothing. Same shape as DESIGN.md's rule about emitting a
  value the host cannot resolve.
- **The laptop frame was 660px**, eight pixels clear of the 700px breakpoint, so the bar
  was drawn at the single most crowded width it can ever have. Search collapsed to its
  magnifier and the filter ran under the account, and neither was a defect in the shell.

The trip is invented and the page says so. Its names are deliberately at the long end:
a placeholder sized for `Osaka` tells you nothing about what happens to
`San Carlos de Bariloche`.
