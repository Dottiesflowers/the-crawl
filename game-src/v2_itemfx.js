
  // ===================== item effects: what the fields in items.js actually do =====================
  // throw / escape / box / buff / uses / leaves on use; ac, checks, light while carried; crit and onHit on weapons
  // (see gearWeapon); loot rolls weighted by rarity, gated by level, and themed by the room you search.
  // FLOOR (which floor you are on) comes from v2_world.js; loot tables use it
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
    if (it.throw) { aimStart(it, false); return true; }
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
    it.qty = (it.qty || 1) - 1; if (it.qty <= 0) { CHAR.gear.splice(CHAR.gear.indexOf(it), 1); UI.sel = null; if ((CHAR.hotbar || []).indexOf(it.name) >= 0 && !CHAR.gear.some(function (g) { return g.name === it.name; })) CHAR.hotbar[CHAR.hotbar.indexOf(it.name)] = null; if ((CHAR.hotbar2 || []).indexOf(it.name) >= 0 && !CHAR.gear.some(function (g) { return g.name === it.name; })) CHAR.hotbar2[CHAR.hotbar2.indexOf(it.name)] = null; }
    if (it.leaves) { var lv = item(it.leaves, { from: 'what was left' }); if (lv) invAdd(lv, true); }
    saveChar(CHAR); hotDraw(); if (UI.bag) bagDraw();
  }
  function throwItem(it, e, o) {
    o = o || {}; var T = o.T || it.throw, spot = o.spot;
    if (!e && !spot) { say('No target', 'Nothing in range to throw that at' + (T.vs === 'plant' ? ' (it only works on plants)' : '') + '.', 2600); return false; }
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.action)) { say('Not now', 'Throwing takes your action, on your turn.', 2500); return false; }
    var tx = e ? e.x : spot.x, tz = e ? e.z : spot.z, Rg = throwRange();
    if (cheb(P.x, P.z, tx, tz) > Rg.far) { say('Too far', 'You can throw ' + Rg.far * 5 + ' feet at most.', 2400); return false; }
    if (CB.on) CB.res.action = 0;
    var area = T.area || 0, notes = [], hit = true, R = null, dis = !!o.dis;
    if (!area && e) { // single target: a ranged attack roll
      var bon = PROF() + MOD.DEX + skillLv('Thrown Objects'), ac = acOf(e); R = roll20(false, dis); var tot = R.r + bon; hit = R.r === 20 || (R.r !== 1 && tot >= ac);
      diceShow({ who: 'You', vs: e.name, R: R, bonus: bon, tot: tot, ac: ac, hit: hit, why: [(o.lit ? 'lit ' : 'thrown ') + it.name.toLowerCase()].concat(dis ? ['long range: disadvantage'] : []) });
    }
    if (typeof cbFaceHero === 'function') cbFaceHero(tx, tz);
    kitOneShot('Punch_Jab'); var snap = { name: it.name, tags: (it.tags || []).slice(), parts: it.parts, throw: it.throw }; itemSpend(it); skillCount('throw');
    if (CB.on) { CB.busy = true; cbHUD(); }
    // a miss lands a tile or two off target
    var lx = tx, lz = tz; if (!hit) { lx += Math.round((Math.random() - 0.5) * 3); lz += Math.round((Math.random() - 0.5) * 3); }
    setTimeout(function () { vfxThrow(snap, lx, lz, o.lit, function () {
      vfxImpact(snap, lx, lz, T, o.lit);
      if (hit) {
        var targets = area ? CB.enemies.filter(function (q) { return !q.dead && !q.npc && cheb(q.x, q.z, tx, tz) <= area && (T.vs !== 'plant' || isPlant(q)); }) : [e];
        targets.forEach(function (q) { var n = fxApply(T.fx, q); if (n) notes.push(n); });
        if (area && !targets.length) notes.push('It splashes across the floor and hits nothing.');
      }
      var head = (o.lit ? 'Lit and thrown · ' : 'Thrown · ') + snap.name, body = hit ? (notes.join(' ') || 'It lands. Nothing much happens.') : 'Missed. It ' + (o.lit ? 'bursts into flame on the floor, well wide.' : 'splatters on the floor, well wide.');
      if (CB.on) CB.busy = false;
      var woke = e || (area ? CB.enemies.filter(function (q) { return !q.dead && !q.npc && !q.calm && cheb(q.x, q.z, tx, tz) <= area + 2; })[0] : null);
      loreFromThrow(snap); var started = !CB.on; afterTrick(woke);
      // say what happened after any "roll for initiative" so it is not drowned out
      setTimeout(function () { say(head, body, 6500); }, started && CB.on ? 1400 : 0);
    }); }, 240);
    return true;
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

  // ---------- head lamps: wear it, switch it on and off, it drains, swap the batteries ----------
  function isLamp(it) { return !!it && (it.head || /headlamp|head lamp|miner'?s lamp/i.test(it.name || '')); }
  function lampWorn() { return (CHAR && CHAR.gear || []).filter(function (g) { return isLamp(g) && g.worn; })[0] || null; }
  function lampLit() { var l = lampWorn(); return !!(l && l.lit && (l.charge === undefined ? 100 : l.charge) > 0); }
  function batteryItem() { return (CHAR && CHAR.gear || []).filter(function (g) { return (g.tags || []).indexOf('battery') >= 0 || /^AA batteries$/i.test(g.name); })[0] || null; }
  function lampAct(a, it) {
    if (a === 'lampwear') { (CHAR.gear || []).forEach(function (g) { if (isLamp(g)) g.worn = false; }); it.worn = true; if (it.charge === undefined) it.charge = 100; it.lit = it.charge > 0; say('Headlamp on', it.lit ? 'Strapped on and switched on. You see like you are holding a torch, and both hands stay free.' : 'Strapped on, but the batteries are dead.', 3400); }
    if (a === 'lampoff') { it.worn = false; it.lit = false; say('Headlamp off your head', 'Back in the bag.', 2000); }
    if (a === 'lamptog') { if (!it.lit && (it.charge || 0) <= 0) { say('Dead batteries', batteryItem() ? 'Swap in fresh ones first.' : 'You need batteries. Desks and shelves sometimes have them.', 3000); } else { it.lit = !it.lit; say(it.lit ? 'Click. Light.' : 'Click. Dark.', it.lit ? 'Battery ' + it.charge + '%.' : 'Saving the batteries.', 2200); } }
    if (a === 'lampbat') { var b = batteryItem(); if (!b) return; itemSpend(b); it.charge = 100; it.lit = !!it.worn; say('Fresh batteries', 'Full charge. The old ones go in your pocket out of guilt.', 3000); skillCount('jury'); }
    refreshFog(); if (typeof cbSaveChar === 'function') cbSaveChar();
  }
  function lampActs(it) {
    if (!isLamp(it)) return [];
    var out = [it.worn ? ['lampoff', 'Take off'] : ['lampwear', 'Wear on head']];
    if (it.worn) out.push(['lamptog', it.lit ? 'Switch off' : 'Switch on']);
    var b = batteryItem(); if (b && (it.charge === undefined ? 100 : it.charge) < 100) out.push(['lampbat', 'Replace batteries']);
    return out;
  }
  // a lit lamp drains one percent every 30 seconds (about 50 minutes on a set of batteries)
  setInterval(function () {
    var l = lampWorn(); if (!l || !l.lit) return; if (l.charge === undefined) l.charge = 100;
    l.charge = Math.max(0, l.charge - 1);
    if (l.charge === 10) say('Headlamp flickering', 'Battery at 10%. ' + (batteryItem() ? 'You have spares in your bag.' : 'You have no spares.'), 3600);
    if (l.charge === 0) { l.lit = false; say('Headlamp dies', 'The light fades to nothing. ' + (batteryItem() ? 'Swap the batteries in your bag.' : 'You need new batteries.'), 4200); refreshFog(); }
    if (l.charge % 5 === 0 && typeof cbSaveChar === 'function') cbSaveChar();
  }, 30000);

  // ---------- material traits you discover: obvious ones are known, the rest you inspect for or learn by doing ----------
  var LORE_OBVIOUS = { glass: 1, container: 1, paper: 1, sharp: 1, long: 1, heavy: 1, hard: 1, stringy: 1, wet: 1, loud: 1, battery: 1, lever: 1, fire: 1, elastic: 1, spicy: 1 };
  // words in the name or description that give a trait away
  var LORE_HINT = { flammable: /flammab|burns?\b|flame|fuel|lighter fluid|gasoline|kerosene/, sticky: /sticky|tacky|glue|adhesive|tape/, slippery: /slipp|slick|grease|lube|oil\b/, toxic: /poison|toxic|venom|bleach/,
    conductive: /copper|wire|cable|electric/, absorbent: /sponge|towel|absorb|rag\b|paper towel/, binding: /tape|zip tie|cord|rope|strap|bungee/, staining: /stain|permanent|dye/, explosive: /explos|dynamite|firework/ };
  // what you knew before the dungeon: your old job tells you a few things
  var LORE_BG = [[/flor|garden|plant|botan|landscap|nursery/, 'sticky', /sap|resin|vine|plant|shrub/], [/chef|cook|kitchen|restaurant|line cook|baker|bartend/, 'flammable', /grease|oil|fat|lard|alcohol|vodka|rum/],
    [/nurse|doctor|medic|chem|pharm|lab\b|scien/, 'toxic', /./], [/electric|engineer|mechanic|technician|\bit\b|plumb/, 'conductive', /./], [/janitor|clean|custod|housekeep/, 'slippery', /./]];
  function loreBg() { return ((CHAR && CHAR.interview) || []).map(function (x) { return x.a || ''; }).join(' ').toLowerCase(); }
  function loreKnows(it, tag) {
    if (LORE_OBVIOUS[tag]) return true; var n = it.name || '';
    if (CHAR && CHAR.lore && (CHAR.lore[n] || []).indexOf(tag) >= 0) return true;
    var txt = (n + ' ' + (it.desc || '')).toLowerCase(); if (LORE_HINT[tag] && LORE_HINT[tag].test(txt)) return true;
    var bg = loreBg(); return LORE_BG.some(function (r) { return r[1] === tag && r[0].test(bg) && r[2].test(n.toLowerCase()); });
  }
  function loreKnown(it) { return (it.tags || []).filter(function (t) { return loreKnows(it, t); }); }
  function loreHidden(it) { return (it.tags || []).filter(function (t) { return !loreKnows(it, t); }); }
  var LORE_LINE = { flammable: 'You hold it near a spark and it catches, eagerly. Flammable.', toxic: 'A drop on your glove smokes a little. Toxic.', sticky: 'It will not let go of your fingers. Sticky.', slippery: 'It squirts out of your grip twice. Slippery.',
    conductive: 'You touch it to a battery and it sparks. Conductive.', absorbent: 'It drinks a splash of water instantly. Absorbent.', binding: 'It wraps around itself and holds. Good for binding things.', staining: 'Your hands will be this color for a week. Staining.', explosive: 'It hisses when you shake it. Explosive. Stop shaking it.' };
  // learn one or more traits; one popup for the lot
  function loreLearn(list, why) {
    if (!CHAR) return 0; CHAR.lore = CHAR.lore || {}; var got = [];
    list.forEach(function (p) { var it = p[0], tag = p[1]; if (!it || !tag || loreKnows(it, tag)) return; (CHAR.lore[it.name] = CHAR.lore[it.name] || []).push(tag); got.push(it.name + ' is ' + tag); logEvent('Learned that ' + it.name.toLowerCase() + ' is ' + tag, 'lore'); });
    if (got.length) { say('Trait discovered', got.join('. ') + '.' + (why ? ' ' + why : ''), 4600); skillCount('lore'); if (typeof cbSaveChar === 'function') cbSaveChar(); }
    return got.length;
  }
  function loreInspect(it) {
    var hid = loreHidden(it); if (!hid.length) { say('Nothing new', 'You know everything there is to know about the ' + it.name.toLowerCase() + '.', 2600); return; }
    CHAR.cool = CHAR.cool || {}; var k = 'insp:' + it.name, wait = (CHAR.cool[k] || 0) - Date.now();
    if (wait > 0) { say('Give it a minute', 'You just looked at it. Try again in ' + Math.ceil(wait / 1000) + ' seconds, or learn by using it.', 2800); return; }
    var R = roll20(false, false), b = MOD.INT + skillLv('Alchemy') + skillLv('Material Sense'), tot = R.r + b, dc = 11, ok = R.r === 20 || (R.r !== 1 && tot >= dc);
    if (!ok) { CHAR.cool[k] = Date.now() + 120000; say('Inspect · ' + it.name, 'INT + Alchemy: d20 ' + R.r + ' + ' + b + ' = ' + tot + ' vs DC ' + dc + '. You poke it, sniff it and learn nothing. Try again in two minutes.', 4200); if (typeof cbSaveChar === 'function') cbSaveChar(); return; }
    var tag = hid[Math.floor(Math.random() * hid.length)]; skillUse('Alchemy');
    loreLearn([[it, tag]], ''); say('Inspect · ' + it.name, 'd20 ' + R.r + ' + ' + b + ' = ' + tot + '. ' + (LORE_LINE[tag] || 'It turns out to be ' + tag + '.') + (hid.length > 1 ? ' There is more to it.' : ''), 5200);
  }
  // throwing something shows what it does
  function loreFromThrow(it) {
    var fx = ((it.throw && it.throw.fx) || []).map(function (f) { return f.type; }), show = { flammable: fx.indexOf('burn') >= 0, explosive: (it.throw && it.throw.area > 0), slippery: fx.indexOf('prone') >= 0, sticky: fx.indexOf('prone') >= 0 || fx.indexOf('weaken') >= 0, toxic: fx.indexOf('weaken') >= 0 || fx.indexOf('damage') >= 0 };
    loreLearn(loreHidden(it).filter(function (t) { return show[t]; }).map(function (t) { return [it, t]; }), 'You saw it happen.');
  }
  function loreLine(it) {
    if (!(it.tags || []).length) return ''; var k = loreKnown(it), h = loreHidden(it).length;
    return '<p class="traits"><b>Traits:</b> ' + (k.length ? k.map(esc).join(', ') : '<i>none known</i>') + (h ? ' <span class="unk">· ' + h + ' unknown</span>' : '') + '</p>';
  }
