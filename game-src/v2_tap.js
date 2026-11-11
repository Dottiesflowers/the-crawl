
  // ===================== loot window and tap-to-interact =====================
  (function lootCSS() {
    var css = document.createElement('style');
    css.textContent = '#lootw{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,92vw);max-height:84vh;z-index:35;display:none;flex-direction:column;background:#0b0c13;border:1px solid rgba(255,211,74,.5);border-radius:12px;color:#e8f4f4;font-size:13px}' +
      '#lootw.on{display:flex}#lootw header{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}#lootw header b{flex:1;color:#ffd34a;letter-spacing:.12em;text-transform:uppercase;font-size:12px}' +
      '#lootList{overflow-y:auto;padding:6px 8px}#lootList .li{display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.05)}#lootList .li span{flex:1}#lootList small{color:#9ab;display:block}' +
      '#lootw .row2{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.08)}#lootw .row2 button{flex:1}' +
      '#tapRing{position:fixed;z-index:6;width:26px;height:26px;margin:-13px 0 0 -13px;border:2px solid #3df2e0;border-radius:50%;pointer-events:none;opacity:0;transition:opacity .4s}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'lootw'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Loot'); document.body.appendChild(el);
    var ring = document.createElement('div'); ring.id = 'tapRing'; document.body.appendChild(ring);
  })();
  var LOOTW = { open: false, store: null };
  // store: { title, items: [...], gold: n }  — whatever you leave stays there for later
  function lootWindow(store) {
    LOOTW.open = true; LOOTW.store = store; var el = document.getElementById('lootw');
    function draw() {
      var empty = !store.items.length && !store.gold;
      el.innerHTML = '<header><b>' + esc(store.title) + '</b><button type="button" class="xbtn" id="lwX">Close</button></header><div id="lootList">' +
        (store.gold ? '<div class="li">' + itemIcon({ name: 'gold coin', cat: 'valuable' }) + '<span>' + store.gold + ' gold</span><button type="button" class="ccBtn" data-g="1">Take</button></div>' : '') +
        store.items.map(function (it, i) { return '<div class="li">' + itemIcon(it) + '<span>' + esc(it.name) + '<small>' + esc(catName(it.cat)) + (it.dmg ? ' · ' + esc(it.dmg) : '') + (it.desc ? ' · ' + esc(it.desc) : '') + '</small></span><button type="button" class="ccBtn" data-i="' + i + '">Take</button></div>'; }).join('') +
        (empty ? '<p style="color:#9ab;padding:8px">Nothing left.</p>' : '') + '</div>' +
        '<div class="row2"><button type="button" class="ccBtn" id="lwAll"' + (empty ? ' disabled' : '') + '>Take all</button><button type="button" class="ccBtn" id="lwLeave">Leave the rest</button></div>';
      document.getElementById('lwX').onclick = lootClose; document.getElementById('lwLeave').onclick = lootClose;
      document.getElementById('lwAll').onclick = function () { takeGold(); store.items.slice().forEach(function (it) { take(it); }); saveChar(CHAR); lootClose(); };
      el.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { take(store.items[+b.dataset.i]); saveChar(CHAR); draw(); }; });
      el.querySelectorAll('[data-g]').forEach(function (b) { b.onclick = function () { takeGold(); saveChar(CHAR); draw(); }; });
    }
    function take(it) { if (!CHAR) return; store.items.splice(store.items.indexOf(it), 1); invAdd(it, true); say('Taken · ' + it.name, 'In your Bag now.', 1800); }
    function takeGold() { if (!CHAR || !store.gold) return; CHAR.gold = (CHAR.gold || 0) + store.gold; say('Gold', '+' + store.gold + ' gold.', 1800); store.gold = 0; }
    if (!CHAR) { say('Loot', 'Create a character first; your pockets are not registered with the System yet.', 3500); LOOTW.open = false; return; }
    draw(); el.classList.add('on');
  }
  function lootClose() { LOOTW.open = false; document.getElementById('lootw').classList.remove('on'); if (UI.bag) bagDraw(); }

  // ---------- tap or click on the world: walk there, or pick what to do with a thing ----------
  var TAP = { down: null };
  canvas.addEventListener('pointerdown', function (ev) { TAP.down = (CB.on || gearOpen) ? null : { x: ev.clientX, y: ev.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', function (ev) {
    var d0 = TAP.down; TAP.down = null; if (!d0 || CB.on || gearOpen || CC || AUTH.open || TALK.open || LOOTW.open || UI.bag || UI.map || CS.open) return;
    if (Math.abs(ev.clientX - d0.x) + Math.abs(ev.clientY - d0.y) > 14 || performance.now() - d0.t > 600) return;
    exploreTap(ev.clientX, ev.clientY);
  });
  function tapRing(x, y) { var r = document.getElementById('tapRing'); r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.opacity = 1; clearTimeout(tapRing.t); tapRing.t = setTimeout(function () { r.style.opacity = 0; }, 450); }
  function exploreTap(sx, sy) {
    if (CHAR && CHAR.dead) return;
    // a creature under the finger wins
    var best = null, bd = 34 * 34;
    CB.enemies.forEach(function (e) { if (!e.obj.visible) return; var s = toScreen(e.px, (e.def.h || 1) * 0.5, e.pz), dx = s.x - sx, dy = s.y - sy, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = e; } });
    var r = canvas.getBoundingClientRect(); cbRay.setFromCamera(new THREE.Vector2((sx - r.left) / r.width * 2 - 1, -((sy - r.top) / r.height) * 2 + 1), cam);
    var hit = cbRay.ray.intersectPlane(cbPlane, cbHit) ? { x: Math.round(cbHit.x), z: Math.round(cbHit.z) } : null;
    tapRing(sx, sy);
    if (best) { tapMenu({ c: 'E', e: best, key: 'e' + CB.enemies.indexOf(best), x: best.x, z: best.z }); return; }
    if (!hit) return;
    // an object one tile around the tap point (props are easy to miss with a fat finger)
    var obj = null;
    for (var k = 0; k < 9 && !obj; k++) { var x = hit.x + [0, 0, 1, -1, 0, 1, -1, 1, -1][k], z = hit.z + [0, 1, 0, 0, -1, 1, -1, -1, 1][k], c = ch(x, z);
      if (c !== '.' && c !== ',' && c !== '~' && c !== '#' && c !== '@' && ACTS[c] && visNow[x + ',' + z] !== undefined) obj = { c: c, key: x + ',' + z, x: x, z: z }; }
    if (obj) { tapMenu(obj); return; }
    if (visNow[hit.x + ',' + hit.z] === undefined && !tileState[hit.z * W + hit.x]) return;
    walkTo(hit.x, hit.z, null);
  }
  function walkTo(x, z, then, adjacent) {
    closeMenu();
    var r = bfs(P.x, P.z, 'pc', 60), goal = null;
    if (adjacent) { var bestD = 1e9; for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; var k = (x + dx) + ',' + (z + dz); if (r.dist[k] !== undefined && r.dist[k] < bestD) { bestD = r.dist[k]; goal = [x + dx, z + dz]; } } if (cheb(P.x, P.z, x, z) <= 1) goal = [P.x, P.z]; }
    else if (r.dist[x + ',' + z] !== undefined) goal = [x, z];
    if (!goal) { say('Can\'t get there', 'No clear path from here.', 1800); return; }
    var path = goal[0] === P.x && goal[1] === P.z ? [] : pathTo(r, goal[0], goal[1]);
    if (!path) return;
    var face = function () { if (adjacent) hero.rotation.y = Math.atan2(x - P.px, z - P.pz); if (then) then(); };
    if (!path.length) { face(); return; }
    P.path = path; P.onArrive = face;
  }
  function tapName(t) { return t.e ? t.e.name + (t.e.dead ? ' · dead' : t.e.npc ? '' : ' · ' + healthState(t.e)[0]) : (nameOf(t) || 'Something'); }
  function tapMenu(t) {
    var far = cheb(P.x, P.z, t.x, t.z) > 1, opts = [];
    var exam = t.e ? (t.e.dead ? 'Very dead. ' + (t.e.lootStore && !t.e.lootStore.items.length && !t.e.lootStore.gold ? 'Already picked clean.' : 'Its pockets look promising.') : examineText(t.e)) : ((ACTS[t.c] || []).filter(function (a) { return a.label === 'Examine'; })[0] || {}).text || (t.c === 'o' ? 'A ' + (nameOf(t) || 'thing').toLowerCase() + '. Worth a closer look; people hide things in furniture.' : 'A ' + (NAMES[t.c] || 'thing').toLowerCase() + '.');
    opts.push({ label: 'Examine' + (far ? ' from here' : ''), fn: function () { say(tapName(t), exam, 5000); } });
    if (t.e && !t.e.dead) {
      if (cheb(P.x, P.z, t.x, t.z) <= 6) opts.push({ label: 'Talk' + (far ? ' (call out)' : ''), fn: function () { talkOpen(t.e); } });
      else opts.push({ label: 'Walk over and talk', fn: function () { walkTo(t.x, t.z, function () { talkOpen(t.e); }, true); } });
      if (!t.e.calm && !t.e.npc) opts.push({ label: 'Attack', fn: function () { cbStart('You start it.', t.e); } });
    }
    opts.push({ label: far ? 'Walk over and interact' : 'Interact', fn: function () { walkTo(t.x, t.z, function () { openMenu(t); }, true); } });
    if (far) opts.push({ label: 'Walk over', fn: function () { walkTo(t.x, t.z, null, true); } });
    menuEl.innerHTML = ''; var hd = document.createElement('div'); hd.className = 'mh'; hd.textContent = tapName(t); menuEl.appendChild(hd);
    opts.forEach(function (o, i) { var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span>' + (i + 1) + '. ' + o.label + '</span>'; b.onclick = function () { closeMenu(); o.fn(); }; menuEl.appendChild(b); });
    menuOpen = true; menuAt = { x: P.px, z: P.pz }; menuEl.classList.add('on');
  }

  // ---------- the bathroom stall wall: messages only your party can read ----------
  function boardOpen(room, writing) {
    var rid = room ? room.id : 0, el = document.getElementById('lootw'); LOOTW.open = true;
    function render(msgs) {
      el.innerHTML = '<header><b>Stall wall · ' + esc(room ? room.name : '') + '</b><button type="button" class="xbtn" id="lwX">Close</button></header><div id="lootList">' +
        (msgs.length ? msgs.map(function (m) { return '<div class="li"><span><b>' + esc(m.username || 'someone') + '</b> <small style="display:inline">' + new Date(m.created).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</small><br>' + esc(m.text) + '</span></div>'; }).join('') : '<p style="color:#9ab;padding:8px">Nothing written here yet. Be the first.</p>') +
        '</div><div class="row2" style="flex-direction:column"><textarea id="bdTxt" maxlength="400" rows="2" placeholder="Leave a message for your party…" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:8px;font:inherit"></textarea><button type="button" class="ccBtn" id="bdPost">Write it on the wall</button></div>';
      document.getElementById('lwX').onclick = lootClose;
      var ta = document.getElementById('bdTxt'); ta.addEventListener('keydown', function (ev) { ev.stopPropagation(); }); if (writing) setTimeout(function () { ta.focus(); }, 50);
      document.getElementById('bdPost').onclick = function () {
        var txt = ta.value.trim(); if (!txt) return;
        var m = { room: rid, text: txt, username: (NET.user && NET.user.username) || (CHAR && CHAR.name) || 'you', created: Date.now() };
        if (NET.mode === 'server') api('board', { method: 'POST', body: { room: rid, text: txt } }).then(load, function (e) { say('Could not write', e.message, 3000); });
        else { var all = boardLocal(); all.push(m); try { localStorage.setItem('crawl-board', JSON.stringify(all.slice(-200))); } catch (x) {} load(); }
      };
    }
    function load() {
      if (NET.mode === 'server') api('board?room=' + rid).then(function (j) { render(j.messages || []); }, function () { render([]); });
      else render(boardLocal().filter(function (m) { return m.room === rid; }));
    }
    el.classList.add('on'); render([]); load();
  }
  function boardLocal() { try { return JSON.parse(localStorage.getItem('crawl-board') || '[]'); } catch (x) { return []; } }
