# The mock this change was designed against

A single self-contained HTML page: the toolbar, the filter sheet, the trips sheet and
the hamburger, at real phone width, in both themes, using the real tokens, the real
bundled Figtree, real Lucide path data and the real seeded trip.

It settled three things that argument had not — all three tools weighing the same, the
merged filter-and-trips sheet being too long, and the trip name beating a fourth icon.
Kept here so a reviewer can see what was actually approved, and so the next change to
this surface starts from something rather than nothing.

Rebuild it:

    python3 build-mock.py && open pinpoint-toolbar-mock.html

`build-mock.py` reads `apps/web/app/fonts/Figtree.ttf` from the repository and embeds it,
so the output needs no network and no local install. The generated HTML is not committed
— it is ~190 KB of embedded font and regenerates in under a second.
