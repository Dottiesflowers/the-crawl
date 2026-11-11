
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
      '#mapC{flex:1;max-width:100%;min-height:0}#mapLeg{padding:6px 12px 10px;color:#9ab;font-size:11.5px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center}#mapLeg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}' +
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
    mf.innerHTML = '<header><b>Floor 1 map</b><button type="button" class="xbtn" id="mapX">Close</button></header><canvas id="mapC"></canvas>' +
      '<div id="mapLeg"><span><i style="background:#3df2e0"></i>You</span><span><i style="background:#ff4a6a"></i>Hostile</span><span><i style="background:#5f6"></i>Friendly</span><span><i style="background:#ffd34a"></i>Stairs</span><span><i style="background:#c98a4a"></i>Door</span><span><i style="background:#e0c060"></i>Loot box</span><span>✚ Safe room</span><span>☠ Boss</span><span>▼ Stairs</span><span>★ Secret</span></div>';
    document.body.appendChild(mf); document.getElementById('mapX').onclick = mapToggle;
    var bag = document.createElement('div'); bag.id = 'bag'; bag.setAttribute('role', 'dialog'); bag.setAttribute('aria-label', 'Inventory');
    document.body.appendChild(bag);
    var bubs = document.createElement('div'); bubs.id = 'bubs'; document.body.appendChild(bubs);
  })();

  // ---------- map ----------
  function mapDraw(cv, full) {
    var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, chh = cv.clientHeight; if (!cw || !chh) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); }
    var g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    // rotated 45 degrees to match the isometric camera (map +x+z is screen down)
    var bx0 = W, bx1 = 0, bz0 = H, bz1 = 0;
    if (full) { for (var q = 0; q < W * H; q++) if (tileState[q]) { var qx = q % W, qz = (q / W) | 0; if (qx < bx0) bx0 = qx; if (qx > bx1) bx1 = qx; if (qz < bz0) bz0 = qz; if (qz > bz1) bz1 = qz; } bx0 -= 4; bz0 -= 4; bx1 += 4; bz1 += 4; }
    var span = full ? Math.max(18, ((bx1 - bx0) + (bz1 - bz0)) / Math.SQRT2) : 26, s = Math.min(cw, chh) / span * (full ? 0.97 : 1.0), k = s / Math.SQRT2 * dpr;
    var ox = cv.width / 2, oy = cv.height / 2, cx = full ? (bx0 + bx1) / 2 : P.px, cz = full ? (bz0 + bz1) / 2 : P.pz;
    var ya = typeof CAMV !== 'undefined' ? Math.PI / 4 + CAMV.yaw * Math.PI / 2 : Math.PI / 4, yc = Math.cos(ya) * 1.4142, ys = Math.sin(ya) * 1.4142;
    function tr(x, z) { var dx = x - cx, dz = z - cz; return [ox + (dx * yc - dz * ys) * k, oy + (dx * ys + dz * yc) * k]; }
    function cell(x, z, col) { var a = tr(x - .5, z - .5), b = tr(x + .5, z - .5), c = tr(x + .5, z + .5), d = tr(x - .5, z + .5); g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
    var liv = hasTrait('Living Map'), R = full ? 1e9 : 20, THEME = { crypt: '#3f6a52', hall: '#5d5a54', moss: '#4f6a3a', gate: '#6a3e3a', store: '#6a5438', water: '#2f5a74', studio: '#7a8494', office: '#4a566a', bazaar: '#8a6e48', garden: '#3f7a34', arena: '#a08250', blvd: '#6a665e' };
    for (var z = Math.max(0, Math.floor(P.pz - R)); z < Math.min(H, P.pz + R); z++) for (var x = Math.max(0, Math.floor(P.px - R)); x < Math.min(W, P.px + R); x++) {
      if (!tileState[z * W + x]) continue; var c = MAP[z].charAt(x), lit = visNow[x + ',' + z] !== undefined || liv;
      if (c === '#' || c === 'H') { if (!full) { g.globalAlpha = lit ? 1 : .6; cell(x, z, '#23252f'); } continue; }
      var col = c === '~' ? '#3a6ea8' : c === 'D' ? '#c98a4a' : c === 'S' ? '#ffd34a' : c === 'C' ? '#e0c060' : c === 'F' ? '#40ff90' : c === 'Y' ? '#2a5a24' : THEME[roomAt(x, z)] || '#5d5a54';
      g.globalAlpha = lit ? 1 : .62; cell(x, z, col);
    }
    g.globalAlpha = 1;
    function dot(x, z, col, r) { var p = tr(x, z); g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], r * dpr, 0, 7); g.fill(); }
    CB.enemies.forEach(function (e) { if (e.dead || visNow[e.x + ',' + e.z] === undefined) return; dot(e.px, e.pz, e.calm ? '#5f6' : '#ff4a6a', full ? 3.5 : 2.6); });
    dot(P.px, P.pz, '#3df2e0', full ? 4.5 : 3.2);
    if (full) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      LEVEL.rooms.forEach(function (rm) {
        if (rm.type === 'corridor' || (span > 90 && rm.type === 'room')) return; var mx = (rm.x0 + rm.x1) / 2, mz = (rm.z0 + rm.z1) / 2, seen = false;
        for (var zz = rm.z0; zz <= rm.z1 && !seen; zz++) for (var xx = rm.x0; xx <= rm.x1; xx++) if (tileState[zz * W + xx]) { seen = true; break; }
        if (!seen) return; var p = tr(mx, mz), icon = rm.type === 'safe' ? '✚ ' : rm.type === 'boss' ? '☠ ' : rm.type === 'stairs' ? '▼ ' : rm.type === 'hidden' ? '★ ' : '';
        g.font = (rm.type === 'boss' || rm.type === 'safe' ? 'bold ' : '') + (10.5 * dpr) + 'px ui-monospace,monospace';
        g.fillStyle = rm.type === 'safe' ? '#7dffb0' : rm.type === 'boss' ? '#ff7a8a' : rm.type === 'stairs' ? '#ffd34a' : '#dde';
        g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 3 * dpr; g.strokeText(icon + rm.name, p[0], p[1]); g.fillText(icon + rm.name, p[0], p[1]);
      });
      LEVEL.hoods.forEach(function (hd) { var any = false; for (var q = 0; q < hd.rooms.length && !any; q++) { var rm = hd.rooms[q]; if (tileState[((rm.z0 + rm.z1) >> 1) * W + ((rm.x0 + rm.x1) >> 1)]) any = true; }
        if (!any) return; var p = tr((hd.x0 + hd.x1) / 2, (hd.z0 + hd.z1) / 2); g.font = 'bold ' + (13 * dpr) + 'px ui-monospace,monospace'; g.fillStyle = 'rgba(255,62,165,.85)'; g.fillText(hd.name.toUpperCase(), p[0], p[1] - 16 * dpr); });
    }
  }
  function mapToggle() {
    UI.map = !UI.map; if (UI.map && UI.bag) bagToggle(); document.getElementById('mapFull').classList.toggle('on', UI.map);
    if (UI.map) mapDraw(document.getElementById('mapC'), true);
  }
  setInterval(function () { if (typeof P === 'undefined') return; var m = document.getElementById('mini'); m.style.display = gearOpen || CC || AUTH.open ? 'none' : ''; if (m.style.display !== 'none') mapDraw(m, false); if (UI.map) mapDraw(document.getElementById('mapC'), true); }, 250);

  // ---------- inventory ----------
  var CATS = [['all', 'All'], ['weapon', 'Weapons'], ['clothing', 'Clothing'], ['tool', 'Tools'], ['consumable', 'Consumables'], ['valuable', 'Valuables'], ['misc', 'Misc']];
  function bagItems() { return CHAR && CHAR.gear ? CHAR.gear : []; }
  function bagToggle() {
    UI.bag = !UI.bag; if (UI.bag && UI.map) mapToggle(); document.getElementById('bag').classList.toggle('on', UI.bag);
    if (UI.bag) bagDraw();
  }
  function bagDraw() {
    var el = document.getElementById('bag'), items = bagItems(), q = UI.q.toLowerCase();
    var list = items.map(function (it, i) { return { it: it, i: i }; }).filter(function (o) { return (UI.cat === 'all' || o.it.cat === UI.cat) && (!q || (o.it.name + ' ' + (o.it.desc || '')).toLowerCase().indexOf(q) >= 0); });
    if (UI.sel !== null && !items[UI.sel]) UI.sel = null;
    var sel = UI.sel !== null ? items[UI.sel] : null;
    el.innerHTML = '<header><b>Inventory · ' + items.length + ' items · ' + (CHAR && CHAR.gold || 0) + ' gold</b><button type="button" class="xbtn" id="bagX">Close</button></header>' +
      '<div id="bagTools"><input id="bagQ" type="search" placeholder="Search items" aria-label="Search items" value="' + esc(UI.q) + '">' +
      CATS.map(function (c) { return '<button type="button" class="chip2' + (UI.cat === c[0] ? ' on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div id="bagBody"><div id="bagList">' + (list.length ? list.map(function (o) {
        var t = o.it.worn ? 'worn' : (CHAR.wield === o.it.name ? 'in hand' : '');
        return '<button type="button" data-i="' + o.i + '" class="' + (UI.sel === o.i ? 'on' : '') + '">' + itemIcon(o.it) + '<span>' + esc(o.it.name) + (o.it.qty > 1 ? ' ×' + o.it.qty : '') + '<br><small>' + esc(catName(o.it.cat)) + (o.it.dmg ? ' · ' + esc(o.it.dmg) : '') + '</small></span>' + (t ? '<span class="tag">' + t + '</span>' : '') + '</button>';
      }).join('') : '<p style="padding:10px;color:#9ab">' + (items.length ? 'Nothing matches.' : (CHAR ? 'Your pockets are empty. Loot something.' : 'Create a character to get your starting gear.')) + '</p>') + '</div>' +
      '<div id="bagInfo">' + (sel ? bagInfo(sel) : '<p>Pick an item to see what it does.</p>') + '</div></div>';
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
    if (it.cat === 'weapon' && it.dmg) acts.push(CHAR.wield === it.name ? ['unwield', 'Put away'] : ['wield', 'Hold in hand']);
    if (it.cat === 'clothing') acts.push(it.worn ? (clothNone(it.slot) ? ['unwear', 'Take off'] : null) : ['wear', 'Wear']);
    if (it.cat === 'consumable' && it.heal) { acts.push(['use', 'Use (' + it.heal + ' HP)']); acts.push((CHAR.hotbar || []).indexOf(it.name) >= 0 ? ['unhot', 'Take off hot bar'] : ['hot', 'Put on hot bar']); }
    return '<div class="big">' + itemIcon(it).replace('width="30" height="30"', 'width="72" height="72"') + '</div><h3>' + esc(it.name) + '</h3><p>' + esc(it.desc || 'No description. The System could not be bothered.') + '</p>' +
      '<p><small>' + esc(catName(it.cat)) + (it.dmg ? ' · damage ' + esc(it.dmg) : '') + (it.slot ? ' · ' + esc(slotLabel(it.slot)) : '') + (it.from ? ' · from ' + esc(it.from) : '') + '</small></p>' +
      '<div class="acts">' + acts.filter(Boolean).map(function (a) { return '<button type="button" class="ccBtn" data-act="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  }
  function bagAct(a, it) {
    if (!it) return;
    if (a === 'wield') { CHAR.wield = it.name; buildHero(); say('In hand · ' + it.name, 'You will fight with it: ' + it.dmg + ' damage.', 3000); }
    if (a === 'unwield') { CHAR.wield = null; buildHero(); }
    if (a === 'wear') wear(it);
    if (a === 'unwear') { it.worn = false; look[it.slot] = [0, 0]; buildHero(); saveLook(); }
    if (a === 'use') useItem(it);
    if (a === 'hot') { hotPut(it.name); }
    if (a === 'unhot') { CHAR.hotbar = (CHAR.hotbar || []).map(function (n) { return n === it.name ? null : n; }); hotDraw(); }
    saveChar(CHAR); bagDraw();
  }
  // ---------- consumables and the hot bar: four quick slots; in a fight using one is your bonus action ----------
  var HOT_N = 4;
  function heals(it) { var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(it.heal || ''); return m ? d(+m[1], +m[2]) + (+m[3] || 0) : +it.heal || 1; }
  function useItem(it) {
    if (!CHAR || !it || CHAR.dead) return false;
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.bonus)) { say('Not now', 'In a fight, using an item takes your bonus action, on your turn.', 2500); return false; }
    if (CB.on) CB.res.bonus = 0;
    var h = heals(it), before = PC.hp; PC.hp = Math.min(PC.max, PC.hp + h);
    if (typeof floater === 'function') floater(P.px, 1.6, P.pz, '+' + (PC.hp - before), 'heal'); kitOneShot('PickUp_Table');
    say('Used · ' + it.name, '+' + (PC.hp - before) + ' HP' + (CB.on ? ' (bonus action).' : '.'), 2600);
    it.qty = (it.qty || 1) - 1; if (it.qty <= 0) { CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; }
    saveChar(CHAR); cbHUD(); hotDraw(); if (UI.bag) bagDraw(); if (CB.on && typeof cbShowMoves === 'function') cbMenuClose();
    return true;
  }
  function hotPut(name) {
    CHAR.hotbar = CHAR.hotbar || []; while (CHAR.hotbar.length < HOT_N) CHAR.hotbar.push(null);
    if (CHAR.hotbar.indexOf(name) >= 0) return; var i = CHAR.hotbar.indexOf(null);
    if (i < 0) { say('Hot bar full', 'Take something off the hot bar first (in your bag).', 2600); return; }
    CHAR.hotbar[i] = name; saveChar(CHAR); hotDraw();
  }
  function hotAuto() { // new consumables drop into empty slots on their own
    if (!CHAR) return; (CHAR.gear || []).forEach(function (g) { if (g.cat === 'consumable' && g.heal && (CHAR.hotbar || []).indexOf(g.name) < 0 && (CHAR.hotbar || []).filter(Boolean).length < HOT_N) hotPut(g.name); });
  }
  function hotItem(i) { var n = CHAR && CHAR.hotbar && CHAR.hotbar[i]; return n ? (CHAR.gear || []).filter(function (g) { return g.name === n; })[0] || null : null; }
  function hotDraw() {
    var el = document.getElementById('hotbar');
    if (!el) { el = document.createElement('div'); el.id = 'hotbar'; document.body.appendChild(el);
      var css = document.createElement('style'); css.textContent = '#hotbar{position:fixed;left:168px;bottom:16px;z-index:6;display:flex;gap:6px}@media (max-width:700px){#hotbar{left:12px;bottom:auto;top:176px;flex-direction:column}}#hotbar button{position:relative;width:46px;height:46px;border-radius:9px;background:rgba(8,9,15,.8);border:1px solid rgba(61,242,224,.35);padding:2px;cursor:pointer}#hotbar button.ready{border-color:var(--neon)}#hotbar button:disabled{opacity:.35}#hotbar b{position:absolute;right:3px;bottom:1px;font-size:10px;color:#fff;text-shadow:0 1px 2px #000}#hotbar i{position:absolute;left:4px;top:1px;font-size:9px;font-style:normal;color:#9ab}#hotbar .ico{background:none}'; document.head.appendChild(css); }
    var show = CHAR && !gearOpen && !CC && !AUTH.open && !CHAR.dead; el.style.display = show ? 'flex' : 'none'; if (!show) return;
    var html = '';
    for (var i = 0; i < HOT_N; i++) { var it = hotItem(i), can = it && (!CB.on || (cbMyTurn() && CB.res.bonus && !CB.busy));
      html += '<button type="button" data-h="' + i + '" class="' + (can ? 'ready' : '') + '"' + (it ? '' : ' disabled') + ' aria-label="' + (it ? esc(it.name) : 'Empty hot bar slot') + '" title="' + (it ? esc(it.name) + ' · ' + esc(it.heal) + ' HP' : 'Empty: put consumables here from your bag') + '"><i>' + (i + 1) + '</i>' + (it ? itemIcon(it) + '<b>×' + (it.qty || 1) + '</b>' : '') + '</button>'; }
    el.innerHTML = html;
    el.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); var it = hotItem(+b.dataset.h); if (it) useItem(it); }); });
  }
  setInterval(function () { if (typeof CHAR !== 'undefined') hotDraw(); }, 700);
  function invAdd(item, quiet) {
    if (!CHAR) return; CHAR.gear = CHAR.gear || [];
    var same = item.cat === 'consumable' || item.cat === 'misc' ? CHAR.gear.filter(function (g) { return g.name === item.name; })[0] : null;
    if (same) same.qty = (same.qty || 1) + (item.qty || 1); else CHAR.gear.push(item);
    if (!quiet) saveChar(CHAR);
    if (UI.bag) bagDraw();
    if (item.cat === 'consumable' && item.heal) hotAuto();
  }
  // a wielded item from the inventory overrides the builder's weapon slot
  function gearWeapon() {
    if (!CHAR || !CHAR.wield) return null; var it = (CHAR.gear || []).filter(function (g) { return g.name === CHAR.wield && g.dmg; })[0]; if (!it) return null;
    var m = /(\d+)d(\d+)/.exec(it.dmg), light = /knife|dagger|shear|scissor|blade|pick|opener|pen/i.test(it.name);
    var stat = light && MOD.DEX > MOD.STR ? 'DEX' : 'STR';
    var fam = !it.from || it.from === 'home' ? 1 : 0; // you have used this tool every day of your life
    return { name: it.name.toLowerCase(), n: +m[1], s: +m[2], stat: stat, clip: light ? 'Punch_Jab' : 'Sword_Attack', hit: PROF() + MOD[stat] + fam, dmgB: MOD[stat], fam: fam };
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
  var LOOT = {
    puglin: function () { var l = [{ name: 'Puglin stick', cat: 'weapon', dmg: '1d4', desc: 'Chewed at one end. Still works.' }]; if (Math.random() < 0.5) l.push({ name: 'Half-eaten snack', cat: 'consumable', heal: '1d2', desc: 'You do not want to know what it was. Restores 1d2 HP.' }); if (Math.random() < 0.3) l.push({ name: 'Shiny button', cat: 'misc', desc: 'The puglin was very proud of this.' }); return { gold: d(1, 6), items: l }; },
    imp: function () { return { gold: d(2, 6) + 2, items: [{ name: 'Imp mace', cat: 'weapon', dmg: '1d6', desc: 'Company property. Heavy, spiky, and badly maintained.' }, { name: 'Security badge', cat: 'valuable', desc: 'FLOOR 1 · STAIRWELL · NIGHT SHIFT. The photo is unflattering.' }, { name: 'Union card', cat: 'misc', desc: 'Local 666. Dues paid through next season.' }] }; }
  };
  function lootBody(e) {
    if (!e.lootStore) {
      var L = (LOOT[e.kind] || LOOT[e.def.base] || function () { return { gold: 0, items: [] }; })();
      if (e.boss) { L.gold += d(10, 6); L.items.push({ name: e.name.split(',')[0] + '\'s trophy', cat: 'valuable', desc: 'Proof you beat a neighborhood boss. The audience wants you to wear it.' }); }
      L.items.forEach(function (it) { it.from = e.name; }); e.lootStore = { title: 'Searching ' + e.name, items: L.items, gold: L.gold }; e.looted = true;
    }
    lootWindow(e.lootStore);
  }
  // ---------- credits (CC-BY assets must credit their authors) ----------
  var CREDITS = [
    ['Characters, outfits, animations, props, nature, monsters', 'Quaternius (quaternius.com)', 'CC0'],
    ['Cowboy Hat (Free)', 'wolfgar74 on Sketchfab', 'CC-BY 4.0'], ['Hard hat', 'naira001 on Sketchfab', 'CC-BY 4.0'], ['Winter Hat', 'StubbornFunkyDonkey on Sketchfab', 'CC-BY 4.0'],
    ['Santa Hat', '3d-Pauer on Sketchfab', 'CC-BY 4.0'], ['Clown Hat', 'PatelDev on Sketchfab', 'CC-BY 4.0'], ['Stylized wizard hat', 'Enkarra on Sketchfab', 'CC-BY 4.0'], ['Gangster hats', 'Michal Cavrnoch on Sketchfab', 'CC-BY 4.0']
  ];
  function creditsHTML() { return '<h3>Credits</h3><ul class="credits">' + CREDITS.map(function (c) { return '<li>' + esc(c[0]) + ' · ' + esc(c[1]) + ' · ' + esc(c[2]) + '</li>'; }).join('') + '</ul>'; }

  // ---------- item visuals: bag icons and the model in your hand ----------
  function itemKind(it) {
    var n = (it.name || '').toLowerCase();
    if (it.cat === 'clothing') return 'cloth_' + ({ kTop: 'top', kPants: 'pants', kBoots: 'shoes', kHead: 'hat', kNeck: 'scarf', kShoulder: 'top' }[it.slot] || 'top');
    var K = [['shears', /shear|scissor|clipper|pruner|snip/], ['knife', /knife|blade|cutter|dagger|razor|scalpel/], ['hammer', /hammer|mallet/], ['mace', /mace|morning star/], ['wrench', /wrench|spanner/],
      ['bat', /bat\b|club|stick|pipe|crowbar|cane|rod|pole|broom|mop/], ['phone', /phone|tablet|ipad/], ['laptop', /laptop|computer/], ['keys', /key/], ['tape', /tape|zip tie/], ['pick', /pick\b|picks|plectrum/],
      ['bandage', /gauze|bandage|band-aid|first aid/], ['snack', /snack|bar\b|food|jerky|apple|sandwich|gum|candy|chip/], ['drink', /bottle|flask|water|coffee|drink|can\b|potion/], ['opener', /opener|corkscrew/],
      ['rag', /rag|towel|cloth|apron/], ['badge', /badge|card|id\b|license|wallet/], ['coin', /coin|gold|button/], ['pen', /pen\b|pencil|marker|sharpie/], ['light', /flashlight|lighter|torch|lamp/],
      ['bag', /bag|pouch|backpack|purse|sack/], ['book', /book|notebook|manual|scroll/]];
    for (var i = 0; i < K.length; i++) if (K[i][1].test(n)) return K[i][0];
    return { weapon: 'bat', tool: 'wrench', consumable: 'drink', valuable: 'coin', misc: 'box' }[it.cat] || 'box';
  }
  var ICON = {
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
    if (k === 'shears') { [-1, 1].forEach(function (s) { var a = new THREE.Group(); a.rotation.z = s * 0.12; g.add(a); part(a, 0.022, 0.09, 0.02, RED, s * 0.012, 0.0, 0); part(a, 0.012, 0.11, 0.006, STEEL, s * 0.004, 0.1, s * 0.004, 'metal'); }); part(g, 0.02, 0.02, 0.03, DARK, 0, 0.05, 0); }
    else if (k === 'knife') { part(g, 0.024, 0.1, 0.024, 0x4a3020, 0, 0, 0, 'wood'); part(g, 0.03, 0.012, 0.03, STEEL, 0, 0.055, 0, 'metal'); part(g, 0.028, 0.13, 0.006, STEEL, 0.004, 0.125, 0, 'metal'); }
    else if (k === 'hammer') { part(g, 0.028, 0.3, 0.028, WOOD, 0, 0.1, 0, 'wood'); part(g, 0.13, 0.05, 0.05, METAL_D, 0.02, 0.26, 0, 'metal'); }
    else if (k === 'mace') { part(g, 0.032, 0.34, 0.032, WOOD, 0, 0.12, 0, 'wood'); part(g, 0.085, 0.11, 0.085, METAL_D, 0, 0.32, 0, 'metal'); [[0.05, 0.32, 0], [-0.05, 0.32, 0], [0, 0.32, 0.05], [0, 0.32, -0.05], [0, 0.39, 0]].forEach(function (p) { part(g, 0.025, 0.025, 0.025, STEEL, p[0], p[1], p[2]); }); }
    else if (k === 'wrench') { part(g, 0.03, 0.26, 0.012, METAL, 0, 0.1, 0, 'metal'); part(g, 0.07, 0.04, 0.014, METAL, 0, 0.24, 0, 'metal'); }
    else if (k === 'bat') { cyl(g, 0.03, 0.02, 0.5, /pipe|crowbar|rod/i.test(it.name) ? METAL_D : WOOD, 0, 0.2, 0, 8); }
    else if (k === 'phone') { part(g, 0.07, 0.14, 0.01, DARK, 0, 0.06, 0.02); part(g, 0.06, 0.12, 0.002, 0x3a6ea8, 0, 0.06, 0.026, true); }
    else if (k === 'keys') { part(g, 0.04, 0.04, 0.006, GOLD, 0, 0.03, 0, 'metal'); part(g, 0.012, 0.06, 0.004, GOLD, 0.01, 0.07, 0, 'metal'); part(g, 0.012, 0.05, 0.004, METAL, -0.012, 0.06, 0, 'metal'); }
    else if (k === 'light') { cyl(g, 0.022, 0.022, 0.16, 0x333333, 0, 0.05, 0, 8); cyl(g, 0.032, 0.024, 0.04, 0xffd34a, 0, 0.15, 0, 8); }
    else { part(g, 0.05, 0.08, 0.04, 0x8a7a6a, 0, 0.04, 0); }
  }

  // ---------- loot from containers and secret doors ----------
  var LOOT_TABLE = {
    chest: [{ name: 'Healing potion', cat: 'consumable', heal: '2d4+2', desc: 'Red, fizzy, sponsored. Restores 2d4+2 HP.' }, { name: 'Crowbar', cat: 'weapon', dmg: '1d6', desc: 'Opens crates, doors and arguments.' },
      { name: 'Roll of duct tape', cat: 'tool', desc: 'The universal fix. The System has rules about it, but no one has read them.' }, { name: 'Flashlight', cat: 'tool', desc: 'Works. For now.' },
      { name: 'Energy bar', cat: 'consumable', heal: '1d4', desc: 'Chocolate peanut. Restores 1d4 HP.' }, { name: 'Bronze loot box coupon', cat: 'valuable', desc: 'Redeemable at any sponsor booth. There are no sponsor booths.' },
      { name: 'Hard hat', cat: 'clothing', slot: 'kHead', style: 'Hard hat', color: 0, desc: 'OSHA approved, in another galaxy.' }, { name: 'Plain white tee', cat: 'clothing', slot: 'kTop', style: 'T-shirt', color: 0, desc: 'Clean. Suspiciously clean.' },
      { name: 'Grey hoodie', cat: 'clothing', slot: 'kTop', style: 'Hoodie', color: 2, desc: 'Somebody\'s. Not anymore.' }, { name: 'Black jeans', cat: 'clothing', slot: 'kPants', style: 'Jeans', color: 1, desc: 'Slim fit. You will make it work.' },
      { name: 'Cowboy hat', cat: 'clothing', slot: 'kHead', style: 'Cowboy hat', color: 0, desc: 'Yeehaw is now a valid battle cry.' }, { name: 'Work boots', cat: 'clothing', slot: 'kBoots', style: 'Work boots', color: 7, desc: 'Steel toe. Good for kicking.' }],
    small: [{ name: 'Energy bar', cat: 'consumable', heal: '1d4', desc: 'Chocolate peanut. Restores 1d4 HP.' }, { name: 'Bottle of water', cat: 'consumable', heal: '1', desc: 'Lukewarm. Restores 1 HP and some dignity.' },
      { name: 'Rusty key', cat: 'misc', desc: 'Opens something, somewhere, probably.' }, { name: 'Lighter', cat: 'tool', desc: 'Three clicks to light. Always three.' }, { name: 'Ball of twine', cat: 'tool', desc: 'Long enough to find your way back. Maybe.' }]
  };
  function lootSpot(x, z, kind) {
    var key = 'loot' + x + ',' + z, st = lootSpot.done[key];
    if (!st) {
      var tbl = LOOT_TABLE[kind], n = kind === 'chest' ? 2 + Math.floor(Math.random() * 2) : 1, items = [];
      for (var i = 0; i < n; i++) { var it = JSON.parse(JSON.stringify(tbl[Math.floor(Math.random() * tbl.length)])); it.from = kind === 'chest' ? 'a loot box' : 'a search'; items.push(it); }
      st = lootSpot.done[key] = { title: kind === 'chest' ? 'Loot box' : 'You found', items: items, gold: kind === 'chest' ? d(3, 6) : d(1, 4) };
    }
    lootWindow(st);
  }
  lootSpot.done = {};
  function revealHidden(x, z) {
    if (ch(x, z) !== 'H') return; MAP[z] = MAP[z].substr(0, x) + 'D' + MAP[z].substr(x + 1);
    rebuildChunks(); refreshFog(); grantXP(75); setTimeout(function () { achieve('secret', 'Secret Agent', 'You found a hidden room. The producers did not think anyone would.', 25); }, 2600);
  }
