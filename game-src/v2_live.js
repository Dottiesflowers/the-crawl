
  // ---------- the shared world (stages 1 and 2): see each other on your floor, and share what happens there ----------
  // One live connection per player per floor (fk = F<floor>:<layout>). Friends show as their own characters, walking where they walk.
  // World events are small keys: d:<monster n> dead, c:<spawn> truce, sp:<set piece> set off, j:<x,z> door jammed,
  // b:<n> body searched, g:<n> body carried off, L:<x,z> spot searched. The server keeps them for the floor and replays them on join.
  // Monster comebacks happen on one machine only (the host: the lowest player id on the floor) and are shared from there.
  var LIVE = { ws: null, fk: null, on: false, you: null, ghosts: {}, retry: 0, lastSent: '', sentAt: 0, queue: [], applying: false, warned: false, st: null };
  function liveFk() { return 'F' + FLOOR + ':' + curLV(); }
  function liveWanted() { return NET.mode === 'server' && !!NET.uid && CB.ready && WORLD.loaded && typeof CHAR !== 'undefined' && !!CHAR; }
  function liveConnect() {
    if (!liveWanted()) return; var fk = liveFk(); if (LIVE.ws && LIVE.fk === fk && LIVE.ws.readyState <= 1) return;
    liveClose(); LIVE.fk = fk;
    var ws; try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/live?fk=' + encodeURIComponent(fk)); } catch (x) { return; }
    LIVE.ws = ws;
    ws.onopen = function () { LIVE.retry = 0; liveSendRaw({ t: 'hello', cname: CHAR.name || NET.user, look: liveDM() ? null : JSON.parse(JSON.stringify(look)), p: livePos() }); };
    ws.onmessage = function (m) { var j; try { j = JSON.parse(m.data); } catch (x) { return; } try { liveOn(j); } catch (x) { console.warn('live', x); } };
    ws.onclose = function () { if (LIVE.ws !== ws) return; LIVE.on = false; LIVE.ws = null; liveClearGhosts(); LIVE.retry = Math.min(30000, (LIVE.retry || 1000) * 2); setTimeout(liveConnect, LIVE.retry); };
    ws.onerror = function () {};
  }
  function liveClose() { if (LIVE.ws) { var w = LIVE.ws; LIVE.ws = null; try { w.close(); } catch (x) {} } LIVE.on = false; liveClearGhosts(); }
  function liveSendRaw(o) { if (LIVE.ws && LIVE.ws.readyState === 1) try { LIVE.ws.send(JSON.stringify(o)); return true; } catch (x) {} return false; }
  function liveDM() { return !!(CHAR && CHAR.isDM) || isDM(); }
  function livePos() { return { x: P.x, z: P.z, px: +P.px.toFixed(2), pz: +P.pz.toFixed(2), ry: +hero.rotation.y.toFixed(2), mv: P.path || (P.moving) ? 1 : 0, cr: crouch ? 1 : 0 }; }
  // a world event happened here: tell everyone (queued until the connection is up)
  function liveEv(k, v) { if (LIVE.applying || NET.mode !== 'server' || liveDM()) return; /* DM-mode testing never changes the shared floor */ LIVE.queue.push([k, v === undefined ? 1 : v]); clearTimeout(liveEv.t); liveEv.t = setTimeout(liveFlush, 60); }
  function liveFlush() { if (!LIVE.queue.length || !LIVE.on) return; if (liveSendRaw({ t: 'ev', evs: LIVE.queue.slice(0, 50) })) LIVE.queue.splice(0, 50); if (LIVE.queue.length) setTimeout(liveFlush, 100); }
  function liveFollower() { if (!LIVE.on) return false; var ids = Object.keys(LIVE.ghosts).map(Number).filter(function (id) { return !LIVE.ghosts[id].dm; }); return ids.some(function (id) { return id < LIVE.you; }); }
  function liveOn(j) {
    if (j.t === 'state') { LIVE.on = true; LIVE.you = j.you; liveApplyState(j.items || []); (j.roster || []).forEach(liveGhostAdd); liveFlush(); if (j.roster && j.roster.length) say('On this floor', j.roster.map(function (q) { return q.cname || q.name; }).join(', ') + (j.roster.length > 1 ? ' are' : ' is') + ' here too.', 3600); return; }
    if (j.t === 'join') { liveGhostAdd(j.p); if (!j.p.look) return; say((j.p.cname || j.p.name) + ' is here', 'They just arrived on this floor.', 2600); return; }
    if (j.t === 'leave') { liveGhostDrop(j.id); return; }
    if (j.t === 'pos') { var g = LIVE.ghosts[j.id]; if (g) { g.p = j; if (!g.seen) { g.seen = true; g.g.position.set(j.px, 0, j.pz); } } return; }
    if (j.t === 'say') { liveBubble(j.id, j.text); try { cbLog(j.name, j.text); } catch (x) {} return; }
    if (j.t === 'act') { var g2 = LIVE.ghosts[j.id]; if (g2 && g2.mixer && /^[A-Za-z_]+$/.test(j.a)) liveGhostShot(g2, j.a); return; }
    if (j.t === 'ev') { LIVE.applying = true; try { (j.evs || []).forEach(function (e) { liveApply(e[0], e[1], j.name); }); } finally { LIVE.applying = false; } worldSave(); return; }
    if (j.t === 'reset') { say('The floor resets', 'The DM has reset this floor. Everything is back.', 4000); setTimeout(function () { location.reload(); }, 1800); }
  }
  // ---- world events ----
  function liveByN(n) { n = +n; for (var i = 0; i < CB.enemies.length; i++) if (CB.enemies[i].n === n) return CB.enemies[i]; return null; }
  function liveApplyState(items) {
    LIVE.applying = true; var dead = {};
    try {
      items.forEach(function (e) { if (/^d:/.test(e[0])) dead[e[0].slice(2)] = 1; });
      // the shared record decides who is dead: bring back anything this player killed alone before the floor went shared
      CB.enemies.forEach(function (e) { if (e.npc || !e.dead || dead[e.n] || inBag(e) || e.gone) return; if (e.def.base === 'rat' && !e.boss && e.diedAt && Date.now() - e.diedAt < ratBack(e)) return; liveRevive(e); });
      items.forEach(function (e) { liveApply(e[0], e[1], null, true); });
    } finally { LIVE.applying = false; }
    worldSave(); try { refreshFog(); } catch (x) {}
  }
  function liveApply(k, v, who, quiet) {
    var i = k.indexOf(':'), kind = k.slice(0, i), id = k.slice(i + 1);
    if (kind === 'd') { var e = liveByN(id); if (!e) return; if (v === null) { if (e.dead && !inBag(e)) liveRevive(e); return; } if (!e.dead) liveKill(e, who, quiet); return; }
    if (kind === 'g') { var e2 = liveByN(id); if (e2 && v) { e2.dead = true; e2.eaten = true; e2.looted = true; e2.counted = true; e2.hp = 0; e2.obj.visible = false; if (e2.bar) e2.bar.style.display = 'none'; } return; }
    if (kind === 'b') { var e3 = liveByN(id); if (e3 && v && !e3.lootStore) { e3.looted = true; e3.lootStore = { title: 'Searching ' + e3.name, items: [], gold: 0, note: (who ? who + ' already' : 'Someone already') + ' went through this one.' }; } return; }
    if (kind === 'c') { CB.enemies.forEach(function (e) { if (!e.dead && spawnKey(e) === id) e.calm = !!v; }); return; }
    if (kind === 'sp') { var sp = null; Object.keys(LEVEL.setp || {}).some(function (kk) { if (LEVEL.setp[kk].id === id) { sp = LEVEL.setp[kk]; return true; } }); if (!sp || !v) return;
      CHAR.setp = CHAR.setp || {}; if (CHAR.setp[spKey(sp)]) return; CHAR.setp[spKey(sp)] = Date.now(); saveChar(CHAR); try { spInit(); rebuildChunks(); } catch (x) {}
      if (!quiet) say((who || 'Someone') + ' · ' + sp.name, 'Somewhere on the floor, ' + (who || 'someone') + ' set off the ' + sp.name.toLowerCase() + '.', 3200); return; }
    if (kind === 'j') { var q = id.split(','); CHAR.jam = CHAR.jam || {}; var kk = jamKey(id); if (v) CHAR.jam[kk] = 1; else delete CHAR.jam[kk]; try { jamMesh(+q[0], +q[1], !!v); refreshFog(); } catch (x) {} return; }
    if (kind === 'L') { var key = 'loot' + id; if (v && !lootSpot.done[key]) lootSpot.done[key] = { title: 'You found', items: [], gold: 0, note: (who ? who + ' already' : 'Someone already') + ' cleared this out.' }; return; }
  }
  function liveKill(e, who, quiet) {
    var mine = CB.on && CB.order.indexOf(e) >= 0;
    if (mine) { e.hp = 0; cbKill(e); if (!CB.enemies.some(function (q) { return !q.dead && !q.calm && CB.order.indexOf(q) >= 0; })) setTimeout(function () { if (CB.on) cbEnd(true); }, 600); return; }
    e.dead = true; e.counted = true; e.hp = 0; e.grappled = false; if (e.bar) e.bar.style.display = 'none';
    if (!quiet && e.obj.visible && cheb(e.x, e.z, P.x, P.z) < 16) cbPlay(e, 'Death01', true); else e.obj.visible = false;
  }
  function liveRevive(e) {
    e.dead = false; e.eaten = false; e.claimed = false; e.counted = false; e.fought = false; e.looted = false; e.lootStore = null; e.calm = !!e.def.tame; e.hp = e.max = e.def.hp; e.diedAt = 0; e.path = null;
    e.x = e.sx; e.z = e.sz; e.px = e.sx; e.pz = e.sz; e.obj.position.set(e.sx, 0, e.sz); e.obj.visible = true; if (e.body) e.body.rotation.z = 0; if (e.mixer && e.mixer.stopAllAction) e.mixer.stopAllAction(); e.cur = ''; try { cbPlay(e, 'Idle_Loop'); } catch (x) {}
  }
  // ---- friends on the floor ----
  function liveGhostModel(lk) {
    if (!KIT || !KIT.ready || !lk) return null; var save = JSON.parse(JSON.stringify(look)), c = null;
    try {
      Object.keys(lk).forEach(function (k) { if (look[k] && Array.isArray(lk[k])) look[k] = lk[k].slice(); }); look.model = [0, look.model ? look.model[1] : 0];
      kitApply(); (KIT.attached || []).forEach(function (o) { if (o.parent) o.parent.remove(o); });
      c = THREE.SkeletonUtils.clone(KIT.root);
      c.traverse(function (o) { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(function (m) { return m.clone(); }) : o.material.clone(); if (o.isMesh && o.geometry && o.geometry.attributes.position && (o.isSkinnedMesh || o.name === 'Head')) o.geometry = o.geometry.clone(); if (o.isMesh) o.frustumCulled = false; });
    } catch (x) { console.warn('ghost model', x); c = null; }
    Object.keys(save).forEach(function (k) { look[k] = save[k]; }); try { buildHero(); } catch (x) {}
    return c;
  }
  function liveGhostAdd(q) {
    if (!q || q.id === LIVE.you || LIVE.ghosts[q.id]) { if (q && LIVE.ghosts[q.id] && q.p) LIVE.ghosts[q.id].p = q.p; return; }
    var gh = { id: q.id, name: q.cname || q.name, dm: !q.look, p: q.p, g: new THREE.Group(), seen: !!q.p };
    LIVE.ghosts[q.id] = gh; if (gh.dm) return; // the DM watches unseen
    var inner = new THREE.Group(), m = liveGhostModel(q.look);
    if (m) { inner.add(m); var h = (q.look.height || [1])[0]; inner.scale.set(1, [0.92, 1, 1.08][h] || 1, 1); gh.mixer = new THREE.AnimationMixer(m); gh.acts = {}; liveGhostPlay(gh, 'Idle_Loop'); }
    else { var b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 1.5, 10), new THREE.MeshLambertMaterial({ color: 0x6aa8ff })); b.position.y = 0.75; inner.add(b); }
    gh.g.add(inner); scene.add(gh.g); if (q.p) gh.g.position.set(q.p.px, 0, q.p.pz);
    var tag = document.createElement('div'); tag.className = 'liveTag'; tag.textContent = gh.name; tag.style.cssText = 'position:absolute;transform:translate(-50%,-100%);color:#bfe3ff;font:600 12px system-ui,sans-serif;text-shadow:0 1px 3px #000,0 0 2px #000;pointer-events:none;white-space:nowrap;z-index:5;display:none';
    document.body.appendChild(tag); gh.tag = tag;
  }
  function liveGhostDrop(id) { var g = LIVE.ghosts[id]; if (!g) return; if (g.g.parent) scene.remove(g.g); if (g.tag) g.tag.remove(); if (g.bub) g.bub.remove(); delete LIVE.ghosts[id]; }
  function liveClearGhosts() { Object.keys(LIVE.ghosts).forEach(liveGhostDrop); }
  function liveGhostPlay(g, name) { if (!g.mixer || g.cur === name || !KIT.clips[name]) return; var a = g.acts[name] || (g.acts[name] = g.mixer.clipAction(KIT.clips[name])); a.reset().fadeIn(0.2).play(); if (g.curA) g.curA.fadeOut(0.2); g.curA = a; g.cur = name; }
  function liveGhostShot(g, name) { if (!KIT.clips[name]) return; var a = g.mixer.clipAction(KIT.clips[name]); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.play(); if (g.curA) g.curA.fadeOut(0.1); g.cur = name; g.curA = a; g.shotT = KIT.clips[name].duration; }
  function liveBubble(id, text) { var g = LIVE.ghosts[id]; if (!g || g.dm) return; if (!g.bub) { g.bub = document.createElement('div'); g.bub.style.cssText = 'position:absolute;transform:translate(-50%,-100%);max-width:200px;background:rgba(20,24,32,.88);color:#eef;border:1px solid #6aa8ff;border-radius:8px;padding:4px 8px;font:13px system-ui,sans-serif;pointer-events:none;z-index:6;display:none'; document.body.appendChild(g.bub); }
    g.bub.textContent = text; g.bubT = performance.now() + 6000; }
  function liveSay(text) { text = String(text || '').trim().slice(0, 200); if (!text || !LIVE.on) return false; liveSendRaw({ t: 'say', text: text }); try { cbLog(CHAR.name || 'You', text); } catch (x) {} return true; }
  function liveAct(a) { if (LIVE.on && !liveDM()) liveSendRaw({ t: 'act', a: a }); }
  // ---- every frame: move the friends, and now and then tell the floor where you are ----
  var liveClock = performance.now();
  (function liveTick() {
    requestAnimationFrame(liveTick); var now = performance.now(), dt = Math.min(0.1, (now - liveClock) / 1000); liveClock = now;
    Object.keys(LIVE.ghosts).forEach(function (id) { var g = LIVE.ghosts[id]; if (g.dm || !g.p) return;
      var dx = g.p.px - g.g.position.x, dz = g.p.pz - g.g.position.z, dist = Math.hypot(dx, dz), sp = Math.min(1, dt * 8);
      if (dist > 6) g.g.position.set(g.p.px, 0, g.p.pz); else { g.g.position.x += dx * sp; g.g.position.z += dz * sp; }
      var dr = g.p.ry - g.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); g.g.rotation.y += dr * Math.min(1, dt * 10);
      g.vis = visNow[g.p.x + ',' + g.p.z] !== undefined || liveDM(); g.g.visible = g.vis;
      if (g.mixer) { if (g.shotT > 0) g.shotT -= dt; else liveGhostPlay(g, g.p.cr ? (dist > 0.05 || g.p.mv ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop') : dist > 0.05 || g.p.mv ? 'Walk_Loop' : 'Idle_Loop'); if (g.vis) g.mixer.update(dt); }
      var s = g.vis ? toScreen(g.g.position.x, 1.95, g.g.position.z) : null;
      if (g.tag) { if (s) { g.tag.style.display = 'block'; g.tag.style.left = s.x + 'px'; g.tag.style.top = s.y + 'px'; } else g.tag.style.display = 'none'; }
      if (g.bub) { if (s && g.bubT > now) { g.bub.style.display = 'block'; g.bub.style.left = s.x + 'px'; g.bub.style.top = (s.y - 16) + 'px'; } else g.bub.style.display = 'none'; } });
    if (!LIVE.on || liveDM() || now - LIVE.sentAt < 120) return; var p = livePos(), sig = JSON.stringify(p);
    if (sig !== LIVE.lastSent || now - LIVE.sentAt > 5000) { LIVE.lastSent = sig; LIVE.sentAt = now; liveSendRaw(Object.assign({ t: 'pos' }, p)); }
  })();
  // connect when the floor is ready, reconnect when the floor or its layout changes, keep the line warm
  setInterval(function () { if (liveWanted()) { if (!LIVE.ws || LIVE.fk !== liveFk()) liveConnect(); else liveSendRaw({ t: 'ping' }); } else if (LIVE.ws && !(typeof CHAR !== 'undefined' && CHAR)) liveClose(); }, 4000);
