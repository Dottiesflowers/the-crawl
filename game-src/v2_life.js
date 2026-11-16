
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
    'TV': [{ label: 'Watch the replay', auto: 'tv' }],
    'Coffee cart': [{ label: 'Get a coffee', auto: 'coffee' }],
    'Taco truck': [{ label: 'Examine', text: 'A taco truck with a hand-painted menu. Today\'s special is listed as "crawler". The cook swears that means a style.' }],
    'BBQ smoker': [{ label: 'Examine', text: 'A smoker the size of a car, trailing sweet smoke across Base Camp. Brisket for the crew, if the crew ever comes back.' }],
    'Generator': [{ label: 'Examine', text: 'The generator that feeds every set on the lot. It hums like it knows something.' }],
    'Tram bench': [{ label: 'Examine', text: 'A bench on the tour tram. Someone left a souvenir map and half a churro.' }]
  };
  // ---- the Floor 2 tour tram: tap a stop to mark it found; once the crew on the tram is beaten, ride between found stops ----
  function tramClear() { return !CB.enemies.some(function (e) { return e.tram && !e.dead; }); }
  function tramActs(t) {
    var st = (LEVEL.tram.stops || []).filter(function (q) { return q.x + ',' + q.z === t.key; })[0]; if (!st) return null;
    if (CHAR) { CHAR.tramSeen = CHAR.tramSeen || []; if (CHAR.tramSeen.indexOf(st.name) < 0) { CHAR.tramSeen.push(st.name); saveChar(CHAR); } }
    if (!tramClear()) return [{ label: 'Read the sign', text: st.name + '. The studio tour tram stops here, or it did until the crew took it over. It is parked on the south straight below Base Camp, and nobody is driving it anywhere until someone clears them off. This stop is now marked on your tram map.' }];
    var seen = (CHAR && CHAR.tramSeen) || [], acts = (LEVEL.tram.stops || []).filter(function (q) { return q.name !== st.name && seen.indexOf(q.name) >= 0; }).map(function (q) { return { label: 'Ride to ' + q.name, auto: 'tram', to: q }; });
    if (!acts.length) acts.push({ label: 'Read the sign', text: st.name + '. The tram is yours now, but you have not found any other stops yet. Tap the sign at another stop and you can ride there.' });
    return acts;
  }
  function actsOf(t) { var spa = spActs(t); if (spa) return spa; var lk = LEVEL.links && LEVEL.links[t.key]; if (lk) return [{ label: lk.label, auto: 'link', link: lk }, { label: 'Examine', text: 'A creaky staircase. Every step has its own opinion.' }]; if (t.c === 'o') { var nm = LEVEL.dname[t.key]; if (nm === 'Tram stop' && LEVEL.tram) { var ta = tramActs(t); if (ta) return ta; } if (nm === 'Call sheet board' && FLOOR === 2) return [{ label: 'Read the call sheet', auto: 'callsheet' }]; if (SAFE_ACTS[nm]) return SAFE_ACTS[nm]; if (/'s trailer$/.test(nm || '')) return [{ label: 'Examine', text: 'A star trailer with ' + nm.replace(/'s trailer$/, '') + ' on a paper sign taped to the door. The System assigned these. The air conditioning works, which is more than can be said for the plot.' }]; } return woodActs(t, ACTS[t.c]); }
  // anything wooden can be broken down for arrow shafts (once each)
  var WOODY = /chair|table|desk|shelf|shelving|bookcase|book|crate|barrel|bench|cabinet|pallet|bed|bunk|dresser|stool|cart|wagon|fence|rack|box|drawer|wardrobe|counter|piano|coffin|sign|post|trough|ladder|door/i, NOTWOOD = /lamp|boulder|bars|metal|steel|iron|fridge|refrigerator|stove|oven|tv|television|computer|monitor|washer|dryer|sink|toilet|locker|vending|machine|filing|safe/i;
  function isWoody(t) { if (t.c === 'T' || t.c === 'h' || t.c === 'K' || t.c === 'W') return true; if (t.c !== 'o') return false; var nm = (LEVEL.dname[t.key] || '') + ' ' + ((LEVEL.decor && LEVEL.decor[t.key] && (LEVEL.decor[t.key].m || LEVEL.decor[t.key].model)) || ''); return WOODY.test(nm) && !NOTWOOD.test(nm); }
  function woodActs(t, list) { if (!list || !isWoody(t)) return list; return list.concat([{ label: 'Break it down for wood', auto: 'wood' }]); }
  function safeAct(a, t) {
    var c = CHAR, now = Date.now(); if (!c) { say('Not yet', 'Create a character first.', 2500); return true; }
    c.cool = c.cool || {};
    if (a.auto === 'link') { takeLink(a.link); return true; }
    if (a.auto === 'setp') { a.sp._cover = a.cover || null; spFire(a.sp); return true; }
    if (a.auto === 'tram') { if (CB.on) { say('Not now', 'Finish the fight first.', 2500); return true; } if (takeLink({ x: a.to.ax, z: a.to.az })) say('All aboard', 'The tram whirs round the loop with you as its only passenger. ' + a.to.name + '. Please keep your hands inside the vehicle.', 4000); return true; }
    if (a.auto === 'callsheet') { var sl = (c.slates || []), left = Math.max(0, 3 - sl.length);
      say('Call sheet', sl.length ? 'Scenes wrapped: ' + sl.join(', ') + '. ' + (left ? left + ' more slate' + (left > 1 ? 's' : '') + ' and Soundstage 9 opens.' : 'Soundstage 9 is open to you. The Director is waiting.') : 'Six sets are shooting: Frontier Town, the Jungle Set (two bosses), Starship Valiant, Maple Lane, Blackwood Manor and the Writers\' Building. Beat a set boss and you get its slate. Three slates open Soundstage 9, and the way down.', 9000); return true; }
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
  // ---- set pieces: one-time things you can set off (Floor 2 so far). Level data in LEVEL.setp (tile key -> piece) ----
  function spKey(sp) { return FLOOR + ':' + curLV() + ':' + sp.id; }
  function spDone(sp) { return !!(CHAR && CHAR.setp && CHAR.setp[spKey(sp)]); }
  function spInRect(sp, x, z) { return x >= sp.x0 && x <= sp.x1 && z >= sp.z0 && z <= sp.z1; }
  function spDecor(x, z, from, to) { var L = LEVEL.decor[x + ',' + z]; if (L) L.forEach(function (d) { if (d.m === from) d.m = to; }); }
  var SP_DONE_TXT = { chandelier: 'The chandelier is on the floor in pieces. The rope hangs loose.', train: 'The stunt train sits past the crossing, ticking as it cools.', tower: 'The water tower lies across the street on its side. Everything smells like a wet barn.',
    keg: 'A scorched ring on the floor where the keg was.', bridge: 'Two frayed ropes and a long drop into the river. No more bridge.', idol: 'An empty altar. The idol is in your bag and the boulder is in the wall.', ride: 'The ride\'s control box is a smoking ruin.', warpcore: 'The warp core is dark and cracked. The ship is very quiet now.', fans: 'The big fans have spun down. Everything that was in the cargo bay is now somewhere else.', gimbal: 'The gimbal controls are jammed at full tilt. Nobody is rocking this ship again.', bookcase: 'The bookcase stands open: a door into the foyer.', pile: 'Spec scripts all over the floor. Somebody\'s cop show about a dog is face up on top.' };
  var SP_LOOK = { chandelier: 'A rope runs up from this cleat to the big wagon-wheel chandelier over the middle of the saloon. Cut it and whatever is underneath has a very bad night.', train: 'The stunt train\'s brake lever. Let it off and the train rolls through the road crossing, whoever is standing on it.',
    tower: 'A wooden water tower on four legs, full and sloshing. One good knock on a leg and it comes down across the street.', keg: 'A keg of black powder with DANGER painted on it and a long fuse. Real powder, on a fake set.', bridge: 'The ropes holding the bridge up are tied off here. Cut them and anything on the bridge goes in the river.',
    idol: 'A golden idol on the altar, the only real thing in the temple. Something about the stone it sits on says "pressure plate".', warpcore: 'The console for the warp core: a glowing column of prop plasma with a real transformer in it. Push it past the red line and everything in the engine room gets the full current.', fans: 'The controls for the giant fans behind the cargo bay doors, the ones that make it look like space. Hit the switch and everything in the bay goes flying.', gimbal: 'The ship sits on a hydraulic gimbal so it can rock for battle scenes. Rock it now and everyone aboard goes off their feet.', bookcase: 'One book sticks out further than the others. Classic.', pile: 'A tower of unread spec scripts, taller than you and leaning badly. Nobody has read one since the strike started. A good shove would bring the lot down on whoever is standing near it.', ride: 'The control box for the dinosaur ride, humming with far too much power. Overload it and the animatronics get all of it at once.' };
  function spActs(t) { var sp = LEVEL.setp && LEVEL.setp[t.key]; if (!sp) return null;
    if (sp.kind === 'camera') { if (spDone(sp)) return [{ label: 'Examine', text: 'What is left of a studio camera. The tally light is dark for good.' }];
      var cv = camCover(), on = camOn(sp), out = [{ label: 'Smash the camera', auto: 'setp', sp: sp }]; if (cv) out.push({ label: 'Cover the lens (' + cv.name + ')', auto: 'setp', sp: sp, cover: cv });
      out.push({ label: 'Examine', text: on ? 'A studio camera on a tripod, sweeping slowly back and forth, red tally light blinking. If it catches you at the end of a move the whole set sees you on the monitors. If it catches you winning, the audience loves it. Crouch to sneak past, smash it (loud), or cover the lens with something sticky.' : 'A studio camera with its feed cut. It still sweeps out of habit, but nobody is watching.' }); return out; }
    if (spDone(sp)) return [{ label: 'Examine', text: sp.done || SP_DONE_TXT[sp.kind] || 'Already done.' }];
    return [{ label: sp.label, auto: 'setp', sp: sp }, { label: 'Examine', text: sp.look || SP_LOOK[sp.kind] || sp.name }]; }
  function spHurtPC(n, kind, save) { if (save) { var sv = d20() + (MOD.DEX || 0); if (sv >= save) n = Math.floor(n / 2); } if (n <= 0) return; PC.hp = Math.max(0, PC.hp - n); floater(P.px, 1.5, P.pz, '-' + n + ' ' + kind, 'pdmg'); cbHUD(); if (PC.hp <= 0 && CB.on) cbFall(); return n; }
  function spFoes(test) { return CB.enemies.filter(function (e) { return !e.dead && !e.npc && test(e); }); }
  function spFire(sp) {
    if (spDone(sp)) return; if (CB.on && !CB.res.action) { say('No action left', 'Setting that off takes your action. Next turn.', 2600); return; }
    if (CB.on) CB.res.action = 0;
    var hit = [], notes = [], title = sp.name, dmgKind = 'bludgeoning', self = 0, inR = function (e) { return spInRect(sp, e.x, e.z); };
    if (sp.kind === 'chandelier') { title = 'CRASH'; hit = spFoes(function (e) { return Math.abs(e.x - sp.cx) <= 1 && Math.abs(e.z - sp.cz) <= 1; }); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '3d6' }, { type: 'prone' }], e)); });
      if (Math.abs(P.x - sp.cx) <= 1 && Math.abs(P.z - sp.cz) <= 1) self = spHurtPC(rollDice('3d6'), 'bludgeoning', 13); spDecor(sp.cx, sp.cz, '#chandelier', '#chandelier_down'); vfxHit('steel', sp.cx, sp.cz, 0.5);
      notes.unshift('You cut the rope. The chandelier comes down like a wagon wheel off a cliff.'); }
    else if (sp.kind === 'train') { title = 'CHOO CHOO'; hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '4d6' }, { type: 'prone' }], e)); }); if (spInRect(sp, P.x, P.z)) self = spHurtPC(rollDice('4d6'), 'bludgeoning', 14);
      spTrainRun(sp); notes.unshift('The brake comes off with a clang. The stunt train lurches forward and thunders through the crossing.'); }
    else if (sp.kind === 'tower') { title = 'TIMBER'; hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '2d6' }, { type: 'prone' }], e)); }); if (spInRect(sp, P.x, P.z)) self = spHurtPC(rollDice('2d6'), 'bludgeoning', 12);
      [[50, 73], [51, 73], [50, 74], [51, 74]].forEach(function (q) { spDecor(q[0], q[1], '#tower', '#tower_down'); }); vfxArea('mud', sp.mx, sp.mz, 2.6, 1e9); notes.unshift('A leg cracks, the tower leans, and a whole tank of water comes down across the street. The street is mud now.'); }
    else if (sp.kind === 'keg') { title = 'BOOM'; dmgKind = 'fire'; hit = spFoes(function (e) { return cheb(e.x, e.z, sp.x, sp.z) <= sp.r; }); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '2d6' }, { type: 'burn', dice: '1d4', turns: 2 }], e)); });
      vfxArea('fire', sp.x, sp.z, 1.5, 25); vfxHit('fire', sp.x, sp.z, 1); spDecor(sp.x, sp.z, sp.dec || '#keg', '#scorch'); notes.unshift(sp.say || 'You light the long fuse and step well back. It fizzes down and the keg goes up.'); }
    else if (sp.kind === 'bridge') { title = 'SNAP'; hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '2d6' }, { type: 'prone' }], e)); }); if (spInRect(sp, P.x, P.z)) self = spHurtPC(rollDice('1d6'), 'bludgeoning');
      spBridgeDown(sp); notes.unshift('The ropes part. The bridge folds into the river, along with anything on it.'); }
    else if (sp.kind === 'idol') { title = 'RUMBLE'; var gp = rollDice('4d10') + 10; CHAR.gold = (CHAR.gold || 0) + gp; spDecor(sp.x, sp.z, '#idol', '#idol_gone');
      hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '3d6' }, { type: 'prone' }], e)); }); if (spInRect(sp, P.x, P.z)) self = spHurtPC(rollDice('3d6'), 'bludgeoning', 13);
      spBoulder(sp); notes.unshift('You lift the idol: gold paint over real gold, worth ' + gp + ' gold. Click. A foam-and-concrete boulder rolls out of the wall and down the temple.'); }
    else if (sp.kind === 'ride') { title = 'ZZZAP'; dmgKind = 'lightning'; hit = spFoes(function (e) { return cheb(e.x, e.z, sp.x, sp.z) <= sp.r && (e.kind === 'trex' || /lightning/.test(JSON.stringify(e.def.vuln || ''))); });
      hit.forEach(function (e) { var two = /lightning/.test(JSON.stringify(e.def.vuln || '')); notes.push(fxApply([{ type: 'damage', dice: two ? '8d6' : '4d6' }, { type: 'stun', turns: 2 }], e)); vfxHit('lightning', e.px, e.pz, e.def.h || 1); });
      vfxHit('lightning', sp.x, sp.z, 1); spDecor(sp.x, sp.z, '#ridebox', '#ridebox_dead'); notes.unshift(hit.length ? 'You jam the dial to the stop. Every animatronic on the ride circuit gets the full current.' : 'You jam the dial to the stop. Sparks everywhere, but nothing on the circuit was close enough to fry.'); }
    else if (sp.kind === 'warpcore') { title = 'WARP CORE BREACH'; dmgKind = 'lightning'; hit = spFoes(inR); hit.forEach(function (e) { var two = /lightning/.test(JSON.stringify(e.def.vuln || '')); notes.push(fxApply([{ type: 'damage', dice: two ? '6d6' : '3d6' }, { type: 'stun', turns: 1 }], e)); vfxHit('lightning', e.px, e.pz, e.def.h || 1); });
      if (spInRect(sp, P.x, P.z)) self = spHurtPC(rollDice('2d6'), 'lightning', 13); spDecor(sp.cx, sp.cz, '#warpcore', '#warpcore_dead'); vfxHit('lightning', sp.cx, sp.cz, 2); notes.unshift('You push the core past the red line. It whines, flares white and dumps every volt it has into the engine room.'); }
    else if (sp.kind === 'fans') { title = 'SPAAACE'; hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '2d6' }, { type: 'prone' }, { type: 'push', tiles: 3 }], e)); }); notes.unshift('The cargo bay doors slam open on the giant fans and a hurricane goes through the hold.'); }
    else if (sp.kind === 'gimbal') { title = 'ALL HANDS, BRACE'; hit = spFoes(inR); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '1d4' }, { type: 'prone' }], e)); });
      if (spInRect(sp, P.x, P.z)) { var sv3 = d20() + (MOD.DEX || 0); if (sv3 < 12) { PC.prone = true; notes.push('DEX save ' + sv3 + ' vs 12: you go down too.'); } else notes.push('DEX save ' + sv3 + ' vs 12: you keep your feet.'); }
      if (typeof shake === 'function') try { shake(0.8); } catch (x) {} notes.unshift('You throw the gimbal to full tilt. The whole ship lurches sideways, then back, then sideways again.'); }
    else if (sp.kind === 'bookcase') { title = 'CREEEAK'; spOpenWall(sp); notes.unshift('You pull the book. Somewhere a latch clicks, and the whole bookcase swings round into the foyer.'); }
    else if (sp.kind === 'distract') { title = sp.title || sp.name; var only = sp.only ? new RegExp(sp.only) : null; hit = spFoes(function (e) { return inR(e) && (!only || only.test(e.kind || '')) && (CB.on || cheb(e.x, e.z, P.x, P.z) <= (sp.reach || 10)); });
      var cnt = {}; hit.forEach(function (e) { fxApply([{ type: 'distract', turns: sp.turns || 2 }], e); cnt[e.name] = (cnt[e.name] || 0) + 1; }); if (sp.dec) spDecor(sp.x, sp.z, sp.dec, sp.dec + '_on');
      notes.unshift(sp.say || 'Everyone stops what they are doing.'); if (!hit.length) notes.push(sp.none || 'Nobody was close enough to notice.');
      else notes.push(Object.keys(cnt).map(function (n) { return cnt[n] > 1 ? cnt[n] + ' × ' + n : n; }).join(', ') + ': distracted for ' + (sp.turns || 2) + ' turns' + '.'); }
    else if (sp.kind === 'pile') { title = 'AVALANCHE'; dmgKind = 'paper-cut'; hit = spFoes(function (e) { return cheb(e.x, e.z, sp.x, sp.z) <= (sp.r || 2); }); hit.forEach(function (e) { notes.push(fxApply([{ type: 'damage', dice: '2d6' }, { type: 'prone' }], e)); });
      if (cheb(P.x, P.z, sp.x, sp.z) <= 1) self = spHurtPC(rollDice('1d6'), 'bludgeoning', 12); spDecor(sp.x, sp.z, '#scripts', '#scripts_down'); notes.unshift('You give the tower of unread spec scripts one good shove. Ten years of somebody\'s dreams come down in a landslide.'); }
    else if (sp.kind === 'camera') { title = sp._cover ? 'CAMERA DOWN (QUIETLY)' : 'CAMERA DOWN'; spDecor(sp.x, sp.z, '#camtripod', '#camtripod_dead');
      if (sp._cover) { var cg = sp._cover, gear = CHAR.gear || []; if ((cg.qty || 1) > 1) cg.qty--; else if (gear.indexOf(cg) >= 0) gear.splice(gear.indexOf(cg), 1); notes.unshift('You smear ' + cg.name.toLowerCase() + ' over the lens. The tally light blinks, confused, and goes out. Nobody heard a thing.'); }
      else { notes.unshift('You kick the camera off its tripod and stamp on it. It is not quiet.'); hit = spFoes(function (e) { return !e.calm && !e.def.timid && !inSafeRoom(e.x, e.z) && cheb(e.x, e.z, P.x, P.z) <= 8 && (!CB.on || CB.order.indexOf(e) < 0); }); if (hit.length) notes.push(hit.length + ' of the cast heard that.'); } }
    if (sp.kind === 'distract' && sp.camoff != null) notes.push('Every camera on this set is blind now.');
    if (self) notes.push('You take ' + self + ' ' + dmgKind + ' damage.');
    CHAR.setp = CHAR.setp || {}; CHAR.setp[spKey(sp)] = Date.now(); saveChar(CHAR); try { rebuildChunks(); } catch (x) {}
    if (sp.kind !== 'camera') setTimeout(function () { try { achieve('setpiece'); } catch (x) {} }, 3000);
    say(title, notes.filter(Boolean).join(' '), 7000); worldSave();
    var loud = !sp._cover && sp.kind !== 'distract' && sp.kind !== 'bookcase', watched = sp.kind !== 'camera' && FLOOR === 2 && camWatching();
    if (watched) setTimeout(function () { grantXP(25); say('AUDIENCE BONUS · +25 XP', pick(['That one is going in the highlight reel.', 'The audience is on its feet. The System clips it for the promo.', 'A camera caught the whole thing. The ratings tick up.']), 4500); }, 7300);
    if (CB.on && sp.kind === 'camera' && hit.length) { hit.forEach(function (e) { cbJoin(e, 'heard the camera go and came running.'); }); hit = []; }
    var live = hit.filter(function (e) { return !e.dead && !e.calm; });
    if (CB.on) cbAfterMyMove(); else if (live.length) cbStart(sp.kind === 'camera' ? 'The crash brings the ' + live[0].name.replace(/ [ABC]$/, '') + ' running.' : 'That got their attention.', live[0], sp.kind === 'camera' ? {} : { surprise: true });
    if (loud) setTimeout(function () { try { qosLoud('heard that through the Quiet on set and came running.'); } catch (x) {} }, 200);
  }
  // ---------- Floor 2 phase 3: studio cameras and the Quiet on set lights ----------
  // A camera sweeps a 60-degree cone 6 tiles deep. Caught in it at the end of a move (crouching gets a Stealth roll) and the nearest cast within 15 tiles come for you: ON AIR.
  // Win a fight, or set off a set piece, where a working camera can see you and the audience pays: +25% XP and now and then a sponsor's loot box.
  // Every minute or two one set's Quiet on set light comes on for 30 seconds: sneaking past cameras gets advantage, and anything loud there brings the whole set.
  var CAM = { lv: null, list: [], panel: {}, lamps: [], qos: null, qosUntil: 0, qosNext: 0, chk: 0 };
  function camCover() { return (CHAR && CHAR.gear || []).filter(function (g) { var it = ITEMS[g.name] || {}; return (it.tags || []).indexOf('sticky') >= 0 || /paint|tape|slime|grease|gum|glue|mud/i.test(g.name); })[0] || null; }
  function camOn(sp) { if (!sp || spDone(sp)) return false; var pn = CAM.panel[sp.hood]; return !(pn && spDone(pn)); }
  function camSees(c, x, z, sweep) { var dx = x - c.sp.x, dz = z - c.sp.z, d = Math.hypot(dx, dz); if (d > 6.5 || d < 0.5) return false;
    if (sweep) { var df = Math.atan2(-dz, dx) - c.yaw; df = Math.atan2(Math.sin(df), Math.cos(df)); if (Math.abs(df) > 0.55) return false; } return los(c.sp.x, c.sp.z, x, z); }
  function camWatching() { return CAM.list.some(function (c) { return camOn(c.sp) && camSees(c, P.x, P.z, false); }); }
  function qosHere() { if (!CAM.qos) return false; var r = roomInfo(P.x, P.z); return !!r && r.hood === CAM.qos.hood; }
  function qosLoud(why) { if (!CB.on || !qosHere()) return 0; var n = 0; CB.enemies.forEach(function (e) { if (e.dead || e.calm || e.npc || e.def.timid || CB.order.indexOf(e) >= 0 || inSafeRoom(e.x, e.z)) return; var r = roomInfo(e.x, e.z); if (r && r.hood === CAM.qos.hood) { cbJoin(e, why); n++; } });
    if (n) cbLog('QUIET ON SET', n + ' more of the cast heard that.'); return n; }
  function camBonus(beaten, xp) { if (FLOOR !== 2 || !beaten.some(function (e) { return e.dead; }) || !(CB.airFight || camWatching())) return 0; var b = Math.max(5, Math.ceil(xp * 0.25));
    setTimeout(function () { var gift = Math.random() < 0.25 ? item('Bronze loot box', { from: 'a sponsor, for the ratings' }) : null; if (gift) invAdd(gift, true);
      say('AUDIENCE BONUS · +' + b + ' XP', pick(['A camera caught the whole fight. The audience ate it up.', 'That fight went out live. The System says the numbers are good.', 'On camera, and you won. The studio audience goes wild.']) + (gift ? ' A sponsor sends over a Bronze loot box.' : ''), 5200);
      setTimeout(function () { try { achieve('onair'); } catch (x) {} }, 5400); }, 1700); return b; }
  function camAir(c) { var now = performance.now(); c.cool = now + 25000; c.hot = now + 4000;
    var foes = CB.enemies.filter(function (e) { return !e.dead && !e.calm && !e.npc && !e.def.timid && !inSafeRoom(e.x, e.z) && cheb(e.x, e.z, P.x, P.z) <= 15; }).sort(function (a, b) { return cheb(a.x, a.z, P.x, P.z) - cheb(b.x, b.z, P.x, P.z); }).slice(0, 3);
    if (!foes.length) { say('ON AIR', 'A tally light goes solid red: that camera has you. Nobody is watching the monitors right now, but the audience saw.', 4200); return; }
    cbStart('ON AIR. ' + foes[0].name.replace(/ [ABC]$/, '') + ' saw you on the monitor.', foes[0]); if (!CB.on) return; CB.airFight = true;
    foes.slice(1).forEach(function (e) { if (CB.order.indexOf(e) < 0) cbJoin(e, 'saw you on the monitor and came running.'); }); }
  function camCheck() { if (FLOOR !== 2 || CB.on || !CB.ready || (typeof DM !== 'undefined' && DM.peace) || isDM() || inSafeRoom(P.x, P.z) || (CHAR && CHAR.dead)) return; var now = performance.now();
    for (var i = 0; i < CAM.list.length; i++) { var c = CAM.list[i]; if (!camOn(c.sp) || (c.cool || 0) > now || !camSees(c, P.x, P.z, true)) continue;
      if (crouch) { var r1 = d20(), roll = qosHere() ? Math.max(r1, d20()) : r1, tot = roll + (MOD.DEX || 0) + skillLv('Stealth') - (hasTrait('Loudmouth') ? 2 : 0); if (tot >= 13) { c.cool = now + 6000; cbLog('Stealth', 'A camera sweeps over you: ' + tot + ' vs 13. Not seen.'); continue; } }
      camAir(c); return; } }
  function camInit() { if (CAM.lv === LEVEL) return; CAM.list.forEach(function (c) { scene.remove(c.g); scene.remove(c.cone); }); CAM.lamps.forEach(function (l) { scene.remove(l.m); }); CAM.list = []; CAM.lamps = []; CAM.panel = {}; CAM.qos = null; CAM.lv = LEVEL;
    if (FLOOR !== 2 || !LEVEL.setp) return; var seen = {}, dark = new THREE.MeshLambertMaterial({ color: 0x1e1e24 }), lensM = new THREE.MeshLambertMaterial({ color: 0x0a0a0e }), coneG = new THREE.CircleGeometry(6.5, 18, -0.55, 1.1); coneG.rotateX(-Math.PI / 2);
    Object.keys(LEVEL.setp).forEach(function (k) { var sp = LEVEL.setp[k]; if (seen[sp.id]) return; seen[sp.id] = 1; if (sp.camoff != null) CAM.panel[sp.camoff] = sp; });
    (LEVEL.qos || []).forEach(function (q) { var m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.22), new THREE.MeshBasicMaterial({ color: 0x3a0c0c })); m.position.set(q.x + 0.38, 2.55, q.z + 0.18); scene.add(m); CAM.lamps.push({ q: q, m: m }); });
    seen = {}; Object.keys(LEVEL.setp).forEach(function (k) { var sp = LEVEL.setp[k]; if (seen[sp.id] || sp.kind !== 'camera') return; seen[sp.id] = 1;
      var g = new THREE.Group(), head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.28), dark), lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 10), lensM), tally = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x551010 }));
      lens.rotation.z = Math.PI / 2; lens.position.x = 0.32; tally.position.set(0.1, 0.2, 0); head.add(lens); head.add(tally); head.position.y = 1.45; g.add(head); g.position.set(sp.x, 0, sp.z); scene.add(g);
      var cone = new THREE.Mesh(coneG, new THREE.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.1, depthWrite: false })); cone.position.set(sp.x, 0.05, sp.z); scene.add(cone);
      CAM.list.push({ sp: sp, g: g, head: head, tally: tally, cone: cone, ph: (sp.x * 0.37 + sp.z * 0.71) % 6.28, yaw: sp.a0 }); });
    CAM.qosNext = performance.now() + 45000; }
  (function camTick() { requestAnimationFrame(camTick); if (typeof LEVEL === 'undefined' || !LEVEL || CAM.lv !== LEVEL || !CAM.list.length && !CAM.lamps.length) return; var now = performance.now(), t = now / 1000;
    CAM.list.forEach(function (c) { var dead = spDone(c.sp), on = !dead && camOn(c.sp); c.g.visible = !dead; c.cone.visible = on; if (dead) return; c.yaw = c.sp.a0 + 0.6 * Math.sin(t * 0.45 + c.ph); c.head.rotation.y = c.yaw; c.cone.rotation.y = c.yaw;
      var hot = (c.hot || 0) > now; c.tally.material.color.setHex(!on ? 0x221010 : hot ? 0xff2010 : (Math.floor(t * 1.5 + c.ph) % 2 ? 0xc81810 : 0x551010)); c.cone.material.opacity = hot ? 0.22 : 0.1; });
    if (CAM.qos && now > CAM.qosUntil) CAM.qos = null;
    if (!CAM.qos && CAM.lamps.length && now > CAM.qosNext && !CB.on) { var L = CAM.lamps[Math.floor(Math.random() * CAM.lamps.length)]; CAM.qos = L.q; CAM.qosUntil = now + 30000; CAM.qosNext = now + 90000 + Math.random() * 60000;
      if (qosHere()) say('QUIET ON SET', 'The red light over ' + L.q.name + ' is on. Sneaking past the cameras is easier for a while (advantage on Stealth), but anything loud now brings the whole set.', 5500); }
    CAM.lamps.forEach(function (l) { var lit = CAM.qos === l.q; l.m.material.color.setHex(lit ? (Math.floor(t * 2) % 2 ? 0xff2a1a : 0xc01a10) : 0x3a0c0c); });
    if (now > CAM.chk) { CAM.chk = now + 300; try { camCheck(); } catch (x) {} } })();
  // little one-shot animations: a train sweeping through the crossing, a boulder down the temple
  function spSweep(mesh, x0, z0, x1, z1, secs, spin) { scene.add(mesh); var t0 = performance.now();
    (function step() { var f = Math.min(1, (performance.now() - t0) / 1000 / secs); mesh.position.x = x0 + (x1 - x0) * f; mesh.position.z = z0 + (z1 - z0) * f; if (spin) mesh.rotation.z -= 0.25; if (f < 1) requestAnimationFrame(step); else setTimeout(function () { scene.remove(mesh); }, 400); })(); }
  function spTrainRun(sp) { var m = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 2.2), new THREE.MeshLambertMaterial({ color: 0x2a2a30 })); m.position.y = 1.4; spSweep(m, sp.x0 - 8, (sp.z0 + sp.z1) / 2, sp.x1 + 8, (sp.z0 + sp.z1) / 2, 1.1); if (typeof shake === 'function') try { shake(0.5); } catch (x) {} }
  function spBoulder(sp) { var m = new THREE.Mesh(new THREE.SphereGeometry(1.3, 14, 10), new THREE.MeshLambertMaterial({ color: 0x8a8070 })); m.position.y = 1.3; spSweep(m, sp.x1 + 1, (sp.z0 + sp.z1) / 2, sp.x0 - 1, (sp.z0 + sp.z1) / 2, 1.4, true); }
  function spBridgeDown(sp) { for (var z = sp.z0; z <= sp.z1; z++) for (var x = sp.x0; x <= sp.x1; x++) { if (MAP[z] && MAP[z][x] !== '#') MAP[z] = MAP[z].substr(0, x) + '~' + MAP[z].substr(x + 1); var L = LEVEL.decor[x + ',' + z]; if (L) L.length = 0; } }
  function spOpenWall(sp) { if (MAP[sp.wz] && MAP[sp.wz][sp.wx] === '#') MAP[sp.wz] = MAP[sp.wz].substr(0, sp.wx) + 'D' + MAP[sp.wz].substr(sp.wx + 1); }
  // on load: put back what this character already set off, and lay the quicksand
  function spInit() { try { camInit(); } catch (x) { console.warn('cams', x); } if (!LEVEL.setp) return; var redo = false, seen = {};
    Object.keys(LEVEL.setp).forEach(function (k) { var sp = LEVEL.setp[k]; if (seen[sp.id] || !spDone(sp)) return; seen[sp.id] = 1; redo = true;
      if (sp.kind === 'chandelier') spDecor(sp.cx, sp.cz, '#chandelier', '#chandelier_down'); if (sp.kind === 'tower') { [[50, 73], [51, 73], [50, 74], [51, 74]].forEach(function (q) { spDecor(q[0], q[1], '#tower', '#tower_down'); }); vfxArea('mud', sp.mx, sp.mz, 2.6, 1e9); }
      if (sp.kind === 'keg') spDecor(sp.x, sp.z, sp.dec || '#keg', '#scorch'); if (sp.kind === 'pile') spDecor(sp.x, sp.z, '#scripts', '#scripts_down'); if (sp.kind === 'distract' && sp.dec) spDecor(sp.x, sp.z, sp.dec, sp.dec + '_on'); if (sp.kind === 'camera') spDecor(sp.x, sp.z, '#camtripod', '#camtripod_dead'); if (sp.kind === 'bridge') spBridgeDown(sp); if (sp.kind === 'idol') spDecor(sp.x, sp.z, '#idol', '#idol_gone'); if (sp.kind === 'ride') spDecor(sp.x, sp.z, '#ridebox', '#ridebox_dead'); if (sp.kind === 'warpcore') spDecor(sp.cx, sp.cz, '#warpcore', '#warpcore_dead'); if (sp.kind === 'bookcase') spOpenWall(sp); });
    (LEVEL.mud || []).forEach(function (q) { vfxArea('mud', q[0], q[1], 1.4, 1e9); });
    if (redo) try { rebuildChunks(); } catch (x) {} }
  // the test server says so, so nobody mistakes it for the real game
  (function () { if (!/staging/i.test(location.hostname)) return; var b = document.createElement('div'); b.textContent = 'TEST SERVER'; b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:50%;bottom:4px;transform:translateX(-50%);z-index:90;padding:2px 10px;background:#7A1F1A;color:#F3E9D2;font:700 12px Cinzel,serif;letter-spacing:.14em;border-radius:3px;pointer-events:none;opacity:.9';
    document.body.appendChild(b); })();
