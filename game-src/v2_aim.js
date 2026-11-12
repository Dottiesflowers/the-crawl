
  // ===================== Aim and throw: pick a thing, see your range, tap a target =====================
  // Range comes from Strength: a normal person throws 30 feet (6 tiles) well and twice that badly
  // (disadvantage). Each point of STR modifier adds 10 feet; Thrown Objects adds 5 feet a level.
  // Anything flammable can be lit first if you have a flame (a lighter, a lit torch or a brazier next to you).
  var AIM = { on: false, it: null, lit: false, ring: null, ring2: null, down: null };
  function throwRange() { var n = Math.max(6, 6 + 2 * MOD.STR + skillLv('Thrown Objects')); return { near: n, far: n * 2 }; }
  function fireSource() {
    if (typeof sty === 'function' && sty('off') === 2) return 'your torch';
    var g = (CHAR && CHAR.gear || []).filter(function (x) { return (x.tags || []).indexOf('fire') >= 0 || /lighter|match(es|book)?\b|zippo/i.test(x.name); })[0]; if (g) return 'your ' + g.name.toLowerCase();
    for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) if (ch(P.x + dx, P.z + dz) === 'B') return 'the brazier';
    return null;
  }
  function burnsKnown(it) { return (it.tags || []).indexOf('flammable') >= 0 && loreKnows(it, 'flammable'); }
  function canAim(it) { return !!it && (!!it.throw || burnsKnown(it)); }
  // what a lit thing does when it lands: whatever it did before, plus fire
  function litThrow(it) {
    var t = it.tags || [], fx = it.throw ? JSON.parse(JSON.stringify(it.throw.fx || [])) : [{ type: 'damage', dice: '1d4' }];
    if (!fx.some(function (f) { return f.type === 'burn'; })) fx.push({ type: 'burn', dice: t.indexOf('sticky') >= 0 ? '1d6' : '1d4', turns: t.indexOf('sticky') >= 0 ? 6 : 4 });
    var area = it.throw && it.throw.area ? it.throw.area : (t.indexOf('glass') >= 0 || t.indexOf('container') >= 0 || t.indexOf('slippery') >= 0 || t.indexOf('wet') >= 0) ? 1 : 0;
    return { fx: fx, area: area };
  }
  // ---------- aim mode ----------
  function aimStart(it, lit) {
    if (!it || !CHAR) return;
    if (!it.throw && !burnsKnown(it)) { say('Nothing to throw', 'That is not something you can usefully throw.', 2400); return; }
    if (!it.throw) lit = true;
    if (CB.on && (!cbMyTurn() || CB.busy || !CB.res.action)) { say('Not now', CB.on && cbMyTurn() ? 'You have used your action this turn.' : 'Wait for your turn.', 2500); return; }
    if (lit && !fireSource()) { say('No flame', 'You need a lighter, a lit torch or a brazier next to you to light it.', 3200); return; }
    if (UI.bag) bagToggle(); if (typeof closeMenu === 'function') closeMenu();
    AIM.on = true; AIM.it = it; AIM.lit = !!lit; aimRings(true); aimBanner();
  }
  function aimStop() { AIM.on = false; AIM.it = null; aimRings(false); var b = document.getElementById('aimBar'); if (b) b.classList.remove('on'); }
  function aimRings(on) {
    if (AIM.ring) { scene.remove(AIM.ring); scene.remove(AIM.ring2); AIM.ring = AIM.ring2 = null; }
    if (!on) return; var R = throwRange();
    var mk = function (r, op, col) { var m = new THREE.Mesh(new THREE.RingGeometry(r + 0.38, r + 0.6, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, depthTest: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(P.px, 0.04, P.pz); m.renderOrder = 50; scene.add(m); return m; };
    AIM.ring = mk(R.near, 0.75, 0xffc860); AIM.ring2 = mk(R.far, 0.35, 0xff7a50);
  }
  function aimBanner() {
    var el = document.getElementById('aimBar'); if (!el) { el = document.createElement('div'); el.id = 'aimBar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    var it = AIM.it, R = throwRange(), fire = fireSource(), can = burnsKnown(it) && it.throw;
    el.innerHTML = '<div><b>' + (AIM.lit ? 'Lit · ' : 'Throw · ') + esc(it.name) + '</b><span>Tap a target. ' + R.near * 5 + ' ft is a clean throw; out to ' + R.far * 5 + ' ft at disadvantage.' + (AIM.lit ? ' Lit with ' + esc(fire || 'nothing') + '.' : '') + '</span></div>' +
      (can ? '<button type="button" id="aimLit" class="' + (AIM.lit ? 'on' : '') + '"' + (fire ? '' : ' disabled title="You need a flame"') + '>' + (AIM.lit ? 'Lit' : 'Light it first') + '</button>' : '') + '<button type="button" id="aimX">Cancel</button>';
    el.classList.add('on');
    document.getElementById('aimX').onclick = aimStop;
    var lb = document.getElementById('aimLit'); if (lb) lb.onclick = function () { AIM.lit = !AIM.lit; aimBanner(); };
  }
  // the next tap on the world is the target
  window.addEventListener('pointerdown', function (ev) { if (AIM.on && ev.target === canvas) AIM.down = { x: ev.clientX, y: ev.clientY }; }, true);
  window.addEventListener('pointerup', function (ev) {
    if (!AIM.on || ev.target !== canvas || !AIM.down) return; var d = AIM.down; AIM.down = null;
    if (Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) > 14) return; // a drag to look around
    ev.stopImmediatePropagation();
    var best = null, bd = 46 * 46;
    CB.enemies.forEach(function (e) { if (e.dead || e.npc || !e.obj.visible) return; var s = toScreen(e.px, (e.def.h || 1) * 0.5, e.pz), dx = s.x - ev.clientX, dy = s.y - ev.clientY, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = e; } });
    var spot = null;
    if (!best) { var r = canvas.getBoundingClientRect(); cbRay.setFromCamera(new THREE.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), cam); if (cbRay.ray.intersectPlane(cbPlane, cbHit)) spot = { x: Math.round(cbHit.x), z: Math.round(cbHit.z) }; }
    aimAt(best, spot);
  }, true);
  window.addEventListener('keydown', function (ev) { if (AIM.on && ev.key === 'Escape') { aimStop(); ev.stopPropagation(); } }, true);
  function aimAt(e, spot) {
    var it = AIM.it, T = AIM.lit ? litThrow(it) : it.throw; if (!it) return aimStop();
    var x = e ? e.x : spot && spot.x, z = e ? e.z : spot && spot.z; if (x === undefined || x === null) return;
    if (!e && !T.area) { // a plain throw needs a creature; an area throw can land on a spot
      var near = CB.enemies.filter(function (q) { return !q.dead && !q.npc && q.obj.visible && cheb(q.x, q.z, x, z) <= 1; })[0]; if (near) { e = near; x = e.x; z = e.z; }
      else { say('Pick a target', 'Tap a creature. Only splash things can be thrown at the floor.', 2400); return; }
    }
    var R = throwRange(), dist = cheb(P.x, P.z, x, z);
    if (visNow[x + ',' + z] === undefined && !(e && e.obj.visible)) { say('You cannot see there', 'You can only throw at what you can see.', 2400); return; }
    if (dist > R.far) { say('Too far', 'That is ' + dist * 5 + ' feet away. You can throw ' + R.far * 5 + ' feet at most.', 2600); return; }
    if (!los(P.x, P.z, x, z)) { say('No line of sight', 'Something solid is in the way.', 2400); return; }
    var lit = AIM.lit; aimStop();
    if (lit) { var src = fireSource(); if (!src) { say('No flame', 'You lost your light.', 2400); return; } loreLearn([[it, 'flammable']], ''); }
    throwItem(it, e, { spot: e ? null : { x: x, z: z }, dis: dist > R.near, lit: lit, T: T });
  }
  // a thrown thing that lands on the floor still splashes whatever is next to it
  function throwAt(x, z, area) { return CB.enemies.filter(function (q) { return !q.dead && !q.npc && cheb(q.x, q.z, x, z) <= area; }); }
  setInterval(function () { if (AIM.on && AIM.ring) { AIM.ring.position.set(P.px, 0.04, P.pz); AIM.ring2.position.set(P.px, 0.04, P.pz); if (CB.on && (!cbMyTurn() || !CB.res.action)) aimStop(); } }, 100);
  (function aimCSS() {
    var c = document.createElement('style');
    c.textContent = '#aimBar{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:30;display:none;align-items:center;gap:10px;padding:8px 12px;background:linear-gradient(180deg,#3a3a3e,#1e1e22);border:1px solid #8a6a30;border-radius:6px;color:#F3E6CC;font-family:"EB Garamond",serif;box-shadow:0 4px 14px rgba(0,0,0,.6);max-width:calc(100vw - 24px)}' +
      '#aimBar.on{display:flex}#aimBar b{display:block;font-family:Cinzel,serif;font-size:13px;color:#E0B868}#aimBar span{font-size:13.5px}#aimBar button{height:36px;padding:0 12px;border-radius:4px;border:1px solid #8a7a5a;background:#2a2a2e;color:#F3E6CC;font-family:Cinzel,serif;font-size:12px;white-space:nowrap}' +
      '#aimBar #aimLit.on{background:radial-gradient(circle at 50% 30%,#d8702a,#7a2a10);border-color:#ffb060}#aimBar button:disabled{opacity:.45}';
    document.head.appendChild(c);
  })();
