
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
    if (typeof VFX !== 'undefined') VFX.areas.forEach(function (A) { // lingering spell areas: fire, grease, ice, webs...
      g.globalAlpha = 0.55; var R = Math.ceil(A.r); for (var dz = -R; dz <= R; dz++) for (var dx = -R; dx <= R; dx++) if (dx * dx + dz * dz <= (A.r + 0.3) * (A.r + 0.3)) cell(Math.round(A.x) + dx, Math.round(A.z) + dz, AREA_COL[A.kind] || '#fff'); g.globalAlpha = 1; });
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
  var CATS = [['all', 'All'], ['weapon', 'Weapons'], ['clothing', 'Clothing'], ['tool', 'Tools'], ['consumable', 'Consumables'], ['scroll', 'Scrolls'], ['box', 'Loot boxes'], ['valuable', 'Valuables'], ['material', 'Materials'], ['body', 'Bodies'], ['misc', 'Misc']];
  function bagItems() { return CHAR && CHAR.gear ? CHAR.gear : []; }
  function bagToggle() {
    UI.bag = !UI.bag; if (UI.bag && UI.map) mapToggle(); document.getElementById('bag').classList.toggle('on', UI.bag);
    if (UI.bag) bagDraw();
  }
  // ---------- inventory filters: a second row of chips that fits the category, a rarity filter and a sort ----------
  var FACETS = { weapon: [['melee', 'Melee'], ['ranged', 'Ranged'], ['sharp', 'Sharp'], ['blunt', 'Blunt'], ['long', 'Long reach'], ['twohand', 'Two-handed'], ['ench', 'Enchanted']],
    consumable: [['heal', 'Healing'], ['food', 'Food & drink'], ['throw', 'Throwable'], ['magic', 'Magic']] };
  var TAGNAME = { electronics: 'Electronics', book: 'Books', paper: 'Paper', scroll: 'Scrolls', food: 'Food', drink: 'Drinks', medical: 'Medical', kitchen: 'Kitchen', office: 'Office', household: 'Household', tool: 'Hardware', garden: 'Garden', sports: 'Sports', valuable: 'Valuable', junk: 'Junk', ammo: 'Ammo', wood: 'Wood', metal: 'Metal', stone: 'Stone', glass: 'Glass', flammable: 'Flammable', toxic: 'Toxic', sticky: 'Sticky', magic: 'Magic', battery: 'Battery', plastic: 'Plastic' };
  function rarRank(it) { var r = String(it.rarity || '').toLowerCase(); return r === 'legendary' ? 4 : r === 'rare' ? 3 : r === 'uncommon' ? 2 : 1; }
  function dmgAvg(it) { var m = /(\d+)d(\d+)/.exec(it.dmg || ''); var L = launcherOf(it.name); return m ? (+m[1]) * (+m[2] + 1) / 2 + (it.bonus || 0) : L ? 3 : 0; }
  function hasFacet(it, f) {
    var I = ITEMS[it.name] || it, tg = it.tags || I.tags || [], L = launcherOf(it.name);
    if (f === 'ranged') return !!L; if (f === 'melee') return it.cat === 'weapon' && !L;
    var sharp = tg.indexOf('sharp') >= 0 || /knife|blade|sword|axe|hatchet|shears|cleaver|spear|machete|scissor|cutter|opener|dagger|scalpel|razor|saw\b|trimmers/i.test(it.name);
    if (f === 'sharp') return sharp && !L; if (f === 'blunt') return it.cat === 'weapon' && !L && !sharp;
    if (f === 'long') return tg.indexOf('long') >= 0; if (f === 'twohand') return !!I.twoHand; if (f === 'ench') return !!(it.bonus || I.edmg || I.spell || /enchanted|\+\d/i.test(it.name));
    if (f === 'heal') return !!(it.heal || I.heal); if (f === 'food') return tg.indexOf('food') >= 0 || tg.indexOf('drink') >= 0; if (f === 'throw') return !!I.throw; if (f === 'magic') return !!I.spell || tg.indexOf('magic') >= 0;
    return tg.indexOf(f) >= 0;
  }
  function isScroll(it) { var tg = it.tags || (ITEMS[it.name] || {}).tags || []; return tg.indexOf('scroll') >= 0 || /\bscroll\b|rewritten script/i.test(it.name); }
  function isBox(it) { return !!(it.box || (ITEMS[it.name] || {}).box) || /loot box/i.test(it.name); }
  function quickUse(it) { // the one-tap button on a bag row: what using it means, in a word
    if (!it || it.worn) return ''; var tg = it.tags || (ITEMS[it.name] || {}).tags || [];
    if (it.box) return 'Open';
    if (it.spell && isScroll(it)) return 'Read'; if (it.spell) return 'Cast';
    if (!(it.cat === 'consumable' && (it.heal || it.buff)) || it.throw || it.escape) return '';
    return tg.indexOf('drink') >= 0 || /potion|tonic|water|soda|coffee|juice|tea\b|drink/i.test(it.name) ? 'Drink' : tg.indexOf('food') >= 0 ? 'Eat' : 'Use';
  }
  function quickGo(it) { if (it.spell) { if (UI.bag) bagToggle(); useItem(it); return; } useItem(it); }
  function facetsFor(cat, items) {
    if (cat === 'scroll' || cat === 'box') return [];
    if (FACETS[cat]) return FACETS[cat];
    var cnt = {}; items.forEach(function (it) { if (cat !== 'all' && it.cat !== cat) return; ((ITEMS[it.name] || {}).tags || it.tags || []).forEach(function (t) { if (TAGNAME[t]) cnt[t] = (cnt[t] || 0) + 1; }); });
    return Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 8).map(function (t) { return [t, TAGNAME[t]]; });
  }
  function bagDraw() {
    var el = document.getElementById('bag'), items = bagItems(), q = UI.q.toLowerCase(); UI.sub = UI.sub || ''; UI.rar = UI.rar || 'any'; UI.sort = UI.sort || 'name';
    var facets = facetsFor(UI.cat, items); if (UI.sub && !facets.some(function (f) { return f[0] === UI.sub; })) UI.sub = '';
    var list = items.map(function (it, i) { return { it: it, i: i }; }).filter(function (o) { return (UI.cat === 'all' || (UI.cat === 'scroll' ? isScroll(o.it) : UI.cat === 'box' ? isBox(o.it) : o.it.cat === UI.cat)) && (!UI.sub || hasFacet(o.it, UI.sub)) && (UI.rar === 'any' || (UI.rar === 'rare' ? rarRank(o.it) >= 3 : rarRank(o.it) === (UI.rar === 'uncommon' ? 2 : 1))) && (!q || (o.it.name + ' ' + (o.it.desc || '') + ' ' + ((ITEMS[o.it.name] || {}).tags || []).join(' ')).toLowerCase().indexOf(q) >= 0); });
    if (UI.sort === 'rarity') list.sort(function (a, b) { return rarRank(b.it) - rarRank(a.it) || a.it.name.localeCompare(b.it.name); });
    else if (UI.sort === 'dmg') list.sort(function (a, b) { return dmgAvg(b.it) - dmgAvg(a.it) || a.it.name.localeCompare(b.it.name); });
    else if (UI.sort === 'name') list.sort(function (a, b) { return a.it.name.localeCompare(b.it.name); });
    else if (UI.sort === 'found') list.reverse();
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
      '<div id="bagSub">' + (facets.length ? facets.map(function (f) { return '<button type="button" class="chip3' + (UI.sub === f[0] ? ' on' : '') + '" data-sub="' + f[0] + '">' + f[1] + '</button>'; }).join('') : '') +
        '<select id="bagRar" aria-label="Rarity"><option value="any">Any rarity</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare +</option></select>' +
        '<select id="bagSort" aria-label="Sort"><option value="name">Sort: name</option><option value="rarity">Sort: rarity</option><option value="dmg">Sort: damage</option><option value="found">Sort: newest</option></select></div>' +
      '<div id="bagList">' + (list.length ? list.map(function (o) {
        var t = o.it.worn ? 'worn' : o.k === '#hand' ? 'in hand' : o.k === '#back' ? 'on back' : '';
        return '<button type="button" data-i="' + o.i + '" class="' + (o.all.indexOf(UI.sel) >= 0 ? 'on' : '') + (o.it.rarity ? ' r-' + String(o.it.rarity).toLowerCase() : '') + (o.it.bonus ? ' magic' : '') + '">' + itemIcon(o.it) + '<span>' + esc(o.it.name) + '</span>' + (o.n > 1 ? '<b class="qn">×' + o.n + '</b>' : '') + (t ? '<span class="tag">' + t + '</span>' : '') + (quickUse(o.it) ? '<span class="qu" role="button" data-qu="' + o.i + '">' + quickUse(o.it) + '</span>' : '') + '</button>';
      }).join('') : '<p style="padding:10px">' + (items.length ? 'Nothing matches.' : (CHAR ? 'Your pockets are empty. Loot something.' : 'Create a character to get your starting gear.')) + '</p>') + '</div>' +
      '<div id="bagInfo">' + (sel ? bagInfo(sel) : '<p>Pick an item to see what it does.</p>') + '</div></div></div>';
    document.getElementById('bagSwap').onclick = swapWeapons;
    document.getElementById('bagSheet').onclick = function () { bagToggle(); charToggle(); };
    document.getElementById('bagCraft').onclick = function () { bagToggle(); craftToggle(); };
    setTimeout(function () { var cv = document.getElementById('heroPic'); if (cv) heroShot(cv); }, 30);
    document.getElementById('bagX').onclick = bagToggle;
    var qi = document.getElementById('bagQ'); qi.oninput = function () { UI.q = qi.value; var pos = qi.selectionStart; bagDraw(); var n = document.getElementById('bagQ'); n.focus(); n.setSelectionRange(pos, pos); };
    qi.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    el.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { UI.cat = b.dataset.cat; UI.sub = ''; bagDraw(); }; });
    el.querySelectorAll('[data-sub]').forEach(function (b) { b.onclick = function () { UI.sub = UI.sub === b.dataset.sub ? '' : b.dataset.sub; bagDraw(); }; });
    var br = document.getElementById('bagRar'), bs = document.getElementById('bagSort'); br.value = UI.rar; bs.value = UI.sort; br.onchange = function () { UI.rar = br.value; bagDraw(); }; bs.onchange = function () { UI.sort = bs.value; bagDraw(); };
    el.querySelectorAll('[data-qu]').forEach(function (b) { b.onclick = function (ev) { ev.stopPropagation(); var it = items[+b.dataset.qu]; if (it) quickGo(it); }; });
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
    if (ITEMS[it.name] && ITEMS[it.name].ammo) acts.push(CHAR.ammo === it.name ? ['unnock', 'Stop preferring these'] : ['nock', 'Load these first']);
    if (it.name === 'Paintball gun') acts.push(it.noTank ? ((CHAR.gear || []).some(function (g) { return g.name === 'CO2 tank'; }) ? ['tankon', 'Screw a CO2 tank on'] : null) : ['tankoff', 'Unscrew the CO2 tank']);
    acts = acts.concat(lampActs(it));
    if (!it.throw && burnsKnown(it)) acts.push(['light', 'Light it and throw']);
    if (hotEligible(it)) if (hotHas(it.name)) acts.push(['unhot', 'Take off hot bar']); else { acts.push(['hot', 'Put on ' + (hotKind(it) === 'eat' ? 'Consumables' : 'Gear') + ' bar']); acts.push(['hotO', 'Put on ' + (hotKind(it) === 'eat' ? 'Gear' : 'Consumables') + ' bar']); } if (loreHidden(it).length) acts.push(['inspect', 'Inspect (INT + Alchemy)']);
    if (it.throw || it.escape || it.box || (it.buff && !it.heal)) { acts.push(['use', it.box ? 'Open (safe room)' : it.escape ? 'Use (escape a fight)' : it.throw ? 'Throw' + (it.uses ? ' (' + (it.usesLeft === undefined ? it.uses : it.usesLeft) + ' left)' : '') : 'Use']); }
    if (it.cat === 'consumable' && it.heal) { acts.push(['use', 'Use (' + it.heal + ' HP)']); }
    if (it.spell) acts.push(['qcast', isScroll(it) ? 'Read the scroll (aim)' : 'Cast (aim)']);
    return '<h3>' + esc(it.name) + '</h3><p>' + esc(it.desc || 'No description. The System could not be bothered.') + '</p>' +
      loreLine(it) + (it.bonus ? '<p><b style="color:#7A1F1A">Enchanted · +' + it.bonus + ' to hit and damage</b></p>' : '') +
      '<p><small>' + (it.rarity ? esc(it.rarity) + ' · ' : '') + esc(catName(it.cat)) + (it.dmg ? ' · damage ' + esc(it.dmg) : '') + (ITEMS[it.name] && ITEMS[it.name].twoHand ? ' · two-handed' : '') + (ITEMS[it.name] && ITEMS[it.name].ammo ? ' · ' + (ITEMS[it.name].ammo.kind || 'arrow') + ' ammo · 1d' + ITEMS[it.name].ammo.s : '') + (it.slot ? ' · ' + esc(slotLabel(it.slot)) : '') + (it.from ? ' · from ' + esc(it.from) : '') + (isLamp(it) ? ' · battery ' + (it.charge === undefined ? 100 : it.charge) + '%' + (it.worn ? (it.lit ? ' · on' : ' · off') : '') : '') + '</small></p>' +
      '<div class="acts">' + acts.filter(Boolean).map(function (a) { return '<button type="button" class="ccBtn" data-act="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  }
  function bagAct(a, it) {
    if (!it) return;
    if (a === 'back') { if (CHAR.wield === it.name && (CHAR.gear || []).filter(function (g) { return g.name === it.name; }).length < 2) CHAR.wield = null; CHAR.back = it.name; buildHero(); say('On your back · ' + it.name, 'Swap to it any time. In a fight the first swap each turn is free.', 3000); }
    if (a === 'unback') { CHAR.back = null; buildHero(); }
    if (a === 'wield' && ITEMS[it.name] && ITEMS[it.name].twoHand && look.off[0]) setTimeout(function () { say('Two-handed', it.name + ' takes both hands. Your off hand is empty while you hold it.', 3200); }, 1400);
    if (a === 'wield') { if (CHAR.back === it.name && (CHAR.gear || []).filter(function (g) { return g.name === it.name; }).length < 2) CHAR.back = CHAR.wield || null; CHAR.wield = it.name; buildHero(); say('In hand · ' + it.name, 'You will fight with it: ' + it.dmg + ' damage.', 3000); }
    if (a === 'unwield') { CHAR.wield = null; buildHero(); }
    if (a === 'nock') { CHAR.ammo = it.name; saveChar(CHAR); say('Arrows · ' + it.name, 'Your bow shoots these first.', 2600); }
    if (a === 'tankoff') { setTimeout(function () { achieve('tank'); }, 1500); it.noTank = true; var tk = item('CO2 tank', { from: 'your paintball marker' }); if (tk) invAdd(tk, true); saveChar(CHAR); if (CHAR.wield === it.name) buildHero(); say('CO2 tank', 'Unscrewed with a hiss. The marker will not shoot until a tank goes back on. Try jury-rigging the tank.', 4000); }
    if (a === 'tankon') { var t2 = (CHAR.gear || []).filter(function (g) { return g.name === 'CO2 tank'; })[0]; if (t2) { t2.qty = (t2.qty || 1) - 1; if (t2.qty <= 0) CHAR.gear.splice(CHAR.gear.indexOf(t2), 1); it.noTank = false; saveChar(CHAR); if (CHAR.wield === it.name) buildHero(); say('CO2 tank', 'Screwed on. Pressure is up. Ready to splat.', 3000); } }
    if (a === 'unnock') { CHAR.ammo = null; saveChar(CHAR); }
    if (a === 'wear') wear(it);
    if (a === 'unwear') { it.worn = false; look[it.slot] = [0, 0]; buildHero(); saveLook(); }
    if (/^lamp/.test(a)) lampAct(a, it);
    if (a === 'inspect') loreInspect(it);
    if (a === 'use') useItem(it);
    if (a === 'qcast') { quickGo(it); return; }
    if (a === 'drop') dropBody(it);
    if (a === 'hot') { hotPut(it.name); }
    if (a === 'hotO') { hotPut(it.name, false, hotKind(it) === 'eat' ? 'hotbar2' : 'hotbar'); }
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
    e.dead = true; e.hp = 0; e.calm = false; e.diedAt = Date.now(); e.obj.visible = true; if (e.bar) e.bar.style.display = 'none'; // it comes out a body, and its clock starts again
    if (e.mixer && e.clips && e.clips.Death01) { e.cur = ''; cbPlay(e, 'Death01', true); }
    CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; saveChar(CHAR); if (typeof worldSave === 'function') worldSave(); refreshFog();
    say('Dropped · ' + e.name, 'It flops onto the floor. Anything hungry nearby will notice.', 3500);
  }
  // ---------- consumables and the hot bar: four quick slots; in a fight using one is your bonus action ----------
  var HOT_N = 5;
  function heals(it) { var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(it.heal || ''); return (m ? d(+m[1], +m[2]) + (+m[3] || 0) : +it.heal || 1) + healSkillBonus(it); }
  function useItem(it) {
    if (!CHAR || !it || CHAR.dead) return false;
    if (it.spell || it.throw || it.escape || it.box || (it.buff && !it.heal)) return itemSpecial(it);
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
  function hotClean() { // slots whose item has left the bag are empty again (sold, given away, eaten elsewhere)
    if (!CHAR) return; var have = {}; (CHAR.gear || []).forEach(function (g) { have[g.name] = 1; });
    ['hotbar', 'hotbar2'].forEach(function (k) { if (CHAR[k]) CHAR[k] = CHAR[k].slice(0, HOT_N).map(function (n) { return n && have[n] ? n : null; }); });
  }
  function hotEligible(it) { return !!it && ((it.cat === 'consumable' && (it.heal || it.buff)) || !!it.spell || !!it.throw || !!it.escape || burnsKnown(it)); }
  // tap a bar's name (or an empty slot) to fill it: everything in your bag that can go on a hot bar, tap to add, tap again to take off
  function hotPick(bar, slot) {
    var el = document.getElementById('hotpick'); if (!el) { el = document.createElement('div'); el.id = 'hotpick'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Fill the hot bar'); document.body.appendChild(el); }
    hotClean(); var name = bar === 'hotbar' ? 'Consumables' : 'Gear', seen = {}, rows = [];
    (CHAR.gear || []).forEach(function (g) { if (!hotEligible(g) || seen[g.name]) return; seen[g.name] = 1; var n = (CHAR.gear || []).filter(function (x) { return x.name === g.name; }).reduce(function (a, x) { return a + (x.usesLeft !== undefined ? x.usesLeft : x.qty || 1); }, 0); rows.push({ it: g, n: n }); });
    rows.sort(function (a, b) { return (hotKind(a.it) === (bar === 'hotbar' ? 'eat' : 'act') ? 0 : 1) - (hotKind(b.it) === (bar === 'hotbar' ? 'eat' : 'act') ? 0 : 1) || a.it.name.localeCompare(b.it.name); });
    var used = (CHAR[bar] || []).filter(Boolean).length, cur = slot !== undefined ? (CHAR[bar] || [])[slot] : null;
    el.innerHTML = '<div class="hph"><b>' + (cur ? 'Swap slot ' + (bar === 'hotbar' ? slot + 1 : (slot + 6) % 10) + ': ' + esc(cur) : slot !== undefined ? 'Fill slot ' + (bar === 'hotbar' ? slot + 1 : (slot + 6) % 10) : 'Fill the ' + name + ' bar') + '</b><span>' + (cur ? 'Pick a replacement' : used + ' of ' + HOT_N + ' slots used' + (used >= HOT_N ? ' · long-press a slot to swap it' : '')) + '</span>' + (cur ? '<button type="button" class="hpo">Take it off</button>' : '') + '<button type="button" class="hpx" aria-label="Close">✕</button></div>' +
      (rows.length ? '<div class="hpl">' + rows.map(function (r) { var on = (CHAR.hotbar || []).indexOf(r.it.name) >= 0 ? 'hotbar' : (CHAR.hotbar2 || []).indexOf(r.it.name) >= 0 ? 'hotbar2' : '';
        return '<button type="button" data-pn="' + esc(r.it.name) + '" class="' + (on === bar ? 'on' : '') + '">' + itemIcon(r.it) + '<span><b>' + esc(r.it.name) + ' ×' + r.n + '</b><em>' + (r.it.name === cur ? 'In this slot now' : on === bar ? (cur ? 'On this bar · tap to move it here' : 'On this bar · tap to take off') : on ? 'On the ' + (on === 'hotbar' ? 'Consumables' : 'Gear') + ' bar · tap to move here' : r.it.heal ? 'Heals ' + esc(r.it.heal) : r.it.throw ? 'Throw' : r.it.buff ? 'Buff' : burnsKnown(r.it) ? 'Light and throw' : 'Use') + '</em></span></button>'; }).join('') + '</div>'
      : '<p>Nothing in your bag can go on a hot bar yet. Food, potions, bombs and other throwables can.</p>');
    el.style.display = 'block';
    el.querySelector('.hpx').onclick = function () { el.style.display = 'none'; };
    var ho = el.querySelector('.hpo'); if (ho) ho.onclick = function () { CHAR[bar][slot] = null; saveChar(CHAR); hotDraw(); el.style.display = 'none'; };
    el.querySelectorAll('[data-pn]').forEach(function (b) { b.onclick = function () { var n = b.getAttribute('data-pn');
      if (cur) { if (n !== cur) { hotOff(n); CHAR[bar][slot] = null; hotPut(n, true, bar, slot); } el.style.display = 'none'; return; }
      if ((CHAR[bar] || []).indexOf(n) >= 0) hotOff(n); else { hotOff(n); if ((CHAR[bar] || []).filter(Boolean).length >= HOT_N) { say('Hot bar full', 'Take something off the ' + name + ' bar first.', 2200); return; } hotPut(n, true, bar, slot); slot = undefined; }
      hotPick(bar); }; });
  }
  function hotPut(name, quiet, bar, slot) {
    hotClean(); var it = (CHAR.gear || []).filter(function (g) { return g.name === name; })[0], k = bar || hotKey(hotKind(it)), o = k === 'hotbar' ? 'hotbar2' : 'hotbar';
    CHAR[k] = CHAR[k] || []; while (CHAR[k].length < HOT_N) CHAR[k].push(null);
    if (CHAR[o]) CHAR[o] = CHAR[o].map(function (n) { return n === name ? null : n; });
    if (CHAR[k].indexOf(name) >= 0) return; var i = slot !== undefined && slot >= 0 && slot < HOT_N && !CHAR[k][slot] ? slot : CHAR[k].indexOf(null);
    if (i < 0) { if (!quiet) say('Hot bar full', 'Take something off the ' + (k === 'hotbar' ? 'Consumables' : 'Gear') + ' bar first (in your inventory).', 2600); return; }
    CHAR[k][i] = name; saveChar(CHAR); hotDraw();
    if (!quiet) say('Hot bar · ' + name, 'On the ' + (k === 'hotbar' ? 'Consumables' : 'Gear') + ' bar, slot ' + (k === 'hotbar' ? i + 1 : (i + 6) % 10) + '. Close your bag to see it.', 2600);
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
    hotClean(); var el = document.getElementById('hotbar');
    if (!el) { el = document.createElement('div'); el.id = 'hotbar'; document.body.appendChild(el); }
    var show = CHAR && !gearOpen && !CC && !AUTH.open && !CHAR.dead && !UI.bag && !(typeof CRAFT !== 'undefined' && CRAFT.open); el.style.display = show ? 'flex' : 'none'; if (!show) { var hp0 = document.getElementById('hotpick'); if (hp0) hp0.style.display = 'none'; return; }
    var html = '', mine = !CB.on || (cbMyTurn() && !CB.busy);
    [['hotbar', 'Consumables', 'bonus'], ['hotbar2', 'Gear', 'action']].forEach(function (bar, bi) {
      html += '<div class="hb"><small data-pick="' + bar[0] + '" data-l="' + bar[1].charAt(0) + '" role="button" tabindex="0" title="Tap to fill this bar">' + bar[1] + ' <u>+</u><em>' + (bar[2] === 'bonus' ? 'bonus action' : 'action') + '</em></small><div class="hs">';
      for (var i = 0; i < HOT_N; i++) { var it = hotItem(i, bar[0]), can = it && mine && (!CB.on || CB.res[bar[2]]), key = bi === 0 ? i + 1 : (i + 6) % 10;
        var tip = it ? it.name + (it.heal ? ' · ' + it.heal + ' HP' : it.throw ? ' · throw' : burnsKnown(it) ? ' · light and throw' : '') : 'Empty: tap to pick something';
        html += '<button type="button" data-h="' + i + '" data-k="' + bar[0] + '" class="' + (can ? 'ready' : '') + (it && !it.throw && burnsKnown(it) ? ' fire' : '') + (it ? '' : ' empty') + '"' + ' aria-label="' + esc(tip) + '" title="' + esc(tip) + '"><i>' + key + '</i>' + (it ? itemIcon(it) + '<b>×' + (it.usesLeft !== undefined ? it.usesLeft : it.qty || 1) + '</b><span class="hn">' + esc(it.name) + '</span>' : '') + '</button>'; }
      html += '</div></div>';
    });
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html;
      if (!el.dataset.lp) { el.dataset.lp = 1; var LP = null; // tap = use; long-press or right-click = swap or take off. Delegated, so a redraw mid-press cannot lose it
        var slotOf = function (ev) { var b = ev.target.closest && ev.target.closest('[data-h]'); return b ? { i: +b.dataset.h, k: b.dataset.k } : null; };
        el.addEventListener('contextmenu', function (ev) { if (slotOf(ev)) ev.preventDefault(); });
        el.addEventListener('pointerdown', function (ev) { var s0 = slotOf(ev); if (!s0) return; ev.preventDefault(); ev.stopPropagation();
          if (!hotItem(s0.i, s0.k) || ev.button === 2) { LP = null; hotPick(s0.k, s0.i); return; }
          if (LP) clearTimeout(LP.t); LP = s0; LP.t = setTimeout(function () { if (LP === s0) { LP.menu = true; hotPick(s0.k, s0.i); } }, 450); });
        var up = function (ev) { if (!LP) return; var s1 = LP; LP = null; clearTimeout(s1.t); if (!s1.menu && ev.type === 'pointerup') hotUse(s1.i, s1.k); };
        el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
      el.querySelectorAll('[data-pick]').forEach(function (s2) { s2.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); hotPick(s2.dataset.pick); }); }); }
  }
  function hotUse(i, k) { var it = hotItem(i, k); if (!it) return; if (canAim(it) && (it.throw || k === 'hotbar2')) aimStart(it, !it.throw); else useItem(it); } // throwables aim from either bar
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
    return { name: it.name.toLowerCase(), n: +m[1], s: +m[2], stat: stat, clip: light ? 'Punch_Jab' : 'Sword_Attack', hit: PROF() + MOD[stat] + fam + bon + (+it.acc || 0) + weaponSkillBonus(sk) + buffHit(), edmg: it.edmg || null, dmgB: MOD[stat] + bon, fam: fam, magic: bon, skey: sk, crit: +it.crit || 20, onHit: it.onHit || null };
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
      '<div class="wh"' + (bowHeld() ? ' id="wAmmo" role="button" tabindex="0" style="cursor:pointer"' : '') + '><small>In hand</small><b>' + (w ? esc(w.name) : 'Fists') + '</b><span>' + (bowHeld() ? ammoLine() : w && w.dmg ? esc(w.dmg) + (w.bonus ? ' · +' + w.bonus : '') : '1d4 + STR') + '</span></div>' +
      '<button type="button" id="wSwap" aria-label="Swap weapons"' + (b ? '' : ' disabled') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></button>';
    document.getElementById('wSwap').onclick = swapWeapons;
    var wa = document.getElementById('wAmmo'); if (wa) wa.onclick = ammoCycle;
  }
  // the arrows on the string: the ones you picked stay loaded until you switch (tap the In hand card)
  function ammoTypes() { var L = launcherOf(CHAR.wield), kind = (L && L.ammo) || 'arrow'; return (CHAR.gear || []).filter(function (g) { var A = ITEMS[g.name] && ITEMS[g.name].ammo; return A && (A.kind || 'arrow') === kind && (g.qty || 1) > 0; }); }
  // what a kind of ammo does, in a few words (the In hand card, the switch message)
  function ammoWhat(n) { var A = ITEMS[n] && ITEMS[n].ammo; if (!A) return ''; if (A.plain) return 'no damage · a crit blinds';
    if (A.splash) return A.splash.type === 'acid' ? 'coats in acid' : A.splash.type === 'poison' ? 'coats in poison' : A.splash.area === 'grease' ? 'greases them and the floor' : A.splash.douse ? 'soaks them in oil' : 'splashes';
    return '1d' + A.s + (A.acc ? ' · +' + A.acc + ' hit' : '') + (A.onHit && A.onHit.type === 'burn' ? ' · fire' : '') + (A.edmg ? ' · +' + A.edmg.dice + ' ' + A.edmg.type : ''); }
  function ammoNoun() { var k = (launcherOf(CHAR.wield) || {}).ammo || 'arrow'; return k === 'paintball' ? 'paintballs' : k === 'pebble' ? 'pebbles' : 'arrows'; }
  function ammoLine() { var k = (launcherOf(CHAR.wield) || {}).ammo || 'arrow', a = ammoPick(k); if (!a) return 'No ' + ammoNoun() + ' · tap for how'; var n = ammoTypes().length; return 'Loaded: ' + esc(a.name) + ' ×' + (a.qty || 1) + ' · ' + ammoWhat(a.name) + (n > 1 ? ' · tap to switch' : ''); }
  function ammoCycle() { var st = ammoTypes(), k = (launcherOf(CHAR.wield) || {}).ammo || 'arrow'; if (st.length < 2) { say('Ammo', st.length ? st[0].name + ' is the only kind you have.' : 'No ' + ammoNoun() + '. ' + (AMMO_HINT[k] || ''), 3000); return; }
    var cur = ammoPick(k), i = st.indexOf(cur), nx = st[(i + 1) % st.length]; CHAR.ammo = nx.name; saveChar(CHAR); wsetDraw(); if (CB.on) cbHUD();
    say('Loaded · ' + nx.name, ammoWhat(nx.name).replace(/^./, function (c) { return c.toUpperCase(); }) + '. ' + (nx.qty || 1) + ' left. It stays loaded until you switch.', 2800); }

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
    var K = [['shears', /shear|scissor|clipper|pruner|snip/], ['knife', /knife|blade|cutter|dagger|razor|scalpel|letter opener/], ['hammer', /hammer|mallet/], ['mace', /mace|morning star/], ['wrench', /wrench|spanner/],
      ['bat', /bat\b|club|stick|pipe|crowbar|cane|rod|pole|broom|mop/], ['phone', /phone|tablet|ipad/], ['laptop', /laptop|computer/], ['keys', /key/], ['tape', /tape|zip tie/], ['pick', /pick\b|picks|plectrum/],
      ['bandage', /gauze|bandage|band-aid|first aid/], ['snack', /snack|bar\b|food|jerky|apple|sandwich|gum|candy|chip/], ['drink', /bottle|flask|water|coffee|drink|can\b|potion/], ['opener', /opener|corkscrew/],
      ['rag', /rag|towel|cloth|apron/], ['badge', /badge|card|id\b|license|wallet/], ['coin', /coin|gold|button/], ['pen', /pen\b|pencil|marker|sharpie/], ['light', /flashlight|lighter|torch|lamp/],
      ['bag', /bag|pouch|backpack|purse|sack/], ['book', /book|notebook|manual|scroll/]];
    for (var i = 0; i < K.length; i++) if (K[i][1].test(n)) return K[i][0];
    return { weapon: 'bat', tool: 'wrench', consumable: 'drink', valuable: 'coin', misc: 'box' }[it.cat] || 'box';
  }
  var ICON = {
    stickbomb: '<path d="M4 26L14 16" stroke="#8a5a30" stroke-width="3.2" stroke-linecap="round"/><g transform="rotate(-45 18 10)"><rect x="12" y="5" width="12" height="10" rx="2" fill="#e8dcc0" stroke="#8a7a5a"/><path d="M14 7.5h8M14 10h8M14 12.5h6" stroke="#b8a888" stroke-width=".7"/><rect x="16.2" y="4.4" width="3.2" height="11.2" fill="#9aa0a6" stroke="#6a7076" stroke-width=".5"/></g><path d="M14.5 17.5c0 2 1 3 .2 4.5M18.5 16c1 2 .4 3 .4 4.5" stroke="#c8a040" stroke-width="1.5" stroke-linecap="round"/><path d="M22.5 4.5l1.5-2.5M24.5 6.5l3-1M21 3.5V1" stroke="#ff9a2a" stroke-width="1.4"/>',
    arrows: '<path d="M6 24L22 8M9 25L25 9M5 21L21 5" stroke="#8a5a30" stroke-width="1.6"/><path d="M22 8l1-4 3 1zM25 9l1-4 3 1zM21 5l1-4 3 1z" fill="#cfd6da"/><path d="M6 24l-2 1 1-3zM9 25l-2 1 1-3zM5 21l-2 1 1-3z" fill="#c84a3a"/>',
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
  // weapon skins: the same models repainted (kit2/wskin_*.jpg: only the metal changes, grips stay or get a matching wrap); enchanted ones glow
  var WSKIN = { steel: {}, crude: {}, gold: {}, storm: { glow: 0x5ac8ff, fx: 'spark' }, ember: { glow: 0xff5a14, fx: 'pulse' }, frost: { glow: 0x9adcff, fx: 'pulse' }, shadow: { glow: 0x8a4aff, fx: 'pulse' } }, WSKIN_MAT = {}, WGLOW = [], wglowT = 0;
  function wskinMat(k) {
    if (WSKIN_MAT[k]) return WSKIN_MAT[k]; var S = WSKIN[k];
    var m = new THREE.MeshLambertMaterial({ map: kitTex('wskin_' + k + '.jpg'), side: THREE.DoubleSide }); m.color.setScalar(1.35); m.userData.lit = 1;
    if (S.glow) { m.emissive = new THREE.Color(S.glow); m.emissiveMap = kitTex('wskin_glow.jpg'); m.emissiveIntensity = 0.8; WGLOW.push({ m: m, fx: S.fx }); }
    return (WSKIN_MAT[k] = m);
  }
  function wglowTick(dt) { // electric blades crackle, the others breathe
    if (!WGLOW.length) return; wglowT += dt;
    WGLOW.forEach(function (w) { w.m.emissiveIntensity = w.fx === 'spark' ? (Math.random() < 0.12 ? 2.4 : 0.55 + 0.25 * Math.sin(wglowT * 23)) : 0.75 + 0.35 * Math.sin(wglowT * 2.6); });
  }
  // is this a bow? catalog bows say so; anything crafted and called a bow is one too (crude: a little shorter and less accurate)
  function launcherOf(nm) {
    if (!nm) return null; var I = typeof ITEMS !== 'undefined' && ITEMS[nm]; if (I && I.bow) return I.bow;
    var g = typeof CHAR !== 'undefined' && CHAR ? (CHAR.gear || []).filter(function (x) { return x.name === nm; })[0] : null; if (g && g.bow) return g.bow;
    if (g && g.cat === 'weapon' && /\b(short|long|cross)?bow\b/i.test(nm) && !/elbow|rainbow|bowl|bowtie|bow tie/i.test(nm)) return { ammo: 'arrow', range: 12, long: 36, acc: -1, crude: true };
    if (g && g.cat === 'weapon' && /sling ?shot|wrist.?rocket/i.test(nm)) return { ammo: 'pebble', range: 6, long: 24, acc: -1, crude: true, pose: 'sling', fly: 'pebble' }; // homemade slingshots work too
    return null;
  }
  var AXE_YAW = Math.PI;
  function gearModel(g0, it) {
    var k = itemKind(it), RED = 0xb02828, g = new THREE.Group(); g.scale.setScalar(1.35); g0.add(g);
    // weapons with a real model (kit2/weapons.json): grip just above the pommel, blade up; a bow is held in the middle
    var IB = (typeof ITEMS !== 'undefined' && ITEMS[it.name]) || it; if (!IB.model && !IB.proc && launcherOf(it.name)) IB = { model: 'w_bow', len: 0.7, bow: true, skin: 'crude' }; // a homemade bow looks like a rough version of ours
    if (IB.proc === 'sling') { // a wrist-rocket: wooden handle, a fork, orange tubing and a pouch
      var wd = new THREE.MeshLambertMaterial({ color: 0x9a6a3a }), tb = new THREE.MeshLambertMaterial({ color: 0xe86a28 }), lt = new THREE.MeshLambertMaterial({ color: 0x5a3a20 });
      var hd = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.16, 6), wd); hd.position.y = 0.06; g.add(hd);
      [-1, 1].forEach(function (sd) { var pr = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.12, 5), wd); pr.position.set(sd * 0.03, 0.18, 0); pr.rotation.z = -sd * 0.45; g.add(pr);
        var tu = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 4), tb); tu.position.set(sd * 0.035, 0.24, -0.05); tu.rotation.x = 1.1; g.add(tu); });
      var pc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.03), lt); pc.position.set(0, 0.22, -0.1); g.add(pc); return; }
    // everyday weapons built from Michael's reference photos. Frame: the hand at the origin, the item up +y, +z is the side that faces away from you
    if (IB.proc === 'racket' || IB.proc === 'crowbar' || IB.proc === 'cleaver' || IB.proc === 'drill' || IB.proc === 'golf' || IB.proc === 'keyboard' || IB.proc === 'plunger' || IB.proc === 'mop' || IB.proc === 'hedge' || IB.proc === 'stapler' || IB.proc === 'rake' || IB.proc === 'broom' || IB.proc === 'chef') {
      var LM = function (c, e) { return new THREE.MeshLambertMaterial({ color: c, emissive: e || 0x000000 }); };
      var bxm = function (w, h, d, m, x, y, z) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
      var cym = function (r1, r2, h, m, x, y, z, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 10), m); o.position.set(x, y, z); g.add(o); return o; };
      if (IB.proc === 'racket') { // black frame, open throat, strung oval head, tan leather grip
        var blk = LM(0x1e2024), lea = LM(0xb06a3a);
        cym(0.016, 0.017, 0.2, lea, 0, 0.02, 0); cym(0.018, 0.018, 0.012, blk, 0, -0.08, 0); cym(0.014, 0.016, 0.03, blk, 0, 0.135, 0);
        [-1, 1].forEach(function (sd) { var th = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.15, 6), blk); th.position.set(sd * 0.03, 0.22, 0); th.rotation.z = -sd * 0.38; g.add(th); });
        var rim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 32), blk); rim.scale.set(1, 1.32, 1); rim.position.y = 0.42; g.add(rim);
        var sc = document.createElement('canvas'); sc.width = sc.height = 64; var sx = sc.getContext('2d'); sx.strokeStyle = '#e8e4d8'; sx.lineWidth = 1.2; for (var i = 2; i < 64; i += 5) { sx.beginPath(); sx.moveTo(i, 0); sx.lineTo(i, 64); sx.stroke(); sx.beginPath(); sx.moveTo(0, i); sx.lineTo(64, i); sx.stroke(); }
        var st = new THREE.Mesh(new THREE.CircleGeometry(0.098, 28), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide })); st.scale.set(1, 1.32, 1); st.position.y = 0.42; g.add(st);
        return; }
      if (IB.proc === 'crowbar') { // a dark iron bar: chisel at the bottom, gooseneck and split claw at the top
        var irn = LM(0x34363a, 0x0c0d0e);
        var path = new THREE.CurvePath(); path.add(new THREE.LineCurve3(new THREE.Vector3(0, -0.12, 0), new THREE.Vector3(0, 0.48, 0)));
        path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.48, 0), new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, 0.6, 0.07)));
        path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.6, 0.07), new THREE.Vector3(0, 0.6, 0.11), new THREE.Vector3(0, 0.56, 0.12)));
        g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.012, 6, false), irn));
        [-1, 1].forEach(function (sd) { var cl = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.03, 0.012), irn); cl.position.set(sd * 0.007, 0.545, 0.125); cl.rotation.x = 0.4; g.add(cl); });
        var ch = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.035, 0.008), irn); ch.position.set(0, -0.135, 0.004); ch.rotation.x = 0.25; g.add(ch);
        return; }
      if (IB.proc === 'cleaver') { // rectangular steel blade with a hole, wooden handle with brass rivets
        var stl = LM(0x8e969e, 0x08090a), wdc = LM(0x9a4a28), brs = LM(0xd8b048);
        bxm(0.018, 0.13, 0.03, wdc, 0, 0, 0); [-0.04, 0, 0.04].forEach(function (yy) { [-1, 1].forEach(function (sd) { cym(0.006, 0.006, 0.002, brs, sd * 0.0095, yy, 0, 8).rotation.z = Math.PI / 2; }); });
        var bl = bxm(0.005, 0.16, 0.11, stl, 0, 0.145, 0.035); // the blade: spine over the handle, edge out front
        var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 10), LM(0x1a1a1a)); hole.rotation.z = Math.PI / 2; hole.position.set(0, 0.2, 0.0); g.add(hole);
        bxm(0.0052, 0.16, 0.006, LM(0xc4c8cc, 0x101214), 0, 0.145, 0.088); // bright honed edge
        return; }
      if (IB.proc === 'golf') { // black grip, long chrome shaft, a lofted wedge head
        var blkG = LM(0x1c1e22), chr = LM(0xb8bec6, 0x14181c);
        cym(0.015, 0.013, 0.2, blkG, 0, 0.03, 0); cym(0.016, 0.016, 0.008, LM(0x3ac0b8), 0, 0.13, 0);
        cym(0.0055, 0.0075, 0.62, chr, 0, 0.44, 0); cym(0.009, 0.007, 0.03, blkG, 0, 0.76, 0);
        var hd = bxm(0.016, 0.05, 0.085, chr, 0, 0.795, 0.035); hd.rotation.x = 0.35; var fc = bxm(0.017, 0.046, 0.07, LM(0xa8aeb6, 0x0c0e10), 0.0005, 0.795, 0.04); fc.rotation.x = 0.35; // the face
        return; }
      if (IB.proc === 'keyboard') { // a black split ergonomic keyboard, held by one end
        var kc = document.createElement('canvas'); kc.width = 64; kc.height = 128; var kx = kc.getContext('2d'); kx.fillStyle = '#1a1b1e'; kx.fillRect(0, 0, 64, 128); kx.fillStyle = '#3a3c42';
        for (var ky = 4; ky < 92; ky += 11) for (var kk = 4; kk < 60; kk += 11) if (!(ky > 40 && ky < 52)) kx.fillRect(kk, ky, 9, 9); // keys, with the split down the middle
        kx.fillStyle = '#26282c'; kx.fillRect(4, 98, 56, 26); // wrist rest
        var kmat = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(kc) }), kblk = LM(0x18191c);
        [-1, 1].forEach(function (sd) { var hf = new THREE.Group(); hf.position.set(0, 0.2 + sd * 0.09, 0.02); hf.rotation.x = sd * 0.12; g.add(hf);
          var body = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.18, 0.15), [kblk, kblk, kblk, kblk, kblk, kblk]); hf.add(body);
          var top = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.18), kmat); top.rotation.y = Math.PI / 2; top.position.x = 0.0115; hf.add(top); });
        bxm(0.026, 0.06, 0.04, kblk, 0, 0.05, -0.04); // the end you hold
        return; }
      if (IB.proc === 'plunger') { // a wooden handle and a red rubber cup
        var wd = LM(0xc89a68), rub = LM(0xb8432a);
        cym(0.013, 0.013, 0.5, wd, 0, 0.17, 0);
        var neck = cym(0.022, 0.018, 0.035, rub, 0, 0.43, 0); var cup = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xb8432a, side: THREE.DoubleSide })); cup.scale.set(1, 0.8, 1); cup.position.y = 0.445; g.add(cup);
        var lip = new THREE.Mesh(new THREE.TorusGeometry(0.069, 0.008, 6, 20), rub); lip.rotation.x = Math.PI / 2; lip.position.y = 0.445; g.add(lip); cup.rotation.x = Math.PI; cup.position.y = 0.5; lip.position.y = 0.5; // open end facing out
        return; }
      if (IB.proc === 'mop') { // a wooden handle and a skirt of cotton strings
        var wdm = LM(0xc8944e), cot = LM(0xe8dcc0);
        cym(0.013, 0.013, 0.7, wdm, 0, 0.25, 0); cym(0.022, 0.026, 0.035, cot, 0, 0.6, 0);
        for (var mi = 0; mi < 22; mi++) { var an = mi / 22 * Math.PI * 2, sr = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.16 + (mi % 3) * 0.02, 0.01), cot); sr.position.set(Math.cos(an) * 0.03, 0.69, Math.sin(an) * 0.03); sr.rotation.set(Math.sin(an) * 0.14, 0, -Math.cos(an) * 0.14); g.add(sr); }
        return; }
      if (IB.proc === 'hedge') { // a scissor: grips apart, red handles meeting at the pivot, one black and one silver blade opening beyond it
        var redH = LM(0xc8201c), blkH = LM(0x1c1d20), slv = LM(0x868e96), gry = LM(0x7a8088), PY = 0.38;
        var seg = function (m, r, a, b) { var d = new THREE.Vector3().subVectors(b, a), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); return o; };
        [-1, 1].forEach(function (sd) { var V = THREE.Vector3, g0p = new V(0, -0.06, sd * 0.05), g1p = new V(0, 0.04, sd * 0.042), j = new V(0, PY - 0.03, sd * 0.012), pvt = new V(0, PY, 0), tip = new V(0, PY + 0.3, -sd * 0.035);
          seg(blkH, 0.016, g0p, g1p); seg(redH, 0.011, g1p, j); seg(gry, 0.009, j, pvt);
          var bd = new V().subVectors(tip, pvt), bl = new THREE.Mesh(new THREE.BoxGeometry(0.004, bd.length(), 0.032), sd < 0 ? blkH : slv); bl.position.copy(pvt).addScaledVector(bd, 0.5); bl.position.x = sd * 0.0025; bl.quaternion.setFromUnitVectors(new V(0, 1, 0), bd.clone().normalize()); g.add(bl); });
        var pv = cym(0.014, 0.014, 0.012, LM(0xe8e8e8), 0, PY, 0); pv.rotation.z = Math.PI / 2;
        return; }
      if (IB.proc === 'stapler') { // glossy red arm over a black base, chrome head and anvil, held by the back end
        var rdS = new THREE.MeshPhongMaterial({ color: 0xc81e1e, shininess: 70, specular: 0x553333 }), bkS = LM(0x1a1a1c), crS = LM(0xc0c6cc, 0x16181a);
        bxm(0.032, 0.21, 0.012, bkS, 0, 0.06, -0.016); bxm(0.03, 0.2, 0.01, rdS, 0, 0.065, -0.006); // base
        var arm = bxm(0.03, 0.17, 0.032, rdS, 0, 0.08, 0.022); arm.rotation.x = 0.06; // the top arm
        bxm(0.031, 0.04, 0.04, rdS, 0, -0.025, 0.012); // the hinge end you hold
        bxm(0.016, 0.018, 0.016, crS, 0, 0.155, 0.002); bxm(0.018, 0.03, 0.002, crS, 0, 0.15, -0.0005); // chrome head and anvil
        return; }
      if (IB.proc === 'rake') { // a leaf rake: wooden handle, green neck, a fan of curved tines with a crossbar
        var wdR = LM(0xb87a40), grn = LM(0x1e4a2e);
        cym(0.012, 0.012, 0.72, wdR, 0, 0.25, 0); cym(0.016, 0.01, 0.06, grn, 0, 0.63, 0);
        for (var ti = 0; ti < 17; ti++) { var f = (ti - 8) / 8, tn = new THREE.Group(); tn.position.set(f * 0.03, 0.66, 0); tn.rotation.z = -f * 0.55; g.add(tn);
          var t1 = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.2, 0.004), grn); t1.position.y = 0.1; tn.add(t1);
          var t2 = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.035, 0.004), grn); t2.position.set(0, 0.21, 0.012); t2.rotation.x = 0.8; tn.add(t2); } // tips curl toward the ground side
        var cb = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.005, 4, 20, 1.1), grn); cb.position.set(0, 0.62, 0); cb.rotation.z = Math.PI / 2 - 0.55; g.add(cb);
        return; }
      if (IB.proc === 'broom') { // after Michael's photo: red-brown handle, a rounded straw top flaring into a flat fan, teal stitching
        var bc = document.createElement('canvas'); bc.width = 64; bc.height = 32; var bx2 = bc.getContext('2d'); bx2.fillStyle = '#c8b060'; bx2.fillRect(0, 0, 64, 32);
        for (var bi = 0; bi < 40; bi++) { bx2.strokeStyle = ['#a89040', '#e0cc80', '#b8a050'][bi % 3]; bx2.beginPath(); var xx = Math.random() * 64; bx2.moveTo(xx, 0); bx2.lineTo(xx + (Math.random() - 0.5) * 4, 32); bx2.stroke(); }
        var strw = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(bc) }), tl = LM(0x2a9aa8);
        cym(0.012, 0.012, 0.72, LM(0x8a2a1c), 0, 0.25, 0);
        var top = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), strw); top.scale.set(1, 0.9, 0.55); top.rotation.x = Math.PI; top.position.y = 0.63; g.add(top);
        var fan = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.035, 0.3, 14, 1, false), strw); fan.scale.set(1, 1, 0.3); fan.position.y = 0.78; g.add(fan);
        [0.68, 0.695, 0.71, 0.725].forEach(function (yy) { var rr = 0.035 + (yy - 0.63) * 0.32; var band = new THREE.Mesh(new THREE.CylinderGeometry(rr + 0.004, rr + 0.004, 0.007, 14), tl); band.scale.set(1, 1, 0.3); band.position.y = yy; g.add(band); });
        return; }
      if (IB.proc === 'chef') { // black riveted handle, steel bolster, a wide blade tapering to a point, edge facing out
        var bkC = LM(0x1a1a1c), stC = LM(0x7c848c, 0x06080a), rv = LM(0xc8ccd0);
        bxm(0.016, 0.11, 0.024, bkC, 0, 0, 0); [-0.03, 0, 0.03].forEach(function (yy) { [-1, 1].forEach(function (sd) { cym(0.004, 0.004, 0.002, rv, sd * 0.0085, yy, 0, 8).rotation.z = Math.PI / 2; }); });
        bxm(0.018, 0.016, 0.03, stC, 0, 0.062, 0.002); // bolster
        var sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.2, -0.002); sh.lineTo(0.215, 0.006); sh.quadraticCurveTo(0.12, 0.03, 0, 0.042); sh.lineTo(0, 0);
        var bg = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false }); bg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0))); bg.translate(-0.0015, 0.07, -0.012);
        g.add(new THREE.Mesh(bg, stC));
        return; }
      if (IB.proc === 'drill') { // red and black body, pistol grip, battery pack, chuck and bit
        var red = LM(0xc8241c), bk = LM(0x24262a), sil = LM(0xa8acb2, 0x101214);
        var gp = bxm(0.032, 0.11, 0.042, bk, 0, 0, -0.01); gp.rotation.x = -0.18; bxm(0.034, 0.05, 0.02, red, 0, 0.0, 0.016).rotation.x = -0.18;
        bxm(0.05, 0.035, 0.08, red, 0, -0.07, 0.01); bxm(0.052, 0.012, 0.082, bk, 0, -0.055, 0.01); // battery
        bxm(0.046, 0.06, 0.1, red, 0, 0.08, 0.02); bxm(0.048, 0.03, 0.05, bk, 0, 0.09, -0.01); // motor housing
        var t1 = cym(0.022, 0.024, 0.05, bk, 0, 0.085, 0.095); t1.rotation.x = Math.PI / 2; var t2 = cym(0.016, 0.02, 0.04, sil, 0, 0.085, 0.14); t2.rotation.x = Math.PI / 2;
        var bit = cym(0.002, 0.005, 0.06, sil, 0, 0.085, 0.19, 6); bit.rotation.x = Math.PI / 2; // chuck and bit, pointing away from you
        bxm(0.01, 0.02, 0.012, bk, 0, 0.035, 0.03); // trigger
        return; }
    }
    if (IB.proc === 'letteropener') { // after Michael's photo: a wavy burl-wood handle, a round knob, a chrome collar, a long four-sided blade
      var LO = gearModel.lo || (gearModel.lo = (function () {
        var cv = document.createElement('canvas'); cv.width = 32; cv.height = 64; var c2 = cv.getContext('2d'); c2.fillStyle = '#c8a060'; c2.fillRect(0, 0, 32, 64);
        for (var i = 0; i < 9; i++) { c2.strokeStyle = i % 3 ? '#8a6030' : '#2a1a10'; c2.lineWidth = i % 3 ? 1 : 2; c2.beginPath(); var x0 = Math.random() * 32; c2.moveTo(x0, 0); c2.bezierCurveTo(x0 + 10, 20, x0 - 10, 44, x0 + 4, 64); c2.stroke(); }
        return { wood: new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }), chrome: new THREE.MeshLambertMaterial({ color: 0xb4bcc6, emissive: 0x14181c }) };
      })());
      var hd = new THREE.Group(); g.add(hd);
      [[-0.05, 0.016], [-0.03, 0.02], [-0.01, 0.017], [0.01, 0.021], [0.03, 0.018], [0.05, 0.02]].forEach(function (q, i, a) { var nx = a[i + 1]; if (!nx) return; var sg = new THREE.Mesh(new THREE.CylinderGeometry(nx[1], q[1], nx[0] - q[0], 10), LO.wood); sg.position.y = (q[0] + nx[0]) / 2; hd.add(sg); }); // the wavy grip
      var cap = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 6), LO.wood); cap.position.y = -0.05; hd.add(cap);
      var knob = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), LO.wood); knob.position.y = 0.072; g.add(knob);
      var col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.022, 10), LO.chrome); col2.position.y = 0.101; g.add(col2);
      var bl = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.011, 0.2, 4), LO.chrome); bl.position.y = 0.212; bl.rotation.y = Math.PI / 4; g.add(bl); // four-sided, tapering to a point
      return; }
    if (IB.proc === 'crossbow') { // after Michael's photos: a walnut rifle stock with a cheek notch, a black latch plate and lever, a steel prod with end caps, a wire string
      // same frame as the marker: +y toward the target, +z up, the hand on the wrist of the stock at the origin
      g.position.y = -0.16 * 1.35; g0.userData.muzzle = new THREE.Vector3(0, (0.3 - 0.16) * 1.35, 0.075 * 1.35); // held by the fore-end (the front hand); the bolt leaves the front of the tiller
      var XB = gearModel.xb || (gearModel.xb = (function () {
        var cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; var c2 = cv.getContext('2d'); c2.fillStyle = '#a07c4c'; c2.fillRect(0, 0, 32, 128);
        for (var i = 0; i < 26; i++) { c2.strokeStyle = ['#7e5e34', '#b8925e', '#6c4e2a'][i % 3]; c2.lineWidth = 1 + (i % 2); c2.beginPath(); var x0 = Math.random() * 32; c2.moveTo(x0, 0); c2.bezierCurveTo(x0 + 6, 40, x0 - 6, 88, x0 + 3, 128); c2.stroke(); }
        var tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.rotation = Math.PI / 2; tx.repeat.set(6, 6);
        return { wood: new THREE.MeshLambertMaterial({ map: tx }), iron: new THREE.MeshLambertMaterial({ color: 0x2a2c30 }), steel: new THREE.MeshLambertMaterial({ color: 0x3a3e44 }), wire: new THREE.LineBasicMaterial({ color: 0x8a8e94 }) };
      })());
      var xb = function (w, l, h, m, x, y, z, rx) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, l, h), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
      // the stock as one piece: a side profile (y along the gun, z up) cut out and given thickness
      var pf = new THREE.Shape(), P2 = [[0.33, 0.062], [0.33, 0.018], [0.03, 0.018], [-0.06, 0.004], [-0.27, -0.062], [-0.28, 0.07], [-0.13, 0.068], [-0.115, 0.05], [-0.085, 0.048], [-0.04, 0.056], [0.0, 0.062]];
      pf.moveTo(P2[0][0], P2[0][1]); P2.slice(1).forEach(function (q) { pf.lineTo(q[0], q[1]); });
      var sgeo = new THREE.ExtrudeGeometry(pf, { depth: 0.036, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
      sgeo.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0))); sgeo.translate(-0.018, 0, 0);
      g.add(new THREE.Mesh(sgeo, XB.wood));
      xb(0.044, 0.07, 0.01, XB.iron, 0, 0.06, 0.068); // latch plate
      xb(0.012, 0.035, 0.012, XB.iron, 0, 0.1, 0.07, -0.35); // latch tab
      var lv = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 10, 1.2), XB.iron); lv.rotation.y = Math.PI / 2; lv.rotation.x = 2.5; lv.position.set(0, 0.075, -0.045); g.add(lv); // trigger lever, curving back under the stock
      // the prod: a steel rod bent back toward the shooter, caps on the tips
      var tipL = new THREE.Vector3(-0.27, 0.18, 0.045), tipR = new THREE.Vector3(0.27, 0.18, 0.045), mid = new THREE.Vector3(0, 0.33, 0.045);
      var curve = new THREE.QuadraticBezierCurve3(tipL, mid.clone().setY(0.48), tipR), prod = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.009, 6, false), XB.steel); g.add(prod);
      [tipL, tipR].forEach(function (t) { var cp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), XB.iron); cp.position.copy(t); cp.rotation.z = Math.PI / 2 + (t.x < 0 ? 0.5 : -0.5); g.add(cp); });
      var nut = new THREE.Vector3(0, 0.075, 0.07), sg = new THREE.BufferGeometry().setFromPoints([tipL, nut, tipR]); g.add(new THREE.Line(sg, XB.wire)); // the string, drawn back to the latch
      return; }
    if (IB.proc === 'marker') { // the Paintball gun, after Michael's photo: gold carbon-fibre body, big black loader, long ported barrel, foregrip, air tank off the back
      // frame: +y down the barrel, +z the top of the gun, the hand round the grip at the origin
      g.position.y = -0.13 * 1.35; g0.userData.muzzle = new THREE.Vector3(0, (0.5 - 0.13) * 1.35, 0.085 * 1.35); // held by the foregrip (the front hand); the shot leaves the muzzle
      var MK = gearModel.mk || (gearModel.mk = (function () {
        var cv = document.createElement('canvas'); cv.width = cv.height = 64; var c2 = cv.getContext('2d'); // carbon weave in gold
        for (var yy = 0; yy < 8; yy++) for (var xx = 0; xx < 8; xx++) { var on = (xx + yy) % 2; var gr = c2.createLinearGradient(xx * 8, yy * 8, xx * 8 + 8, yy * 8 + 8); gr.addColorStop(0, on ? '#f0b440' : '#8a5a14'); gr.addColorStop(1, on ? '#b07818' : '#5a3a0a'); c2.fillStyle = gr; c2.fillRect(xx * 8, yy * 8, 8, 8); }
        var tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(2, 3);
        var cv2 = document.createElement('canvas'); cv2.width = 64; cv2.height = 64; var c3 = cv2.getContext('2d'); c3.fillStyle = '#16181b'; c3.fillRect(0, 0, 64, 64); c3.fillStyle = '#d8dcdf'; // tank: black with white racing slashes, no lettering
        [[18, 7], [30, 3]].forEach(function (b) { c3.save(); c3.translate(32, 32); c3.rotate(-0.5); c3.fillRect(-40, b[0] - 32, 80, b[1]); c3.restore(); });
        return { gold: new THREE.MeshLambertMaterial({ map: tx }), blk: new THREE.MeshLambertMaterial({ color: 0x1c1e21 }), mat: new THREE.MeshLambertMaterial({ color: 0x2c3034 }),
          tank: new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv2) }), brass: new THREE.MeshLambertMaterial({ color: 0xc8a040 }), acid: new THREE.MeshLambertMaterial({ color: 0x7ad830, emissive: 0x2a6a0a, transparent: true, opacity: 0.8 }) };
      })());
      var bx = function (w, l, h, m, x, y, z, rx) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, l, h), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
      var cy = function (r1, r2, l, m, x, y, z, rx, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, l, seg || 10), m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
      bx(0.034, 0.075, 0.09, MK.mat, 0, -0.005, 0, 0.2); // grip frame, raked back
      bx(0.036, 0.02, 0.055, MK.blk, 0, 0.028, -0.002, 0.15); // grip front strap
      bx(0.03, 0.035, 0.012, MK.blk, 0, 0.05, 0.03); // trigger guard bottom
      bx(0.006, 0.006, 0.03, MK.brass, 0, 0.038, 0.042); // trigger
      bx(0.04, 0.24, 0.06, MK.gold, 0, 0.04, 0.075); // gold carbon body
      bx(0.042, 0.04, 0.062, MK.blk, 0, -0.085, 0.075); // back cap
      bx(0.03, 0.12, 0.012, MK.blk, 0, 0.06, 0.109); // top rail
      cy(0.012, 0.012, 0.32, MK.blk, 0, 0.32, 0.085); // barrel
      cy(0.016, 0.016, 0.07, MK.mat, 0, 0.45, 0.085); // ported tip
      [0.43, 0.45, 0.47].forEach(function (yy) { bx(0.034, 0.006, 0.006, MK.blk, 0, yy, 0.085); });
      cy(0.017, 0.017, 0.03, MK.acid, 0, 0.49, 0.085); // a lick of acid green at the muzzle
      bx(0.03, 0.03, 0.085, MK.mat, 0, 0.13, 0.005); // vertical foregrip
      cy(0.01, 0.012, 0.05, MK.blk, 0, 0.0, 0.13, Math.PI / 2); // feedneck (stands up from the body)
      var hop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), MK.blk); hop.scale.set(0.95, 1.55, 0.85); hop.position.set(0, -0.005, 0.185); g.add(hop); // the loader
      bx(0.07, 0.12, 0.012, MK.mat, 0, 0.0, 0.228); // loader lid ridge
      var win = new THREE.Mesh(new THREE.SphereGeometry(0.061, 14, 10, 0, Math.PI * 2, 1.25, 0.22), MK.acid); win.scale.set(0.95, 1.55, 0.85); win.position.copy(hop.position); g.add(win); // a green window full of acid paintballs
      if (!it.noTank) { // the air tank, off the back of the grip and dipping a little (it can come off: see markerTank)
        var tk = new THREE.Group(); tk.position.set(0, -0.06, -0.055); tk.rotation.x = 0.22; g.add(tk);
        var tb2 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.15, 14), MK.tank); tb2.position.y = -0.1; tk.add(tb2);
        var dm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), MK.tank); dm.rotation.x = Math.PI; dm.position.y = -0.175; tk.add(dm);
        var rg = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.03, 8), MK.blk); rg.position.y = -0.015; tk.add(rg);
        var ga = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 8), MK.brass); ga.rotation.z = Math.PI / 2; ga.position.set(0.015, -0.015, 0); tk.add(ga);
      }
      bx(0.03, 0.04, 0.02, MK.blk, 0, -0.03, -0.045); // ASA under the grip
      return; }
    if (IB.model && typeof propInto === 'function' && propInto(g, IB.model, { s: IB.len || 0.5, gy: -(IB.len || 0.5) * (IB.bow ? 0.5 : 0.1) })) {
      if (/^w_axe/.test(IB.model)) g.rotation.y = AXE_YAW; // axe heads face away from you, not off to the side
      g.traverse(function (o) { if (!o.isMesh) return; if (IB.skin && WSKIN[IB.skin]) { o.material = wskinMat(IB.skin); return; } if (!o.material.userData.lit) { o.material.color.multiplyScalar(1.8); o.material.userData.lit = 1; } }); // the rust textures are dark: lift them so they read in hand
      return;
    }
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
  function lootSpot(x, z, kind) { var st = lootPrep(x, z, kind); passiveClear(x + ',' + z); lootWindow(st); }
  // roll what is in a spot (once): searching shows it, and passive perception peeks at it
  function lootPrep(x, z, kind) {
    var key = 'loot' + x + ',' + z, st = lootSpot.done[key];
    if (!st) {
      var fnm = (LEVEL.dname[x + ',' + z] || '') + ' ' + ({ h: 'Shelf', k: 'Book stand', K: 'Crate', R: 'Barrel', b: 'Sack', T: 'Table', v: 'Vase' }[ch(x, z)] || '') + ' ' + ((LEVEL.decor[x + ',' + z] || []).map(function (d) { return d.m; }).join(' '));
      var R = rollLoot(kind, (roomInfo(x, z) || {}).theme, fnm.trim(), LEVEL.dname[x + ',' + z] || { h: 'shelf', k: 'book stand', K: 'crate', R: 'barrel', b: 'sack', v: 'vase' }[ch(x, z)] || '');
      if (kind === 'chest') { skillCount('box'); if (Math.random() < skillLv('Box Cracker') * 0.12) { var ex = rollLoot(kind).items[0]; if (ex) { ex.from = 'a loot box (Box Cracker)'; R.items.push(ex); } } }
      st = lootSpot.done[key] = { title: kind === 'chest' ? 'Loot box' : 'You found', items: R.items, gold: R.gold };
    }
    return st;
  }
  // ---------- passive perception: walk past something hidden and you might notice it ----------
  // every searchable spot (and every hidden door) within 4 tiles you can see gets one roll: d20 + WIS + Perception skill.
  // Only spots hiding something worth noticing (uncommon or better, a scroll, a valuable) or a hidden door can be noticed.
  var PASSIVE = { rolled: {}, seen: {}, glint: {}, last: 0 }; var PASSIVE_GAP = 120000; // at most one notice every two minutes
  function notable(st) { return (st.items || []).some(function (it) { var r = String(it.rarity || '').toLowerCase(), tg = it.tags || []; return r === 'rare' || r === 'legendary' || tg.indexOf('scroll') >= 0 || (tg.indexOf('valuable') >= 0 && tg.indexOf('junk') < 0); }); }
  function passiveClear(k) { PASSIVE.seen[k] = 0; if (PASSIVE.glint[k]) { scene.remove(PASSIVE.glint[k]); delete PASSIVE.glint[k]; } }
  var GLINT_TEX = null;
  function glintAt(x, z, h) {
    if (!GLINT_TEX) { var cv = document.createElement('canvas'); cv.width = cv.height = 64; var c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.25, 'rgba(255,230,150,0.8)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(30, 2, 4, 60); c.fillRect(2, 30, 60, 4); GLINT_TEX = new THREE.CanvasTexture(cv); }
    var sp = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: GLINT_TEX, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); sp.position.set(x, h, z); sp.renderOrder = 70; sp.userData.t0 = performance.now(); scene.add(sp); return sp;
  }
  setInterval(function () { var t = performance.now() / 1000; for (var k in PASSIVE.glint) { var sp = PASSIVE.glint[k], ph = (t * 1.3 + (sp.userData.t0 % 7)) % 2.2; var a = ph < 0.5 ? Math.sin(ph / 0.5 * Math.PI) : 0; sp.material.opacity = 0.45 + a * 0.55; sp.scale.setScalar(0.38 + a * 0.5); sp.quaternion.copy(cam.quaternion); sp.rotateZ(t * 0.6); } }, 60);
  function passiveScan() {
    if (!CHAR || !CB.ready || CB.on || !LEVEL || !LEVEL.map) return;
    var R = 4, wis = MOD.WIS + (typeof skillLv === 'function' ? skillLv('Perception') : 0);
    for (var dz = -R; dz <= R; dz++) for (var dx = -R; dx <= R; dx++) {
      var x = P.x + dx, z = P.z + dz, k = x + ',' + z; if (PASSIVE.rolled[k]) continue; var c = ch(x, z);
      var door = c === 'H', spot = 'ohkKRbv'.indexOf(c) >= 0 && c !== '';
      if (!door && !spot) continue; if (!(k in visNow) && !los(P.x, P.z, x, z)) continue;
      PASSIVE.rolled[k] = 1;
      if (door && done[k + 'found']) continue; if (spot) { if (done[k + 'loot']) continue; if (!notable(lootPrep(x, z, 'small'))) continue; }
      if (Date.now() - PASSIVE.last < PASSIVE_GAP) { delete PASSIVE.rolled[k]; continue; } // too soon after the last one: it gets its roll later
      var r = 1 + Math.floor(Math.random() * 20), tot = r + wis;
      if (r === 20 || (r === 19 && tot >= (door ? 21 : 22))) { PASSIVE.last = Date.now();
        PASSIVE.seen[k] = 1; PASSIVE.glint[k] = glintAt(x, z, door ? 1.2 : 0.9);
        say('Something catches your eye', (door ? 'A draft where there should not be one, and a seam in the wall. ' : 'A glint from the ' + ((LEVEL.dname[k] || { h: 'shelf', k: 'book stand', K: 'crate', R: 'barrel', b: 'sack', v: 'vase' }[c] || 'furniture').toLowerCase()) + '. ') + '(Passive Perception: d20 ' + r + ' + ' + wis + ' = ' + tot + '.) Search it and you will find it.', 5200); setTimeout(function () { achieve('glint'); }, 2200); 
        skillCount('perceive');
      }
    }
  }
  setInterval(passiveScan, 600);
  lootSpot.done = {};
  function revealHidden(x, z) {
    if (ch(x, z) !== 'H') return; passiveClear(x + ',' + z); MAP[z] = MAP[z].substr(0, x) + 'D' + MAP[z].substr(x + 1);
    rebuildChunks(); refreshFog(); grantXP(75); setTimeout(function () { achieve('secret', 'Secret Agent', 'You found a hidden room. The producers did not think anyone would.', 25); }, 2600);
  }
