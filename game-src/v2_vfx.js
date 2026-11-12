
  // ===================== Visual effects: thrown things, fire, splashes, puddles =====================
  var VFX = { parts: [], pools: [], flights: [], last: 0 };
  function vfxTex(kind) {
    if (vfxTex[kind]) return vfxTex[kind];
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
    if (kind === 'soft') { var r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
    else if (kind === 'splat') { // a blotchy puddle
      c.width = c.height = 128; g = c.getContext('2d'); g.fillStyle = '#fff';
      for (var i = 0; i < 16; i++) { var a = Math.random() * Math.PI * 2, d = Math.random() * 34, rr = 14 + Math.random() * 22; g.globalAlpha = 0.85; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rr, 0, Math.PI * 2); g.fill(); }
      for (i = 0; i < 10; i++) { a = Math.random() * Math.PI * 2; d = 46 + Math.random() * 14; g.globalAlpha = 0.8; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 2 + Math.random() * 5, 0, Math.PI * 2); g.fill(); }
    }
    var t = new THREE.CanvasTexture(c); vfxTex[kind] = t; return t;
  }
  // one particle: a camera-facing sprite that moves, grows or shrinks, and fades
  function vfxPart(o) {
    if (VFX.parts.length > 420) return;
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
    if (liquid) { vfxPool(tx, tz, Math.max(0.7, area + 0.6), col, 60, lit ? 24 : 0); vfxBurst(tx, tz, col, 26, 2.2); }
    if (lit || fx.indexOf('burn') >= 0) { vfxFlame(tx, 0.2, tz, Math.max(0.8, area * 1.6 + 0.6), 40); vfxFlash(tx, tz, 0xff8a30); }
    else if (area > 0 && fx.indexOf('damage') >= 0) { vfxSmoke(tx, 0.3, tz, area * 1.5, 16); vfxFlash(tx, tz, 0xfff0c0); }
    else if (!liquid) vfxBurst(tx, tz, 0xb8a888, 12, 1.4);
    if (/smoke/i.test(it.name)) vfxSmoke(tx, 0.3, tz, 2.5, 40, 0x8a8a8a);
  }
  function vfxFlash(x, z, col) { var l = new THREE.PointLight(col, 3, 7); l.position.set(x, 1, z); scene.add(l); VFX.parts.push({ light: l, t: 0, life: 0.5 }); }
  function vfxTick(now) {
    requestAnimationFrame(vfxTick); var dt = Math.min(0.05, (now - (VFX.last || now)) / 1000); VFX.last = now; if (!dt) return;
    for (var i = VFX.flights.length - 1; i >= 0; i--) { var f = VFX.flights[i]; f.t += dt; var k = Math.min(1, f.t / f.dur);
      f.g.position.set(f.x0 + (f.tx - f.x0) * k, 1.2 * (1 - k) + 0.3 * k + 4 * f.peak * k * (1 - k), f.z0 + (f.tz - f.z0) * k); f.g.rotation.z += dt * 10; f.g.rotation.x += dt * 6;
      if (f.lit) vfxFlame(f.g.position.x, f.g.position.y, f.g.position.z, 0.1, 2);
      if (k >= 1) { scene.remove(f.g); VFX.flights.splice(i, 1); try { f.land(); } catch (x) { console.error(x); } } }
    for (i = VFX.parts.length - 1; i >= 0; i--) { var p = VFX.parts[i]; p.t += dt; var a = p.t / p.life;
      if (p.light) { p.light.intensity = 3 * (1 - a); if (a >= 1) { scene.remove(p.light); VFX.parts.splice(i, 1); } continue; }
      if (a >= 1) { scene.remove(p.s); p.s.material.dispose(); VFX.parts.splice(i, 1); continue; }
      p.vy -= p.g * dt; p.s.position.x += p.vx * dt; p.s.position.y = Math.max(0.03, p.s.position.y + p.vy * dt); p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(Math.max(0.02, p.s.scale.x + p.grow * dt)); p.s.material.opacity = p.op * (1 - a * a); }
    for (i = VFX.pools.length - 1; i >= 0; i--) { var q = VFX.pools[i]; q.t += dt;
      if (q.burn && q.t < q.burn && Math.random() < dt * 30) vfxFlame(q.x, 0.05, q.z, q.r * 1.6, 1);
      if (q.t > q.life - 5) q.m.material.opacity = 0.72 * Math.max(0, (q.life - q.t) / 5);
      if (q.t >= q.life) { scene.remove(q.m); VFX.pools.splice(i, 1); } }
    if (typeof PC !== 'undefined' && PC.burning > 0 && Math.random() < dt * 22) vfxFlame(P.px, 0.3 + Math.random() * 1.1, P.pz, 0.35, 1);
    // anything on fire keeps burning where you can see it
    if (typeof CB !== 'undefined') CB.enemies.forEach(function (e) { if (e.dead || !e.burning || !(e.burning.turns > 0) || !e.obj.visible) return; if (Math.random() < dt * 22) vfxFlame(e.px, (e.def.h || 0.8) * (0.2 + Math.random() * 0.6), e.pz, 0.35, 1); });
  }
  requestAnimationFrame(vfxTick);
