
  // ===================== life in the dungeon: buffs, Second Wind, slow healing, and the safe-room kitchen =====================
  // Buffs live on the character with an expiry time, so a reload keeps them.
  var BUFFS = {
    caffeine: { name: 'Caffeinated', icon: '☕', desc: '+10% XP and +2 initiative.' },
    jitters: { name: 'Jittery', icon: '〰', desc: 'Three coffees. Your hands shake: -1 to hit.' },
    fed: { name: 'Well Fed', icon: '🍲', desc: 'A hot meal: you heal 1 HP every 5 seconds outside fights.' },
    rested: { name: 'Rested', icon: '☾', desc: 'A real nap: +1 to hit.' },
    sugar: { name: 'Sugar Rush', icon: '✦', desc: '+1 to hit, then a crash.' },
    minty: { name: 'Minty Fresh', icon: '❄', desc: '+2 to talking (Charisma) checks.' }
  };
  function buffs() { var c = CHAR; if (!c) return {}; c.buffs = c.buffs || {}; var now = Date.now(); Object.keys(c.buffs).forEach(function (k) { if (c.buffs[k] <= now) delete c.buffs[k]; }); return c.buffs; }
  function buffHas(k) { return !!buffs()[k]; }
  function buffOn(k, ms) { var b = buffs(); b[k] = Math.max(b[k] || 0, Date.now() + ms); cbSaveChar(); buffDraw(); }
  function buffHit() { return (buffHas('rested') ? 1 : 0) + (buffHas('sugar') ? 1 : 0) - (buffHas('jitters') ? 1 : 0); }
  function buffInit() { return buffHas('caffeine') ? 2 : 0; }
  function buffXP(n) { return buffHas('caffeine') ? Math.round(n * 1.1) : n; }
  function buffDraw() {
    var el = document.getElementById('buffs'); if (!el) return; var b = buffs(), now = Date.now(), c = CHAR;
    var sw = c && !c.swUsed && !c.dead ? '<button type="button" class="bf sw" id="bfSW" title="Second Wind: heal 1d10 + your level. Once, then rest to recharge."><b>✚</b>Second Wind</button>' : '';
    var html = Object.keys(b).map(function (k) { var d = BUFFS[k] || { name: k, icon: '•', desc: '' }, m = Math.max(1, Math.ceil((b[k] - now) / 60000)); return '<span class="bf' + (k === 'jitters' ? ' bad' : '') + '" title="' + esc(d.name + ': ' + d.desc) + '"><b>' + d.icon + '</b>' + esc(d.name) + ' <i>' + m + 'm</i></span>'; }).join('') + sw;
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    var s = document.getElementById('bfSW'); if (s) s.onclick = secondWind;
    el.style.display = !CHAR || gearOpen || CC || AUTH.open ? 'none' : '';
  }
  // Second Wind: a System-issued freebie every crawler gets. Heal 1d10 + level; in a fight it is your bonus action.
  function secondWind() {
    var c = CHAR; if (!c || c.dead || PC.down) return;
    if (c.swUsed) { say('Second Wind', 'Used up. A nap in a safe room recharges it.', 3000); return; }
    if (PC.hp >= PC.max) { say('Second Wind', 'You are not hurt. Save it.', 2500); return; }
    if (CB.on) { if (!cbMyTurn() || CB.busy || !CB.res.bonus) { say('Not now', 'In a fight Second Wind is your bonus action, on your turn.', 2600); return; } CB.res.bonus = 0; }
    var h = d(1, 10) + (PC.level || 1), was = PC.hp; PC.hp = Math.min(PC.max, PC.hp + h); c.swUsed = true;
    floater(P.px, 1.6, P.pz, '+' + (PC.hp - was), 'heal'); kitOneShot('Interact');
    say('Second Wind', 'You dig deep: +' + (PC.hp - was) + ' HP. Recharges when you nap in a safe room.', 4000);
    cbSaveChar(); cbHUD(); buffDraw();
  }
  // slow healing outside fights: 1 HP every 15 s (every 5 s when Well Fed), after 8 s without a fight
  setInterval(function () {
    if (!CHAR || CHAR.dead || PC.down || CB.on || typeof P === 'undefined') return;
    var now = performance.now(); if (CB.lastFight && now - CB.lastFight < 8000) return;
    var every = buffHas('fed') ? 5000 : 15000; if (!PC.regenT || now - PC.regenT >= every) { PC.regenT = now; if (PC.hp < PC.max) { PC.hp++; cbHUD(); } }
  }, 1000);
  setInterval(buffDraw, 15000);

  // ---------- the safe-room kitchen: things you can actually use ----------
  var SAFE_ACTS = {
    'Coffee machine': [{ label: 'Drink a coffee', auto: 'coffee' }, { label: 'Examine', text: 'A sponsored espresso machine. It is the cleanest thing on this floor. A sticker says ONE PER CRAWLER PER BREAK. Nobody enforces it.' }],
    'Stove': [{ label: 'Cook a hot meal', auto: 'cook' }, { label: 'Examine', text: 'Four burners, one of them works. There are ingredients in the cupboard and a laminated recipe card in the System\'s handwriting.' }],
    'Fridge': [{ label: 'Raid the fridge', auto: 'fridge' }, { label: 'Examine', text: 'A humming fridge covered in magnets from places that no longer exist.' }],
    'Bunk bed': [{ label: 'Take a nap', auto: 'nap' }, { label: 'Examine', text: 'A narrow bunk with a scratchy blanket. Someone carved a tally into the frame. They stopped at 41.' }],
    'Sink': [{ label: 'Splash your face', auto: 'sink' }],
    'TV': [{ label: 'Watch the replay', auto: 'tv' }]
  };
  function actsOf(t) { var lk = LEVEL.links && LEVEL.links[t.key]; if (lk) return [{ label: lk.label, auto: 'link', link: lk }, { label: 'Examine', text: 'A creaky staircase. Every step has its own opinion.' }]; if (t.c === 'o') { var nm = LEVEL.dname[t.key]; if (SAFE_ACTS[nm]) return SAFE_ACTS[nm]; } return woodActs(t, ACTS[t.c]); }
  // anything wooden can be broken down for arrow shafts (once each)
  var WOODY = /chair|table|desk|shelf|shelving|bookcase|book|crate|barrel|bench|cabinet|pallet|bed|bunk|dresser|stool|cart|wagon|fence|rack|box|drawer|wardrobe|counter|piano|coffin|sign|post|trough|ladder|door/i, NOTWOOD = /lamp|boulder|bars|metal|steel|iron|fridge|refrigerator|stove|oven|tv|television|computer|monitor|washer|dryer|sink|toilet|locker|vending|machine|filing|safe/i;
  function isWoody(t) { if (t.c === 'T' || t.c === 'h' || t.c === 'K' || t.c === 'W') return true; if (t.c !== 'o') return false; var nm = (LEVEL.dname[t.key] || '') + ' ' + ((LEVEL.decor && LEVEL.decor[t.key] && (LEVEL.decor[t.key].m || LEVEL.decor[t.key].model)) || ''); return WOODY.test(nm) && !NOTWOOD.test(nm); }
  function woodActs(t, list) { if (!list || !isWoody(t)) return list; return list.concat([{ label: 'Break it down for wood', auto: 'wood' }]); }
  function safeAct(a, t) {
    var c = CHAR, now = Date.now(); if (!c) { say('Not yet', 'Create a character first.', 2500); return true; }
    c.cool = c.cool || {};
    if (a.auto === 'link') { takeLink(a.link); return true; }
    if (a.auto === 'wood') {
      if (done[t.key + 'wood']) { say('Already stripped', 'You already took everything useful off this one.', 2600); return true; }
      var r = d20(), tot = r + MOD.STR + (skillLv('Athletics') || 0), ok = r === 20 || (r !== 1 && tot >= 10); kitOneShot('Punch_Jab');
      if (!ok) { say('Failure · Break it down · d20 ' + r + ' + ' + (tot - r) + ' = ' + tot + ' vs DC 10', 'It holds together out of spite. Try again.', 3200); return true; }
      var n = r >= 15 ? 2 : 1; done[t.key + 'wood'] = true; invAdd(item('Splintered wood', { qty: n, from: 'furniture you broke' }), true); saveChar(CHAR);
      vfxBurst(t.x, t.z, 0x9a6a3a, 14, 2); say('Success · Break it down · d20 ' + r + ' + ' + (tot - r) + ' = ' + tot + ' vs DC 10', 'You crack off ' + (n > 1 ? 'two good lengths' : 'a usable length') + ' of wood. Splintered wood ×' + n + '. Two pieces make arrows, or one piece and a tip.', 5000);
      return true;
    }
    if (a.auto === 'coffee') {
      c.cups = (c.cups || []).filter(function (x) { return now - x < 15 * 60000; }); c.cups.push(now);
      buffOn('caffeine', 15 * 60000); kitOneShot('Interact');
      if (c.cups.length >= 3) { buffOn('jitters', 5 * 60000); say('Coffee #' + c.cups.length, 'Your eyelid is twitching. Caffeinated (+10% XP, +2 initiative) and now Jittery (-1 to hit) for five minutes. The System recommends water.', 6000); }
      else say('Coffee', lpick(['Bitter, hot and free. Caffeinated: +10% XP and +2 initiative for 15 minutes.', 'The machine dispenses a perfect espresso and a coupon you cannot use. Caffeinated for 15 minutes: +10% XP, +2 initiative.', 'It tastes like a sponsor. You feel sharper anyway: +10% XP, +2 initiative for 15 minutes.']), 5000);
      if (c.cups.length === 1) setTimeout(function () { achieve('coffee', 'Productive Member of the Crawl', 'You found the coffee machine. The System notes that coffee increases output.', 10); }, 5200);
      return true;
    }
    if (a.auto === 'cook') {
      if (c.cool.cook && now < c.cool.cook) { say('Still full', 'You cooked recently. Try again in ' + Math.ceil((c.cool.cook - now) / 60000) + ' minutes.', 3000); return true; }
      c.cool.cook = now + 10 * 60000; var got = PC.max - PC.hp; PC.hp = PC.max; buffOn('fed', 20 * 60000); kitOneShot('Interact'); skillCount('eat'); skillUse('Cooking');
      say('Hot meal', lpick(['You fry up something from the cupboard. It might have been spam. ', 'Instant noodles, an egg and a heroic amount of hot sauce. ', 'Grilled cheese, slightly burned, perfect. ']) + (got ? '+' + got + ' HP. ' : '') + 'Well Fed for 20 minutes: you heal 1 HP every 5 seconds outside fights.', 6000);
      cbHUD(); return true;
    }
    if (a.auto === 'fridge') {
      var k = 'fridge' + t.key; if (c.cool[k] && now < c.cool[k]) { say('Empty', 'You already raided this one. It restocks in ' + Math.ceil((c.cool[k] - now) / 60000) + ' minutes.', 3000); return true; }
      c.cool[k] = now + 15 * 60000; var nm = lpick(['Energy bar', 'Bottle of water', 'Craft services sandwich', 'Energy bar']), it = item(nm, { from: 'a safe-room fridge' });
      if (it) { invAdd(it); if (/bar/i.test(nm) && Math.random() < 0.5) { buffOn('sugar', 3 * 60000); say('Fridge', 'You take ' + nm.toLowerCase() + ' and eat a second one standing at the open door. Sugar Rush: +1 to hit for 3 minutes.', 5000); } else say('Fridge', 'You take ' + nm.toLowerCase() + '. Someone labelled it "DO NOT TOUCH - KEVIN". Kevin is not here.', 4500); }
      return true;
    }
    if (a.auto === 'nap') {
      if (c.cool.nap && now < c.cool.nap) { say('Not tired', 'You just napped. You can sleep again in ' + Math.ceil((c.cool.nap - now) / 60000) + ' minutes.', 3000); return true; }
      c.cool.nap = now + 5 * 60000; var gn = PC.max - PC.hp; PC.hp = PC.max; var rc = 0; (c.gear || []).forEach(function (g) { if (g.recharge === 'nap' && g.uses && g.usesLeft !== undefined && g.usesLeft < g.uses) { g.usesLeft = g.uses; rc++; } }); c.swUsed = false; buffOn('rested', 30 * 60000); delete buffs().jitters; kitOneShot('Interact');
      say('Nap', 'You sleep for twenty minutes and dream about the surface. ' + (gn ? '+' + gn + ' HP. ' : '') + 'Second Wind recharged. ' + (rc ? 'Magic items recharged. ' : '') + 'Rested for 30 minutes: +1 to hit.', 6000);
      cbHUD(); buffDraw(); return true;
    }
    if (a.auto === 'sink') { if (buffHas('jitters')) { delete buffs().jitters; buffDraw(); say('Cold water', 'The shaking stops. Jittery is gone.', 3500); } else say('Cold water', 'Refreshing. Your reflection looks like it has been through a lot.', 3000); return true; }
    if (a.auto === 'tv') { say('Replay', lpick(['Highlights from another floor: a crawler fights a goose. The goose wins. The audience loved it.', 'An ad for a potion that "may cause tentacles". The jingle is very catchy.', 'A replay of your last fight, in slow motion, with commentary. The commentator is not kind.']), 6000); return true; }
    return false;
  }
  function lpick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // ---------- tools you carry open up options: a crowbar pries, keys unlock, a tape measure finds rooms that don't add up ----------
  var TOOL_ACTS = [
    { tool: /crowbar/i, on: 'C', a: { label: 'Pry it open with the crowbar', stat: 'STR', skill: ['Athletics', 0], dc: 7, flag: 'open', win: 'The crowbar does what crowbars were born to do. The lid pops.', lose: 'The crowbar slips. Try again, with feeling.' } },
    { tool: /crowbar/i, on: 'K', a: { label: 'Pry the lid off with the crowbar', stat: 'STR', dc: 8, flag: 'loot', win: 'Nails shriek, the lid comes up.', lose: 'One nail holds out. It is mocking you.' } },
    { tool: /crowbar/i, on: 'H', a: { label: 'Pry at the seams with the crowbar', stat: 'STR', skill: ['Perception', 0], dc: 11, flag: 'found', win: 'The crowbar finds a gap that should not be there. The wall swings inward.', lose: 'Solid stone. The crowbar rings.' } },
    { tool: /crowbar|hammer/i, on: 'o', a: { label: 'Pry it apart', stat: 'STR', dc: 10, flag: 'loot', win: 'Something was wedged inside.', lose: 'It is sturdier than it looks.' } },
    { tool: /hammer/i, on: 'C', a: { label: 'Knock the hinges out with the hammer', stat: 'STR', skill: ['Jury-Rig', 0], dc: 9, flag: 'open', win: 'Two good whacks and the hinge pins pop out.', lose: 'You hit your thumb. The box is fine.' } },
    { tool: /hammer/i, on: 'K', a: { label: 'Smash it with the hammer', stat: 'STR', dc: 9, flag: 'loot', win: 'Planks fly. Something rolls out.', lose: 'The crate absorbs the blow like a pro.' } },
    { tool: /key/i, on: 'C', a: { label: 'Try your keys on the lock', stat: 'DEX', skill: ['Lockpicking', 0], dc: 11, flag: 'open', win: 'The third key almost fits, and almost is enough. Click.', lose: 'None of them fit. Of course they don\'t.' } },
    { tool: /shear|knife|scissor/i, on: 'K', a: { label: 'Cut through the straps', stat: 'DEX', dc: 9, flag: 'loot', win: 'The straps part and the crate sighs open.', lose: 'These straps were made by someone who hated you specifically.' } },
    { tool: /flashlight|phone/i, on: 'H', a: { label: 'Shine a light along the wall', stat: 'WIS', skill: ['Perception', 0], dc: 10, flag: 'found', win: 'The light catches a hairline seam. A push, and the wall swings inward.', lose: 'Just shadows.' } },
    { tool: /tape measure/i, on: 'H', a: { label: 'Measure the wall', stat: 'INT', skill: ['Investigation', 0], dc: 9, flag: 'found', win: 'The numbers don\'t add up: there are four feet missing. You find the seam.', lose: 'The numbers add up. Annoyingly.' } },
    { tool: /duct tape|floral tape/i, on: 'R', a: { label: 'Tape a funnel and tap it', stat: 'DEX', skill: ['Jury-Rig', 0], dc: 9, win: 'A neat little spout. Purple drizzle. You still decide not to drink it.', lose: 'The tape will not stick to the wet wood.' } }
  ];
  var _actsOf = actsOf;
  actsOf = function (t) {
    var base = _actsOf(t) || [], c = CHAR; if (!c || !c.gear) return base;
    var names = c.gear.map(function (g) { return g.name; }).join(' | ');
    var extra = TOOL_ACTS.filter(function (x) { return x.on === t.c && x.tool.test(names); }).map(function (x) { return x.a; });
    return extra.length ? extra.concat(base) : base;
  };

  // ---------- the way down: the stairs only work once the Gatekeeper is dead ----------
  function stairsCheck() { if (ch(P.x, P.z) === 'S' && stairsOpen() && !CB.on && CHAR && !document.getElementById('fclear')) floorClear(); }
  function floorClear() {
    var c = CHAR, first = !c.cleared1; if (first) c.cleared1 = Date.now();
    var dead = CB.enemies.filter(function (e) { return e.dead && !e.npc; }), bosses = dead.filter(function (e) { return e.boss; }).map(function (e) { return e.name; });
    var mins = Math.max(1, Math.round(((c.cleared1 || Date.now()) - (c.born || Date.now())) / 60000)), hrs = Math.floor(mins / 60);
    var recipes = Object.keys(c.recipes || {}).filter(function (k) { return c.recipes[k].inventor; }).length;
    var rows = [['Level', c.level], ['Time on the floor', hrs ? hrs + 'h ' + (mins % 60) + 'm' : mins + ' min'], ['Monsters killed', dead.length], ['Bosses', bosses.length + ' of 6'], ['Gold', (c.gold || 0) + ' gp'], ['Recipes invented', recipes], ['Achievements', Object.keys(c.ach || {}).length], ['Map explored', document.getElementById('explored').textContent.replace('Explored ', '')]];
    var el = document.createElement('div'); el.id = 'fclear'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Floor 1 cleared');
    el.innerHTML = '<div class="fc"><small>SYSTEM ANNOUNCEMENT</small><h2>Floor 1 cleared</h2><p class="q">"Well. That was unexpected. The Strong Guys Club has survived Basic Training. Odds are being recalculated. Viewers are confused but engaged."</p>' +
      '<table>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(String(r[1])) + '</td></tr>'; }).join('') + '</table>' +
      (bosses.length ? '<p class="b"><b>Bosses down:</b> ' + bosses.map(esc).join(', ') + '</p>' : '') +
      '<div class="soon"><b>Floor 2 · The Backlot</b><span>A studio backlot: six sets round a catering village. Still being built, so some of it is rough. You can come back up any time.</span></div>' +
      '<button type="button" id="fcGo">Take the stairs down</button> <button type="button" id="fcStay">Stay on Floor 1 for now</button></div>';
    document.body.appendChild(el);
    document.getElementById('fcStay').onclick = function () { el.remove(); }; document.getElementById('fcGo').onclick = function () { cbSaveChar(); dmFloor(2); };
    if (first) { logEvent('Cleared Floor 1', 'boss'); achieve('floor1', 'Basic Training: Passed', 'You found the stairs. The System had money on you not finding the stairs.', 500); }
    cbSaveChar();
  }
  (function () { var c = document.createElement('style'); c.textContent = '#fclear{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(8,6,4,.78);padding:12px}' +
    '#fclear .fc{width:min(520px,100%);max-height:100%;overflow-y:auto;padding:18px 22px;background:linear-gradient(180deg,#F3E9D2,#E6D7B5);border:3px double #2e2116;border-radius:4px;color:#2b1d12;font-family:"EB Garamond",serif;box-shadow:0 10px 40px rgba(0,0,0,.7)}' +
    '#fclear small{font-family:Cinzel,serif;letter-spacing:.14em;color:#7A1F1A;font-size:11px}#fclear h2{margin:2px 0 6px;font-family:Cinzel,serif;font-size:28px}#fclear .q{font-style:italic;margin:0 0 10px}' +
    '#fclear table{width:100%;border-collapse:collapse;font-size:15px}#fclear td{padding:3px 0;border-bottom:1px solid rgba(43,29,18,.18)}#fclear td:last-child{text-align:right;font-weight:600}' +
    '#fclear .b{font-size:14px;margin:8px 0}#fclear .soon{margin:12px 0;padding:10px 12px;border:1px dashed #6b5a3a;background:rgba(255,250,235,.5)}#fclear .soon b{display:block;font-family:Cinzel,serif}#fclear .soon span{font-size:14px}#fcGo{height:42px;padding:0 18px;border:2px solid #2e0a06;border-radius:3px;background:#7A1F1A;color:#F3E6CC;font-family:Cinzel,serif;font-size:14px;cursor:pointer;margin-right:6px}#fcStay{height:42px;padding:0 18px;border:2px solid #2e2116;border-radius:3px;background:#2b1d12;color:#F3E6CC;font-family:Cinzel,serif;font-size:14px;cursor:pointer}';
    document.head.appendChild(c); })();

  (function () { var t = document.getElementById('title'); if (t && FLOOR === 2) t.firstChild.nodeValue = 'Floor 2 · '; })();
  // ---------- DM mode: jump between floors, switch monster aggression off ----------
  function dmPanel() {
    var old = document.getElementById('dmBox'); if (old) { old.remove(); return; }
    var el = document.createElement('div'); el.id = 'dmBox'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'DM mode');
    el.innerHTML = '<small>DM MODE</small><h3>Playing as</h3><div class="row"><button type="button" data-as="player"' + (!isDM() ? ' class="on"' : '') + '>' + esc((CHAR && !CHAR.isDM && CHAR.name) || (CHAR && CHAR.realName) || 'My character') + '</button><button type="button" data-as="dm"' + (isDM() ? ' class="on"' : '') + '>The DM (sandbox)</button></div>' +
      (isDM() ? '<p>The DM is a separate character on this device: everything you do here stays here. Monsters ignore you; tap one and choose <b>DM: aggro</b> to fight it.</p><div class="row"><button type="button" id="dmImm" class="' + (DM.immortal ? 'on' : '') + '">' + (DM.immortal ? 'Can\'t die: on' : 'Can\'t die: off') + '</button></div>' +
        '<h3>Give any item</h3><input id="dmQ" type="search" placeholder="Search items (name, kind, tag)" autocomplete="off" style="width:100%;box-sizing:border-box;min-height:40px;padding:6px 10px;border:2px solid #2e2116;border-radius:3px;background:#fffaf0;font:16px EB Garamond,serif"><div id="dmItems" class="row" style="margin-top:6px;max-height:220px;overflow-y:auto"></div>' : '') +
      '<h3>Effects preview</h3><p>Fires at the nearest monster you can see, or ahead of you. Looks only: no damage, no fight.</p><div class="row">' + VFX_PREVIEW.map(function (v) { return '<button type="button" data-vfx="' + v[1] + '">' + v[0] + '</button>'; }).join('') + '</div>' +
      '<h3>Floors</h3><div class="row"><button type="button" data-f="1"' + (FLOOR === 1 ? ' class="on"' : '') + '>Floor 1 · Basic Training</button><button type="button" data-f="2"' + (FLOOR === 2 ? ' class="on"' : '') + '>Floor 2 · The Backlot</button></div>' +
      (isDM() ? '' : '<h3>Monsters on this floor</h3><div class="row"><button type="button" id="dmPeace" class="' + (DM.peace ? 'on' : '') + '">' + (DM.peace ? 'Peaceful: they ignore you' : 'Hostile: they attack on sight') + '</button></div>') +
      (edCanPublish() ? '<h3>Level editor</h3><p>Move, turn or remove props, monsters and NPCs on this floor. Nothing changes for anyone else until you publish.' + (EDIT.draft.length ? ' You have ' + EDIT.draft.length + ' unpublished change' + (EDIT.draft.length === 1 ? '' : 's') + ' in your draft.' : '') + ' Published edits on this floor: ' + EDIT.pub.length + '.</p><div class="row"><button type="button" id="dmEdit">Open the editor</button>' + (EDIT.draft.length ? '<button type="button" id="dmEdPub">Publish my draft</button>' : '') + '<button type="button" id="dmEdEx">Copy edits (export)</button><button type="button" id="dmEdIm">Paste edits (import)</button>' + (EDIT.pub.length || EDIT.draft.length ? '<button type="button" id="dmEdClr">Clear all edits on this floor</button>' : '') + '</div><textarea id="dmEdTxt" style="display:none;width:100%;box-sizing:border-box;min-height:70px;margin-top:6px;font:11px monospace"></textarea>' : '') +
      '<h3>Test gear</h3><div class="row"><button type="button" id="dmRusty">Give me every Soundstage weapon</button><button type="button" id="dmAll">Give me every item in the game</button></div>' +
      '<p>Your spot on each floor is saved, so you come back where you left. Gear, level and gold travel with you.</p><p><a href="credits.html" target="_blank" rel="noopener">Asset credits</a></p><button type="button" id="dmX">Close</button>';
    document.body.appendChild(el);
    el.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { var f = +b.getAttribute('data-f'); if (f === FLOOR) return; if (CB.on) { say('DM mode', 'Finish the fight first.', 2500); return; } b.textContent = 'Going…'; dmFloor(f); }; });
    el.querySelectorAll('[data-vfx]').forEach(function (b) { b.onclick = function () { vfxPreview(b.getAttribute('data-vfx')); }; });
    el.querySelectorAll('[data-as]').forEach(function (b) { b.onclick = function () { var w = b.getAttribute('data-as'); if (w === DM.as) return; if (CB.on) { say('DM mode', 'Finish the fight first.', 2500); return; } b.textContent = 'Switching…'; dmAs(w); }; });
    var imm = document.getElementById('dmImm'); if (imm) imm.onclick = function () { DM.immortal = !DM.immortal; dmSave(); this.classList.toggle('on', DM.immortal); this.textContent = DM.immortal ? 'Can\'t die: on' : 'Can\'t die: off'; };
    var dq = document.getElementById('dmQ'); if (dq) { var dmList = function () { var q = dq.value.trim().toLowerCase(), box = document.getElementById('dmItems');
        var names = Object.keys(ITEMS).filter(function (n) { var I = ITEMS[n]; return !q || (n + ' ' + I.cat + ' ' + (I.tags || []).join(' ') + ' ' + (I.rarity || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 60);
        box.innerHTML = names.map(function (n) { return '<button type="button" data-give="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') || '<p>Nothing matches.</p>';
        box.querySelectorAll('[data-give]').forEach(function (b) { b.onclick = function () { var n = b.getAttribute('data-give'), it = item(n, { from: 'DM mode' }); if (!it) return; if (ITEMS[n].ammo) it.qty = 20; invAdd(it, true); saveChar(CHAR); b.textContent = n + ' ✓'; }; }); };
      dq.oninput = dmList; dq.addEventListener('keydown', function (ev) { ev.stopPropagation(); }); dmList(); }
    var pz = document.getElementById('dmPeace'); if (pz) pz.onclick = function () { DM.peace = !DM.peace; DM['peace' + FLOOR] = DM.peace; dmSave(); this.classList.toggle('on', DM.peace); this.textContent = DM.peace ? 'Peaceful: they ignore you' : 'Hostile: they attack on sight'; };
    var de = document.getElementById('dmEdit'); if (de) de.onclick = function () { edToggle(true); };
    var dp = document.getElementById('dmEdPub'); if (dp) dp.onclick = function () { dp.textContent = 'Publishing…'; EDIT.session = []; edPublish(EDIT.draft.slice()); el.remove(); };
    var dx = document.getElementById('dmEdEx'), dt = document.getElementById('dmEdTxt'); if (dx) dx.onclick = function () { dt.style.display = 'block'; dt.value = edExport(); dt.select(); try { navigator.clipboard.writeText(dt.value); dx.textContent = 'Copied'; } catch (x) { dx.textContent = 'Select and copy'; } };
    var di = document.getElementById('dmEdIm'); if (di) di.onclick = function () { if (dt.style.display !== 'block' || !dt.value.trim()) { dt.style.display = 'block'; dt.value = ''; dt.placeholder = 'Paste an export here, then tap Paste edits again'; dt.focus(); return; } say('Editor', edImport(dt.value), 5000); };
    if (dt) dt.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
    var dc = document.getElementById('dmEdClr'); if (dc) dc.onclick = function () { if (dc.textContent !== 'Tap again to clear') { dc.textContent = 'Tap again to clear'; return; } EDIT.draft = []; edSaveLocal('draft', []); EDIT.pub = []; edSaveLocal('pub', []); if (NET.mode === 'server') api('dm/edits', { method: 'PUT', body: { floor: FLOOR, ops: [] } }).then(function () { location.reload(); }, function (e) { say('Editor', 'Could not clear: ' + e.message, 4000); }); else location.reload(); };
    document.getElementById('dmRusty').onclick = function () { // every Soundstage weapon into your bag (skips ones you already have)
      var have = {}, got = 0; (CHAR.gear || []).forEach(function (x) { have[x.name] = 1; });
      Object.keys(ITEMS).forEach(function (n) { if (ITEMS[n].model && !have[n]) { var it = item(n, { from: 'DM mode' }); if (it) { CHAR.gear.push(it); got++; } } });
      saveChar(CHAR); this.textContent = got ? 'Added ' + got + ' weapons' : 'You have them all'; say('DM mode', got ? got + ' weapons are in your bag. Wield one from Inventory.' : 'Already in your bag.', 3000);
    };
    document.getElementById('dmAll').onclick = function () { // one of everything in items.js (ammo and stackables come as a stack), skipping what you already carry
      var have = {}, got = 0; (CHAR.gear || []).forEach(function (x) { have[x.name] = 1; });
      Object.keys(ITEMS).forEach(function (n) { if (have[n]) return; var it = item(n, { from: 'DM mode' }); if (!it) return; if (ITEMS[n].ammo) it.qty = 20; CHAR.gear.push(it); got++; });
      saveChar(CHAR); if (typeof hotAuto === 'function') hotAuto(); this.textContent = got ? 'Added ' + got + ' items' : 'You have everything';
      say('DM mode', got ? got + ' items are in your bag (arrows come in stacks of 20). Use the inventory search and category chips to find things.' : 'You already carry one of everything.', 4500);
    };
    document.getElementById('dmX').onclick = function () { el.remove(); };
  }
  (function () { var c = document.createElement('style'); c.textContent = '#dmBox{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;width:min(420px,92vw);max-height:92vh;overflow-y:auto;padding:14px 18px;background:linear-gradient(180deg,#F3E9D2,#E6D7B5);border:3px double #2e2116;border-radius:4px;color:#2b1d12;font-family:"EB Garamond",serif;box-shadow:0 10px 40px rgba(0,0,0,.7)}' +
    '#dmBox small{font-family:Cinzel,serif;letter-spacing:.14em;color:#7A1F1A;font-size:11px}#dmBox h3{margin:8px 0 4px;font-family:Cinzel,serif;font-size:15px}#dmBox .row{display:flex;flex-wrap:wrap;gap:6px}#dmBox p{font-size:14px;margin:10px 0}' +
    '#dmBox button{width:auto !important;height:auto !important;flex:0 1 auto;white-space:nowrap;min-height:40px;padding:0 12px;border:2px solid #2e2116;border-radius:3px;background:#efe3c6;color:#2b1d12;font-family:"EB Garamond",serif;font-weight:700;font-size:15px;cursor:pointer}#dmBox button.on{background:#2b1d12;color:#F3E6CC}#dmX{background:#7A1F1A !important;color:#F3E6CC !important}';
    document.head.appendChild(c); })();

  // stairs and other links: land on the landing, or the nearest free spot if something is standing there
  function takeLink(lk) {
    if (CB.on) { say('Not now', 'Finish the fight first.', 2500); return false; }
    for (var rad = 0; rad <= 3; rad++) for (var dz = -rad; dz <= rad; dz++) for (var dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
      if (heroTo(lk.x + dx, lk.z + dz)) { refreshFog(); enterRoom(); posSave(true); return true; }
    }
    say('Blocked', 'Something is in the way at the other end. Try again in a moment.', 3000); return false;
  }
  // the test server says so, so nobody mistakes it for the real game
  (function () { if (!/staging/i.test(location.hostname)) return; var b = document.createElement('div'); b.textContent = 'TEST SERVER'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:90;padding:2px 10px;background:#7A1F1A;color:#F3E9D2;font:700 12px Cinzel,serif;letter-spacing:.14em;border-radius:3px;pointer-events:none;opacity:.9';
    document.body.appendChild(b); })();
