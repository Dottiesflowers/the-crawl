
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
    ws.onopen = function () { LIVE.retry = 0; LIVE.lookKey = liveLookKey(); liveSendRaw({ t: 'hello', cname: CHAR.name || NET.user, look: liveDM() ? null : liveLookOut(), p: livePos() }); };
    ws.onmessage = function (m) { var j; try { j = JSON.parse(m.data); } catch (x) { return; } try { liveOn(j); } catch (x) { console.warn('live', x); } };
    ws.onclose = function () { if (LIVE.ws !== ws) return; LIVE.on = false; LIVE.ws = null; liveClearGhosts(); LIVE.retry = Math.min(30000, (LIVE.retry || 1000) * 2); setTimeout(liveConnect, LIVE.retry); };
    ws.onerror = function () {};
  }
  function liveClose() { if (LIVE.ws) { var w = LIVE.ws; LIVE.ws = null; try { w.close(); } catch (x) {} } LIVE.on = false; liveClearGhosts(); }
  function liveSendRaw(o) { if (LIVE.ws && LIVE.ws.readyState === 1) try { LIVE.ws.send(JSON.stringify(o)); return true; } catch (x) {} return false; }
  function liveDM() { return !!(CHAR && CHAR.isDM) || isDM(); }
  function livePos() { return { x: P.x, z: P.z, px: +P.px.toFixed(2), pz: +P.pz.toFixed(2), ry: +hero.rotation.y.toFixed(2), mv: P.path || (P.moving) ? 1 : 0, cr: crouch ? 1 : 0, dn: PC.down ? 1 : 0, hp: PC.hp, mx: PC.max, ac: (function () { try { return pcAC().ac; } catch (x) { return 0; } })() }; }
  // a world event happened here: tell everyone (queued until the connection is up)
  function liveEv(k, v) { if (LIVE.applying || NET.mode !== 'server' || liveDM()) return; /* DM-mode testing never changes the shared floor */ LIVE.queue.push([k, v === undefined ? 1 : v]); clearTimeout(liveEv.t); liveEv.t = setTimeout(liveFlush, 60); }
  function liveFlush() { if (!LIVE.queue.length || !LIVE.on) return; if (liveSendRaw({ t: 'ev', evs: LIVE.queue.slice(0, 50) })) LIVE.queue.splice(0, 50); if (LIVE.queue.length) setTimeout(liveFlush, 100); }
  function liveFollower() { if (!LIVE.on) return false; var ids = Object.keys(LIVE.ghosts).map(Number).filter(function (id) { return !LIVE.ghosts[id].dm; }); return ids.some(function (id) { return id < LIVE.you; }); }
  function liveOn(j) {
    if (j.t === 'state') { LIVE.on = true; LIVE.you = j.you; liveApplyState(j.items || []); (j.roster || []).forEach(liveGhostAdd); liveFlush(); if (j.roster && j.roster.length) say('On this floor', j.roster.map(function (q) { return q.cname || q.name; }).join(', ') + (j.roster.length > 1 ? ' are' : ' is') + ' here too.', 3600); return; }
    if (j.t === 'look') { var og = LIVE.ghosts[j.id]; if (!og) return; var keep = { id: j.id, name: og.name, cname: j.cname || og.name, p: og.p, look: j.look }; liveGhostDrop(j.id); liveGhostAdd(keep); return; }
    if (j.t === 'join') { liveGhostAdd(j.p); if (!j.p.look) return; say((j.p.cname || j.p.name) + ' is here', 'They just arrived on this floor.', 2600); return; }
    if (j.t === 'leave') { liveGhostDrop(j.id); if (LF.on && LF.amHost) lfOn({ k: 'leave', id: LF.id, from: j.id }); return; }
    if (j.t === 'pos') { var g = LIVE.ghosts[j.id]; if (g) { g.p = j; if (!g.seen) { g.seen = true; g.g.position.set(j.px, 0, j.pz); } } return; }
    if (j.t === 'say') { liveBubble(j.id, j.text); try { cbLog(j.name, j.text); } catch (x) {} return; }
    if (j.t === 'act') { var g2 = LIVE.ghosts[j.id]; if (g2 && g2.mixer && /^[A-Za-z_]+$/.test(j.a)) liveGhostShot(g2, j.a); return; }
    if (j.t === 'ev') { LIVE.applying = true; try { (j.evs || []).forEach(function (e) { liveApply(e[0], e[1], j.name); }); } finally { LIVE.applying = false; } worldSave(); return; }
    if (j.t === 'stash') { STASH.t = 0; if (UI.bag && UI.cat === 'shared') stashLoad(); return; }
    if (j.t === 'cb') { try { lfOn(j); } catch (x) { console.warn('live fight', x); } return; }
    if (j.t === 'reset') { var all = j.fk === '*'; if (all) try { Object.keys(localStorage).forEach(function (k) { if (/^crawl-(char|world|fog|talk|dmchar|look)/.test(k)) localStorage.removeItem(k); }); } catch (x) {}
      say(all ? 'Starting over' : 'The floor resets', all ? 'The DM has started the campaign over. Time to make a new character.' : 'The DM has reset this floor. Everything is back.', 4000); setTimeout(function () { location.href = location.pathname; }, 1800); }
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
    e.counted = true; liveCorpse(e, quiet || !e.obj.visible || cheb(e.x, e.z, P.x, P.z) >= 16);
  }
  function liveCorpse(e, still) { // killed on someone else's screen: leave a body on mine too (not a vanishing act, not a monster still standing)
    e.dead = true; e.hp = 0; e.grappled = false; e.path = null; e.fought = false; if (e.bar) e.bar.style.display = 'none'; e.obj.visible = true;
    if (e.mixer && e.mixer.stopAllAction) e.mixer.stopAllAction(); e.cur = ''; cbPlay(e, 'Death01', true);
    if (still) { if (e.wrap) e.pt = 9; if (e.act && e.clips && e.clips.Death01) e.act.time = e.clips.Death01.duration; }
    if (!e.diedAt) e.diedAt = Date.now();
  }
  function liveRevive(e) {
    e.dead = false; e.eaten = false; e.claimed = false; e.counted = false; e.fought = false; e.looted = false; e.lootStore = null; e.calm = !!e.def.tame; e.hp = e.max = e.def.hp; e.diedAt = 0; e.path = null;
    e.x = e.sx; e.z = e.sz; e.px = e.sx; e.pz = e.sz; e.obj.position.set(e.sx, 0, e.sz); e.obj.visible = true; if (e.body) e.body.rotation.z = 0; if (e.mixer && e.mixer.stopAllAction) e.mixer.stopAllAction(); e.cur = ''; try { cbPlay(e, 'Idle_Loop'); } catch (x) {}
  }
  // ---- friends on the floor ----
  // clothes and looks change after you join (new character, getting dressed, re-dressing): send the new look whenever it changes
  function liveWieldOf() { if (!CHAR || !CHAR.wield) return null; var it = (CHAR.gear || []).filter(function (g) { return g.name === CHAR.wield; })[0]; if (!it) return null; var o = {}; ['name', 'cat', 'dmg', 'model', 'len', 'skin', 'bow', 'proc', 'icon', 'twoHand', 'tags', 'desc'].forEach(function (k) { if (it[k] !== undefined) o[k] = it[k]; }); return o; }
  function liveLookOut() { var o = JSON.parse(JSON.stringify(look)); o._wield = liveWieldOf(); return o; } // what friends need to draw you: your look plus what is in your hand
  function liveLookKey() { return JSON.stringify(liveLookOut()) + '|' + ((CHAR && CHAR.name) || ''); }
  setInterval(function () {
    if (!LIVE.on || !LIVE.ws || LIVE.ws.readyState !== 1 || liveDM() || !LIVE.lookKey) return; var k = liveLookKey(); if (k === LIVE.lookKey) return;
    LIVE.lookKey = k; liveSendRaw({ t: 'look', look: liveLookOut(), cname: (CHAR && CHAR.name) || '' });
  }, 1500);
  function liveGhostModel(lk) {
    if (!KIT || !KIT.ready || !lk) return null; var save = JSON.parse(JSON.stringify(look)), c = null, sw = CHAR ? { wield: CHAR.wield, gear: CHAR.gear } : null;
    try {
      Object.keys(lk).forEach(function (k) { if (look[k] && Array.isArray(lk[k])) look[k] = lk[k].slice(); }); look.model = [0, look.model ? look.model[1] : 0];
      if (CHAR) { CHAR.wield = lk._wield ? lk._wield.name : null; CHAR.gear = lk._wield ? [JSON.parse(JSON.stringify(lk._wield))] : []; } // their weapon in the hand, just for the copy
      buildHero(); (KIT.attached || []).forEach(function (o) { try { o.updateMatrix(); } catch (x) {} });
      c = THREE.SkeletonUtils.clone(KIT.root);
      c.traverse(function (o) { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(function (m) { return m.clone(); }) : o.material.clone(); if (o.isMesh && o.geometry && o.geometry.attributes.position && (o.isSkinnedMesh || o.name === 'Head')) o.geometry = o.geometry.clone(); if (o.isMesh) o.frustumCulled = false; });
    } catch (x) { console.warn('ghost model', x); c = null; }
    if (CHAR && sw) { CHAR.wield = sw.wield; CHAR.gear = sw.gear; }
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
    var tag = document.createElement('div'); tag.className = 'liveTag'; tag.textContent = gh.name; tag.style.cssText = 'position:absolute;transform:translate(-50%,-100%);color:#bfe3ff;font:600 12px system-ui,sans-serif;text-shadow:0 1px 3px #000,0 0 2px #000;pointer-events:auto;cursor:pointer;white-space:nowrap;z-index:5;display:none';
    tag.title = 'Examine ' + gh.name; tag.addEventListener('click', function (ev) { ev.stopPropagation(); liveExamine(q.id); });
    document.body.appendChild(tag); gh.tag = tag;
  }
  // Examine a friend: tap their name tag to see their sheet
  function liveExamine(uid) {
    var g = LIVE.ghosts[uid]; var el = document.getElementById('friendSheet');
    if (!el) { el = document.createElement('div'); el.id = 'friendSheet'; el.setAttribute('role', 'dialog'); el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;width:min(420px,92vw);max-height:84vh;overflow:auto;padding:14px 16px;border-radius:12px;background:rgba(14,10,12,.95);border:1px solid #8a6a4a;color:#efe4d4;font-size:14px;line-height:1.35'; document.body.appendChild(el); }
    el.innerHTML = '<p>Looking them over…</p>'; el.style.display = 'block';
    api('sheet?id=' + uid).then(function (j) {
      var c = j.sheet, p = (g && g.p) || {}, mods = function (v) { var m = Math.floor(((v || 10) - 10) / 2); return (m >= 0 ? '+' : '') + m; };
      var sk = Object.keys(c.skills || {}).filter(function (k) { return c.skills[k] > 0; }).sort(function (a, b) { return c.skills[b] - c.skills[a]; });
      var worn = c.gear.filter(function (x) { return x.worn; }), rest = c.gear.filter(function (x) { return !x.worn; });
      el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">' + esc(c.name) + ' <small style="opacity:.7">(' + esc(c.username) + ')</small></h3><button type="button" class="ccBtn" id="fsX">Close</button></div>' +
        '<p>Level ' + c.level + ' · ' + c.xp + ' XP' + (p.mx ? ' · HP ' + Math.max(0, p.hp) + ' / ' + p.mx : '') + (p.ac ? ' · AC ' + p.ac : '') + (p.dn ? ' · <b style="color:#ff6a80">down</b>' : '') + (c.dead ? ' · <b style="color:#ff6a80">dead</b>' : '') + '</p>' +
        '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;text-align:center;margin:6px 0">' + ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(function (k) { return '<div style="border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:3px"><small>' + k + '</small><br><b>' + (c.stats[k] || 10) + '</b><br><small>' + mods(c.stats[k]) + '</small></div>'; }).join('') + '</div>' +
        (c.trait ? '<p><b>Trait:</b> ' + esc(c.trait) + (c.traitDesc ? ' <small>· ' + esc(c.traitDesc) + '</small>' : '') + '</p>' : '') +
        (c.flaw ? '<p><b>Flaw:</b> ' + esc(c.flaw) + (c.flawDesc ? ' <small>· ' + esc(c.flawDesc) + '</small>' : '') + '</p>' : '') +
        (sk.length ? '<p><b>Skills:</b> ' + sk.map(function (k) { return esc(k) + ' ' + c.skills[k]; }).join(', ') + '</p>' : '') +
        '<p><b>Holding:</b> ' + esc(c.wield || 'nothing') + (c.back ? ' · on their back: ' + esc(c.back) : '') + '</p>' +
        (worn.length ? '<p><b>Wearing:</b> ' + worn.map(function (x) { return esc(x.name); }).join(', ') + '</p>' : '') +
        (rest.length ? '<p><b>Bag:</b> ' + rest.map(function (x) { return esc(x.name) + (x.qty > 1 ? ' ×' + x.qty : '') + (x.dmg ? ' <small>(' + esc(x.dmg) + ')</small>' : ''); }).join(', ') + '</p>' : '') +
        '<p><small>' + (c.gold || 0) + ' gold' + (c.kit ? ' · ' + esc(c.kit) + '\'s kit' : '') + '</small></p>';
      document.getElementById('fsX').onclick = function () { el.style.display = 'none'; };
    }, function (e) { el.innerHTML = '<p>' + esc(e.message || 'Could not load their sheet.') + '</p><button type="button" class="ccBtn" onclick="this.parentNode.style.display=\'none\'">Close</button>'; });
  }
  function liveGhostDrop(id) { var g = LIVE.ghosts[id]; if (!g) return; if (g.g.parent) scene.remove(g.g); if (g.tag) g.tag.remove(); if (g.bub) g.bub.remove(); delete LIVE.ghosts[id]; }
  function liveClearGhosts() { Object.keys(LIVE.ghosts).forEach(liveGhostDrop); }
  function liveGhostPlay(g, name) { if (!g.mixer || g.cur === name || !KIT.clips[name]) return; var a = g.acts[name] || (g.acts[name] = g.mixer.clipAction(KIT.clips[name])); if (name === 'Death01') { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; } a.reset().fadeIn(0.2).play(); if (g.curA) g.curA.fadeOut(0.2); g.curA = a; g.cur = name; }
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
      if (g.mixer) { if (g.shotT > 0) g.shotT -= dt; else liveGhostPlay(g, g.p.dn ? 'Death01' : g.p.cr ? (dist > 0.05 || g.p.mv ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop') : dist > 0.05 || g.p.mv ? 'Walk_Loop' : 'Idle_Loop'); if (g.vis) g.mixer.update(dt); }
      var s = g.vis ? toScreen(g.g.position.x, 1.95, g.g.position.z) : null;
      if (g.tag) { if (s) { g.tag.style.display = 'block'; g.tag.style.left = s.x + 'px'; g.tag.style.top = s.y + 'px'; } else g.tag.style.display = 'none'; }
      if (g.bub) { if (s && g.bubT > now) { g.bub.style.display = 'block'; g.bub.style.left = s.x + 'px'; g.bub.style.top = (s.y - 16) + 'px'; } else g.bub.style.display = 'none'; } });
    if (!LIVE.on || liveDM() || now - LIVE.sentAt < 120) return; var p = livePos(), sig = JSON.stringify(p);
    if (sig !== LIVE.lastSent || now - LIVE.sentAt > 5000) { LIVE.lastSent = sig; LIVE.sentAt = now; liveSendRaw(Object.assign({ t: 'pos' }, p)); }
  })();
  // connect when the floor is ready, reconnect when the floor or its layout changes, keep the line warm
  setInterval(function () { if (liveWanted()) { if (!LIVE.ws || LIVE.fk !== liveFk()) liveConnect(); else liveSendRaw({ t: 'ping' }); } else if (LIVE.ws && !(typeof CHAR !== 'undefined' && CHAR)) liveClose(); }, 4000);

  // ---------- shared fights (stage 3): one turn order for everyone nearby ----------
  // Whoever starts a fight hosts it: their machine runs the monsters. Friends within reach roll initiative and join the same
  // order; on your turn your own device runs your moves and attacks and sends the result. Monsters go for the nearest player.
  // In CB.order a friend is a stand-in object { remote: true, uid, name, init, hp, max }.
  var LF = { on: false, id: null, amHost: false, host: null, fights: {}, lastSnap: '', waitT: null, ps: {} };
  var LF_REACH = 6; // how close you must be to a friend's fight to be pulled in (was 12)
  function lfSend(k, o) { o = o || {}; o.t = 'cb'; o.k = k; o.id = o.id || LF.id; return liveSendRaw(o); }
  function lfRemote(uid) { for (var i = 0; i < CB.order.length; i++) { var c = CB.order[i]; if (c && c.remote && c.uid === uid) return c; } return null; }
  function lfMarker(uid, name, init) { var m = { remote: true, uid: uid, name: name || 'Crawler', init: init, hp: 1, max: 1, dead: false, calm: false, kind: '__player', def: { h: 1.8, init: 0 }, ac: 12, down: false };
    Object.defineProperty(m, 'x', { get: function () { var g = LIVE.ghosts[uid]; return g && g.p ? g.p.x : P.x; } }); Object.defineProperty(m, 'z', { get: function () { var g = LIVE.ghosts[uid]; return g && g.p ? g.p.z : P.z; } });
    Object.defineProperty(m, 'px', { get: function () { var g = LIVE.ghosts[uid]; return g ? g.g.position.x : P.px; } }); Object.defineProperty(m, 'pz', { get: function () { var g = LIVE.ghosts[uid]; return g ? g.g.position.z : P.pz; } });
    return m; }
  function lfOrderIds() { return CB.order.map(function (c) { return c === 'pc' ? ['u', LIVE.you, PC.init, CHAR.name || NET.user] : c.remote ? ['u', c.uid, c.init, c.name] : ['e', c.n, c.init]; }); }
  function lfFlags(e) { var f = {}; ['prone', 'stunned', 'blind', 'webbed', 'grappled', 'pinned', 'calm', 'surprised', 'doused', 'rally', 'furious', 'fleeing'].forEach(function (k) { if (e[k]) f[k] = e[k]; });
    ['burning', 'poisoned', 'weak'].forEach(function (k) { if (e[k] && e[k].turns > 0) f[k] = e[k]; }); return f; }
  function lfSnap() { return CB.order.filter(function (c) { return c !== 'pc' && !c.remote; }).map(function (e) { return [e.n, e.hp, e.max, e.x, e.z, e.dead ? 1 : 0, lfFlags(e)]; }); }
  function lfMe() { return [PC.hp, PC.max, PC.down ? 1 : 0, pcAC().ac, CB.dodge ? 1 : 0, PC.hidden ? 1 : 0, PC.prone ? 1 : 0, PC.webbed ? 1 : 0]; }
  function lfApplySnap(sn) {
    if (!sn) return; LIVE.applying = true;
    try { sn.forEach(function (q) { var e = liveByN(q[0]); if (!e) return;
      if (q[5] && !e.dead) { e.hp = 0; if (CB.order.indexOf(e) >= 0) cbKill(e); else liveCorpse(e, cheb(e.x, e.z, P.x, P.z) >= 16); return; }
      if (q[1] < e.hp && !e.dead) floater(e.px, (e.def.h || 1) + 0.3, e.pz, '-' + (e.hp - q[1]), 'dmg');
      e.hp = q[1]; e.max = q[2];
      if ((e.x !== q[3] || e.z !== q[4]) && !e.path) { if (cheb(e.x, e.z, q[3], q[4]) <= 2) { e.path = [[q[3], q[4]]]; cbPlay(e, 'Walk_Loop'); e.afterWalk = function () { cbPlay(e, 'Idle_Loop'); }; } else { e.x = q[3]; e.z = q[4]; e.px = q[3]; e.pz = q[4]; e.obj.position.set(q[3], 0, q[4]); } }
      ['prone', 'stunned', 'blind', 'webbed', 'grappled', 'pinned', 'calm', 'surprised', 'doused', 'rally', 'furious', 'fleeing', 'burning', 'poisoned', 'weak'].forEach(function (k) { e[k] = q[6][k] || (k === 'burning' || k === 'poisoned' || k === 'weak' ? null : 0); });
      if (e.calm) { var at = CB.order.indexOf(e); if (at >= 0 && at !== CB.idx) { CB.order.splice(at, 1); if (at < CB.idx) CB.idx--; } } }); }
    finally { LIVE.applying = false; } cbRingsUpdate(); cbHUD(); }
  function lfApplyPs(ps) { if (!ps) return; Object.keys(ps).forEach(function (u) { var m = lfRemote(+u); if (m) { var v = ps[u]; m.hp = v[0]; m.max = v[1]; m.down = !!v[2]; m.ac = v[3]; m.dodge = !!v[4]; m.hidden = !!v[5]; m.prone = !!v[6]; m.webbed = !!v[7]; } }); }
  function lfAllPs() { var o = {}; o[LIVE.you] = lfMe(); CB.order.forEach(function (c) { if (c.remote) o[c.uid] = [c.hp, c.max, c.down ? 1 : 0, c.ac, c.dodge ? 1 : 0, c.hidden ? 1 : 0, c.prone ? 1 : 0, c.webbed ? 1 : 0]; }); return o; }
  // ---- playing together: bigger monsters, and nobody dies while a friend can still reach them ----
  function liveFriends() { return !!(LIVE.on && NET.mode === 'server' && !liveDM() && Object.keys(LIVE.ghosts).some(function (id) { return !LIVE.ghosts[id].dm; })); }
  var PARTY_HP = 0.2; // monsters in a fight with two or more of you have 20% more HP
  function lfBoost() { if (!CB.on || !CB.order.some(function (c) { return c && c.remote; })) return;
    CB.order.forEach(function (e) { if (!e || e === 'pc' || e.remote || e.dead || e.partyAdd) return; var add = Math.max(1, Math.round(e.max * PARTY_HP)); e.partyAdd = add; e.max += add; e.hp += add; }); }
  function lfUnboost() { CB.enemies.forEach(function (e) { if (!e.partyAdd) return; e.max -= e.partyAdd; e.hp = Math.min(e.hp, e.max); e.partyAdd = 0; }); }
  function lfAllDown() { return PC.down && !CB.order.some(function (c) { return c && c.remote && !c.down && !c.dead && c.hp > 0; }); }
  function liveAllDown() { // nobody left standing: the monsters wander off and you lie there until a friend gets to you
    lfUnboost(); cbEnd(false); CB.enemies.forEach(function (e) { if (!e.dead) { e.path = null; e.fought = false; cbPlay(e, 'Idle_Loop'); } });
    say('Everyone is down', 'The monsters lose interest. Lie still until a friend helps you up, or the DM revives you.', 6000); refreshFog(); cbHUD(); worldSave();
  }
  function helpedUp(who) {
    if (!PC.down || (CHAR && CHAR.dead)) return;
    PC.down = false; PC.helpWait = false; PC.hp = Math.max(1, PC.hp); PC.saves = { s: 0, f: 0 }; if (KIT) KIT.shot = null; if (CHAR) { CHAR.downed = null; saveChar(CHAR); }
    var el = document.getElementById('downBox'); if (el) el.style.display = 'none';
    say('Back on your feet', who + ' hauls you up. 1 HP.', 3600); cbHUD(); cbShowMoves();
    if (LF.on && !LF.amHost) lfSend('snap', { to: LF.host, me: lfMe() });
  }
  function helpTarget() { // a downed friend right next to you
    if (!LIVE.on || PC.down || (CHAR && CHAR.dead)) return null; var best = null;
    Object.keys(LIVE.ghosts).forEach(function (id) { var g = LIVE.ghosts[id]; if (!g.p || !g.p.dn || g.dm) return; if (cheb(g.p.x, g.p.z, P.x, P.z) <= 1) best = { uid: +id, name: g.cname || g.name || 'your friend' }; });
    return best;
  }
  function helpUp() {
    var t = helpTarget(); if (!t) return;
    if (CB.on) { if (!cbMyTurn() || CB.busy) { say('Not your turn', 'Help them up on your turn. It takes your action.', 2400); return; } if (!CB.res.action) { say('No action left', 'Helping a friend up takes your action. Next turn.', 2400); return; } CB.res.action = 0; cbShowMoves(); cbHUD(); }
    liveSendRaw({ t: 'cb', k: 'help', id: LF.id || 'help', to: t.uid, name: CHAR && CHAR.name || NET.user });
    var m = lfRemote(t.uid); if (m) { m.down = false; m.hp = Math.max(1, m.hp); }
    kitOneShot('PickUp_Table'); say('Help up', 'You haul ' + t.name + ' back onto their feet. 1 HP.', 3000); cbHUD();
  }
  function downShow() { // lying there, out of the fight, waiting
    var el = document.getElementById('downBox');
    if (!el) { el = document.createElement('div'); el.id = 'downBox'; el.style.cssText = 'position:fixed;left:50%;top:30%;transform:translate(-50%,-50%);z-index:25;max-width:340px;padding:12px 16px;border-radius:12px;background:rgba(10,4,8,.82);border:1px solid #ff3a5a;color:#f4dfe4;text-align:center;font-size:14px;pointer-events:none'; document.body.appendChild(el); }
    el.innerHTML = '<b>You are down</b><br>You will not die while friends are on this floor. One of them has to stand next to you and use Help up.';
    el.style.display = 'block';
  }
  setInterval(function () {
    var b = document.getElementById('aHelp'); if (b) { var t = helpTarget(); b.style.display = t ? '' : 'none'; if (t) b.textContent = 'Help up ' + String(t.name).split(' ')[0]; }
    var el = document.getElementById('downBox'); if (el && el.style.display === 'block' && !PC.down) el.style.display = 'none';
    if (PC.down && PC.helpWait && !CB.on && !(CHAR && CHAR.dead)) downShow();
    // if every friend has left the floor for three minutes, you come to on your own rather than lie there forever
    if (PC.down && PC.helpWait && !CB.on) { if (liveFriends()) helpUp.alone = 0; else if (!helpUp.alone) helpUp.alone = Date.now(); else if (Date.now() - helpUp.alone > 180000) { helpUp.alone = 0; helpedUp('Nobody'); say('You come to', 'Nobody came. You drag yourself up with 1 HP.', 4000); } }
  }, 600);
  // ---- the host's side ----
  function lfHostStart() { // called from cbStart when the floor is shared
    if (!LIVE.on || liveDM()) return; LF.on = true; LF.amHost = true; LF.host = LIVE.you; LF.id = LIVE.you + '-' + Date.now().toString(36);
    lfSend('fight', { host: LIVE.you, x: P.x, z: P.z, order: lfOrderIds(), snap: lfSnap(), ps: lfAllPs(), idx: CB.idx, round: CB.round });
  }
  function lfHostJoin(j) {
    if (!LF.on || !LF.amHost || !CB.on || lfRemote(j.from)) return;
    var m = lfMarker(j.from, j.name, j.init); m.hp = j.me[0]; m.max = j.me[1]; m.ac = j.me[3];
    var initOf = function (c) { return c === 'pc' ? PC.init : c.init; }, at = CB.order.length;
    for (var i = 0; i < CB.order.length; i++) if (m.init > initOf(CB.order[i])) { at = i; break; }
    CB.order.splice(at, 0, m); if (at <= CB.idx) CB.idx++; lfBoost();
    say((j.name || 'A friend') + ' joins the fight', 'Initiative ' + j.init + '. They take their place in the turn order.', 3200);
    lfBroadcastOrder(); cbRingsUpdate(); cbHUD();
  }
  function lfBroadcastOrder() { lfSend('order', { host: LIVE.you, order: lfOrderIds(), snap: lfSnap(), ps: lfAllPs(), idx: CB.idx, round: CB.round }); }
  function lfHostTurn() { // every turn change: everyone gets the order, the position of the turn and the monsters' state
    lfBoost(); lfSend('turn', { order: lfOrderIds(), snap: lfSnap(), ps: lfAllPs(), idx: CB.idx, round: CB.round });
    var c = CB.order[CB.idx]; clearTimeout(LF.waitT);
    if (c && c.remote) { var at = CB.idx; LF.waitT = setTimeout(function () { if (CB.on && CB.idx === at && CB.order[at] === c) { say(c.name + ' is taking a while', 'Skipping their turn.', 2600); cbNext(); } }, 120000); }
    else if (c && c !== 'pc') { var at2 = CB.idx, r2 = CB.round; LF.waitT = setTimeout(function () { if (CB.on && CB.idx === at2 && CB.round === r2 && CB.order[at2] === c) { c.path = null; c.afterWalk = null; CB.busy = false; cbNext(); } }, 15000); } // a monster turn that hangs never stalls the table
  }
  function lfHostDone(j) { var c = CB.order[CB.idx]; if (!LF.on || !LF.amHost || !c || !c.remote || c.uid !== j.from) return; clearTimeout(LF.waitT); lfApplySnap(j.snap); if (j.me) lfApplyPs((function () { var o = {}; o[j.from] = j.me; return o; })()); setTimeout(cbNext, 300); }
  function lfPath(e, path) { if (LF.on && LF.amHost) lfSend('path', { n: e.n, path: path }); }
  function lfAnim(e, clip) { if (LF.on && LF.amHost) lfSend('anim', { n: e.n, clip: clip }); }
  // a monster picks the nearest player still on their feet; a friend is returned as their stand-in
  function lfTarget(e) {
    if (!LF.on || !LF.amHost) return null; var best = null, bd = PC.down ? 1e9 : cheb(e.x, e.z, P.x, P.z);
    CB.order.forEach(function (c) { if (!c.remote || c.dead || c.down || c.hp <= 0) return; var dd = cheb(e.x, e.z, c.x, c.z) - (e.tgtUid === c.uid ? 1 : 0); if (dd < bd) { bd = dd; best = c; } });
    if (best) e.tgtUid = best.uid; else e.tgtUid = null; return best;
  }
  function lfEnemyVsFriend(e, t, speed) {
    if (cheb(e.x, e.z, t.x, t.z) <= 1) { lfEnemyHit(e, t); return; }
    if (!speed) { setTimeout(cbNext, 600); return; }
    var r = bfs(e.x, e.z, e, 40), best = null;
    for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; var k = (t.x + dx) + ',' + (t.z + dz); if (r.dist[k] !== undefined && (best === null || r.dist[k] < r.dist[best])) best = k; }
    if (best === null) { setTimeout(cbNext, 600); return; }
    var p = best.split(','), full = pathTo(r, +p[0], +p[1]), path = [], spent = 0; for (var i = 0; i < full.length; i++) { spent += tileCost(full[i][0], full[i][1]); if (spent > speed) break; path.push(full[i]); }
    if (!path.length) { setTimeout(cbNext, 300); return; }
    e.path = path; cbPlay(e, 'Walk_Loop'); lfPath(e, path);
    e.afterWalk = function () { cbPlay(e, 'Idle_Loop'); if (cheb(e.x, e.z, t.x, t.z) <= 1) lfEnemyHit(e, t); else setTimeout(cbNext, 350); };
  }
  function lfEnemyHit(e, t) {
    cbFace(e, t.x, t.z); cbPlay(e, e.def.attackClip, true); lfAnim(e, e.def.attackClip);
    var why = [], dis = false, adv = false;
    if (t.dodge) { dis = true; why.push('dodging'); } if (t.hidden) { dis = true; why.push('cannot see them'); } if (e.prone) { dis = true; why.push('attacking from the floor'); } if (e.blind > 0) { dis = true; why.push('it is blinded'); }
    var oT = obscured(t.x, t.z), oE = obscured(e.x, e.z); if (oT && !oE) { dis = true; why.push('cannot see them in the ' + (areaHas(t.x, t.z, ['darkness']) ? 'darkness' : 'smoke')); } else if (oE && !oT) { adv = true; why.push('they cannot see it'); }
    if (t.webbed) { adv = true; why.push('they are stuck'); } if (t.prone) { adv = true; why.push('they are on the floor'); } if (e.webbed) { dis = true; why.push('it is stuck'); }
    var pb = (e.rally || 0) + (e.furious ? 1 : 0); e.rally = 0;
    var R = roll20(adv && !dis, dis && !adv), tot = R.r + e.def.atk + pb, crit = R.r === 20, hit = crit || (R.r !== 1 && tot >= t.ac);
    var nd = crit ? e.def.dmg[0] * 2 : e.def.dmg[0], raw = hit ? d(nd, e.def.dmg[1]) : 0, dm = hit ? raw + e.def.dmg[2] : 0, line = R.txt + ' + ' + e.def.atk + (pb ? ' + ' + pb : '') + ' = ' + tot + ' vs AC ' + t.ac + (why.length ? ' · ' + why.join(', ') : '');
    setTimeout(function () {
      lfSend('hurt', { to: t.uid, n: e.n, dmg: dm, hit: hit ? 1 : 0, crit: crit ? 1 : 0, who: e.name, weapon: e.def.weapon, line: line, R: R, bonus: e.def.atk, tot: tot, ac: t.ac, dd: nd + 'd' + e.def.dmg[1], ds: e.def.dmg[1], raw: raw, db: e.def.dmg[2], why: why });
      floater(t.px, 1.5, t.pz, hit ? '-' + dm : 'MISS', hit ? (crit ? 'crit' : 'dmg') : 'miss'); if (hit) { t.hp = Math.max(0, t.hp - dm); if (t.hp <= 0) t.down = true; }
      say(e.name + (hit ? ' hits ' : ' misses ') + t.name + ' · ' + line, hit ? t.name + ' takes ' + dm + ' damage.' : 'A miss.', 3200); cbHUD();
      setTimeout(cbNext, 900);
    }, 480);
  }
  // ---- a friend's side ----
  function lfMaybeJoin(j) { // a fight started (or is going) nearby: join it if you are close and free
    if (!LIVE.on || liveDM() || CB.on || !CB.ready || (CHAR && CHAR.dead) || inSafeRoom(P.x, P.z) || LF.on) return;
    // close and able to see it: within 6 tiles of your friend with a clear line, or 4 tiles of a monster in it with a clear line
    var near = (cheb(j.x || 0, j.z || 0, P.x, P.z) <= LF_REACH && los(P.x, P.z, j.x || 0, j.z || 0)) || (j.snap || []).some(function (q) { return !q[5] && cheb(q[3], q[4], P.x, P.z) <= 4 && los(P.x, P.z, q[3], q[4]); });
    if (!near) return;
    var init = d20() + MOD.DEX - (hasTrait('Distractible') ? 2 : 0) + buffInit(); PC.init = init; LF.pending = j.id;
    lfSend('join', { id: j.id, to: j.host || j.from, name: CHAR.name || NET.user, init: init, me: lfMe() });
  }
  function lfBegin(j) { // the host put you in the order
    if (CB.on) return; LF.on = true; LF.amHost = false; LF.id = j.id; LF.host = j.host || j.from; LF.pending = null;
    if (menuOpen) closeMenu(); if (crouch) toggleCrouch(); keys = {}; joy.x = joy.y = 0;
    CB.on = true; CB.airFight = false; CB.dodge = false; CB.disengage = false; CB.aim = null; P.px = P.x; P.pz = P.z; P.speed = 0; CB.path = null; PC.react = true; CB.busy = false;
    CB.res = { move: 0, action: 0, bonus: 0, swap: 0 };
    lfSetOrder(j.order); lfApplySnap(j.snap); lfApplyPs(j.ps); CB.idx = j.idx; CB.round = j.round || 0;
    CB.order.forEach(function (c) { if (c !== 'pc' && !c.remote) { c.fought = true; c.react = true; } });
    say('Combat · You join the fight', 'Initiative ' + PC.init + '. ' + (CB.order.filter(function (c) { return c.remote; }).map(function (c) { return c.name; }).join(' and ') || 'Your friend') + ' started it; you are in the same turn order.', 4200);
    cbShowMoves(); cbRingsUpdate(); cbHUD(); if (CB.order[CB.idx] === 'pc') cbTurnPC();
  }
  function lfSetOrder(ids) { var old = {}; CB.order.forEach(function (c) { if (c.remote) old[c.uid] = c; });
    CB.order = ids.map(function (q) { if (q[0] === 'u') { if (q[1] === LIVE.you) { PC.init = q[2]; return 'pc'; } var m = old[q[1]] || lfMarker(q[1], q[3], q[2]); m.init = q[2]; return m; } var e = liveByN(q[1]); if (e) { e.init = q[2]; e.fought = true; } return e; }).filter(Boolean); }
  function lfTurn(j) { // the host moved the fight on
    if (!LF.on || LF.amHost || j.id !== LF.id) return; lfSetOrder(j.order); lfApplySnap(j.snap); lfApplyPs(j.ps); CB.round = j.round; var prev = CB.order[CB.idx]; CB.idx = j.idx;
    var cur = CB.order[CB.idx]; if (cur && cur !== 'pc' && !cur.remote) cur.react = true;
    if (CB.order[CB.idx] === 'pc' && prev !== 'pc') cbTurnPC(); else { cbShowMoves(); cbRingsUpdate(); cbHUD(); }
  }
  function lfDone() { // my turn is over: hand the fight back to the host
    if (CB.order[CB.idx] !== 'pc') return; CB.res = { move: 0, action: 0, bonus: 0, swap: 0 }; cbShowMoves(); cbHUD();
    lfSend('done', { to: LF.host, idx: CB.idx, snap: lfSnap(), me: lfMe() }); }
  function lfHurt(j) {
    if (!CB.on || !LF.on) return;
    try { if (j.R) diceShow(j.hit ? { who: j.who, vs: 'you', R: j.R, bonus: j.bonus, tot: j.tot, ac: j.ac, hit: true, crit: !!j.crit, dd: j.dd, ds: j.ds, raw: j.raw, db: j.db, dm: j.dmg, why: j.why || [], foe: true } : { who: j.who, vs: 'you', R: j.R, bonus: j.bonus, tot: j.tot, ac: j.ac, hit: false, why: j.why || [], foe: true }); } catch (x) {}
    var mon = liveByN(j.n); if (mon) { cbFace(mon, P.x, P.z); cbPlay(mon, mon.def.attackClip, true); }
    if (!j.hit) { floater(P.px, 1.5, P.pz, 'MISS', 'miss'); say(j.who + ' misses · ' + j.line, CB.dodge ? 'Your dodge pays off.' : 'It whistles past.', 3000); return; }
    PC.hp = Math.max(0, PC.hp - j.dmg); floater(P.px, 1.5, P.pz, '-' + j.dmg, j.crit ? 'crit' : 'pdmg'); kitOneShot('Hit_Chest');
    say(j.who + ' hits · ' + (j.weapon || '') + ' · ' + j.line, 'You take ' + j.dmg + ' damage. ' + (PC.hp > 0 ? PC.hp + ' HP left.' : ''), 4200);
    if (PC.hp <= 0) cbFall(); cbHUD(); lfSend('snap', { to: LF.host, me: lfMe() });
  }
  function lfEnd(win) { // the fight is over (from either side)
    if (!LF.on) return; var was = LF.amHost; LF.on = false; clearTimeout(LF.waitT); if (was) lfUnboost();
    if (was) lfSend('end', { win: win ? 1 : 0, snap: lfSnap() }); else if (CB.on) { lfSend('snap', { to: LF.host, snap: lfSnap(), me: lfMe() }); lfSend('leave', { to: LF.host }); }
    LF.id = null; LF.amHost = false; LF.host = null;
  }
  // two of us started fights over the same monsters at the same moment: the lower player id keeps hosting, the other folds in
  function lfClash(j) {
    if (!LF.on || !LF.amHost || !CB.on || j.id === LF.id) return false; var other = j.host || j.from; if (!other || other > LIVE.you) return false;
    var mine = {}; CB.order.forEach(function (c) { if (c !== 'pc' && !c.remote) mine[c.n] = 1; });
    var overlap = (j.snap || []).some(function (q) { return mine[q[0]]; }) || (j.x !== undefined && cheb(j.x, j.z, P.x, P.z) <= LF_REACH);
    if (!overlap) return false;
    lfSend('end', { win: 0, snap: [] }); LF.on = false; LF.id = null; LF.amHost = false; clearTimeout(LF.waitT);
    CB.on = false; CB.order = []; CB.busy = false; CB.path = null; CB.aim = null; cbShowMoves(); cbRingsUpdate(); cbHUD();
    var e0 = (j.snap || []).filter(function (q) { return !q[5]; })[0];
    lfMaybeJoin({ id: j.id, host: other, x: j.x !== undefined ? j.x : e0 ? e0[3] : P.x, z: j.z !== undefined ? j.z : e0 ? e0[4] : P.z, snap: j.snap });
    return true;
  }
  // ---- messages ----
  function lfOn(j) {
    if (j.k === 'area') { lfArea(j); return; }
    if (j.k === 'talk') { var te = j.n === null || j.n === undefined ? null : liveByN(j.n), g0 = LIVE.ghosts[j.from];
      if (te) { bubble.remote = true; try { bubble(te, j.text); } finally { bubble.remote = false; } } else liveBubble(j.from, j.text);
      var wx = te ? te.x : g0 && g0.p ? g0.p.x : null, wz = te ? te.z : g0 && g0.p ? g0.p.z : null; if (wx !== null && cheb(wx, wz, P.x, P.z) <= 20) try { cbLog(j.name || 'Someone', j.text); } catch (x) {} return; }
    if (j.k === 'help') { if (j.to === LIVE.you) helpedUp(j.name || 'A friend'); else { var hm = lfRemote(j.to); if (hm) { hm.down = false; hm.hp = Math.max(1, hm.hp); cbHUD(); } } return; }
    if ((j.k === 'fight' || j.k === 'turn' || j.k === 'order') && lfClash(j)) return;
    if (j.k === 'fight') { LF.fights[j.id] = { host: j.host, x: j.x, z: j.z, at: Date.now() }; lfMaybeJoin(j); return; }
    if (j.k === 'join') { if (LF.on && LF.amHost && j.id === LF.id) lfHostJoin(j); return; }
    if (j.k === 'order') { LF.fights[j.id] = LF.fights[j.id] || { host: j.host, at: Date.now() }; LF.fights[j.id].at = Date.now();
      if (!LF.on && LF.pending === j.id && j.order.some(function (q) { return q[0] === 'u' && q[1] === LIVE.you; })) lfBegin(j); else if (LF.on && !LF.amHost && j.id === LF.id) lfTurn(j); return; }
    if (j.k === 'turn') { if (LF.fights[j.id]) LF.fights[j.id].at = Date.now(); else LF.fights[j.id] = { host: j.from, at: Date.now() };
      if (LF.on && j.id === LF.id) lfTurn(j); else if (!LF.on && !CB.on) { var e0 = (j.snap || []).filter(function (q) { return !q[5]; })[0]; if (e0) lfMaybeJoin({ id: j.id, host: j.from, x: e0[3], z: e0[4], snap: j.snap }); } return; }
    if (j.k === 'done') { if (j.id === LF.id) lfHostDone(j); return; }
    if (j.k === 'snap') { if (j.id !== LF.id) return; if (j.snap) lfApplySnap(j.snap); if (j.me) { var o = {}; o[j.from] = j.me; lfApplyPs(o); cbHUD(); } return; }
    if (j.k === 'hurt') { if (j.id === LF.id) lfHurt(j); return; }
    if (j.k === 'path') { if (j.id !== LF.id || LF.amHost) return; var e = liveByN(j.n); if (e && j.path && j.path.length) { e.path = j.path; cbPlay(e, 'Walk_Loop'); e.afterWalk = function () { cbPlay(e, 'Idle_Loop'); }; } return; }
    if (j.k === 'anim') { if (j.id !== LF.id || LF.amHost) return; var e2 = liveByN(j.n); if (e2) cbPlay(e2, j.clip, true); return; }
    if (j.k === 'end') { delete LF.fights[j.id]; if (LF.on && j.id === LF.id && !LF.amHost) { lfApplySnap(j.snap); LF.on = false; LF.id = null; if (CB.on) cbEnd(!!j.win); } if (LF.pending === j.id) LF.pending = null; return; }
    if (j.k === 'leave') { if (!LF.on || !LF.amHost || j.id !== LF.id) return; var m = lfRemote(j.from); if (!m) return; m.dead = true; var at = CB.order.indexOf(m); var cur = CB.order[CB.idx] === m;
      CB.order.splice(at, 1); if (at < CB.idx) CB.idx--; if (cur) { CB.idx--; cbNext(); } else lfBroadcastOrder(); cbHUD(); return; }
  }
  // a fight nearby that someone else is hosting: join it rather than starting a second one over the same monsters
  function lfNearbyFight() { var now = Date.now(), best = null; Object.keys(LF.fights).forEach(function (id) { var f = LF.fights[id]; if (now - f.at > 15000) { delete LF.fights[id]; return; } if (f.x !== undefined && cheb(f.x, f.z, P.x, P.z) <= LF_REACH + 4) best = id; }); return best; }
  // while I'm acting, keep everyone's view of the monsters current
  setInterval(function () { if (!LF.on || !CB.on) return; var mine = CB.order[CB.idx] === 'pc' || (LF.amHost && CB.order[CB.idx] && !CB.order[CB.idx].remote); if (!mine) return;
    var s = JSON.stringify(lfSnap()) + JSON.stringify(lfMe()); if (s === LF.lastSnap) return; LF.lastSnap = s; lfSend('snap', { snap: lfSnap(), me: lfMe() }); }, 350);

  // every area someone makes (a thrown flask, a spell, a set piece) is made on everyone's screen on the floor too
  var vfxAreaHere = vfxArea, LF_AREA_IN = false;
  vfxArea = function (kind, x, z, r, secs) { var A = vfxAreaHere(kind, x, z, r, secs); if (!LF_AREA_IN && LIVE.on && !liveDM() && (secs || 30) < 1e8) liveSendRaw({ t: 'cb', k: 'area', id: 'area', kind: kind, x: +x.toFixed(2), z: +z.toFixed(2), r: r, secs: secs }); return A; };
  function lfArea(j) { if (!/^[a-z]+$/.test(j.kind || '')) return; LF_AREA_IN = true; try { vfxAreaHere(j.kind, +j.x, +j.z, +j.r || 1.5, +j.secs || 30); } catch (x) {} LF_AREA_IN = false; }
