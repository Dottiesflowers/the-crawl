
  // ===================== item effects: what the fields in items.js actually do =====================
  // throw / escape / box / buff / uses / leaves on use; ac, checks, light while carried; crit and onHit on weapons
  // (see gearWeapon); loot rolls weighted by rarity, gated by level, and themed by the room you search.
  var FLOOR = 1;
  function gearHas(fn) { return (CHAR && CHAR.gear || []).some(fn); }
  function itemAC() { // a held skillet, a worn apron...
    var c = CHAR; if (!c) return { v: 0, why: '' }; var w = wieldItem(), v = 0, why = [];
    if (w && w.ac) { v += w.ac; why.push(w.name.toLowerCase()); }
    (c.gear || []).forEach(function (g) { if (g.worn && g.ac) { v += g.ac; why.push(g.name.toLowerCase()); } });
    return { v: v, why: why.join(', ') };
  }
  function itemChecks(skill) { var b = 0; (CHAR && CHAR.gear || []).forEach(function (g) { if (g.checks && g.checks[skill] > b) b = g.checks[skill]; }); return b; }
  function hasLight() { return gearHas(function (g) { return g.light; }); }
  function isThrowable(it) { return !!(it && (it.throw || it.escape)); }
  function isPlant(e) { return /shrub/.test(e.def.base || e.kind || '') || /plant|vine|shrub|fungus|mold/i.test(e.name || ''); }

  // use an item that isn't plain healing: throw it, light the smoke, open the box, take the buff
  function itemSpecial(it) {
    var c = CHAR; if (!c) return false;
    if (it.box) return openBox(it);
    if (it.escape) {
      if (!CB.on) { say(it.name, 'Save it for a fight you need to leave.', 2600); return false; }
      if (!cbMyTurn() || CB.busy || !CB.res.action) { say('Not now', 'That takes your action, on your turn.', 2500); return false; }
      itemSpend(it); say(it.name, 'Thick smoke fills the room. When it clears, you are somewhere else. The audience boos.', 4500);
      CB.order = []; cbEnd(false); return true;
    }
    if (it.throw) return throwItem(it, pickTarget(it));
    if (it.buff) { itemSpend(it); buffOn(it.buff, 10 * 60000); var b = BUFFS[it.buff]; say(it.name, b ? b.name + ': ' + b.desc : 'You feel different.', 3500); return true; }
    return false;
  }
  function pickTarget(it) {
    var best = null, bd = 8; if (CB.on && CB.target && !CB.target.dead) return CB.target;
    CB.enemies.forEach(function (q) { if (q.dead || q.npc || q.calm) return; if (it.throw && it.throw.vs === 'plant' && !isPlant(q)) return; var dd = cheb(P.x, P.z, q.x, q.z); if (dd < bd && los(P.x, P.z, q.x, q.z)) { bd = dd; best = q; } });
    return best;
  }
  function itemSpend(it) {
    if (it.uses) { it.usesLeft = (it.usesLeft === undefined ? it.uses : it.usesLeft) - 1; if (it.usesLeft > 0) { saveChar(CHAR); return; } }
    it.qty = (it.qty || 1) - 1; if (it.qty <= 0) { CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; if ((CHAR.hotbar || []).indexOf(it.name) >= 0 && !CHAR.gear.some(function (g) { return g.name === it.name; })) CHAR.hotbar[CHAR.hotbar.indexOf(it.name)] = null; }
    if (it.leaves) { var lv = item(it.leaves, { from: 'what was left' }); if (lv) invAdd(lv, true); }
    saveChar(CHAR); hotDraw(); if (UI.bag) bagDraw();
  }
  function throwItem(it, e) {
    if (!e) { say('No target', 'Nothing in range to throw that at' + (it.throw.vs === 'plant' ? ' (it only works on plants)' : '') + '.', 2600); return false; }
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.action)) { say('Not now', 'Throwing takes your action, on your turn.', 2500); return false; }
    if (cheb(P.x, P.z, e.x, e.z) > 6) { say('Too far', 'You can throw about 30 feet.', 2400); return false; }
    if (CB.on) CB.res.action = 0;
    var T = it.throw, area = T.area || 0, notes = [], hit = true, R = null;
    if (!area) { // single target: a ranged attack roll
      var bon = PROF() + MOD.DEX + skillLv('Thrown Objects'), ac = acOf(e); R = roll20(false, false); var tot = R.r + bon; hit = R.r === 20 || (R.r !== 1 && tot >= ac);
      diceShow({ who: 'You', vs: e.name, R: R, bonus: bon, tot: tot, ac: ac, hit: hit, why: ['thrown ' + it.name.toLowerCase()] });
    }
    kitOneShot('Punch_Jab'); itemSpend(it); skillCount('throw');
    if (hit) {
      var targets = area ? CB.enemies.filter(function (q) { return !q.dead && !q.npc && cheb(q.x, q.z, e.x, e.z) <= area && (T.vs !== 'plant' || isPlant(q)); }) : [e];
      targets.forEach(function (q) { var n = fxApply(T.fx, q); if (n) notes.push(n); });
    }
    say('Thrown · ' + it.name, hit ? (notes.join(' ') || 'It lands. Nothing much happens.') : 'Missed. It skitters off into the dark.', 5000);
    afterTrick(e); return true;
  }
  function openBox(it) {
    var here = roomInfo(P.x, P.z); if (!here || here.type !== 'safe') { say(it.name, 'Loot boxes only open in a safe room. The System is very firm about this.', 3500); return false; }
    var R = rollContainer(it.box); itemSpend(it);
    lootWindow({ title: it.name, items: R.items, gold: R.gold }); kitOneShot('Interact'); skillCount('box'); return true;
  }

  // ---------- loot rolls: rarer things turn up less, nothing above this floor's level, searches match the room ----------
  function lootWeight(n) { var it = ITEMS[n]; if (!it) return 0; if ((it.level || 1) > FLOOR || (it.until && it.until < FLOOR)) return 0; var r = String(it.rarity || '').toLowerCase(); return it.common ? 1.6 : r === 'uncommon' ? 0.35 : r === 'rare' ? 0.12 : r === 'legendary' ? 0.03 : 1; }
  function lootPick(pool) { var tot = 0, w = pool.map(function (n) { var v = lootWeight(n); tot += v; return v; }); var r = Math.random() * tot; for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; } return pool[pool.length - 1]; }
  function rollLoot(kind, theme) {
    if (kind === 'small' && theme && DROPS.containers['small_' + theme] && Math.random() < 0.75) kind = 'small_' + theme;
    var R = DROPS.containers[kind]; if (!R) return { gold: 0, items: [] };
    var n = R.picks[0] + Math.floor(Math.random() * (R.picks[1] - R.picks[0] + 1)), items = [], seen = {};
    for (var i = 0; i < n * 3 && items.length < n; i++) { var nm = lootPick(R.pool); if (seen[nm] && Math.random() < 0.8) continue; seen[nm] = 1; var x = item(nm, { from: R.from }); if (x) items.push(x); }
    return { gold: diceRoll(R.gold), items: items };
  }
