
  // ---------- state ----------
  var P = { x: start.x, z: start.z, px: start.x, pz: start.z, speed: 0 };
  var CAMV = { a: Math.PI / 4, yaw: 0, cx: 1, cz: 1, px: 0, pz: 0, uz: 1, home: false, fx: 0, fz: 0, halfH: 4.1, ptrs: {}, pinch: 0 };
  var SIGHTS = [{ name: 'Human eyes', r: 4, dark: false }, { name: 'Torch', r: 6, dark: false }, { name: 'Darkvision', r: 9, dark: true }];
  var sightI = 0, gearOpen = false, zoom = 1, spin = 0;
  hero.position.set(P.px, 0, P.pz);
  // ---------- free food in safe rooms: heals to full, then you are too stuffed to eat for two minutes ----------
  var FED_MS = 120000;
  function eatFood() {
    var now = Date.now();
    if (PC.hp >= PC.max) { say('Eat', 'You are already at full health. You eat a grape anyway.', 3500); return; }
    if (PC.fedUntil && now < PC.fedUntil) { say('Too full', 'You are stuffed. You can eat again in ' + Math.ceil((PC.fedUntil - now) / 1000) + ' seconds.', 3500); return; }
    var got = PC.max - PC.hp; PC.hp = PC.max; PC.fedUntil = now + FED_MS; skillCount('eat'); setTimeout(function () { achieve('free_lunch', 'Free Lunch', 'You ate the sponsors\' food. They own a small part of you now.', 10); }, 4600); if (typeof cbHUD === 'function') cbHUD();
    kitOneShot('PickUp_Table'); say('Free food', 'You eat like the sponsors are paying, because they are. +' + got + ' HP. You are full for the next two minutes.', 4500);
  }
  // ---------- where you are and what you have explored, saved per character ----------
  function heroTo(x, z) {
    if (x < 0 || z < 0 || x >= W || z >= H || blocksMove(x, z) || ch(x, z) === '#') return false;
    P.x = x; P.z = z; P.px = x; P.pz = z; P.path = null; hero.position.set(x, 0, z); return true;
  }
  function fogKey() { return 'crawl-fog-' + (NET.mode === 'server' ? NET.uid : 'local') + '-' + (CHAR ? CHAR.name : ''); }
  function fogSave() { // explored tiles as runs: start,length;start,length...
    var out = [], i = 0; while (i < W * H) { if (tileState[i]) { var j = i; while (j < W * H && tileState[j]) j++; out.push(i.toString(36) + ',' + (j - i).toString(36)); i = j; } else i++; }
    var str = out.join(';'); try { localStorage.setItem(fogKey(), str); } catch (e) {}
    // the server copy is what survives a new phone, a cleared browser or Safari's storage limits
    if (NET.mode === 'server' && NET.uid && str !== fogSave.last) { fogSave.last = str; clearTimeout(fogSave.t); fogSave.t = setTimeout(function () { api('kv/fog-' + (CHAR ? CHAR.name : '').replace(/[^\w-]/g, '').slice(0, 40), { method: 'PUT', body: { value: str } }).catch(function () {}); }, 3000); }
  }
  function fogMerge(s) { if (!s) return; s.split(';').forEach(function (p) { var a = p.split(','), st = parseInt(a[0], 36), n = parseInt(a[1], 36); for (var k = 0; k < n && st + k < W * H; k++) tileState[st + k] = 1; }); }
  function fogLoad() {
    var s; try { s = localStorage.getItem(fogKey()); } catch (e) {} fogMerge(s); FOG.total = 0; FOG.seen = 0;
    if (NET.mode === 'server' && NET.uid && CHAR) api('kv/fog-' + CHAR.name.replace(/[^\w-]/g, '').slice(0, 40)).then(function (j) { var v = j && (j.value !== undefined ? j.value : j.v); if (typeof v === 'string' && v) { fogMerge(v); FOG.total = 0; FOG.seen = 0; refreshFog(); fogSave(); } }).catch(function () {});
  }
  var lastSavedPos = '';
  function posRestore() { if (!CHAR) return; if (typeof worldLoad === 'function') worldLoad(); fogLoad(); if (CHAR.pos && heroTo(CHAR.pos.x, CHAR.pos.z)) { refreshFog(); enterRoom(); } }
  function posSave(force) {
    if (!CHAR || CB.on) return; var k = P.x + ',' + P.z; if (!force && k === lastSavedPos) return; lastSavedPos = k;
    CHAR.pos = { x: P.x, z: P.z }; fogSave(); saveChar(CHAR); worldSave();
  }
  setInterval(function () { posSave(false); }, 30000);
  if (CHAR) setTimeout(posRestore, 0);
  document.addEventListener('visibilitychange', function () { if (document.hidden) posSave(true); });

  function los(x0, z0, x1, z1) {
    var dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0), sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1, e = dx - dz, x = x0, z = z0;
    while (x !== x1 || z !== z1) {
      if ((x !== x0 || z !== z0) && blocksSight(x, z)) return false;
      var e2 = 2 * e; if (e2 > -dz) { e -= dz; x += sx; } if (e2 < dx) { e += dx; z += sz; }
    }
    return true;
  }
  var visNow = {}, tmp = new THREE.Color();
  var FOG = { total: 0, seen: 0 };
  var LIT = { bazaar: 4, arena: 4, blvd: 3, studio: 2, office: 1, garden: 1 }; // well-lit places let you see farther
  function roomLit(r) { return r.type === 'safe' || r.type === 'boss' || r.type === 'stairs' || r.lit || (r.type !== 'corridor' && (LIT[r.theme] || 0) >= 2); }
  function refreshFog() {
    streamChunks();
    sightI = sightNow(); var S = SIGHTS[sightI], here = roomInfo(P.x, P.z); var sl = document.getElementById('sight'); if (sl) sl.textContent = 'Sight: ' + S.name;
    var R = S.r + ((here && LIT[here.theme]) || 0); visNow = {};
    for (var z = P.z - R; z <= P.z + R; z++) for (var x = P.x - R; x <= P.x + R; x++) {
      if (x < 0 || z < 0 || x >= W || z >= H) continue;
      var d = Math.sqrt((x - P.x) * (x - P.x) + (z - P.z) * (z - P.z));
      if (d <= R + 0.4 && los(P.x, P.z, x, z)) { visNow[x + ',' + z] = d; if (!tileState[z * W + x]) { tileState[z * W + x] = 1; if (FOG.total && MAP[z].charAt(x) !== '#') FOG.seen++; } }
    }
    // a lit room shows itself: standing inside one, you see all of it that's in line of sight (up to 14 tiles), not just your torch radius
    if (here && roomLit(here)) {
      var LR = 14;
      for (z = Math.max(here.z0 - 1, P.z - LR); z <= Math.min(here.z1 + 1, P.z + LR); z++) for (x = Math.max(here.x0 - 1, P.x - LR); x <= Math.min(here.x1 + 1, P.x + LR); x++) {
        if (x < 0 || z < 0 || x >= W || z >= H || visNow[x + ',' + z] !== undefined) continue;
        var d3 = Math.sqrt((x - P.x) * (x - P.x) + (z - P.z) * (z - P.z));
        if (los(P.x, P.z, x, z)) { visNow[x + ',' + z] = Math.min(d3, R) * 0.55; if (!tileState[z * W + x]) { tileState[z * W + x] = 1; if (FOG.total && MAP[z].charAt(x) !== '#') FOG.seen++; } }
      }
    }
    // Living Map: you always know the shape of the room you're in and the ground a few steps past your light
    if (hasTrait('Living Map')) {
      var LM = R + 4;
      for (z = P.z - LM; z <= P.z + LM; z++) for (x = P.x - LM; x <= P.x + LM; x++) if (x >= 0 && z >= 0 && x < W && z < H && !tileState[z * W + x] && (x - P.x) * (x - P.x) + (z - P.z) * (z - P.z) <= LM * LM) { tileState[z * W + x] = 1; if (FOG.total && MAP[z].charAt(x) !== '#') FOG.seen++; }
      if (here && here.type !== 'corridor' && (here.x1 - here.x0) * (here.z1 - here.z0) < 900) for (z = here.z0 - 1; z <= here.z1 + 1; z++) for (x = here.x0 - 1; x <= here.x1 + 1; x++) if (x >= 0 && z >= 0 && x < W && z < H && !tileState[z * W + x]) { tileState[z * W + x] = 1; if (FOG.total && MAP[z].charAt(x) !== '#') FOG.seen++; }
    }
    if (!FOG.total) { for (var i = 0; i < W * H; i++) if (MAP[(i / W) | 0].charAt(i % W) !== '#') { FOG.total++; if (tileState[i]) FOG.seen++; } }
    document.getElementById('explored').textContent = 'Explored ' + (Math.round(1000 * FOG.seen / FOG.total) / 10) + '%';
    for (var j = 0; j < tiles.length; j++) {
      var t = tiles[j]; if (t.floor) { floorFog(t, R, S.dark); continue; }
      var key = t.x + ',' + t.z, d2 = visNow[key], explored = tileState[t.z * W + t.x];
      var ax = t.x - P.x, az = t.z - P.z, sum = ax * CAMV.cx + az * CAMV.cz, dif = Math.abs(ax * CAMV.cz - az * CAMV.cx), cut = sum >= 1 && sum <= 8 && dif <= 5;
      if (d2 === undefined) {
        t.mesh.visible = !!explored && !t.mob && !(t.glow && t.hang);
        if (t.mesh.visible) { if (t.glow) t.mesh.material.color.copy(t.base).multiplyScalar(0.3); else if (t.tint) t.mesh.material.color.copy(t.base).multiplyScalar(0.17); else t.mesh.material.color.setScalar(0.17); }
      } else {
        t.mesh.visible = true;
        var b = t.glow ? 1 : Math.max(0.4, 1.1 - d2 / (R + 1.5));
        if (t.glow) t.mesh.material.color.copy(t.base);
        else if (S.dark) { t.mesh.material.color.setRGB(0.62 * b, 0.78 * b, 1.15 * b); if (t.tint) t.mesh.material.color.multiply(t.base); }
        else if (t.tint) t.mesh.material.color.copy(t.base).multiplyScalar(b);
        else t.mesh.material.color.setScalar(b);
      }
      if (t.hang && cut) t.mesh.visible = false;
      if (t.wall) { var hh = cut ? 0.3 : t.h; t.mesh.scale.y = hh; t.mesh.position.y = hh / 2; }
      if (t.fade) { var hide = sum >= 1 && sum <= 5 && dif <= 1; t.mesh.material.opacity = hide ? 0.22 : 1; t.mesh.material.depthWrite = !hide; t.mesh.castShadow = !hide; }
    }
  }

  // ---------- system voice ----------
  var sysEl = document.getElementById('sys'), sysT = null, seenRooms = {}, lastRoom = '';
  // in a fight the last few events stay on screen in a small log, so one message never wipes out another
  var CBLOG = [];
  function cbLog(tag, msg) {
    var el = document.getElementById('cblog'); if (!el) { el = document.createElement('div'); el.id = 'cblog'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    if (typeof CB === 'undefined' || !CB.on) { CBLOG = []; el.classList.remove('on'); return; }
    CBLOG.unshift({ tag: tag, msg: msg }); CBLOG = CBLOG.slice(0, 6);
    el.innerHTML = '<h4>Combat log</h4>' + CBLOG.map(function (l, i) { return '<p class="' + (i ? '' : 'new') + '"><b>' + esc(l.tag) + '</b> ' + esc(l.msg) + '</p>'; }).join(''); el.classList.add('on');
  }
  setInterval(function () { var el = document.getElementById('cblog'); if (el && (typeof CB === 'undefined' || !CB.on) && el.classList.contains('on')) { el.classList.remove('on'); CBLOG = []; } }, 1000);
  function say(tag, msg, ms) {
    cbLog(tag, msg);
    document.getElementById('sysTag').textContent = tag; document.getElementById('sysMsg').textContent = msg;
    sysEl.classList.add('on'); clearTimeout(sysT); sysT = setTimeout(function () { sysEl.classList.remove('on'); }, ms || 4200);
  }
  var ROOM_LINES = {
    crypt: 'The Safe Room. No violence of any kind. The System takes this very seriously, and so does its teleporter.',
    hall: 'Pillars block your line of sight. Something could be behind any of them. Nothing is, yet.',
    moss: 'Somebody has been watering this. Nobody will say who.',
    store: 'Crates, dust, and one loot box the System forgot to lock.',
    water: 'Ankle deep. Your boots have filed a complaint.',
    gate: 'The stairs down are close. So is whatever is guarding them.'
  };
  function enterRoom() {
    var info = roomInfo(P.x, P.z); if (!info) return; var id = info.id; if (id === lastRoom) return; lastRoom = id;
    var hood = info.hood !== undefined ? LEVEL.hoods[info.hood] : null;
    document.getElementById('region').textContent = info.name;
    if (hood && !seenRooms['h' + info.hood]) { seenRooms['h' + info.hood] = 1; var newZ = CHAR && !(CHAR.zones && CHAR.zones[info.hood]); if (newZ) logEvent('Discovered ' + hood.name, 'zone'); say('Zone discovered: ' + hood.name, hood.line + (newZ ? ' +25 XP for finding it.' : ''), 6000); if (newZ) { CHAR.zones = CHAR.zones || {}; CHAR.zones[info.hood] = 1; grantXP(25); } }
    else if (!seenRooms[id] && info.type !== 'corridor') { seenRooms[id] = 1; if (info.type === 'hidden' && CHAR && !(CHAR.secrets = CHAR.secrets || {})[info.name]) { CHAR.secrets[info.name] = 1; skillCount('secret'); logEvent('Found a secret: ' + info.name, 'secret'); } say((info.type === 'safe' ? 'Safe room: ' : info.type === 'boss' ? 'Boss room: ' : info.type === 'hidden' ? 'Secret found: ' : 'Discovered: ') + info.name, info.line, 4500); }
    // a sharp-eyed crawler notices odd walls nearby
    var pp = 10 + MOD.WIS + skillLv('Perception');
    for (var dz = -2; dz <= 2; dz++) for (var dx = -2; dx <= 2; dx++) if (ch(P.x + dx, P.z + dz) === 'H' && pp >= 12 && !seenRooms['H' + (P.x + dx) + ',' + (P.z + dz)]) { seenRooms['H' + (P.x + dx) + ',' + (P.z + dz)] = 1; say('Perception · passive ' + pp, 'One of the walls near you does not look quite right.', 4500); }
  }

  // ---------- interact: D&D-style options and skill checks ----------
  var MOD = { STR: 0, DEX: 1, CON: 1, INT: 1, WIS: 2, CHA: 1 };
  var done = {}, menuEl = document.getElementById('menu'), menuOpen = false, menuAt = null;
  function stairsHint() {
    var dx = LEVEL.stairs.x - P.px, dz = LEVEL.stairs.z - P.pz, sxs = dx - dz, sys = dx + dz, n = Math.round(Math.sqrt(dx * dx + dz * dz));
    var v = sys > 2 ? 'down' : (sys < -2 ? 'up' : ''), h = sxs > 2 ? 'right' : (sxs < -2 ? 'left' : '');
    return n < 2 ? 'You are standing next to it.' : 'The stairwell is ' + n + ' tiles away, toward the ' + ((v + ' ' + h).trim() || 'middle') + ' of your screen.';
  }
  function nameOf(t) { return t.c === 'o' ? (LEVEL.dname[t.key] || 'Furniture') : NAMES[t.c]; }
  var NAMES = { o: 'Furniture', F: 'Free food', Y: 'Tree', X: 'Bathroom', H: 'Wall', T: 'Table', W: 'Weapon rack', U: 'Training dummy', b: 'Sack', h: 'Shelf', c: 'Candle stand', q: 'Cauldron', k: 'Book stand', g: 'Cage', v: 'Vase', C: 'Loot box (Bronze)', M: 'Cellar Grub, level 1', B: 'Brazier', P: 'Pillar', S: 'Stairwell', D: 'Doorway', K: 'Crate', R: 'Barrel', '#': 'Wall', area: 'Your surroundings' };
  var ACTS = {
    o: [
      { label: 'Search it', stat: 'INT', skill: ['Investigation', 1], dc: 11, flag: 'loot', win: 'Tucked behind it, something the last crawler missed.', lose: 'Dust, a button, and a note that just says "no".' },
      { label: 'Move it', stat: 'STR', dc: 14, win: 'It shifts an inch. Nothing behind it but more floor.', lose: 'It will not budge. It has seen crawlers come and go.' }
    ],
    F: [
      { label: 'Eat', auto: 'eat' },
      { label: 'Examine', text: 'A catering table, courtesy of the sponsors. Sandwiches, fruit, something in a pot. It heals you. Eating is free; loitering is filmed.' },
      { label: 'Pocket a snack', auto: 'snack' }
    ],
    Y: [
      { label: 'Examine', text: 'A real tree, underground. The sponsors pipe in the light. The roots go somewhere you would rather not know about.' },
      { label: 'Climb it for a look around', stat: 'STR', skill: ['Athletics', 1], dc: 12, flag: 'climb', win: 'From the top you can see over the reeds. You map the area around you.', lose: 'You slide down with a fistful of bark.' },
      { label: 'Hide in its branches', stat: 'DEX', skill: ['Stealth', 1], dc: 12, win: 'You disappear into the leaves. A bird objects.', lose: 'A branch snaps. Everyone heard that.' }
    ],
    C: [
      { label: 'Examine', text: 'A bronze loot box. Sealed. You are being filmed looking at it.' },
      { label: 'Investigate for traps', stat: 'INT', dc: 10, win: 'No traps. The lock is cheap and the hinges are worse.', lose: 'It looks like a box. You learn nothing else.' },
      { label: 'Pick the lock', stat: 'DEX', dc: 13, flag: 'open', win: 'Click. Inside: one slightly used torch and a coupon the System will not honor.', lose: 'The lock holds.' },
      { label: 'Force it open', stat: 'STR', dc: 15, flag: 'open', win: 'The lid gives up. Inside: one slightly used torch and a coupon the System will not honor.', lose: 'You hurt your shoulder. The box is fine.' },
      { label: 'Jury-rig the hinges', stat: 'DEX', skill: ['Jury-Rig', 2], dc: 12, flag: 'open', win: 'You pop the hinge pins with a boot buckle. Inside: one slightly used torch and a coupon.', lose: 'The pins will not budge. Yet.' }
    ],
    M: [
      { label: 'Examine', text: 'A Cellar Grub. Slow, damp, and rooted to the spot until combat is built.' },
      { label: 'Read its mood', stat: 'WIS', dc: 10, win: 'It is more bored than hungry. It would rather be left alone.', lose: 'It has too many eyes to read.' },
      { label: 'Talk it down', stat: 'CHA', skill: ['De-escalation', 2], dc: 12, flag: 'calm', win: 'You tell it "no, man" until it gives up. Its eyes turn green. You have made a friend.', lose: 'It hisses. You have not made a friend.' },
      { label: 'Play it a bass line', stat: 'CHA', skill: ['Performance', 3], dc: 11, flag: 'calm', win: 'It sways. Somewhere, viewer numbers tick up. Its eyes turn green.', lose: 'It prefers treble.' },
      { label: 'Intimidate', stat: 'CHA', dc: 14, win: 'It shrinks back against the wall.', lose: 'It is a grub. It does not know what you are.' },
      { label: 'Attack', text: 'Combat is not built yet. The grub is as relieved as you are.' }
    ],
    B: [
      { label: 'Examine', text: 'It burns without fuel. The showrunners like the mood lighting.' },
      { label: 'Light a torch from it', auto: 'torch', text: 'Torch lit. You now see 6 tiles, and it takes up your off hand.' },
      { label: 'Tip it over', stat: 'STR', dc: 13, win: 'It rocks, spills embers, and rights itself. Bolted down, apparently.', lose: 'It does not move. Your hands are warm now.' }
    ],
    P: [
      { label: 'Examine', text: 'Load-bearing and sight-blocking.' },
      { label: 'Hide behind it', stat: 'DEX', dc: 10, win: 'You vanish from the room. The cameras can still see you.', lose: 'Your hat sticks out.' },
      { label: 'Search it', stat: 'WIS', dc: 13, win: 'Tally marks, scratched low on the stone. Someone counted to forty-one.', lose: 'Stone. More stone.' }
    ],
    K: [
      { label: 'Examine', text: 'A shipping crate stamped with a logo from a planet you have never heard of.' },
      { label: 'Search it', stat: 'INT', dc: 11, win: 'Packing straw, and under it a jar of something pickled. It blinks.', lose: 'Straw. Just straw.' },
      { label: 'Smash it', stat: 'STR', dc: 14, win: 'One plank cracks. The crate is otherwise unimpressed.', lose: 'You have a splinter now.' }
    ],
    R: [
      { label: 'Examine', text: 'A barrel. It sloshes.' },
      { label: 'Smell it', stat: 'WIS', dc: 9, win: 'Vinegar, and under it something sweet. Probably not poison.', lose: 'It smells like a barrel.' },
      { label: 'Tap it', stat: 'DEX', skill: ['Jury-Rig', 2], dc: 12, win: 'You work the bung loose. A thin purple drizzle. You decide not to drink it yet.', lose: 'The bung is in there for good.' }
    ],
    S: [
      { label: 'Examine', text: 'Stairs down into the dark. Sealed. The stairwell boss has not been hired yet.' },
      { label: 'Listen at the stairs', stat: 'WIS', dc: 11, win: 'Far below: dripping, and something large turning over in its sleep.', lose: 'You hear your own breathing.' }
    ],
    D: [
      { label: 'Examine', text: 'An open doorway. Doors that close cost extra.' },
      { label: 'Listen ahead', stat: 'WIS', dc: 10, win: 'Nothing is moving on the other side.', lose: 'You cannot tell.' }
    ],
    '#': [
      { label: 'Examine', text: 'It is a wall.' },
      { label: 'Search for a hidden door', stat: 'WIS', skill: ['Perception', 0], dc: 13, win: 'You run your hands over every stone. It really is just a wall.', lose: 'Solid.' }
    ],
    H: [
      { label: 'Examine', text: 'It is a wall. Probably.' },
      { label: 'Search for a hidden door', stat: 'WIS', skill: ['Perception', 0], dc: 13, flag: 'found', win: 'A seam, a click, and the wall swings inward. Someone built this on purpose.', lose: 'Solid. Or you missed something.' }
    ],
    X: [{ label: 'Use the mirror (change hair and facial hair)', auto: 'mirror' }, { label: 'Read the stall wall', auto: 'board' }, { label: 'Write on the stall wall (only your party can read it)', auto: 'write' },
      { label: 'Examine', text: 'A safe room bathroom. Clean, by dungeon standards. The stall walls are covered in messages from crawlers.' }],
    T: [{ label: 'Examine', text: 'A table set for someone. The food is plastic. The plastic is also food.' }, { label: 'Search it', stat: 'INT', dc: 11, win: 'A crumpled napkin with a note: "the stairs are south of the ring". Helpful.', lose: 'Crumbs.' }],
    W: [{ label: 'Examine', text: 'A weapon rack. Every slot is empty except for a sign that says TAKE ONE.' }],
    U: [{ label: 'Examine', text: 'A training dummy with a crawler\'s face drawn on it. Not yours. Yet.' }, { label: 'Practice on it', stat: 'STR', dc: 8, win: 'Thwack. You feel slightly more dangerous.', lose: 'You miss a stationary target. On camera.' }],
    b: [{ label: 'Search it', stat: 'INT', dc: 10, flag: 'loot', win: 'You rummage through it.', lose: 'Old rags and something that bit you.' }],
    h: [{ label: 'Search it', stat: 'INT', dc: 11, flag: 'loot', win: 'Behind the bottles, something useful.', lose: 'Dusty bottles. All empty.' }],
    c: [{ label: 'Examine', text: 'A tall iron candle stand. The candles never burn down.' }],
    q: [{ label: 'Examine', text: 'A cauldron of something green that occasionally says "hello".' }, { label: 'Taste it', stat: 'CON', dc: 12, win: 'Tastes like soup. You feel fine. Mostly.', lose: 'You throw up a little.' }],
    k: [{ label: 'Read it', stat: 'INT', dc: 10, win: 'A field guide page: "Puglins flee when their leader falls. Imps will not cross a picket line."', lose: 'The handwriting is terrible.' }],
    g: [{ label: 'Examine', text: 'A small cage. The door is open. Whatever was inside is not.' }],
    v: [{ label: 'Smash it', stat: 'STR', dc: 6, flag: 'loot', win: 'Crash. Something rolls out of the shards.', lose: 'It bounces. Embarrassing.' }],
    area: [
      { label: 'Search the area', stat: 'WIS', dc: 12, win: 'Scuffed footprints, not yours, heading for the stairwell.', lose: 'Nothing catches your eye.' },
      { label: 'Sense the stairwell (Living Map)', auto: 'map' },
      { label: 'Try something', auto: 'try' },
      { label: 'Perform', stat: 'CHA', skill: ['Performance', 0], dc: 10, win: 'Good acoustics in here. Your mood improves.', lose: 'Nobody needed that.' },
      { label: 'Take a short rest', rest: true, text: 'You sit for a minute and patch yourself up. HP restored. Nothing attacks you. Enjoy it while it lasts.' }
    ]
  };
  function findTarget() {
    var fx = Math.sin(hero.rotation.y), fz = Math.cos(hero.rotation.y);
    var ax = Math.round(P.px + fx * 0.85), az = Math.round(P.pz + fz * 0.85), c = ch(ax, az);
    var ne = null; CB.enemies.forEach(function (q) { if (!q.eaten && (!q.dead || !q.looted) && cheb(q.x, q.z, P.x, P.z) <= 1 && (!ne || (q.x === ax && q.z === az))) ne = q; });
    if (ne && visNow[ne.x + ',' + ne.z] !== undefined) return { c: 'E', e: ne, key: 'e' + CB.enemies.indexOf(ne), x: ne.x, z: ne.z };
    if (visNow[ax + ',' + az] !== undefined && ACTS[c]) return { c: c, key: ax + ',' + az, x: ax, z: az };
    if (ch(P.x, P.z) === 'D') return { c: 'D', key: P.x + ',' + P.z, x: P.x, z: P.z };
    return { c: 'area', key: 'area' };
  }
  var LASTPTR = null; addEventListener('pointerdown', function (ev) { LASTPTR = { x: ev.clientX, y: ev.clientY, t: performance.now(), mouse: ev.pointerType === 'mouse' }; }, true);
  // with a mouse, menus open right beside the thing they are about (projected from the world), not in the corner
  function menuBeside(t) {
    menuEl.style.left = menuEl.style.top = menuEl.style.right = menuEl.style.bottom = '';
    if (!LASTPTR || !LASTPTR.mouse || !t) return;
    var v = new THREE.Vector3(t.e ? t.e.px : t.x, 0.9, t.e ? t.e.pz : t.z).project(cam), sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight;
    var mw = menuEl.offsetWidth || 260, mh = menuEl.offsetHeight || 200, x = sx + 34, y = sy - mh / 2;
    if (x + mw > innerWidth - 8) x = sx - mw - 34; y = Math.max(8, Math.min(innerHeight - mh - 8, y));
    menuEl.style.left = Math.max(8, x) + 'px'; menuEl.style.top = y + 'px'; menuEl.style.right = 'auto'; menuEl.style.bottom = 'auto';
  }
  function closeMenu() { menuOpen = false; menuEl.classList.remove('on'); document.getElementById('aInteract').classList.remove('held'); }
  function openMenu(t0) {
    if (gearOpen || (CHAR && CHAR.dead)) return; if (CB.on) { say('In combat', 'Tap an enemy to attack it, or use the combat buttons.', 2600); return; } if (menuOpen && !t0) { closeMenu(); return; }
    var t = t0 || findTarget(); menuAt = { x: P.px, z: P.pz }; sysEl.classList.remove('on');
    menuEl.innerHTML = ''; var hd = document.createElement('div'); hd.className = 'mh'; hd.textContent = t.e ? t.e.dead ? t.e.name + ' · dead' : t.e.npc ? t.e.name + ' · ' + 'production crew' : t.e.name + ' · ' + healthState(t.e)[0] + (t.e.calm ? ' · friendly' : '') : nameOf(t); menuEl.appendChild(hd);
    (t.e ? enemyActs(t.e) : actsOf(t)).forEach(function (a, i) {
      if (a.auto === 'try') a = { label: tryLabel(), auto: 'try' };
      var b = document.createElement('button'); b.type = 'button';
      var spent = a.flag && done[t.key + a.flag] && a.flag !== 'open' && a.flag !== 'loot';
      var bonus = a.stat ? chkBonus(a) : 0;
      b.innerHTML = '<span>' + (i + 1) + '. ' + a.label + '</span>' + (spent ? '<i>done</i>' : (a.stat ? '<i>' + a.stat + (a.skill ? ' + ' + a.skill[0] : '') + ' +' + bonus + '</i>' : ''));
      if (spent) b.disabled = true;
      b.onclick = function () { act(t, a); };
      menuEl.appendChild(b);
    });
    menuOpen = true; menuEl.classList.add('on'); document.getElementById('aInteract').classList.add('held');
    menuBeside(t);
  }
  function act(t, a) {
    closeMenu();
    if ((a.flag === 'open' || a.flag === 'loot') && done[t.key + a.flag]) { lootSpot(t.x, t.z, a.flag === 'open' ? 'chest' : 'small'); return; }
    kitOneShot(a.stat ? 'Interact' : 'PickUp_Table');
    if (a.auto === 'map') { say('Living Map', stairsHint()); return; }
    if (a.auto && safeAct(a, t)) { closeMenu(); return; }
    if (a.auto === 'mirror') { GMODE = 'mirror'; tab = 'Face'; if (!gearOpen) toggleGear(); else { drawTabs(); drawRows(); } return; }
    if (a.auto === 'board' || a.auto === 'write') { boardOpen(roomInfo(t.x, t.z), a.auto === 'write'); return; }
    if (a.talk) { talkOpen(t.e); return; }
    if (a.loot) { lootBody(t.e); return; }
    if (a.stash) { stashBody(t.e); return; }
    if (a.harvest) { closeMenu(); harvest(t.e); return; }
    if (a.auto === 'try') { trySomething(t.e || null); return; }
    if (a.fnx) { a.fnx(); return; }
    if (a.fight) { say('Attack', t.e.calm ? 'You swing at a friend. It is no longer a friend.' : 'You strike first.', 2200); t.e.calm = false; cbStart(t.e.calm ? '' : 'You started it.', t.e); return; }
    if (a.rest) { PC.hp = PC.max; cbHUD(); }
    if (a.auto === 'eat') { eatFood(); return; }
    if (a.auto === 'snack') {
      if (done[t.key + 'snack']) { say('Pocket a snack', 'You already took one from this table. The caterer is watching you now.', 3500); return; }
      done[t.key + 'snack'] = true; invAdd(item(DROPS.sources.catering, { from: 'a catering table' }));
      say('Pocket a snack', 'One sandwich for the road. It heals 4 HP when you eat it from your bag.', 3500); return;
    }
    if (a.auto === 'torch') { if (CHAR) { CHAR.torch = true; cbSaveChar(); } look.off = [2, look.off[1]]; buildHero(); saveLook(); refreshFog(); say(a.label, a.text + ' Use the Torch button to raise or lower it.'); return; }
    if (!a.stat) { say(a.label, a.text); return; }
    var roll = 1 + Math.floor(Math.random() * 20), bonus = chkBonus(a), total = roll + bonus;
    var ok = roll === 20 || (roll !== 1 && total >= a.dc);
    var line = 'd20 ' + roll + ' + ' + bonus + ' = ' + total + ' vs DC ' + a.dc + (roll === 20 ? ' · natural 20' : (roll === 1 ? ' · natural 1' : ''));
    say((ok ? 'Success' : 'Failure') + ' · ' + a.label + ' · ' + line, ok ? a.win : a.lose, 6500);
    if (ok && a.skill) skillUse(a.skill[0]);
    if (ok && a.flag) {
      done[t.key + a.flag] = true;
      if (a.flag === 'calm' && t.e) { t.e.calm = true; cbHUD(); overcome(t.e); mindGroup(t.e); }
      if (a.flag === 'calm') { tiles.forEach(function (q) { if (q.mob && q.glow && q.x === t.x && q.z === t.z) q.base.set(0x40ff70); }); refreshFog(); }
      if (a.flag === 'open') { tiles.forEach(function (q) { if (q.x === t.x && q.z === t.z && q.lid) { q.mesh.position.y += 0.2; q.mesh.position.z -= 0.2; } }); lootSpot(t.x, t.z, 'chest'); }
      if (a.flag === 'loot') lootSpot(t.x, t.z, 'small');
      if (a.flag === 'found') { revealHidden(t.x, t.z); }
      if (a.flag === 'climb') { for (var cz = -14; cz <= 14; cz++) for (var cx = -14; cx <= 14; cx++) { var qx = t.x + cx, qz = t.z + cz; if (qx >= 0 && qz >= 0 && qx < W && qz < H && cx * cx + cz * cz <= 196 && !tileState[qz * W + qx]) { tileState[qz * W + qx] = 1; if (FOG.total && MAP[qz].charAt(qx) !== '#') FOG.seen++; } } refreshFog(); done[t.key + 'climb'] = false; }
    }
  }

  // ---------- movement: free roaming with a joystick ----------
  var joy = { x: 0, y: 0 }, keys = {}, walkPhase = 0, jumpT = -1, crouch = false, cr = 0, walked = 0, achieved = false;
  function solidNear(px_, pz_) {
    var r = 0.27, bx = Math.round(px_), bz = Math.round(pz_);
    for (var tz = bz - 1; tz <= bz + 1; tz++) for (var tx = bx - 1; tx <= bx + 1; tx++) {
      if (!blocksMove(tx, tz)) continue;
      var cx = Math.max(tx - 0.5, Math.min(px_, tx + 0.5)), cz = Math.max(tz - 0.5, Math.min(pz_, tz + 0.5));
      if ((px_ - cx) * (px_ - cx) + (pz_ - cz) * (pz_ - cz) < r * r) return true;
    }
    return false;
  }
  function moveHero(dt) {
    if (CB.on) { cbMove(dt); return; }
    if (CHAR && CHAR.dead) { P.speed = 0; P.path = null; return; }
    if (PC.timeout && performance.now() < PC.timeout) { P.speed = 0; return; }
    var sx = joy.x, sy = joy.y;
    if (keys.L) sx -= 1; if (keys.R) sx += 1; if (keys.U) sy -= 1; if (keys.D) sy += 1;
    var m = Math.sqrt(sx * sx + sy * sy), wx, wz;
    if (m >= 0.15) P.path = null;
    if (P.path && !gearOpen) { // walking to a tapped spot
      var nt = P.path[0], ddx = nt[0] - P.px, ddz = nt[1] - P.pz, dl = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dl <= Math.max(0.1, (crouch ? 1.5 : 3.3) * dt)) { P.px = nt[0]; P.pz = nt[1]; P.path.shift();
        if (!P.path.length) { P.path = null; P.speed = 0; var arrive = P.onArrive; P.onArrive = null; var tx0 = Math.round(P.px), tz0 = Math.round(P.pz); if (tx0 !== P.x || tz0 !== P.z) { P.x = tx0; P.z = tz0; refreshFog(); enterRoom(); cbAggro(); } if (arrive && !CB.on) arrive(); return; }
        nt = P.path[0]; ddx = nt[0] - P.px; ddz = nt[1] - P.pz; dl = Math.sqrt(ddx * ddx + ddz * ddz); }
      wx = ddx / dl; wz = ddz / dl; m = 1;
    } else {
      if (gearOpen || m < 0.15) { P.speed = 0; return; }
      if (m > 1) { sx /= m; sy /= m; m = 1; }
      var ca = Math.cos(CAMV.a), sa = Math.sin(CAMV.a); wx = sx * ca + sy * sa; wz = -sx * sa + sy * ca; // screen direction to floor direction (follows the camera's turn)
      if (CAMV.px || CAMV.pz) CAMV.home = true; // moving with the stick brings the camera back to you
    }
    if (menuOpen && Math.abs(P.px - menuAt.x) + Math.abs(P.pz - menuAt.z) > 0.4 && !P.path) closeMenu();
    var top = crouch ? 1.5 : 3.3; P.speed = top * m;
    var nx = P.px + wx * top * dt, nz = P.pz + wz * top * dt, ox = P.px, oz = P.pz;
    if (P.path) { P.px = nx; P.pz = nz; } else {
    if (!solidNear(nx, P.pz)) P.px = nx;
    if (!solidNear(P.px, nz)) P.pz = nz; }
    walked += Math.abs(P.px - ox) + Math.abs(P.pz - oz);
    var want = Math.atan2(wx, wz), d = want - hero.rotation.y;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    hero.rotation.y += d * Math.min(1, dt * 14);
    var tx = Math.round(P.px), tz = Math.round(P.pz);
    if (tx !== P.x || tz !== P.z) { P.x = tx; P.z = tz; refreshFog(); enterRoom(); cbAggro(); }
    if (!achieved && walked > 3) { achieved = true; achieve('bipedal', 'Bipedal', 'You walked three whole tiles. The bar will be raised.', 10); }
  }
  function jump() { if (CB.on) return; if (jumpT < 0 && !gearOpen) { jumpT = 0; if (crouch) toggleCrouch(); } }
  function toggleCrouch() {
    if (gearOpen || CB.on) return; crouch = !crouch;
    document.getElementById('aCrouch').classList.toggle('held', crouch);
    if (crouch) say('Crouching', 'You move slower and lower. Stealth rules arrive with combat.', 2600);
  }
  var stick = document.getElementById('stick'), knob = document.getElementById('knob'), stickId = null;
  function stickMove(e) {
    var r = stick.getBoundingClientRect(), R = r.width / 2 - 20;
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.sqrt(dx * dx + dy * dy);
    if (m > R) { dx *= R / m; dy *= R / m; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; joy.x = dx / R; joy.y = dy / R;
  }
  function stickEnd(e) { if (e.pointerId !== stickId) return; stickId = null; joy.x = joy.y = 0; knob.style.transform = ''; }
  stick.addEventListener('pointerdown', function (e) { e.preventDefault(); stickId = e.pointerId; try { stick.setPointerCapture(e.pointerId); } catch (x) {} stickMove(e); });
  stick.addEventListener('pointermove', function (e) { if (e.pointerId === stickId) stickMove(e); });
  stick.addEventListener('pointerup', stickEnd); stick.addEventListener('pointercancel', stickEnd);
  function tap(id, fn) { var el = document.getElementById(id); el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.classList.add('on'); fn(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { el.addEventListener(n, function () { el.classList.remove('on'); }); }); }
  // what you can see comes from your body and your hands: human eyes, a torch if you are holding one, darkvision only if you have it
  function sightNow() { return hasTrait('Darkvision') ? 2 : sty('off') === 2 || lampLit() ? 1 : 0; }
  function cycleSight() {
    if (gearOpen) return;
    var lamp = lampWorn(); if (lamp && sty('off') !== 2) { lampAct('lamptog', lamp); return; }
    if (sty('off') === 2) { look.off = [0, look.off[1]]; buildHero(); saveLook(); refreshFog(); say('Torch lowered', 'You lower your torch. Human eyes: you see ' + SIGHTS[sightNow()].r + ' tiles, more in well-lit places.', 3200); return; }
    if (CHAR && (CHAR.torch || hasLight())) { look.off = [2, look.off[1]]; buildHero(); saveLook(); refreshFog(); say('Torch raised', 'You hold up your torch. You see ' + SIGHTS[1].r + ' tiles, and it takes your off hand.', 3200); return; }
    say('No torch', 'You do not have a torch. Light one at any brazier (walk up to one and interact). Your eyes are what they are.', 3800);
  }
  tap('aInteract', openMenu); tap('aJump', jump); tap('aTry', function () { var best = null, bd = 7; CB.enemies.forEach(function (q) { if (q.dead || q.npc) return; var dd = cheb(P.x, P.z, q.x, q.z); if (dd < bd && los(P.x, P.z, q.x, q.z)) { bd = dd; best = q; } }); trySomething(best); }); tap('aCrouch', toggleCrouch); tap('aSight', cycleSight);
  var KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
  window.addEventListener('keydown', function (e) {
    if (LOOTW.open) { if (e.key === 'Escape') lootClose(); return; }
    if (TALK.open || CC || AUTH.open || (typeof TRY !== 'undefined' && TRY.open)) return;
    if (e.key === 'i' || e.key === 'I') { bagToggle(); return; } if (e.key === 'm' || e.key === 'M') { mapToggle(); return; }
    if (e.key === 'Escape' && CRAFT.open) { craftToggle(); return; }
    if (e.key === 'Escape' && CS.open) { charToggle(); return; }
    if (e.key === 'Escape' && (UI.bag || UI.map)) { if (UI.bag) bagToggle(); if (UI.map) mapToggle(); return; }
    if (CB.on && !gearOpen) { var ck = cbMenuOpen() && e.key >= '1' && e.key <= '9' ? function () { cbMenuPick(+e.key); } : { '1': function () { cbAttackButton(false); }, '2': function () { cbMenuToggle('acts'); }, '3': function () { cbMenuToggle('bonus'); }, e: cbEndTurn, Enter: cbEndTurn, Escape: cbMenuClose }[e.key]; if (ck) { e.preventDefault(); ck(); } if (KEYS[e.key] || e.key === ' ') e.preventDefault(); return; }
    if (KEYS[e.key]) { e.preventDefault(); keys[KEYS[e.key]] = true; }
    else if (e.key === ' ') { e.preventDefault(); jump(); }
    else if (e.repeat) return;
    else if (e.key === 'e' || e.key === 'Enter') openMenu();
    else if (menuOpen && e.key >= '1' && e.key <= '9') { var mb = menuEl.querySelectorAll('button')[Number(e.key) - 1]; if (mb && !mb.disabled) mb.click(); }
    else if (e.key === 'Escape') closeMenu();
    else if (e.key === 'c') toggleCrouch();
    else if (e.key === '[' || e.key === 'q' || e.key === 'Q') camTurn(-1);
    else if (e.key === ']' || e.key === 'r' || e.key === 'R') camTurn(1);
    else if (e.key === '-' || e.key === '_') camZoom(1 / 1.25);
    else if (e.key === '=' || e.key === '+') camZoom(1.25);
    else if (e.key === 'h' || e.key === 'H' || e.key === 'Home') CAMV.home = true;
    else if (e.key === 'v') cycleSight();
    else if (e.key === 'g') toggleGear();
  });
  window.addEventListener('keyup', function (e) { if (KEYS[e.key]) keys[KEYS[e.key]] = false; });
  window.addEventListener('blur', function () { keys = {}; });

  // ---------- character builder ----------
  var rowsEl = document.getElementById('rows'), tabsEl = document.getElementById('tabs'), tab = 'Body', autoSpin = true;
  var TABS = ['Body', 'Face', 'Clothes', 'Gear', 'Sheet'], GMODE = 'normal';
  // which tabs show: designing a new character, at a bathroom mirror, or normal play (clothes you own, your sheet)
  function tabsNow() {
    if (GMODE === 'design') return ['Body', 'Face', 'Clothes'];
    if (GMODE === 'mirror') return ['Face'];
    if (!CHAR || CHAR.freeWardrobe) return TABS;
    return ['Clothes', 'Sheet'];
  }
  var MIRROR_KEYS = { kHair: 1, kBeard: 1, kBrows: 1, hair: 1, beard: 1 };
  function saveLook() { try { localStorage.setItem('crawl-look7', JSON.stringify(look)); } catch (e) {} saveLookRemote(); }
  function drawTabs() {
    tabsEl.innerHTML = '';
    var TT = tabsNow(); if (TT.indexOf(tab) < 0) tab = TT[0];
    document.getElementById('closeGear').textContent = GMODE === 'design' ? 'Confirm and enter the dungeon' : GMODE === 'mirror' ? 'Done' : 'Back to the crawl';
    document.getElementById('randBtn').style.display = GMODE === 'design' || !CHAR ? '' : 'none';
    TT.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (t === tab) b.className = 'on';
      b.onclick = function () { tab = t; if (t === 'Face') { autoSpin = false; spin = Math.PI / 4 - hero.rotation.y; } drawTabs(); drawRows(); }; tabsEl.appendChild(b);
    });
  }
  function drawRows() {
    rowsEl.innerHTML = '';
    if (tab === 'Sheet') { rowsEl.innerHTML = sheetHTML(); sheetAfter(); return; }
    if (tab === 'Clothes' && kitMode() && clothesLocked()) { wardrobeRows(rowsEl); return; }
    SLOTS.filter(function (s) { return s.tab === tab && (GMODE !== 'mirror' || MIRROR_KEYS[s.key]) && !(s.hand && kitMode()) && !(s.kit && !kitMode()); }).forEach(function (s) {
      var row = document.createElement('div'); row.className = 'row';
      var lab = document.createElement('span'); lab.className = 'slot'; lab.textContent = s.label; row.appendChild(lab);
      var multi = s.styles.length > 1;
      var prev = document.createElement('button'); prev.type = 'button'; prev.textContent = '‹'; prev.setAttribute('aria-label', 'Previous ' + s.label);
      var next = document.createElement('button'); next.type = 'button'; next.textContent = '›'; next.setAttribute('aria-label', 'Next ' + s.label);
      var val = document.createElement('span'); val.className = 'val'; val.textContent = s.styles[look[s.key][0]];
      function finish() { buildHero(); saveLook(); drawRows(); }
      function step(n) { look[s.key][0] = (look[s.key][0] + n + s.styles.length) % s.styles.length; finish(); }
      prev.onclick = function () { step(-1); }; next.onclick = function () { step(1); };
      if (!multi) { prev.style.visibility = 'hidden'; next.style.visibility = 'hidden'; }
      row.appendChild(prev); row.appendChild(val); row.appendChild(next);
      var sw = document.createElement('button'); sw.type = 'button'; sw.className = 'sw'; sw.setAttribute('aria-label', s.label + ' color');
      var noCol = s.kitColors && /^None$/.test(s.styles[look[s.key][0]]);
      if (s.colors && !noCol) { var pal = s.kitColors ? KIT_SW[kitOutfitOf(s.styles[look[s.key][0]])] : s.colors; sw.style.background = hexs(s.kitColors ? pal[look[s.key][1] % pal.length] : s.colors[look[s.key][1] % s.colors.length]); sw.onclick = function () { look[s.key][1] = (look[s.key][1] + 1) % pal.length; finish(); }; }
      else sw.style.visibility = 'hidden';
      row.appendChild(sw); rowsEl.appendChild(row);
    });
    if (tab === 'Face' && sty('src') === 1 && !kitMode()) { var n0 = document.createElement('div'); n0.className = 'row dim'; n0.innerHTML = '<span class="slot">Photo</span><span class="val">Eyes, brows and mouth come from the photo; beards add on top</span>'; rowsEl.insertBefore(n0, rowsEl.children[1] || null); }
    if (tab === 'Face' && !kitMode()) { var n1 = document.createElement('div'); n1.className = 'row dim'; n1.innerHTML = '<span class="slot">Note</span><span class="val">Beard and brows follow hair color</span>'; rowsEl.appendChild(n1); }
    if (tab === 'Gear') { var j = document.createElement('div'); j.className = 'row dim'; j.innerHTML = '<span class="slot">Jewelry</span><span class="val">2 rings, 1 amulet: gear screen only</span>'; rowsEl.appendChild(j); }
  }
  function randomLook() {
    SLOTS.forEach(function (s) { if (s.key === 'model' || s.key === 'src') return; look[s.key] = [Math.floor(Math.random() * s.styles.length), s.colors ? Math.floor(Math.random() * s.colors.length) : 0]; });
    buildHero(); saveLook(); drawRows();
  }
  function toggleGear() {
    if (!gearOpen && CB.on) { say('Not now', 'No changing clothes in the middle of a fight.', 2400); return; }
    if (gearOpen && GMODE === 'design') { GMODE = 'normal'; if (CHAR) { CHAR.designed = true; saveChar(CHAR); } setTimeout(function () { say('Welcome to the crawl', 'You wake up in a Safe Room. A nervous imp with a clipboard is waiting for you. Tap things to look at them, or walk up and press Interact.', 8000); }, 600); }
    else if (gearOpen && GMODE === 'mirror') { GMODE = 'normal'; if (CHAR) saveChar(CHAR); }
    gearOpen = !gearOpen; joy.x = joy.y = 0; closeMenu();
    document.getElementById('gear').classList.toggle('on', gearOpen);
    document.getElementById('stick').style.display = gearOpen ? 'none' : '';
    document.getElementById('bar').style.display = gearOpen ? 'none' : '';
    document.getElementById('dragHint').style.display = gearOpen ? 'block' : 'none';
    document.getElementById('title').style.display = gearOpen ? 'none' : '';
    if (gearOpen) { if (crouch) { crouch = false; document.getElementById('aCrouch').classList.remove('held'); } drawTabs(); drawRows(); sysEl.classList.remove('on'); autoSpin = tab !== 'Face'; spin = tab === 'Face' ? Math.PI / 4 - hero.rotation.y : 0.5; } else { rig.rotation.y = 0; }
  }
  document.getElementById('gearBtn').addEventListener('click', toggleGear);
  document.getElementById('closeGear').addEventListener('click', toggleGear);
  document.getElementById('randBtn').addEventListener('click', randomLook);
  var dragX = null;
  canvas.addEventListener('pointerdown', function (e) { if (gearOpen) { dragX = e.clientX; autoSpin = false; } });
  window.addEventListener('pointermove', function (e) { if (dragX !== null && gearOpen) { spin += (e.clientX - dragX) * 0.012; dragX = e.clientX; } });
  window.addEventListener('pointerup', function () { dragX = null; });

  // ---------- camera + loop ----------
  var lowPower = false;
  function resize() {
    renderer.setPixelRatio(lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', resize); resize();
  var camY = 12;
  function frameCam() {
    var w = window.innerWidth, h = window.innerHeight, ar = w / h, face = gearOpen && tab === 'Face';
    var halfH = (ar >= 1 ? 4.1 : 3.8 / ar) / zoom, halfW = halfH * ar; CAMV.halfH = halfH;
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH; cam.updateProjectionMatrix();
    // the camera's turn eases toward the chosen quarter; panning eases home when asked
    var want = Math.PI / 4 + CAMV.yaw * Math.PI / 2, dA = want - CAMV.a; CAMV.a += dA * 0.18; if (Math.abs(dA) < 0.002) CAMV.a = want;
    if (CAMV.home || gearOpen) { CAMV.px *= 0.82; CAMV.pz *= 0.82; if (Math.abs(CAMV.px) + Math.abs(CAMV.pz) < 0.02) { CAMV.px = CAMV.pz = 0; CAMV.home = false; } }
    var ca = Math.cos(CAMV.a), sa = Math.sin(CAMV.a), shift = gearOpen ? -halfW * 0.3 : 0; // slide the hero clear of the builder panel
    var tx = hero.position.x + CAMV.px + shift * ca, tz = hero.position.z + CAMV.pz - shift * sa, ty = gearOpen ? (face ? (1.02 + LIFT) * rig.scale.y : 0.72) : 0.45;
    camY += ((face ? 3.5 : 12) - camY) * 0.15;
    cam.position.set(tx + sa * 16.97, ty + camY, tz + ca * 16.97); cam.lookAt(tx, ty, tz);
    sun.position.set(hero.position.x - 5, 11, hero.position.z + 4); sun.target.position.copy(hero.position);
    var fx = Math.round(tx), fz = Math.round(tz); // looking somewhere new: build the chunks there and light what you have explored
    if (Math.abs(fx - CAMV.fx) + Math.abs(fz - CAMV.fz) >= 3) { CAMV.fx = fx; CAMV.fz = fz; refreshFog(); }
    document.getElementById('camHome').style.display = (Math.abs(CAMV.px) + Math.abs(CAMV.pz) > 1.5 && !gearOpen) ? '' : 'none';
  }
  // ---------- free look: drag to look around, pinch or scroll to zoom, turn the board in quarter steps ----------
  function camZoom(f) { CAMV.uz = Math.max(0.45, Math.min(2.4, CAMV.uz * f)); }
  function camTurn(d) { CAMV.yaw = (CAMV.yaw + d + 4) % 4; var a = Math.PI / 4 + CAMV.yaw * Math.PI / 2; CAMV.cx = Math.round(Math.sin(a) * 1.4142); CAMV.cz = Math.round(Math.cos(a) * 1.4142); refreshFog(); }
  function camPan(dx, dy) { // pixels dragged → floor units, so the floor sticks to your finger
    var k = 2 * CAMV.halfH / window.innerHeight, ca = Math.cos(CAMV.a), sa = Math.sin(CAMV.a);
    CAMV.px -= (dx * k) * ca + (dy * k * 1.732) * sa; CAMV.pz -= -(dx * k) * sa + (dy * k * 1.732) * ca;
    var m = Math.sqrt(CAMV.px * CAMV.px + CAMV.pz * CAMV.pz); if (m > 28) { CAMV.px *= 28 / m; CAMV.pz *= 28 / m; } CAMV.home = false;
  }
  (function camUI() {
    var css = document.createElement('style');
    css.textContent = '#camBar{position:fixed;top:174px;right:10px;z-index:6;display:flex;gap:4px}#camBar button{width:28px;height:28px;padding:0;border-radius:6px;background:rgba(8,9,15,.72);border:1px solid rgba(61,242,224,.35);color:var(--neon);font:inherit;font-size:14px;cursor:pointer}' +
      '#camHome{position:fixed;left:50%;top:52px;transform:translateX(-50%);z-index:6;padding:6px 12px;border-radius:14px;background:rgba(8,9,15,.8);border:1px solid var(--neon);color:var(--neon);font:inherit;font-size:11px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}';
    document.head.appendChild(css);
    var bar = document.createElement('div'); bar.id = 'camBar';
    [['−', 'Zoom out', function () { camZoom(1 / 1.25); }], ['+', 'Zoom in', function () { camZoom(1.25); }], ['⟲', 'Turn the board left', function () { camTurn(-1); }], ['⟳', 'Turn the board right', function () { camTurn(1); }]].forEach(function (b) {
      var el = document.createElement('button'); el.type = 'button'; el.textContent = b[0]; el.title = b[1]; el.setAttribute('aria-label', b[1]); el.onclick = b[2]; bar.appendChild(el); });
    document.body.appendChild(bar);
    var home = document.createElement('button'); home.type = 'button'; home.id = 'camHome'; home.textContent = '◎ Back to me'; home.style.display = 'none'; home.onclick = function () { CAMV.home = true; }; document.body.appendChild(home);
  })();
  canvas.addEventListener('wheel', function (e) { if (gearOpen) return; e.preventDefault(); camZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  canvas.addEventListener('pointerdown', function (e) { if (gearOpen) return; CAMV.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY }; CAMV.pinch = 0; });
  window.addEventListener('pointermove', function (e) {
    var p = CAMV.ptrs[e.pointerId]; if (!p || gearOpen) return;
    var ids = Object.keys(CAMV.ptrs);
    if (ids.length >= 2) { // pinch to zoom
      p.x = e.clientX; p.y = e.clientY; var a = CAMV.ptrs[ids[0]], b = CAMV.ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (CAMV.pinch) camZoom(d / CAMV.pinch); CAMV.pinch = d; return;
    }
    if (!p.panning && Math.abs(e.clientX - p.sx) + Math.abs(e.clientY - p.sy) > 14) p.panning = true;
    if (p.panning) camPan(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY;
  });
  ['pointerup', 'pointercancel'].forEach(function (n) { window.addEventListener(n, function (e) { delete CAMV.ptrs[e.pointerId]; CAMV.pinch = 0; }); });
  var perfN = 0, perfT = 0, perfLast = performance.now();
  var last = performance.now(), hq1 = new THREE.Quaternion(), hq2 = new THREE.Quaternion(), hq3 = new THREE.Quaternion(), upY = new THREE.Vector3(0, 1, 0);
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000), T = now / 1000; last = now;
    moveHero(dt);
    hero.position.x = P.px; hero.position.z = P.pz;
    cr += ((crouch ? 1 : 0) - cr) * Math.min(1, dt * 12);
    var jy = 0, air = jumpT >= 0, hipL = 0, hipR = 0, knL = 0, knR = 0, shL = 0, shR = 0, elL = -0.18, elR = -0.18;
    if (air) { jumpT += dt / 0.5; if (jumpT >= 1) { jumpT = -1; air = false; } else jy = Math.sin(jumpT * Math.PI) * 0.62; }
    var br = Math.sin(T * 1.9);
    if (air) { hipL = -0.9; hipR = -0.3; knL = 1.5; knR = 0.9; shL = shR = -2.3; elL = elR = -0.5; }
    else if (P.speed > 0) {
      walkPhase += dt * (2.6 + P.speed * 2.5);
      var amp = 0.32 + 0.13 * P.speed, s = Math.sin(walkPhase);
      hipL = s * amp; hipR = -s * amp;
      knL = Math.max(0, Math.cos(walkPhase)) * amp * 1.5; knR = Math.max(0, -Math.cos(walkPhase)) * amp * 1.5;
      shL = -s * amp * 0.8; shR = s * amp * 0.8; elL = -0.35 - Math.max(0, s) * 0.4; elR = -0.35 - Math.max(0, -s) * 0.4;
    } else { shL = br * 0.03; shR = -br * 0.03; }
    hipL += -0.95 * cr; hipR += -0.95 * cr; knL += 1.7 * cr; knR += 1.7 * cr; if (cr > 0.01) { elL -= 0.5 * cr; elR -= 0.5 * cr; }
    if (sty('main')) { elR = Math.min(elR, -0.55); } if (sty('off')) { elL = Math.min(elL, sty('off') === 2 ? -1.1 : -0.6); if (sty('off') === 2) shL = Math.min(shL, -0.25); }
    LL.hip.rotation.x = hipL; LR.hip.rotation.x = hipR; LL.knee.rotation.x = knL; LR.knee.rotation.x = knR;
    LL.foot.rotation.x = -(hipL + knL) * (air ? 0.4 : 1); LR.foot.rotation.x = -(hipR + knR) * (air ? 0.4 : 1);
    AL.sh.rotation.x = shL; AR.sh.rotation.x = shR; AL.el.rotation.x = elL; AR.el.rotation.x = elR;
    AL.sh.rotation.z = -0.05 - br * 0.012; AR.sh.rotation.z = 0.05 + br * 0.012;
    if (KIT && KIT.on) kitAnimate(dt, P.speed, air, crouch, sty('off') === 2);
    cbUpdate(dt);
    held.forEach(function (h) { h.el.updateWorldMatrix(true, false); h.el.getWorldQuaternion(hq1); rig.parent.getWorldQuaternion(hq2); hq3.setFromAxisAngle(upY, rig.rotation.y); h.g.quaternion.copy(hq1.invert()).multiply(hq2).multiply(hq3); if (h.t) h.g.quaternion.multiply(h.t); }); // torches, staves and blades stay upright whatever the arm does
    rig.position.y = (KIT && KIT.on) ? jy + LIFT * rig.scale.y : jy + (LIFT - 0.155 * cr) * rig.scale.y + (P.speed > 0 && !air ? Math.abs(Math.sin(walkPhase)) * 0.025 : br * 0.004);
    rig.rotation.x = (air || (KIT && KIT.on)) ? 0 : (0.18 * cr + (P.speed > 2 ? 0.06 : 0));
    headG.rotation.y = (gearOpen || P.speed > 0) ? 0 : Math.sin(T * 0.6) * 0.3;
    blob.material.opacity = 0.3 - jy * 0.3;
    // living world: flames, firelight, water, the grub breathing
    for (var i = 0; i < flames.length; i++) { var f = flames[i], k = 0.8 + 0.3 * Math.sin(T * 9 + f.ph) + 0.15 * Math.sin(T * 23 + f.ph * 2); f.m.scale.y = f.h * k; f.m.position.y = f.y + f.h * k / 2; f.m.scale.x = f.m.scale.z = f.w * (1.1 - 0.2 * k); }
    for (i = 0; i < fireLights.length; i++) fireLights[i].l.intensity = !fireLights[i].on ? 0 : 1.0 + 0.2 * Math.sin(T * 11 + fireLights[i].ph) + 0.12 * Math.sin(T * 27 + fireLights[i].ph);
    if (torchLight.intensity > 0) torchLight.intensity = 0.85 + 0.15 * Math.sin(T * 13);
    for (i = 0; i < waterTex.length; i++) { waterTex[i].offset.x = T * 0.035; waterTex[i].offset.y = Math.sin(T * 0.5 + i) * 0.04; }
    for (i = 0; i < mobParts.length; i++) { var mp = mobParts[i], sq = 1 + 0.07 * Math.sin(T * 2.2 + mp.ph); mp.t.mesh.scale.y = mp.round ? sq : mp.h * sq; mp.t.mesh.position.y = mp.h * sq / 2 + (mp.head ? 0.1 : 0.02); }
    zoom += ((gearOpen ? (tab === 'Face' ? 11 : 3.6) : CAMV.uz) - zoom) * Math.min(1, dt * 8);
    if (gearOpen) { if (autoSpin) spin += dt * 0.7; rig.rotation.y = spin; }
    if (perfN >= 0) { perfT += (now - perfLast); perfLast = now; perfN++; if (perfN === 90) { if (perfT / 90 > 38) { lowPower = true; renderer.shadowMap.enabled = false; sun.castShadow = false; resize(); scene.traverse(function (o) { if (o.material) [].concat(o.material).forEach(function (q) { q.needsUpdate = true; }); }); } perfN = -1; } }
    frameCam();
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  refreshFog(); enterRoom();
  window.__crawl = { CB: CB, aim: { start: aimStart, at: aimAt, S: AIM, range: throwRange, fire: fireSource, stop: aimStop }, hot: { put: hotPut, draw: hotDraw }, minds: { of: mindOf, fac: factionOf, int: intOf, dc: mindDC, canned: mindCanned, reveal: mindReveal, persona: mindPersona, examine: mindExamine, read: mindRead, acts: enemyActs, group: mindGroup, scene: mindScene }, fog: function () { return tileState; }, cam: function () { return cam; }, craft: { harvest: harvest, toggle: craftToggle, S: CRAFT, invent: craftInvent, use: useItem, rollLoot: rollLoot, item: item, ac: pcAC, invAdd: invAdd }, lvl: function () { return LEVEL; }, actsAt: function (k, c) { var p = k.split(","); return actsOf({ c: c || ch(+p[0], +p[1]), key: k, x: +p[0], z: +p[1] }).map(function (a) { return a.label; }); }, useAt: function (k, i) { var p = k.split(","), t = { c: ch(+p[0], +p[1]), key: k, x: +p[0], z: +p[1] }; return safeAct(actsOf(t)[i || 0], t); }, skillCount: skillCount, skillGrant: skillGrant, mapv: function () { return MAPV; }, cb: { CB: CB, PC: PC, die: cbDie, start: cbStart, tap: cbTap, atk: cbAttackButton, end: cbEndTurn, dodge: cbDodge, pot: cbPotion, aggro: cbAggro, shove: cbShove, grapple: cbGrapple, hide: cbHide, disengage: cbDisengage, menu: cbMenuToggle }, talk: function (who) { var e = CB.enemies.filter(function (q) { return q.npc === who || q.name === who; })[0]; if (e) talkOpen(e); return TALK; }, logOut: logOut, toScreen: toScreen, enterRoom: enterRoom, ui: UI, bag: bagToggle, map: mapToggle, invAdd: invAdd, newChar: function () { if (gearOpen) toggleGear(); ccOpen(); }, cc: function () { return CC; }, char: function () { return CHAR; }, net: NET, applyChar: applyChar,  P: P, setSpin: function (a) { autoSpin = false; spin = a; }, spend: spendPoint, redress: redress, grant: grantXP, rebuild: rebuildChunks, PROPS: PROPS, renderer: renderer, scene: scene, joy: joy, jump: jump, toggleGear: toggleGear, look: look, hero: hero, refreshFog: refreshFog, enterRoom: enterRoom, build: buildHero };
  charInit(); cbHUD();
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
