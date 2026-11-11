
  // ===================== Harvest and Jury-rigging: materials from bodies, inventions from your bag =====================
  // Recipes carry a required level in their track (Jury-Rig for physical builds, Alchemy for mixtures). Inventing one
  // gives XP in that track. The inventor can always make their own recipe; the rest of the SGC can see it but needs the
  // level. Recipes are shared through the server (/api/recipes).
  var HARVEST = { rat: 'Rat tail', puglin: 'Puglin grease', bog: 'Bog slime', shrub: 'Shrub sap', imp: 'Imp horn', clerk: 'Clerk ink' };
  function harvestOf(e) { var b = e.def.base || e.kind || ''; if (/shrub/.test(b)) b = 'shrub'; return HARVEST[b] || null; }
  function harvest(e) {
    var mat = harvestOf(e); if (!e || !e.dead || !mat) return;
    if (e.harvested) { say('Picked clean', 'There is nothing useful left on it.', 2500); return; }
    if (e.eaten) { say('Too late', 'The shrubs got there first.', 2500); return; }
    e.harvested = true; var blade = gearHas(function (g) { return (g.tags || []).indexOf('sharp') >= 0 || /knife|shear|cutter|cleaver/i.test(g.name); });
    var R = roll20(blade, false), b = MOD.DEX + skillLv('Butchery'), tot = R.r + b, n = tot >= 15 ? 2 : tot >= 8 ? 1 : 0;
    kitOneShot('PickUp_Table'); skillCount('harvest');
    if (!n) { say('Harvest · ' + e.name, 'd20 ' + R.r + ' + ' + b + ' = ' + tot + '. You make a mess of it. Nothing worth keeping.' + (blade ? '' : ' A blade would help.'), 4500); worldSave(); return; }
    for (var i = 0; i < n; i++) { var it = item(mat, { from: 'harvested from ' + e.name }); if (it) invAdd(it, true); }
    say('Harvest · ' + e.name, 'd20 ' + R.r + ' + ' + b + ' = ' + tot + (blade ? ' (with a blade: advantage)' : '') + '. You get ' + n + ' × ' + mat.toLowerCase() + '. ' + (ITEMS[mat] && ITEMS[mat].desc || ''), 5000);
    worldSave(); if (UI.bag) bagDraw();
  }

  // ---------- the Combine screen ----------
  var CRAFT = { open: false, sel: [], busy: false, shared: [], q: '', cat: 'all', idea: '' };
  function craftLoadShared() { if (NET.mode === 'server' && NET.uid) api('recipes').then(function (j) { CRAFT.shared = j.value || []; if (CRAFT.open) craftDraw(); }).catch(function () {}); }
  function craftToggle() {
    CRAFT.open = !CRAFT.open; var el = document.getElementById('craft');
    if (!el) { el = document.createElement('div'); el.id = 'craft'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Jury-rig'); document.body.appendChild(el); }
    el.classList.toggle('on', CRAFT.open); if (CRAFT.open) { CRAFT.sel = []; craftLoadShared(); craftDraw(); }
  }
  function trackSkill(t) { return t === 'alchemy' ? 'Alchemy' : 'Jury-Rig'; }
  function craftItems() { return (CHAR && CHAR.gear || []).filter(function (g) { return !g.worn && g.cat !== 'body' && g.name !== CHAR.wield; }); }
  function allRecipes() {
    var mine = CHAR && CHAR.recipes || {}, out = {}; CRAFT.shared.forEach(function (r) { out[r.name] = r; }); Object.keys(mine).forEach(function (k) { out[k] = mine[k]; }); return Object.keys(out).map(function (k) { return out[k]; });
  }
  function recipeState(r) {
    var mine = r.by === (CHAR && CHAR.name) && r.byUid === NET.uid || (CHAR && CHAR.recipes && CHAR.recipes[r.name] && CHAR.recipes[r.name].inventor), lv = skillLv(trackSkill(r.track));
    var have = (r.inputs || []).every(function (n) { return CHAR.gear.some(function (g) { return g.name === n; }); });
    return { mine: !!mine, skillOk: mine || lv >= r.level, have: have };
  }
  function craftDraw() {
    var el = document.getElementById('craft'); if (!el || !CRAFT.open) return; var items = craftItems(), q = CRAFT.q.toLowerCase();
    var ideaEl = document.getElementById('crIdea'); if (ideaEl) CRAFT.idea = ideaEl.value;
    CRAFT.sel = CRAFT.sel.filter(function (g) { return items.indexOf(g) >= 0; });
    // same as the inventory: search, filter by kind, identical things stack
    var groups = {}, glist = [];
    items.forEach(function (g) { if ((CRAFT.cat !== 'all' && g.cat !== CRAFT.cat) || (q && (g.name + ' ' + (g.desc || '') + ' ' + (g.tags || []).join(' ')).toLowerCase().indexOf(q) < 0)) return;
      var k = g.name; if (!groups[k]) { groups[k] = { it: g, all: [] }; glist.push(groups[k]); } groups[k].all.push(g); });
    var cats = CATS.filter(function (c) { return c[0] === 'all' || items.some(function (g) { return g.cat === c[0]; }); });
    var recs = allRecipes().map(function (r) { var s = recipeState(r); return '<div class="rc' + (s.skillOk && s.have ? '' : ' off') + '"><div><b>' + esc(r.name) + '</b> <small>' + esc(trackSkill(r.track)) + ' ' + r.level + (s.mine ? ' · yours' : r.by ? ' · by ' + esc(r.by) : '') + '</small><span>' + esc((r.inputs || []).join(' + ')) + '</span></div>' +
      '<button type="button" class="ccBtn" data-make="' + esc(r.name) + '"' + (s.skillOk && s.have ? '' : ' disabled') + '>' + (!s.skillOk ? 'Needs ' + trackSkill(r.track) + ' ' + r.level : !s.have ? 'Missing items' : 'Make') + '</button></div>'; }).join('');
    el.innerHTML = '<header><b>Jury-rig</b><span>Jury-Rig ' + skillLv('Jury-Rig') + ' · Alchemy ' + skillLv('Alchemy') + '</span><button type="button" class="xbtn" id="crBag">Inventory</button><button type="button" class="xbtn" id="crX">Close</button></header>' +
      '<div class="cb"><div class="cpick">' +
        '<div class="ctools"><input id="crQ" type="search" placeholder="Search your bag (name, or a tag like flammable)" aria-label="Search items" value="' + esc(CRAFT.q) + '">' +
        cats.map(function (c) { return '<button type="button" class="chip2' + (CRAFT.cat === c[0] ? ' on' : '') + '" data-ccat="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        '<div class="cgrid">' + (glist.length ? glist.map(function (o, i) { var n = o.all.filter(function (g) { return CRAFT.sel.indexOf(g) >= 0; }).length, left = o.all.length - n;
          return '<button type="button" class="' + (n ? 'on' : '') + '" data-cg="' + i + '"' + (left ? '' : ' disabled') + '>' + itemIcon(o.it) + '<span>' + esc(o.it.name) + '</span>' + ((o.it.tags || []).length ? '<i>' + (loreKnown(o.it).length ? esc(loreKnown(o.it).slice(0, 2).join(', ')) : '') + (loreHidden(o.it).length ? (loreKnown(o.it).length ? ' ' : '') + '?' : '') + '</i>' : '') + (o.all.length > 1 ? '<b class="qn">×' + left + '</b>' : '') + '</button>'; }).join('') : '<p class="hint">Nothing matches.</p>') + '</div>' +
        '<div class="cbottom"><label for="crIdea">What are you trying to make?</label><input id="crIdea" type="text" maxlength="160" placeholder="e.g. a sticky firebomb, a spear, something that heals" value="' + esc(CRAFT.idea) + '">' +
        '<div class="csel"><h3>Selected items <small>' + CRAFT.sel.length + '</small></h3>' + (CRAFT.sel.length ? CRAFT.sel.map(function (g, i) { return '<button type="button" class="cs" data-un="' + i + '" aria-label="Remove ' + esc(g.name) + '">' + itemIcon(g) + '<span>' + esc(g.name) + '</span><b aria-hidden="true">×</b></button>'; }).join('') : '<p class="hint">Tap items above to add them. Use as many as your idea needs.</p>') + '</div>' +
        '<button type="button" class="go" id="crGo"' + (CRAFT.sel.length >= 2 && !CRAFT.busy ? '' : ' disabled') + '>' + (CRAFT.busy ? 'The System is thinking…' : 'Jury-rig it') + '</button><p class="hint">The System decides if it works, what roll it takes and what you get. Piling on junk does not help; the right parts do. Inventions become recipes the whole SGC can see.</p></div></div>' +
      '<div class="crec"><h3>Recipes</h3>' + (recs || '<p class="hint">None yet. Invent something.</p>') + '</div></div>';
    document.getElementById('crX').onclick = craftToggle;
    document.getElementById('crBag').onclick = function () { craftToggle(); bagToggle(); };
    var qi = document.getElementById('crQ');
    qi.oninput = function () { CRAFT.q = qi.value; var pos = qi.selectionStart; craftDraw(); var n = document.getElementById('crQ'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} };
    qi.addEventListener('keydown', function (ev) { ev.stopPropagation(); }); document.getElementById('crIdea').addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    el.querySelectorAll('[data-ccat]').forEach(function (b) { b.onclick = function () { CRAFT.cat = b.dataset.ccat; craftDraw(); }; });
    el.querySelectorAll('[data-cg]').forEach(function (b) { b.onclick = function () { var o = glist[+b.dataset.cg], g = o.all.filter(function (x) { return CRAFT.sel.indexOf(x) < 0; })[0];
      if (!g) return; CRAFT.sel.push(g); craftDraw(); }; });
    el.querySelectorAll('[data-un]').forEach(function (b) { b.onclick = function () { CRAFT.sel.splice(+b.dataset.un, 1); craftDraw(); }; });
    el.querySelectorAll('[data-make]').forEach(function (b) { b.onclick = function () { craftMake(b.dataset.make); }; });
    document.getElementById('crGo').onclick = function () { CRAFT.idea = document.getElementById('crIdea').value.trim(); craftInvent(CRAFT.idea); };
  }

  // ---------- inventing ----------
  function craftInvent(idea) {
    if (CRAFT.busy || CRAFT.sel.length < 2) return; var sel = CRAFT.sel.slice();
    var desc = sel.map(function (g) { return g.name + ' [' + (g.cat || 'misc') + (g.tags && g.tags.length ? '; ' + g.tags.join(', ') : '') + (g.dmg ? '; ' + g.dmg : '') + (g.heal ? '; heals ' + g.heal : '') + ']: ' + (g.desc || ''); }).join('\n');
    if (!NET.sample) { craftApply(craftOffline(sel, idea), sel, idea); return; }
    CRAFT.busy = true; craftDraw();
    var prompt = 'You are the System, the AI running a Dungeon Crawler Carl style dungeon on D&D 5e rules. ' + CREW_LORE + '\n\nA crawler wants to jury-rig something from items in their bag. Judge it like a fair, funny DM. Physical builds use the Jury-Rig track (INT); mixtures, potions, poisons and chemistry use the Alchemy track (WIS). ' +
      'Crawler skills: Jury-Rig ' + skillLv('Jury-Rig') + ', Alchemy ' + skillLv('Alchemy') + ', INT mod ' + MOD.INT + ', WIS mod ' + MOD.WIS + '.\n\nItems:\n' + desc + '\n\nWhat they want to make: ' + (idea || '(they did not say; make the most sensible thing)') +
      '\n\nRules: if the combination cannot plausibly make anything, ok=false and say why in comment. Otherwise design ONE item using only these fields. Recipe level 1-3 by complexity and power. Power limits: level 1 = up to 2d6 damage or 1d8 weapon or 2d4 healing; level 2 = up to 3d6, 1d10 weapon, 3d4+2 healing; level 3 = up to 4d6 area 2. ' +
      'Effects a throwable can have (fx types): damage {dice}, burn {dice, turns}, stun {turns}, distract {turns}, prone, push {tiles}, weaken {ac, turns}. Tools like a lighter are usually not consumed; materials are. They may hand you any number of items, duplicates included (two of the same item means they want to use both). Use the parts that make sense, put only those in consumes, and judge the whole idea: more parts can make a sturdier or stronger build, but junk that does not belong adds nothing. DC 8-18.' +
      '\nReply with JSON only: {"ok":true,"track":"physical|alchemy","level":1,"dc":10,"name":"short catchy name","desc":"one dry System line","cat":"weapon|consumable|tool","dmg":"1d6 (weapons only)","heal":"2d4 (healing only)","crit":20,"throw":{"fx":[{"type":"damage","dice":"2d6"}],"area":0},"uses":0,"tags":["flammable"],"consumes":["exact item names used up"],"traits_used":["the tags from the item list that made this work, e.g. flammable"],"icon":"one of: stickbomb (a bomb on a stick) spear sword axe knife mace hammer bat bomb potion drink slime sap shield pan tape light tool box","comment":"one short System line"}';
    serverSample([{ role: 'user', content: prompt }], { modelTier: 'complex', maxTokens: 600 }).then(function (r) {
      var j = null; try { j = JSON.parse(r.text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (x) {}
      CRAFT.busy = false; craftApply(j || craftOffline(sel, idea), sel, idea);
    }).catch(function () { CRAFT.busy = false; craftApply(craftOffline(sel, idea), sel, idea); });
  }
  // without the AI: a handful of sensible combinations by tag
  function craftOffline(sel, idea) {
    var t = {}; sel.forEach(function (g) { (g.tags || []).forEach(function (x) { t[x] = 1; }); if (/lighter|match/i.test(g.name)) t.fire = 1; });
    var mats = sel.filter(function (g) { return !/lighter/i.test(g.name); }).map(function (g) { return g.name; });
    if (t.fire && t.flammable && t.sticky) return { ok: true, track: 'alchemy', level: 2, dc: 12, why: ['flammable', 'sticky', 'fire'], name: 'Sticky firebomb', desc: 'It clings, it burns, it does not stop burning. The System is impressed and a little worried.', cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '2d6' }, { type: 'burn', dice: '1d6', turns: 3 }], area: 1 }, tags: ['flammable', 'sticky'], consumes: mats };
    if (t.fire && t.flammable && (t.glass || t.container || t.paper)) return { ok: true, track: 'alchemy', level: 1, dc: 10, why: ['flammable', 'glass', 'container', 'paper'], name: 'Dungeon cocktail', desc: 'A bottle, a rag, a bad idea.', cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '2d6' }, { type: 'burn', dice: '1d4', turns: 2 }] }, tags: ['flammable'], consumes: mats };
    if (t.sharp && t.long && (t.binding || t.sticky)) return { ok: true, track: 'physical', level: 1, dc: 10, why: ['sharp', 'long', 'binding', 'sticky'], name: 'Taped spear', desc: 'A blade, a stick and an unreasonable amount of tape.', cat: 'weapon', dmg: '1d8', tags: ['long', 'sharp'], consumes: sel.map(function (g) { return g.name; }) };
    if (t.heavy && (t.binding || t.sticky)) return { ok: true, track: 'physical', level: 1, dc: 9, why: ['heavy', 'binding', 'sticky'], name: 'Strapped bludgeon', desc: 'Heavy thing, firmly attached to a handle-ish thing.', cat: 'weapon', dmg: '1d8', tags: ['heavy'], consumes: sel.map(function (g) { return g.name; }) };
    if (t.sticky || t.slippery) return { ok: true, track: 'alchemy', level: 1, dc: 9, why: ['sticky', 'slippery'], name: 'Goo trap', desc: 'Throw it under something and watch it try to walk.', cat: 'consumable', throw: { fx: [{ type: 'prone' }, { type: 'weaken', ac: 1, turns: 2 }] }, tags: ['sticky'], consumes: mats };
    var heals = sel.filter(function (g) { return g.heal; }); if (heals.length >= 2) return { ok: true, track: 'alchemy', level: 1, dc: 8, name: 'Questionable tonic', desc: 'Everything medical in your bag, shaken together.', cat: 'consumable', heal: '2d4+1', consumes: heals.map(function (g) { return g.name; }) };
    return { ok: false, comment: 'Nothing about these goes together. The System suggests: tags. Look at what things are made of.' };
  }
  function clampDice(s, maxN, maxS) { var m = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(String(s || '').replace(/\s/g, '')); if (!m) return null; return Math.min(+m[1], maxN) + 'd' + Math.min(+m[2], maxS) + (m[3] ? '+' + Math.min(+m[3], 6) : ''); }
  function craftSpec(j) { // keep only fields the engine runs, within this floor's limits
    var lv = Math.max(1, Math.min(3, +j.level || 1)), spec = { cat: /^(weapon|consumable|tool)$/.test(j.cat) ? j.cat : 'consumable', desc: String(j.desc || '').slice(0, 200), tags: (j.tags || []).slice(0, 4).map(String), crafted: true };
    var ik = { stickbomb: 1, spear: 1, sword: 1, axe: 1, knife: 1, mace: 1, hammer: 1, bat: 1, bomb: 1, potion: 1, drink: 1, slime: 1, sap: 1, shield: 1, pan: 1, tape: 1, light: 1, wrench: 1, box: 1 }, ic = String(j.icon || '').toLowerCase().replace('tool', 'wrench'); if (ik[ic]) spec.icon = ic;
    if (spec.cat === 'weapon') { spec.dmg = clampDice(j.dmg, 1, lv === 1 ? 8 : lv === 2 ? 10 : 12) || '1d6'; if (+j.crit >= 18 && +j.crit < 20) spec.crit = Math.max(19, +j.crit); }
    if (j.heal) spec.heal = clampDice(j.heal, lv + 1, 4) || null; if (!spec.heal) delete spec.heal;
    if (j.throw && j.throw.fx) {
      var ok = { damage: 1, burn: 1, stun: 1, distract: 1, prone: 1, push: 1, weaken: 1 };
      spec.throw = { fx: j.throw.fx.filter(function (f) { return f && ok[f.type]; }).slice(0, 3).map(function (f) { var o = { type: f.type }; if (f.dice) o.dice = clampDice(f.dice, lv + 1, 6) || '1d6'; if (f.turns) o.turns = Math.min(3, +f.turns || 1); if (f.tiles) o.tiles = Math.min(3, +f.tiles || 1); if (f.ac) o.ac = Math.min(2, +f.ac || 1); return o; }), area: Math.min(lv >= 3 ? 2 : 1, +j.throw.area || 0) };
      if (!spec.throw.fx.length) delete spec.throw;
    }
    if (+j.uses > 1 && spec.cat === 'tool') spec.uses = Math.min(5, +j.uses);
    return { lv: lv, spec: spec };
  }
  function craftApply(j, sel, idea) {
    if (!j || !j.ok) { say('Jury-rig · no', (j && j.comment) || 'That does not go together.', 5000); craftDraw(); return; }
    var track = j.track === 'alchemy' ? 'alchemy' : 'physical', sk = trackSkill(track), cs = craftSpec(j), dc = Math.max(8, Math.min(18, +j.dc || 10));
    var stat = track === 'alchemy' ? 'WIS' : 'INT', R = roll20(false, false), b = MOD[stat] + skillLv(sk) + itemChecks(sk), tot = R.r + b, ok = R.r === 20 || (R.r !== 1 && tot >= dc);
    var name = String(j.name || 'Contraption').replace(/[^\w '\-+!?]/g, '').slice(0, 40), consumes = (j.consumes || []).filter(function (n) { return sel.some(function (g) { return g.name === n; }); });
    if (!consumes.length) consumes = sel.filter(function (g) { return g.cat === 'material' || g.cat === 'consumable'; }).map(function (g) { return g.name; });
    if (!ok) {
      if (R.r === 1 && consumes.length) { var lost = CHAR.gear.filter(function (g) { return g.name === consumes[0]; })[0]; if (lost) itemSpend(lost); }
      say('Jury-rig · it fails', 'd20 ' + R.r + ' + ' + b + ' = ' + tot + ' vs DC ' + dc + '. ' + (R.r === 1 ? 'It falls apart in your hands and takes the ' + consumes[0].toLowerCase() + ' with it.' : 'Close, but it will not hold. Your materials are fine.') + (j.comment ? ' ' + j.comment : ''), 6000);
      skillUse(sk); CRAFT.sel = []; craftDraw(); return;
    }
    var used = (j.why || j.traits_used || []).map(function (x) { return String(x).toLowerCase(); }); loreLearn(sel.reduce(function (acc, g) { return acc.concat((g.tags || []).filter(function (t) { return used.indexOf(t) >= 0; }).map(function (t) { return [g, t]; })); }, []), 'That is why it worked.');
    consumes.forEach(function (n) { var g = CHAR.gear.filter(function (x) { return x.name === n; })[0]; if (g) itemSpend(g); });
    var made = Object.assign({ name: name, from: 'your own two hands', level: 1, parts: sel.map(function (g) { return g.name; }) }, cs.spec); invAdd(made, true);
    CHAR.recipes = CHAR.recipes || {}; var isNew = !CHAR.recipes[name] && !CRAFT.shared.some(function (r) { return r.name.toLowerCase() === name.toLowerCase(); });
    var rec = { name: name, track: track, level: cs.lv, dc: dc, inputs: sel.map(function (g) { return g.name; }), keep: sel.map(function (g) { return g.name; }).filter(function (n) { return consumes.indexOf(n) < 0; }), spec: cs.spec, by: CHAR.name, byUid: NET.uid, inventor: true, idea: idea || '' };
    if (isNew) {
      CHAR.recipes[name] = rec; if (!skillHas(sk)) skillGrant(sk, 'you built something that works'); else for (var i = 0; i < cs.lv * 2; i++) skillUse(sk);
      logEvent('Invented ' + name + ' (' + sk + ' ' + cs.lv + ')', 'skill');
      if (NET.mode === 'server' && NET.uid) api('recipes', { method: 'POST', body: { recipe: rec } }).then(function (r) { CRAFT.shared = r.value || CRAFT.shared; }).catch(function () {});
      setTimeout(function () { achieve('first_invention', 'Some Assembly Required', 'You built something from garbage and it worked. The System files a patent in its own name.', 25); }, 1500);
    } else skillUse(sk);
    say((isNew ? 'Invented · ' : 'Made · ') + name, 'd20 ' + R.r + ' + ' + b + ' = ' + tot + ' vs DC ' + dc + '. ' + (cs.spec.desc || '') + (isNew ? ' New ' + sk + ' ' + cs.lv + ' recipe, shared with the SGC.' : '') + (j.comment ? ' ' + j.comment : ''), 7000);
    CRAFT.sel = []; saveChar(CHAR); craftDraw(); if (UI.bag) bagDraw();
  }
  function craftMake(name) {
    var r = allRecipes().filter(function (x) { return x.name === name; })[0]; if (!r) return; var s = recipeState(r); if (!s.skillOk || !s.have) return;
    var sel = r.inputs.map(function (n) { return CHAR.gear.filter(function (g) { return g.name === n; })[0]; });
    var j = Object.assign({ ok: true, name: r.name, track: r.track, level: r.level, dc: Math.max(6, (r.dc || 10) - 3), consumes: r.inputs.filter(function (n) { return (r.keep || []).indexOf(n) < 0; }) }, r.spec);
    craftApply(j, sel, r.idea);
  }
