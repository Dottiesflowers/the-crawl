
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
