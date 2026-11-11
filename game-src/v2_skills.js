
  // who the crawlers are, as far as the System is concerned. Goes into every AI prompt that speaks as or for the System.
  var CREW_LORE = 'Background the System knows about this crawl: the crawlers are a real group of friends who call themselves the SGC, the Strong Guys Club. ' +
    'The name is an inside joke from a comedy sketch (someone caught with a screen full of buff bodybuilders pretends not to know what they are: "what are these, like strong guys or something?!") and has nothing to do with strength. ' +
    'They play D&D together, love Magic: The Gathering and play a lot of video games. The System recruited them partly because "Strong Guys Club" sounded like a legitimate fighting outfit. ' +
    'It has since realised they are not especially strong, even for humans, and privately expects them to die quickly. It may tease them about the name or its own recruiting mistake now and then (sparingly, not every line), and is quietly delighted when they survive anyway.';

  // ===================== skills, DCC style: dozens of them, most obscure, earned by doing things =====================
  // Each level adds +1 to rolls that use the skill (weapon skills: +1 to hit per 2 levels). Skills appear when you do
  // something often enough (the System notices), when the System rules that something you tried deserves one, or at
  // character creation. The System can invent brand-new skills; those live on the character (CHAR.skillDefs).
  // fx tags are wired into the engine; everything else feeds the AI rulings (Try something, talking).
  var SKILL_DEFS = [
    // --- fighting ---
    ['Blades', 'DEX', 'Knives, shears, anything with an edge. +1 to hit per 2 levels.', 'wpn:blade'],
    ['Bludgeons', 'STR', 'Hammers, maces, sticks, crowbars. +1 to hit per 2 levels.', 'wpn:blunt'],
    ['Improvised Weapons', 'STR', 'Hitting things with things that are not weapons. +1 to hit per 2 levels.', 'wpn:improv'],
    ['Pugilism', 'STR', 'Fists, elbows, the occasional headbutt. +1 to hit per 2 levels.', 'wpn:fist'],
    ['Thrown Objects', 'DEX', 'Rocks, daggers, staplers, whatever is closest.', ''],
    ['Brawling', 'STR', 'Bar fights, grapples and dirty tricks.', ''],
    ['Athletics', 'STR', 'Shove, grapple, climb, swim.', ''],
    ['Acrobatics', 'DEX', 'Balance, tumbling, slipping free.', ''],
    ['Getaway', 'DEX', 'Running away, fast.', ''],
    ['Strategic Retreat', 'WIS', 'Knowing exactly when to leave. The System counts it as a win.', ''],
    ['Quick Draw', 'DEX', 'Swapping weapons without looking. Practice makes it free.', ''],
    ['Weed Whacker', 'STR', 'Killing things that grow. Shrubs fear you a little.', ''],
    ['Monster Whisperer', 'CHA', 'Talking monsters out of it. They seem to like you.', ''],
    ['Dirty Fighting', 'DEX', 'Sand in eyes, kicks below the belt, no shame.', ''],
    ['Bodyguard', 'CON', 'Standing between your friends and the pointy end.', ''],
    ['Opportunist', 'DEX', 'Hitting things that are already down.', ''],
    // --- surviving ---
    ['Road-Worn', 'CON', 'Long walks, bad food, no sleep.', ''],
    ['Iron Stomach', 'CON', 'You can eat almost anything down here. Food heals +1 per 2 levels.', 'food'],
    ['First Aid', 'WIS', 'Patching people up. Medical items heal +1 per 2 levels.', 'med'],
    ['Cooking', 'WIS', 'Turning dungeon things into food. Food heals +1 per 2 levels.', 'food'],
    ['Scavenger', 'INT', 'You find more in a body\'s pockets: +1 gold per level from searches.', 'gold'],
    ['Box Cracker', 'DEX', 'Loot boxes give up more: a chance of an extra item per level.', 'box'],
    ['Corpse Wrangler', 'STR', 'Carrying the dead around without throwing up. Shrubs hate you.', ''],
    ['Pocket Diving', 'DEX', 'Going through a body\'s pockets fast and thoroughly.', ''],
    ['Trap Sense', 'WIS', 'A tingle in the back of the neck right before the floor clicks.', ''],
    ['Pathfinding', 'WIS', 'Directions, maps, never getting lost.', ''],
    ['Cartography', 'INT', 'Drawing maps that are actually right.', ''],
    ['Perception', 'WIS', 'Noticing things before they notice you.', ''],
    ['Stealth', 'DEX', 'Hide, sneak, palm things.', ''],
    ['Darkness Adapted', 'WIS', 'Your eyes are getting used to the dark.', ''],
    ['Hydrophobic Swimmer', 'STR', 'You hate the water, and you are getting good at it anyway.', ''],
    ['Mold Resistance', 'CON', 'Spores just don\'t take on you anymore.', ''],
    ['Napping Anywhere', 'CON', 'Asleep in thirty seconds on any surface. Rests do you more good.', ''],
    // --- fixing and figuring ---
    ['Jury-Rig', 'INT', 'Fix or bodge anything with what is lying around.', ''],
    ['Duct Tape Mastery', 'INT', 'The System has rules about duct tape. You found the loopholes.', ''],
    ['Lockpicking', 'DEX', 'Locks, traps, loot boxes.', ''],
    ['Investigation', 'INT', 'Searching, deducing, reading the room.', ''],
    ['Appraisal', 'INT', 'What loot is worth, to the copper.', ''],
    ['Lore', 'INT', 'Knowing things about monsters and places.', ''],
    ['Monster Taxonomy', 'INT', 'You are keeping notes on everything that tried to eat you.', ''],
    ['Bureaucracy', 'INT', 'Forms, filing, and the dark art of the right signature. The System loves it.', ''],
    ['Vending Machine Whisperer', 'DEX', 'One good hit in the right place and it gives you two.', ''],
    ['Floristry', 'WIS', 'Plants, cut stems, arrangements. Unexpectedly useful against things that grow.', ''],
    ['Electrical Tinkering', 'INT', 'Wires, batteries, the occasional controlled shock.', ''],
    ['Plumbing', 'STR', 'Pipes, valves and knowing which way water goes.', ''],
    ['Demolition', 'STR', 'Knowing which wall is load-bearing, and leaning on it.', ''],
    // --- talking ---
    ['De-escalation', 'CHA', 'Talking people (and monsters) down.', ''],
    ['Deception', 'CHA', 'Lying convincingly.', ''],
    ['Intimidation', 'CHA', 'Making things back off.', ''],
    ['Haggling', 'CHA', 'Prices, deals, sponsors.', ''],
    ['Performance', 'CHA', 'Music, showmanship, playing to the cameras.', ''],
    ['Crowd Work', 'CHA', 'Reading an audience and giving them what they want.', ''],
    ['Union Rules', 'INT', 'You know the imps\' contract better than the imps do.', ''],
    ['Customer Service Voice', 'CHA', 'That calm, bright voice that makes angry people stop.', ''],
    ['Small Talk', 'CHA', 'Weather, sports, the price of gas. It buys you seconds.', ''],
    ['Trash Talk', 'CHA', 'Getting under a monster\'s skin until it makes a mistake.', ''],
    ['Bribery', 'CHA', 'Knowing what something wants and the exact moment to offer it.', ''],
    ['Pep Talk', 'CHA', 'A speech that gets your friends back on their feet.', ''],
    // --- odd ---
    ['Sponsor Bait', 'CHA', 'Doing things the viewers will remember.', ''],
    ['Loot Goblin', 'WIS', 'You always seem to find the shiny thing first.', ''],
    ['Snack Diplomacy', 'CHA', 'Every problem looks smaller after you offer it a snack.', ''],
    ['Shopping Cart Handling', 'STR', 'Steering heavy rolling things at speed.', ''],
    ['Hide in Plain Sight', 'DEX', 'Standing very still and looking like furniture.', ''],
    ['Falling Gracefully', 'DEX', 'Taking less damage from falls and indignity.', ''],
    ['Hoarding', 'CON', 'Your bag somehow holds more than it should.', ''],
    ['Paperwork Speedrun', 'INT', 'Filling out System forms at superhuman speed.', '']
  ];
  var SKILL_IDX = {}; SKILL_DEFS.forEach(function (s) { SKILL_IDX[s[0]] = s; });
  function skillDef(name) { var c = CHAR, d = SKILL_IDX[name]; if (d) return d; var x = c && c.skillDefs && c.skillDefs[name]; return x ? [name, x.stat || 'WIS', x.desc || '', '', true] : null; }
  function skillHas(name) { return !!(CHAR && CHAR.skills && CHAR.skills[name] > 0); }

  // ---------- the System hands out a skill: from doing something enough, or from a ruling ----------
  function skillGrant(name, why, def) {
    var c = CHAR; if (!c || !name) return false; name = String(name).slice(0, 40); c.skills = c.skills || {};
    if (c.skills[name] > 0) { skillUse(name); return false; }
    if (def && !SKILL_IDX[name]) { c.skillDefs = c.skillDefs || {}; c.skillDefs[name] = { stat: /^(STR|DEX|CON|INT|WIS|CHA)$/.test(def.stat) ? def.stat : 'WIS', desc: String(def.desc || '').slice(0, 160), by: 'System', t: Date.now() }; }
    c.skills[name] = 1; var d = skillDef(name);
    logEvent('New skill: ' + name + (why ? ' (' + why + ')' : ''), 'skill');
    setTimeout(function () { say('New skill · ' + name, (d && d[2] ? d[2] + ' ' : '') + (why ? 'The System noticed: ' + why + '.' : ''), 6500); }, 1800);
    cbSaveChar(); return true;
  }
  // counts things you do; when a count hits its mark the matching skill appears (then each further one is practice)
  var SKILL_TRIGGERS = {
    stash: [3, 'Corpse Wrangler', 'you keep stuffing bodies in your bag'],
    eat: [5, 'Iron Stomach', 'you will eat anything down here'],
    loot: [8, 'Scavenger', 'you search every body you find'],
    box: [4, 'Box Cracker', 'you open every box you see'],
    shrub: [3, 'Weed Whacker', 'you keep killing the shrubs'],
    swap: [10, 'Quick Draw', 'you swap weapons a lot'],
    talkdown: [2, 'Monster Whisperer', 'monsters keep agreeing with you'],
    flee: [3, 'Strategic Retreat', 'you know when to leave'],
    'wpn:improv': [5, 'Improvised Weapons', 'you keep hitting things with things that are not weapons'],
    'wpn:fist': [4, 'Pugilism', 'you keep punching things'],
    'wpn:blade': [6, 'Blades', 'you are getting handy with an edge'],
    'wpn:blunt': [6, 'Bludgeons', 'you are getting handy with blunt objects'],
    heal: [4, 'First Aid', 'you keep patching yourself up'],
    secret: [2, 'Trap Sense', 'you keep finding hidden things']
  };
  function skillCount(key) {
    var c = CHAR, t = SKILL_TRIGGERS[key]; if (!c || !t) return; c.counts = c.counts || {}; c.counts[key] = (c.counts[key] || 0) + 1;
    if (skillHas(t[1])) { skillUse(t[1]); return; }
    if (c.counts[key] >= t[0]) skillGrant(t[1], t[2]);
  }
  // which weapon skill a held thing uses
  function weaponSkillKey(it, name) {
    var n = String((it && it.name) || name || '').toLowerCase();
    if (!n || n === 'fists') return 'wpn:fist';
    if (/knife|dagger|shear|scissor|blade|sword|machete|cleaver|razor|saw/.test(n)) return 'wpn:blade';
    if (/hammer|mace|club|stick|bat|crowbar|wrench|pipe|staff|cudgel|baton/.test(n)) return 'wpn:blunt';
    if (it && it.cat && it.cat !== 'weapon') return 'wpn:improv';
    if (it && (!it.from || it.from === 'home')) return 'wpn:improv';
    return 'wpn:blunt';
  }
  function weaponSkillName(key) { return { 'wpn:blade': 'Blades', 'wpn:blunt': 'Bludgeons', 'wpn:improv': 'Improvised Weapons', 'wpn:fist': 'Pugilism' }[key]; }
  function weaponSkillBonus(key) { var n = weaponSkillName(key); return n ? Math.floor(skillLv(n) / 2) : 0; }
  function healSkillBonus(it) {
    var n = String(it.name || '').toLowerCase(), b = 0;
    if (/gauze|bandage|potion|kit|salve|medic|first aid/.test(n)) b += Math.floor(skillLv('First Aid') / 2);
    if (/sandwich|bar|snack|food|jerky|chip|cookie|fruit|meal|soup/.test(n)) b += Math.floor(Math.max(skillLv('Cooking'), skillLv('Iron Stomach')) / 2);
    return b;
  }

  // ---------- the journal: major steps and milestones, kept on the character ----------
  function logEvent(txt, kind) {
    var c = CHAR; if (!c || !txt) return; c.log = c.log || [];
    var last = c.log[c.log.length - 1]; if (last && last.txt === txt) return;
    c.log.push({ t: Date.now(), txt: String(txt).slice(0, 200), k: kind || '' , lv: PC.level || 1 }); if (c.log.length > 300) c.log.splice(0, c.log.length - 300);
  }
