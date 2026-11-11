
  // ===================== items: every item in the game lives here =====================
  // OWNED BY THE ITEM CATALOG CHAT (see claude/the-crawl-overview.md in The Crawl project). Systems code must not
  // define items inline: look them up with item('Name') and roll drops with rollDrops(). Fields:
  //   cat: weapon | clothing | tool | consumable | valuable | misc   (bodies and boss trophies are made by the engine)
  //   dmg: '1d6' for weapons · heal: '2d4+2' or a number for consumables · slot/style/color for clothing
  //   desc: flavour text shown in the bag · effects: [] reserved for the item effect system (coming)
  //   level: first level it can appear on (from then on, not only then) · until: last level it appears on (optional)
  //   common: true for staples that stay equally common on every level (optional)
  var ITEMS = {
    // ---- consumables ----
    'Healing potion': { cat: 'consumable', heal: '2d4+2', desc: 'Red, fizzy, sponsored. Restores 2d4+2 HP.' , level: 1, common: true },
    'Energy bar': { cat: 'consumable', heal: '1d4', desc: 'Chocolate peanut. Restores 1d4 HP.' , level: 1 },
    'Bottle of water': { cat: 'consumable', heal: '1', desc: 'Lukewarm. Restores 1 HP and some dignity.' , level: 1, common: true },
    'Half-eaten snack': { cat: 'consumable', heal: '1d2', desc: 'You do not want to know what it was. Restores 1d2 HP.' , level: 1 },
    'Craft services sandwich': { cat: 'consumable', heal: 4, desc: 'Free, wrapped, and surprisingly good. Heals 4 HP.' , level: 1 },
    // ---- weapons ----
    'Puglin stick': { cat: 'weapon', dmg: '1d4', desc: 'Chewed at one end. Still works.' , level: 1, until: 3 },
    'Imp mace': { cat: 'weapon', dmg: '1d6', desc: 'Company property. Heavy, spiky, and badly maintained.' , level: 1 },
    'Crowbar': { cat: 'weapon', dmg: '1d6', desc: 'Opens crates, doors and arguments.' , level: 1 },
    // ---- tools ----
    'Roll of duct tape': { cat: 'tool', desc: 'The universal fix. The System has rules about it, but no one has read them.' , level: 1 },
    'Flashlight': { cat: 'tool', desc: 'Works. For now.' , level: 1 },
    'Lighter': { cat: 'tool', desc: 'Three clicks to light. Always three.' , level: 1 },
    'Ball of twine': { cat: 'tool', desc: 'Long enough to find your way back. Maybe.' , level: 1 },
    // ---- valuables and oddities ----
    'Security badge': { cat: 'valuable', desc: 'FLOOR 1 · STAIRWELL · NIGHT SHIFT. The photo is unflattering.' , level: 1 },
    'Bronze loot box coupon': { cat: 'valuable', desc: 'Redeemable at any sponsor booth. There are no sponsor booths.' , level: 1 },
    'Shiny button': { cat: 'misc', desc: 'The puglin was very proud of this.' , level: 1 },
    'Union card': { cat: 'misc', desc: 'Local 666. Dues paid through next season.' , level: 1 },
    'Rusty key': { cat: 'misc', desc: 'Opens something, somewhere, probably.' , level: 1 },
    // ---- brought from home: the canonical versions of starting gear (character creation should look these up by name) ----
    'Pruning shears': { cat: 'weapon', dmg: '1d4', desc: 'Made for stems. Willing to try other things.' , level: 1 },
    "Florist's knife": { cat: 'weapon', dmg: '1d4', desc: 'Small, sharp, and used to being underestimated.' , level: 1 },
    'Claw hammer': { cat: 'weapon', dmg: '1d6', desc: 'The original multitool.' , level: 1 },
    'Roll of floral tape': { cat: 'tool', desc: 'Holds anything together for about a day.' , level: 1 },
    'Bottle opener': { cat: 'tool', desc: 'Opens bottles. Also, sometimes, conversations.' , level: 1 },
    'Tape measure': { cat: 'tool', desc: 'Twenty-five feet of certainty.' , level: 1 },
    'Trauma shears': { cat: 'tool', desc: 'Cuts clothes, seatbelts, and sometimes tension.' , level: 1 },
    'Gauze roll': { cat: 'consumable', heal: '1d4', desc: 'Restores a little dignity and 1d4 HP.' , level: 1, common: true },
    'Phone (no signal)': { cat: 'valuable', desc: 'Flashlight works. Nothing else does.' , level: 1 },
    'Laptop (12% battery)': { cat: 'valuable', desc: 'No Wi-Fi in the dungeon. Heavy enough to throw.' , level: 1 },
    'Keys on a ring': { cat: 'misc', desc: 'Jingles at the worst possible moment.' , level: 1 },
    'Guitar picks (3)': { cat: 'misc', desc: 'Light, sharp-edged, easy to lose.' , level: 1 },
    'Bar rag': { cat: 'misc', desc: 'Damp. Always damp.' , level: 1 },
    // ---- clothing (style must be a wardrobe style; color is a palette index 0-9) ----
    'Hard hat': { cat: 'clothing', slot: 'kHead', style: 'Hard hat', color: 0, desc: 'OSHA approved, in another galaxy.' , level: 1 },
    'Cowboy hat': { cat: 'clothing', slot: 'kHead', style: 'Cowboy hat', color: 0, desc: 'Yeehaw is now a valid battle cry.' , level: 1 },
    'Plain white tee': { cat: 'clothing', slot: 'kTop', style: 'T-shirt', color: 0, desc: 'Clean. Suspiciously clean.' , level: 1 },
    'Grey hoodie': { cat: 'clothing', slot: 'kTop', style: 'Hoodie', color: 2, desc: 'Somebody\'s. Not anymore.' , level: 1 },
    'Black jeans': { cat: 'clothing', slot: 'kPants', style: 'Jeans', color: 1, desc: 'Slim fit. You will make it work.' , level: 1 },
    'Work boots': { cat: 'clothing', slot: 'kBoots', style: 'Work boots', color: 7, desc: 'Steel toe. Good for kicking.' , level: 1 }
  };

  // ---------- where items come from ----------
  // monsters: keyed by monster kind, falling back to its family (puglin, imp, bog, clerk, shrub...)
  //   gold: dice · always: dropped every time · chance: [name, probability]
  // containers: loot boxes ('chest') and searches ('small'): gold dice, how many picks, and the pool to pick from
  // sources: one-off places the engine hands out items
  var DROPS = {
    monsters: {
      puglin: { gold: '1d6', always: ['Puglin stick'], chance: [['Half-eaten snack', 0.5], ['Shiny button', 0.3]] },
      imp: { gold: '2d6+2', always: ['Imp mace', 'Security badge', 'Union card'] }
    },
    containers: {
      chest: { gold: '3d6', picks: [2, 3], from: 'a loot box', pool: ['Healing potion', 'Crowbar', 'Roll of duct tape', 'Flashlight', 'Energy bar', 'Bronze loot box coupon', 'Hard hat', 'Plain white tee', 'Grey hoodie', 'Black jeans', 'Cowboy hat', 'Work boots'] },
      small: { gold: '1d4', picks: [1, 1], from: 'a search', pool: ['Energy bar', 'Bottle of water', 'Rusty key', 'Lighter', 'Ball of twine'] }
    },
    sources: {
      starting: [['Healing potion', 3]],      // every new crawler gets these
      catering: 'Craft services sandwich',      // "Pocket a snack" at a free-food table
      respawn: 'Healing potion'                 // testing mode: dying refills you to at least one
    }
  };

  // ---------- lookups ----------
  function item(name, extra) {
    var b = ITEMS[name]; if (!b) { console.warn('unknown item', name); return null; }
    var o = JSON.parse(JSON.stringify(b)); o.name = name; if (extra) for (var k in extra) o[k] = extra[k]; return o;
  }
  function diceRoll(s) { var m = /(\d+)d(\d+)(?:\+(\d+))?/.exec(String(s || '')); if (!m) return +s || 0; var t = +m[3] || 0; for (var i = 0; i < +m[1]; i++) t += 1 + Math.floor(Math.random() * +m[2]); return t; }
  function rollDrops(kind, family) { // a monster's pockets
    var R = DROPS.monsters[kind] || DROPS.monsters[family]; if (!R) return { gold: 0, items: [] };
    var items = (R.always || []).map(function (n) { return item(n); });
    (R.chance || []).forEach(function (c) { if (Math.random() < c[1]) items.push(item(c[0])); });
    return { gold: diceRoll(R.gold), items: items.filter(Boolean) };
  }
  function rollContainer(kind) { // a loot box or a search
    var R = DROPS.containers[kind]; if (!R) return { gold: 0, items: [] };
    var n = R.picks[0] + Math.floor(Math.random() * (R.picks[1] - R.picks[0] + 1)), items = [];
    for (var i = 0; i < n; i++) { var it = item(R.pool[Math.floor(Math.random() * R.pool.length)], { from: R.from }); if (it) items.push(it); }
    return { gold: diceRoll(R.gold), items: items };
  }

  // ===================== Level 1 pack (added Nov 11 by the systems chat, from the catalog's proposals; see the project overview) =====================
  // New engine fields used below (all optional):
  //   tags: material tags for crafting and Try something (flammable, sticky, wet, conductive, toxic, sharp, long, heavy, glass, paper, slippery, light, loud)
  //   throw: { fx: [effects as in Try something: damage/burn/stun/distract/prone/push/weaken], area: tiles around the target, vs: 'plant'|'fungus' (only hurts those) }
  //   uses: N (a tool with charges; gone when used up) · escape: true (ends a fight, no free hits) · leaves: 'Item' (left behind after use)
  //   crit: 19 (weapon crits on 19-20) · ac: N (+AC while wielded or worn) · onHit: { type, chance } (weapon rider)
  //   checks: { 'Skill': N } (+N to that skill while carried) · buff: 'key' (a buff when used) · light: true (counts as a light source)
  //   box: 'silver' (a loot box you open in a safe room) · cat 'material' = crafting material
  Object.assign(ITEMS, {
    // ---- materials (Harvest, searches) ----
    'Bog slime': { cat: 'material', level: 1, tags: ['flammable', 'sticky', 'wet'], desc: 'Green, warm and it burns like a grudge. Keep it away from your lighter. Or don\'t.' },
    'Rat tail': { cat: 'material', level: 1, tags: ['stringy'], desc: 'Long, pink, still twitching a little. Tough as cord.' },
    'Puglin grease': { cat: 'material', level: 1, tags: ['flammable', 'slippery'], desc: 'Scraped off a puglin. It is mostly puglin.' },
    'Shrub sap': { cat: 'material', level: 1, tags: ['sticky'], desc: 'Amber and tacky. The shrubs use it to hold dinner still.' },
    'Imp horn': { cat: 'material', level: 1, tags: ['sharp', 'hard'], desc: 'A small curved horn. Union-issue.' },
    'Clerk ink': { cat: 'material', level: 1, tags: ['toxic', 'staining'], desc: 'Black, permanent and faintly ticking.' },
    'Archive pages': { cat: 'material', level: 1, tags: ['flammable', 'paper'], desc: 'Forms in triplicate. Two copies too many.' },
    'Empty bottle': { cat: 'material', level: 1, common: true, tags: ['glass', 'container'], desc: 'Holds liquids. Also breaks over heads.' },
    // ---- healing and consumables ----
    'Band-aids': { cat: 'consumable', level: 1, common: true, heal: '1d2', desc: 'Cartoon dinosaurs. Morale +0, dignity -1.' },
    'Ibuprofen': { cat: 'consumable', level: 1, heal: '1d4', desc: 'Take with food. There is no food.' },
    'Protein bar': { cat: 'consumable', level: 1, heal: '1d4+1', desc: 'Thirty grams. Tastes like sweet drywall.' },
    'Breath mints': { cat: 'consumable', level: 1, buff: 'minty', desc: 'Curiously strong. +2 to talking for 10 minutes.' },
    'Sponsor\'s charcoal tonic': { cat: 'consumable', level: 1, heal: '1d4', desc: 'Tastes like a campfire apologizing.' },
    'Greater healing potion': { cat: 'consumable', level: 2, heal: '4d4+4', rarity: 'Uncommon', desc: 'Orange, thick, and the sponsor logo is embossed on the glass.' },
    'EpiPen': { cat: 'consumable', level: 1, heal: '2d4', rarity: 'Uncommon', desc: 'Jab, hold for three seconds, apologize.' },
    'Roll of toilet paper': { cat: 'consumable', level: 1, common: true, heal: '1', tags: ['flammable', 'paper'], desc: 'Two-ply. A luxury down here. Burns nicely.' },
    // ---- throwables ----
    'Hot sauce': { cat: 'consumable', level: 1, tags: ['spicy'], throw: { fx: [{ type: 'distract', turns: 1 }] }, desc: 'The label is a skull wearing a sombrero. Throw it in a face.' },
    'Can of cooking spray': { cat: 'consumable', level: 1, tags: ['flammable', 'slippery'], throw: { fx: [{ type: 'prone' }] }, desc: 'Zero calories per serving. Spray the floor under something.' },
    'Bug spray': { cat: 'consumable', level: 1, tags: ['flammable', 'toxic'], throw: { fx: [{ type: 'distract', turns: 2 }], area: 1 }, desc: 'DEET concentration: aggressive. Also: aerosol. Also: flammable.' },
    'Bleach': { cat: 'consumable', level: 1, tags: ['toxic'], throw: { fx: [{ type: 'damage', dice: '2d6' }], vs: 'plant' }, desc: 'Kills 99.9% of germs, and shrubs. Never mix with ammonia.' },
    'Weed killer': { cat: 'consumable', level: 1, tags: ['toxic'], throw: { fx: [{ type: 'damage', dice: '2d6' }], area: 1, vs: 'plant' }, desc: 'Do not use near the shrubs. Unless.' },
    'Goblin hob-lobber': { cat: 'consumable', level: 1, rarity: 'Uncommon', tags: ['flammable', 'explosive'], throw: { fx: [{ type: 'damage', dice: '3d6' }, { type: 'burn', dice: '1d4', turns: 2 }], area: 1 }, desc: 'The fuse is shorter than the label claims. The label is also on fire.' },
    'Smoke bomb': { cat: 'consumable', level: 1, rarity: 'Uncommon', escape: true, desc: 'Smells like burnt popcorn. Leave a fight with no free hits.' },
    'Fire extinguisher': { cat: 'tool', level: 1, uses: 3, tags: ['heavy'], throw: { fx: [{ type: 'stun', turns: 1 }] }, desc: 'Inspected in 2019. Probably fine. A face full of foam stuns for a moment.' },
    'Cordless leaf blower': { cat: 'tool', level: 1, uses: 3, throw: { fx: [{ type: 'push', tiles: 2 }] }, desc: 'Battery shows two bars. It has shown two bars since 2019.' },
    'Bluetooth speaker': { cat: 'tool', level: 1, uses: 5, tags: ['loud'], throw: { fx: [{ type: 'distract', turns: 1 }], area: 2 }, desc: '"The Bluetooth device is ready to pair." Everything nearby turns to look.' },
    'Floral foam brick': { cat: 'tool', level: 1, tags: ['absorbent'], desc: 'Green, crumbly, and weirdly satisfying to squeeze. Soaks up liquids.' },
    // ---- weapons ----
    'Box cutter': { cat: 'weapon', level: 1, dmg: '1d4', tags: ['sharp'], desc: 'Retractable, for safety. Ha.' },
    'Chef\'s knife': { cat: 'weapon', level: 1, dmg: '1d4', crit: 19, tags: ['sharp'], desc: 'German steel. Still has the price sticker. Crits on 19-20.' },
    'Letter opener': { cat: 'weapon', level: 1, dmg: '1d4', tags: ['sharp'], desc: 'A retirement gift. The plaque says Tom.' },
    'Golf club (7 iron)': { cat: 'weapon', level: 1, dmg: '1d6', crit: 19, tags: ['long'], desc: 'From a set no one finished paying for. Crits on 19-20 if you yell "fore".' },
    'Cast iron skillet': { cat: 'weapon', level: 1, dmg: '1d6', ac: 1, tags: ['heavy'], desc: 'Seasoned for eleven years. +1 AC while you hold it up.' },
    'Meat tenderizer': { cat: 'weapon', level: 1, dmg: '1d6', onHit: { type: 'weaken', ac: 1, turns: 1, chance: 1 }, desc: 'The waffle pattern leaves a mark. Hits knock 1 off its armor.' },
    'Rolling pin': { cat: 'weapon', level: 1, dmg: '1d4', onHit: { type: 'prone', chance: 0.25 }, desc: 'Grandma energy. Sometimes knocks them flat.' },
    'Broom': { cat: 'weapon', level: 1, dmg: '1d4', tags: ['long', 'flammable'], desc: 'Witches have not called dibs.' },
    'Mop': { cat: 'weapon', level: 1, dmg: '1d4', tags: ['long', 'absorbent'], desc: 'Wet floor sign not included. Cleans up slime.' },
    'Rake': { cat: 'weapon', level: 1, dmg: '1d6', tags: ['long'], desc: 'Every cartoon warned you.' },
    'Plunger': { cat: 'weapon', level: 1, dmg: '1d4', desc: 'Unused. Allegedly.' },
    'Tennis racket': { cat: 'weapon', level: 1, dmg: '1d4', desc: 'Restrung once, in 2012.' },
    'Ergonomic keyboard': { cat: 'weapon', level: 1, dmg: '1d4', desc: 'Split down the middle, like the office.' },
    'Stapler': { cat: 'weapon', level: 1, dmg: '1d2', desc: 'Someone wrote their name on it in Sharpie. Mostly insulting.' },
    'Hedge trimmers': { cat: 'weapon', level: 1, dmg: '1d8', tags: ['sharp', 'long'], desc: 'Long handles. Longer reach. Very satisfying.' },
    'Bike lock and chain': { cat: 'weapon', level: 1, dmg: '1d6', tags: ['heavy'], desc: 'The key is somewhere. Somewhere.' },
    'Cordless drill': { cat: 'weapon', level: 1, dmg: '1d6', checks: { 'Lockpicking': 2 }, desc: 'Two batteries, neither charged. +2 to locks.' },
    'Jumper cables': { cat: 'weapon', level: 1, dmg: '2d4', tags: ['conductive'], rarity: 'Uncommon', desc: 'Red to dead, black to back. Or something.' },
    'Pallet jack': { cat: 'weapon', level: 1, dmg: '1d10', tags: ['heavy'], rarity: 'Uncommon', desc: 'Requires a forklift certification you do not have.' },
    // ---- tools ----
    'Headlamp': { cat: 'tool', level: 1, light: true, desc: 'Light that keeps both hands free. Counts as a torch.' },
    'Roll of aluminum foil': { cat: 'tool', level: 1, tags: ['conductive'], desc: 'Ari will want this for unrelated reasons.' },
    'Bungee cords': { cat: 'tool', level: 1, tags: ['elastic'], desc: 'Will absolutely snap back at your face once.' },
    'Zip ties (10)': { cat: 'tool', level: 1, tags: ['binding'], desc: 'The answer to most problems, and the cause of several.' },
    'WD-40': { cat: 'tool', level: 1, tags: ['flammable', 'slippery'], checks: { 'Lockpicking': 2, 'Stealth': 1 }, desc: 'If it should move and does not: this. +2 to locks.' },
    'Lint roller': { cat: 'tool', level: 1, checks: { 'Investigation': 2 }, desc: 'Forensics on a budget. +2 to Investigation.' },
    'Sticky notes': { cat: 'tool', level: 1, tags: ['paper', 'flammable'], desc: 'Yellow. The good kind.' },
    'Selfie stick': { cat: 'tool', level: 1, tags: ['long'], desc: 'The ultimate tool of self-regard.' },
    'Shop vac': { cat: 'tool', level: 1, tags: ['heavy', 'loud'], desc: 'Loud enough to wake the next floor.' },
    'Yoga mat': { cat: 'tool', level: 1, checks: { 'Stealth': 1 }, desc: 'Smells faintly of lavender and feet.' },
    'Tide pen': { cat: 'tool', level: 1, desc: 'For stains. Of any kind.' },
    // ---- valuables ----
    'Laminated visitor badge': { cat: 'valuable', level: 1, checks: { 'Deception': 2 }, desc: 'VISITOR. ESCORT REQUIRED. The System sometimes believes it.' },
    '"World\'s Best Boss" mug': { cat: 'valuable', level: 1, tags: ['glass'], desc: 'Self-purchased.' },
    'Wallet ($14 and a punch card)': { cat: 'valuable', level: 1, desc: 'One more punch for a free sandwich, in another universe.' },
    'Silver loot box': { cat: 'valuable', level: 1, rarity: 'Uncommon', box: 'silver', desc: 'The System promises this one is better. Opens in a safe room.' },
    // ---- elite and boss drops (enchanted) ----
    'Knobbly War Club +1': { cat: 'weapon', level: 1, dmg: '1d6', bonus: 1, rarity: 'Uncommon', desc: 'The war-chief carved notches in it. You do not want to count them.' },
    'Clipboard of Authority +1': { cat: 'weapon', level: 1, dmg: '1d4', bonus: 1, rarity: 'Uncommon', checks: { 'Intimidation': 2 }, desc: 'Sharpened along one edge. People step aside for a clipboard.' },
    'Warden\'s Reed Spear +1': { cat: 'weapon', level: 1, dmg: '1d6', bonus: 1, rarity: 'Uncommon', tags: ['long'], desc: 'Swamp-cured, light, and smells of the Gardens.' },
    'Head Clerk\'s Letter Opener +1': { cat: 'weapon', level: 1, dmg: '1d4', bonus: 1, crit: 19, rarity: 'Uncommon', tags: ['sharp'], desc: 'For opening letters, and other things. Crits on 19-20.' },
    'Gristle King\'s Cleaver +1': { cat: 'weapon', level: 1, dmg: '1d8', bonus: 1, crit: 19, rarity: 'Rare', tags: ['sharp', 'heavy'], desc: 'Grik\'s pride. Still greasy. Crits on 19-20.' },
    'Shop Steward\'s Gavel +1': { cat: 'weapon', level: 1, dmg: '1d6', bonus: 1, rarity: 'Rare', onHit: { type: 'stun', turns: 1, chance: 0.15 }, desc: 'Order! Order! Sometimes stuns on a hit.' },
    'Archivist\'s Lantern': { cat: 'tool', level: 1, rarity: 'Rare', light: true, checks: { 'Investigation': 3, 'Perception': 2 }, desc: 'It shows what was filed away. A light, +3 Investigation, +2 Perception.' },
    'The Gardener\'s Shears +1': { cat: 'weapon', level: 1, dmg: '1d6', bonus: 1, crit: 19, rarity: 'Rare', tags: ['sharp'], desc: 'They hum near anything green. Crits on 19-20.' },
    'Headliner\'s Mic Stand +1': { cat: 'weapon', level: 1, dmg: '1d8', bonus: 1, rarity: 'Rare', checks: { 'Performance': 3 }, tags: ['long', 'heavy'], desc: 'The crowd still chants when you lift it. +3 Performance.' },
    'Gatekeeper\'s Keyring': { cat: 'tool', level: 1, rarity: 'Rare', checks: { 'Lockpicking': 5 }, desc: 'Forty keys, one of them to everything on this floor. +5 to locks.' }
  });
  ITEMS['Bottle of water'].leaves = 'Empty bottle';
  ITEMS['Flashlight'].light = true;
  ITEMS['Lighter'].tags = ['fire'];
  ITEMS['Roll of duct tape'].tags = ['sticky', 'binding'];
  ITEMS['Roll of floral tape'] && (ITEMS['Roll of floral tape'].tags = ['sticky']);
  ITEMS['Ball of twine'].tags = ['stringy', 'flammable'];
  ITEMS['Crowbar'].tags = ['heavy', 'lever'];

  // drops: elites, bosses, rats; a fuller loot box; room-themed searches (engine picks small_<theme>, else small)
  Object.assign(DROPS.monsters, {
    rat: { gold: '0', chance: [['Rat tail', 0.6]] },
    bog: { gold: '1d4', chance: [['Bog slime', 0.7], ['Band-aids', 0.15]] },
    clerk: { gold: '1d6', chance: [['Clerk ink', 0.5], ['Archive pages', 0.5], ['Stapler', 0.2], ['Sticky notes', 0.2]] },
    shrub1: { gold: '0', chance: [['Shrub sap', 0.6]] }, shrub2: { gold: '0', chance: [['Shrub sap', 0.7]] }, shrub3: { gold: '1d4', chance: [['Shrub sap', 0.8]] }, shrub4: { gold: '1d6', always: ['Shrub sap'] },
    puglin_brute: { gold: '2d6', always: ['Puglin grease'], chance: [['Healing potion', 0.3], ['Hot sauce', 0.3]] },
    puglin_chief: { gold: '4d6', always: ['Puglin grease', 'Healing potion'], oneOf: ['Knobbly War Club +1'] },
    imp_intern: { gold: '2d6', always: ['Union card'], chance: [['Imp horn', 0.4], ['Ibuprofen', 0.3]] },
    imp_foreman: { gold: '4d6', always: ['Security badge', 'Healing potion'], chance: [['Smoke bomb', 0.4]], oneOf: ['Clipboard of Authority +1'] },
    bog_brute: { gold: '2d6', always: ['Bog slime'], chance: [['Healing potion', 0.3]] },
    bog_chief: { gold: '4d6', always: ['Bog slime', 'Healing potion'], oneOf: ['Warden\'s Reed Spear +1'] },
    clerk_mid: { gold: '2d6', always: ['Archive pages'], chance: [['Laminated visitor badge', 0.3], ['Ibuprofen', 0.3]] },
    clerk_head: { gold: '4d6', always: ['Archive pages', 'Healing potion'], oneOf: ['Head Clerk\'s Letter Opener +1'] },
    grik: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['Gristle King\'s Cleaver +1'] },
    steward: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['Shop Steward\'s Gavel +1'] },
    archivist: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['Archivist\'s Lantern'] },
    gardener: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['The Gardener\'s Shears +1'] },
    headliner: { gold: '8d6', always: ['Silver loot box', 'Goblin hob-lobber'], oneOf: ['Headliner\'s Mic Stand +1'] },
    gatekeeper: { gold: '8d6', always: ['Silver loot box', 'Greater healing potion'], oneOf: ['Gatekeeper\'s Keyring'] }
  });
  DROPS.monsters.puglin.chance.push(['Puglin grease', 0.35]);
  DROPS.monsters.imp.chance = [['Imp horn', 0.4], ['Smoke bomb', 0.1]];
  DROPS.containers.chest.pool = DROPS.containers.chest.pool.concat(['Healing potion', 'Chef\'s knife', 'Golf club (7 iron)', 'Cast iron skillet', 'Headlamp', 'Fire extinguisher', 'Bluetooth speaker', 'Smoke bomb', 'Goblin hob-lobber', 'Tennis racket', 'WD-40', 'Bungee cords', 'Protein bar', 'Hot sauce', 'Silver loot box', 'EpiPen']);
  DROPS.containers.silver = { gold: '4d6', picks: [2, 4], from: 'a silver loot box', pool: ['Greater healing potion', 'Healing potion', 'Goblin hob-lobber', 'Smoke bomb', 'Jumper cables', 'Pallet jack', 'Headlamp', 'EpiPen', 'Golf club (7 iron)', 'Chef\'s knife', 'Cast iron skillet', 'Meat tenderizer'] };
  DROPS.containers.small.pool = DROPS.containers.small.pool.concat(['Band-aids', 'Roll of toilet paper', 'Breath mints', 'Box cutter', 'Bungee cords', 'Zip ties (10)', 'Empty bottle', 'Wallet ($14 and a punch card)', 'Ibuprofen']);
  DROPS.containers.small_office = { gold: '1d6', picks: [1, 2], from: 'a desk', pool: ['Stapler', 'Letter opener', 'Sticky notes', 'Archive pages', 'Ergonomic keyboard', 'Laminated visitor badge', '"World\'s Best Boss" mug', 'Breath mints', 'Lint roller', 'Ibuprofen', 'Box cutter'] };
  DROPS.containers.small_store = { gold: '1d4', picks: [1, 2], from: 'the shelves', pool: ['Broom', 'Mop', 'Bleach', 'Plunger', 'Roll of toilet paper', 'Bungee cords', 'Zip ties (10)', 'WD-40', 'Cordless drill', 'Shop vac', 'Box cutter', 'Fire extinguisher', 'Roll of aluminum foil'] };
  DROPS.containers.small_garden = { gold: '1d4', picks: [1, 2], from: 'the potting shed', pool: ['Rake', 'Hedge trimmers', 'Weed killer', 'Bug spray', 'Cordless leaf blower', 'Shrub sap', 'Bog slime', 'Floral foam brick', 'Bottle of water'] };
  DROPS.containers.small_moss = DROPS.containers.small_garden;
  DROPS.containers.small_bazaar = { gold: '2d4', picks: [1, 2], from: 'a stall', pool: ['Hot sauce', 'Can of cooking spray', 'Chef\'s knife', 'Rolling pin', 'Meat tenderizer', 'Cast iron skillet', 'Protein bar', 'Energy bar', 'Roll of aluminum foil', 'Bottle of water'] };
  DROPS.containers.small_arena = { gold: '2d4', picks: [1, 2], from: 'the locker', pool: ['Tennis racket', 'Golf club (7 iron)', 'Yoga mat', 'Protein bar', 'Bluetooth speaker', 'Selfie stick', 'Band-aids', 'Ibuprofen'] };
  DROPS.containers.small_studio = DROPS.containers.small_arena;
