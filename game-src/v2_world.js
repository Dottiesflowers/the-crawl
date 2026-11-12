
  // ---------- small helpers ----------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hexs(n) { return '#' + ('000000' + (n >>> 0).toString(16)).slice(-6); }
  function shade(c, f) { var q = new THREE.Color(c); q.r = Math.min(1, q.r * f); q.g = Math.min(1, q.g * f); q.b = Math.min(1, q.b * f); return q.getHex(); }
  function mix(a, b, f) { var q = new THREE.Color(a); q.lerp(new THREE.Color(b), f); return q.getHex(); }
  function rnd(seed) { var s = (seed >>> 0) || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function px(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w === undefined ? 1 : w, h === undefined ? 1 : h); }
  function hash(x, z) { var n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }

  // ---------- painted textures: every block gets pixel shading, grain and edges ----------
  var TEX = {}, MAT = {};
  function tex(key, w, h, draw, smooth) {
    if (TEX[key]) return TEX[key];
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4;
    if (smooth) t.magFilter = THREE.LinearFilter;
    TEX[key] = t; return t;
  }
  // second pass over a painted texture: soften the stair-steps and add fine grain at full resolution
  function refine(g, w, h, soft, amp, seed) {
    var im = g.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d), r = rnd(seed || 5), x, y, c, i, n, l, rt, u, dn;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = (y * w + x) * 4; l = (y * w + (x + w - 1) % w) * 4; rt = (y * w + (x + 1) % w) * 4; u = (((y + h - 1) % h) * w + x) * 4; dn = (((y + 1) % h) * w + x) * 4;
      n = (r() - 0.5) * 2 * amp * 255;
      for (c = 0; c < 3; c++) d[i + c] = o[i + c] * (1 - soft) + (o[l + c] + o[rt + c] + o[u + c] + o[dn + c]) / 4 * soft + n;
    }
    g.putImageData(im, 0, 0);
  }
  var AMP = { cloth: 0.2, stone: 0.36, skin: 0.07, metal: 0.12, wood: 0.12, leather: 0.18, hair: 0, slime: 0.3, bone: 0.14 };
  function surf(kind, color, w, h, seed) {
    return tex(kind + color + '_' + w + 'x' + h + '_' + (seed || 0), w, h, function (g) {
      var r = rnd(color * 7 + w * 131 + h * 17 + (seed || 0) * 977 + kind.length * 31);
      var base = hexs(color), d1 = hexs(shade(color, 0.84)), d2 = hexs(shade(color, 0.66)), l1 = hexs(mix(color, 0xffffff, 0.13)), l2 = hexs(mix(color, 0xffffff, 0.3));
      var x, y, q, amp = AMP[kind] === undefined ? 0.2 : AMP[kind];
      px(g, base, 0, 0, w, h);
      if (kind === 'hair') {
        for (x = 0; x < w; x++) { q = r(); px(g, q < 0.38 ? d2 : (q < 0.62 ? base : (q < 0.86 ? d1 : l1)), x, 0, 1, h); }
        for (q = 0; q < w * h / 9; q++) px(g, l1, Math.floor(r() * w), Math.floor(r() * h), 1, Math.min(3, h));
      } else {
        for (y = 0; y < h; y++) for (x = 0; x < w; x++) { q = r(); if (q < amp * 0.6) px(g, d1, x, y); else if (q > 1 - amp * 0.4) px(g, l1, x, y); }
      }
      if (kind === 'cloth' && h >= 9 && w >= 5) { var n = 1 + Math.floor(r() * 2); while (n--) { x = 1 + Math.floor(r() * (w - 3)); for (y = 2; y < h - 1; y++) if (r() > 0.22) { px(g, d1, x, y); if (r() > 0.6) px(g, l1, x + 1, y); } } }
      if (kind === 'stone' && w >= 9 && h >= 9 && r() > 0.45) { x = 2 + Math.floor(r() * (w - 4)); y = 1; while (y < h - 1 && x > 0 && x < w - 1) { px(g, d2, x, y); y += 1; if (r() > 0.5) x += r() > 0.5 ? 1 : -1; } }
      if (kind === 'metal') {
        var hy = Math.max(1, Math.floor(h * 0.22)); if (h >= 5) { px(g, l2, 1, hy, w - 2, 1); px(g, l1, 1, hy + 1, w - 2, 1); px(g, d1, 0, h - Math.max(1, Math.floor(h * 0.25)), w, Math.max(1, Math.floor(h * 0.25))); }
        if (w >= 8 && h >= 8) [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]].forEach(function (p) { px(g, l2, p[0], p[1]); px(g, d2, p[0], p[1] + 1 < h ? p[1] + 1 : p[1]); });
        for (q = 0; q < w * h / 40; q++) { x = Math.floor(r() * (w - 3)); y = Math.floor(r() * h); px(g, l1, x, y, 2 + Math.floor(r() * 2), 1); }
      }
      if (kind === 'wood') { x = 0; while (x < w) { px(g, d1, x, 0, 1, h); if (r() > 0.5 && h > 4) px(g, d2, x, Math.floor(r() * (h - 2)), 1, 2); x += 2 + Math.floor(r() * 3); } }
      if (kind === 'leather' && w >= 7 && h >= 7) { for (x = 1; x < w - 1; x += 2) { px(g, l1, x, 1); px(g, l1, x, h - 2); } for (y = 1; y < h - 1; y += 2) { px(g, l1, 1, y); px(g, l1, w - 2, y); } }
      if (kind === 'flute') { for (x = 0; x < w; x += 4) { px(g, d2, x, 2, 1, h - 4); px(g, l2, x + 1, 2, 1, h - 4); } }
      if (kind === 'slime') for (q = 0; q < w * h / 14; q++) { x = Math.floor(r() * w); y = Math.floor(r() * h); px(g, l2, x, y); px(g, d2, x, Math.min(h - 1, y + 1)); }
      if (w >= 4 && h >= 4) { px(g, l1, 0, 0, w, 1); px(g, d1, 0, h - 1, w, 1); px(g, d1, w - 1, 0, 1, h); if (kind !== 'skin' && kind !== 'hair') px(g, d2, w - 1, h - 1); }
    });
  }
  function surfMat(kind, color, w, h) {
    var key = kind + color + '_' + w + 'x' + h;
    if (!MAT[key]) MAT[key] = new THREE.MeshLambertMaterial({ map: surf(kind, color, w, h, 0) });
    return MAT[key];
  }
  function flatMat(color) { var k = 'f' + color; if (!MAT[k]) MAT[k] = new THREE.MeshLambertMaterial({ color: color }); return MAT[k]; }
  function glowMat(color) { var k = 'g' + color; if (!MAT[k]) MAT[k] = new THREE.MeshBasicMaterial({ color: color }); return MAT[k]; }

  // ---------- rounded blocks: a box whose edges and corners are pulled onto a curve ----------
  var GEO = {};
  function roundGeo(w, h, d, r, seg, shape) {
    var key = [w.toFixed(3), h.toFixed(3), d.toFixed(3), r.toFixed(3), String(seg), shape || ''].join('_');
    if (GEO[key]) return GEO[key];
    var sg3 = seg.length ? seg : [seg, seg, seg], isHead = !!shape && (shape.indexOf('head') === 0 || shape.indexOf('hcap') === 0);
    var g = new THREE.BoxGeometry(w, h, d, sg3[0], sg3[1], sg3[2]), pos = g.attributes.position, nor = g.attributes.normal;
    var uv = g.attributes.uv, o = new THREE.Vector3();
    var ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r, v = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // spread the grid so more points land on the curved part
      if (!isHead) { v.x = spread(v.x, w / 2, ix); v.y = spread(v.y, h / 2, iy); } v.z = spread(v.z, d / 2, iz);
      c.set(clamp(v.x, -ix, ix), clamp(v.y, -iy, iy), clamp(v.z, -iz, iz));
      n.copy(v).sub(c); if (n.lengthSq() < 1e-10) n.fromBufferAttribute(nor, i); n.normalize();
      o.fromBufferAttribute(nor, i);
      v.copy(c).addScaledVector(n, r);
      // keep the painted texture undistorted: project it flat onto each face
      if (Math.abs(o.x) > 0.5) uv.setXY(i, (o.x > 0 ? -v.z : v.z) / d + 0.5, v.y / h + 0.5);
      else if (Math.abs(o.y) > 0.5) uv.setXY(i, v.x / w + 0.5, (o.y > 0 ? -v.z : v.z) / d + 0.5);
      else uv.setXY(i, (o.z > 0 ? v.x : -v.x) / w + 0.5, v.y / h + 0.5);
      if (isHead) {
        var cap = shape.indexOf('hcap') === 0, fx0 = v.x, fy0 = v.y, nsI = cap ? 0 : Number(shape.charAt(4)), fsI = Number(shape.charAt(cap ? 4 : 5)) || 0;
        headProfile(v, h, d, fsI);
        var wz = clamp((n.z - 0.15) / 0.5, 0, 1);
        if (!cap && wz > 0) { var e = 0.0015, fb = faceBump(fx0, fy0, nsI, fsI);
          var bx = (faceBump(fx0 + e, fy0, nsI, fsI) - faceBump(fx0 - e, fy0, nsI, fsI)) / (2 * e), by = (faceBump(fx0, fy0 + e, nsI, fsI) - faceBump(fx0, fy0 - e, nsI, fsI)) / (2 * e);
          v.z += fb * wz; n.x -= bx * wz; n.y -= by * wz; n.normalize(); }
      }
      if (shape === 'lock') { var tl = (v.y / (h / 2) + 1) / 2; v.x *= 0.22 + 0.78 * tl; v.z *= 0.45 + 0.55 * tl; }
      if (shape === 'ear') { var te = v.y / (h / 2); if (te < 0) { v.z *= 1 - 0.4 * te * te; v.z += 0.006 * te * te; } else v.z *= 1 - 0.12 * te * te; }
      pos.setXYZ(i, v.x, v.y, v.z); nor.setXYZ(i, n.x, n.y, n.z);
    }
    pos.needsUpdate = true; nor.needsUpdate = true; uv.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
    GEO[key] = g; return g;
  }
  function spread(a, half, inner) { // remap a face-grid coordinate so half the steps fall inside the rounded band
    var s = a < 0 ? -1 : 1, t = Math.abs(a) / half; if (half - inner < 1e-6) return a;
    return s * (t < 0.5 ? inner * (t / 0.5) : inner + (half - inner) * ((t - 0.5) / 0.5));
  }

  // ---------- map ----------
  // DM mode: which floor this device is on, and whether monsters are peaceful. Kept per device for now.
  var DM = (function () { var d = {}; try { d = JSON.parse(localStorage.getItem('crawl-dm') || '{}') || {}; } catch (e) {}
    try { var q = new URLSearchParams(location.search); if (q.get('floor')) d.floor = +q.get('floor'); if (q.get('peace')) d['peace' + (d.floor === 2 ? 2 : 1)] = q.get('peace') === '1'; } catch (e) {}
    if (d.floor !== 2) d.floor = 1; if (d.peace1 === undefined) d.peace1 = false; if (d.peace2 === undefined) d.peace2 = true; // monsters on Floor 2 start peaceful while it is being built
    d.peace = d['peace' + d.floor]; return d; })();
  function dmSave() { try { localStorage.setItem('crawl-dm', JSON.stringify(DM)); } catch (e) {} }
  function dmFloor(n) { DM.floor = n; dmSave(); try { if (typeof posStash === 'function') posStash(); } catch (e) {} setTimeout(function () { location.href = location.pathname; }, 150); }
  var FLOOR = DM.floor;
  var LEVEL = FLOOR === 2 ? genLevel(2026, 2) : genLevel(1970), MAP = LEVEL.map;
  var H = MAP.length, W = MAP[0].length;
  // the room (from the generator) a tile belongs to; walls borrow a neighbouring room's look
  function roomInfo(x, z) {
    var r = LEVEL.reg[z] && LEVEL.reg[z][x];
    if (r >= 0) return LEVEL.rooms[r];
    for (var k = 0; k < 8; k++) { var dx = [1, -1, 0, 0, 1, 1, -1, -1][k], dz = [0, 0, 1, -1, 1, -1, 1, -1][k], q = LEVEL.reg[z + dz] && LEVEL.reg[z + dz][x + dx]; if (q >= 0) return LEVEL.rooms[q]; }
    return null;
  }
  function roomAt(x, z) { var r = roomInfo(x, z); return r ? r.theme : 'hall'; }
  var ROOMS = {
    crypt: { name: 'Safe Room', floor: [0x6a655c, 0x746e63, 0x5f5a52], wall: 0x7d7468 },
    hall:  { name: 'Pillar Hall', floor: [0x8a7256, 0x7a6449, 0x8f7a60], wall: 0x8f7a5e },
    moss:  { name: 'The Overgrowth', floor: [0x5d5f52, 0x676a5a, 0x54574b], wall: 0x6a7460 },
    store: { name: 'The Storeroom', floor: [0x7a5c3a, 0x86663f, 0x6e5233], wall: 0x837657 },
    water: { name: 'The Flooded Hall', floor: [0x245a72, 0x2a6680, 0x1f5066], wall: 0x56727e },
    gate:  { name: 'Stairwell Approach', floor: [0x70403c, 0x7c4742, 0x643a36], wall: 0x8a5a56 },
    studio: { name: 'Processing Center', floor: [0xb4b9c2, 0xbec3cb, 0xaab0b9], wall: 0xc4c9d1 },
    office: { name: 'Union Hall', floor: [0x4b5a6e, 0x52627a, 0x46546a], wall: 0xb8ad94 },
    bazaar: { name: 'Underbazaar', floor: [0x8a7a62, 0x94836a, 0x7f7058], wall: 0x6e6253 },
    garden: { name: 'Drowned Gardens', floor: [0x4f7a3a, 0x5a8442, 0x476f34], wall: 0x5e5a4e },
    arena:  { name: 'The Arena', floor: [0xc2a46c, 0xccae76, 0xb89a62], wall: 0x7a6a5a },
    blvd:   { name: 'Boulevard', floor: [0x8c8577, 0x958e80, 0x837c6e], wall: 0x9a8f7c },
    lot:    { name: 'Backlot street', floor: [0x3e3f42, 0x444549, 0x393a3d], wall: 0x8a8378 },
    dirt:   { name: 'Frontier Town', floor: [0xa8865a, 0xb08e60, 0x9e7e52], wall: 0x7a5a3a },
    lawn:   { name: 'Lawn', floor: [0x5f9a48, 0x67a24e, 0x579242], wall: 0xe8e2d4 },
    green:  { name: 'Putting green', floor: [0x52b84a, 0x5cc254, 0x4aae42], wall: 0x8a8378 },
    tent:   { name: 'Tent', floor: [0x9a7a52, 0xa2825a, 0x92724a], wall: 0xece6d6 },
    house:  { name: 'Sitcom house', floor: [0xa07a50, 0xa88258, 0x98724a], wall: 0xe6d8b8 },
    manor:  { name: 'Blackwood Manor', floor: [0x4a3428, 0x52392c, 0x432f24], wall: 0x4a4250 },
    stage:  { name: 'Soundstage', floor: [0x2c2c32, 0x313137, 0x28282e], wall: 0x3a3a42 },
    ship:   { name: 'Starship Valiant', floor: [0x8e98a8, 0x98a2b2, 0x8690a0], wall: 0xb8c0cc }
  };
  function ch(x, z) { return (z < 0 || z >= H || x < 0 || x >= W) ? '#' : MAP[z].charAt(x); }
  var SOLID = { 'o': 1, 'F': 1, 'Y': 1, 'X': 1, '#': 1, 'H': 1, 'P': 1, 'B': 1, 'C': 1, 'M': 1, 'K': 1, 'R': 1, 'T': 1, 'W': 1, 'U': 1, 'b': 1, 'h': 1, 'c': 1, 'q': 1, 'k': 1, 'g': 1, 'v': 1 };
  function stairsOpen() { if (typeof CB === 'undefined') return false; var gk = CB.enemies.filter(function (e) { return e.kind === 'gatekeeper'; })[0]; return !!gk && !!gk.dead; }
  function blocksMove(x, z) { return !!SOLID[ch(x, z)] || !!PROPBLOCK[x + ',' + z] || cbOcc(x, z); }
  function blocksSight(x, z) { var c = ch(x, z); return c === '#' || c === 'P' || c === 'H'; }

  function floorTex(id, v) {
    return tex('fl' + id + v, 64, 64, function (g) {
      g.save(); g.scale(2, 2);
      var r = rnd(id.charCodeAt(0) * 9173 + id.length * 131 + v * 7919), c = ROOMS[id].floor[v % 3];
      var base = hexs(c), d1 = hexs(shade(c, 0.84)), d2 = hexs(shade(c, 0.58)), l1 = hexs(mix(c, 0xffffff, 0.1)), l2 = hexs(mix(c, 0xffffff, 0.22)), i, x, y, k;
      function speck(n, cl) { while (n--) px(g, cl, Math.floor(r() * 32), Math.floor(r() * 32)); }
      function blob(cx, cy, rad, cols, dens) { for (var yy = -rad; yy <= rad; yy++) for (var xx = -rad; xx <= rad; xx++) if (xx * xx + yy * yy <= rad * rad && r() < dens) px(g, cols[Math.floor(r() * cols.length)], (cx + xx + 32) % 32, (cy + yy + 32) % 32); }
      px(g, base, 0, 0, 32, 32);
      var pat = { lawn: 'garden', green: 'green', tent: 'store', house: 'store', manor: 'store', stage: 'store', ship: 'studio' }[id] || id;
      if (pat === 'crypt' || pat === 'moss') {
        var sy = 12 + Math.floor(r() * 8), sx1 = 8 + Math.floor(r() * 9), sx2 = 14 + Math.floor(r() * 10);
        g.globalAlpha = 0.5; px(g, r() > 0.5 ? d1 : l1, 1, 1, sx1 - 1, sy - 1); px(g, r() > 0.5 ? d1 : l1, sx2 + 1, sy + 1, 31 - sx2, 31 - sy); g.globalAlpha = 1;
        speck(90, d1); speck(50, l1); speck(14, d2);
        px(g, d2, 0, sy, 32, 1); px(g, d2, sx1, 0, 1, sy); px(g, d2, sx2, sy, 1, 32 - sy); px(g, d2, 0, 0, 32, 1); px(g, d2, 0, 0, 1, 32);
        px(g, l2, 1, sy + 1, 30, 1); px(g, l2, 1, 1, sx1 - 1, 1); px(g, l2, sx1 + 1, 1, 30 - sx1, 1); px(g, l2, 1, 1, 1, sy - 1);
        if (r() > 0.4) { x = 3 + Math.floor(r() * 26); y = 2; for (k = 0; k < 12 && y < 31; k++) { px(g, d2, x, y); y += 1 + (r() > 0.6 ? 1 : 0); x = clamp(x + (r() > 0.5 ? 1 : -1), 1, 30); } }
        if (r() > 0.6) { x = 4 + Math.floor(r() * 22); y = 4 + Math.floor(r() * 22); px(g, d1, x, y, 3, 2); px(g, d2, x + 1, y + 1, 2, 1); }
        if (pat === 'moss') {
          for (i = 0; i < 4 + (v % 3); i++) blob(Math.floor(r() * 32), Math.floor(r() * 32), 3 + Math.floor(r() * 4), ['#4f7f3a', '#3d6a2e', '#6a9a48', '#35602a'], 0.72);
          for (i = 0; i < 16; i++) { x = Math.floor(r() * 32); y = 1 + Math.floor(r() * 30); px(g, '#86b85a', x, y, 1, 2); }
          if (r() > 0.45) { x = 3 + Math.floor(r() * 26); y = 3 + Math.floor(r() * 26); px(g, r() > 0.5 ? '#f0e060' : '#e8e8f8', x, y); px(g, '#c8b030', x + 1, y); }
        }
      } else if (pat === 'hall') {
        speck(70, d1); speck(40, l1);
        px(g, d2, 0, 0, 32, 1); px(g, d2, 0, 0, 1, 32); px(g, l2, 1, 1, 30, 1); px(g, l2, 1, 1, 1, 30); px(g, d1, 1, 31, 31, 1); px(g, d1, 31, 1, 1, 31);
        for (i = 0; i < 9; i++) { px(g, d1, 16 - i, 7 + i); px(g, d1, 15 + i, 7 + i); px(g, d1, 16 - i, 24 - i); px(g, d1, 15 + i, 24 - i); px(g, l1, 16 - i, 8 + i); px(g, l1, 15 + i, 25 - i); }
        px(g, d2, 14, 14, 4, 4); px(g, hexs(mix(c, 0xc9a227, 0.5)), 15, 15, 2, 2);
        [[3, 3], [28, 3], [3, 28], [28, 28]].forEach(function (p) { px(g, d1, p[0], p[1], 2, 2); });
        if (r() > 0.6) { x = 5 + Math.floor(r() * 20); y = 3; for (k = 0; k < 9; k++) { px(g, d2, x, y); y += 2; x += r() > 0.5 ? 1 : -1; } }
      } else if (pat === 'store') {
        for (i = 0; i < 4; i++) {
          var x0 = i * 8, tone = [base, d1, hexs(shade(c, 0.92)), l1][Math.floor(r() * 4)];
          px(g, tone, x0, 0, 8, 32);
          for (k = 0; k < 3; k++) { x = x0 + 1 + Math.floor(r() * 6); for (y = 0; y < 32; y++) { if (r() > 0.15) px(g, d1, x, y); if (r() > 0.92) x = clamp(x + (r() > 0.5 ? 1 : -1), x0 + 1, x0 + 6); } }
          px(g, d2, x0, 0, 1, 32); px(g, l1, x0 + 1, 0, 1, 32);
          y = 4 + Math.floor(r() * 24); px(g, d2, x0, y, 8, 1); px(g, '#2a2018', x0 + 2, y - 2); px(g, '#2a2018', x0 + 5, y + 2); px(g, '#2a2018', x0 + 3, 1); px(g, '#2a2018', x0 + 4, 30);
          if (r() > 0.6) { y = 3 + Math.floor(r() * 26); px(g, d2, x0 + 3, y, 2, 2); px(g, d1, x0 + 2, y - 1, 4, 1); px(g, d1, x0 + 2, y + 2, 4, 1); }
        }
      } else if (pat === 'studio') { // big glossy tiles with grout
        for (y = 0; y < 32; y += 16) for (x = 0; x < 32; x += 16) { px(g, [base, l1, hexs(shade(c, 0.95))][Math.floor(r() * 3)], x, y, 16, 16); px(g, l2, x + 1, y + 1, 14, 1); px(g, l2, x + 1, y + 1, 1, 14); px(g, d1, x, y + 15, 16, 1); px(g, d1, x + 15, y, 1, 16); }
        speck(14, d1); if (r() > 0.7) { px(g, '#3df2e0', 0, 15, 32, 1); }
      } else if (pat === 'office') { // carpet
        speck(260, d1); speck(160, l1); speck(40, d2);
        for (i = 0; i < 32; i += 8) { g.globalAlpha = 0.25; px(g, d2, 0, i, 32, 1); px(g, d2, i, 0, 1, 32); g.globalAlpha = 1; }
      } else if (pat === 'bazaar') { // cobbles
        px(g, d2, 0, 0, 32, 32);
        for (y = 0; y < 32; y += 6) for (x = -(y % 12 ? 3 : 0); x < 32; x += 6) { var cw = 4 + Math.floor(r() * 2); px(g, [base, d1, l1, hexs(shade(c, 0.9))][Math.floor(r() * 4)], x + 1, y + 1, cw, 4); px(g, l2, x + 1, y + 1, cw - 1, 1); }
      } else if (pat === 'garden') { // grass
        speck(120, d1); speck(80, l1);
        for (i = 0; i < 70; i++) { x = Math.floor(r() * 32); y = Math.floor(r() * 31); px(g, r() > 0.5 ? '#6f9f4a' : '#3f6a2c', x, y, 1, 2); }
        if (r() > 0.6) { x = 3 + Math.floor(r() * 26); y = 3 + Math.floor(r() * 26); px(g, r() > 0.5 ? '#f0e060' : '#e8a0d0', x, y); px(g, '#fff6c0', x + 1, y); }
      } else if (pat === 'arena') { // raked sand
        speck(150, d1); speck(110, l1); speck(20, d2);
        for (y = 3; y < 32; y += 6) { g.globalAlpha = 0.35; for (x = 0; x < 32; x++) px(g, d1, x, y + Math.round(Math.sin((x + v * 5) * 0.4))); g.globalAlpha = 1; }
        if (r() > 0.85) blob(Math.floor(r() * 32), Math.floor(r() * 32), 2, ['#6a2a20', '#7a3428'], 0.5);
      } else if (pat === 'blvd') { // large flagstones
        for (y = 0; y < 32; y += 16) for (x = -(y ? 8 : 0); x < 32; x += 16) { px(g, [base, d1, l1, hexs(shade(c, 0.93))][Math.floor(r() * 4)], x + 1, y + 1, 15, 15); px(g, l2, x + 1, y + 1, 15, 1); }
        speck(60, d1); speck(30, l1);
      } else if (pat === 'lot') { // asphalt with painted lines now and then
        speck(220, d1); speck(140, l1); speck(30, d2);
        if (v === 1) { px(g, '#d8c050', 0, 15, 32, 1); } if (v === 2) { g.globalAlpha = 0.5; px(g, '#e8e8e8', 15, 0, 1, 32); g.globalAlpha = 1; }
      } else if (pat === 'dirt') { // packed dirt, wheel ruts and hoofprints
        speck(200, d1); speck(140, l1); speck(30, d2);
        for (i = 0; i < 4; i++) blob(Math.floor(r() * 32), Math.floor(r() * 32), 3 + Math.floor(r() * 4), [d1, l1], 0.35);
        for (i = 0; i < 3; i++) { x = Math.floor(r() * 30); y = Math.floor(r() * 30); px(g, d2, x, y, 2, 1); px(g, d2, x, y + 1, 1, 1); }
      } else if (pat === 'green') { // mowed stripes
        for (y = 0; y < 32; y += 8) px(g, (y / 8) % 2 ? l1 : base, 0, y, 32, 8); speck(60, d1); speck(30, l2);
      } else if (pat === 'water') {
        for (i = 0; i < 5; i++) blob(Math.floor(r() * 32), Math.floor(r() * 32), 2 + Math.floor(r() * 4), [d1, d2], 0.8);
        speck(40, d1);
        for (i = 0; i < 9; i++) { x = Math.floor(r() * 32); y = Math.floor(r() * 32); k = 4 + Math.floor(r() * 7); for (var j = 0; j < k; j++) px(g, j === 0 || j === k - 1 ? l1 : l2, (x + j) % 32, y); if (r() > 0.5) for (j = 1; j < k - 2; j++) px(g, l1, (x + j + 1) % 32, (y + 1) % 32); }
        for (i = 0; i < 5; i++) px(g, '#cfeef8', Math.floor(r() * 32), Math.floor(r() * 32));
      } else {
        for (y = 0; y < 32; y += 4) for (x = -8; x < 32; x += 8) {
          var off = (y / 4) % 2 ? 4 : 0, tn = [base, d1, l1, hexs(shade(c, 0.92))][Math.floor(r() * 4)];
          px(g, tn, x + off, y, 8, 4); px(g, d2, x + off, y, 8, 1); px(g, d2, x + off, y, 1, 4); if (r() > 0.5) px(g, l1, x + off + 2, y + 1, 3, 1);
        }
        speck(50, d1);
        for (i = 0; i < 2; i++) blob(Math.floor(r() * 32), Math.floor(r() * 32), 3 + Math.floor(r() * 3), ['#2a1414', '#3a1a18'], 0.45);
      }
      g.restore();
      refine(g, 64, 64, pat === 'water' ? 0.5 : 0.28, 0.035, v + 3);
      for (i = 0; i < 46; i++) { x = Math.floor(r() * 64); y = Math.floor(r() * 64); px(g, r() > 0.5 ? d2 : l2, x, y); if (r() > 0.7) px(g, d1, x + 1, y + 1); }
    });
  }
  function wallTex(id, v) {
    return tex('wl' + id + v, 64, 96, function (g) {
      g.save(); g.scale(2, 2);
      var r = rnd(id.charCodeAt(1) * 4391 + v * 6151 + 5), c = ROOMS[id].wall;
      var base = hexs(c), d1 = hexs(shade(c, 0.84)), d2 = hexs(shade(c, 0.5)), l1 = hexs(mix(c, 0xffffff, 0.1)), l2 = hexs(mix(c, 0xffffff, 0.2)), x, y, i, k;
      px(g, d2, 0, 0, 32, 48);
      for (y = 4; y < 48; y += 6) for (x = -16; x < 32; x += 16) {
        var off = ((y - 4) / 6) % 2 ? 8 : 0, tn = [base, d1, l1, hexs(shade(c, 0.92)), hexs(shade(c, 0.76))][Math.floor(r() * 5)];
        px(g, tn, x + off + 1, y + 1, 15, 5); px(g, l2, x + off + 1, y + 1, 15, 1); px(g, d1, x + off + 1, y + 5, 15, 1);
        for (i = 0; i < 7; i++) px(g, r() > 0.5 ? d1 : l1, x + off + 1 + Math.floor(r() * 15), y + 2 + Math.floor(r() * 3));
        if (r() > 0.82) { k = x + off + 3 + Math.floor(r() * 9); px(g, d2, k, y + 2, 1, 2); px(g, d2, k + 1, y + 4); }
      }
      px(g, l1, 0, 0, 32, 3); px(g, l2, 0, 0, 32, 1); px(g, d2, 0, 3, 32, 1); for (i = 0; i < 12; i++) px(g, d1, Math.floor(r() * 32), 1 + Math.floor(r() * 2));
      for (x = 0; x < 32; x++) { k = 2 + Math.floor(r() * 4); for (y = 48 - k; y < 48; y++) if ((x + y) % 2 === 0 || r() > 0.5) px(g, d2, x, y); }
      if (id === 'moss' || id === 'garden') { for (i = 0; i < 6; i++) { x = Math.floor(r() * 32); k = 6 + Math.floor(r() * 26); for (y = 2; y < k; y++) { px(g, r() > 0.5 ? '#4f7f3a' : '#3d6a2e', x + (r() > 0.8 ? 1 : 0), y); if (r() > 0.7) px(g, '#6a9a48', x + 1, y); } px(g, '#86b85a', x, k); } }
      if (id === 'water') { for (x = 0; x < 32; x++) { k = 28 + Math.floor(r() * 6); for (y = k; y < 48; y++) if ((x + y) % 2 === 0) px(g, '#16303a', x, y); } for (i = 0; i < 4; i++) { x = Math.floor(r() * 32); for (y = 6; y < 30; y++) if (r() > 0.3) px(g, '#2a4a56', x, y); } }
      if (id === 'gate') { for (i = 0; i < 3; i++) { x = Math.floor(r() * 30); y = 8 + Math.floor(r() * 30); for (k = 0; k < 20; k++) px(g, '#2a1210', clamp(x + Math.floor(r() * 5) - 2, 0, 31), clamp(y + Math.floor(r() * 7) - 3, 0, 47)); } }
      if (id === 'crypt' && r() > 0.3) { x = 4 + Math.floor(r() * 24); y = 5; for (k = 0; k < 16; k++) { px(g, d2, x, y); y += 2; x = clamp(x + (r() > 0.5 ? 1 : -1), 1, 30); } }
      if (id === 'hall') { px(g, hexs(mix(c, 0xc9a227, 0.35)), 0, 10, 32, 1); px(g, d2, 0, 11, 32, 1); }
      g.restore();
      refine(g, 64, 96, 0.25, 0.04, v + 11);
      for (i = 0; i < 70; i++) { x = Math.floor(r() * 64); y = 8 + Math.floor(r() * 88); px(g, r() > 0.55 ? d1 : l1, x, y); if (r() > 0.8) px(g, d2, x, y + 1, 1, 2); }
    });
  }

  // ---------- three setup ----------
  var canvas = document.getElementById('view');
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); }
  catch (e) { fail('This browser could not start 3D graphics.'); return; }
  renderer.setClearColor(0x050507);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  var scene = new THREE.Scene();
  var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xb8c0d8, 0.5));
  var sun = new THREE.DirectionalLight(0xffe2c0, 0.62); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.03;
  var sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 0.5; sc.far = 40; sc.updateProjectionMatrix();
  (function () { // film grain overlay
    var c = document.createElement('canvas'); c.width = c.height = 96; var g = c.getContext('2d'), r = rnd(77), i, v;
    for (i = 0; i < 96 * 96; i++) { v = Math.floor(r() * 255); g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(i % 96, Math.floor(i / 96), 1, 1); }
    try { document.getElementById('grain').style.backgroundImage = 'url(' + c.toDataURL() + ')'; } catch (e) {}
  })();

  var tiles = [], tileState = [], flames = [], mobParts = [], fireLights = [], waterTex = [];
  for (var i = 0; i < W * H; i++) tileState.push(0);
  var boxG = new THREE.BoxGeometry(1, 1, 1), WHITE = new THREE.Color(0xffffff);

  function reg(mesh, x, z, opt) {
    opt = opt || {};
    var t = { mesh: mesh, x: x, z: z, base: opt.glow || opt.tint ? mesh.material.color.clone() : WHITE, wall: !!opt.wall, fade: !!opt.fade, mob: !!opt.mob, glow: !!opt.glow, hang: !!opt.hang, tint: !!opt.tint };
    mesh.visible = false; mesh.castShadow = !opt.glow && !opt.noShadow; mesh.receiveShadow = !opt.glow; scene.add(mesh);
    if (curChunk) curChunk.push(t); else { var ck = chunks[Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK)]; if (ck) ck.push(t); tiles.push(t); }
    return t;
  }
  // box(): one block of the world. opt.kind picks the painted surface, opt.tex overrides it.
  function box(w, h, d, color, x, y, z, tx, tz, opt) {
    opt = opt || {};
    var m, mat;
    if (opt.glow) mat = new THREE.MeshBasicMaterial({ color: color });
    else {
      var top = h < 0.09, pw = clamp(Math.round(Math.max(w, d) * 68), 2, 68), ph = clamp(Math.round((top ? Math.min(w, d) : h) * 68), 2, 96);
      mat = new THREE.MeshLambertMaterial({ map: opt.tex || surf(opt.kind || 'stone', color, pw, ph, opt.seed || 0), transparent: !!opt.fade });
    }
    var rg = opt.round ? roundGeo(w, h, d, Math.min(w, h, d) * opt.round, 4) : null; if (rg) rg.userData.own = true;
    m = new THREE.Mesh(rg || opt.geo || boxG, mat);
    if (!opt.geo && !rg) m.scale.set(w, h, d);
    m.position.set(x, y, z); return reg(m, tx, tz, opt);
  }
  function flame(x, y, z, tx, tz, s, opt) {
    [[0.3, 0.3, 0xff7a18], [0.2, 0.42, 0xffb030], [0.1, 0.5, 0xffe890]].forEach(function (f, i) {
      var o = { glow: true }; if (opt) for (var k in opt) o[k] = opt[k];
      var t = box(f[0] * s, f[1] * s, f[0] * s, f[2], x, y + f[1] * s / 2, z, tx, tz, o);
      flames.push({ m: t.mesh, y: y, h: f[1] * s, w: f[0] * s, ph: i * 1.7 + x * 3 + z });
    });
  }

  var start = LEVEL.start, c8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 10), c16 = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  function nearFloor(x, z) { for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { var q = ch(x + dx, z + dz); if (q !== '#' && q !== 'H') return true; } return false; }
  function buildTile(x, z) {
    var c = ch(x, z); if (c === 'H') c = '#'; if (c === '#' && !nearFloor(x, z)) return;
    var rid = roomAt(x, z), room = ROOMS[rid], r = hash(x, z), r2 = hash(x + 31, z + 17), v = Math.floor(r * 4);
    if (c === '#') {
      var wh = 1.5 + r * 0.25;
      box(1, wh, 1, room.wall, x, wh / 2, z, x, z, { wall: true, tex: wallTex(rid, v) }).h = wh;
      // things that hang on a wall face looking toward the camera side
      var south = ch(x, z + 1) !== '#' && ch(x, z + 1) !== 'H' && z + 1 < H, east = ch(x + 1, z) !== '#' && ch(x + 1, z) !== 'H' && x + 1 < W;
      var modern = rid === 'office' || rid === 'studio' || rid === 'crypt';
      if (south && r2 > 0.88 && !modern && rid !== 'moss' && rid !== 'garden' && rid !== 'water') { // banner
        var bc = [0x7a1f1f, 0x1f3a6a, 0x4a2a6a, 0x2f5a34][Math.floor(r * 4)];
        box(0.5, 0.06, 0.06, 0x3a2a1c, x, 1.3, z + 0.53, x, z, { hang: true, kind: 'wood' });
        box(0.42, 0.7, 0.03, bc, x, 0.93, z + 0.53, x, z, { hang: true, kind: 'cloth', seed: v });
        box(0.42, 0.05, 0.035, 0xc9a227, x, 1.2, z + 0.532, x, z, { hang: true, kind: 'cloth' });
        box(0.14, 0.14, 0.035, 0xc9a227, x, 0.95, z + 0.532, x, z, { hang: true, kind: 'metal' });
        box(0.14, 0.12, 0.03, bc, x - 0.14, 0.53, z + 0.53, x, z, { hang: true, kind: 'cloth' }); box(0.14, 0.12, 0.03, bc, x + 0.14, 0.53, z + 0.53, x, z, { hang: true, kind: 'cloth' });
      } else if (east && r2 > 0.86 && !modern) { // wall torch
        box(0.16, 0.05, 0.05, 0x2c2c33, x + 0.56, 1.0, z, x, z, { hang: true, kind: 'metal' });
        box(0.06, 0.26, 0.06, 0x5a3a1c, x + 0.62, 1.08, z, x, z, { hang: true, kind: 'wood' });
        flame(x + 0.62, 1.2, z, x, z, 0.42, { hang: true });
      } else if ((south || east) && (rid === 'moss' || rid === 'garden') && r2 > 0.4) { // hanging vines
        for (var vi = 0; vi < 3; vi++) { var vx = south ? x - 0.3 + vi * 0.3 : x + 0.52, vz = south ? z + 0.52 : z - 0.3 + vi * 0.3, vl = 0.4 + hash(x + vi, z * 3) * 0.7;
          box(0.07, vl, 0.04, [0x4f7f3a, 0x3d6a2e, 0x6a9a48][vi], vx, wh - vl / 2 - 0.05, vz, x, z, { hang: true, kind: 'cloth', seed: vi, noShadow: true }); }
      }
      return;
    }
    if (c === '@') start = { x: x, z: z };
    if (c === 'S') { // stairs sink below the floor, hidden under a slab until the Gatekeeper falls
      var tb = tiles.length, cb = curChunk ? curChunk.length : 0;
      for (var s = 0; s < 5; s++) box(0.96, 0.12, 0.2, 0x4a4a52, x, -0.06 - s * 0.13, z - 0.4 + s * 0.2, x, z, { seed: s });
      box(0.96, 0.06, 0.96, 0x050506, x, -0.75, z, x, z, { noShadow: true });
      box(0.14, 1.5, 0.14, 0x5a5a64, x - 0.5, 0.75, z - 0.5, x, z, { fade: true }); box(0.14, 1.5, 0.14, 0x5a5a64, x + 0.5, 0.75, z - 0.5, x, z, { fade: true });
      box(1.3, 0.16, 0.18, 0x4a4a52, x, 1.56, z - 0.5, x, z, { fade: true }); box(0.16, 0.16, 0.05, 0x3df2e0, x, 1.56, z - 0.4, x, z, { glow: true });
      box(0.3, 0.03, 0.03, 0x3df2e0, x, 1.38, z - 0.41, x, z, { glow: true });
      (curChunk || tiles).slice(curChunk ? cb : tb).forEach(function (t) { t.gate = true; });
      box(0.98, 0.06, 0.98, 0x5a5650, x, 0.0, z, x, z, { seed: 9 }).gate = false;
      return;
    }
    var wet = rid === 'water' || c === '~', fid = c === '~' ? 'water' : rid;
    var ft = floorTex(fid, fid === 'hall' ? ((x + z) % 2) + 2 * Math.floor(r * 2) : v);
    if (wet && waterTex.indexOf(ft) < 0) { ft.wrapS = ft.wrapT = THREE.RepeatWrapping; waterTex.push(ft); }
    floorQuad(ft, x, wet ? -0.04 : 0, z);
    var dl = LEVEL.decor[x + ',' + z]; if (dl) dl.forEach(function (d) { if (d.m === '#throne') { throneAt(x, z, d.rot || 0); return; } if (d.m === '#rug') { box(d.w, 0.02, d.d, d.col, x + (d.w % 2 ? 0 : 0.5), 0.004, z + (d.d % 2 ? 0 : 0.5), x, z, { kind: 'cloth', seed: 7, noShadow: true }); box(d.w + 0.12, 0.012, d.d + 0.12, 0xc9a227, x + (d.w % 2 ? 0 : 0.5), 0.0, z + (d.d % 2 ? 0 : 0.5), x, z, { kind: 'cloth', noShadow: true }); } });
    if (c === 'D') {
      var horiz = ch(x - 1, z) === '#';
      [-0.44, 0.44].forEach(function (o) { box(0.16, 1.5, 0.16, 0x4a3420, x + (horiz ? o : 0), 0.75, z + (horiz ? 0 : o), x, z, { fade: true, kind: 'wood' });
        box(0.2, 0.12, 0.2, 0x3a2a1c, x + (horiz ? o : 0), 0.06, z + (horiz ? 0 : o), x, z, { kind: 'wood' }); });
      box(horiz ? 1.04 : 0.18, 0.18, horiz ? 0.18 : 1.04, 0x4a3420, x, 1.56, z, x, z, { fade: true, kind: 'wood' });
      box(horiz ? 0.2 : 0.04, 0.1, horiz ? 0.04 : 0.2, 0x8a8f96, x + (horiz ? 0 : 0.1), 1.56, z + (horiz ? 0.1 : 0), x, z, { fade: true, kind: 'metal' });
      box(horiz ? 0.9 : 0.5, 0.02, horiz ? 0.5 : 0.9, 0x3a3630, x, 0.012, z, x, z, { noShadow: true });
    } else if (c === 'P') {
      box(0.78, 0.12, 0.78, 0x8a8172, x, 0.06, z, x, z, { fade: true }); box(0.64, 0.12, 0.64, 0x978e7c, x, 0.18, z, x, z, { fade: true });
      var sh = box(1, 1, 1, 0xa39a88, x, 0.89, z, x, z, { fade: true, geo: c16, kind: 'flute' }); sh.mesh.scale.set(0.5, 1.3, 0.5);
      var rb = box(1, 1, 1, 0x978e7c, x, 0.27, z, x, z, { fade: true, geo: c16 }); rb.mesh.scale.set(0.58, 0.07, 0.58); rb = box(1, 1, 1, 0x978e7c, x, 1.51, z, x, z, { fade: true, geo: c16 }); rb.mesh.scale.set(0.58, 0.07, 0.58);
      box(0.6, 0.1, 0.6, 0x978e7c, x, 1.59, z, x, z, { fade: true }); box(0.74, 0.12, 0.74, 0x8a8172, x, 1.7, z, x, z, { fade: true });
    } else if (c === 'B') {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (o) { box(0.06, 0.5, 0.06, 0x2c2c33, x + o[0] * 0.16, 0.25, z + o[1] * 0.16, x, z, { kind: 'metal' }); });
      box(0.4, 0.04, 0.4, 0x2c2c33, x, 0.3, z, x, z, { kind: 'metal' });
      box(0.5, 0.1, 0.5, 0x3a3a44, x, 0.55, z, x, z, { kind: 'metal' }); box(0.6, 0.08, 0.6, 0x44444e, x, 0.64, z, x, z, { kind: 'metal' });
      box(0.46, 0.05, 0.46, 0x5a1a08, x, 0.69, z, x, z, { glow: true }); box(0.2, 0.05, 0.2, 0xff5a10, x + 0.06, 0.7, z - 0.04, x, z, { glow: true });
      flame(x, 0.7, z, x, z, 1);
    } else if (c === 'X') { // the safe room bathroom: a little stall with a sign and a mirror
      box(0.9, 1.25, 0.06, 0x5a6a72, x, 0.625, z - 0.42, x, z, { kind: 'metal' }); box(0.06, 1.25, 0.86, 0x5a6a72, x - 0.42, 0.625, z, x, z, { kind: 'metal' }); box(0.06, 1.25, 0.86, 0x5a6a72, x + 0.42, 0.625, z, x, z, { kind: 'metal' });
      box(0.8, 1.1, 0.04, 0x6f8088, x + 0.02, 0.6, z + 0.4, x, z, { kind: 'metal', fade: true }); box(0.3, 0.16, 0.02, 0x3df2e0, x, 1.32, z + 0.43, x, z, { glow: true });
      box(0.22, 0.3, 0.02, 0xd8e8f0, x - 0.25, 0.95, z + 0.43, x, z, { kind: 'metal' });
    } else if ('TWUbhcqkgvo'.indexOf(c) >= 0) {
      if (!propsOn()) box(0.5, 0.5, 0.5, 0x6b5a44, x, 0.25, z, x, z, { kind: 'wood' });
    } else if (c === 'F') { // free food: a catering table with a green marker
      if (!propsOn()) { box(0.9, 0.06, 0.6, 0x8a6a44, x, 0.45, z, x, z, { kind: 'wood' }); box(0.5, 0.12, 0.3, 0xd09040, x, 0.54, z, x, z, { kind: 'cloth' }); }
      box(0.18, 0.03, 0.18, 0x40ff90, x, 0.92, z, x, z, { glow: true });
    } else if (c === 'Y') { // a tree
      if (!propsOn()) { box(0.22, 1.4, 0.22, 0x5a3a20, x, 0.7, z, x, z, { kind: 'wood', fade: true }); box(1.1, 0.9, 1.1, 0x3f6a2e, x, 1.7, z, x, z, { kind: 'cloth', fade: true }); }
    } else if (c === 'C' && !propsOn()) {
      box(0.66, 0.34, 0.46, 0x6b4423, x, 0.17, z, x, z, { kind: 'wood' });
      [-0.24, 0.24].forEach(function (o) { box(0.07, 0.36, 0.48, 0x5a5f66, x + o, 0.17, z, x, z, { kind: 'metal' }); });
      box(0.5, 0.02, 0.32, 0x140e06, x, 0.345, z, x, z, { noShadow: true });
      var lid = [box(0.68, 0.14, 0.48, 0x7a4e28, x, 0.42, z, x, z, { kind: 'wood' }), box(0.6, 0.06, 0.4, 0x8a5a2c, x, 0.51, z, x, z, { kind: 'wood' })];
      [-0.24, 0.24].forEach(function (o) { lid.push(box(0.07, 0.16, 0.5, 0x5a5f66, x + o, 0.43, z, x, z, { kind: 'metal' })); });
      lid.push(box(0.12, 0.16, 0.05, 0xe0c060, x, 0.38, z + 0.24, x, z, { kind: 'metal' })); lid.push(box(0.04, 0.05, 0.02, 0x1a1208, x, 0.36, z + 0.27, x, z));
      lid.forEach(function (t) { t.lid = true; });
      [-0.36, 0.36].forEach(function (o) { box(0.03, 0.08, 0.14, 0x5a5f66, x + o, 0.22, z, x, z, { kind: 'metal' }); });
    } else if (c === 'K' && !propsOn()) {
      var ks = 0.72 + r * 0.14;
      box(ks, ks, ks, 0x8a6a3c, x, ks / 2, z, x, z, { kind: 'wood', seed: v });
      [-1, 1].forEach(function (o) { box(ks + 0.03, 0.1, ks + 0.03, 0x6a4e2a, x, ks / 2 + o * (ks / 2 - 0.05), z, x, z, { kind: 'wood' }); box(0.1, ks, 0.1, 0x6a4e2a, x + o * (ks / 2 - 0.04), ks / 2, z + ks / 2 - 0.03, x, z, { kind: 'wood' }); box(0.1, ks, 0.1, 0x6a4e2a, x + ks / 2 - 0.03, ks / 2, z + o * (ks / 2 - 0.04), x, z, { kind: 'wood' }); });
      if (r > 0.4) box(0.4, 0.3, 0.4, 0x9a7a48, x - 0.05, ks + 0.15, z + 0.05, x, z, { kind: 'wood', seed: 5 });
    } else if (c === 'R' && !propsOn()) {
      var bm = function (rad, hh, col, yy, kind) { var t = box(1, 1, 1, col, x, yy, z, x, z, { geo: c8, kind: kind, seed: 2 }); t.mesh.scale.set(rad * 2, hh, rad * 2); return t; };
      bm(0.3, 0.2, 0x7a5430, 0.1, 'wood'); bm(0.35, 0.36, 0x86602f, 0.38, 'wood'); bm(0.3, 0.2, 0x7a5430, 0.66, 'wood');
      bm(0.325, 0.05, 0x4a4f56, 0.2, 'metal'); bm(0.325, 0.05, 0x4a4f56, 0.56, 'metal'); bm(0.26, 0.02, 0x4a3018, 0.765, 'wood');
    } else if (c === 'M') {
      var G1 = 0x6f9a44, G2 = 0x5d8a3a, G3 = 0x86b050;
      [[0.5, 0.36, 0.3, -0.34], [0.58, 0.46, 0.3, -0.1], [0.54, 0.42, 0.28, 0.14]].forEach(function (sg, i) {
        mobParts.push({ t: box(sg[0], sg[1], sg[2] + 0.06, i % 2 ? G1 : G2, x, sg[1] / 2 + 0.02, z + sg[3], x, z, { mob: true, kind: 'slime', seed: i, round: 0.42 }), ph: i * 0.9, h: sg[1], round: true });
        box(sg[0] * 0.5, 0.06, sg[2] * 0.7, G3, x, sg[1] + 0.04, z + sg[3], x, z, { mob: true, kind: 'slime' });
        box(0.08, 0.14, 0.08, 0xd8d0a0, x, sg[1] + 0.12, z + sg[3], x, z, { mob: true, kind: 'bone' });
        [-1, 1].forEach(function (o) { box(0.1, 0.08, 0.12, 0x4a6a2e, x + o * (sg[0] / 2 + 0.03), 0.05, z + sg[3], x, z, { mob: true, kind: 'slime' }); });
      });
      mobParts.push({ t: box(0.44, 0.4, 0.3, G1, x, 0.3, z + 0.37, x, z, { mob: true, kind: 'slime', seed: 9, round: 0.4 }), ph: 2.9, h: 0.4, head: true, round: true });
      box(0.3, 0.1, 0.06, 0x2a1a14, x, 0.16, z + 0.51, x, z, { mob: true });
      [-0.1, -0.03, 0.04, 0.11].forEach(function (o, i) { box(0.035, 0.05, 0.03, 0xe8e0c0, x + o, i % 2 ? 0.2 : 0.13, z + 0.53, x, z, { mob: true, kind: 'bone' }); });
      [-1, 1].forEach(function (o) { box(0.07, 0.07, 0.2, 0xd8d0a0, x + o * 0.2, 0.14, z + 0.58, x, z, { mob: true, kind: 'bone' }); box(0.07, 0.07, 0.07, 0xd8d0a0, x + o * 0.14, 0.14, z + 0.67, x, z, { mob: true, kind: 'bone' }); });
      [[-0.12, 0.38, 0.07], [0.12, 0.38, 0.07], [-0.16, 0.28, 0.045], [0.16, 0.28, 0.045], [0, 0.44, 0.045]].forEach(function (e) { box(e[2], e[2], 0.03, 0xff3030, x + e[0], e[1], z + 0.515, x, z, { mob: true, glow: true }); });
      [-1, 1].forEach(function (o) { box(0.03, 0.22, 0.03, G2, x + o * 0.1, 0.6, z + 0.4, x, z, { mob: true }); box(0.05, 0.05, 0.05, 0xffd040, x + o * 0.1, 0.72, z + 0.4, x, z, { mob: true, glow: true }); });
    } else if (rid === 'moss') {
    } else if (rid === 'water') {
      if (r > 0.8) { box(0.34, 0.02, 0.3, 0x3f7a3a, x + (r2 - 0.5) * 0.4, -0.03, z + (r - 0.9) * 2, x, z, { kind: 'cloth', noShadow: true }); if (r2 > 0.6) box(0.08, 0.05, 0.08, 0xe8a0c0, x + (r2 - 0.5) * 0.4, 0, z + (r - 0.9) * 2, x, z, { kind: 'cloth' }); }
      else if (r2 > 0.86) { for (var ri = 0; ri < 3; ri++) box(0.035, 0.4 + ri * 0.14, 0.035, 0x5a7a3a, x - 0.2 + ri * 0.1, 0.2 + ri * 0.07, z + ri * 0.08 - 0.1, x, z, { kind: 'cloth', seed: ri, noShadow: true }); }
    } else if (c === '.') {
      // a little clutter where it belongs, never in safe rooms or furnished rooms, never under furniture
      var info = roomInfo(x, z), rtype = info && info.type, styled = LEVEL.decor[x + ',' + z] || rtype === 'safe' || rtype === 'stairs' || (rtype === 'room' && (rid === 'office' || rid === 'studio'));
      if (styled) return;
      var junk = rid === 'hall' || rid === 'arena' || rid === 'gate' ? 0.965 : rid === 'bazaar' ? 0.94 : rid === 'office' || rid === 'studio' ? 0.975 : 0.985;
      if (r > junk && (rid === 'office' || rid === 'studio')) { // dropped paperwork
        for (var pp = 0; pp < 3; pp++) { var sh = box(0.22, 0.006, 0.3, [0xeeeae0, 0xe8e2d0, 0xf4f0e6][pp], x + (hash(x + pp, z) - 0.5) * 0.5, 0.004 + pp * 0.002, z + (hash(x, z + pp) - 0.5) * 0.5, x, z, { kind: 'cloth', noShadow: true }); sh.mesh.rotation.y = hash(x * pp, z) * 3; }
      } else if (r > junk && r2 > 0.55 && (rid === 'hall' || rid === 'arena' || rid === 'gate' || rid === 'bazaar')) { // old bones
        box(0.16, 0.13, 0.15, 0xd8d0b8, x - 0.15, 0.065, z + 0.1, x, z, { kind: 'bone' }); box(0.04, 0.03, 0.02, 0x1a1410, x - 0.19, 0.08, z + 0.18, x, z, { noShadow: true }); box(0.04, 0.03, 0.02, 0x1a1410, x - 0.11, 0.08, z + 0.18, x, z, { noShadow: true });
        var bn = box(0.3, 0.04, 0.05, 0xd8d0b8, x + 0.12, 0.02, z - 0.05, x, z, { kind: 'bone' }); bn.mesh.rotation.y = 0.6; bn = box(0.24, 0.04, 0.05, 0xcfc7ae, x + 0.05, 0.02, z + 0.22, x, z, { kind: 'bone' }); bn.mesh.rotation.y = -0.4;
      } else if (r > junk) { // a little rubble
        box(0.24, 0.1, 0.18, 0x7d766e, x + 0.2, 0.05, z - 0.2, x, z, { seed: 1 }); box(0.12, 0.07, 0.12, 0x6a645c, x + 0.02, 0.035, z - 0.08, x, z, { seed: 2 });
      } else if (rid === 'store' && r2 > 0.9) { box(0.32, 0.2, 0.26, 0xb09a6a, x + 0.1, 0.1, z, x, z, { kind: 'cloth', seed: 4 }); box(0.1, 0.07, 0.1, 0xb09a6a, x + 0.1, 0.23, z, x, z, { kind: 'cloth' }); box(0.12, 0.02, 0.12, 0x6a4e2a, x + 0.1, 0.2, z, x, z); }
    }
  }

  // Grik's throne, built at person scale: a stepped stone dais, a high-backed chair, a red cushion and a crest of bottle caps
  function throneAt(x, z, rot) {
    var c = Math.cos(rot), s = Math.sin(rot);
    function at(w, h, d, col, ox, y, oz, o) { var m = box(w, h, d, col, x + ox * c + oz * s, y, z - ox * s + oz * c, x, z, o || {}); m.mesh.rotation.y = rot; return m; }
    at(1.7, 0.16, 1.7, 0x4e4840, 0, 0.08, 0, { seed: 3 }); at(1.25, 0.14, 1.25, 0x5e574d, 0, 0.23, 0, { seed: 5 });
    at(0.72, 0.3, 0.62, 0x4a2e16, 0, 0.45, 0.02); at(0.72, 0.08, 0.62, 0x5a3a1e, 0, 0.62, 0.02); at(0.62, 0.07, 0.5, 0x8a1a1a, 0, 0.69, 0.04, { kind: 'cloth' });
    at(0.72, 1.15, 0.1, 0x5a3a1e, 0, 1.2, -0.28); at(0.6, 0.9, 0.04, 0x8a1a1a, 0, 1.15, -0.22, { kind: 'cloth' });
    at(0.09, 0.26, 0.6, 0x4a2e16, -0.36, 0.8, 0.02); at(0.09, 0.26, 0.6, 0x4a2e16, 0.36, 0.8, 0.02);
    at(0.86, 0.1, 0.14, 0xc9a227, 0, 1.82, -0.28, { kind: 'metal' });
    for (var i = -2; i <= 2; i++) at(0.1, 0.03, 0.1, [0xc9a227, 0xb0b0b0, 0xc84a2a][(i + 3) % 3], i * 0.16, 1.9 + (i % 2 ? 0.04 : 0.08), -0.28, { kind: 'metal' });
  }

  // ---------- streaming: only the chunks around the hero exist in the scene ----------
  // The floor is far bigger than a phone can draw at once; the camera only ever shows about ten tiles
  // around the hero, so chunks are built as you approach and torn down behind you.
  var CHUNK = 8, CH_R = 15, chunks = {}, curChunk = null, chunkAt = '';
  var BRAZ = []; for (var bz = 0; bz < H; bz++) for (var bx = 0; bx < W; bx++) if (MAP[bz].charAt(bx) === 'B') BRAZ.push({ x: bx, z: bz });
  for (var fl = 0; fl < 4; fl++) { var plx = new THREE.PointLight(0xff9a40, 0, 5.5, 1.4); scene.add(plx); fireLights.push({ l: plx, ph: fl * 2.3, on: false }); }
  // floors are merged: one mesh per floor texture per chunk, fogged tile by tile through vertex colours
  var curFloor = null;
  function floorQuad(tx, x, y, z) { if (!curFloor) return; var k = tx.uuid; (curFloor[k] || (curFloor[k] = { tex: tx, cells: [] })).cells.push([x, y, z]); }
  function buildFloors(list) {
    Object.keys(curFloor).forEach(function (k) {
      var b = curFloor[k], n = b.cells.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), col = new Float32Array(n * 12), nor = new Float32Array(n * 12), idx = [];
      b.cells.forEach(function (c, i) {
        var x = c[0], y = c[1], z = c[2], h = 0.4975, P4 = [[x - h, z - h], [x - h, z + h], [x + h, z + h], [x + h, z - h]], U4 = [[0, 1], [0, 0], [1, 0], [1, 1]];
        for (var v = 0; v < 4; v++) { pos.set([P4[v][0], y, P4[v][1]], i * 12 + v * 3); nor.set([0, 1, 0], i * 12 + v * 3); uv.set(U4[v], i * 8 + v * 2); }
        idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      });
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.userData.own = true;
      var mat = new THREE.MeshLambertMaterial({ map: b.tex, vertexColors: true }), mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true; mesh.castShadow = false; mesh.frustumCulled = false; scene.add(mesh);
      list.push({ mesh: mesh, x: b.cells[0][0], z: b.cells[0][2], floor: b.cells, base: WHITE });
    });
  }
  // colour every cell of a merged floor for the fog: black when unexplored, dim when remembered, lit when in sight
  function floorFog(t, R, dark) {
    var col = t.mesh.geometry.attributes.color, a = col.array;
    for (var i = 0; i < t.floor.length; i++) {
      var c = t.floor[i], key = c[0] + ',' + c[2], d2 = visNow[key], r = 0, gg = 0, bb = 0;
      if (d2 !== undefined) { var b = Math.max(0.4, 1.1 - d2 / (R + 1.5)); if (dark) { r = 0.62 * b; gg = 0.78 * b; bb = 1.15 * b; } else r = gg = bb = b; }
      else if (tileState[c[2] * W + c[0]]) r = gg = bb = 0.17;
      for (var v = 0; v < 4; v++) { a[i * 12 + v * 3] = r; a[i * 12 + v * 3 + 1] = gg; a[i * 12 + v * 3 + 2] = bb; }
    }
    col.needsUpdate = true;
  }
  function buildChunk(cx, cz) {
    var list = []; curChunk = list; curFloor = {};
    for (var z = cz * CHUNK; z < Math.min(H, (cz + 1) * CHUNK); z++) for (var x = cx * CHUNK; x < Math.min(W, (cx + 1) * CHUNK); x++) { buildTile(x, z); if (typeof buildTileProps === 'function') buildTileProps(x, z); }
    buildFloors(list); curFloor = null; curChunk = null; chunks[cx + ',' + cz] = list;
  }
  function unloadChunk(key) {
    var list = chunks[key]; if (!list) return; delete chunks[key];
    list.forEach(function (t) { scene.remove(t.mesh); if (t.mesh.material && !t.mesh.material.userData.shared) t.mesh.material.dispose(); if (t.mesh.geometry && t.mesh.geometry.userData.own) t.mesh.geometry.dispose(); });
  }
  function rebuildChunks() { Object.keys(chunks).forEach(unloadChunk); chunkAt = ''; streamChunks(true); }
  function streamChunks(force) {
    var px = (typeof P !== 'undefined') ? P.x : start.x, pz = (typeof P !== 'undefined') ? P.z : start.z;
    if (typeof CAMV !== 'undefined' && CAMV) { px = Math.round(px + CAMV.px); pz = Math.round(pz + CAMV.pz); }
    var key = Math.floor(px / 4) + ',' + Math.floor(pz / 4);
    if (!force && key === chunkAt) return; chunkAt = key;
    var need = {};
    for (var cz = Math.floor((pz - CH_R) / CHUNK); cz <= Math.floor((pz + CH_R) / CHUNK); cz++) for (var cx = Math.floor((px - CH_R) / CHUNK); cx <= Math.floor((px + CH_R) / CHUNK); cx++) {
      if (cx < 0 || cz < 0 || cx * CHUNK >= W || cz * CHUNK >= H) continue; need[cx + ',' + cz] = 1; if (!chunks[cx + ',' + cz]) buildChunk(cx, cz);
    }
    Object.keys(chunks).forEach(function (k) { if (!need[k]) unloadChunk(k); });
    tiles.length = 0; Object.keys(chunks).forEach(function (k) { Array.prototype.push.apply(tiles, chunks[k]); });
    for (var i = flames.length - 1; i >= 0; i--) if (!flames[i].m.parent) flames.splice(i, 1);
    for (i = mobParts.length - 1; i >= 0; i--) if (!mobParts[i].t.mesh.parent) mobParts.splice(i, 1);
    // the four nearest braziers get the real lights
    var near = BRAZ.filter(function (b) { return Math.abs(b.x - px) + Math.abs(b.z - pz) < 16; }).sort(function (a, b) { return (Math.abs(a.x - px) + Math.abs(a.z - pz)) - (Math.abs(b.x - px) + Math.abs(b.z - pz)); });
    fireLights.forEach(function (f, n) { var b = near[n]; f.on = !!b; if (b) f.l.position.set(b.x, 1.1, b.z); else f.l.intensity = 0; });
  }
  streamChunks(true);
  function propsOn() { return typeof PROPS !== 'undefined' && !!PROPS && PROPS.ready; }
