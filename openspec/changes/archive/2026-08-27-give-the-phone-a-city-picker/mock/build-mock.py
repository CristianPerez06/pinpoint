"""
The mock for: where the city picker goes on the phone.

Same construction as the toolbar mock this repo already keeps — real tokens from
@pinpoint/tokens, the real bundled Figtree, real Lucide path data, real seed
names. One self-contained HTML file, no network, nothing installed.

    python3 build-mock.py && open pinpoint-city-mock.html
"""

import base64, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = next(q for q in HERE.parents if (q / 'apps/web/app/fonts/Figtree.ttf').exists())
FONT = base64.b64encode((ROOT / 'apps/web/app/fonts/Figtree.ttf').read_bytes()).decode()

# ── real Lucide 24x24 path data ──────────────────────────────────────────────
I = {
 'search':   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'drop':     '<path d="M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"/><circle cx="12" cy="10" r="3"/><path d="M16 18h6"/><path d="M19 15v6"/>',
 'sliders':  '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
 'menu':     '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
 'check':    '<path d="M20 6 9 17l-5-5"/>',
 'chev':     '<path d="m9 18 6-6-6-6"/>',
 'chevdown': '<path d="m6 9 6 6 6-6"/>',
 'chevup':   '<path d="m18 15-6-6-6 6"/>',
 'plus':     '<path d="M5 12h14"/><path d="M12 5v14"/>',
 'pencil':   '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
 'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
 'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2z"/>',
 'store':    '<path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/>',
 'train':    '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
}
DROP = 'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'

def ico(name, cls=''):
    return f'<svg viewBox="0 0 24 24" class="{cls}" aria-hidden="true">{I[name]}</svg>'

def pin(x, y, fam, glyph, scale=1.0):
    s = f'transform:scale({scale});transform-origin:50% 100%;' if scale != 1.0 else ''
    return (f'<span class="pin {fam}" style="left:{x}px;top:{y}px;{s}">'
            f'<svg viewBox="0 0 32 42"><path class="drop" d="{DROP}"/>'
            f'<g class="g" transform="translate(8.5 7.5) scale(0.625)">{I[glyph]}</g></svg></span>')

# ── the map underneath ───────────────────────────────────────────────────────
# A stand-in, not a real map: enough ground to judge the chrome against. Two
# framings, because the whole question in section 4 is what the camera does.

def ground(view):
    """view: 'wide' (two cities apart), 'city' (framed on one), 'near' (two
    groups close enough to both stay on screen)."""
    g = ['<div class="map">']
    if view == 'wide':
        g.append('<div class="water" style="left:-40px;top:150px;width:180px;height:230px;border-radius:0 60% 40% 0/0 50% 50% 0"></div>')
        g.append('<div class="water" style="left:210px;top:470px;width:170px;height:200px;border-radius:50% 0 0 40%/40% 0 0 50%"></div>')
        for x, y, w, h in [(150, 250, 9, 380), (0, 300, 320, 7), (60, 96, 6, 560), (0, 470, 320, 5)]:
            g.append(f'<div class="road" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        # Kyoto cluster, up-left. Tokyo cluster, down-right. Far apart, small.
        for x, y, f, gl in [(58, 214, 'see', 'landmark'), (76, 236, 'eat', 'utensils'),
                            (44, 244, 'see', 'landmark'), (68, 262, 'move', 'train')]:
            g.append(pin(x, y, f, gl, 0.72))
        for x, y, f, gl in [(226, 512, 'see', 'landmark'), (248, 534, 'buy', 'store'),
                            (212, 546, 'eat', 'utensils'), (256, 560, 'see', 'landmark')]:
            g.append(pin(x, y, f, gl, 0.72))
        g.append('<span class="mlabel" style="left:34px;top:190px">KYOTO</span>')
        g.append('<span class="mlabel" style="left:206px;top:490px">TOKYO</span>')
    elif view == 'city':
        g.append('<div class="water" style="left:-30px;top:430px;width:170px;height:230px;border-radius:0 60% 40% 0/0 50% 50% 0"></div>')
        g.append('<div class="park" style="left:186px;top:236px;width:118px;height:96px"></div>')
        for x, y, w, h in [(0, 340, 320, 9), (0, 470, 320, 6), (150, 96, 8, 564), (246, 96, 5, 564)]:
            g.append(f'<div class="road" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        for x, y, w, h in [(24, 236, 44, 34), (78, 236, 52, 28), (24, 280, 38, 44), (76, 276, 54, 40),
                           (168, 370, 60, 36), (238, 370, 48, 52), (268, 236, 44, 60), (24, 380, 52, 40)]:
            g.append(f'<div class="block" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        for x, y, f, gl in [(62, 258, 'see', 'landmark'), (104, 296, 'eat', 'utensils'),
                            (196, 248, 'see', 'landmark'), (172, 388, 'buy', 'store'),
                            (250, 330, 'move', 'train'), (86, 420, 'see', 'landmark')]:
            g.append(pin(x, y, f, gl))
    else:  # 'near' — two groups inside one metro, both on screen at once
        g.append('<div class="park" style="left:36px;top:250px;width:104px;height:80px"></div>')
        for x, y, w, h in [(0, 360, 320, 8), (156, 96, 7, 564), (0, 500, 320, 5)]:
            g.append(f'<div class="road" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        for x, y, w, h in [(30, 380, 48, 36), (86, 384, 44, 30), (188, 250, 54, 38),
                           (250, 258, 44, 44), (196, 420, 60, 40), (28, 448, 52, 34)]:
            g.append(f'<div class="block" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>')
        # the selected group, left; the rest of the trip, right — still drawn
        for x, y, f, gl in [(52, 300, 'see', 'landmark'), (86, 330, 'eat', 'utensils'),
                            (40, 352, 'buy', 'store'), (98, 274, 'see', 'landmark')]:
            g.append(pin(x, y, f, gl))
        for x, y, f, gl in [(216, 268, 'see', 'landmark'), (262, 300, 'move', 'train'),
                            (230, 440, 'eat', 'utensils'), (272, 470, 'see', 'landmark')]:
            g.append(pin(x, y, f, gl))
        g.append('<span class="mlabel" style="left:34px;top:262px">SHINJUKU</span>')
        g.append('<span class="mlabel" style="left:214px;top:232px">GINZA</span>')
    g.append('</div>')
    return ''.join(g)

# ── names ───────────────────────────────────────────────────────────────────
# SEED is what actually exists today: one trip, one city, eighteen markers.
# LONG is the worst case — a three-week trip that crosses a border.
SEED = dict(trip='Japan', city=None)
LONG = dict(trip='Tokyo & Kyoto Honeymoon', city='Hiroshima & Miyajima')

CITIES_SEED = [('Kyoto', 18, 'JPY')]
CITIES_LONG = [
    ('Tokyo', 24, 'JPY'), ('Kyoto', 18, 'JPY'), ('Osaka', 11, 'JPY'),
    ('Hiroshima & Miyajima', 7, 'JPY'), ('Kanazawa', 6, 'JPY'),
    ('Seoul stopover', 5, 'KRW'), ('Nara', 4, 'JPY'),
    ('Hakone', 3, 'JPY'), ('Takayama', 2, None),
]

# ── the three arrangements ──────────────────────────────────────────────────

def caret(cls='caret'):
    return f'<svg viewBox="0 0 24 24" class="{cls}">{I["chevdown"]}</svg>'

def header(kind, names, city, *, chip=False, city_style='mine'):
    """kind: 'a' one row | 'b' two rows | 'c' city as a chip over the map"""
    trip = names['trip']
    label = city or 'All places'
    dot = '<span class="dot"></span>'
    burger = f'<span class="burger">{ico("menu")}</span>'
    tripbtn = (f'<span class="tripbtn"><span class="trip">{trip}</span>{caret()}</span>')
    citybtn = (f'<span class="citybtn cs-{city_style}{" none" if not city else ""}">'
               f'<span class="cityname">{label}</span>{caret("caret sm")}</span>')

    if kind == 'a':
        return (f'<div class="hdr rowA">{dot}{tripbtn}'
                f'<span class="sep">/</span>{citybtn}{burger}</div>')
    if kind == 'b':
        return (f'<div class="hdr rowB"><div class="line1">{dot}{tripbtn}{burger}</div>'
                f'<div class="line2">{citybtn}</div></div>')
    # 'c' — header untouched, chip floats over the map
    hdr = f'<div class="hdr rowA">{dot}{tripbtn}{burger}</div>'
    chipel = (f'<span class="chip{" none" if not city else ""}">'
              f'<span class="cityname">{label}</span>{caret("caret sm")}</span>')
    return hdr + f'<div class="chipwrap">{chipel}</div>'

def toolbar(narrowed=False):
    on = ' on' if narrowed else ''
    pip = '<span class="pip"></span>' if narrowed else ''
    return ('<div class="bar"><div class="bar-row">'
            f'<button class="tool">{ico("search")}<span>Search</span></button>'
            f'<button class="tool">{ico("drop")}<span>Drop</span></button>'
            f'<button class="tool{on}">{pip}{ico("sliders")}<span>Filter</span></button>'
            '</div></div>')

# ── the sheet ───────────────────────────────────────────────────────────────

def city_row(name, count, currency, *, current=False, editing=False):
    tick = f'<span class="cur">{ico("check")}</span>' if current else '<span class="cur"></span>'
    meta = f'{count} {"place" if count == 1 else "places"}'
    meta += f' · {currency}' if currency else ' · no currency'
    edit = f'<span class="editbtn">{ico("pencil")}</span>'
    head = (f'<div class="crow{" is-cur" if current else ""}">{tick}'
            f'<span class="ctext"><span class="cname">{name}</span>'
            f'<span class="cmeta">{meta}</span></span>{edit}</div>')
    if not editing:
        return head
    return head + (
        '<div class="editor">'
        '<label class="fl">Name</label>'
        f'<div class="field">{name}</div>'
        '<label class="fl">Currency (optional)</label>'
        f'<div class="field{" ph" if not currency else ""}">{currency or "JPY"}</div>'
        '<p class="hint">Changes how prices here are read. No stored amount is changed.</p>'
        '<div class="erow"><button class="btn primary">Save</button>'
        '<button class="btn danger">Remove</button></div>'
        '</div>')

def city_sheet(cities, *, current=None, editing=None, title='City'):
    rows = [f'<div class="crow all{" is-cur" if current is None else ""}">'
            + (f'<span class="cur">{ico("check")}</span>' if current is None else '<span class="cur"></span>')
            + '<span class="ctext"><span class="cname">All places</span>'
            + f'<span class="cmeta">{sum(c[1] for c in cities)} places · the whole trip</span></span>'
            + '<span class="editbtn empty"></span></div>']
    for name, count, cur in cities:
        rows.append(city_row(name, count, cur, current=(name == current),
                             editing=(name == editing)))
    empty = ('<p class="empty">No cities yet. One is created the first time you file a '
             'place under a new name while saving it.</p>') if not cities else ''
    return ('<div class="scrim"></div><div class="sheet">'
            '<span class="grab"></span>'
            f'<div class="sheet-hd"><h3>{title}</h3><button class="done">Done</button></div>'
            '<div class="sheet-body"><div class="sec">'
            + (empty or ''.join(rows)) +
            '</div></div></div>')

# ── the phone ───────────────────────────────────────────────────────────────

def phone(theme, *, kind='a', names=SEED, city=None, view='city',
          sheet=None, narrowed=False, tall=False, nobar=False, city_style='mine'):
    body = ground(view) + header(kind, names, city, city_style=city_style)
    if not nobar:
        body += toolbar(narrowed)
    if sheet is not None:
        body += sheet
    cls = f'phone {theme} k{kind}' + (' tall' if tall else '')
    return f'<div class="{cls}">{body}</div>'

def slot(cap, sub, inner):
    s = f' <em>{sub}</em>' if sub else ''
    return f'<div class="slot"><span class="cap">{cap}{s}</span>{inner}</div>'

# ── the laptop ──────────────────────────────────────────────────────────────
# A crop of the one bar, wide enough to hold the scope and the panel hanging
# from it. The rest of the bar — search, Drop, Filter, the account — is off the
# right edge on purpose: none of it is what this section decides.

def lap_rows_today(cities, current):
    """The panel as it is shipped: a list, then one Edit that acts on whatever
    is selected — and nothing at all when the selection is All places."""
    rows = [f'<div class="lrow{" is-cur" if current is None else ""}">All places</div>']
    for name, _count, cur in cities:
        note = f'<span class="lnote">{cur}</span>' if cur else ''
        rows.append(f'<div class="lrow{" is-cur" if name == current else ""}">'
                    f'<span class="lname">{name}</span>{note}</div>')
    if current is not None:
        rows.append('<hr class="ldiv">')
        rows.append(f'<div class="lrow">Edit “{current}”</div>')
    return ''.join(rows)

def lap_rows_next(cities, current, editing=None):
    """The proposed panel: every row carries its own pencil, so fixing a city is
    no longer conditional on working in it."""
    total = sum(c[1] for c in cities)
    rows = [f'<div class="lrow wide{" is-cur" if current is None else ""}">'
            f'<span class="lname">All places</span>'
            f'<span class="lnote">{total} places</span>'
            '<span class="lpen empty"></span></div>']
    for name, count, cur in cities:
        meta = f'{count} {"place" if count == 1 else "places"}'
        meta += f' · {cur}' if cur else ' · no currency'
        rows.append(f'<div class="lrow wide{" is-cur" if name == current else ""}">'
                    f'<span class="lname">{name}</span>'
                    f'<span class="lnote">{meta}</span>'
                    f'<span class="lpen">{ico("pencil")}</span></div>')
        if name == editing:
            rows.append(
                '<div class="leditor">'
                '<label class="fl">Name</label>'
                f'<div class="field">{name}</div>'
                '<label class="fl">Currency</label>'
                f'<div class="field{" ph" if not cur else ""}">'
                f'{cur or "JPY — blank shows plain numbers"}</div>'
                '<div class="lerow"><button class="btn primary">Save</button>'
                '<button class="btn quiet">Cancel</button>'
                '<button class="btn danger last">Remove city</button></div>'
                '</div>')
    return ''.join(rows)

def laptop(theme, *, names=LONG, city=None, panel=None, tall=False):
    label = city or 'All places'
    bar = ('<div class="lbar">'
           '<span class="dot"></span>'
           f'<span class="ltrip">{names["trip"]}</span>{caret()}'
           '<span class="lsep">/</span>'
           '<span class="lanchor">'
           f'<span class="lcity"><span class="lcityname">{label}</span>{caret()}</span>'
           + (f'<div class="lpanel">{panel}</div>' if panel else '')
           + '</span>'
           '<span class="lfade"></span>'
           '</div>')
    cls = f'lap {theme}' + (' tall' if tall else '')
    tiles = ground('city') + f'<div class="mapdup">{ground("near")}</div>'
    return f'<div class="{cls}">{bar}<div class="lstage">{tiles}</div></div>'

# ── page ────────────────────────────────────────────────────────────────────
S = []
S.append('<div class="page"><div class="masthead">'
  '<h1>The city picker, on both</h1>'
  '<p>Today the phone has a <strong>Cities</strong> screen that renames, sets a currency and '
  'removes — and nothing more. On the laptop, choosing a city also <strong>frames the map on '
  'that city’s places</strong>, <strong>points search at them</strong>, and <strong>fills '
  'in the city on the next place you save</strong>. This mock is about giving the phone that, '
  'and deciding where the control lives.</p>'
  '<p>Real tokens, real Figtree, real Lucide icons. Every phone is <strong>320&nbsp;pt wide</strong> '
  '— the narrowest one still sold — so if something fits here it fits everywhere.</p>'
  '<ul class="judge">'
  '<li><b>Worth judging</b>Which of the three arrangements survives a long trip name next to a '
  'long city name; whether picking and editing belong in one sheet; whether framing on a city '
  'without hiding the rest reads as broken.</li>'
  '<li class="no"><b>Not worth judging</b>Animation, one-handed reach, real safe-area insets, '
  'the fake map underneath. Those only answer honestly on the device.</li>'
  '</ul>'
  '<div class="note real"><b>What is real and what is invented.</b> The seed makes one trip '
  '(<b>Japan</b>), one city (<b>Kyoto</b>) and 18 markers — that is the “today” column '
  'everywhere below. The nine-city trip is invented, on purpose: a picker that only ever '
  'shows one city has not been designed, it has been guessed at.</div>'
  '</div>')

# 1 — the three arrangements, honest names
S.append('<h2><span class="n">1</span>The three places it could go</h2>'
  '<p class="lede">Same screen, same data, three homes for the picker. These use the names you '
  'actually have — one trip called <b>Japan</b>, nothing selected yet, so the picker reads '
  '<b>All places</b>.</p>'
  '<div class="rail">'
  + slot('A — one row', 'trip / city, like the laptop', phone('light', kind='a'))
  + slot('B — two rows', 'city on its own line', phone('light', kind='b'))
  + slot('C — a chip', 'over the map, out of the header', phone('light', kind='c'))
  + '</div>'
  '<div class="note"><b>At these lengths all three work</b>, which is exactly why judging on '
  'them is a trap. The next section is the one that decides.</div>')

# 2 — worst case
S.append('<h2><span class="n">2</span>The same three, with names that fit real life</h2>'
  '<p class="lede">A three-week trip called <b>Tokyo &amp; Kyoto Honeymoon</b>, currently working '
  'on <b>Hiroshima &amp; Miyajima</b>. Nothing here is padded — both are shorter than the 120 '
  'characters a city name allows and the 80 a trip name allows. The truncation you see is real '
  'CSS at 320&nbsp;pt, not a drawing of truncation.</p>'
  '<div class="rail">'
  + slot('A — one row', 'both names lose', phone('light', kind='a', names=LONG, city=LONG['city']))
  + slot('B — two rows', 'both survive', phone('light', kind='b', names=LONG, city=LONG['city']))
  + slot('C — a chip', 'both survive, city over the map', phone('light', kind='c', names=LONG, city=LONG['city']))
  + '</div>'
  '<div class="rail" style="margin-top:26px">'
  + slot('A — dark', '', phone('dark', kind='a', names=LONG, city=LONG['city']))
  + slot('B — dark', '', phone('dark', kind='b', names=LONG, city=LONG['city']))
  + slot('C — dark', '', phone('dark', kind='c', names=LONG, city=LONG['city']))
  + '</div>'
  '<div class="note"><b>A is the one that breaks.</b> Two labels that both want the row leave '
  'each other about 90&nbsp;pt — roughly eleven characters — so the trip you are on and the city '
  'you are working in both become stubs, and neither reads. The laptop gets away with this '
  'because it has 900&nbsp;pt of bar; the phone has 320.</div>'
  '<div class="note"><b>C costs the header nothing and costs the map something.</b> A chip over '
  'the map is the pattern every map application uses, and it keeps the header exactly as it is '
  'today. What it gives up is the reading <b>trip / city</b> — the chip is not visibly attached '
  'to the trip above it, so “Hiroshima” looks like a place rather than a narrowing of this '
  'trip.</div>')

# 3 — the sheet
S.append('<h2><span class="n">3</span>What opens when you tap it</h2>'
  '<p class="lede">The laptop puts picking and editing in one menu: the list of cities, then '
  '<b>Edit “Kyoto”</b> at the bottom opening the editor in place. The phone already has the '
  'editor — it is the Cities sheet you have now. This adds the picking half to it, so there is '
  'one sheet rather than two things called cities.</p>'
  '<div class="rail">'
  + slot('Today', 'one city, nothing selected',
         phone('light', kind='b', tall=True, sheet=city_sheet(CITIES_SEED)))
  + slot('Nine cities', 'Kyoto selected',
         phone('light', kind='b', names=LONG, city='Kyoto', tall=True,
               sheet=city_sheet(CITIES_LONG, current='Kyoto')))
  + slot('Editing a city', 'the pencil, in place',
         phone('light', kind='b', names=LONG, city='Kyoto', tall=True,
               sheet=city_sheet(CITIES_LONG, current='Kyoto', editing='Kyoto')))
  + '</div>'
  '<div class="rail" style="margin-top:26px">'
  + slot('Nine cities', 'dark',
         phone('dark', kind='b', names=LONG, city='Kyoto', tall=True,
               sheet=city_sheet(CITIES_LONG, current='Kyoto')))
  + slot('Editing', 'dark',
         phone('dark', kind='b', names=LONG, city='Kyoto', tall=True,
               sheet=city_sheet(CITIES_LONG, current='Kyoto', editing='Kyoto')))
  + '</div>'
  '<div class="note"><b>Tapping the row picks; the pencil edits.</b> One row, two targets — '
  'which is the only real risk in this sheet, because they are 40&nbsp;pt apart and one of them '
  'leads to <b>Remove</b>. The alternative is the laptop’s: pick from the row, and one '
  '<b>Edit</b> entry at the bottom that acts on whatever is selected.</div>'
  '<div class="note"><b>This retires the Cities entry inside the trip sheet.</b> Cities stop '
  'being an errand filed under the trip and become the thing you are working in — which is what '
  'they already are on the laptop.</div>')

# 4 — select is not filter
S.append('<h2><span class="n">4</span>Choosing a city moves the camera. It does not hide anything.</h2>'
  '<p class="lede">This is the rule the laptop holds and the one I would most expect to confuse '
  'somebody on a phone — because <b>Filter</b> is sitting right there in the bar, two inches '
  'away, doing the thing that actually hides places.</p>'
  '<div class="rail">'
  + slot('All places', 'the whole trip, framed wide',
         phone('light', kind='b', names=LONG, view='wide'))
  + slot('Kyoto chosen', 'camera moves in',
         phone('light', kind='b', names=LONG, city='Kyoto', view='city'))
  + slot('Two groups close together', 'the rest is still drawn',
         phone('light', kind='b', names=LONG, city='Shinjuku', view='near'))
  + '</div>'
  '<div class="note"><b>The phone mostly answers this by itself.</b> Framing on a city zooms in '
  'far enough that the other cities leave the screen — the first two phones above. The confusion '
  'only appears in the third, where two groups sit inside one metro area and the ones you did '
  'not choose stay visible around the edges. That is a narrower problem than it first looked, '
  'and it may not need an answer at all.</div>')

# 5 — the rest of the change
# 5 — the laptop
S.append('<h2><span class="n">5</span>The same list on the laptop</h2>'
  '<p class="lede">The phone’s pencil is worth having on the laptop too, and not only so the two '
  'match. Today the laptop’s menu ends with a single <b>Edit “Kyoto”</b> that acts on '
  '<em>whatever is selected</em> — so to rename Osaka you must first select Osaka, which moves '
  'your camera to Osaka. And with <b>All places</b> selected there is no way to edit any city at '
  'all. Those are the two states below, on the left.</p>'
  '<div class="rail">'
  + slot('Today', 'All places — no way in',
         laptop('light', panel='<p class="lhead">Working on</p>'
                + lap_rows_today(CITIES_LONG[:4], None)))
  + slot('Today', 'Kyoto selected — one Edit, for Kyoto only',
         laptop('light', city='Kyoto', panel='<p class="lhead">Working on</p>'
                + lap_rows_today(CITIES_LONG[:4], 'Kyoto')))
  + '</div>'
  '<div class="note"><b>The bar is cropped.</b> Search, Drop, Filter and the account carry on off '
  'the right edge — none of them is what this section decides.</div>'
  '<p class="lede" style="margin-top:34px">Proposed: the same row shape the phone gets. The row '
  'picks, the pencil edits, and the editor opens in place under the row it belongs to. Fixing a '
  'city stops being conditional on working in it.</p>'
  '<div class="rail">'
  + slot('Proposed', 'a pencil on every row',
         laptop('light', city='Kyoto', tall=True,
                panel='<p class="lhead">Working on</p>'
                + lap_rows_next(CITIES_LONG, 'Kyoto')))
  + slot('Proposed', 'editing, in place',
         laptop('light', city='Kyoto', tall=True,
                panel='<p class="lhead">Working on</p>'
                + lap_rows_next(CITIES_LONG, 'Kyoto', editing='Kyoto')))
  + slot('Proposed', 'dark',
         laptop('dark', city='Kyoto', tall=True,
                panel='<p class="lhead">Working on</p>'
                + lap_rows_next(CITIES_LONG, 'Kyoto', editing='Kyoto')))
  + '</div>'
  '<div class="note"><b>Two changes, not one.</b> The pencil is the visible one. The quieter one '
  'is that every row now says <b>how many places are filed under it</b> — the laptop shows only a '
  'currency today, the phone already shows both. A count is the more useful of the two when you '
  'are choosing what to work on, and it is what makes <b>Remove city</b> read honestly a moment '
  'later.</div>'
  '<div class="note"><b>Cancel stays on the laptop and has no phone equivalent.</b> The phone '
  'closes an editor by tapping the pencil again; the laptop’s editor is inside a menu that a '
  'click outside dismisses, and losing typed text to a stray click is worse than one more '
  'button. The two do not have to match here — the row shape is the thing being unified, not '
  'every control inside it.</div>')

# 6 — side by side
S.append('<h2><span class="n">6</span>Both, side by side</h2>'
  '<p class="lede">The end state: one row shape, one vocabulary, two hosts. A row is a city, it '
  'says how many places and what they cost in, tapping it is how you work there, and the pencil '
  'is how you fix it.</p>'
  '<div class="rail">'
  + slot('Phone', 'a sheet from the bottom',
         phone('light', kind='b', names=LONG, city='Kyoto', tall=True,
               sheet=city_sheet(CITIES_LONG, current='Kyoto')))
  + slot('Laptop', 'a panel under the bar',
         laptop('light', city='Kyoto', tall=True,
                panel='<p class="lhead">Working on</p>'
                + lap_rows_next(CITIES_LONG, 'Kyoto')))
  + '</div>'
  '<div class="note"><b>What is deliberately not the same.</b> The phone opens from the second '
  'line of the header and the laptop from the middle of one bar; the phone has <b>Done</b> and '
  'the laptop dismisses by clicking away; the phone’s editor is a sheet-width block and the '
  'laptop’s is 320&nbsp;px. Those follow the screen shape, which is the rule already in force. '
  'What matches is the part a person has to learn.</div>'
  '<div class="note"><b>One thing still does not match, and it is a real choice.</b> The phone marks the city you are working in with a <b>tick</b>; the laptop fills the row with the amber wash. Both are what each platform already does elsewhere — the trips sheet ticks, the trip menu fills — so making them agree here would make one of them disagree with its own neighbours. Left as it is unless you want it settled.</div>')

# 7 — how the city control should be drawn
S.append('<h2><span class="n">7</span>How the city control should be drawn</h2>'
  '<p class="lede">The trip\u2019s name and the city under it are both <em>a name that opens a '
  'list</em>, and they are currently drawn as two unrelated things: the trip is bare text at '
  'title size with a caret, the city is a filled pill with a visible outline. Three ways to '
  'settle it, at 320\u00a0pt. <b>These are named rather than lettered on purpose</b> \u2014 section\u00a02\u2019s A/B/C are about <em>where the control goes</em> and these are about <em>how it is drawn</em>, and one reader has already crossed the two.</p>'
  '<div class="rail">'
  + slot('Chip', 'as shipped \u2014 fill + a border drawn at rest',
         phone('light', kind='b', names=LONG, city='Kyoto', city_style='mine'))
  + slot('Selector pill', 'fill, border held in reserve',
         phone('light', kind='b', names=LONG, city='Kyoto', city_style='pill'))
  + slot('Plain \u2713 chosen', 'like the trip name \u2014 no fill, no border',
         phone('light', kind='b', names=LONG, city='Kyoto', city_style='bare'))
  + '</div>'
  '<div class="rail" style="margin-top:26px">'
  + slot('Chip \u2014 nothing chosen', '', phone('light', kind='b', names=LONG, city_style='mine'))
  + slot('Selector pill \u2014 nothing chosen', '', phone('light', kind='b', names=LONG, city_style='pill'))
  + slot('Plain \u2014 nothing chosen', '', phone('light', kind='b', names=LONG, city_style='bare'))
  + '</div>'
  '<div class="rail" style="margin-top:26px">'
  + slot('Chip \u2014 dark', '', phone('dark', kind='b', names=LONG, city='Kyoto', city_style='mine'))
  + slot('Selector pill \u2014 dark', '', phone('dark', kind='b', names=LONG, city='Kyoto', city_style='pill'))
  + slot('Plain \u2014 dark', '', phone('dark', kind='b', names=LONG, city='Kyoto', city_style='bare'))
  + '</div>'
  '<div class="note"><b>A is not a deliberate third thing \u2014 it is an off-spec pill.</b> '
  '<code>DESIGN.md</code> defines a <b>selector pill</b> as a muted fill with a <em>transparent</em> '
  'border, 7\u00d711 padding and <code>control</code> type, and says the border appears only on '
  'hover or while open because \u201cthe control states nothing at rest\u201d. What shipped draws '
  'its border always, at 3\u00d78\u00d76, in <code>rowName</code> type. So the first thing to fix '
  'is a defect, not a preference.</div>'
  '<div class="note"><b>The case against making it match the trip name exactly.</b> They are not '
  'peers. The trip\u2019s name is the screen\u2019s title and can carry a caret without anyone '
  'mistaking it for a label, because it is 17\u00a0px and bold. A second line of quiet text with a '
  'small chevron is the thing <code>trip-sheet.tsx</code> already warns about \u2014 \u201ca label '
  'that opens something and looks like a label is a control nobody finds\u201d. C is the risk; it '
  'is also the only one that reads as one family with the line above it.</div>'
  '<div class="note"><b>One more argument for the pill, and it is not about looks.</b> On this '
  'screen <b>Filter</b> sits two inches below. A filled outlined chip is what a filter chip looks '
  'like in every other application, and choosing a city deliberately does <em>not</em> hide '
  'anything. B\u2019s resting state \u2014 fill, no outline \u2014 is quieter than A\u2019s and '
  'reads less like a filter that has been applied.</div>'
  '<div class="note"><b>Plain is chosen, and is what shipped.</b> The header is not the toolbar \u2014 <code>DESIGN.md</code> scopes pills to \u201cthe toolbar and the bottom bar\u201d \u2014 and its idiom is already a name with a caret. The laptop agrees from the other side: both its trip and city triggers are <code>tone=\"quiet\"</code>. Drawn here at <code>rowName</code>, the nearest role below <code>title</code>; the 15\u00a0px this first used was a literal and no such role exists.</div>')

S.append('<h2><span class="n">8</span>What is not on this page</h2>'
  '<p class="lede">Three things this mock cannot show, listed so they are not mistaken for '
  'settled.</p>'
  '<ul class="judge cols">'
  '<li><b>The map has no way to do this yet</b>The phone’s map can fly to <em>one</em> '
  'point. Framing a set of them is a new method on it. The laptop already has this and the '
  'maths is shared, so it is not new thinking — but it is not free either.</li>'
  '<li><b>Nothing remembers the choice</b>The laptop keeps it in the address, so a reload and a '
  'shared link both survive. The phone has nowhere to put it, which is already a known gap — '
  'the same one that makes the capture form forget your last city on a cold start.</li>'
  '<li><b>It changes what the save form defaults to</b>Today the phone fills in the city you '
  'last used. With a picker, it should fill in the one you are working in, like the laptop. '
  'Those disagree whenever you switch city and then save a place.</li>'
  '</ul>')


S.append('</div></body></html>')

CSS = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pinpoint — the city picker, on both</title>
<style>
@font-face{font-family:'Figtree';src:url(data:font/ttf;base64,__FONT__) format('truetype');font-weight:300 900;font-style:normal;font-display:block}

/* ─── tokens, straight from @pinpoint/tokens ─────────────────────────────── */
:root{
  --space-xs:4px; --space-sm:8px; --space-md:16px;
  --radius-md:10px; --font:'Figtree',ui-sans-serif,system-ui,sans-serif;
  --ground:#FBFAF8; --surface:#FFFFFF; --surface-muted:#F3F2EF; --surface-sunk:#EFEDE8;
  --line:#E4E2DC; --line-strong:#D3D0C8;
  --ink:#1A1917; --ink-muted:#6E6A63; --ink-faint:#9C978E;
  --accent:#E39A2B; --accent-ink:#8A5A0B; --accent-wash:#FBF1DF; --accent-ring:#E39A2B61;
  --ink-on-accent:#241703;
  --danger:#B3261E; --danger-surface:#FCEDEC;
  --map-land:#EFEEE9; --map-block:#E3E1D9; --map-road:#FFFFFF; --map-road-casing:#DAD6CC;
  --map-water:#CBD6DA; --map-park:#E1E5DC; --map-label:#9A948B;
  --see:#7C8896; --eat:#D2451E; --buy:#8A3FFC; --sleep:#0B5FD0; --move:#00857A;
  --marker-fg:#FFFFFF;
  --shadow-md:0 4px 12px #1A19171A; --shadow-pin:0 2px 5px #1A19174D;
}
.dark{
  --ground:#171614; --surface:#201E1B; --surface-muted:#2A2724; --surface-sunk:#1B1A17;
  --line:#34302B; --line-strong:#443F38;
  --ink:#F2F0EC; --ink-muted:#A09A91; --ink-faint:#7C766D;
  --accent:#F0AE4A; --accent-ink:#F0AE4A; --accent-wash:#33291A; --accent-ring:#F0AE4A6B;
  --ink-on-accent:#171614;
  --danger:#F2857C; --danger-surface:#33211F;
  --map-land:#1A1815; --map-block:#262218; --map-road:#3D372D; --map-road-casing:#2C271E;
  --map-water:#16242C; --map-park:#1F241F; --map-label:#8A8378;
  --see:#98A3B0; --eat:#F0653A; --buy:#A97BFF; --sleep:#4A8FE8; --move:#16A99C;
  --marker-fg:#171614;
  --shadow-md:0 4px 12px #00000075; --shadow-pin:0 2px 5px #0000008C;
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#F3F2EF;color:#1A1917;font-family:var(--font);
     font-size:13.5px;line-height:1.52;-webkit-font-smoothing:antialiased}

/* ─── the mock's own scaffolding, not part of the design ─────────────────── */
.page{max-width:1340px;margin:0 auto;padding:40px 24px 90px}
.masthead{max-width:680px;margin-bottom:8px}
.masthead h1{font-size:32px;font-weight:800;letter-spacing:-.033em;line-height:1.1;margin:0 0 12px}
.masthead p{margin:0 0 12px;color:#4A4642;font-size:15px;line-height:1.55}
.masthead strong{font-weight:650;color:#1A1917}
.judge{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0 0;padding:0;list-style:none}
.judge li{flex:1 1 220px;padding:12px 14px;border-radius:10px;background:#fff;
          border:1px solid #E4E2DC;font-size:12.5px;line-height:1.45;color:#4A4642}
.judge b{display:block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
         color:#6E6A63;margin-bottom:4px}
.judge.no b{color:#8A5A0B}
.judge.cols{max-width:1000px}
.judge em{font-style:italic}
h2{font-size:22px;font-weight:750;letter-spacing:-.024em;margin:66px 0 6px;max-width:820px}
h2 .n{display:inline-block;min-width:26px;color:#9C978E;font-weight:600}
.lede{max-width:660px;margin:0 0 26px;color:#4A4642;font-size:14px;line-height:1.55}
.rail{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start}
.slot{display:flex;flex-direction:column;gap:10px}
.cap{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6E6A63}
.cap em{font-style:normal;color:#9C978E;font-weight:600;letter-spacing:0;text-transform:none}
.note{max-width:700px;margin:22px 0 0;padding:14px 16px;border-radius:10px;
      background:#FBF1DF;border:1px solid #E5D4AE;color:#5C441A;font-size:13px;line-height:1.5}
.note b{font-weight:700}
.note.real{background:#fff;border-color:#E4E2DC;color:#4A4642}

/* ─── the phone ──────────────────────────────────────────────────────────── */
.phone{width:320px;height:660px;border-radius:34px;overflow:hidden;position:relative;
       background:var(--map-land);
       box-shadow:0 18px 44px rgba(26,25,23,.20),0 0 0 1px rgba(26,25,23,.10);
       font-family:var(--font);color:var(--ink);isolation:isolate}
.phone.dark{box-shadow:0 18px 44px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.09)}
.phone.tall{height:820px}

.map{position:absolute;inset:0;background:var(--map-land)}
.water{position:absolute;background:var(--map-water)}
.park{position:absolute;background:var(--map-park);border-radius:40% 55% 45% 50%}
.block{position:absolute;background:var(--map-block);border-radius:2px}
.road{position:absolute;background:var(--map-road);box-shadow:0 0 0 1px var(--map-road-casing)}
.mlabel{position:absolute;font-size:9.5px;font-weight:700;letter-spacing:.14em;
        color:var(--map-label)}
.pin{position:absolute;width:26px;height:34px;filter:drop-shadow(var(--shadow-pin))}
.pin svg{width:100%;height:100%;overflow:visible}
.pin .drop{fill:var(--see)}
.pin.eat .drop{fill:var(--eat)} .pin.buy .drop{fill:var(--buy)}
.pin.move .drop{fill:var(--move)} .pin.sleep .drop{fill:var(--sleep)}
.pin .g{stroke:var(--marker-fg);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}

/* ─── the header — this is the thing being decided ───────────────────────── */
.hdr{position:absolute;top:0;left:0;right:0;z-index:4;background:var(--surface);
     border-bottom:1px solid var(--line)}
.hdr.rowA{display:flex;align-items:center;gap:6px;padding:52px 14px 11px}
.hdr.rowB{padding:52px 14px 9px}
.hdr.rowB .line1{display:flex;align-items:center;gap:8px}
.hdr.rowB .line2{display:flex;margin-top:1px;padding-left:17px}

.dot{width:9px;height:9px;border-radius:50%;background:var(--accent);
     box-shadow:0 0 0 3px var(--accent-ring);flex:none}
.tripbtn{display:flex;align-items:center;gap:5px;min-width:0;flex:1 1 auto;
         padding:4px 6px 4px 2px;border-radius:8px;cursor:pointer}
.trip{font-size:17px;font-weight:700;letter-spacing:-.022em;min-width:0;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.caret{width:16px;height:16px;stroke:var(--ink-muted);fill:none;stroke-width:2.4;
       stroke-linecap:round;stroke-linejoin:round;flex:none}
.caret.sm{width:14px;height:14px;stroke-width:2.6}
.sep{color:var(--ink-faint);font-size:15px;font-weight:400;flex:none;margin:0 -1px}
.citybtn{display:flex;align-items:center;gap:4px;min-width:0;flex:1 1 auto;
         padding:4px 6px;border-radius:8px;cursor:pointer;background:var(--surface-muted)}
.cityname{font-size:14.5px;font-weight:650;letter-spacing:-.014em;min-width:0;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.citybtn.none .cityname{color:var(--ink-muted);font-weight:550}
.burger{display:grid;place-items:center;width:30px;height:30px;color:var(--ink-muted);
        flex:none;margin-left:auto}
.hdr.rowA .burger{margin-left:2px}
.burger svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2;
            stroke-linecap:round;stroke-linejoin:round}
/* B gives the city line the whole width, so it is the trip that truncates first */
.hdr.rowB .citybtn{flex:0 1 auto;max-width:100%}

/* C — the chip over the map */
.chipwrap{position:absolute;z-index:3;top:104px;left:14px;right:14px;display:flex}
.chip{display:flex;align-items:center;gap:5px;max-width:100%;min-width:0;
      padding:6px 10px 6px 12px;border-radius:999px;background:var(--surface);
      border:1px solid var(--line-strong);box-shadow:var(--shadow-md);cursor:pointer}
.chip.none .cityname{color:var(--ink-muted);font-weight:550}

/* ── the three city treatments (section 7) ───────────────────────────────── */
/* A — as shipped: a muted fill with a border that is drawn at rest */
.cs-mine{background:var(--surface-muted);border:1px solid var(--line);
         padding:3px 6px 3px 8px}
.cs-mine .cityname{font-size:14px;font-weight:650}
/* B — DESIGN.md's selector pill: muted fill, border held in reserve, control type */
.cs-pill{background:var(--surface-muted);border:1px solid transparent;padding:7px 11px}
.cs-pill .cityname{font-size:13.5px;font-weight:500}
.cs-pill .caret{color:var(--ink-faint)}
/* C — the trip name's treatment, one step down: no fill, no border */
.cs-bare{background:none;border:1px solid transparent;padding:4px 4px 4px 0}
/* `rowName`, the nearest role below the title — the 15px this first drew was a
   literal, and there is no 15px role to spend. */
.cs-bare .cityname{font-size:14px;font-weight:600;color:var(--ink)}
.cs-bare.none .cityname{color:var(--ink-muted);font-weight:550}

/* ─── the bottom toolbar, as shipped ─────────────────────────────────────── */
.bar{position:absolute;left:0;right:0;bottom:0;z-index:5;background:var(--surface);
     border-top:1px solid var(--line);box-shadow:var(--shadow-md);padding-bottom:22px}
.bar-row{display:flex;align-items:stretch}
.tool{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:4px;min-height:56px;padding:9px 4px 7px;background:none;border:0;
      font-family:inherit;cursor:pointer;color:var(--ink-muted);position:relative}
.tool svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:2;
          stroke-linecap:round;stroke-linejoin:round}
.tool span{font-size:11px;font-weight:600;line-height:1.1;color:inherit}
.tool.on{color:var(--accent-ink)}
.tool .pip{position:absolute;top:7px;left:50%;margin-left:7px;width:7px;height:7px;
           border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px var(--surface)}

/* ─── the sheet ──────────────────────────────────────────────────────────── */
.scrim{position:absolute;inset:0;z-index:6;background:rgba(10,9,8,.34)}
.sheet{position:absolute;left:0;right:0;bottom:0;z-index:7;background:var(--surface);
       border-top:1px solid var(--line);border-radius:20px 20px 0 0;
       box-shadow:0 -3px 16px rgba(0,0,0,.16);display:flex;flex-direction:column;
       max-height:86%;min-height:120px}
.grab{align-self:center;width:38px;height:4px;border-radius:999px;background:var(--line-strong);
      margin:8px 0 4px;flex:none}
.sheet-hd{display:flex;align-items:center;gap:8px;padding:2px 16px 10px;
          border-bottom:1px solid var(--line);flex:none}
.sheet-hd h3{flex:1;margin:0;font-size:17px;font-weight:700;letter-spacing:-.022em}
.done{background:none;border:0;font-family:inherit;font-size:13.5px;font-weight:700;
      color:var(--accent-ink);cursor:pointer;padding:4px}
.sheet-body{overflow-y:auto;padding-bottom:26px}
.sec{padding:6px 16px 4px}
.empty{font-size:13px;color:var(--ink-muted);padding:14px 0;margin:0}

.crow{display:flex;align-items:center;gap:11px;width:100%;padding:11px 0;
      border-bottom:1px solid var(--line);color:var(--ink)}
.crow.all{border-bottom:1px solid var(--line-strong)}
.cur{width:20px;height:20px;flex:none;display:grid;place-items:center}
.cur svg{width:17px;height:17px;stroke:var(--accent-ink);fill:none;stroke-width:2.6;
         stroke-linecap:round;stroke-linejoin:round}
.ctext{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.cname{font-size:15px;font-weight:650;letter-spacing:-.014em;
       overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.crow.is-cur .cname{color:var(--accent-ink)}
.cmeta{font-size:12px;color:var(--ink-muted);font-variant-numeric:tabular-nums}
.editbtn{width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:8px;
         background:var(--surface-muted);color:var(--ink-muted)}
.editbtn.empty{background:none}
.editbtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;
             stroke-linecap:round;stroke-linejoin:round}

.editor{padding:4px 0 16px;border-bottom:1px solid var(--line)}
.fl{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
    color:var(--ink-muted);margin:10px 0 5px}
.field{border:1px solid var(--line-strong);border-radius:var(--radius-md);padding:10px 11px;
       font-size:14.5px;background:var(--surface);color:var(--ink)}
.field.ph{color:var(--ink-faint)}
.hint{font-size:12px;color:var(--ink-muted);margin:9px 0 0;line-height:1.4}
.erow{display:flex;gap:9px;margin-top:13px}
.btn{flex:1;padding:11px;border-radius:var(--radius-md);font-family:inherit;font-size:13.5px;
     font-weight:700;cursor:pointer;border:1px solid transparent}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--ink-on-accent)}
.btn.danger{background:var(--danger-surface);border-color:var(--danger);color:var(--danger)}
.btn.quiet{background:transparent;color:var(--ink-muted);border-color:var(--line-strong)}

/* ─── the laptop — a crop of the one bar, with the menu hanging from it ───── */
.lap{width:620px;height:400px;border-radius:12px;overflow:hidden;position:relative;
     background:var(--map-land);font-family:var(--font);color:var(--ink);isolation:isolate;
     box-shadow:0 14px 36px rgba(26,25,23,.18),0 0 0 1px rgba(26,25,23,.10)}
.lap.dark{box-shadow:0 14px 36px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.09)}
.lap.tall{height:620px}
.lbar{position:relative;z-index:5;display:flex;align-items:center;gap:7px;
      padding:11px 14px;background:var(--surface);border-bottom:1px solid var(--line)}
.ltrip{font-size:13.5px;font-weight:600;color:var(--ink);white-space:nowrap}
.lsep{color:var(--ink-faint);font-size:14px;margin:0 1px}
.lanchor{position:relative;display:inline-flex}
.lcity{display:inline-flex;align-items:center;gap:3px;padding:7px 11px;border-radius:999px;
       background:var(--surface-muted);cursor:pointer}
.lcityname{font-size:13.5px;font-weight:600;color:var(--ink);
           width:11ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* the rest of the bar, running off the edge */
.lfade{flex:1;height:30px;margin-left:6px;border-radius:6px;
       background:linear-gradient(90deg,var(--surface-muted),transparent 88%)}
.lstage{position:absolute;inset:0;top:52px}
.lstage .map{top:-52px}
.mapdup{position:absolute;left:320px;top:0;width:320px;height:100%;overflow:hidden}
.mapdup .map{top:-52px;left:0;width:320px}
.mapdup .mlabel{display:none}

.lpanel{position:absolute;top:calc(100% + 4px);left:0;z-index:9;width:320px;
        max-height:520px;overflow-y:auto;padding:16px;background:var(--surface);
        color:var(--ink);border:1px solid var(--line);border-radius:14px;
        box-shadow:0 12px 32px #1A191729}
.dark .lpanel{box-shadow:0 12px 32px #00000094}
.lhead{margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
       color:var(--ink-muted)}
.lrow{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;
      padding:7px 8px;border-radius:6px;font-size:13.5px;font-weight:500;color:var(--ink);
      cursor:pointer}
.lrow.wide{padding:6px 6px 6px 8px}
.lrow.is-cur{background:var(--accent-wash);color:var(--accent-ink)}
.lname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lnote{font-size:12.5px;color:var(--ink-muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.lrow.is-cur .lnote{color:var(--accent-ink)}
.lpen{width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:6px;
      color:var(--ink-muted);border:1px solid var(--line)}
.lpen.empty{border-color:transparent}
.lpen svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;
          stroke-linecap:round;stroke-linejoin:round}
.ldiv{height:0;margin:4px 0;border:0;border-top:1px solid var(--line)}
.leditor{padding:6px 8px 12px}
.lerow{display:flex;gap:8px;align-items:center;margin-top:12px}
.lerow .btn{flex:none;padding:8px 15px;border-radius:999px;font-size:13.5px}
.lerow .btn.last{margin-left:auto}
</style>
</head>
<body>
'''

out = HERE / 'pinpoint-city-mock.html'
out.write_text(CSS.replace('__FONT__', FONT) + ''.join(S), encoding='utf-8')
print('wrote', out, f'({out.stat().st_size // 1024} KB)')
