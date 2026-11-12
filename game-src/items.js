
  // ===================== items: every item in the game lives here =====================
  // OWNED BY THE ITEM CATALOG CHAT (see claude/the-crawl-overview.md in The Crawl project). Systems code must not
  // define items inline: look them up with item('Name') and roll drops with rollDrops(). Fields:
  //   cat: weapon | clothing | tool | consumable | valuable | misc | material   (bodies and boss trophies are made by the engine)
  //   dmg: '1d6' for weapons · heal: '2d4+2' or a number for consumables · slot/style/color for clothing
  //   desc: flavour text shown in the bag · effects: [] reserved for the item effect system (coming)
  //   level: first level it can appear on (from then on, not only then) · until: last level it appears on (optional)
  //   common: true for staples that stay equally common on every level (optional)
  //   rarity: 'Uncommon' | 'Rare' (loot weighting and bag colour) · bonus: N (enchanted: +N to hit and damage)
  //   tags: material tags for crafting and Try something (flammable, sticky, wet, conductive, toxic, sharp, long, heavy, glass, paper, slippery, light, loud...)
  //   throw: { fx: [damage/burn/stun/distract/prone/push/weaken effects], area: tiles around the target, vs: 'plant'|'fungus' (only hurts those) }
  //   uses: N (charges; gone when used up) · escape: true (ends a fight, no free hits) · leaves: 'Item' (left behind after use)
  //   crit: 19 (crits on 19-20) · ac: N (+AC while wielded or worn) · onHit: { type, chance } (weapon rider)
  //   checks: { 'Skill': N } (+N to that skill while carried) · buff: 'key' (a buff when used) · light: true (counts as a light source)
  //   box: 'silver' (a loot box you open in a safe room)
  var ITEMS = {
    // ---- healing and consumables ----
    'Healing potion': { cat: 'consumable', heal: '2d4+2', level: 1, common: true, desc: 'Red, fizzy, sponsored. Restores 2d4+2 HP.' },
    'Energy bar': { cat: 'consumable', heal: '1d4', level: 1, desc: 'Chocolate peanut. Restores 1d4 HP.' },
    'Bottle of water': { cat: 'consumable', heal: '1', leaves: 'Empty bottle', level: 1, common: true, desc: 'Lukewarm. Restores 1 HP and some dignity.' },
    'Half-eaten snack': { cat: 'consumable', heal: '1d2', level: 1, desc: 'You do not want to know what it was. Restores 1d2 HP.' },
    'Craft services sandwich': { cat: 'consumable', heal: 4, level: 1, desc: 'Free, wrapped, and surprisingly good. Heals 4 HP.' },
    'Band-aids': { cat: 'consumable', heal: '1d2', level: 1, common: true, desc: 'Cartoon dinosaurs. Morale +0, dignity -1.' },
    'Ibuprofen': { cat: 'consumable', heal: '1d4', level: 1, desc: 'Take with food. There is no food.' },
    'Protein bar': { cat: 'consumable', heal: '1d4+1', level: 1, desc: 'Thirty grams. Tastes like sweet drywall.' },
    'Breath mints': { cat: 'consumable', buff: 'minty', level: 1, desc: 'Curiously strong. +2 to talking for 10 minutes.' },
    'Sponsor\'s charcoal tonic': { cat: 'consumable', heal: '1d4', level: 1, desc: 'Tastes like a campfire apologizing.' },
    'Greater healing potion': { cat: 'consumable', heal: '4d4+4', rarity: 'Uncommon', level: 2, desc: 'Orange, thick, and the sponsor logo is embossed on the glass.' },
    'EpiPen': { cat: 'consumable', heal: '2d4', rarity: 'Uncommon', level: 1, desc: 'Jab, hold for three seconds, apologize.' },
    'Roll of toilet paper': { cat: 'consumable', heal: '1', tags: ['flammable', 'paper'], level: 1, common: true, desc: 'Two-ply. A luxury down here. Burns nicely.' },
    // ---- throwables and fight tricks (throw / escape) ----
    'Hot sauce': { cat: 'consumable', throw: { fx: [{ type: 'distract', turns: 1 }] }, tags: ['spicy'], level: 1, desc: 'The label is a skull wearing a sombrero. Throw it in a face.' },
    'Can of cooking spray': { cat: 'consumable', throw: { fx: [{ type: 'prone' }] }, tags: ['flammable', 'slippery'], level: 1, desc: 'Zero calories per serving. Spray the floor under something.' },
    'Bug spray': { cat: 'consumable', throw: { fx: [{ type: 'distract', turns: 2 }], area: 1 }, tags: ['flammable', 'toxic'], level: 1, desc: 'DEET concentration: aggressive. Also: aerosol. Also: flammable.' },
    'Bleach': { cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '2d6' }], vs: 'plant' }, tags: ['toxic'], level: 1, desc: 'Kills 99.9% of germs, and shrubs. Never mix with ammonia.' },
    'Weed killer': { cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '2d6' }], area: 1, vs: 'plant' }, tags: ['toxic'], level: 1, desc: 'Do not use near the shrubs. Unless.' },
    'Goblin hob-lobber': { cat: 'consumable', throw: { fx: [{ type: 'damage', dice: '3d6' }, { type: 'burn', dice: '1d4', turns: 2 }], area: 1 }, tags: ['flammable', 'explosive'], rarity: 'Uncommon', level: 1, desc: 'The fuse is shorter than the label claims. The label is also on fire.' },
    'Smoke bomb': { cat: 'consumable', escape: true, rarity: 'Uncommon', level: 1, desc: 'Smells like burnt popcorn. Leave a fight with no free hits.' },
    'Fire extinguisher': { cat: 'tool', uses: 3, throw: { fx: [{ type: 'stun', turns: 1 }] }, tags: ['heavy'], level: 1, desc: 'Inspected in 2019. Probably fine. A face full of foam stuns for a moment.' },
    'Cordless leaf blower': { cat: 'tool', uses: 3, throw: { fx: [{ type: 'push', tiles: 2 }] }, level: 1, desc: 'Battery shows two bars. It has shown two bars since 2019.' },
    'Bluetooth speaker': { cat: 'tool', uses: 5, throw: { fx: [{ type: 'distract', turns: 1 }], area: 2 }, tags: ['loud'], level: 1, desc: '"The Bluetooth device is ready to pair." Everything nearby turns to look.' },
    // ---- weapons ----
    'Puglin stick': { cat: 'weapon', dmg: '1d4', tags: ['wood', 'long'], level: 1, until: 3, desc: 'Chewed at one end. Still works.' },
    'Imp mace': { cat: 'weapon', dmg: '1d6', level: 1, desc: 'Company property. Heavy, spiky, and badly maintained.' },
    'Crowbar': { cat: 'weapon', dmg: '1d6', tags: ['heavy', 'lever'], level: 1, desc: 'Opens crates, doors and arguments.' },
    'Box cutter': { cat: 'weapon', dmg: '1d4', tags: ['sharp'], level: 1, desc: 'Retractable, for safety. Ha.' },
    'Chef\'s knife': { cat: 'weapon', dmg: '1d4', crit: 19, tags: ['sharp'], level: 1, desc: 'German steel. Still has the price sticker. Crits on 19-20.' },
    'Letter opener': { cat: 'weapon', dmg: '1d4', tags: ['sharp'], level: 1, desc: 'A retirement gift. The plaque says Tom.' },
    'Golf club (7 iron)': { cat: 'weapon', dmg: '1d6', crit: 19, tags: ['long'], level: 1, desc: 'From a set no one finished paying for. Crits on 19-20 if you yell "fore".' },
    'Cast iron skillet': { cat: 'weapon', dmg: '1d6', ac: 1, tags: ['heavy'], level: 1, desc: 'Seasoned for eleven years. +1 AC while you hold it up.' },
    'Meat tenderizer': { cat: 'weapon', dmg: '1d6', onHit: { type: 'weaken', ac: 1, turns: 1, chance: 1 }, level: 1, desc: 'The waffle pattern leaves a mark. Hits knock 1 off its armor.' },
    'Rolling pin': { cat: 'weapon', dmg: '1d4', onHit: { type: 'prone', chance: 0.25 }, level: 1, desc: 'Grandma energy. Sometimes knocks them flat.' },
    'Broom': { cat: 'weapon', dmg: '1d4', tags: ['long', 'flammable', 'wood'], level: 1, desc: 'Witches have not called dibs.' },
    'Mop': { cat: 'weapon', dmg: '1d4', tags: ['long', 'absorbent', 'wood'], level: 1, desc: 'Wet floor sign not included. Cleans up slime.' },
    'Rake': { cat: 'weapon', dmg: '1d6', tags: ['long', 'wood'], level: 1, desc: 'Every cartoon warned you.' },
    'Plunger': { cat: 'weapon', dmg: '1d4', level: 1, desc: 'Unused. Allegedly.' },
    'Tennis racket': { cat: 'weapon', dmg: '1d4', level: 1, desc: 'Restrung once, in 2012.' },
    'Ergonomic keyboard': { cat: 'weapon', dmg: '1d4', level: 1, desc: 'Split down the middle, like the office.' },
    'Stapler': { cat: 'weapon', dmg: '1d2', level: 1, desc: 'Someone wrote their name on it in Sharpie. Mostly insulting.' },
    'Hedge trimmers': { cat: 'weapon', dmg: '1d8', tags: ['sharp', 'long'], level: 1, desc: 'Long handles. Longer reach. Very satisfying.' },
    'Bike lock and chain': { cat: 'weapon', dmg: '1d6', tags: ['heavy'], level: 1, desc: 'The key is somewhere. Somewhere.' },
    'Cordless drill': { cat: 'weapon', dmg: '1d6', checks: { Lockpicking: 2 }, level: 1, desc: 'Two batteries, neither charged. +2 to locks.' },
    'Jumper cables': { cat: 'weapon', dmg: '2d4', tags: ['conductive'], rarity: 'Uncommon', level: 1, desc: 'Red to dead, black to back. Or something.' },
    'Pallet jack': { cat: 'weapon', dmg: '1d10', tags: ['heavy'], rarity: 'Uncommon', level: 1, desc: 'Requires a forklift certification you do not have.' },
    // Floor 2: real weapons off the fantasy set on Soundstage 9 (they were props until the System made them real; the rust is real too)
    // model: the held 3D model from kit2/weapons.json · len: its length in hand · bow: shoots arrows (range/long in tiles)
    'Rusty arming sword': { cat: 'weapon', dmg: '1d6', crit: 19, tags: ['sharp'], level: 2, model: 'w_sword1', len: 0.48, desc: 'A one-handed sword from the props department. Someone forgot to blunt it. Crits on 19-20.' },
    'Rusty longsword': { cat: 'weapon', dmg: '1d8', tags: ['sharp', 'long'], level: 2, model: 'w_sword2', len: 0.66, desc: 'Long, heavy and orange with rust. Looks great on camera, works great off it.' },
    'Rusty broadsword': { cat: 'weapon', dmg: '1d8', onHit: { type: 'weaken', ac: 1, turns: 1, chance: 0.25 }, tags: ['sharp'], level: 2, model: 'w_sword3', len: 0.56, desc: 'Wide blade, dented guard. Sometimes knocks a chunk off their armor.' },
    'Rusty hatchet': { cat: 'weapon', dmg: '1d6', tags: ['sharp'], level: 2, model: 'w_axe1', len: 0.4, desc: 'A bearded axe from the bandit camp scene. The beard is the blade, not a man.' },
    'Rusty battleaxe': { cat: 'weapon', dmg: '1d10', twoHand: true, tags: ['sharp', 'heavy'], rarity: 'Uncommon', level: 2, model: 'w_axe2', len: 0.55, desc: 'Double-bladed and badly balanced. Hits like a falling set wall. Two-handed: no torch or shield with it.' },
    'Rusty flanged mace': { cat: 'weapon', dmg: '1d8', onHit: { type: 'prone', chance: 0.15 }, tags: ['heavy'], level: 2, model: 'w_mace', len: 0.46, desc: 'Iron flanges on a stick. Sometimes knocks them flat.' },
    'Rusty spear': { cat: 'weapon', dmg: '1d8', tags: ['long', 'sharp'], level: 2, model: 'w_spear', len: 1.05, desc: 'Taller than you. The tip is the only part that was ever sharpened.' },
    'Bandit\'s shortbow': { cat: 'weapon', dmg: '1d4', bow: { ammo: 'arrow', range: 16, long: 48 }, tags: ['light'], rarity: 'Uncommon', level: 2, model: 'w_bow', len: 0.72, desc: 'Hold it and Throw becomes Shoot, out to 16 tiles (48 at disadvantage). Needs arrows; the arrows decide the damage. You get half of them back after a fight. Up close it is just a stick (1d4).' },
    // clean steel: the same weapons, cared for. skin: repaint (steel, gold, storm, ember, frost, shadow) · acc: +N to hit (not magic)
    // edmg: { dice, type } extra damage of a type on every hit (doubled on a crit, doubled again vs monsters weak to it)
    'Steel arming sword': { cat: 'weapon', dmg: '1d6', crit: 19, acc: 1, tags: ['sharp'], rarity: 'Uncommon', level: 2, model: 'w_sword1', skin: 'steel', len: 0.48, desc: 'No rust. Somebody oiled this. +1 to hit, crits on 19-20.' },
    'Steel longsword': { cat: 'weapon', dmg: '1d8', acc: 1, tags: ['sharp', 'long'], rarity: 'Uncommon', level: 2, model: 'w_sword2', skin: 'steel', len: 0.66, desc: 'The hero\'s sword, the one for close-ups. +1 to hit.' },
    'Steel broadsword': { cat: 'weapon', dmg: '1d8', acc: 1, onHit: { type: 'weaken', ac: 1, turns: 1, chance: 0.25 }, tags: ['sharp'], rarity: 'Uncommon', level: 2, model: 'w_sword3', skin: 'steel', len: 0.56, desc: 'Clean, wide and heavy. +1 to hit; sometimes knocks a chunk off their armor.' },
    'Steel battleaxe': { cat: 'weapon', dmg: '1d10', twoHand: true, acc: 1, tags: ['sharp', 'heavy'], rarity: 'Uncommon', level: 2, model: 'w_axe2', skin: 'steel', len: 0.55, desc: 'Sharpened on both sides. +1 to hit. Two-handed.' },
    'Steel spear': { cat: 'weapon', dmg: '1d8', acc: 1, tags: ['long', 'sharp'], rarity: 'Uncommon', level: 2, model: 'w_spear', skin: 'steel', len: 1.05, desc: 'A proper spear with a proper point. +1 to hit.' },
    // uniques: bosses and elites only
    'Stormcaller Longsword +1': { cat: 'weapon', dmg: '1d8', bonus: 1, edmg: { dice: '1d4', type: 'lightning' }, tags: ['sharp', 'long', 'conductive'], rarity: 'Rare', level: 2, model: 'w_sword2', skin: 'storm', len: 0.7, desc: 'Blue steel that will not stop crackling. +1 to hit and damage, plus 1d4 lightning on every hit. Animatronics hate it.' },
    'Emberbrand Battleaxe +1': { cat: 'weapon', dmg: '1d10', twoHand: true, bonus: 1, edmg: { dice: '1d4', type: 'fire' }, tags: ['sharp', 'heavy', 'fire'], rarity: 'Rare', level: 2, model: 'w_axe2', skin: 'ember', len: 0.6, desc: 'Black iron, hot to the touch, smells like a pyro test. +1, plus 1d4 fire. Mushrooms burn. Two-handed.' },
    'Frostbite Arming Sword +1': { cat: 'weapon', dmg: '1d6', crit: 19, bonus: 1, edmg: { dice: '1d4', type: 'cold' }, onHit: { type: 'stun', turns: 1, chance: 0.1 }, tags: ['sharp'], rarity: 'Rare', level: 2, model: 'w_sword1', skin: 'frost', len: 0.5, desc: 'Frosted white, and it fogs your breath. +1, plus 1d4 cold; now and then the cold locks them up for a turn.' },
    'Nightshade Spear +1': { cat: 'weapon', dmg: '1d8', bonus: 1, edmg: { dice: '1d4', type: 'necrotic' }, tags: ['long', 'sharp'], rarity: 'Rare', level: 2, model: 'w_spear', skin: 'shadow', len: 1.1, desc: 'The point drinks the light around it. +1, plus 1d4 necrotic.' },
    'Golden Prop Mace +1': { cat: 'weapon', dmg: '1d8', bonus: 1, crit: 19, onHit: { type: 'prone', chance: 0.25 }, tags: ['heavy'], rarity: 'Rare', level: 2, model: 'w_mace', skin: 'gold', len: 0.5, desc: 'Spray-painted gold for an awards episode. It is solid iron underneath. +1, crits on 19-20, knocks them flat a quarter of the time.' },
    'Stunt Coordinator\'s Greatsword +1': { cat: 'weapon', dmg: '2d6', twoHand: true, bonus: 1, tags: ['sharp', 'long', 'heavy'], rarity: 'Rare', level: 2, model: 'w_sword2', skin: 'steel', len: 0.95, desc: 'The big one. Choreographed a thousand fights, lost none of them. 2d6, +1. Two-handed.' },
    // ammo: cat misc so it stacks (qty). ammo: { kind (matches the launcher's bow.ammo), s: damage die, acc: +N to hit, onHit: rider }. twoHand: true = no torch, shield or dagger in the off hand. Jury-rig 2 parts: wood + a tip (see ARROWS in v2_craft.js)
    'Splintered wood': { cat: 'material', tags: ['wood', 'flammable', 'long'], level: 1, desc: 'Busted shelving, a chair leg, part of a pallet. Two of these make arrows.' },
    'Chunk of rubble': { cat: 'material', tags: ['stone', 'heavy', 'hard'], level: 1, desc: 'A fist-sized piece of the dungeon. It came off the wall. The wall did not notice.' },
    'Prop lumber': { cat: 'material', tags: ['wood', 'flammable', 'long'], level: 2, desc: 'Pine offcuts from set construction. Straight, light, splits clean. Two of these make arrows.' },
    'River stone': { cat: 'material', tags: ['stone', 'heavy', 'hard'], level: 2, desc: 'Flat and sharp-edged, from the Jungle Set river. The river is a pump and a tarp. The stone is real.' },
    'Scrap metal': { cat: 'material', tags: ['metal', 'sharp', 'conductive', 'heavy'], level: 1, desc: 'Bent brackets, sheet offcuts and one very confused bolt.' },
    'Wooden arrows': { cat: 'misc', icon: 'arrows', ammo: { kind: 'arrow', s: 4 }, tags: ['wood', 'flammable'], level: 2, desc: 'Sharpened and fire-hardened. 1d4 from a bow. Jury-rig: Prop lumber + Prop lumber (10).' },
    'Stone-tipped arrows': { cat: 'misc', icon: 'arrows', ammo: { kind: 'arrow', s: 6 }, tags: ['wood', 'stone'], level: 2, desc: 'Knapped stone heads, lashed on. 1d6 from a bow. Jury-rig: Prop lumber + River stone (10).' },
    'Scrap-metal arrows': { cat: 'misc', icon: 'arrows', ammo: { kind: 'arrow', s: 6, acc: 1 }, tags: ['wood', 'metal'], level: 2, desc: 'Cut-tin broadheads. 1d6 and +1 to hit. Jury-rig: Prop lumber + Scrap metal (10).' },
    'Horn-tipped arrows': { cat: 'misc', icon: 'arrows', ammo: { kind: 'arrow', s: 8 }, tags: ['wood', 'sharp'], rarity: 'Uncommon', level: 2, desc: 'Imp horn heads. Mean little things. 1d8. Jury-rig: Prop lumber + Imp horn (6).' },
    'Pitch arrows': { cat: 'misc', icon: 'arrows', ammo: { kind: 'arrow', s: 4, onHit: { type: 'burn', dice: '1d4', turns: 2 } }, tags: ['wood', 'flammable', 'fire'], level: 2, desc: 'Wrapped in something that burns. 1d4 and sets them on fire (1d4 for 2 turns). Jury-rig: Prop lumber + Bog slime or Puglin grease (6).' },
    // ---- tools ----
    'Roll of duct tape': { cat: 'tool', tags: ['sticky', 'binding'], level: 1, desc: 'The universal fix. The System has rules about it, but no one has read them.' },
    'Flashlight': { cat: 'tool', light: true, level: 1, desc: 'Works. For now.' },
    'Lighter': { cat: 'tool', tags: ['fire'], level: 1, desc: 'Three clicks to light. Always three.' },
    'Ball of twine': { cat: 'tool', tags: ['stringy', 'flammable'], level: 1, desc: 'Long enough to find your way back. Maybe.' },
    'Floral foam brick': { cat: 'tool', tags: ['absorbent'], level: 1, desc: 'Green, crumbly, and weirdly satisfying to squeeze. Soaks up liquids.' },
    'Headlamp': { cat: 'tool', light: true, head: true, battery: true, level: 1, desc: 'Wear it on your head and switch it on: torch-level sight with both hands free. Eats batteries.' },
    'AA batteries': { cat: 'tool', tags: ['conductive', 'battery'], level: 1, common: true, desc: 'Two AAs in a blister pack. Full charge for a headlamp, or a very small shock for a very small enemy.' },
    'Roll of aluminum foil': { cat: 'tool', tags: ['conductive'], level: 1, desc: 'Ari will want this for unrelated reasons.' },
    'Bungee cords': { cat: 'tool', tags: ['elastic'], level: 1, desc: 'Will absolutely snap back at your face once.' },
    'Zip ties (10)': { cat: 'tool', tags: ['binding'], level: 1, desc: 'The answer to most problems, and the cause of several.' },
    'WD-40': { cat: 'tool', checks: { Lockpicking: 2, Stealth: 1 }, tags: ['flammable', 'slippery'], level: 1, desc: 'If it should move and does not: this. +2 to locks.' },
    'Lint roller': { cat: 'tool', checks: { Investigation: 2 }, level: 1, desc: 'Forensics on a budget. +2 to Investigation.' },
    'Sticky notes': { cat: 'tool', tags: ['paper', 'flammable'], level: 1, desc: 'Yellow. The good kind.' },
    'Selfie stick': { cat: 'tool', tags: ['long'], level: 1, desc: 'The ultimate tool of self-regard.' },
    'Shop vac': { cat: 'tool', tags: ['heavy', 'loud'], level: 1, desc: 'Loud enough to wake the next floor.' },
    'Yoga mat': { cat: 'tool', checks: { Stealth: 1 }, level: 1, desc: 'Smells faintly of lavender and feet.' },
    'Tide pen': { cat: 'tool', level: 1, desc: 'For stains. Of any kind.' },
    // ---- valuables ----
    'Security badge': { cat: 'valuable', level: 1, desc: 'FLOOR 1 · STAIRWELL · NIGHT SHIFT. The photo is unflattering.' },
    'Bronze loot box coupon': { cat: 'valuable', level: 1, desc: 'Redeemable at any sponsor booth. There are no sponsor booths.' },
    'Laminated visitor badge': { cat: 'valuable', checks: { Deception: 2 }, level: 1, desc: 'VISITOR. ESCORT REQUIRED. The System sometimes believes it.' },
    '"World\'s Best Boss" mug': { cat: 'valuable', tags: ['glass'], level: 1, desc: 'Self-purchased.' },
    'Wallet ($14 and a punch card)': { cat: 'valuable', level: 1, desc: 'One more punch for a free sandwich, in another universe.' },
    'Silver loot box': { cat: 'valuable', box: 'silver', rarity: 'Uncommon', level: 1, desc: 'The System promises this one is better. Opens in a safe room.' },
    // ---- oddities ----
    'Shiny button': { cat: 'misc', level: 1, desc: 'The puglin was very proud of this.' },
    'Union card': { cat: 'misc', level: 1, desc: 'Local 666. Dues paid through next season.' },
    'Rusty key': { cat: 'misc', level: 1, desc: 'Opens something, somewhere, probably.' },
    // ---- crafting materials (Harvest, searches) ----
    'Bog slime': { cat: 'material', tags: ['flammable', 'sticky', 'wet'], level: 1, desc: 'Green, warm and it burns like a grudge. Keep it away from your lighter. Or don\'t.' },
    'Rat tail': { cat: 'material', tags: ['stringy'], level: 1, desc: 'Long, pink, still twitching a little. Tough as cord.' },
    'Puglin grease': { cat: 'material', tags: ['flammable', 'slippery'], level: 1, desc: 'Scraped off a puglin. It is mostly puglin.' },
    'Shrub sap': { cat: 'material', tags: ['sticky'], level: 1, desc: 'Amber and tacky. The shrubs use it to hold dinner still.' },
    'Imp horn': { cat: 'material', tags: ['sharp', 'hard'], level: 1, desc: 'A small curved horn. Union-issue.' },
    'Clerk ink': { cat: 'material', tags: ['toxic', 'staining'], level: 1, desc: 'Black, permanent and faintly ticking.' },
    'Archive pages': { cat: 'material', tags: ['flammable', 'paper'], level: 1, desc: 'Forms in triplicate. Two copies too many.' },
    'Empty bottle': { cat: 'material', tags: ['glass', 'container'], level: 1, common: true, desc: 'Holds liquids. Also breaks over heads.' },
    // ---- elite and boss drops (enchanted) ----
    'Knobbly War Club +1': { cat: 'weapon', dmg: '1d6', bonus: 1, rarity: 'Uncommon', level: 1, desc: 'The war-chief carved notches in it. You do not want to count them.' },
    'Clipboard of Authority +1': { cat: 'weapon', dmg: '1d4', bonus: 1, checks: { Intimidation: 2 }, rarity: 'Uncommon', level: 1, desc: 'Sharpened along one edge. People step aside for a clipboard.' },
    'Warden\'s Reed Spear +1': { cat: 'weapon', dmg: '1d6', bonus: 1, tags: ['long'], rarity: 'Uncommon', level: 1, desc: 'Swamp-cured, light, and smells of the Gardens.' },
    'Head Clerk\'s Letter Opener +1': { cat: 'weapon', dmg: '1d4', bonus: 1, crit: 19, tags: ['sharp'], rarity: 'Uncommon', level: 1, desc: 'For opening letters, and other things. Crits on 19-20.' },
    'Gristle King\'s Cleaver +1': { cat: 'weapon', dmg: '1d8', bonus: 1, crit: 19, tags: ['sharp', 'heavy'], rarity: 'Rare', level: 1, desc: 'Grik\'s pride. Still greasy. Crits on 19-20.' },
    'Shop Steward\'s Gavel +1': { cat: 'weapon', dmg: '1d6', bonus: 1, onHit: { type: 'stun', turns: 1, chance: 0.15 }, rarity: 'Rare', level: 1, desc: 'Order! Order! Sometimes stuns on a hit.' },
    'Archivist\'s Lantern': { cat: 'tool', light: true, checks: { Investigation: 3, Perception: 2 }, rarity: 'Rare', level: 1, desc: 'It shows what was filed away. A light, +3 Investigation, +2 Perception.' },
    'The Gardener\'s Shears +1': { cat: 'weapon', dmg: '1d6', bonus: 1, crit: 19, tags: ['sharp'], rarity: 'Rare', level: 1, desc: 'They hum near anything green. Crits on 19-20.' },
    'Headliner\'s Mic Stand +1': { cat: 'weapon', dmg: '1d8', bonus: 1, checks: { Performance: 3 }, tags: ['long', 'heavy'], rarity: 'Rare', level: 1, desc: 'The crowd still chants when you lift it. +3 Performance.' },
    'Gatekeeper\'s Keyring': { cat: 'tool', checks: { Lockpicking: 5 }, rarity: 'Rare', level: 1, desc: 'Forty keys, one of them to everything on this floor. +5 to locks.' },
    // ---- brought from home: canonical starting gear (character creation looks these up by name) ----
    'Pruning shears': { cat: 'weapon', dmg: '1d4', level: 1, desc: 'Made for stems. Willing to try other things.' },
    'Florist\'s knife': { cat: 'weapon', dmg: '1d4', level: 1, desc: 'Small, sharp, and used to being underestimated.' },
    'Claw hammer': { cat: 'weapon', dmg: '1d6', level: 1, desc: 'The original multitool.' },
    'Roll of floral tape': { cat: 'tool', tags: ['sticky'], level: 1, desc: 'Holds anything together for about a day.' },
    'Bottle opener': { cat: 'tool', level: 1, desc: 'Opens bottles. Also, sometimes, conversations.' },
    'Tape measure': { cat: 'tool', level: 1, desc: 'Twenty-five feet of certainty.' },
    'Trauma shears': { cat: 'tool', level: 1, desc: 'Cuts clothes, seatbelts, and sometimes tension.' },
    'Gauze roll': { cat: 'consumable', heal: '1d4', level: 1, common: true, desc: 'Restores a little dignity and 1d4 HP.' },
    'Phone (no signal)': { cat: 'valuable', level: 1, desc: 'Flashlight works. Nothing else does.' },
    'Laptop (12% battery)': { cat: 'valuable', level: 1, desc: 'No Wi-Fi in the dungeon. Heavy enough to throw.' },
    'Keys on a ring': { cat: 'misc', level: 1, desc: 'Jingles at the worst possible moment.' },
    'Guitar picks (3)': { cat: 'misc', level: 1, desc: 'Light, sharp-edged, easy to lose.' },
    'Bar rag': { cat: 'misc', level: 1, desc: 'Damp. Always damp.' },
    // ---- clothing (style must be a wardrobe style; color is a palette index 0-9) ----
    'Hard hat': { cat: 'clothing', slot: 'kHead', style: 'Hard hat', color: 0, level: 1, desc: 'OSHA approved, in another galaxy.' },
    'Cowboy hat': { cat: 'clothing', slot: 'kHead', style: 'Cowboy hat', color: 0, level: 1, desc: 'Yeehaw is now a valid battle cry.' },
    'Plain white tee': { cat: 'clothing', slot: 'kTop', style: 'T-shirt', color: 0, level: 1, desc: 'Clean. Suspiciously clean.' },
    'Grey hoodie': { cat: 'clothing', slot: 'kTop', style: 'Hoodie', color: 2, level: 1, desc: 'Somebody\'s. Not anymore.' },
    'Black jeans': { cat: 'clothing', slot: 'kPants', style: 'Jeans', color: 1, level: 1, desc: 'Slim fit. You will make it work.' },
    'Work boots': { cat: 'clothing', slot: 'kBoots', style: 'Work boots', color: 7, level: 1, desc: 'Steel toe. Good for kicking.' }
  };

  // ---------- where items come from ----------
  // monsters: keyed by monster kind, falling back to its family (puglin, imp, bog, clerk, shrub...)
  //   gold: dice · always: dropped every time · chance: [name, probability] · oneOf: one guaranteed pick from the list
  // containers: loot boxes ('chest', 'silver') and searches ('small', or 'small_<room theme>' when the room has one):
  //   gold dice, how many picks, and the pool to pick from (an item listed twice is twice as likely)
  // sources: one-off places the engine hands out items
  var DROPS = {
    monsters: {
      puglin: { gold: '1d6', always: ['Puglin stick'], chance: [['Half-eaten snack', 0.5], ['Shiny button', 0.3], ['Puglin grease', 0.35]] },
      imp: { gold: '2d6+2', always: ['Imp mace', 'Security badge', 'Union card'], chance: [['Imp horn', 0.4], ['Scrap metal', 0.3], ['Smoke bomb', 0.1]] },
      rat: { gold: '0', chance: [['Rat tail', 0.6]] },
      bog: { gold: '1d4', chance: [['Bog slime', 0.7], ['Band-aids', 0.15]] },
      clerk: { gold: '1d6', chance: [['Clerk ink', 0.5], ['Archive pages', 0.5], ['Stapler', 0.2], ['Sticky notes', 0.2]] },
      shrub1: { gold: '0', chance: [['Shrub sap', 0.6]] },
      shrub2: { gold: '0', chance: [['Shrub sap', 0.7]] },
      shrub3: { gold: '1d4', chance: [['Shrub sap', 0.8]] },
      shrub4: { gold: '1d6', always: ['Shrub sap'] },
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
      // Floor 2 casts
      extra: { gold: '1d6', chance: [['Rusty arming sword', 0.35], ['Rusty spear', 0.15], ['Wooden arrows', 0.25], ['Craft services sandwich', 0.3]] },
      stuntdouble: { gold: '2d6', chance: [['Rusty longsword', 0.4], ['Rusty broadsword', 0.25], ['Steel arming sword', 0.12], ['Healing potion', 0.3]] },
      stuntknight: { gold: '3d6', always: ['Healing potion'], chance: [['Stunt Coordinator\'s Greatsword +1', 0.1]], oneOf: ['Steel longsword', 'Steel broadsword', 'Steel battleaxe', 'Rusty longsword', 'Rusty battleaxe', 'Rusty flanged mace'] },
      crew: { gold: '1d6', chance: [['Prop lumber', 0.6], ['Scrap metal', 0.35], ['Roll of duct tape', 0.4], ['AA batteries', 0.3], ['Rusty hatchet', 0.1]] },
      crew_lead: { gold: '2d6', always: ['Roll of duct tape', 'Prop lumber'], chance: [['Healing potion', 0.4], ['Bandit\'s shortbow', 0.2], ['Scrap-metal arrows', 0.3]] },
      truffle: { gold: '1d4', chance: [['River stone', 0.45], ['Shrub sap', 0.4], ['Band-aids', 0.15]] },
      truffle_big: { gold: '2d4', chance: [['Shrub sap', 0.6], ['Healing potion', 0.25]] },
      truffle_king: { gold: '3d6', always: ['Healing potion'], chance: [['Rusty hatchet', 0.3], ['Emberbrand Battleaxe +1', 0.1]] },
      automaton: { gold: '1d6', chance: [['Scrap metal', 0.6], ['AA batteries', 0.5], ['WD-40', 0.2]] },
      automaton_big: { gold: '2d6', always: ['AA batteries'], chance: [['Healing potion', 0.3], ['Rusty flanged mace', 0.2], ['Frostbite Arming Sword +1', 0.1]] },
      groundskeeper: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['Nightshade Spear +1', 'Emberbrand Battleaxe +1'] },
      butler: { gold: '6d6', always: ['Silver loot box', 'Healing potion'], oneOf: ['Stormcaller Longsword +1', 'Frostbite Arming Sword +1'] },
      showrunner: { gold: '8d6', always: ['Silver loot box', 'Greater healing potion'], oneOf: ['Golden Prop Mace +1', 'Stormcaller Longsword +1'] },
      gatekeeper: { gold: '8d6', always: ['Silver loot box', 'Greater healing potion'], oneOf: ['Gatekeeper\'s Keyring'] }
    },
    containers: {
      chest: { gold: '3d6', picks: [2, 3], from: 'a loot box', pool: ['AA batteries', 'Healing potion', 'Crowbar', 'Roll of duct tape', 'Flashlight', 'Energy bar', 'Bronze loot box coupon', 'Hard hat', 'Plain white tee', 'Grey hoodie', 'Black jeans', 'Cowboy hat', 'Work boots', 'Healing potion', 'Chef\'s knife', 'Golf club (7 iron)', 'Cast iron skillet', 'Headlamp', 'Fire extinguisher', 'Bluetooth speaker', 'Smoke bomb', 'Goblin hob-lobber', 'Tennis racket', 'WD-40', 'Bungee cords', 'Protein bar', 'Hot sauce', 'Silver loot box', 'EpiPen'] },
      small: { gold: '1d4', picks: [1, 1], from: 'a search', pool: ['Splintered wood', 'Splintered wood', 'Chunk of rubble', 'Prop lumber', 'Scrap metal', 'Energy bar', 'Bottle of water', 'Rusty key', 'Lighter', 'Ball of twine', 'Band-aids', 'Roll of toilet paper', 'Breath mints', 'Box cutter', 'Bungee cords', 'Zip ties (10)', 'Empty bottle', 'Wallet ($14 and a punch card)', 'Ibuprofen'] },
      silver: { gold: '4d6', picks: [2, 4], from: 'a silver loot box', pool: ['Greater healing potion', 'Healing potion', 'Goblin hob-lobber', 'Smoke bomb', 'Jumper cables', 'Pallet jack', 'Headlamp', 'EpiPen', 'Golf club (7 iron)', 'Chef\'s knife', 'Cast iron skillet', 'Meat tenderizer'] },
      small_office: { gold: '1d6', picks: [1, 2], from: 'a desk', pool: ['Splintered wood', 'Scrap metal', 'AA batteries', 'Stapler', 'Letter opener', 'Sticky notes', 'Archive pages', 'Ergonomic keyboard', 'Laminated visitor badge', '"World\'s Best Boss" mug', 'Breath mints', 'Lint roller', 'Ibuprofen', 'Box cutter'] },
      small_store: { gold: '1d4', picks: [1, 2], from: 'the shelves', pool: ['Splintered wood', 'Scrap metal', 'AA batteries', 'Broom', 'Mop', 'Bleach', 'Plunger', 'Roll of toilet paper', 'Bungee cords', 'Zip ties (10)', 'WD-40', 'Cordless drill', 'Shop vac', 'Box cutter', 'Fire extinguisher', 'Roll of aluminum foil'] },
      small_garden: { gold: '1d4', picks: [1, 2], from: 'the potting shed', pool: ['Rake', 'Hedge trimmers', 'Weed killer', 'Bug spray', 'Cordless leaf blower', 'Shrub sap', 'Bog slime', 'Floral foam brick', 'Bottle of water'] },
      small_bazaar: { gold: '2d4', picks: [1, 2], from: 'a stall', pool: ['Hot sauce', 'Can of cooking spray', 'Chef\'s knife', 'Rolling pin', 'Meat tenderizer', 'Cast iron skillet', 'Protein bar', 'Energy bar', 'Roll of aluminum foil', 'Bottle of water'] },
      small_arena: { gold: '2d4', picks: [1, 2], from: 'the locker', pool: ['Splintered wood', 'Scrap metal', 'Tennis racket', 'Golf club (7 iron)', 'Yoga mat', 'Protein bar', 'Bluetooth speaker', 'Selfie stick', 'Band-aids', 'Ibuprofen'] }
    },
    sources: {
      starting: [['Healing potion', 3]],
      catering: 'Craft services sandwich',
      respawn: 'Healing potion'
    }
  };
  DROPS.containers.small_moss = DROPS.containers.small_garden;
  DROPS.containers.small_studio = DROPS.containers.small_arena;

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
