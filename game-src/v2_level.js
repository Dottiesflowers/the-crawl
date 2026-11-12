
  // ===================== Level One generator: the grand layout =====================
  // A fixed seed, so every player shares the same floor. 240 x 240 tiles laid out as a 3 x 3 grid of zones
  // joined by four grand boulevards. You start in the southwest corner (the Processing Center) and the stairs
  // are in the northeast corner (the Stairwell Gate), reached only through the Arena. Every boulevard ends in a
  // small safe room with free food. Each zone has its own architecture: studio halls, caves, offices, flooded
  // stacks, an open market cavern, an outdoor garden, a stadium and a gatehouse.
  // Map characters: # wall · . floor · , moss/grass floor · ~ water · D door · H hidden door · S stairs · @ start
  //   P pillar · B brazier · C loot box · K crate · R barrel · T table/desk/stall · W weapon rack · U training dummy
  //   b sack · h shelf · c candle stand · q cauldron · k book stand · g cage · v vase · X bathroom · F free food · Y tree
  function genLevel(seed, floor) {
    var Wd = 240, Hd = 240, s = seed >>> 0;
    function rnd() { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    var g = [], reg = [], rooms = [], spawns = [], zones = [], x, z, i;
    for (z = 0; z < Hd; z++) { g.push([]); reg.push([]); for (x = 0; x < Wd; x++) { g[z].push('#'); reg[z].push(-1); } }
    function inb(x, z) { return x > 0 && z > 0 && x < Wd - 1 && z < Hd - 1; }
    function isFloor(c) { return c === '.' || c === ',' || c === '~'; }
    function room(o, Z) { o.id = rooms.length; rooms.push(o); if (Z) { o.hood = Z.idx; Z.rooms.push(o); Z.rids[o.id] = 1; if (!o.theme) o.theme = Z.theme; if (!o.line) o.line = Z.line; } return o; }
    function put(x, z, c, rid) { if (!inb(x, z)) return; g[z][x] = c; if (rid !== undefined) reg[z][x] = rid; }
    function carve(x, z, rid, floor) { if (!inb(x, z)) return; if (g[z][x] === '#') g[z][x] = floor || '.'; if (rid !== undefined && reg[z][x] < 0) reg[z][x] = rid; }
    function carveRect(r, floor) { for (var zz = r.z0; zz <= r.z1; zz++) for (var xx = r.x0; xx <= r.x1; xx++) put(xx, zz, floor || '.', r.id); }
    function center(r) { return [Math.floor((r.x0 + r.x1) / 2), Math.floor((r.z0 + r.z1) / 2)]; }
    function free(x0, z0, x1, z1) { for (var zz = z0 - 1; zz <= z1 + 1; zz++) for (var xx = x0 - 1; xx <= x1 + 1; xx++) { if (!inb(xx, zz) || g[zz][xx] !== '#') return false; } return true; }
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
    // ---------- the grid: zone cells and boulevards ----------
    var CX = [[2, 73], [82, 157], [166, 237]], CZ = CX; // cell bounds; zones build inside them, one tile in
    var BV = [[75, 80], [159, 164]];                     // boulevard bands (x for the north-south ones, z for the east-west ones)
    function zone(o, col, row) {
      o.idx = zones.length; o.rooms = []; o.rids = {}; o.cell = [CX[col][0], CZ[row][0], CX[col][1], CZ[row][1]];
      o.x0 = o.cell[0] + 1; o.z0 = o.cell[1] + 1; o.x1 = o.cell[2] - 1; o.z1 = o.cell[3] - 1; zones.push(o); return o;
    }
    // ---------- boulevards ----------
    var BLINE = 'A grand boulevard. Pillars, banners and sponsor billboards. Mostly safe, if you keep moving.';
    function boulevard(name, horiz, band, a0, a1) {
      var r = room(horiz ? { name: name, theme: 'blvd', type: 'corridor', x0: a0, z0: band[0], x1: a1, z1: band[1], line: BLINE } : { name: name, theme: 'blvd', type: 'corridor', x0: band[0], z0: a0, x1: band[1], z1: a1, line: BLINE });
      carveRect(r);
      for (var t = a0 + 3, k = 0; t <= a1 - 3; t += 6, k++) {
        var cross = (t >= BV[0][0] - 2 && t <= BV[0][1] + 2) || (t >= BV[1][0] - 2 && t <= BV[1][1] + 2); if (cross) continue;
        if (horiz) { put(t, band[0], 'P'); put(t, band[1], 'P'); if (k % 4 === 2) put(t + 3, k % 8 === 2 ? band[0] : band[1], 'B'); }
        else { put(band[0], t, 'P'); put(band[1], t, 'P'); if (k % 4 === 2) put(k % 8 === 2 ? band[0] : band[1], t + 3, 'B'); }
      }
      return r;
    }
    var westway = boulevard('Westway', false, BV[0], 10, 229), eastway = boulevard('Eastway', false, BV[1], 10, 229);
    var upper = boulevard('Upper Concourse', true, BV[0], 10, 164), lower = boulevard('Lower Concourse', true, BV[1], 10, 229);
    var gateCon = boulevard('Gate Concourse', true, BV[0], 166, 229); // walled off from the rest: the Arena is the only way in
    gateCon.line = 'The concourse past the Arena. The crowd noise follows you. So do the cameras.';
    // ---------- a small safe room with free food at the end of every boulevard ----------
    var SNACK = ['The Snack Closet', 'The Snack Bar', 'The Vending Nook', 'Hydration Station', 'The Comp Buffet', 'Catering Overflow', 'Green Room B', 'The Unofficial Break Room'], sn = 0;
    function endRoom(x0, z0, x1, z1, doors, food) {
      var r = room({ name: SNACK[sn++], theme: 'crypt', type: 'safe', x0: x0, z0: z0, x1: x1, z1: z1, line: 'A tiny safe room. The catering table is free and it heals you. The System says "within reason."' });
      carveRect(r); doors.forEach(function (d) { put(d[0], d[1], 'D', r.id); }); food.forEach(function (f) { put(f[0], f[1], 'F'); });
      put(x0 + 1, z0 + 1, 'c'); put(x1 - 1, z1 - 1, 'c'); return r;
    }
    BV.forEach(function (b, k) {
      endRoom(b[0] - 1, 2, b[1] + 1, 8, [[b[0] + 2, 9], [b[0] + 3, 9]], [[b[0] + 2, 3], [b[0] + 3, 3]]);            // north end of a north-south boulevard
      endRoom(b[0] - 1, 231, b[1] + 1, 237, [[b[0] + 2, 230], [b[0] + 3, 230]], [[b[0] + 2, 236], [b[0] + 3, 236]]); // south end
      endRoom(2, b[0] - 1, 8, b[1] + 1, [[9, b[0] + 2], [9, b[0] + 3]], [[3, b[0] + 2], [3, b[0] + 3]]);             // west end of an east-west boulevard
      endRoom(231, b[0] - 1, 237, b[1] + 1, [[230, b[0] + 2], [230, b[0] + 3]], [[236, b[0] + 2], [236, b[0] + 3]]); // east end
    });

    // ---------- gates: a wide mouth from a boulevard into a zone, tunnelled to the zone's nearest floor ----------
    function gate(Z, side, at, name) {
      var mouth = room({ name: name || Z.name + ' gate', type: 'corridor', x0: 0, z0: 0, x1: 0, z1: 0 }, Z), ox, oz, ix, iz;
      if (side === 'E') { ox = Z.cell[2] + 1; oz = at; ix = Z.x1; iz = at; } else if (side === 'W') { ox = Z.cell[0] - 1; oz = at; ix = Z.x0; iz = at; }
      else if (side === 'N') { ox = at; oz = Z.cell[1] - 1; ix = at; iz = Z.z0; } else { ox = at; oz = Z.cell[3] + 1; ix = at; iz = Z.z1; }
      var best = null, bd = 1e9;
      for (var zz = Z.z0; zz <= Z.z1; zz++) for (var xx = Z.x0; xx <= Z.x1; xx++) {
        if (!isFloor(g[zz][xx]) || !Z.rids[reg[zz][xx]] || reg[zz][xx] === mouth.id) continue;
        var dd = Math.abs(xx - ix) + Math.abs(zz - iz); if (dd < bd) { bd = dd; best = [xx, zz]; }
      }
      if (!best) return;
      passage(ox, oz, best[0], best[1], mouth.id, '.', 3);
      mouth.x0 = Math.min(ox, best[0]); mouth.x1 = Math.max(ox, best[0]); mouth.z0 = Math.min(oz, best[1]); mouth.z1 = Math.max(oz, best[1]);
    }

    // ---------- rooms in blocks around two crossing halls (studio and office zones) ----------
    function blockRooms(Z, o) {
      var hw = o.hall, hx0 = Math.floor((Z.x0 + Z.x1) / 2) - (hw >> 1), hz0 = Math.floor((Z.z0 + Z.z1) / 2) - (hw >> 1);
      var halls = room({ name: o.hallName, type: 'corridor', x0: Z.x0, z0: Z.z0, x1: Z.x1, z1: Z.z1 }, Z);
      for (var zz = Z.z0; zz <= Z.z1; zz++) for (var k = 0; k < hw; k++) put(hx0 + k, zz, '.', halls.id);
      for (var xx = Z.x0; xx <= Z.x1; xx++) for (k = 0; k < hw; k++) put(xx, hz0 + k, '.', halls.id);
      var out = [], Q = [
        { x0: Z.x0, x1: hx0 - 2, z0: Z.z0, z1: hz0 - 2, hx: 1, hz: 1, q: 'NW' }, { x0: hx0 + hw + 1, x1: Z.x1, z0: Z.z0, z1: hz0 - 2, hx: -1, hz: 1, q: 'NE' },
        { x0: Z.x0, x1: hx0 - 2, z0: hz0 + hw + 1, z1: Z.z1, hx: 1, hz: -1, q: 'SW' }, { x0: hx0 + hw + 1, x1: Z.x1, z0: hz0 + hw + 1, z1: Z.z1, hx: -1, hz: -1, q: 'SE' }];
      Q.forEach(function (q) {
        var n = (o.split && o.split[q.q]) || o.n, cutsX = cuts(q.x0, q.x1, n[0]), cutsZ = cuts(q.z0, q.z1, n[1]), grid = [];
        for (var a = 0; a < n[0]; a++) { grid.push([]); for (var b = 0; b < n[1]; b++) {
          var r = room({ name: 'Room', type: 'room', x0: cutsX[a][0], x1: cutsX[a][1], z0: cutsZ[b][0], z1: cutsZ[b][1], q: q.q, gx: a, gz: b, nx: n[0], nz: n[1] }, Z);
          carveRect(r); grid[a].push(r); out.push(r);
        } }
        // doors: every room links one step toward the north-south hall; rooms on the east-west hall also open onto it
        for (a = 0; a < n[0]; a++) for (b = 0; b < n[1]; b++) {
          var r = grid[a][b], cz = ri(r.z0 + 1, r.z1 - 1), cx = ri(r.x0 + 1, r.x1 - 1);
          if (q.hx > 0) put(r.x1 + 1, cz, 'D', r.id); else put(r.x0 - 1, cz, 'D', r.id);
          var edgeZ = q.hz > 0 ? b === n[1] - 1 : b === 0; if (edgeZ || rnd() < 0.35) { if (q.hz > 0) put(cx, r.z1 + 1, 'D', r.id); else put(cx, r.z0 - 1, 'D', r.id); }
        }
      });
      return { halls: halls, rooms: out, hx0: hx0, hz0: hz0 };
    }
    function cuts(a0, a1, n) { // split a span into n rooms with one-tile walls
      var span = a1 - a0 + 1, out = [], pos = a0;
      for (var k = 0; k < n; k++) {
        var left = a1 - pos + 1, size = k === n - 1 ? left : Math.max(5, Math.round((span - (n - 1)) / n + (rnd() - 0.5) * 4));
        if (k < n - 1) size = Math.min(size, left - (n - 1 - k) * 6); out.push([pos, pos + size - 1]); pos += size + 1;
      }
      return out;
    }

    // ================= 1. The Processing Center (southwest corner, the start) =================
    var PCZ = zone({ name: 'The Processing Center', theme: 'studio', fam: 'puglin', line: 'Sterile halls, neon signs and a lot of paperwork. This is where the show checks you in.' }, 0, 2);
    var pc = blockRooms(PCZ, { hall: 4, hallName: 'Processing Halls', n: [2, 2], split: { NE: [2, 3], SE: [2, 2] } });
    var green = pc.rooms.filter(function (r) { return r.q === 'SW' && r.gx === 0 && r.gz === r.nz - 1; })[0];
    green.name = 'The Green Room'; green.type = 'safe'; green.line = 'Your holding cell, now with a couch. No violence of any kind; the System takes this very seriously, and so does its teleporter.';
    var gc = center(green), start = { x: gc[0] - 1, z: gc[1] };
    put(start.x, start.z, '@'); put(green.x0 + 1, green.z0 + 1, 'X'); put(green.x0 + 3, green.z0 + 1, 'X'); put(green.x1 - 1, green.z1 - 1, 'F'); put(green.x1 - 2, green.z1 - 1, 'F');
    
    spawns.push({ kind: 'imp', npc: 'pip', x: gc[0] + 1, z: gc[1] + 1, room: green.id }); taken[(gc[0] + 1) + ',' + (gc[1] + 1)] = 1;
    var PCN = ['Intake', 'Makeup & Prosthetics', 'Wardrobe Department', 'Stage 3', 'Casting Office', 'Prop Storage', 'Orientation Theater', 'Medical (Closed)', 'Contracts Office', 'Waiver Signing', 'Holding Pen B', 'Loading Dock', 'Craft Services Annex', 'Control Room'], pn = 0;
    pc.rooms.forEach(function (r) {
      if (r === green) return; r.name = PCN[pn++] || 'Back Office';
      if (r.name === 'Stage 3') { scatter(r, 'U', 3); scatter(r, 'W', 1); r.line = 'A practice stage with training dummies. Hit them. They are paid to take it.'; }
      else if (r.name === 'Prop Storage') scatter(r, 'C', 1);
      if (r.name === 'Holding Pen B' || r.name === 'Loading Dock') { var n = r.name === 'Loading Dock' ? 2 : 1; for (var m = 0; m < n; m++) spawnIn(r, 'puglin', { tier: 1, name: 'Escaped reject' }); r.line = 'Something got out of its holding pen. It is small, angry and in your way. Practice on it.'; }
    });
    var k;

    // ================= 2. The Puglin Warrens (south middle): caves =================
    var WRZ = zone({ name: 'The Puglin Warrens', theme: 'moss', fam: 'puglin', line: 'Puglin territory. Tight, twisting tunnels, moss, mud and the smell of snacks gone wrong.', elite: 0.07 }, 1, 2);
    var wtun = room({ name: 'Warren Tunnels', type: 'corridor', x0: WRZ.x0, z0: WRZ.z0, x1: WRZ.x1, z1: WRZ.z1 }, WRZ);
    var WN = ['Gnawing Pit', 'Moss Den', 'Bone Garden', 'Snack Larder', 'Mud Nursery', 'Sentry Nook', 'Rag Pile', 'Root Cellar', 'The Drip', 'Gristle Hall', 'Puddle Court', 'The Burrows'];
    var caves = [], wboss = room({ name: 'Grik\'s Throne Room', type: 'boss', x0: 112, z0: 218, x1: 132, z1: 232, line: 'A cavern full of stolen snack wrappers and one very large puglin on a throne of bottle caps.' }, WRZ);
    blob(122, 225, 10, 7, function (xx, zz) { put(xx, zz, ',', wboss.id); }); caves.push(wboss);
    for (var t = 0; t < 600 && caves.length < 13; t++) {
      var rx = ri(4, 7), rz = ri(3, 6), cx2 = ri(WRZ.x0 + rx + 1, WRZ.x1 - rx - 1), cz2 = ri(WRZ.z0 + rz + 1, WRZ.z1 - rz - 1), ok = true;
      caves.forEach(function (c) { var cc = center(c); if (Math.abs(cc[0] - cx2) < rx + (c.x1 - c.x0) / 2 + 5 && Math.abs(cc[1] - cz2) < rz + (c.z1 - c.z0) / 2 + 5) ok = false; });
      if (!ok) continue;
      var cr = room({ name: WN[caves.length - 1] || 'Side Cave', type: 'room', x0: cx2 - rx, z0: cz2 - rz, x1: cx2 + rx, z1: cz2 + rz }, WRZ);
      blob(cx2, cz2, rx, rz, function (xx, zz) { if (inb(xx, zz) && xx >= WRZ.x0 && xx <= WRZ.x1 && zz >= WRZ.z0 && zz <= WRZ.z1) put(xx, zz, ',', cr.id); }); caves.push(cr);
    }
    connectAll(caves, function (a, b) { drunk(a[0], a[1], b[0], b[1], wtun.id, ','); }, 3);
    put(wboss.x0 + 4, wboss.z0 + 3, 'B'); put(wboss.x1 - 4, wboss.z0 + 3, 'B'); put(122, 230, 'C');
    spawnIn(wboss, 'puglin', { boss: true, sub: 'grik' }); spawnIn(wboss, 'puglin', { sub: 'puglin_chief' }); spawnIn(wboss, 'puglin', { tier: 2 });
    caves.forEach(function (c) { if (c === wboss) return; if (rnd() < 0.3) scatter(c, 'C', 1); if (rnd() < 0.35) scatter(c, 'B', 1); var n = ri(1, 3); for (var m = 0; m < n; m++) spawnIn(c, 'puglin', { tier: tierRoll(WRZ) }); });

    // ================= 3. Imp Union Hall (southeast corner): offices =================
    var UHZ = zone({ name: 'Imp Union Hall', theme: 'office', fam: 'imp', line: 'Imp territory. Cubicles, break rooms and endless bureaucracy. Every door has a sign-in sheet.', elite: 0.16 }, 2, 2);
    var uh = blockRooms(UHZ, { hall: 3, hallName: 'Union Hall Corridors', n: [3, 3], split: { SE: [2, 2] } });
    var UN = ['Break Room', 'Locker Room', 'Grievance Office', 'Time Clock', 'Supply Closet', 'Night Shift Lounge', 'Union Archive', 'Overtime Pit', 'Cubicle Farm', 'Payroll', 'Mailroom', 'HR (Abandoned)', 'Copy Room', 'Conference Room B', 'Water Cooler', 'Minutes Office', 'Strike Fund', 'Dispute Office', 'Seniority Lounge', 'Picket Sign Shop', 'Training Room', 'Shop Floor', 'Records', 'Bulletin Room', 'Vending Hall', 'Quiet Room', 'Parking Office', 'Badge Office', 'Elevator Lobby', 'Wellness Room', 'Benefits Desk'], un = 0;
    var uboss = uh.rooms.filter(function (r) { return r.q === 'SE' && r.gx === r.nx - 1 && r.gz === r.nz - 1; })[0];
    uboss.name = 'The Steward\'s Office'; uboss.type = 'boss'; uboss.line = 'A corner office with a view of more office. The Shop Steward has never lost a negotiation or a fistfight.';
    uh.rooms.forEach(function (r) {
      if (r === uboss) return; r.name = UN[un++] || 'Office';
      if (rnd() < 0.25) scatter(r, 'C', 1);
      if (rnd() < 0.62) { var n = ri(1, 2); for (var m = 0; m < n; m++) spawnIn(r, 'imp', { tier: tierRoll(UHZ) }); }
    });
    put(uboss.x1 - 1, uboss.z1 - 1, 'C');
    spawnIn(uboss, 'imp', { boss: true, sub: 'steward' }); spawnIn(uboss, 'imp', { sub: 'imp_foreman' }); spawnIn(uboss, 'imp', { tier: 2 });

    // ================= 4. The Flooded Archive (west middle): stacks in water =================
    var ARZ = zone({ name: 'The Flooded Archive', theme: 'water', fam: 'clerk', line: 'Knee-deep water between stacks of records. The clerks say the paperwork is load-bearing.' }, 0, 1);
    var acor = room({ name: 'Drowned Stacks', type: 'corridor', x0: ARZ.x0, z0: ARZ.z0, x1: ARZ.x1, z1: ARZ.z1 }, ARZ);
    var aw = Math.floor((ARZ.x1 - ARZ.x0 + 1 - 2 * 5) / 3), ah = Math.floor((ARZ.z1 - ARZ.z0 + 1 - 2 * 5) / 3), AN = ['Reading Pool', 'Wet Stacks', 'Card Catalog', 'Filing Sump', 'Microfiche Bog', 'Index Pond', 'Ledger Room', 'Damp Annex'], an = 0, ahalls = [];
    for (var gi = 0; gi < 3; gi++) for (var gj = 0; gj < 3; gj++) {
      var hx = ARZ.x0 + gi * (aw + 5), hz = ARZ.z0 + gj * (ah + 5), isBoss = gi === 0 && gj === 1;
      var hr = room({ name: isBoss ? 'The Records Vault' : AN[an++], type: isBoss ? 'boss' : 'room', x0: hx, z0: hz, x1: hx + aw - 1, z1: hz + ah - 1, line: isBoss ? 'The vault where the floor\'s records go to drown. The Head Archivist does not allow talking.' : null }, ARZ);
      carveRect(hr); ahalls.push(hr);
      if (isBoss) { for (var xx = hr.x0 + 2; xx < hr.x1 - 1; xx += 4) { put(xx, hr.z0 + 2, 'P'); put(xx, hr.z1 - 2, 'P'); } }
      else for (var zz = hr.z0 + 2; zz < hr.z1 - 1; zz += 3) for (xx = hr.x0 + 2; xx < hr.x1 - 1; xx++) if ((xx - hr.x0) % 7 !== 0) put(xx, zz, 'h'); // stacks with cross-aisles
      // corridors between halls, three wide, and doors onto them
      if (gi < 2) { for (zz = hz; zz <= hz + ah - 1; zz++) for (k = 1; k <= 3; k++) carve(hx + aw + k, zz, acor.id); put(hx + aw, hz + (ah >> 1), 'D', hr.id); put(hx + aw, hz + (ah >> 1) + 1, 'D', hr.id); }
      if (gi > 0) { put(hx - 1, hz + (ah >> 1), 'D', hr.id); put(hx - 1, hz + (ah >> 1) + 1, 'D', hr.id); }
      if (gj < 2) { for (xx = Math.max(ARZ.x0, hx - 4); xx <= Math.min(ARZ.x1, hx + aw + 3); xx++) for (k = 1; k <= 3; k++) carve(xx, hz + ah + k, acor.id); put(hx + (aw >> 1), hz + ah, 'D', hr.id); put(hx + (aw >> 1) + 1, hz + ah, 'D', hr.id); }
      if (gj > 0) { put(hx + (aw >> 1), hz - 1, 'D', hr.id); put(hx + (aw >> 1) + 1, hz - 1, 'D', hr.id); }
    }
    for (zz = ARZ.z0; zz <= ARZ.z1; zz++) for (xx = ARZ.x0; xx <= ARZ.x1; xx++) if (g[zz][xx] === '.' && Z_owns(ARZ, xx, zz) && rnd() < 0.55 && !nearDoor(xx, zz)) g[zz][xx] = '~';
    ahalls.forEach(function (hr) {
      if (hr.type === 'boss') { put(hr.x0 + 1, hr.z0 + 1, 'C'); spawnIn(hr, 'clerk', { boss: true, sub: 'archivist' }); spawnIn(hr, 'clerk', { sub: 'clerk_head' }); spawnIn(hr, 'clerk', { tier: 2 }); return; }
      scatter(hr, 'kK', ri(1, 2)); if (rnd() < 0.35) scatter(hr, 'C', 1); var n = ri(1, 3); for (var m = 0; m < n; m++) spawnIn(hr, 'clerk', { tier: tierRoll(ARZ) });
    });

    // ================= 5. The Underbazaar (center): an open market cavern, all safe =================
    var BZZ = zone({ name: 'The Underbazaar', theme: 'bazaar', fam: 'rat', line: 'A huge cavern market under lanterns. The vendors fled when the rats moved in. Their stock is still on the shelves, and so are the rats.' }, 1, 1);
    var plaza = room({ name: 'The Underbazaar', type: 'room', x0: BZZ.x0, z0: BZZ.z0, x1: BZZ.x1, z1: BZZ.z1 }, BZZ);
    var bcx = 120, bcz = 120;
    for (zz = BZZ.z0 + 1; zz < BZZ.z1; zz++) for (xx = BZZ.x0 + 1; xx < BZZ.x1; xx++) {
      var nx = (xx - bcx) / 35, nz = (zz - bcz) / 35, d4 = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(nz), 4), wob = (Math.sin(xx * 0.37) + Math.cos(zz * 0.29)) * 0.06;
      if (d4 < 0.82 + wob) put(xx, zz, '.', plaza.id);
    }
    function sub(name, x0, z0, x1, z1, line, safe) { var r = room({ name: name, type: safe ? 'safe' : 'room', x0: x0, z0: z0, x1: x1, z1: z1, line: line }, BZZ); for (var zz = z0; zz <= z1; zz++) for (var xx = x0; xx <= x1; xx++) if (isFloor(g[zz][xx])) reg[zz][xx] = r.id; return r; }
    var fount = sub('Fountain Square', bcx - 7, bcz - 7, bcx + 7, bcz + 7, 'A fountain that runs on something blue. Do not drink it. The rats do.');
    for (zz = bcz - 2; zz <= bcz + 2; zz++) for (xx = bcx - 2; xx <= bcx + 2; xx++) put(xx, zz, '~');
    [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(function (o) { put(bcx + o[0], bcz + o[1], 'B'); });
    var stalls = sub('Stall Row', bcx - 26, bcz - 26, bcx + 26, bcz - 12, 'Abandoned market stalls, still stocked. Search the stalls, crates and barrels. Mind the rats.');
    for (zz = stalls.z0 + 1; zz <= stalls.z1 - 1; zz += 4) for (xx = stalls.x0 + 2; xx <= stalls.x1 - 2; xx += 3) if (g[zz][xx] === '.') { put(xx, zz, 'T'); if (rnd() < 0.4 && g[zz + 1][xx] === '.') put(xx, zz + 1, pick(['b', 'R', 'K', 'v'])); }
    var night = sub('Night Market', bcx - 26, bcz + 12, bcx + 26, bcz + 26, 'The shady end of the market. Cages, carts and goods with no receipts. The rats like it here best.');
    for (zz = night.z0 + 1; zz <= night.z1 - 1; zz += 4) for (xx = night.x0 + 3; xx <= night.x1 - 3; xx += 4) if (g[zz][xx] === '.') put(xx, zz, pick(['T', 'T', 'g', 'q', 'R']));
    var craft = sub('Craft Services', bcx + 14, bcz - 8, bcx + 28, bcz + 8, 'Free food for crawlers, courtesy of the sponsors. It heals you. The bathrooms are in the back. The last safe room in the market: the rats will not come in.', true);
    for (zz = craft.z0 + 2; zz <= craft.z1 - 2; zz += 4) { put(bcx + 20, zz, 'F'); put(bcx + 21, zz, 'F'); }
    put(craft.x1 - 1, craft.z0 + 1, 'X'); put(craft.x1 - 1, craft.z0 + 3, 'X');
    sub('Rumor Corner', bcx - 28, bcz - 8, bcx - 14, bcz + 8, 'Where crawlers used to trade gossip. Now it is where the rats trade it.');
    // rat nests through the market, three or four rats apiece, with things worth finding nearby
    var NESTS = [[-18, -15], [4, -22], [20, -15], [-14, 17], [8, 22], [22, 16], [-21, 3], [-6, -30], [12, 31], [-28, 24], [27, -27]], bzNests = [];
    NESTS.forEach(function (o, ni) {
      var cx = bcx + o[0], cz = bcz + o[1], ok = null;
      for (var t = 0; t < 40 && !ok; t++) { var xx = cx + ri(-3, 3), zz = cz + ri(-3, 3); if (g[zz] && g[zz][xx] === '.' && reg[zz][xx] >= 0 && rooms[reg[zz][xx]].type !== 'safe') ok = [xx, zz]; }
      if (!ok) return; bzNests.push(ok); var n = 3 + (ni % 2);
      for (var k = 0, t2 = 0; k < n && t2 < 60; t2++) { var x2 = ok[0] + ri(-2, 2), z2 = ok[1] + ri(-2, 2); if (g[z2] && g[z2][x2] === '.' && !taken[x2 + ',' + z2] && reg[z2][x2] >= 0 && rooms[reg[z2][x2]].type !== 'safe') { taken[x2 + ',' + z2] = 1; spawns.push({ kind: 'rat', sub: 'rat', x: x2, z: z2, room: reg[z2][x2], bz: true }); k++; } }
      if (ni % 3 === 0) { for (var t3 = 0; t3 < 20; t3++) { var x3 = ok[0] + ri(-3, 3), z3 = ok[1] + ri(-3, 3); if (g[z3] && g[z3][x3] === '.' && !taken[x3 + ',' + z3] && !nearDoor(x3, z3)) { g[z3][x3] = 'C'; break; } } }
    });
    for (zz = BZZ.z0 + 8; zz < BZZ.z1 - 6; zz += 12) for (xx = BZZ.x0 + 8; xx < BZZ.x1 - 6; xx += 12) if (g[zz][xx] === '.' && reg[zz][xx] === plaza.id) put(xx, zz, 'B');
    [[-14, -32], [14, -32], [-32, 14], [32, -14], [-14, 32], [14, 32]].forEach(function (o) { for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) put(bcx + o[0] + a, bcz + o[1] + b, '#'); }); // rock columns

    // ================= 6. The Arena (east middle): a stadium =================
    var AZ = zone({ name: 'The Arena', theme: 'arena', fam: 'puglin', line: 'A stadium carved out of the rock. The stands are full of aliens, and every one of them has paid to see you get hurt.' }, 2, 1);
    var afield = room({ name: 'The Arena Floor', type: 'boss', x0: 175, z0: 98, x1: 227, z1: 142, line: 'Sand, blood and floodlights. The announcer is already introducing you. Badly.' }, AZ);
    var acx = 201, acz = 120;
    for (zz = afield.z0; zz <= afield.z1; zz++) for (xx = afield.x0; xx <= afield.x1; xx++) { var e2 = ((xx - acx) * (xx - acx)) / (26 * 26) + ((zz - acz) * (zz - acz)) / (22 * 22); if (e2 <= 1) put(xx, zz, '.', afield.id); }
    for (var an2 = 0; an2 < 32; an2++) { var ang = an2 / 32 * Math.PI * 2, px2 = Math.round(acx + Math.cos(ang) * 23), pz2 = Math.round(acz + Math.sin(ang) * 19); if (an2 % 2 === 0) put(px2, pz2, 'P'); else if (an2 % 4 === 1) put(px2, pz2, 'B'); }
    put(acx - 6, acz - 4, 'g'); put(acx + 6, acz + 4, 'g'); put(acx + 18, acz, 'C');
    spawns.push({ kind: 'puglin', boss: true, sub: 'headliner', x: acx, z: acz, room: afield.id }); taken[acx + ',' + acz] = 1;
    spawns.push({ kind: 'puglin', sub: 'puglin_brute', x: acx - 8, z: acz + 2, room: afield.id, name: 'Undercard brute' });
    spawns.push({ kind: 'imp', sub: 'imp_foreman', x: acx + 8, z: acz - 2, room: afield.id, name: 'Undercard bruiser' });

    // ================= 7. The Drowned Gardens (northwest corner): outdoors under the cavern sky =================
    var GZ = zone({ name: 'The Drowned Gardens', theme: 'garden', fam: 'bog', line: 'An overgrown cavern that feels like outdoors. Trees, ponds, fog, and things that live in the reeds.', elite: 0.14 }, 0, 0);
    var gfield = room({ name: 'The Drowned Gardens', type: 'corridor', x0: GZ.x0, z0: GZ.z0, x1: GZ.x1, z1: GZ.z1 }, GZ);
    for (zz = GZ.z0 + 1; zz < GZ.z1; zz++) for (xx = GZ.x0 + 1; xx < GZ.x1; xx++) { var edge = Math.min(xx - GZ.x0, GZ.x1 - xx, zz - GZ.z0, GZ.z1 - zz); if (edge > 1 || rnd() < 0.5) put(xx, zz, ',', gfield.id); }
    var gboss = room({ name: 'The Rotting Gazebo', type: 'boss', x0: 8, z0: 8, x1: 24, z1: 24, line: 'A gazebo swallowed by vines. Something big has been gardening here. It has been composting crawlers.' }, GZ);
    for (k = 0; k < 7; k++) blob(ri(GZ.x0 + 8, GZ.x1 - 8), ri(GZ.z0 + 8, GZ.z1 - 8), ri(2, 4), ri(2, 3), function (xx, zz) { if (inb(xx, zz) && reg[zz][xx] === gfield.id && Math.max(Math.abs(xx - 16), Math.abs(zz - 16)) > 12) g[zz][xx] = '#'; });
    for (k = 0; k < 7; k++) blob(ri(GZ.x0 + 6, GZ.x1 - 6), ri(GZ.z0 + 6, GZ.z1 - 6), ri(2, 5), ri(2, 4), function (xx, zz) { if (inb(xx, zz) && g[zz][xx] === ',' && Math.max(Math.abs(xx - 16), Math.abs(zz - 16)) > 12) g[zz][xx] = '~'; });
    for (zz = GZ.z0 + 2; zz < GZ.z1 - 1; zz++) for (xx = GZ.x0 + 2; xx < GZ.x1 - 1; xx++) {
      if (g[zz][xx] !== ',' || Math.max(Math.abs(xx - 16), Math.abs(zz - 16)) <= 10) continue;
      var nn = Math.sin(xx * 0.21 + 1.3) * Math.cos(zz * 0.17 - 0.4) + Math.sin((xx + zz) * 0.09);
      if (nn > 0.8 && rnd() < 0.3) g[zz][xx] = 'Y'; else if (rnd() < 0.008) g[zz][xx] = 'Y';
    }
    for (zz = gboss.z0; zz <= gboss.z1; zz++) for (xx = gboss.x0; xx <= gboss.x1; xx++) if ((xx - 16) * (xx - 16) + (zz - 16) * (zz - 16) <= 64) put(xx, zz, ',', gboss.id);
    for (k = 0; k < 6; k++) put(Math.round(16 + Math.cos(k / 6 * Math.PI * 2) * 4), Math.round(16 + Math.sin(k / 6 * Math.PI * 2) * 4), 'P');
    put(16, 16, 'C');
    var GN = [['Lily Pond', 'Lily pads big enough to stand on. Do not stand on them.'], ['The Mushroom Ring', 'A perfect circle of mushrooms. Stepping inside feels like a contract.'], ['Willow Hollow', 'The trees lean in close. The fog is thick enough to hide in.'], ['The Old Greenhouse', 'A glass greenhouse, mostly broken. The plants inside are winning.'], ['Reed Marsh', 'Tall reeds and soft mud. Something keeps moving just out of sight.'], ['Picnic Lawn', 'A sponsor\'s picnic, abandoned mid-sandwich.']];
    var glist = [gboss];
    GN.forEach(function (gn, k) {
      for (var t = 0; t < 80; t++) {
        var cx3 = ri(GZ.x0 + 8, GZ.x1 - 8), cz3 = ri(GZ.z0 + 8, GZ.z1 - 8), ok = true;
        glist.forEach(function (o) { var c = center(o); if (Math.abs(c[0] - cx3) < 16 && Math.abs(c[1] - cz3) < 16) ok = false; }); if (!ok) continue;
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

    // ================= 8. The Stairwell Gate (northeast corner): the way down =================
    var SGZ = zone({ name: 'The Stairwell Gate', theme: 'gate', fam: 'imp', line: 'The last stretch of the floor. The stairs down are close, and so is whatever is guarding them.' }, 2, 0);
    var appr = room({ name: 'The Approach', type: 'hall', x0: 196, z0: 34, x1: 205, z1: SGZ.z1 - 1, line: 'A long hall built to make you feel small. It works.' }, SGZ);
    carveRect(appr); for (zz = appr.z0 + 2; zz < appr.z1; zz += 4) { put(appr.x0, zz, 'P'); put(appr.x1, zz, 'P'); } put(appr.x0 + 1, appr.z0 + 6, 'B'); put(appr.x1 - 1, appr.z0 + 6, 'B'); put(appr.x0 + 1, appr.z1 - 6, 'B'); put(appr.x1 - 1, appr.z1 - 6, 'B');
    var gh = room({ name: 'The Gatehouse', type: 'boss', x0: 188, z0: 10, x1: 213, z1: 30, line: 'The gatehouse. The thing that guards the stairs has been waiting for you specifically. It read your file.' }, SGZ);
    carveRect(gh); passage(200, 31, 200, 33, gh.id, '.', 4);
    for (xx = gh.x0 + 3; xx < gh.x1 - 2; xx += 5) { put(xx, gh.z0 + 3, 'P'); put(xx, gh.z1 - 3, 'P'); } put(gh.x0 + 1, gh.z0 + 1, 'B'); put(gh.x1 - 1, gh.z0 + 1, 'B'); put(gh.x0 + 1, gh.z1 - 1, 'B'); put(gh.x1 - 1, gh.z1 - 1, 'B');
    var stairR = room({ name: 'The Stairwell', type: 'stairs', x0: 221, z0: 6, x1: 233, z1: 16, line: 'A sealed square of stone in the middle of the floor, humming faintly. Whatever is under it answers to the Gatekeeper.' }, SGZ);
    carveRect(stairR); passage(214, 12, 220, 12, gh.id, '.', 2); put(227, 9, 'S'); put(222, 7, 'c'); put(232, 7, 'c'); var stairs = { x: 227, z: 9 };
    var lcs = room({ name: 'Last Chance Lounge', type: 'safe', x0: 180, z0: 46, x1: 192, z1: 56, line: 'A safe room before the end. Free food, a mirror, and a sign that says GOOD LUCK in six languages.' }, SGZ);
    carveRect(lcs); put(lcs.x1 + 1, 51, 'D', lcs.id); put(lcs.x1 + 2, 51, '.', appr.id); put(lcs.x1 + 3, 51, '.', appr.id); put(lcs.x0 + 1, lcs.z0 + 1, 'F'); put(lcs.x0 + 2, lcs.z0 + 1, 'F'); put(lcs.x0 + 1, lcs.z1 - 1, 'X'); put(lcs.x1 - 1, lcs.z0 + 1, 'c');
    var troph = room({ name: 'The Trophy Room', type: 'room', x0: 209, z0: 50, x1: 221, z1: 60, line: 'Trophies from crawlers who did not make it down. Some of them are still warm.' }, SGZ);
    carveRect(troph); put(troph.x0 - 1, 55, 'D', troph.id); put(troph.x0 - 2, 55, '.', appr.id); put(troph.x0 - 3, 55, '.', appr.id); scatter(troph, 'WWkv', 4); put(troph.x1 - 1, troph.z0 + 1, 'C');
    spawns.push({ kind: 'imp', sub: 'imp_foreman', x: 199, z: 44, room: appr.id, guard: true, name: 'Gate guard' }); spawns.push({ kind: 'imp', sub: 'imp_foreman', x: 202, z: 44, room: appr.id, guard: true, name: 'Gate guard' });
    spawnIn(troph, 'imp', { tier: 2 });
    spawns.push({ kind: 'imp', boss: true, sub: 'gatekeeper', x: 200, z: 20, room: gh.id }); spawns.push({ kind: 'imp', sub: 'imp_foreman', x: 196, z: 22, room: gh.id }); spawns.push({ kind: 'puglin', sub: 'puglin_chief', x: 205, z: 22, room: gh.id });

    // ---------- shrubs: little scavengers spread across the floor ----------
    [[PCZ, 3], [WRZ, 6], [UHZ, 4], [ARZ, 4], [GZ, 8], [SGZ, 1]].forEach(function (zn) {
      var Z = zn[0], list = Z.rooms.filter(function (r) { return r.type === 'room' || r.type === 'corridor'; });
      for (var k = 0; k < zn[1]; k++) spawnIn(pick(list), 'shrub', { sub: 'shrub1' });
    });
    [westway, eastway, upper, lower].forEach(function (b) { for (var k = 0; k < 2; k++) for (var t = 0; t < 30; t++) { var xx = ri(b.x0, b.x1), zz = ri(b.z0, b.z1); if (g[zz][xx] === '.' && !taken[xx + ',' + zz]) { taken[xx + ',' + zz] = 1; spawns.push({ kind: 'shrub', sub: 'shrub1', x: xx, z: zz, room: b.id }); break; } } });

    // ---------- rats: packs of one to three in the hallways and along the boulevards ----------
    [[PCZ, 3], [WRZ, 5], [UHZ, 4], [ARZ, 4], [AZ, 2], [GZ, 3]].forEach(function (zn) {
      var list = zn[0].rooms.filter(function (r) { return r.type === 'corridor'; }); if (!list.length) list = zn[0].rooms.filter(function (r) { return r.type === 'room'; }); if (!list.length) return;
      var used = {}; for (var k = 0; k < zn[1]; k++) { var cr = pick(list); if (used[cr.id] && list.length > k) cr = pick(list); if (used[cr.id]) continue; used[cr.id] = 1; var n = 1 + Math.floor(rnd() * 2); for (var j = 0; j < n; j++) spawnIn(cr, 'rat', { sub: 'rat' }); }
    });
    [westway, eastway, upper, lower].forEach(function (b) { for (var k = 0; k < 2; k++) { var n = 1 + Math.floor(rnd() * 2); for (var t = 0; t < 30 && n > 0; t++) { var xx = ri(b.x0, b.x1), zz = ri(b.z0, b.z1); if (g[zz][xx] === '.' && !taken[xx + ',' + zz]) { taken[xx + ',' + zz] = 1; spawns.push({ kind: 'rat', sub: 'rat', x: xx, z: zz, room: b.id }); n--; } } } });

    // ---------- gates: zones open onto the boulevards ----------
    gate(PCZ, 'E', pc.hz0 + 1, 'Processing Exit'); gate(PCZ, 'N', pc.hx0 + 1, 'Processing North Doors');
    gate(WRZ, 'W', 205, 'Warren Mouth'); gate(WRZ, 'N', 120, 'Warren Burrow'); gate(WRZ, 'E', 200, 'Warren Back Door');
    gate(UHZ, 'W', uh.hz0 + 1, 'Union Hall Lobby'); gate(UHZ, 'N', uh.hx0 + 1, 'Union Hall Loading Dock');
    gate(ARZ, 'E', 120, 'Archive Steps'); gate(ARZ, 'N', 38, 'Archive North Door'); gate(ARZ, 'S', 38, 'Archive South Door');
    gate(BZZ, 'W', 120, 'Bazaar West Gate'); gate(BZZ, 'E', 120, 'Bazaar East Gate'); gate(BZZ, 'N', 120, 'Bazaar North Gate'); gate(BZZ, 'S', 120, 'Bazaar South Gate');
    gate(AZ, 'W', 120, 'Contestant Tunnel'); gate(AZ, 'S', 201, 'Ticket Hall'); gate(AZ, 'N', 201, 'Victory Tunnel');
    gate(GZ, 'S', 38, 'Garden Path'); gate(GZ, 'E', 38, 'Garden Gate');
    gate(SGZ, 'S', 200, 'The Last Mile');

    // ---------- hidden rooms: behind a wall that hides a door, off any corridor ----------
    var HN = ['A Forgotten Closet', 'The Secret Stash', 'A Smugglers\' Nook', 'The Producer\'s Hideout', 'The Writers\' Room', 'An Unlisted Dressing Room', 'The Blooper Vault', 'A Sponsor\'s Lost Crate', 'The Stunt Double\'s Bunk', 'The Censor\'s Office'], hidden = 0;
    for (t = 0; t < 4000 && hidden < HN.length; t++) {
      var hx2 = ri(4, Wd - 10), hz2 = ri(4, Hd - 10), hw2 = ri(3, 5), hh2 = ri(3, 4);
      if (!free(hx2, hz2, hx2 + hw2, hz2 + hh2)) continue;
      var sides = [[hx2 - 2, hz2 + 1, hx2 - 1, hz2 + 1], [hx2 + hw2 + 2, hz2 + 1, hx2 + hw2 + 1, hz2 + 1], [hx2 + 1, hz2 - 2, hx2 + 1, hz2 - 1], [hx2 + 1, hz2 + hh2 + 2, hx2 + 1, hz2 + hh2 + 1]], okS = null;
      sides.forEach(function (sd) { if (!okS && inb(sd[0], sd[1]) && isFloor(g[sd[1]][sd[0]]) && rooms[reg[sd[1]][sd[0]]] && rooms[reg[sd[1]][sd[0]]].type === 'corridor') okS = sd; });
      if (!okS) continue;
      var hzn = null; zones.forEach(function (Z) { if (hx2 >= Z.cell[0] && hx2 <= Z.cell[2] && hz2 >= Z.cell[1] && hz2 <= Z.cell[3]) hzn = Z; });
      var hr2 = room({ name: HN[hidden], theme: 'store', type: 'hidden', x0: hx2, z0: hz2, x1: hx2 + hw2, z1: hz2 + hh2, line: 'A hidden room. Nobody was supposed to find this.' });
      carveRect(hr2); put(okS[2], okS[3], 'H', hr2.id); var hc = center(hr2); put(hc[0], hc[1], 'C'); hidden++;
    }


    // ================= set dressing: furniture against walls, tables with things on them, rugs, banners =================
    // Each room gets a style from what it is (an office, a break room, a cave, a market). Blocking furniture becomes
    // an 'o' tile with its own name; everything else is decoration drawn on top of the floor.
    var decor = {}, dname = {};
    function dec(x, z, m, o) { var d = { m: m }; for (var k in o) d[k] = o[k]; (decor[x + ',' + z] || (decor[x + ',' + z] = [])).push(d); }
    function freeT(x, z, r) { return inb(x, z) && (!r || reg[z][x] === r.id) && (g[z][x] === '.' || g[z][x] === ',') && !nearDoor(x, z) && !taken[x + ',' + z]; }
    function obj(x, z, m, o, name) { if (!freeT(x, z)) return false; g[z][x] = 'o'; dname[x + ',' + z] = name || m.replace(/_/g, ' ').replace(/ ?\d+$/, ''); dec(x, z, m, o); return true; }
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
    function banner(x, z, w, m) { dec(x, z, m || pick(['Banner_1', 'Banner_2']), { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.46, dz: w[1] * 0.46, y: 1.48, fit: 0.9, hang: true, ns: true }); }
    function stack(x, z, w) { var m = pick(['Crate_Wooden', 'Crate_Wooden', 'Crate_Metal', 'Barrel', 'Barrel_Apples', 'FarmCrate_Carrot']); if (!obj(x, z, m, hug(w, { fit: /Barrel/.test(m) ? 0.62 : 0.8, rot: rnd() * 0.4 + Math.atan2(-w[0], -w[1]) }), /Barrel/.test(m) ? 'Barrel' : 'Crate')) return false;
      if (/Crate_/.test(m) && rnd() < 0.5) dec(x, z, pick(['Crate_Wooden', 'Bag', 'Bucket_Metal']), { y: 0.62, fit: 0.5, rot: rnd() * 6, dx: w[0] * 0.24, dz: w[1] * 0.24 }); return true; }
    var STYLE = mkStyle();
    function mkStyle() { return {
      office: function (r) { for (var zz = r.z0 + 1; zz < r.z1 - 1; zz += 3) for (var xx = r.x0 + 1; xx < r.x1; xx += 3) desk(xx, zz, r); alongWall(r, 3, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet', 'Shelf_Simple', 'Bookcase_2']); }); },
      meeting: function (r) { var c = center(r); rug(r, 0x3a3f5a); for (var xx = c[0] - 1; xx <= c[0] + 1; xx++) if (freeT(xx, c[1], r)) { obj(xx, c[1], 'Table_Large', { fit: 1.1 }, 'Conference table'); onTable(xx, c[1], ['Scroll_1', 'Mug']); dec(xx, c[1] - 1, 'Chair_1', { fit: 0.42, dz: 0.25 }); dec(xx, c[1] + 1, 'Chair_1', { fit: 0.42, rot: Math.PI, dz: -0.25 }); } alongWall(r, 2, function (x, z, w) { return shelfUnit(x, z, w, ['Cabinet', 'Bookcase_2']); }); },
      break: function (r) { var c = center(r); diningSet(c[0], c[1], r, true); alongWall(r, 2, function (x, z, w) { return shelfUnit(x, z, w, ['Shelf_Small_Bottles', 'Cabinet']); }); alongWall(r, 2, function (x, z, w) { return stack(x, z, w); }); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); }); },
      lounge: function (r) { rug(r, 0x6a2a3a); alongWall(r, 3, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Couch'); }); alongWall(r, 2, function (x, z, w) { banner(x, z, w); return true; }); },
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
      snack: function (r) { rug(r, 0x2a5a4a); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); }); },
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
      office: function (r) {
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
      meeting: function (r) { var c = spotNear(r, [[-1, 0], [0, 0], [1, 0]]) || center(r); rug(r, 0x2f3a5a);
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
      var st = BYNAME[r.name] || (r.type === 'safe' && r.theme === 'crypt' ? 'safehouse' : r.hood === WRZ.idx && r.type !== 'corridor' ? 'cave' : r.hood === UHZ.idx && r.type === 'room' ? 'office' : r.hood === PCZ.idx && r.type === 'room' ? 'office' : r.hood === ARZ.idx && r.type === 'room' ? 'archive' : null);
      if (st && STYLE[st]) STYLE[st](r);
    });
    // the Underbazaar: proper market stalls with goods, carts, a wagon and benches round the fountain
    for (zz = stalls.z0 + 1; zz <= stalls.z1 - 1; zz++) for (xx = stalls.x0; xx <= stalls.x1; xx++) if (g[zz][xx] === 'T') { g[zz][xx] = '.'; if (g[zz + 1] && 'bRKv'.indexOf(g[zz + 1][xx]) >= 0) g[zz + 1][xx] = '.'; }
    for (zz = night.z0; zz <= night.z1; zz++) for (xx = night.x0; xx <= night.x1; xx++) if (g[zz][xx] === 'T') g[zz][xx] = '.';
    for (zz = stalls.z0 + 2; zz <= stalls.z1 - 1; zz += 5) for (xx = stalls.x0 + 2; xx <= stalls.x1 - 3; xx += 4) if (freeT(xx, zz, null) && freeT(xx + 1, zz, null)) {
      obj(xx, zz, 'Stall_Empty', { fit: 1.8, rot: 0, dx: 0.5 }, 'Market stall'); g[zz][xx + 1] = 'o'; dname[xx + ',' + zz] = dname[(xx + 1) + ',' + zz] = 'Market stall';
      dec(xx, zz + 1, pick(['FarmCrate_Apple', 'FarmCrate_Carrot', 'Barrel_Apples']), { fit: 0.5, rot: rnd() * 0.5 }); if (rnd() < 0.6) dec(xx + 1, zz + 1, pick(['Bag', 'Pouch_Large', 'Vase_2', 'Bucket_Wooden_1']), { fit: 0.36, rot: rnd() * 6 });
      if (rnd() < 0.55 && freeT(xx - 1, zz, null)) g[zz][xx - 1] = rnd() < 0.6 ? 'K' : 'R'; // stock left behind: search it
    }
    for (zz = night.z0 + 2; zz <= night.z1 - 1; zz += 5) for (xx = night.x0 + 3; xx <= night.x1 - 4; xx += 5) if (freeT(xx, zz, null) && freeT(xx + 1, zz, null) && freeT(xx - 1, zz, null)) {
      obj(xx, zz, 'Stall_Cart_Empty', { fit: 2.0, rot: 0, dx: -0.3 }, 'Cart stall'); g[zz][xx - 1] = 'o'; dname[(xx - 1) + ',' + zz] = 'Cart stall'; if (rnd() < 0.5) dec(xx + 1, zz, pick(['Cage_Small', 'Potion_2', 'SmallBottles_1']), { fit: 0.4 });
    }
    [[-6, 0, Math.PI / 2], [6, 0, -Math.PI / 2], [0, -6, 0], [0, 6, Math.PI]].forEach(function (o) { var x2 = bcx + o[0], z2 = bcz + o[1]; if (freeT(x2, z2, null)) obj(x2, z2, 'Bench', { fit: 1.0, rot: o[2] }, 'Bench'); });
    // rat nests: shredded sacks, gnawed crates, bones and a hoard
    bzNests.forEach(function (n) { for (var k = 0; k < 7; k++) { var x2 = n[0] + ri(-2, 2), z2 = n[1] + ri(-2, 2); if (!freeT(x2, z2, null)) continue;
      dec(x2, z2, pick(['Bag', 'Vase_Rubble_Medium', 'Rope_1', 'Bag', 'Bucket_Wooden_1', 'Coin_Pile']), { fit: 0.3 + rnd() * 0.15, rot: rnd() * 6, dx: (rnd() - 0.5) * 0.5, dz: (rnd() - 0.5) * 0.5, ns: true }); } });
    // lanterns on poles and spilled goods across the open market
    for (zz = BZZ.z0 + 4; zz < BZZ.z1 - 3; zz += 7) for (xx = BZZ.x0 + 4; xx < BZZ.x1 - 3; xx += 7) { var lx = xx + ri(-1, 1), lz = zz + ri(-1, 1); if (freeT(lx, lz, null) && reg[lz][lx] === plaza.id && rnd() < 0.45) { if (rnd() < 0.5) obj(lx, lz, 'Torch_Metal', { h: 1.5 }, 'Lamp post'); else dec(lx, lz, pick(['FarmCrate_Apple', 'Bag', 'Pouch_Large', 'Vase_Rubble_Medium']), { fit: 0.4, rot: rnd() * 6, ns: true }); } }
    if (freeT(bcx - 22, bcz + 4, null)) { obj(bcx - 22, bcz + 4, 'Prop_Wagon', { fit: 2.4, rot: 0.3 }, 'Wagon'); [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (o) { if (freeT(bcx - 22 + o[0], bcz + 4 + o[1], null)) { g[bcz + 4 + o[1]][bcx - 22 + o[0]] = 'o'; dname[(bcx - 22 + o[0]) + ',' + (bcz + 4 + o[1])] = 'Wagon'; } }); }
    for (zz = craft.z0; zz <= craft.z1; zz++) if (freeT(craft.x0, zz, null) && (zz - craft.z0) % 3 !== 1) dec(craft.x0, zz, 'Prop_WoodenFence_Single', { fit: 1.0, rot: Math.PI / 2 });
    // the gardens: fences round the picnic and the greenhouse, vines on the rock, benches in the clearings
    glist.forEach(function (cl) {
      if (cl.name === 'Picnic Lawn') { var c = center(cl); diningSet(c[0], c[1], cl, true); for (var xx = cl.x0; xx <= cl.x1; xx++) { if (freeT(xx, cl.z0, cl) && xx % 3) dec(xx, cl.z0, 'Prop_WoodenFence_Single', { fit: 1.0 }); if (freeT(xx, cl.z1, cl) && xx % 3) dec(xx, cl.z1, 'Prop_WoodenFence_Single', { fit: 1.0 }); } }
      else if (cl.type === 'room' && cl.name !== 'The Old Greenhouse') { var c2 = center(cl); if (freeT(c2[0] + 2, c2[1], cl)) obj(c2[0] + 2, c2[1], 'Bench', { fit: 1.0, rot: -Math.PI / 2 }, 'Garden bench'); }
    });
    for (zz = GZ.z0; zz <= GZ.z1; zz++) for (xx = GZ.x0; xx <= GZ.x1; xx++) { if (g[zz][xx] !== ',' || rnd() > 0.06) continue; var w = wallOf(xx, zz); if (w) dec(xx, zz, pick(['Prop_Vine2', 'Prop_Vine5']), { rot: Math.atan2(-w[0], -w[1]), dx: w[0] * 0.48, dz: w[1] * 0.48, y: 1.4, fit: 0.8, hang: true, ns: true }); }
    // banners down the boulevards and round the Arena; banners and benches in the Approach
    [westway, eastway, upper, lower, gateCon].forEach(function (b) { var n = 0; for (var zz = b.z0; zz <= b.z1; zz++) for (var xx = b.x0; xx <= b.x1; xx++) { var w = wallOf(xx, zz); if (!w || g[zz][xx] !== '.' || ((xx + zz) % 11)) continue; banner(xx, zz, w); n++; } });
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
    // boulevards: benches, bins and lamp posts, so the long walks have landmarks
    [westway, eastway, upper, lower, gateCon].forEach(function (b) { wallSpots(b).forEach(function (p) { if (rnd() > 0.05) return; var x = p[0], z = p[1], w = wallOf(x, z); if (!w || !freeT(x, z, b)) return; var k = rnd();
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
    dec(200, 20, 'Chandelier', { y: 2.4, fit: 1.4, hang: true, ns: true });
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
    return { W: Wd, H: Hd, map: map, reg: reg, rooms: rooms, spawns: spawns, start: start, hoods: zones, stairs: stairs, lost: lost, decor: decor, dname: dname };

    // ===================== Floor 2: The Backlot =====================
    // A studio backlot: Catering Village (the one safe hub) in the middle, ringed by the Backlot Loop, with six sets
    // round it, each one short street away. Studio Drive North and South cross the lot. Soundstage 9 (the gate) is
    // north of the hub, up Director's Row. Every building is stamped from a hand-drawn template (TPL); upper floors
    // and the roof live in a strip below the lot (z 240 and down) and the stairs take you there.
    function backlot() {
      decor = {}; dname = {}; D4 = [[0, -1], [0, 1], [-1, 0], [1, 0]]; TOP = 0.36;
      STYLE = mkStyle(); MODERN = mkModern(); for (var mk2 in MODERN) STYLE[mk2] = MODERN[mk2];
      var wstyle = {}, links = {}, upstairs = [], UPZ = 240, xx, zz, k, i;
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
        saloon: { name: 'The Saloon', sign: 'SALOON', line: 'Swinging doors, a long bar, a piano that plays itself badly and three card games nobody is winning.',
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
        store: { name: 'General Store', sign: 'GENERAL STORE', line: 'Shelves to the ceiling, barrels of everything and a counter with a bell nobody rings.', rows: [
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
        bank: { name: 'The Bank', sign: 'BANK', line: 'A bank with a vault behind bars and a teller cage. The money is fake. The vault is not.',
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
        jail: { name: 'Sheriff\'s Office', sign: 'SHERIFF', line: 'The sheriff\'s office and three cells. The cells have not been cleaned since the pilot episode.',
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
        depot: { name: 'Train Depot', sign: 'DEPOT', line: 'A train depot with benches, a ticket window and a timetable for trains that never leave.', rows: [
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
        hotel: { name: 'The Hotel', sign: 'HOTEL', line: 'A hotel lobby, four rooms upstairs that are actually downstairs, and a guest book full of stunt doubles.',
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
        telegraph: { name: 'Telegraph Office', sign: 'TELEGRAPH', line: 'A telegraph office. The machine clicks on its own. Nobody here knows Morse code.', rows: [
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
        saloonUp: { name: 'Saloon Upstairs', line: 'Upstairs at the saloon: a landing and four rented rooms. The floorboards report everything you do.', theme: 'store',
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
        hotelUp: { name: 'Hotel Upstairs', line: 'The hotel\'s upper floor: a long hall of numbered doors. Room 7 is locked from the inside.', theme: 'store',
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
        craft: { name: 'Craft Services', type: 'safe', wall: 'canvas', stripe: 0xc8302a, theme: 'tent', line: 'The craft services tent. Free food, hot coffee and a crew that has seen things.', rows: [
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
        bunk: { name: 'The Bunkhouse', type: 'safe', wall: 'canvas', stripe: 0x2a5a8a, theme: 'tent', line: 'Bunks for the crawlers, a washroom and a TV that only gets the show.',
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
        ward: { name: 'Wardrobe Tent', type: 'safe', wall: 'canvas', stripe: 0xc8962a, theme: 'tent', line: 'Racks of costumes from every set on the lot, and a mirror that is nicer to you than it should be.', rows: [
          '##W####W####W##',
          '#CCCC...CCCC..#',
          '#.............#',
          '#.;;;..d..;;;.#',
          '#.............#',
          '#L..u......f.L#',
          '######DD#######']
        },
        prod: { name: 'Production Office', type: 'safe', wall: 'canvas', stripe: 0x3a3a3a, theme: 'tent', line: 'Call sheets, clipboards and a whiteboard with today\'s shoots on it.', rows: [
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
        showrunner: { name: 'The Showrunner\'s House', type: 'boss', wall: 'siding', wallCol: 0xf0e6d0, theme: 'house', line: 'The biggest house on the street, with bleachers for a live studio audience right there in the living room.',
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
        manor: { name: 'Blackwood Manor', wall: 'manor', theme: 'manor', line: 'A haunted house set. Animatronics on timers, secret doors and a butler who is mostly hydraulics.', rows: GEN_MANOR,
          areas: [{ name: 'The Kitchen', c0: 1, r0: 1, c1: 12, r1: 12 }, { name: 'The Ballroom', c0: 14, r0: 1, c1: 41, r1: 12, type: 'boss', line: 'A ballroom where the dancers are on a track. The Butler Unit is waiting by the punch bowl.' }, { name: 'The Study', c0: 43, r0: 1, c1: 54, r1: 5 },
            { name: 'The Portrait Gallery', c0: 43, r0: 7, c1: 54, r1: 12 }, { name: 'The Library', c0: 1, r0: 14, c1: 20, r1: 26 }, { name: 'The Foyer', c0: 22, r0: 14, c1: 33, r1: 26 }, { name: 'The Dining Hall', c0: 35, r0: 14, c1: 54, r1: 26 }] },
        manorUp: { name: 'Blackwood Manor, Upstairs', wall: 'manor', theme: 'manor', line: 'The upper floor. Every door creaks in a different key.', rows: GEN_MANORUP,
          areas: [{ name: 'Master Bedroom', c0: 1, r0: 1, c1: 10, r1: 5 }, { name: 'The Nursery', c0: 12, r0: 1, c1: 21, r1: 5 }, { name: 'Upstairs Study', c0: 23, r0: 1, c1: 32, r1: 5 }, { name: 'Guest Room', c0: 34, r0: 1, c1: 43, r1: 5 }, { name: 'The Bathroom', c0: 45, r0: 1, c1: 54, r1: 5 },
            { name: 'The Landing', c0: 1, r0: 7, c1: 54, r1: 9, type: 'corridor' }, { name: 'Servant\'s Room', c0: 1, r0: 11, c1: 10, r1: 15 }, { name: 'The Blue Room', c0: 12, r0: 11, c1: 21, r1: 15 }, { name: 'Attic Storage', c0: 23, r0: 11, c1: 32, r1: 15 },
            { name: 'The Red Room', c0: 34, r0: 11, c1: 43, r1: 15 }, { name: 'The Widow\'s Room', c0: 45, r0: 11, c1: 54, r1: 15 }] },
        ship: { name: 'Starship Valiant', wall: 'panel', theme: 'ship', line: 'A starship set. Foam walls, blinking panels and costume goblins who think they are a real crew.', rows: GEN_SHIP,
          areas: [{ name: 'Main Corridor', c0: 31, r0: 9, c1: 34, r1: 35, type: 'corridor' }, { name: 'Cross Corridor', c0: 1, r0: 18, c1: 64, r1: 19, type: 'corridor' },
            { name: 'The Bridge', c0: 22, r0: 1, c1: 43, r1: 8, type: 'boss', line: 'The bridge. Captain Zorr is in the big chair, and he has never once broken character.' }, { name: 'Briefing Room', c0: 1, r0: 1, c1: 20, r1: 8 }, { name: 'Science Lab', c0: 45, r0: 1, c1: 64, r1: 8 },
            { name: 'Med Bay', c0: 1, r0: 10, c1: 14, r1: 16 }, { name: 'Captain\'s Quarters', c0: 16, r0: 10, c1: 29, r1: 16 }, { name: 'The Holodeck', c0: 36, r0: 10, c1: 49, r1: 16, theme: 'stage' }, { name: 'Transporter Room', c0: 51, r0: 10, c1: 64, r1: 16 },
            { name: 'Mess Hall', c0: 1, r0: 21, c1: 20, r1: 27 }, { name: 'Rec Room', c0: 22, r0: 21, c1: 29, r1: 27 }, { name: 'Crew Quarters', c0: 36, r0: 21, c1: 64, r1: 27 }, { name: 'Cargo Hold', c0: 1, r0: 29, c1: 29, r1: 35 }, { name: 'Engine Room', c0: 36, r0: 29, c1: 64, r1: 35 }] },
        writers: { name: 'The Writers\' Building', wall: 'plaster', theme: 'office', line: 'The writers are on strike. Picket signs, cold coffee and imps with opinions.', rows: GEN_WRITERS,
          areas: [{ name: 'Writers\' Room A', c0: 1, r0: 1, c1: 14, r1: 10 }, { name: 'Writers\' Room B', c0: 16, r0: 1, c1: 29, r1: 10 }, { name: 'The Script Library', c0: 31, r0: 1, c1: 44, r1: 10 }, { name: 'Head Writer\'s Office', c0: 46, r0: 1, c1: 60, r1: 10 },
            { name: 'Upper Hall', c0: 1, r0: 12, c1: 60, r1: 13, type: 'corridor' }, { name: 'The Cubicle Farm', c0: 1, r0: 15, c1: 40, r1: 23 }, { name: 'Writers\' Break Room', c0: 42, r0: 15, c1: 60, r1: 23 }, { name: 'Lower Hall', c0: 1, r0: 25, c1: 60, r1: 26, type: 'corridor' },
            { name: 'Strike Headquarters', c0: 1, r0: 28, c1: 22, r1: 36 }, { name: 'The Lobby', c0: 24, r0: 28, c1: 37, r1: 36 }, { name: 'The Mailroom', c0: 39, r0: 28, c1: 60, r1: 36 }] },
        roof: { name: 'The Penthouse Green', type: 'boss', wall: 'stone', theme: 'green', line: 'A rooftop putting green, mowed to a sixteenth of an inch. Do not step on it. Somebody is watching.', rows: GEN_ROOF,
          areas: [{ name: 'Dermot\'s Clubhouse', c0: 1, r0: 15, c1: 11, r1: 22, type: 'room', theme: 'house' }, { name: 'Roof Access', c0: 32, r0: 19, c1: 37, r1: 21, type: 'room', theme: 'stage' }] },
        stage: { name: 'Soundstage 9', type: 'boss', wall: 'stage', theme: 'stage', line: 'A cavernous stage, half a western street and half a starship. A crane in the middle. The Director is watching.', rows: GEN_STAGE,
          areas: [{ name: 'Control Booth', c0: 2, r0: 2, c1: 13, r1: 8, type: 'room' }, { name: 'The Freight Elevator', c0: 48, r0: 2, c1: 59, r1: 10, type: 'stairs', line: 'A freight elevator to the floor below. It only runs when the Director says cut.' }] }
      };
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
        var rm = room({ name: nm, type: o.type || T.type || 'room', theme: theme, line: o.line || T.line, x0: bb.x0, z0: bb.z0, x1: bb.x1, z1: bb.z1 }, Z);
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
          g[z][x] = c === '~' ? '~' : c === '*' ? 'F' : c === '$' ? 'S' : c === '|' ? 'P' : c === 'X' ? 'X' : c === 'R' ? 'R' : c === '%' ? 'K' : c === 'J' ? 'q' : '.';
          if (c === '$') rm.stairsDown = [x, z];
        }
        var all = [rm];
        (T.areas || []).forEach(function (ar) { var q0 = at(ar.c0, ar.r0), q1 = at(ar.c1, ar.r1);
          var sr = room({ name: ar.name, type: ar.type || o.type || T.type || 'room', theme: ar.theme || theme, line: ar.line, x0: Math.min(q0[0], q1[0]), z0: Math.min(q0[1], q1[1]), x1: Math.max(q0[0], q1[0]), z1: Math.max(q0[1], q1[1]) }, Z);
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
            case 'P': obj(x2, z2, '#piano', { rot: face, dx: wl ? wl[0] * 0.15 : 0, dz: wl ? wl[1] * 0.15 : 0 }, 'Piano'); dec(x2 - (wl ? wl[0] : 0), z2 - (wl ? wl[1] : 0), 'Stool', { fit: 0.3 }); break;
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
            case 'q': { var dr = wl ? [-wl[0], -wl[1]] : fv, drot = Math.atan2(dr[0], dr[1]);
              if (F(x2, z2, 'desk', 0.98, drot, 'Desk')) { onTop(x2, z2, 'computerScreen', { m: 'desk', fit: 0.98 }, { fit: 0.42, rot: drot, dx: -dr[0] * 0.1, dz: -dr[1] * 0.1 }); onTop(x2, z2, 'computerKeyboard', { m: 'desk', fit: 0.98 }, { fit: 0.34, rot: drot, dx: dr[0] * 0.12, dz: dr[1] * 0.12 });
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
            case 'v': F(x2, z2, 'kitchenFridgeLarge', 0.9, face, 'Vending machine', wl ? { dx: wl[0] * 0.1, dz: wl[1] * 0.1 } : {}); break;
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
        return { room: rm, porch: porch, all: all, box: bb };
      }
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
      [[100, 104], [108, 104], [130, 104], [138, 104], [130, 117], [138, 117], [100, 117]].forEach(function (p) { if (freeT(p[0], p[1], vil)) diningSet(p[0], p[1], vil, true); });
      F(112, 107, 'kitchenFridgeLarge', 0.9, Math.PI, 'Vending machine'); F(113, 107, 'kitchenFridgeLarge', 0.9, Math.PI, 'Vending machine');
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
      built.forEach(function (b) { if (b.room.name !== 'The Chapel' && b.room.name !== 'Train Depot') pack(b.room, 'puglin', ri(1, 3), 0, 'Stunt kobold'); });
      // upper floors live in the spare strip along the bottom of the map; the stairs take you there and back
      var salUp = stamp(TPL.saloonUp, 4, 244, 0, FT), hotUp = stamp(TPL.hotelUp, 32, 244, 0, FT); roofRing(salUp.box, 3); roofRing(hotUp.box, 3);
      upstairs.push([built[1].room, salUp.room, 'Go upstairs', 'Go back downstairs'], [built[5].room, hotUp.room, 'Go upstairs', 'Go back downstairs']);
      pack(salUp.room, 'puglin', 2, 0, 'Stunt kobold'); pack(hotUp.room, 'puglin', 2, 0, 'Stunt kobold');
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
      pack(ftown, 'puglin', 4, 0, 'Stunt kobold');

      // ---------- The Writers' Building (northwest): offices on strike, the Penthouse Green on the roof ----------
      var WB = Zn({ name: 'The Writers\' Building', theme: 'lot', line: 'The writers are on strike. Picket signs, cold coffee and imps with opinions.' });
      var plaza = area({ name: 'Picket Line', type: 'corridor', x0: 8, z0: 45, x1: 74, z1: 52, line: 'A picket line outside the Writers\' Building. The signs are very well written.' }, WB);
      area({ name: 'Picket Line', type: 'corridor', x0: 38, z0: 53, x1: 42, z1: 55 }, WB); area({ name: 'Picket Line', type: 'corridor', x0: 3, z0: 6, x1: 8, z1: 52 }, WB); area({ name: 'Loading Yard', type: 'corridor', x0: 71, z0: 6, x1: 74, z1: 44 }, WB);
      var wb = stamp(TPL.writers, 9, 7, 0, WB);
      var roof = stamp(TPL.roof, 4, 258, 0, WB); roofRing(roof.box, 3);
      upstairs.push([wb.room, roof.room, 'Take the stairs to the roof', 'Go back down']);
      roomsOf(wb, /Writers|Cubicle|Strike|Break|Mailroom|Library/).forEach(function (r) { pack(r, 'imp', ri(1, 3), 0, 'Striking writer'); });
      spawnIn(roof.room, 'clerk', { tier: 3, name: 'Dermot Stoker', boss: true });
      for (xx = 10; xx <= 72; xx += 6) if (freeT(xx, 49, plaza)) obj(xx, 49, '#picket', { rot: rnd() - 0.5 }, 'Picket sign');
      pack(plaza, 'imp', 3, 1, 'Picketing writer');

      // ---------- Soundstage 9 (north): the gate, up Director's Row ----------
      var SS = Zn({ name: 'Soundstage 9', theme: 'stage', line: 'The biggest stage on the lot. The Director is up on the crane, and the sets change when he says so.' });
      var stg = stamp(TPL.stage, 88, 6, 0, SS);
      var stairs2 = stg.room.stairsDown ? { x: stg.room.stairsDown[0], z: stg.room.stairsDown[1] } : { x: 142, z: 12 };
      spawnIn(stg.room, 'imp', { tier: 3, name: 'The Director', boss: true }); pack(stg.room, 'puglin', 4, 2, 'Stage crew');

      // ---------- Starship Valiant (northeast) ----------
      var SV = Zn({ name: 'Starship Valiant', theme: 'lot', line: 'A starship set. Foam walls, blinking panels and costume goblins who think they are a real crew.' });
      area({ name: 'Hangar Apron', type: 'corridor', x0: 165, z0: 44, x1: 234, z1: 52 }, SV); area({ name: 'Hangar Apron', type: 'corridor', x0: 198, z0: 53, x1: 202, z1: 55 }, SV);
      area({ name: 'Hangar Apron', type: 'corridor', x0: 165, z0: 6, x1: 166, z1: 43 }, SV); area({ name: 'Hangar Apron', type: 'corridor', x0: 233, z0: 6, x1: 234, z1: 43 }, SV);
      var sv = stamp(TPL.ship, 167, 7, 0, SV);
      roomsOf(sv, /Quarters|Mess|Lab|Med|Cargo|Engine|Transporter|Holodeck|Rec|Briefing/).forEach(function (r) { pack(r, 'clerk', ri(1, 2), 0, 'Costume goblin'); });
      var bridge = roomsOf(sv, /Bridge/)[0]; if (bridge) spawnIn(bridge, 'clerk', { tier: 3, name: 'Captain Zorr', boss: true });
      for (k = 0; k < 6; k++) { var hx3 = ri(168, 232), hz3 = ri(45, 51); if (freeT(hx3, hz3)) obj(hx3, hz3, pick(['Crate_Metal', 'Barrel', 'cardboardBoxClosed']), { fit: 0.7, rot: rnd() }, 'Equipment'); }

      // ---------- The Jungle Set (east): trees, a river with a bridge, a temple, the Groundskeeper's shed ----------
      var JS = Zn({ name: 'The Jungle Set', theme: 'garden', line: 'A jungle under studio lights. Real plants, fake rocks and things that bite either way.' });
      var jung = area({ name: 'The Jungle Set', type: 'corridor', x0: 182, z0: 68, x1: 234, z1: 156 }, JS);
      area({ name: 'The Jungle Set', type: 'corridor', x0: 205, z0: 63, x1: 209, z1: 67 }, JS); area({ name: 'The Jungle Set', type: 'corridor', x0: 205, z0: 157, x1: 209, z1: 159 }, JS);
      var brg = room({ name: 'Rope Bridge', type: 'corridor', theme: 'porch', x0: 206, z0: 120, x1: 209, z1: 140, line: 'A rope bridge over the river. It sways more than a set piece should.' }, JS);
      for (xx = 182; xx <= 234; xx++) { var rz2 = Math.round(128 + Math.sin((xx - 182) / 9) * 6); for (zz = rz2; zz <= rz2 + 2; zz++) { if (xx >= 206 && xx <= 209) put(xx, zz, '.', brg.id); else put(xx, zz, '~', jung.id); } }
      var jclear = area({ name: 'The Groundskeeper\'s Clearing', type: 'boss', theme: 'garden', x0: 214, z0: 138, x1: 231, z1: 154, line: 'A clearing with a tool shed and a very large hedge trimmer. The Groundskeeper keeps this jungle tidy.' }, JS);
      stamp(TPL.shed, 219, 139, 0, JS); stamp(TPL.temple, 190, 80, 0, JS);
      spawnIn(jclear, 'bog', { tier: 3, name: 'The Groundskeeper', boss: true });
      trees(jung, 220, ['CommonTree_1', 'CommonTree_3', 'Pine_2']); greens(jung, 260, ['Fern_1', 'Plant_1', 'Plant_7', 'Bush_Common', 'Mushroom_Laetiporus', 'Grass_Wispy_Tall']);
      for (k = 0; k < 6; k++) pack(jung, 'bog', ri(1, 3), 0, 'Jungle beast');

      // ---------- Maple Lane (southwest): six sitcom houses, front yards, the Showrunner's house ----------
      var ML = Zn({ name: 'Maple Lane', theme: 'lawn', line: 'A sitcom street. Six identical houses, perfect lawns and a laugh track that never stops.' });
      var lane = area({ name: 'Maple Lane', type: 'corridor', x0: 8, z0: 171, x1: 110, z1: 213 }, ML);
      var mstreet = area({ name: 'Maple Lane', type: 'corridor', theme: 'lot', x0: 8, z0: 196, x1: 115, z1: 200 }, ML); area({ name: 'Maple Lane', type: 'corridor', x0: 50, z0: 167, x1: 54, z1: 170 }, ML);
      var HCOL = [0xe8e0c8, 0xc8d8e0, 0xe8c8c0, 0xd0e0c0, 0xeed8a0, 0xd8c8e0];
      for (i = 0; i < 6; i++) {
        var hx = 10 + i * 17, hb = stamp(TPL.house, hx, 174, 0, ML, { name: 'No. ' + (i + 1) + ' Maple Lane', wallCol: HCOL[i] });
        var hu = stamp(TPL.houseUp, 54 + i * 17, 244, 0, ML, { name: 'No. ' + (i + 1) + ', Upstairs', wallCol: HCOL[i] }); roofRing(hu.box, 2);
        upstairs.push([hb.room, hu.room, 'Go upstairs', 'Go back downstairs']);
        pack(hb.room, 'puglin', ri(1, 2), 0, 'Laugh-track gremlin'); if (rnd() < 0.5) pack(hu.room, 'puglin', 1, 0, 'Laugh-track gremlin');
        for (xx = hx; xx <= hx + 14; xx++) if (Math.abs(xx - hx - 7) > 0 && freeT(xx, 193, lane)) obj(xx, 193, '#rail', { ax: 'x', col: 0xf4f0e6, picket: true }, 'Picket fence');
        for (zz = 187; zz <= 195; zz++) if (g[zz][hx + 7] === '.' || g[zz][hx + 7] === ',') dec(hx + 7, zz, '#path', { ns: true });
        if (freeT(hx + 9, 194, lane)) obj(hx + 9, 194, '#mailbox', { rot: 0 }, 'Mailbox');
        if (freeT(hx + 2, 190, lane)) obj(hx + 2, 190, 'CommonTree_3', { fit: 2.0, rot: rnd() * 6 }, 'Tree');
      }
      var srh = stamp(TPL.showrunner, 40, 203, 2, ML); spawnIn(srh.room, 'puglin', { tier: 3, name: 'The Showrunner', boss: true });
      for (xx = 44; xx <= 64; xx++) for (zz = 211; zz <= 212; zz++) put(xx, zz, '~', lane.id);
      [[42, 212], [66, 212], [42, 211]].forEach(function (p) { if (freeT(p[0], p[1], lane)) dec(p[0], p[1], 'loungeChairRelax', { fit: 0.7, rot: Math.PI / 2 }); });
      for (xx = 12; xx <= 108; xx += 9) if (freeT(xx, 202, lane)) obj(xx, 202, 'CommonTree_3', { fit: 2.2, rot: rnd() * 6 }, 'Tree');
      greens(lane, 40, ['Bush_Common_Flowers', 'Flower_3_Group', 'Clover_1']); pack(mstreet, 'puglin', 3, 0, 'Laugh-track gremlin');

      // ---------- Blackwood Manor (southeast): the mansion, its upper floor, a graveyard ----------
      var BM = Zn({ name: 'Blackwood Manor', theme: 'moss', line: 'A haunted house set. Animatronics on timers, secret doors and a butler who is mostly hydraulics.' });
      var grounds = area({ name: 'Manor Grounds', type: 'corridor', x0: 127, z0: 171, x1: 234, z1: 213 }, BM);
      area({ name: 'Manor Grounds', type: 'corridor', x0: 122, z0: 196, x1: 126, z1: 200 }, BM); area({ name: 'Manor Grounds', type: 'corridor', x0: 180, z0: 167, x1: 184, z1: 170 }, BM);
      var bm = stamp(TPL.manor, 150, 174, 2, BM), bmu = stamp(TPL.manorUp, 160, 244, 0, BM); roofRing(bmu.box, 3);
      upstairs.push([bm.room, bmu.room, 'Climb the grand staircase', 'Go back downstairs']);
      roomsOf(bm, /Kitchen|Library|Dining|Study|Gallery|Foyer/).forEach(function (r) { pack(r, 'imp', ri(1, 2), 0, 'Animatronic'); });
      roomsOf(bmu, /Room|Nursery|Study|Attic/).forEach(function (r) { if (rnd() < 0.6) pack(r, 'imp', 1, 0, 'Animatronic'); });
      var ball = roomsOf(bm, /Ballroom/)[0]; if (ball) spawnIn(ball, 'imp', { tier: 3, name: 'The Butler Unit', boss: true });
      // the graveyard: iron fence, rows of headstones, dead trees
      var gy = room({ name: 'The Graveyard', type: 'room', theme: 'moss', x0: 211, z0: 178, x1: 231, z1: 208, line: 'A graveyard full of foam headstones. Some of the names are crawlers from earlier seasons.' }, BM);
      for (zz = 178; zz <= 208; zz++) for (xx = 211; xx <= 231; xx++) if (g[zz][xx] === '.' || g[zz][xx] === ',') reg[zz][xx] = gy.id;
      for (xx = 211; xx <= 231; xx++) [178, 208].forEach(function (z) { if (xx !== 221 && freeT(xx, z)) obj(xx, z, '#rail', { ax: 'x', col: 0x26262c, iron: true }, 'Iron fence'); });
      for (zz = 179; zz <= 207; zz++) [211, 231].forEach(function (x) { if (zz !== 193 && freeT(x, zz)) obj(x, zz, '#rail', { ax: 'z', col: 0x26262c, iron: true }, 'Iron fence'); });
      for (zz = 181; zz <= 205; zz += 3) for (xx = 214; xx <= 228; xx += 3) if (rnd() < 0.85 && freeT(xx, zz)) obj(xx, zz, '#grave', { rot: (rnd() - 0.5) * 0.3, seed: xx * 31 + zz }, 'Headstone');
      trees(grounds, 50, ['DeadTree_2', 'Pine_2']); greens(grounds, 60, ['Mushroom_Common', 'Grass_Wispy_Tall', 'Rock_Medium_1']);

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
