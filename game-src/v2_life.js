
  // ===================== life in the dungeon: buffs, Second Wind, slow healing, and the safe-room kitchen =====================
  // Buffs live on the character with an expiry time, so a reload keeps them.
  var BUFFS = {
    caffeine: { name: 'Caffeinated', icon: '☕', desc: '+10% XP and +2 initiative.' },
    jitters: { name: 'Jittery', icon: '〰', desc: 'Three coffees. Your hands shake: -1 to hit.' },
    fed: { name: 'Well Fed', icon: '🍲', desc: 'A hot meal: you heal 1 HP every 5 seconds outside fights.' },
    rested: { name: 'Rested', icon: '☾', desc: 'A real nap: +1 to hit.' },
    sugar: { name: 'Sugar Rush', icon: '✦', desc: '+1 to hit, then a crash.' }
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
  function actsOf(t) { if (t.c === 'o') { var nm = LEVEL.dname[t.key]; if (SAFE_ACTS[nm]) return SAFE_ACTS[nm]; } return ACTS[t.c]; }
  function safeAct(a, t) {
    var c = CHAR, now = Date.now(); if (!c) { say('Not yet', 'Create a character first.', 2500); return true; }
    c.cool = c.cool || {};
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
      c.cool.nap = now + 5 * 60000; var gn = PC.max - PC.hp; PC.hp = PC.max; c.swUsed = false; buffOn('rested', 30 * 60000); delete buffs().jitters; kitOneShot('Interact');
      say('Nap', 'You sleep for twenty minutes and dream about the surface. ' + (gn ? '+' + gn + ' HP. ' : '') + 'Second Wind recharged. Rested for 30 minutes: +1 to hit.', 6000);
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
