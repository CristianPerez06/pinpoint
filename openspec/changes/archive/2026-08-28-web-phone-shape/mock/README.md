# The mock this change was designed against

A single self-contained HTML page: the web application at 390 × 844 in every state it
has at a phone width, the same three states on the dark ground, the worst case at 320px,
and the two candidate models for dropping a pin side by side — at real widths, using the
real tokens, the real bundled Figtree, real Lucide path data, and a trip with a
forty-character name and thirty-four places rather than the seed's one city and eighteen
markers.

It settled four things argument had not:

- **The account name does not survive at this width.** 130px of a 390px header, spent
  answering a question nobody asked. `☰` replaces it, which is what the phone already
  does and what `DESIGN.md` describes for a phone header.
- **Dropping a pin needed a decision, not an inheritance.** The ticket said `Drop`
  becomes a tool and stopped there; the two applications disagree about what happens
  next. Drawing web's arm-then-tap beside the phone's sight made the choice concrete and
  the sight won. Both frames are kept — the rejected one is the record of what was
  weighed.
- **The credit is a real problem, and the ticket never mentioned it.** A bar flush to the
  bottom edge lands on MapLibre's own attribution control, which is a licence condition
  rather than a cosmetic one. Seeing the bar drawn is what surfaced it.
- **The camera needs the zoom fixed as well as the centre.** The three-panel diagram in
  section 05 is the whole argument: shifting the centre alone still fits a spread-out
  group into an area twice the height of the one that can be seen.

Section 07 opens the mock at the real size of whatever it is being read on, with
`100dvh` and a real `env(safe-area-inset-bottom)`, and prints the inset it actually gets.
That is deliberate: the two things a narrowed desktop window does not reproduce are the
URL bar collapsing on scroll and the browser's own bottom chrome, and the mock is the
cheapest place to meet both before any of this is built.

Kept here so a reviewer can see what was actually approved, and so the next change to
this surface starts from something rather than nothing.

Rebuild it:

    python3 build-mock.py && open pinpoint-phone-web-mock.html

`build-mock.py` walks up to the repository root, embeds `apps/web/app/fonts/Figtree.ttf`,
and parses both grounds out of `packages/tokens/src/generated/tokens.css`, so the colours
on the page are the real ones and go stale only when the tokens do. The output needs no
network and nothing installed. The generated HTML is not committed — it is ~430 KB of
embedded font and regenerates in under a second.

The trip in the mock is invented and the page says so. Its names are deliberately at the
long end: `workspace-chrome` requires that a long trip name and a long city name on the
narrowest supported screen leave neither as a stub, and that is a test you can only run
against names somebody could actually type.

Three defects were found in the mock itself while building it, each of which rendered
without complaint: a missing charset declaration that turned every em dash into `â€"`; a
camera panel that drew genuinely hidden pins, so the failure it was demonstrating read as
a rendering failure; and a Python name collision that built the dark theme's CSS rule out
of a section's HTML, so the dark band silently rendered light. Worth recording, because
it is the same lesson the change list carries: budget for looking.
