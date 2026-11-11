
  // ===================== Level One generator =====================
  // One fixed seed, so every player gets the same floor. Layout: a central Safe Room inside a ring corridor;
  // four monster neighborhoods in the corners, each a cluster of rooms joined by tunnels with a boss room at
  // the far end; a feast hall to the north, the stairwell to the south, extra safe rooms on the ring, and a few
  // hidden rooms behind walls that only a good Perception check finds.
  // Map characters: # wall · . floor · , moss floor · ~ water · D door · H hidden door · S stairs · @ start
  //   P pillar · B brazier · C loot box · K crate · R barrel · T table · W weapon rack · U training dummy
  //   b sack · h shelf · c candle stand · q cauldron · k book stand · g cage · v vase
  function genLevel(seed) {
    var Wd = 90, Hd = 90, s = seed >>> 0;
    function rnd() { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    var g = [], reg = [], rooms = [], spawns = [], i, x, z;
    for (z = 0; z < Hd; z++) { g.push([]); reg.push([]); for (x = 0; x < Wd; x++) { g[z].push('#'); reg[z].push(-1); } }
    function inb(x, z) { return x > 0 && z > 0 && x < Wd - 1 && z < Hd - 1; }
    function room(o) { o.id = rooms.length; rooms.push(o); return o; }
    function carveRect(r, floor) {
      for (var zz = r.z0; zz <= r.z1; zz++) for (var xx = r.x0; xx <= r.x1; xx++) if (inb(xx, zz)) { g[zz][xx] = floor || '.'; reg[zz][xx] = r.id; }
    }
    function free(x0, z0, x1, z1) { for (var zz = z0 - 1; zz <= z1 + 1; zz++) for (var xx = x0 - 1; xx <= x1 + 1; xx++) { if (!inb(xx, zz) || g[zz][xx] !== '#') return false; } return true; }
    function carveTile(x, z, rid, floor) { if (!inb(x, z)) return; if (g[z][x] === '#') { g[z][x] = floor || '.'; reg[z][x] = rid; } }
    // an L-shaped tunnel; where it breaks into a room through its wall it leaves a doorway
    function tunnel(ax, az, bx, bz, rid, wide, floor) {
      var horizFirst = rnd() < 0.5, pts = horizFirst ? [[ax, az], [bx, az], [bx, bz]] : [[ax, az], [ax, bz], [bx, bz]];
      for (var k = 0; k < 2; k++) {
        var p = pts[k], q = pts[k + 1], dx = Math.sign(q[0] - p[0]), dz = Math.sign(q[1] - p[1]), x = p[0], z = p[1];
        while (true) {
          carveTile(x, z, rid, floor); if (wide) { carveTile(x + (dz ? 1 : 0), z + (dx ? 1 : 0), rid, floor); }
          if (x === q[0] && z === q[1]) break; x += dx; z += dz;
        }
      }
    }
    function center(r) { return [Math.floor((r.x0 + r.x1) / 2), Math.floor((r.z0 + r.z1) / 2)]; }
    function scatter(r, chars, n) { // decor on free floor inside a room, away from its edges
      for (var k = 0; k < n; k++) for (var t = 0; t < 12; t++) {
        var x = ri(r.x0 + 1, r.x1 - 1), z = ri(r.z0 + 1, r.z1 - 1);
        if (g[z][x] === '.' || g[z][x] === ',') { g[z][x] = chars[Math.floor(rnd() * chars.length)]; break; }
      }
    }
    // ----- hub: the Safe Room and the ring corridor -----
    var C = 45, hub = room({ name: 'Safe Room', theme: 'crypt', type: 'safe', x0: C - 4, z0: C - 4, x1: C + 4, z1: C + 4, line: 'Your holding cell. No violence of any kind; the System takes this very seriously, and so does its teleporter.' });
    carveRect(hub);
    var ring = room({ name: 'The Ring', theme: 'hall', type: 'corridor', x0: C - 15, z0: C - 15, x1: C + 15, z1: C + 15, line: 'A long loop of corridor. Quiet. Mostly.' });
    for (x = ring.x0; x <= ring.x1; x++) for (var w = 0; w < 2; w++) { carveTile(x, ring.z0 + w, ring.id); carveTile(x, ring.z1 - w, ring.id); }
    for (z = ring.z0; z <= ring.z1; z++) for (w = 0; w < 2; w++) { carveTile(ring.x0 + w, z, ring.id); carveTile(ring.x1 - w, z, ring.id); }
    // hub doors out to the ring on all four sides
    [[C, C - 5, 0, -1], [C, C + 5, 0, 1], [C - 5, C, -1, 0], [C + 5, C, 1, 0]].forEach(function (d) {
      g[d[1]][d[0]] = 'D'; reg[d[1]][d[0]] = hub.id;
      tunnel(d[0] + d[2], d[1] + d[3], d[2] ? (d[2] < 0 ? ring.x0 + 1 : ring.x1 - 1) : d[0], d[3] ? (d[3] < 0 ? ring.z0 + 1 : ring.z1 - 1) : d[1], ring.id);
    });
    g[C - 3][C - 1] = 'X'; g[C][C - 2] = '@'; g[C - 3][C - 3] = 'c'; g[C - 3][C + 3] = 'c'; g[C + 3][C - 3] = 'v'; g[C + 3][C + 3] = 'g'; g[C - 2][C + 2] = 'B';
    spawns.push({ kind: 'imp', npc: 'pip', x: C + 1, z: C + 1 });
    // ----- the ring's own rooms: two more safe rooms, the feast hall north, the stairwell south -----
    function sideRoom(o, door) {
      var r = room(o); carveRect(r); var d = door; g[d[1]][d[0]] = 'D'; reg[d[1]][d[0]] = r.id;
      var ox = Math.sign(d[0] - C) * (Math.abs(d[0] - C) > 2 ? 1 : 0), oz = Math.sign(d[1] - C) * (Math.abs(d[1] - C) > 2 ? 1 : 0); carveTile(d[0] - ox, d[1] - oz, ring.id); return r;
    }
    var safeW = sideRoom({ name: 'Safe Room (West Ring)', theme: 'crypt', type: 'safe', x0: C - 24, z0: C - 3, x1: C - 18, z1: C + 3, line: 'Another safe room. The vending machine is out of everything.' }, [C - 17, C]);
    g[C][C - 21] = 'B'; g[C - 2][C - 23] = 'c'; g[C + 2][C - 23] = 'X';
    var safeE = sideRoom({ name: 'Safe Room (East Ring)', theme: 'crypt', type: 'safe', x0: C + 18, z0: C - 3, x1: C + 24, z1: C + 3, line: 'A safe room with a broken toilet and a working fire.' }, [C + 17, C]);
    g[C][C + 21] = 'B'; g[C + 2][C + 23] = 'c'; g[C - 2][C + 23] = 'X';
    var feast = sideRoom({ name: 'The Feast Hall', theme: 'hall', type: 'hall', x0: C - 9, z0: C - 27, x1: C + 9, z1: C - 18, line: 'A banquet laid out for a crowd that never came. Pillars block your line of sight.' }, [C, C - 17]);
    for (x = feast.x0 + 2; x <= feast.x1 - 2; x += 4) { g[feast.z0 + 2][x] = 'P'; g[feast.z1 - 2][x] = 'P'; }
    g[C - 23][C - 1] = 'T'; g[C - 23][C + 3] = 'T'; g[C - 22][C - 6] = 'W'; g[C - 20][C + 6] = 'U'; g[C - 25][C] = 'B'; scatter(feast, 'RKR', 3);
    var stair = sideRoom({ name: 'Stairwell Approach', theme: 'gate', type: 'stairs', x0: C - 6, z0: C + 18, x1: C + 6, z1: C + 25, line: 'The stairs down are here. So is whatever is guarding them.' }, [C, C + 17]);
    g[C + 24][C] = 'S'; g[C + 22][C - 4] = 'q'; g[C + 20][C + 5] = 'k'; g[C + 24][C + 5] = 'c'; g[C + 19][C - 5] = 'B'; g[C + 19][C + 5] = 'B';
    spawns.push({ kind: 'imp', tier: 2, x: C + 1, z: C + 22, guard: true, name: 'Imp, stairwell guard' });
    // ----- four neighborhoods -----
    var HOODS = [
      { name: 'The Puglin Warrens', theme: 'moss', fam: 'puglin', x0: 2, z0: 2, x1: 28, z1: 28, gate: [C - 15, C - 8], tunnels: 'Warren tunnels', boss: 'Grik\'s Throne Room',
        line: 'Puglin territory. Something has been watering the moss, and something has been eating the gardeners.', decor: 'bbKRv', roomNames: ['Gnawing Pit', 'Moss Den', 'Bone Garden', 'Snack Larder', 'Mud Nursery', 'Sentry Nook', 'Rag Pile', 'Root Cellar'] },
      { name: 'Imp Union Hall', theme: 'gate', fam: 'imp', x0: 62, z0: 2, x1: 87, z1: 28, gate: [C + 15, C - 8], tunnels: 'Service corridors', boss: 'The Steward\'s Office',
        line: 'Imp territory. Every door has a sign-in sheet. Every sign-in sheet is blank.', decor: 'KRhTB', roomNames: ['Break Room', 'Locker Room', 'Grievance Office', 'Time Clock', 'Supply Closet', 'Night Shift Lounge', 'Union Archive', 'Overtime Pit'] },
      { name: 'The Gnawed Cellars', theme: 'store', fam: 'puglin', x0: 2, z0: 62, x1: 28, z1: 87, gate: [C - 15, C + 8], tunnels: 'Cellar passages', boss: 'The Butcher\'s Block',
        line: 'Storerooms the puglins took over. The crates are full of things that used to be other crates.', decor: 'KKRRbh', roomNames: ['Pantry', 'Wine Cellar', 'Crate Maze', 'Cold Store', 'Spice Room', 'Coal Bin', 'Old Larder', 'Barrel Room'] },
      { name: 'The Flooded Archive', theme: 'water', fam: 'imp', x0: 62, z0: 62, x1: 87, z1: 87, gate: [C + 15, C + 8], tunnels: 'Drowned stacks', boss: 'The Records Vault',
        line: 'Ankle-deep water over a records archive. The imps say the paperwork is load-bearing.', decor: 'hkKR', roomNames: ['Reading Pool', 'Wet Stacks', 'Card Catalog', 'Filing Sump', 'Microfiche Bog', 'Index Pond', 'Damp Annex', 'Ledger Room'] }
    ];
    var BOSSNAME = { puglin: ['grik', 'puglin_chief'], imp: ['steward', 'imp_foreman'] };
    HOODS.forEach(function (H, hi) {
      var floor = H.theme === 'moss' ? ',' : '.', tun = room({ name: H.tunnels, theme: H.theme, type: 'corridor', hood: hi, x0: H.x0, z0: H.z0, x1: H.x1, z1: H.z1, line: H.line });
      var list = [], gx = H.gate[0], gz = H.gate[1], farX = gx < C ? H.x0 : H.x1, farZ = gz < C ? H.z0 : H.z1;
      // boss room at the far corner
      var bw = ri(10, 12), bh = ri(9, 11), bx0 = farX === H.x0 ? H.x0 + 1 : H.x1 - bw - 1, bz0 = farZ === H.z0 ? H.z0 + 1 : H.z1 - bh - 1;
      var boss = room({ name: H.boss, theme: H.theme, type: 'boss', hood: hi, x0: bx0, z0: bz0, x1: bx0 + bw, z1: bz0 + bh, line: 'A big room that smells like a boss fight.' });
      carveRect(boss, floor); list.push(boss);
      for (x = boss.x0 + 2; x <= boss.x1 - 2; x += 4) { g[boss.z0 + 2][x] = 'P'; g[boss.z1 - 2][x] = 'P'; }
      g[boss.z0 + 1][boss.x0 + 1] = 'B'; g[boss.z1 - 1][boss.x1 - 1] = 'B'; g[boss.z0 + 1][boss.x1 - 1] = 'B'; g[boss.z1 - 1][boss.x0 + 1] = 'B';
      var bc = center(boss), behind = [bc[0] + (farX === H.x0 ? -3 : 3), bc[1] + (farZ === H.z0 ? -2 : 2)]; g[behind[1]][behind[0]] = 'C';
      spawns.push({ kind: H.fam, boss: true, sub: BOSSNAME[H.fam][0], x: bc[0], z: bc[1], room: boss.id });
      spawns.push({ kind: H.fam, sub: BOSSNAME[H.fam][1], x: bc[0] + 2, z: bc[1] + 1, room: boss.id }); spawns.push({ kind: H.fam, tier: 2, x: bc[0] - 2, z: bc[1] - 1, room: boss.id });
      // other rooms
      var names = H.roomNames.slice(), tries = 0;
      while (list.length < 8 && tries++ < 400) {
        var rw = ri(4, 8), rh = ri(4, 7), rx = ri(H.x0 + 1, H.x1 - rw - 1), rz = ri(H.z0 + 1, H.z1 - rh - 1);
        if (!free(rx, rz, rx + rw, rz + rh)) continue;
        var r = room({ name: names.shift() || 'Side Room', theme: H.theme, type: 'room', hood: hi, x0: rx, z0: rz, x1: rx + rw, z1: rz + rh, line: H.line });
        carveRect(r, floor); list.push(r);
      }
      // join them: a spanning tree by distance plus one extra loop
      var joined = [list[list.length - 1]], left = list.slice(0, list.length - 1);
      while (left.length) {
        var best = null, bd = 1e9;
        left.forEach(function (a) { joined.forEach(function (b) { var ca = center(a), cb = center(b), dd = Math.abs(ca[0] - cb[0]) + Math.abs(ca[1] - cb[1]); if (dd < bd) { bd = dd; best = [a, b]; } }); });
        var ca = center(best[0]), cb = center(best[1]); tunnel(ca[0], ca[1], cb[0], cb[1], tun.id, false, floor);
        joined.push(best[0]); left.splice(left.indexOf(best[0]), 1);
      }
      if (list.length > 3) { var e1 = center(list[1]), e2 = center(list[list.length - 2]); tunnel(e1[0], e1[1], e2[0], e2[1], tun.id, false, floor); }
      // the neighborhood's mouth: the room nearest the ring gate tunnels out to the ring
      var near = list.slice(1).sort(function (a, b) { var A = center(a), B = center(b); return (Math.abs(A[0] - gx) + Math.abs(A[1] - gz)) - (Math.abs(B[0] - gx) + Math.abs(B[1] - gz)); })[0] || boss;
      var cn = center(near); tunnel(cn[0], cn[1], gx, gz, tun.id, true, '.');
      // dress the rooms and fill them with the neighborhood's monster family
      list.forEach(function (r, k) {
        if (r === boss) return;
        scatter(r, H.decor, ri(1, 3)); if (rnd() < 0.35) scatter(r, 'C', 1);
        var n = ri(1, 3); if (r === near) n = 1;
        for (var m = 0; m < n; m++) { var c2 = center(r); spawns.push({ kind: H.fam, tier: rnd() < 0.18 ? 3 : rnd() < 0.45 ? 2 : 1, x: c2[0] + ri(-1, 1), z: c2[1] + ri(-1, 1), room: r.id }); }
      });
      H.rooms = list; H.tun = tun; H.bossRoom = boss;
    });
    // ----- hidden rooms: a short dead-end off a corridor behind a wall that hides a door -----
    var hidden = 0;
    for (var t = 0; t < 400 && hidden < 4; t++) {
      var hx = ri(4, Wd - 12), hz = ri(4, Hd - 12), hw = ri(3, 4), hh = ri(3, 4);
      if (!free(hx, hz, hx + hw, hz + hh)) continue;
      // find a corridor tile two steps from one side
      var sides = [[hx - 2, hz + 1, hx - 1, hz + 1], [hx + hw + 2, hz + 1, hx + hw + 1, hz + 1], [hx + 1, hz - 2, hx + 1, hz - 1], [hx + 1, hz + hh + 2, hx + 1, hz + hh + 1]], ok = null;
      sides.forEach(function (sd) { if (!ok && inb(sd[0], sd[1]) && g[sd[1]][sd[0]] !== '#' && rooms[reg[sd[1]][sd[0]]] && rooms[reg[sd[1]][sd[0]]].type === 'corridor') ok = sd; });
      if (!ok) continue;
      var hr = room({ name: ['A Forgotten Closet', 'The Secret Stash', 'A Smugglers\' Nook', 'The Producer\'s Hideout'][hidden], theme: 'store', type: 'hidden', x0: hx, z0: hz, x1: hx + hw, z1: hz + hh, line: 'A hidden room. The audience gasps on cue.' });
      carveRect(hr); g[ok[3]][ok[2]] = 'H'; reg[ok[3]][ok[2]] = hr.id; var hc = center(hr); g[hc[1]][hc[0]] = 'C'; hidden++;
    }
    // drop spawns that landed on non-floor
    spawns = spawns.filter(function (sp) { var c = g[sp.z] && g[sp.z][sp.x]; return c === '.' || c === ','; });
    // ----- water floors in the archive: pools inside rooms, with dry walkways -----
    rooms.forEach(function (r) {
      if (r.theme !== 'water' || r.type === 'corridor') return;
      for (var zz = r.z0 + 1; zz <= r.z1 - 1; zz++) for (var xx = r.x0 + 1; xx <= r.x1 - 1; xx++) if (g[zz][xx] === '.' && (xx + zz) % 3 !== 0 && rnd() < 0.7) g[zz][xx] = '~';
    });
    var map = g.map(function (row) { return row.join(''); }), start = { x: C - 2, z: C };
    return { W: Wd, H: Hd, map: map, reg: reg, rooms: rooms, spawns: spawns, start: start, hoods: HOODS, stairs: { x: C, z: C + 24 } };
  }
