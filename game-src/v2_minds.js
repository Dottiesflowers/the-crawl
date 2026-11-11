
  // ===================== Minds: species, cultures and individual personalities =====================
  // Every monster belongs to a SPECIES (how smart it is, whether it talks) and a FACTION (its culture,
  // which comes from the neighborhood it lives in). When it spawns it rolls its own card: a hidden name,
  // five traits within its species' ranges, a quirk, a want, a fear and a secret. The same world always
  // rolls the same individuals. You learn a monster's name only when it tells you, and then the name
  // replaces its tag everywhere.
  //   int: 'none' cannot understand words (no talking) · 'dim' talks, can be argued down · 'smart' only
  //   stands down when the deal truly serves its interests
  var SPECIES = {
    puglin: { int: 'dim', race: 'Puglin', traits: { brave: [1, 4], greed: [3, 5], temper: [2, 5], wits: [1, 2], loyalty: [2, 5] } },
    imp: { int: 'smart', race: 'Imp', traits: { brave: [2, 4], greed: [2, 5], temper: [1, 4], wits: [3, 5], loyalty: [3, 5] } },
    rat: { int: 'none', race: 'Dungeon rat', traits: { brave: [1, 2], greed: [4, 5], temper: [1, 3], wits: [1, 1], loyalty: [1, 1] } },
    shrub: { int: 'none', race: 'Shrub', traits: { brave: [1, 1], greed: [5, 5], temper: [1, 1], wits: [1, 1], loyalty: [1, 1] } }
  };
  var FACTIONS = {
    reject: { species: 'puglin', title: 'Processing Center reject',
      who: 'A puglin the show rejected at casting and locked in a holding pen in the Processing Center. It broke out and is loose in the halls.',
      culture: 'Rejects crave screen time above everything. They mug for every camera and hate being called boring. Real Warren puglins look down on them, and they know it.',
      voice: 'grunting puglin speech, short bad-grammar sentences, keeps looking for the camera, desperate to impress',
      knows: 'The holding pens, the check-in desks, which camera drones are broken. The Warrens are where real puglins live, and Grik would never take a reject.',
      trades: 'stands down for a camera moment, praise, a promise of a spot in the player\'s crew, or being treated like a star',
      names: ['Reject 7', 'Pibb', 'Sniv', 'Nub', 'Dribb', 'Plog', 'Krib', 'Wiggs', 'Fennick', 'Toot'],
      quirks: ['strikes a pose every time a camera drone floats by', 'still wears its rejection slip pinned to its chest', 'practices its catchphrase between swings', 'thinks you are a talent scout', 'introduces itself to things that are not alive', 'has rehearsed its death scene and wants to get it right'],
      wants: [['to get on camera', 'camera|famous|fame|show|star|viewer|film|tv'], ['a real spawn tag', 'tag|real|official|register|paper'], ['to never go back to the pen', 'pen|free|cage|back|escape'], ['to be cast in someone\'s crew', 'join|crew|team|party|cast|sidekick|friend']],
      fears: ['being sent back to the pen', 'being boring on camera', 'the check-in imps'],
      secrets: ['failed casting because it cried on camera', 'knows a gap in the holding pen fence', 'is not actually a puglin; it is a very confident pug'],
      greet: ['*waves at a camera* You see Pibb? Pibb on TV now!', 'You from casting? I was GOOD. They say no. They WRONG.', '*poses* This my good side. Hit me on bad side.'] },
    warren: { species: 'puglin', title: 'Puglin of the Warrens',
      who: 'A puglin of the Warrens, a snack-hoarding tribe ruled by Grik, the Gristle King, from a throne of bottle caps.',
      culture: 'Bottle caps are money and crowns; a puglin\'s rank is how many it owns. Insults are settled by duels. Grik\'s snack pile is sacred. Bog puglins are freaks who eat dirt.',
      voice: 'short grunting sentences, sometimes talks about itself in third person, easily flattered, bad grammar',
      knows: 'The twisting Warren tunnels, where Grik\'s throne room is, which war-chief is weakest. Humans are new and smell like soap.',
      trades: 'stands down for snacks, bottle caps, shiny things, flattery about its rank, or a scare bigger than Grik',
      names: ['Snorf', 'Grub', 'Mulch', 'Knuckle', 'Tusk', 'Wort', 'Burp', 'Gobble', 'Squelch', 'Rindle', 'Chomp', 'Gorp', 'Snoot', 'Bramm', 'Lumpy', 'Grizzle'],
      quirks: ['counts its bottle caps out loud', 'thinks it is much taller than it is', 'sings while it fights, badly', 'is secretly vegetarian', 'keeps a pet beetle in its pocket', 'repeats the last word anyone says', 'licks things to identify them', 'apologizes after every hit', 'tells everyone it will be king one day', 'is terrified of its own reflection'],
      wants: [['more bottle caps', 'cap|caps|bottle|shiny|coin|gold|treasure'], ['snacks', 'snack|food|eat|chip|candy|sandwich|jerky|hungry'], ['to beat its rival in a duel', 'rival|duel|beat|win|fight him'], ['a better spot in the pecking order', 'rank|chief|king|promot|boss|respect|strong'], ['Grik\'s approval', 'grik|king|throne']],
      fears: ['Grik', 'deep water', 'losing its caps', 'being the first to die on camera'],
      secrets: ['stole a cap from Grik\'s pile', 'can actually read', 'plans to run away to the Underbazaar', 'lost its last duel and lied about it'],
      greet: ['Grub see you. Grub count caps first. Then hit.', '*sniffs* Soap-man. You got snacks?', 'This Warren tunnel. You pay toll or you get bonked.'] },
    bog: { species: 'puglin', title: 'Bog puglin of the Drowned Gardens',
      who: 'A feral puglin of the Drowned Gardens. Its tribe worships the Gardener and the holy compost under the Rotting Gazebo.',
      culture: 'Rot is sacred. Feeding the soil is the highest honor, so a crawler composted is a gift, not a murder. Lily-pad crowns mark rank. Warren puglins are soft snack-eaters who have forgotten the soil.',
      voice: 'slow, quiet and reverent, few words, talks about soil, rot, roots and the Gardener',
      knows: 'The ponds, the reeds, the paths through the fog, where the Gardener tends its compost. Something big sleeps under the gazebo.',
      trades: 'stands down for an offering to the soil (meat, a body, rot, seeds), real respect for the Gardener, or a promise to feed the garden',
      names: ['Moss-Mouth', 'Old Reed', 'Silt', 'Murk', 'Toad-Eye', 'Root', 'Damp', 'Wilt', 'Mire', 'Sedge', 'Peat', 'Fen'],
      quirks: ['hums to the reeds', 'carries a jar of special mud', 'names every frog it meets', 'is proud of how it smells', 'whispers to the dead in the soil', 'has never seen a snack and is curious', 'wears a crown of three lily pads and none of them match'],
      wants: [['an offering for the soil', 'offer|meat|body|corpse|rot|compost|seed|soil|feed'], ['a lily-pad crown', 'crown|lily|rank'], ['the Gardener\'s favor', 'gardener|garden'], ['to see the real sky', 'sky|outside|surface|sun|stars']],
      fears: ['fire', 'salt', 'the Gardener\'s disappointment'],
      secrets: ['is afraid of the compost pile', 'has eaten a snack and liked it', 'knows the Gardener is sick'],
      greet: ['*stands very still in the reeds* ...The soil is hungry, soap-thing.', 'You walk on holy mud. Walk softer.', '*sniffs the air* You will feed the garden. One way or another.'] },
    union: { species: 'imp', title: 'Imp of the Union Hall',
      who: 'An imp worker in the Imp Union Hall, Local 666 of the dungeon staff union. Crawlers are the job; management (the System) is the real enemy.',
      culture: 'The contract is everything: breaks, overtime, grievances. Nobody crosses a picket line. Everybody hates management, the new hires and the coffee. Getting hurt on the job is not worth minimum wage.',
      voice: 'dry, sarcastic, union-worker energy, complains about pay and hours, calls the player "pal"',
      knows: 'The cubicle maze, break-room gossip, which foreman is a snitch, who the Shop Steward listens to. The stairs down are past the Stairwell Gate, and the guards there are scab contractors.',
      trades: 'only stands down for something that serves it: gold, a plausible excuse to be on break, help with a grievance, a way to make management look bad, or a real threat to its life',
      names: ['Brenda', 'Tobias', 'Gorvak', 'Lyle', 'Mildred', 'Sheila', 'Dennis', 'Vexa', 'Ozz', 'Patrice', 'Marv', 'Doreen', 'Hank', 'Ulgra', 'Bev', 'Rasp', 'Nigel', 'Carl (not that one)'],
      quirks: ['counts down the minutes to its break', 'files a grievance about everything', 'is three weeks from retirement', 'is the shop gossip', 'guards its packed lunch with its life', 'hates the new hires', 'secretly wants to be a production assistant', 'is moonlighting as a stand-up comic', 'quotes the contract by section number', 'has a sick familiar at home'],
      wants: [['its break', 'break|lunch|rest|nap|coffee|sit'], ['overtime pay', 'pay|gold|money|coin|bribe|overtime|tip'], ['to win a grievance against management', 'grievance|management|system|union|strike|complain|boss'], ['to not get stabbed for minimum wage', 'hurt|die|stab|kill|safe|live|wage|worth'], ['a transfer out of this hallway', 'transfer|job|promot|leave|quit']],
      fears: ['management', 'losing its pension', 'a write-up'],
      secrets: ['is the one who keeps breaking the brazier', 'informs for management', 'has a key to the supply closet', 'has never actually read the contract'],
      greet: ['Keep walking, pal. Or don\'t. I get paid either way.', '*checks watch* You got four minutes before my break. Make them count.', 'Sign the sheet. Everybody signs the sheet. Then we fight.'] },
    clerk: { species: 'imp', title: 'Clerk of the Flooded Archive',
      who: 'An imp clerk of the Flooded Archive, which keeps a file on every crawler. The water is rising and the records are drowning.',
      culture: 'Order, forms and quiet. Every crawler has a file. Information is currency, and nothing is given without the proper request. Losing a record is the worst sin there is.',
      voice: 'prim and passive-aggressive, shushes people, speaks in forms and procedures',
      knows: 'Where every stack is, which sections have flooded, what is in some crawlers\' files (thin ones, mostly). The Head Archivist keeps the most dangerous files dry.',
      trades: 'only stands down for something that serves it: information for information, rescued documents, a properly filled-out request, or help against the water',
      names: ['Ledger', 'Mrs. Quill', 'Folio', 'Ms. Inkwell', 'Dewey', 'Margin', 'Stamp', 'Archibald', 'Cuthbert', 'Prudence', 'Index', 'Codicil'],
      quirks: ['shushes even when alone', 'alphabetizes things under stress', 'keeps a tiny umbrella over one important file', 'is the only one who knows where the B section went', 'writes down everything you say', 'is in love with a filing cabinet'],
      wants: [['to save the drowning records', 'file|record|paper|document|save|dry|water|book|page'], ['a properly filled-out form', 'form|request|sign|proper|procedure|please'], ['quiet', 'quiet|shh|whisper|silence'], ['information about crawlers', 'secret|info|crawler|tell you|know about']],
      fears: ['the water', 'fire near the stacks', 'an incomplete file'],
      secrets: ['lost an entire shelf and covered it up', 'has read your file and it is very short', 'knows a dry way through the stacks'],
      greet: ['*Shhh.* State your business and your file number.', 'You are dripping on Section F. That will be noted.', '*writes something down* Name? Purpose of visit? Cause of death, pending?'] },
    arena: { species: null, title: 'Arena undercard fighter',
      who: 'An undercard fighter in the Arena, performing for a stadium of alien viewers. A good show matters more than a win.',
      culture: 'The crowd is everything. Trash talk is an art form. Losing well can make your career; winning boringly ends it.',
      voice: 'showboating, trash talk, plays to the crowd, talks like a wrestler',
      knows: 'The Arena floor, the Headliner\'s habits, which side of the stands throws food.',
      trades: 'stands down for a better show: letting it look good, a staged dive, a crowd moment, a rematch promise',
      names: ['Kid Gristle', 'The Mauler', 'Big Tony', 'Slamhammer', 'Little Doom', 'The Snack Attack', 'Gorgeous Gorp', 'Rowdy Rasp'],
      quirks: ['does a signature taunt after every hit', 'wears a cape it made itself', 'keeps glancing at the crowd for approval', 'has a manager it calls between rounds', 'is past its prime and knows it', 'insists on an entrance'],
      wants: [['the crowd\'s love', 'crowd|fans|cheer|show|perform|entertain'], ['a headline slot', 'headline|main event|star|title|champion'], ['to look good losing', 'dive|look good|lose|fake|stage|throw'], ['a rematch with the Headliner', 'headliner|rematch|revenge']],
      fears: ['a boring fight', 'the crowd going quiet', 'being forgotten'],
      secrets: ['has thrown fights for money', 'is terrified of the Headliner', 'cannot actually see without glasses'],
      greet: ['*flexes for the stands* You hear that, crawler? That\'s MY crowd!', 'Ladies and gentle-things, the fresh meat has arrived!', '*points at you, then at the camera* This one\'s for the highlight reel.'] },
    gate: { species: 'imp', title: 'Stairwell Gate security',
      who: 'An elite security contractor hired by the System to stop crawlers reaching the stairs. Not union, and proud of it.',
      culture: 'Professional, cold and paid per crawler stopped. Looks down on the Union imps as lazy. Has read your file.',
      voice: 'clipped and professional, quotes your file, never raises its voice',
      knows: 'Every crawler who tried the stairs and how they failed. The Gatekeeper reports straight to management.',
      trades: 'almost nothing: only something worth more than its bonus, proof that letting you pass makes it look good to management, or a way to embarrass the Union',
      names: ['Sentry Vask', 'Officer Thrane', 'Warden Kell', 'Agent Brix', 'Captain Ossery', 'Unit Nine'],
      quirks: ['reads your file aloud', 'is up for a promotion', 'despises union imps', 'polishes its badge constantly', 'has never let anyone through'],
      wants: [['its bonus', 'bonus|pay|gold|money'], ['a promotion', 'promot|management|report|record|review'], ['to embarrass the Union', 'union|strike|picket|scab']],
      fears: ['a bad performance review', 'the Gatekeeper'],
      secrets: ['let one crawler through once, for a price', 'is a former union member', 'is afraid of heights'],
      greet: ['File says you\'re a florist. File says you won\'t make it. Turn around.', 'Credentials. No? Then this conversation is a formality.', '*checks a tablet* You\'re early. Most of them die in the Warrens.'] },
    rat: { species: 'rat', title: 'Dungeon rat' },
    shrub: { species: 'shrub', title: 'Scavenger shrub' }
  };
  var LEADER_RX = /chief|foreman|head|warden|steward|archivist|grik|gardener|headliner|gatekeeper/;
  var BOSS_CARD = {
    grik: { fear: 'an empty snack pile', name: 'Grik, the Gristle King', quirk: 'eats while it talks and never shares', want: 0 },
    steward: { fear: 'a broken strike', name: 'The Shop Steward', quirk: 'carries the union contract in a velvet binder', want: 2 },
    gardener: { fear: 'fire', name: 'The Gardener', quirk: 'talks to its compost like a proud parent', want: 0 },
    archivist: { fear: 'the water reaching the top shelf', name: 'The Head Archivist', quirk: 'has a file on everyone, including management', want: 0 },
    headliner: { fear: 'the crowd going quiet', name: 'The Headliner', quirk: 'never stops performing, even between swings', want: 0 },
    gatekeeper: { fear: 'a bad performance review', name: 'The Gatekeeper', quirk: 'has memorized your file', want: 1 }
  };
  // ---------- which culture a monster belongs to ----------
  function factionOf(e) {
    if (!e || e.npc) return null; if (e.fac) return e.fac;
    var base = (e.def && e.def.base) || e.kind, k = e.kind || '';
    var hood = ((LEVEL.hoods || [])[(LEVEL.rooms[e.room] || {}).hood] || {}).name || '';
    var f = base === 'rat' ? 'rat' : base === 'shrub' ? 'shrub' : /^clerk|archivist/.test(k) ? 'clerk' : /^bog|gardener/.test(k) ? 'bog' :
      /Arena/.test(hood) || k === 'headliner' ? 'arena' : base === 'imp' ? (/Stairwell/.test(hood) || k === 'gatekeeper' ? 'gate' : 'union') : base === 'puglin' ? (/Processing/.test(hood) ? 'reject' : 'warren') : null;
    return (e.fac = f);
  }
  function speciesOf(e) { var f = FACTIONS[factionOf(e)]; if (!f) return null; return SPECIES[f.species || ((e.def && e.def.base) === 'imp' ? 'imp' : 'puglin')]; }
  function intOf(e) { var s = speciesOf(e); return s ? s.int : 'none'; }
  function speaks(e) { return !!e && (e.npc || intOf(e) !== 'none'); }
  // a little seeded random so the same world always rolls the same individuals
  function mindRng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mindSeed(e) { var s = String((NET && NET.uid) || 'local') + ':' + (CHAR ? CHAR.name : '') + ':' + e.n, h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h; }
  function mindOf(e) {
    if (!e || e.npc) return null; if (e.mind) return e.mind;
    if (!mindOf.all) { mindOf.all = true; CB.enemies.forEach(function (q) { if (!q.npc && !q.mind) mindMake(q); }); return e.mind || null; }
    return mindMake(e);
  }
  function mindMake(e) {
    var f = FACTIONS[factionOf(e)], sp = speciesOf(e); if (!f || !sp) return null;
    var R = mindRng(mindSeed(e)), pk = function (a) { return a[Math.floor(R() * a.length)]; }, t = {};
    Object.keys(sp.traits).forEach(function (k) { var r = sp.traits[k]; t[k] = r[0] + Math.floor(R() * (r[1] - r[0] + 1)); });
    if (LEADER_RX.test(e.kind)) { t.brave = Math.min(5, t.brave + 1); t.wits = Math.min(5, t.wits + 1); }
    var m = { t: t, fac: factionOf(e), tag: e.tag || e.name };
    if (f.names) {
      var used = {}; CB.enemies.forEach(function (q) { if (q !== e && q.mind && q.mind.fac === m.fac) used[q.mind.name] = 1; });
      var free = f.names.filter(function (n) { return !used[n]; }); m.name = pk(free.length ? free : f.names);
      m.quirk = pk(f.quirks); m.wi = Math.floor(R() * f.wants.length); m.fear = pk(f.fears); m.secret = pk(f.secrets);
      var bc = BOSS_CARD[e.kind]; if (bc) { m.name = bc.name; m.quirk = bc.quirk; m.fear = bc.fear; m.wi = bc.want; m.known = true; }
    }
    return (e.mind = m);
  }
  function mindWant(e) { var m = mindOf(e), f = FACTIONS[m && m.fac]; return f && f.wants ? f.wants[m.wi] : null; }
  // the five traits, said the way a person would describe them
  function mindTraits(e) {
    var t = (mindOf(e) || {}).t; if (!t) return ''; var out = [];
    out.push(t.brave <= 1 ? 'a coward' : t.brave >= 4 ? 'brave' : 'cautious');
    if (t.greed >= 5) out.push('greedy'); if (t.temper >= 5) out.push('a hothead'); else if (t.temper <= 1) out.push('very calm');
    out.push(t.wits <= 1 ? 'not bright' : t.wits >= 5 ? 'sharp' : t.wits >= 3 ? 'clever' : 'simple');
    out.push(t.loyalty >= 5 ? 'fiercely loyal to its own' : t.loyalty <= 2 ? 'out for itself' : 'loyal enough');
    return out.join(', ');
  }
  function leaderOf(e) { return !!e && (e.boss || LEADER_RX.test(e.kind || '')); }
  // the name only replaces the tag once the monster has told you
  function mindReveal(e, quiet) {
    var m = mindOf(e); if (!m || !m.name) return;
    if (!e.tag) e.tag = m.tag; m.known = true; e.name = m.name;
    if (!quiet) { say('You learned a name', 'The ' + String(m.tag).toLowerCase() + ' is called ' + m.name + '.', 3200); if (typeof worldSave === 'function') worldSave(); }
  }
  function mindApplyNames(list) { var byN = {}; CB.enemies.forEach(function (q) { byN[q.n] = q; }); (list || []).forEach(function (n) { var q = byN[n]; if (q && !q.dead) mindReveal(q, true); }); CB.enemies.forEach(function (q) { var m = mindOf(q); if (m && m.known && !q.npc) { if (!q.tag) q.tag = m.tag; q.name = m.name; } }); }
  function mindKnownList() { return CB.enemies.filter(function (q) { return q.mind && q.mind.known && !q.boss; }).map(function (q) { return q.n; }); }
  // ---------- how hard it is to talk this one down, right now ----------
  function mindDC(e) {
    var i = intOf(e), m = mindOf(e) || { t: {} }, t = m.t, dc = i === 'dim' ? 10 : m.fac === 'gate' ? 17 : 15;
    if (t.temper >= 4) dc += 2; if (e.boss) dc += 3;
    if (scared(e)) dc -= 4; if (e.allyCalm) dc -= 2;
    return dc;
  }
  function scared(e) { var t = (mindOf(e) || { t: {} }).t; return !!t.brave && e.hp <= e.max * (t.brave <= 2 ? 0.5 : 0.25); }
  // the persona the talk AI plays: culture plus this individual's card
  function mindPersona(e) {
    var f = FACTIONS[factionOf(e)], m = mindOf(e), i = intOf(e); if (!f || !f.who || !m || i === 'none') return null;
    var w = mindWant(e);
    return { name: (m.known ? m.name + ', ' : '') + f.title,
      who: f.who + ' This individual: its name is ' + m.name + '. It is ' + mindTraits(e) + '. Quirk: it ' + m.quirk + '. Secret (never volunteer it; let it slip only if tricked, charmed or terrified): it ' + m.secret + '.',
      wants: (w ? 'Most of all, ' + w[0] + '. ' : '') + 'Fears: ' + m.fear + '.',
      knows: f.knows + ' Culture: ' + f.culture,
      limits: (i === 'smart' ? 'You are SMART. A good roll alone is never enough: you only agree to stop fighting if the deal genuinely serves your interests (' + f.trades + ') or saving your own skin. Flattery, speeches and vague promises do not work on you; ask what is in it for you.' :
        'You are NOT smart. A convincing-sounding argument, flattery, food or a good scare can talk you down if the roll is good. ' + f.trades + '.') +
        ' Your name is ' + m.name + (m.known ? ' and the player already knows it.' : '. You do not give it to strangers: say it only if asked while not hostile, or when bragging fits you, and set told_name true the line you say it.'),
      voice: f.voice, start: 'hostile' };
  }
  // what the player can see by looking: the race and the culture, not the name
  function mindExamine(e) {
    var f = FACTIONS[factionOf(e)], m = mindOf(e), sp = speciesOf(e); if (!f || !sp) return '';
    var head = (m && m.known ? m.name + ' · ' : '') + sp.race + ' · ' + f.title + '. ';
    var i = intOf(e);
    return head + (i === 'none' ? 'It does not understand words. You cannot reason with it. ' : i === 'dim' ? 'It talks, though not well. A good argument might work on it. ' : 'It is sharp. It will only deal if the deal suits it. ') + (m && m.quirk ? 'Right now it ' + m.quirk + '. ' : '');
  }
  // a good read on someone tells you what it wants: that is how you deal with smart ones
  function mindRead(e) {
    var m = mindOf(e), w = mindWant(e); if (!m || !m.quirk) return e.def.base === 'rat' ? 'Hungry. Just hungry.' : 'It wants to eat. That is all there is in there.';
    return 'It is ' + mindTraits(e) + '. ' + (w ? 'What it really wants: ' + w[0] + '. ' : '') + 'It is afraid of ' + m.fear + '.' + (scared(e) ? ' Right now it is badly hurt and wants out.' : '');
  }
  // when one stands down mid-fight, its friends react according to who it was and who they are
  function mindGroup(e) {
    if (!CB.on) return; var fac = factionOf(e), lead = leaderOf(e), who = mindName(e);
    CB.enemies.forEach(function (q) {
      if (q === e || q.dead || q.calm || q.npc || factionOf(q) !== fac || cheb(q.x, q.z, e.x, e.z) > 8) return;
      var t = (mindOf(q) || { t: {} }).t;
      q.ctx = (q.ctx || []).concat([who + ' just agreed to stop fighting the player.']).slice(-4);
      if ((lead && t.loyalty >= 3) || (intOf(q) === 'dim' && t.brave <= 2)) {
        q.calm = true; overcome(q);
        say(mindName(q) + ' stands down too', lead ? 'Its boss quit the fight, so it does too.' : 'It sees ' + who + ' back off and decides it does not want to be the last one swinging.', 3800);
      } else q.allyCalm = true;
    });
    if (typeof cbHUD === 'function') cbHUD();
    if (!CB.enemies.some(function (q) { return !q.dead && !q.calm && CB.order.indexOf(q) >= 0; })) cbEnd(true);
  }
  function mindName(e) { var m = mindOf(e); return m && m.known ? m.name : 'the ' + String(e.tag || e.name).toLowerCase(); }
  // what this monster can see right now, told to the talk AI so a fight reads like a fight
  function mindScene(e) {
    var bits = [];
    if (CB.on && CB.order.indexOf(e) >= 0 && !e.calm) bits.push('You are in the MIDDLE OF A FIGHT with the player right now and have been trying to hurt them. Unless you agree to a truce this line, you keep fighting on your next turn, so talk like someone mid-fight: short, out of breath, threatening or bargaining.');
    if (scared(e)) bits.push('You are badly hurt and scared for your life.');
    var allies = CB.enemies.filter(function (q) { return q !== e && !q.npc && !q.dead && speaks(q) && cheb(q.x, q.z, e.x, e.z) <= 8; });
    if (allies.length) bits.push('Others nearby: ' + allies.map(function (q) { var m = mindOf(q); return (m && m.name ? m.name : q.name) + ' (' + (FACTIONS[factionOf(q)] || {}).title + ', ' + (q.calm ? 'has stood down' : CB.on && CB.order.indexOf(q) >= 0 ? 'still fighting' : 'watching') + ')'; }).join('; ') + '.');
    (e.ctx || []).forEach(function (c) { bits.push(c); });
    return bits.join(' ');
  }
  // no AI: stock behavior that still follows the rules (dim folds to a good roll; smart needs its interests met)
  function mindCanned(e, text, roll) {
    var f = FACTIONS[factionOf(e)], m = mindOf(e), t = (text || '').toLowerCase(), w = mindWant(e), i = intOf(e), dc = mindDC(e);
    if (!text) return { say: f.greet ? f.greet[Math.floor(Math.random() * f.greet.length)].replace(/Pibb|Grub/, m.name.split(',')[0]) : '…', mood: e.talk.mood, outcome: 'none' };
    if (/stupid|ugly|idiot|loser|weak/.test(t)) return { say: '*bristles* Wrong thing to say.', mood: 'hostile', outcome: m.t.temper >= 3 ? 'fight' : 'none' };
    if (/name|who are you|call you/.test(t)) {
      if (e.talk.mood !== 'hostile' || (i === 'dim' && roll.total >= 10)) return { say: i === 'dim' ? m.name + '. Name ' + m.name + '. Remember it.' : 'It\'s ' + m.name + '. Don\'t wear it out.', mood: e.talk.mood === 'hostile' ? 'wary' : e.talk.mood, outcome: 'none', told_name: true };
      return { say: i === 'dim' ? 'No name for soap-man.' : 'You haven\'t earned that, pal.', mood: e.talk.mood, outcome: 'none' };
    }
    var hit = w && new RegExp(w[1]).test(t), trade = /gold|give|offer|deal|trade|snack|break|form|file/.test(t);
    var ok = roll.total >= dc && (i === 'dim' || hit || (scared(e) && /live|spare|leave|go|run|mercy/.test(t)));
    if (ok) return { say: i === 'dim' ? (m.name + '... okay. ' + m.name + ' sit down.') : (hit ? 'Fine. That works for me. You never saw me.' : 'Alright, alright. I\'m out. Not worth it.'), mood: 'neutral', outcome: 'calm', used_roll: true };
    return { say: i === 'smart' ? (trade || hit ? 'Not enough. What\'s really in it for me?' : 'Nice speech. What\'s in it for me?') : 'Not buy it, soap-man.', mood: 'wary', outcome: 'none', used_roll: true };
  }
