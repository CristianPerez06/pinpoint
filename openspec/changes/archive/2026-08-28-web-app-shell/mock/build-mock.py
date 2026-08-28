"""
The mock for: what the web application looks like *before its data arrives*.

Same construction as the phone-shape mock this repo already keeps — the real
tokens parsed out of @pinpoint/tokens' generated CSS, the real bundled Figtree,
real Lucide path data, and a trip whose names are at the long end rather than
the seed's. One self-contained HTML file, no network, nothing installed.

    python3 build-mock.py && open pinpoint-app-shell-mock.html

It exists to settle two things a document can only argue about:

  1. The placeholder for a name nobody knows yet is a *drawn block*, and a block
     has to be given a width before the name that will replace it is known. That
     guess is wrong in both directions and section 03 is where it fails on
     purpose.
  2. The map's loader sits directly under a header that is already `surface`.
     Section 05 is whether that reads as one map-shaped hole or as two grey
     bands.

The board's own annotations are set in a monospace face on a ground that is
none of the product's, so nothing written *about* the mock can be mistaken for
something in it.
"""

import base64
import pathlib
import re

HERE = pathlib.Path(__file__).parent
ROOT = next(q for q in HERE.parents if (q / 'apps/web/app/fonts/Figtree.ttf').exists())
FONT = base64.b64encode((ROOT / 'apps/web/app/fonts/Figtree.ttf').read_bytes()).decode()

# ── the real tokens, read rather than retyped ────────────────────────────────
# tokens.css declares light on `:root` and dark inside a preference query. The
# board needs both grounds on one page, so the two blocks become two classes.
TOK = (ROOT / 'packages/tokens/src/generated/tokens.css').read_text()
LIGHT = re.search(r':root \{(.*?)\n\}', TOK, re.S).group(1)
DARK = re.search(
    r'@media \(prefers-color-scheme: dark\) \{\s*:root \{(.*?)\n  \}', TOK, re.S
).group(1)

# ── real Lucide 24x24 path data ──────────────────────────────────────────────
I = {
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'drop': (
        '<path d="M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 '
        '10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"/>'
        '<circle cx="12" cy="10" r="3"/><path d="M16 18h6"/><path d="M19 15v6"/>'
    ),
    'sliders': (
        '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/>'
        '<line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/>'
        '<line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/>'
        '<line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/>'
        '<line x1="16" x2="16" y1="18" y2="22"/>'
    ),
    'menu': (
        '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/>'
        '<line x1="4" x2="20" y1="18" y2="18"/>'
    ),
    'landmark': (
        '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/>'
        '<line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/>'
        '<line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'
    ),
    'utensils': (
        '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>'
        '<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2z"/>'
    ),
    'bed': '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
}
DROP = 'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'


def ico(name, cls='ic'):
    return f'<svg viewBox="0 0 24 24" class="{cls}" aria-hidden="true">{I[name]}</svg>'


def caret(cls='cv'):
    """The 13px drawn chevron. A path, never a typed glyph — DESIGN.md's rule."""
    return (
        f'<svg viewBox="0 0 16 16" class="{cls}" fill="none" stroke="currentColor" '
        f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
        f'aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>'
    )


def pin(x, y, fam, glyph, scale=1.0):
    s = f'transform:scale({scale});' if scale != 1.0 else ''
    return (
        f'<span class="pin f-{fam}" style="left:{x}px;top:{y}px;{s}">'
        f'<svg viewBox="0 0 32 42"><path class="drop" d="{DROP}"/>'
        f'<g class="g" transform="translate(8.5 7.5) scale(0.625)">{I[glyph]}</g></svg></span>'
    )


# ── the map underneath ───────────────────────────────────────────────────────
# A stand-in, not a real map: enough ground to judge the chrome against.

PINS = [
    (58, 150, 'see', 'landmark', 1.0),
    (150, 210, 'eat', 'utensils', 1.0),
    (243, 128, 'sleep', 'bed', 1.0),
    (196, 300, 'see', 'landmark', 0.86),
    (96, 330, 'eat', 'utensils', 0.86),
    (286, 240, 'see', 'landmark', 0.86),
]


def ground(w, h, loaded=True):
    """The map area. Loaded shows cartography and pins; loading shows the spinner."""
    g = [f'<div class="map" style="width:{w}px;height:{h}px">']
    if loaded:
        g.append(
            '<div class="water" style="left:-60px;top:38%;width:210px;height:44%;'
            'border-radius:0 60% 40% 0/0 50% 50% 0"></div>'
        )
        g.append(f'<div class="park" style="left:{w-150}px;top:30%;width:150px;height:22%"></div>')
        for x, y, ww, hh in [(0, '46%', w, 9), (0, '72%', w, 6), (int(w * 0.44), 0, 9, h)]:
            g.append(f'<div class="road" style="left:{x}px;top:{y};width:{ww}px;height:{hh}px"></div>')
        for x, y, fam, glyph, sc in PINS:
            if x < w - 20 and y < h - 40:
                g.append(pin(x, y, fam, glyph, sc))
    else:
        g.append(
            '<div class="loader"><span class="spinner"></span>'
            '<p class="loadmsg">Loading your trip…</p></div>'
        )
    g.append('</div>')
    return ''.join(g)


# ── the chrome ───────────────────────────────────────────────────────────────
# One header and one tools band, exactly as the application has them: the phone
# shape is the same markup re-gridded by the cascade, never a second component.

def block(width, cls='blk'):
    """A drawn placeholder. `ink-faint` is for what is drawn, not read — DESIGN.md."""
    return f'<span class="{cls}" style="width:{width}px"></span>'


def bar(loaded=True, trip='Southeast Asia 2027', city='Osaka', tripw=132, cityw=64, blkcls='blk'):
    """The header. Identical structure loaded or not — only the name slots differ."""
    inert = '' if loaded else ' inert'
    trip_slot = f'<span class="name">{trip}</span>' if loaded else block(tripw, blkcls)
    city_slot = f'<span class="name city-name">{city}</span>' if loaded else block(cityw, blkcls)
    you_slot = '<span class="you">Cristian P.</span>' if loaded else block(72, blkcls)
    return f'''<header class="bar{inert}">
  <span class="mark"></span>
  <span class="scope"><button class="menu">{trip_slot}{caret()}</button></span>
  <span class="scopeSep">/</span>
  <span class="city"><button class="menu">{city_slot}{caret()}</button></span>
  <span class="tools">
    <button class="searchTool">{ico('search', 'tg')}<span class="tl">Search</span></button>
    <span class="search"><span class="field">{ico('search', 'fic')}<span
      class="ph">Search for a place</span></span></span>
    <span class="drop"><button class="btn primary">{ico('drop', 'tg')}<span
      class="wide">+ Drop a pin</span><span class="tl">Drop</span></button></span>
    <button class="menu filter">{ico('sliders', 'tg')}<span class="wide">All places</span><span
      class="tl">Filter</span>{caret()}</button>
  </span>
  <span class="account"><button class="menu acct">{you_slot}{ico('menu', 'hamb')}{caret()}</button></span>
</header>'''


def frame(w, h, loaded, phone, label, note, theme='light', **kw):
    """One device frame: the chrome over the map, at a real width.

    The theme class goes on the device itself rather than on the row around it.
    Custom properties inherit, so a class on the row would work — right up until
    a frame is moved into a row that has none, at which point every token
    resolves to nothing, the device paints transparent, and the board's own
    ground shows through looking like a deliberate dark mock. Which is exactly
    what the first build of this file did.
    """
    cls = 'device phone' if phone else 'device laptop'
    maph = h - (86 if phone else 45)
    return f'''<figure class="fig">
  <figcaption><b>{label}</b>{note}</figcaption>
  <div class="{cls} {theme}" style="width:{w}px;height:{h}px">
    {bar(loaded=loaded, **kw)}
    {ground(w, maph, loaded)}
  </div>
</figure>'''


# ── the page ─────────────────────────────────────────────────────────────────

CSS = """
@font-face { font-family:'Figtree'; src:url(data:font/ttf;base64,__FONT__) format('truetype');
             font-weight:100 900; font-display:block; }

.light { __LIGHT__ }
.dark  { __LIGHT__ __DARK__ }

* { box-sizing:border-box; }
body { margin:0; background:#14161a; color:#c9d1d9;
       font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace; }
main { max-width:1500px; margin:0 auto; padding:40px 28px 120px; }
h1 { font-size:22px; color:#fff; margin:0 0 6px; letter-spacing:-.01em; }
h2 { font-size:13px; color:#7d8590; margin:56px 0 4px; text-transform:uppercase;
     letter-spacing:.12em; font-weight:700; }
h2:first-of-type { margin-top:32px; }
.lede { color:#8b949e; margin:0 0 4px; max-width:78ch; }
.warn { color:#e3b341; }
.good { color:#7ee787; }
.bad  { color:#ff7b72; }
hr { border:0; border-top:1px solid #21262d; margin:10px 0 22px; }

.row { display:flex; gap:26px; flex-wrap:wrap; align-items:flex-start; margin-top:18px; }
.fig { margin:0; }
figcaption { color:#7d8590; font-size:11.5px; margin-bottom:8px; max-width:44ch; line-height:1.5; }
figcaption b { color:#c9d1d9; display:block; font-size:12.5px; margin-bottom:2px; }

/* ── the product itself, from this point down ───────────────────────────── */
.device { position:relative; overflow:hidden; border-radius:12px;
          border:1px solid #30363d; background:var(--pp-ground);
          font-family:'Figtree',ui-sans-serif,system-ui,sans-serif;
          color:var(--pp-ink); display:flex; flex-direction:column; }

.bar { position:relative; z-index:6; display:flex; align-items:center;
       gap:var(--pp-space-sm); padding:var(--pp-space-sm) var(--pp-space-md);
       border-bottom:1px solid var(--pp-line); background:var(--pp-surface); flex:none; }
.mark { width:9px; height:9px; margin-right:5px; border-radius:50%;
        background:var(--pp-accent); box-shadow:0 0 0 3px var(--pp-accent-ring); flex:none; }
.scope,.city { display:flex; min-width:0; flex:none; }
.scopeSep { color:var(--pp-ink-faint); flex:none; }
.tools { display:flex; align-items:center; gap:var(--pp-space-sm);
         margin-left:var(--pp-space-md); flex:1 1 auto; min-width:0; }
.account { flex:none; }
.tl,.hamb,.searchTool { display:none; }
.searchTool { border:0; background:none; font:inherit; cursor:pointer; }

.menu { display:flex; align-items:center; gap:5px; min-width:0; border:0; background:none;
        padding:5px 7px; border-radius:var(--pp-radius-pill); cursor:pointer;
        font:inherit; color:var(--pp-ink); font-size:var(--pp-type-row-name-size);
        font-weight:var(--pp-type-row-name-weight);
        letter-spacing:var(--pp-type-row-name-tracking); }
.name { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
.city-name { color:var(--pp-ink-muted); }
.cv { width:13px; height:13px; flex:none; color:var(--pp-ink-muted); }
.filter .wide { white-space:nowrap; }
.filter { color:var(--pp-ink-muted); font-size:var(--pp-type-control-size);
          font-weight:var(--pp-type-control-weight); }

.search { display:flex; flex:1 1 320px; max-width:480px; min-width:0; }
.field { display:flex; align-items:center; gap:7px; width:100%; padding:7px 12px;
         border:1px solid transparent; border-radius:var(--pp-radius-md);
         background:var(--pp-surface-muted); min-width:0; }
.fic { width:14px; height:14px; flex:none; color:var(--pp-ink-muted); }
.ph { color:var(--pp-ink-muted); font-size:var(--pp-type-body-size);
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.drop { display:flex; flex:none; width:124px; }
.btn { width:100%; justify-content:center; display:flex; align-items:center; gap:5px;
       border:0; border-radius:var(--pp-radius-pill); padding:7px 13px; cursor:pointer;
       font:inherit; font-size:var(--pp-type-control-size); font-weight:600; }
.primary { background:var(--pp-accent); color:var(--pp-ink-on-accent);
           box-shadow:var(--pp-shadow-sm); }
.tg { width:15px; height:15px; flex:none; }
svg.ic,svg.tg,svg.fic,svg.hamb { fill:none; stroke:currentColor; stroke-width:2;
                        stroke-linecap:round; stroke-linejoin:round; }
.acct .you { font-size:var(--pp-type-control-size); font-weight:var(--pp-type-control-weight);
             color:var(--pp-ink-muted); }

/* The placeholder: a drawn block, never faint text. DESIGN.md forbids
   `ink-faint` for anything read; a block is drawn, not read. */
.blk { display:block; height:11px; border-radius:var(--pp-radius-sm);
       background:var(--pp-line); flex:none; }
.blk-sunk { display:block; height:11px; border-radius:var(--pp-radius-sm);
            background:var(--pp-surface-sunk); flex:none; }
.blk-faint { display:block; height:11px; border-radius:var(--pp-radius-sm);
             background:var(--pp-ink-faint); flex:none; opacity:.5; }

/* Inert: aria-disabled styling, never the `disabled` attribute — DESIGN.md.
   The fill and the weight carry it, so colour never has to go below the floor. */
.bar.inert .menu,.bar.inert .btn,.bar.inert .searchTool { cursor:default; }
.bar.inert .primary { background:var(--pp-surface-sunk); color:var(--pp-ink-muted);
                      box-shadow:none; font-weight:500; }
.bar.inert .field { background:var(--pp-surface-sunk); }
.bar.inert .ph,.bar.inert .fic,.bar.inert .cv,.bar.inert .filter { color:var(--pp-ink-faint); }

.map { position:relative; overflow:hidden; background:var(--pp-map-land); flex:1; }
.water { position:absolute; background:var(--pp-map-water); }
.park { position:absolute; background:var(--pp-map-park); border-radius:8px; }
.road { position:absolute; background:var(--pp-map-road);
        box-shadow:0 0 0 1px var(--pp-map-road-casing); }
.pin { position:absolute; width:32px; height:42px; transform-origin:50% 100%;
       filter:drop-shadow(var(--pp-shadow-pin)); }
.pin svg { width:32px; height:42px; }
.pin .g { fill:none; stroke:var(--pp-marker-foreground); stroke-width:2;
          stroke-linecap:round; stroke-linejoin:round; }
.f-see .drop{fill:var(--pp-family-see)} .f-eat .drop{fill:var(--pp-family-eat)}
.f-sleep .drop{fill:var(--pp-family-sleep)}

/* The loader in the map's own area. DESIGN.md: 20px, 2px hairline ring with a
   Signal Amber top edge, 0.8s linear. */
.loader { position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:var(--pp-space-sm); }
.spinner { width:20px; height:20px; border-radius:var(--pp-radius-pill);
           border:2px solid var(--pp-line); border-top-color:var(--pp-accent);
           animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.loadmsg { margin:0; color:var(--pp-ink-muted); font-size:var(--pp-type-body-size); }

/* ── the phone shape: the same markup, re-gridded ────────────────────────── */
.phone .bar { position:static; display:grid; grid-template-columns:auto minmax(0,1fr) auto;
              grid-template-areas:'mark trip account' '.    city city';
              align-items:center; column-gap:var(--pp-space-xs); row-gap:0;
              padding-top:10px; padding-bottom:9px; }
.phone .mark { grid-area:mark; margin-right:5px; }
.phone .scope { grid-area:trip; display:flex; min-width:0; }
.phone .scope > *,.phone .city > * { min-width:0; }
.phone .scopeSep { display:none; }
.phone .city { grid-area:city; display:flex; min-width:0; margin-top:1px;
               padding-left:calc(9px + var(--pp-space-sm)); }
.phone .account { grid-area:account; margin-left:0; }
.phone .tools { position:absolute; z-index:5; right:0; bottom:0; left:0; margin-left:0;
                gap:0; background:var(--pp-surface); border-top:1px solid var(--pp-line); }
.phone .tools > * { flex:1 1 0; min-width:0; }
.phone .search { display:none; }
.phone .tl { display:grid; }
.phone .searchTool { display:grid; }
.phone .wide { display:none; }
.phone .tg { display:block; width:19px; height:19px; }
.phone .searchTool,.phone .filter,.phone .drop > .btn {
  display:grid; justify-items:center; gap:2px; padding:9px 0 10px;
  color:var(--pp-ink-muted); border-radius:0; background:none; box-shadow:none;
  font-size:var(--pp-type-label-size); font-weight:600; width:100%; }
.phone .drop { width:auto; }
.phone .drop > .btn { color:var(--pp-accent-ink); }
.phone .tl { font-size:11.5px; font-weight:600; letter-spacing:0; text-transform:none; }
/* The account name does not survive at this width: the phone already replaced
   it with a glyph, which is why this slot needs no placeholder at all. */
.phone .acct .you,.phone .acct .blk,.phone .acct .blk-sunk,.phone .acct .blk-faint,
.phone .acct .cv { display:none; }
.phone .hamb { display:block; width:20px; height:20px; color:var(--pp-ink); }

/* ── section 03: the width test ──────────────────────────────────────────── */
.strip { display:flex; flex-direction:column; gap:0; width:1000px;
         border:1px solid #30363d; border-radius:12px; overflow:hidden; }
.strip .bar { border-radius:0; }
.tag { font:11px/1 ui-monospace,monospace; color:#7d8590; padding:7px 12px;
       background:#161b22; border-bottom:1px solid #21262d; }
"""


def section(n, title, lede, body):
    return f'<h2>{n} — {title}</h2><p class="lede">{lede}</p><hr>{body}'


LAPTOP_W, LAPTOP_H = 1000, 360
PHONE_W, PHONE_H = 390, 700

# 01 — the laptop, both states
s01 = section(
    '01', 'Laptop — what loads, and what waits',
    'The header is present, complete and inert from the first paint. Only the map is '
    'waiting. Compare the two: nothing in the bar moves between them except the two '
    'names and the account, which fill in where the blocks were.',
    '<div class="row">'
    + frame(LAPTOP_W, LAPTOP_H, False, False, 'Loading',
            'Six controls, all inert. Search and Drop need no fetched data — they are '
            'inert because the act they start cannot complete yet.')
    + frame(LAPTOP_W, LAPTOP_H, True, False, 'Loaded',
            'The same DOM. The header never remounted, so nothing flinched.')
    + '</div>',
)

# 02 — the phone, both states
s02 = section(
    '02', 'Phone — the same markup, re-gridded',
    'No second component and no JavaScript width test: the cascade turns the bar into a '
    'two-row grid and lifts <code>.tools</code> to the bottom edge. A shell built once '
    'gets the tab bar for free — and cannot disagree with the real one about where '
    'anything goes.',
    '<div class="row">'
    + frame(PHONE_W, PHONE_H, False, True, 'Loading',
            'The account slot needs no placeholder here: at ≤700px it is already just '
            '☰, which is static. This is the one place the two widths differ.')
    + frame(PHONE_W, PHONE_H, True, True, 'Loaded',
            'Three tools on the floor, the two names stacked. Same elements throughout.')
    + '</div>',
)

# 03 — the width test: where "drawn blocks, name-width" fails
WIDTH_CASES = [
    ('Block guess: 132px / 64px', 132, 64, 'Southeast Asia 2027', 'Osaka',
     'The guess. Everything right of the names is where it will stay.'),
    ('Real name is much shorter', 132, 64, 'Japan', 'Kyo',
     '<span class="good">Nothing right of the names moves.</span> The search field is '
     '<code>flex: 1 1 320px</code> with a 480px cap, so it takes the whole error into its '
     'own width. Drop, Filter and the account do not shift by a pixel.'),
    ('Real name is much longer', 132, 64, 'Patagonia and the Chilean Fjords 2027',
     'San Carlos de Bariloche',
     '<span class="bad">Drop moves ~49px and the account collides with the filter.</span> '
     'Search has hit its 320px basis and has nothing left to give, so the overflow goes to '
     'everything after it — and note this happens in the <i>loaded</i> row too. That is the '
     'shipped bar, not the shell.'),
]
strips = []
for label, tw, cw, trip, city, verdict in WIDTH_CASES:
    strips.append(
        f'<figure class="fig"><figcaption><b>{label}</b>{verdict}</figcaption>'
        f'<div class="strip light">'
        f'<div class="tag">loading</div><div class="device laptop" style="width:1000px;height:auto">'
        f'{bar(loaded=False, tripw=tw, cityw=cw)}</div>'
        f'<div class="tag">then</div><div class="device laptop" style="width:1000px;height:auto">'
        f'{bar(loaded=True, trip=trip, city=city)}</div>'
        f'</div></figure>'
    )
s03 = section(
    '03', 'The width guess — and why it mostly does not matter',
    'Expected to be the weak point of drawn-blocks-at-name-width. It mostly is not, and that '
    'is the finding. <b>The search field sits between the names and everything else, and it '
    'flexes</b> — so it absorbs a wrong guess whole and the tools never move. The guess only '
    'escapes once the name is long enough to drive search to its 320px basis. '
    '<span class="warn">Watch Drop and the account</span> down the three cases.',
    '<div class="row">' + ''.join(strips) + '</div>',
)

# 04 — the fill, three candidates
fills = []
for cls, name, why in [
    ('blk', '--pp-line', 'the hairline. Quietest; may read as absent on `surface`.'),
    ('blk-sunk', '--pp-surface-sunk', 'the sunk surface. Reads as a slot waiting to be filled.'),
    ('blk-faint', '--pp-ink-faint @ 50%', 'legal — `ink-faint` is for what is drawn, not read — but the heaviest.'),
]:
    fills.append(
        f'<figure class="fig"><figcaption><b>{name}</b>{why}</figcaption>'
        f'<div class="device laptop light" style="width:1000px;height:auto">'
        f'{bar(loaded=False, blkcls=cls)}</div></figure>'
    )
s04 = section(
    '04', 'What the block is filled with',
    'Three candidates on the light ground. All three are legal: DESIGN.md forbids '
    '<code>ink-faint</code> for anything <i>read</i>, and a block is drawn, not read.',
    '<div class="row">' + ''.join(fills) + '</div>',
)

# 05 — the dark ground, and the two-grey-bands question
s05 = section(
    '05', 'Dark ground — and whether the loader reads as two bands',
    'The open question from the exploration: the header is <code>surface</code> and the '
    'old loading panel was <code>surface-muted</code>, so under one another they risked '
    'reading as two grey bands rather than one map-shaped hole. Here the map area keeps '
    '<code>map-land</code> — the colour the map itself will be — so the hole is map-shaped '
    'before the map arrives.',
    '<div class="row">'
    + frame(LAPTOP_W, LAPTOP_H, False, False, 'Laptop, loading, dark', theme='dark',
            note=
            'The band under the bar is `map-land`, not `surface-muted`.')
    + frame(PHONE_W, PHONE_H, False, True, 'Phone, loading, dark', theme='dark',
            note='Header and floor are both `surface`; the map is the only thing waiting.')
    + '</div>',
)

# 06 — at your own size
s06 = section(
    '06', 'At the size of whatever you are reading this on',
    'The two frames above are fixed pixel widths on a board. This one is the real thing at '
    'your viewport, so the phone grid and the laptop bar swap at the actual 700px '
    'breakpoint. <span class="warn">Narrow the window past 700px</span> and watch the tools '
    'drop to the floor — loading, which is the state this change is about.',
    '<div class="live light" style="border:1px solid #30363d;border-radius:12px;'
    'overflow:hidden;background:var(--pp-ground);font-family:Figtree,sans-serif;'
    'height:520px;display:flex;flex-direction:column;position:relative">'
    + bar(loaded=False)
    + '<div class="map" style="flex:1"><div class="loader"><span class="spinner"></span>'
    '<p class="loadmsg">Loading your trip…</p></div></div>'
    + '</div>'
    + '<style>@media (max-width:700px){'
    '.live .bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;'
    "grid-template-areas:'mark trip account' '.    city city';align-items:center;"
    'column-gap:var(--pp-space-xs);padding-top:10px;padding-bottom:9px}'
    '.live .mark{grid-area:mark}.live .scope{grid-area:trip}.live .scopeSep{display:none}'
    '.live .city{grid-area:city;padding-left:24px}.live .account{grid-area:account}'
    '.live .tools{position:absolute;right:0;bottom:0;left:0;margin-left:0;gap:0;'
    'background:var(--pp-surface);border-top:1px solid var(--pp-line);z-index:5}'
    '.live .tools>*{flex:1 1 0;min-width:0}.live .search{display:none}'
    '.live .tl{display:grid;font-size:11.5px;font-weight:600}.live .wide{display:none}'
    '.live .tg{display:block;width:19px;height:19px}'
    '.live .searchTool,.live .filter,.live .drop>.btn{display:grid;justify-items:center;'
    'gap:2px;padding:9px 0 10px;color:var(--pp-ink-muted);border-radius:0;background:none;'
    'box-shadow:none;width:100%}.live .drop{width:auto}'
    '.live .acct .blk,.live .acct .cv{display:none}.live .hamb{display:block;width:20px;height:20px}'
    '}</style>',
)

HTML = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>pinpoint — the app shell before its data</title>
<style>{CSS.replace('__FONT__', FONT).replace('__LIGHT__', LIGHT).replace('__DARK__', DARK)}</style>
</head><body><main>
<h1>The chrome renders first, inert. Only the map waits.</h1>
<p class="lede">Mock for <code>web-app-shell</code>. Real tokens, real Figtree, real Lucide
paths. The trip is invented and its names are deliberately at the long end — a placeholder
sized for <code>Osaka</code> tells you nothing about what happens to
<code>San Carlos de Bariloche</code>.</p>
<p class="lede">Decided going in: <b>Option B</b> — one header, data-optional, so it never
remounts. Inert is <code>aria-disabled</code> + a no-op handler + inert styling, never the
<code>disabled</code> attribute, which leaves the tab order and is skipped by screen
readers (DESIGN.md:636). <span class="warn">Open: the block width (03) and the fill
(04).</span></p>
{s01}{s02}{s03}{s04}{s05}{s06}
</main></body></html>'''

OUT = HERE / 'pinpoint-app-shell-mock.html'
OUT.write_text(HTML)
print(f'{OUT}  ({OUT.stat().st_size // 1024} KB)')
