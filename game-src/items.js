
  // ===================== items: every item in the game lives here =====================
  // OWNED BY THE ITEM CATALOG CHAT (see claude/the-crawl-overview.md in The Crawl project). Systems code must not
  // define items inline: look them up with item('Name') and roll drops with rollDrops(). Fields:
  //   cat: weapon | clothing | tool | consumable | valuable | misc   (bodies and boss trophies are made by the engine)
  //   dmg: '1d6' for weapons · heal: '2d4+2' or a number for consumables · slot/style/color for clothing
  //   desc: flavour text shown in the bag · effects: [] reserved for the item effect system (coming)
  var ITEMS = {
    // ---- consumables ----
    'Healing potion': { cat: 'consumable', heal: '2d4+2', desc: 'Red, fizzy, sponsored. Restores 2d4+2 HP.' },
    'Energy bar': { cat: 'consumable', heal: '1d4', desc: 'Chocolate peanut. Restores 1d4 HP.' },
    'Bottle of water': { cat: 'consumable', heal: '1', desc: 'Lukewarm. Restores 1 HP and some dignity.' },
    'Half-eaten snack': { cat: 'consumable', heal: '1d2', desc: 'You do not want to know what it was. Restores 1d2 HP.' },
    'Craft services sandwich': { cat: 'consumable', heal: 4, desc: 'Free, wrapped, and surprisingly good. Heals 4 HP.' },
    // ---- weapons ----
    'Puglin stick': { cat: 'weapon', dmg: '1d4', desc: 'Chewed at one end. Still works.' },
    'Imp mace': { cat: 'weapon', dmg: '1d6', desc: 'Company property. Heavy, spiky, and badly maintained.' },
    'Crowbar': { cat: 'weapon', dmg: '1d6', desc: 'Opens crates, doors and arguments.' },
    // ---- tools ----
    'Roll of duct tape': { cat: 'tool', desc: 'The universal fix. The System has rules about it, but no one has read them.' },
    'Flashlight': { cat: 'tool', desc: 'Works. For now.' },
    'Lighter': { cat: 'tool', desc: 'Three clicks to light. Always three.' },
    'Ball of twine': { cat: 'tool', desc: 'Long enough to find your way back. Maybe.' },
    // ---- valuables and oddities ----
    'Security badge': { cat: 'valuable', desc: 'FLOOR 1 · STAIRWELL · NIGHT SHIFT. The photo is unflattering.' },
    'Bronze loot box coupon': { cat: 'valuable', desc: 'Redeemable at any sponsor booth. There are no sponsor booths.' },
    'Shiny button': { cat: 'misc', desc: 'The puglin was very proud of this.' },
    'Union card': { cat: 'misc', desc: 'Local 666. Dues paid through next season.' },
    'Rusty key': { cat: 'misc', desc: 'Opens something, somewhere, probably.' },
    // ---- clothing (style must be a wardrobe style; color is a palette index 0-9) ----
    'Hard hat': { cat: 'clothing', slot: 'kHead', style: 'Hard hat', color: 0, desc: 'OSHA approved, in another galaxy.' },
    'Cowboy hat': { cat: 'clothing', slot: 'kHead', style: 'Cowboy hat', color: 0, desc: 'Yeehaw is now a valid battle cry.' },
    'Plain white tee': { cat: 'clothing', slot: 'kTop', style: 'T-shirt', color: 0, desc: 'Clean. Suspiciously clean.' },
    'Grey hoodie': { cat: 'clothing', slot: 'kTop', style: 'Hoodie', color: 2, desc: 'Somebody\'s. Not anymore.' },
    'Black jeans': { cat: 'clothing', slot: 'kPants', style: 'Jeans', color: 1, desc: 'Slim fit. You will make it work.' },
    'Work boots': { cat: 'clothing', slot: 'kBoots', style: 'Work boots', color: 7, desc: 'Steel toe. Good for kicking.' }
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
