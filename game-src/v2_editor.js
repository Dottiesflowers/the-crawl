  // ===================== DM editor: move, turn and remove things over the generated level =====================
  // Edits are a list of operations replayed over the level the generator builds, in order:
  //   { t: 'swap', a: [x, z], b: [x, z] }   a thing on a tile trades places with an empty floor tile
  //   { t: 'rot', at: [x, z], r: 1 }        set dressing on a tile turns a quarter (r: -1 the other way)
  //   { t: 'del', at: [x, z] }              the thing on a tile is cleared away
  //   { t: 'mob', k: 'kind@x,z', to: [x, z] }  a monster or NPC (named by where it first spawned) moves home
  //   { t: 'mobdel', k: 'kind@x,z' }        a monster or NPC is removed from the floor
  // Published edits come from the server (everyone gets them); the DM's unpublished draft stays on this device.
  // Nothing is saved until the DM says so: leaving the editor asks to save a draft, publish, or throw changes away.
  var EDIT = { on: false, sel: null, move: false, pub: [], draft: [], session: [], ring: null, booted: false, dirty: false };
  function edKey(kind) { return 'crawl-edits-' + kind + '-' + FLOOR; }
  function edCanPublish() { return NET.mode !== 'server' || (NET.user && NET.user.role === 'dm'); }
  function edLoadLocal(kind) { try { return JSON.parse(localStorage.getItem(edKey(kind)) || '[]') || []; } catch (x) { return []; } }
  function edSaveLocal(kind, ops) { try { localStorage.setItem(edKey(kind), JSON.stringify(ops)); } catch (x) {} }
  function edClean(ops) { return ops.map(function (o) { var c = {}; for (var k in o) if (k.charAt(0) !== '_') c[k] = o[k]; return c; }); }
  function mobKey(e) { return e.ek || (e.ek = e.kind + '@' + e.sp.x + ',' + e.sp.z); }
  function mobByKey(k) { for (var i = 0; i < CB.enemies.length; i++) if (mobKey(CB.enemies[i]) === k) return CB.enemies[i]; return null; }
  function setCh(x, z, c) { MAP[z] = MAP[z].substr(0, x) + c + MAP[z].substr(x + 1); }
  function isFloorCh(c) { return c === '.' || c === ','; }
  function edEditable(x, z) { var c = ch(x, z); return !!(LEVEL.decor[x + ',' + z] && LEVEL.decor[x + ',' + z].length) || (!isFloorCh(c) && c !== '#' && c !== '~' && c !== '@' && c !== ' ' && c !== 'D' && c !== '?'); }
  // ---------- applying one operation (u = undo it) ----------
  function edApply(o, u) {
    var k, e;
    if (o.t === 'swap') {
      var a = o.a[0] + ',' + o.a[1], b = o.b[0] + ',' + o.b[1], ca = ch(o.a[0], o.a[1]), cb = ch(o.b[0], o.b[1]);
      setCh(o.a[0], o.a[1], cb); setCh(o.b[0], o.b[1], ca);
      [LEVEL.decor, LEVEL.dname, PROPBLOCK].forEach(function (M) { var t = M[a]; if (M[b] !== undefined) M[a] = M[b]; else delete M[a]; if (t !== undefined) M[b] = t; else delete M[b]; });
      return true;
    }
    if (o.t === 'rot') { var dl = LEVEL.decor[o.at[0] + ',' + o.at[1]]; if (!dl) return false; dl.forEach(function (d) { d.rot = (d.rot || 0) + (u ? -1 : 1) * (o.r || 1) * Math.PI / 2; }); return true; }
    if (o.t === 'del') {
      k = o.at[0] + ',' + o.at[1];
      if (u) { var U = o._u; if (!U) return false; setCh(o.at[0], o.at[1], U.c); if (U.d) LEVEL.decor[k] = U.d; if (U.n !== undefined) LEVEL.dname[k] = U.n; if (U.b) PROPBLOCK[k] = 1; return true; }
      o._u = { c: ch(o.at[0], o.at[1]), d: LEVEL.decor[k], n: LEVEL.dname[k], b: PROPBLOCK[k] };
      setCh(o.at[0], o.at[1], '.'); delete LEVEL.decor[k]; delete LEVEL.dname[k]; delete PROPBLOCK[k]; return true;
    }
    if (o.t === 'mob') {
      e = mobByKey(o.k); if (!e) return false; var to = u ? o._from : o.to; if (!to) return false; if (!u) o._from = [e.sx, e.sz];
      e.x = e.sx = e.px = to[0]; e.z = e.sz = e.pz = to[1]; e.path = null; e.obj.position.set(to[0], 0, to[1]); return true;
    }
    if (o.t === 'mobdel') {
      e = mobByKey(o.k); if (!e) return false;
      if (u) { var S = o._u || {}; e.gone = false; e.dead = !!S.dead; e.eaten = !!S.eaten; e.hp = S.hp; e.counted = !!S.counted; e.obj.visible = true; return true; }
      o._u = { dead: e.dead, eaten: e.eaten, hp: e.hp, counted: e.counted };
      e.gone = true; e.dead = true; e.eaten = true; e.counted = true; e.looted = true; e.hp = 0; e.obj.visible = false; if (e.bar) e.bar.style.display = 'none'; return true;
    }
    return false;
  }
  function edRebuild() { if (typeof rebuildChunks === 'function') rebuildChunks(); refreshFog(); }
  // ---------- start-up: published edits, then (for the DM) the draft on top ----------
  function edBoot() {
    if (EDIT.booted || !CB.ready) return; EDIT.booted = true;
    CB.enemies.forEach(mobKey);
    var go = function (pub) {
      EDIT.pub = pub || []; edSaveLocal('pub', EDIT.pub);
      var n = 0; EDIT.pub.forEach(function (o) { if (edApply(o)) n++; });
      if (edCanPublish()) { EDIT.draft = edLoadLocal('draft'); EDIT.draft.forEach(function (o) { if (edApply(o)) n++; }); }
      if (n) edRebuild();
    };
    if (NET.mode === 'server') api('edits?floor=' + FLOOR).then(function (j) { go(j.value || []); }, function () { go(edLoadLocal('pub')); });
    else go(edLoadLocal('pub'));
  }
  setInterval(edBoot, 500);
  // ---------- the editor itself ----------
  function edToggle(on) {
    if (on === EDIT.on) return;
    if (on) { if (CB.on) { say('Editor', 'Finish the fight first.', 2500); return; } EDIT.on = true; EDIT.sel = null; EDIT.move = false; EDIT.session = []; var b = document.getElementById('dmBox'); if (b) b.remove(); edBar(); say('Editor', 'Tap a prop, a monster or an NPC to select it. Walk around as normal.', 4000); return; }
    if (EDIT.session.length) { edAsk(); return; }
    edClose();
  }
  function edClose() { EDIT.on = false; EDIT.sel = null; EDIT.move = false; edRing(null); var el = document.getElementById('edBar'); if (el) el.remove(); var a = document.getElementById('edAsk'); if (a) a.remove(); }
  function edSelName() {
    var s = EDIT.sel; if (!s) return 'Nothing selected';
    if (s.e) return s.e.name + (s.e.npc ? ' (NPC)' : '');
    return LEVEL.dname[s.x + ',' + s.z] || ((LEVEL.decor[s.x + ',' + s.z] || [])[0] || {}).m || 'Set piece';
  }
  function edBar() {
    var el = document.getElementById('edBar'); if (!el) { el = document.createElement('div'); el.id = 'edBar'; el.setAttribute('role', 'toolbar'); el.setAttribute('aria-label', 'Editor'); document.body.appendChild(el); }
    var s = EDIT.sel, canRot = s && !s.e && LEVEL.decor[s.x + ',' + s.z];
    el.innerHTML = '<div class="ed-h"><b>EDITOR</b><span>' + esc(EDIT.move ? 'Tap an empty floor tile to move it there' : edSelName()) + '</span><em>' + EDIT.session.length + ' change' + (EDIT.session.length === 1 ? '' : 's') + (EDIT.draft.length ? ' · ' + EDIT.draft.length + ' in draft' : '') + '</em></div>' +
      '<div class="ed-b"><button type="button" id="edMove"' + (s ? '' : ' disabled') + (EDIT.move ? ' class="on"' : '') + '>' + (EDIT.move ? 'Cancel move' : 'Move') + '</button>' +
      '<button type="button" id="edRot"' + (canRot ? '' : ' disabled title="Only set dressing turns"') + '>Rotate</button>' +
      '<button type="button" id="edDel"' + (s ? '' : ' disabled') + '>Remove</button>' +
      '<button type="button" id="edUndo"' + (EDIT.session.length ? '' : ' disabled') + '>Undo</button>' +
      '<button type="button" id="edDone" class="hot">Done</button></div>';
    document.getElementById('edMove').onclick = function () { EDIT.move = !EDIT.move; edBar(); };
    document.getElementById('edRot').onclick = function () { if (canRot) edDo({ t: 'rot', at: [s.x, s.z], r: 1 }); };
    document.getElementById('edDel').onclick = function () { if (!s) return; edDo(s.e ? { t: 'mobdel', k: mobKey(s.e) } : { t: 'del', at: [s.x, s.z] }); EDIT.sel = null; edRing(null); edBar(); };
    document.getElementById('edUndo').onclick = edUndo;
    document.getElementById('edDone').onclick = function () { edToggle(false); };
  }
  function edDo(o) { if (!edApply(o)) { say('Editor', 'That did not work here.', 2200); return false; } EDIT.session.push(o); if (o.t !== 'mob' && o.t !== 'mobdel') edRebuild(); edBar(); return true; }
  function edUndo() { var o = EDIT.session.pop(); if (!o) return; edApply(o, true); if (o.t !== 'mob' && o.t !== 'mobdel') edRebuild(); EDIT.sel = null; EDIT.move = false; edRing(null); edBar(); }
  // the selection ring
  function edRing(s) {
    if (EDIT.ring) { scene.remove(EDIT.ring); EDIT.ring = null; } if (!s) return;
    var m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.54, 40), new THREE.MeshBasicMaterial({ color: 0x3df2e0, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 60; m.position.set(s.e ? s.e.px : s.x, 0.05, s.e ? s.e.pz : s.z); scene.add(m); EDIT.ring = m;
  }
  setInterval(function () { if (EDIT.ring && EDIT.sel && EDIT.sel.e) EDIT.ring.position.set(EDIT.sel.e.px, 0.05, EDIT.sel.e.pz); }, 100);
  // taps on the world select, or (in move mode) place
  window.addEventListener('pointerdown', function (ev) { if (EDIT.on && ev.target === canvas) EDIT.down = { x: ev.clientX, y: ev.clientY }; }, true);
  window.addEventListener('pointerup', function (ev) {
    if (!EDIT.on || ev.target !== canvas || !EDIT.down) return; var d = EDIT.down; EDIT.down = null;
    if (Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) > 14) return; // a drag to look around
    ev.stopImmediatePropagation();
    var r = canvas.getBoundingClientRect(); cbRay.setFromCamera(new THREE.Vector2((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), cam);
    if (!cbRay.ray.intersectPlane(cbPlane, cbHit)) return; edTap(Math.round(cbHit.x), Math.round(cbHit.z), ev.clientX, ev.clientY);
  }, true);
  function edTap(x, z, sx, sy) {
    if (EDIT.move && EDIT.sel) {
      var s = EDIT.sel; if (!isFloorCh(ch(x, z)) || (LEVEL.decor[x + ',' + z] || []).some(function (q) { return q.m.charAt(0) !== '#' || /^#(chair|dchair|mailbox|rail)/.test(q.m); }) || enemyAt(x, z) || (x === P.x && z === P.z)) { say('Editor', 'Pick an empty floor tile.', 2200); return; }
      if (s.e) edDo({ t: 'mob', k: mobKey(s.e), to: [x, z] }); else { edDo({ t: 'swap', a: [s.x, s.z], b: [x, z] }); EDIT.sel = { x: x, z: z }; }
      EDIT.move = false; edRing(EDIT.sel); edBar(); return;
    }
    // a monster or NPC: the one on the tile, or the closest on screen to the tap
    var best = CB.enemies.filter(function (e) { return !e.gone && e.obj.visible && e.x === x && e.z === z; })[0], bd = 40 * 40;
    if (!best) CB.enemies.forEach(function (e) { if (e.gone || !e.obj.visible) return; var p = toScreen(e.px, (e.def.h || 1) * 0.5, e.pz), dx = p.x - sx, dy = p.y - sy; if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = e; } });
    if (best) EDIT.sel = { e: best };
    else if (edEditable(x, z)) EDIT.sel = { x: x, z: z };
    else { EDIT.sel = null; say('Editor', 'Nothing to edit there. Walls and floors stay put.', 2000); }
    EDIT.move = false; edRing(EDIT.sel); edBar();
  }
  // leaving with changes: save a draft, publish, or throw them away
  function edAsk() {
    var old = document.getElementById('edAsk'); if (old) old.remove();
    var el = document.createElement('div'); el.id = 'edAsk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Save your edits');
    var server = NET.mode === 'server', host = /staging/.test(location.hostname) ? 'the test server' : server ? 'the live game' : 'this device';
    el.innerHTML = '<h3>Save your edits?</h3><p>' + EDIT.session.length + ' change' + (EDIT.session.length === 1 ? '' : 's') + ' this session' + (EDIT.draft.length ? ', ' + EDIT.draft.length + ' more already in your draft' : '') + '.</p>' +
      '<button type="button" id="edSave">Save as draft</button><small>Only you see a draft, on this device. Publish when it is ready.</small>' +
      (edCanPublish() ? '<button type="button" id="edPub" class="hot">Publish to ' + host + '</button><small>Everyone on ' + host + ' gets these changes the next time they load the floor.</small>' : '') +
      '<button type="button" id="edToss">Throw these changes away</button><button type="button" id="edKeep">Keep editing</button>';
    document.body.appendChild(el);
    document.getElementById('edSave').onclick = function () { EDIT.draft = EDIT.draft.concat(edClean(EDIT.session)); edSaveLocal('draft', EDIT.draft); EDIT.session = []; edClose(); say('Editor', 'Draft saved on this device. ' + EDIT.draft.length + ' change' + (EDIT.draft.length === 1 ? '' : 's') + ' waiting to publish.', 4000); };
    var pb = document.getElementById('edPub'); if (pb) pb.onclick = function () { pb.textContent = 'Publishing…'; pb.disabled = true; edPublish(EDIT.draft.concat(edClean(EDIT.session))); };
    document.getElementById('edToss').onclick = function () { while (EDIT.session.length) edUndo(); edClose(); say('Editor', 'Changes thrown away.', 2500); };
    document.getElementById('edKeep').onclick = function () { el.remove(); };
  }
  function edPublish(ops) {
    var all = EDIT.pub.concat(ops);
    var done = function () { EDIT.pub = all; edSaveLocal('pub', all); EDIT.draft = []; edSaveLocal('draft', []); EDIT.session = []; edClose(); say('Editor', 'Published. ' + all.length + ' edit' + (all.length === 1 ? '' : 's') + ' on this floor.', 4000); };
    if (NET.mode !== 'server') { done(); return; }
    api('dm/edits', { method: 'PUT', body: { floor: FLOOR, ops: all } }).then(done, function (e) { say('Editor', 'Could not publish: ' + e.message + '. Your changes are still here; try again or save a draft.', 5000); var p = document.getElementById('edPub'); if (p) { p.disabled = false; p.textContent = 'Try publishing again'; } });
  }
  // export and import (copy a floor's edits from the test server to the live game)
  function edExport() { return JSON.stringify({ floor: FLOOR, ops: EDIT.pub.concat(EDIT.draft) }); }
  function edImport(txt) {
    var j; try { j = JSON.parse(txt); } catch (x) { return 'That is not an edits export.'; }
    if (!j || !Array.isArray(j.ops)) return 'That is not an edits export.'; if (j.floor !== FLOOR) return 'That export is for Floor ' + j.floor + '. Go to that floor first.';
    EDIT.draft = edClean(j.ops); edSaveLocal('draft', EDIT.draft); return 'Imported ' + j.ops.length + ' edits as your draft. Reload the page to see them, then publish.';
  }
  (function () { var c = document.createElement('style'); c.textContent =
    '#edBar{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:65;width:min(560px,94vw);background:#0b0c13ee;border:1px solid rgba(61,242,224,.55);border-radius:10px;color:#e8f4f4;font:12px system-ui,sans-serif;padding:8px 10px;box-sizing:border-box}' +
    '#edBar .ed-h{display:flex;gap:8px;align-items:baseline;margin-bottom:6px}#edBar .ed-h b{color:#3df2e0;letter-spacing:.12em}#edBar .ed-h span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#edBar .ed-h em{opacity:.7;font-style:normal}' +
    '#edBar .ed-b{display:flex;gap:6px;flex-wrap:wrap}#edBar button{flex:1;min-height:38px;min-width:64px;border-radius:6px;border:1px solid rgba(255,255,255,.2);background:#1a1d2a;color:#e8f4f4;font-weight:600}#edBar button:disabled{opacity:.35}#edBar button.on{background:#3df2e0;color:#0b0c13}#edBar button.hot{background:#c8962a;color:#160f08;border-color:#c8962a}' +
    '#edAsk{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:75;width:min(380px,92vw);padding:14px 18px;background:linear-gradient(180deg,#F3E9D2,#E6D7B5);border:2px solid #2e2116;border-radius:6px;color:#2e2116;font:14px system-ui,sans-serif}' +
    '#edAsk h3{margin:0 0 6px}#edAsk button{display:block;width:100%;min-height:42px;margin-top:10px;border:2px solid #2e2116;border-radius:4px;background:#fff8e8;font-weight:700;color:#2e2116}#edAsk button.hot{background:#2e2116;color:#F3E9D2}#edAsk small{display:block;opacity:.75;margin-top:3px}';
    document.head.appendChild(c); })();
