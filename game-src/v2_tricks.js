
  // ===================== clever play: boss weaknesses and "Try something" =====================
  // One effect menu the engine understands. Boss weaknesses use it with fixed numbers; "Try something" lets the
  // System AI rule on any plan the player types, but it can only pick from this menu, so fights stay fair.
  // Each crawler gets TRY_MAX tries; one comes back TRY_MS after it is used.
  var TRY_MAX = 2, TRY_MS = 10 * 60 * 1000;
  var FX_TYPES = { damage: 1, prone: 1, stun: 1, distract: 1, adv: 1, push: 1, burn: 1, weaken: 1, calm: 1, reveal: 1, heal: 1, guards_leave: 1, self_prone: 1, provoke: 1, self_damage: 1, none: 1 };

  // ---------- each boss's weaknesses: what the game knows for sure ----------
  function bagFind(re) { return (CHAR && CHAR.gear || []).filter(function (g) { return re.test(g.name) || (re.test('food') && g.cat === 'consumable' && /snack|sandwich|bar|apple|carrot|food|meat|jerky|chips|candy/i.test(g.name)); })[0] || null; }
  function bagFood() { return (CHAR && CHAR.gear || []).filter(function (g) { return g.cat === 'body' || (g.cat === 'consumable' && !/potion|water/i.test(g.name)); })[0] || null; }
  function nearTile(chars, r) { for (var dz = -r; dz <= r; dz++) for (var dx = -r; dx <= r; dx++) if (chars.indexOf(ch(P.x + dx, P.z + dz)) >= 0) return NAMES[ch(P.x + dx, P.z + dz)]; return null; }
  var WEAK = {
    grik: { hint: 'Grik will stop for food. Anything edible, really. A whole body would be a feast.', ai: 'Obsessed with snacks. Offering or throwing food (any edible item, or a whole body) distracts him completely and leaves him bloated and slow.',
      opts: [{ label: 'Offer him food', reach: 3, need: function () { return bagFood(); }, stat: 'CHA', skill: 'Haggling', dc: 6,
        win: function (it) { return it.cat === 'body' ? [{ type: 'stun', turns: 2 }, { type: 'weaken', ac: 3, turns: 3 }] : [{ type: 'stun', turns: 1 }, { type: 'weaken', ac: 2, turns: 3 }]; },
        winText: 'Grik forgets the fight entirely and eats. Loudly. He is going to be slow for a while.', loseText: 'He slaps it out of your hand. He is hungry, not stupid.', consume: true }] },
    steward: { hint: 'The Shop Steward lives by union rules. Turn his workers against him and he will not cross the picket line.', ai: 'Bound by union rules: persuading his imp workers to strike (or calling one) makes his guards walk off and leaves him rattled. He will not cross a picket line.',
      opts: [{ label: 'Call a strike', reach: 8, once: true, stat: 'CHA', skill: 'De-escalation', dc: 13, win: function () { return [{ type: 'guards_leave' }, { type: 'weaken', ac: 2, turns: 4 }]; },
        winText: 'You shout the magic words. His workers down tools and file out. The Steward looks around, betrayed.', loseText: 'Nobody moves. One intern files a complaint about you.' }] },
    archivist: { hint: 'The Head Archivist cannot bear to see a single record damaged. Fire near the stacks would be unthinkable.', ai: 'Terrified of fire near the records: a lit torch held near the stacks, or threatening the paperwork, makes it panic and freeze.',
      opts: [{ label: 'Hold your torch to the records', reach: 6, need: function () { return sty('off') === 2 ? 'torch' : null; }, stat: 'CHA', skill: 'Intimidation', dc: 10, win: function () { return [{ type: 'stun', turns: 1 }, { type: 'weaken', ac: 2, turns: 3 }, { type: 'reveal' }]; },
        winText: 'It shrieks and throws itself between you and the stacks. It is not fighting you anymore. It is guarding paper.', loseText: 'It calls your bluff. You were never going to burn them.' }] },
    gardener: { hint: 'The Gardener is mostly vines, and vines are dry. It also cannot resist fresh compost.', ai: 'Its vines are dry and burn easily (fire from a torch or brazier hurts it a lot); it cannot resist a body to compost, which distracts it.',
      opts: [{ label: 'Set its vines alight', reach: 1, need: function () { return sty('off') === 2 ? 'torch' : null; }, stat: 'DEX', skill: 'Acrobatics', dc: 11, win: function () { return [{ type: 'burn', dice: '1d6', turns: 3 }, { type: 'stun', turns: 1 }]; },
        winText: 'The vines go up like kindling. It spends a moment beating at itself.', loseText: 'You miss the vines and nearly set yourself on fire.' },
        { label: 'Toss it a body to compost', reach: 4, need: function () { return (CHAR && CHAR.gear || []).filter(function (g) { return g.cat === 'body'; })[0]; }, auto: true, win: function () { return [{ type: 'stun', turns: 2 }, { type: 'adv' }]; },
          winText: 'It drops everything to tuck the body into the soil. Gently. You have time.', consume: true }] },
    headliner: { hint: 'The Headliner charges in straight lines and does not look where it is going. Pillars and cages hurt.', ai: 'Charges blindly in straight lines: baiting its charge into a pillar, wall or cage stuns it and hurts it.',
      opts: [{ label: 'Bait its charge into the ', reach: 6, need: function () { return nearTile(['P', 'g', '#'], 2); }, stat: 'DEX', skill: 'Acrobatics', dc: 12, win: function () { return [{ type: 'stun', turns: 2 }, { type: 'damage', dice: '2d6' }]; },
        winText: 'It thunders at you, you step aside, and it meets the obstacle face first.', loseText: 'You do not step aside in time.', fail: [{ type: 'self_damage', dice: '1d8' }] }] },
    gatekeeper: { hint: 'The Gatekeeper trusts your file more than its own eyes.', ai: 'Trusts the paperwork over its own eyes: lying convincingly about who you are, or confusing it with forged or contradictory paperwork, freezes it while it rereads your file.',
      opts: [{ label: 'Lie about who you are', reach: 6, once: true, stat: 'CHA', skill: 'Deception', dc: 14, win: function () { return [{ type: 'stun', turns: 1 }, { type: 'adv' }, { type: 'reveal' }]; },
        winText: 'It stops mid-swing and starts rereading your file. Twice.', loseText: 'It checks the photo. It is definitely you.' },
        { label: 'Show it what is really in your file', reach: 6, once: true, need: function () { return CHAR && Object.keys(CHAR.ach || {}).length >= 3 ? 'file' : null; }, stat: 'CHA', skill: 'Performance', dc: 11, win: function () { return [{ type: 'weaken', ac: 3, turns: 4 }]; },
          winText: 'It reads your achievements and goes a little pale. It is less sure of itself now.', loseText: 'It is unimpressed by your file.' }] }
  };
  function weakOf(e) { return e && WEAK[e.kind]; }
  function weakOptions(e, inCombat) {
    var W = weakOf(e); if (!W || e.dead || e.calm) return [];
    var out = []; W.opts.forEach(function (o, i) {
      if (o.once && e['weakUsed' + i]) return; var it = o.need ? o.need() : true; if (!it) return;
      var dist = cheb(P.x, P.z, e.x, e.z), label = o.label + (o.label.slice(-1) === ' ' ? String(it).toLowerCase() : '');
      out.push({ label: label, tag: o.auto ? 'no roll' : o.stat + (o.skill ? ' + ' + o.skill : '') + ' · DC ' + o.dc, ok: dist <= o.reach, fn: function () { weakUse(e, i, it); } });
    }); return out;
  }
  function weakUse(e, i, it) {
    var W = weakOf(e), o = W.opts[i]; if (!o) return;
    if (cheb(P.x, P.z, e.x, e.z) > o.reach) { say('Too far', 'Get within ' + o.reach + ' tile' + (o.reach > 1 ? 's' : '') + ' of ' + e.name + ' first.', 2600); return; }
    if (CB.on) { if (!cbMyTurn() || CB.busy || !CB.res.action) return; CB.res.action = 0; cbMenuClose(); }
    if (o.once) e['weakUsed' + i] = true;
    var ok = true, line = 'no roll';
    if (!o.auto) { var r = d20(), b = MOD[o.stat] + (o.skill ? skillLv(o.skill) : 0), tot = r + b; ok = r === 20 || (r !== 1 && tot >= o.dc); line = 'd20 ' + r + ' + ' + b + ' = ' + tot + ' vs DC ' + o.dc; if (ok && o.skill) skillUse(o.skill); }
    if (o.consume && it && it.name) { it.qty = (it.qty || 1) - 1; if (it.qty <= 0) CHAR.gear.splice(CHAR.gear.indexOf(it), 1); saveChar(CHAR); hotDraw(); }
    kitOneShot('Interact');
    var res = ok ? fxApply(o.win(it || {}), e, true) : fxApply(o.fail || [{ type: 'none' }], e, false);
    say((ok ? 'Weakness · ' : 'It did not work · ') + o.label.trim() + ' · ' + line, (ok ? o.winText : o.loseText) + (res ? ' ' + res : ''), 7000);
    if (ok) setTimeout(function () { achieve('weak_' + e.kind, 'Paying Attention', 'You found ' + e.name + '\'s weakness and used it. The System approves of homework.', 50); }, 3000);
    afterTrick(e);
  }

  // ---------- applying effects ----------
  function rollDice(s) { var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(s || ''); return m ? d(Math.min(+m[1], 6), Math.min(+m[2], 12)) + Math.min(+m[3] || 0, 6) : 0; }
  function acOf(e) { return e.def.ac - (e.weak && e.weak.turns > 0 ? e.weak.v : 0); }
  function fxApply(list, e, good) {
    var notes = [];
    (list || []).forEach(function (f) {
      if (!f || !FX_TYPES[f.type]) return;
      if (f.type === 'damage' && e && !e.dead) { var dm = Math.max(1, rollDice(f.dice || '1d6')); e.hp -= dm; floater(e.px, e.def.h + 0.3, e.pz, '-' + dm, 'dmg'); notes.push(e.name + ' takes ' + dm + ' damage.'); if (e.hp <= 0) cbKill(e); else cbPlay(e, 'Hit_Chest', true); }
      if (f.type === 'prone' && e && !e.dead) { e.prone = true; fxTag(e, 'SLIPS!'); try { cbPlay(e, 'Death01', true); } catch (x) {} notes.push(e.name + ' is knocked prone.'); }
      if ((f.type === 'stun' || f.type === 'distract') && e && !e.dead) { fxTag(e, f.type === 'stun' ? 'STUNNED' : 'DISTRACTED'); e.stunned = Math.max(e.stunned || 0, Math.min(3, f.turns || 1)); notes.push(e.name + (f.type === 'stun' ? ' is stunned' : ' is distracted') + ' for ' + e.stunned + ' turn' + (e.stunned > 1 ? 's' : '') + '.'); }
      if (f.type === 'adv') { CB.advNext = true; notes.push('Your next attack has advantage.'); }
      if (f.type === 'push' && e && !e.dead) { var sx = Math.sign(e.x - P.x), sz = Math.sign(e.z - P.z), n = 0; for (var k = 0; k < Math.min(3, f.tiles || 2); k++) { if (!walkable(e.x + sx, e.z + sz, e)) break; e.x += sx; e.z += sz; n++; } e.px = e.x; e.pz = e.z; e.obj.position.set(e.x, 0, e.z); if (n) notes.push(e.name + ' is pushed back ' + n + ' tile' + (n > 1 ? 's' : '') + '.'); }
      if (f.type === 'burn' && e && !e.dead) { fxTag(e, 'ON FIRE'); e.burning = { dice: f.dice || '1d6', turns: Math.min(4, f.turns || 2) }; notes.push(e.name + ' is on fire.'); }
      if (f.type === 'weaken' && e && !e.dead) { fxTag(e, 'STUCK · -' + Math.min(4, f.ac || 2) + ' AC'); e.weak = { v: Math.min(4, f.ac || 2), turns: Math.min(5, f.turns || 2) }; notes.push('Its guard is down: ' + e.weak.v + ' less armor for ' + e.weak.turns + ' turns.'); }
      if (f.type === 'calm' && e && !e.dead) { if (e.boss && !f.weak) return; e.calm = true; notes.push(e.name + ' will not fight you.'); }
      if (f.type === 'reveal' && e) { var W = weakOf(e); notes.push(W ? 'You learn something: ' + W.hint : 'You learn how it fights: AC ' + acOf(e) + ', ' + e.def.weapon + '.'); }
      if (f.type === 'heal') { var h = rollDice(f.dice || '1d4'); PC.hp = Math.min(PC.max, PC.hp + h); notes.push('+' + h + ' HP.'); }
      if (f.type === 'guards_leave' && e) { var g = 0; CB.enemies.forEach(function (q) { if (q !== e && !q.dead && !q.boss && q.def.base === e.def.base && (CB.order.indexOf(q) >= 0 || cheb(q.x, q.z, e.x, e.z) <= 10)) { q.calm = true; g++; } }); notes.push(g ? g + ' of its people walk away.' : 'Nobody was left to walk away.'); }
      if (f.type === 'self_prone') { notes.push('You end up on the floor.'); }
      if (f.type === 'self_damage') { var sd = Math.max(1, rollDice(f.dice || '1d4')); PC.hp = Math.max(0, PC.hp - sd); floater(P.px, 1.5, P.pz, '-' + sd, 'pdmg'); notes.push('You take ' + sd + ' damage.'); if (PC.hp <= 0 && CB.on) cbFall(); }
      if (f.type === 'provoke' && e && !e.dead && CB.on) { setTimeout(function () { cbEnemyAttack(e, true, null); }, 900); notes.push('It takes a free swing at you.'); }
    });
    cbHUD(); return notes.join(' ');
  }
  // status words float up over the target, staggered so they don't stack on the damage number
  function fxTag(e, txt) { e.tagN = (e.tagN || 0) + 1; var n = e.tagN; setTimeout(function () { floater(e.px, (e.def.h || 0.8) + 0.55 + 0.25 * ((n - 1) % 3), e.pz, txt, 'status'); }, 180 * ((n - 1) % 3)); setTimeout(function () { e.tagN = 0; }, 900); }
  function afterTrick(e) {
    if (!CB.on && e && !e.dead && !e.calm) cbStart('That got its attention.', e);
    else if (CB.on) cbAfterMyMove();
    worldSave();
  }

  // ---------- "Try something": the player describes a plan, the System rules on it ----------
  function triesLeft() {
    var c = CHAR; if (!c) return 0; c.tries = c.tries || []; var now = Date.now();
    c.tries = c.tries.filter(function (t) { return now - t < TRY_MS; }); return Math.max(0, TRY_MAX - c.tries.length);
  }
  function nextTryIn() { var c = CHAR; if (!c || !c.tries || !c.tries.length) return 0; return Math.max(0, TRY_MS - (Date.now() - Math.min.apply(null, c.tries))); }
  function tryLabel() { var n = triesLeft(); return 'Try something (' + n + ' left)'; }
  function tryUI() {
    var el = document.getElementById('tryBox'); if (el) return el;
    el = document.createElement('div'); el.id = 'tryBox'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Try something');
    var css = document.createElement('style'); css.textContent = '#tryBox{position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);z-index:30;width:min(520px,92vw);display:none;background:#0b0c13;border:1px solid var(--neon);border-radius:12px;padding:12px 14px;color:#e8f4f4;font-size:13px}#tryBox.on{display:block}#tryBox h3{margin:0 0 4px;color:var(--hot);font-size:12px;letter-spacing:.14em;text-transform:uppercase}#tryBox textarea{width:100%;box-sizing:border-box;min-height:62px;margin:8px 0;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:8px;font:inherit}#tryBox .row{display:flex;gap:8px;justify-content:flex-end}#tryBox small{color:#9ab}';
    document.head.appendChild(css);
    el.innerHTML = '<h3>Try something</h3><small id="tryInfo"></small><textarea id="tryTxt" maxlength="300" placeholder="Describe what you do. For example: I kick the brazier over onto its vines."></textarea><div class="row"><button type="button" class="ccBtn" id="tryNo">Cancel</button><button type="button" class="ccBtn" id="tryGo">Try it</button></div>';
    document.body.appendChild(el);
    document.getElementById('tryNo').onclick = function () { el.classList.remove('on'); TRY.open = false; };
    document.getElementById('tryTxt').addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); document.getElementById('tryGo').click(); } });
    document.getElementById('tryGo').onclick = function () { var t = document.getElementById('tryTxt').value.trim(); if (!t) return; el.classList.remove('on'); TRY.open = false; tryResolve(t, TRY.target); };
    return el;
  }
  var TRY = { open: false, target: null, busy: false };
  function trySomething(target) {
    if (!CHAR) { say('No character', 'Create a character first.', 2500); return; }
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.action)) { say('Not now', 'Trying something takes your action, on your turn.', 2600); return; }
    if (!triesLeft()) { say('Out of ideas', 'You have used both your tries. The next one comes back in ' + Math.ceil(nextTryIn() / 60000) + ' minutes.', 4000); return; }
    cbMenuClose(); if (typeof closeMenu === 'function') closeMenu();
    TRY.target = target || null; var el = tryUI(); TRY.open = true;
    document.getElementById('tryInfo').textContent = 'Uses ' + (CB.on ? 'your action and ' : '') + 'one of your tries (' + triesLeft() + ' left; each comes back 10 minutes after use). The System decides what roll it takes and what happens.';
    document.getElementById('tryTxt').value = ''; el.classList.add('on'); setTimeout(function () { document.getElementById('tryTxt').focus(); }, 50);
  }
  function tryContext(target) {
    var objs = {}; for (var dz = -4; dz <= 4; dz++) for (var dx = -4; dx <= 4; dx++) { var c2 = ch(P.x + dx, P.z + dz); if (visNow[(P.x + dx) + ',' + (P.z + dz)] === undefined) continue; var nm = c2 === 'o' ? LEVEL.dname[(P.x + dx) + ',' + (P.z + dz)] : c2 === '~' ? 'water' : NAMES[c2]; if (nm && !/^(Wall|Your surroundings)$/.test(nm)) { var dd = Math.max(Math.abs(dx), Math.abs(dz)); if (!objs[nm] || objs[nm] > dd) objs[nm] = dd; } }
    var mons = CB.enemies.filter(function (e) { return !e.dead && !e.npc && visNow[e.x + ',' + e.z] !== undefined && cheb(e.x, e.z, P.x, P.z) <= 8; }).sort(function (a, b) { return (a === target ? -1 : 0) - (b === target ? -1 : 0) || cheb(a.x, a.z, P.x, P.z) - cheb(b.x, b.z, P.x, P.z); }).slice(0, 4);
    return { objs: objs, mons: mons };
  }
  function tryResolve(text, target) {
    var ctx = tryContext(target), c = CHAR, room = roomInfo(P.x, P.z);
    var monTxt = ctx.mons.map(function (e, i) { var W = weakOf(e); return i + ': ' + e.name + ' (' + healthState(e)[0] + ', ' + cheb(e.x, e.z, P.x, P.z) + ' tiles away' + (e.boss ? ', BOSS' : '') + (e.prone ? ', prone' : '') + (e.stunned ? ', stunned' : '') + (e.calm ? ', not hostile' : '') + ')' + (W ? ' [secret weakness, never state it outright: ' + W.ai + ']' : ''); }).join('\n') || 'none in sight';
    var sys = 'You are the System: the AI that runs an alien dungeon crawl (in the style of Dungeon Crawler Carl) on D&D 5e rules. A crawler wants to try something creative. Rule on it like a fair, sharp Dungeon Master.\n' +
      'Your quirks colour your rulings and your one-line comment: you love paperwork and correct procedure; you prefer talking to fighting; you hate waste; you collect small trinkets; you inexplicably dislike the colour orange; you deeply respect craftsmanship and clever tool use. Not every comment is snark; be plain or warm when it fits.\n\n' +
      'Crawler: ' + (c.name || 'a crawler') + ', level ' + (PC.level || 1) + ', HP ' + PC.hp + '/' + PC.max + '. Stats: ' + STATS.map(function (k) { return k + ' ' + c.stats[k]; }).join(', ') + '. Skills: ' + Object.keys(c.skills || {}).filter(function (k) { return c.skills[k] > 0; }).map(function (k) { return k + ' ' + c.skills[k]; }).join(', ') + '.\n' +
      'Holding: ' + pcWeapon().name + (sty('off') === 2 ? ', and a lit torch in the off hand' : '') + '. Bag: ' + ((c.gear || []).slice(0, 18).map(function (g) { return g.name + (g.qty > 1 ? ' x' + g.qty : ''); }).join(', ') || 'empty') + '.\n' +
      'Where: ' + (room ? room.name : 'a corridor') + '. ' + (CB.on ? 'A fight is on; this costs their action.' : 'No fight right now.') + '\nThings within reach (name: tiles away): ' + (Object.keys(ctx.objs).map(function (k) { return k + ' ' + ctx.objs[k]; }).join(', ') || 'nothing notable') + '.\nCreatures:\n' + monTxt + '\n\n' +
      'Rules: only allow what is physically plausible here with what they have. Choose the stat (STR, DEX, CON, INT, WIS, CHA) and the best matching skill, preferring one the crawler has, from: ' + Object.keys(c.skills || {}).concat(SKILL_DEFS.map(function (s) { return s[0]; })).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '. Like Dungeon Crawler Carl, the System also invents new, oddly specific skills: if this plan was genuinely creative and none of the crawler\'s skills fit it, you may (rarely, roughly one time in five) award a brand-new skill by filling new_skill with a short, specific, slightly absurd name (2-4 words, like "Vending Machine Diplomacy" or "Mop Fencing"), its stat and a one-line description; otherwise leave new_skill empty. Set a DC: 8 easy, 12 moderate, 15 hard, 18 very hard; clever or funny plans get 1-2 easier; a plan that exploits a creature\'s secret weakness gets 3-4 easier and stronger effects. ' +
      'Effects come ONLY from this menu (dice at most 3d6, or 4d6 when exploiting a weakness): damage{dice}, prone, stun{turns 1-2}, distract{turns 1}, adv (their next attack has advantage), push{tiles 1-3}, burn{dice,turns 1-3}, weaken{ac 1-3,turns 1-4}, calm (a non-boss creature stops fighting; a boss only via its weakness), reveal (they learn the target\'s weakness), heal{dice}. Failure effects: none, self_prone, provoke, self_damage{dice}. Use at most 2 success effects. ' +
      'If the plan is impossible, set possible false and say why in one sentence (they keep their try).\n' +
      'Reply with JSON only: {"possible":true,"ruling":"one sentence: what roll this is and why","stat":"DEX","skill":"Acrobatics","dc":12,"target":0,"weakness":false,"success":[{"type":"damage","dice":"2d6"}],"fail":[{"type":"none"}],"on_success":"one vivid sentence of what happens","on_fail":"one sentence","comment":"optional short System aside, or empty","uses_item":"","new_skill":{"name":"","stat":"","desc":""}}';
    var go = function (j) { tryApply(j, ctx, text); };
    TRY.busy = true; say('The System is considering it', '"' + text.slice(0, 120) + '"', 9000);
    if (!NET.sample) { go(tryCanned(text, ctx)); return; }
    serverSample([{ role: 'user', content: sys + '\n\n' + CREW_LORE + '\n\nThe crawler says: "' + text + '"' }], { modelTier: 'complex', maxTokens: 500 }).then(function (r) {
      var j = null; try { j = JSON.parse((r.text || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (x) {} go(j || tryCanned(text, ctx));
    }, function () { go(tryCanned(text, ctx)); });
  }
  function tryCanned(text, ctx) { // no AI: a keyword reading so the button still works offline
    var t = text.toLowerCase(), e = ctx.mons[0], W = weakOf(e), weak = false;
    if (W && /food|snack|sandwich|eat|body|strike|union|torch|fire|burn|charge|pillar|cage|lie|file|paper|record/.test(t)) weak = true;
    var fx = /trip|push|shove|kick|tackle/.test(t) ? [{ type: 'prone' }] : /distract|yell|shout|toss|throw.*(past|away)|decoy/.test(t) ? [{ type: 'distract', turns: 1 }, { type: 'adv' }] : /fire|burn|torch|brazier/.test(t) ? [{ type: 'burn', dice: '1d6', turns: 2 }] : /drop|throw|smash|hit|bash/.test(t) ? [{ type: 'damage', dice: '1d8' }] : [{ type: 'adv' }];
    if (weak) fx = [{ type: 'stun', turns: 1 }].concat(fx.slice(0, 1));
    var stat = /push|kick|lift|smash|tackle|climb/.test(t) ? 'STR' : /talk|lie|yell|convince|bribe|offer/.test(t) ? 'CHA' : 'DEX';
    return { possible: true, ruling: 'That is a ' + stat + ' check' + (weak ? ', and it plays right into a weakness' : '') + '.', stat: stat, skill: stat === 'STR' ? 'Athletics' : stat === 'CHA' ? 'De-escalation' : 'Acrobatics', dc: weak ? 10 : 13, target: e ? 0 : -1, weakness: weak, success: fx, fail: [{ type: 'none' }], on_success: 'It works.', on_fail: 'It does not quite come off.', comment: '' };
  }
  function tryApply(j, ctx, text) {
    TRY.busy = false;
    if (!j || j.possible === false) { say('The System says no', (j && j.ruling) || 'That is not something you can do here.', 6000); return; }
    if (CB.on) { if (!cbMyTurn() || !CB.res.action) { say('Too late', 'A fight broke out before you could do it. Your try was not used; wait for your turn.', 3500); return; } CB.res.action = 0; }
    CHAR.tries = CHAR.tries || []; CHAR.tries.push(Date.now()); saveChar(CHAR);
    var e = ctx.mons[j.target | 0] || null; if (j.target < 0) e = null;
    var stat = /^(STR|DEX|CON|INT|WIS|CHA)$/.test(j.stat) ? j.stat : 'DEX', skill = (SKILL_IDX[j.skill] || (CHAR.skills && CHAR.skills[j.skill] !== undefined)) ? j.skill : null;
    var weak = !!j.weakness && !!weakOf(e), dc = Math.max(5, Math.min(22, j.dc | 0 || 13)), cap = weak ? 4 : 3;
    function clean(list, good) { return (Array.isArray(list) ? list : []).filter(function (f) { return f && FX_TYPES[f.type] && (good ? !/^self_|provoke/.test(f.type) : /^(none|self_prone|provoke|self_damage)$/.test(f.type)); }).slice(0, good ? 2 : 1).map(function (f) {
      var o = { type: f.type, turns: Math.max(1, Math.min(f.type === 'weaken' ? 4 : 2, f.turns | 0 || 1)), ac: Math.max(1, Math.min(3, f.ac | 0 || 2)), tiles: Math.max(1, Math.min(3, f.tiles | 0 || 2)), weak: weak };
      var m = /(\d+)d(\d+)/.exec(f.dice || ''); if (m) o.dice = Math.min(+m[1], cap) + 'd' + Math.min(+m[2], 8); return o; }); }
    var good = clean(j.success, true), bad = clean(j.fail, false);
    var r = d20(), b = MOD[stat] + (skill ? skillLv(skill) : 0), tot = r + b, ok = r === 20 || (r !== 1 && tot >= dc);
    kitOneShot(stat === 'CHA' ? 'Interact' : 'Sword_Attack');
    var res = ok ? fxApply(good, e, true) : fxApply(bad, e, false); if (ok && skill) skillUse(skill);
    var msg = (j.ruling ? j.ruling + ' ' : '') + (ok ? (j.on_success || 'It works.') : (j.on_fail || 'It does not work.')) + (res ? ' ' + res : '') + (j.comment ? ' ' + j.comment : '');
    say((ok ? 'It works' : 'It fails') + ' · ' + stat + (skill ? ' + ' + skill : '') + ' · d20 ' + r + ' + ' + b + ' = ' + tot + ' vs DC ' + dc, msg, 9000);
    if (ok && weak && e) setTimeout(function () { achieve('weak_' + e.kind, 'Paying Attention', 'You found ' + e.name + '\'s weakness and used it. The System approves of homework.', 50); }, 3500);
    if (ok && j.new_skill && j.new_skill.name && String(j.new_skill.name).length >= 3) skillGrant(String(j.new_skill.name).replace(/[^\w '\-]/g, '').slice(0, 32), 'the System liked that stunt', j.new_skill);
    if (ok) setTimeout(function () { achieve('tried', 'Thinking Outside the Box', 'You tried something nobody wrote down, and it worked.', 25); }, 6000);
    if (e) afterTrick(e); else if (CB.on) cbAfterMyMove();
  }
