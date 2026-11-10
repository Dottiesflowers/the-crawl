
  // ---------- state ----------
  var P = { x: start.x, z: start.z, px: start.x, pz: start.z, speed: 0 };
  var SIGHTS = [{ name: 'Human eyes', r: 4, dark: false }, { name: 'Torch', r: 6, dark: false }, { name: 'Darkvision', r: 9, dark: true }];
  var sightI = 0, gearOpen = false, zoom = 1, spin = 0;
  hero.position.set(P.px, 0, P.pz);

  function los(x0, z0, x1, z1) {
    var dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0), sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1, e = dx - dz, x = x0, z = z0;
    while (x !== x1 || z !== z1) {
      if ((x !== x0 || z !== z0) && blocksSight(x, z)) return false;
      var e2 = 2 * e; if (e2 > -dz) { e -= dz; x += sx; } if (e2 < dx) { e += dx; z += sz; }
    }
    return true;
  }
  var visNow = {}, tmp = new THREE.Color();
  function refreshFog() {
    var S = SIGHTS[sightI], R = S.r; visNow = {};
    for (var z = P.z - R; z <= P.z + R; z++) for (var x = P.x - R; x <= P.x + R; x++) {
      if (x < 0 || z < 0 || x >= W || z >= H) continue;
      var d = Math.sqrt((x - P.x) * (x - P.x) + (z - P.z) * (z - P.z));
      if (d <= R + 0.4 && los(P.x, P.z, x, z)) { visNow[x + ',' + z] = d; tileState[z * W + x] = 1; }
    }
    var seen = 0, total = 0;
    for (var i = 0; i < W * H; i++) { if (MAP[Math.floor(i / W)].charAt(i % W) !== '#') { total++; if (tileState[i]) seen++; } }
    document.getElementById('explored').textContent = 'Explored ' + Math.round(100 * seen / total) + '%';
    for (var j = 0; j < tiles.length; j++) {
      var t = tiles[j], key = t.x + ',' + t.z, d2 = visNow[key], explored = tileState[t.z * W + t.x];
      var ax = t.x - P.x, az = t.z - P.z, sum = ax + az, dif = Math.abs(ax - az), cut = sum >= 1 && sum <= 8 && dif <= 5;
      if (d2 === undefined) {
        t.mesh.visible = !!explored && !t.mob && !(t.glow && t.hang);
        if (t.mesh.visible) { if (t.glow) t.mesh.material.color.copy(t.base).multiplyScalar(0.3); else t.mesh.material.color.setScalar(0.17); }
      } else {
        t.mesh.visible = true;
        var b = t.glow ? 1 : Math.max(0.4, 1.1 - d2 / (R + 1.5));
        if (t.glow) t.mesh.material.color.copy(t.base);
        else if (S.dark) t.mesh.material.color.setRGB(0.62 * b, 0.78 * b, 1.15 * b);
        else t.mesh.material.color.setScalar(b);
      }
      if (t.hang && cut) t.mesh.visible = false;
      if (t.wall) { var hh = cut ? 0.3 : t.h; t.mesh.scale.y = hh; t.mesh.position.y = hh / 2; }
      if (t.fade) { var hide = sum >= 1 && sum <= 5 && dif <= 1; t.mesh.material.opacity = hide ? 0.22 : 1; t.mesh.material.depthWrite = !hide; t.mesh.castShadow = !hide; }
    }
  }

  // ---------- system voice ----------
  var sysEl = document.getElementById('sys'), sysT = null, seenRooms = {}, lastRoom = '';
  function say(tag, msg, ms) {
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
    var id = roomAt(P.x, P.z); if (id === lastRoom) return; lastRoom = id;
    document.getElementById('region').textContent = ROOMS[id].name;
    if (!seenRooms[id]) { seenRooms[id] = 1; say('Neighborhood discovered: ' + ROOMS[id].name, ROOM_LINES[id]); }
  }

  // ---------- interact: D&D-style options and skill checks ----------
  var MOD = { STR: 0, DEX: 1, CON: 1, INT: 1, WIS: 2, CHA: 1 };
  var done = {}, menuEl = document.getElementById('menu'), menuOpen = false, menuAt = null;
  function stairsHint() {
    var dx = 23 - P.px, dz = 13 - P.pz, sxs = dx - dz, sys = dx + dz, n = Math.round(Math.sqrt(dx * dx + dz * dz));
    var v = sys > 2 ? 'down' : (sys < -2 ? 'up' : ''), h = sxs > 2 ? 'right' : (sxs < -2 ? 'left' : '');
    return n < 2 ? 'You are standing next to it.' : 'The stairwell is ' + n + ' tiles away, toward the ' + ((v + ' ' + h).trim() || 'middle') + ' of your screen.';
  }
  var NAMES = { C: 'Loot box (Bronze)', M: 'Cellar Grub, level 1', B: 'Brazier', P: 'Pillar', S: 'Stairwell', D: 'Doorway', K: 'Crate', R: 'Barrel', '#': 'Wall', area: 'Your surroundings' };
  var ACTS = {
    C: [
      { label: 'Examine', text: 'A bronze loot box. Sealed. You are being filmed looking at it.' },
      { label: 'Investigate for traps', stat: 'INT', dc: 10, win: 'No traps. The lock is cheap and the hinges are worse.', lose: 'It looks like a box. You learn nothing else.' },
      { label: 'Pick the lock', stat: 'DEX', dc: 13, flag: 'open', win: 'Click. Inside: one slightly used torch and a coupon the System will not honor.', lose: 'The lock holds. The audience giggles.' },
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
      { label: 'Search for a hidden door', stat: 'INT', dc: 15, win: 'A hairline seam. Not a door yet, but the builders left room for one.', lose: 'Solid.' }
    ],
    area: [
      { label: 'Search the area', stat: 'WIS', dc: 12, win: 'Scuffed footprints, not yours, heading for the stairwell.', lose: 'Nothing catches your eye.' },
      { label: 'Sense the stairwell (Living Map)', auto: 'map' },
      { label: 'Play your bass', stat: 'CHA', skill: ['Performance', 3], dc: 10, win: 'The room has decent acoustics. An unseen viewer sends a tip you cannot spend.', lose: 'You are out of tune. The System lets everyone know.' },
      { label: 'Take a short rest', rest: true, text: 'You sit for a minute and patch yourself up. HP restored. Nothing attacks you. Enjoy it while it lasts.' }
    ]
  };
  function findTarget() {
    var fx = Math.sin(hero.rotation.y), fz = Math.cos(hero.rotation.y);
    var ax = Math.round(P.px + fx * 0.85), az = Math.round(P.pz + fz * 0.85), c = ch(ax, az);
    var ne = null; CB.enemies.forEach(function (q) { if (!q.dead && cheb(q.x, q.z, P.x, P.z) <= 1 && (!ne || (q.x === ax && q.z === az))) ne = q; });
    if (ne && visNow[ne.x + ',' + ne.z] !== undefined) return { c: 'E', e: ne, key: 'e' + CB.enemies.indexOf(ne), x: ne.x, z: ne.z };
    if (visNow[ax + ',' + az] !== undefined && ACTS[c]) return { c: c, key: ax + ',' + az, x: ax, z: az };
    if (ch(P.x, P.z) === 'D') return { c: 'D', key: P.x + ',' + P.z, x: P.x, z: P.z };
    return { c: 'area', key: 'area' };
  }
  function closeMenu() { menuOpen = false; menuEl.classList.remove('on'); document.getElementById('aInteract').classList.remove('held'); }
  function openMenu() {
    if (gearOpen) return; if (CB.on) { say('In combat', 'Tap an enemy to attack it, or use the combat buttons.', 2600); return; } if (menuOpen) { closeMenu(); return; }
    var t = findTarget(); menuAt = { x: P.px, z: P.pz }; sysEl.classList.remove('on');
    menuEl.innerHTML = ''; var hd = document.createElement('div'); hd.className = 'mh'; hd.textContent = t.e ? t.e.npc ? t.e.name + ' · ' + 'production crew' : t.e.name + ' · HP ' + t.e.hp + '/' + t.e.max + (t.e.calm ? ' · friendly' : '') : NAMES[t.c]; menuEl.appendChild(hd);
    (t.e ? enemyActs(t.e) : ACTS[t.c]).forEach(function (a, i) {
      var b = document.createElement('button'); b.type = 'button';
      var spent = a.flag && done[t.key + a.flag];
      var bonus = a.stat ? chkBonus(a) : 0;
      b.innerHTML = '<span>' + (i + 1) + '. ' + a.label + '</span>' + (spent ? '<i>done</i>' : (a.stat ? '<i>' + a.stat + (a.skill ? ' + ' + a.skill[0] : '') + ' +' + bonus + '</i>' : ''));
      if (spent) b.disabled = true;
      b.onclick = function () { act(t, a); };
      menuEl.appendChild(b);
    });
    menuOpen = true; menuEl.classList.add('on'); document.getElementById('aInteract').classList.add('held');
  }
  function act(t, a) {
    closeMenu();
    kitOneShot(a.stat ? 'Interact' : 'PickUp_Table');
    if (a.auto === 'map') { say('Living Map', stairsHint()); return; }
    if (a.talk) { talkOpen(t.e); return; }
    if (a.fight) { say('Attack', t.e.calm ? 'You swing at a friend. It is no longer a friend.' : 'You strike first.', 2200); t.e.calm = false; cbStart(t.e.calm ? '' : 'You started it.', t.e); return; }
    if (a.rest) { PC.hp = PC.max; cbHUD(); }
    if (a.auto === 'torch') { sightI = 1; document.getElementById('sight').textContent = 'Sight: Torch'; look.off = [2, look.off[1]]; buildHero(); saveLook(); refreshFog(); say(a.label, a.text); return; }
    if (!a.stat) { say(a.label, a.text); return; }
    var roll = 1 + Math.floor(Math.random() * 20), bonus = chkBonus(a), total = roll + bonus;
    var ok = roll === 20 || (roll !== 1 && total >= a.dc);
    var line = 'd20 ' + roll + ' + ' + bonus + ' = ' + total + ' vs DC ' + a.dc + (roll === 20 ? ' · natural 20' : (roll === 1 ? ' · natural 1' : ''));
    say((ok ? 'Success' : 'Failure') + ' · ' + a.label + ' · ' + line, ok ? a.win : a.lose, 6500);
    if (ok && a.flag) {
      done[t.key + a.flag] = true;
      if (a.flag === 'calm' && t.e) { t.e.calm = true; cbHUD(); }
      if (a.flag === 'calm') { tiles.forEach(function (q) { if (q.mob && q.glow && q.x === t.x && q.z === t.z) q.base.set(0x40ff70); }); refreshFog(); }
      if (a.flag === 'open') tiles.forEach(function (q) { if (q.x === t.x && q.z === t.z && q.lid) { q.mesh.position.y += 0.2; q.mesh.position.z -= 0.2; } });
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
    var sx = joy.x, sy = joy.y;
    if (keys.L) sx -= 1; if (keys.R) sx += 1; if (keys.U) sy -= 1; if (keys.D) sy += 1;
    var m = Math.sqrt(sx * sx + sy * sy);
    if (gearOpen || m < 0.15) { P.speed = 0; return; }
    if (menuOpen && Math.abs(P.px - menuAt.x) + Math.abs(P.pz - menuAt.z) > 0.4) closeMenu();
    if (m > 1) { sx /= m; sy /= m; m = 1; }
    var wx = (sx + sy) * 0.7071, wz = (sy - sx) * 0.7071; // screen direction to floor direction
    var top = crouch ? 1.5 : 3.3; P.speed = top * m;
    var nx = P.px + wx * top * dt, nz = P.pz + wz * top * dt, ox = P.px, oz = P.pz;
    if (!solidNear(nx, P.pz)) P.px = nx;
    if (!solidNear(P.px, nz)) P.pz = nz;
    walked += Math.abs(P.px - ox) + Math.abs(P.pz - oz);
    var want = Math.atan2(wx, wz), d = want - hero.rotation.y;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    hero.rotation.y += d * Math.min(1, dt * 14);
    var tx = Math.round(P.px), tz = Math.round(P.pz);
    if (tx !== P.x || tz !== P.z) { P.x = tx; P.z = tz; refreshFog(); enterRoom(); cbAggro(); }
    if (!achieved && walked > 3) { achieved = true; say('New achievement: Bipedal', 'You walked three whole tiles. Reward: nothing. The bar will be raised.'); }
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
  function cycleSight() {
    if (gearOpen) return;
    sightI = (sightI + 1) % SIGHTS.length; var S = SIGHTS[sightI];
    document.getElementById('sight').textContent = 'Sight: ' + S.name; refreshFog();
    say('Sight: ' + S.name, S.dark ? 'You see ' + S.r + ' tiles in the dark, in shades of blue. Your friends see less. Tell them what is out there.' : 'You see ' + S.r + ' tiles before the dark takes over.', 3200);
  }
  tap('aInteract', openMenu); tap('aJump', jump); tap('aCrouch', toggleCrouch); tap('aSight', cycleSight);
  var KEYS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
  window.addEventListener('keydown', function (e) {
    if (TALK.open || CC || AUTH.open) return;
    if (CB.on && !gearOpen) { var ck = cbMenuOpen() && e.key >= '1' && e.key <= '9' ? function () { cbMenuPick(+e.key); } : { '1': function () { cbAttackButton(false); }, '2': function () { cbMenuToggle('acts'); }, '3': function () { cbMenuToggle('bonus'); }, e: cbEndTurn, Enter: cbEndTurn, Escape: cbMenuClose }[e.key]; if (ck) { e.preventDefault(); ck(); } if (KEYS[e.key] || e.key === ' ') e.preventDefault(); return; }
    if (KEYS[e.key]) { e.preventDefault(); keys[KEYS[e.key]] = true; }
    else if (e.key === ' ') { e.preventDefault(); jump(); }
    else if (e.repeat) return;
    else if (e.key === 'e' || e.key === 'Enter') openMenu();
    else if (menuOpen && e.key >= '1' && e.key <= '9') { var mb = menuEl.querySelectorAll('button')[Number(e.key) - 1]; if (mb && !mb.disabled) mb.click(); }
    else if (e.key === 'Escape') closeMenu();
    else if (e.key === 'c') toggleCrouch();
    else if (e.key === 'v') cycleSight();
    else if (e.key === 'g') toggleGear();
  });
  window.addEventListener('keyup', function (e) { if (KEYS[e.key]) keys[KEYS[e.key]] = false; });
  window.addEventListener('blur', function () { keys = {}; });

  // ---------- character builder ----------
  var rowsEl = document.getElementById('rows'), tabsEl = document.getElementById('tabs'), tab = 'Body', autoSpin = true;
  var TABS = ['Body', 'Face', 'Clothes', 'Gear', 'Sheet'];
  function saveLook() { try { localStorage.setItem('crawl-look7', JSON.stringify(look)); } catch (e) {} saveLookRemote(); }
  function drawTabs() {
    tabsEl.innerHTML = '';
    TABS.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = t; if (t === tab) b.className = 'on';
      b.onclick = function () { tab = t; if (t === 'Face') { autoSpin = false; spin = Math.PI / 4 - hero.rotation.y; } drawTabs(); drawRows(); }; tabsEl.appendChild(b);
    });
  }
  function drawRows() {
    rowsEl.innerHTML = '';
    if (tab === 'Sheet') { rowsEl.innerHTML = sheetHTML(); sheetAfter(); return; }
    SLOTS.filter(function (s) { return s.tab === tab && !(s.hand && kitMode()) && !(s.kit && !kitMode()); }).forEach(function (s) {
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
      if (s.colors && !noCol) { sw.style.background = hexs(s.kitColors ? KIT_SW[kitOutfitOf(s.styles[look[s.key][0]])][look[s.key][1] % 5] : s.colors[look[s.key][1] % s.colors.length]); sw.onclick = function () { look[s.key][1] = (look[s.key][1] + 1) % s.colors.length; finish(); }; }
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
    var w = window.innerWidth, h = window.innerHeight, a = w / h, face = gearOpen && tab === 'Face';
    var halfH = (a >= 1 ? 4.1 : 3.8 / a) / zoom, halfW = halfH * a;
    cam.left = -halfW; cam.right = halfW; cam.top = halfH; cam.bottom = -halfH; cam.updateProjectionMatrix();
    var shift = gearOpen ? -halfW * 0.3 : 0; // slide the hero clear of the builder panel
    var tx = hero.position.x + shift * 0.7071, tz = hero.position.z - shift * 0.7071, ty = gearOpen ? (face ? (1.02 + LIFT) * rig.scale.y : 0.72) : 0.45;
    camY += ((face ? 3.5 : 12) - camY) * 0.15;
    cam.position.set(tx + 12, ty + camY, tz + 12); cam.lookAt(tx, ty, tz);
    sun.position.set(hero.position.x - 5, 11, hero.position.z + 4); sun.target.position.copy(hero.position);
  }
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
    for (i = 0; i < fireLights.length; i++) fireLights[i].l.intensity = 1.0 + 0.2 * Math.sin(T * 11 + fireLights[i].ph) + 0.12 * Math.sin(T * 27 + fireLights[i].ph);
    if (torchLight.intensity > 0) torchLight.intensity = 0.85 + 0.15 * Math.sin(T * 13);
    for (i = 0; i < waterTex.length; i++) { waterTex[i].offset.x = T * 0.035; waterTex[i].offset.y = Math.sin(T * 0.5 + i) * 0.04; }
    for (i = 0; i < mobParts.length; i++) { var mp = mobParts[i], sq = 1 + 0.07 * Math.sin(T * 2.2 + mp.ph); mp.t.mesh.scale.y = mp.round ? sq : mp.h * sq; mp.t.mesh.position.y = mp.h * sq / 2 + (mp.head ? 0.1 : 0.02); }
    zoom += ((gearOpen ? (tab === 'Face' ? 11 : 3.6) : 1) - zoom) * Math.min(1, dt * 8);
    if (gearOpen) { if (autoSpin) spin += dt * 0.7; rig.rotation.y = spin; }
    if (perfN >= 0) { perfT += (now - perfLast); perfLast = now; perfN++; if (perfN === 90) { if (perfT / 90 > 38) { lowPower = true; renderer.shadowMap.enabled = false; sun.castShadow = false; resize(); scene.traverse(function (o) { if (o.material) [].concat(o.material).forEach(function (q) { q.needsUpdate = true; }); }); } perfN = -1; } }
    frameCam();
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  refreshFog(); enterRoom();
  window.__crawl = { cb: { CB: CB, PC: PC, start: cbStart, tap: cbTap, atk: cbAttackButton, end: cbEndTurn, dodge: cbDodge, pot: cbPotion, aggro: cbAggro, shove: cbShove, grapple: cbGrapple, hide: cbHide, disengage: cbDisengage, menu: cbMenuToggle }, talk: function (who) { var e = CB.enemies.filter(function (q) { return q.npc === who || q.name === who; })[0]; if (e) talkOpen(e); return TALK; }, logOut: logOut, newChar: function () { if (gearOpen) toggleGear(); ccOpen(); }, cc: function () { return CC; }, char: function () { return CHAR; }, net: NET, applyChar: applyChar,  P: P, joy: joy, jump: jump, toggleGear: toggleGear, look: look, hero: hero, refreshFog: refreshFog, enterRoom: enterRoom, build: buildHero };
  charInit(); cbHUD();
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
