"""
The mock for: what the web application looks like at a phone width.

Same construction as the toolbar and city-picker mocks this repo already keeps —
the real tokens parsed out of @pinpoint/tokens' generated CSS, the real bundled
Figtree, real Lucide path data, and names long enough to be the worst case
rather than the seed. One self-contained HTML file, no network, nothing
installed.

    python3 build-mock.py && open pinpoint-phone-web-mock.html

The board's own annotations are set in a monospace face on a ground that is
none of the product's, so nothing written *about* the mock can be mistaken for
something in it.
"""

import base64, pathlib, random, re

HERE = pathlib.Path(__file__).parent
ROOT = next(q for q in HERE.parents if (q / 'apps/web/app/fonts/Figtree.ttf').exists())
FONT = base64.b64encode((ROOT / 'apps/web/app/fonts/Figtree.ttf').read_bytes()).decode()

# ── the real tokens, read rather than retyped ────────────────────────────────
# tokens.css declares light on `:root` and dark inside a preference query. The
# board needs both grounds on one page, so the two blocks become two classes.
TOK = (ROOT / 'packages/tokens/src/generated/tokens.css').read_text()
LIGHT = re.search(r':root \{(.*?)\n\}', TOK, re.S).group(1)
DARK = re.search(r'@media \(prefers-color-scheme: dark\) \{\s*:root \{(.*?)\n  \}', TOK, re.S).group(1)

# ── real Lucide 24x24 path data ──────────────────────────────────────────────
I = {
 'search':   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 'drop':     '<path d="M19.914 11.105A7.298 7.298 0 0 0 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"/><circle cx="12" cy="10" r="3"/><path d="M16 18h6"/><path d="M19 15v6"/>',
 'sliders':  '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
 'menu':     '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
 'check':    '<path d="M20 6 9 17l-5-5"/>',
 'chev':     '<path d="m9 18 6-6-6-6"/>',
 'chevdown': '<path d="m6 9 6 6 6-6"/>',
 'x':        '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 'back':     '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
 'plus':     '<path d="M5 12h14"/><path d="M12 5v14"/>',
 'pencil':   '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
 'trash':    '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
 'logout':   '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
 'refresh':  '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
 'link':     '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
 'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2z"/>',
 'store':    '<path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/>',
 'train':    '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
 'bed':      '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
}
DROP = 'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'
FAMS = [('see', 'landmark'), ('eat', 'utensils'), ('buy', 'store'),
        ('sleep', 'bed'), ('move', 'train')]


def ico(name, cls='ic'):
    return f'<svg viewBox="0 0 24 24" class="{cls}" aria-hidden="true">{I[name]}</svg>'


def caret(cls='cv'):
    """The 13px drawn chevron. A path, never a typed glyph — DESIGN.md's rule."""
    return (f'<svg viewBox="0 0 16 16" class="{cls}" fill="none" stroke="currentColor" '
            f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" '
            f'aria-hidden="true"><path d="M4 6.5 8 10.5l4-4"/></svg>')


def pin(x, y, fam, glyph, scale=1.0, sel=False):
    s = f'transform:scale({scale});' if scale != 1.0 else ''
    return (f'<span class="pin f-{fam}{" sel" if sel else ""}" style="left:{x}px;top:{y}px;{s}">'
            f'<svg viewBox="0 0 32 42"><path class="drop" d="{DROP}"/>'
            f'<g class="g" transform="translate(8.5 7.5) scale(0.625)">{I[glyph]}</g></svg></span>')


# ── the map underneath ───────────────────────────────────────────────────────
# A stand-in, not a real map: enough ground to judge the chrome against, and
# enough pins that a trip is being looked at rather than a seed.

def ground(seed=7, count=26, w=390, h=844, sel=None, sight=False):
    random.seed(seed)
    g = ['<div class="map">']
    g.append('<div class="water" style="left:-60px;top:250px;width:210px;height:300px;'
             'border-radius:0 60% 40% 0/0 50% 50% 0"></div>')
    g.append('<div class="park" style="left:232px;top:300px;width:150px;height:120px"></div>')
    for x, y, ww, hh in [(0, 400, w, 10), (0, 560, w, 6), (176, 90, 9, h), (300, 90, 5, h),
                         (74, 90, 5, h), (0, 690, w, 7)]:
        g.append(f'<div class="road" style="left:{x}px;top:{y}px;width:{ww}px;height:{hh}px"></div>')
    for _ in range(22):
        bx, by = random.randint(6, w - 70), random.randint(140, h - 150)
        g.append(f'<div class="block" style="left:{bx}px;top:{by}px;'
                 f'width:{random.randint(30, 62)}px;height:{random.randint(26, 52)}px"></div>')
    # Weighted the way a real wishlist is: `see` is the majority, and the
    # minority families are the signal. DESIGN.md's ranking rule, in the data.
    picks = ['see'] * 14 + ['eat'] * 5 + ['buy'] * 3 + ['move'] * 3 + ['sleep'] * 2
    glyph = dict(FAMS)
    for i in range(count):
        fam = picks[i % len(picks)]
        px, py = random.randint(14, w - 46), random.randint(150, h - 190)
        g.append(pin(px, py, fam, glyph[fam], 1.0, sel=(sel is not None and i == sel)))
    if sight:
        g.append('<div class="sight"><span class="ring"></span><span class="cross"></span></div>')
    g.append('</div>')
    return ''.join(g)


CSS = """
@font-face { font-family: 'Figtree'; src: url(data:font/ttf;base64,__FONT__) format('truetype');
             font-weight: 300 900; font-display: block; }

/* ── the board's own ground ────────────────────────────────────────────────
   Deliberately none of the product's colours except its amber, so nothing
   written *about* the mock can be mistaken for something in it. The board is
   one committed look rather than a themed page: it is a review surface, and
   the two grounds it is reviewing are both on it at once. */
:root {
  --bd: #12110F; --bd-2: #1B1916; --bd-line: #2E2A25; --bd-line-2: #3D3831;
  --bd-ink: #E7E3DC; --bd-mut: #8F8880; --bd-dim: #6A645C;
  --bd-amber: #F0AE4A;
  --mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bd); color: var(--bd-ink); font-family: var(--mono);
       font-size: 13px; line-height: 1.5; -webkit-font-smoothing: antialiased; }

.wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px 120px; }

.mast { padding: 64px 0 40px; border-bottom: 1px solid var(--bd-line); }
.mast h1 { font-family: 'Figtree', sans-serif; font-size: 40px; font-weight: 800;
           letter-spacing: -0.033em; line-height: 1.05; margin: 0 0 14px;
           text-wrap: balance; max-width: 20ch; }
.mast p { margin: 0; color: var(--bd-mut); max-width: 66ch; }
.mast .meta { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid var(--bd-line-2); border-radius: 999px; padding: 4px 11px;
        font-size: 11px; color: var(--bd-mut); letter-spacing: 0.04em; }
.chip b { color: var(--bd-ink); font-weight: 500; }

.band { padding: 56px 0 8px; border-bottom: 1px solid var(--bd-line); }
.band:last-of-type { border-bottom: 0; }
.eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
           color: var(--bd-dim); margin: 0 0 10px; }
.band h2 { font-family: 'Figtree', sans-serif; font-size: 25px; font-weight: 700;
           letter-spacing: -0.022em; margin: 0 0 12px; text-wrap: balance; }
.band > p { margin: 0 0 6px; color: var(--bd-mut); max-width: 70ch; }
.band > p + p { margin-top: 12px; }
.band a { color: var(--bd-amber); }

.ask { border-left: 2px solid var(--bd-amber); padding: 2px 0 2px 16px; margin: 22px 0 4px;
       max-width: 70ch; }
.ask b { color: var(--bd-amber); font-weight: 500; display: block; font-size: 11px;
         letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 5px; }
.ask p { margin: 0; color: var(--bd-ink); }

.rail { display: flex; gap: 30px; overflow-x: auto; padding: 30px 4px 26px; }
.cell { flex: none; }
.cap { margin-top: 14px; width: 390px; }
.cap.n320 { width: 320px; }
.cap b { display: block; font-family: 'Figtree', sans-serif; font-size: 14px;
         font-weight: 600; color: var(--bd-ink); letter-spacing: -0.012em; }
.cap span { display: block; color: var(--bd-dim); margin-top: 4px; font-size: 12px; }

.two { display: grid; gap: 30px; grid-template-columns: repeat(auto-fit, minmax(320px, max-content));
       padding: 30px 0 10px; }

/* ── the device ──────────────────────────────────────────────────────────── */
.dev { --safe: 34px; width: 390px; height: 844px; position: relative; flex: none;
       border-radius: 44px; padding: 11px; background: #2A2622;
       box-shadow: 0 24px 60px #00000080, inset 0 0 0 1px #443E37; }
.dev.n320 { width: 320px; height: 720px; --safe: 0px; border-radius: 34px; padding: 9px; }
.scr { position: relative; width: 100%; height: 100%; overflow: hidden;
       border-radius: 34px; background: var(--pp-ground); }
.dev.n320 .scr { border-radius: 26px; }
.hi { position: absolute; left: 50%; bottom: 9px; transform: translateX(-50%); z-index: 30;
      width: 132px; height: 5px; border-radius: 999px; background: var(--pp-ink);
      opacity: 0.32; pointer-events: none; }

/* the product, inside it */
.pp { font-family: 'Figtree', ui-sans-serif, system-ui, sans-serif; color: var(--pp-ink); }
.shell { display: flex; flex-direction: column; height: 100%; }
"""

CSS += """
/* ── header: two lines, because the spec says so ─────────────────────────── */
.hd { position: relative; z-index: 6; flex: none; background: var(--pp-surface);
      border-bottom: 1px solid var(--pp-line); padding: 10px var(--pp-space-md) 9px; }
.hd1 { display: flex; align-items: center; gap: 5px; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--pp-accent);
       box-shadow: 0 0 0 3px var(--pp-accent-ring); flex: none; margin-right: 5px; }
.tripb { display: flex; align-items: center; gap: 3px; min-width: 0; background: none;
         border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
.tripn { font-size: var(--pp-type-title-size); font-weight: var(--pp-type-title-weight);
         letter-spacing: var(--pp-type-title-tracking); line-height: var(--pp-type-title-leading);
         overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ham { margin-left: auto; flex: none; background: none; border: 0; padding: 2px; cursor: pointer;
       color: var(--pp-ink); display: grid; place-items: center; }
.ham .ic { width: 21px; height: 21px; }
/* Indented to the trip name, not to the bar: the city is a narrowing of the
   trip and reads as one only when it stands under it. */
.hd2 { display: flex; margin-top: 1px; padding-left: 14px; }
.cityb { display: inline-flex; align-items: center; gap: 2px; min-width: 0; max-width: 100%;
         background: none; border: 0; padding: 0; font: inherit; cursor: pointer; }
.cityn { font-size: var(--pp-type-row-name-size); font-weight: var(--pp-type-row-name-weight);
         letter-spacing: var(--pp-type-row-name-tracking); color: var(--pp-ink);
         overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cityn.all { color: var(--pp-ink-muted); font-weight: 500; }
.cv { width: 13px; height: 13px; flex: none; color: var(--pp-ink-muted); }
.cv.sm { width: 12px; height: 12px; }
.ic { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2;
      stroke-linecap: round; stroke-linejoin: round; }

/* ── the stage: the map owns everything under the header, edge to edge ───── */
.stage { position: relative; flex: 1; min-height: 0; overflow: hidden; --floor: 0px; }
.map { position: absolute; inset: 0; background: var(--pp-map-land); }
.water { position: absolute; background: var(--pp-map-water); }
.park { position: absolute; background: var(--pp-map-park); border-radius: 6px; }
.road { position: absolute; background: var(--pp-map-road);
        box-shadow: 0 0 0 1px var(--pp-map-road-casing); }
.block { position: absolute; background: var(--pp-map-block); border-radius: 2px; }
.pin { position: absolute; width: 32px; height: 42px; margin: -42px 0 0 -16px;
       transform-origin: 50% 100%; }
.pin svg { width: 32px; height: 42px; display: block; filter: var(--pin-shadow); }
.pin .drop { fill: currentColor; }
.pin .g { fill: none; stroke: var(--pp-marker-foreground); stroke-width: 2;
          stroke-linecap: round; stroke-linejoin: round; }
.f-see { color: var(--pp-family-see); } .f-eat { color: var(--pp-family-eat); }
.f-buy { color: var(--pp-family-buy); } .f-sleep { color: var(--pp-family-sleep); }
.f-move { color: var(--pp-family-move); }
.pin.sel { transform: scale(1.2); z-index: 3; }
.pin.sel::before { content: ''; position: absolute; left: 50%; top: 9px; width: 40px;
                   height: 40px; margin: -8px 0 0 -20px; border-radius: 50%;
                   background: var(--pp-accent-ring); }

/* the sight: dragged under, not tapped at */
.sight { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 4; }
.ring { display: block; width: 64px; height: 64px; border-radius: 50%;
        border: 2px dashed var(--pp-ink); opacity: 0.72; }
.cross { position: absolute; left: 50%; top: 50%; width: 13px; height: 13px;
         margin: -6.5px 0 0 -6.5px; border-radius: 50%; background: var(--pp-ink); }

/* ── the licence credit, riding on whatever holds the floor ──────────────── */
.attrib { position: absolute; left: var(--pp-space-sm); bottom: calc(var(--floor) + 8px);
          z-index: 5; background: var(--pp-surface); opacity: 0.85;
          border-radius: var(--pp-radius-pill); padding: 2px var(--pp-space-sm);
          font-size: 10px; color: var(--pp-ink-muted); white-space: nowrap; }

/* ── the toolbar. Not a tab bar: every item fires an action ──────────────── */
.bar { position: absolute; left: 0; right: 0; bottom: 0; z-index: 5; display: flex;
       background: var(--pp-surface); border-top: 1px solid var(--pp-line);
       padding-bottom: var(--safe); }
.tool { flex: 1; display: grid; justify-items: center; gap: 3px; padding: 9px 0 10px;
        background: none; border: 0; font: inherit; cursor: pointer; color: var(--pp-ink-muted); }
.tool .ic { width: 22px; height: 22px; }
.tool span { font-size: 11px; font-weight: 600; letter-spacing: 0.01em; color: var(--pp-ink); }
.tool .badge { display: inline-flex; align-items: center; gap: 4px; }
.tool.on { color: var(--pp-accent-ink); }
.tool.on span { color: var(--pp-accent-ink); }
.tool.on .ic { background: var(--pp-accent-wash); border-radius: var(--pp-radius-pill);
               padding: 2px 10px; width: 42px; height: 26px; box-sizing: content-box;
               margin: -2px -10px; }
.tool .dt { width: 5px; height: 5px; border-radius: 50%; background: var(--pp-accent-ink); }
/* Arming replaces the row rather than adding to it. */
.confirm { display: flex; align-items: center; gap: var(--pp-space-sm);
           padding: 10px var(--pp-space-md) 11px; }
.confirm .hint { flex: 1; font-size: var(--pp-type-note-size); color: var(--pp-ink-muted);
                 line-height: 1.3; }
.pill { border-radius: var(--pp-radius-pill); border: 1px solid var(--pp-line-strong);
        padding: 7px 13px; font-size: var(--pp-type-control-size); font-weight: 500;
        background: none; color: var(--pp-ink); flex: none; cursor: pointer; font-family: inherit; }
.pill.use { border-color: var(--pp-accent); background: var(--pp-accent-wash);
            color: var(--pp-accent-ink); font-weight: 600; }

/* ── sheets, of two kinds ────────────────────────────────────────────────── */
.scrim { position: absolute; inset: 0; z-index: 8; background: #00000063; }
.sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 9;
         background: var(--pp-surface); border-top: 1px solid var(--pp-line);
         border-radius: 20px 20px 0 0; padding: var(--pp-space-md);
         padding-bottom: calc(var(--pp-space-md) + var(--safe)); }
.sheet.marker { z-index: 6; box-shadow: var(--pp-shadow-lg); }
.shd { display: flex; align-items: flex-start; gap: 11px; padding-bottom: var(--pp-space-xs); }
.shd h3 { flex: 1; margin: 0; font-size: var(--pp-type-title-size);
          font-weight: var(--pp-type-title-weight); letter-spacing: var(--pp-type-title-tracking);
          line-height: var(--pp-type-title-leading); }
.shd .done { background: none; border: 0; font: inherit; font-weight: 700; cursor: pointer;
             font-size: var(--pp-type-control-size); color: var(--pp-ink); padding: 2px 4px; }
.shd .xb { background: none; border: 0; padding: 3px; cursor: pointer; color: var(--pp-ink-muted);
           border-radius: var(--pp-radius-sm); display: grid; place-items: center; }
.blurb { margin: 0; color: var(--pp-ink-muted); font-size: var(--pp-type-note-size); }
.lab { font-size: var(--pp-type-label-size); font-weight: var(--pp-type-label-weight);
       letter-spacing: var(--pp-type-label-tracking); text-transform: uppercase;
       color: var(--pp-ink-muted); padding-top: var(--pp-space-sm); }
.opt { display: flex; align-items: center; gap: var(--pp-space-sm); padding: 11px 0; }
.opt .t { flex: 1; font-size: var(--pp-type-body-size); }
.box { width: 22px; height: 22px; border-radius: var(--pp-radius-sm); border: 2px solid
       var(--pp-line-strong); display: grid; place-items: center; flex: none; }
.box.on { background: var(--pp-accent); border-color: var(--pp-accent); }
.box.on .ic { width: 14px; height: 14px; color: var(--pp-ink-on-accent); stroke-width: 3; }
.rule { height: 1px; background: var(--pp-line); margin: var(--pp-space-xs) 0; }
.row { display: flex; align-items: center; gap: 11px; padding: 11px 0; }
.row .t { flex: 1; font-size: var(--pp-type-row-name-size);
          font-weight: var(--pp-type-row-name-weight); }
.row .m { font-size: var(--pp-type-note-size); color: var(--pp-ink-muted); }
.row.danger .t { color: var(--pp-danger); }
.row .ic { color: var(--pp-ink-muted); width: 18px; height: 18px; flex: none; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 11px 0 0; }
.tag { border-radius: var(--pp-radius-pill); background: var(--pp-surface-muted);
       color: var(--pp-ink-muted); padding: 3px 9px; font-size: var(--pp-type-note-size); }
.tag.fam { color: var(--pp-marker-foreground); }
.note { margin: 11px 0 0; font-size: var(--pp-type-body-size);
        line-height: var(--pp-type-body-leading); color: var(--pp-ink); }
.acts { display: flex; gap: var(--pp-space-sm); margin-top: var(--pp-space-md); }
.avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--pp-accent-wash);
          color: var(--pp-accent-ink); display: grid; place-items: center; font-weight: 700;
          font-size: 14px; flex: none; }

/* the search screen: the whole thing, the way the phone does it */
.screen { position: absolute; inset: 0; z-index: 10; background: var(--pp-surface);
          display: flex; flex-direction: column; }
.sbar { display: flex; align-items: center; gap: var(--pp-space-sm);
        padding: 10px var(--pp-space-md); border-bottom: 1px solid var(--pp-line); }
.sbar .xb { background: none; border: 0; padding: 3px; color: var(--pp-ink-muted); cursor: pointer;
            display: grid; place-items: center; }
.field { flex: 1; border-radius: var(--pp-radius-pill); background: var(--pp-surface-muted);
         border: 1px solid var(--pp-accent); box-shadow: 0 0 0 3px var(--pp-accent-ring);
         padding: 8px 14px; font-size: var(--pp-type-control-size); color: var(--pp-ink); }
.res { flex: 1; overflow: hidden; padding: 4px 0; }
.res .r { padding: 10px var(--pp-space-md); display: grid; gap: 2px; }
.res .r .n { font-size: var(--pp-type-row-name-size); font-weight: var(--pp-type-row-name-weight); }
.res .r .s { font-size: var(--pp-type-note-size); color: var(--pp-ink-muted); }
"""

CSS += """
/* ── annotation drawn onto a frame ───────────────────────────────────────── */
.mark { position: absolute; z-index: 40; font-family: var(--mono); font-size: 10.5px;
        letter-spacing: 0.04em; color: var(--bd-amber); background: #12110FEE;
        border: 1px solid #F0AE4A55; border-radius: 4px; padding: 3px 7px; white-space: nowrap; }
.mark.l::before, .mark.r::before { content: ''; position: absolute; top: 50%;
        width: 22px; height: 1px; background: #F0AE4A88; }
.mark.l::before { right: 100%; } .mark.r::before { left: 100%; }

/* ── the live check: the mock at the size of the reader's own screen ─────── */
.live { position: fixed; inset: 0; z-index: 999; display: none; background: #12110F; }
.live.open { display: block; }
/* Capped, and centred. Stretched across a laptop the phone chrome reads as a
   broken layout rather than as the thing being checked — and the two questions
   this mode answers, dvh and the bottom inset, are height questions. A phone is
   narrower than the cap and fills it. */
.live .shell { height: 100dvh; max-width: 430px; margin: 0 auto; padding-top: 44px;
               background: var(--pp-ground); }
/* The strip the readout and the way out live in, so neither sits on the header
   and neither touches the bottom edge, which is the edge under test. */
.live::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 44px;
                background: #12110F; border-bottom: 1px solid var(--bd-line); }
.live .bar { padding-bottom: env(safe-area-inset-bottom, 0px); }
.live .sheet { padding-bottom: calc(var(--pp-space-md) + env(safe-area-inset-bottom, 0px)); }
.probe { position: fixed; left: 0; bottom: 0; width: 1px;
         height: env(safe-area-inset-bottom, 0px); pointer-events: none; }
.exit { position: absolute; z-index: 1000; right: 12px; top: 8px; font-family: var(--mono);
        font-size: 11px; background: #12110FE8; color: var(--bd-amber);
        border: 1px solid #F0AE4A66; border-radius: 999px; padding: 7px 13px; cursor: pointer; }
.readout { position: absolute; z-index: 1000; left: 12px; top: 8px; font-family: var(--mono);
           font-size: 11px; background: #12110FE8; color: var(--bd-mut);
           border: 1px solid var(--bd-line-2); border-radius: 6px; padding: 7px 11px; }
.readout b { color: var(--bd-amber); font-weight: 500; }
.golive { font-family: var(--mono); font-size: 12px; background: none; color: var(--bd-amber);
          border: 1px solid #F0AE4A66; border-radius: 999px; padding: 9px 18px; cursor: pointer;
          margin-top: 8px; }
.golive:hover { background: #F0AE4A14; }
button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--bd-amber);
          outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
@media (max-width: 620px) { .wrap { padding: 0 16px 90px; } .mast h1 { font-size: 30px; }
          .band h2 { font-size: 21px; } }
"""

# ── the worst case, not the seed ─────────────────────────────────────────────
TRIP = 'Tokyo, Kyoto & Hiroshima — Honeymoon 2026'
CITY = 'Higashiyama &amp; Gion District'
PLACE = 'Fushimi Inari Taisha — Senbon Torii Gates'
WHO = 'cristian.perez.aero@gmail.com'
CREDIT = '© OpenMapTiles © OpenStreetMap contributors'


def header(trip=TRIP, city=CITY, all_places=False):
    cn = ('<span class="cityn all">All places</span>' if all_places
          else f'<span class="cityn">{city}</span>')
    return (f'<header class="hd">'
            f'<div class="hd1"><span class="dot"></span>'
            f'<button class="tripb"><span class="tripn">{trip}</span>{caret()}</button>'
            f'<button class="ham" aria-label="Menu">{ico("menu")}</button></div>'
            f'<div class="hd2"><button class="cityb">{cn}{caret("cv sm")}</button></div>'
            f'</header>')


def toolbar(narrowed=True):
    dot = '<span class="dt"></span>' if narrowed else ''
    return (f'<div class="bar">'
            f'<button class="tool">{ico("search")}<span>Search</span></button>'
            f'<button class="tool">{ico("drop")}<span>Drop</span></button>'
            f'<button class="tool{" on" if narrowed else ""}">{ico("sliders")}'
            f'<span class="badge">Filter{dot}</span></button>'
            f'</div>')


CONFIRM = ('<div class="bar"><div class="confirm">'
           '<button class="pill">Cancel</button>'
           '<span class="hint">Move the map to put the place under the ring.</span>'
           '<button class="pill use">Use this spot</button>'
           '</div></div>')

BANNER = ('<p style="position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:5;'
          'margin:0;padding:9px 16px;border-radius:999px;background:var(--pp-ink);'
          'color:var(--pp-ground);box-shadow:var(--pp-shadow-lg);font-size:12.5px;'
          'font-weight:550;white-space:nowrap">Tap the map where the place is</p>')


def opt(text, on=False, meta=''):
    m = f'<span class="m">{meta}</span>' if meta else ''
    return (f'<div class="opt"><span class="box{" on" if on else ""}">'
            f'{ico("check") if on else ""}</span><span class="t">{text}</span>{m}</div>')


FILTER_SHEET = (
    '<div class="scrim"></div><div class="sheet">'
    '<div class="shd"><h3>Filter</h3><button class="done">Done</button></div>'
    '<p class="blurb">9 of 34 places</p>'
    '<div class="lab">Who wants to go</div>'
    + opt('Cristian (you)', True) + opt('Ana', True) + opt('Marta', False)
    + opt('Diego', False)
    + '<div class="rule"></div>'
    '<div class="lab">Kind</div>'
    + opt('Eat', True) + opt('See', False)
    + '<div class="acts"><button class="pill use">Clear the filter</button></div>'
    '</div>')

MENU_SHEET = (
    '<div class="scrim"></div><div class="sheet">'
    '<div class="row"><span class="avatar">CP</span>'
    f'<span class="t">Cristian Perez<br><span class="m">{WHO}</span></span></div>'
    '<div class="rule"></div>'
    f'<div class="row">{ico("refresh")}<span class="t">Refresh</span></div>'
    f'<div class="row danger">{ico("logout")}<span class="t">Sign out</span></div>'
    '</div>')

TRIP_SHEET = (
    '<div class="scrim"></div><div class="sheet">'
    '<div class="shd"><h3>Trips</h3><button class="done">Done</button></div>'
    f'<div class="row"><span class="t">{TRIP}</span>{ico("check")}</div>'
    '<div class="row"><span class="t">Lisbon &amp; Porto, October</span></div>'
    '<div class="row"><span class="t">Patagonia — Torres del Paine</span></div>'
    '<div class="rule"></div>'
    f'<div class="row">{ico("pencil")}<span class="t">Rename this trip</span></div>'
    f'<div class="row">{ico("plus")}<span class="t">New trip</span></div>'
    f'<div class="row">{ico("link")}<span class="t">People on this trip</span></div>'
    '</div>')

CITY_SHEET = (
    '<div class="scrim"></div><div class="sheet">'
    '<div class="shd"><h3>Cities</h3><button class="done">Done</button></div>'
    '<div class="row"><span class="t">All places</span><span class="m">34</span></div>'
    '<div class="rule"></div>'
    f'<div class="row"><span class="t">Higashiyama &amp; Gion District</span>'
    f'<span class="m">12</span>{ico("check")}</div>'
    '<div class="row"><span class="t">Shibuya</span><span class="m">9</span></div>'
    '<div class="row"><span class="t">Miyajima</span><span class="m">5</span></div>'
    '</div>')

# Not dimmed, and it must not cover the pin it describes.
MARKER_SHEET = (
    '<div class="sheet marker">'
    f'<div class="shd"><h3>{PLACE}</h3>'
    f'<button class="xb" aria-label="Dismiss">{ico("x")}</button></div>'
    '<div class="tags"><span class="tag fam f-see" style="background:var(--pp-family-see)">See</span>'
    '<span class="tag">¥0</span><span class="tag">Ana + you</span></div>'
    '<p class="note">Walk up past the first gates before eight, then keep going — most '
    'people turn back at the halfway shrine.</p>'
    '<div class="acts"><button class="pill">Edit</button>'
    '<button class="pill">Mark visited</button></div>'
    '</div>')

SEARCH_SCREEN = (
    '<div class="screen">'
    f'<div class="sbar"><button class="xb" aria-label="Back">{ico("back")}</button>'
    '<span class="field">Fushimi</span></div>'
    '<div class="res">'
    '<div class="r"><span class="n">Fushimi Inari Taisha</span>'
    '<span class="s">Shrine · Fushimi Ward, Kyoto · 4.2 km</span></div>'
    '<div class="r"><span class="n">Fushimi Inari Station</span>'
    '<span class="s">Railway station · Kyoto · 4.4 km</span></div>'
    '<div class="r"><span class="n">Fushimi Sake District</span>'
    '<span class="s">Neighbourhood · Kyoto · 6.1 km</span></div>'
    '<div class="r"><span class="n">Fushimi Momoyama Castle</span>'
    '<span class="s">Castle · Kyoto · 7.0 km</span></div>'
    '</div></div>')

FORM_SHEET = (
    '<div class="sheet marker">'
    '<div class="shd"><h3>Save this place</h3>'
    f'<button class="xb" aria-label="Cancel">{ico("x")}</button></div>'
    '<div class="lab" style="padding-top:4px">Name</div>'
    '<div style="background:var(--pp-surface-muted);border-radius:10px;padding:8px 11px;'
    'font-size:13.5px;margin-top:5px">Fushimi Inari Taisha</div>'
    '<div class="lab">City</div>'
    '<div style="background:var(--pp-surface-muted);border-radius:10px;padding:8px 11px;'
    'font-size:13.5px;margin-top:5px;color:var(--pp-ink-muted)">Higashiyama &amp; Gion '
    'District</div>'
    '<div class="acts"><button class="pill use">Save</button>'
    '<button class="pill">Cancel</button></div>'
    '</div>')



BARFLOOR = 'calc(58px + var(--safe))'

STATES = {
 'idle':    dict(overlay=lambda: toolbar(), floor=BARFLOOR, g=dict(seed=7, count=26)),
 'filter':  dict(overlay=lambda: toolbar() + FILTER_SHEET, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
 'menu':    dict(overlay=lambda: toolbar() + MENU_SHEET, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
 'trip':    dict(overlay=lambda: toolbar() + TRIP_SHEET, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
 'city':    dict(overlay=lambda: toolbar() + CITY_SHEET, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
 'search':  dict(overlay=lambda: toolbar() + SEARCH_SCREEN, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
 # The marker sheet takes the floor from the bar while it is open, so the credit
 # rises off the sheet instead. Both applications measure this; the number here
 # stands in for that measurement.
 'details': dict(overlay=lambda: MARKER_SHEET, floor='calc(268px + var(--safe))',
                 g=dict(seed=7, count=26, sel=4)),
 'form':    dict(overlay=lambda: FORM_SHEET, floor='calc(276px + var(--safe))',
                 g=dict(seed=7, count=26, sel=4)),
 'sight':   dict(overlay=lambda: CONFIRM, floor='calc(53px + var(--safe))',
                 g=dict(seed=7, count=26, sight=True)),
 'tapmap':  dict(overlay=lambda: toolbar() + BANNER, floor=BARFLOOR,
                 g=dict(seed=7, count=26)),
}

IND = '<span class="hi"></span>'


def phone(state, theme='light', w=390, h=844, trip=TRIP, city=CITY, all_places=False,
          marks=(), credit=True):
    st = STATES[state]
    g = dict(st['g'])
    g.update(w=w, h=h)
    narrow = ' n320' if w == 320 else ''
    cred = '<div class="attrib">' + CREDIT + '</div>' if credit else ''
    body = ('<div class="stage" style="--floor:' + st['floor'] + '">'
            + ground(**g) + cred + st['overlay']() + '</div>')
    m = ''.join('<span class="mark ' + side + '" style="' + pos + '">' + text + '</span>'
                for pos, side, text in marks)
    return ('<div class="dev pp pp-' + theme + narrow + '">'
            '<div class="scr pp"><div class="shell">'
            + header(trip, city, all_places) + body + '</div>'
            + ('' if narrow else IND) + '</div>' + m + '</div>')


def cell(state, cap, sub, theme='light', **kw):
    w = kw.get('w', 390)
    return ('<div class="cell">' + phone(state, theme, **kw)
            + '<div class="cap' + (' n320' if w == 320 else '') + '"><b>' + cap
            + '</b><span>' + sub + '</span></div></div>')


def rail(cells):
    return '<div class="rail">' + ''.join(cells) + '</div>'

CSS += """
.live { --safe: env(safe-area-inset-bottom, 0px); }
/* ── the camera, drawn ───────────────────────────────────────────────────── */
.diag { display: flex; gap: 26px; flex-wrap: wrap; padding: 26px 0 6px; }
.dg { width: 214px; }
.dg .view { position: relative; height: 300px; border-radius: 10px; overflow: hidden;
            background: #1F1D19; border: 1px solid var(--bd-line-2); }
.dg .land { position: absolute; inset: 0; background: #23211C; }
.dg .sheet2 { position: absolute; left: 0; right: 0; bottom: 0; height: 130px; z-index: 2;
              background: #E9E5DEC4; border-radius: 12px 12px 0 0;
              border-top: 1px solid #FFFFFF33; }
.dg .sheet2 span { position: absolute; left: 0; right: 0; top: 8px; text-align: center;
              font-family: var(--mono); font-size: 9.5px; color: #6E6A63; }
.dg .p { position: absolute; z-index: 1; width: 9px; height: 9px;
         border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         background: var(--bd-amber); }
.dg .p.lost { background: #8C857A; }
.dg .mid { position: absolute; left: 0; right: 0; border-top: 1px dashed #F0AE4A66; }
.dg .tag2 { position: absolute; right: 5px; font-size: 9.5px; color: #F0AE4A99;
            font-family: var(--mono); background: #12110FCC; padding: 1px 4px; border-radius: 3px; }
.dg h4 { font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 600; margin: 12px 0 4px; }
.dg p { margin: 0; font-size: 11.5px; color: var(--bd-dim); line-height: 1.45; }
.dg.good h4 { color: var(--bd-amber); }
"""


def dgv(title, blurb, pins, mid, good=False):
    ps = ''.join('<span class="p' + (' lost' if lost else '') + '" style="left:' + str(x)
                 + 'px;top:' + str(y) + 'px"></span>' for x, y, lost in pins)
    return ('<div class="dg' + (' good' if good else '') + '"><div class="view">'
            '<span class="land"></span>' + ps
            + '<span class="mid" style="top:' + str(mid) + 'px"></span>'
            '<span class="tag2" style="top:' + str(mid + 3) + 'px">centre</span>'
            '<span class="sheet2"><span>the sheet</span></span></div>'
            '<h4>' + title + '</h4><p>' + blurb + '</p></div>')


CAMERA = ('<div class="diag">'
          + dgv('Centre on the point', 'What the map does today. The middle of the view is '
                'behind the sheet, so the pin is put exactly where it cannot be seen.',
                [(100, 190, True), (72, 214, True), (132, 206, True), (96, 236, True)], 150)
          + dgv('Shift the centre', 'What the phone does. One pin lands right — but the zoom '
                'was still chosen for the whole screen, so a spread-out group keeps losing '
                'its outliers.',
                [(100, 96, False), (66, 60, False), (140, 178, True), (44, 176, True)], 150)
          + dgv('Shrink, then shift', 'Pick the zoom for the strip that is actually visible, '
                'then aim at it. fitBounds already takes a viewport; offsetCenter already '
                'exists. Two lines.',
                [(100, 92, False), (74, 58, False), (130, 128, False), (58, 130, False)], 150,
                good=True)
          + '</div>')

CSS += """
/* ── a callout that points at a real element ─────────────────────────────── */
.figure { display: flex; gap: 34px; flex-wrap: wrap; align-items: flex-start; padding: 30px 0 8px; }
.pip { position: absolute; z-index: 41; width: 21px; height: 21px; border-radius: 50%;
       background: var(--bd-amber); color: #12110F; font-family: var(--mono); font-size: 11px;
       font-weight: 700; display: grid; place-items: center;
       box-shadow: 0 0 0 3px #12110F, 0 2px 8px #00000080; }
.legend { flex: 1; min-width: 280px; max-width: 460px; display: grid; gap: 16px;
          padding-top: 6px; align-content: start; }
.legend li { list-style: none; display: grid; grid-template-columns: 21px 1fr; gap: 12px;
             align-items: start; }
.legend ol { margin: 0; padding: 0; display: grid; gap: 16px; }
.legend .n { width: 21px; height: 21px; border-radius: 50%; background: var(--bd-amber);
             color: #12110F; font-size: 11px; font-weight: 700; display: grid;
             place-items: center; }
.legend b { display: block; font-family: 'Figtree', sans-serif; font-size: 14px;
            font-weight: 600; color: var(--bd-ink); margin-bottom: 3px; }
.legend p { margin: 0; color: var(--bd-mut); font-size: 12.5px; line-height: 1.5; }
.legend code { color: var(--bd-amber); font-size: 11.5px; }
"""

# On the bezel rather than on the screen. Drawn over the frame they covered the
# controls they were labelling, which is the one thing a callout may not do.
PIPS = [('top:26px;left:-10px', '1'), ('top:56px;left:-10px', '2'),
        ('top:22px;right:-10px', '3'), ('top:430px;right:-10px', '4'),
        ('bottom:114px;left:-10px', '5'), ('bottom:36px;right:-10px', '6')]

LEGEND = [
 ('The trip name, and the caret that says it opens something',
  'The only element that yields: a forty-character name truncates rather than pushing '
  'anything off the edge. Same rule the phone header already holds.'),
 ('The city, on its own line under the trip it narrows',
  'Not a choice this mock is making — <code>workspace-chrome</code> requires it. Two names '
  'sharing a row at this width leave each other about eleven characters and neither '
  'answers its question.'),
 ('<code>☰</code>, where the account name used to be',
  'Sign out, and who you are signed in as. The account name costs about 130px of a 390px '
  'header to answer a question nobody asked.'),
 ('The map takes the middle and owns the bottom edge',
  'Nothing floats over it in a corner any more. The 328px panel is gone at this width.'),
 ('The licence credit rides on whatever holds the floor',
  'Ours, not the renderer&rsquo;s — <code>attributionControl: false</code> and the credit '
  'drawn above the bar, exactly as the phone does it. Pressing it opens the four projects.'),
 ('Search, Drop, Filter — flush to the edge, at equal weight',
  'A toolbar and deliberately not a tab bar: every one fires an action. Filter declares '
  'the narrowing by fill <em>and</em> a dot, so the state survives a greyscale screen.'),
]


def annotate(dev, pips):
    tail = '</div>'
    body = dev[: dev.rfind(tail)]
    marks = ''.join('<span class="pip" style="' + pos + '">' + n + '</span>' for pos, n in pips)
    return body + marks + tail


def liveshell(state, ident):
    st = STATES[state]
    g = dict(st['g']); g.update(w=430, h=930)
    stage = ('<div class="stage" style="--floor:' + st['floor'] + '">' + ground(**g)
             + '<div class="attrib">' + CREDIT + '</div>' + st['overlay']() + '</div>')
    return ('<div class="live pp pp-light" id="' + ident + '">'
            '<div class="shell">' + header() + stage + '</div>'
            '<span class="probe"></span>'
            '<button class="exit" data-close="' + ident + '">Close</button>'
            '<span class="readout">safe-area-inset-bottom <b class="ro">?</b></span>'
            '</div>')


def band(eyebrow, title, paras, inner=''):
    return ('<section class="band"><p class="eyebrow">' + eyebrow + '</p><h2>' + title + '</h2>'
            + ''.join('<p>' + p + '</p>' for p in paras) + inner + '</section>')


legend_html = ('<div class="legend"><ol>'
               + ''.join('<li><span class="n">' + str(i + 1) + '</span><div><b>' + t
                         + '</b><p>' + d + '</p></div></li>'
                         for i, (t, d) in enumerate(LEGEND))
               + '</ol></div>')

SHAPE = ('<div class="figure">' + annotate(phone('idle'), PIPS) + legend_html + '</div>')

STATES_RAIL = rail([
 cell('search', 'Searching', 'The whole screen, the way the phone does it. The field leaves '
      'the header and becomes a tool.'),
 cell('details', 'A place, open', 'The undimmed kind. It reports its height so the camera can '
      'offset around it — the pin stays visible.'),
 cell('filter', 'Filter', 'The dimmed kind. Dimming is what says the map is waiting.'),
 cell('trip', 'Trips', 'Rare actions behind the trip&rsquo;s own name — the phone&rsquo;s rule, '
      'and the one already in the spec.'),
 cell('city', 'Cities', 'Raised from the city line, not from the toolbar.'),
 cell('menu', 'The ☰ sheet', 'The phone&rsquo;s three items, all three kept on web: who you are, '
      'Refresh, and sign out.'),
 cell('form', 'Saving a place', 'The taller undimmed sheet. Same height contract as the details '
      'sheet, a bigger number.'),
])

WORST = rail([
 cell('idle', '320px, the narrowest supported', 'A forty-character trip name and a '
      'twenty-seven-character city. Each truncates in its own line; neither is a stub.',
      w=320, h=720),
 cell('trip', '320px, sheet open', 'The sheet is full width, so a long name has the whole '
      'screen rather than 320px minus a trigger.', w=320, h=720),
 cell('idle', '390px, no city chosen', '&ldquo;All places&rdquo; in muted ink — the product&rsquo;s '
      'own words for the state, never an empty control.', all_places=True),
 cell('filter', '390px, thirty-four places, four people', 'The filter sheet at the size a real '
      'trip makes it, not the seed&rsquo;s one city and eighteen markers.'),
])

DROPCHOICE = ('<div class="two">'
              + cell('sight', 'A — the sight. Chosen.', 'Drag the map under the ring, then '
                     'confirm. The row is replaced rather than added to, which is what says the '
                     'map is doing something else.')
              + cell('tapmap', 'B — tap the map. Weighed, not taken.', 'Web&rsquo;s current model at '
                     'phone width. It ships for free — and your finger covers the spot you are '
                     'aiming at, which is the whole reason the phone has a sight.')
              + '</div>')

DARK_RAIL = rail([
 cell('idle', 'Idle', 'The credit is a surface at 85% over the dark land, not a lightened '
      'version of the light one.', theme='dark'),
 cell('details', 'A place, open', 'Shadows go near-black at a higher alpha — the absent-light '
      'rule.', theme='dark'),
 cell('filter', 'Filter', 'Filter fills with <code>accent-wash</code>, never the accent: on this '
      'ground <code>accent</code> and <code>accent-ink</code> are the same value.',
      theme='dark'),
])


JS = """
(function () {
  var ro = function (el) {
    var p = el.querySelector('.probe');
    var px = p ? Math.round(p.getBoundingClientRect().height) : 0;
    var out = el.querySelector('.ro');
    if (out) out.textContent = px + 'px'
      + (px === 0 ? '  (nothing to clear)' : '')
      + '   ·   ' + window.innerWidth + '\u00d7' + Math.round(window.innerHeight);
  };
  document.querySelectorAll('.golive').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.dataset.live);
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      ro(el);
    });
  });
  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.getElementById(b.dataset.close).classList.remove('open');
      document.body.style.overflow = '';
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.live.open').forEach(function (el) {
      el.classList.remove('open');
    });
    document.body.style.overflow = '';
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.live.open').forEach(ro);
  });
})();
"""

PAGE = (
 '<meta charset="utf-8">'
 '<title>Pinpoint at Phone Width</title>'
 '<style>' + CSS.replace('__FONT__', FONT)
 + '.pp-light{' + LIGHT + '--pin-shadow:drop-shadow(0 2px 5px #1A19174D);}'
 + '.pp-dark{' + LIGHT + DARK + '--pin-shadow:drop-shadow(0 2px 5px #0000008C);}'
 + '</style>'
 '<div class="wrap">'

 '<header class="mast"><h1>Pinpoint at a phone width</h1>'
 '<p>The web application, at 390px, taking the arrangement the phone already has: a header, '
 'the map in the middle, a bar of tools on the bottom edge, and sheets rising from that edge. '
 'Real tokens, the real bundled Figtree, real Lucide paths, and a trip with a forty-character '
 'name and thirty-four places rather than the seed&rsquo;s one city and eighteen markers.</p>'
 '<div class="meta">'
 '<span class="chip"><b>#58</b> at phone width, the web app takes the phone&rsquo;s shape</span>'
 '<span class="chip">three bands &middot; phone below <b>700px</b></span>'
 '<span class="chip">chosen by <b>width alone</b></span>'
 '<span class="chip">spec delta scoped to the <b>phone shape</b></span>'
 '<span class="chip">edge to edge, <b>real safe-area insets</b></span>'
 '<span class="chip">drop by <b>the phone&rsquo;s sight</b></span>'
 '</div></header>'

 + band('01 &nbsp;the arrangement', 'Six things, and only one of them is a new idea',
        ['Everything numbered here already exists somewhere — in the phone application, in '
         '<code>DESIGN.md</code>, or in the <code>workspace-chrome</code> specification. This '
         'band is a check that they compose, not a proposal.'], SHAPE)

 + band('02 &nbsp;every state', 'The seven states, at 390 &times; 844',
        ['Two kinds of sheet, and the difference is the whole thing. <b>Dimmed and dismissed</b> '
         '&mdash; filter, trips, cities, the ☰ menu &mdash; is a decision made and put away, and '
         'the dimming is what says the map is waiting. <b>Not dimmed, and it must not cover the '
         'pin it describes</b> &mdash; the marker sheet and the form.',
         'The dimmed kind can stay the <code>Menu</code> primitive that already exists in '
         '<code>ui.tsx</code>: Escape, outside press and focus-return are not positional, so '
         'they come along for free and <code>TripBar</code>, <code>CityBar</code> and '
         '<code>FilterBar</code> need no changes at all. Only <code>.menuPanel</code> moves, '
         'inside the media query.'], STATES_RAIL)

 + band('03 &nbsp;the worst case', 'Long names, a real number of places, and 320px',
        ['The seed makes one trip, one city and eighteen markers. A layout agreed against that '
         'has not been designed, it has been guessed at &mdash; so everything here carries '
         '<i>Tokyo, Kyoto &amp; Hiroshima — Honeymoon 2026</i> against <i>Higashiyama &amp; Gion '
         'District</i>, which is the arrangement the spec&rsquo;s own test asks for.'], WORST)

 + band('04 &nbsp;the one open choice', 'Dropping a pin was the thing the ticket did not answer',
        ['The ticket says <code>Drop</code> becomes a tool. It does not say what happens after '
         'it is pressed &mdash; and the two applications disagree today. Web arms the map and '
         'asks you to click the spot. The phone raises a sight and asks you to drag the map '
         'under it, because a finger covers the place it is aiming at.',
         'Copying the phone is what you asked for, and I think it is right for the same reason '
         'the phone has it: this is a touchscreen. But it is real new work on web that the '
         'ticket does not scope, so it should be a decision rather than a discovery.'],
        DROPCHOICE + '<div class="ask"><b>decided &mdash; A</b><p>The sight comes to web. That '
        'is a sight overlay fixed at the centre of the map, a confirm row that replaces the '
        'toolbar rather than adding to it, and a read of the camera centre on confirm &mdash; '
        'none of which the ticket scopes, so it is written into the proposal as new work rather '
        'than found during it. B is kept on this board as the record of what was weighed.</p>'
        '</div>')

 + band('05 &nbsp;the camera', 'Why a sheet over the map is a camera problem',
        ['<code>AGENTS.md</code> already records this as a defect that cost real time on the '
         'phone: the camera animates, something visibly happens, and the pin is simply not '
         'there. It reads as the marker failing to render and never is.',
         'You chose the third panel. It needs no new shared code &mdash; <code>fitBounds</code> '
         'has taken a <code>viewport</code> since it was written, and <code>offsetCenter</code> '
         'is already in <code>@pinpoint/map</code> with a comment saying it is waiting for '
         'exactly this. It does need one guard: if the covered height ever reaches the '
         'container height, the zoom comes out <code>NaN</code> and the camera stops being a '
         'camera.'], CAMERA)

 + band('06 &nbsp;both grounds', 'Chosen twice, as everything in this system is',
        ['Every colour here is read from <code>packages/tokens/src/generated/tokens.css</code> '
         'at build time rather than retyped, so this band is the real dark theme and not an '
         'impression of it.'], DARK_RAIL)

 + band('07 &nbsp;on your own phone', 'The part a narrowed desktop window cannot show you',
        ['The two things a resized window does not reproduce are the URL bar collapsing on '
         'scroll and the browser&rsquo;s own bottom chrome. This opens the mock at the real size '
         'of whatever you are reading it on, with <code>100dvh</code> and a real '
         '<code>env(safe-area-inset-bottom)</code>, and prints the inset it actually gets.',
         'On a desktop that number is <code>0px</code> and the page is unremarkable. On an '
         'iPhone it is the answer to whether the toolbar clears the home indicator &mdash; which '
         'is the question behind turning <code>viewportFit: &#39;cover&#39;</code> on at all.'],
        '<button class="golive" data-live="live-idle">Open the idle map full screen</button> '
        '<button class="golive" data-live="live-details">Open it with a place selected</button>')

 + band('08 &nbsp;still open', 'What this mock does not settle',
        ['<b>The middle band.</b> Between 700 and 1024 the bar still wraps onto two lines, '
         'untouched, as its own task. The only thing this change owes it is side padding: '
         'turning edge-to-edge on is what puts the laptop bar under the notch when a phone is '
         'held in landscape, and width alone sends landscape there.',
         '<b>The spec wording.</b> &ldquo;A panel opens beside the control that opened it&rdquo; '
         'stays exactly as written for the laptop; the phone shape gets its own requirement '
         'beside it. That is a document change, and it should be written before any sheet is.'])

 + '</div>'
 + liveshell('idle', 'live-idle') + liveshell('details', 'live-details')
 + '<script>' + JS + '</script>'
)

out = HERE / 'pinpoint-phone-web-mock.html'
out.write_text(PAGE, encoding='utf-8')
print('wrote', out, f'{len(PAGE) / 1024:.0f} KB')
