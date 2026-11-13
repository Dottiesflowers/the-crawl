
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
  // results show inside the jury-rig screen (the normal system message sits behind it)
  function craftSay(kind, title, text) { CRAFT.result = { kind: kind, title: title, text: text, at: Date.now() }; say(title, text, 6000); craftDraw(); }
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
        (CRAFT.busy ? '<div class="cres think"><b>The System is thinking…</b><p>Somewhere, a very large AI squints at your pile of junk.</p></div>' : CRAFT.result ? '<div class="cres ' + CRAFT.result.kind + '" role="status"><b>' + esc(CRAFT.result.title) + '</b><p>' + esc(CRAFT.result.text) + '</p></div>' : '') + '<button type="button" class="go" id="crGo"' + (CRAFT.sel.length >= 2 && !CRAFT.busy ? '' : ' disabled') + '>' + (CRAFT.busy ? 'The System is thinking…' : 'Jury-rig it') + '</button><p class="hint">The System decides if it works, what roll it takes and what you get. Piling on junk does not help; the right parts do. Inventions become recipes the whole SGC can see.</p></div></div>' +
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
  // arrows are fixed recipes (no AI): something wooden for the shafts + something for the tips, exactly two parts
  var ARROWS = [[function (g) { return /imp horn/i.test(g.name); }, 'Horn-tipped arrows', 6], [function (g) { return tg(g, 'metal'); }, 'Scrap-metal arrows', 10], [function (g) { return tg(g, 'stone'); }, 'Stone-tipped arrows', 10],
    [function (g) { return !tg(g, 'wood') && tg(g, 'flammable'); }, 'Pitch arrows', 6], [function (g) { return tg(g, 'wood'); }, 'Wooden arrows', 10]];
  function tg(g, t) { return (g.tags || []).indexOf(t) >= 0; }
  function arrowCraft(sel) {
    if (sel.length !== 2) return false;
    var isArrow = function (g) { var A = ITEMS[g.name] && ITEMS[g.name].ammo; return A && (A.kind || 'arrow') === 'arrow'; };
    var pb = sel.filter(function (g) { return g.name === 'Paintballs'; })[0], tox = sel.filter(function (g) { return g !== pb && tg(g, 'toxic'); })[0];
    if (pb && tox) { var n = Math.min(10, pb.qty || 1); pb.qty = (pb.qty || 1) - n; if (pb.qty <= 0) CHAR.gear.splice(CHAR.gear.indexOf(pb), 1); itemSpend(tox); invAdd(item('Acid paintballs', { qty: n, from: 'your own two hands' }), true); saveChar(CHAR); CRAFT.sel = [];
      craftSay('ok', 'Made ' + n + ' acid paintballs', 'You dosed the paintballs with ' + tox.name.toLowerCase() + '. They are warm now. Do not keep them in a pocket.'); return true; }
    var w = sel.filter(function (g) { return tg(g, 'wood') && !isArrow(g); }); if (!w.length || sel.some(isArrow)) return false;
    var shaft = w[0], tip = sel[0] === shaft ? sel[1] : sel[0], r = ARROWS.filter(function (a) { return a[0](tip); })[0]; if (!r) return false;
    itemSpend(shaft); itemSpend(tip); var made = item(r[1], { qty: r[2], from: 'your own two hands' }); invAdd(made, true); saveChar(CHAR);
    skillUse(trackSkill('physical')); CRAFT.sel = [];
    craftSay('ok', 'Made ' + r[2] + ' ' + r[1].toLowerCase(), 'Shafts from ' + shaft.name.toLowerCase() + ', tips from ' + tip.name.toLowerCase() + '. ' + (ITEMS[r[1]].desc || '').split('. ')[0] + '.');
    return true;
  }
  function craftInvent(idea) {
    if (CRAFT.busy) return; if (CRAFT.sel.length < 2) { craftSay('no', 'Need more parts', 'Pick at least two things to put together.'); return; } var sel = CRAFT.sel.slice(); CRAFT.result = null;
    if (arrowCraft(sel)) return;
    var desc = sel.map(function (g) { return g.name + ' [' + (g.cat || 'misc') + (g.tags && g.tags.length ? '; ' + g.tags.join(', ') : '') + (g.dmg ? '; ' + g.dmg : '') + (g.heal ? '; heals ' + g.heal : '') + ']: ' + (g.desc || ''); }).join('\n');
    if (!NET.sample) { craftApply(craftOffline(sel, idea), sel, idea); return; }
    CRAFT.busy = true; CRAFT.result = null; craftDraw();
    var done = false, to = setTimeout(function () { if (done) return; done = true; CRAFT.busy = false; craftApply(craftOffline(sel, idea), sel, idea); }, 25000); // never leave you hanging
    var prompt = 'You are the System, the AI running a Dungeon Crawler Carl style dungeon on D&D 5e rules. ' + CREW_LORE + '\n\nA crawler wants to jury-rig something from items in their bag. Judge it like a fair, funny DM. Physical builds use the Jury-Rig track (INT); mixtures, potions, poisons and chemistry use the Alchemy track (WIS). ' +
      'Crawler skills: Jury-Rig ' + skillLv('Jury-Rig') + ', Alchemy ' + skillLv('Alchemy') + ', INT mod ' + MOD.INT + ', WIS mod ' + MOD.WIS + '.\n\nItems:\n' + desc + '\n\nWhat they want to make: ' + (idea || '(they did not say; make the most sensible thing)') +
      '\n\nRules: if the combination cannot plausibly make anything, ok=false and say why in comment. Otherwise design ONE item using only these fields. level = how hard it is to BUILD, 1-5: 1 = crude (taping, tying, stuffing, smearing, wrapping, jamming things together: anyone can do it), 2 = takes some know-how (a simple mechanism, careful measuring or mixing), 3 = a real build (springs, triggers, distilling, wiring), 4-5 = proper engineering or advanced alchemy. Be generous with crude builds: if it could physically be done with these parts, ok=true. Set ok=false only if it truly cannot work no matter who builds it. Do not lower the level because the crawler is unskilled; the game checks their skill against the level. Power limits: level 1 = up to 2d6 damage or 1d8 weapon or 2d4 healing; level 2 = up to 3d6, 1d10 weapon, 3d4+2 healing; level 3 = up to 4d6 area 2. ' +
      'Effects a throwable can have (fx types): damage {dice}, burn {dice, turns}, stun {turns}, distract {turns}, prone, push {tiles}, weaken {ac, turns}. Tools like a lighter are usually not consumed; materials are. They may hand you any number of items, duplicates included (two of the same item means they want to use both). Use the parts that make sense, put only those in consumes, and judge the whole idea: more parts can make a sturdier or stronger build, but junk that does not belong adds nothing.' +
      '\nReply with JSON only: {"ok":true,"track":"physical|alchemy","level":1,"name":"short catchy name","desc":"one dry System line","cat":"weapon|consumable|tool","dmg":"1d6 (weapons only)","heal":"2d4 (healing only)","crit":20,"throw":{"fx":[{"type":"damage","dice":"2d6"}],"area":0},"uses":0,"tags":["flammable"],"consumes":["exact item names used up"],"traits_used":["the tags from the item list that made this work, e.g. flammable"],"icon":"one of: stickbomb (a bomb on a stick) spear sword axe knife mace hammer bat bomb potion drink slime sap shield pan tape light tool box","comment":"one short System line"}';
    serverSample([{ role: 'user', content: prompt }], { modelTier: 'complex', maxTokens: 600 }).then(function (r) {
      if (done) return; done = true; clearTimeout(to);
      var j = null; try { j = JSON.parse(r.text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (x) {}
      CRAFT.busy = false; try { craftApply(j || craftOffline(sel, idea), sel, idea); } catch (x) { console.error(x); craftSay('no', 'Something broke', 'The System choked on that one. Try again.'); }
    }).catch(function () { if (done) return; done = true; clearTimeout(to); CRAFT.busy = false; craftApply(craftOffline(sel, idea), sel, idea); });
  }
  // without the AI: a handful of sensible combinations by tag
  function craftOffline(sel, idea) {
    var t = {}; sel.forEach(function (g) { (g.tags || []).forEach(function (x) { t[x] = 1; }); if (/lighter|match/i.test(g.name)) t.fire = 1; });
    var mats = sel.filter(function (g) { return !/lighter/i.test(g.name); }).map(function (g) { return g.name; });
    if (t.fire && t.flammable && t.sticky) return { ok: true, track: 'alchemy', level: 1, dc: 12, why: ['flammable', 'sticky', 'fire'], name: 'Sticky firebomb', desc: 'It clings, it burns, it does not stop burning. The System is impressed and a little worried.', cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '2d6' }, { type: 'burn', dice: '1d6', turns: 3 }], area: 1 }, tags: ['flammable', 'sticky'], consumes: mats };
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
      if (/bomb|grenade|explos|cocktail|molotov|firework|dynamite|blast/i.test(String(j.name || '') + ' ' + (j.tags || []).join(' ')) && !spec.throw.fx.some(function (f) { return f.type === 'damage'; })) spec.throw.fx.unshift({ type: 'damage', dice: lv >= 2 ? '2d6' : '1d6+1' });
      if (!spec.throw.fx.length) delete spec.throw;
    }
    if (+j.uses > 1 && spec.cat === 'tool') spec.uses = Math.min(5, +j.uses);
    return { lv: lv, spec: spec };
  }
  function craftApply(j, sel, idea) {
    if (!j || !j.ok) { craftSay('no', ['That ain\'t gonna work!', 'Nope. Not happening.', 'The System laughs at you.', 'Absolutely not.'][Math.floor(Math.random() * 4)], (j && j.comment) || 'That does not go together.'); return; }
    // no dice: either you can build it or you can't. A level N build needs the track skill at N-1 (level 1 is for anyone)
    var track = j.track === 'alchemy' ? 'alchemy' : 'physical', sk = trackSkill(track), cs = craftSpec(j), need = Math.max(1, Math.min(5, +j.level || 1)), myLv = skillLv(sk);
    var name = String(j.name || 'Contraption').replace(/[^\w '\-+!?]/g, '').slice(0, 40), consumes = (j.consumes || []).filter(function (n) { return sel.some(function (g) { return g.name === n; }); });
    if (!consumes.length) consumes = sel.filter(function (g) { return g.cat === 'material' || g.cat === 'consumable'; }).map(function (g) { return g.name; });
    var known = CHAR.recipes && CHAR.recipes[name] && CHAR.recipes[name].inventor;
    if (!known && myLv < need - 1) {
      skillUse(sk);
      craftSay('fail', 'You\'re not up to the task', 'That would work, but it is a ' + sk + ' ' + need + ' build and you are ' + sk + ' ' + myLv + '. You need ' + sk + ' ' + (need - 1) + '. Build simpler things to get there.' + (j.comment ? ' ' + j.comment : ''));
      CRAFT.sel = []; craftDraw(); return;
    }
    var dc = 0, R = { r: 0 }, b = 0, tot = 0;
    var used = (j.why || j.traits_used || []).map(function (x) { return String(x).toLowerCase(); }); loreLearn(sel.reduce(function (acc, g) { return acc.concat((g.tags || []).filter(function (t) { return used.indexOf(t) >= 0; }).map(function (t) { return [g, t]; })); }, []), 'That is why it worked.');
    consumes.forEach(function (n) { var g = CHAR.gear.filter(function (x) { return x.name === n; })[0]; if (g) itemSpend(g); });
    var made = Object.assign({ name: name, from: 'your own two hands', level: 1, parts: sel.map(function (g) { return g.name; }) }, cs.spec); invAdd(made, true);
    CHAR.recipes = CHAR.recipes || {}; var isNew = !CHAR.recipes[name] && !CRAFT.shared.some(function (r) { return r.name.toLowerCase() === name.toLowerCase(); });
    var rec = { name: name, track: track, level: need, dc: dc, inputs: sel.map(function (g) { return g.name; }), keep: sel.map(function (g) { return g.name; }).filter(function (n) { return consumes.indexOf(n) < 0; }), spec: cs.spec, by: CHAR.name, byUid: NET.uid, inventor: true, idea: idea || '' };
    if (isNew) {
      CHAR.recipes[name] = rec; if (!skillHas(sk)) skillGrant(sk, 'you built something that works'); else for (var i = 0; i < need * 2; i++) skillUse(sk);
      logEvent('Invented ' + name + ' (' + sk + ' ' + need + ')', 'skill');
      if (NET.mode === 'server' && NET.uid) api('recipes', { method: 'POST', body: { recipe: rec } }).then(function (r) { CRAFT.shared = r.value || CRAFT.shared; }).catch(function () {});
      setTimeout(function () { achieve('first_invention', 'Some Assembly Required', 'You built something from garbage and it worked. The System files a patent in its own name.', 25); }, 1500);
    } else skillUse(sk);
    // experience: inventing is worth a lot, making a known recipe a little; both are practice for the track skill
    var xp = isNew ? 30 * need + 10 : 6 * need; grantXP(xp);
    craftSay('ok', (isNew ? 'Invented · ' : 'Made · ') + name, (cs.spec.desc || '') + ' +' + xp + ' XP, and ' + sk + ' practice.' + (isNew ? ' New ' + sk + ' ' + need + ' recipe, shared with the SGC.' : '') + (j.comment ? ' ' + j.comment : ''), 7000);
    CRAFT.sel = []; saveChar(CHAR); craftDraw(); if (UI.bag) bagDraw();
  }
  function craftMake(name) {
    var r = allRecipes().filter(function (x) { return x.name === name; })[0]; if (!r) return; var s = recipeState(r); if (!s.skillOk || !s.have) return;
    var sel = r.inputs.map(function (n) { return CHAR.gear.filter(function (g) { return g.name === n; })[0]; });
    var j = Object.assign({ ok: true, name: r.name, track: r.track, level: r.level, dc: Math.max(6, (r.dc || 10) - 3), consumes: r.inputs.filter(function (n) { return (r.keep || []).indexOf(n) < 0; }) }, r.spec);
    craftApply(j, sel, r.idea);
  }
