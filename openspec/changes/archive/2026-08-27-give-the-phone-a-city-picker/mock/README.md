# The mock this change was designed against

A single self-contained HTML page: the phone's header at three candidate arrangements,
the city sheet, the laptop's city menu today and proposed, and both side by side — at
real widths, in both themes, using the real tokens, the real bundled Figtree, real
Lucide path data and the real seeded trip.

It settled three things argument had not:

- **The laptop's `Trip / City` on one row cannot come to the phone.** At 320 pt with two
  real names it truncates both to unreadable stubs. That is real CSS at real width, not
  a drawing of truncation, which is why it ended the discussion. Two rows won.
- **The laptop's city menu has a defect nobody had named.** Drawing today's panel beside
  the proposed one made it obvious that `Edit "<city>"` appears only for the selected
  city, and not at all under **All places**.
- **Framing a city without hiding the rest is a smaller problem than it looked.** On a
  phone the framing zooms in far enough that other cities leave the screen by
  themselves. It only bites where two groups sit inside one metro area.

Kept here so a reviewer can see what was actually approved, and so the next change to
this surface starts from something rather than nothing.

Rebuild it:

    python3 build-mock.py && open pinpoint-city-mock.html

`build-mock.py` walks up to the repository root and embeds `apps/web/app/fonts/Figtree.ttf`,
so the output needs no network and no local install. The generated HTML is not committed
— it is ~290 KB of embedded font and regenerates in under a second.

The nine-city trip in the mock is invented and says so on the page. The seed makes one
trip, one city and eighteen markers; a picker that only ever shows one city has not been
designed, it has been guessed at.
