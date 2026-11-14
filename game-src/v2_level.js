
  // ===================== Level One generator: the grand layout =====================
  // A fixed seed, so every player shares the same floor. 240 x 240 tiles: a hub ring (the Concourse, with the
  // Tutorial Guild in the middle) and eight zones around it, each one winding hall from the hub, neighbours joined
  // in loops, with hidden shortcuts (a vent, a burrow). You start in the southwest (the Processing Center); the
  // stairs are in the northeast (the Stairwell Gate). Small safe rooms with free food sit off the halls. Zones:
  // studio halls, caves, offices, flooded stacks, a dead subway station, an outdoor garden, a stadium, a gatehouse.
  // Map characters: # wall · . floor · , moss/grass floor · ~ water · D door · H hidden door · S stairs · @ start
  //   P pillar · B brazier · C loot box · K crate · R barrel · T table/desk/stall · W weapon rack · U training dummy
  //   b sack · h shelf · c candle stand · q cauldron · k book stand · g cage · v vase · X bathroom · F free food · Y tree
  function genLevel(seed, floor) {
    var Wd = 240, Hd = 240, s = seed >>> 0;
    function rnd() { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    var g = [], reg = [], rooms = [], spawns = [], zones = [], x, z, i, wstyle = {}, links = {};
    // downloaded models face different ways; these turn them so their front faces the room (props2 kit)
    var PIANO_ROT = 0, DESK_ROT = { metalDesk: 0, cubicle: 0, officeDesk: 0, desk: 0 }, CAR_ROT = 0;
    for (z = 0; z < Hd; z++) { g.push([]); reg.push([]); for (x = 0; x < Wd; x++) { g[z].push('#'); reg[z].push(-1); } }
    function inb(x, z) { return x > 0 && z > 0 && x < Wd - 1 && z < Hd - 1; }
    function isFloor(c) { return c === '.' || c === ',' || c === '~'; }
    function room(o, Z) { o.id = rooms.length; rooms.push(o); if (Z) { o.hood = Z.idx; Z.rooms.push(o); Z.rids[o.id] = 1; if (!o.theme) o.theme = Z.theme; if (!o.line) o.line = Z.line; } return o; }
    function put(x, z, c, rid) { if (!inb(x, z)) return; g[z][x] = c; if (rid !== undefined) reg[z][x] = rid; }
    function carve(x, z, rid, floor) { if (!inb(x, z)) return; if (g[z][x] === '#') g[z][x] = floor || '.'; if (rid !== undefined && reg[z][x] < 0) reg[z][x] = rid; }
    function carveRect(r, floor) { for (var zz = r.z0; zz <= r.z1; zz++) for (var xx = r.x0; xx <= r.x1; xx++) put(xx, zz, floor || '.', r.id); }
    function center(r) { return [Math.floor((r.x0 + r.x1) / 2), Math.floor((r.z0 + r.z1) / 2)]; }
    function free(x0, z0, x1, z1) { for (var zz = z0 - 1; zz <= z1 + 1; zz++) for (var xx = x0 - 1; xx <= x1 + 1; xx++) { if (!inb(xx, zz) || g[zz][xx] !== '#' || wstyle[xx + ',' + zz]) return false; } return true; }
    // decor on open floor inside a room, kept off its edges and away from doors
    function scatter(r, chars, n) {
      for (var k = 0; k < n; k++) for (var t = 0; t < 20; t++) {
        var xx = ri(r.x0 + 1, r.x1 - 1), zz = ri(r.z0 + 1, r.z1 - 1);
        if (!inb(xx, zz) || reg[zz][xx] !== r.id || !isFloor(g[zz][xx]) || g[zz][xx] === '~' || nearDoor(xx, zz)) continue;
        g[zz][xx] = chars.charAt(Math.floor(rnd() * chars.length)); break;
      }
    }
    function nearDoor(xx, zz) { for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { var c = g[zz + dz] && g[zz + dz][xx + dx]; if (c === 'D' || c === 'H') return true; } return false; }
    function openSpot(r, tries) { // a free floor tile near the middle of a room
      var c = center(r);
      for (var rad = 0; rad < 8; rad++) for (var t = 0; t < (tries || 12); t++) {
        var xx = c[0] + ri(-rad, rad), zz = c[1] + ri(-rad, rad);
        if (inb(xx, zz) && reg[zz][xx] === r.id && (g[zz][xx] === '.' || g[zz][xx] === ',') && !taken[xx + ',' + zz]) { taken[xx + ',' + zz] = 1; return [xx, zz]; }
      }
      return null;
    }
    var taken = {};
    function spawnIn(r, fam, o) { var p = openSpot(r); if (!p) return; var sp = { kind: fam, x: p[0], z: p[1], room: r.id }; for (var k in o) sp[k] = o[k]; spawns.push(sp); }
    function tierRoll(z) { var q = rnd(); return q < (z.elite || 0.08) ? 3 : q < 0.38 ? 2 : 1; } // mostly grunts: a level 1 crawler should beat one alone
    // a straight or L-shaped passage of a given width
    function passage(ax, az, bx, bz, rid, floor, w) {
      var pts = rnd() < 0.5 ? [[ax, az], [bx, az], [bx, bz]] : [[ax, az], [ax, bz], [bx, bz]], h = Math.floor((w - 1) / 2);
      for (var k = 0; k < 2; k++) {
        var p = pts[k], q = pts[k + 1], dx = Math.sign(q[0] - p[0]), dz = Math.sign(q[1] - p[1]), xx = p[0], zz = p[1];
        while (true) {
          for (var a = -h; a < w - h; a++) for (var b = -h; b < w - h; b++) carve(xx + a, zz + b, rid, floor);
          if (xx === q[0] && zz === q[1]) break; xx += dx; zz += dz;
        }
      }
    }
    // a wandering cave tunnel
    function drunk(ax, az, bx, bz, rid, floor) {
      var xx = ax, zz = az, n = 0;
      while ((xx !== bx || zz !== bz) && n++ < 2000) {
        for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) carve(xx + a, zz + b, rid, floor);
        if (rnd() < 0.72) { if (Math.abs(bx - xx) > Math.abs(bz - zz)) xx += Math.sign(bx - xx); else zz += Math.sign(bz - zz); }
        else if (rnd() < 0.5) xx += rnd() < 0.5 ? 1 : -1; else zz += rnd() < 0.5 ? 1 : -1;
        xx = Math.max(2, Math.min(Wd - 3, xx)); zz = Math.max(2, Math.min(Hd - 3, zz));
      }
    }
    function blob(cx, cz, rx, rz, fn) { for (var zz = cz - rz - 1; zz <= cz + rz + 1; zz++) for (var xx = cx - rx - 1; xx <= cx + rx + 1; xx++) { var d = ((xx - cx) * (xx - cx)) / (rx * rx + 0.01) + ((zz - cz) * (zz - cz)) / (rz * rz + 0.01); if (d <= 1 + (rnd() - 0.5) * 0.35) fn(xx, zz); } }

    if (floor === 2) return backlot(); // Floor 2 has its own layout (v2_level.js, bottom)
    decor = {}; dname = {}; D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]]; TOP = 0.36;
    var k, xx, zz, t;
    // ---------- the layout: a hub ring (the Concourse) with eight zones around it, joined by winding halls ----------
    // (Nov 2026 redesign: no boulevards. Every zone has two or three ways in, neighbours loop to each other, and a few shortcuts are hidden.)
    function zone(o, cell) {
      o.idx = zones.length; o.rooms = []; o.rids = {}; o.cell = cell;
      o.x0 = cell[0] + 1; o.z0 = cell[1] + 1; o.x1 = cell[2] - 1; o.z1 = cell[3] - 1; zones.push(o); return o;
    }
    var HALLS = [], HLINE = ['A service tunnel. The lights flicker on a schedule nobody has explained.', 'A winding hall with sponsor posters peeling off the walls.', 'A maintenance passage. Somebody has drawn arrows on the floor in marker. Some of them point at each other.', 'A long, bending corridor. Footprints in the dust go both ways.'];
    // a winding hall: from a to b through a couple of jittered waypoints, three tiles wide
    function hall(name, a, b, o) {
      o = o || {}; var w = o.w || 3, r = room({ name: name, theme: o.theme || 'tunnel', type: 'corridor', x0: Math.min(a[0], b[0]), z0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), z1: Math.max(a[1], b[1]), line: o.line || HLINE[HALLS.length % HLINE.length] });
      var pts = [a], n = o.pts ? 0 : o.bends === undefined ? 2 : o.bends, dx = b[0] - a[0], dz = b[1] - a[1], len = Math.max(1, Math.hypot(dx, dz)), px = -dz / len, pz = dx / len;
      for (var k = 1; k <= n; k++) { var t = k / (n + 1), j = (k % 2 ? 1 : -1) * ri(3, Math.min(9, Math.max(3, Math.floor(len / 6)))); pts.push([Math.round(a[0] + dx * t + px * j), Math.round(a[1] + dz * t + pz * j)]); }
      if (o.pts) pts = pts.concat(o.pts); pts.push(b);
      for (k = 0; k < pts.length - 1; k++) passage(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], r.id, '.', w);
      pts.forEach(function (p) { r.x0 = Math.min(r.x0, p[0] - 2); r.z0 = Math.min(r.z0, p[1] - 2); r.x1 = Math.max(r.x1, p[0] + 2); r.z1 = Math.max(r.z1, p[1] + 2); });
      HALLS.push(r); return r;
    }
    // outer doors of a stamped template, one point just outside each side that has them; unused sides are bricked up
    function exitsOf(bb, keep) {
      var out = {}, S = { N: [], S: [], E: [], W: [] }, xx, zz;
      for (xx = bb.x0; xx <= bb.x1; xx++) { if (g[bb.z0][xx] === 'D') S.N.push([xx, bb.z0]); if (g[bb.z1][xx] === 'D') S.S.push([xx, bb.z1]); }
      for (zz = bb.z0; zz <= bb.z1; zz++) { if (g[zz][bb.x0] === 'D') S.W.push([bb.x0, zz]); if (g[zz][bb.x1] === 'D') S.E.push([bb.x1, zz]); }
      Object.keys(S).forEach(function (sd) {
        var L = S[sd]; if (!L.length) return;
        if (keep.indexOf(sd) < 0) { L.forEach(function (p) { g[p[1]][p[0]] = '#'; }); return; }
        var m = L[Math.floor(L.length / 2)], d = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[sd];
        out[sd] = [m[0] + d[0], m[1] + d[1]]; L.forEach(function (p) { carve(p[0] + d[0], p[1] + d[1], undefined, '.'); });
      });
      return out;
    }
    // a tunnel from a point outside a zone to the zone's nearest floor (for zones without template doors)
    function into(Z, from, name) {
      var best = null, bd = 1e9;
      for (var zz = Z.z0; zz <= Z.z1; zz++) for (var xx = Z.x0; xx <= Z.x1; xx++) { if (!isFloor(g[zz][xx]) || !Z.rids[reg[zz][xx]]) continue; var dd = Math.abs(xx - from[0]) + Math.abs(zz - from[1]); if (dd < bd) { bd = dd; best = [xx, zz]; } }
      if (!best) return null; var r = room({ name: name, type: 'corridor', x0: Math.min(from[0], best[0]), z0: Math.min(from[1], best[1]), x1: Math.max(from[0], best[0]), z1: Math.max(from[1], best[1]) }, Z);
      passage(from[0], from[1], best[0], best[1], r.id, '.', 3); return best;
    }
    // a small safe room off a hall: free food, it heals you
    var SNACK = ['The Snack Closet', 'The Snack Bar', 'The Vending Nook', 'Hydration Station', 'The Comp Buffet', 'Catering Overflow', 'Green Room B', 'The Unofficial Break Room'], sn = 0;
    function pocketSafe(h) {
      for (var t = 0; t < 400; t++) {
        var c = center(h), x0 = c[0] + ri(-14, 14), z0 = c[1] + ri(-14, 14), w = ri(6, 7), d = ri(5, 6);
        if (!free(x0, z0, x0 + w, z0 + d)) continue;
        var sides = [[x0 + 2, z0 - 1, x0 + 2, z0 - 2], [x0 + 2, z0 + d + 1, x0 + 2, z0 + d + 2], [x0 - 1, z0 + 2, x0 - 2, z0 + 2], [x0 + w + 1, z0 + 2, x0 + w + 2, z0 + 2]], ok = null;
        sides.forEach(function (s) { if (!ok && inb(s[2], s[3]) && reg[s[3]][s[2]] === h.id && isFloor(g[s[3]][s[2]])) ok = s; });
        if (!ok) continue;
        var r = room({ name: SNACK[sn++ % SNACK.length], theme: 'crypt', type: 'safe', x0: x0, z0: z0, x1: x0 + w, z1: z0 + d, line: 'A tiny safe room. The catering table is free and it heals you. The System says "within reason."' });
        carveRect(r); put(ok[0], ok[1], 'D', r.id); put(x0 + 1, z0 + 1, 'F'); put(x0 + 2, z0 + 1, 'F'); put(x0 + w - 1, z0 + d - 1, 'c'); return r;
      }
      return null;
    }

    // ---------- the hub: the Concourse, a ring round the Tutorial Guild ----------
    var HX = 120, HZ = 120;
    var hub = room({ name: 'The Concourse', theme: 'blvd', type: 'corridor', x0: HX - 16, z0: HZ - 16, x1: HX + 16, z1: HZ + 16, line: 'The Concourse: a ring of sponsor billboards round the Tutorial Guild. Every zone is one hall away. Listen for the parade.' });
    for (zz = HZ - 16; zz <= HZ + 16; zz++) for (xx = HX - 16; xx <= HX + 16; xx++) { var dh = Math.hypot(xx - HX, zz - HZ); if (dh >= 10.5 && dh <= 15.5) put(xx, zz, '.', hub.id); }
    var guild = room({ name: 'The Tutorial Guild', theme: 'crypt', type: 'safe', x0: HX - 6, z0: HZ - 6, x1: HX + 6, z1: HZ + 6, line: 'Da Tutorial Guild. Safe, warm, and run by someone who has seen a lot of crawlers come through. Free food on the counter.' });
    for (zz = HZ - 6; zz <= HZ + 6; zz++) for (xx = HX - 6; xx <= HX + 6; xx++) if (Math.hypot(xx - HX, zz - HZ) <= 6.2) put(xx, zz, '.', guild.id);
    for (zz = HZ - 10; zz <= HZ - 7; zz++) { put(HX, zz, '.', guild.id); put(HX + 1, zz, '.', guild.id); } put(HX, HZ - 7, 'D', guild.id); put(HX + 1, HZ - 7, 'D', guild.id);
    for (zz = HZ + 7; zz <= HZ + 10; zz++) { put(HX, zz, '.', guild.id); put(HX - 1, zz, '.', guild.id); } put(HX, HZ + 7, 'D', guild.id); put(HX - 1, HZ + 7, 'D', guild.id);
    put(HX - 2, HZ - 1, 'F'); put(HX - 1, HZ - 1, 'F'); put(HX + 2, HZ + 1, 'F'); put(HX - 4, HZ + 3, 'c'); put(HX + 4, HZ - 3, 'c');
    function ring(ang) { return [Math.round(HX + Math.cos(ang) * 13), Math.round(HZ + Math.sin(ang) * 13)]; }
    var RING = { W: ring(Math.PI), NW: ring(-2.4), N: ring(-Math.PI / 2), NE: ring(-0.75), E: ring(0), SE: ring(0.75), S: ring(Math.PI / 2), SW: ring(2.4) };
    var GEN1_PC = ["##W#####W#####W#####W#####W#####W#DD##W#####W#####W#####W#####W#######", "#..............p#ffff...........#....#C.C.C.C.C.C.C..#CCCC...........#", "W...............#...............#....#...............#...............W", "#..q...q...q....#..q...q...q....#....#...............#.;;;.;;;.;;;...#", "#...............#...............#....#.q.q.q.q.q.q...#...............#", "#...............#...............#....#...............#...............#", "#...............#...............#....#...............#...............#", "#...............#..q...q...q....#....#...............#...............#", "W...............#...............D....D...............#.;;;.;;;.;;;...W", "#...............#...............#....#...............#...............#", "#...............#...............#....#...............#...............#", "#..KKKKKKK......#..q...q...q....#....#...............#...............#", "#...............#...............#....#...............#...............#", "#.n..n..........#...............#....#...............#...............#", "Wf..............#..............p#....#i.............;#..............uW", "#...............#...............#....#...............#...............#", "########D###############D########....########D###############D########", "#...............#...............#....#yyyyIIIIyyyy...#...............#", "#..............p#l..............#....#...............#.xxx........xx.#", "#...............#...............#....#...............#.x.............#", "W...............#...............#....#...............#...............W", "#..q..q..q..q...#...............#....#...............#...............#", "#...............#...............#....#..q...q...q....#......xx.......#", "#...............#...............#....#...............#...............#", "#...............#....mmmmm.....yD....D...............#...............#", "#...............#...............#....#...............#....%..........#", "W..q..q..q..q...#...............#....#...............#...............W", "#...............#...............#....#...............#..........xx...#", "#...............#...............#....#...............#...............#", "#...............#...............#....#...............#...............#", "#...............#...............#....#..............f#.%......R.....%#", "#f..............#u..............#....#...............#hhh............#", "W#######D###############D########....########D###############D#######W", "#....................................................................#", "#....................................................................D", "#....................................................................D", "#....................................................................#", "########D###############D########....###############D#################", "We.e.e.e.......C#zZOicz.........#....#p...........yyyy..............pW", "#...............#...............#....#...............................#", "#...............#...............#....#...............................#", "#...............#...............#....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "#...............#...............#....#...............................#", "#...............#...............#....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "W...............#...m...m...m...#....D...............................W", "#.......q.......#...............#....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "#...............#...............#....#...............................#", "#...............#...............#....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "#..............i#..............v#....#...............................#", "##########################D######....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "WXX.Qi.CCCCC........y#..........#....#...............................W", "#....................#e.#e.#e.#e#....#..nnnnnnnnnnnn..nnnnnnnnnnnnn..#", "#.................l..#..#..#..#.#....#...............................#", "#b...................#jj#jj#jj#j#....########D###############D########", "#.................u..#..........#....#...............#...............#", "#....................#..........#....#..............x#.xx.........xx.#", "Wb...................#..........#....#...............#.x...........x.W", "#....................#..........#....#...............#........%......#", "#......mmm...........#..........D....#..U...U...U....#...............#", "#b...................#..........#....#...............#...............#", "#....................D..........#....#...............#......xx......R#", "#....................#..........#....#...............#...............#", "Wb...................#.........x#....#...............#...............W", "#....................#..........#....#....U...U......#...%...........#", "#....................#..........#....#...............#............%..#", "#....................#..........#....#...............#...............#", "#....................#..........#....#...............#....xx....x....#", "#....................#..........#....#...............#...............#", "#...zZOcz.**........p#.........%#....#M.............M#.!.............#", "##W#####W#####W#####W#####W#####W#####W#####W#####W#####W#####W#######"];
    var GEN1_PC_AREAS = [{ name: 'Processing Halls', c0: 1, r0: 1, c1: 68, r1: 68, type: 'corridor' }, { name: 'Intake', c0: 1, r0: 1, c1: 15, r1: 15 }, { name: 'Contracts Office', c0: 17, r0: 1, c1: 31, r1: 15 }, { name: 'Waiver Signing', c0: 1, r0: 17, c1: 15, r1: 31 }, { name: 'Casting Office', c0: 17, r0: 17, c1: 31, r1: 31 }, { name: 'Makeup & Prosthetics', c0: 38, r0: 1, c1: 52, r1: 15 }, { name: 'Wardrobe Department', c0: 54, r0: 1, c1: 68, r1: 15 }, { name: 'Control Room', c0: 38, r0: 17, c1: 52, r1: 31 }, { name: 'Prop Storage', c0: 54, r0: 17, c1: 68, r1: 31 }, { name: 'Medical (Closed)', c0: 1, r0: 38, c1: 15, r1: 48 }, { name: 'Craft Services Annex', c0: 17, r0: 38, c1: 31, r1: 48 }, { name: 'The Green Room', c0: 1, r0: 50, c1: 20, r1: 68, type: 'safe' }, { name: 'Holding Pen B', c0: 22, r0: 50, c1: 31, r1: 68 }, { name: 'Orientation Theater', c0: 38, r0: 38, c1: 68, r1: 52 }, { name: 'Stage 3', c0: 38, r0: 54, c1: 52, r1: 68 }, { name: 'Loading Dock', c0: 54, r0: 54, c1: 68, r1: 68 }];
    var GEN1_UNION = ["##W#####W#####W#####W#DDD#W#####W#####W#####W#####W#####W#####W#######", "#....................#...#..................#...#....................#", "W.zZOicz.............#...#................p.#...#.xhhxhhxhhxhh.......W", "#....................#...#..................#...#....................#", "#....................#...#..................#...#....................#", "#..........mm........D...#.y..mmmmmmmmmm....D...D..................R.#", "#....................#...#..................#...#....................#", "#....................#...#..................#...#....................#", "W..................v.#...#..................#...#...%............x...W", "#....................#...#..................#...#....................#", "######################...####################...######################", "#....................#...#..................#...#....................#", "#.CCCCCCCCCCCC.......#...#................p.#...#.p........y.........#", "#....................#...#...KKKKKKKK.......#...#....................#", "W....................#...#..................#...#..................c.W", "#....................#...#..................#...#..........u.........#", "#...nnnnnnnn.........#...#..n...............#...#....................#", "#....................#...#..................#...#....................#", "#....................#...#..................#...#....................#", "#..................Q.#...#.u..............u.#...#.u................l.#", "W....................#...#..................#...#....................W", "##########D###########...#########D##########...##########D###########", "D....................................................................#", "D....................................................................#", "D....................................................................#", "##########D###########...#########D##########...##########D###########", "W....................#...#..................#...#....................W", "#...ffffffffff.......#...#..................#...#...ffffffffff.......#", "#....................#...#..q..q..q..q..q...#...#....................#", "#....................#...#..................#...#....................#", "#...ffffffffff.......#...#..................#...#...ffffffffff.......#", "#....................#...#..q..q..q..q..q...#...#....................#", "W..................x.#...#..................#...#..................x.W", "#....................#...#..................#...#....................#", "######################...####################...######################", "#....................#...#..................#...#....................#", "#....................#...#.f..............f.#...#.f................f.#", "#..q..q..q..q..q..q..#...#..................#...#....................#", "W....................#...#...q...q...q...q..#...#...q...q...q...q....W", "#....................#...#..................#...#....................#", "#..q..q..q..q..q..q..#...#..................#...#....................#", "#....................#...#..................#...#....................#", "#....................#...#................p.#...#..................p.#", "#....................#...#..................#...#....................#", "W#########D###########...#########D##########...##########D##########W", "#....................................................................#", "#....................................................................#", "#....................................................................#", "##########D###########...#########D##########...##########D###########", "#....................#...#..................#...#....................#", "W...ffffffffff.......#...#.zZOicz...........#...#....................W", "#....................#...#..................#...#..tttttt..........V.#", "#....................#...#..................#...#....................#", "#...ffffffffff.......#...#.........mm.......#...#....................#", "#....................#...#..................#...#....................#", "#....................#...#..................#...#....................#", "W...ffffffffff.....x.#...#................v.#...#.........q..........W", "#....................#...#..................#...#....................#", "######################...####################...D....................#", "#....................#...#..................#...#.............mm.....#", "#..................p.#...#.f..............f.#...#....................#", "#....................#...#..................#...#....................#", "W....................#...#...q...q...q...q..#...#........u..u........W", "#....................D...#..................D...#....................#", "#.y..mmmmmmmmmm......#...#..................#...#....................#", "#....................#...#..................#...#....................#", "#....................#...#...q...q...q...q..#...#.p................p.#", "#....................#...#................p.#...#....................#", "#....................#...#..................#...#....................#", "##W#####W#####W#####W#####W#####W#####W#####W#####W#####W#####W#######"];
    var GEN1_UNION_AREAS = [{ name: 'Union Hall Corridors', c0: 1, r0: 1, c1: 68, r1: 68, type: 'corridor' }, { name: 'Break Room', c0: 1, r0: 1, c1: 20, r1: 9 }, { name: 'Locker Room', c0: 1, r0: 11, c1: 20, r1: 20 }, { name: 'Grievance Office', c0: 26, r0: 1, c1: 43, r1: 9 }, { name: 'Time Clock', c0: 26, r0: 11, c1: 43, r1: 20 }, { name: 'Supply Closet', c0: 49, r0: 1, c1: 68, r1: 9 }, { name: 'Night Shift Lounge', c0: 49, r0: 11, c1: 68, r1: 20 }, { name: 'Union Archive', c0: 1, r0: 26, c1: 20, r1: 33 }, { name: 'Overtime Pit', c0: 1, r0: 35, c1: 20, r1: 43 }, { name: 'Cubicle Farm', c0: 26, r0: 26, c1: 43, r1: 33 }, { name: 'Payroll', c0: 26, r0: 35, c1: 43, r1: 43 }, { name: 'Mailroom', c0: 49, r0: 26, c1: 68, r1: 33 }, { name: 'HR (Abandoned)', c0: 49, r0: 35, c1: 68, r1: 43 }, { name: 'Copy Room', c0: 1, r0: 49, c1: 20, r1: 57 }, { name: 'Conference Room B', c0: 1, r0: 59, c1: 20, r1: 68 }, { name: 'Water Cooler', c0: 26, r0: 49, c1: 43, r1: 57 }, { name: 'Minutes Office', c0: 26, r0: 59, c1: 43, r1: 68 }, { name: "The Steward's Office", c0: 49, r0: 49, c1: 68, r1: 68, type: 'boss' }];
    var GEN1_ARCHIVE = ["##W#######W#######W#######W#######WDD#####W#######W#######W#######W###", "#....................................................................#", "W.#########DD########....#########DD########....#########DD########..W", "#.#................%#....#................x#....#................%#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "W.#.................#....#.................#....#.................#..W", "#.D.ttttt....ttt..t.D....D.ttttt....ttt..t.D....D.ttttt....ttt..t.D..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "W.#.................#....#.................#....#.................#..W", "#.#.................#....#.................#....#.................#..#", "#.#d................#....#d................#....#d................#..#", "#.#########DD########....#########DD########....#########DD########..#", "#....................................................................#", "#....................................................................#", "#....................................................................#", "#....................................................................#", "W.#########DD########....#########DD########....#########DD########..W", "#.#6................#....#................%#....#................%#..#", "#.#.................#....#.................#....#.................#..#", "#.#..|...|...|...|..#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "W.#.................#....#.................#....#.................#..W", "#.D.V............d..D....D.ttttt....ttt..t.D....D.ttttt....ttt..t.D..#", "#.#.................#....#.................#....#.................#..D", "#.#.................#....#.................#....#.................#..D", "#.#.................#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "W.#..|...|...|...|..#....#.................#....#.................#..W", "#.#.................#....#.................#....#.................#..#", "#.#................6#....#d................#....#d................#..#", "#.#########DD########....#########DD########....#########DD########..#", "#....................................................................#", "#....................................................................#", "#....................................................................#", "#....................................................................#", "W.#########DD########....#########DD########....#########DD########..W", "#.#................%#....#................%#....#................%#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "W.#.................#....#.................#....#.................#..W", "#.D.ttttt....ttt..t.D....D.ttttt....ttt..t.D....D.ttttt....ttt..t.D..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "#.#.................#....#.................#....#.................#..#", "#.#.................#....#.................#....#.................#..#", "#.#.ttttt....ttt..t.#....#.ttttt....ttt..t.#....#.ttttt....ttt..t.#..#", "W.#.................#....#.................#....#.................#..W", "#.#.................#....#.................#....#.................#..#", "#.#d................#....#d................#....#d................#..#", "#.#########DD########....#########DD########....#########DD########..#", "#....................................................................#", "#....................................................................#", "#....................................................................#", "##W#######W#######W#######W#######WDD#####W#######W#######W#######W###"];
    var GEN1_ARCHIVE_AREAS = [{ name: 'Drowned Stacks', c0: 1, r0: 1, c1: 68, r1: 72, type: 'corridor' }, { name: 'Reading Pool', c0: 3, r0: 3, c1: 19, r1: 20, type: 'room' }, { name: 'The Records Vault', c0: 3, r0: 27, c1: 19, r1: 44, type: 'boss' }, { name: 'Wet Stacks', c0: 3, r0: 51, c1: 19, r1: 68, type: 'room' }, { name: 'Card Catalog', c0: 26, r0: 3, c1: 42, r1: 20, type: 'room' }, { name: 'Filing Sump', c0: 26, r0: 27, c1: 42, r1: 44, type: 'room' }, { name: 'Microfiche Bog', c0: 26, r0: 51, c1: 42, r1: 68, type: 'room' }, { name: 'Index Pond', c0: 49, r0: 3, c1: 65, r1: 20, type: 'room' }, { name: 'Ledger Room', c0: 49, r0: 27, c1: 65, r1: 44, type: 'room' }, { name: 'Damp Annex', c0: 49, r0: 51, c1: 65, r1: 68, type: 'room' }];
    var GEN1_GATE = ["                                                                      ", "                                                      ############### ", "                                                      #.............# ", "                                                      #.6.........6.# ", "                ##################################### #.............# ", "                #6.................................6# #.............# ", "                #.............M...M...M.............# #.............# ", "                #...................................# #.............# ", "                #...|....|....|....|....|....|......###......$......# ", "                #...................................................# ", "                #...................................D.D.............# ", "                #...................................................# ", "                #...................................###.............# ", "                #...................................# #.............# ", "                #...................................# #.............# ", "                #...................................# #.............# ", "                #...................................# ############### ", "                #...................................#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #...|....|....|....|....|....|......#                 ", "                #...................................#                 ", "                #...................................#                 ", "                #6.................................6#                 ", "                ###############DDDDDDDD##############                 ", "                             #..........#                             ", "                             #..........#                             ", "                             #|........|#                             ", "                             #..........#                             ", "                             #..........#                             ", "                             #..........#                             ", "                             #|........|#                             ", "                             #.6......6.#                             ", "                             #..........#                             ", "                             #..........#                             ", "                             #|........|#                             ", "                             #..........#                             ", "                             #..........#                             ", "            ##################..........#                             ", "            #zZOc**.........y#|........|#                             ", "            #................#..........#                             ", "            #................#..........#                             ", "            #..............u.#..........#################             ", "            #b.b.b...........#|........|#MM.M.M........C#             ", "            #................#..........#...............#             ", "            #................D..........#...............#             ", "            #................#..........#...............#             ", "            #........mm......#|........|#...............#             ", "            #................#..........#...............#             ", "            #................#..........D.......A.......#             ", "            #................#..........#...............#             ", "            #XQ..............#|........|#...............#             ", "            ##################..........#...............#             ", "                             #..........#...............#             ", "                             #..........#...............#             ", "                             #|........|#x.............M#             ", "                             #.6......6.#################             ", "                             #..........#                             ", "                             #..........#                             ", "                             #|........|#                             ", "                             #..........#                             ", "                             #..........#                             ", "                             #..........#                             ", "                             #|........|#                             ", "                             #..........#                             ", "                             ###DDDDDD###                             "];
    var GEN1_GATE_AREAS = [{ name: 'The Approach', c0: 30, r0: 29, c1: 39, r1: 68, type: 'hall' }, { name: 'The Gatehouse', c0: 17, r0: 5, c1: 51, r1: 27, type: 'boss' }, { name: 'The Stairwell', c0: 55, r0: 2, c1: 67, r1: 15, type: 'stairs' }, { name: 'Gate Passage', c0: 53, r0: 9, c1: 53, r1: 11, type: 'corridor' }, { name: 'Last Chance Lounge', c0: 13, r0: 43, c1: 28, r1: 55, type: 'safe' }, { name: 'The Trophy Room', c0: 41, r0: 47, c1: 55, r1: 59, type: 'room' }];
    var TPL1 = {
      pc: { name: 'The Processing Center', wall: 'plaster', theme: 'studio', rows: GEN1_PC, areas: GEN1_PC_AREAS, pal: { u: 0x3a6a8a, m: 0xe8e8e8, q: 0xd8d8d8, b: 0x5a6a7a, f: 0x8a9098, z: 0xe8e8e8, c: 0xe8e8e8 } },
      union: { desk: 'metalDesk', name: 'Imp Union Hall', wall: 'plaster', theme: 'office', rows: GEN1_UNION, areas: GEN1_UNION_AREAS, pal: { q: 0x8a7a6a, u: 0x6a4a3a, m: 0x7a6a5a, f: 0x6a6f76, z: 0xb8a888, c: 0xb8a888, K: 0x6a5a4a } },
      archive: { name: 'The Flooded Archive', wall: 'keep', theme: 'water', rows: GEN1_ARCHIVE, areas: GEN1_ARCHIVE_AREAS },
      gate: { name: 'The Stairwell Gate', wall: 'keep', theme: 'gate', rows: GEN1_GATE, areas: GEN1_GATE_AREAS, pal: { u: 0x5a1a1a, m: 0x3a2418, b: 0x5a3a2a } }
    };
    function named(b, nm) { return b.all.filter(function (r) { return r.name === nm; })[0]; }
    function mouth(Z, name, x0, z0, x1, z1) { var r = room({ name: name, type: 'corridor', x0: x0, z0: z0, x1: x1, z1: z1 }, Z); carveRect(r); return r; }
    // ================= 1. The Processing Center (southwest, the start) =================
    var PCZ = zone({ name: 'The Processing Center', theme: 'studio', fam: 'puglin', line: 'Sterile halls, neon signs and a lot of paperwork. This is where the show checks you in.' }, [5, 165, 76, 236]);
    var pcb = stamp(TPL1.pc, 6, 166, 0, PCZ), pc = { halls: named(pcb, 'Processing Halls') }, pcx = exitsOf(pcb.room, ['N', 'E']);
    var green = named(pcb, 'The Green Room');
    green.line = 'Your holding cell, now with a couch. No violence of any kind; the System takes this very seriously, and so does its teleporter.';
    var start = { x: green.x0 + 10, z: green.z0 + 10 }; put(start.x, start.z, '@'); taken[start.x + ',' + start.z] = 1;
    spawns.push({ kind: 'imp', npc: 'pip', x: start.x + 2, z: start.z + 1, room: green.id }); taken[(start.x + 2) + ',' + (start.z + 1)] = 1;
    var vp = openSpot(green); if (vp) spawns.push({ kind: 'producer', npc: 'vrell', x: vp[0], z: vp[1], room: green.id });
    var PCL = { 'Stage 3': 'A practice stage with training dummies. Hit them. They are paid to take it.', 'Holding Pen B': 'Something got out of its holding pen. It is small, angry and wearing a name tag.', 'Loading Dock': 'Crates for every set on the lot, and something rummaging through them.',
      'Orientation Theater': 'Rows of benches facing a screen that plays the same safety video forever.', 'Control Room': 'A wall of monitors showing the floor. One of them is showing you.', 'Medical (Closed)': 'Closed. The sign says so. The blood on the floor says it was busy before that.' };
    pcb.all.forEach(function (r) { if (PCL[r.name]) r.line = PCL[r.name]; if (r.name === 'Prop Storage') scatter(r, 'C', 1); });
    spawnIn(named(pcb, 'Holding Pen B'), 'puglin', { tier: 1, name: 'Escaped reject' }); for (var m0 = 0; m0 < 2; m0++) spawnIn(named(pcb, 'Loading Dock'), 'puglin', { tier: 1, name: 'Escaped reject' });

    // ================= 2. The Flooded Archive (northwest) =================
    var ARZ = zone({ name: 'The Flooded Archive', theme: 'water', fam: 'clerk', line: 'Knee-deep water between stacks of records. The clerks say the paperwork is load-bearing.' }, [5, 5, 76, 80]);
    var arb = stamp(TPL1.archive, 6, 6, 0, ARZ), ahalls = [], arx = exitsOf(arb.room, ['E', 'S']);
    var vault = named(arb, 'The Records Vault'); vault.line = 'The vault where the floor\'s records go to drown. The Head Archivist does not allow talking.';
    for (zz = ARZ.z0; zz <= ARZ.z1; zz++) for (xx = ARZ.x0; xx <= ARZ.x1; xx++) if (g[zz][xx] === '.' && Z_owns(ARZ, xx, zz) && rnd() < 0.5 && !nearDoor(xx, zz)) g[zz][xx] = '~';
    arb.all.forEach(function (hr) {
      if (hr === vault) { scatter(hr, 'C', 1); spawnIn(hr, 'clerk', { boss: true, sub: 'archivist' }); spawnIn(hr, 'clerk', { sub: 'clerk_head' }); spawnIn(hr, 'clerk', { tier: 2 }); return; }
      if (hr.type !== 'room') return; scatter(hr, 'kK', ri(1, 2)); if (rnd() < 0.35) scatter(hr, 'C', 1); var n = ri(1, 3); for (var m = 0; m < n; m++) spawnIn(hr, 'clerk', { tier: tierRoll(ARZ) });
    });

    // ================= 3. Imp Union Hall (north middle; turned round so its doors face south and east) =================
    var UHZ = zone({ name: 'Imp Union Hall', theme: 'office', fam: 'imp', line: 'Imp territory. Cubicles, break rooms and endless bureaucracy. Every door has a sign-in sheet.', elite: 0.16 }, [91, 3, 162, 74]);
    var uhb = stamp(TPL1.union, 92, 4, 2, UHZ), uh = { halls: named(uhb, 'Union Hall Corridors') }, uhx = exitsOf(uhb.room, ['S', 'E']);
    var uboss = named(uhb, 'The Steward\'s Office'); uboss.line = 'A corner office with a view of more office. The Shop Steward has never lost a negotiation or a fistfight.';
    uhb.all.forEach(function (r) { if (r === uboss || r.type !== 'room') return; if (rnd() < 0.25) scatter(r, 'C', 1); if (rnd() < 0.62) { var n = ri(1, 2); for (var m = 0; m < n; m++) spawnIn(r, 'imp', { tier: tierRoll(UHZ) }); } });
    scatter(uboss, 'C', 1);
    spawnIn(uboss, 'imp', { boss: true, sub: 'steward' }); spawnIn(uboss, 'imp', { sub: 'imp_foreman' }); spawnIn(uboss, 'imp', { tier: 2 });

    // ================= 4. The Stairwell Gate (northeast) =================
    var SGZ = zone({ name: 'The Stairwell Gate', theme: 'gate', fam: 'imp', line: 'The last stretch of the floor. The stairs down are close, and so is whatever is guarding them.' }, [167, 3, 238, 76]);
    var GOX = 168, GOZ = 4, sgb = stamp(TPL1.gate, GOX, GOZ, 0, SGZ), sgx = exitsOf(sgb.room, ['S']);
    var appr = named(sgb, 'The Approach'), gh = named(sgb, 'The Gatehouse'), stairR = named(sgb, 'The Stairwell'), lcs = named(sgb, 'Last Chance Lounge'), troph = named(sgb, 'The Trophy Room');
    appr.line = 'A long hall built to make you feel small. It works.'; gh.line = 'The gatehouse. The thing that guards the stairs has been waiting for you specifically. It read your file.';
    stairR.line = 'A sealed square of stone in the middle of the floor, humming faintly. Whatever is under it answers to the Gatekeeper.'; lcs.line = 'A safe room before the end. Free food, a mirror, and a sign that says GOOD LUCK in six languages.';
    troph.line = 'Trophies from crawlers who did not make it down. Some of them are still warm.';
    var stairs = sgb.room.stairsDown ? { x: sgb.room.stairsDown[0], z: sgb.room.stairsDown[1] } : { x: GOX + 61, z: GOZ + 8 };
    scatter(troph, 'C', 1); spawnIn(troph, 'imp', { tier: 2 });
    [[GOX + 34, GOZ + 63], [GOX + 37, GOZ + 63]].forEach(function (p) { if (g[p[1]][p[0]] === '.') { taken[p[0] + ',' + p[1]] = 1; spawns.push({ kind: 'imp', sub: 'imp_foreman', x: p[0], z: p[1], room: appr.id, guard: true, name: 'Gate guard' }); } });
    var gkx = GOX + 34, gkz = GOZ + 15; taken[gkx + ',' + gkz] = 1; spawns.push({ kind: 'imp', boss: true, sub: 'gatekeeper', x: gkx, z: gkz, room: gh.id });
    spawnIn(gh, 'imp', { sub: 'imp_foreman' }); spawnIn(gh, 'puglin', { sub: 'puglin_chief' });

    // ================= 5. Underline Station (west middle): a dead subway stop; replaces the Underbazaar =================
    var MZ = zone({ name: 'Underline Station', theme: 'metro', fam: 'rat', line: 'A dead subway stop under the floor. The rats moved in, the trains never stopped, and the third rail is still live.' }, [3, 92, 80, 154]);
    var mx0 = MZ.x0, mx1 = MZ.x1, mz0 = MZ.z0;
    var ticket = room({ name: 'Ticket Hall', type: 'room', x0: mx0 + 16, z0: mz0, x1: mx1 - 16, z1: mz0 + 8, line: 'The ticket hall. Turnstiles, dead ticket machines and a route map of the whole floor.' }, MZ); carveRect(ticket);
    for (xx = ticket.x0 + 4; xx <= ticket.x1 - 4; xx += 3) put(xx, ticket.z1 - 1, 'P'); // turnstile posts: squeeze between them
    var npl = room({ name: 'North Platform', type: 'room', x0: mx0 + 1, z0: mz0 + 13, x1: mx1 - 1, z1: mz0 + 17, line: 'The northbound platform. Benches, a newsstand and a lot of gnawed wrappers.' }, MZ); carveRect(npl);
    var tracks = room({ name: 'The Tracks', type: 'corridor', x0: mx0 + 1, z0: mz0 + 18, x1: mx1 - 1, z1: mz0 + 29, line: 'The tracks. The rails hum. A sign says DO NOT STAND HERE in a font that suggests it means it.' }, MZ);
    for (zz = tracks.z0; zz <= tracks.z1; zz++) for (xx = tracks.x0; xx <= tracks.x1; xx++) put(xx, zz, ',', tracks.id);
    var spl = room({ name: 'South Platform', type: 'room', x0: mx0 + 1, z0: mz0 + 30, x1: mx1 - 1, z1: mz0 + 34, line: 'The southbound platform. Vending machines, a dead clock and a puddle that is probably fine.' }, MZ); carveRect(spl);
    [mx0 + 18, mx1 - 18].forEach(function (ex) { for (var zz = mz0 + 9; zz <= mz0 + 12; zz++) for (var k = 0; k < 3; k++) put(ex + k, zz, '.', ticket.id); }); // the stairs down from the ticket hall
    var maint = room({ name: 'Maintenance Loop', type: 'corridor', x0: mx0 + 2, z0: mz0 + 35, x1: mx1 - 2, z1: mz0 + 46, line: 'A maintenance loop behind the platform. Pipes, puddles and arrows that point at the switch room.' }, MZ);
    for (xx = mx0 + 3; xx <= mx1 - 3; xx++) { put(xx, mz0 + 44, '.', maint.id); put(xx, mz0 + 45, '.', maint.id); }
    [mx0 + 3, mx1 - 4].forEach(function (cx) { for (var zz = mz0 + 35; zz <= mz0 + 45; zz++) { put(cx, zz, '.', maint.id); put(cx + 1, zz, '.', maint.id); } });
    var swr = room({ name: 'The Switch Room', type: 'room', x0: Math.floor((mx0 + mx1) / 2) - 4, z0: mz0 + 38, x1: Math.floor((mx0 + mx1) / 2) + 4, z1: mz0 + 42, line: 'The switch room. A big lever, a bigger warning sign, and the hum of the third rail through the wall.' }, MZ); carveRect(swr);
    put(Math.floor((mx0 + mx1) / 2), mz0 + 43, 'D', swr.id); scatter(swr, 'C', 1);
    var nest = room({ name: 'The Rat King\'s Nest', type: 'boss', x0: mx1 - 12, z0: mz0 + 18, x1: mx1, z1: mz0 + 29, line: 'A nest in the dark mouth of the tunnel, built from fare cards and other crawlers\' socks. Something big holds court here.' }, MZ);
    blob(mx1 - 6, mz0 + 23, 6, 6, function (xx, zz) { if (inb(xx, zz) && xx <= mx1 && zz >= mz0 + 14 && zz <= mz0 + 33) put(xx, zz, ',', nest.id); });
    var rkx = mx1 - 6, rkz = mz0 + 23; taken[rkx + ',' + rkz] = 1; spawns.push({ kind: 'rat', boss: true, sub: 'rat_king', x: rkx, z: rkz, room: nest.id });
    for (var rk = 0; rk < 4; rk++) spawnIn(nest, 'rat', { sub: 'rat' });
    put(mx1 - 3, mz0 + 26, 'C');
    // rat packs on the platforms and tracks (they come back in waves, like the old market's)
    [[npl, 3], [spl, 3], [tracks, 2], [ticket, 1], [maint, 2]].forEach(function (q) { for (var k = 0; k < q[1]; k++) { var p = openSpot(q[0]); if (!p) continue; var n = 2 + (k % 2); spawns.push({ kind: 'rat', sub: 'rat', x: p[0], z: p[1], room: q[0].id, bz: true }); for (var j = 1; j < n; j++) { var t2 = 0, x2, z2; do { x2 = p[0] + ri(-2, 2); z2 = p[1] + ri(-2, 2); t2++; } while (t2 < 20 && !(g[z2] && (g[z2][x2] === '.' || g[z2][x2] === ',') && reg[z2][x2] === q[0].id && !taken[x2 + ',' + z2])); if (t2 < 20) { taken[x2 + ',' + z2] = 1; spawns.push({ kind: 'rat', sub: 'rat', x: x2, z: z2, room: q[0].id, bz: true }); } } } });
    scatter(npl, 'K', 2); scatter(spl, 'K', 2); scatter(ticket, 'K', 1); scatter(tracks, 'C', 1);
    var mtx = { N: [Math.floor((mx0 + mx1) / 2), mz0 - 1], E: [mx1 + 1, mz0 + 32], S: [mx0 + 3, mz0 + 46] };
    put(mtx.N[0], mz0 - 1, '.'); for (var k5 = 0; k5 < 2; k5++) put(mtx.N[0] + k5, mz0 - 1, '.');

    // ================= 6. The Drowned Gardens (east middle) =================
    var GZ = zone({ name: 'The Drowned Gardens', theme: 'garden', fam: 'bog', line: 'An overgrown cavern that feels like outdoors. Trees, ponds, fog, and things that live in the reeds.', elite: 0.14 }, [160, 90, 237, 158]);
    var gfield = room({ name: 'The Drowned Gardens', type: 'corridor', x0: GZ.x0, z0: GZ.z0, x1: GZ.x1, z1: GZ.z1 }, GZ);
    var GCX = GZ.x1 - 16, GCZ = GZ.z0 + 15; // the gazebo sits in the far corner
    for (zz = GZ.z0 + 1; zz < GZ.z1; zz++) for (xx = GZ.x0 + 1; xx < GZ.x1; xx++) { var edge = Math.min(xx - GZ.x0, GZ.x1 - xx, zz - GZ.z0, GZ.z1 - zz), wob2 = Math.sin(xx * 0.3) * 2 + Math.cos(zz * 0.25) * 2; if (edge > 2 + wob2 || (edge > 1 && rnd() < 0.5)) put(xx, zz, ',', gfield.id); }
    var gboss = room({ name: 'The Rotting Gazebo', type: 'boss', x0: GCX - 8, z0: GCZ - 8, x1: GCX + 8, z1: GCZ + 8, line: 'A gazebo swallowed by vines. Something big has been gardening here. It has been composting crawlers.' }, GZ);
    for (k = 0; k < 7; k++) blob(ri(GZ.x0 + 8, GZ.x1 - 8), ri(GZ.z0 + 8, GZ.z1 - 8), ri(2, 4), ri(2, 3), function (xx, zz) { if (inb(xx, zz) && reg[zz][xx] === gfield.id && Math.max(Math.abs(xx - GCX), Math.abs(zz - GCZ)) > 12) g[zz][xx] = '#'; });
    for (k = 0; k < 7; k++) blob(ri(GZ.x0 + 6, GZ.x1 - 6), ri(GZ.z0 + 6, GZ.z1 - 6), ri(2, 5), ri(2, 4), function (xx, zz) { if (inb(xx, zz) && g[zz][xx] === ',' && Math.max(Math.abs(xx - GCX), Math.abs(zz - GCZ)) > 12) g[zz][xx] = '~'; });
    for (zz = GZ.z0 + 2; zz < GZ.z1 - 1; zz++) for (xx = GZ.x0 + 2; xx < GZ.x1 - 1; xx++) {
      if (g[zz][xx] !== ',' || Math.max(Math.abs(xx - GCX), Math.abs(zz - GCZ)) <= 10) continue;
      var nn = Math.sin(xx * 0.21 + 1.3) * Math.cos(zz * 0.17 - 0.4) + Math.sin((xx + zz) * 0.09);
      if (nn > 0.8 && rnd() < 0.3) g[zz][xx] = 'Y'; else if (rnd() < 0.008) g[zz][xx] = 'Y';
    }
    for (zz = gboss.z0; zz <= gboss.z1; zz++) for (xx = gboss.x0; xx <= gboss.x1; xx++) if ((xx - GCX) * (xx - GCX) + (zz - GCZ) * (zz - GCZ) <= 64) put(xx, zz, ',', gboss.id);
    for (k = 0; k < 6; k++) put(Math.round(GCX + Math.cos(k / 6 * Math.PI * 2) * 4), Math.round(GCZ + Math.sin(k / 6 * Math.PI * 2) * 4), 'P');
    put(GCX, GCZ, 'C');
    var GN = [['Lily Pond', 'Lily pads big enough to stand on. Do not stand on them.'], ['The Mushroom Ring', 'A perfect circle of mushrooms. Stepping inside feels like a contract.'], ['Willow Hollow', 'The trees lean in close. The fog is thick enough to hide in.'], ['The Old Greenhouse', 'A glass greenhouse, mostly broken. The plants inside are winning.'], ['Reed Marsh', 'Tall reeds and soft mud. Something keeps moving just out of sight.'], ['Picnic Lawn', 'A sponsor\'s picnic, abandoned mid-sandwich.']];
    var glist = [gboss];
    GN.forEach(function (gn) {
      for (var t = 0; t < 120; t++) {
        var cx3 = ri(GZ.x0 + 8, GZ.x1 - 8), cz3 = ri(GZ.z0 + 8, GZ.z1 - 8), ok = true;
        glist.forEach(function (o) { var c = center(o); if (Math.abs(c[0] - cx3) < 15 && Math.abs(c[1] - cz3) < 15) ok = false; }); if (!ok) continue;
        var cl = room({ name: gn[0], type: 'room', x0: cx3 - 5, z0: cz3 - 5, x1: cx3 + 5, z1: cz3 + 5, line: gn[1] }, GZ);
        for (var zz = cl.z0; zz <= cl.z1; zz++) for (var xx = cl.x0; xx <= cl.x1; xx++) { if (g[zz][xx] === 'Y' || g[zz][xx] === '#') g[zz][xx] = ','; if (g[zz][xx] === ',' || g[zz][xx] === '~') reg[zz][xx] = cl.id; }
        if (gn[0] === 'Lily Pond') blob(cx3, cz3, 3, 3, function (xx, zz) { if (reg[zz][xx] === cl.id) g[zz][xx] = '~'; });
        if (gn[0] === 'The Old Greenhouse') { for (xx = cl.x0; xx <= cl.x1; xx++) { put(xx, cl.z0, '#'); put(xx, cl.z1, '#'); } for (zz = cl.z0; zz <= cl.z1; zz++) { put(cl.x0, zz, '#'); put(cl.x1, zz, '#'); } put(cx3, cl.z1, 'D', cl.id); put(cx3, cl.z0, 'D', cl.id); scatter(cl, 'hhvq', 5); }
        if (gn[0] === 'Picnic Lawn') scatter(cl, 'TRb', 3);
        if (rnd() < 0.4) scatter(cl, 'C', 1);
        glist.push(cl); break;
      }
    });
    spawnIn(gboss, 'bog', { boss: true, sub: 'gardener' }); spawnIn(gboss, 'bog', { sub: 'bog_chief' }); spawnIn(gboss, 'bog', { tier: 2 });
    glist.forEach(function (cl) { if (cl === gboss) return; var n = ri(1, 3); for (var m = 0; m < n; m++) spawnIn(cl, 'bog', { tier: tierRoll(GZ) }); });
    for (k = 0; k < 10; k++) { var wx = ri(GZ.x0 + 4, GZ.x1 - 4), wz = ri(GZ.z0 + 4, GZ.z1 - 4); if (g[wz][wx] === ',' && reg[wz][wx] === gfield.id && !taken[wx + ',' + wz]) { taken[wx + ',' + wz] = 1; spawns.push({ kind: 'bog', tier: tierRoll(GZ), x: wx, z: wz, room: gfield.id }); } }

    // ================= 7. The Puglin Warrens (south middle): caves =================
    var WRZ = zone({ name: 'The Puglin Warrens', theme: 'moss', fam: 'puglin', line: 'Puglin territory. Tight, twisting tunnels, moss, mud and the smell of snacks gone wrong.', elite: 0.07 }, [88, 158, 154, 237]);
    var wtun = room({ name: 'Warren Tunnels', type: 'corridor', x0: WRZ.x0, z0: WRZ.z0, x1: WRZ.x1, z1: WRZ.z1 }, WRZ);
    var WN = ['Gnawing Pit', 'Moss Den', 'Bone Garden', 'Snack Larder', 'Mud Nursery', 'Sentry Nook', 'Rag Pile', 'Root Cellar', 'The Drip', 'Gristle Hall', 'Puddle Court', 'The Burrows'];
    var WBX = Math.floor((WRZ.x0 + WRZ.x1) / 2), WBZ = WRZ.z1 - 9;
    var caves = [], wboss = room({ name: 'Grik\'s Throne Room', type: 'boss', x0: WBX - 10, z0: WBZ - 7, x1: WBX + 10, z1: WBZ + 7, line: 'A cavern full of stolen snack wrappers and one very large puglin on a throne of bottle caps.' }, WRZ);
    blob(WBX, WBZ, 10, 7, function (xx, zz) { put(xx, zz, ',', wboss.id); }); caves.push(wboss);
    for (t = 0; t < 600 && caves.length < 12; t++) {
      var rx = ri(4, 7), rz = ri(3, 6), cx2 = ri(WRZ.x0 + rx + 1, WRZ.x1 - rx - 1), cz2 = ri(WRZ.z0 + rz + 1, WRZ.z1 - rz - 1), ok = true;
      caves.forEach(function (c) { var cc = center(c); if (Math.abs(cc[0] - cx2) < rx + (c.x1 - c.x0) / 2 + 5 && Math.abs(cc[1] - cz2) < rz + (c.z1 - c.z0) / 2 + 5) ok = false; });
      if (!ok) continue;
      var cr = room({ name: WN[caves.length - 1] || 'Side Cave', type: 'room', x0: cx2 - rx, z0: cz2 - rz, x1: cx2 + rx, z1: cz2 + rz }, WRZ);
      blob(cx2, cz2, rx, rz, function (xx, zz) { if (inb(xx, zz) && xx >= WRZ.x0 && xx <= WRZ.x1 && zz >= WRZ.z0 && zz <= WRZ.z1) put(xx, zz, ',', cr.id); }); caves.push(cr);
    }
    connectAll(caves, function (a, b) { drunk(a[0], a[1], b[0], b[1], wtun.id, ','); }, 3);
    put(wboss.x0 + 4, wboss.z0 + 3, 'B'); put(wboss.x1 - 4, wboss.z0 + 3, 'B'); put(WBX, WBZ + 5, 'C');
    spawnIn(wboss, 'puglin', { boss: true, sub: 'grik' }); spawnIn(wboss, 'puglin', { sub: 'puglin_chief' }); spawnIn(wboss, 'puglin', { tier: 2 });
    caves.forEach(function (c) { if (c === wboss) return; if (rnd() < 0.3) scatter(c, 'C', 1); if (rnd() < 0.35) scatter(c, 'B', 1); var n = ri(1, 3); for (var m = 0; m < n; m++) spawnIn(c, 'puglin', { tier: tierRoll(WRZ) }); });

    // ================= 8. The Arena (southeast): a stadium =================
    var AZ = zone({ name: 'The Arena', theme: 'arena', fam: 'puglin', line: 'A stadium carved out of the rock. The stands are full of aliens, and every one of them has paid to see you get hurt.' }, [164, 166, 237, 237]);
    var acx = 201, acz = 202;
    var afield = room({ name: 'The Arena Floor', type: 'boss', x0: acx - 26, z0: acz - 22, x1: acx + 26, z1: acz + 22, line: 'Sand, blood and floodlights. The announcer is already introducing you. Badly.' }, AZ);
    for (zz = afield.z0; zz <= afield.z1; zz++) for (xx = afield.x0; xx <= afield.x1; xx++) { var e2 = ((xx - acx) * (xx - acx)) / (26 * 26) + ((zz - acz) * (zz - acz)) / (22 * 22); if (e2 <= 1) put(xx, zz, '.', afield.id); }
    for (var an2 = 0; an2 < 32; an2++) { var ang = an2 / 32 * Math.PI * 2, px2 = Math.round(acx + Math.cos(ang) * 23), pz2 = Math.round(acz + Math.sin(ang) * 19); if (an2 % 2 === 0) put(px2, pz2, 'P'); else if (an2 % 4 === 1) put(px2, pz2, 'B'); }
    put(acx - 6, acz - 4, 'g'); put(acx + 6, acz + 4, 'g'); put(acx + 18, acz, 'C');
    spawns.push({ kind: 'puglin', boss: true, sub: 'headliner', x: acx, z: acz, room: afield.id }); taken[acx + ',' + acz] = 1;
    spawns.push({ kind: 'puglin', sub: 'puglin_brute', x: acx - 8, z: acz + 2, room: afield.id, name: 'Undercard brute' });
    spawns.push({ kind: 'imp', sub: 'imp_foreman', x: acx + 8, z: acz - 2, room: afield.id, name: 'Undercard bruiser' });

    // ---------- the halls: every zone one hall from the Concourse, neighbours joined in loops ----------
    var J1 = [84, 82], J2 = [84, 196];
    hall('The Records Run', arx.E, J1, { pts: [[84, arx.E[1]]] }); hall('Archive Spur', J1, RING.NW, { pts: [[84, 100], [100, 100]] }); var aj = into(UHZ, [J1[0] + 4, J1[1] - 30], 'Union Back Stair'); if (aj) hall('Union Back Corridor', J1, [J1[0] + 4, J1[1] - 30], { bends: 0 });
    hall('The Long Way Round', arx.S, mtx.N, { bends: 1, line: 'A stairwell from the Archive down to the station. The steps are wet all the way.' });
    hall('Union Stairs', uhx.S, RING.N, { bends: 1 });
    hall('Platform Exit', mtx.E, RING.W);
    hall('Service Tunnel 4', mtx.S, pcx.N, { bends: 1, line: 'A service tunnel from the station\'s maintenance loop up to the Processing Center.' });
    hall('Intake Corridor', pcx.E, J2, { bends: 0 }); hall('Processing Spur', J2, RING.SW, { pts: [[84, 150], [100, 150]] }); var wj = into(WRZ, [J2[0] + 8, J2[1]], 'Warren Mouth'); if (wj) hall('Warren Approach', J2, [J2[0] + 8, J2[1]], { bends: 0 });
    var wn = into(WRZ, [RING.S[0], WRZ.z0 - 2], 'Warren Burrow'); if (wn) hall('Burrow Road', RING.S, [RING.S[0], WRZ.z0 - 2], { bends: 1 });
    var ge = into(GZ, [GZ.x0 - 2, RING.E[1]], 'Garden Gate'); if (ge) hall('The Garden Walk', RING.E, [GZ.x0 - 2, RING.E[1]]);
    var at = into(AZ, [AZ.x0 - 2, acz - 14], 'Contestant Tunnel'); if (at) hall('Ticket Hall Tunnel', RING.SE, [AZ.x0 - 2, acz - 14], { pts: [[157, RING.SE[1]], [157, acz - 14]] });
    var aw = into(AZ, [AZ.x0 - 2, acz + 10], 'Undercard Tunnel'); var ww = into(WRZ, [WRZ.x1 + 2, acz + 10], 'Warren Back Door'); if (aw && ww) hall('The Back Door', [WRZ.x1 + 2, acz + 10], [AZ.x0 - 2, acz + 10], { bends: 1 });
    var an = into(AZ, [acx, AZ.z0 - 2], 'Victory Tunnel'); var gs = into(GZ, [acx, GZ.z1 + 2], 'Garden South Gate'); if (an && gs) hall('Victory Lap', [acx, GZ.z1 + 2], [acx, AZ.z0 - 2], { bends: 0 });
    var gn2 = into(GZ, [sgx.S[0], GZ.z0 - 2], 'Garden North Gate'); if (gn2) hall('The Last Mile', sgx.S, [sgx.S[0], GZ.z0 - 2], { bends: 1, line: 'The last stretch before the Gate. The crowd noise follows you. So do the cameras.' });
    // safe rooms off the halls
    [HALLS[1], HALLS[4], HALLS[8], HALLS[11]].forEach(function (h) { if (h) pocketSafe(h); });
    // ---------- shortcuts: hidden at one end, so they open from one side first ----------
    function secretRun(name, a, b, line) { var r = room({ name: name, theme: 'tunnel', type: 'corridor', x0: Math.min(a[0], b[0]), z0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), z1: Math.max(a[1], b[1]), line: line }); drunk(a[0], a[1], b[0], b[1], r.id, '.'); return r; }
    // Union Hall's east side: a vent that comes out in the Gate's Approach
    if (uhx.E) { var ve = secretRun('The Vent', [uhx.E[0] + 2, uhx.E[1]], [GOX - 2, GOZ + 55], 'A crawlspace vent. It smells like burnt coffee and fear, and it comes out somewhere you were not meant to be yet.'); into(SGZ, [GOX - 2, GOZ + 55], 'Vent Grate'); put(uhx.E[0] + 1, uhx.E[1], 'H', ve.id); }
    // the Warrens: a burrow that comes out in the station's maintenance loop
    var bw = caves.slice(1).sort(function (a, b) { return (a.x0 + a.z0) - (b.x0 + b.z0); })[0]; if (bw) { var bc = center(bw); var br = secretRun('A Puglin Burrow', bc, [mx1 - 4, mz0 + 47], 'A burrow, puglin-sized. You fit. Mostly.'); put(mx1 - 4, mz0 + 46, 'H', br.id); }

    // ---------- shrubs: little scavengers spread across the floor ----------
    [[PCZ, 3], [WRZ, 6], [UHZ, 4], [ARZ, 4], [GZ, 8], [SGZ, 1], [MZ, 2]].forEach(function (zn) {
      var Z = zn[0], list = Z.rooms.filter(function (r) { return r.type === 'room' || r.type === 'corridor'; }); if (!list.length) return;
      for (var k = 0; k < zn[1]; k++) spawnIn(pick(list), 'shrub', { sub: 'shrub1' });
    });
    HALLS.forEach(function (b, i) { if (i % 2) return; for (var t = 0; t < 30; t++) { var xx = ri(b.x0, b.x1), zz = ri(b.z0, b.z1); if (inb(xx, zz) && g[zz][xx] === '.' && reg[zz][xx] === b.id && !taken[xx + ',' + zz]) { taken[xx + ',' + zz] = 1; spawns.push({ kind: 'shrub', sub: 'shrub1', x: xx, z: zz, room: b.id }); break; } } });
    // ---------- rats: packs of one to three in the zones' halls and along the tunnels ----------
    [[PCZ, 3], [WRZ, 5], [UHZ, 4], [ARZ, 4], [AZ, 2], [GZ, 3]].forEach(function (zn) {
      var list = zn[0].rooms.filter(function (r) { return r.type === 'corridor'; }); if (!list.length) list = zn[0].rooms.filter(function (r) { return r.type === 'room'; }); if (!list.length) return;
      var used = {}; for (var k = 0; k < zn[1]; k++) { var cr = pick(list); if (used[cr.id] && list.length > k) cr = pick(list); if (used[cr.id]) continue; used[cr.id] = 1; var n = 1 + Math.floor(rnd() * 2); for (var j = 0; j < n; j++) spawnIn(cr, 'rat', { sub: 'rat' }); }
    });
    HALLS.concat([hub]).forEach(function (b) { var n = 1 + Math.floor(rnd() * 2); for (var t = 0; t < 40 && n > 0; t++) { var xx = ri(b.x0, b.x1), zz = ri(b.z0, b.z1); if (inb(xx, zz) && g[zz][xx] === '.' && reg[zz][xx] === b.id && !taken[xx + ',' + zz]) { taken[xx + ',' + zz] = 1; spawns.push({ kind: 'rat', sub: 'rat', x: xx, z: zz, room: b.id }); n--; } } });

    // ---------- hidden rooms: behind a wall that hides a door, off any corridor ----------
    var HN = ['A Forgotten Closet', 'The Secret Stash', 'A Smugglers\' Nook', 'The Producer\'s Hideout', 'The Writers\' Room', 'An Unlisted Dressing Room', 'The Blooper Vault', 'A Sponsor\'s Lost Crate', 'The Stunt Double\'s Bunk', 'The Censor\'s Office'], hidden = 0;
    for (t = 0; t < 4000 && hidden < HN.length; t++) {
      var hx2 = ri(4, Wd - 10), hz2 = ri(4, Hd - 10), hw2 = ri(3, 5), hh2 = ri(3, 4);
      if (!free(hx2, hz2, hx2 + hw2, hz2 + hh2)) continue;
      var sides = [[hx2 - 2, hz2 + 1, hx2 - 1, hz2 + 1], [hx2 + hw2 + 2, hz2 + 1, hx2 + hw2 + 1, hz2 + 1], [hx2 + 1, hz2 - 2, hx2 + 1, hz2 - 1], [hx2 + 1, hz2 + hh2 + 2, hx2 + 1, hz2 + hh2 + 1]], okS = null;
      sides.forEach(function (sd) { if (!okS && inb(sd[0], sd[1]) && isFloor(g[sd[1]][sd[0]]) && rooms[reg[sd[1]][sd[0]]] && rooms[reg[sd[1]][sd[0]]].type === 'corridor') okS = sd; });
      if (!okS) continue;
      var hr2 = room({ name: HN[hidden], theme: 'store', type: 'hidden', x0: hx2, z0: hz2, x1: hx2 + hw2, z1: hz2 + hh2, line: 'A hidden room. Nobody was supposed to find this.' });
      carveRect(hr2); put(okS[2], okS[3], 'H', hr2.id); var hc = center(hr2); put(hc[0], hc[1], 'C'); hidden++;
    }
    // ================= set dressing: furniture against walls, tables with things on them, rugs, banners =================
    // Each room gets a style from what it is (an office, a break room, a cave, a market). Blocking furniture becomes
    // an 'o' tile with its own name; everything else is decoration drawn on top of the floor.
    var decor = decor || {}, dname = dname || {};
    function dec(x, z, m, o) { var d = { m: m }; for (var k in o) d[k] = o[k]; (decor[x + ',' + z] || (decor[x + ',' + z] = [])).push(d); }
    function freeT(x, z, r) { return inb(x, z) && (!r || reg[z][x] === r.id) && (g[z][x] === '.' || g[z][x] === ',') && !nearDoor(x, z) && !taken[x + ',' + z]; }
    // props3 (downloaded furniture): swap some stock pieces for real ones, picked by a hash of the tile so the level's dice don't move
    function h3(x, z, salt) { var n = (x * 73856093) ^ (z * 19349663) ^ ((salt || 0) * 83492791); n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
    function hpick(a, x, z, salt) { return a[Math.floor(h3(x, z, salt) * a.length)]; }
    function alt3T() { return { Couch: { from: /^(Bench|loungeSofa)$/, p: 0.55, to: [['sofa', { fit: 0.98 }]] }, Bench: { from: /^Bench$/, p: 0.45, to: [['woodBench', { fit: 1.0 }]] }, 'Lamp post': { from: /^Torch_Metal$/, p: 0.7, to: [['streetlamp', { h: 2.7 }]] },
      Cabinet: { from: /^Cabinet$/, p: 0.5, to: [['cupboard', { fit: 0.7 }], ['closet', { fit: 0.95 }], ['oldDresser', { fit: 0.7 }]] }, Shelf: { from: /^Shelf_Simple$/, p: 0.35, to: [['wallRack', { fit: 0.95 }]] } }; } var ALT3c = null;
    function alt3(x, z, m, o, name) { var A = (ALT3c || (ALT3c = alt3T()))[name]; if (!A || !A.from.test(m) || h3(x, z, 7) > A.p) return null; var t = hpick(A.to, x, z, 3), d = {}; for (var k in o) if (k !== 'fit' && k !== 'h' && k !== 's') d[k] = o[k]; for (k in t[1]) d[k] = t[1][k]; return [t[0], d]; }
    function obj(x, z, m, o, name) { if (!freeT(x, z)) return false; var a3 = alt3(x, z, m, o || {}, name); if (a3) { m = a3[0]; o = a3[1]; } g[z][x] = 'o'; dname[x + ',' + z] = name || m.replace(/_/g, ' ').replace(/ ?\d+$/, ''); dec(x, z, m, o); return true; }
    var D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    function wallOf(x, z) { for (var k = 0; k < 4; k++) if (g[z + D4[k][1]] && g[z + D4[k][1]][x + D4[k][0]] === '#') return D4[k]; return null; }
    function hug(w, o) { var d = { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.24, dz: w[1] * 0.24 }; for (var k in o) d[k] = o[k]; return d; } // back to the wall, facing the room
    function wallSpots(r) { var out = []; for (var zz = r.z0; zz <= r.z1; zz++) for (var xx = r.x0; xx <= r.x1; xx++) if (freeT(xx, zz, r) && wallOf(xx, zz)) out.push([xx, zz]);
      for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; } return out; }
    function alongWall(r, n, fn) { var sp = wallSpots(r), used = 0; for (var i = 0; i < sp.length && used < n; i++) { var w = wallOf(sp[i][0], sp[i][1]); if (freeT(sp[i][0], sp[i][1], r) && fn(sp[i][0], sp[i][1], w)) used++; } return used; }
    var TOP = 0.36; // the top of a big table
    function onTable(x, z, items) { items.forEach(function (it, k) { var a = k / items.length * Math.PI * 2 + rnd(); dec(x, z, it, { y: TOP, dx: Math.cos(a) * 0.28, dz: Math.sin(a) * 0.16, fit: it === 'CandleStick_Triple' ? 0.32 : 0.2, rot: rnd() * 6 }); }); }
    function rug(r, col) { var w = Math.min(5, r.x1 - r.x0 - 2), d = Math.min(4, r.z1 - r.z0 - 2), c = center(r); if (w < 2 || d < 2) return; dec(c[0], c[1], '#rug', { w: w, d: d, col: col }); }
    function diningSet(x, z, r, food) {
      if (!freeT(x, z, r) || !freeT(x - 1, z, r) || !freeT(x + 1, z, r)) return false;
      obj(x, z, 'Table_Large', { fit: 1.25, rot: 0 }, 'Table');
      onTable(x, z, food ? ['Table_Plate', 'Mug', 'Chalice', 'CandleStick_Triple', 'Bottle_1'] : ['Mug', 'Book_Stack_1', 'Scroll_2', 'CandleStick_Triple']);
      dec(x, z - 1, rnd() < 0.5 ? 'Chair_1' : 'Stool', { fit: 0.42, rot: 0, dz: 0.2 }); dec(x, z + 1, rnd() < 0.5 ? 'Chair_1' : 'Stool', { fit: 0.42, rot: Math.PI, dz: -0.2 });
      if (rnd() < 0.6) dec(x - 1, z, 'Stool', { fit: 0.36, rot: Math.PI / 2 }); if (rnd() < 0.6) dec(x + 1, z, 'Stool', { fit: 0.36, rot: -Math.PI / 2 });
      return true;
    }
    function desk(x, z, r) { if (!freeT(x, z, r) || !freeT(x, z + 1, r)) return false; obj(x, z, 'Table_Large', { fit: 1.0, rot: 0 }, 'Desk'); onTable(x, z, [pick(['Book_Stack_1', 'Book_Stack_2', 'Scroll_1', 'Scroll_2']), pick(['Mug', 'Candle_1', 'BookGroup_Small_1'])]); dec(x, z + 1, 'Chair_1', { fit: 0.42, rot: Math.PI, dz: -0.25 }); return true; }
    function shelfUnit(x, z, w, kind) { var m = pick(kind || ['Bookcase_2', 'Shelf_Simple', 'Cabinet', 'Shelf_Small_Bottles']); return obj(x, z, m, hug(w, { fit: m === 'Cabinet' ? 0.8 : 0.95 }), m === 'Bookcase_2' ? 'Bookcase' : m === 'Cabinet' ? 'Cabinet' : 'Shelf'); }
    function painting(x, z, w) { dec(x, z, hpick(['painting1', 'painting2', 'painting4', 'painting8', 'painting9', 'painting12'], x, z, 11), { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.47, dz: w[1] * 0.47, y: 1.25, h: 0.75, hang: true, ns: true }); return true; }
    function banner(x, z, w, m) { dec(x, z, m || pick(['Banner_1', 'Banner_2']), { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.46, dz: w[1] * 0.46, y: 1.48, fit: 0.9, hang: true, ns: true }); }
    function stack(x, z, w) { var m = pick(['Crate_Wooden', 'Crate_Wooden', 'Crate_Metal', 'Barrel', 'Barrel_Apples', 'FarmCrate_Carrot']); if (!obj(x, z, m, hug(w, { fit: /Barrel/.test(m) ? 0.62 : 0.8, rot: rnd() * 0.4 + Math.atan2(-w[0], -w[1]) }), /Barrel/.test(m) ? 'Barrel' : 'Crate')) return false;
      if (/Crate_/.test(m) && rnd() < 0.5) dec(x, z, pick(['Crate_Wooden', 'Bag', 'Bucket_Metal']), { y: 0.62, fit: 0.5, rot: rnd() * 6, dx: w[0] * 0.24, dz: w[1] * 0.24 }); return true; }
    var STYLE = mkStyle();
    function mkStyle() { return {
      office: function (r) { alongWall(r, 2, painting); for (var zz = r.z0 + 1; zz < r.z1 - 1; zz += 3) for (var xx = r.x0 + 1; xx < r.x1; xx += 3) desk(xx, zz, r); alongWall(r, 3, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet', 'Shelf_Simple', 'Bookcase_2']); }); },
      meeting: function (r) { alongWall(r, 2, painting); var c = center(r); rug(r, 0x3a3f5a); for (var xx = c[0] - 1; xx <= c[0] + 1; xx++) if (freeT(xx, c[1], r)) { obj(xx, c[1], 'Table_Large', { fit: 1.1 }, 'Conference table'); onTable(xx, c[1], ['Scroll_1', 'Mug']); dec(xx, c[1] - 1, 'Chair_1', { fit: 0.42, dz: 0.25 }); dec(xx, c[1] + 1, 'Chair_1', { fit: 0.42, rot: Math.PI, dz: -0.25 }); } alongWall(r, 2, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet', 'Bookcase_2']); }); },
      break: function (r) { var c = center(r); diningSet(c[0], c[1], r, true); alongWall(r, 2, function (x, z, w) { return shelfUnit(x, z, w, ['Shelf_Small_Bottles', 'Cabinet']); }); alongWall(r, 2, function (x, z, w) { return stack(x, z, w); }); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); }); },
      lounge: function (r) { rug(r, 0x6a2a3a); alongWall(r, 3, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Couch'); }); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'jukebox', hug(w, { h: 1.6 }), 'Jukebox'); }); alongWall(r, 2, function (x, z, w) { banner(x, z, w); return true; }); },
      storage: function (r) { alongWall(r, Math.max(4, (r.x1 - r.x0 + r.z1 - r.z0) >> 1), function (x, z, w) { return rnd() < 0.75 ? stack(x, z, w) : shelfUnit(x, z, w, ['Shelf_Simple', 'Shelf_Small_Bottles']); }); },
      workshop: function (r) { var c = center(r); obj(c[0], c[1], 'Workbench', { fit: 1.2 }, 'Workbench'); dec(c[0], c[1], 'Pickaxe_Bronze', { y: 0.5, fit: 0.4, rot: 1 }); alongWall(r, 2, function (x, z, w) { return obj(x, z, pick(['Workbench_Drawers', 'Peg_Rack', 'WeaponStand']), hug(w, { fit: 0.95 }), 'Workbench'); }); alongWall(r, 3, function (x, z, w) { return stack(x, z, w); }); },
      bunk: function (r) { alongWall(r, 3, function (x, z, w) { if (!obj(x, z, 'Bed_Twin1', hug(w, { fit: 0.9 }), 'Bed')) return false; var sx = w[1] ? 1 : 0, sz = w[0] ? 1 : 0; if (freeT(x + sx, z + sz, r) && wallOf(x + sx, z + sz)) obj(x + sx, z + sz, 'Nightstand_Shelf', hug(w, { fit: 0.5 }), 'Nightstand'); return true; }); alongWall(r, 1, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet']); }); },
      wardrobe: function (r) { alongWall(r, 5, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet', 'Cabinet', 'Shelf_Simple', 'Peg_Rack']); }); var c = center(r); obj(c[0], c[1], 'Bench', { fit: 1.0 }, 'Bench'); },
      theater: function (r) { for (var zz = r.z0 + 3; zz < r.z1; zz += 2) for (var xx = r.x0 + 2; xx < r.x1 - 1; xx += 2) obj(xx, zz, 'Bench', { fit: 1.05, rot: Math.PI }, 'Seat'); obj(center(r)[0], r.z0 + 1, 'BookStand', { h: 1.0 }, 'Lectern'); },
      cells: function (r) { alongWall(r, 4, function (x, z, w) { return obj(x, z, 'Cage_Small', hug(w, { fit: 0.75 }), 'Cage'); }); alongWall(r, 2, function (x, z, w) { dec(x, z, 'Bag', { fit: 0.45, rot: rnd() * 6 }); return true; }); },
      cave: function (r) { alongWall(r, ri(2, 4), function (x, z, w) { var m = pick(['Vase_Rubble_Medium', 'Barrel', 'Bag', 'Bucket_Wooden_1', 'Rope_2', 'Crate_Wooden']); if (/Barrel|Crate/.test(m)) return stack(x, z, w); dec(x, z, m, { fit: 0.42, rot: rnd() * 6, dx: w[0] * 0.25, dz: w[1] * 0.25 }); return true; }); },
      // safe rooms: a real break room. Kitchen along the wall by the catering table, bunks opposite, a table with chairs,
      // and a TV corner when there is room. Kenney Furniture Kit models are half scale, so s: 2.
      safehouse: function (r) {
        var KS = 2, fx = 0, fz = 0, nf = 0, xx, zz;
        for (zz = r.z0; zz <= r.z1; zz++) for (xx = r.x0; xx <= r.x1; xx++) if (g[zz] && g[zz][xx] === 'F') { fx += xx; fz += zz; nf++; }
        var sp = wallSpots(r); if (!sp.length) return;
        var cx = nf ? fx / nf : center(r)[0], cz = nf ? fz / nf : r.z0;
        sp.sort(function (a, b) { return Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz); });
        var kw = wallOf(sp[0][0], sp[0][1]);
        var row = sp.filter(function (p) { var w = wallOf(p[0], p[1]); return w[0] === kw[0] && w[1] === kw[1]; }).sort(function (a, b) { return kw[1] ? a[0] - b[0] : a[1] - b[1]; });
        var rot = Math.atan2(-kw[0], -kw[1]);
        var seq = [['kitchenFridgeLarge', 'Fridge', null, 0.09], ['kitchenStove', 'Stove', null, 0.05], ['kitchenCabinet', 'Coffee machine', 'kitchenCoffeeMachine', 0.05], ['kitchenSink', 'Sink', null, 0.05], ['kitchenCabinet', 'Counter', 'kitchenMicrowave', 0.05], ['kitchenCabinet', 'Counter', 'toaster', 0.05]];
        var si = 0; row.forEach(function (p) { if (si >= seq.length) return; var q = seq[si]; if (!freeT(p[0], p[1], r)) return;
          obj(p[0], p[1], q[0], { s: KS, rot: rot, dx: kw[0] * q[3], dz: kw[1] * q[3] }, q[1]);
          if (q[2]) dec(p[0], p[1], q[2], { s: KS, rot: rot, y: 0.9, dx: kw[0] * 0.18, dz: kw[1] * 0.18 }); si++; });
        // bunks on the opposite wall: two tiles deep, head against the wall
        var ow = [-kw[0], -kw[1]], orot = Math.atan2(-ow[0], -ow[1]), bunks = 0;
        sp.filter(function (p) { var w = wallOf(p[0], p[1]); return w[0] === ow[0] && w[1] === ow[1]; }).forEach(function (p) {
          if (bunks >= 2) return; var ix = p[0] - ow[0], iz = p[1] - ow[1];
          if (!freeT(p[0], p[1], r) || !freeT(ix, iz, r)) return;
          obj(p[0], p[1], 'bedBunk', { s: KS, rot: orot, dx: -ow[0] * 0.6, dz: -ow[1] * 0.6 }, 'Bunk bed'); g[iz][ix] = 'o'; dname[ix + ',' + iz] = 'Bunk bed'; bunks++;
          // skip the neighbour so bunks don't touch
          taken[(p[0] + Math.abs(ow[1])) + ',' + (p[1] + Math.abs(ow[0]))] = 1;
        });
        // a table for four in the middle
        var c = center(r); if (freeT(c[0], c[1], r) && freeT(c[0] + 1, c[1], r)) {
          rug(r, 0x3a4a5a);
          obj(c[0], c[1], 'table', { s: KS, rot: 0, dx: 0.5 }, 'Table'); g[c[1]][c[0] + 1] = 'o'; dname[(c[0] + 1) + ',' + c[1]] = 'Table';
          dec(c[0], c[1], 'kitchenBlender', { s: KS, y: 0.66, dx: 0.2, dz: 0.05, rot: 0.4 });
          [[0, -1, 0, 0.28], [1, -1, 0, 0.28], [0, 1, Math.PI, -0.28], [1, 1, Math.PI, -0.28]].forEach(function (q) { if (freeT(c[0] + q[0], c[1] + q[1], r)) dec(c[0] + q[0], c[1] + q[1], 'chair', { s: KS, rot: q[2], dz: q[3] }); });
        }
        // TV corner and a couch along a side wall, if the room has space
        var side = sp.filter(function (p) { var w = wallOf(p[0], p[1]); return w[0] !== kw[0] || w[1] !== kw[1]; }).filter(function (p) { var w = wallOf(p[0], p[1]); return !(w[0] === ow[0] && w[1] === ow[1]); });
        var tvDone = false, sofaDone = false;
        side.forEach(function (p) { if (!freeT(p[0], p[1], r)) return; var w = wallOf(p[0], p[1]), rt = Math.atan2(-w[0], -w[1]);
          if (!tvDone) { obj(p[0], p[1], 'cabinetTelevision', { s: KS, rot: rt, dx: w[0] * 0.25, dz: w[1] * 0.25 }, 'TV'); dec(p[0], p[1], 'televisionModern', { s: KS, rot: rt, y: 0.62, dx: w[0] * 0.3, dz: w[1] * 0.3 }); tvDone = true; return; }
          if (!sofaDone) { obj(p[0], p[1], 'loungeSofa', { s: KS, rot: rt, dx: w[0] * 0.08, dz: w[1] * 0.08 }, 'Couch'); sofaDone = true; return; }
        });
        alongWall(r, 2, function (x, z, w) { dec(x, z, rnd() < 0.6 ? 'pottedPlant' : 'lampRoundFloor', { s: KS, rot: rnd() * 6, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'trashcan', { s: KS, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
      },
      snack: function (r) { rug(r, 0x2a5a4a); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); }); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'vending', hug(w, { h: 1.9 }), 'Vending machine'); }); alongWall(r, 1, function (x, z, w) { return obj(x, z, hpick(['bedA', 'bedF', 'bedFrame'], x, z, 5), hug(w, { fit: 1.0 }), 'Bunk'); }); },
      trophy: function (r) { alongWall(r, 4, function (x, z, w) { banner(x, z, w); return true; }); rug(r, 0x5a1a1a); },
      archive: function (r) { var c = center(r); if (freeT(c[0], r.z0 + 1, r)) obj(c[0], r.z0 + 1, 'BookStand', { h: 1.0 }, 'Reading stand'); dec(c[0] + 1, r.z0 + 1, 'CandleStick_Stand', { h: 1.0 }); alongWall(r, 3, function (x, z, w) { dec(x, z, pick(['Book_Stack_1', 'Book_Stack_2', 'BookGroup_Medium_1', 'Scroll_1']), { fit: 0.35, rot: rnd() * 6 }); return true; }); }
    }; }
    var BYNAME = { 'Intake': 'office', 'Contracts Office': 'office', 'Waiver Signing': 'office', 'Casting Office': 'meeting', 'Control Room': 'office', 'Makeup & Prosthetics': 'wardrobe', 'Wardrobe Department': 'wardrobe', 'Prop Storage': 'storage', 'Loading Dock': 'storage',
      'Orientation Theater': 'theater', 'Medical (Closed)': 'bunk', 'Holding Pen B': 'cells', 'Craft Services Annex': 'break', 'Stage 3': 'lounge',
      'Break Room': 'break', 'Water Cooler': 'break', 'Vending Hall': 'break', 'Night Shift Lounge': 'lounge', 'Seniority Lounge': 'lounge', 'Quiet Room': 'lounge', 'Wellness Room': 'lounge', 'Locker Room': 'wardrobe',
      'Supply Closet': 'storage', 'Mailroom': 'storage', 'Copy Room': 'storage', 'Records': 'storage', 'Union Archive': 'storage', 'Strike Fund': 'storage', 'Picket Sign Shop': 'workshop', 'Shop Floor': 'workshop', 'Training Room': 'workshop',
      'Conference Room B': 'meeting', 'Grievance Office': 'meeting', 'Dispute Office': 'meeting', 'Minutes Office': 'meeting', 'Snack Larder': 'storage', 'Mud Nursery': 'cells', 'The Trophy Room': 'trophy', 'Last Chance Lounge': 'safehouse', 'The Green Room': 'safehouse', 'The Steward\'s Office': 'meeting' };
    // ---------- modern rooms (Processing Center, Union Hall, safe rooms): the furniture kit ----------
    function wr(w) { return Math.atan2(-w[0], -w[1]); }
    // the free spot nearest the middle of a room where every listed offset is open (monsters may stand in the exact centre)
    function spotNear(r, offs) { var c = center(r); offs = offs || [[0, 0]];
      for (var rad = 0; rad < 6; rad++) for (var dz = -rad; dz <= rad; dz++) for (var dx = -rad; dx <= rad; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
        var x = c[0] + dx, z = c[1] + dz; if (offs.every(function (o) { return freeT(x + o[0], z + o[1], r); })) return [x, z]; }
      return null; }
    function F(x, z, m, fit, rot, name, o) { var d = { fit: fit, rot: rot || 0 }; for (var k in o) d[k] = o[k]; return obj(x, z, m, d, name); }
    function onTop(x, z, m, base, o) { var d = { on: base, rot: 0 }; for (var k in o) d[k] = o[k]; dec(x, z, m, d); }
    function deskSet(x, z, r, face) { // a desk with a computer, an office chair on the open side
      var cz = z + (face || 1); if (!freeT(x, z, r) || !freeT(x, cz, r)) return false;
      var rot = face === -1 ? Math.PI : 0, base = { m: 'desk', fit: 0.98 };
      F(x, z, 'desk', 0.98, rot, 'Desk');
      if (rnd() < 0.75) { onTop(x, z, 'computerScreen', base, { fit: 0.42, rot: rot, dz: -0.1 * (face || 1) }); onTop(x, z, 'computerKeyboard', base, { fit: 0.34, rot: rot, dz: 0.12 * (face || 1) }); }
      else onTop(x, z, rnd() < 0.5 ? 'laptop' : 'books', base, { fit: 0.36, rot: rot + 0.3 });
      if (rnd() < 0.4) onTop(x, z, 'mug', base, { fit: 0.1, dx: 0.32, dz: 0.05 });
      dec(x, cz, 'chairDesk', { fit: 0.5, rot: rot + Math.PI + (rnd() - 0.5) * 0.6, dz: -0.18 * (face || 1) });
      return true;
    }
    function filing(r, n) { return alongWall(r, n, function (x, z, w) { return F(x, z, rnd() < 0.6 ? 'bookcaseClosedWide' : 'bookcaseOpen', 0.95, wr(w), 'Filing cabinet', { dx: w[0] * 0.22, dz: w[1] * 0.22 }); }); }
    function plants(r, n) { return alongWall(r, n, function (x, z, w) { dec(x, z, pick(['pottedPlant', 'plantSmall1', 'plantSmall2', 'plantSmall3']), { fit: 0.45, rot: rnd() * 6, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; }); }
    function lampsWall(r, n) { return alongWall(r, n, function (x, z, w) { dec(x, z, 'lampWall', { fit: 0.3, rot: wr(w), dx: w[0] * 0.44, dz: w[1] * 0.44, y: 1.15, hang: true, ns: true }); return true; }); }
    function bins(r, n) { return alongWall(r, n, function (x, z, w) { dec(x, z, 'trashcan', { fit: 0.3, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; }); }
    function boxes(r, n) { return alongWall(r, n, function (x, z, w) { if (!F(x, z, rnd() < 0.5 ? 'cardboardBoxClosed' : 'cardboardBoxOpen', 0.62, wr(w) + (rnd() - 0.5) * 0.5, 'Boxes', { dx: w[0] * 0.18, dz: w[1] * 0.18 })) return false; if (rnd() < 0.5) dec(x, z, 'cardboardBoxClosed', { fit: 0.5, y: 0.42, rot: rnd() * 6, dx: w[0] * 0.18, dz: w[1] * 0.18 }); return true; }); }
    function kitchenRun(r, items) { // cabinets and appliances along the wall nearest the room's top edge
      var sp = wallSpots(r).filter(function (p) { var w = wallOf(p[0], p[1]); return w[1] === -1; }).sort(function (a, b) { return a[0] - b[0]; });
      var i = 0; sp.forEach(function (p) { if (i >= items.length || !freeT(p[0], p[1], r)) return; var q = items[i];
        F(p[0], p[1], q[0], 0.98, 0, q[1], { dz: -0.06 }); if (q[2]) dec(p[0], p[1], q[2], { on: { m: q[0], fit: 0.98 }, fit: q[3] || 0.4, dz: -0.1 }); i++; });
      return i;
    }
    function couchCorner(r) { var c = spotNear(r, [[0, 0], [0, 1]]), done = 0;
      rug(r, pick([0x3a4a5a, 0x5a3a3a, 0x3a5a4a]));
      if (c) { F(c[0], c[1] + 1, 'loungeSofa', 0.98, Math.PI, 'Couch'); dec(c[0], c[1], 'tableCoffee', { fit: 0.7, rot: 0 }); done++; }
      alongWall(r, 1, function (x, z, w) { if (!F(x, z, 'cabinetTelevision', 0.95, wr(w), 'TV', { dx: w[0] * 0.24, dz: w[1] * 0.24 })) return false; dec(x, z, 'televisionModern', { on: { m: 'cabinetTelevision', fit: 0.95 }, fit: 0.8, rot: wr(w), dx: w[0] * 0.28, dz: w[1] * 0.28 }); return true; });
      return done;
    }
    var MODERN = mkModern();
    function mkModern() { return {
      office: function (r) { alongWall(r, 2, painting);
        var dense = /Cubicle|Overtime|Payroll|Benefits|Badge|Intake|Waiver|Contracts/.test(r.name);
        for (var zz = r.z0 + 1; zz < r.z1 - 1; zz += 3) for (var xx = r.x0 + 1; xx < r.x1; xx += dense ? 2 : 3) deskSet(xx, zz, r, 1);
        filing(r, 2 + (r.x1 - r.x0 > 8 ? 2 : 0)); plants(r, 2); bins(r, 1); lampsWall(r, 2);
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'coatRackStanding', { fit: 0.4, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
      },
      control: function (r) { // a wall of monitors and a row of desks facing it
        var n = 0; alongWall(r, 4, function (x, z, w) { if (w[1] !== -1) return false; if (!F(x, z, 'cabinetTelevision', 0.95, 0, 'Monitor bank', { dz: -0.24 })) return false; dec(x, z, 'televisionModern', { on: { m: 'cabinetTelevision', fit: 0.95 }, fit: 0.85, dz: -0.28 }); n++; return true; });
        for (var zz = r.z0 + 3; zz < r.z1 - 1; zz += 3) for (var xx = r.x0 + 1; xx < r.x1; xx += 2) deskSet(xx, zz, r, 1); filing(r, 2);
        alongWall(r, 2, function (x, z, w) { dec(x, z, 'speaker', { fit: 0.35, rot: wr(w), dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; }); lampsWall(r, 2);
      },
      meeting: function (r) { alongWall(r, 2, painting); var c = spotNear(r, [[-1, 0], [0, 0], [1, 0]]) || center(r); rug(r, 0x2f3a5a);
        for (var xx = c[0] - 1; xx <= c[0] + 1; xx++) if (freeT(xx, c[1], r)) { F(xx, c[1], 'table', 0.98, 0, 'Conference table'); if (rnd() < 0.5) onTop(xx, c[1], pick(['mug', 'books', 'laptop']), { m: 'table', fit: 0.98 }, { fit: 0.25, rot: rnd() * 6 });
          dec(xx, c[1] - 1, 'chairCushion', { fit: 0.45, rot: 0, dz: 0.22 }); dec(xx, c[1] + 1, 'chairCushion', { fit: 0.45, rot: Math.PI, dz: -0.22 }); }
        alongWall(r, 1, function (x, z, w) { if (!F(x, z, 'cabinetTelevision', 0.95, wr(w), 'Presentation screen', { dx: w[0] * 0.24, dz: w[1] * 0.24 })) return false; dec(x, z, 'televisionModern', { on: { m: 'cabinetTelevision', fit: 0.95 }, fit: 0.8, rot: wr(w), dx: w[0] * 0.28, dz: w[1] * 0.28 }); return true; });
        plants(r, 2); filing(r, 1); lampsWall(r, 2);
      },
      break: function (r) {
        kitchenRun(r, [['kitchenFridge', 'Fridge'], ['kitchenCabinet', 'Coffee machine', 'kitchenCoffeeMachine', 0.32], ['kitchenSink', 'Sink'], ['kitchenCabinet', 'Counter', 'kitchenMicrowave', 0.5], ['kitchenCabinet', 'Counter', 'toaster', 0.3]]);
        var c = spotNear(r, [[0, 0], [0, -1], [0, 1]]); if (c) { F(c[0], c[1], 'tableRound', 0.9, 0, 'Table'); [[0, -1, 0], [0, 1, Math.PI], [-1, 0, Math.PI / 2], [1, 0, -Math.PI / 2]].forEach(function (q) { if (freeT(c[0] + q[0], c[1] + q[1], r)) dec(c[0] + q[0], c[1] + q[1], 'chair', { fit: 0.45, rot: q[2], dx: -q[0] * 0.22, dz: -q[1] * 0.22 }); }); onTop(c[0], c[1], 'mug', { m: 'tableRound', fit: 0.9 }, { fit: 0.1, dx: 0.1 }); }
        alongWall(r, 1, function (x, z, w) { return F(x, z, 'kitchenBar', 0.95, wr(w), 'Counter', { dx: w[0] * 0.2, dz: w[1] * 0.2 }); });
        bins(r, 1); plants(r, 1); lampsWall(r, 1);
      },
      lounge: function (r) { couchCorner(r);
        alongWall(r, 2, function (x, z, w) { return F(x, z, rnd() < 0.5 ? 'loungeChair' : 'loungeChairRelax', 0.7, wr(w), 'Armchair', { dx: w[0] * 0.15, dz: w[1] * 0.15 }); });
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'lampRoundFloor', { fit: 0.4, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
        alongWall(r, 1, function (x, z, w) { if (!F(x, z, 'sideTable', 0.5, wr(w), 'Side table', { dx: w[0] * 0.25, dz: w[1] * 0.25 })) return false; dec(x, z, 'radio', { on: { m: 'sideTable', fit: 0.5 }, fit: 0.3, rot: wr(w), dx: w[0] * 0.25, dz: w[1] * 0.25 }); return true; });
        plants(r, 2);
      },
      lockers: function (r) { alongWall(r, 6, function (x, z, w) { return F(x, z, 'bookcaseClosedWide', 0.95, wr(w), 'Lockers', { dx: w[0] * 0.22, dz: w[1] * 0.22 }); });
        var c = spotNear(r, [[-1, 0], [0, 0], [1, 0]]) || center(r); for (var xx = c[0] - 1; xx <= c[0] + 1; xx++) if (freeT(xx, c[1], r)) F(xx, c[1], 'bench', 0.95, 0, 'Bench');
        alongWall(r, 1, function (x, z, w) { return F(x, z, 'washerDryerStacked', 0.7, wr(w), 'Washer and dryer', { dx: w[0] * 0.2, dz: w[1] * 0.2 }); });
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'coatRackStanding', { fit: 0.4, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; }); bins(r, 1);
      },
      wardrobe: function (r) { // costumes on racks, mirrors (lockers), a makeup bench
        alongWall(r, 6, function (x, z, w) { if (rnd() < 0.5) { dec(x, z, 'coatRackStanding', { fit: 0.45, dx: w[0] * 0.25, dz: w[1] * 0.25 }); dec(x, z, 'coatRackStanding', { fit: 0.45, dx: w[0] * 0.25 + w[1] * 0.3, dz: w[1] * 0.25 + w[0] * 0.3 }); return true; } return F(x, z, 'bookcaseClosedWide', 0.95, wr(w), 'Wardrobe', { dx: w[0] * 0.22, dz: w[1] * 0.22 }); });
        var c = spotNear(r, [[0, 0], [0, 1]]); if (c) { F(c[0], c[1], 'desk', 0.98, 0, 'Makeup table'); onTop(c[0], c[1], 'lampSquareTable', { m: 'desk', fit: 0.98 }, { fit: 0.25, dx: -0.3 }); dec(c[0], c[1] + 1, 'stoolBar', { fit: 0.3 }); }
        boxes(r, 2);
      },
      storage: function (r) { boxes(r, Math.max(3, (r.x1 - r.x0 + r.z1 - r.z0) >> 2)); alongWall(r, 3, function (x, z, w) { return rnd() < 0.5 ? stack(x, z, w) : shelfUnit(x, z, w, ['Shelf_Simple', 'Shelf_Small_Bottles']); }); },
      copy: function (r) { alongWall(r, 2, function (x, z, w) { return F(x, z, 'dryer', 0.8, wr(w), 'Photocopier', { dx: w[0] * 0.18, dz: w[1] * 0.18 }); }); var c = spotNear(r, [[0, 0], [0, 1]]); if (c) deskSet(c[0], c[1], r, 1); boxes(r, 4); bins(r, 1); },
      medical: function (r) { alongWall(r, 3, function (x, z, w) { if (!F(x, z, 'bedSingle', 0.95, wr(w), 'Cot', { dx: w[0] * 0.1, dz: w[1] * 0.1 })) return false; return true; });
        alongWall(r, 1, function (x, z, w) { return F(x, z, 'bathroomSink', 0.6, wr(w), 'Sink', { dx: w[0] * 0.25, dz: w[1] * 0.25 }); });
        alongWall(r, 2, function (x, z, w) { return F(x, z, 'bookcaseClosedWide', 0.9, wr(w), 'Medicine cabinet', { dx: w[0] * 0.22, dz: w[1] * 0.22 }); });
        var c = spotNear(r, [[0, 0], [0, 1]]); if (c) deskSet(c[0], c[1], r, 1); lampsWall(r, 2);
      },
      theater: function (r) { for (var zz = r.z0 + 3; zz < r.z1; zz += 2) for (var xx = r.x0 + 2; xx < r.x1 - 1; xx++) if (freeT(xx, zz, r)) dec(xx, zz, 'chairCushion', { fit: 0.48, rot: Math.PI });
        var c = center(r); if (freeT(c[0], r.z0 + 1, r)) obj(c[0], r.z0 + 1, 'BookStand', { h: 1.0 }, 'Podium');
        [r.x0 + 1, r.x1 - 1].forEach(function (xx) { if (freeT(xx, r.z0 + 1, r)) F(xx, r.z0 + 1, 'speaker', 0.45, 0, 'Speaker'); }); lampsWall(r, 2);
      },
      stage: function (r) { scatter(r, 'U', 3); alongWall(r, 2, function (x, z, w) { return F(x, z, 'speaker', 0.45, wr(w), 'Speaker', { dx: w[0] * 0.2, dz: w[1] * 0.2 }); }); alongWall(r, 2, function (x, z, w) { dec(x, z, 'lampSquareFloor', { fit: 0.4, rot: wr(w), dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; }); boxes(r, 2); },
      shop: function (r) { var c = spotNear(r) || center(r); obj(c[0], c[1], 'Workbench', { fit: 1.2 }, 'Workbench'); alongWall(r, 2, function (x, z, w) { return obj(x, z, pick(['Workbench_Drawers', 'Peg_Rack']), hug(w, { fit: 0.95 }), 'Workbench'); }); boxes(r, 3); lampsWall(r, 1); },
      hr: function (r) { MODERN.office(r); alongWall(r, 3, function (x, z, w) { dec(x, z, 'cardboardBoxOpen', { fit: 0.5, rot: rnd() * 6, dx: w[0] * 0.2, dz: w[1] * 0.2 }); return true; }); scatter(r, 'b', 2); },
      lobby: function (r) { couchCorner(r); plants(r, 3); alongWall(r, 2, function (x, z, w) { return F(x, z, 'benchCushion', 0.95, wr(w), 'Bench', { dx: w[0] * 0.15, dz: w[1] * 0.15 }); }); lampsWall(r, 2); },
      // the room everyone wakes up in: bunks for the crew, a washroom, lockers, a kitchen, a TV corner and a table
      greenroom: function (r) {
        var x0 = r.x0, z0 = r.z0, x1 = r.x1, z1 = r.z1, xx, zz, k;
        // washroom along the top wall beside the stalls
        if (freeT(x0 + 5, z0, r)) F(x0 + 5, z0, 'bathroomSink', 0.6, 0, 'Sink', { dz: -0.25 });
        if (freeT(x0 + 6, z0, r)) F(x0 + 6, z0, 'shower', 0.9, 0, 'Shower', { dz: -0.1 });
        // lockers for the crew, then the TV
        for (xx = x0 + 8, k = 0; xx <= x1 - 4 && k < 5; xx++, k++) if (freeT(xx, z0, r)) F(xx, z0, 'bookcaseClosedWide', 0.95, 0, 'Lockers', { dz: -0.22 });
        if (freeT(x1 - 2, z0, r)) { F(x1 - 2, z0, 'cabinetTelevision', 0.95, 0, 'TV', { dz: -0.24 }); dec(x1 - 2, z0, 'televisionModern', { on: { m: 'cabinetTelevision', fit: 0.95 }, fit: 0.85, dz: -0.28 }); }
        if (freeT(x1 - 2, z0 + 1, r)) dec(x1 - 2, z0 + 1, 'tableCoffee', { fit: 0.7 });
        if (freeT(x1 - 2, z0 + 2, r)) F(x1 - 2, z0 + 2, 'loungeSofaLong', 0.98, Math.PI, 'Couch');
        if (freeT(x1 - 1, z0 + 1, r)) dec(x1 - 1, z0 + 1, 'loungeChairRelax', { fit: 0.65, rot: -Math.PI / 2 });
        dec(x1 - 2, z0 + 1, '#rug', { w: 4, d: 3, col: 0x3a4a5a });
        // bunks down the left wall: one for each of the SGC and a spare
        for (zz = z0 + 3, k = 0; zz <= z1 - 3 && k < 3; zz += 3) if (freeT(x0, zz, r) && freeT(x0 + 1, zz, r)) {
          obj(x0, zz, 'bedBunk', { s: 2, rot: Math.PI / 2, dx: 0.6 }, 'Bunk bed'); g[zz][x0 + 1] = 'o'; dname[(x0 + 1) + ',' + zz] = 'Bunk bed'; k++;
          if (freeT(x0, zz + 1, r)) dec(x0, zz + 1, 'sideTableDrawers', { fit: 0.45, rot: Math.PI / 2, dx: -0.25 }); }
        // kitchen along the bottom wall, by the catering table
        var kit = [['kitchenFridgeLarge', 'Fridge'], ['kitchenStove', 'Stove'], ['kitchenCabinet', 'Coffee machine', 'kitchenCoffeeMachine', 0.32], ['kitchenSink', 'Sink'], ['kitchenCabinet', 'Counter', 'kitchenMicrowave', 0.5], ['kitchenCabinet', 'Counter', 'toaster', 0.3]], ki = 0;
        for (xx = x0 + 3; xx <= x1 - 4 && ki < kit.length; xx++) if (freeT(xx, z1, r)) { var q = kit[ki++]; F(xx, z1, q[0], 0.98, Math.PI, q[1], { dz: 0.06 }); if (q[2]) dec(xx, z1, q[2], { on: { m: q[0], fit: 0.98 }, fit: q[3], rot: Math.PI, dz: 0.1 }); }
        // a long table in the middle of the bottom half
        var tx = Math.floor((x0 + x1) / 2) - 1, tz = z1 - 4;
        for (xx = tx; xx <= tx + 2; xx++) if (freeT(xx, tz, r)) { F(xx, tz, 'table', 0.98, 0, 'Table'); dec(xx, tz - 1, 'chair', { fit: 0.45, rot: 0, dz: 0.22 }); dec(xx, tz + 1, 'chair', { fit: 0.45, rot: Math.PI, dz: -0.22 }); }
        onTop(tx + 1, tz, 'kitchenBlender', { m: 'table', fit: 0.98 }, { fit: 0.2 }); onTop(tx, tz, 'mug', { m: 'table', fit: 0.98 }, { fit: 0.1 });
        // a round table by the bunks for cards and a welcome-kit pile by the lockers
        var ct = null; for (var tz2 = z0 + 4; tz2 <= z0 + 9 && !ct; tz2++) for (var tx2 = x0 + 3; tx2 <= x0 + 6 && !ct; tx2++) if ([[0, 0], [0, -1], [0, 1], [1, 0]].every(function (o) { return freeT(tx2 + o[0], tz2 + o[1], r); })) ct = [tx2, tz2];
        if (ct) { F(ct[0], ct[1], 'tableRound', 0.9, 0, 'Card table'); [[0, -1, 0], [0, 1, Math.PI], [1, 0, -Math.PI / 2]].forEach(function (q) { dec(ct[0] + q[0], ct[1] + q[1], 'chairRounded', { fit: 0.45, rot: q[2], dx: -q[0] * 0.2, dz: -q[1] * 0.2 }); }); onTop(ct[0], ct[1], 'books', { m: 'tableRound', fit: 0.9 }, { fit: 0.25, rot: 0.6 }); }
        for (xx = x0 + 8; xx <= x0 + 10; xx++) if (freeT(xx, z0 + 1, r) && rnd() < 0.7) F(xx, z0 + 1, rnd() < 0.5 ? 'cardboardBoxClosed' : 'cardboardBoxOpen', 0.55, rnd() - 0.5, 'Welcome kits');
        // finishing touches
        [[x0 + 2, z0 + 1], [x1, z1 - 2], [x0, z1]].forEach(function (p) { if (freeT(p[0], p[1], r)) dec(p[0], p[1], pick(['pottedPlant', 'plantSmall2']), { fit: 0.45 }); });
        alongWall(r, 3, function (x, z, w) { dec(x, z, 'lampWall', { fit: 0.3, rot: wr(w), dx: w[0] * 0.44, dz: w[1] * 0.44, y: 1.15, hang: true, ns: true }); return true; });
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'trashcan', { fit: 0.3, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
        alongWall(r, 1, function (x, z, w) { dec(x, z, 'coatRackStanding', { fit: 0.42, dx: w[0] * 0.3, dz: w[1] * 0.3 }); return true; });
      }
    }; }
    for (var mk in MODERN) STYLE[mk] = MODERN[mk];
    var MODERN_BY = { 'Intake': 'office', 'Contracts Office': 'office', 'Waiver Signing': 'office', 'Casting Office': 'meeting', 'Control Room': 'control', 'Makeup & Prosthetics': 'wardrobe', 'Wardrobe Department': 'wardrobe', 'Prop Storage': 'storage', 'Loading Dock': 'storage',
      'Orientation Theater': 'theater', 'Medical (Closed)': 'medical', 'Craft Services Annex': 'break', 'Stage 3': 'stage', 'Back Office': 'office',
      'Break Room': 'break', 'Water Cooler': 'break', 'Vending Hall': 'break', 'Night Shift Lounge': 'lounge', 'Seniority Lounge': 'lounge', 'Quiet Room': 'lounge', 'Wellness Room': 'lounge', 'Locker Room': 'lockers',
      'Supply Closet': 'storage', 'Mailroom': 'copy', 'Copy Room': 'copy', 'Records': 'office', 'Union Archive': 'office', 'Strike Fund': 'office', 'Picket Sign Shop': 'shop', 'Shop Floor': 'shop', 'Training Room': 'meeting',
      'Conference Room B': 'meeting', 'Grievance Office': 'meeting', 'Dispute Office': 'meeting', 'Minutes Office': 'office', 'Time Clock': 'lobby', 'Elevator Lobby': 'lobby', 'Bulletin Room': 'lobby', 'Parking Office': 'office', 'Badge Office': 'office',
      'Benefits Desk': 'office', 'HR (Abandoned)': 'hr', 'Cubicle Farm': 'office', 'Overtime Pit': 'office', 'Payroll': 'office', 'The Steward\'s Office': 'meeting', 'The Green Room': 'greenroom' };
    for (var mb in MODERN_BY) BYNAME[mb] = MODERN_BY[mb];
    rooms.forEach(function (r) {
      if (r.tpl) return;
      var st = BYNAME[r.name] || (r.type === 'safe' && r.theme === 'crypt' ? 'safehouse' : r.hood === WRZ.idx && r.type !== 'corridor' ? 'cave' : r.hood === UHZ.idx && r.type === 'room' ? 'office' : r.hood === PCZ.idx && r.type === 'room' ? 'office' : r.hood === ARZ.idx && r.type === 'room' ? 'archive' : null);
      if (st && STYLE[st]) STYLE[st](r);
    });
    // props3 dressing on top of whatever the room already has (templates included); tile hashes, not dice, so the layout stays put
    rooms.forEach(function (r) {
      if (r.type === 'corridor' || r.type === 'boss' || r.type === 'hidden') return;
      var nm = r.name || '';
      if (r.type === 'safe' || /Lounge|Green Room|Break Room|Water Cooler|Vending|Craft Services/.test(nm)) alongWall(r, 1, function (x, z, w) { return obj(x, z, 'vending', hug(w, { h: 1.9 }), 'Vending machine'); });
      if (/Lounge|Night Market|Rumor Corner/.test(nm)) alongWall(r, 1, function (x, z, w) { return obj(x, z, 'jukebox', hug(w, { h: 1.6 }), 'Jukebox'); });
      if (r.type === 'safe' && r.theme === 'crypt') alongWall(r, 1, function (x, z, w) { return obj(x, z, hpick(['bedA', 'bedF', 'bedFrame'], x, z, 5), hug(w, { fit: 1.0 }), 'Bunk'); });
      if (/Locker|Wardrobe|HR|Makeup|Night Shift/.test(nm)) alongWall(r, 2, function (x, z, w) { var m = hpick(['wardrobe', 'closet', 'dresser', 'sovietCabinet'], x, z, 9); return obj(x, z, m, hug(w, { fit: m === 'sovietCabinet' ? 1.0 : 0.9 }), m === 'dresser' || m === 'sovietCabinet' ? 'Dresser' : 'Wardrobe'); });
      if (r.type === 'room' && /office|studio|gate|water/.test(r.theme)) alongWall(r, h3(r.x0, r.z0, 13) < 0.5 ? 1 : 2, painting);
      if (r.type === 'room' && /office|studio/.test(r.theme) && h3(r.x0, r.z0, 17) < 0.35) alongWall(r, 1, function (x, z, w) { return obj(x, z, 'tvShelf', hug(w, { fit: 0.85 }), 'TV stand'); });
    });
    // Underline Station: benches and vending machines on the platforms, a newsstand, crates and debris on the tracks, the Rat King's hoard
    [npl, spl].forEach(function (pl) { var face = pl === npl ? Math.PI : 0, wz = pl === npl ? pl.z0 : pl.z1;
      for (var xx = pl.x0 + 3; xx <= pl.x1 - 3; xx += 7) { if (freeT(xx, wz, pl)) obj(xx, wz, hpick(['woodBench', 'Bench'], xx, wz, 2), { fit: 1.0, rot: face, dz: pl === npl ? -0.24 : 0.24 }, 'Platform bench'); if (freeT(xx + 3, wz, pl)) obj(xx + 3, wz, 'vending', { h: 1.9, rot: face, dz: pl === npl ? -0.24 : 0.24 }, 'Vending machine'); } });
    (function () { var x = Math.floor((npl.x0 + npl.x1) / 2), z = npl.z0 + 1; if (freeT(x, z, npl)) obj(x, z, 'Stall_Empty', { fit: 1.8, rot: 0 }, 'Newsstand'); })();
    for (var tk = 0; tk < 26; tk++) { var tx = ri(tracks.x0 + 1, tracks.x1 - 14), tz = ri(tracks.z0 + 1, tracks.z1 - 1); if (freeT(tx, tz, tracks)) dec(tx, tz, pick(['Crate_Wooden', 'Vase_Rubble_Medium', 'Bag', 'Barrel', 'Rope_1']), { fit: 0.4 + rnd() * 0.3, rot: rnd() * 6, ns: true }); }
    for (tk = 0; tk < 4; tk++) { var cx5 = tracks.x0 + 6 + tk * 14, cz5 = tracks.z0 + 2 + (tk % 2) * 5; for (var a5 = 0; a5 < 6; a5++) if (freeT(cx5 + a5, cz5, tracks)) obj(cx5 + a5, cz5, 'Crate_Metal', { fit: 0.98, rot: 0 }, 'Derailed train car'); } // stand-in train cars until a subway car model is in
    for (zz = ticket.z0 + 1; zz <= ticket.z0 + 2; zz++) for (xx = ticket.x0 + 2; xx <= ticket.x1 - 2; xx += 5) if (freeT(xx, zz, ticket)) obj(xx, zz, 'Cabinet', { fit: 0.8, rot: 0 }, 'Ticket machine');
    for (k = 0; k < 14; k++) { var nx5 = nest.x0 + ri(1, 10), nz5 = nest.z0 + ri(1, 10); if (freeT(nx5, nz5, nest)) dec(nx5, nz5, pick(['Bag', 'Coin_Pile', 'Vase_Rubble_Medium', 'Rope_1', 'Coin_Pile_2']), { fit: 0.3 + rnd() * 0.15, rot: rnd() * 6, ns: true }); }
    alongWall(swr, 2, function (x, z, w) { return obj(x, z, 'Shelf_Simple', hug(w, { fit: 0.95 }), 'Parts shelf'); });
    // the gardens: fences round the picnic and the greenhouse, vines on the rock, benches in the clearings
    glist.forEach(function (cl) {
      if (cl.name === 'Picnic Lawn') { var c = center(cl); diningSet(c[0], c[1], cl, true); for (var xx = cl.x0; xx <= cl.x1; xx++) { if (freeT(xx, cl.z0, cl) && xx % 3) dec(xx, cl.z0, 'Prop_WoodenFence_Single', { fit: 1.0 }); if (freeT(xx, cl.z1, cl) && xx % 3) dec(xx, cl.z1, 'Prop_WoodenFence_Single', { fit: 1.0 }); } }
      else if (cl.type === 'room' && cl.name !== 'The Old Greenhouse') { var c2 = center(cl); if (freeT(c2[0] + 2, c2[1], cl)) obj(c2[0] + 2, c2[1], 'Bench', { fit: 1.0, rot: -Math.PI / 2 }, 'Garden bench'); }
    });
    for (zz = GZ.z0; zz <= GZ.z1; zz++) for (xx = GZ.x0; xx <= GZ.x1; xx++) { if (g[zz][xx] !== ',' || rnd() > 0.06) continue; var w = wallOf(xx, zz); if (w) dec(xx, zz, pick(['Prop_Vine2', 'Prop_Vine5']), { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.48, dz: w[1] * 0.48, y: 1.4, fit: 0.8, hang: true, ns: true }); }
    // banners round the Concourse and the Arena; banners and benches in the Approach
    [hub].forEach(function (b) { for (var zz = b.z0; zz <= b.z1; zz++) for (var xx = b.x0; xx <= b.x1; xx++) { var w = wallOf(xx, zz); if (!w || g[zz][xx] !== '.' || reg[zz][xx] !== b.id || ((xx + zz) % 7)) continue; banner(xx, zz, w); } });
    for (zz = afield.z0; zz <= afield.z1; zz++) for (xx = afield.x0; xx <= afield.x1; xx++) { var w2 = wallOf(xx, zz); if (w2 && g[zz][xx] === '.' && (xx * 7 + zz) % 9 === 0) banner(xx, zz, w2, 'Banner_2'); }
    for (zz = appr.z0 + 4; zz < appr.z1; zz += 8) { var bw = wallOf(appr.x0 + 1, zz); if (g[zz][appr.x0 + 1] === '.') dec(appr.x0 + 1, zz, 'Banner_1', { rot: Math.PI / 2, dx: -0.46, y: 1.48, fit: 0.9, hang: true, ns: true }); }

    // ================= more life in every zone =================
    // office and studio hallways: benches, plants, bins, a mini fridge, wall lamps, the occasional notice board
    function hallDress(hall, every) { var n = 0; wallSpots(hall).forEach(function (p) { if (rnd() > 1 / every) return; var x = p[0], z = p[1], w = wallOf(x, z); if (!w || !freeT(x, z, hall)) return; n++;
      var k = rnd();
      if (k < 0.3) F(x, z, 'benchCushion', 0.95, wr(w), 'Bench', { dx: w[0] * 0.15, dz: w[1] * 0.15 });
      else if (k < 0.52) dec(x, z, pick(['pottedPlant', 'plantSmall1', 'plantSmall3']), { fit: 0.45, rot: rnd() * 6, dx: w[0] * 0.3, dz: w[1] * 0.3 });
      else if (k < 0.66) dec(x, z, 'trashcan', { fit: 0.3, dx: w[0] * 0.3, dz: w[1] * 0.3 });
      else if (k < 0.74) F(x, z, 'kitchenFridgeSmall', 0.55, wr(w), 'Mini fridge', { dx: w[0] * 0.2, dz: w[1] * 0.2 });
      else if (k < 0.84) dec(x, z, 'coatRackStanding', { fit: 0.4, dx: w[0] * 0.3, dz: w[1] * 0.3 });
      else banner(x, z, w);
      if (rnd() < 0.5) dec(x, z, 'lampWall', { fit: 0.3, rot: wr(w), dx: w[0] * 0.44, dz: w[1] * 0.44, y: 1.15, hang: true, ns: true });
    }); return n; }
    hallDress(pc.halls, 7); hallDress(uh.halls, 6);
    // the Concourse and the halls: benches, bins and lamp posts
    HALLS.concat([hub]).forEach(function (b) { wallSpots(b).forEach(function (p) { if (rnd() > (b === hub ? 0.25 : 0.06)) return; var x = p[0], z = p[1], w = wallOf(x, z); if (!w || !freeT(x, z, b)) return; var k = rnd();
      if (k < 0.4) obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); else if (k < 0.7) obj(x, z, 'Torch_Metal', hug(w, { h: 1.5 }), 'Lamp post'); else dec(x, z, pick(['Barrel', 'Crate_Wooden', 'Bucket_Metal']), { fit: 0.5, rot: rnd() * 6, dx: w[0] * 0.25, dz: w[1] * 0.25 }); }); });
    // the Warrens: boulders, puglin hoards of bottle caps, gnawed bones and snack sacks
    caves.forEach(function (c) { if (c === wboss) return;
      for (var k = 0; k < ri(1, 3); k++) { var sp = spotNear(c); if (sp && rnd() < 0.8) { var x2 = sp[0] + ri(-2, 2), z2 = sp[1] + ri(-2, 2); if (freeT(x2, z2, c)) obj(x2, z2, 'Rock_Medium_' + ri(1, 3), { fit: 0.8 + rnd() * 0.3, rot: rnd() * 6 }, 'Boulder'); } }
      for (k = 0; k < ri(2, 4); k++) { var x3 = ri(c.x0 + 1, c.x1 - 1), z3 = ri(c.z0 + 1, c.z1 - 1); if (freeT(x3, z3, c)) dec(x3, z3, pick(['Coin_Pile', 'Bag', 'Vase_Rubble_Medium', 'Bucket_Wooden_1', 'Rope_2']), { fit: 0.32, rot: rnd() * 6, ns: true }); }
    });
    (function () { var c = center(wboss); // Grik's throne: a big chair on crates, bottle caps everywhere
      if (freeT(c[0], wboss.z0 + 2, wboss)) obj(c[0], wboss.z0 + 2, '#throne', { rot: 0 }, 'Grik\'s throne');
      for (var k = 0; k < 18; k++) { var x2 = c[0] + ri(-7, 7), z2 = c[1] + ri(-5, 5); if (freeT(x2, z2, wboss)) dec(x2, z2, pick(['Coin_Pile', 'Coin_Pile_2', 'Coin_Pile']), { fit: 0.35 + rnd() * 0.2, rot: rnd() * 6, ns: true }); }
      alongWall(wboss, 4, function (x, z, w) { banner(x, z, w, 'Banner_2'); return true; });
    })();
    // the Archive: lost pages floating in the water, reading desks in the dry halls
    for (zz = ARZ.z0; zz <= ARZ.z1; zz++) for (xx = ARZ.x0; xx <= ARZ.x1; xx++) if (g[zz][xx] === '~' && rnd() < 0.035) dec(xx, zz, pick(['Scroll_1', 'Scroll_2', 'Book_5']), { fit: 0.3, rot: rnd() * 6, y: 0.02, ns: true });
    ahalls.forEach(function (hr) { if (hr.type === 'boss') return; var sp = spotNear(hr, [[0, 0], [0, 1]]); if (sp) { obj(sp[0], sp[1], 'Table_Large', { fit: 1.0 }, 'Reading desk'); onTable(sp[0], sp[1], ['Book_Stack_1', 'Candle_1', 'Scroll_2']); dec(sp[0], sp[1] + 1, 'Chair_1', { fit: 0.42, rot: Math.PI, dz: -0.25 }); } });
    // the Arena: racks of weapons, cages and supply barrels round the edge of the sand
    for (var ak = 0; ak < 40; ak++) { var aa = ak / 40 * Math.PI * 2, ax = Math.round(acx + Math.cos(aa) * 24.5), az = Math.round(acz + Math.sin(aa) * 20.5); if (!freeT(ax, az, afield) || ak % 5) continue;
      var kk = (ak / 5) % 4; if (kk === 0) obj(ax, az, 'WeaponStand', { fit: 1.0, rot: aa + Math.PI / 2 }, 'Weapon rack'); else if (kk === 1) obj(ax, az, 'Cage_Small', { fit: 0.8, rot: aa }, 'Cage'); else if (kk === 2) obj(ax, az, 'Barrel', { fit: 0.62 }, 'Barrel'); else obj(ax, az, 'Peg_Rack', { fit: 0.95, rot: aa + Math.PI / 2 }, 'Rack'); }
    for (ak = 0; ak < 14; ak++) { var sx = acx + ri(-18, 18), sz = acz + ri(-14, 14); if (freeT(sx, sz, afield) && Math.hypot(sx - acx, sz - acz) > 4) dec(sx, sz, pick(['Shield_Wooden', 'Sword_Bronze', 'Axe_Bronze', 'Vase_Rubble_Medium']), { fit: 0.5, rot: rnd() * 6, rx: Math.PI / 2, y: 0.04, ns: true }); }
    // the Gate: a chandelier in the gatehouse, shields on the Approach walls, trophies on stands
    dec(GOX + 32, GOZ + 16, 'Chandelier', { y: 2.4, fit: 1.4, hang: true, ns: true });
    for (zz = appr.z0 + 2; zz < appr.z1; zz += 6) { if (freeT(appr.x1 - 1, zz, appr)) dec(appr.x1 - 1, zz, 'Shield_Wooden', { rot: -Math.PI / 2, dx: 0.44, y: 1.1, fit: 0.6, hang: true, ns: true }); }
    alongWall(troph, 4, function (x, z, w) { dec(x, z, pick(['Shield_Wooden', 'Sword_Bronze', 'Axe_Bronze']), { rot: wr(w), dx: w[0] * 0.44, dz: w[1] * 0.44, y: 1.1, fit: 0.6, hang: true, ns: true }); return true; });

    // ---------- tidy up: anything you cannot walk to becomes rock; spawns must stand on reachable floor ----------
    var seen = new Uint8Array(Wd * Hd), q = [start.x + start.z * Wd]; seen[q[0]] = 1;
    var PASS = { '.': 1, ',': 1, '~': 1, 'D': 1, 'H': 1, 'S': 1, '@': 1 };
    while (q.length) { var cur = q.pop(), cx4 = cur % Wd, cz4 = (cur / Wd) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var nx2 = cx4 + dd[0], nz2 = cz4 + dd[1], k2 = nx2 + nz2 * Wd; if (!inb(nx2, nz2) || seen[k2] || !PASS[g[nz2][nx2]]) return; seen[k2] = 1; q.push(k2); }); }
    var lost = 0;
    for (zz = 1; zz < Hd - 1; zz++) for (xx = 1; xx < Wd - 1; xx++) if (isFloor(g[zz][xx]) && !seen[xx + zz * Wd]) { g[zz][xx] = '#'; lost++; }
    spawns = spawns.filter(function (sp) { var c = g[sp.z] && g[sp.z][sp.x]; return (c === '.' || c === ',') && seen[sp.x + sp.z * Wd]; });
    function Z_owns(Z, xx, zz) { return !!Z.rids[reg[zz][xx]]; }
    function connectAll(list, link, extra) { // a spanning tree by distance, plus a few extra loops
      var joined = [list[0]], left = list.slice(1);
      while (left.length) {
        var best = null, bd = 1e9;
        left.forEach(function (a) { joined.forEach(function (b) { var ca = center(a), cb = center(b), dd = Math.abs(ca[0] - cb[0]) + Math.abs(ca[1] - cb[1]); if (dd < bd) { bd = dd; best = [a, b]; } }); });
        link(center(best[0]), center(best[1])); joined.push(best[0]); left.splice(left.indexOf(best[0]), 1);
      }
      for (var e = 0; e < extra && list.length > 3; e++) { var a = pick(list), b = pick(list); if (a !== b) link(center(a), center(b)); }
    }
    var map = g.map(function (row) { return row.join(''); });
    for (var dk in decor) { var dp = dk.split(','), dc = g[+dp[1]][+dp[0]]; if (dc === '#') delete decor[dk]; }
    return { W: Wd, H: Hd, map: map, reg: reg, rooms: rooms, spawns: spawns, start: start, hoods: zones, stairs: stairs, lost: lost, decor: decor, dname: dname, wstyle: wstyle, links: links };

    // ===================== building templates, used by both floors =====================
    // downloaded models face different ways; these turn them so their front faces the room (props2 kit)
    // park a vehicle: cars take 3 x 2 tiles along ax, the motorbike 2 x 1
    function park(x, z, model, ax, name) {
      var bike = model === 'motorcycle', L = bike ? 2 : 3, Wd2 = bike ? 1 : 2, ts = [];
      for (var a = 0; a < L; a++) for (var b = 0; b < Wd2; b++) ts.push(ax === 'x' ? [x + a, z + b] : [x + b, z + a]);
      if (!ts.every(function (t) { return freeT(t[0], t[1]); })) return false;
      ts.forEach(function (t) { g[t[1]][t[0]] = 'o'; dname[t[0] + ',' + t[1]] = name; });
      dec(x, z, model, { fit: bike ? 1.7 : 3.1, rot: (ax === 'x' ? Math.PI / 2 : 0) + CAR_ROT + (rnd() < 0.5 ? Math.PI : 0), dx: ax === 'x' ? (L - 1) / 2 : (Wd2 - 1) / 2, dz: ax === 'x' ? (Wd2 - 1) / 2 : (L - 1) / 2 });
      return true;
    }
      // stamp a template: (ox, oz) is the top-left of where it lands; rot turns the front: 0 south, 1 west, 2 north, 3 east
      // Template letters (walls and floors): # wall · W window · D door · ? secret door · ] western flat · [ starship panel
      //   . floor · = boardwalk · r railing · ~ water · | pillar · space: leave the ground as it is
      // Old West: B bar · s stool · S bottle shelf · P piano · T table · G card table · K counter · x crate · o barrel · C cabinet
      //   h shelf · d desk · e bed · j cell bars · V safe · F produce · n bench · A altar · H hitching rail · w trough · M weapon rack
      //   ! workbench · a anvil · & forge · J cauldron · R barrel to search · % crate to search · k stairs · $ stairs to the next floor
      // Modern: q desk with computer · f filing cabinet · m table and chairs · u couch · y TV or screen · l floor lamp · ; coat rack
      //   z counter · Z fridge · O stove · i sink · c coffee machine · v vending machine · * free food · b bunk bed · E double bed
      //   N nightstand · X toilet · Q shower · t bookcase · ^ fireplace · + chandelier · " portrait · p plant · L wall lamp
      // Sets: I console · _ captain's chair · 0 transporter pad · 9 reactor · { riding mower · } flag on the green
      //   ( camera crane · ) studio light · ` director's chair
      function stamp(T, ox, oz, rot, Z, o) {
        o = o || {};
        var R = T.rows, h = R.length, w = R[0].length, i, j, c, p, wsBase = T.wall || 'timber';
        R.forEach(function (row, k) { if (row.length !== w) throw new Error('template ' + T.name + ' row ' + k + ' is ' + row.length + ' wide, not ' + w); });
        function at(ci, rj) { return rot === 0 ? [ox + ci, oz + rj] : rot === 1 ? [ox + (h - 1 - rj), oz + ci] : rot === 2 ? [ox + (w - 1 - ci), oz + (h - 1 - rj)] : [ox + rj, oz + (w - 1 - ci)]; }
        var fv = [[0, 1], [-1, 0], [0, -1], [1, 0]][rot], frot = Math.atan2(fv[0], fv[1]);
        var a = at(0, 0), b = at(w - 1, h - 1), bb = { x0: Math.min(a[0], b[0]), z0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), z1: Math.max(a[1], b[1]) };
        var nm = o.name || T.name, theme = T.theme || 'store';
        var rm = room({ tpl: true, name: nm, type: o.type || T.type || 'room', theme: theme, line: o.line || T.line, x0: bb.x0, z0: bb.z0, x1: bb.x1, z1: bb.z1 }, Z);
        var porch = null; if (R.some(function (row) { return /=/.test(row); })) porch = room({ name: nm + ' Porch', type: 'corridor', theme: 'porch', x0: bb.x0, z0: bb.z0, x1: bb.x1, z1: bb.z1, line: 'A porch with a railing. Good for leaning on and watching the street.' }, Z);
        var lastWall = -1; for (j = 0; j < h; j++) if (/D/.test(R[j]) && !/D/.test(R.slice(j + 1).join(''))) lastWall = j;
        var col = o.wallCol || T.wallCol, extra = (col ? ':c=' + col.toString(16) : '') + (T.stripe ? ':s=' + T.stripe.toString(16) : '');
        // pass 1: walls, floors, doors
        for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
          c = R[j].charAt(i); p = at(i, j); var x = p[0], z = p[1]; if (c === ' ' || !inb(x, z)) continue;
          if (c === '#' || c === 'W' || c === ']' || c === '[') {
            g[z][x] = '#'; reg[z][x] = -1;
            wstyle[x + ',' + z] = c === ']' ? 'timber:front' : c === '[' ? 'panel' : wsBase + (c === 'W' ? ':win' : '') + (j === lastWall && wsBase === 'timber' ? ':front' : '') + extra;
            continue;
          }
          if (c === '?') { g[z][x] = 'H'; reg[z][x] = -1; wstyle[x + ',' + z] = wsBase + extra; continue; }
          if (c === 'D') { g[z][x] = 'D'; reg[z][x] = rm.id; continue; }
          if (c === '=' || c === 'r' || (c === 'H' && j > lastWall && lastWall >= 0)) { if (c !== 'H') { g[z][x] = '.'; reg[z][x] = porch ? porch.id : rm.id; } continue; }
          reg[z][x] = rm.id;
          g[z][x] = c === '~' ? '~' : c === '*' ? 'F' : c === '$' ? 'S' : c === '|' ? 'P' : c === 'X' ? 'X' : c === 'R' ? 'R' : c === '%' ? 'K' : c === 'J' ? 'q' : c === 'U' ? 'U' : c === '6' ? 'B' : '.';
          if (c === '$') rm.stairsDown = [x, z];
        }
        var all = [rm];
        (T.areas || []).forEach(function (ar) { var q0 = at(ar.c0, ar.r0), q1 = at(ar.c1, ar.r1);
          var sr = room({ tpl: true, name: ar.name, type: ar.type || o.type || T.type || 'room', theme: ar.theme || theme, line: ar.line, x0: Math.min(q0[0], q1[0]), z0: Math.min(q0[1], q1[1]), x1: Math.max(q0[0], q1[0]), z1: Math.max(q0[1], q1[1]) }, Z);
          if (sr.type === 'room' && rm.type === 'boss' && !ar.type) sr.type = 'room';
          for (var zz2 = sr.z0; zz2 <= sr.z1; zz2++) for (var xx2 = sr.x0; xx2 <= sr.x1; xx2++) if (reg[zz2][xx2] >= 0 && all.some(function (q) { return q.id === reg[zz2][xx2]; })) reg[zz2][xx2] = sr.id;
          all.push(sr); });
        (T.rugs || []).forEach(function (ru) { var q0 = at(ru[0], ru[1]), q1 = at(ru[2], ru[3]), x0 = Math.min(q0[0], q1[0]), z0 = Math.min(q0[1], q1[1]), rw = Math.abs(q1[0] - q0[0]) + 1, rd = Math.abs(q1[1] - q0[1]) + 1;
          dec(x0 + (rw >> 1), z0 + (rd >> 1), '#rug', { w: rw, d: rd, col: ru[4] }); });
        // pass 2: furniture, now the walls are in so things can find the wall behind them
        var tchar = {}; for (j = 0; j < h; j++) for (i = 0; i < w; i++) { p = at(i, j); tchar[p[0] + ',' + p[1]] = R[j].charAt(i); }
        function same(x, z, ch2) { return tchar[x + ',' + z] === ch2; }
        function axis(x, z, ch2) { return same(x - 1, z, ch2) || same(x + 1, z, ch2) || g[z][x - 1] === '#' || g[z][x + 1] === '#' ? 'x' : 'z'; }
        function chairsAround(x, z, m, skip) { [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (q) { var cx = x + q[0], cz = z + q[1]; if (skip && same(cx, cz, skip)) return; if (g[cz][cx] === '.' && !taken[cx + ',' + cz] && !nearDoor(cx, cz) && !/[mTGqd]/.test(tchar[cx + ',' + cz] || '') && rnd() < 0.9) dec(cx, cz, m || 'Chair_1', { fit: 0.42, rot: Math.atan2(-q[0], -q[1]) + (rnd() - 0.5) * 0.3, dx: -q[0] * 0.18, dz: -q[1] * 0.18 }); }); }
        function facing(wl) { return wl ? Math.atan2(-wl[0], -wl[1]) : frot; }
        function hugOr(wl, opt) { return wl ? hug(wl, opt) : (function () { opt.rot = frot; return opt; })(); }
        var signDone = false;
        for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
          c = R[j].charAt(i); p = at(i, j); var x2 = p[0], z2 = p[1]; if (!inb(x2, z2)) continue;
          var wl = wallOf(x2, z2), face = facing(wl);
          switch (c) {
            case 'B': F(x2, z2, 'kitchenBar', 0.98, frot, 'Bar'); break;
            case 'K': F(x2, z2, 'kitchenBar', 0.98, frot, 'Counter'); break;
            case 's': dec(x2, z2, 'stoolBar', { fit: 0.3, rot: rnd() }); break;
            case 'S': obj(x2, z2, rnd() < 0.7 ? 'Shelf_Small_Bottles' : 'Shelf_Simple', hugOr(wl, { fit: 0.95 }), 'Bottle shelf'); break;
            case 'P': obj(x2, z2, 'piano', { fit: 1.35, rot: face + PIANO_ROT, dx: wl ? wl[0] * 0.12 : 0, dz: wl ? wl[1] * 0.12 : 0 }, 'Piano'); break;
            case 'T': F(x2, z2, 'tableRound', 0.9, 0, 'Table'); chairsAround(x2, z2); break;
            case 'G': obj(x2, z2, '#felt', {}, 'Card table'); chairsAround(x2, z2); if (rnd() < 0.6) dec(x2, z2, 'Coin_Pile', { y: 0.76, fit: 0.18, dx: 0.12 }); break;
            case 'k': { // one staircase across the whole block of k tiles, rising toward the back
              var ks = [], kq = [[i, j]], seenK = {}; while (kq.length) { var kc = kq.pop(), kk = kc[0] + ',' + kc[1]; if (seenK[kk] || kc[0] < 0 || kc[1] < 0 || kc[0] >= w || kc[1] >= h || R[kc[1]].charAt(kc[0]) !== 'k') continue; seenK[kk] = 1; ks.push(kc); kq.push([kc[0] + 1, kc[1]], [kc[0] - 1, kc[1]], [kc[0], kc[1] + 1], [kc[0], kc[1] - 1]); }
              var first = ks.reduce(function (m, q) { return q[1] < m[1] || (q[1] === m[1] && q[0] < m[0]) ? q : m; }, ks[0]);
              if (first[0] !== i || first[1] !== j) { obj(x2, z2, '#none', {}, 'Stairs'); break; }
              var cs = ks.map(function (q) { return at(q[0], q[1]); }), kx0 = Math.min.apply(null, cs.map(function (q) { return q[0]; })), kx1 = Math.max.apply(null, cs.map(function (q) { return q[0]; })), kz0 = Math.min.apply(null, cs.map(function (q) { return q[1]; })), kz1 = Math.max.apply(null, cs.map(function (q) { return q[1]; }));
              var cols = ks.map(function (q) { return q[0]; }), rowsK = ks.map(function (q) { return q[1]; }), sw = Math.max.apply(null, cols) - Math.min.apply(null, cols) + 1, sd = Math.max.apply(null, rowsK) - Math.min.apply(null, rowsK) + 1;
              // rise toward the template's back unless the stairs sit against a side wall
              obj(x2, z2, '#stairs', { rot: frot, w: sw, d: sd, dx: (kx0 + kx1) / 2 - x2, dz: (kz0 + kz1) / 2 - z2 }, 'Stairs'); rm.stairsT = cs; break; }
            case 'L': if (wl) dec(x2, z2, wsBase === 'plaster' || wsBase === 'siding' || wsBase === 'panel' || wsBase === 'canvas' ? 'lampWall' : 'Lantern_Wall', { fit: 0.32, rot: Math.atan2(-wl[0], -wl[1]), dx: wl[0] * 0.4, dz: wl[1] * 0.4, y: 1.0, hang: true, ns: true }); break;
            case 'x': obj(x2, z2, wsBase === 'panel' ? 'Crate_Metal' : 'Crate_Wooden', { fit: 0.75, rot: rnd() * 0.5 }, 'Crate'); break;
            case 'o': obj(x2, z2, 'Barrel', { fit: 0.62, rot: rnd() * 6 }, 'Barrel'); break;
            case 'C': obj(x2, z2, wsBase === 'siding' || wsBase === 'plaster' ? 'bookcaseClosedWide' : 'Cabinet', hugOr(wl, { fit: 0.8 }), 'Cabinet'); break;
            case 'h': obj(x2, z2, pick(['Shelf_Simple', 'Shelf_Small_Bottles', 'Bookcase_2']), hugOr(wl, { fit: 0.95 }), 'Shelf'); break;
            case 't': obj(x2, z2, 'Bookcase_2', hugOr(wl, { fit: 0.95 }), 'Bookcase'); break;
            case 'd': obj(x2, z2, 'Table_Large', { fit: 0.95, rot: frot }, 'Desk'); onTable(x2, z2, [pick(['Scroll_1', 'Book_Stack_1', 'Candle_1']), 'Mug']); break;
            case 'e': obj(x2, z2, wsBase === 'panel' ? 'bedSingle' : 'Bed_Twin1', hugOr(wl, { fit: 0.9 }), 'Bed'); break;
            case 'E': obj(x2, z2, 'bedDouble', hugOr(wl, { fit: 1.0 }), 'Bed'); break;
            case 'N': dec(x2, z2, 'sideTableDrawers', wl ? hug(wl, { fit: 0.42 }) : { fit: 0.42 }); break;
            case 'b': obj(x2, z2, 'bedBunk', hugOr(wl, { fit: 0.95 }), 'Bunk bed'); break;
            case 'j': obj(x2, z2, '#bars', { ax: axis(x2, z2, 'j') }, 'Cell bars'); break;
            case 'V': obj(x2, z2, 'Chest_Wood', hugOr(wl, { fit: 0.7 }), 'Safe'); break;
            case 'F': obj(x2, z2, pick(['FarmCrate_Apple', 'FarmCrate_Carrot', 'Barrel_Apples']), { fit: 0.55, rot: rnd() * 0.6 }, 'Produce'); break;
            case 'p': dec(x2, z2, pick(['pottedPlant', 'plantSmall2', 'Plant_1']), { fit: 0.45, rot: rnd() * 6 }); break;
            case 'n': obj(x2, z2, 'Bench', { fit: 1.0, rot: axis(x2, z2, 'n') === 'x' ? 0 : Math.PI / 2 }, /Chapel/.test(nm) ? 'Pew' : /Showrunner/.test(nm) ? 'Audience bleachers' : 'Bench'); break;
            case 'A': obj(x2, z2, 'Table_Large', { fit: 0.95, rot: frot }, 'Altar'); dec(x2, z2, 'CandleStick_Triple', { y: TOP, fit: 0.3 }); break;
            case 'r': obj(x2, z2, '#rail', { ax: axis(x2, z2, 'r'), col: wsBase === 'siding' ? 0xf4f0e6 : undefined }, 'Railing'); break;
            case 'H': if (freeT(x2, z2)) obj(x2, z2, '#hitch', { ax: rot === 1 || rot === 3 ? 'z' : 'x' }, 'Hitching rail'); break;
            case 'w': obj(x2, z2, '#trough', { ax: axis(x2, z2, 'w') }, 'Water trough'); break;
            case 'M': obj(x2, z2, 'WeaponStand', hugOr(wl, { fit: 1.0 }), 'Weapon rack'); break;
            case '!': obj(x2, z2, 'Workbench', { fit: 1.2, rot: face }, 'Workbench'); break;
            case 'a': obj(x2, z2, 'Anvil', { fit: 0.7, rot: 0.3 }, 'Anvil'); break;
            case '&': obj(x2, z2, '#forge', { rot: face }, 'Forge'); break;
            case 'q': { var dr = wl ? [-wl[0], -wl[1]] : fv, drot = Math.atan2(dr[0], dr[1]), rnm = ((rooms[reg[z2][x2]] || {}).name) || '';
              var dmod = /Cubicle|Overtime/.test(rnm) ? 'cubicle' : /Head Writer|Steward/.test(rnm) ? 'officeDesk' : T.desk || 'desk';
              if (dmod === 'cubicle' || dmod === 'officeDesk') { F(x2, z2, dmod, 1.0, drot + DESK_ROT[dmod], dmod === 'cubicle' ? 'Cubicle' : 'Desk'); break; }
              if (F(x2, z2, dmod, 0.98, drot + (DESK_ROT[dmod] || 0), 'Desk')) { onTop(x2, z2, 'computerScreen', { m: dmod, fit: 0.98 }, { fit: 0.42, rot: drot, dx: -dr[0] * 0.1, dz: -dr[1] * 0.1 }); onTop(x2, z2, 'computerKeyboard', { m: dmod, fit: 0.98 }, { fit: 0.34, rot: drot, dx: dr[0] * 0.12, dz: dr[1] * 0.12 });
                var chx = x2 + dr[0], chz = z2 + dr[1]; if (g[chz] && g[chz][chx] === '.' && !taken[chx + ',' + chz]) dec(chx, chz, 'chairDesk', { fit: 0.5, rot: drot + Math.PI + (rnd() - 0.5) * 0.6, dx: -dr[0] * 0.18, dz: -dr[1] * 0.18 }); } break; }
            case 'f': F(x2, z2, 'bookcaseClosedWide', 0.95, face, 'Filing cabinet', wl ? { dx: wl[0] * 0.22, dz: wl[1] * 0.22 } : {}); break;
            case 'm': if (F(x2, z2, 'table', 0.98, 0, 'Table')) { chairsAround(x2, z2, 'chairCushion', 'm'); if (rnd() < 0.4) onTop(x2, z2, pick(['mug', 'books', 'laptop']), { m: 'table', fit: 0.98 }, { fit: 0.25, rot: rnd() * 6 }); } break;
            case 'u': F(x2, z2, 'loungeSofa', 0.98, face, 'Couch', wl ? { dx: wl[0] * 0.1, dz: wl[1] * 0.1 } : {}); break;
            case 'y': if (F(x2, z2, 'cabinetTelevision', 0.95, face, /Bridge/.test(nm) || wsBase === 'panel' ? 'Viewscreen' : 'TV', wl ? { dx: wl[0] * 0.24, dz: wl[1] * 0.24 } : {})) dec(x2, z2, 'televisionModern', { on: { m: 'cabinetTelevision', fit: 0.95 }, fit: 0.85, rot: face, dx: wl ? wl[0] * 0.28 : 0, dz: wl ? wl[1] * 0.28 : 0 }); break;
            case 'l': dec(x2, z2, 'lampRoundFloor', { fit: 0.4 }); break;
            case ';': dec(x2, z2, 'coatRackStanding', { fit: 0.42, rot: rnd() }); break;
            case 'z': F(x2, z2, 'kitchenCabinet', 0.98, face, 'Counter', wl ? { dx: wl[0] * 0.06, dz: wl[1] * 0.06 } : {}); break;
            case 'Z': F(x2, z2, 'kitchenFridgeLarge', 0.9, face, 'Fridge', wl ? { dx: wl[0] * 0.1, dz: wl[1] * 0.1 } : {}); break;
            case 'O': F(x2, z2, 'kitchenStove', 0.98, face, 'Stove', wl ? { dx: wl[0] * 0.06, dz: wl[1] * 0.06 } : {}); break;
            case 'i': F(x2, z2, wsBase === 'siding' && /Bathroom|Upstairs/.test(nm) ? 'bathroomSink' : 'kitchenSink', 0.8, face, 'Sink', wl ? { dx: wl[0] * 0.1, dz: wl[1] * 0.1 } : {}); break;
            case 'c': if (F(x2, z2, 'kitchenCabinet', 0.98, face, 'Coffee machine', wl ? { dx: wl[0] * 0.06, dz: wl[1] * 0.06 } : {})) dec(x2, z2, 'kitchenCoffeeMachine', { on: { m: 'kitchenCabinet', fit: 0.98 }, fit: 0.32, rot: face }); break;
            case 'v': F(x2, z2, 'kitchenFridgeLarge', 0.9, face, 'Vending machine', wl ? { dx: wl[0] * 0.1, dz: wl[1] * 0.1, paint: 0xb8282a } : { paint: 0xb8282a }); break;
            case 'Q': F(x2, z2, 'shower', 0.9, face, 'Shower'); break;
            case '^': obj(x2, z2, '#hearth', { rot: face, dx: wl ? wl[0] * 0.2 : 0, dz: wl ? wl[1] * 0.2 : 0 }, 'Fireplace'); break;
            case '+': dec(x2, z2, 'Chandelier', { y: 2.3, fit: 1.2, hang: true, ns: true }); break;
            case '"': if (wl) dec(x2, z2, '#portrait', { rot: Math.atan2(-wl[0], -wl[1]), dx: wl[0] * 0.42, dz: wl[1] * 0.42, seed: i * 7 + j }); break;
            case 'I': if (F(x2, z2, 'kitchenBar', 0.98, face, 'Console')) dec(x2, z2, 'computerScreen', { on: { m: 'kitchenBar', fit: 0.98 }, fit: 0.42, rot: face + Math.PI }); break;
            case '_': obj(x2, z2, 'loungeChair', { fit: 0.75, rot: frot + Math.PI }, 'Captain\'s chair'); break;
            case '0': dec(x2, z2, '#pad', { ns: true }); break;
            case '9': obj(x2, z2, '#reactor', {}, 'Warp core'); for (var rk = 0; rk < 4; rk++) { var rx3 = x2 + D4[rk][0], rz3 = z2 + D4[rk][1]; if (g[rz3][rx3] === '.') { g[rz3][rx3] = 'o'; dname[rx3 + ',' + rz3] = 'Warp core'; } } break;
            case '{': obj(x2, z2, '#mower', { rot: rnd() * 6 }, 'Riding mower'); break;
            case '}': dec(x2, z2, '#flag', { ns: true }); break;
            case '(': obj(x2, z2, '#crane', { rot: 0.6 }, 'Camera crane'); break;
            case ')': obj(x2, z2, '#klieg', { rot: Math.atan2(((bb.x0 + bb.x1) / 2) - x2, ((bb.z0 + bb.z1) / 2) - z2) }, 'Studio light'); break;
            case '`': obj(x2, z2, '#dchair', { rot: frot + Math.PI }, 'Director\'s chair'); break;
            case 'D': if (!signDone && j === lastWall && T.sign) { signDone = true; dec(x2, z2, '#sign', { text: T.sign, rot: frot, dx: fv[0] * 0.2 + (rot === 0 ? 0.5 : rot === 2 ? -0.5 : 0), dz: fv[1] * 0.2 + (rot === 1 ? 0.5 : rot === 3 ? -0.5 : 0), y: 1.72 }); } break;
          }
        }
        // reskins: the template's palette (and the caller's) repaints the main furniture on those tiles
        var pal = {}; [T.pal, o.pal].forEach(function (pp) { if (pp) for (var kp in pp) pal[kp] = pp[kp]; });
        if (Object.keys(pal).length) for (j = 0; j < h; j++) for (i = 0; i < w; i++) { c = R[j].charAt(i); if (pal[c] === undefined) continue; p = at(i, j);
          (decor[p[0] + ',' + p[1]] || []).forEach(function (d) { if (d.on || d.hang || d.m.charAt(0) === '#') return; if (/^[A-Z]/.test(d.m)) d.tint = pal[c]; else d.paint = pal[c]; }); }
        return { room: rm, porch: porch, all: all, box: bb };
      }

    // ===================== Floor 2: The Backlot =====================
    // A studio backlot: Catering Village (the one safe hub) in the middle, ringed by the Backlot Loop, with six sets
    // round it, each one short street away. Studio Drive North and South cross the lot. Soundstage 9 (the gate) is
    // north of the hub, up Director's Row. Every building is stamped from a hand-drawn template (TPL); upper floors
    // and the roof live in a strip below the lot (z 240 and down) and the stairs take you there.
    function backlot() {
      decor = {}; dname = {}; D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]]; TOP = 0.36;
      STYLE = mkStyle(); MODERN = mkModern(); for (var mk2 in MODERN) STYLE[mk2] = MODERN[mk2];
      wstyle = {}; links = {}; var upstairs = [], UPZ = 240, xx, zz, k, i;
      for (var ez = Hd; ez < 300; ez++) { g.push([]); reg.push([]); for (var ex = 0; ex < Wd; ex++) { g[ez].push('#'); reg[ez].push(-1); } } Hd = 300;
      function Zn(o) { o.idx = zones.length; o.rooms = []; o.rids = {}; zones.push(o); return o; }
      function wallT(x, z) { if (!inb(x, z)) return; g[z][x] = '#'; reg[z][x] = -1; }
      function area(o, Z, fl) { var r = room(o, Z); carveRect(r, fl); return r; }
      function trees(r, n, kinds) { for (var k = 0; k < n; k++) { var x = ri(r.x0 + 1, r.x1 - 1), z = ri(r.z0 + 1, r.z1 - 1); if (freeT(x, z, r)) obj(x, z, pick(kinds || ['CommonTree_1', 'CommonTree_3']), { fit: 2.2 + rnd() * 0.8, rot: rnd() * 6 }, 'Tree'); } }
      function greens(r, n, kinds) { for (var k = 0; k < n; k++) { var x = ri(r.x0, r.x1), z = ri(r.z0, r.z1); if (freeT(x, z, r)) dec(x, z, pick(kinds || ['Bush_Common', 'Fern_1', 'Grass_Wispy_Tall', 'Plant_7', 'Flower_3_Group']), { fit: 0.6 + rnd() * 0.5, rot: rnd() * 6, ns: true }); } }
      function lamps(r, every) { for (var zz = r.z0; zz <= r.z1; zz++) for (var xx = r.x0; xx <= r.x1; xx++) { var w = wallOf(xx, zz); if (w && freeT(xx, zz, r) && (xx * 3 + zz * 7) % every === 0) obj(xx, zz, 'Torch_Metal', hug(w, { h: 1.6 }), 'Lamp post'); } }
      function pack(r, fam, n, tier, name) { for (var k = 0; k < n; k++) spawnIn(r, fam, { tier: tier || (rnd() < 0.3 ? 2 : 1), name: name }); }
      function roomsOf(b, re) { return b.all.filter(function (r) { return re.test(r.name); }); }
      // a ring of roof round an upper floor, sloping down and away, so you can tell you're up high
      function roofRing(b, n) {
        for (var zz = b.z0 - n; zz <= b.z1 + n; zz++) for (var xx = b.x0 - n; xx <= b.x1 + n; xx++) {
          if (!inb(xx, zz) || (xx >= b.x0 && xx <= b.x1 && zz >= b.z0 && zz <= b.z1) || g[zz][xx] !== '#' || wstyle[xx + ',' + zz]) continue;
          var dl = b.x0 - xx, dr = xx - b.x1, du = b.z0 - zz, dd = zz - b.z1, m = Math.max(dl, dr, du, dd);
          wstyle[xx + ',' + zz] = 'roof:d=' + (m === dl ? 'x-' : m === dr ? 'x+' : m === du ? 'z-' : 'z+') + ':r=' + (m - 1);
        }
      }
      var GEN_MANOR = ["##W####W####W####W####W####W####W####W####W####W####W###", "#zZOizcz....h#............................#ttt.........#", "W............#.P............p...........p.#............W", "#............#............................?.....d.....^#", "#............#....|......|.....|......|...#............#", "#............#............................#V........u..#", "#.....m......#............................######D#######", "W............#L.......+...........+......L#.\"..\"..\"..\".W", "#............D............................#............#", "#............#............................DL...........#", "#............#....|......|.....|......|...#...n....n...#", "#RR........%J#............................#............#", "W............#............................#.\"..\"..\"..\".W", "######D####################DD###################D#######", "#tttt...ttttttttttttt#....kkkk....#....................#", "#t...................#p...kkkk...p#.C................C.#", "#t..................L#....kkkk....#...................L#", "Wt...................#............#.........+..........W", "#t...................#L..........L#....................#", "#t...d....d....d.....#............#....................#", "#....................D..+......+..D...mmmmmmmmmmmmmm..^#", "#t...................#............#....................#", "Wt...................#............#....................W", "#t...................#............#.........+..........#", "#t..u...l.......u...L#............#...................L#", "#t...................#n..........n#....................#", "#t..........^........#............#.C................C.#", "##W####W####W####W####W###DDDD##W####W####W####W####W###", "                    r==============r                    ", "                    r==============r                    "];
      var GEN_MANORUP = ["##W####W####W####W####W####W####W####W####W####W####W###", "#E.N......C#E.N......C#tt........#E.N......C#XXQi......#", "W..........#..........#..........#..........#..........W", "#..........#..........#.....d....#..........#..........#", "#..........#..........#..........#..........#..........#", "#l........;#e..x....x.#.........u#l........;#.........C#", "#####D##########D##########D##########D##########D######", "W.L.................+.....kkkk......+................L.W", "#...........\".............kkkk.............\"...........#", "#......................................................#", "#####D##########D#######D#############D##########D######", "#e.N......C#E.N......C#x..x......#e.N......C#E.N......C#", "W..........#..........#..........#..........#..........W", "#..........#..........#........o.#..........#..........#", "#..........#..........#..........#..........#..........#", "#l........;#l........;#.%...x....#l........;#l........;#", "##W####W####W####W####W####W####W####W####W####W####W###"];
      var GEN_SHIP = ["##W#####W#####W#####W#####W#####W#####W#####W#####W#####W#####W###", "#....................#..y.y.y........y.y.y..#....................#", "W...................p#......................#....................W", "#....................#......................#...q...q...q........#", "#y...................#...I.I..........I.I...#...................f#", "#.....mmmmmmmmm......D......................D....................#", "#....................#.........._...........#...............J....#", "#....................#.L.....I......I.....L.#....................#", "W....................#......................#.ttt................W", "###############################DDDD###############################", "#e.e.e........C#E.N..........;#....#..............#..............#", "#..............#..............#....#..............#..0.0.0.......#", "#..............#..............#....#..............#..............#", "#..............#..............D....D..............#..............#", "W......q.......#.........d....#....#..............#....I.........W", "#..............#..............#....#..............#..............#", "#.............C#............u.#....#..............#..............#", "########D#############D########....#######D##############D########", "#................................................................#", "#................................................................#", "W#########D##############D#####....##########D#########D#########W", "#zZOicz..............#u.....y.#....#b.b.b.b.b.b.b.b.b.b.b.b.b.b.b#", "#...................v#........#....#.............................#", "#....................#........#....#.............................#", "#...m...m...m...m....#........D....D.............................#", "#....................#........#....#.............................#", "W....................#........#....#.............................W", "#....................#........#....#b.b.b.b.b.b.b.b.b.b.b.b.b.b.b#", "###############################....###############################", "#.............................#....#.............................#", "#.xx....xx.%........x.......R.#....#........I...........I........#", "#.x...........................#....#.............................#", "W.............................D....D..............9..............W", "#........................xxx..#....#.............................#", "#....%........xx..R...%.......#....#h...........................h#", "#.............................#....#.............................#", "##W#####W#####W#####W#####W####DDDD###W#####W#####W#####W#####W###", "                                                                  "];
      var GEN_WRITERS = ["##W###W###W###W###W###W###W###W###W###W###W###W###W###W###W###", "#..............#..............#t.t.t.t.t.t.t.#...............#", "Wy.............#y.............#..............#............f..W", "#..............#..............#..............#...............#", "#..............#..............#..............#......q........#", "#...mmmmmmmm...#...mmmmmmmm...#.......d......#...............#", "W..............#..............#..............#...............W", "#..............#..............#..............#...............#", "#..............#..............#..............#....{..........#", "#..............#..............#..............#.u.........p...#", "W..............#..............#t.t.t.t.t.t.t.#...............W", "#######D##############D##############D###############D########", "D............................................................#", "#............................................................#", "W#########D###################D###################D##########W", "#f......................................p#zZOicz.............#", "#..q...q...q...q...q...q...q...q...q...q.#...................#", "#........................................#..................u#", "W........................................#...................W", "#..q...q...q...q...q...q...q...q...q...q.#....m...m..........#", "#........................................#...................#", "#........................................#...................#", "W..q...q...q...q...q...q...q...q...q...q.#..............vv...W", "#f.......................................#...................#", "############D#################D###################D###########", "#............................................................D", "W............................................................W", "############D#################DD##################D###########", "#xx....................#p.........kk.p#fff.............fff...#", "#......................#..........kk..#......................#", "W......................#..............#......................W", "#...m...m...m...m......#..............#......................#", "#......................#..KKKKKK......#......q......q........#", "#......................#..............#......................#", "W......................#..............#......................W", "#......................#.u..........u.#......................#", "#x....................;#..............#.x%..................x#", "##W###W###W###W###W###W###W##DDDD#W###W###W###W###W###W###W###"];
      var GEN_ROOF = ["########################################", "#......................................#", "#.p..................................H.#", "#....................................p.#", "#.......{..............................#", "#......................................#", "#........................}.............#", "#......................................#", "#......................................#", "#......................................#", "#......................................#", "#......................................#", "#......................................#", "#......................................#", "#############..........................#", "#...........#..........................#", "#.zZic.....C#..........................#", "#...........#..........................#", "#...........D..................#########", "#.....m.....#..................#.kk...##", "#...........#..................D.kk...##", "#.X.......u.#..................#....L.##", "#...........#..................#########", "########################################"];
      var GEN_STAGE = ["##############################################################", "###############................................###############", "##yyIIIy......#................................#............##", "##............#................................#............##", "##............#................................#............##", "##............#................................#............##", "##...q...q....D................................#......$.....##", "##............#................................#............##", "##..........f.#................................D............##", "###############................................#............##", "#..............................................#............##", "#..............................................###############", "#.).................)....................)...................#", "#..........................................................).#", "#............................................................#", "#............................................................#", "#..]]]].]]]]]].]]]]]].]]]]...........[[[[[.[[[[[.[[[[[.[[[[..#", "#..H.....H.....H.....H.......................................#", "#.......................................I.....I.....I........#", "#............................................................#", "#............................................................#", "#............................................................#", "#.........o...................(..............................#", "#.................R..........................................#", "#............................................................#", "#............................................................#", "#.........................................0.....0............#", "#............................................................#", "#.........o...................`..............................#", "#.................R..........................................#", "#............................................................#", "#.....x%.....................................................#", "#............................................................#", "#............................................................#", "#............................................................#", "#............................................................#", "#.)........................................................).#", "#.......................m.x........x.........................#", "#............................................................#", "#############################DDDD#############################"];
      var TPL = {
        saloon: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'The Saloon', sign: 'SALOON', line: 'Swinging doors, a long bar, a piano that plays itself badly and three card games nobody is winning.',
          areas: [{ name: 'Saloon Storeroom', c0: 11, r0: 1, c1: 15, r1: 4 }, { name: 'The Back Room', c0: 17, r0: 1, c1: 20, r1: 4 }], rugs: [[9, 6, 11, 13, 0x7a2a1e]], rows: [
          '######W#####W#########',
          '#SSSSSS...#xx.o.#e..e#',
          '#.........#.....#....#',
          '#BBBBBB...D..o..D....#',
          '#s.s.s....#xo...#C..d#',
          '#.........#######D####',
          '#L.................kk#',
          'W.....G.......T....kk#',
          '#....................#',
          '#..T.........G.......W',
          '#....................#',
          '#P.......T..........L#',
          '#L......G......T.....#',
          'W....................W',
          '#####W###DD###W#######',
          'r====================r',
          'r====================r',
          '   H      H  H      H ']
        },
        store: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'General Store', sign: 'GENERAL STORE', line: 'Shelves to the ceiling, barrels of everything and a counter with a bell nobody rings.', rows: [
          '####W#####W#####',
          '#hhhhh..hhhhhh.#',
          '#..............#',
          '#.FF..xx..oo.F.#',
          '#..............#',
          '#.hh.hh..hh.hh.#',
          '#..............#',
          '#L..KKKKK.....L#',
          '#..............#',
          '#.F..........F.#',
          '#....p....p....#',
          '####W##DD##W####',
          'r==============r',
          'r==============r',
          '  H          H  ']
        },
        bank: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'The Bank', sign: 'BANK', line: 'A bank with a vault behind bars and a teller cage. The money is fake. The vault is not.',
          areas: [{ name: 'The Vault', c0: 1, r0: 1, c1: 4, r1: 2 }, { name: 'Manager\'s Office', c0: 6, r0: 1, c1: 10, r1: 2 }], rows: [
          '############',
          '#VV.x#C..d.#',
          '#....#.....#',
          '#jjjj###D###',
          '#..........#',
          '#KKKKKKK...#',
          '#..........#',
          '#L..n..n..L#',
          '#..........#',
          '###W#DD#W###',
          'r==========r',
          'r==========r',
          '  H      H  ']
        },
        jail: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'Sheriff\'s Office', sign: 'SHERIFF', line: 'The sheriff\'s office and three cells. The cells have not been cleaned since the pilot episode.',
          areas: [{ name: 'The Cells', c0: 1, r0: 1, c1: 8, r1: 2 }], rows: [
          '##############',
          '#e.#e.#e.#hhC#',
          '#..#..#..#...#',
          '#jj#jj#jj#...#',
          '#............#',
          '#.d.......C..#',
          '#............#',
          '#L..n.n....TL#',
          '#............#',
          '####W#DD#W####',
          'r============r',
          'r============r',
          '  H        H  ']
        },
        depot: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'Train Depot', sign: 'DEPOT', line: 'A train depot with benches, a ticket window and a timetable for trains that never leave.', rows: [
          '##W####W####',
          '#L........h#',
          '#.nn..nn...#',
          '#..........#',
          '#.nn..nn...#',
          '#..........#',
          '#..KKKK....#',
          '#..d...C.x.#',
          '#L........L#',
          '###W#DD#W###',
          'r==========r',
          'r==========r']
        },
        hotel: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'The Hotel', sign: 'HOTEL', line: 'A hotel lobby, four rooms upstairs that are actually downstairs, and a guest book full of stunt doubles.',
          areas: [{ name: 'Hotel Room 1', c0: 1, r0: 1, c1: 3, r1: 2 }, { name: 'Hotel Room 2', c0: 5, r0: 1, c1: 7, r1: 2 }, { name: 'Hotel Room 3', c0: 9, r0: 1, c1: 11, r1: 2 }, { name: 'Hotel Room 4', c0: 13, r0: 1, c1: 15, r1: 2 }],
          rugs: [[8, 5, 11, 9, 0x2a4a3a]], rows: [
          '####W###W###W###W###',
          '#e.C#e.C#e.C#e.C#kk#',
          '#...#...#...#...#kk#',
          '##D###D###D###D##..#',
          '#..................#',
          '#L.......T........L#',
          '#....T.......T.....#',
          'W..................W',
          '#..KKKK.......p....#',
          '#..d.........n..n..#',
          '#L................L#',
          '####W###DD###W######',
          'r==================r',
          'r==================r',
          '  H              H  ']
        },
        telegraph: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'Telegraph Office', sign: 'TELEGRAPH', line: 'A telegraph office. The machine clicks on its own. Nobody here knows Morse code.', rows: [
          '###W##W###',
          '#h..dd..h#',
          '#........#',
          '#.KKKKKK.#',
          '#........#',
          '#L..nn..L#',
          '#........#',
          '###WDDW###',
          'r========r',
          'r========r']
        },
        saloonUp: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'Saloon Upstairs', line: 'Upstairs at the saloon: a landing and four rented rooms. The floorboards report everything you do.', theme: 'store',
          areas: [{ name: 'Room 1', c0: 1, r0: 1, c1: 4, r1: 3 }, { name: 'Room 2', c0: 6, r0: 1, c1: 9, r1: 3 }, { name: 'Room 3', c0: 11, r0: 1, c1: 14, r1: 3 }, { name: 'The Madam\'s Room', c0: 16, r0: 1, c1: 20, r1: 3 }], rugs: [[3, 5, 15, 6, 0x5a2a3a]], rows: [
          '######W####W####W#####',
          '#e..C#e..C#e..C#e...C#',
          '#....#....#....#.....#',
          '#..p.#.d..#..o.#.d..e#',
          '###D####D####D####D###',
          '#L.................kk#',
          '#..................kk#',
          '#####W#####W#####W####']
        },
        hotelUp: { pal: { T: 0x6a4a2e, m: 0x6a4a2e, B: 0x5a3a22, K: 0x6a4a2e, u: 0x7a3a2a }, name: 'Hotel Upstairs', line: 'The hotel\'s upper floor: a long hall of numbered doors. Room 7 is locked from the inside.', theme: 'store',
          areas: [{ name: 'Room 5', c0: 1, r0: 1, c1: 3, r1: 3 }, { name: 'Room 6', c0: 5, r0: 1, c1: 7, r1: 3 }, { name: 'Room 7', c0: 9, r0: 1, c1: 11, r1: 3 }, { name: 'Room 8', c0: 13, r0: 1, c1: 15, r1: 3 }, { name: 'Room 9', c0: 1, r0: 7, c1: 7, r1: 9 }, { name: 'The Bridal Suite', c0: 9, r0: 7, c1: 15, r1: 9 }], rows: [
          '####W###W###W###W###',
          '#e.C#e.C#e.C#e.C#kk#',
          '#...#...#...#...#kk#',
          '#.d.#.o.#.d.#.p.#..#',
          '##D###D###D###D##..#',
          '#L................L#',
          '##D#######D#########',
          '#e....C.#e.....eC.##',
          '#.......#.........##',
          '#..T....#..T....d.##',
          '####W######W########']
        },
        chapel: { name: 'The Chapel', sign: 'CHAPEL', line: 'A little chapel with pews and a bell rope. Quiet, for a set. The kobolds will not come in here.', rugs: [[7, 2, 8, 11, 0x6a1a1a]], rows: [
          '#######WW#######',
          '#....p.AA.p....#',
          '#..............#',
          '#L.nnnn..nnnn.L#',
          '#..............#',
          'W..nnnn..nnnn..W',
          '#..............#',
          '#L.nnnn..nnnn.L#',
          '#..............#',
          'W..nnnn..nnnn..W',
          '#..............#',
          '#####W#DD#W#####',
          'r==============r',
          'r==============r']
        },
        // ---- Catering Village: canvas tents ----
        craft: { pal: { m: 0xeeeae0, z: 0xd8d0c0, c: 0xd8d0c0 }, name: 'Craft Services', type: 'safe', wall: 'canvas', stripe: 0xc8302a, theme: 'tent', line: 'The craft services tent. Free food, hot coffee and a crew that has seen things.', rows: [
          '##W######W######W##',
          '#zzOicZ...........#',
          '#.................#',
          '#.m.m.m.....*.*.*.#',
          '#.................#',
          '#.m.m.m.....*.*.*.#',
          '#.................#',
          '#L......p........L#',
          '#######DD##########']
        },
        bunk: { pal: { b: 0x5a6a3a, m: 0xeeeae0, u: 0x4a5a3a }, name: 'The Bunkhouse', type: 'safe', wall: 'canvas', stripe: 0x2a5a8a, theme: 'tent', line: 'Bunks for the crawlers, a washroom and a TV that only gets the show.',
          areas: [{ name: 'Washroom', c0: 14, r0: 1, c1: 16, r1: 3, type: 'safe' }], rows: [
          '###W#####W#####W##',
          '#b.b.b.b.b.b.#X.X#',
          '#............#...#',
          '#............D..Q#',
          '#..m....u.y..#####',
          '#L...........ff.L#',
          '########DD########']
        },
        shop: { name: 'Prop Workshop', type: 'safe', wall: 'canvas', stripe: 0x2a8a4a, theme: 'tent', line: 'Benches, tools and bins of spare parts. Build something stupid. The audience loves it.', rows: [
          '##W####W####W##',
          '#hh..MM...hhh.#',
          '#.............#',
          '#.!..!....x%x.#',
          '#.............#',
          '#L..!.....R..L#',
          '######DD#######']
        },
        fx: { name: 'Special Effects', type: 'safe', wall: 'canvas', stripe: 0x7a3a9a, theme: 'tent', line: 'The effects department. Bottles, powders and a cauldron. Labels are optional.', rows: [
          '##W####W####W##',
          '#hhhh..ttt.hhh#',
          '#.............#',
          '#....J....!...#',
          '#.............#',
          '#L.x%.....R..L#',
          '######DD#######']
        },
        ward: { pal: { u: 0x8a2a5a, C: 0xc8a8c8 }, name: 'Wardrobe Tent', type: 'safe', wall: 'canvas', stripe: 0xc8962a, theme: 'tent', line: 'Racks of costumes from every set on the lot, and a mirror that is nicer to you than it should be.', rows: [
          '##W####W####W##',
          '#CCCC...CCCC..#',
          '#.............#',
          '#.;;;..d..;;;.#',
          '#.............#',
          '#L..u......f.L#',
          '######DD#######']
        },
        prod: { pal: { q: 0xd8d0c0, m: 0xeeeae0, f: 0x6a7078 }, name: 'Production Office', type: 'safe', wall: 'canvas', stripe: 0x3a3a3a, theme: 'tent', line: 'Call sheets, clipboards and a whiteboard with today\'s shoots on it.', rows: [
          '##W####W####W##',
          '#ff..y....ff..#',
          '#.............#',
          '#.q.q...m.....#',
          '#.............#',
          '#L.q.q.....p.L#',
          '######DD#######']
        },
        // ---- Maple Lane: sitcom houses ----
        house: { name: 'Maple Lane House', wall: 'siding', theme: 'house', line: 'A sitcom living room. The couch faces where the camera would be, and the laugh track is coming from the walls.',
          areas: [{ name: 'Kitchen', c0: 1, r0: 1, c1: 5, r1: 4 }, { name: 'Bathroom', c0: 1, r0: 6, c1: 5, r1: 8 }], rows: [
          '####W####W#####',
          '#ziOcZ#...kk..#',
          '#.....#...kk..#',
          '#..m..D.......#',
          '#.....#.......#',
          '##D####.......#',
          '#.....#.......#',
          '#.X.Q.#..u....#',
          '#.i...#.......#',
          '#######..l..p.#',
          '#L............#',
          '####W##DD##W###',
          'r=============r']
        },
        houseUp: { name: 'Upstairs', wall: 'siding', theme: 'house', line: 'The upstairs the audience never sees. Two bedrooms and a bathroom with no door.',
          areas: [{ name: 'Bedroom', c0: 1, r0: 1, c1: 3, r1: 4 }, { name: 'Kids\' Room', c0: 11, r0: 1, c1: 13, r1: 4 }], rows: [
          '####W#####W####',
          '#E.N#..kk.#E.N#',
          '#...#..kk.#...#',
          '#...D.....D...#',
          '#.C.#.....#.C;#',
          '#####.XQi.#####',
          '    #######    ']
        },
        showrunner: { pal: { u: 0xf0e6d0, E: 0xe8d8b0, z: 0xf4f0e6, n: 0x9ab0c8 }, name: 'The Showrunner\'s House', type: 'boss', wall: 'siding', wallCol: 0xf0e6d0, theme: 'house', line: 'The biggest house on the street, with bleachers for a live studio audience right there in the living room.',
          areas: [{ name: 'Showrunner\'s Kitchen', c0: 1, r0: 1, c1: 5, r1: 5, type: 'room' }, { name: 'Master Bedroom', c0: 21, r0: 1, c1: 27, r1: 5, type: 'room' }], rows: [
          '#######W#######W#######W#####',
          '#ziOcZ#nnnnnnnnnnnnn#E..N..t#',
          '#.....#.............#.......#',
          '#..m..D....u...u....D.......#',
          '#.....#.............#..;..C.#',
          '#L....#L...........L#L......#',
          '#######W###DD####W###########',
          'r===========================r']
        },
        // ---- the Jungle Set ----
        shed: { name: 'The Groundskeeper\'s Shed', wall: 'timber', theme: 'store', line: 'A tool shed with every blade sharpened and every hose coiled. The Groundskeeper is very particular.', rows: [
          '####W#W####',
          '#!..hh..MM#',
          '#.........#',
          '#x%....{..#',
          '#.........#',
          '#L.......R#',
          '####DD#####']
        },
        temple: { name: 'The Lost Temple (Set)', wall: 'stone', theme: 'moss', line: 'A jungle temple made of painted foam. The idol on the altar is the only real thing in it, and it is very heavy.', rows: [
          '###  ####  ###',
          '#............#',
          '  ..|....|..  ',
          '#............#',
          '#.....AA.....#',
          '#............#',
          '  ..|....|..  ',
          '#............#',
          '####  ##  ####']
        },
        // ---- the big ones, drawn by tools_tplgen.py ----
        manor: { pal: { t: 0x8a6a7a, u: 0x6a1a2a, m: 0x3a2418, C: 0x8a7078, z: 0x3a2a20, Z: 0x4a4a44, n: 0x6a5a5a }, name: 'Blackwood Manor', wall: 'manor', theme: 'manor', line: 'A haunted house set. Animatronics on timers, secret doors and a butler who is mostly hydraulics.', rows: GEN_MANOR,
          areas: [{ name: 'The Kitchen', c0: 1, r0: 1, c1: 12, r1: 12 }, { name: 'The Ballroom', c0: 14, r0: 1, c1: 41, r1: 12, type: 'boss', line: 'A ballroom where the dancers are on a track. The Butler Unit is waiting by the punch bowl.' }, { name: 'The Study', c0: 43, r0: 1, c1: 54, r1: 5 },
            { name: 'The Portrait Gallery', c0: 43, r0: 7, c1: 54, r1: 12 }, { name: 'The Library', c0: 1, r0: 14, c1: 20, r1: 26 }, { name: 'The Foyer', c0: 22, r0: 14, c1: 33, r1: 26 }, { name: 'The Dining Hall', c0: 35, r0: 14, c1: 54, r1: 26 }] },
        manorUp: { pal: { E: 0x5a1a2a, e: 0x8a7a8a, C: 0x8a7078, u: 0x2a2a4a, t: 0x8a6a7a }, name: 'Blackwood Manor, Upstairs', wall: 'manor', theme: 'manor', line: 'The upper floor. Every door creaks in a different key.', rows: GEN_MANORUP,
          areas: [{ name: 'Master Bedroom', c0: 1, r0: 1, c1: 10, r1: 5 }, { name: 'The Nursery', c0: 12, r0: 1, c1: 21, r1: 5 }, { name: 'Upstairs Study', c0: 23, r0: 1, c1: 32, r1: 5 }, { name: 'Guest Room', c0: 34, r0: 1, c1: 43, r1: 5 }, { name: 'The Bathroom', c0: 45, r0: 1, c1: 54, r1: 5 },
            { name: 'The Landing', c0: 1, r0: 7, c1: 54, r1: 9, type: 'corridor' }, { name: 'Servant\'s Room', c0: 1, r0: 11, c1: 10, r1: 15 }, { name: 'The Blue Room', c0: 12, r0: 11, c1: 21, r1: 15 }, { name: 'Attic Storage', c0: 23, r0: 11, c1: 32, r1: 15 },
            { name: 'The Red Room', c0: 34, r0: 11, c1: 43, r1: 15 }, { name: 'The Widow\'s Room', c0: 45, r0: 11, c1: 54, r1: 15 }] },
        ship: { pal: { b: 0x8a96a8, e: 0xe8ecf0, E: 0x3a4a6a, u: 0x2a3a5a, m: 0xc8ccd2, I: 0x3a4a5a, z: 0xb8c0cc, Z: 0xd8dce0, x: 0x9ab0c8, C: 0xb8c4d0, t: 0xa8b4c4, q: 0xc8ccd2, f: 0xa8b0bc, y: 0x3a4a5a }, name: 'Starship Valiant', wall: 'panel', theme: 'ship', line: 'A starship set. Foam walls, blinking panels and costume goblins who think they are a real crew.', rows: GEN_SHIP,
          areas: [{ name: 'Main Corridor', c0: 31, r0: 9, c1: 34, r1: 35, type: 'corridor' }, { name: 'Cross Corridor', c0: 1, r0: 18, c1: 64, r1: 19, type: 'corridor' },
            { name: 'The Bridge', c0: 22, r0: 1, c1: 43, r1: 8, type: 'boss', line: 'The bridge. Captain Zorr is in the big chair, and he has never once broken character.' }, { name: 'Briefing Room', c0: 1, r0: 1, c1: 20, r1: 8 }, { name: 'Science Lab', c0: 45, r0: 1, c1: 64, r1: 8 },
            { name: 'Med Bay', c0: 1, r0: 10, c1: 14, r1: 16 }, { name: 'Captain\'s Quarters', c0: 16, r0: 10, c1: 29, r1: 16 }, { name: 'The Holodeck', c0: 36, r0: 10, c1: 49, r1: 16, theme: 'stage' }, { name: 'Transporter Room', c0: 51, r0: 10, c1: 64, r1: 16 },
            { name: 'Mess Hall', c0: 1, r0: 21, c1: 20, r1: 27 }, { name: 'Rec Room', c0: 22, r0: 21, c1: 29, r1: 27 }, { name: 'Crew Quarters', c0: 36, r0: 21, c1: 64, r1: 27 }, { name: 'Cargo Hold', c0: 1, r0: 29, c1: 29, r1: 35 }, { name: 'Engine Room', c0: 36, r0: 29, c1: 64, r1: 35 }] },
        writers: { desk: 'metalDesk', pal: { q: 0xc8b89a, u: 0x3a5a6a, m: 0xd8d0c0, f: 0x8a8f96 }, name: 'The Writers\' Building', wall: 'plaster', theme: 'office', line: 'The writers are on strike. Picket signs, cold coffee and imps with opinions.', rows: GEN_WRITERS,
          areas: [{ name: 'Writers\' Room A', c0: 1, r0: 1, c1: 14, r1: 10 }, { name: 'Writers\' Room B', c0: 16, r0: 1, c1: 29, r1: 10 }, { name: 'The Script Library', c0: 31, r0: 1, c1: 44, r1: 10 }, { name: 'Head Writer\'s Office', c0: 46, r0: 1, c1: 60, r1: 10 },
            { name: 'Upper Hall', c0: 1, r0: 12, c1: 60, r1: 13, type: 'corridor' }, { name: 'The Cubicle Farm', c0: 1, r0: 15, c1: 40, r1: 23 }, { name: 'Writers\' Break Room', c0: 42, r0: 15, c1: 60, r1: 23 }, { name: 'Lower Hall', c0: 1, r0: 25, c1: 60, r1: 26, type: 'corridor' },
            { name: 'Strike Headquarters', c0: 1, r0: 28, c1: 22, r1: 36 }, { name: 'The Lobby', c0: 24, r0: 28, c1: 37, r1: 36 }, { name: 'The Mailroom', c0: 39, r0: 28, c1: 60, r1: 36 }] },
        roof: { pal: { u: 0x2a5a3a, m: 0x6a4a2e, z: 0x6a4a2e }, name: 'The Penthouse Green', type: 'boss', wall: 'stone', theme: 'green', line: 'A rooftop putting green, mowed to a sixteenth of an inch. Do not step on it. Somebody is watching.', rows: GEN_ROOF,
          areas: [{ name: 'Dermot\'s Clubhouse', c0: 1, r0: 15, c1: 11, r1: 22, type: 'room', theme: 'house' }, { name: 'Roof Access', c0: 32, r0: 19, c1: 37, r1: 21, type: 'room', theme: 'stage' }] },
        stage: { name: 'Soundstage 9', type: 'boss', wall: 'stage', theme: 'stage', line: 'A cavernous stage, half a western street and half a starship. A crane in the middle. The Director is watching.', rows: GEN_STAGE,
          areas: [{ name: 'Control Booth', c0: 2, r0: 2, c1: 13, r1: 8, type: 'room' }, { name: 'The Freight Elevator', c0: 48, r0: 2, c1: 59, r1: 10, type: 'stairs', line: 'A freight elevator to the floor below. It only runs when the Director says cut.' }] }
      };
      // ---------- streets ----------
      var ST = Zn({ name: 'The Backlot Streets', theme: 'lot', line: 'Studio streets between the sets. Golf carts, cables, cones and patrols. Keep moving.' });
      var nDrive = area({ name: 'Studio Drive North', type: 'corridor', x0: 3, z0: 56, x1: 236, z1: 62 }, ST);
      var sDrive = area({ name: 'Studio Drive South', type: 'corridor', x0: 3, z0: 160, x1: 236, z1: 166 }, ST);
      var loop = [area({ name: 'The Backlot Loop', type: 'corridor', x0: 62, z0: 66, x1: 176, z1: 72 }, ST), area({ name: 'The Backlot Loop', type: 'corridor', x0: 62, z0: 152, x1: 176, z1: 158 }, ST),
        area({ name: 'The Backlot Loop', type: 'corridor', x0: 62, z0: 73, x1: 68, z1: 151 }, ST), area({ name: 'The Backlot Loop', type: 'corridor', x0: 170, z0: 73, x1: 176, z1: 151 }, ST)];
      area({ name: 'Director\'s Row', type: 'corridor', x0: 116, z0: 46, x1: 121, z1: 65, line: 'A short, important street. Every parking space has a name on it, and every name is the Director\'s.' }, ST);
      area({ name: 'Studio Drive South', type: 'corridor', x0: 116, z0: 159, x1: 121, z1: 159 }, ST);
      area({ name: 'Maple Avenue', type: 'corridor', x0: 116, z0: 167, x1: 121, z1: 213 }, ST);
      area({ name: 'Frontier Spur', type: 'corridor', x0: 57, z0: 108, x1: 61, z1: 113 }, ST);
      area({ name: 'Jungle Spur', type: 'corridor', x0: 177, z0: 108, x1: 181, z1: 113 }, ST);

      // ---------- Catering Village: the one safe hub, a ring of canvas tents ----------
      var CV = Zn({ name: 'Catering Village', theme: 'lawn', line: 'Tents, string lights and the smell of craft services. No fighting of any kind. The System means it.' });
      var vil = area({ name: 'Catering Village', type: 'safe', x0: 76, z0: 80, x1: 162, z1: 144 }, CV);
      [[117, 73, 120, 79], [117, 145, 120, 151], [69, 110, 75, 113], [163, 110, 169, 113]].forEach(function (q) { area({ name: 'Village Gate', type: 'safe', theme: 'lot', x0: q[0], z0: q[1], x1: q[2], z1: q[3] }, CV); });
      area({ name: 'Village Path', type: 'safe', theme: 'lot', x0: 76, z0: 110, x1: 162, z1: 113, line: 'The main path through Catering Village.' }, CV); area({ name: 'Village Path', type: 'safe', theme: 'lot', x0: 117, z0: 80, x1: 120, z1: 144 }, CV);
      stamp(TPL.craft, 84, 88, 0, CV); stamp(TPL.bunk, 132, 90, 0, CV);
      stamp(TPL.shop, 82, 121, 2, CV); stamp(TPL.ward, 99, 121, 2, CV); stamp(TPL.prod, 123, 121, 2, CV); stamp(TPL.fx, 141, 121, 2, CV);
      put(159, 82, 'X', vil.id); put(160, 82, 'X', vil.id); put(161, 82, 'X', vil.id);
      var start2 = { x: 119, z: 116 }; put(start2.x, start2.z, '@', vil.id);
      spawns.push({ kind: 'imp', npc: 'pip', x: 121, z: 116, room: vil.id }); taken['121,116'] = 1;
      taken['116,117'] = 1; spawns.push({ kind: 'producer', npc: 'quib', x: 116, z: 117, room: vil.id });
      taken['104,112'] = 1; spawns.push({ kind: 'catfolk', npc: 'arthrav', x: 104, z: 112, room: vil.id }); taken['134,112'] = 1; spawns.push({ kind: 'birdfolk', npc: 'aeson', x: 134, z: 112, room: vil.id });
      [[100, 104], [108, 104], [130, 104], [138, 104], [130, 117], [138, 117], [100, 117]].forEach(function (p) { if (freeT(p[0], p[1], vil)) diningSet(p[0], p[1], vil, true); });
      F(112, 107, 'kitchenFridgeLarge', 0.9, Math.PI, 'Vending machine', { paint: 0xb8282a }); F(113, 107, 'kitchenFridgeLarge', 0.9, Math.PI, 'Vending machine', { paint: 0x2a5ab8 });
      obj(124, 107, 'BookStand', { h: 1.2 }, 'Call sheet board');
      for (xx = 80; xx <= 158; xx += 6) { if (freeT(xx, 108, vil)) obj(xx, 108, 'lampSquareFloor', { h: 1.5 }, 'Lamp'); if (freeT(xx, 115, vil)) obj(xx, 115, 'lampSquareFloor', { h: 1.5 }, 'Lamp'); }
      for (k = 0; k < 40; k++) { var ex = rnd() < 0.5 ? ri(77, 80) : ri(158, 161), ez = ri(81, 143); if (freeT(ex, ez, vil)) obj(ex, ez, pick(['CommonTree_1', 'CommonTree_3']), { fit: 2.0 + rnd(), rot: rnd() * 6 }, 'Tree'); }
      greens(vil, 70, ['Bush_Common_Flowers', 'Flower_4_Group', 'Clover_1', 'Grass_Common_Short']);

      // ---------- Frontier Town (west): a real western main street ----------
      // Buildings are stamped from hand-drawn templates (TPL below): thin timber walls with windows, false fronts,
      // boardwalk porches with railings, hitching rails, and furniture placed where it belongs.
      var FT = Zn({ name: 'Frontier Town', theme: 'dirt', line: 'A western town on a backlot. Every building has a false front, and the stunt crew falls off all of them for a living.' });
      var ftown = area({ name: 'Frontier Town', type: 'corridor', x0: 8, z0: 68, x1: 56, z1: 156 }, FT);
      area({ name: 'Frontier Town', type: 'corridor', x0: 30, z0: 63, x1: 34, z1: 67 }, FT); area({ name: 'Frontier Town', type: 'corridor', x0: 30, z0: 157, x1: 34, z1: 159 }, FT);
      var built = [];
      built.push(stamp(TPL.depot, 28 - TPL.depot.rows.length, 74, 3, FT));
      built.push(stamp(TPL.saloon, 28 - TPL.saloon.rows.length, 88, 3, FT));
      built.push(stamp(TPL.store, 28 - TPL.store.rows.length, 113, 3, FT));
      built.push(stamp(TPL.bank, 28 - TPL.bank.rows.length, 129, 3, FT));
      built.push(stamp(TPL.jail, 28 - TPL.jail.rows.length, 142, 3, FT));
      built.push(stamp(TPL.hotel, 37, 82, 1, FT));
      built.push(stamp(TPL.telegraph, 37, 118, 1, FT));
      built.push(stamp(TPL.chapel, 37, 131, 1, FT));
      built.forEach(function (b) { if (b.room.name !== 'The Chapel' && b.room.name !== 'Train Depot') pack(b.room, 'kobold', ri(1, 3)); });
      // upper floors live in the spare strip along the bottom of the map; the stairs take you there and back
      var salUp = stamp(TPL.saloonUp, 4, 244, 0, FT), hotUp = stamp(TPL.hotelUp, 32, 244, 0, FT); roofRing(salUp.box, 3); roofRing(hotUp.box, 3);
      upstairs.push([built[1].room, salUp.room, 'Go upstairs', 'Go back downstairs'], [built[5].room, hotUp.room, 'Go upstairs', 'Go back downstairs']);
      pack(salUp.room, 'kobold', 2); pack(hotUp.room, 'kobold', 2, 3);
      // the railroad along the north edge, with a train waiting (a gap where the road crosses)
      for (xx = 8; xx <= 56; xx++) if (g[69][xx] === '.' || g[69][xx] === ',') dec(xx, 69, '#track', { dz: 0.5, ns: true });
      function rolling(x0, len, kind, name) { for (var x = x0; x < x0 + len; x++) for (var z = 69; z <= 70; z++) { g[z][x] = 'o'; dname[x + ',' + z] = name; } dec(x0, 69, kind, { len: len, dz: 0.5 }); }
      rolling(10, 7, '#loco', 'Locomotive'); rolling(17, 6, '#car', 'Passenger car'); rolling(23, 5, '#car', 'Freight car'); rolling(37, 6, '#car', 'Freight car'); rolling(43, 6, '#car', 'Cattle car');
      var pr = room({ name: 'Station Platform', type: 'corridor', theme: 'porch', x0: 9, z0: 71, x1: 27, z1: 72 }, FT); for (xx = 9; xx <= 27; xx++) for (zz = 71; zz <= 72; zz++) if (g[zz][xx] === '.') reg[zz][xx] = pr.id;
      [[12, 72], [18, 72], [24, 72]].forEach(function (p) { if (freeT(p[0], p[1])) obj(p[0], p[1], 'Bench', { fit: 1.0, rot: 0 }, 'Platform bench'); });
      // water tower and a freight yard by the tracks
      [[50, 73], [51, 73], [50, 74], [51, 74]].forEach(function (p) { g[p[1]][p[0]] = 'o'; dname[p[0] + ',' + p[1]] = 'Water tower'; }); dec(50, 73, '#tower', { dx: 0.5, dz: 0.5 });
      [[40, 74], [41, 74], [40, 75], [44, 76], [46, 74], [45, 74]].forEach(function (p, j) { if (freeT(p[0], p[1])) g[p[1]][p[0]] = j % 2 ? 'R' : 'K'; });
      // the blacksmith works in the open, either side of the lane to the Loop
      obj(40, 104, '#forge', { rot: Math.PI / 2 }, 'Forge'); obj(42, 104, 'Anvil', { fit: 0.7, rot: 0.3 }, 'Anvil'); obj(44, 103, 'WeaponStand', { fit: 1.0 }, 'Weapon rack');
      obj(46, 104, '#trough', { ax: 'x' }, 'Water trough'); g[103][38] = 'R'; g[105][48] = 'K'; obj(39, 116, 'Workbench', { fit: 1.2 }, 'Workbench'); obj(42, 116, 'Barrel', { fit: 0.62 }, 'Barrel'); obj(43, 116, 'Peg_Rack', { fit: 0.95 }, 'Tool rack');
      // a corral at the south end
      for (xx = 40; xx <= 54; xx++) { [149, 155].forEach(function (z) { if (freeT(xx, z)) obj(xx, z, '#rail', { ax: 'x' }, 'Corral fence'); }); }
      for (zz = 150; zz <= 154; zz++) { [40, 54].forEach(function (x) { if (x === 40 && (zz === 152)) return; if (freeT(x, zz)) obj(x, zz, '#rail', { ax: 'z' }, 'Corral fence'); }); }
      obj(47, 152, '#trough', { ax: 'x' }, 'Water trough'); obj(51, 151, 'Bucket_Wooden_1', { fit: 0.4 }, 'Bucket'); dec(44, 153, 'Grass_Wispy_Tall', { fit: 0.8, ns: true });
      // the street: wheel ruts, hoof prints, crates and barrels in the alleys
      for (zz = 72; zz <= 156; zz++) { [30, 34].forEach(function (x) { if (g[zz][x] === '.' && !decor[x + ',' + zz]) dec(x, zz, '#rut', { ns: true }); }); }
      for (k = 0; k < 70; k++) { var hx2 = ri(29, 35), hz2 = ri(72, 156); if (g[hz2][hx2] === '.') dec(hx2, hz2, '#prints', { rot: rnd() * 6, ns: true }); }
      [[10, 87], [14, 86], [20, 111], [12, 127], [22, 140], [44, 102], [50, 129], [52, 117], [38, 130]].forEach(function (p, j) { if (freeT(p[0], p[1])) g[p[1]][p[0]] = j % 3 ? 'R' : 'K'; });
      // wagons parked on the street, barrels and crates on the porches
      [[32, 92, 0.1], [31, 121, -0.15], [33, 146, 0.2]].forEach(function (q) { if (freeT(q[0], q[1]) && freeT(q[0], q[1] + 1)) { obj(q[0], q[1], 'Prop_Wagon', { fit: 2.4, rot: Math.PI / 2 + q[2], dz: 0.5 }, 'Wagon'); g[q[1] + 1][q[0]] = 'o'; dname[q[0] + ',' + (q[1] + 1)] = 'Wagon'; } });
      built.forEach(function (b) { var pr2 = b.porch; for (var k2 = 0; k2 < 2; k2++) { var px2 = ri(pr2.x0, pr2.x1), pz2 = ri(pr2.z0, pr2.z1); if (reg[pz2][px2] === pr2.id && freeT(px2, pz2) && !nearDoor(px2, pz2)) obj(px2, pz2, pick(['Barrel', 'Crate_Wooden', 'Bench']), { fit: 0.62, rot: rnd() * 0.4 }, 'Porch clutter'); } });
      greens(ftown, 40, ['Grass_Wispy_Short', 'Pebble_Round_1', 'Pebble_Round_3', 'Grass_Wispy_Tall']);
      pack(ftown, 'kobold', 4);

      // ---------- The Writers' Building (northwest): offices on strike, the Penthouse Green on the roof ----------
      var WB = Zn({ name: 'The Writers\' Building', theme: 'lot', line: 'The writers are on strike. Picket signs, cold coffee and imps with opinions.' });
      var plaza = area({ name: 'Picket Line', type: 'corridor', x0: 8, z0: 45, x1: 74, z1: 52, line: 'A picket line outside the Writers\' Building. The signs are very well written.' }, WB);
      area({ name: 'Picket Line', type: 'corridor', x0: 38, z0: 53, x1: 42, z1: 55 }, WB); area({ name: 'Picket Line', type: 'corridor', x0: 3, z0: 6, x1: 8, z1: 52 }, WB); area({ name: 'Loading Yard', type: 'corridor', x0: 71, z0: 6, x1: 74, z1: 44 }, WB);
      var wb = stamp(TPL.writers, 9, 7, 0, WB);
      var roof = stamp(TPL.roof, 4, 258, 0, WB); roofRing(roof.box, 3);
      upstairs.push([wb.room, roof.room, 'Take the stairs to the roof', 'Go back down']);
      roomsOf(wb, /Writers|Cubicle|Strike|Break|Mailroom|Library/).forEach(function (r) { pack(r, 'writer', ri(1, 3)); if (rnd() < 0.35) pack(r, 'writer', 1, 3); });
      spawnIn(roof.room, 'clerk', { tier: 3, name: 'Dermot Stoker', boss: true });
      for (xx = 10; xx <= 72; xx += 6) if (freeT(xx, 49, plaza)) obj(xx, 49, '#picket', { rot: rnd() - 0.5 }, 'Picket sign');
      pack(plaza, 'writer', 3, 1, 'Picketing writer');

      // ---------- Soundstage 9 (north): the gate, up Director's Row ----------
      var SS = Zn({ name: 'Soundstage 9', theme: 'stage', line: 'The biggest stage on the lot. The Director is up on the crane, and the sets change when he says so.' });
      var stg = stamp(TPL.stage, 88, 6, 0, SS);
      var stairs2 = stg.room.stairsDown ? { x: stg.room.stairsDown[0], z: stg.room.stairsDown[1] } : { x: 142, z: 12 };
      spawnIn(stg.room, 'crew', { sub: 'director', name: 'The Director', boss: true }); pack(stg.room, 'crew', 3); pack(stg.room, 'knight', 4); spawnIn(stg.room, 'ronin'); spawnIn(stg.room, 'knight', { sub: 'stuntknight' }); spawnIn(stg.room, 'knight', { sub: 'stuntknight' });

      // ---------- Starship Valiant (northeast) ----------
      var SV = Zn({ name: 'Starship Valiant', theme: 'lot', line: 'A starship set. Foam walls, blinking panels and costume goblins who think they are a real crew.' });
      area({ name: 'Hangar Apron', type: 'corridor', x0: 165, z0: 44, x1: 234, z1: 52 }, SV); area({ name: 'Hangar Apron', type: 'corridor', x0: 198, z0: 53, x1: 202, z1: 55 }, SV);
      area({ name: 'Hangar Apron', type: 'corridor', x0: 165, z0: 6, x1: 166, z1: 43 }, SV); area({ name: 'Hangar Apron', type: 'corridor', x0: 233, z0: 6, x1: 234, z1: 43 }, SV);
      var sv = stamp(TPL.ship, 167, 7, 0, SV);
      roomsOf(sv, /Quarters|Mess|Lab|Med|Cargo|Engine|Transporter|Holodeck|Rec|Briefing/).forEach(function (r) { pack(r, 'goblin', ri(1, 2)); });
      var bridge = roomsOf(sv, /Bridge/)[0]; if (bridge) { spawnIn(bridge, 'goblin', { sub: 'zorr', name: 'Captain Zorr', boss: true }); pack(bridge, 'goblin', 2, 3); }
      for (k = 0; k < 6; k++) { var hx3 = ri(168, 232), hz3 = ri(45, 51); if (freeT(hx3, hz3)) obj(hx3, hz3, pick(['Crate_Metal', 'Barrel', 'cardboardBoxClosed']), { fit: 0.7, rot: rnd() }, 'Equipment'); }

      // ---------- The Jungle Set (east): trees, a river with a bridge, a temple, the Groundskeeper's shed ----------
      var JS = Zn({ name: 'The Jungle Set', theme: 'garden', line: 'A jungle under studio lights. Real plants, fake rocks and things that bite either way.' });
      var jung = area({ name: 'The Jungle Set', type: 'corridor', x0: 182, z0: 68, x1: 234, z1: 156 }, JS);
      area({ name: 'The Jungle Set', type: 'corridor', x0: 205, z0: 63, x1: 209, z1: 67 }, JS); area({ name: 'The Jungle Set', type: 'corridor', x0: 205, z0: 157, x1: 209, z1: 159 }, JS);
      var brg = room({ name: 'Rope Bridge', type: 'corridor', theme: 'porch', x0: 206, z0: 120, x1: 209, z1: 140, line: 'A rope bridge over the river. It sways more than a set piece should.' }, JS);
      for (xx = 182; xx <= 234; xx++) { var rz2 = Math.round(128 + Math.sin((xx - 182) / 9) * 6); for (zz = rz2; zz <= rz2 + 2; zz++) { if (xx >= 206 && xx <= 209) put(xx, zz, '.', brg.id); else put(xx, zz, '~', jung.id); } }
      var jclear = area({ name: 'The Groundskeeper\'s Clearing', type: 'boss', theme: 'garden', x0: 214, z0: 138, x1: 231, z1: 154, line: 'A clearing with a tool shed and a very large hedge trimmer. The Groundskeeper keeps this jungle tidy.' }, JS);
      stamp(TPL.shed, 219, 139, 0, JS); stamp(TPL.temple, 190, 80, 0, JS);
      spawnIn(jclear, 'truffle', { sub: 'groundskeeper', name: 'The Groundskeeper', boss: true });
      trees(jung, 220, ['CommonTree_1', 'CommonTree_3', 'Pine_2']); greens(jung, 260, ['Fern_1', 'Plant_1', 'Plant_7', 'Bush_Common', 'Mushroom_Laetiporus', 'Grass_Wispy_Tall']);
      for (k = 0; k < 7; k++) { // little patches of truffle men scattered through the trees, not one crowd
        for (var tt = 0, tp = null; tt < 40 && !tp; tt++) { var qx = ri(jung.x0 + 3, jung.x1 - 3), qz = ri(jung.z0 + 3, jung.z1 - 3); if (reg[qz] && reg[qz][qx] === jung.id && (g[qz][qx] === '.' || g[qz][qx] === ',') && !taken[qx + ',' + qz]) tp = [qx, qz]; }
        if (!tp) continue; for (var tn = ri(1, 3), dd = 0; tn > 0 && dd < 12; dd++) { var ax = tp[0] + ri(-2, 2), az = tp[1] + ri(-2, 2); if (reg[az] && reg[az][ax] === jung.id && (g[az][ax] === '.' || g[az][ax] === ',') && !taken[ax + ',' + az]) { taken[ax + ',' + az] = 1; spawns.push({ kind: 'truffle', tier: rnd() < 0.12 ? 3 : rnd() < 0.35 ? 2 : 1, x: ax, z: az, room: jung.id }); tn--; } }
      }
      function jspot(near, rad) { for (var t = 0; t < 40; t++) { var qx = near ? near[0] + ri(-rad, rad) : ri(jung.x0 + 3, jung.x1 - 3), qz = near ? near[1] + ri(-rad, rad) : ri(jung.z0 + 3, jung.z1 - 3); if (reg[qz] && reg[qz][qx] === jung.id && (g[qz][qx] === '.' || g[qz][qx] === ',') && !taken[qx + ',' + qz]) { taken[qx + ',' + qz] = 1; return [qx, qz]; } } return null; }
      for (k = 0; k < 4; k++) { // the practical effects: raptor packs hunting through the trees (a leader in two of them)
        var rc = jspot(); if (!rc) continue; spawns.push({ kind: 'dino', tier: k < 2 ? 3 : 1, x: rc[0], z: rc[1], room: jung.id });
        for (var rn = ri(1, 2); rn > 0; rn--) { var rq = jspot(rc, 2); if (rq) spawns.push({ kind: 'dino', tier: 1, x: rq[0], z: rq[1], room: jung.id }); }
      }
      var tr = jspot([200, 96], 8) || jspot(); if (tr) spawns.push({ kind: 'trex', name: 'The Big Animatronic', x: tr[0], z: tr[1], room: jung.id }); // the big one, in front of the temple

      // ---------- Maple Lane (southwest): six sitcom houses, front yards, the Showrunner's house ----------
      var ML = Zn({ name: 'Maple Lane', theme: 'lawn', line: 'A sitcom street. Six identical houses, perfect lawns and a laugh track that never stops.' });
      var lane = area({ name: 'Maple Lane', type: 'corridor', x0: 8, z0: 171, x1: 110, z1: 213 }, ML);
      var mstreet = area({ name: 'Maple Lane', type: 'corridor', theme: 'lot', x0: 8, z0: 196, x1: 115, z1: 200 }, ML); area({ name: 'Maple Lane', type: 'corridor', x0: 50, z0: 167, x1: 54, z1: 170 }, ML);
      var HCOL = [0xe8e0c8, 0xc8d8e0, 0xe8c8c0, 0xd0e0c0, 0xeed8a0, 0xd8c8e0], HSOFA = [0x8a3a2a, 0x2a5a7a, 0x6a7a3a, 0xc8962a, 0x7a3a6a, 0x3a6a5a], HKIT = [0xf4f0e6, 0xa8c8a0, 0xe8d0a0, 0xc8d8e8, 0xe8c0b0, 0xd0d0d0];
      for (i = 0; i < 6; i++) {
        var hx = 10 + i * 17, hb = stamp(TPL.house, hx, 174, 0, ML, { name: 'No. ' + (i + 1) + ' Maple Lane', wallCol: HCOL[i], pal: { u: HSOFA[i], z: HKIT[i], c: HKIT[i], m: 0xc8a878 } });
        var hu = stamp(TPL.houseUp, 54 + i * 17, 244, 0, ML, { name: 'No. ' + (i + 1) + ', Upstairs', wallCol: HCOL[i], pal: { E: HSOFA[(i + 2) % 6], C: HKIT[(i + 3) % 6] } }); roofRing(hu.box, 2);
        upstairs.push([hb.room, hu.room, 'Go upstairs', 'Go back downstairs']);
        pack(hb.room, 'gremlin', ri(1, 2)); if (rnd() < 0.5) pack(hu.room, 'gremlin', 1);
        for (xx = hx; xx <= hx + 14; xx++) if (Math.abs(xx - hx - 7) > 0 && freeT(xx, 193, lane)) obj(xx, 193, '#rail', { ax: 'x', col: 0xf4f0e6, picket: true }, 'Picket fence');
        for (zz = 187; zz <= 195; zz++) if (g[zz][hx + 7] === '.' || g[zz][hx + 7] === ',') dec(hx + 7, zz, '#path', { ns: true });
        if (freeT(hx + 9, 194, lane)) obj(hx + 9, 194, '#mailbox', { rot: 0 }, 'Mailbox');
        if (freeT(hx + 2, 190, lane)) obj(hx + 2, 190, 'CommonTree_3', { fit: 2.0, rot: rnd() * 6 }, 'Tree');
        park(hx + 11, 188, ['hatchback', 'rustyCar', 'rustyCar2'][i % 3], 'z', ['Hatchback', 'Classic car', 'Classic car'][i % 3]);
      }
      var srh = stamp(TPL.showrunner, 40, 203, 2, ML); spawnIn(srh.room, 'puglin', { sub: 'showrunner', name: 'The Showrunner', boss: true });
      for (xx = 44; xx <= 64; xx++) for (zz = 211; zz <= 212; zz++) put(xx, zz, '~', lane.id);
      [[42, 212], [66, 212], [42, 211]].forEach(function (p) { if (freeT(p[0], p[1], lane)) dec(p[0], p[1], 'loungeChairRelax', { fit: 0.7, rot: Math.PI / 2 }); });
      for (xx = 12; xx <= 108; xx += 9) if (freeT(xx, 202, lane)) obj(xx, 202, 'CommonTree_3', { fit: 2.2, rot: rnd() * 6 }, 'Tree');
      greens(lane, 40, ['Bush_Common_Flowers', 'Flower_3_Group', 'Clover_1']); pack(mstreet, 'gremlin', 3); pack(mstreet, 'gremlin', 2, 3);

      // ---------- Blackwood Manor (southeast): the mansion, its upper floor, a graveyard ----------
      var BM = Zn({ name: 'Blackwood Manor', theme: 'moss', line: 'A haunted house set. Animatronics on timers, secret doors and a butler who is mostly hydraulics.' });
      var grounds = area({ name: 'Manor Grounds', type: 'corridor', x0: 127, z0: 171, x1: 234, z1: 213 }, BM);
      area({ name: 'Manor Grounds', type: 'corridor', x0: 122, z0: 196, x1: 126, z1: 200 }, BM); area({ name: 'Manor Grounds', type: 'corridor', x0: 180, z0: 167, x1: 184, z1: 170 }, BM);
      var bm = stamp(TPL.manor, 150, 174, 2, BM), bmu = stamp(TPL.manorUp, 160, 244, 0, BM); roofRing(bmu.box, 3);
      upstairs.push([bm.room, bmu.room, 'Climb the grand staircase', 'Go back downstairs']);
      roomsOf(bm, /Kitchen|Library|Dining|Study|Gallery|Foyer/).forEach(function (r) { pack(r, 'robot', ri(1, 2)); });
      roomsOf(bmu, /Room|Nursery|Study|Attic/).forEach(function (r) { if (rnd() < 0.6) pack(r, 'robot', 1); });
      var ball = roomsOf(bm, /Ballroom/)[0]; if (ball) spawnIn(ball, 'robot', { sub: 'butler', name: 'The Butler Unit', boss: true });
      // the graveyard: iron fence, rows of headstones, dead trees
      var gy = room({ name: 'The Graveyard', type: 'room', theme: 'moss', x0: 211, z0: 178, x1: 231, z1: 208, line: 'A graveyard full of foam headstones. Some of the names are crawlers from earlier seasons.' }, BM);
      for (zz = 178; zz <= 208; zz++) for (xx = 211; xx <= 231; xx++) if (g[zz][xx] === '.' || g[zz][xx] === ',') reg[zz][xx] = gy.id;
      for (xx = 211; xx <= 231; xx++) [178, 208].forEach(function (z) { if (xx !== 221 && freeT(xx, z)) obj(xx, z, '#rail', { ax: 'x', col: 0x26262c, iron: true }, 'Iron fence'); });
      for (zz = 179; zz <= 207; zz++) [211, 231].forEach(function (x) { if (zz !== 193 && freeT(x, zz)) obj(x, zz, '#rail', { ax: 'z', col: 0x26262c, iron: true }, 'Iron fence'); });
      for (zz = 181; zz <= 205; zz += 3) for (xx = 214; xx <= 228; xx += 3) if (rnd() < 0.85 && freeT(xx, zz)) obj(xx, zz, '#grave', { rot: (rnd() - 0.5) * 0.3, seed: xx * 31 + zz }, 'Headstone');
      trees(grounds, 50, ['DeadTree_2', 'Pine_2']); greens(grounds, 60, ['Mushroom_Common', 'Grass_Wispy_Tall', 'Rock_Medium_1']);

      // ---------- parked vehicles ----------
      [[20, 57, 'rustyCar'], [96, 57, 'rustyCar2'], [140, 61, 'hatchback'], [210, 57, 'rustyCar'], [30, 165, 'rustyCar2'], [150, 161, 'rustyCar'], [200, 165, 'hatchback']].forEach(function (q) { park(q[0], q[1], q[2], 'x', q[2] === 'hatchback' ? 'Hatchback' : 'Classic car'); });
      park(172, 172, 'rustyCar', 'x', 'Rusted car'); park(72, 30, 'motorcycle', 'z', 'Motorbike'); park(100, 40, 'motorcycle', 'x', 'Stunt bike'); park(160, 47, 'motorcycle', 'x', 'Motorbike');
      // ---------- dressing for the streets ----------
      [nDrive, sDrive].concat(loop).forEach(function (r) { lamps(r, 11); });
      for (k = 0; k < 30; k++) { var sr2 = pick([nDrive, sDrive].concat(loop)), qx = ri(sr2.x0, sr2.x1), qz = ri(sr2.z0, sr2.z1); if (freeT(qx, qz, sr2) && wallOf(qx, qz)) { var w3 = wallOf(qx, qz); obj(qx, qz, pick(['Crate_Metal', 'Crate_Wooden', 'Barrel', 'cardboardBoxClosed']), hug(w3, { fit: 0.7 }), 'Gear'); } }
      [nDrive, sDrive].concat(loop).forEach(function (r) { for (k = 0; k < 3; k++) spawnIn(r, 'rat', { sub: 'rat' }); });

      // ---------- stairs: each pair of stair blocks links to the other's landing ----------
      function landing(ts) { for (var a2 = 0; a2 < ts.length; a2++) for (var q = 0; q < 4; q++) { var lx = ts[a2][0] + D4[q][0], lz = ts[a2][1] + D4[q][1]; if ((g[lz][lx] === '.' || g[lz][lx] === ',') && !ts.some(function (t3) { return t3[0] === lx && t3[1] === lz; })) return [lx, lz]; } return null; }
      upstairs.forEach(function (u) { var a3 = u[0].stairsT, b3 = u[1].stairsT; if (!a3 || !b3) return; var la = landing(b3), lb = landing(a3); if (!la || !lb) return;
        taken[la[0] + ',' + la[1]] = 1; taken[lb[0] + ',' + lb[1]] = 1;
        a3.forEach(function (t3) { links[t3[0] + ',' + t3[1]] = { x: la[0], z: la[1], label: u[2] }; }); b3.forEach(function (t3) { links[t3[0] + ',' + t3[1]] = { x: lb[0], z: lb[1], label: u[3] }; }); });

      // ---------- tidy up ----------
      var seen = new Uint8Array(Wd * Hd), q = [start2.x + start2.z * Wd]; seen[q[0]] = 1;
      for (var lk in links) { var lp = links[lk]; if (!seen[lp.x + lp.z * Wd]) { seen[lp.x + lp.z * Wd] = 1; q.push(lp.x + lp.z * Wd); } }
      var PASS = { '.': 1, ',': 1, '~': 1, 'D': 1, 'H': 1, 'S': 1, '@': 1 };
      while (q.length) { var cur = q.pop(), cx4 = cur % Wd, cz4 = (cur / Wd) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var nx2 = cx4 + dd[0], nz2 = cz4 + dd[1], k2 = nx2 + nz2 * Wd; if (!inb(nx2, nz2) || seen[k2] || !PASS[g[nz2][nx2]]) return; seen[k2] = 1; q.push(k2); }); }
      var lost = 0;
      for (zz = 1; zz < Hd - 1; zz++) for (xx = 1; xx < Wd - 1; xx++) if (isFloor(g[zz][xx]) && !seen[xx + zz * Wd]) { g[zz][xx] = '#'; lost++; }
      spawns = spawns.filter(function (sp) { var c = g[sp.z] && g[sp.z][sp.x]; return (c === '.' || c === ',') && seen[sp.x + sp.z * Wd]; });
      // zone bounds for the map labels (ground level only)
      zones.forEach(function (Z) { var b = null; Z.rooms.forEach(function (r) { if (r.z0 >= UPZ) return; if (!b) b = { x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 }; else { b.x0 = Math.min(b.x0, r.x0); b.z0 = Math.min(b.z0, r.z0); b.x1 = Math.max(b.x1, r.x1); b.z1 = Math.max(b.z1, r.z1); } }); if (b) { Z.x0 = b.x0; Z.z0 = b.z0; Z.x1 = b.x1; Z.z1 = b.z1; } });
      var map = g.map(function (row) { return row.join(''); });
      for (var dk in decor) { var dp = dk.split(','), dc = g[+dp[1]][+dp[0]]; if (dc === '#') delete decor[dk]; }
      return { W: Wd, H: Hd, map: map, reg: reg, rooms: rooms, spawns: spawns, start: start2, hoods: zones, stairs: stairs2, lost: lost, decor: decor, dname: dname, floor: 2, wstyle: wstyle, links: links, upZ: UPZ };
    }
  }
