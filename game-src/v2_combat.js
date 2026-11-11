
  // ===================== combat: turn-based, Baldur's Gate 3 style =====================
  // Initiative order; on your turn you get movement (6 tiles = 30 ft), one action and one bonus action.
  // Monsters: Quaternius "Bestiary: Dungeon Monsters" (CC0), animated with the same animation library as the hero.
  var CB = { on: false, enemies: [], order: [], idx: -1, busy: false, path: null, potions: 3, dodge: false, res: { move: 0, action: 0, bonus: 0 }, defs: {}, ready: false };
  var PC = { hp: 11, max: 11 };
  var BEAST = {
    puglin: { name: 'Puglin', file: 'm_puglin', tex: 'puglin', ac: 10, hp: 6, speed: 5, atk: 2, dmg: [1, 4, 0], weapon: 'club', init: 1, str: 0, dex: 1, pp: 10, xp: 25, scale: 0.72, h: 0.62, attackClip: 'Sword_Attack',
      lines: ['Puglins hunt in pairs and argue in threes.', 'A pig-faced goblin with a stick and something to prove.'] },
    imp: { name: 'Imp, stairwell guard', file: 'm_imp', tex: 'imp', ac: 12, hp: 13, speed: 6, atk: 3, dmg: [1, 6, 0], weapon: 'spiked mace', init: 2, str: 2, dex: 2, pp: 11, xp: 100, scale: 0.72, h: 1.15, attackClip: 'Sword_Attack',
      lines: ['Hired muscle for the stairwell. Union rules: it does not leave its post until something walks past it.'] }
  };
  // monster families: tiers share a model and get bigger, tougher and nastier. base: which loaded model to use
  function variant(base, o) { var v = {}; for (var k in BEAST[base]) v[k] = BEAST[base][k]; for (k in o) v[k] = o[k]; v.base = base; return v; }
  BEAST.puglin.base = 'puglin'; BEAST.imp.base = 'imp'; BEAST.imp.name = 'Imp security guard';
  BEAST.puglin_brute = variant('puglin', { name: 'Puglin brute', ac: 11, hp: 11, atk: 3, dmg: [1, 6, 0], str: 2, xp: 50, scale: 0.86, h: 0.74, tint: 0xd8b0a0, lines: ['Bigger, meaner, and it brought a bigger stick.'] });
  BEAST.puglin_chief = variant('puglin', { name: 'Puglin war-chief', ac: 12, hp: 18, atk: 4, dmg: [1, 6, 2], str: 3, dex: 1, xp: 120, scale: 1.0, h: 0.86, tint: 0xc08070, lines: ['Wears a bottle cap as a crown. Will fight you over it.'] });
  BEAST.grik = variant('puglin', { name: 'Grik, the Gristle King', ac: 14, hp: 48, atk: 6, dmg: [2, 6, 3], str: 4, dex: 1, init: 1, pp: 13, xp: 500, scale: 1.45, h: 1.25, tint: 0xb06050, boss: true, lines: ['The king of the Warrens. Fat on snacks, mean on principle. His minions scatter if he falls.'] });
  BEAST.imp_intern = variant('imp', { name: 'Imp intern', ac: 10, hp: 7, atk: 2, dmg: [1, 4, 0], str: 0, xp: 40, scale: 0.56, h: 0.9, tint: 0xd0c0ff, lines: ['Unpaid. Furious about it.'] });
  BEAST.imp_foreman = variant('imp', { name: 'Imp foreman', ac: 13, hp: 22, atk: 4, dmg: [1, 8, 1], str: 3, xp: 150, scale: 0.86, h: 1.35, tint: 0xffa080, lines: ['Clipboard in one hand, mace in the other. Both are for you.'] });
  BEAST.steward = variant('imp', { name: 'The Shop Steward', ac: 15, hp: 58, atk: 6, dmg: [2, 6, 4], str: 4, dex: 2, init: 3, pp: 14, xp: 600, scale: 1.15, h: 1.8, tint: 0xff6a5a, boss: true, lines: ['Head of the imp union. Has never lost a negotiation or a fistfight. Will not cross a picket line.'] });
  // placeholder families until their own models are imported: bog puglins in the Gardens, archive clerks (imps) in the Archive
  BEAST.bog = variant('puglin', { name: 'Bog puglin', hp: 7, atk: 2, dmg: [1, 4, 0], xp: 30, tint: 0x8ab070, lines: ['A puglin that went feral in the reeds. Smells like a pond with opinions.'] });
  BEAST.bog_brute = variant('puglin', { name: 'Reed stalker', ac: 12, hp: 12, atk: 3, dmg: [1, 6, 1], dex: 2, str: 1, xp: 60, scale: 0.86, h: 0.74, tint: 0x6a9a5a, lines: ['Moves through the reeds without a sound. You will hear it when it wants you to.'] });
  BEAST.bog_chief = variant('puglin', { name: 'Marsh warden', ac: 12, hp: 20, atk: 4, dmg: [1, 8, 1], str: 3, dex: 1, xp: 130, scale: 1.0, h: 0.86, tint: 0x5a8a4a, lines: ['Wears a crown of lily pads. It is not a joke to them.'] });
  BEAST.gardener = variant('puglin', { name: 'The Gardener', ac: 14, hp: 52, atk: 6, dmg: [2, 6, 3], str: 4, dex: 1, init: 1, pp: 13, xp: 550, scale: 1.5, h: 1.3, tint: 0x4a7a3a, boss: true, lines: ['Boss of the Drowned Gardens. It has been composting crawlers, and it is very proud of the results.'] });
  BEAST.clerk = variant('imp', { name: 'Archive clerk', ac: 10, hp: 8, atk: 2, dmg: [1, 4, 0], str: 0, xp: 40, scale: 0.6, h: 0.95, tint: 0x9ab8e0, lines: ['A soggy imp with a stamp. It will file you under deceased.'] });
  BEAST.clerk_mid = variant('imp', { name: 'Records keeper', ac: 12, hp: 14, atk: 3, dmg: [1, 6, 1], str: 1, dex: 2, xp: 90, scale: 0.72, h: 1.15, tint: 0x7a9ad0, lines: ['Knows where every file is and resents everyone who asks.'] });
  BEAST.clerk_head = variant('imp', { name: 'Senior archivist', ac: 13, hp: 22, atk: 4, dmg: [1, 8, 1], str: 3, xp: 150, scale: 0.86, h: 1.35, tint: 0x5a7ac0, lines: ['Shushes you before it hits you. Both hurt.'] });
  BEAST.archivist = variant('imp', { name: 'The Head Archivist', ac: 15, hp: 56, atk: 6, dmg: [2, 6, 4], str: 4, dex: 2, init: 3, pp: 14, xp: 600, scale: 1.15, h: 1.8, tint: 0x4a6ab8, boss: true, lines: ['Boss of the Flooded Archive. It has a file on you, and the file is very thin.'] });
  // stand-ins for the Arena headliner (the ogre bugbear) and the Stairwell Gate's final boss (the dragon) until those models are in
  BEAST.headliner = variant('puglin', { name: 'The Headliner', ac: 15, hp: 70, atk: 7, dmg: [2, 8, 4], str: 5, dex: 0, init: 0, pp: 12, xp: 800, scale: 1.8, h: 1.6, tint: 0x9a6a4a, boss: true, lines: ['The Arena\'s main event. The crowd chants its name. It does not know yours yet.'] });
  BEAST.gatekeeper = variant('imp', { name: 'The Gatekeeper', ac: 16, hp: 90, atk: 7, dmg: [2, 10, 4], str: 5, dex: 2, init: 3, pp: 15, xp: 1200, scale: 1.4, h: 2.2, tint: 0xff4a3a, boss: true, lines: ['Guardian of the stairs down. It has read your file and it is not impressed.'] });
  // shrubs: tiny, easy to kill, nearly worthless... and they eat the dead. Every body they eat makes them bigger and nastier.
  var SHRUB = { base: 'shrub', prop: 'Bush_Common', tex: 'puglin', init: 0, pp: 9, attackClip: 'Sword_Attack', weapon: 'thorny twigs', str: 0, dex: 0 };
  function shrubDef(o) { var v = {}; for (var k in SHRUB) v[k] = SHRUB[k]; for (k in o) v[k] = o[k]; return v; }
  BEAST.shrub1 = shrubDef({ lvl: 1, name: 'Mulch shrub', ac: 8, hp: 3, speed: 4, atk: 1, dmg: [1, 2, 0], xp: 5, scale: 0.22, h: 0.42, timid: true, lines: ['A little shrub with a mouth. It cleans up after fights. Squash it now and it is worth almost nothing; leave it alone and it grows.'] });
  BEAST.shrub2 = shrubDef({ lvl: 2, name: 'Hungry shrub', ac: 10, hp: 9, speed: 4, atk: 3, dmg: [1, 4, 1], xp: 20, scale: 0.34, h: 0.6, timid: true, prop: 'Bush_Common_Flowers', lines: ['It has eaten something recently. It has opinions now, and roots like fingers.'] });
  BEAST.shrub3 = shrubDef({ lvl: 3, name: 'Bramble glutton', ac: 12, hp: 18, speed: 5, atk: 4, dmg: [1, 6, 2], str: 1, xp: 60, scale: 0.52, h: 0.9, prop: 'Bush_Common_Flowers', weapon: 'thorn lash', lines: ['A shrub the size of a dog that has eaten several crawlers\' worth of leftovers. It hunts now.'] });
  BEAST.shrub4 = shrubDef({ lvl: 4, name: 'Thornmaw', ac: 14, hp: 34, speed: 5, atk: 6, dmg: [2, 6, 3], str: 3, xp: 180, scale: 0.78, h: 1.3, prop: 'Bush_Common_Flowers', weapon: 'crushing roots', lines: ['Somebody should have stepped on this when it was small. Nobody did.'] });
  var TIER = { puglin: [null, 'puglin', 'puglin_brute', 'puglin_chief'], imp: [null, 'imp_intern', 'imp', 'imp_foreman'], bog: [null, 'bog', 'bog_brute', 'bog_chief'], clerk: [null, 'clerk', 'clerk_mid', 'clerk_head'] };
  var SPAWNS = LEVEL.spawns.map(function (sp) { var o = {}; for (var k in sp) o[k] = sp[k]; o.kind = sp.npc ? 'imp' : (sp.sub || (sp.tier ? TIER[sp.kind][sp.tier] : sp.kind)); return o; });
  function inSafeRoom(x, z) { var r = roomInfo(x, z); return !!r && r.type === 'safe' && LEVEL.reg[z] && LEVEL.reg[z][x] >= 0; }

  function d(n, s) { var t = 0; for (var i = 0; i < n; i++) t += 1 + Math.floor(Math.random() * s); return t; }
  function d20() { return 1 + Math.floor(Math.random() * 20); }
  function roll20(adv, dis) { // 5e: advantage and disadvantage cancel out
    var a = d20(), b = d20(), mode = adv && !dis ? 'adv' : dis && !adv ? 'dis' : '';
    var r = mode === 'adv' ? Math.max(a, b) : mode === 'dis' ? Math.min(a, b) : a;
    return { r: r, txt: mode ? (mode === 'adv' ? 'advantage ' : 'disadvantage ') + a + '/' + b + ' → ' + r : 'd20 ' + r };
  }
  function hasCover(ax, az, bx, bz) { // half cover (+2 AC) when a pillar or big prop sits on the line
    var dx = Math.abs(bx - ax), dz = Math.abs(bz - az), sx = ax < bx ? 1 : -1, sz = az < bz ? 1 : -1, e = dx - dz, x = ax, z = az;
    while (x !== bx || z !== bz) { var e2 = 2 * e; if (e2 > -dz) { e -= dz; x += sx; } if (e2 < dx) { e += dx; z += sz; } if (x === bx && z === bz) break; if (ch(x, z) === 'P' || PROPBLOCK[x + ',' + z]) return true; }
    return false;
  }
  // DCC rule: violence in a safe room gets you teleported out and put in a timeout
  function safeRoomPenalty() {
    var r = roomInfo(P.x, P.z), best = null;
    for (var dz = -12; dz <= 12; dz++) for (var dx = -12; dx <= 12; dx++) { var x = P.x + dx, z = P.z + dz; if (!r || !walkable(x, z, 'pc') || inSafeRoom(x, z)) continue; var dd = Math.abs(dx) + Math.abs(dz); if (!best || dd < best[2]) best = [x, z, dd]; }
    say('SAFE ROOM VIOLATION', 'Aggression is not permitted in a safe room. You have been relocated and placed in a timeout. The audience boos.', 6000);
    if (best) { P.x = best[0]; P.z = best[1]; P.px = best[0]; P.pz = best[1]; refreshFog(); enterRoom(); }
    PC.timeout = performance.now() + 15000;
  }
  // D&D style: you never see exact hit points, just how hurt it looks
  function healthState(e) {
    var r = e.hp / e.max; if (e.dead || r <= 0) return ['Dead', '#666'];
    return r >= 0.99 ? ['Unhurt', '#3fd46a'] : r >= 0.6 ? ['Scratched', '#8ad43f'] : r >= 0.3 ? ['Wounded', '#e8c23a'] : ['Badly hurt', '#e8453a'];
  }
  function examineText(e) {
    if (e.npc) return 'A small imp in a lanyard that says PRODUCTION. Clipboard, headset, nervous smile.';
    return e.def.lines[0] + ' It looks ' + healthState(e)[0].toLowerCase() + (e.calm ? ' and has no interest in fighting you.' : '.') + (e.boss ? ' This is a neighborhood boss.' : '');
  }
  function cheb(ax, az, bx, bz) { return Math.max(Math.abs(ax - bx), Math.abs(az - bz)); }

  // ---------- the hero's numbers come from the gear ----------
  function pcAC() {
    var ac = 10 + MOD.DEX, why = 'no armor';
    if (KIT && KIT.on) {
      var top = SLOT.kTop.styles[sty('kTop')];
      if (top === 'Knight plate') { ac = 16; why = 'plate'; } else if (top === 'Noble') { ac = 13 + Math.min(2, MOD.DEX); why = 'brigandine'; }
      else if (top === 'Ranger' || top === 'Knight tunic') { ac = 12 + MOD.DEX; why = top === 'Ranger' ? 'studded leather' : 'padded tunic'; }
      else if (top === 'Peasant') { ac = 11 + MOD.DEX; why = 'thick cloth'; }
      if (/helm/.test(SLOT.kHead.styles[sty('kHead')])) { ac += 1; why += ', helm'; }
    } else { var o = sty('outer'); if (o === 2) { ac = 16; why = 'plate'; } else if (o === 5) { ac = 12 + MOD.DEX; why = 'leather'; } else if (o === 1 || o === 4) { ac = 11 + MOD.DEX; why = 'coat'; } }
    if (sty('off') === 1) { ac += 2; why += ', shield'; }
    return { ac: ac, why: why };
  }
  function pcWeapon() {
    var gw = gearWeapon(); if (gw) return gw;
    var m = sty('main');
    var W = [{ name: 'fists', n: 1, s: 1, b: 1 + MOD.STR, stat: 'STR', clip: 'Punch_Jab' }, { name: 'sword', n: 1, s: 8, stat: 'STR', clip: 'Sword_Attack' }, { name: 'axe', n: 1, s: 8, stat: 'STR', clip: 'Sword_Attack' },
      { name: 'staff', n: 1, s: 6, stat: 'STR', clip: 'Sword_Attack' }, { name: 'club', n: 1, s: 4, stat: 'STR', clip: 'Sword_Attack' }, { name: 'bass guitar', n: 1, s: 6, stat: 'CHA', clip: 'Sword_Attack', note: 'The crowd loves it, so it hits with Charisma.' }][m];
    if (!m && sty('off') === 3) W = { name: 'dagger', n: 1, s: 4, stat: MOD.DEX > MOD.STR ? 'DEX' : 'STR', clip: 'Punch_Jab' };
    W.hit = PROF() + MOD[W.stat]; W.dmgB = W.b !== undefined ? W.b : MOD[W.stat]; return W;
  }

  // ---------- monsters ----------
  function cbLoad() {
    if (CB.loading) return; CB.loading = true;
    var L = new THREE.GLTFLoader(), left = 2;
    ['puglin', 'imp'].forEach(function (k) {
      fetch(KDIR + BEAST[k].file + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
        var bin = atob(j.glb), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        L.parse(u.buffer, KDIR, function (g) { CB.defs[k] = g.scene; if (--left === 0) cbSpawn(); }, function (e) { console.warn('monster failed', k, e); });
      }).catch(function (e) { console.warn('monster failed', k, e); });
    });
  }
  function cbClipsFor(root) {
    var names = {}; root.traverse(function (o) { if (o.isBone) names[o.name] = 1; });
    var out = {};
    ['Idle_Loop', 'Walk_Loop', 'Sword_Attack', 'Punch_Jab', 'Hit_Chest', 'Death01'].forEach(function (c) {
      var clip = KIT.clips && KIT.clips[c]; if (!clip) return;
      out[c] = new THREE.AnimationClip(c, clip.duration, clip.tracks.filter(function (t) { var p = t.name.split('.'); return names[p[0]] && p[1] === 'quaternion'; }));
    });
    return out;
  }
  function cbSpawn() {
    // the block-built grub retires; real monsters move in
    for (var i = tiles.length - 1; i >= 0; i--) if (tiles[i].mob) { scene.remove(tiles[i].mesh); tiles.splice(i, 1); }
    mobParts.length = 0; SOLID.M = 0;
    SPAWNS.forEach(function (sp, n) {
      var B = BEAST[sp.kind], holder = new THREE.Group(); holder.visible = false; scene.add(holder);
      var e = { kind: sp.kind, def: B, name: sp.name || B.name, x: sp.x, z: sp.z, sx: sp.x, sz: sp.z, px: sp.x, pz: sp.z, hp: B.hp, max: B.hp, dead: false, calm: !!sp.npc, npc: sp.npc || null, guard: !!sp.guard,
        obj: holder, mixer: null, clips: {}, sp: sp, n: n, path: null, act: null, cur: '' };
      holder.position.set(sp.x, 0, sp.z); holder.rotation.y = Math.PI * 0.75;
      e.bar = document.createElement('div'); e.bar.className = 'ebar'; e.bar.innerHTML = '<i></i><span></span>'; document.body.appendChild(e.bar);
      if (sp.npc) { e.name = 'Pip'; holder.rotation.y = -Math.PI * 0.6; }
      e.room = sp.room; e.boss = !!B.boss;
      CB.enemies.push(e); cbPlay(e, 'Idle_Loop');
    });
    CB.ready = true; refreshFog(); worldLoad();
  }
  // monsters only get a real model (skinned mesh, materials, animations) once a crawler comes near them
  function cbMaterialize(e) {
    if (e.mixer) return; var B = e.def, sp = e.sp;
    if (B.prop) { // a plant: no skeleton, it bobs and lunges in code
      if (!propsOn()) return; var g2 = new THREE.Group(); propInto(g2, B.prop, { s: B.scale }); e.obj.add(g2); e.body = g2;
      g2.traverse(function (o) { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(e.lvl >= 3 ? 0xb0c890 : 0xffffff); } });
      e.mixer = { update: function () {} }; e.clips = {}; return;
    }
    var root = THREE.SkeletonUtils.clone(CB.defs[B.base || sp.kind]);
    root.traverse(function (o) {
      if (!o.isMesh) return;
      var m = kitMat(B.tex + '_' + (e.n % 3) + '.jpg', B.tex + '_n.jpg', B.tex + '_orm.jpg');
      m.emissiveMap = kitTex(B.tex + '_e.jpg'); m.emissive = new THREE.Color(0xffffff); m.skinning = !!o.isSkinnedMesh;
      if (B.tint) m.color.set(B.tint).multiplyScalar(1.25); o.material = m; o.castShadow = true; o.frustumCulled = false;
    });
    if (sp.npc) root.traverse(function (o) { if (/Mace|Chains|SpikedCollar/.test(o.name)) o.visible = false; });
    root.scale.setScalar(B.scale * (sp.npc ? 0.62 : 1)); e.obj.add(root);
    e.mixer = new THREE.AnimationMixer(root); e.clips = cbClipsFor(root); var want = e.want || (e.dead ? 'Death01' : 'Idle_Loop'); e.cur = ''; cbPlay(e, want, e.dead);
    if (e.dead && e.act) { e.act.time = e.clips.Death01 ? e.clips.Death01.duration : 0; }
  }
  // ---------- the world remembers: who is dead stays dead; each zone has a few replacements, then it is cleared ----------
  // Saved per crawler for now (party play will make this one shared world). Bosses never come back.
  var WORLD = { key: '', reserve: null, loaded: false };
  function worldKey() { return 'crawl-world-v1-' + (NET.mode === 'server' ? NET.uid : 'local') + '-' + (CHAR ? CHAR.name : '') + '-' + SPAWNS.length; }
  function zoneOf(e) { var r = LEVEL.rooms[e.room]; return r && r.hood !== undefined ? r.hood : 'free'; }
  function worldState() {
    var dead = [], eaten = [], calm = [], hp = {};
    CB.enemies.forEach(function (e) { if (e.npc) return; if (e.dead) (e.eaten ? eaten : dead).push(e.n); else { if (e.calm) calm.push(e.n); if (e.hp < e.max) hp[e.n] = e.hp; } });
    return { dead: dead, eaten: eaten, calm: calm, hp: hp, reserve: WORLD.reserve, shrubs: CB.enemies.filter(function (e) { return e.def.base === 'shrub' && !e.dead && e.def.lvl > 1; }).map(function (e) { return [e.n, e.def.lvl]; }), at: Date.now() };
  }
  function worldSave() {
    if (!CB.ready || !WORLD.loaded) return; var st = worldState();
    try { localStorage.setItem(worldKey(), JSON.stringify(st)); } catch (x) {}
    if (NET.mode === 'server' && NET.uid) { clearTimeout(worldSave.t); worldSave.t = setTimeout(function () { api('kv/world', { method: 'PUT', body: { value: st } }).catch(function () {}); }, 2000); }
  }
  function worldApply(st) {
    var byN = {}; CB.enemies.forEach(function (e) { byN[e.n] = e; });
    (st.dead || []).concat(st.eaten || []).forEach(function (n) { var e = byN[n]; if (!e) return; e.dead = true; e.eaten = true; e.counted = true; e.hp = 0; e.obj.visible = false; }); // bodies from earlier sessions are gone
    (st.calm || []).forEach(function (n) { if (byN[n]) byN[n].calm = true; });
    Object.keys(st.hp || {}).forEach(function (n) { if (byN[n] && !byN[n].dead) byN[n].hp = Math.max(1, st.hp[n]); });
    (st.shrubs || []).forEach(function (s) { var e = byN[s[0]]; if (e && !e.dead) { e.def = BEAST['shrub' + s[1]]; e.kind = 'shrub' + s[1]; e.lvl = s[1]; e.name = e.def.name; e.max = e.def.hp; e.hp = Math.min(e.hp, e.max); } });
    if (st.reserve) WORLD.reserve = st.reserve;
  }
  function worldLoad() {
    if (!CB.ready || !CHAR) return; var k = worldKey(); if (WORLD.key === k) return; WORLD.key = k; WORLD.loaded = false;
    // replacements per zone: about a third of its regular monsters, never bosses
    var res = {}; CB.enemies.forEach(function (e) { if (e.npc || e.boss || e.guard) return; var z = zoneOf(e); res[z] = (res[z] || 0) + 1; }); Object.keys(res).forEach(function (z) { res[z] = Math.ceil(res[z] / 3); }); WORLD.reserve = res;
    var local = null; try { local = JSON.parse(localStorage.getItem(k) || 'null'); } catch (x) {}
    var done = function (st) { if (st) worldApply(st); WORLD.loaded = true; refreshFog(); };
    if (NET.mode === 'server' && NET.uid) api('kv/world').then(function (j) { var sv = j.value; done(sv && (!local || sv.at >= local.at) ? sv : local); }, function () { done(local); });
    else done(local);
  }
  // every few minutes one dead regular monster in a zone with replacements left comes back, out of sight
  setInterval(function () {
    if (!CB.ready || !WORLD.loaded || CB.on || !WORLD.reserve) return;
    var cands = CB.enemies.filter(function (e) { return e.dead && !e.npc && !e.boss && !e.guard && (WORLD.reserve[zoneOf(e)] || 0) > 0 && cheb(e.sx, e.sz, P.x, P.z) > 14 && visNow[e.sx + ',' + e.sz] === undefined && !enemyAt(e.sx, e.sz); });
    if (!cands.length) return; var e = cands[Math.floor(Math.random() * cands.length)], z = zoneOf(e);
    WORLD.reserve[z]--; if (e.def.base === 'shrub') { e.def = BEAST.shrub1; e.kind = 'shrub1'; e.lvl = 1; e.name = e.def.name; if (e.body) { e.obj.remove(e.body); e.body = null; e.mixer = null; } }
    e.dead = false; e.eaten = false; e.claimed = false; e.counted = false; e.fought = false; e.looted = false; e.lootStore = null; e.calm = false; e.hp = e.def.hp; e.max = e.def.hp;
    e.x = e.sx; e.z = e.sz; e.px = e.sx; e.pz = e.sz; e.obj.position.set(e.sx, 0, e.sz); e.obj.rotation.set(0, Math.PI * 0.75, 0); e.path = null; if (e.mixer && e.mixer.stopAllAction) e.mixer.stopAllAction(); e.cur = ''; cbPlay(e, 'Idle_Loop');
    worldSave();
  }, 240000);
  function nearestSafe(x, z) { // the closest safe-room tile to a spot
    var best = null, bd = 1e9; LEVEL.rooms.forEach(function (r) { if (r.type !== 'safe') return; var c = [(r.x0 + r.x1) >> 1, (r.z0 + r.z1) >> 1]; for (var t = 0; t < 30; t++) { var cx = c[0] + Math.round((Math.random() - 0.5) * 2 * Math.min(3, (r.x1 - r.x0) >> 1)), cz = c[1] + Math.round((Math.random() - 0.5) * 2 * Math.min(3, (r.z1 - r.z0) >> 1)); if (!blocksMove(cx, cz) && inSafeRoom(cx, cz)) { var d = Math.abs(cx - x) + Math.abs(cz - z); if (d < bd) { bd = d; best = { x: cx, z: cz }; } break; } } }); return best;
  }
  function cbPlay(e, name, once) {
    if (!e.mixer) { e.want = name; return; }
    var c = e.clips[name]; if (!c) return; var a = e.mixer.clipAction(c);
    if (e.cur === name && !once) return;
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = !!once; a.play();
    if (e.act && e.act !== a) a.crossFadeFrom(e.act, 0.18, false); e.act = a; e.cur = name;
    if (once && name !== 'Death01') setTimeout(function () { if (!e.dead && e.cur === name) cbPlay(e, 'Idle_Loop'); }, c.duration * 1000 - 120);
  }
  function enemyAt(x, z) { for (var i = 0; i < CB.enemies.length; i++) { var e = CB.enemies[i]; if (!e.dead && e.x === x && e.z === z) return e; } return null; }
  function cbOcc(x, z) { return !!enemyAt(x, z); }

  // ---------- grid paths (8 directions, no cutting corners) ----------
  function walkable(x, z, who) {
    if (x < 0 || z < 0 || x >= W || z >= H || blocksMove(x, z)) return false;
    if (who && who !== 'pc' && inSafeRoom(x, z)) return false;
    var e = enemyAt(x, z); if (e && e !== who) return false;
    if (who && who !== 'pc' && x === P.x && z === P.z) return false;
    return true;
  }
  function bfs(sx, sz, who, maxSteps) {
    var dist = {}, prev = {}, q = [[sx, sz]], k0 = sx + ',' + sz; dist[k0] = 0;
    while (q.length) {
      var c = q.shift(), cd = dist[c[0] + ',' + c[1]]; if (cd >= maxSteps) continue;
      for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue; var nx = c[0] + dx, nz = c[1] + dz, k = nx + ',' + nz;
        if (dist[k] !== undefined || !walkable(nx, nz, who)) continue;
        if (dx && dz && (!walkable(c[0] + dx, c[1], who) || !walkable(c[0], c[1] + dz, who))) continue;
        dist[k] = cd + 1; prev[k] = c[0] + ',' + c[1]; q.push([nx, nz]);
      }
    }
    return { dist: dist, prev: prev };
  }
  function pathTo(r, x, z) { var out = [], k = x + ',' + z; if (r.dist[k] === undefined) return null; while (r.prev[k]) { var p = k.split(','); out.unshift([+p[0], +p[1]]); k = r.prev[k]; } return out; }

  // ---------- overlays, bars, floating numbers ----------
  var cbTileGeo = new THREE.PlaneGeometry(0.9, 0.9); cbTileGeo.rotateX(-Math.PI / 2);
  var cbMoveMat = new THREE.MeshBasicMaterial({ color: 0x3df2e0, transparent: true, opacity: 0.22, depthWrite: false });
  var cbRingMat = new THREE.MeshBasicMaterial({ color: 0xff3a5a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  var cbTurnMat = new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
  var cbRingGeo = new THREE.RingGeometry(0.33, 0.42, 28); cbRingGeo.rotateX(-Math.PI / 2);
  var cbOverlay = new THREE.Group(); scene.add(cbOverlay); var cbPool = [], cbRings = [];
  function cbShowMoves() {
    cbPool.forEach(function (m) { m.visible = false; });
    if (!CB.on || CB.busy || !cbMyTurn() || CB.res.move <= 0) return;
    var r = bfs(P.x, P.z, 'pc', CB.res.move), n = 0;
    Object.keys(r.dist).forEach(function (k) {
      if (!r.dist[k]) return; var p = k.split(','); if (!tileState[+p[1] * W + +p[0]]) return;
      var m = cbPool[n] || (cbPool[n] = new THREE.Mesh(cbTileGeo, cbMoveMat)); if (!m.parent) cbOverlay.add(m);
      m.position.set(+p[0], 0.025, +p[1]); m.visible = true; n++;
    });
    CB.reach = r;
  }
  function cbRingsUpdate() {
    var need = CB.on ? CB.enemies.filter(function (e) { return !e.dead && !e.calm; }).length + 1 : 0;
    while (cbRings.length < need) { var m = new THREE.Mesh(cbRingGeo, cbRingMat); cbOverlay.add(m); cbRings.push(m); }
    cbRings.forEach(function (m) { m.visible = false; });
    if (!CB.on) return; var i = 0, cur = CB.order[CB.idx];
    CB.enemies.forEach(function (e) { if (e.dead || e.calm) return; var m = cbRings[i++]; m.material = cur === e ? cbTurnMat : cbRingMat; m.position.set(e.px, 0.03, e.pz); m.visible = !!visNow[e.x + ',' + e.z] || cur === e; });
    var mm = cbRings[i]; mm.material = cur === 'pc' ? cbTurnMat : cbRingMat; mm.position.set(P.px, 0.03, P.pz); mm.visible = cur === 'pc';
  }
  var _sv = new THREE.Vector3();
  function toScreen(x, y, z) { _sv.set(x, y, z).project(cam); return { x: (_sv.x + 1) / 2 * window.innerWidth, y: (1 - _sv.y) / 2 * window.innerHeight, ok: _sv.z < 1 }; }
  var floaters = [];
  function floater(x, y, z, text, cls) {
    var el = document.createElement('div'); el.className = 'floater ' + (cls || ''); el.textContent = text; document.body.appendChild(el);
    floaters.push({ el: el, x: x, y: y, z: z, t: 0 });
  }

  // ---------- HUD ----------
  (function cbUI() {
    var css = document.createElement('style');
    css.textContent = '#cbBar{position:fixed;z-index:6;right:16px;bottom:20px;display:none;gap:7px;align-items:flex-end;flex-wrap:wrap;justify-content:flex-end;max-width:70vw}' +
      '#cbBar.on{display:flex}#cbBar .act{min-width:62px}#cbBar .act small{display:block;font-size:8.5px;opacity:.7;letter-spacing:.06em}#cbBar .act:disabled{opacity:.35}' +
      '#cbEnd{border-color:var(--hot)!important;color:var(--hot)}' +
      '#turns{position:fixed;z-index:6;left:16px;top:76px;display:none;flex-direction:column;align-items:flex-start;gap:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase}#turns.on{display:flex}' +
      '#turns span{padding:4px 7px;border-radius:6px;background:rgba(20,22,34,.82);border:1px solid rgba(61,242,224,.35);color:#cfe}#turns span.cur{border-color:#ffd34a;color:#ffd34a}#turns span.dead{opacity:.35;text-decoration:line-through}' +
      '#res{position:fixed;z-index:6;right:18px;bottom:128px;display:none;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#cfe;background:rgba(20,22,34,.82);padding:5px 8px;border-radius:6px;border:1px solid rgba(61,242,224,.3)}#res.on{display:block}#res b{color:#ffd34a}' +
      '#hpbox{position:fixed;z-index:5;left:16px;top:44px;width:150px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#cfe}#hpbox .hb{height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:3px;border:1px solid rgba(255,255,255,.18)}#hpbox .hb i{display:block;height:100%;background:linear-gradient(90deg,#d33,#f66)}' +
      '.ebar{position:fixed;z-index:4;width:54px;transform:translate(-50%,-100%);display:none;pointer-events:none;font-size:8.5px;letter-spacing:.04em;color:#fcc;text-align:center;text-shadow:0 1px 2px #000}.ebar i{display:block;height:5px;border-radius:3px;background:#f44;box-shadow:0 0 0 1px rgba(0,0,0,.6);margin-bottom:2px}' +
      '.floater{position:fixed;z-index:8;transform:translate(-50%,-50%);pointer-events:none;font-weight:700;font-size:15px;color:#fff;text-shadow:0 2px 3px #000,0 0 6px #000;white-space:nowrap}.floater.dmg{color:#ff6b6b}.floater.pdmg{color:#ffb14a}.floater.miss{color:#9ab}.floater.heal{color:#7dff9a}.floater.crit{color:#ffd34a;font-size:19px}.floater.xp{color:#ffd34a;font-size:13px;letter-spacing:.06em}.sheet .plus{margin-left:4px;padding:0 7px;border-radius:5px;border:1px solid var(--neon);background:none;color:var(--neon);font:inherit;cursor:pointer}.sheet .pts{color:var(--hot)}';
    document.head.appendChild(css);
    css.textContent += '#cbMenu{position:fixed;z-index:7;right:16px;bottom:98px;width:min(300px,60vw);display:none;background:rgba(14,16,26,.94);border:1px solid rgba(61,242,224,.5);border-radius:10px;padding:6px}#cbMenu.on{display:block}' +
      '#cbMenu .mh{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--hot);padding:3px 5px 6px}#cbMenu button{display:flex;width:100%;justify-content:space-between;gap:8px;text-align:left;padding:8px 7px;background:none;border:0;border-top:1px solid rgba(255,255,255,.08);color:#e8f4f4;font:inherit;font-size:12px;cursor:pointer}' +
      '#cbMenu button i{font-style:normal;font-size:9.5px;color:var(--neon);white-space:nowrap}#cbMenu button:disabled{color:#6f7a88}#cbMenu button:disabled i{color:#6f7a88}#cbMenu button:active{background:rgba(61,242,224,.15)}';
    var bar = document.createElement('div'); bar.id = 'cbBar';
    bar.innerHTML = '<button class="act" id="cbAtk" type="button">Attack<small>action</small></button><button class="act" id="cbActs" type="button">Actions<small>more</small></button>' +
      '<button class="act" id="cbBonus" type="button">Bonus<small>action</small></button><button class="act big" id="cbEnd" type="button">End turn</button>';
    document.body.appendChild(bar);
    var mn = document.createElement('div'); mn.id = 'cbMenu'; document.body.appendChild(mn);
    var tr = document.createElement('div'); tr.id = 'turns'; document.body.appendChild(tr);
    var rs = document.createElement('div'); rs.id = 'res'; document.body.appendChild(rs);
    var hp = document.createElement('div'); hp.id = 'hpbox'; hp.innerHTML = '<span id="hpTxt"></span><div class="hb"><i id="hpFill"></i></div>'; document.body.appendChild(hp);
    function on(id, fn) { var el = document.getElementById(id); el.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); if (!el.disabled) fn(); }); }
    on('cbAtk', function () { cbMenuClose(); cbAttackButton(false); }); on('cbActs', function () { cbMenuToggle('acts'); }); on('cbBonus', function () { cbMenuToggle('bonus'); }); on('cbEnd', function () { cbMenuClose(); cbEndTurn(); });
  })();
  // ---------- the Actions and Bonus menus ----------
  function cbOptions(which) {
    var r = CB.res, adj = cbAdjacent(), Wt = cbThrowable();
    if (which === 'bonus') return [
      { label: 'Drink a potion', tag: '2d4+2 · ×' + CB.potions, ok: r.bonus && CB.potions > 0, fn: cbPotion },
      { label: 'Off-hand dagger attack', tag: '1d4, no modifier', ok: r.bonus && sty('off') === 3 && sty('main') > 0 && adj.length > 0, fn: function () { cbAttackButton(true); } }
    ];
    var near = CB.enemies.filter(function (e) { return !e.dead && !e.calm && !e.npc && cheb(P.x, P.z, e.x, e.z) <= 6; }).sort(function (a, b) { return cheb(P.x, P.z, a.x, a.z) - cheb(P.x, P.z, b.x, b.z); })[0];
    return [
      { label: 'Talk to ' + (near ? near.name : 'someone'), tag: 'free · say anything', ok: !!near, fn: function () { talkOpen(near); } },
      { label: 'Dash', tag: '+6 tiles', ok: r.action, fn: cbDash },
      { label: 'Disengage', tag: 'no opportunity attacks', ok: r.action, fn: cbDisengage },
      { label: 'Dodge', tag: 'attacks vs you at disadvantage', ok: r.action, fn: cbDodge },
      { label: 'Shove: knock prone', tag: 'Athletics contest', ok: r.action && adj.length > 0, fn: function () { cbShove(false); } },
      { label: 'Shove: push away', tag: 'Athletics contest', ok: r.action && adj.length > 0, fn: function () { cbShove(true); } },
      { label: 'Grapple', tag: 'Athletics contest · speed 0', ok: r.action && adj.length > 0, fn: cbGrapple },
      { label: 'Hide', tag: 'Stealth vs their Perception', ok: r.action && adj.length === 0, fn: cbHide },
      { label: 'Throw ' + Wt.name, tag: Wt.n + 'd' + Wt.s + ' · range ' + Wt.range + '/' + Wt.long, ok: r.action, fn: function () { CB.aim = 'throw'; say('Throw', 'Tap a target. Within ' + Wt.range + ' tiles is a normal throw; up to ' + Wt.long + ' at disadvantage.', 3200); cbHUD(); } }
    ];
  }
  function cbMenuToggle(which) {
    var el = document.getElementById('cbMenu'); if (el.classList.contains('on') && el.dataset.which === which) { cbMenuClose(); return; }
    if (!cbMyTurn() || CB.busy) return;
    el.dataset.which = which; el.innerHTML = '<div class="mh">' + (which === 'bonus' ? 'Bonus action' : 'Actions') + '</div>';
    cbOptions(which).forEach(function (o, i) {
      var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<span>' + (i + 1) + '. ' + o.label + '</span><i>' + o.tag + '</i>'; b.disabled = !o.ok;
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); if (b.disabled) return; cbMenuClose(); o.fn(); });
      el.appendChild(b);
    });
    el.classList.add('on');
  }
  function cbMenuClose() { document.getElementById('cbMenu').classList.remove('on'); }
  function cbMenuOpen() { return document.getElementById('cbMenu').classList.contains('on'); }
  function cbMenuPick(n) { var b = document.querySelectorAll('#cbMenu button')[n - 1]; if (b && !b.disabled) b.dispatchEvent(new Event('pointerdown')); }

  function cbHUD() {
    var a = pcAC();
    document.getElementById('hpTxt').textContent = (PC.down ? 'DOWN · saves ' + PC.saves.s + '✓ ' + PC.saves.f + '✗' : 'HP ' + PC.hp + '/' + PC.max) + ' · AC ' + a.ac + ' · Lv ' + (PC.level || 1) + ' (' + (PC.xp || 0) + '/' + nextLevelXP() + ')' + (PC.hidden ? ' · hidden' : '');
    document.getElementById('hpFill').style.width = Math.max(0, 100 * PC.hp / PC.max) + '%';
    document.getElementById('cbBar').classList.toggle('on', CB.on);
    document.getElementById('bar').style.display = CB.on ? 'none' : '';
    document.getElementById('stick').style.display = CB.on ? 'none' : '';
    document.getElementById('turns').classList.toggle('on', CB.on); document.getElementById('res').classList.toggle('on', CB.on && cbMyTurn() && !PC.down);
    if (!CB.on) { cbMenuClose(); return; }
    document.getElementById('turns').innerHTML = CB.order.map(function (c, i) {
      var nm = c === 'pc' ? 'You' : c.name + (c.prone ? ' (prone)' : '') + (c.grappled ? ' (grappled)' : ''), dead = c !== 'pc' && c.dead;
      return '<span class="' + (i === CB.idx ? 'cur ' : '') + (dead ? 'dead' : '') + '">' + nm + ' · ' + (c === 'pc' ? PC.init : c.init) + '</span>';
    }).join('');
    var mine = cbMyTurn() && !CB.busy && !PC.down, r = CB.res;
    document.getElementById('res').innerHTML = 'Move <b>' + r.move + '</b> · Action <b>' + (r.action ? '1' : '0') + '</b> · Bonus <b>' + (r.bonus ? '1' : '0') + '</b> · Reaction <b>' + (PC.react ? '1' : '0') + '</b>' +
      (CB.disengage ? ' · disengaged' : '') + (CB.aim ? ' · <b>tap a target</b>' : '');
    document.getElementById('cbAtk').disabled = !mine || !r.action; document.getElementById('cbActs').disabled = !mine; document.getElementById('cbBonus').disabled = !mine || !r.bonus;
    document.getElementById('cbEnd').disabled = !mine;
  }
  function cbMyTurn() { return CB.on && CB.order[CB.idx] === 'pc'; }
  function cbAdjacent() { return CB.enemies.filter(function (e) { return !e.dead && !e.calm && cheb(P.x, P.z, e.x, e.z) <= 1; }); }
  function cbThrowable() {
    if (sty('off') === 3 || (KIT && !KIT.on && sty('main') === 0 && sty('off') === 3)) return { name: 'your dagger', n: 1, s: 4, stat: MOD.DEX > MOD.STR ? 'DEX' : 'STR', prof: true, range: 4, long: 12, dagger: true };
    return { name: 'a rock', n: 1, s: 4, stat: 'STR', prof: false, range: 4, long: 12 };
  }

  // ---------- starting and ending a fight ----------
  function cbStart(why, first) {
    if (CB.on || !CB.ready) return;
    if (inSafeRoom(P.x, P.z)) { safeRoomPenalty(); return; }
    var foes = CB.enemies.filter(function (e) { return !e.dead && !e.calm && (first === e || (!e.def.timid && cheb(e.x, e.z, P.x, P.z) <= (e.guard ? 3 : 8))); });
    if (!foes.length) return;
    if (menuOpen) closeMenu(); if (crouch) toggleCrouch(); keys = {}; joy.x = joy.y = 0;
    CB.on = true; CB.dodge = false; CB.disengage = false; CB.aim = null; P.px = P.x; P.pz = P.z; P.speed = 0; CB.path = null; PC.react = true;
    foes.forEach(function (e) { e.react = true; e.prone = false; e.grappled = false; e.fought = true; });
    var pcInit = d20() + MOD.DEX - (hasTrait('Distractible') ? 2 : 0); CB.order = [{ init: pcInit, who: 'pc' }].concat(foes.map(function (e) { e.init = d20() + e.def.init; return { init: e.init, who: e }; }))
      .sort(function (a, b) { return b.init - a.init; }).map(function (o) { return o.who; });
    PC.init = pcInit;
    var names = CB.order.map(function (c) { return (c === 'pc' ? 'You ' + pcInit : c.name + ' ' + c.init); }).join(', ');
    say('Combat · Roll for initiative', why + ' Turn order: ' + names + '.', 6000);
    CB.idx = -1; foes.forEach(function (e) { cbFace(e, P.x, P.z); });
    setTimeout(cbNext, 700); cbHUD();
  }
  // ---------- the fight has a reach: anything hostile that comes inside it rolls initiative and joins ----------
  // The zone is centred on everyone in the fight. Monsters join when they see you close up, or when they are
  // close enough to the fighting to hear it. (Party play will use the same rule: a crawler who walks into the
  // zone rolls initiative and takes a place in the same turn order.)
  var CB_ZONE = 6, CB_HEAR = 4;
  function cbZone() {
    var pts = [[P.x, P.z]]; CB.order.forEach(function (c) { if (c !== 'pc' && !c.dead) pts.push([c.x, c.z]); });
    var x = 0, z = 0; pts.forEach(function (p) { x += p[0]; z += p[1]; }); x /= pts.length; z /= pts.length;
    var r = 0; pts.forEach(function (p) { r = Math.max(r, Math.max(Math.abs(p[0] - x), Math.abs(p[1] - z))); });
    return { x: x, z: z, r: r + CB_ZONE };
  }
  function cbJoin(e, why) {
    if (!CB.on || CB.order.indexOf(e) >= 0 || e.dead || e.calm) return;
    e.init = d20() + e.def.init; e.react = true; e.prone = false; e.grappled = false; e.fought = true;
    var initOf = function (c) { return c === 'pc' ? PC.init : c.init; }, at = CB.order.length;
    for (var i = 0; i < CB.order.length; i++) if (e.init > initOf(CB.order[i])) { at = i; break; }
    CB.order.splice(at, 0, e); if (at <= CB.idx) CB.idx++; // the current turn stays the current turn
    cbFace(e, P.x, P.z); cbRingsUpdate(); cbHUD();
    say('Joins the fight · initiative ' + e.init, e.name + ' ' + why + ' It takes its place in the turn order.', 4200);
  }
  function cbJoinCheck() {
    if (!CB.on) return; var Z = cbZone();
    CB.enemies.forEach(function (e) {
      if (e.dead || e.calm || e.npc || e.def.timid || CB.order.indexOf(e) >= 0 || inSafeRoom(e.x, e.z)) return;
      var seesYou = visNow[e.x + ',' + e.z] !== undefined && cheb(e.x, e.z, P.x, P.z) <= CB_ZONE;
      var hears = CB.order.some(function (c) { return c !== 'pc' && !c.dead && cheb(e.x, e.z, c.x, c.z) <= CB_HEAR; }) && Math.max(Math.abs(e.x - Z.x), Math.abs(e.z - Z.z)) <= Z.r;
      if (seesYou) cbJoin(e, 'sees you and charges in.'); else if (hears) cbJoin(e, 'hears the fighting and comes to help.');
    });
  }
  function cbEnd(win) {
    setTimeout(worldSave, 500);
    CB.on = false; CB.busy = false; CB.path = null; CB.aim = null; PC.hidden = false; cbShowMoves(); cbRingsUpdate(); cbHUD();
    if (CB.thrownDagger) { look.off = [3, look.off[1]]; CB.thrownDagger = false; buildHero(); }
    CB.enemies.forEach(function (e) { e.grappled = false; if (e.prone && !e.dead) { e.prone = false; } if (!e.dead) cbPlay(e, 'Idle_Loop'); });
    // XP for every monster beaten in this fight: killed, or talked into giving up
    var beaten = CB.enemies.filter(function (e) { return (e.dead || e.calm) && e.fought && !e.counted && !e.npc; }), xp = 0;
    beaten.forEach(function (e) { e.counted = true; xp += e.def.xp; });
    if (xp && !win) { grantXP(xp); }
    if (xp && win) {
      var talked = beaten.filter(function (e) { return !e.dead; }).length;
      say('Victory · +' + xp + ' XP', (talked ? talked + ' of them talked down, which counts. ' : '') + 'The cameras zoom in on your face. Viewers voted you "most likely to survive floor one."', 6500); grantXP(xp);
      var later = 0; function ach(id, t, x, n) { setTimeout(function () { achieve(id, t, x, n); }, 2400 + 2600 * later++); }
      if (beaten.some(function (e) { return e.dead; }) && !(CHAR && CHAR.ach && CHAR.ach.first_blood)) ach('first_blood', 'First Blood', 'Your first kill on camera. Your mother would be so proud.', 50);
      if (talked && !(CHAR && CHAR.ach && CHAR.ach.talker)) ach('talker', 'Use Your Words', 'You talked a monster out of a fight. The viewers are confused but intrigued.', 50);
      if (beaten.some(function (e) { return e.dead && e.def.base === 'shrub'; }) && !(CHAR && CHAR.ach && CHAR.ach.weed)) ach('weed', 'Weed Whacker', 'You killed a shrub. Gardeners everywhere salute you.', 10);
      if (beaten.some(function (e) { return e.dead && e.def.lvl === 4; })) ach('thornmaw', 'Should Have Stepped On It', 'You killed a Thornmaw. Somebody let it get that big.', 150);
      if (beaten.some(function (e) { return e.dead && e.boss; })) ach('boss_' + beaten.filter(function (e) { return e.boss; })[0].kind, 'Boss Down', 'You beat ' + beaten.filter(function (e) { return e.boss; })[0].name + '. The audience is on its feet.', 100);
    }
  }
  function cbNext() {
    if (!CB.on) return;
    if (!CB.enemies.some(function (e) { return !e.dead && !e.calm && CB.order.indexOf(e) >= 0; })) { cbEnd(true); return; }
    CB.idx = (CB.idx + 1) % CB.order.length;
    if (CB.idx === 0) cbJoinCheck();
    var c = CB.order[CB.idx];
    if (c !== 'pc' && (c.dead || c.calm)) { cbNext(); return; }
    if (c === 'pc' && cbEscaped()) return;
    if (c === 'pc') {
      CB.res = { move: 6, action: 1, bonus: 1 }; CB.dodge = false; CB.disengage = false; CB.aim = null; CB.busy = false; PC.react = true;
      if (PC.hidden && PC.hiddenTurns-- <= 0) { PC.hidden = false; say('Spotted', 'You stayed in one place too long. They can see you again.', 2400); }
      if (PC.down) { cbRingsUpdate(); cbHUD(); setTimeout(cbDeathSave, 700); return; }
      cbShowMoves();
    } else { c.react = true; cbShowMoves(); setTimeout(function () { cbEnemyTurn(c); }, 250); }
    cbRingsUpdate(); cbHUD();
  }
  // running away works: if no hostile monster is close enough to keep after you, the fight is over
  function cbEscaped() {
    var foes = CB.enemies.filter(function (e) { return !e.dead && !e.calm && CB.order.indexOf(e) >= 0; });
    var near = foes.some(function (e) { var dd = cheb(e.x, e.z, P.x, P.z); return dd <= 5 || (dd <= 8 && los(e.x, e.z, P.x, P.z)); });
    if (near || PC.down) return false;
    CB.order = []; cbEnd(false); setTimeout(function () { achieve('got_away', 'Strategic Retreat', 'You ran away and lived. That counts as a skill on this show.', 10); }, 5200); say('You got away', 'You ran and they lost track of you. The audience is split between booing and respecting it. No XP for running.', 5000);
    return true;
  }
  function cbEndTurn() { if (!cbMyTurn() || CB.busy || PC.down) return; CB.res = { move: 0, action: 0, bonus: 0 }; CB.aim = null; cbShowMoves(); cbNext(); }

  // ---------- your turn ----------
  function cbFaceHero(x, z) { hero.rotation.y = Math.atan2(x - P.px, z - P.pz); }
  function cbFace(e, x, z) { e.obj.rotation.y = Math.atan2(x - e.px, z - e.pz); }
  function cbTap(x, z) {
    if (!cbMyTurn() || CB.busy || PC.down) return;
    cbMenuClose();
    var e = enemyAt(x, z);
    if (CB.aim === 'throw') { if (e && !e.calm) { CB.aim = null; cbThrow(e); } else say('Throw', 'Tap a monster to throw at it.', 2000); return; }
    if (e && !e.calm) { cbApproachAndAttack(e); return; }
    if (!CB.reach || CB.reach.dist[x + ',' + z] === undefined || !CB.reach.dist[x + ',' + z]) { if (CB.res.move <= 0) say('Out of movement', 'You have used all your movement this turn. Attack, use an action, or end your turn.', 2600); return; }
    cbWalk(pathTo(CB.reach, x, z));
  }
  function cbWalk(path, then) {
    if (!path || !path.length) { if (then) then(); return; }
    CB.res.move -= path.length; CB.path = path; CB.afterWalk = then || null; CB.busy = true; cbShowMoves(); cbHUD();
  }
  function cbMove(dt) { // called instead of joystick movement while a fight is on
    P.speed = 0; if (!CB.path || CB.pause) return;
    var t = CB.path[0];
    if (!CB.stepChecked) { // leaving a monster's reach without Disengage provokes an opportunity attack
      CB.stepChecked = true;
      var foe = CB.disengage ? null : CB.enemies.filter(function (e) { return !e.dead && !e.calm && e.react && !e.prone && cheb(P.x, P.z, e.x, e.z) <= 1 && cheb(t[0], t[1], e.x, e.z) > 1; })[0];
      if (foe) { CB.pause = true; foe.react = false; cbEnemyAttack(foe, true, function () { CB.pause = false; if (PC.down) { CB.path = null; CB.busy = false; } }); return; }
    }
    var dx = t[0] - P.px, dz = t[1] - P.pz, dist = Math.sqrt(dx * dx + dz * dz), step = 2.4 * dt;
    P.speed = 1.6; cbFaceHero(t[0], t[1]);
    if (dist <= step) {
      P.px = t[0]; P.pz = t[1]; P.x = t[0]; P.z = t[1]; CB.path.shift(); CB.stepChecked = false; refreshFog(); enterRoom(); cbJoinCheck();
      CB.enemies.forEach(function (e) { if (e.grappled && cheb(P.x, P.z, e.x, e.z) > 1) { e.grappled = false; say('Grapple released', 'You stepped away and let go of ' + e.name + '.', 2200); } });
    } else { P.px += dx / dist * step; P.pz += dz / dist * step; }
    if (!CB.path.length) { CB.path = null; P.speed = 0; CB.busy = false; var f = CB.afterWalk; CB.afterWalk = null; cbShowMoves(); cbHUD(); if (f) f(); }
  }
  function cbApproachAndAttack(e, offhand) {
    if (cheb(P.x, P.z, e.x, e.z) <= 1) { cbAttack(e, offhand); return; }
    if (!CB.res.action && !offhand) { say('No action left', 'You can still move, use a bonus action, or end your turn.', 2600); return; }
    var r = bfs(P.x, P.z, 'pc', CB.res.move), best = null;
    for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { var k = (e.x + dx) + ',' + (e.z + dz); if (r.dist[k] !== undefined && (best === null || r.dist[k] < r.dist[best])) best = k; }
    if (best === null) { say('Too far', e.name + ' is out of reach this turn. Move closer, Dash, or throw something.', 2800); return; }
    var p = best.split(','); cbWalk(pathTo(r, +p[0], +p[1]), function () { if (!PC.down) cbAttack(e, offhand); });
  }
  function cbAttackButton(offhand) {
    if (!cbMyTurn() || CB.busy || PC.down) return;
    var near = cbAdjacent();
    if (!near.length) { say('Nobody in reach', 'Tap an enemy to walk over and hit it, or throw something from the Actions menu.', 2800); return; }
    near.sort(function (a, b) { return a.hp - b.hp; }); cbAttack(near[0], offhand);
  }
  // one attack roll against a monster: advantage, disadvantage, cover and crits all apply
  function cbResolve(e, Wp, opt) {
    opt = opt || {};
    var dist = cheb(P.x, P.z, e.x, e.z), adv = false, dis = false, why = [];
    if (PC.hidden) { adv = true; why.push('unseen'); }
    if (e.prone) { if (dist <= 1) { adv = true; why.push('target prone'); } else { dis = true; why.push('prone target at range'); } }
    if (e.grappled && dist <= 1) { adv = true; why.push('grappled'); }
    if (opt.ranged && cbAdjacent().length) { dis = true; why.push('enemy next to you'); }
    if (opt.ranged && dist > Wp.range) { dis = true; why.push('long range'); }
    var cover = opt.ranged && hasCover(P.x, P.z, e.x, e.z) ? 2 : 0, ac = e.def.ac + cover;
    var R = roll20(adv, dis), tot = R.r + Wp.hit, crit = R.r === 20, hit = crit || (R.r !== 1 && tot >= ac);
    var line = R.txt + ' + ' + Wp.hit + ' = ' + tot + ' vs AC ' + ac + (cover ? ' (half cover)' : '') + (why.length ? ' · ' + why.join(', ') : '');
    if (PC.hidden) { PC.hidden = false; }
    if (hit) {
      var dm = Math.max(1, d(crit ? Wp.n * 2 : Wp.n, Wp.s) + Wp.dmgB); e.hp -= dm;
      floater(e.px, e.def.h + 0.25, e.pz, (crit ? 'CRIT ' : '') + '-' + dm, crit ? 'crit' : 'dmg');
      say((opt.label || (crit ? 'Critical hit' : 'Hit')) + ' · ' + Wp.name + ' · ' + line, e.name + ' takes ' + dm + ' damage' + (e.hp <= 0 ? ' and goes down.' : ' (' + Math.max(0, e.hp) + ' / ' + e.max + ' left).') + (Wp.note ? ' ' + Wp.note : ''), 5200);
      if (e.hp <= 0) cbKill(e); else if (!e.prone) cbPlay(e, 'Hit_Chest', true);
    } else { floater(e.px, e.def.h + 0.25, e.pz, R.r === 1 ? 'FUMBLE' : 'MISS', 'miss'); say((opt.label || 'Miss') + ' · ' + Wp.name + ' · ' + line, R.r === 1 ? 'A natural 1. The replay will be shown at halftime.' : e.name + ' twists away.', 4200); }
    return hit;
  }
  function cbAttack(e, offhand) {
    if (offhand ? !CB.res.bonus : !CB.res.action) return;
    if (offhand) CB.res.bonus = 0; else CB.res.action = 0;
    var Wp = offhand ? { name: 'off-hand dagger', n: 1, s: 4, stat: MOD.DEX > MOD.STR ? 'DEX' : 'STR', clip: 'Punch_Jab' } : pcWeapon();
    if (offhand) { Wp.hit = PROF() + MOD[Wp.stat]; Wp.dmgB = 0; }
    CB.busy = true; cbFaceHero(e.x, e.z); cbFace(e, P.x, P.z); kitOneShot(Wp.clip); cbHUD();
    setTimeout(function () { cbResolve(e, Wp); cbAfterMyMove(); }, 420);
  }
  function cbAfterMyMove() { setTimeout(function () { CB.busy = false; cbShowMoves(); cbHUD(); if (!CB.enemies.some(function (q) { return !q.dead && !q.calm && CB.order.indexOf(q) >= 0; })) cbEnd(true); }, 500); }
  function cbThrow(e) {
    var Wt = cbThrowable(), dist = cheb(P.x, P.z, e.x, e.z);
    if (dist > Wt.long) { say('Out of range', e.name + ' is ' + dist + ' tiles away. You can throw up to ' + Wt.long + '.', 2600); return; }
    if (!los(P.x, P.z, e.x, e.z)) { say('No line of sight', 'Something solid is between you and ' + e.name + '.', 2600); return; }
    CB.res.action = 0; CB.busy = true; cbFaceHero(e.x, e.z); kitOneShot('Spell_Simple_Shoot'); cbHUD();
    var Wp = { name: 'thrown ' + Wt.name.replace(/^(your|a) /, ''), n: Wt.n, s: Wt.s, hit: (Wt.prof ? PROF() : 0) + MOD[Wt.stat], dmgB: MOD[Wt.stat], range: Wt.range };
    setTimeout(function () {
      cbResolve(e, Wp, { ranged: true });
      if (Wt.dagger) { look.off = [0, look.off[1]]; buildHero(); say('Dagger thrown', 'It is on the floor over there now. Pick it up after the fight (it returns to your hand when the fight ends).', 3000); CB.thrownDagger = true; }
      cbAfterMyMove();
    }, 520);
  }
  function cbContest(e) { // your Athletics against their Athletics or Acrobatics, whichever is better for them
    var me = d20() + MOD.STR + skillLv('Athletics') - (hasTrait('Bad Back') ? 2 : 0), them = d20() + Math.max(e.def.str, e.def.dex) + (e.kind === 'imp' ? 2 : 0);
    return { win: me >= them, txt: 'Athletics ' + me + ' vs ' + them };
  }
  function cbPickAdjacent() { var a = cbAdjacent(); a.sort(function (x, y) { return x.hp - y.hp; }); return a[0]; }
  function cbShove(push) {
    var e = cbPickAdjacent(); if (!e || !CB.res.action) return; CB.res.action = 0; CB.busy = true; cbFaceHero(e.x, e.z); kitOneShot('Punch_Cross'); cbHUD();
    setTimeout(function () {
      var c = cbContest(e);
      if (!c.win) { say('Shove fails · ' + c.txt, e.name + ' plants its feet.', 3200); cbAfterMyMove(); return; }
      if (!push) { e.prone = true; cbPlay(e, 'Death01', true); say('Shoved prone · ' + c.txt, e.name + ' hits the floor. Melee attacks against it have advantage; standing up costs it half its movement.', 4800); }
      else {
        var nx = e.x + Math.sign(e.x - P.x), nz = e.z + Math.sign(e.z - P.z);
        if (walkable(nx, nz, e)) { e.x = nx; e.z = nz; e.path = [[nx, nz]]; e.afterWalk = function () { cbPlay(e, 'Idle_Loop'); }; e.grappled = false; say('Shoved back · ' + c.txt, e.name + ' stumbles a tile away.', 3600); }
        else say('Shove · ' + c.txt, 'You shove, but there is nowhere for ' + e.name + ' to go. It slams into the wall.', 3600);
      }
      cbAfterMyMove();
    }, 380);
  }
  function cbGrapple() {
    var e = cbPickAdjacent(); if (!e || !CB.res.action) return; CB.res.action = 0; CB.busy = true; cbFaceHero(e.x, e.z); kitOneShot('Punch_Jab'); cbHUD();
    setTimeout(function () {
      var c = cbContest(e);
      if (c.win) { e.grappled = true; say('Grappled · ' + c.txt, 'You have ' + e.name + ' by the collar. Its speed is 0 while you hold on. Step away to let go.', 4600); }
      else say('Grapple fails · ' + c.txt, e.name + ' wriggles free.', 3000);
      cbAfterMyMove();
    }, 380);
  }
  function cbHide() {
    if (!CB.res.action) return; CB.res.action = 0;
    var me = d20() + MOD.DEX + skillLv('Stealth') - (hasTrait('Loudmouth') ? 2 : 0), foes = CB.enemies.filter(function (e) { return !e.dead && !e.calm && CB.order.indexOf(e) >= 0; }), seen = foes.filter(function (e) { return me < e.def.pp; });
    if (!seen.length) { PC.hidden = true; PC.hiddenTurns = 1; say('Hidden · Stealth ' + me, 'Nobody can see you. Your next attack has advantage, and attacks against you have disadvantage until you attack.', 4600); }
    else say('Spotted · Stealth ' + me + ' vs Perception ' + seen[0].def.pp, seen[0].name + ' is still watching you.', 3200);
    cbHUD();
  }
  function cbDash() { if (!cbMyTurn() || CB.busy || !CB.res.action) return; CB.res.action = 0; CB.res.move += 6; say('Dash', 'You double your movement this turn.', 2200); cbShowMoves(); cbHUD(); }
  function cbDisengage() { if (!cbMyTurn() || CB.busy || !CB.res.action) return; CB.res.action = 0; CB.disengage = true; say('Disengage', 'You can walk away this turn without opportunity attacks.', 2600); cbHUD(); }
  function cbDodge() { if (!cbMyTurn() || CB.busy || !CB.res.action) return; CB.res.action = 0; CB.dodge = true; say('Dodge', 'Attacks against you have disadvantage until your next turn.', 2600); cbHUD(); }
  function cbPotion() {
    if (!cbMyTurn() || CB.busy || !CB.res.bonus || CB.potions <= 0) return;
    CB.res.bonus = 0; CB.potions--; var h = d(2, 4) + 2, before = PC.hp; PC.hp = Math.min(PC.max, PC.hp + h);
    floater(P.px, 1.5, P.pz, '+' + (PC.hp - before), 'heal'); kitOneShot('PickUp_Table'); say('Potion of Healing · 2d4 + 2 = ' + h, 'Tastes like a sponsor. ' + CB.potions + ' left.', 3200); cbHUD();
  }
  function cbKill(e) {
    e.dead = true; e.grappled = false; cbPlay(e, 'Death01', true); e.bar.style.display = 'none';
    say('Enemy down · ' + e.name, e.def.xp + ' XP. ' + (e.kind === 'imp' ? 'The stairwell is unguarded.' : 'Its stick rolls away. The audience applauds politely.'), 4200);
    if (PROPS && PROPS.ready) setTimeout(function () { place('Coin_Pile', e.px + 0.25, e.pz + 0.2, { s: 0.6 }); refreshFog(); }, 1600);
  }

  // ---------- death saving throws ----------
  function cbFall() {
    PC.hp = 0; PC.down = true; PC.saves = { s: 0, f: 0 }; PC.hidden = false; CB.path = null; CB.busy = false; kitOneShot('Death01', true);
    CB.enemies.forEach(function (e) { e.grappled = false; });
    say('Downed', 'You drop. On each of your turns you roll a death save: 10 or more is a success. Three successes and you stabilise; three failures and you die. A natural 20 puts you back on your feet.', 7000);
    cbHUD();
  }
  function cbDeathSave() {
    if (!CB.on || !PC.down) return;
    var r = d20(), S = PC.saves;
    if (r === 20) { PC.down = false; PC.hp = 1; if (KIT) KIT.shot = null; say('Death save · natural 20', 'You come back up with 1 HP. The crowd loses its mind.', 4200); cbShowMoves(); cbHUD(); return; }
    if (r === 1) S.f += 2; else if (r >= 10) S.s++; else S.f++;
    say('Death save · d20 ' + r, (r >= 10 ? 'Success.' : r === 1 ? 'Natural 1: two failures.' : 'Failure.') + ' ' + S.s + ' successes, ' + S.f + ' failures.', 3600); cbHUD();
    setTimeout(function () {
      if (S.f >= 3) { cbDie(false); return; }
      if (S.s >= 3) { cbDie(true); return; }
      cbNext();
    }, 1400);
  }
  function cbDie(stable) {
    CB.busy = true;
    say(stable ? 'Stable' : 'You died', stable ? 'You stop bleeding. The monsters lose interest, and the System drags you to the nearest safe room.' :
      'The crowd goes silent. In the full game, death in the crawl is permanent. For this test, the System drags you to the nearest safe room. The monsters you killed stay dead.', 6500);
    setTimeout(function () {
      cbEnd(false); PC.down = false; PC.hp = PC.max; CB.potions = Math.max(CB.potions, 1);
      if (CB.thrownDagger) { look.off = [3, look.off[1]]; CB.thrownDagger = false; buildHero(); }
      var home = nearestSafe(P.x, P.z) || start; P.x = home.x; P.z = home.z; P.px = home.x; P.pz = home.z; if (KIT) { KIT.shot = null; }
      // the monsters that beat you keep their wounds (they patch up a little) and wander back toward their posts
      CB.enemies.forEach(function (e) { if (e.dead) return; e.hp = Math.min(e.max, e.hp + Math.ceil((e.max - e.hp) * 0.25)); e.path = null; e.prone = false; e.fought = false; cbPlay(e, 'Idle_Loop'); });
      refreshFog(); enterRoom(); cbHUD(); worldSave();
    }, 3200);
  }

  // ---------- monster turns ----------
  function cbEnemyTurn(e) {
    if (!CB.on) return;
    if (e.dead || e.calm) { setTimeout(cbNext, 200); return; } // it made a deal mid-fight: it keeps its word
    var speed = e.def.speed;
    if (e.prone) { e.prone = false; speed = Math.floor(speed / 2); cbPlay(e, 'Idle_Loop'); say(e.name, 'It scrambles back to its feet (half its movement).', 2200); }
    if (e.grappled) speed = 0;
    if (PC.down) { // the show likes a dramatic pause: monsters gloat instead of finishing you
      setTimeout(function () { say(e.name, ['It pokes you with its ' + e.def.weapon + ' and waves at the camera.', 'It goes through your pockets.', 'It does a little dance.'][Math.floor(Math.random() * 3)], 2400); setTimeout(cbNext, 900); }, 300); return;
    }
    if (cheb(e.x, e.z, P.x, P.z) <= 1) { cbEnemyAttack(e, false, cbNextAfterHit); return; }
    if (!speed) { say(e.name, 'It strains against your grip and cannot reach you.', 2200); setTimeout(cbNext, 600); return; }
    var r = bfs(e.x, e.z, e, 40), best = null;
    for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; var k = (P.x + dx) + ',' + (P.z + dz); if (r.dist[k] !== undefined && (best === null || r.dist[k] < r.dist[best])) best = k; }
    if (best === null) { say(e.name, 'It cannot find a way to you and snarls instead.', 2500); setTimeout(cbNext, 700); return; }
    var p = best.split(','), path = pathTo(r, +p[0], +p[1]).slice(0, speed);
    if (!path.length) { setTimeout(cbNext, 300); return; }
    e.path = path; cbPlay(e, 'Walk_Loop');
    e.afterWalk = function () { cbPlay(e, 'Idle_Loop'); if (cheb(e.x, e.z, P.x, P.z) <= 1) cbEnemyAttack(e, false, cbNextAfterHit); else setTimeout(cbNext, 350); };
  }
  function cbNextAfterHit() { setTimeout(function () { if (!PC.down || CB.order[CB.idx] !== 'pc') cbNext(); }, 450); }
  function cbEnemyAttack(e, opportunity, then) {
    cbFace(e, P.x, P.z); cbPlay(e, e.def.attackClip, true);
    var dis = CB.dodge || PC.hidden || e.prone, why = [];
    if (CB.dodge) why.push('you dodge'); if (PC.hidden) why.push('cannot see you'); if (e.prone) why.push('attacking from the floor');
    var R = roll20(false, dis), tot = R.r + e.def.atk, ac = pcAC().ac, crit = R.r === 20, hit = crit || (R.r !== 1 && tot >= ac);
    setTimeout(function () {
      var line = R.txt + ' + ' + e.def.atk + ' = ' + tot + ' vs your AC ' + ac + (why.length ? ' · ' + why.join(', ') : '');
      var tag = opportunity ? 'Opportunity attack · ' : '';
      if (hit) {
        var dm = d(crit ? e.def.dmg[0] * 2 : e.def.dmg[0], e.def.dmg[1]) + e.def.dmg[2]; PC.hp = Math.max(0, PC.hp - dm);
        floater(P.px, 1.5, P.pz, '-' + dm, crit ? 'crit' : 'pdmg'); kitOneShot('Hit_Chest');
        say(tag + e.name + ' hits · ' + e.def.weapon + ' · ' + line, (opportunity ? 'You turned your back on it. ' : '') + 'You take ' + dm + ' damage. ' + (PC.hp > 0 ? PC.hp + ' HP left.' : ''), 4600);
        if (PC.hp <= 0) cbFall();
      } else { floater(P.px, 1.5, P.pz, 'MISS', 'miss'); say(tag + e.name + ' misses · ' + line, CB.dodge ? 'Your dodge pays off.' : 'Its ' + e.def.weapon + ' whistles past your ear.', 3600); }
      cbHUD(); if (then) then();
    }, 480);
  }
  // your reaction: a monster that walks out of your reach gets hit on the way
  function cbMyOpportunity(e) {
    if (!PC.react || PC.down || e.dead) return; PC.react = false;
    var Wp = pcWeapon(); kitOneShot(Wp.clip); cbFaceHero(e.x, e.z);
    setTimeout(function () { cbResolve(e, Wp, { label: 'Your opportunity attack' }); cbHUD(); }, 300);
  }

  // ---------- life between fights: monsters mill about; shrubs go looking for bodies ----------
  function cbRoam(e, dt) {
    if (e.dead || e.npc || e.guard || e.boss || CB.busy && CB.on) return;
    var now = performance.now();
    if (e.eating) { // munching: the body shrinks away, the shrub grows
      if (now - e.eating.t < 2600) return; var body = e.eating.body; e.eating = null;
      if (body.dead && !body.eaten) { body.eaten = true; body.obj.visible = false; body.bar.style.display = 'none'; shrubGrow(e, body); worldSave(); }
      return;
    }
    if (e.path) return;
    if (e.body) { // shrubs smell the dead from a long way off
      var best = null, bd = 15;
      CB.enemies.forEach(function (q) { if (q.dead && !q.eaten && q !== e && !q.claimed) { var d2 = cheb(q.x, q.z, e.x, e.z); if (d2 < bd) { bd = d2; best = q; } } });
      if (best && bd <= 1) { e.eating = { t: now, body: best }; best.claimed = true; cbFace(e, best.x, best.z); if (visNow[e.x + ',' + e.z] !== undefined) floater(e.px, e.def.h + 0.3, e.pz, 'munch', 'miss'); return; }
      if (best && now > (e.nextSeek || 0)) {
        e.nextSeek = now + 1500; var r = bfs(e.x, e.z, e, 24), goal = null;
        for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { var k = (best.x + dx) + ',' + (best.z + dz); if (r.dist[k] !== undefined && (goal === null || r.dist[k] < r.dist[goal])) goal = k; }
        if (goal) { var gp = goal.split(','), path = pathTo(r, +gp[0], +gp[1]); if (path && path.length) { e.path = path; e.roaming = true; e.afterWalk = function () { e.roaming = false; }; return; } }
      }
    }
    if (now < (e.nextRoam || (e.nextRoam = now + 2000 + Math.random() * 6000))) return;
    e.nextRoam = now + 3000 + Math.random() * 6000; if (Math.random() < 0.3) return;
    var range = e.body ? 7 : 3, ox = e.body ? e.x : e.sx, oz = e.body ? e.z : e.sz;
    var rr = bfs(e.x, e.z, e, range * 2 + 2), opts = Object.keys(rr.dist).filter(function (k) { var q = k.split(','); return rr.dist[k] > 0 && Math.max(Math.abs(+q[0] - ox), Math.abs(+q[1] - oz)) <= range; });
    if (!opts.length) return; var pk = opts[Math.floor(Math.random() * opts.length)].split(','), p2 = pathTo(rr, +pk[0], +pk[1]);
    if (p2 && p2.length) { e.path = p2.slice(0, range * 2); e.roaming = true; if (!e.body) cbPlay(e, 'Walk_Loop'); e.afterWalk = function () { e.roaming = false; if (!e.body) cbPlay(e, 'Idle_Loop'); }; }
  }
  function shrubGrow(e, body) {
    var lv = Math.min(4, (e.def.lvl || 1) + 1), was = e.name; if (lv === e.def.lvl) { e.hp = e.max; return; }
    e.def = BEAST['shrub' + lv]; e.kind = 'shrub' + lv; e.lvl = lv; e.name = e.def.name; e.max = e.def.hp; e.hp = e.def.hp;
    if (e.body) { e.obj.remove(e.body); e.body = null; } e.mixer = null; cbMaterialize(e);
    if (visNow[e.x + ',' + e.z] !== undefined || cheb(e.x, e.z, P.x, P.z) <= 8)
      say(lv >= 4 ? 'Uh oh' : 'Something grew', 'The ' + was.toLowerCase() + ' ate the ' + body.name.toLowerCase() + '\'s body and grew into a ' + e.name.toLowerCase() + '.' + (lv >= 3 ? ' It looks hungry for something that is still moving.' : ''), 5000);
  }
  function cbShrubAnim(e, dt) {
    var T = performance.now() / 1000, b = e.body;
    if (e.dead) { b.scale.y += (0.25 - b.scale.y) * Math.min(1, dt * 4); b.position.y = 0; return; }
    var moving = !!e.path, sq = e.eating ? 1 + 0.18 * Math.abs(Math.sin(T * 9)) : moving ? 1 + 0.12 * Math.abs(Math.sin(T * 10)) : 1 + 0.05 * Math.sin(T * 2 + e.n);
    b.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); b.position.y = moving ? Math.abs(Math.sin(T * 10)) * 0.08 : 0;
  }
  // ---------- every frame ----------
  function cbUpdate(dt) {
    CB.enemies.forEach(function (e) {
      if (cheb(e.x, e.z, P.x, P.z) > 16 && !e.path) { if (e.obj.visible) { e.obj.visible = false; e.bar.style.display = 'none'; } return; }
      if (!e.mixer) cbMaterialize(e);
      if (!e.mixer) return;
      e.mixer.update(dt);
      if (!CB.on || CB.order.indexOf(e) < 0) cbRoam(e, dt);
      if (e.body) cbShrubAnim(e, dt);
      if (e.path) {
        var t = e.path[0], dx = t[0] - e.px, dz = t[1] - e.pz, dist = Math.sqrt(dx * dx + dz * dz), step = (e.roaming ? (e.body ? 1.8 : 1.3) : 3.2) * dt;
        e.obj.rotation.y = Math.atan2(dx, dz);
        if (dist <= step) { var wasNear = CB.on && cheb(e.x, e.z, P.x, P.z) <= 1; e.px = t[0]; e.pz = t[1]; e.x = t[0]; e.z = t[1]; e.path.shift(); if (wasNear && cheb(e.x, e.z, P.x, P.z) > 1 && !e.prone) cbMyOpportunity(e); if (!CB.on && e.roaming) cbAggro(); }
        else { e.px += dx / dist * step; e.pz += dz / dist * step; }
        e.obj.position.set(e.px, 0, e.pz);
        if (!e.path.length) { e.path = null; var f = e.afterWalk; e.afterWalk = null; if (f) f(); }
      }
      var seen = visNow[e.x + ',' + e.z] !== undefined || visNow[Math.round(e.px) + ',' + Math.round(e.pz)] !== undefined;
      e.obj.visible = !e.eaten && (seen || (e.dead && !!tileState[e.z * W + e.x]));
      if (!e.dead && !e.npc && seen && (CB.on || e.hp < e.max)) {
        var s = toScreen(e.px, e.def.h + 0.32, e.pz); e.bar.style.display = 'block'; e.bar.style.left = s.x + 'px'; e.bar.style.top = s.y + 'px';
        var hs = healthState(e); e.bar.firstChild.style.width = '54px'; e.bar.firstChild.style.background = hs[1]; e.bar.lastChild.textContent = e.name + ' · ' + hs[0];
      } else e.bar.style.display = 'none';
    });
    for (var i = floaters.length - 1; i >= 0; i--) {
      var f = floaters[i]; f.t += dt; var s = toScreen(f.x, f.y + f.t * 0.6, f.z);
      f.el.style.left = s.x + 'px'; f.el.style.top = s.y + 'px'; f.el.style.opacity = Math.max(0, 1 - Math.max(0, f.t - 0.7) / 0.6);
      if (f.t > 1.3) { f.el.remove(); floaters.splice(i, 1); }
    }
    cbRingsUpdate();
  }
  // a monster that can see you, close by, starts the fight
  function cbAggro() {
    if (CB.on || !CB.ready || inSafeRoom(P.x, P.z)) return;
    for (var i = 0; i < CB.enemies.length; i++) {
      var e = CB.enemies[i]; if (e.dead || e.calm || e.def.timid) continue;
      var r = e.guard ? 2 : 3;
      if (visNow[e.x + ',' + e.z] !== undefined && cheb(e.x, e.z, P.x, P.z) <= r) { cbStart('The ' + e.name.replace(/ [ABC]$/, '') + ' spots you.', e); return; }
    }
  }
  // taps on the floor or on a monster during your turn
  var cbRay = new THREE.Raycaster(), cbPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), cbHit = new THREE.Vector3();
  var cbDown = null;
  canvas.addEventListener('pointerdown', function (ev) { cbDown = { x: ev.clientX, y: ev.clientY }; });
  canvas.addEventListener('pointerup', function (ev) {
    if (!CB.on || gearOpen || !cbDown) return; var dn = cbDown; cbDown = null;
    if (Math.abs(ev.clientX - dn.x) + Math.abs(ev.clientY - dn.y) > 14) return; // that was a drag to look around
    for (var i = 0; i < CB.enemies.length; i++) { var e = CB.enemies[i]; if (e.dead || !e.obj.visible) continue; var s = toScreen(e.px, e.def.h * 0.5, e.pz), dx = s.x - ev.clientX, dy = s.y - ev.clientY; if (dx * dx + dy * dy < 46 * 46) { cbTap(e.x, e.z); return; } }
    var r = canvas.getBoundingClientRect();
    cbRay.setFromCamera(new THREE.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), cam);
    if (cbRay.ray.intersectPlane(cbPlane, cbHit)) cbTap(Math.round(cbHit.x), Math.round(cbHit.z));
  });
  // Interact options when you stand next to a monster
  function enemyActs(e) {
    if (e.dead) return [{ label: 'Search the body', loot: true }, { label: 'Examine', text: 'Very dead. ' + (e.looted ? 'Already picked clean.' : 'Its pockets look promising.') }];
    var talk = { label: NET.sample ? 'Talk (say anything)' : 'Talk', talk: true };
    if (e.npc) return [talk,
      { label: 'Examine', text: 'A small imp in a lanyard that says PRODUCTION. Clipboard, headset, nervous smile. Not a threat to anyone, least of all you.' },
      { label: 'Read their mood', stat: 'WIS', dc: 8, win: 'Overworked, underpaid, and quietly rooting for you.', lose: 'Hard to tell under all that sweating.' }];
    return [talk,
      { label: 'Examine', text: examineText(e) },
      { label: 'Study its fighting style', stat: 'INT', skill: ['Lore', 0], dc: 12, win: 'Armor about AC ' + e.def.ac + '. It fights with a ' + e.def.weapon + ' and hits roughly ' + e.def.dmg[0] + 'd' + e.def.dmg[1] + '+' + e.def.dmg[2] + '.', lose: 'It fights like something that wants you dead. That is all you learn.' },
      { label: 'Read its mood', stat: 'WIS', dc: 10, win: e.kind === 'imp' ? 'Bored and paid by the hour. It wants an excuse not to fight.' : 'Hungry, nervous, and showing off for the other one.', lose: 'It stares back. You learn nothing.' },
      { label: 'Talk it down', stat: 'CHA', skill: ['De-escalation', 2], dc: e.kind === 'imp' ? 15 : 12, flag: 'calm', win: 'You tell it "no, man" until it gives up. It sits down and watches you go by.', lose: 'It is not in the mood to be talked to.' },
      { label: 'Play it a bass line', stat: 'CHA', skill: ['Performance', 3], dc: e.kind === 'imp' ? 14 : 11, flag: 'calm', win: 'It sways. Somewhere, viewer numbers tick up. It will not fight you now.', lose: 'It prefers treble.' },
      { label: 'Attack', fight: true }
    ];
  }
