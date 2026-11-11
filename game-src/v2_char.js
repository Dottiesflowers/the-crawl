
  // ===================== character creation: interview, 27-point buy, skills, trait and flaw =====================
  // Saved per player: on this device, and in the shared campaign save (db) when the page can reach it.
  var STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'], STAT_NAMES = { STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma' };
  var BUY = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }, BUDGET = 27, SKILL_BUDGET = 13;
  // DCC-style skills: they level with use (later); each level adds +1 to rolls that use it
  var SKILLS = [
    ['Athletics', 'STR', 'Shove, grapple, climb, swim'], ['Brawling', 'STR', 'Fists, headbutts, bar fights'], ['Acrobatics', 'DEX', 'Balance, tumbling, slipping free'],
    ['Stealth', 'DEX', 'Hide, sneak, palm things'], ['Lockpicking', 'DEX', 'Locks, traps, loot boxes'], ['Jury-Rig', 'INT', 'Fix or bodge anything with what is lying around'],
    ['Road-Worn', 'CON', 'Endurance: long walks, bad food, no sleep'], ['Getaway', 'DEX', 'Running away, fast'], ['Pathfinding', 'WIS', 'Directions, maps, never getting lost'],
    ['Perception', 'WIS', 'Noticing things before they notice you'], ['First Aid', 'WIS', 'Patching people up'], ['Cooking', 'WIS', 'Turning dungeon things into food'],
    ['Investigation', 'INT', 'Searching, deducing, reading the room'], ['Appraisal', 'INT', 'What loot is worth'], ['Lore', 'INT', 'Knowing things about monsters and places'],
    ['De-escalation', 'CHA', 'Talking people (and monsters) down'], ['Performance', 'CHA', 'Music, showmanship, playing to the cameras'], ['Haggling', 'CHA', 'Prices, deals, sponsors'],
    ['Intimidation', 'CHA', 'Making things back off'], ['Deception', 'CHA', 'Lying convincingly']
  ];
  var TRAITS = [['Living Map', 'Your explored map never dims and you reveal a wider area.'], ['Tough', '+2 maximum HP.'], ['Lucky', 'Once per fight, reroll a d20 you hate (coming soon).'],
    ['Silver Tongue', '+2 to Charisma checks that talk someone into or out of something.'], ['Quick Hands', 'Drinking a potion never costs your bonus action (coming soon).'], ['Crowd Favorite', 'Sponsors notice you first (coming soon).']];
  var FLAWS = [['Curse of Knowledge', 'Your Help action gives allies no bonus.'], ['Loudmouth', '-2 to Stealth.'], ['Distractible', '-2 to initiative.'],
    ['Bad Back', '-2 to Athletics contests (shove, grapple).'], ['Night Blind', 'You see one tile less in the dark (coming soon).'], ['Big Spender', 'Loot boxes cost you more (coming soon).']];
  var QUESTIONS = [
    'Short bio: who are you? Age, where you live, your build, anything the aliens should know at a glance.',
    'Work history: what jobs have you had, and what did you actually do in them day to day?',
    'What do you do now, and what are you responsible for?',
    'Big life moments: emergencies, fights, disasters, wins, things that changed you. What happened and what did you do?',
    'Interests, hobbies and practical skills. What can you actually do with your hands or your mouth?',
    'How do you define yourself? And be honest: what are your worst habits or weaknesses?',
    'You were grabbed without warning in the middle of a normal day. What is on you or within reach? (tools, keys, bag, work gear)',
    'What are you wearing right now? Head to toe, colors included. That is what you will be wearing in the dungeon.'
  ];
  var MICHAEL = { name: 'Michael', stats: { STR: 10, DEX: 12, CON: 13, INT: 12, WIS: 14, CHA: 13 }, skills: { Pathfinding: 3, Performance: 3, 'Jury-Rig': 2, 'De-escalation': 2, 'Road-Worn': 2, Getaway: 1 },
    trait: 'Living Map', flaw: 'Curse of Knowledge', interview: [], xp: 0, preset: true };
  var CHAR = null;
  function skillLv(n) { var c = CHAR || MICHAEL; return c.skills && c.skills[n] ? c.skills[n] : 0; }
  function hasTrait(n) { var c = CHAR || MICHAEL; return c.trait === n || c.flaw === n || c.traitFx === n || c.flawFx === n; }
  function chkBonus(a) { var b = MOD[a.stat] + (a.skill ? skillLv(a.skill[0]) : 0); if (a.stat === 'CHA' && hasTrait('Silver Tongue') && a.skill && /De-escalation|Haggling|Deception/.test(a.skill[0])) b += 2; return b; }
  function buyCost(st) { return STATS.reduce(function (s, k) { return s + BUY[st[k]]; }, 0); }
  function applyChar(c) {
    CHAR = c; STATS.forEach(function (k) { MOD[k] = Math.floor((c.stats[k] - 10) / 2); });
    // crawlers start tougher than a 5e level 1: the show wants you alive for a while
    PC.xp = c.xp || 0; PC.level = Math.max(c.level || 1, levelFor(PC.xp)); c.level = PC.level; PC.max = maxHPFor(c, PC.level); PC.hp = PC.max;
    if (typeof cbHUD === 'function') cbHUD();
    if (typeof posRestore === 'function' && typeof P !== 'undefined' && P) setTimeout(posRestore, 0);
    setTimeout(handsFromGear, 0); setTimeout(deadCheck, 300);
    if (!c.potionsGiven && !c.preset) { c.potionsGiven = true; c.gear = c.gear || []; DROPS.sources.starting.forEach(function (s) { var it = item(s[0], { qty: s[1], from: 'the System' }); if (it) c.gear.push(it); }); }
    setTimeout(function () { if (typeof hotAuto === 'function') { hotAuto(); if (typeof wsetDraw === "function") setTimeout(wsetDraw, 0); hotDraw(); } }, 50);
  }
  // your hands and back only show what you actually own: no free swords, shields or bass guitars
  function handsFromGear() {
    var c = CHAR; if (!c || c.preset || c.freeWardrobe || typeof look === 'undefined') return;
    var names = (c.gear || []).map(function (g) { return (g.name || '').toLowerCase(); }).join(' | '), has = function (re) { return re.test(names); }, before = JSON.stringify([look.main, look.off, look.back]);
    if (look.main && look.main[0] && !c.wield) look.main = [0, look.main[1]];
    if (c.back && !(c.gear || []).some(function (g) { return g.name === c.back; })) c.back = null;
    if (look.off && look.off[0]) { var o = look.off[0]; if ((o === 1 && !has(/shield/)) || (o === 2 && !c.torch) || (o === 3 && !has(/dagger|knife/))) look.off = [0, look.off[1]]; }
    if (look.back && look.back[0]) { var b = look.back[0]; if ((b === 1 && !has(/backpack|bag|pack\b/)) || (b === 2 && !has(/quiver/)) || (b === 3 && !has(/guitar|bass/))) look.back = [0, look.back[1]]; }
    if (JSON.stringify([look.main, look.off, look.back]) !== before) { if (typeof buildHero === 'function') buildHero(); if (typeof saveLook === 'function') saveLook(); }
  }
  function cbSaveChar() { if (!CHAR) return; CHAR.xp = PC.xp || 0; CHAR.level = PC.level || 1; saveChar(CHAR); }
  // ---------- experience, levels, achievements and skills that grow with use ----------
  // Monster XP is shared: everyone inside a fight's reach gets the full amount (party play will hand it to each
  // crawler there). Achievements and discoveries are personal. Talking a monster down counts as beating it.
  var XP_LEVELS = [0, 300, 900, 2200, 5000, 9000, 14000, 20000];
  function levelFor(xp) { var l = 1; while (l < XP_LEVELS.length && xp >= XP_LEVELS[l]) l++; return l; }
  function nextLevelXP() { return XP_LEVELS[Math.min(XP_LEVELS.length - 1, PC.level || 1)]; }
  function PROF() { return (PC.level || 1) >= 5 ? 3 : 2; }
  function maxHPFor(c, lvl) { return 16 + MOD.CON + (c.trait === 'Tough' || c.traitFx === 'Tough' ? 3 : 0) + (lvl - 1) * Math.max(1, 5 + MOD.CON); }
  function grantXP(n) {
    if (!n) return; PC.xp = (PC.xp || 0) + n;
    if (typeof floater === 'function' && typeof P !== 'undefined') floater(P.px, 2.0, P.pz, '+' + n + ' XP', 'xp');
    var nl = levelFor(PC.xp), ups = 0; while ((PC.level || 1) < nl) { levelUp(++ups); }
    cbSaveChar(); if (typeof cbHUD === 'function') cbHUD();
  }
  function levelUp(k) {
    var c = CHAR || MICHAEL, was = PC.max; PC.level = (PC.level || 1) + 1; c.level = PC.level; logEvent('Reached level ' + PC.level, 'level');
    PC.max = maxHPFor(c, PC.level); PC.hp = Math.min(PC.max, PC.hp + (PC.max - was));
    c.skillPts = (c.skillPts || 0) + 1; var stat = PC.level % 2 === 0; if (stat) c.statPts = (c.statPts || 0) + 1; c.gold = (c.gold || 0) + 10 * PC.level;
    var extra = PC.level === 3 ? ' Class selection has unlocked (the choice itself is coming soon).' : PC.level === 5 ? ' Your proficiency bonus is now +3.' : '';
    setTimeout(function () { say('LEVEL UP · Level ' + PC.level, 'Level up. +' + (PC.max - was) + ' max HP, +1 skill point' + (stat ? ', +1 stat point' : '') + ' and ' + (10 * PC.level) + ' gold from the sponsors.' + extra + ' Spend your points on the Sheet tab.', 7500); }, 2600 * k);
  }
  function achieve(id, title, text, xp) {
    var c = CHAR; if (!c) return; c.ach = c.ach || {}; if (c.ach[id]) return; c.ach[id] = Date.now(); logEvent('Achievement: ' + title, 'ach');
    say('New achievement: ' + title, text + (xp ? ' +' + xp + ' XP.' : ''), 5500); if (xp) grantXP(xp); else cbSaveChar();
  }
  function overcome(e) { // a monster beaten without killing it
    if (!e || e.counted || e.npc || CB.on) return; e.counted = true; grantXP(e.def.xp); skillCount('talkdown'); logEvent('Talked ' + e.name + ' out of a fight', 'talk');
    achieve('talker', 'Use Your Words', 'You talked a monster out of a fight. The System finds this personally refreshing.', 50);
  }
  function skillUse(name) { // every success with a skill is practice; enough practice and it levels up on its own
    var c = CHAR; if (!c || !name) return; c.skillXP = c.skillXP || {}; var lv = c.skills[name] || 0; if (lv >= 10) return;
    c.skillXP[name] = (c.skillXP[name] || 0) + 1;
    if (c.skillXP[name] >= (lv + 1) * 3) { c.skillXP[name] = 0; c.skills[name] = lv + 1; logEvent(name + ' reached level ' + (lv + 1), 'skill'); cbSaveChar(); setTimeout(function () { say('Skill up · ' + name + ' ' + (lv + 1), 'Practice pays. ' + name + ' now adds +' + (lv + 1) + ' to the rolls that use it.', 4500); }, 2600); }
  }
  // re-dress an existing character from what they said they were wearing, without making a new one
  function redress() {
    var c = CHAR; if (!c) { say('No character', 'Create a character first.', 3000); return; }
    if (NET.live) { say('Locked', 'The campaign is live. You wear what you brought and what you find.', 3500); return; }
    var qa = (c.interview || []).filter(function (x) { return /wearing/i.test(x.q || ''); })[0];
    var txt = window.prompt('What were you wearing when they took you? Head to toe, colors included.', qa && qa.a ? qa.a : '');
    if (txt === null || !txt.trim()) return; txt = txt.trim().slice(0, 600);
    if (qa) qa.a = txt; else (c.interview = c.interview || []).push({ q: QUESTIONS[QUESTIONS.length - 1], a: txt });
    say('The System is dressing you', 'Matching what you described to the wardrobe department\'s stock...', 6000);
    function apply(outfit, how) {
      if (!outfit.length) outfit = outfitLocal(txt); c.gear = c.gear || [];
      c.gear.forEach(function (g) { if (g.cat === 'clothing') g.worn = false; });
      CLOTH_SLOTS.forEach(function (k) { var s = slotDef(k); if (s && s.styles[0] === 'None') look[k] = [0, look[k] ? look[k][1] : 0]; });
      outfit.forEach(function (it) { it.from = 'home'; c.gear.push(it); wear(it); });
      saveChar(c); if (gearOpen) drawRows();
      say('Dressed by the System', 'You are wearing: ' + outfit.map(function (o) { return o.name; }).join(', ') + '. Your old clothes are in your bag.' + (how ? ' ' + how : ''), 7000);
    }
    if (!NET.sample) { apply(outfitLocal(txt), '(Picked by keywords; with the AI connected it reads your description properly.)'); return; }
    var prompt = 'Dress a crawler in a dungeon game from what they said they were wearing in real life. Pick the closest item for each slot from this catalog (use exact style names and a color index from that style\'s list; skip slots they did not mention):\n' + outfitCatalog() +
      '\n\nThey said: "' + txt + '"\nTheir name: ' + (c.name || '') + '. About them: ' + (c.interview || []).slice(0, 3).map(function (x) { return x.a; }).join(' / ').slice(0, 500) +
      '\n\nReply with JSON only: {"outfit":[{"slot":"kTop","style":"exact style","color":index,"name":"what it really is, in their words","desc":"one dry sentence from the System"}]}';
    serverSample([{ role: 'user', content: prompt }], { modelTier: 'quick', maxTokens: 700 }).then(function (r) {
      var j = null; try { j = JSON.parse((r.text || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (x) {}
      apply(outfitFrom(j && j.outfit), '');
    }, function () { apply(outfitLocal(txt), '(The AI did not answer, so this was picked by keywords.)'); });
  }
  function spendPoint(kind, key) {
    var c = CHAR; if (!c) return;
    if (kind === 'stat' && (c.statPts || 0) > 0 && c.stats[key] < 20) { c.stats[key]++; c.statPts--; MOD[key] = Math.floor((c.stats[key] - 10) / 2); if (key === 'CON') { var was = PC.max; PC.max = maxHPFor(c, PC.level); PC.hp += PC.max - was; } }
    else if (kind === 'skill' && (c.skillPts || 0) > 0 && (c.skills[key] || 0) < 3 + PC.level) { c.skills[key] = (c.skills[key] || 0) + 1; c.skillPts--; }
    else return;
    cbSaveChar(); if (typeof cbHUD === 'function') cbHUD(); if (typeof drawRows === 'function') drawRows();
  }
  function saveChar(c) {
    var doc = { name: c.name, stats: c.stats, skills: c.skills, trait: c.trait, traitFx: c.traitFx || c.trait, traitDesc: c.traitDesc || '', flaw: c.flaw, flawFx: c.flawFx || c.flaw, flawDesc: c.flawDesc || '',
      gear: c.gear || [], gold: c.gold || 0, wield: c.wield || null, back: c.back || null, freeWardrobe: !!c.freeWardrobe, xp: c.xp || 0, level: c.level || 1, look: look, interview: c.interview || [], pos: c.pos || null, skillPts: c.skillPts || 0, statPts: c.statPts || 0, skillXP: c.skillXP || {}, ach: c.ach || {}, zones: c.zones || {}, hotbar: c.hotbar || [], tries: c.tries || [], potionsGiven: !!c.potionsGiven, dead: c.dead || null, skillDefs: c.skillDefs || {}, counts: c.counts || {}, log: c.log || [], secrets: c.secrets || {}, born: c.born || null, updated: Date.now() };
    try { localStorage.setItem(NET.mode === 'server' ? 'crawl-char-' + NET.uid : 'crawl-char1', JSON.stringify(doc)); } catch (e) {}
    if (NET.mode === 'server' && NET.uid) api('character', { method: 'PUT', body: { character: doc } }).catch(function (e) { say('Save failed', 'The server did not take your save: ' + e.message + '. It is kept on this device.', 5000); });
  }
  function saveLookRemote() { if (CHAR && NET.mode === 'server') { clearTimeout(saveLookRemote.t); saveLookRemote.t = setTimeout(function () { saveChar(CHAR); }, 1500); } }
  // ---------- accounts, saves and AI through our own server (Cloudflare) ----------
  // On the real site /api/ answers with JSON and players must sign in. Opened any other way
  // (a test server, a file), the game runs offline: no login, saves on this device, stock NPC lines.
  var NET = { mode: 'local', user: null, uid: null, sample: null, party: [] }, AUTH = { open: false };
  function api(path, opt) {
    opt = opt || {};
    return fetch('/api/' + path, { method: opt.method || 'GET', credentials: 'same-origin', signal: opt.signal,
      headers: opt.body !== undefined ? { 'content-type': 'application/json' } : {}, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.message || j.error || ('HTTP ' + r.status)); e.code = j.error; e.status = r.status; throw e; } return j; }); });
  }
  function serverSample(input, opts) {
    opts = opts || {};
    return api('ai', { method: 'POST', body: { messages: input, tier: opts.modelTier || 'quick', max_tokens: opts.maxTokens }, signal: opts.signal })
      .then(function (j) { return { text: j.text || '', truncated: !!j.truncated }; });
  }
  serverSample.json = function (input, opts) { return serverSample(input, opts).then(function (r) { return JSON.parse(r.text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')); }); };
  NET.ready = fetch('/api/me', { credentials: 'same-origin' }).then(function (r) {
    if ((r.headers.get('content-type') || '').indexOf('json') < 0) return null;
    NET.mode = 'server'; return r.ok ? r.json() : null;
  }).catch(function () { return null; });
  function charInit() {
    applyChar(MICHAEL); CHAR = null; // play-test numbers until a character loads
    NET.ready.then(function (me) {
      if (NET.mode === 'server') { if (me && me.user) signedIn(me); else authOpen(); return; }
      var c = null; try { c = JSON.parse(localStorage.getItem('crawl-char1') || 'null'); } catch (e) {}
      if (c && c.stats) loadChar(c); else ccOpen();
    });
  }
  function loadChar(c) {
    applyChar(c);
    if (c.look) { for (var k in c.look) if (look[k]) look[k] = c.look[k]; buildHero(); }
  }
  function signedIn(me) {
    NET.user = me.user; NET.uid = me.user.id; NET.sample = serverSample; authClose(); api('campaign').then(function (j) { NET.live = !!(j.value && j.value.live); deadCheck(); }, function () {});
    if (me.character && me.character.stats) { loadChar(me.character); say('Welcome back, ' + (me.character.name || me.user.username), 'Your character is right where you left it.', 4500); }
    else ccOpen();
    partyPoll();
  }
  function partyPoll() {
    clearTimeout(partyPoll.t);
    api('party').then(function (j) { NET.party = j.party || []; var me = NET.party.filter(function (p) { return p.id === NET.uid; })[0]; if (CHAR && CHAR.dead && me && !me.dead && NET.live) reviveMe(); if (gearOpen && tab === 'Sheet') drawRows(); }, function (e) { if (e.status === 401) authOpen(); })
      .then(function () { partyPoll.t = setTimeout(partyPoll, CHAR && CHAR.dead ? 10000 : 30000); });
  }
  // ---------- sign-in screen ----------
  (function authUI() {
    var el = document.createElement('div'); el.id = 'auth'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Sign in');
    document.body.appendChild(el);
    var css = document.createElement('style');
    css.textContent = '#auth{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 30% 20%,rgba(255,62,165,.14),transparent 60%),rgba(8,9,15,.97);color:#e8f4f4;font-size:13px;overflow-y:auto}' +
      '#auth.on{display:flex}#auth .box{width:min(380px,92vw);padding:18px}#auth h1{margin:0 0 2px;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--hot)}#auth .sub{margin:0 0 14px;color:#9fd}' +
      '#auth .tabs{display:flex;gap:6px;margin-bottom:10px}#auth .tabs button{flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:none;color:#e8f4f4;font:inherit;cursor:pointer}#auth .tabs button.on{border-color:var(--neon);background:rgba(61,242,224,.12)}' +
      '#auth label{display:block;margin:8px 0 3px;color:#9fd;font-size:11.5px}#auth input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:9px;font:inherit}' +
      '#auth .go{width:100%;margin-top:14px;padding:10px;border-radius:8px;border:1px solid var(--neon);background:rgba(61,242,224,.16);color:#fff;font:inherit;cursor:pointer}#auth .err{color:#ff7aa8;min-height:18px;margin-top:8px}';
    document.head.appendChild(css);
  })();
  function authOpen(mode) {
    AUTH.open = true; AUTH.mode = mode || AUTH.mode || 'login';
    var el = document.getElementById('auth'), join = AUTH.mode === 'join';
    el.innerHTML = '<form class="box" id="authF" autocomplete="on"><h1>The Crawl</h1><p class="sub">Humanity\'s five representatives, please sign in.</p>' +
      '<div class="tabs"><button type="button" data-m="login" class="' + (join ? '' : 'on') + '">Log in</button><button type="button" data-m="join" class="' + (join ? 'on' : '') + '">I have an invite</button></div>' +
      (join ? '<label for="aInv">Invite code</label><input id="aInv" autocomplete="off" autocapitalize="characters" placeholder="ABCD-1234" required>' : '') +
      '<label for="aUser">Username</label><input id="aUser" autocomplete="username" autocapitalize="off" spellcheck="false" required>' +
      '<label for="aPw">Password' + (join ? ' (8 or more characters)' : '') + '</label><input id="aPw" type="password" autocomplete="' + (join ? 'new-password' : 'current-password') + '" required>' +
      '<button class="go" type="submit">' + (join ? 'Create my account' : 'Log in') + '</button><div class="err" id="aErr" role="alert"></div></form>';
    el.classList.add('on');
    el.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { authOpen(b.dataset.m); }; });
    el.querySelectorAll('input').forEach(function (i) { i.addEventListener('keydown', function (ev) { ev.stopPropagation(); }); });
    document.getElementById('authF').onsubmit = function (ev) {
      ev.preventDefault(); var err = document.getElementById('aErr'), go = el.querySelector('.go'); err.textContent = ''; go.disabled = true;
      var body = { username: document.getElementById('aUser').value.trim(), password: document.getElementById('aPw').value };
      if (join) body.invite = document.getElementById('aInv').value.trim();
      api(join ? 'register' : 'login', { method: 'POST', body: body }).then(signedIn, function (e) { err.textContent = e.message; go.disabled = false; });
    };
    setTimeout(function () { var f = document.getElementById(join ? 'aInv' : 'aUser'); if (f) f.focus(); }, 50);
  }
  function authClose() { AUTH.open = false; document.getElementById('auth').classList.remove('on'); }
  function logOut() { api('logout', { method: 'POST' }).then(function () { location.reload(); }, function () { location.reload(); }); }
  // ---------- DM tools (shown on the Sheet tab for the DM account) ----------
  function sheetAfter() {
    var box = document.getElementById('dmBox'); if (!box || !NET.user || NET.user.role !== 'dm') return;
    api('dm/invites').then(function (j) {
      var open = j.invites.filter(function (i) { return !i.used_by; }), used = j.invites.filter(function (i) { return i.used_by; });
      box.innerHTML = '<h3>DM tools</h3><p>Each invite code works once. Send one to each friend.</p>' +
        '<p><button type="button" class="ccBtn" id="dmNew">Make an invite code</button></p>' +
        (open.length ? '<ul>' + open.map(function (i) { return '<li><b style="user-select:all">' + esc(i.code) + '</b>' + (i.note ? ' · ' + esc(i.note) : '') + '</li>'; }).join('') + '</ul>' : '') +
        (used.length ? '<p>Used: ' + used.map(function (i) { return esc(i.used_by); }).join(', ') + '</p>' : '') +
        '<p><button type="button" class="ccBtn" id="dmTalk">Read recent NPC conversations</button></p><div id="dmLogs"></div>' +
        (CHAR && !NET.live ? '<p><button type="button" class="ccBtn" id="dmWard">' + (CHAR.freeWardrobe ? 'Lock my wardrobe again' : 'Unlock all clothes for me (DM testing)') + '</button></p>' : '') +
        (NET.party.filter(function (p) { return p.dead; }).length ? '<h3>Fallen crawlers</h3>' + NET.party.filter(function (p) { return p.dead; }).map(function (p) { return '<p>' + esc(p.name || p.username) + ' is dead. <button type="button" class="ccBtn" data-rev="' + p.id + '">Revive</button></p>'; }).join('') + '<p><small>Stand-in until party members can revive each other.</small></p>' : '') +
        '<h3>Campaign</h3><p>' + (NET.live ? 'Live. Testing tools are locked for everyone (re-dressing, free wardrobe).' : 'Testing. Players can re-dress from their description and the DM can unlock clothes.') + '</p><p><button type="button" class="ccBtn" id="dmLive">' + (NET.live ? 'Back to testing mode' : 'Start the campaign (lock testing tools)') + '</button></p>';
      box.querySelectorAll('[data-rev]').forEach(function (b) { b.onclick = function () { api('dm/revive', { method: 'POST', body: { user_id: +b.dataset.rev } }).then(function () { if (+b.dataset.rev === NET.uid) reviveMe(); partyPoll(); say('Revived', 'They are back, with 1 HP.', 3000); }, function (e) { say('Failed', e.message); }); }; });
      document.getElementById('dmLive').onclick = function () { if (!NET.live && !confirm('Start the campaign? Re-dressing and the free wardrobe lock for everyone.')) return; api('dm/campaign', { method: 'PUT', body: { live: !NET.live } }).then(function () { NET.live = !NET.live; if (NET.live && CHAR && CHAR.freeWardrobe) { CHAR.freeWardrobe = false; saveChar(CHAR); } drawRows(); }, function (e) { say('Failed', e.message); }); };
      if (document.getElementById('dmWard')) document.getElementById('dmWard').onclick = function () { CHAR.freeWardrobe = !CHAR.freeWardrobe; saveChar(CHAR); drawRows(); };
      document.getElementById('dmNew').onclick = function () { var note = prompt('Who is this invite for? (optional)') || ''; api('dm/invites', { method: 'POST', body: { note: note } }).then(sheetAfter, function (e) { say('Invite failed', e.message); }); };
      document.getElementById('dmTalk').onclick = function () {
        api('dm/talk').then(function (t) {
          document.getElementById('dmLogs').innerHTML = t.logs.length ? t.logs.map(function (l) { return '<p><b>' + esc(l.username) + ' ↔ ' + esc(l.npc) + '</b><br>' + (l.log && l.log.lines || []).slice(-6).map(function (x) { return esc((x.who === 'me' ? l.username : x.who === 'them' ? l.npc : 'System') + ': ' + x.text); }).join('<br>') + '</p>'; }).join('') : '<p>No conversations yet.</p>';
        });
      };
    }, function () { box.innerHTML = ''; });
  }
  // ---------- the sheet tab ----------
  function sheetHTML() {
    var c = CHAR || MICHAEL, a = (typeof pcAC === 'function') ? pcAC() : { ac: '?', why: '' };
    var sk = Object.keys(c.skills).filter(function (k) { return c.skills[k] > 0; }).sort(function (x, y) { return c.skills[y] - c.skills[x]; });
    var tr = TRAITS.filter(function (t) { return t[0] === c.trait; })[0] || [c.trait, ''], fl = FLAWS.filter(function (t) { return t[0] === c.flaw; })[0] || [c.flaw, ''];
    var party = NET.party.filter(function (p) { return p.id !== NET.uid; });
    var gear = (c.gear || []).map(function (g) { return '<li><b>' + esc(g.name) + '</b>' + (g.dmg ? ' · ' + esc(g.dmg) : '') + (g.desc ? '<br><small>' + esc(g.desc) + '</small>' : '') + '</li>'; }).join('');
    var sp = c.statPts || 0, kp = c.skillPts || 0, achs = Object.keys(c.ach || {}).length;
    return '<div class="sheet"><h3>' + esc(c.name || 'Crawler') + ' · Human · Level ' + (PC.level || 1) + ' · ' + (PC.xp || 0) + ' / ' + nextLevelXP() + ' XP</h3>' +
      (sp ? '<p class="pts">' + sp + ' stat point' + (sp > 1 ? 's' : '') + ' to spend: tap + on a stat.</p>' : '') +
      '<div class="stats">' + STATS.map(function (k) { var m = Math.floor((c.stats[k] - 10) / 2); return '<span><b>' + c.stats[k] + '</b>' + k + ' ' + (m >= 0 ? '+' : '') + m + (sp && c.stats[k] < 20 ? ' <button type="button" class="plus" onclick="window.__crawl.spend(\'stat\',\'' + k + '\')" aria-label="Raise ' + k + '">+</button>' : '') + '</span>'; }).join('') + '</div>' +
      '<p>HP ' + PC.max + ' · AC ' + a.ac + ' (' + a.why + ') · Proficiency +' + PROF() + ' · Achievements ' + achs + '</p>' +
      '<h3>Skills</h3>' + (kp ? '<p class="pts">' + kp + ' skill point' + (kp > 1 ? 's' : '') + ' to spend: tap + on any skill.</p>' : '') + '<ul>' + sk.map(function (k) { var lv = c.skills[k] || 0, prog = (c.skillXP || {})[k] || 0; return '<li>' + esc(k) + ' ' + lv + (prog ? ' <small>(' + prog + '/' + (lv + 1) * 3 + ' practice)</small>' : '') + (kp && lv < 3 + (PC.level || 1) ? ' <button type="button" class="plus" onclick="window.__crawl.spend(\'skill\',\'' + k + '\')" aria-label="Raise ' + esc(k) + '">+</button>' : '') + '</li>'; }).join('') + '</ul>' +
      '<h3>Trait: ' + esc(c.trait) + '</h3><p>' + esc(c.traitDesc || tr[1]) + '</p><h3>Flaw: ' + esc(c.flaw) + '</h3><p>' + esc(c.flawDesc || fl[1]) + '</p>' +
      (gear ? '<h3>Brought from home</h3><ul class="gear">' + gear + '</ul>' : '') +
      (NET.live ? '' : '<p><button type="button" class="ccBtn" onclick="window.__crawl.redress()">Get dressed by the System</button> <small>Re-picks your outfit from what you say you were wearing. Keeps your character. Testing only: it locks when the campaign starts.</small></p>') +
      '<h3>Class</h3><p>' + ((PC.level || 1) >= 3 ? 'Unlocked. The class choice is coming soon; the System is watching what you train.' : 'Unlocks at level 3, offered from the weapons and skills you actually use.') + '</p>' +
      (party.length ? '<h3>Party</h3><ul>' + party.map(function (p) { return '<li>' + esc(p.name || p.username) + (p.name ? ' <small>(' + esc(p.username) + ')</small>' : ' <small>(no character yet)</small>') + ' · ' + (p.xp || 0) + ' XP</li>'; }).join('') + '</ul>' : '') +
      '<p><button type="button" class="ccBtn" onclick="window.__crawl.newChar()">' + (CHAR ? 'Make a new character' : 'Create your character') + '</button></p>' +
      creditsHTML() + (NET.user ? '<div id="dmBox"></div><p>Signed in as ' + esc(NET.user.username) + (NET.user.role === 'dm' ? ' (DM)' : '') + ' <button type="button" class="ccBtn" onclick="window.__crawl.logOut()">Log out</button></p>' : '') + '</div>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }

  // ---------- the creation screens ----------
  var CC = null;
  (function ccUI() {
    var css = document.createElement('style');
    css.textContent = '#cc{position:fixed;inset:0;z-index:40;display:none;background:radial-gradient(ellipse at 30% 20%,rgba(255,62,165,.12),transparent 60%),rgba(8,9,15,.96);color:#e8f4f4;overflow-y:auto;padding:18px 22px 22px;font-size:13px}' +
      '#cc.on{display:block}#cc h2{margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--hot)}#cc .sys{color:#bfe;margin:0 0 12px;max-width:760px;line-height:1.45}' +
      '#cc label{display:block;margin:10px 0 4px;color:#9fd;font-size:11.5px}#cc input[type=text],#cc textarea{width:100%;max-width:760px;box-sizing:border-box;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:8px;font:inherit}' +
      '#cc textarea{min-height:52px;resize:vertical}#cc .nav{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}#cc .nav button,.ccBtn{padding:9px 14px;border-radius:8px;border:1px solid var(--neon);background:rgba(61,242,224,.12);color:#e8f4f4;font:inherit;cursor:pointer}' +
      '#cc .nav button.alt{border-color:rgba(255,255,255,.25);background:none}#cc .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;max-width:900px}' +
      '#cc .st{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 8px}#cc .st b{min-width:28px;text-align:center;font-size:15px}#cc .st span{flex:1}#cc .st small{color:#8ab;display:block;font-size:10px}' +
      '#cc .st button{width:30px;height:30px;border-radius:6px;border:1px solid rgba(61,242,224,.4);background:none;color:#fff;font-size:16px;cursor:pointer}#cc .pick{cursor:pointer}#cc .pick.on{border-color:var(--hot);background:rgba(255,62,165,.12)}' +
      '#cc .budget{color:#ffd34a}#cc .think{color:#9ab;font-style:italic}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'cc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Character creation'); document.body.appendChild(el);
  })();
  function ccOpen() {
    CC = { step: 0, name: (CHAR && CHAR.name) || '', answers: QUESTIONS.map(function () { return ''; }), follow: [], followA: [], stats: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }, skills: {}, gear: [], outfit: [], cTrait: null, cFlaw: null, trait: null, flaw: null, note: '' };
    document.getElementById('cc').classList.add('on'); ccDraw();
  }
  function ccClose() { document.getElementById('cc').classList.remove('on'); CC = null; }
  function ccDraw() {
    var el = document.getElementById('cc'), s = CC.step, h = '';
    if (s === 0) {
      h = '<h2>Crawler intake · step 1 of 5</h2><p class="sys">Congratulations! Out of eight billion candidates, you have been selected as one of humanity\'s five representatives in the galaxy\'s most-watched dungeon crawl. Please make your species proud. The System will now interview you about your real life and turn it into your starting stats, skills, one trait, one flaw, and whatever you happened to have on you when we took you.</p>' +
        '<label for="ccName">Your name</label><input type="text" id="ccName" maxlength="24" value="' + esc(CC.name) + '" autocomplete="off">' +
        '<div class="nav"><button type="button" id="ccGo">Start the interview</button><button type="button" class="alt" id="ccMichael">Use Michael\'s test sheet</button>' + (CHAR ? '<button type="button" class="alt" id="ccCancel">Cancel</button>' : '') + '</div>';
    } else if (s === 1) {
      h = '<h2>Interview · step 2 of 5</h2><p class="sys">Answer in your own words. Short is fine. Jokes are fine.</p>' +
        QUESTIONS.map(function (q, i) { return '<label for="ccA' + i + '">' + esc(q) + '</label><textarea id="ccA' + i + '">' + esc(CC.answers[i]) + '</textarea>'; }).join('') +
        '<div class="nav"><button type="button" id="ccGo">' + (NET.sample ? 'Send to the System' : 'Next') + '</button><button type="button" class="alt" id="ccBack">Back</button></div>';
    } else if (s === 2) {
      h = '<h2>Follow-up questions · step 2 of 5</h2><p class="sys">' + esc(CC.note || 'The System has a few more questions.') + '</p>' +
        (CC.follow.length ? CC.follow.map(function (q, i) { return '<label for="ccF' + i + '">' + esc(q) + '</label><textarea id="ccF' + i + '">' + esc(CC.followA[i] || '') + '</textarea>'; }).join('') : '<p class="think">Thinking…</p>') +
        '<div class="nav"><button type="button" id="ccGo"' + (CC.follow.length ? '' : ' disabled') + '>Get my stats</button><button type="button" class="alt" id="ccBack">Back</button></div>';
    } else if (s === 3) {
      var left = BUDGET - buyCost(CC.stats);
      h = '<h2>Stats · step 3 of 5</h2><p class="sys">' + esc(CC.note || 'Here is where your life put your points. Adjust if you disagree.') + '</p><p class="budget">Points left: ' + left + ' of ' + BUDGET + ' · scores run 8 to 15 before anything else</p><div class="grid">' +
        STATS.map(function (k) { var m = Math.floor((CC.stats[k] - 10) / 2); return '<div class="st"><span>' + STAT_NAMES[k] + '<small>modifier ' + (m >= 0 ? '+' : '') + m + '</small></span><button type="button" data-st="' + k + '" data-d="-1" aria-label="Lower ' + STAT_NAMES[k] + '">−</button><b>' + CC.stats[k] + '</b><button type="button" data-st="' + k + '" data-d="1" aria-label="Raise ' + STAT_NAMES[k] + '">+</button></div>'; }).join('') +
        '</div><div class="nav"><button type="button" id="ccGo"' + (left === 0 ? '' : ' disabled') + '>Next: skills</button><button type="button" class="alt" id="ccBack">Back</button></div>';
    } else if (s === 4) {
      var used = Object.keys(CC.skills).reduce(function (t, k) { return t + CC.skills[k]; }, 0);
      h = '<h2>Skills · step 4 of 5</h2><p class="sys">Skills come from what you have actually done. Each level adds +1 to rolls that use it, and they grow as you use them in the crawl. Most people start with 4 to 6 skills.</p><p class="budget">Skill points left: ' + (SKILL_BUDGET - used) + ' of ' + SKILL_BUDGET + ' · up to 3 in one skill</p><div class="grid">' +
        SKILLS.map(function (sk) { var v = CC.skills[sk[0]] || 0; return '<div class="st"><span>' + sk[0] + ' <small>' + sk[1] + ' · ' + sk[2] + '</small></span><button type="button" data-sk="' + sk[0] + '" data-d="-1" aria-label="Lower ' + sk[0] + '">−</button><b>' + v + '</b><button type="button" data-sk="' + sk[0] + '" data-d="1" aria-label="Raise ' + sk[0] + '">+</button></div>'; }).join('') +
        '</div><div class="nav"><button type="button" id="ccGo">Next: trait and flaw</button><button type="button" class="alt" id="ccBack">Back</button></div>';
    } else if (s === 5) {
      h = '<h2>Trait and flaw · step 5 of 5</h2><p class="sys">Pick one of each. The System\'s suggestion is marked; you can overrule it.</p><h2 style="margin-top:10px">Trait</h2><div class="grid">' +
        (CC.cTrait ? [CC.cTrait] : []).concat(TRAITS).map(function (t) { return '<div class="st pick' + (CC.trait === t[0] ? ' on' : '') + '" data-tr="' + esc(t[0]) + '" role="button" tabindex="0"><span>' + esc(t[0]) + (CC.sugTrait === t[0] ? ' · suggested' : '') + '<small>' + esc(t[1]) + '</small></span></div>'; }).join('') +
        '</div><h2 style="margin-top:12px">Flaw</h2><div class="grid">' +
        (CC.cFlaw ? [CC.cFlaw] : []).concat(FLAWS).map(function (t) { return '<div class="st pick' + (CC.flaw === t[0] ? ' on' : '') + '" data-fl="' + esc(t[0]) + '" role="button" tabindex="0"><span>' + esc(t[0]) + (CC.sugFlaw === t[0] ? ' · suggested' : '') + '<small>' + t[1] + '</small></span></div>'; }).join('') +
        '</div>' + (CC.outfit.length ? '<h2 style="margin-top:12px">What you are wearing</h2><div class="grid">' + CC.outfit.map(function (g) { return '<div class="st"><span>' + esc(g.name) + '<small>' + esc(slotLabel(g.slot)) + ' · shown as ' + esc(g.style) + '</small></span></div>'; }).join('') + '</div>' : '') + (CC.gear.length ? '<h2 style="margin-top:12px">What you had on you</h2><div class="grid">' + CC.gear.map(function (g) { return '<div class="st"><span>' + esc(g.name) + (g.dmg ? ' · ' + esc(g.dmg) : '') + '<small>' + esc(g.desc || '') + '</small></span></div>'; }).join('') + '</div>' : '') +
        '<div class="nav"><button type="button" id="ccGo"' + (CC.trait && CC.flaw ? '' : ' disabled') + '>Finish and choose your look</button><button type="button" class="alt" id="ccBack">Back</button></div>';
    }
    el.innerHTML = h; el.scrollTop = 0;
    function q(id) { return document.getElementById(id); }
    if (q('ccBack')) q('ccBack').onclick = function () { ccKeep(); CC.step = CC.step === 3 && !CC.follow.length ? 1 : Math.max(0, CC.step - 1); ccDraw(); };
    if (q('ccCancel')) q('ccCancel').onclick = ccClose;
    if (q('ccMichael')) q('ccMichael').onclick = function () { var c = JSON.parse(JSON.stringify(MICHAEL)); delete c.preset; applyChar(c); saveChar(c); ccClose(); say('Welcome back, Michael', 'Test sheet loaded. Your stats, skills, trait and flaw are set.'); };
    el.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { var k = b.dataset.st, v = CC.stats[k] + (+b.dataset.d); if (v < 8 || v > 15) return; var t = {}; for (var x in CC.stats) t[x] = CC.stats[x]; t[k] = v; if (buyCost(t) > BUDGET) return; CC.stats = t; ccDraw(); }; });
    el.querySelectorAll('[data-sk]').forEach(function (b) { b.onclick = function () { var k = b.dataset.sk, v = (CC.skills[k] || 0) + (+b.dataset.d); if (v < 0 || v > 3) return; var used = Object.keys(CC.skills).reduce(function (t, n) { return t + (n === k ? 0 : CC.skills[n]); }, 0); if (used + v > SKILL_BUDGET) return; CC.skills[k] = v; if (!v) delete CC.skills[k]; ccDraw(); }; });
    el.querySelectorAll('[data-tr]').forEach(function (b) { b.onclick = function () { CC.trait = b.dataset.tr; ccDraw(); }; });
    el.querySelectorAll('[data-fl]').forEach(function (b) { b.onclick = function () { CC.flaw = b.dataset.fl; ccDraw(); }; });
    if (q('ccGo')) q('ccGo').onclick = function () { ccKeep(); ccNext(); };
  }
  function ccKeep() {
    var n = document.getElementById('ccName'); if (n) CC.name = n.value.trim();
    QUESTIONS.forEach(function (x, i) { var t = document.getElementById('ccA' + i); if (t) CC.answers[i] = t.value.trim(); });
    CC.follow.forEach(function (x, i) { var t = document.getElementById('ccF' + i); if (t) CC.followA[i] = t.value.trim(); });
  }
  function ccNext() {
    var s = CC.step;
    if (s === 0) { if (!CC.name) { document.getElementById('ccName').focus(); return; } CC.step = 1; ccDraw(); return; }
    if (s === 1) {
      if (!NET.sample) { ccSuggestLocal(); CC.step = 3; ccDraw(); return; }
      CC.step = 2; CC.follow = []; CC.note = 'The System is reading your answers…'; ccDraw();
      ccAsk('followups').then(function (r) { if (!CC) return; CC.follow = (r && r.questions || []).slice(0, 3); CC.note = r && r.comment || 'A few follow-ups.'; if (!CC.follow.length) { ccSuggestLocal(); CC.step = 3; } ccDraw(); },
        function () { if (!CC) return; ccSuggestLocal(); CC.note = 'The System is offline, so it guessed from keywords. Adjust as you like.'; CC.step = 3; ccDraw(); });
      return;
    }
    if (s === 2) {
      CC.note = 'Crunching your life into numbers…'; document.getElementById('ccGo').disabled = true;
      ccAsk('build').then(function (r) { if (!CC) return; ccTakeBuild(r); CC.step = 3; ccDraw(); }, function () { if (!CC) return; ccSuggestLocal(); CC.note = 'The System choked on that. Here is a keyword guess instead.'; CC.step = 3; ccDraw(); });
      return;
    }
    if (s === 3) { CC.step = 4; ccDraw(); return; }
    if (s === 4) { CC.step = 5; ccDraw(); return; }
    if (s === 5) {
      var tp = (CC.cTrait && CC.cTrait[0] === CC.trait) ? CC.cTrait : (TRAITS.filter(function (t) { return t[0] === CC.trait; })[0] || [CC.trait, '', CC.trait]), fp = (CC.cFlaw && CC.cFlaw[0] === CC.flaw) ? CC.cFlaw : (FLAWS.filter(function (t) { return t[0] === CC.flaw; })[0] || [CC.flaw, '', CC.flaw]);
      var c = { name: CC.name, stats: CC.stats, skills: CC.skills, trait: tp[0], traitDesc: tp[1], traitFx: tp[2] || tp[0], flaw: fp[0], flawDesc: fp[1], flawFx: fp[2] || fp[0], gear: CC.gear.concat(CC.outfit), gold: 0, xp: 0, interview: QUESTIONS.map(function (q, i) { return { q: q, a: CC.answers[i] }; }).concat(CC.follow.map(function (q, i) { return { q: q, a: CC.followA[i] || '' }; })) };
      c.born = Date.now(); applyChar(c); logEvent('Taken from Earth and registered as a crawler', 'start'); c.gear.forEach(function (g) { if (g.cat === 'clothing' && g.worn) wear(g); }); look.main = [0, look.main[1]]; look.off = [0, look.off[1]]; look.back = [0, look.back[1]]; buildHero(); saveChar(c); ccClose(); GMODE = 'design'; tab = 'Body'; if (!gearOpen) toggleGear(); else { drawTabs(); drawRows(); }
      say('Crawler registered · ' + c.name, 'Last step: your body, face and hair. These are permanent, except a bathroom mirror lets you change your hair later. Confirm when you are ready.', 7000);
    }
  }
  // ask Claude (through the page's sample capability) to play the System for the interview
  function ccAsk(kind) {
    var qa = QUESTIONS.map(function (q, i) { return 'Q: ' + q + '\nA: ' + (CC.answers[i] || '(no answer)'); }).join('\n\n');
    var fa = CC.follow.map(function (q, i) { return 'Q: ' + q + '\nA: ' + (CC.followA[i] || '(no answer)'); }).join('\n\n');
    var head = 'You are "the System", the sardonic alien host of a dungeon-crawl reality show (in the spirit of Dungeon Crawler Carl). A new human crawler named ' + CC.name + ' is being processed: one of five humans chosen to represent all of humanity in an intergalactic dungeon crawl. Rules are D&D 5e plus DCC-style skills. Characters must reflect the real person, weaknesses included: they should not be universally competent.\n\nInterview so far:\n' + qa + (fa ? '\n\nFollow-ups:\n' + fa : '');
    var prompt = kind === 'followups' ? head + '\n\nAsk up to 3 short, pointed follow-up questions tailored to what they said, that would best decide their ability scores, skills, weaknesses and what gear they had on them. Reply with JSON only: {"comment": one dry sentence from the System about what you have heard so far, "questions": [strings]}'
      : head + '\n\nBuild their level-1 human sheet from real-life evidence. Ability scores use the 5e 27-point buy exactly (each score 8-15; costs 8=0,9=1,10=2,11=3,12=4,13=5,14=7,15=9; total exactly 27). Skills come only from this list: ' + SKILL_DEFS.map(function (s) { return s[0]; }).join(', ') +
        '. Give 4 to 6 skills, levels 1-3, total points at most ' + SKILL_BUDGET + '. Invent one personal trait and one personal flaw drawn from their real life (funny, specific, consequential). Each must use one game effect: trait effect from ' + TRAITS.map(function (t) { return t[0] + ' (' + t[1] + ')'; }).join('; ') + '. Flaw effect from ' + FLAWS.map(function (t) { return t[0] + ' (' + t[1] + ')'; }).join('; ') +
        '. Starting gear: 3 to 6 everyday items they would really have had on them or within reach (from their job, habits and answer about what was on them), no fantasy gear. Categories: weapon, tool, consumable, valuable, misc. Improvised weapons get small damage dice (1d3 to 1d6). When one of these standard items fits, use its exact name: ' + homeNames().join(', ') + '.' +
        ' Outfit: dress them in what they said they are wearing, using the closest available pieces and colors from this catalog (slot: options with color indexes):\n' + outfitCatalog() + '\nPrefer the modern pieces (T-shirt, Long sleeve, Tank top, Hoodie, Button-up, Jeans, Shorts, Sweatpants, Sneakers, Work boots, Beanie, Cap); use the fantasy ones only for things like suits (Noble), jackets or coats (Ranger) or a hood that is up. Give each piece the real name of what they wear (e.g. "Faded black hoodie").' +
        ' Reply with JSON only: {"outfit":[{"slot":"kTop","style":"exact option name","color":index,"name":"what it really is","desc":"one dry sentence"}],"stats":{"STR":n,"DEX":n,"CON":n,"INT":n,"WIS":n,"CHA":n},"skills":{"Name":level},"trait":{"name":"...","desc":"one sentence, mention the game effect","effect":"one listed trait effect"},"flaw":{"name":"...","desc":"one sentence, mention the game effect","effect":"one listed flaw effect"},"gear":[{"name":"...","cat":"...","desc":"one dry sentence","dmg":"1d4 or empty"}],"comment": two dry sentences from the System explaining the numbers, mentioning specific things they said}';
    var call = NET.sample.json ? NET.sample.json(prompt, { modelTier: 'default', cache: false }) : NET.sample(prompt, { cache: false }).then(function (r) { return JSON.parse((r.text || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); });
    return Promise.resolve(call);
  }
  function ccTakeBuild(r) {
    var st = {}, ok = r && r.stats;
    STATS.forEach(function (k) { var v = ok ? Math.round(+r.stats[k]) : 8; st[k] = Math.min(15, Math.max(8, isNaN(v) ? 8 : v)); });
    while (buyCost(st) > BUDGET) { var hi = STATS.slice().sort(function (a, b) { return st[b] - st[a]; })[0]; st[hi]--; }
    while (buyCost(st) < BUDGET) { var lo = STATS.filter(function (k) { return st[k] < 15 && buyCost(Object.assign({}, st, (function () { var o = {}; o[k] = st[k] + 1; return o; })())) <= BUDGET; }); if (!lo.length) break; st[lo[0]]++; }
    CC.stats = st; CC.skills = {}; var used = 0;
    Object.keys(r && r.skills || {}).forEach(function (k) { if (!SKILL_IDX[k]) return; var v = Math.max(0, Math.min(3, Math.round(+r.skills[k]) || 0)); if (used + v > SKILL_BUDGET) v = SKILL_BUDGET - used; if (v > 0) { CC.skills[k] = v; used += v; } });
    function custom(x, list) {
      if (!x) return null; if (typeof x === 'string') return list.some(function (t) { return t[0] === x; }) ? null : null;
      var fx = list.some(function (t) { return t[0] === x.effect; }) ? x.effect : list[0][0];
      return [String(x.name || fx).slice(0, 40), String(x.desc || '').slice(0, 200), fx];
    }
    CC.cTrait = custom(r && r.trait, TRAITS); CC.cFlaw = custom(r && r.flaw, FLAWS);
    CC.sugTrait = CC.cTrait ? CC.cTrait[0] : (TRAITS.some(function (t) { return t[0] === (r && r.trait); }) ? r.trait : null);
    CC.sugFlaw = CC.cFlaw ? CC.cFlaw[0] : (FLAWS.some(function (t) { return t[0] === (r && r.flaw); }) ? r.flaw : null);
    CC.gear = (r && Array.isArray(r.gear) ? r.gear : []).slice(0, 6).map(function (g) { return { name: String(g.name || 'Something').slice(0, 40), cat: /^(weapon|tool|consumable|valuable|misc)$/.test(g.cat) ? g.cat : 'misc', desc: String(g.desc || '').slice(0, 160), dmg: /^\d+d\d+$/.test(g.dmg || '') ? g.dmg : '' }; }).map(canonGear);
    if (!CC.gear.length) ccGearLocal();
    CC.outfit = outfitFrom(r && r.outfit); if (!(r && r.outfit && r.outfit.length)) CC.outfit = outfitLocal(CC.answers[CC.answers.length - 1]);
    CC.trait = CC.sugTrait; CC.flaw = CC.sugFlaw; CC.note = (r && r.comment) || 'Your numbers.';
    if (!Object.keys(CC.skills).length) ccSuggestLocal(true);
  }
  // no Claude available: a keyword guess from the answers
  // starting gear: items.js has standard versions of everyday things; use them whenever the AI picks one
  function homeNames() { var all = Object.keys(ITEMS), h = all.filter(function (n) { return ITEMS[n].home; }); return h.length ? h : all.filter(function (n) { return ITEMS[n].cat !== 'clothing' && (ITEMS[n].level || 1) <= 1; }); }
  function canonGear(g) {
    var key = String(g.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''), hit = Object.keys(ITEMS).filter(function (n) { return n.toLowerCase().replace(/[^a-z0-9]/g, '') === key; })[0];
    if (hit && ITEMS[hit].cat !== 'clothing') return item(hit);
    if (g.cat === 'consumable' && !g.heal) g.heal = '1d2'; // invented consumables still do something
    return g;
  }
  function ccGearLocal() {
    var t = (CC.answers.join(' ') + ' ' + CC.followA.join(' ')).toLowerCase(), g = [];
    [[/flor|flower|plant|garden/, ['Pruning shears', "Florist's knife", 'Roll of floral tape']],
     [/bar|bartend|restaurant|kitchen|chef|cook/, ['Bottle opener', 'Bar rag']],
     [/music|band|drum|guitar|bass/, ['Guitar picks (3)']],
     [/construct|contractor|carpent|mechanic|repair|handy/, ['Claw hammer', 'Tape measure']],
     [/nurse|medic|doctor|emt/, ['Trauma shears', 'Gauze roll']],
     [/office|computer|engineer|code|account/, ['Laptop (12% battery)']]]
      .forEach(function (p) { if (p[0].test(t)) g = g.concat(p[1]); });
    g = g.concat(['Phone (no signal)', 'Keys on a ring']);
    CC.gear = g.slice(0, 6).map(function (n) { return item(n); }).filter(Boolean);
  }
  function ccSuggestLocal(skillsOnly) {
    var t = (CC.answers.join(' ') + ' ' + CC.followA.join(' ')).toLowerCase();
    var KW = { STR: /lift|gym|haul|carry|construct|labor|warehouse|move furniture|strong|wrestl|farm/g, DEX: /run|climb|dance|skate|surf|bike|sport|guitar|drum|bass|quick|nimble|outran/g, CON: /tour|marathon|hike|endur|long hours|night shift|no sleep|tough|road/g,
      INT: /engineer|code|program|read|school|degree|science|account|business|fix|repair|figure out|research/g, WIS: /parent|nurse|outdoor|camp|direction|map|patient|notice|calm|meditat|fix it myself/g, CHA: /sales|music|perform|band|teach|manage|host|talk|owner|negotiat|lead|crowd/g };
    var score = {}; STATS.forEach(function (k) { score[k] = (t.match(KW[k]) || []).length; });
    if (!skillsOnly) {
      var order = STATS.slice().sort(function (a, b) { return score[b] - score[a]; }), arr = [15, 14, 13, 12, 10, 8], st = {};
      order.forEach(function (k, i) { st[k] = arr[i]; }); // 9+7+5+4+2+0 = 27
      CC.stats = st; CC.note = 'Keyword read of your answers: strongest in ' + STAT_NAMES[order[0]] + ', weakest in ' + STAT_NAMES[order[5]] + '. Adjust if the System got you wrong.';
    }
    var SK = [['Performance', /music|band|perform|stage|tour|sing|bass|guitar|drum/], ['Road-Worn', /tour|road|van|bus|drive|travel/], ['Jury-Rig', /fix|repair|handy|build|tinker|duct tape/], ['De-escalation', /calm|talk.*down|de-?escalat|mediat|customer|manag/],
      ['Pathfinding', /direction|map|navigat|lost|hike/], ['Haggling', /sales|deal|negotiat|business|owner|shop|store/], ['Athletics', /gym|lift|sport|climb|swim/], ['Getaway', /ran away|outran|run|escape/], ['First Aid', /nurse|medic|first aid|emt|parent/],
      ['Cooking', /cook|chef|kitchen|bake/], ['Stealth', /sneak|quiet|hunt/], ['Investigation', /research|investigat|detail|puzzle/]];
    if (!CC.gear.length) ccGearLocal();
    if (!CC.outfit.length) CC.outfit = outfitLocal(CC.answers[CC.answers.length - 1]);
    CC.skills = {}; var used = 0;
    SK.forEach(function (p) { if (p[1].test(t) && used < SKILL_BUDGET) { var v = Math.min(2, SKILL_BUDGET - used); CC.skills[p[0]] = v; used += v; } });
  }
