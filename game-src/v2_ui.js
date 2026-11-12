
  // ===================== inventory, map, speech bubbles, wardrobe and looting =====================
  var UI = { bag: false, map: false, cat: 'all', q: '', sel: null };
  (function uiCSS() {
    var css = document.createElement('style');
    css.textContent =
      '.hbtn{padding:6px 10px;background:var(--panel);border:1px solid var(--neon);border-radius:4px;color:var(--neon);font:inherit;font-size:11px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
      '#mini{position:fixed;top:44px;right:10px;width:124px;height:124px;z-index:6;border:1px solid rgba(61,242,224,.35);border-radius:8px;background:rgba(8,9,15,.72);cursor:pointer}' +
      '#mapFull,#bag{position:fixed;inset:10px;z-index:30;display:none;background:#0b0c13;border:1px solid rgba(61,242,224,.4);border-radius:12px;color:#e8f4f4;font-size:13px}' +
      '#mapFull.on,#bag.on{display:flex}#mapFull{flex-direction:column;align-items:center}#mapFull header,#bag header{display:flex;align-items:center;gap:8px;padding:9px 12px;width:100%;box-sizing:border-box;border-bottom:1px solid rgba(255,255,255,.08)}' +
      '#mapFull header b,#bag header b{flex:1;color:var(--hot);font-size:12px;letter-spacing:.14em;text-transform:uppercase}.xbtn{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:6px;padding:4px 10px;font:inherit;cursor:pointer}' +
      '#mapC{flex:1;width:100%;min-height:0;touch-action:none;cursor:grab}#mapTools{position:absolute;right:12px;bottom:12px;display:flex;flex-direction:column;gap:8px}#mapTools button{width:44px;height:44px;border-radius:10px;border:1px solid rgba(61,242,224,.45);background:rgba(11,12,19,.85);color:#e8f4f4;font-size:20px}#mapFull{position:fixed}#mapLeg.hide{display:none}@media (max-width:700px){#mapLeg{font-size:10.5px;gap:9px}}#mapLeg{padding:6px 12px 10px;color:#9ab;font-size:11.5px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center}#mapLeg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}' +
      '#bag{flex-direction:column}#bagTools{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06)}#bagQ{flex:1;min-width:140px;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:7px 9px;font:inherit}' +
      '#bagTools .chip2{padding:6px 9px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:none;color:#cde;font:inherit;font-size:11.5px;cursor:pointer}#bagTools .chip2.on{border-color:var(--hot);color:#fff;background:rgba(255,62,165,.14)}' +
      '#bagBody{flex:1;display:flex;min-height:0}#bagList{flex:1.2;overflow-y:auto;padding:6px}#bagList button{display:flex;width:100%;gap:8px;align-items:center;text-align:left;background:none;border:1px solid transparent;border-radius:8px;color:#e8f4f4;padding:7px 8px;font:inherit;cursor:pointer}' +
      '#bagList button.on{border-color:var(--neon);background:rgba(61,242,224,.08)}#bagList small{color:#8ab}#bagList .tag{margin-left:auto;font-size:10px;color:var(--hot);text-transform:uppercase;letter-spacing:.08em}' +
      '.ico{flex:0 0 auto;background:rgba(255,255,255,.05);border-radius:6px;padding:2px}#bagInfo .big .ico{padding:6px;margin-bottom:6px}#bagInfo{flex:1;overflow-y:auto;padding:10px 14px;border-left:1px solid rgba(255,255,255,.06)}#bagInfo h3{margin:0 0 4px;color:var(--hot);font-size:13px}#bagInfo p{margin:4px 0 10px;line-height:1.45;color:#cde}#bagInfo .acts{display:flex;gap:6px;flex-wrap:wrap}' +
      '.bub{position:fixed;z-index:7;transform:translate(-50%,-100%);max-width:220px;padding:6px 9px;border-radius:10px;background:rgba(255,255,255,.94);color:#14151c;font-size:12px;line-height:1.35;pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,.5)}' +
      '.bub:after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:rgba(255,255,255,.94)}.bub.npc{background:rgba(255,236,250,.95)}.bub.npc:after{border-top-color:rgba(255,236,250,.95)}' +
      '.bub.lt{transform:translate(-88%,-100%)}.bub.lt:after{left:88%}.bub.wh{background:rgba(30,32,44,.92);color:#bcd;font-style:italic;border:1px dashed rgba(255,255,255,.3)}.bub.wh:after{border-top-color:rgba(30,32,44,.92)}' +
      '#tWh{display:flex;align-items:center;gap:4px;color:#9ab;font-size:11.5px;white-space:nowrap}';
    document.head.appendChild(css);
    var stats = document.getElementById('stats'), gb = document.getElementById('gearBtn');
    [['bagBtn', 'Bag', function () { bagToggle(); }], ['mapBtn', 'Map', function () { mapToggle(); }]].forEach(function (b) {
      var el = document.createElement('button'); el.type = 'button'; el.id = b[0]; el.className = 'hbtn'; el.textContent = b[1]; el.onclick = b[2]; stats.insertBefore(el, gb);
    });
    var mini = document.createElement('canvas'); mini.id = 'mini'; mini.setAttribute('aria-label', 'Minimap: tap for the full map'); mini.onclick = function () { mapToggle(); }; document.body.appendChild(mini);
    var mf = document.createElement('div'); mf.id = 'mapFull'; mf.setAttribute('role', 'dialog'); mf.setAttribute('aria-label', 'Floor map');
    mf.innerHTML = '<header><b>' + (FLOOR === 2 ? 'Floor 2 map · The Backlot' : 'Floor 1 map') + '</b><button type="button" class="xbtn" id="mapDM">DM</button><button type="button" class="xbtn" id="mapKey">Key</button><button type="button" class="xbtn" id="mapX">Close</button></header><canvas id="mapC" aria-label="Map: pinch or scroll to zoom, drag to move"></canvas>' +
      '<div id="mapTools"><button type="button" id="mapIn" aria-label="Zoom in">+</button><button type="button" id="mapOut" aria-label="Zoom out">−</button><button type="button" id="mapMe" aria-label="Center on me" style="font-size:15px">◎</button></div>' +
      '<div id="mapLeg" class="' + (innerWidth < 700 ? 'hide' : '') + '"><span><i style="background:#3df2e0"></i>You</span><span><i style="background:#ff4a6a"></i>Hostile</span><span><i style="background:#5f6"></i>Friendly</span><span><i style="background:#ffd34a"></i>Stairs</span><span><i style="background:#c98a4a"></i>Door</span><span><i style="background:#e0c060"></i>Loot box</span><span>✚ Safe room</span><span>☠ Boss</span><span>▼ Stairs</span><span>★ Secret</span></div>';
    document.body.appendChild(mf); document.getElementById('mapX').onclick = mapToggle; document.getElementById('mapDM').onclick = dmPanel; mapControls();
    var bag = document.createElement('div'); bag.id = 'bag'; bag.setAttribute('role', 'dialog'); bag.setAttribute('aria-label', 'Inventory');
    document.body.appendChild(bag);
    var bubs = document.createElement('div'); bubs.id = 'bubs'; document.body.appendChild(bubs);
  })();

  // ---------- map ----------
  // full map view: zoom 1 = whole explored floor fits; pinch / scroll / buttons zoom, drag pans, ◎ recentres on you
  var MAPV = { zoom: 1, panX: 0, panZ: 0, follow: false };
  function mapControls() {
    var cv = document.getElementById('mapC'), pts = {}, last = null;
    function redraw() { if (UI.map) mapDraw(cv, true); }
    function zoomBy(f) { MAPV.zoom = Math.max(1, Math.min(14, MAPV.zoom * f)); if (MAPV.zoom === 1) { MAPV.panX = MAPV.panZ = 0; MAPV.follow = false; } redraw(); }
    function pan(dx, dy) { // screen pixels -> map tiles (undo the rotation)
      var k = MAPV.k || 1, ya = MAPV.ya || Math.PI / 4, yc = Math.cos(ya) * 1.4142, ys = Math.sin(ya) * 1.4142, sx = dx / k, sy = dy / k, det = yc * yc + ys * ys;
      MAPV.follow = false; MAPV.panX -= (sx * yc + sy * ys) / det; MAPV.panZ -= (-sx * ys + sy * yc) / det; redraw();
    }
    document.getElementById('mapIn').onclick = function () { zoomBy(1.6); };
    document.getElementById('mapOut').onclick = function () { zoomBy(1 / 1.6); };
    document.getElementById('mapMe').onclick = function () { MAPV.follow = true; if (MAPV.zoom < 4) MAPV.zoom = 4; redraw(); };
    document.getElementById('mapKey').onclick = function () { document.getElementById('mapLeg').classList.toggle('hide'); setTimeout(redraw, 0); };
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; last = null; });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var prev = pts[e.pointerId]; pts[e.pointerId] = [e.clientX, e.clientY]; var ids = Object.keys(pts);
      if (ids.length >= 2) { var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) zoomBy(d / last); last = d; }
      else pan((e.clientX - prev[0]) * (window.devicePixelRatio || 1), (e.clientY - prev[1]) * (window.devicePixelRatio || 1));
    });
    function up(e) { delete pts[e.pointerId]; last = null; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  function mapDraw(cv, full) {
    var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, chh = cv.clientHeight; if (!cw || !chh) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); }
    var g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    // rotated 45 degrees to match the isometric camera (map +x+z is screen down)
    var bx0 = W, bx1 = 0, bz0 = H, bz1 = 0, upMe = !!LEVEL.upZ && P.z >= LEVEL.upZ;
    if (full) { for (var q = 0; q < W * H; q++) if (tileState[q] && (!LEVEL.upZ || ((q / W | 0) >= LEVEL.upZ) === upMe)) { var qx = q % W, qz = (q / W) | 0; if (qx < bx0) bx0 = qx; if (qx > bx1) bx1 = qx; if (qz < bz0) bz0 = qz; if (qz > bz1) bz1 = qz; } bx0 -= 4; bz0 -= 4; bx1 += 4; bz1 += 4; }
    var span = full ? Math.max(18, ((bx1 - bx0) + (bz1 - bz0)) / Math.SQRT2) / MAPV.zoom : 26, s = Math.min(cw, chh) / span * (full ? 0.97 : 1.0), k = s / Math.SQRT2 * dpr;
    var ox = cv.width / 2, oy = cv.height / 2, cx = full ? (bx0 + bx1) / 2 : P.px, cz = full ? (bz0 + bz1) / 2 : P.pz;
    if (full) { if (MAPV.follow) { MAPV.panX = P.px - cx; MAPV.panZ = P.pz - cz; } cx += MAPV.panX; cz += MAPV.panZ; }
    var ya = typeof CAMV !== 'undefined' ? Math.PI / 4 + CAMV.yaw * Math.PI / 2 : Math.PI / 4, yc = Math.cos(ya) * 1.4142, ys = Math.sin(ya) * 1.4142;
    if (full) { MAPV.k = k; MAPV.ya = ya; }
    var tpx = k * 2; // on-screen size of one tile, in device pixels
    function tr(x, z) { var dx = x - cx, dz = z - cz; return [ox + (dx * yc - dz * ys) * k, oy + (dx * ys + dz * yc) * k]; }
    function cell(x, z, col) { var a = tr(x - .5, z - .5), b = tr(x + .5, z - .5), c = tr(x + .5, z + .5), d = tr(x - .5, z + .5); g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
    var liv = hasTrait('Living Map'), R = full ? 1e9 : 20, THEME = { crypt: '#3f6a52', hall: '#5d5a54', moss: '#4f6a3a', gate: '#6a3e3a', store: '#6a5438', water: '#2f5a74', studio: '#7a8494', office: '#4a566a', bazaar: '#8a6e48', garden: '#3f7a34', arena: '#a08250', blvd: '#6a665e' };
    for (var z = Math.max(0, Math.floor(P.pz - R)); z < Math.min(H, P.pz + R); z++) for (var x = Math.max(0, Math.floor(P.px - R)); x < Math.min(W, P.px + R); x++) {
      if (!tileState[z * W + x] || (LEVEL.upZ && (z >= LEVEL.upZ) !== upMe)) continue; var c = MAP[z].charAt(x), lit = visNow[x + ',' + z] !== undefined || liv;
      if (c === '#' || c === 'H') { if (!full) { g.globalAlpha = lit ? 1 : .6; cell(x, z, '#23252f'); } continue; }
      var col = c === '~' ? '#3a6ea8' : c === 'D' ? '#c98a4a' : c === 'S' ? (stairsOpen() ? '#ffd34a' : '#5d5a54') : c === 'C' ? '#e0c060' : c === 'F' ? '#40ff90' : c === 'Y' ? '#2a5a24' : THEME[roomAt(x, z)] || '#5d5a54';
      g.globalAlpha = lit ? 1 : .62; cell(x, z, col);
    }
    g.globalAlpha = 1;
    function dot(x, z, col, r) { var p = tr(x, z); g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], r * dpr, 0, 7); g.fill(); }
    CB.enemies.forEach(function (e) { if (e.dead || visNow[e.x + ',' + e.z] === undefined) return; dot(e.px, e.pz, e.calm ? '#5f6' : '#ff4a6a', full ? 3.5 : 2.6); });
    dot(P.px, P.pz, '#3df2e0', full ? 4.5 : 3.2);
    if (full) mapLabels(g, tr, tpx, dpr, cv);
  }
  // labels that fit the zoom: zone names when zoomed out, important rooms next, every room name once there is room;
  // fixed screen size, never overlapping, higher priority wins
  function mapLabels(g, tr, tpx, dpr, cv) {
    var L = [], seenRoom = function (rm) { for (var zz = rm.z0; zz <= rm.z1; zz++) for (var xx = rm.x0; xx <= rm.x1; xx++) if (tileState[zz * W + xx]) return true; return false; };
    var zoneView = tpx < 8; // zoomed out: zone names; zoomed in: room names
    var upL = !!LEVEL.upZ && P.z >= LEVEL.upZ;
    if (zoneView && !upL) LEVEL.hoods.forEach(function (hd) { if (hd.x0 === undefined) return;
      var any = hd.rooms.some(function (rm) { return tileState[((rm.z0 + rm.z1) >> 1) * W + ((rm.x0 + rm.x1) >> 1)]; }); if (!any) return;
      L.push({ t: hd.name.toUpperCase(), x: (hd.x0 + hd.x1) / 2, z: (hd.z0 + hd.z1) / 2, pri: 5, size: 12.5, bold: true, col: 'rgba(255,62,165,.92)', clamp: true });
    });
    LEVEL.rooms.forEach(function (rm) { if (LEVEL.upZ && (rm.z0 >= LEVEL.upZ) !== upL) return;
      if (rm.type === 'corridor') return; var key = rm.type === 'safe' || rm.type === 'boss' || rm.type === 'stairs' || rm.type === 'hidden';
      var w = Math.max(rm.x1 - rm.x0, rm.z1 - rm.z0) + 1; if (!key && (zoneView || tpx * w < 70)) return; // ordinary rooms only once they're big enough on screen
      if (!seenRoom(rm) && !(key && rm.type === 'safe' && hasTrait('Living Map') && CHAR && CHAR.zones && CHAR.zones[rm.hood])) return;
      var icon = rm.type === 'safe' ? '✚' : rm.type === 'boss' ? '☠' : rm.type === 'stairs' ? (stairsOpen() ? '▼' : '?') : rm.type === 'hidden' ? '★' : '';
      var t = key && tpx < 6 ? icon : (icon ? icon + ' ' : '') + rm.name; // far out, key rooms shrink to their icon
      L.push({ t: t, x: (rm.x0 + rm.x1) / 2, z: (rm.z0 + rm.z1) / 2, pri: rm.type === 'boss' || rm.type === 'stairs' ? 4 : key ? 3 : 1, size: key && tpx < 6 ? 13 : 10.5, bold: key,
        col: rm.type === 'safe' ? '#7dffb0' : rm.type === 'boss' ? '#ff7a8a' : rm.type === 'stairs' ? '#ffd34a' : rm.type === 'hidden' ? '#c9a8ff' : '#dde' });
    });
    L.sort(function (a, b) { return b.pri - a.pri; });
    var placed = [], pad = 3 * dpr; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach(function (l) {
      var p = tr(l.x, l.z); g.font = (l.bold ? 'bold ' : '') + (l.size * dpr) + 'px ui-monospace,monospace';
      var w = g.measureText(l.t).width, h = l.size * dpr * 1.25; if (l.clamp) p[0] = Math.max(w / 2 + 6 * dpr, Math.min(cv.width - w / 2 - 6 * dpr, p[0]));
      var r = [p[0] - w / 2 - pad, p[1] - h / 2 - pad, p[0] + w / 2 + pad, p[1] + h / 2 + pad];
      if (r[2] < 0 || r[0] > cv.width || r[3] < 0 || r[1] > cv.height) return;
      if (placed.some(function (q) { return r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]; })) return;
      placed.push(r); g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 3 * dpr; g.fillStyle = l.col; g.strokeText(l.t, p[0], p[1]); g.fillText(l.t, p[0], p[1]);
    });
  }
  function mapToggle() {
    UI.map = !UI.map; if (UI.map && UI.bag) bagToggle(); document.getElementById('mapFull').classList.toggle('on', UI.map);
    if (UI.map) mapDraw(document.getElementById('mapC'), true);
  }
  setInterval(function () { if (typeof P === 'undefined') return; var m = document.getElementById('mini'); m.style.display = gearOpen || CC || AUTH.open ? 'none' : ''; if (m.style.display !== 'none') mapDraw(m, false); if (UI.map) mapDraw(document.getElementById('mapC'), true); }, 250);

  // ---------- inventory ----------
  var CATS = [['all', 'All'], ['weapon', 'Weapons'], ['clothing', 'Clothing'], ['tool', 'Tools'], ['consumable', 'Consumables'], ['valuable', 'Valuables'], ['material', 'Materials'], ['body', 'Bodies'], ['misc', 'Misc']];
  function bagItems() { return CHAR && CHAR.gear ? CHAR.gear : []; }
  function bagToggle() {
    UI.bag = !UI.bag; if (UI.bag && UI.map) mapToggle(); document.getElementById('bag').classList.toggle('on', UI.bag);
    if (UI.bag) bagDraw();
  }
  function bagDraw() {
    var el = document.getElementById('bag'), items = bagItems(), q = UI.q.toLowerCase();
    var list = items.map(function (it, i) { return { it: it, i: i }; }).filter(function (o) { return (UI.cat === 'all' || o.it.cat === UI.cat) && (!q || (o.it.name + ' ' + (o.it.desc || '')).toLowerCase().indexOf(q) >= 0); });
    // identical things stack into one tile with a count (worn clothes stay separate)
    // the one in your hand and the one on your back peel off the stack and stand alone
    var wIt = wieldItem(), bIt = backItem();
    var groups = {}, glist = []; list.forEach(function (o) { var k = o.it.worn ? 'w' + o.i : o.it === wIt ? '#hand' : o.it === bIt ? '#back' : o.it.name; if (groups[k]) { groups[k].n += (o.it.qty || 1); groups[k].all.push(o.i); if (UI.sel === o.i) groups[k].i = o.i; } else { groups[k] = { it: o.it, i: o.i, n: o.it.qty || 1, all: [o.i], k: k }; glist.push(groups[k]); } });
    list = glist;
    if (UI.sel !== null && !items[UI.sel]) UI.sel = null;
    var sel = UI.sel !== null ? items[UI.sel] : null;
    var worn = function (slot) { return items.filter(function (g) { return g.worn && g.slot === slot; })[0]; }, w = wieldItem(), bk = backItem();
    var slotBtn = function (lbl, it, cls, empty) { var i = it ? items.indexOf(it) : -1; return '<button type="button" class="eqs ' + (cls || '') + (it ? '' : ' empty') + (i >= 0 && UI.sel === i ? ' on' : '') + '"' + (i >= 0 ? ' data-i="' + i + '"' : ' disabled') + '><small>' + lbl + '</small>' + (it ? esc(it.name) + (it.dmg ? '<em>' + esc(it.dmg) + '</em>' : '') : '<em>' + (empty || 'empty') + '</em>') + '</button>'; };
    el.innerHTML = '<header><b>Inventory</b><span class="gp">' + (CHAR && CHAR.gold || 0) + ' gp</span><button type="button" class="xbtn" id="bagCraft">Jury-rig</button><button type="button" class="xbtn" id="bagSheet">Character</button><button type="button" class="xbtn" id="bagX">Close</button></header>' +
      '<div id="bagBody"><div class="eq">' +
        '<div class="eqL">' + slotBtn('Head', worn('kHead')) + slotBtn('Body', worn('kTop')) + slotBtn('Legs', worn('kPants')) + slotBtn('Feet', worn('kBoots')) + (function () { var l = lampWorn(), i = l ? items.indexOf(l) : -1; return '<button type="button" class="eqs' + (l ? '' : ' empty') + (i >= 0 && UI.sel === i ? ' on' : '') + '"' + (i >= 0 ? ' data-i="' + i + '"' : ' disabled') + '><small>Head light</small>' + (l ? esc(l.name) + '<em>' + (l.lit ? 'on' : 'off') + ' · ' + (l.charge === undefined ? 100 : l.charge) + '%</em>' : '<em>none</em>') + '</button>'; })() + '</div>' +
        '<div class="eqC"><canvas id="heroPic" width="180" height="270" role="img" aria-label="Your crawler as they look now"></canvas><span class="eqStat">AC ' + pcAC().ac + ' · HP ' + PC.hp + '/' + PC.max + '</span></div>' +
        '<div class="eqR">' + slotBtn('Main hand', w, 'main', 'fists') + '<button type="button" class="eqSwap" id="bagSwap"' + (bk ? '' : ' disabled') + '><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M7 4v14l-3-3M17 20V6l3 3"/></svg>Swap</button>' + slotBtn('On back', bk, '', 'nothing') +
          '<div class="eqs empty"><small>Off hand</small><em>' + (typeof sty === 'function' && sty('off') === 2 ? 'Torch (lit)' : 'empty') + '</em></div></div>' +
        '<p class="eqHint">Tap an item, then Wield or Wear on back. Swap is free once a turn.</p></div>' +
      '<div class="pk"><div id="bagTools"><input id="bagQ" type="search" placeholder="Search" aria-label="Search items" value="' + esc(UI.q) + '">' +
      CATS.map(function (c) { return '<button type="button" class="chip2' + (UI.cat === c[0] ? ' on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div id="bagList">' + (list.length ? list.map(function (o) {
        var t = o.it.worn ? 'worn' : o.k === '#hand' ? 'in hand' : o.k === '#back' ? 'on back' : '';
        return '<button type="button" data-i="' + o.i + '" class="' + (o.all.indexOf(UI.sel) >= 0 ? 'on' : '') + (o.it.rarity ? ' r-' + String(o.it.rarity).toLowerCase() : '') + (o.it.bonus ? ' magic' : '') + '">' + itemIcon(o.it) + '<span>' + esc(o.it.name) + '</span>' + (o.n > 1 ? '<b class="qn">×' + o.n + '</b>' : '') + (t ? '<span class="tag">' + t + '</span>' : '') + '</button>';
      }).join('') : '<p style="padding:10px">' + (items.length ? 'Nothing matches.' : (CHAR ? 'Your pockets are empty. Loot something.' : 'Create a character to get your starting gear.')) + '</p>') + '</div>' +
      '<div id="bagInfo">' + (sel ? bagInfo(sel) : '<p>Pick an item to see what it does.</p>') + '</div></div></div>';
    document.getElementById('bagSwap').onclick = swapWeapons;
    document.getElementById('bagSheet').onclick = function () { bagToggle(); charToggle(); };
    document.getElementById('bagCraft').onclick = function () { bagToggle(); craftToggle(); };
    setTimeout(function () { var cv = document.getElementById('heroPic'); if (cv) heroShot(cv); }, 30);
    document.getElementById('bagX').onclick = bagToggle;
    var qi = document.getElementById('bagQ'); qi.oninput = function () { UI.q = qi.value; var pos = qi.selectionStart; bagDraw(); var n = document.getElementById('bagQ'); n.focus(); n.setSelectionRange(pos, pos); };
    qi.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    el.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { UI.cat = b.dataset.cat; bagDraw(); }; });
    el.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { UI.sel = +b.dataset.i; bagDraw(); }; });
    el.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () { bagAct(b.dataset.act, sel); }; });
  }
  function catName(c) { var f = CATS.filter(function (x) { return x[0] === c; })[0]; return f ? f[1].replace(/s$/, '') : 'Misc'; }
  function bagInfo(it) {
    var acts = [];
    if (it.cat === 'weapon' && it.dmg) acts.push(CHAR.wield === it.name ? ['unwield', 'Put away'] : ['wield', 'Wield']);
    if (canBack(it) && CHAR.wield !== it.name) acts.push(CHAR.back === it.name ? ['unback', 'Take off back'] : ['back', 'Wear on back']);
    if (it.cat === 'clothing') acts.push(it.worn ? (clothNone(it.slot) ? ['unwear', 'Take off'] : null) : ['wear', 'Wear']);
    if (it.cat === 'body') acts.push(['drop', 'Drop it here']);
    acts = acts.concat(lampActs(it));
    if (!it.throw && burnsKnown(it)) acts.push(['light', 'Light it and throw']);
    if ((it.cat === 'consumable' && (it.heal || it.buff)) || it.throw || it.escape || burnsKnown(it)) acts.push(hotHas(it.name) ? ['unhot', 'Take off hot bar'] : ['hot', 'Put on ' + (hotKind(it) === 'eat' ? 'Consumables' : 'Gear') + ' bar']); if (loreHidden(it).length) acts.push(['inspect', 'Inspect (INT + Alchemy)']);
    if (it.throw || it.escape || it.box || (it.buff && !it.heal)) { acts.push(['use', it.box ? 'Open (safe room)' : it.escape ? 'Use (escape a fight)' : it.throw ? 'Throw' + (it.uses ? ' (' + (it.usesLeft === undefined ? it.uses : it.usesLeft) + ' left)' : '') : 'Use']); }
    if (it.cat === 'consumable' && it.heal) { acts.push(['use', 'Use (' + it.heal + ' HP)']); }
    return '<h3>' + esc(it.name) + '</h3><p>' + esc(it.desc || 'No description. The System could not be bothered.') + '</p>' +
      loreLine(it) + (it.bonus ? '<p><b style="color:#7A1F1A">Enchanted · +' + it.bonus + ' to hit and damage</b></p>' : '') +
      '<p><small>' + (it.rarity ? esc(it.rarity) + ' · ' : '') + esc(catName(it.cat)) + (it.dmg ? ' · damage ' + esc(it.dmg) : '') + (it.slot ? ' · ' + esc(slotLabel(it.slot)) : '') + (it.from ? ' · from ' + esc(it.from) : '') + (isLamp(it) ? ' · battery ' + (it.charge === undefined ? 100 : it.charge) + '%' + (it.worn ? (it.lit ? ' · on' : ' · off') : '') : '') + '</small></p>' +
      '<div class="acts">' + acts.filter(Boolean).map(function (a) { return '<button type="button" class="ccBtn" data-act="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  }
  function bagAct(a, it) {
    if (!it) return;
    if (a === 'back') { if (CHAR.wield === it.name && (CHAR.gear || []).filter(function (g) { return g.name === it.name; }).length < 2) CHAR.wield = null; CHAR.back = it.name; buildHero(); say('On your back · ' + it.name, 'Swap to it any time. In a fight the first swap each turn is free.', 3000); }
    if (a === 'unback') { CHAR.back = null; buildHero(); }
    if (a === 'wield') { if (CHAR.back === it.name && (CHAR.gear || []).filter(function (g) { return g.name === it.name; }).length < 2) CHAR.back = CHAR.wield || null; CHAR.wield = it.name; buildHero(); say('In hand · ' + it.name, 'You will fight with it: ' + it.dmg + ' damage.', 3000); }
    if (a === 'unwield') { CHAR.wield = null; buildHero(); }
    if (a === 'wear') wear(it);
    if (a === 'unwear') { it.worn = false; look[it.slot] = [0, 0]; buildHero(); saveLook(); }
    if (/^lamp/.test(a)) lampAct(a, it);
    if (a === 'inspect') loreInspect(it);
    if (a === 'use') useItem(it);
    if (a === 'drop') dropBody(it);
    if (a === 'hot') { hotPut(it.name); }
    if (a === 'unhot') hotOff(it.name);
    if (a === 'light') { aimStart(it, true); return; }
    saveChar(CHAR); bagDraw(); wsetDraw();
  }
  // ---------- whole bodies: DCC-style, you can carry a corpse. Keeps it from the shrubs; drop it later as bait, or sell it ----------
  function stashBody(e) {
    if (!CHAR || !e || !e.dead || e.eaten || e.npc) return;
    var L = e.lootStore ? e.lootStore : rollDrops(e.kind, e.def.base), RD = DROPS.monsters[e.kind] || {};
    if (!e.lootStore && RD.oneOf && RD.oneOf.length) { var pk = item(RD.oneOf[Math.floor(Math.random() * RD.oneOf.length)]); if (pk) L.items.push(pk); }
    e.eaten = true; e.claimed = false; e.obj.visible = false; e.bar.style.display = 'none'; e.looted = true;
    (L.items || []).forEach(function (it) { it.from = it.from || e.name; invAdd(it, true); }); CHAR.gold = (CHAR.gold || 0) + (L.gold || 0);
    CHAR.gear.push({ name: e.name + ' (body)', cat: 'body', body: e.n, desc: 'A whole ' + e.name.toLowerCase() + ', folded to fit. Shrubs would kill for it. Someone in the Underbazaar might pay for it. Drop it to use it as bait.' });
    kitOneShot('PickUp_Table'); skillCount('stash'); saveChar(CHAR); if (typeof worldSave === 'function') worldSave();
    var got = (L.items || []).length + (L.gold ? 1 : 0);
    say('Stashed · ' + e.name, 'Into the bag it goes' + (got ? ', along with what it was carrying' + (L.gold ? ' (' + L.gold + ' gold)' : '') : '') + '. The System approves: nothing wasted.', 4500);
  }
  function dropBody(it) {
    var e = CB.enemies.filter(function (q) { return q.n === it.body; })[0]; if (!e) return;
    var spot = null; for (var r = 1; r <= 2 && !spot; r++) for (var dz = -r; dz <= r && !spot; dz++) for (var dx = -r; dx <= r && !spot; dx++) { var x = P.x + dx, z = P.z + dz; if ((dx || dz) && !blocksMove(x, z) && !enemyAt(x, z)) spot = [x, z]; }
    if (!spot) { say('No room', 'There is nowhere to put it down here.', 2500); return; }
    e.x = spot[0]; e.z = spot[1]; e.px = spot[0]; e.pz = spot[1]; e.obj.position.set(spot[0], 0, spot[1]); e.eaten = false; e.claimed = false; e.path = null;
    if (e.mixer && e.clips && e.clips.Death01) { e.cur = ''; cbPlay(e, 'Death01', true); }
    CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; saveChar(CHAR); if (typeof worldSave === 'function') worldSave(); refreshFog();
    say('Dropped · ' + e.name, 'It flops onto the floor. Anything hungry nearby will notice.', 3500);
  }
  // ---------- consumables and the hot bar: four quick slots; in a fight using one is your bonus action ----------
  var HOT_N = 5;
  function heals(it) { var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(it.heal || ''); return (m ? d(+m[1], +m[2]) + (+m[3] || 0) : +it.heal || 1) + healSkillBonus(it); }
  function useItem(it) {
    if (!CHAR || !it || CHAR.dead) return false;
    if (it.throw || it.escape || it.box || (it.buff && !it.heal)) return itemSpecial(it);
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.bonus)) { say('Not now', 'In a fight, using an item takes your bonus action, on your turn.', 2500); return false; }
    if (CB.on) CB.res.bonus = 0;
    var h = heals(it), before = PC.hp; PC.hp = Math.min(PC.max, PC.hp + h); skillCount(/gauze|bandage|potion|kit|salve|medic/i.test(it.name) ? 'heal' : 'eat');
    if (typeof floater === 'function') floater(P.px, 1.6, P.pz, '+' + (PC.hp - before), 'heal'); kitOneShot('PickUp_Table');
    say('Used · ' + it.name, '+' + (PC.hp - before) + ' HP' + (CB.on ? ' (bonus action).' : '.'), 2600);
    if (it.buff) buffOn(it.buff, 10 * 60000);
    it.qty = (it.qty || 1) - 1; if (it.qty <= 0) { CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; }
    if (it.leaves) { var lv = item(it.leaves, { from: 'what was left' }); if (lv) invAdd(lv, true); }
    saveChar(CHAR); cbHUD(); hotDraw(); if (UI.bag) bagDraw(); if (CB.on && typeof cbShowMoves === 'function') cbMenuClose();
    return true;
  }
  // two hot bars: Consumables (eat and drink: a bonus action) and Gear (throw, light, use: an action)
  function hotKind(it) { return it && it.cat === 'consumable' && (it.heal || it.buff) && !it.throw && !it.escape ? 'eat' : 'gear'; }
  function hotKey(kind) { return kind === 'eat' ? 'hotbar' : 'hotbar2'; }
  function hotPut(name, quiet) {
    var it = (CHAR.gear || []).filter(function (g) { return g.name === name; })[0], k = hotKey(hotKind(it)), o = k === 'hotbar' ? 'hotbar2' : 'hotbar';
    CHAR[k] = CHAR[k] || []; while (CHAR[k].length < HOT_N) CHAR[k].push(null);
    if (CHAR[o]) CHAR[o] = CHAR[o].map(function (n) { return n === name ? null : n; });
    if (CHAR[k].indexOf(name) >= 0) return; var i = CHAR[k].indexOf(null);
    if (i < 0) { if (!quiet) say('Hot bar full', 'Take something off the ' + (k === 'hotbar' ? 'Consumables' : 'Gear') + ' bar first (in your inventory).', 2600); return; }
    CHAR[k][i] = name; saveChar(CHAR); hotDraw();
  }
  function hotOff(name) { ['hotbar', 'hotbar2'].forEach(function (k) { CHAR[k] = (CHAR[k] || []).map(function (n) { return n === name ? null : n; }); }); hotDraw(); }
  function hotHas(name) { return (CHAR.hotbar || []).indexOf(name) >= 0 || (CHAR.hotbar2 || []).indexOf(name) >= 0; }
  function hotAuto() { // new consumables and throwables drop into empty slots on their own
    if (!CHAR) return; (CHAR.gear || []).forEach(function (g) {
      if (hotHas(g.name)) return; var k = hotKey(hotKind(g));
      if (k === 'hotbar' ? !(g.cat === 'consumable' && g.heal) : !g.throw) return;
      if ((CHAR[k] || []).filter(Boolean).length < HOT_N) hotPut(g.name, true); });
  }
  function hotItem(i, k) { var n = CHAR && CHAR[k || 'hotbar'] && CHAR[k || 'hotbar'][i]; return n ? (CHAR.gear || []).filter(function (g) { return g.name === n; })[0] || null : null; }
  function hotDraw() {
    var el = document.getElementById('hotbar');
    if (!el) { el = document.createElement('div'); el.id = 'hotbar'; document.body.appendChild(el); }
    var show = CHAR && !gearOpen && !CC && !AUTH.open && !CHAR.dead && !UI.bag && !(typeof CRAFT !== 'undefined' && CRAFT.open); el.style.display = show ? 'flex' : 'none'; if (!show) return;
    var html = '', mine = !CB.on || (cbMyTurn() && !CB.busy);
    [['hotbar', 'Consumables', 'bonus'], ['hotbar2', 'Gear', 'action']].forEach(function (bar, bi) {
      html += '<div class="hb"><small>' + bar[1] + '<em>' + (bar[2] === 'bonus' ? 'bonus action' : 'action') + '</em></small><div class="hs">';
      for (var i = 0; i < HOT_N; i++) { var it = hotItem(i, bar[0]), can = it && mine && (!CB.on || CB.res[bar[2]]), key = bi === 0 ? i + 1 : (i + 6) % 10;
        var tip = it ? it.name + (it.heal ? ' · ' + it.heal + ' HP' : it.throw ? ' · throw' : burnsKnown(it) ? ' · light and throw' : '') : 'Empty: add things from your inventory';
        html += '<button type="button" data-h="' + i + '" data-k="' + bar[0] + '" class="' + (can ? 'ready' : '') + (it && !it.throw && burnsKnown(it) ? ' fire' : '') + '"' + (it ? '' : ' disabled') + ' aria-label="' + esc(tip) + '" title="' + esc(tip) + '"><i>' + key + '</i>' + (it ? itemIcon(it) + '<b>×' + (it.usesLeft !== undefined ? it.usesLeft : it.qty || 1) + '</b><span class="hn">' + esc(it.name) + '</span>' : '') + '</button>'; }
      html += '</div></div>';
    });
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html;
      el.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); hotUse(+b.dataset.h, b.dataset.k); }); }); }
  }
  function hotUse(i, k) { var it = hotItem(i, k); if (!it) return; if (k === 'hotbar2' && canAim(it)) aimStart(it, !it.throw); else useItem(it); }
  window.addEventListener('keydown', function (ev) {
    if (!CHAR || ev.repeat || /INPUT|TEXTAREA/.test((ev.target || {}).tagName || '') || UI.bag || gearOpen) return; var d = '1234567890'.indexOf(ev.key); if (d < 0) return;
    if (d < 5) hotUse(d, 'hotbar'); else hotUse(d - 5, 'hotbar2');
  });
  setInterval(function () { if (typeof CHAR !== 'undefined') hotDraw(); }, 700);
  function invAdd(item, quiet) {
    if (!CHAR) return; CHAR.gear = CHAR.gear || [];
    var same = item.cat === 'consumable' || item.cat === 'misc' ? CHAR.gear.filter(function (g) { return g.name === item.name; })[0] : null;
    if (same) same.qty = (same.qty || 1) + (item.qty || 1); else CHAR.gear.push(item);
    if (!quiet) saveChar(CHAR);
    if (UI.bag) bagDraw();
    if ((item.cat === 'consumable' && item.heal) || item.throw) hotAuto();
  }
  // a wielded item from the inventory overrides the builder's weapon slot
  function gearWeapon() {
    if (!CHAR || !CHAR.wield) return null; var it = (CHAR.gear || []).filter(function (g) { return g.name === CHAR.wield && g.dmg; })[0]; if (!it) return null;
    var m = /(\d+)d(\d+)/.exec(it.dmg), light = /knife|dagger|shear|scissor|blade|pick|opener|pen/i.test(it.name);
    var stat = light && MOD.DEX > MOD.STR ? 'DEX' : 'STR';
    var fam = !it.from || it.from === 'home' ? 1 : 0; // you have used this tool every day of your life
    var bon = +it.bonus || 0, sk = weaponSkillKey(it); // enchanted: +1 weapons add to hit and damage, 5e style; weapon skills add to hit
    return { name: it.name.toLowerCase(), n: +m[1], s: +m[2], stat: stat, clip: light ? 'Punch_Jab' : 'Sword_Attack', hit: PROF() + MOD[stat] + fam + bon + weaponSkillBonus(sk) + buffHit(), dmgB: MOD[stat] + bon, fam: fam, magic: bon, skey: sk, crit: +it.crit || 20, onHit: it.onHit || null };
  }

  // ---------- weapon on your back: one spare weapon (or nothing, if you'd rather wear a pack); swapping is free once a turn ----------
  function backItem() { if (!CHAR || !CHAR.back) return null; var w = wieldItem(); return (CHAR.gear || []).filter(function (g) { return g.name === CHAR.back && g !== w; })[0] || null; }
  function wieldItem() { if (!CHAR || !CHAR.wield) return null; return (CHAR.gear || []).filter(function (g) { return g.name === CHAR.wield; })[0] || null; }
  function canBack(it) { return it && (it.cat === 'weapon' || /shield/i.test(it.name || '')); }
  function swapWeapons() {
    if (!CHAR) return; if (!CHAR.back && !CHAR.wield) { say('Nothing to swap', 'Put a weapon on your back from the bag first.', 2600); return; }
    if (!CHAR.back) { say('Nothing on your back', 'Pick a weapon in the bag and choose Wear on back.', 2600); return; }
    if (CB.on) {
      if (!cbMyTurn() || CB.busy || PC.down) return;
      if (CB.res.swap) CB.res.swap = 0;
      else if (CB.res.action) { CB.res.action = 0; say('Second swap', 'Your free swap is used up, so this one costs your action.', 2600); }
      else { say('No time', 'You already swapped this turn and have no action left.', 2600); return; }
    }
    var t = CHAR.wield; CHAR.wield = CHAR.back; CHAR.back = t || null; skillCount('swap');
    buildHero(); saveChar(CHAR); if (typeof kitOneShot === 'function') kitOneShot('PickUp_Table');
    say('Swapped · ' + CHAR.wield, (CHAR.back ? CHAR.back + ' goes on your back.' : 'Your back is empty now.') + (CB.on && CB.res.action ? ' Free swap used.' : ''), 2600);
    if (CB.on) cbHUD(); wsetDraw(); if (UI.bag) bagDraw();
  }
  function wsetDraw() {
    var el = document.getElementById('wset'); if (!el) return; var w = wieldItem(), b = backItem();
    el.style.display = !CHAR || gearOpen || CC || AUTH.open ? 'none' : '';
    el.innerHTML = '<div class="wb"><small>On back</small>' + (b ? esc(b.name) + (b.dmg ? ' · ' + esc(b.dmg) : '') : '<i>nothing</i>') + '</div>' +
      '<div class="wh"><small>In hand</small><b>' + (w ? esc(w.name) : 'Fists') + '</b><span>' + (w && w.dmg ? esc(w.dmg) + (w.bonus ? ' · +' + w.bonus : '') : '1 + STR') + '</span></div>' +
      '<button type="button" id="wSwap" aria-label="Swap weapons"' + (b ? '' : ' disabled') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></button>';
    document.getElementById('wSwap').onclick = swapWeapons;
  }

  // ---------- wardrobe: you only wear what you own ----------
  var CLOTH_SLOTS = ['kHead', 'kNeck', 'kTop', 'kShoulder', 'kPants', 'kBoots'];
  function slotDef(k) { return SLOTS.filter(function (s) { return s.key === k; })[0]; }
  function slotLabel(k) { var s = slotDef(k); return s ? s.label : k; }
  function clothNone(k) { var s = slotDef(k); return !!s && s.styles[0] === 'None'; }
  function sleeveFor(top) { return /^Knight/.test(top) ? 'Knight' : top; }
  function wear(it) {
    var s = slotDef(it.slot); if (!s) return; var idx = s.styles.indexOf(it.style); if (idx < 0) return;
    (CHAR.gear || []).forEach(function (g) { if (g.cat === 'clothing' && g.slot === it.slot) g.worn = false; }); it.worn = true;
    look[it.slot] = [idx, it.color | 0];
    if (it.slot === 'kTop') { var sv = slotDef('kSleeves'), si = sv.styles.indexOf(sleeveFor(it.style)); if (si >= 0) look.kSleeves = [si, it.color | 0]; }
    buildHero(); saveLook();
  }
  function clothesLocked() { return !!(CHAR && CHAR.gear && CHAR.gear.some(function (g) { return g.cat === 'clothing'; })) && (!CHAR.freeWardrobe || NET.live); }
  function wardrobeRows(rowsEl) {
    var n = document.createElement('div'); n.className = 'row dim'; n.innerHTML = '<span class="slot">Wardrobe</span><span class="val">You can only wear clothes you own. Loot or find more to unlock options.</span>'; rowsEl.appendChild(n);
    CLOTH_SLOTS.forEach(function (k) {
      var s = slotDef(k), owned = CHAR.gear.filter(function (g) { return g.cat === 'clothing' && g.slot === k; }), opts = (clothNone(k) ? [null] : []).concat(owned);
      if (!owned.length && !clothNone(k)) return;
      var cur = owned.filter(function (g) { return g.worn; })[0] || null, ci = Math.max(0, opts.indexOf(cur));
      var row = document.createElement('div'); row.className = 'row';
      row.innerHTML = '<span class="slot">' + esc(s.label) + '</span>';
      var prev = document.createElement('button'), next = document.createElement('button'), val = document.createElement('span');
      prev.type = next.type = 'button'; prev.textContent = '‹'; next.textContent = '›'; prev.setAttribute('aria-label', 'Previous ' + s.label); next.setAttribute('aria-label', 'Next ' + s.label);
      val.className = 'val'; val.textContent = cur ? cur.name : 'Nothing';
      function step(dd) { var o = opts[(ci + dd + opts.length) % opts.length]; if (o) wear(o); else { owned.forEach(function (g) { g.worn = false; }); look[k] = [0, 0]; buildHero(); saveLook(); } saveChar(CHAR); drawRows(); }
      prev.onclick = function () { step(-1); }; next.onclick = function () { step(1); };
      if (opts.length < 2) { prev.style.visibility = 'hidden'; next.style.visibility = 'hidden'; }
      row.appendChild(prev); row.appendChild(val); row.appendChild(next); rowsEl.appendChild(row);
    });
  }
  // the outfit options described for the AI (and the keyword fallback), with each colour variant
  function outfitCatalog() {
    var DESC = { Ranger: 'leather jerkin / hooded work jacket look', Peasant: 'plain cloth shirt and trousers, the closest to everyday modern clothes', 'Knight plate': 'full metal armor', 'Knight tunic': 'padded quilted jacket', Noble: 'fancy vest or doublet, the closest to a suit or dressy outfit', Wizard: 'long robe or coat',
      'Ranger hood': 'a hood (hood up)', 'T-shirt': 'short-sleeve tee', 'Long sleeve': 'long-sleeve tee or thermal', 'Tank top': 'sleeveless tank', 'Hoodie': 'hooded sweatshirt (hood down)', 'Button-up': 'collared button-up, dress or flannel shirt', Jeans: 'jeans', Shorts: 'shorts', Sweatpants: 'sweatpants or joggers', Sneakers: 'sneakers or running shoes', 'Work boots': 'work boots, hiking or dress boots', Beanie: 'knit beanie', Cap: 'baseball cap', 'Cowboy hat': 'cowboy hat', 'Hard hat': 'construction hard hat', 'Winter hat': 'winter hat with pom', 'Santa hat': 'Santa hat', 'Clown hat': 'clown hat', 'Wizard hat': 'wizard hat', Fedora: 'fedora', Trilby: 'trilby or short-brim hat', 'Knight helm': 'metal helmet', 'Horned helm': 'horned helmet', Crown: 'crown', Scarf: 'scarf', Gorget: 'metal neck guard', 'Knight round': 'round metal pauldrons', 'Knight spiked': 'spiked pauldrons', 'Noble lion': 'lion pauldrons' };
    return CLOTH_SLOTS.map(function (k) {
      var s = slotDef(k);
      return k + ' (' + s.label + '): ' + s.styles.map(function (st) { if (st === 'None') return 'None'; var o = kitOutfitOf(st), sw = KIT_SW[o] || []; return '"' + st + '"' + (DESC[st] ? ' [' + DESC[st] + ']' : '') + ' colors ' + sw.map(function (c, i) { return i + '=#' + ('00000' + c.toString(16)).slice(-6); }).join(' '); }).join('; ');
    }).join('\n');
  }
  function closestColor(style, hex) {
    var sw = KIT_SW[kitOutfitOf(style)] || [], best = 0, bd = 1e9;
    sw.forEach(function (c, i) { var dr = (c >> 16 & 255) - (hex >> 16 & 255), dg = (c >> 8 & 255) - (hex >> 8 & 255), db = (c & 255) - (hex & 255), dd = dr * dr * 2 + dg * dg * 3 + db * db; if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  function outfitFrom(list) { // validate AI output into clothing items
    var out = [], seen = {};
    (Array.isArray(list) ? list : []).forEach(function (o) {
      if (!o || CLOTH_SLOTS.indexOf(o.slot) < 0 || seen[o.slot]) return; var s = slotDef(o.slot), ix = s.styles.indexOf(o.style); if (ix < 0 || (ix === 0 && s.styles[0] === 'None')) return;
      seen[o.slot] = 1; out.push({ name: String(o.name || o.style).slice(0, 40), cat: 'clothing', slot: o.slot, style: o.style, color: Math.max(0, Math.min(9, o.color | 0)), desc: String(o.desc || 'What you were wearing when they took you.').slice(0, 160), worn: true, from: 'home' });
    });
    ['kTop', 'kPants', 'kBoots'].forEach(function (k) { if (!seen[k]) out.push({ name: { kTop: 'Plain white tee', kPants: 'Blue jeans', kBoots: 'Sneakers' }[k], cat: 'clothing', slot: k, style: { kTop: 'T-shirt', kPants: 'Jeans', kBoots: 'Sneakers' }[k], color: { kTop: 0, kPants: 8, kBoots: 0 }[k], desc: 'What you were wearing when they took you.', worn: true, from: 'home' }); });
    return out;
  }
  function outfitLocal(text) {
    var t = (text || '').toLowerCase(); function pick(words, def) { for (var i = 0; i < words.length; i++) if (t.indexOf(words[i]) >= 0) return words[i]; return def; }
    var COL = { black: 0x1a1a1a, white: 0xdddddd, grey: 0x777777, gray: 0x777777, blue: 0x2a4a9a, navy: 0x1e2a5a, denim: 0x3e5f7a, jean: 0x3e5f7a, red: 0x9a2a2a, green: 0x2f6a3a, brown: 0x5a3a1a, tan: 0xc8bca0, khaki: 0xc8bca0, purple: 0x6a2a8a };
    function col(def) { for (var w in COL) if (t.indexOf(w) >= 0) return COL[w]; return def; }
    var top = /hoodie|sweatshirt/.test(t) ? 'Hoodie' : /button|flannel|dress shirt|oxford|polo|collar/.test(t) ? 'Button-up' : /tank|sleeveless/.test(t) ? 'Tank top' : /long sleeve|long-sleeve|thermal|sweater/.test(t) ? 'Long sleeve' : /suit|blazer|vest/.test(t) ? 'Noble' : /jacket|coat/.test(t) ? 'Ranger' : 'T-shirt';
    var items = [{ slot: 'kTop', style: top, name: pick(['hoodie', 't-shirt', 'flannel', 'polo', 'sweater', 'button-up', 'suit jacket', 'blazer', 'jacket', 'tee', 'shirt'], 'shirt') }];
    items.push({ slot: 'kPants', style: /shorts/.test(t) ? 'Shorts' : /sweat|jogger/.test(t) ? 'Sweatpants' : /suit|slacks|dress pants/.test(t) ? 'Noble' : 'Jeans', name: pick(['jeans', 'cargo pants', 'sweatpants', 'khakis', 'slacks', 'shorts', 'trousers', 'pants'], 'pants') });
    items.push({ slot: 'kBoots', style: /boot/.test(t) ? 'Work boots' : (/dress shoe|loafer/.test(t) ? 'Noble' : 'Sneakers'), name: pick(['work boots', 'sneakers', 'boots', 'loafers', 'dress shoes', 'sandals', 'shoes'], 'shoes') });
    if (/hood up|beanie|hat\b|cap\b/.test(t)) items.push({ slot: 'kHead', style: /beanie|knit hat/.test(t) ? 'Beanie' : /cap\b/.test(t) ? 'Cap' : 'Ranger hood', name: pick(['beanie', 'baseball cap', 'cap', 'hat', 'hood'], 'hood') });
    if (/scarf/.test(t)) items.push({ slot: 'kNeck', style: 'Scarf', name: 'scarf' });
    return outfitFrom(items.map(function (o) { var near = new RegExp('(black|white|grey|gray|blue|navy|denim|red|green|brown|tan|khaki|purple)\\s+(?:\\w+\\s+)?' + o.name).exec(t), c = near ? COL[near[1]] : (o.name === 'jeans' ? 0x3e5f8f : (o.slot === 'kTop' ? 0xf2f2ee : o.slot === 'kBoots' && /sneaker/.test(o.name) ? 0xf2f2ee : 0x3a3328)); var m = new RegExp('((?:faded |old |dark |light |bright )?(?:black|white|grey|gray|blue|navy|red|green|brown|tan|khaki|purple) )' + o.name).exec(t), nm = m ? m[0] : o.name; return { slot: o.slot, style: o.style, color: closestColor(o.style, c), name: nm.charAt(0).toUpperCase() + nm.slice(1) }; }));
  }

  // ---------- speech bubbles (what you say out loud shows over your head) ----------
  var BUBS = [];
  function bubble(who, text, whisper) {
    var el = document.createElement('div'); el.className = 'bub' + (who === 'pc' ? '' : ' npc') + (whisper ? ' wh' : '');
    el.textContent = whisper ? (who === 'pc' ? '(whispering) ' : '') + text : text; document.getElementById('bubs').appendChild(el);
    BUBS = BUBS.filter(function (b) { if (b.who === who) { b.el.remove(); return false; } return true; });
    BUBS.push({ el: el, who: who, until: performance.now() + Math.min(12000, 3500 + text.length * 70) });
    // later: broadcast to other players in the room unless whispering
  }
  (function bubLoop() {
    var now = performance.now();
    BUBS = BUBS.filter(function (b) {
      if (now > b.until) { b.el.remove(); return false; }
      var x, y, z; if (b.who === 'pc') { x = P.px; z = P.pz; y = 2.25; } else { x = b.who.px; z = b.who.pz; y = (b.who.def.h || 1) * (b.who.npc ? 0.7 : 1) + 0.6; }
      var s = toScreen(x, y, z), lim = TALK.open ? document.getElementById('talk').getBoundingClientRect().left - 12 : 1e9; b.el.classList.toggle('lt', s.x + 110 > lim); b.el.style.display = s.ok && !gearOpen ? '' : 'none'; b.el.style.left = Math.min(s.x, lim - 4) + 'px'; b.el.style.top = s.y + 'px';
      return true;
    });
    requestAnimationFrame(bubLoop);
  })();

  // ---------- looting bodies ----------
  // monster drops live in items.js (DROPS.monsters); rollDrops() reads them
  function lootBody(e) {
    if (!e.lootStore) {
      var L = rollDrops(e.kind, e.def.base), RD = DROPS.monsters[e.kind] || {};
      if (RD.oneOf && RD.oneOf.length) { var pk = item(RD.oneOf[Math.floor(Math.random() * RD.oneOf.length)]); if (pk) L.items.push(pk); } // elites and bosses: one guaranteed pick from their table
      L.gold += skillLv('Scavenger'); skillCount('loot');
      if (e.boss) { L.gold += d(10, 6); L.items.push({ name: e.name.split(',')[0] + '\'s trophy', cat: 'valuable', desc: 'Proof you beat a zone boss. Heavier than it looks.' }); }
      L.items.forEach(function (it) { it.from = e.name; }); e.lootStore = { title: 'Searching ' + e.name, items: L.items, gold: L.gold }; e.looted = true;
    }
    lootWindow(e.lootStore);
  }
  // ---------- credits (CC-BY assets must credit their authors) ----------
  var CREDITS = [['Furniture Kit (kitchens, bunks, lounges)', 'Kenney (kenney.nl)', 'CC0'], 
    ['Characters, outfits, animations, props, nature, monsters', 'Quaternius (quaternius.com)', 'CC0'],
    ['Cowboy Hat (Free)', 'wolfgar74 on Sketchfab', 'CC-BY 4.0'], ['Hard hat', 'naira001 on Sketchfab', 'CC-BY 4.0'], ['Winter Hat', 'StubbornFunkyDonkey on Sketchfab', 'CC-BY 4.0'],
    ['Santa Hat', '3d-Pauer on Sketchfab', 'CC-BY 4.0'], ['Clown Hat', 'PatelDev on Sketchfab', 'CC-BY 4.0'], ['Stylized wizard hat', 'Enkarra on Sketchfab', 'CC-BY 4.0'], ['Gangster hats', 'Michal Cavrnoch on Sketchfab', 'CC-BY 4.0']
  ];
  function creditsHTML() { return '<h3>Credits</h3><ul class="credits">' + CREDITS.map(function (c) { return '<li>' + esc(c[0]) + ' · ' + esc(c[1]) + ' · ' + esc(c[2]) + '</li>'; }).join('') + '</ul>'; }

  // ---------- item visuals: bag icons and the model in your hand ----------
  function itemKind(it) {
    var n = (it.name || '').toLowerCase();
    var k0 = it.icon && ICON[it.icon] ? it.icon : null;
    // crafted things look like what went into them: a bomb taped to a stick is a stick bomb
    if (it.crafted) { var parts = (it.parts || ((typeof allRecipes === 'function' ? allRecipes() : []).filter(function (r) { return r.name === it.name; })[0] || {}).inputs || []).join(' ').toLowerCase();
      var kind = k0 || (/bomb|grenade|cocktail|molotov|explosive|firework/.test(n) ? 'bomb' : null);
      if (kind === 'bomb' && /stick|pole|broom|mop|handle|\brod\b|\bbat\b|club|cane|pipe/.test(parts)) return 'stickbomb'; }
    if (k0) return k0;
    if (it.cat === 'clothing') return 'cloth_' + ({ kTop: 'top', kPants: 'pants', kBoots: 'shoes', kHead: 'hat', kNeck: 'scarf', kShoulder: 'top' }[it.slot] || 'top');
    var K0 = [['bow', /\bbow\b|shortbow|longbow|crossbow/], ['spear', /spear|pike|lance|javelin|trident|halberd|glaive/], ['bomb', /bomb|grenade|cocktail|molotov|explosive|firework|hob-lobber/], ['headlamp', /headlamp|head lamp/], ['battery', /batter(y|ies)\b|\baa\b/],
      ['horn', /horn\b|horns|antler|tusk/], ['slime', /slime|goo\b|ooze|jelly/], ['tail', /tail\b/], ['grease', /grease|lard|\bwax\b|\btub\b/], ['sap', /\bsap\b|resin|amber|honey|syrup/], ['ink', /\bink\b|inkwell/],
      ['emptybottle', /empty bottle|\bjar\b|vial/], ['potion', /potion|elixir|tonic|antidote/], ['pages', /page|paper|document|\bfile\b|\bform\b|letter\b|\bmap\b|\bnote|receipt|coupon|sticky notes|toilet paper/],
      ['pan', /skillet|\bpan\b|\bpot\b|\bwok\b/], ['helmet', /helmet|hard hat|\bhelm\b/], ['sword', /sword|saber|sabre|machete|katana|cleaver/], ['axe', /\baxe\b|hatchet/], ['lootbox', /loot box|\bchest\b|\bcrate\b/],
      ['bone', /bone|skull|gristle/], ['flower', /flower|rose\b|tulip|bouquet|herb|petal|seed/], ['shield', /shield|trash can lid/], ['gem', /\bgem|jewel|crystal|diamond|ruby|emerald/]];
    for (var j = 0; j < K0.length; j++) if (K0[j][1].test(n)) return K0[j][0];
    var K = [['shears', /shear|scissor|clipper|pruner|snip/], ['knife', /knife|blade|cutter|dagger|razor|scalpel/], ['hammer', /hammer|mallet/], ['mace', /mace|morning star/], ['wrench', /wrench|spanner/],
      ['bat', /bat\b|club|stick|pipe|crowbar|cane|rod|pole|broom|mop/], ['phone', /phone|tablet|ipad/], ['laptop', /laptop|computer/], ['keys', /key/], ['tape', /tape|zip tie/], ['pick', /pick\b|picks|plectrum/],
      ['bandage', /gauze|bandage|band-aid|first aid/], ['snack', /snack|bar\b|food|jerky|apple|sandwich|gum|candy|chip/], ['drink', /bottle|flask|water|coffee|drink|can\b|potion/], ['opener', /opener|corkscrew/],
      ['rag', /rag|towel|cloth|apron/], ['badge', /badge|card|id\b|license|wallet/], ['coin', /coin|gold|button/], ['pen', /pen\b|pencil|marker|sharpie/], ['light', /flashlight|lighter|torch|lamp/],
      ['bag', /bag|pouch|backpack|purse|sack/], ['book', /book|notebook|manual|scroll/]];
    for (var i = 0; i < K.length; i++) if (K[i][1].test(n)) return K[i][0];
    return { weapon: 'bat', tool: 'wrench', consumable: 'drink', valuable: 'coin', misc: 'box' }[it.cat] || 'box';
  }
  var ICON = {
    stickbomb: '<path d="M4 26L14 16" stroke="#8a5a30" stroke-width="3.2" stroke-linecap="round"/><g transform="rotate(-45 18 10)"><rect x="12" y="5" width="12" height="10" rx="2" fill="#e8dcc0" stroke="#8a7a5a"/><path d="M14 7.5h8M14 10h8M14 12.5h6" stroke="#b8a888" stroke-width=".7"/><rect x="16.2" y="4.4" width="3.2" height="11.2" fill="#9aa0a6" stroke="#6a7076" stroke-width=".5"/></g><path d="M14.5 17.5c0 2 1 3 .2 4.5M18.5 16c1 2 .4 3 .4 4.5" stroke="#c8a040" stroke-width="1.5" stroke-linecap="round"/><path d="M22.5 4.5l1.5-2.5M24.5 6.5l3-1M21 3.5V1" stroke="#ff9a2a" stroke-width="1.4"/>',
    bow: '<path d="M8 4c10 4 10 18 0 22" fill="none" stroke="#7a4a28" stroke-width="2.6" stroke-linecap="round"/><path d="M8 4v22" stroke="#d8d0b8" stroke-width=".9"/><path d="M5 15h17" stroke="#8a5a30" stroke-width="1.4"/><path d="M22 15l-3-2v4z" fill="#cfd6da"/>',
    spear: '<path d="M5 25L19 11" stroke="#8a5a30" stroke-width="2.6" stroke-linecap="round"/><path d="M18 12l2-7 6-2-2 6z" fill="#dfe6ea" stroke="#8a939d" stroke-width=".7"/><path d="M15.5 13.5l3 3" stroke="#3a3a3a" stroke-width="2.2"/>',
    bomb: '<circle cx="13" cy="17" r="7" fill="#2a2a2a" stroke="#555"/><path d="M17 11l3-3" stroke="#8a7a5a" stroke-width="2"/><path d="M20 8l2-2M21 5h3M22 9l2 1" stroke="#ff9a2a" stroke-width="1.6"/><circle cx="10.5" cy="14.5" r="1.6" fill="#777"/>',
    headlamp: '<path d="M5 16c0-7 18-7 18 0" fill="none" stroke="#3a3a3a" stroke-width="3"/><rect x="10" y="12" width="8" height="7" rx="2" fill="#555" stroke="#888" stroke-width=".6"/><circle cx="14" cy="15.5" r="2.4" fill="#ffe27a"/><path d="M12 20l-4 6M16 20l4 6" stroke="rgba(255,226,122,.6)" stroke-width="1.4"/>',
    battery: '<rect x="9" y="6" width="10" height="18" rx="1.5" fill="#2a2a2a" stroke="#888"/><rect x="12" y="4" width="4" height="2" fill="#bbb"/><rect x="9.5" y="6.5" width="9" height="5" fill="#d8a020"/><path d="M14 14v6M11 17h6" stroke="#ddd" stroke-width="1.4"/>',
    horn: '<path d="M6 24c1-10 8-17 18-19-4 5-6 10-6 16z" fill="#d9c8a0" stroke="#7a6040" stroke-width="1.2"/><path d="M9 20c3-1 6-1 8 0M11 15c3-1 5-1 7 0M14 10c2-1 4-1 5 0" stroke="#7a6040" stroke-width="1"/>',
    slime: '<path d="M5 22c0-6 4-12 9-12s9 6 9 12c0 2-2 3-4 2-1 2-3 2-5 1-2 1-4 1-5-1-2 1-4 0-4-2z" fill="#6ab04a" stroke="#3a7a2a"/><circle cx="11" cy="16" r="1.7" fill="#d4ecb8"/><circle cx="17.5" cy="14" r="1" fill="#d4ecb8"/>',
    tail: '<path d="M6 8c6 0 6 6 10 8s8 0 9 5" fill="none" stroke="#d4a090" stroke-width="2.6" stroke-linecap="round"/><path d="M4 5l4 5" stroke="#7a5a50" stroke-width="3.4" stroke-linecap="round"/>',
    grease: '<path d="M7 11h14l-2 13H9z" fill="#7a6a4a" stroke="#4a3a20"/><ellipse cx="14" cy="11" rx="7" ry="2.4" fill="#c8b070"/><path d="M11 10c1-3 5-3 6 0" fill="#e8d088"/>',
    sap: '<path d="M14 4c4 6 7 10 7 14a7 7 0 0 1-14 0c0-4 3-8 7-14z" fill="#d8962a" stroke="#8a5a10"/><path d="M11 17c0 2 1 3 2 4" stroke="#f8d888" stroke-width="1.6"/>',
    ink: '<path d="M9 12h10v11a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="#23304a" stroke="#6a7a9a"/><rect x="11" y="8" width="6" height="4" fill="#4a3a2a"/><path d="M18 9l6-6-3 8z" fill="#efe6d4" stroke="#8a7a5a" stroke-width=".6"/>',
    emptybottle: '<path d="M12 4h4v5l3 4v10a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V13l3-4z" fill="rgba(170,210,220,.35)" stroke="#7aa8b2" stroke-width="1.4"/><path d="M11 15v6" stroke="rgba(255,255,255,.7)" stroke-width="1.2"/>',
    potion: '<path d="M12 5h4v5l5 7a5 5 0 0 1-4 8h-6a5 5 0 0 1-4-8l5-7z" fill="#c0302a" stroke="#6a1410"/><rect x="11" y="3" width="6" height="3" rx="1" fill="#8a6a40"/><path d="M9.5 18h9" stroke="#ff9a8a" stroke-width="1.2"/>',
    pages: '<path d="M7 5h11l4 4v15H7z" fill="#ece0c4" stroke="#8a7a5a"/><path d="M18 5v4h4" fill="none" stroke="#8a7a5a"/><path d="M10 12h9M10 15h9M10 18h7M10 21h8" stroke="#8a7a5a" stroke-width="1"/>',
    pan: '<circle cx="12" cy="15" r="7.5" fill="#2e2e2e" stroke="#666" stroke-width="1.4"/><circle cx="12" cy="15" r="5" fill="#3a3a3a"/><path d="M18 10l7-5" stroke="#2e2e2e" stroke-width="3.2" stroke-linecap="round"/>',
    helmet: '<path d="M5 19c0-7 4-12 9-12s9 5 9 12z" fill="#d8b020" stroke="#8a6a10"/><path d="M14 7v12" stroke="#8a6a10" stroke-width="1.2"/><path d="M3 19h22v3H3z" fill="#c8a010" stroke="#8a6a10"/>',
    sword: '<path d="M8 20L21 7l2-3-3 2L7 19z" fill="#dfe6ea" stroke="#8a939d" stroke-width=".7"/><path d="M5 17l6 6" stroke="#b08a40" stroke-width="2.4"/><path d="M4 24l3-3" stroke="#4a3020" stroke-width="2.8"/>',
    axe: '<path d="M8 25l11-15" stroke="#8a5a30" stroke-width="3"/><path d="M15 6c5-1 9 2 9 7l-6-1-3-2z" fill="#9aa3ad" stroke="#5a636d" stroke-width=".7"/>',
    lootbox: '<rect x="5" y="12" width="18" height="11" rx="1.5" fill="#a87a30" stroke="#5a3a10"/><path d="M5 12l2-5h14l2 5z" fill="#c8963a" stroke="#5a3a10"/><rect x="12" y="13" width="4" height="4" fill="#f0d070" stroke="#5a3a10" stroke-width=".6"/>',
    bone: '<path d="M8 20l12-12" stroke="#ece2cc" stroke-width="3.4"/><circle cx="7" cy="19" r="2.4" fill="#ece2cc"/><circle cx="9" cy="22" r="2.4" fill="#ece2cc"/><circle cx="19" cy="6" r="2.4" fill="#ece2cc"/><circle cx="22" cy="9" r="2.4" fill="#ece2cc"/>',
    flower: '<path d="M14 25V13" stroke="#3a7a2a" stroke-width="2"/><path d="M14 19c-4 0-6-2-6-4 3 0 5 1 6 4z" fill="#5aa03a"/><circle cx="10" cy="9" r="2.6" fill="#e05a7a"/><circle cx="18" cy="9" r="2.6" fill="#e05a7a"/><circle cx="14" cy="5" r="2.6" fill="#e05a7a"/><circle cx="14" cy="13" r="2.6" fill="#e05a7a"/><circle cx="14" cy="9" r="2.6" fill="#f0c040"/>',
    shield: '<path d="M14 4l9 3v7c0 6-4 10-9 12-5-2-9-6-9-12V7z" fill="#7a5a3a" stroke="#3a2a1a"/><path d="M14 8v14M8 13h12" stroke="#c8a060" stroke-width="1.6"/>',
    gem: '<path d="M8 10l3-4h6l3 4-6 13z" fill="#5ac0e0" stroke="#2a6a8a"/><path d="M8 10h12M11 6l3 4 3-4M14 10v13" stroke="#2a6a8a" stroke-width=".8"/>',
    shears: '<path d="M9 21l7-9M19 21l-7-9" stroke="#cfd6dc" stroke-width="2.4"/><path d="M14 12l-3-8M14 12l3-8" stroke="#e8eef2" stroke-width="2"/><circle cx="8" cy="23" r="3.2" fill="none" stroke="#c03030" stroke-width="2.4"/><circle cx="20" cy="23" r="3.2" fill="none" stroke="#c03030" stroke-width="2.4"/>',
    knife: '<path d="M6 22l10-10 6-6-2 8-10 10z" fill="#dfe6ea"/><path d="M4 24l4-4 2 2-4 4z" fill="#4a3020"/>',
    hammer: '<path d="M8 25l10-12" stroke="#8a5a30" stroke-width="3"/><path d="M14 6l9 4-3 5-9-4z" fill="#9aa3ad"/>',
    mace: '<path d="M8 25l9-11" stroke="#6b4423" stroke-width="3"/><circle cx="19" cy="10" r="5" fill="#7d8690"/><path d="M19 3v3M19 14v3M12 10h3M23 10h3M14 5l2 2M24 15l-2-2M24 5l-2 2" stroke="#cfd6dc" stroke-width="1.6"/>',
    wrench: '<path d="M8 24l11-11" stroke="#9aa3ad" stroke-width="3.2"/><path d="M17 6a5 5 0 1 0 6 6l-3 1-3-3z" fill="#9aa3ad"/>',
    bat: '<path d="M7 25l14-15" stroke="#8a5a30" stroke-width="4" stroke-linecap="round"/>',
    phone: '<rect x="9" y="4" width="11" height="21" rx="2" fill="#222" stroke="#666"/><rect x="11" y="7" width="7" height="13" fill="#3a6ea8"/>',
    laptop: '<rect x="6" y="7" width="17" height="11" rx="1" fill="#333" stroke="#777"/><path d="M3 21h23l-2 3H5z" fill="#888"/>',
    keys: '<circle cx="10" cy="10" r="4" fill="none" stroke="#e0c060" stroke-width="2"/><path d="M13 13l8 8M18 18l2-2M20 20l2-2" stroke="#e0c060" stroke-width="2"/>',
    tape: '<circle cx="14" cy="14" r="8" fill="#5a8a3a"/><circle cx="14" cy="14" r="3.5" fill="#0b0c13"/>',
    pick: '<path d="M14 5c6 0 8 4 6 9l-6 10-6-10c-2-5 0-9 6-9z" fill="#d84a8a"/>',
    bandage: '<rect x="5" y="10" width="19" height="9" rx="4" fill="#f0e6d8" transform="rotate(-30 14 14)"/><rect x="11" y="11" width="6" height="7" fill="#d8c8b0" transform="rotate(-30 14 14)"/>',
    snack: '<rect x="6" y="9" width="17" height="11" rx="2" fill="#c8963e"/><path d="M6 12h17" stroke="#8a5a20"/>',
    drink: '<path d="M11 5h6v4l2 3v12H9V12l2-3z" fill="#4a9ac8"/><rect x="11" y="3" width="6" height="3" fill="#ddd"/>',
    opener: '<path d="M8 23l9-9" stroke="#9aa3ad" stroke-width="3"/><circle cx="19" cy="10" r="4" fill="none" stroke="#9aa3ad" stroke-width="2.5"/>',
    rag: '<path d="M6 8c4 2 6-2 10 0s6-2 7 1l-2 13c-4-2-6 2-10 0s-5 1-6-1z" fill="#c8b8a0"/>',
    badge: '<rect x="5" y="8" width="19" height="13" rx="2" fill="#e8e8e0"/><circle cx="10" cy="14" r="2.5" fill="#7a8a9a"/><path d="M14 12h7M14 16h5" stroke="#7a8a9a" stroke-width="1.5"/>',
    coin: '<circle cx="14" cy="14" r="8" fill="#e0c060" stroke="#a08020" stroke-width="2"/><path d="M14 9v10" stroke="#a08020" stroke-width="2"/>',
    pen: '<path d="M7 23l2-5 11-11 3 3-11 11z" fill="#3a6ea8"/>',
    light: '<rect x="11" y="8" width="7" height="16" rx="2" fill="#555"/><path d="M10 8h9l2-4H8z" fill="#ffd34a"/>',
    bag: '<path d="M7 11h15l-1 13H8z" fill="#8a6a40"/><path d="M11 11c0-5 7-5 7 0" fill="none" stroke="#5a4020" stroke-width="2"/>',
    book: '<rect x="7" y="5" width="15" height="19" rx="1" fill="#7a2a2a"/><path d="M10 5v19" stroke="#4a1a1a" stroke-width="2"/>',
    box: '<path d="M6 10l8-4 8 4v10l-8 4-8-4z" fill="#8a7a6a"/><path d="M6 10l8 4 8-4M14 14v10" stroke="#5a4a3a"/>',
    cloth_top: '<path d="M9 5l-5 4 3 4 2-1v12h10V12l2 1 3-4-5-4c-1 2-2 3-5 3s-4-1-5-3z" fill="CC"/>',
    cloth_pants: '<path d="M8 4h12l1 21h-5l-2-13-2 13H7z" fill="CC"/>',
    cloth_shoes: '<path d="M4 18c3 0 5-6 8-7 2 2 4 3 8 3 3 1 5 3 5 6v2H4z" fill="CC"/><path d="M4 22h21" stroke="#eee" stroke-width="2"/>',
    cloth_hat: '<path d="M8 17c0-7 3-10 6-10s6 3 6 10z" fill="CC"/><path d="M4 18h20" stroke="CC" stroke-width="3" stroke-linecap="round"/>',
    cloth_scarf: '<path d="M7 8c4 3 10 3 14 0v5c-4 3-10 3-14 0zM15 13l3 12h-4l-1-11z" fill="CC"/>'
  };
  function itemIcon(it) {
    var k = itemKind(it), svg = ICON[k] || ICON.box;
    if (k.indexOf('cloth_') === 0) { var pal = KIT_SW[kitOutfitOf(it.style || '')] || KIT_SW.modern, c = pal[(it.color | 0) % pal.length]; svg = svg.replace(/CC/g, '#' + ('00000' + c.toString(16)).slice(-6)); }
    return '<svg class="ico" viewBox="0 0 28 28" width="30" height="30" aria-hidden="true">' + svg + '</svg>';
  }
  // the wielded inventory item as a little 3D model in the right hand (built along +y, grip at the origin)
  function gearModel(g0, it) {
    var k = itemKind(it), RED = 0xb02828, g = new THREE.Group(); g.scale.setScalar(1.35); g0.add(g);
    // weapons with a real model (kit2/weapons.json): grip just above the pommel, blade up; a bow is held in the middle
    var IB = (typeof ITEMS !== 'undefined' && ITEMS[it.name]) || it;
    if (IB.model && typeof propInto === 'function' && propInto(g, IB.model, { s: IB.len || 0.5, gy: -(IB.len || 0.5) * (IB.bow ? 0.5 : 0.1) })) { g.traverse(function (o) { if (o.isMesh && !o.material.userData.lit) { o.material.color.multiplyScalar(1.8); o.material.userData.lit = 1; } }); return; } // the rust textures are dark: lift them so they read in hand
    if (k === 'shears') { [-1, 1].forEach(function (s) { var a = new THREE.Group(); a.rotation.z = s * 0.12; g.add(a); part(a, 0.022, 0.09, 0.02, RED, s * 0.012, 0.0, 0); part(a, 0.012, 0.11, 0.006, STEEL, s * 0.004, 0.1, s * 0.004, 'metal'); }); part(g, 0.02, 0.02, 0.03, DARK, 0, 0.05, 0); }
    else if (k === 'knife') { part(g, 0.024, 0.1, 0.024, 0x4a3020, 0, 0, 0, 'wood'); part(g, 0.03, 0.012, 0.03, STEEL, 0, 0.055, 0, 'metal'); part(g, 0.028, 0.13, 0.006, STEEL, 0.004, 0.125, 0, 'metal'); }
    else if (k === 'hammer') { part(g, 0.028, 0.3, 0.028, WOOD, 0, 0.1, 0, 'wood'); part(g, 0.13, 0.05, 0.05, METAL_D, 0.02, 0.26, 0, 'metal'); }
    else if (k === 'mace') { part(g, 0.032, 0.34, 0.032, WOOD, 0, 0.12, 0, 'wood'); part(g, 0.085, 0.11, 0.085, METAL_D, 0, 0.32, 0, 'metal'); [[0.05, 0.32, 0], [-0.05, 0.32, 0], [0, 0.32, 0.05], [0, 0.32, -0.05], [0, 0.39, 0]].forEach(function (p) { part(g, 0.025, 0.025, 0.025, STEEL, p[0], p[1], p[2]); }); }
    else if (k === 'wrench') { part(g, 0.03, 0.26, 0.012, METAL, 0, 0.1, 0, 'metal'); part(g, 0.07, 0.04, 0.014, METAL, 0, 0.24, 0, 'metal'); }
    else if (k === 'bat') { cyl(g, 0.03, 0.02, 0.5, /pipe|crowbar|rod/i.test(it.name) ? METAL_D : WOOD, 0, 0.2, 0, 8); }
    else if (k === 'phone') { part(g, 0.07, 0.14, 0.01, DARK, 0, 0.06, 0.02); part(g, 0.06, 0.12, 0.002, 0x3a6ea8, 0, 0.06, 0.026, true); }
    else if (k === 'keys') { part(g, 0.04, 0.04, 0.006, GOLD, 0, 0.03, 0, 'metal'); part(g, 0.012, 0.06, 0.004, GOLD, 0.01, 0.07, 0, 'metal'); part(g, 0.012, 0.05, 0.004, METAL, -0.012, 0.06, 0, 'metal'); }
    else if (k === 'spear') { cyl(g, 0.016, 0.016, 0.9, WOOD, 0, 0.3, 0, 8); part(g, 0.05, 0.13, 0.008, STEEL, 0, 0.8, 0, 'metal'); part(g, 0.035, 0.05, 0.035, 0x3a3a3a, 0, 0.72, 0); }
    else if (k === 'sword') { part(g, 0.026, 0.1, 0.026, 0x4a3020, 0, 0, 0, 'wood'); part(g, 0.1, 0.016, 0.03, GOLD, 0, 0.06, 0, 'metal'); part(g, 0.032, 0.42, 0.008, STEEL, 0, 0.28, 0, 'metal'); }
    else if (k === 'axe') { part(g, 0.028, 0.36, 0.028, WOOD, 0, 0.13, 0, 'wood'); part(g, 0.1, 0.09, 0.014, STEEL, 0.05, 0.28, 0, 'metal'); }
    else if (k === 'pan') { part(g, 0.024, 0.16, 0.016, DARK, 0, 0.06, 0); cyl(g, 0.11, 0.11, 0.025, 0x2e2e2e, 0, 0.24, 0, 14); }
    else if (k === 'bomb') { var bm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2a })); bm.position.y = 0.05; g.add(bm); }
    else if (k === 'light') { cyl(g, 0.022, 0.022, 0.16, 0x333333, 0, 0.05, 0, 8); cyl(g, 0.032, 0.024, 0.04, 0xffd34a, 0, 0.15, 0, 8); }
    else { part(g, 0.05, 0.08, 0.04, 0x8a7a6a, 0, 0.04, 0); }
  }

  // ---------- loot from containers and secret doors ----------
  // container pools live in items.js (DROPS.containers); rollContainer() reads them
  function lootSpot(x, z, kind) {
    var key = 'loot' + x + ',' + z, st = lootSpot.done[key];
    if (!st) {
      var R = rollLoot(kind, (roomInfo(x, z) || {}).theme);
      if (kind === 'chest') { skillCount('box'); if (Math.random() < skillLv('Box Cracker') * 0.12) { var ex = rollLoot(kind).items[0]; if (ex) { ex.from = 'a loot box (Box Cracker)'; R.items.push(ex); } } }
      st = lootSpot.done[key] = { title: kind === 'chest' ? 'Loot box' : 'You found', items: R.items, gold: R.gold };
    }
    lootWindow(st);
  }
  lootSpot.done = {};
  function revealHidden(x, z) {
    if (ch(x, z) !== 'H') return; MAP[z] = MAP[z].substr(0, x) + 'D' + MAP[z].substr(x + 1);
    rebuildChunks(); refreshFog(); grantXP(75); setTimeout(function () { achieve('secret', 'Secret Agent', 'You found a hidden room. The producers did not think anyone would.', 25); }, 2600);
  }
