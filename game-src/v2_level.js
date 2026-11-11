
  // ===================== Level One generator: the grand layout =====================
  // A fixed seed, so every player shares the same floor. 240 x 240 tiles laid out as a 3 x 3 grid of zones
  // joined by four grand boulevards. You start in the southwest corner (the Processing Center) and the stairs
  // are in the northeast corner (the Stairwell Gate), reached only through the Arena. Every boulevard ends in a
  // small safe room with free food. Each zone has its own architecture: studio halls, caves, offices, flooded
  // stacks, an open market cavern, an outdoor garden, a stadium and a gatehouse.
  // Map characters: # wall · . floor · , moss/grass floor · ~ water · D door · H hidden door · S stairs · @ start
  //   P pillar · B brazier · C loot box · K crate · R barrel · T table/desk/stall · W weapon rack · U training dummy
  //   b sack · h shelf · c candle stand · q cauldron · k book stand · g cage · v vase · X bathroom · F free food · Y tree
  function genLevel(seed) {
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
    put(green.x1 - 1, green.z0 + 1, 'B'); put(green.x0 + 1, green.z1 - 1, 'c'); put(green.x1 - 1, green.z0 + 3, 'v');
    spawns.push({ kind: 'imp', npc: 'pip', x: gc[0] + 1, z: gc[1] + 1, room: green.id }); taken[(gc[0] + 1) + ',' + (gc[1] + 1)] = 1;
    var PCN = ['Intake', 'Makeup & Prosthetics', 'Wardrobe Department', 'Stage 3', 'Casting Office', 'Prop Storage', 'Orientation Theater', 'Medical (Closed)', 'Contracts Office', 'Waiver Signing', 'Holding Pen B', 'Loading Dock', 'Craft Services Annex', 'Control Room'], pn = 0;
    pc.rooms.forEach(function (r) {
      if (r === green) return; r.name = PCN[pn++] || 'Back Office';
      if (r.name === 'Stage 3') { scatter(r, 'U', 3); scatter(r, 'W', 1); r.line = 'A practice stage with training dummies. Hit them. They are paid to take it.'; }
      else if (r.name === 'Prop Storage') scatter(r, 'C', 1);
      if (r.name === 'Holding Pen B' || r.name === 'Loading Dock') { var n = r.name === 'Loading Dock' ? 2 : 1; for (var m = 0; m < n; m++) spawnIn(r, 'puglin', { tier: 1, name: 'Escaped reject' }); r.line = 'Something got out of its holding pen. It is small, angry and in your way. Practice on it.'; }
    });
    for (var k = 0; k < 6; k++) { var hp = [pc.hx0 + ri(0, 3), PCZ.z0 + ri(3, PCZ.z1 - PCZ.z0 - 3)]; if (g[hp[1]][hp[0]] === '.') put(hp[0], hp[1], 'c'); }

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
    var BZZ = zone({ name: 'The Underbazaar', theme: 'bazaar', fam: null, line: 'A huge cavern market under lanterns. Stalls, gossip, and a strict no-violence policy enforced by a very large teleporter.' }, 1, 1);
    var plaza = room({ name: 'The Underbazaar', type: 'safe', x0: BZZ.x0, z0: BZZ.z0, x1: BZZ.x1, z1: BZZ.z1 }, BZZ);
    var bcx = 120, bcz = 120;
    for (zz = BZZ.z0 + 1; zz < BZZ.z1; zz++) for (xx = BZZ.x0 + 1; xx < BZZ.x1; xx++) {
      var nx = (xx - bcx) / 35, nz = (zz - bcz) / 35, d4 = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(nz), 4), wob = (Math.sin(xx * 0.37) + Math.cos(zz * 0.29)) * 0.06;
      if (d4 < 0.82 + wob) put(xx, zz, '.', plaza.id);
    }
    function sub(name, x0, z0, x1, z1, line) { var r = room({ name: name, type: 'safe', x0: x0, z0: z0, x1: x1, z1: z1, line: line }, BZZ); for (var zz = z0; zz <= z1; zz++) for (var xx = x0; xx <= x1; xx++) if (isFloor(g[zz][xx])) reg[zz][xx] = r.id; return r; }
    var fount = sub('Fountain Square', bcx - 7, bcz - 7, bcx + 7, bcz + 7, 'A fountain that runs on something blue. Do not drink it. Everyone does.');
    for (zz = bcz - 2; zz <= bcz + 2; zz++) for (xx = bcx - 2; xx <= bcx + 2; xx++) put(xx, zz, '~');
    [[-4, -4], [4, -4], [-4, 4], [4, 4]].forEach(function (o) { put(bcx + o[0], bcz + o[1], 'B'); });
    var stalls = sub('Stall Row', bcx - 26, bcz - 26, bcx + 26, bcz - 12, 'Rows of empty market stalls. The vendors are on their way, the System promises.');
    for (zz = stalls.z0 + 1; zz <= stalls.z1 - 1; zz += 4) for (xx = stalls.x0 + 2; xx <= stalls.x1 - 2; xx += 3) if (g[zz][xx] === '.') { put(xx, zz, 'T'); if (rnd() < 0.4 && g[zz + 1][xx] === '.') put(xx, zz + 1, pick(['b', 'R', 'K', 'v'])); }
    var night = sub('Night Market', bcx - 26, bcz + 12, bcx + 26, bcz + 26, 'The shady end of the market. Lanterns, cages and goods with no receipts.');
    for (zz = night.z0 + 1; zz <= night.z1 - 1; zz += 4) for (xx = night.x0 + 3; xx <= night.x1 - 3; xx += 4) if (g[zz][xx] === '.') put(xx, zz, pick(['T', 'T', 'g', 'q', 'R']));
    var craft = sub('Craft Services', bcx + 14, bcz - 8, bcx + 28, bcz + 8, 'Free food for crawlers, courtesy of the sponsors. It heals you. The bathrooms are in the back.');
    for (zz = craft.z0 + 2; zz <= craft.z1 - 2; zz += 4) { put(bcx + 20, zz, 'F'); put(bcx + 21, zz, 'F'); }
    put(craft.x1 - 1, craft.z0 + 1, 'X'); put(craft.x1 - 1, craft.z0 + 3, 'X');
    sub('Rumor Corner', bcx - 28, bcz - 8, bcx - 14, bcz + 8, 'Where crawlers trade gossip. Nobody is here yet. That is its own kind of rumor.');
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
    var stairR = room({ name: 'The Stairwell', type: 'stairs', x0: 221, z0: 6, x1: 233, z1: 16, line: 'The stairs down to Floor 2. Step on them when your whole party is ready.' }, SGZ);
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
      var hr2 = room({ name: HN[hidden], theme: 'store', type: 'hidden', x0: hx2, z0: hz2, x1: hx2 + hw2, z1: hz2 + hh2, line: 'A hidden room. The audience gasps on cue.' });
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
    var STYLE = {
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
      snack: function (r) { rug(r, 0x2a5a4a); alongWall(r, 1, function (x, z, w) { return obj(x, z, 'Bench', hug(w, { fit: 1.0 }), 'Bench'); }); },
      trophy: function (r) { alongWall(r, 4, function (x, z, w) { banner(x, z, w); return true; }); rug(r, 0x5a1a1a); },
      archive: function (r) { var c = center(r); if (freeT(c[0], r.z0 + 1, r)) obj(c[0], r.z0 + 1, 'BookStand', { h: 1.0 }, 'Reading stand'); dec(c[0] + 1, r.z0 + 1, 'CandleStick_Stand', { h: 1.0 }); alongWall(r, 3, function (x, z, w) { dec(x, z, pick(['Book_Stack_1', 'Book_Stack_2', 'BookGroup_Medium_1', 'Scroll_1']), { fit: 0.35, rot: rnd() * 6 }); return true; }); }
    };
    var BYNAME = { 'Intake': 'office', 'Contracts Office': 'office', 'Waiver Signing': 'office', 'Casting Office': 'meeting', 'Control Room': 'office', 'Makeup & Prosthetics': 'wardrobe', 'Wardrobe Department': 'wardrobe', 'Prop Storage': 'storage', 'Loading Dock': 'storage',
      'Orientation Theater': 'theater', 'Medical (Closed)': 'bunk', 'Holding Pen B': 'cells', 'Craft Services Annex': 'break', 'Stage 3': 'lounge',
      'Break Room': 'break', 'Water Cooler': 'break', 'Vending Hall': 'break', 'Night Shift Lounge': 'lounge', 'Seniority Lounge': 'lounge', 'Quiet Room': 'lounge', 'Wellness Room': 'lounge', 'Locker Room': 'wardrobe',
      'Supply Closet': 'storage', 'Mailroom': 'storage', 'Copy Room': 'storage', 'Records': 'storage', 'Union Archive': 'storage', 'Strike Fund': 'storage', 'Picket Sign Shop': 'workshop', 'Shop Floor': 'workshop', 'Training Room': 'workshop',
      'Conference Room B': 'meeting', 'Grievance Office': 'meeting', 'Dispute Office': 'meeting', 'Minutes Office': 'meeting', 'Snack Larder': 'storage', 'Mud Nursery': 'cells', 'The Trophy Room': 'trophy', 'Last Chance Lounge': 'snack', 'The Green Room': 'lounge', 'The Steward\'s Office': 'meeting' };
    rooms.forEach(function (r) {
      var st = BYNAME[r.name] || (r.type === 'safe' && r.theme === 'crypt' ? 'snack' : r.hood === WRZ.idx && r.type !== 'corridor' ? 'cave' : r.hood === UHZ.idx && r.type === 'room' ? 'office' : r.hood === PCZ.idx && r.type === 'room' ? 'office' : r.hood === ARZ.idx && r.type === 'room' ? 'archive' : null);
      if (st && STYLE[st]) STYLE[st](r);
    });
    // the Underbazaar: proper market stalls with goods, carts, a wagon and benches round the fountain
    for (zz = stalls.z0 + 1; zz <= stalls.z1 - 1; zz++) for (xx = stalls.x0; xx <= stalls.x1; xx++) if (g[zz][xx] === 'T') { g[zz][xx] = '.'; if (g[zz + 1] && 'bRKv'.indexOf(g[zz + 1][xx]) >= 0) g[zz + 1][xx] = '.'; }
    for (zz = night.z0; zz <= night.z1; zz++) for (xx = night.x0; xx <= night.x1; xx++) if (g[zz][xx] === 'T') g[zz][xx] = '.';
    for (zz = stalls.z0 + 2; zz <= stalls.z1 - 1; zz += 5) for (xx = stalls.x0 + 2; xx <= stalls.x1 - 3; xx += 4) if (freeT(xx, zz, null) && freeT(xx + 1, zz, null)) {
      obj(xx, zz, 'Stall_Empty', { fit: 1.8, rot: 0, dx: 0.5 }, 'Market stall'); g[zz][xx + 1] = 'o'; dname[xx + ',' + zz] = dname[(xx + 1) + ',' + zz] = 'Market stall';
      dec(xx, zz + 1, pick(['FarmCrate_Apple', 'FarmCrate_Carrot', 'Barrel_Apples']), { fit: 0.5, rot: rnd() * 0.5 }); if (rnd() < 0.6) dec(xx + 1, zz + 1, pick(['Bag', 'Pouch_Large', 'Vase_2', 'Bucket_Wooden_1']), { fit: 0.36, rot: rnd() * 6 });
    }
    for (zz = night.z0 + 2; zz <= night.z1 - 1; zz += 5) for (xx = night.x0 + 3; xx <= night.x1 - 4; xx += 5) if (freeT(xx, zz, null) && freeT(xx + 1, zz, null) && freeT(xx - 1, zz, null)) {
      obj(xx, zz, 'Stall_Cart_Empty', { fit: 2.0, rot: 0, dx: -0.3 }, 'Cart stall'); g[zz][xx - 1] = 'o'; dname[(xx - 1) + ',' + zz] = 'Cart stall'; if (rnd() < 0.5) dec(xx + 1, zz, pick(['Cage_Small', 'Potion_2', 'SmallBottles_1']), { fit: 0.4 });
    }
    [[-6, 0, Math.PI / 2], [6, 0, -Math.PI / 2], [0, -6, 0], [0, 6, Math.PI]].forEach(function (o) { var x2 = bcx + o[0], z2 = bcz + o[1]; if (freeT(x2, z2, null)) obj(x2, z2, 'Bench', { fit: 1.0, rot: o[2] }, 'Bench'); });
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
  }
