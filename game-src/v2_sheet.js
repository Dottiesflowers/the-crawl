
  // ===================== the Character screen: Sheet (stats + skills), Background (who you were + journal), Party =====================
  var CS = { open: false, tab: 'Sheet' };
  (function () {
    var el = document.createElement('div'); el.id = 'charS'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Character'); document.body.appendChild(el);
    var PA = 'background-color:#E6D7B5;background-image:radial-gradient(circle at 20% 15%,rgba(255,250,235,.55),transparent 55%),radial-gradient(circle at 85% 90%,rgba(120,80,40,.22),transparent 60%);color:#2B1D12;';
    var IR = 'background-color:#232327;background-image:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.25));color:#EFE3C6;';
    var css = document.createElement('style');
    css.textContent = [
      '#charS{position:fixed;inset:10px;z-index:30;display:none;flex-direction:column;background:linear-gradient(180deg,#4a2e1a,#2c1a0e);border:2px solid #2e2116;border-radius:6px;font-family:"EB Garamond",Georgia,serif;color:#2B1D12}',
      '#charS.on{display:flex}',
      '#charS header{display:flex;align-items:center;gap:5px;padding:6px 10px;' + IR + 'border-bottom:2px solid #a07a3e}',
      '#charS header b{font-family:Cinzel,serif;font-weight:800;font-size:15px;margin-right:8px}',
      '#charS header .sp{flex:1}',
      '#charS .tb{height:34px;padding:0 13px;background:transparent;border:1px solid #5A4A30;border-radius:3px;color:#EFE3C6;font-family:Cinzel,serif;font-weight:700;font-size:12px}',
      '#charS .tb.on{' + PA + 'border-color:#2e2116;color:#2B1D12}',
      '#charS .cols{flex:1;display:flex;gap:10px;padding:10px;min-height:0}',
      '#charS .pg{' + PA + 'border:2px solid #2e2116;border-radius:3px;box-shadow:inset 0 0 30px rgba(90,60,30,.35);padding:10px 12px;overflow-y:auto;touch-action:pan-y;min-width:0}',
      '#charS h3{margin:8px 0 4px;font-family:Cinzel,serif;font-weight:800;font-size:12px;letter-spacing:.08em;color:#7A1F1A}#charS h3:first-child{margin-top:0}',
      '#charS p{margin:3px 0;font-size:14px;line-height:1.3}#charS small{color:#5a4430}',
      '#charS .abil{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}',
      '#charS .ab{position:relative;text-align:center;padding:5px 0 6px;border:2px solid #2e2116;border-radius:4px;background:rgba(255,250,235,.55)}',
      '#charS .ab i{display:block;font-style:normal;font-family:Cinzel,serif;font-size:10px;font-weight:700;letter-spacing:.1em;color:#6b5a3a}',
      '#charS .ab b{display:block;font-family:Cinzel,serif;font-size:22px;line-height:1.05}#charS .ab span{font-size:12px;color:#5a4430}',
      '#charS .plus{position:absolute;right:3px;top:3px;width:26px;height:26px;border-radius:50%;background:#7A1F1A;border:0;color:#F3E6CC;font-weight:800;font-size:15px;line-height:1}',
      '#charS .vit{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0}',
      '#charS .vit div{text-align:center;padding:4px 0;' + IR + 'border:1px solid #a07a3e;border-radius:3px}#charS .vit b{display:block;font-family:Cinzel,serif;font-size:16px}#charS .vit small{color:#C9B48A;font-family:Cinzel,serif;font-size:9px;letter-spacing:.1em}',
      '#charS .pts{padding:4px 8px;background:#7A1F1A;color:#F3E6CC;border-radius:3px;font-size:13px}',
      '#charS .sk{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid rgba(43,29,18,.15)}',
      '#charS .sk .lv{width:30px;height:30px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;' + IR + 'border:2px solid #a07a3e;font-family:Cinzel,serif;font-weight:800;font-size:14px}',
      '#charS .sk .tx{flex:1;min-width:0}#charS .sk .tx b{font-size:14.5px}#charS .sk .tx em{font-style:normal;font-family:Cinzel,serif;font-size:9.5px;color:#6b5a3a;margin-left:5px}#charS .sk .tx span{display:block;font-size:12.5px;color:#4a3826;line-height:1.2}',
      '#charS .sk .bar{height:3px;background:rgba(138,106,46,.25);margin-top:3px}#charS .sk .bar i{display:block;height:100%;background:#8a6a2e}',
      '#charS .sys{display:inline-block;font-family:Cinzel,serif;font-size:8.5px;letter-spacing:.08em;padding:1px 5px;border-radius:8px;background:#232327;color:#E0B868;margin-left:5px;vertical-align:2px}',
      '#charS .qa{margin:0 0 7px}#charS .qa i{display:block;font-style:normal;font-family:Cinzel,serif;font-size:10px;letter-spacing:.08em;color:#6b5a3a}#charS .qa p{font-style:italic}',
      '#charS .log{list-style:none;margin:0;padding:0}#charS .log li{display:flex;gap:8px;padding:5px 0;border-top:1px solid rgba(43,29,18,.15);font-size:13.5px;line-height:1.25}',
      '#charS .log li small{flex:none;width:58px;font-family:Cinzel,serif;font-size:9.5px;color:#6b5a3a;padding-top:2px}',
      '#charS .log li.boss,#charS .log li.level{font-weight:700}#charS .log li.death{color:#7A1F1A}',
      '#charS .ccBtn{height:36px;padding:0 13px;margin:2px 4px 2px 0;' + IR + 'border:1px solid #8a7a5a;border-radius:3px;font-family:Cinzel,serif;font-weight:700;font-size:11.5px;text-transform:none;letter-spacing:.03em;color:#EFE3C6}',
      '#charS ul.gear{columns:2;padding-left:16px;margin:2px 0;font-size:13.5px}',
      '#charS #dmBox h3{margin-top:12px}#charS #dmBox ul{padding-left:16px}',
      '@media (max-width:700px){#charS .cols{flex-direction:column;overflow-y:auto}#charS .pg{overflow:visible}}'
    ].join('\n');
    document.head.appendChild(css);
    // top-right buttons: Inventory · Map · Character (far right)
    var gb = document.getElementById('gearBtn'), nb = gb.cloneNode(true); nb.textContent = 'Character'; gb.parentNode.replaceChild(nb, gb); nb.onclick = charToggle;
    var bb = document.getElementById('bagBtn'); if (bb) bb.textContent = 'Inventory';
  })();
  function charToggle() {
    CS.open = !CS.open; document.getElementById('charS').classList.toggle('on', CS.open);
    if (CS.open) { if (UI.bag) bagToggle(); if (UI.map) mapToggle(); if (gearOpen) toggleGear(); charDraw(); }
  }
  function charDraw() {
    if (!CS.open) return; var el = document.getElementById('charS'), c = CHAR;
    var tabs = ['Sheet', 'Background', 'Party'];
    var head = '<header><b>' + esc(c ? c.name : 'Character') + '</b>' + tabs.map(function (t) { return '<button type="button" class="tb' + (CS.tab === t ? ' on' : '') + '" data-tab="' + t + '">' + t + '</button>'; }).join('') + '<span class="sp"></span><button type="button" class="tb" id="csX">Close</button></header>';
    var body = !c ? '<div class="cols"><div class="pg" style="flex:1"><p>No character yet.</p><p><button type="button" class="ccBtn" id="csNew">Create your character</button></p></div></div>'
      : CS.tab === 'Sheet' ? csSheet(c) : CS.tab === 'Background' ? csBackground(c) : csParty(c);
    el.innerHTML = head + body;
    el.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { CS.tab = b.dataset.tab; charDraw(); }; });
    document.getElementById('csX').onclick = charToggle;
    el.querySelectorAll('[data-spend]').forEach(function (b) { b.onclick = function () { var p = b.dataset.spend.split('|'); spendPoint(p[0], p[1]); charDraw(); }; });
    var nw = document.getElementById('csNew'); if (nw) nw.onclick = function () { charToggle(); window.__crawl.newChar(); };
    var wd = document.getElementById('csWard'); if (wd) wd.onclick = function () { charToggle(); GMODE = 'normal'; tab = 'Clothes'; if (!gearOpen) toggleGear(); else { drawTabs(); drawRows(); } };
    if (CS.tab === 'Party' && typeof sheetAfter === 'function') sheetAfter();
  }
  function csSheet(c) {
    var a = (typeof pcAC === 'function') ? pcAC() : { ac: '?', why: '' }, sp = c.statPts || 0, kp = c.skillPts || 0;
    var abil = STATS.map(function (k) { var m = Math.floor((c.stats[k] - 10) / 2); return '<div class="ab" title="' + STAT_NAMES[k] + '"><i>' + k + '</i><b>' + (m >= 0 ? '+' : '') + m + '</b><span>' + c.stats[k] + '</span>' + (sp && c.stats[k] < 20 ? '<button type="button" class="plus" data-spend="stat|' + k + '" aria-label="Raise ' + k + '">+</button>' : '') + '</div>'; }).join('');
    var tr = TRAITS.filter(function (t) { return t[0] === c.trait; })[0] || [c.trait, ''], fl = FLAWS.filter(function (t) { return t[0] === c.flaw; })[0] || [c.flaw, ''];
    var sk = Object.keys(c.skills || {}).filter(function (k) { return c.skills[k] > 0; }).sort(function (x, y) { return c.skills[y] - c.skills[x] || (x < y ? -1 : 1); });
    var skills = sk.map(function (k) {
      var lv = c.skills[k], d = skillDef(k) || [k, '', ''], prog = (c.skillXP || {})[k] || 0, need = (lv + 1) * 3, mine = c.skillDefs && c.skillDefs[k];
      return '<div class="sk"><span class="lv">' + lv + '</span><div class="tx"><b>' + esc(k) + '</b><em>' + esc(d[1] || '') + '</em>' + (mine ? '<span class="sys">System-made</span>' : '') + '<span>' + esc(d[2] || '') + '</span><div class="bar"><i style="width:' + Math.round(100 * prog / need) + '%"></i></div></div>' +
        (kp && lv < 3 + (PC.level || 1) ? '<button type="button" class="plus" style="position:static" data-spend="skill|' + esc(k) + '" aria-label="Raise ' + esc(k) + '">+</button>' : '') + '</div>';
    }).join('');
    return '<div class="cols"><div class="pg" style="width:min(340px,42%);flex:none">' +
      '<h3>Level ' + (PC.level || 1) + ' crawler · ' + (PC.xp || 0) + ' / ' + nextLevelXP() + ' XP</h3>' + (sp ? '<p class="pts">' + sp + ' stat point' + (sp > 1 ? 's' : '') + ' to spend: tap + on a stat.</p>' : '') +
      '<div class="abil">' + abil + '</div>' +
      '<div class="vit"><div><b>' + PC.hp + '/' + PC.max + '</b><small>HP</small></div><div><b>' + a.ac + '</b><small>AC</small></div><div><b>+' + PROF() + '</b><small>PROF</small></div><div><b>' + (10 + MOD.WIS + skillLv('Perception')) + '</b><small>NOTICE</small></div></div>' +
      '<p><small>AC: ' + esc(a.why) + '</small></p>' +
      '<h3>Trait · ' + esc(c.trait) + '</h3><p>' + esc(c.traitDesc || tr[1]) + '</p><h3>Flaw · ' + esc(c.flaw) + '</h3><p>' + esc(c.flawDesc || fl[1]) + '</p>' +
      '<h3>Class</h3><p>' + ((PC.level || 1) >= 3 ? 'Unlocked. The choice is coming soon; the System is watching what you train.' : 'Unlocks at level 3, offered from the weapons and skills you actually use.') + '</p></div>' +
      '<div class="pg" style="flex:1"><h3>Skills · ' + sk.length + '</h3>' + (kp ? '<p class="pts">' + kp + ' skill point' + (kp > 1 ? 's' : '') + ' to spend: tap + on a skill.</p>' : '') +
      '<p><small>Skills grow with use. New ones appear when the System notices you doing something a lot, or when it rules that a stunt deserved one.</small></p>' +
      (skills || '<p>No skills yet. Do things.</p>') + '</div></div>';
  }
  var QA_LABELS = ['Who you are', 'Work history', 'What you do now', 'Big life moments', 'Interests and practical skills', 'How you see yourself', 'What you had on you', 'What you were wearing'];
  function csBackground(c) {
    var qa = (c.interview || []).map(function (x, i) { if (!x.a) return ''; return '<div class="qa"><i>' + esc(QA_LABELS[i] || x.q) + '</i><p>' + esc(x.a) + '</p></div>'; }).join('');
    var home = (c.gear || []).filter(function (g) { return g.from === 'home' || g.from === 'the System'; }).map(function (g) { return '<li>' + esc(g.name) + '</li>'; }).join('');
    var log = (c.log || []).slice().reverse().map(function (l) { var dt = new Date(l.t); return '<li class="' + esc(l.k) + '"><small>' + (dt.getMonth() + 1) + '/' + dt.getDate() + ' · Lv ' + (l.lv || 1) + '</small><span>' + esc(l.txt) + '</span></li>'; }).join('');
    return '<div class="cols"><div class="pg" style="flex:1"><h3>Before the dungeon</h3>' + (c.born ? '<p><small>Registered as a crawler on ' + new Date(c.born).toLocaleDateString() + '.</small></p>' : '') +
      (qa || '<p>No interview on file.</p>') + (home ? '<h3>Brought from home</h3><ul class="gear">' + home + '</ul>' : '') + '</div>' +
      '<div class="pg" style="width:min(340px,44%);flex:none"><h3>Journal</h3><p><small>Major steps and milestones, newest first.</small></p><ul class="log">' + (log || '<li><span>Nothing yet. Go make some history.</span></li>') + '</ul></div></div>';
  }
  function csParty(c) {
    var party = NET.party.filter(function (p) { return p.id !== NET.uid; }), achs = Object.keys(c.ach || {}).length;
    return '<div class="cols"><div class="pg" style="flex:1"><h3>Party</h3>' + (party.length ? '<ul class="gear" style="columns:1">' + party.map(function (p) { return '<li>' + esc(p.name || p.username) + (p.name ? ' <small>(' + esc(p.username) + ')</small>' : ' <small>(no character yet)</small>') + ' · ' + (p.xp || 0) + ' XP' + (p.dead ? ' · <b>dead</b>' : '') + '</li>'; }).join('') + '</ul>' : '<p>No one else has joined yet.</p>') +
      '<p><small>Monster XP is shared with the party. Achievements are yours: ' + achs + ' so far.</small></p>' +
      '<h3>Character</h3><p>' + (NET.live ? '' : '<button type="button" class="ccBtn" onclick="window.__crawl.redress()">Get dressed by the System</button><button type="button" class="ccBtn" id="csWard">Wardrobe (testing)</button>') + '<button type="button" class="ccBtn" id="csNew">Make a new character</button></p>' +
      (NET.live ? '' : '<p><small>Re-dressing and the wardrobe are testing tools; they lock when the campaign starts.</small></p>') +
      (NET.user ? '<div id="dmBox"></div><p>Signed in as ' + esc(NET.user.username) + (NET.user.role === 'dm' ? ' (DM)' : '') + ' <button type="button" class="ccBtn" onclick="window.__crawl.logOut()">Log out</button></p>' : '') +
      creditsHTML() + '</div></div>';
  }
