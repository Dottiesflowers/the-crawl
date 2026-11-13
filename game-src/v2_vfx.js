
  // ===================== Visual effects: thrown things, fire, splashes, puddles =====================
  var VFX = { parts: [], pools: [], flights: [], bolts: [], arcs: [], areas: [], rings: [], last: 0 };
  function vfxTex(kind) {
    if (vfxTex[kind]) return vfxTex[kind];
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    if (kind === 'soft') { var r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    else if (kind === 'splat') { // a blotchy puddle
      c.width = c.height = 128; g = c.getContext('2d'); g.fillStyle = '#fff';
      for (var i = 0; i < 16; i++) { var a = Math.random() * Math.PI * 2, d = Math.random() * 34, rr = 14 + Math.random() * 22; g.globalAlpha = 0.85; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rr, 0, Math.PI * 2); g.fill(); }
      for (i = 0; i < 10; i++) { a = Math.random() * Math.PI * 2; d = 46 + Math.random() * 14; g.globalAlpha = 0.8; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2 + Math.random() * 5, 0, Math.PI * 2); g.fill(); }
    }
    else if (kind === 'web') { // a spider web: spokes and a spiral
      c.width = c.height = 256; g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.globalAlpha = 0.9;
      var sp = 13; for (i = 0; i < sp; i++) { var aa = i / sp * Math.PI * 2 + Math.random() * 0.2; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(aa) * 124, 128 + Math.sin(aa) * 124); g.stroke(); }
      g.lineWidth = 1.5; for (var rr2 = 10; rr2 < 122; rr2 += 9) { g.beginPath(); for (i = 0; i <= sp; i++) { aa = i / sp * Math.PI * 2; var w2 = rr2 + Math.sin(i * 1.7) * 2.5; var px = 128 + Math.cos(aa) * w2, py = 128 + Math.sin(aa) * w2; if (i) g.quadraticCurveTo(128 + Math.cos(aa - Math.PI / sp) * w2 * 0.93, 128 + Math.sin(aa - Math.PI / sp) * w2 * 0.93, px, py); else g.moveTo(px, py); } g.stroke(); }
    } else if (kind === 'ice') { // frosted sheet with cracks
      c.width = c.height = 256; g = c.getContext('2d'); var rg = g.createRadialGradient(128, 128, 10, 128, 128, 128); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(0.75, 'rgba(255,255,255,.75)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(120,170,210,.9)'; g.lineWidth = 1.6; for (i = 0; i < 14; i++) { var cx = 128, cy = 128, an = Math.random() * 6.28; g.beginPath(); g.moveTo(cx, cy); for (var k = 0; k < 6; k++) { an += (Math.random() - 0.5) * 0.9; cx += Math.cos(an) * 18; cy += Math.sin(an) * 18; g.lineTo(cx, cy); } g.stroke(); }
    } else if (kind === 'ring') { var rg2 = g.createRadialGradient(32, 32, 16, 32, 32, 32); rg2.addColorStop(0, 'rgba(255,255,255,0)'); rg2.addColorStop(0.7, 'rgba(255,255,255,1)'); rg2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg2; g.fillRect(0, 0, 64, 64); }
    else if (kind === 'spike') { g.fillStyle = '#fff'; for (i = 0; i < 26; i++) { var sx = 6 + Math.random() * 52, sy = 6 + Math.random() * 52; g.beginPath(); g.moveTo(sx, sy - 5); g.lineTo(sx + 2, sy + 3); g.lineTo(sx - 2, sy + 3); g.fill(); } }
    var t = new THREE.CanvasTexture(c); vfxTex[kind] = t; return t;
  }
  // one particle: a camera-facing sprite that moves, grows or shrinks, and fades
  function vfxPart(o) {
    if (VFX.parts.length > 700) return;
    var m = new THREE.SpriteMaterial({ map: vfxTex('soft'), color: o.color, transparent: true, opacity: o.op || 1, depthWrite: false, blending: o.add === false ? THREE.NormalBlending : THREE.AdditiveBlending });
    var s = new THREE.Sprite(m); s.position.set(o.x, o.y, o.z); s.scale.setScalar(o.size || 0.3); s.renderOrder = 60; scene.add(s);
    VFX.parts.push({ s: s, vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0, life: o.life || 0.8, t: 0, grow: o.grow || 0, op: o.op || 1, g: o.g || 0 });
  }
  function vfxFlame(x, y, z, spread, n) {
    for (var i = 0; i < (n || 1); i++) {
      var hot = Math.random();
      vfxPart({ x: x + (Math.random() - 0.5) * spread, y: y + Math.random() * 0.1, z: z + (Math.random() - 0.5) * spread, vy: 0.9 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.3, vz: (Math.random() - 0.5) * 0.3,
        color: hot > 0.6 ? 0xffd860 : hot > 0.25 ? 0xff8a20 : 0xe03a10, size: 0.22 + Math.random() * 0.28, grow: -0.25, life: 0.45 + Math.random() * 0.45 });
    }
  }
  function vfxSmoke(x, y, z, spread, n, col) {
    for (var i = 0; i < (n || 1); i++) vfxPart({ x: x + (Math.random() - 0.5) * spread, y: y, z: z + (Math.random() - 0.5) * spread, vy: 0.4 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.5, vz: (Math.random() - 0.5) * 0.5,
      color: col || 0x55504a, size: 0.35 + Math.random() * 0.3, grow: 0.9, life: 1.2 + Math.random() * 0.8, op: 0.55, add: false });
  }
  function vfxBurst(x, z, col, n, power) {
    for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, sp = (power || 2) * (0.4 + Math.random() * 0.8);
      vfxPart({ x: x, y: 0.35, z: z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 1 + Math.random() * 2, g: 6, color: col, size: 0.1 + Math.random() * 0.12, life: 0.5 + Math.random() * 0.4, add: false }); }
  }
  // a puddle on the floor; burning puddles keep flaming for a while
  function vfxPool(x, z, r, col, secs, burnSecs) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.2, r * 2.2), new THREE.MeshBasicMaterial({ map: vfxTex('splat'), color: col, transparent: true, opacity: 0.72, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.position.set(x, 0.03 + Math.random() * 0.01, z); m.renderOrder = 4; scene.add(m);
    VFX.pools.push({ m: m, x: x, z: z, r: r, t: 0, life: secs || 45, burn: burnSecs || 0, burnUntil: burnSecs ? Date.now() + burnSecs * 1000 : 0 });
  }
  // a thrown thing flies in an arc, then lands
  function vfxThrow(it, tx, tz, lit, land) {
    var g = new THREE.Group(), col = /slime|goo|bog/i.test(it.name) ? 0x6ab04a : /grease/i.test(it.name) ? 0xb8962a : 0x8a7a6a;
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })); g.add(ball);
    if (/stick|spear|pole/i.test(it.name + ' ' + (it.parts || []).join(' '))) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a30 })); st.position.y = -0.2; g.add(st); }
    var x0 = P.px, z0 = P.pz, d = Math.hypot(tx - x0, tz - z0), dur = 0.35 + d * 0.045, peak = 0.9 + d * 0.14;
    g.position.set(x0, 1.2, z0); scene.add(g);
    VFX.flights.push({ g: g, x0: x0, z0: z0, tx: tx, tz: tz, dur: dur, peak: peak, t: 0, lit: lit, land: land });
  }
  // what the landing looks like, from what the thing is and what it does
  function vfxImpact(it, tx, tz, T, lit) {
    var tags = it.tags || [], fx = (T && T.fx || []).map(function (f) { return f.type; }), area = (T && T.area) || 0;
    var col = tags.indexOf('toxic') >= 0 ? 0x7a4aa0 : /slime|goo|bog/i.test(it.name) || tags.indexOf('wet') >= 0 ? 0x3a7a2a : tags.indexOf('slippery') >= 0 || /grease|oil/i.test(it.name) ? 0x6a5418 : tags.indexOf('sticky') >= 0 || fx.indexOf('prone') >= 0 ? 0xd08a2a : 0x7a6a5a;
    var liquid = area > 0 || fx.indexOf('prone') >= 0 || tags.indexOf('sticky') >= 0 || tags.indexOf('slippery') >= 0 || tags.indexOf('wet') >= 0 || tags.indexOf('glass') >= 0;
    var slick = tags.indexOf('slippery') >= 0 || /grease|oil|goo trap/i.test(it.name), R0 = Math.max(0.7, area + 0.6);
    if (liquid) { if (slick) vfxArea('grease', tx, tz, R0, 45); else vfxPool(tx, tz, R0, col, 60); vfxBurst(tx, tz, col, 26, 2.2); }
    if (lit || fx.indexOf('burn') >= 0) { vfxArea('fire', tx, tz, R0, lit ? 20 : 10); vfxFlame(tx, 0.2, tz, Math.max(0.8, area * 1.6 + 0.6), 40); vfxFlash(tx, tz, 0xff8a30); }
    if (fx.indexOf('stun') >= 0 && !lit) { vfxHit('cold', tx, tz, 1.2); vfxSmoke(tx, 0.3, tz, 1.2, 14, 0xf0f0f0); }
    else if (area > 0 && fx.indexOf('damage') >= 0) { vfxSmoke(tx, 0.3, tz, area * 1.5, 16); vfxFlash(tx, tz, 0xfff0c0); }
    else if (!liquid) vfxBurst(tx, tz, 0xb8a888, 12, 1.4);
    if (/smoke/i.test(it.name)) { vfxSmoke(tx, 0.3, tz, 2.5, 40, 0x8a8a8a); vfxArea('smoke', tx, tz, 2.5, 18); }
  }
  function vfxFlash(x, z, col) { var l = new THREE.PointLight(col, 3, 7); l.position.set(x, 1, z); scene.add(l); VFX.parts.push({ light: l, t: 0, life: 0.5 }); }
  // ---------- damage types: colours and what a hit looks like ----------
  var DTYPE = { fire: 0xff7a20, lightning: 0x9ad8ff, cold: 0xcff0ff, acid: 0x8ae040, necrotic: 0x9a5aff, force: 0xd070ff, poison: 0x6ac040, radiant: 0xfff0a0, thunder: 0xd8d8ff };
  function vfxGround(tex, col, r, op, y) { var m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: vfxTex(tex), color: col, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.position.y = y || 0.04; m.renderOrder = 5; scene.add(m); return m; }
  function vfxRing(x, z, col, r, life, y) { var m = vfxGround('ring', col, 0.2, 0.9, y || 0.1); m.material.blending = THREE.AdditiveBlending; m.position.x = x; m.position.z = z; VFX.rings.push({ m: m, r: r, t: 0, life: life || 0.5 }); }
  function vfxSparks(x, y, z, col, n, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, u = Math.random() * 2 - 1, v = (sp || 3) * (0.5 + Math.random()); vfxPart({ x: x, y: y, z: z, vx: Math.cos(a) * v * Math.sqrt(1 - u * u), vy: u * v + 1, vz: Math.sin(a) * v * Math.sqrt(1 - u * u), g: 5, color: col, size: 0.07 + Math.random() * 0.07, life: 0.2 + Math.random() * 0.3 }); } }
  // a jagged electric arc between two points that flickers for its life
  function vfxArc(x0, y0, z0, x1, y1, z1, col, life, thick) {
    var n = 9, mat = new THREE.MeshBasicMaterial({ color: col || 0xbfe8ff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }), segs = [];
    for (var i = 0; i < n; i++) { var c = new THREE.Mesh(new THREE.CylinderGeometry(thick || 0.035, thick || 0.035, 1, 5), mat); c.renderOrder = 61; scene.add(c); segs.push(c); }
    var A = { segs: segs, mat: mat, a: new THREE.Vector3(x0, y0, z0), b: new THREE.Vector3(x1, y1, z1), t: 0, life: life || 0.25, jit: 0 }; vfxArcShape(A); VFX.arcs.push(A); return A;
  }
  var _ay = new THREE.Vector3(0, 1, 0), _ad = new THREE.Vector3();
  function vfxArcShape(A) {
    var n = A.segs.length, pts = [A.a.clone()], len = A.a.distanceTo(A.b), amp = Math.min(0.45, len * 0.09);
    for (var i = 1; i < n; i++) { var p = A.a.clone().lerp(A.b, i / n); p.x += (Math.random() - 0.5) * amp * 2; p.y += (Math.random() - 0.5) * amp; p.z += (Math.random() - 0.5) * amp * 2; pts.push(p); } pts.push(A.b.clone());
    A.segs.forEach(function (c, i) { var p = pts[i], q = pts[i + 1]; _ad.subVectors(q, p); var L = _ad.length(); c.scale.set(1, L, 1); c.position.copy(p).addScaledVector(_ad, 0.5); c.quaternion.setFromUnitVectors(_ay, _ad.normalize()); });
  }
  function vfxHit(type, x, z, h) {
    var y = (h || 1) * 0.6, col = DTYPE[type] || 0xffffff;
    if (type === 'fire') { vfxFlame(x, y * 0.5, z, 0.5, 16); vfxFlash(x, z, 0xff8a30); }
    else if (type === 'lightning') { vfxSparks(x, y, z, 0xd8f0ff, 18, 4); for (var i = 0; i < 2; i++) vfxArc(x + (Math.random() - 0.5) * 0.6, y + 1.4, z + (Math.random() - 0.5) * 0.6, x, y, z, 0xbfe8ff, 0.22, 0.025); vfxFlash(x, z, 0x9ad8ff); }
    else if (type === 'cold') { vfxBurst(x, z, 0xe8f8ff, 16, 2); vfxSmoke(x, y * 0.6, z, 0.6, 6, 0xd8eef8); vfxSparks(x, y, z, 0xffffff, 8, 2); vfxFlash(x, z, 0xcfe8ff); }
    else if (type === 'acid' || type === 'poison') { vfxBurst(x, z, col, 18, 2); vfxPool(x, z, 0.45, col, 8); vfxSmoke(x, 0.2, z, 0.5, 5, 0x9ac060); }
    else if (type === 'necrotic') { for (i = 0; i < 12; i++) vfxPart({ x: x + (Math.random() - 0.5) * 0.5, y: y * 0.5, z: z + (Math.random() - 0.5) * 0.5, vy: 0.8 + Math.random(), color: 0x6a2ab8, size: 0.25, grow: 0.3, life: 0.8, op: 0.8 }); vfxFlash(x, z, 0x7a3aff); }
    else if (type === 'force') { vfxRing(x, z, col, 0.9, 0.35, y); vfxSparks(x, y, z, col, 12, 3); vfxFlash(x, z, col); }
    else vfxSparks(x, y, z, 0xfff4d8, 6, 2); // plain steel
  }
  // ---------- projectiles: arrows, rocks, bolts of fire, magic missiles, rays ----------
  function vfxMeshArrow(fire) {
    var g = new THREE.Group(), sh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), new THREE.MeshBasicMaterial({ color: 0x8a6a40 })); sh.rotation.x = Math.PI / 2; g.add(sh);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 5), new THREE.MeshBasicMaterial({ color: 0xc8ccd0 })); tip.rotation.x = Math.PI / 2; tip.position.z = 0.33; g.add(tip);
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.12), new THREE.MeshBasicMaterial({ color: fire ? 0xffa040 : 0xe8e0d0, side: THREE.DoubleSide })); fl.rotation.x = Math.PI / 2; fl.position.z = -0.27; g.add(fl); return g;
  }
  function vfxOrb(col, size) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: vfxTex('soft'), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); s.scale.setScalar(size); s.renderOrder = 62; return s; }
  // kind: arrow | firearrow | rock | dagger | firebolt | fireball | missile | acid | frost | lightning
  function vfxBolt(kind, x0, z0, tx, tz, done, o) {
    o = o || {}; var y0 = o.y0 || 1.15, ty = o.ty || 0.7, d = Math.hypot(tx - x0, tz - z0) || 1, g, speed = 14, peak = 0, trail = null;
    if (kind === 'lightning') { // instant: a crackling line from the caster to the end of the bolt
      var ex = x0 + (tx - x0) / d * Math.max(d, o.len || d), ez = z0 + (tz - z0) / d * Math.max(d, o.len || d);
      for (var i = 0; i < 3; i++) vfxArc(x0, y0, z0, ex, ty, ez, i ? 0x8ac8ff : 0xffffff, 0.45, i ? 0.03 : 0.05);
      for (i = 0; i < 6; i++) { var k = Math.random(); vfxSparks(x0 + (ex - x0) * k, y0 + (ty - y0) * k, z0 + (ez - z0) * k, 0xd8f0ff, 5, 2.5); }
      vfxFlash(x0, z0, 0x9ad8ff); vfxFlash(tx, tz, 0x9ad8ff); setTimeout(function () { vfxHit('lightning', tx, tz, 1.4); if (done) done(); }, 120); return;
    }
    if (kind === 'frost') { // a ray: a pale beam that holds for a moment, then frost on the target
      var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1, 8), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      var a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(tx, ty, tz), dv = b.clone().sub(a); beam.scale.set(1, dv.length(), 1); beam.position.copy(a).addScaledVector(dv, 0.5); beam.quaternion.setFromUnitVectors(_ay, dv.clone().normalize()); beam.renderOrder = 61; scene.add(beam);
      VFX.bolts.push({ beam: beam, t: 0, dur: 0.45, a: a, b: b, done: function () { scene.remove(beam); vfxHit('cold', tx, tz, 1.4); if (done) done(); } }); return;
    }
    if (kind === 'missile') { // three darts that curve in from different sides, one after another
      var n = o.n || 3, left = n; for (i = 0; i < n; i++) (function (j) { setTimeout(function () {
        var orb = vfxOrb(0xe080ff, 0.32); orb.position.set(x0, y0, z0); scene.add(orb); var side = (j - (n - 1) / 2) * 1.6 + (Math.random() - 0.5) * 0.6;
        VFX.bolts.push({ g: orb, x0: x0, z0: z0, y0: y0, tx: tx, tz: tz, ty: ty, t: 0, dur: 0.32 + d * 0.025, side: side, trail: 0xc060ff, done: function () { scene.remove(orb); vfxHit('force', tx, tz, 1.4); if (--left === 0 && done) done(); } });
      }, j * 110); })(i); return;
    }
    if (kind === 'arrow' || kind === 'firearrow') { g = vfxMeshArrow(kind === 'firearrow'); speed = 24; peak = d * 0.03; if (kind === 'firearrow') trail = 'fire'; }
    else if (kind === 'dagger') { g = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.3), new THREE.MeshBasicMaterial({ color: 0xd0d4d8 })); speed = 16; peak = d * 0.05; o.spin = true; }
    else if (kind === 'rock') { g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07), new THREE.MeshLambertMaterial({ color: 0x8a8278 })); speed = 12; peak = 0.4 + d * 0.08; o.spin = true; }
    else if (kind === 'firebolt') { g = vfxOrb(0xff9a30, 0.42); speed = 15; trail = 'fire'; }
    else if (kind === 'fireball') { g = vfxOrb(0xffb040, 0.3); speed = 10; peak = 0.8 + d * 0.06; trail = 'fire'; }
    else if (kind === 'acid') { g = vfxOrb(0x9ae040, 0.3); speed = 12; peak = 0.6 + d * 0.07; trail = 0x7ac030; }
    else if (kind === 'pebble') { g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045), new THREE.MeshLambertMaterial({ color: 0x8a8278 })); speed = 20; peak = d * 0.02; o.spin = true; }
    else if (kind === 'paint') { g = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x9aff3a })); speed = 18; peak = d * 0.015; trail = 0x6ad020; }
    else { g = vfxOrb(0xffffff, 0.25); }
    g.position.set(x0, y0, z0); scene.add(g);
    VFX.bolts.push({ g: g, x0: x0, z0: z0, y0: y0, tx: tx, tz: tz, ty: ty, t: 0, dur: Math.max(0.12, d / speed), peak: peak, trail: trail, spin: o.spin, aim: kind === 'arrow' || kind === 'firearrow', done: function () {
      scene.remove(g);
      if (kind === 'paint') { vfxBurst(tx, tz, 0x9aff3a, 14, 2); vfxPool(tx + (Math.random() - 0.5) * 0.3, tz + (Math.random() - 0.5) * 0.3, 0.32, 0x7adf2a, 10); vfxSmoke(tx, 0.4, tz, 0.3, 3, 0x9ac060); } else
      if (kind === 'fireball') vfxFireball(tx, tz, o.r || 2); else if (kind === 'firebolt' || kind === 'firearrow') vfxHit('fire', tx, tz, 1.4); else if (kind === 'acid') { vfxHit('acid', tx, tz, 1.4); vfxArea('acid', tx, tz, o.r || 0.8, 12); } else vfxHit('steel', tx, tz, 1.4);
      if (done) done();
    } });
  }
  // the fireball blast: a swelling sphere of fire, a ring, smoke and a scorch mark
  function vfxFireball(x, z, r) {
    var sph = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); sph.position.set(x, 0.4, z); sph.scale.setScalar(0.2); sph.renderOrder = 61; scene.add(sph);
    VFX.rings.push({ sph: sph, r: r, t: 0, life: 0.55 });
    vfxRing(x, z, 0xffc060, r * 1.3, 0.5, 0.08); for (var i = 0; i < 70; i++) { var a = Math.random() * 6.28, d = Math.random() * r; vfxFlame(x + Math.cos(a) * d, 0.1 + Math.random() * 0.8, z + Math.sin(a) * d, 0.2, 1); }
    vfxSparks(x, 0.6, z, 0xffd080, 30, 5); setTimeout(function () { vfxSmoke(x, 0.5, z, r * 1.4, 26, 0x3a3430); }, 250);
    var l = new THREE.PointLight(0xff8a30, 6, r * 5 + 4); l.position.set(x, 1.2, z); scene.add(l); VFX.parts.push({ light: l, t: 0, life: 0.8, peak: 6 });
    vfxPool(x, z, r, 0x140e0a, 30);
  }
  // ---------- lingering areas: fire, grease, ice, web, smoke, darkness, acid, storm, spikes ----------
  var AREA_COL = { fire: '#ff7a20', grease: '#8a6a20', ice: '#bfe8ff', web: '#e8e8e8', smoke: '#9a9a9a', darkness: '#2a1a3a', acid: '#8ae040', storm: '#9ad8ff', spikes: '#b08a5a' };
  function vfxArea(kind, x, z, r, secs) {
    var A = { kind: kind, x: x, z: z, r: r, t: 0, life: secs || 30, meshes: [], cool: 0 }, m;
    if (kind === 'fire') { m = vfxGround('splat', 0x2a1408, r, 0.75); A.meshes.push(m); m = vfxGround('soft', 0xff6a10, r * 1.1, 0.55, 0.05); m.material.blending = THREE.AdditiveBlending; A.meshes.push(m); A.light = new THREE.PointLight(0xff7a30, 2, r * 3 + 3); A.light.position.set(x, 0.8, z); scene.add(A.light); }
    else if (kind === 'grease') { m = vfxGround('splat', 0x2a2010, r, 0.85); A.meshes.push(m); m = vfxGround('splat', 0x8a7040, r * 0.7, 0.25, 0.045); m.material.blending = THREE.AdditiveBlending; A.meshes.push(m); }
    else if (kind === 'ice') { m = vfxGround('ice', 0xcfeaff, r, 0.8); A.meshes.push(m); }
    else if (kind === 'web') { m = vfxGround('web', 0xffffff, r, 0.85, 0.06); A.meshes.push(m);
      for (var i = 0; i < 3; i++) { var w = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.1, r * 0.9), new THREE.MeshBasicMaterial({ map: vfxTex('web'), color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); w.position.set((Math.random() - 0.5) * r, r * 0.45, (Math.random() - 0.5) * r); w.rotation.y = i * 1.05 + Math.random() * 0.4; w.renderOrder = 6; A.meshes.push(w); scene.add(w); } }
    else if (kind === 'acid') { m = vfxGround('splat', 0x4a8a1a, r, 0.8); A.meshes.push(m); }
    else if (kind === 'darkness') { for (i = 0; i < 4; i++) { var dk = new THREE.Mesh(new THREE.SphereGeometry(r * (0.75 + i * 0.12), 16, 10, 0, 6.29, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x05030a, transparent: true, opacity: 0.32, depthWrite: false })); dk.renderOrder = 63; A.meshes.push(dk); scene.add(dk); } }
    else if (kind === 'spikes') { m = vfxGround('spike', 0xb08a5a, r, 0.95, 0.05); A.meshes.push(m); }
    else if (kind === 'storm') { m = vfxGround('ring', 0x6ab0ff, r, 0.45, 0.06); m.material.blending = THREE.AdditiveBlending; A.meshes.push(m); }
    A.meshes.forEach(function (q) { q.position.x += x; q.position.z += z; q.userData.op = q.material.opacity; });
    if (kind === 'fire') VFX.areas.forEach(function (W2) { if (W2.kind === 'web' && Math.hypot(W2.x - x, W2.z - z) <= W2.r + r) W2.t = Math.max(W2.t, W2.life - 1.2); }); // fire burns webs away
    VFX.areas.push(A); if (typeof refreshFog === 'function') setTimeout(function () { try { mapRedraw(); } catch (x) {} }, 50); return A;
  }
  function mapRedraw() {} // the minimap redraws itself every few hundred ms
  function vfxAreaTick(A, dt) {
    var x = A.x, z = A.z, r = A.r, rnd = function () { var a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r; return [x + Math.cos(a) * d, z + Math.sin(a) * d]; }, p;
    if (A.kind === 'fire') { var nf = dt * (40 + r * 40); while (nf > 0) { if (Math.random() < nf) { p = rnd(); vfxFlame(p[0], 0.05, p[1], 0.35, 1); } nf -= 1; } A.light.intensity = 1.6 + Math.random() * 0.9; }
    else if (A.kind === 'grease') { if (Math.random() < dt * 2) { p = rnd(); vfxPart({ x: p[0], y: 0.06, z: p[1], color: 0xfff0c0, size: 0.12, grow: 0.15, life: 0.9, op: 0.35 }); } }
    else if (A.kind === 'ice') { if (Math.random() < dt * 3) { p = rnd(); vfxPart({ x: p[0], y: 0.08, z: p[1], vx: 0.1, color: 0xe8f8ff, size: 0.4, grow: 0.4, life: 1.6, op: 0.35, add: false }); } if (Math.random() < dt * 4) { p = rnd(); vfxPart({ x: p[0], y: 0.1, z: p[1], color: 0xffffff, size: 0.08, life: 0.4 }); } }
    else if (A.kind === 'smoke') { var ns = dt * (16 + r * 12); while (ns > 0) { if (Math.random() < ns) { p = rnd(); vfxPart({ x: p[0], y: 0.2 + Math.random() * 1.4, z: p[1], vx: (Math.random() - 0.5) * 0.2, vy: 0.05, vz: (Math.random() - 0.5) * 0.2, color: 0xb8b8b8, size: 1.2 + Math.random() * 0.8, grow: 0.3, life: 3, op: 0.7, add: false }); } ns -= 1; } }
    else if (A.kind === 'darkness') { A.meshes.forEach(function (q, i) { q.rotation.y += dt * (0.1 + i * 0.05); }); if (Math.random() < dt * 6) { p = rnd(); vfxPart({ x: p[0], y: 0.4 + Math.random(), z: p[1], color: 0x1a0a2a, size: 0.8, grow: 0.3, life: 2, op: 0.6, add: false }); } }
    else if (A.kind === 'acid') { if (Math.random() < dt * 6) { p = rnd(); vfxPart({ x: p[0], y: 0.06, z: p[1], vy: 0.25, color: 0xb8ff70, size: 0.07, grow: 0.12, life: 0.5 }); } if (Math.random() < dt * 1.5) { p = rnd(); vfxSmoke(p[0], 0.1, p[1], 0.2, 1, 0x8ab050); } }
    else if (A.kind === 'storm') { A.cool -= dt; if (A.cool <= 0) { A.cool = 0.25 + Math.random() * 0.6; p = rnd(); vfxArc(p[0] + (Math.random() - 0.5), 4, p[1] + (Math.random() - 0.5), p[0], 0.05, p[1], 0xcfeaff, 0.18, 0.04); vfxSparks(p[0], 0.1, p[1], 0xd8f0ff, 6, 2); vfxFlash(p[0], p[1], 0x9ad8ff); } }
    else if (A.kind === 'web') { A.meshes.forEach(function (q, i) { if (i) q.rotation.y += Math.sin(A.t * 1.3 + i) * dt * 0.05; }); }
  }
  // DM preview: fire any effect at the nearest monster you can see (or a few tiles ahead). Looks only: no damage, no fight
  var VFX_PREVIEW = [['Fireball', 'fireball'], ['Magic missile', 'missile'], ['Lightning bolt', 'lightning'], ['Ray of frost', 'frost'], ['Firebolt', 'firebolt'], ['Acid splash', 'acid'], ['Arrow', 'arrow'], ['Fire arrow', 'firearrow'],
    ['Fire area', 'a:fire'], ['Grease', 'a:grease'], ['Ice', 'a:ice'], ['Web', 'a:web'], ['Fog cloud', 'a:smoke'], ['Darkness', 'a:darkness'], ['Acid pool', 'a:acid'], ['Storm', 'a:storm'], ['Spike growth', 'a:spikes'], ['Clear areas', 'clear']];
  function vfxPreview(k) {
    if (k === 'clear') { vfxClearAreas(); return; }
    var best = null, bd = 15; CB.enemies.forEach(function (e) { if (e.dead || !e.obj.visible) return; var d = Math.hypot(e.px - P.px, e.pz - P.pz); if (d < bd && d > 1.2) { bd = d; best = e; } });
    var ry = hero.rotation.y, tx = best ? best.px : P.px + Math.sin(ry) * 5, tz = best ? best.pz : P.pz + Math.cos(ry) * 5;
    if (best && typeof cbFaceHero === 'function') cbFaceHero(tx, tz); if (typeof kitOneShot === 'function') kitOneShot('Spell_Simple_Shoot');
    if (k.indexOf('a:') === 0) { var kind = k.slice(2), r = { fire: 1.5, grease: 1.5, ice: 2, web: 2, smoke: 2.5, darkness: 2.5, acid: 1.2, storm: 2.5, spikes: 2 }[kind] || 1.5; vfxArea(kind, Math.round(tx), Math.round(tz), r, 20); return; }
    setTimeout(function () { vfxBolt(k, P.px, P.pz, tx, tz, null, { ty: best ? (best.def.h || 1) * 0.6 : 0.4, r: 2, len: 12 }); }, 220);
  }
  function vfxClearAreas() { VFX.areas.forEach(function (A) { A.meshes.forEach(function (q) { scene.remove(q); }); if (A.light) scene.remove(A.light); }); VFX.areas.length = 0; }
  function vfxTick(now) {
    requestAnimationFrame(vfxTick); var dt = Math.min(0.05, (now - (VFX.last || now)) / 1000); VFX.last = now; if (!dt) return;
    for (var i = VFX.flights.length - 1; i >= 0; i--) { var f = VFX.flights[i]; f.t += dt; var k = Math.min(1, f.t / f.dur);
      f.g.position.set(f.x0 + (f.tx - f.x0) * k, 1.2 * (1 - k) + 0.3 * k + 4 * f.peak * k * (1 - k), f.z0 + (f.tz - f.z0) * k); f.g.rotation.z += dt * 10; f.g.rotation.x += dt * 6;
      if (f.lit) vfxFlame(f.g.position.x, f.g.position.y, f.g.position.z, 0.1, 2);
      if (k >= 1) { scene.remove(f.g); VFX.flights.splice(i, 1); try { f.land(); } catch (x) { console.error(x); } } }
    for (i = VFX.parts.length - 1; i >= 0; i--) { var p = VFX.parts[i]; p.t += dt; var a = p.t / p.life;
      if (p.light) { p.light.intensity = (p.peak || 3) * (1 - a); if (a >= 1) { scene.remove(p.light); VFX.parts.splice(i, 1); } continue; }
      if (a >= 1) { scene.remove(p.s); p.s.material.dispose(); VFX.parts.splice(i, 1); continue; }
      p.vy -= p.g * dt; p.s.position.x += p.vx * dt; p.s.position.y = Math.max(0.03, p.s.position.y + p.vy * dt); p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(Math.max(0.02, p.s.scale.x + p.grow * dt)); p.s.material.opacity = p.op * (1 - a * a); }
    for (i = VFX.bolts.length - 1; i >= 0; i--) { var b = VFX.bolts[i]; b.t += dt; var kk = Math.min(1, b.t / b.dur);
      if (b.beam) { b.beam.material.opacity = 0.85 * (0.6 + 0.4 * Math.sin(b.t * 60)); b.beam.scale.x = b.beam.scale.z = 1 + 0.3 * Math.sin(b.t * 40); for (var mm = 0; mm < 2; mm++) { var pp = b.a.clone().lerp(b.b, Math.random()); vfxPart({ x: pp.x, y: pp.y, z: pp.z, vy: -0.2, color: 0xe8f8ff, size: 0.28, grow: 0.3, life: 0.6, op: 0.5, add: false }); } if (kk >= 1) { VFX.bolts.splice(i, 1); b.done(); } continue; }
      var bx = b.x0 + (b.tx - b.x0) * kk, bz = b.z0 + (b.tz - b.z0) * kk, by = b.y0 + (b.ty - b.y0) * kk + 4 * (b.peak || 0) * kk * (1 - kk);
      if (b.side) { var nx = -(b.tz - b.z0), nz = b.tx - b.x0, nl = Math.hypot(nx, nz) || 1, bend = Math.sin(kk * Math.PI) * b.side; bx += nx / nl * bend; bz += nz / nl * bend; by += Math.sin(kk * Math.PI) * 0.6; }
      if (b.aim) { b.g.lookAt(bx + (bx - b.g.position.x), by + (by - b.g.position.y), bz + (bz - b.g.position.z)); }
      b.g.position.set(bx, by, bz); if (b.spin) { b.g.rotation.x += dt * 14; b.g.rotation.y += dt * 9; }
      if (b.trail === 'fire') vfxFlame(bx, by, bz, 0.08, 2); else if (b.trail) vfxPart({ x: bx, y: by, z: bz, color: b.trail, size: 0.18, grow: -0.3, life: 0.35 });
      if (kk >= 1) { VFX.bolts.splice(i, 1); try { b.done(); } catch (x) { console.error(x); } } }
    for (i = VFX.arcs.length - 1; i >= 0; i--) { var A2 = VFX.arcs[i]; A2.t += dt; A2.jit += dt; if (A2.jit > 0.04) { A2.jit = 0; vfxArcShape(A2); } A2.mat.opacity = Math.random() < 0.2 ? 0.25 : 1 - A2.t / A2.life * 0.5;
      if (A2.t >= A2.life) { A2.segs.forEach(function (c) { scene.remove(c); c.geometry.dispose(); }); A2.mat.dispose(); VFX.arcs.splice(i, 1); } }
    for (i = VFX.rings.length - 1; i >= 0; i--) { var R2 = VFX.rings[i]; R2.t += dt; var ra = R2.t / R2.life;
      if (R2.sph) { R2.sph.scale.setScalar(0.2 + R2.r * (1 - Math.pow(1 - Math.min(1, ra * 1.6), 3))); R2.sph.material.opacity = 0.85 * (1 - ra); R2.sph.material.color.setHSL(0.08 - ra * 0.06, 1, 0.55 - ra * 0.25); }
      else { R2.m.scale.setScalar(0.2 + R2.r * 5 * ra); R2.m.material.opacity = 0.9 * (1 - ra); }
      if (ra >= 1) { scene.remove(R2.sph || R2.m); VFX.rings.splice(i, 1); } }
    for (i = VFX.areas.length - 1; i >= 0; i--) { var AR = VFX.areas[i]; if (!(typeof CB !== 'undefined' && CB.on)) AR.t += dt; vfxAreaTick(AR, dt); var fade = Math.min(1, (AR.life - AR.t) / 3, AR.t / 0.4);
      AR.meshes.forEach(function (q) { q.material.opacity = q.userData.op * Math.max(0, fade); });
      if (AR.t >= AR.life) { AR.meshes.forEach(function (q) { scene.remove(q); }); if (AR.light) scene.remove(AR.light); VFX.areas.splice(i, 1); try { mapRedraw(); } catch (x) {} } }
    for (i = VFX.pools.length - 1; i >= 0; i--) { var q = VFX.pools[i]; q.t += dt;
      if (q.burn && q.t < q.burn && Math.random() < dt * 30) vfxFlame(q.x, 0.05, q.z, q.r * 1.6, 1);
      if (q.t > q.life - 5) q.m.material.opacity = 0.72 * Math.max(0, (q.life - q.t) / 5);
      if (q.t >= q.life) { scene.remove(q.m); VFX.pools.splice(i, 1); } }
    if (typeof PC !== 'undefined' && PC.burning > 0 && Math.random() < dt * 22) vfxFlame(P.px, 0.3 + Math.random() * 1.1, P.pz, 0.35, 1);
    // anything on fire keeps burning where you can see it
    if (typeof CB !== 'undefined') CB.enemies.forEach(function (e) { if (e.dead || !e.burning || !(e.burning.turns > 0) || !e.obj.visible) return; if (Math.random() < dt * 22) vfxFlame(e.px, (e.def.h || 0.8) * (0.2 + Math.random() * 0.6), e.pz, 0.35, 1); });
  }
  requestAnimationFrame(vfxTick);
