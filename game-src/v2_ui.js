
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
      '#bagInfo{flex:1;overflow-y:auto;padding:10px 14px;border-left:1px solid rgba(255,255,255,.06)}#bagInfo h3{margin:0 0 4px;color:var(--hot);font-size:13px}#bagInfo p{margin:4px 0 10px;line-height:1.45;color:#cde}#bagInfo .acts{display:flex;gap:6px;flex-wrap:wrap}' +
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
      '<div id="mapLeg"><span><i style="background:#3df2e0"></i>You</span><span><i style="background:#ff4a6a"></i>Hostile</span><span><i style="background:#5f6"></i>Friendly</span><span><i style="background:#ffd34a"></i>Stairs</span><span><i style="background:#c98a4a"></i>Door</span><span><i style="background:#3a6ea8"></i>Water</span></div>';
    document.body.appendChild(mf); document.getElementById('mapX').onclick = mapToggle;
    var bag = document.createElement('div'); bag.id = 'bag'; bag.setAttribute('role', 'dialog'); bag.setAttribute('aria-label', 'Inventory');
    document.body.appendChild(bag);
    var bubs = document.createElement('div'); bubs.id = 'bubs'; document.body.appendChild(bubs);
  })();

  // ---------- map ----------
  function mapDraw(cv, full) {
    var dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight; if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    var g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    // rotate 45 degrees so the map matches the isometric camera (map +x+z is screen down)
    var span = (W + H) / Math.SQRT2, s = Math.min(cw, ch) / span * (full ? 0.96 : 2.6), k = s / Math.SQRT2 * dpr;
    var cx = full ? (W + H) / 2 : P.px, cz = full ? (H - W) / 2 * 0 : P.pz;
    var ox = cv.width / 2, oy = cv.height / 2;
    function tr(x, z) { var dx = x - (full ? W / 2 : cx), dz = z - (full ? H / 2 : cz); return [ox + (dx - dz) * k, oy + (dx + dz) * k]; }
    function cell(x, z, col) { var a = tr(x - .5, z - .5), b = tr(x + .5, z - .5), c = tr(x + .5, z + .5), d = tr(x - .5, z + .5); g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath(); g.fill(); }
    var liv = hasTrait('Living Map');
    for (var z = 0; z < H; z++) for (var x = 0; x < W; x++) {
      if (!tileState[z * W + x]) continue; var c = MAP[z].charAt(x), lit = visNow[x + ',' + z] !== undefined || liv;
      var col = c === '#' ? '#2a2c38' : c === '~' ? '#3a6ea8' : c === 'D' ? '#c98a4a' : c === 'S' ? '#ffd34a' : (roomAt(x, z) === 'crypt' ? '#4f6a5c' : '#5d5a54');
      g.globalAlpha = lit ? 1 : .55; cell(x, z, col);
    }
    g.globalAlpha = 1;
    function dot(x, z, col, r) { var p = tr(x, z); g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], r * dpr, 0, 7); g.fill(); }
    CB.enemies.forEach(function (e) { if (e.dead || visNow[e.x + ',' + e.z] === undefined) return; dot(e.px, e.pz, e.calm ? '#5f6' : '#ff4a6a', full ? 4 : 2.6); });
    dot(P.px, P.pz, '#3df2e0', full ? 5 : 3.2);
    if (full) { g.fillStyle = '#cde'; g.font = (11 * dpr) + 'px ui-monospace,monospace'; g.textAlign = 'center';
      var seen = {}; for (var zz = 1; zz < H - 1; zz++) for (var xx = 1; xx < W - 1; xx++) { var id = roomAt(xx, zz); if (!id || !tileState[zz * W + xx]) continue; (seen[id] = seen[id] || []).push([xx, zz]); }
      Object.keys(seen).forEach(function (id) { var a = seen[id], mx = 0, mz = 0; a.forEach(function (q) { mx += q[0]; mz += q[1]; }); var p = tr(mx / a.length, mz / a.length); g.fillText(ROOMS[id].name, p[0], p[1]); }); }
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
        return '<button type="button" data-i="' + o.i + '" class="' + (UI.sel === o.i ? 'on' : '') + '"><span>' + esc(o.it.name) + (o.it.qty > 1 ? ' ×' + o.it.qty : '') + '<br><small>' + esc(catName(o.it.cat)) + (o.it.dmg ? ' · ' + esc(o.it.dmg) : '') + '</small></span>' + (t ? '<span class="tag">' + t + '</span>' : '') + '</button>';
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
    if (it.cat === 'consumable' && it.heal) acts.push(['use', 'Use (' + it.heal + ' HP)']);
    return '<h3>' + esc(it.name) + '</h3><p>' + esc(it.desc || 'No description. The System could not be bothered.') + '</p>' +
      '<p><small>' + esc(catName(it.cat)) + (it.dmg ? ' · damage ' + esc(it.dmg) : '') + (it.slot ? ' · ' + esc(slotLabel(it.slot)) : '') + (it.from ? ' · from ' + esc(it.from) : '') + '</small></p>' +
      '<div class="acts">' + acts.filter(Boolean).map(function (a) { return '<button type="button" class="ccBtn" data-act="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  }
  function bagAct(a, it) {
    if (!it) return;
    if (a === 'wield') { CHAR.wield = it.name; say('In hand · ' + it.name, 'You will fight with it: ' + it.dmg + ' damage.', 3000); }
    if (a === 'unwield') { CHAR.wield = null; }
    if (a === 'wear') wear(it);
    if (a === 'unwear') { it.worn = false; look[it.slot] = [0, 0]; buildHero(); saveLook(); }
    if (a === 'use') {
      if (CB.on && (!cbMyTurn() || !CB.res.bonus)) { say('Not now', 'Using an item in a fight takes your bonus action.', 2500); return; }
      if (CB.on) CB.res.bonus = 0;
      var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(it.heal), h = m ? d(+m[1], +m[2]) + (+m[3] || 0) : +it.heal || 1, before = PC.hp; PC.hp = Math.min(PC.max, PC.hp + h);
      say('Used · ' + it.name, '+' + (PC.hp - before) + ' HP.', 2600); it.qty = (it.qty || 1) - 1; if (it.qty <= 0) { CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; } cbHUD();
    }
    saveChar(CHAR); bagDraw();
  }
  function invAdd(item, quiet) {
    if (!CHAR) return; CHAR.gear = CHAR.gear || [];
    var same = item.cat === 'consumable' || item.cat === 'misc' ? CHAR.gear.filter(function (g) { return g.name === item.name; })[0] : null;
    if (same) same.qty = (same.qty || 1) + (item.qty || 1); else CHAR.gear.push(item);
    if (!quiet) saveChar(CHAR);
    if (UI.bag) bagDraw();
  }
  // a wielded item from the inventory overrides the builder's weapon slot
  function gearWeapon() {
    if (!CHAR || !CHAR.wield) return null; var it = (CHAR.gear || []).filter(function (g) { return g.name === CHAR.wield && g.dmg; })[0]; if (!it) return null;
    var m = /(\d+)d(\d+)/.exec(it.dmg), light = /knife|dagger|shear|scissor|blade|pick|opener|pen/i.test(it.name);
    var stat = light && MOD.DEX > MOD.STR ? 'DEX' : 'STR';
    return { name: it.name.toLowerCase(), n: +m[1], s: +m[2], stat: stat, clip: light ? 'Punch_Jab' : 'Sword_Attack', hit: 2 + MOD[stat], dmgB: MOD[stat] };
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
  function clothesLocked() { return !!(CHAR && CHAR.gear && CHAR.gear.some(function (g) { return g.cat === 'clothing'; })) && !CHAR.freeWardrobe; }
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
    if (e.looted) return; e.looted = true;
    var L = (LOOT[e.kind] || function () { return { gold: 0, items: [] }; })();
    L.items.forEach(function (it) { it.from = e.name; invAdd(it, true); });
    if (CHAR) { CHAR.gold = (CHAR.gold || 0) + L.gold; saveChar(CHAR); }
    say('Looted · ' + e.name, (L.items.length ? 'You found: ' + L.items.map(function (i) { return i.name; }).join(', ') + '. ' : 'Nothing useful. ') + (L.gold ? '+' + L.gold + ' gold.' : ''), 5000);
    if (!CHAR) say('Looted · ' + e.name, 'Create a character first; your pockets are not registered with the System yet.', 4000);
  }

  // ---------- credits (CC-BY assets must credit their authors) ----------
  var CREDITS = [
    ['Characters, outfits, animations, props, nature, monsters', 'Quaternius (quaternius.com)', 'CC0'],
    ['Cowboy Hat (Free)', 'wolfgar74 on Sketchfab', 'CC-BY 4.0'], ['Hard hat', 'naira001 on Sketchfab', 'CC-BY 4.0'], ['Winter Hat', 'StubbornFunkyDonkey on Sketchfab', 'CC-BY 4.0'],
    ['Santa Hat', '3d-Pauer on Sketchfab', 'CC-BY 4.0'], ['Clown Hat', 'PatelDev on Sketchfab', 'CC-BY 4.0'], ['Stylized wizard hat', 'Enkarra on Sketchfab', 'CC-BY 4.0'], ['Gangster hats', 'Michal Cavrnoch on Sketchfab', 'CC-BY 4.0']
  ];
  function creditsHTML() { return '<h3>Credits</h3><ul class="credits">' + CREDITS.map(function (c) { return '<li>' + esc(c[0]) + ' · ' + esc(c[1]) + ' · ' + esc(c[2]) + '</li>'; }).join('') + '</ul>'; }
