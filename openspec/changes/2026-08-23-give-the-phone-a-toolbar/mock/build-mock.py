import base64, pathlib

HERE = pathlib.Path(__file__).parent
# Walk up to the repository root and embed the font this project actually ships,
# so the mock cannot drift from the real typeface and needs nothing installed.
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
 'plus':     '<path d="M5 12h14"/><path d="M12 5v14"/>',
 'archive':  '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
 'logout':   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
 'landmark': '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
 'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2z"/>',
 'store':    '<path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/>',
 'train':    '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>',
}
DROP = 'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z'

def ico(name, cls=''):
    return f'<svg viewBox="0 0 24 24" class="{cls}" aria-hidden="true">{I[name]}</svg>'

def pin(x, y, fam, glyph):
    return (f'<span class="pin {fam}" style="left:{x}px;top:{y}px">'
            f'<svg viewBox="0 0 32 42"><path class="drop" d="{DROP}"/>'
            f'<g class="g" transform="translate(8.5 7.5) scale(0.625)">{I[glyph]}</g></svg></span>')

# a little cartography so colour can be judged against real ground
GROUND = (
  '<div class="map">'
  '<div class="water" style="left:-30px;top:250px;width:150px;height:190px;'
  'border-radius:0 60% 40% 0/0 50% 50% 0"></div>'
  '<div class="park" style="left:186px;top:196px;width:118px;height:96px"></div>'
  '<div class="park" style="left:34px;top:452px;width:96px;height:74px"></div>'
  '<div class="road" style="left:0;top:300px;width:320px;height:9px"></div>'
  '<div class="road" style="left:0;top:430px;width:320px;height:6px"></div>'
  '<div class="road" style="left:150px;top:96px;width:8px;height:564px"></div>'
  '<div class="road" style="left:246px;top:96px;width:5px;height:564px"></div>'
  + ''.join(
      f'<div class="block" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"></div>'
      for x,y,w,h in [(24,196,44,34),(78,196,52,28),(24,240,38,44),(76,236,54,40),
                      (168,330,60,36),(238,330,48,52),(168,378,44,34),(268,196,44,60),
                      (24,330,52,40),(88,336,50,34),(262,470,44,40),(178,470,60,34)])
  + pin(64,246,'see','landmark') + pin(104,282,'eat','utensils')
  + pin(196,236,'see','landmark') + pin(172,352,'buy','store')
  + pin(258,300,'move','train') + pin(88,404,'see','landmark')
  + pin(226,414,'see','landmark') + pin(140,470,'eat','utensils')
  + '</div>')

HDR = (f'<div class="hdr"><span class="dot"></span>'
       f'<span class="tripbtn"><span class="trip">Japan</span>'
       f'<svg viewBox="0 0 24 24" class="caret">{I["chevdown"]}</svg></span>'
       f'<span class="burger">{ico("menu")}</span></div>')

def toolbar(narrowed):
    on   = ' on' if narrowed else ''
    pip  = '<span class="pip"></span>' if narrowed else ''
    return (f'<div class="bar"><div class="bar-row">'
            f'<button class="tool">{ico("search")}<span>Search</span></button>'
            f'<button class="tool">{ico("drop")}<span>Drop</span></button>'
            f'<button class="tool{on}">{pip}{ico("sliders")}<span>Filter</span></button>'
            f'</div></div>')

OLD_BAR = ('<div class="old">'
           '<span class="opill">Search</span><span class="opill">Drop</span>'
           '<span class="opill">Filter</span><span class="opill na">Clear</span>'
           '</div>')

def person(name, meta, ticked):
    t = ' tick' if ticked else ''
    m = f'<span class="who-m">{meta}</span>' if meta else ''
    return (f'<div class="who{t}"><span class="box">{ico("check")}</span>'
            f'<span class="who-n">{name}</span>{m}</div>')

def go(name, value=''):
    v = f'<span class="go-v">{value}</span>' if value else ''
    return (f'<div class="go"><span class="go-n">{name}</span>{v}'
            f'<svg viewBox="0 0 24 24" class="chev">{I["chev"]}</svg></div>')

def filter_sheet(narrowed):
    tick_j = narrowed
    sw_on  = ' on' if narrowed else ''
    clear  = ('<button class="clear">Clear</button>' if narrowed
              else '<button class="clear inert">Clear</button>')
    return (
      '<div class="scrim"></div><div class="sheet">'
      '<span class="grab"></span>'
      '<div class="sheet-hd"><h3>Filter</h3><button class="done">Done</button></div>'
      '<div class="sheet-body">'
        '<div class="sec"><p class="sec-t">Show places wanted by</p>'
        + person('You', '', tick_j)
        + person('Julieta', '', tick_j)
        + person('Cristian Aero', '', False)
        + person('Test', 'not joined yet', False)
        + '</div><hr class="rule">'
        '<div class="sec">'
        f'<div class="sw{sw_on}"><span class="sw-n">Hide visited</span>'
        '<span class="track"><span class="knob"></span></span></div>'
        + clear +
        '</div>'
      '</div></div>')

def trip_row(name, current, places):
    tick = f'<span class="cur">{ico("check")}</span>' if current else '<span class="cur"></span>'
    return (f'<div class="trow">{tick}<span class="trow-n">{name}</span>'
            f'<span class="trow-m">{places}</span></div>')

TRIP_SHEET = (
  '<div class="scrim"></div><div class="sheet">'
  '<span class="grab"></span>'
  '<div class="sheet-hd"><h3>Trips</h3><button class="done">Done</button></div>'
  '<div class="sheet-body">'
    '<div class="sec">'
    + trip_row('Japan', True, '18 places')
    + trip_row('Lisbon, maybe', False, '3 places')
    + f'<div class="go new">{ico("plus")}<span class="go-n">New trip</span></div>'
    + '</div><hr class="rule">'
    '<div class="sec"><p class="sec-t">Japan</p>'
    + go('Rename')
    + go('People', '4')
    + go('Cities', '1')
    + f'<div class="go danger">{ico("archive")}<span class="go-n">Archive trip</span></div>'
    + '</div>'
  '</div></div>')

MENU_SHEET = (
  '<div class="scrim"></div><div class="sheet">'
  '<span class="grab"></span>'
  '<div class="acct">'
    '<span class="av">CA</span>'
    '<span><span class="acct-n">Cristian Aero</span>'
    '<span class="acct-e" style="display:block">cristian.ap84@gmail.com</span></span>'
  '</div>'
  '<div class="sheet-body" style="padding:6px 0 26px">'
  f'<div class="out">{ico("logout")}<span>Sign out</span></div>'
  '</div></div>')

def phone(theme, *, bar='new', narrowed=False, sheet=None, tall=False):
    body = GROUND + HDR
    body += OLD_BAR if bar == 'old' else toolbar(narrowed)
    if sheet == 'filter': body += filter_sheet(narrowed)
    if sheet == 'menu':   body += MENU_SHEET
    if sheet == 'trip':   body += TRIP_SHEET
    cls = f'phone {theme}' + (' tall' if tall else '')
    return f'<div class="{cls}">{body}</div>'

def slot(cap, sub, inner):
    s = f' <em>{sub}</em>' if sub else ''
    return f'<div class="slot"><span class="cap">{cap}{s}</span>{inner}</div>'

# ── page ─────────────────────────────────────────────────────────────────────
S = []
S.append('<div class="page"><div class="masthead">'
  '<h1>The phone, with a real toolbar</h1>'
  '<p>Three equal icon buttons at the bottom — <strong>Search</strong>, <strong>Drop</strong>, '
  '<strong>Filter</strong>. <strong>Clear</strong> moves inside the filter sheet, so the Filter '
  'button carries the narrowed state instead. Tapping the <strong>trip name</strong> opens trips: '
  'switch, rename, archive, new. The hamburger keeps only your account and Sign out.</p>'
  '<p>Real tokens, real Figtree, real Lucide icons, real place names from the seeded Kyoto '
  'trip — so the colours and weights are honest. The map underneath is a stand-in: enough '
  'ground to judge the chrome against, not a real map.</p>'
  '<p>Every number here is real: <strong>People 4</strong> is your live trip (You, Julieta, '
  'Cristian Aero, Test); <strong>Cities 1</strong> is Kyoto, the only one the seed creates. '
  'Nothing is padded to look fuller than it is.</p>'
  '<ul class="judge">'
  '<li><b>Worth judging</b>Icon choice, whether targets look big enough, the order of the '
  'three, section grouping, and how long the filter sheet gets.</li>'
  '<li class="no"><b>Not worth judging</b>Drag physics, how it feels one-handed, real safe-area '
  'insets, scroll behaviour. Those only answer honestly on the device.</li>'
  '</ul></div>')

S.append('<h2><span class="n">1</span>Before and after</h2>'
  '<p class="lede">The same screen, today and proposed. Today’s bar is four text pills of equal '
  'weight with outlines that only appear on touch; nothing says which one you came to press.</p>'
  '<div class="rail">'
  + slot('Today', 'four text pills', phone('light', bar='old'))
  + slot('Proposed', 'three icon buttons', phone('light'))
  + slot('Proposed', 'dark', phone('dark'))
  + '</div>'
  '<div class="note"><b>All three weigh the same</b>, as you asked. The trip name now carries a '
  'caret to say it opens something — it is the only new affordance in the header.</div>')

S.append('<h2><span class="n">2</span>Filtered, and how you can tell</h2>'
  '<p class="lede">With a filter on, the Filter button carries the state: a dot, a tinted mark and '
  'the accent — three signals, so it survives greyscale and colour blindness. That matters because '
  '<strong>Clear</strong> now lives inside the sheet, so the button is the only thing left saying '
  '“you are not seeing everything”.</p>'
  '<div class="rail">'
  + slot('Nothing hidden', 'Clear is inert', phone('light', narrowed=False))
  + slot('Filter applied', 'dot + accent', phone('light', narrowed=True))
  + slot('Filter applied', 'dark', phone('dark', narrowed=True))
  + '</div>')

S.append('<h2><span class="n">3</span>The filter sheet</h2>'
  '<p class="lede">Only what narrows the map: who wants to go, whether to hide visited, and the way '
  'out. <b>Clear</b> is inert until something is actually hidden.</p>'
  '<div class="rail">'
  + slot('Nothing applied', 'Clear inert', phone('light', sheet='filter', narrowed=False))
  + slot('Two people ticked', 'Clear live', phone('light', sheet='filter', narrowed=True))
  + slot('Two people ticked', 'dark', phone('dark', sheet='filter', narrowed=True))
  + '</div>'
  '<div class="note"><b>This solved the naming problem.</b> With trips moved to the header, the '
  'sheet holds only filtering — so calling the button <b>Filter</b> is now an honest promise, and '
  'the sheet is short enough to fit on a real screen without scrolling.</div>')

S.append('<h2><span class="n">4</span>Trips — from the trip name</h2>'
  '<p class="lede">Tapping <b>Japan</b> in the header opens this. The list is the switcher — tap a '
  'row to change trip — and everything else about a trip lives underneath it. <b>Archive</b> is the '
  'answer to “delete a trip”; your schema already has the column and no delete policy anywhere, so '
  'this needs no migration.</p>'
  '<div class="rail">'
  + slot('Trips', 'light', phone('light', sheet='trip'))
  + slot('Trips', 'dark', phone('dark', sheet='trip'))
  + '</div>'
  '<div class="note"><b>The second trip is invented, and only here.</b> “Lisbon, maybe” and its '
  '3 places exist so a list of trips has something to be a list of — you have one real trip. '
  '<b>Japan’s 18 places is real</b>: the seed inserts 18 markers, which draw as 16 pins because two '
  'pairs share a coordinate and stack under a count badge. Every other number on this page is real '
  'too.</div>')

S.append('<h2><span class="n">5</span>The hamburger</h2>'
  '<p class="lede">Your account and the way out. Note there is no first/last name in the data — a '
  'member has one <code>displayName</code> they chose, so it is one line, not two.</p>'
  '<div class="rail">'
  + slot('Account', 'light', phone('light', sheet='menu'))
  + slot('Account', 'dark', phone('dark', sheet='menu'))
  + '</div>')

S.append('</div></body></html>')

head = (HERE / 'parts' / 'head.html').read_text().replace('__FONT__', FONT)
style2 = (HERE / 'parts' / 'style2.html').read_text()
out = HERE / 'pinpoint-toolbar-mock.html'
out.write_text(head + style2 + ''.join(S), encoding='utf-8')
print('wrote', out, f'({out.stat().st_size // 1024} KB)')
