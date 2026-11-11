
  // ===================== AI talk: free-text conversation with NPCs and monsters =====================
  // Each speaker has a persona (who they are, what they want, what they know, how they talk).
  // Claude plays them through the page's sample capability; the game keeps the rules:
  // a hidden d20 persuasion roll every line, and only listed outcomes can change the world.
  var PERSONA = {
    pip: { name: 'Pip, production assistant', voice: 'fast, anxious, eager to please, drops TV jargon (call sheet, B-roll, the network), calls the player "talent"',
      who: 'A junior imp production assistant for the alien dungeon-crawl show, assigned as the Safe Room guide for the five human contestants, humanity\'s chosen representatives. Three weeks into the job. Carries a clipboard. Terrified of the Showrunner. Secretly rooting for the humans because good ratings mean a promotion.',
      wants: 'Keep the talent alive and dramatic until the commercial break. Not get fired.',
      knows: 'You are in the Safe Room: violence here is forbidden, and anyone who attacks anyone inside gets teleported out and put in a timeout. Rules you explain when asked: explore by walking, Interact to search and use things (skill checks are d20 plus stat plus skill), combat is turn based, loot bodies and rooms, achievements earn loot boxes in tiers (bronze, silver, gold and up), safe rooms are where you rest and plan, logging off counts as a long rest, the audience rewards creativity and absurdity. Floor one has hallways between monster neighborhoods. Two puglins (small, hungry, cowardly in a group of one) and an imp security guard (bored, paid by the hour, takes bribes, hates its job) wait in the room east past the mossy grotto. The stairs down are in the far east room behind the guard. Loot box in the crypt can be jury-rigged. Brazier light shows where the safe tiles are. Viewers love music, mercy and stupid bravery. The System hates being ignored.',
      limits: 'Cannot fight, cannot leave the Safe Room, cannot give items yet. Will not reveal the Showrunner\'s name. Never breaks character to talk about being an AI or a game.',
      start: 'friendly', calmed: true },
    puglin: { name: 'Puglin', voice: 'short grunting sentences, third person sometimes ("Grik hungry"), easily flattered, bad grammar',
      who: 'A small goblin-pug monster spawned two days ago for the show. Lives for snacks and approval from bigger monsters.',
      wants: 'Food. Shiny things. Not to be the one who dies first on camera.',
      knows: 'The imp guard bosses them around. There is a stairwell somewhere past the guard. Humans are new and smell like soap.',
      limits: 'Not very smart. Cannot be talked into betraying the imp unless given food or real reassurance.', start: 'hostile' },
    imp: { name: 'Imp security guard', voice: 'dry, sarcastic, union-worker energy, complains about pay and hours, calls the player "pal"',
      who: 'A security imp contracted to guard the stairwell on floor one. Has done this for four seasons. Seen a lot of crawlers die.',
      wants: 'End of shift. Overtime pay. Not to get stabbed for minimum wage.',
      knows: 'The stairs down are right behind it. Floor two has a market and worse monsters. The puglins are idiots. Management never fixes the brazier.',
      limits: 'Will not just step aside for free; needs a bribe, a good argument, a laugh, or to be scared. Insults make it hostile.', start: 'hostile' }
  };
  var TALK = { open: false, e: null, busy: false, ctl: null };
  (function talkUI() {
    var css = document.createElement('style');
    css.textContent = '#talk{position:fixed;right:12px;bottom:12px;top:12px;width:min(420px,58vw);z-index:40;display:none;flex-direction:column;background:#0b0c13;border:1px solid rgba(61,242,224,.4);border-radius:12px;color:#e8f4f4;font-size:13px}' +
      '#talk.on{display:flex}#talk header{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.08)}#talk header b{flex:1;color:var(--hot);font-size:12px;letter-spacing:.1em;text-transform:uppercase}' +
      '#talk header small{color:#9ab}#talk header button{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:6px;padding:4px 9px;font:inherit;cursor:pointer}' +
      '#tlog{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}#tlog p{margin:0;line-height:1.4;max-width:92%}#tlog .me{align-self:flex-end;background:rgba(61,242,224,.14);padding:6px 9px;border-radius:10px 10px 2px 10px}' +
      '#tlog .them{background:rgba(255,255,255,.06);padding:6px 9px;border-radius:10px 10px 10px 2px}#tlog .them i{display:block;color:#9ab;font-size:11px;margin-top:3px}#tlog .sys{color:#ffd34a;font-size:11.5px;align-self:center;text-align:center}' +
      '#talk form{display:flex;gap:6px;padding:9px;border-top:1px solid rgba(255,255,255,.08)}#talk input{flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(61,242,224,.35);border-radius:8px;color:#fff;padding:8px;font:inherit}' +
      '#talk form button{padding:8px 12px;border-radius:8px;border:1px solid var(--neon);background:rgba(61,242,224,.12);color:#fff;font:inherit;cursor:pointer}#talk form button:disabled{opacity:.5}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'talk'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Conversation');
    el.innerHTML = '<header><b id="tName"></b><small id="tMood"></small><button type="button" id="tBye">Leave</button></header><div id="tlog" aria-live="polite"></div>' +
      '<form id="tForm"><label id="tWh"><input type="checkbox" id="tWhis"> Whisper</label><input id="tIn" type="text" maxlength="280" autocomplete="off" placeholder="Say anything…" aria-label="What you say"><button type="submit" id="tSend">Say</button></form>';
    document.body.appendChild(el);
    document.getElementById('tBye').onclick = talkClose;
    document.getElementById('tForm').onsubmit = function (ev) { ev.preventDefault(); var v = document.getElementById('tIn').value.trim(); if (v) talkSay(v); };
    document.getElementById('tIn').addEventListener('keydown', function (ev) { ev.stopPropagation(); });
  })();
  function personaOf(e) { return PERSONA[e.npc || e.kind] || (e.def && PERSONA[e.def.base]); }
  function talkId(e) { return e.npc || (e.kind + '-' + (e.n !== undefined ? e.n : CB.enemies.indexOf(e))); } // one conversation per individual, not per kind of monster
  function talkKey(e) { return 'crawl-talk-' + (NET.uid ? NET.uid + '-' : '') + talkId(e); }
  function talkOpen(e) {
    var p = personaOf(e); if (!p) return;
    TALK.open = true; TALK.e = e;
    if (!e.talk && NET.mode === 'server' && !e.talkFetched) {
      e.talkFetched = true; TALK.open = true; TALK.e = e;
      api('kv/talk-' + talkId(e)).then(function (j) { if (j.value && j.value.lines) e.talk = j.value; }, function () {}).then(function () { if (TALK.e === e) talkOpen(e); });
      return;
    }
    if (!e.talk && NET.mode !== 'server') { try { e.talk = JSON.parse(localStorage.getItem(talkKey(e)) || 'null'); } catch (x) {} }
    if (!e.talk) e.talk = { lines: [], mood: e.calm ? 'friendly' : p.start, facts: [] };
    document.getElementById('tName').textContent = e.npc ? p.name : e.name;
    document.getElementById('talk').classList.add('on'); talkDraw();
    if (!e.talk.lines.length) talkSay(null);
    setTimeout(function () { document.getElementById('tIn').focus(); }, 50);
  }
  function talkClose() {
    TALK.open = false; if (TALK.ctl) try { TALK.ctl.abort(); } catch (x) {}
    document.getElementById('talk').classList.remove('on'); if (TALK.e) talkStore(TALK.e); TALK.e = null; TALK.busy = false;
  }
  function talkStore(e) {
    var v = { lines: e.talk.lines.slice(-30), mood: e.talk.mood, facts: e.talk.facts.slice(-12) };
    try { localStorage.setItem(talkKey(e), JSON.stringify(v)); } catch (x) {}
    if (NET.mode === 'server' && NET.uid) api('kv/talk-' + talkId(e), { method: 'PUT', body: { value: v } }).catch(function () {});
  }
  function talkDraw(stream) {
    var e = TALK.e, log = document.getElementById('tlog'); if (!e) return;
    document.getElementById('tMood').textContent = e.talk.mood;
    log.innerHTML = '';
    e.talk.lines.forEach(function (l) {
      var p = document.createElement('p'); p.className = l.who;
      p.textContent = l.text; if (l.note) { var i = document.createElement('i'); i.textContent = l.note; p.appendChild(i); }
      log.appendChild(p);
    });
    if (stream !== undefined) { var s = document.createElement('p'); s.className = 'them'; s.textContent = stream || '…'; log.appendChild(s); }
    log.scrollTop = log.scrollHeight;
    document.getElementById('tSend').disabled = TALK.busy;
  }
  // what the player is rolling this line: the best talking skill they have
  function talkRoll() {
    var best = ['De-escalation', 'Deception', 'Intimidation', 'Haggling', 'Performance'].sort(function (a, b) { return skillLv(b) - skillLv(a); })[0];
    var r = d20(), b = MOD.CHA + skillLv(best) + (hasTrait('Silver Tongue') ? 2 : 0);
    return { r: r, b: b, total: r + b, skill: best };
  }
  function talkSay(text) {
    var e = TALK.e, p = personaOf(e); if (!e || TALK.busy) return;
    var whisper = document.getElementById('tWhis').checked; TALK.whisper = whisper;
    if (text) { e.talk.lines.push({ who: 'me', text: text, wh: whisper }); document.getElementById('tIn').value = ''; bubble('pc', text, whisper); }
    var roll = talkRoll();
    TALK.busy = true; talkDraw('');
    if (!NET.sample) { setTimeout(function () { talkReply(e, talkCanned(e, text), roll); }, 350); return; }
    var c = CHAR || MICHAEL;
    var sys = 'You are voicing one character in a browser dungeon crawl run on D&D 5e rules, styled after the novel series Dungeon Crawler Carl: an alien reality show where human crawlers fight through a dungeon for viewers. Stay fully in character. Never mention being an AI, a model, or a game.\n\n' +
      'CHARACTER: ' + p.name + (e.npc ? '' : ' (' + e.name + ')') + '\nWho: ' + p.who + '\nWants: ' + p.wants + '\nKnows: ' + p.knows + '\nLimits: ' + p.limits + '\nVoice: ' + p.voice +
      '\nCurrent mood toward the player: ' + e.talk.mood + (e.calm ? ' (has agreed not to fight)' : '') + '. HP ' + e.hp + '/' + e.max + '.' + (e.talk.facts.length ? '\nThings you have learned about this player: ' + e.talk.facts.join('; ') : '') +
      '\n\nTHE PLAYER: ' + (c.name || 'a crawler') + ', human, level 1, one of humanity\'s five representatives. Charisma ' + c.stats.CHA + '. Notable skills: ' + Object.keys(c.skills).join(', ') + '. Trait: ' + c.trait + '. Flaw: ' + c.flaw + '. Carrying: ' + ((c.gear || []).map(function (g) { return g.name; }).join(', ') || 'nothing much') + '. HP ' + PC.hp + '/' + PC.max + '. Holding: ' + ((typeof pcWeapon === 'function') ? pcWeapon().name : 'nothing') + '.' +
      (CB.on ? '\nA fight is happening right now.' : '') + (whisper ? '\nThe player is WHISPERING this line so only you can hear; answer quietly.' : '\nThe player is speaking out loud; anyone nearby can hear.') +
      '\n\nThis line the player rolled ' + roll.skill + ': d20 ' + roll.r + ' + ' + roll.b + ' = ' + roll.total + '. If the player is trying to persuade, trick, scare, bribe or charm you, judge the attempt against DC 10 (easy ask) / 13 (real favor) / 16 (against your interests) and let the roll decide whether it works, but a clever or funny line can lower the DC by 2 and an insult raises it. A natural 1 backfires; a natural 20 works if at all possible. If they are just chatting, ignore the roll.' +
      '\n\nReply with JSON only, no markdown: {"say": what you say out loud, 1 to 3 short sentences, may include a brief *action* in asterisks, "mood": one of "friendly","neutral","wary","hostile", "outcome": one of "none","calm" (you agree to stop fighting or not to fight them: any truce, deal, bribe accepted, surrender or promise to leave them alone counts as calm, and you must then honor it),"fight" (you attack now),"hint" (you told them something useful), "used_roll": true if the roll decided something, "fact": optional short note about the player worth remembering, or ""}';
    var msgs = [{ role: 'user', content: sys + '\n\n[Conversation begins.' + (text ? '' : ' The player has just walked up. Greet them in character.') + ']' }];
    e.talk.lines.slice(-14).forEach(function (l) { msgs.push({ role: l.who === 'me' ? 'user' : 'assistant', content: l.who === 'me' ? 'Player says: ' + l.text : JSON.stringify({ say: l.text }) }); });
    if (msgs[msgs.length - 1].role !== 'user') msgs.push({ role: 'user', content: 'Player says nothing and waits.' });
    // merge consecutive same-role turns (the opener plus the first player line)
    var m2 = []; msgs.forEach(function (m) { var l = m2[m2.length - 1]; if (l && l.role === m.role) l.content += '\n\n' + m.content; else m2.push({ role: m.role, content: m.content }); });
    TALK.ctl = window.AbortController ? new AbortController() : null;
    NET.sample(m2, { modelTier: 'quick', cache: false, signal: TALK.ctl && TALK.ctl.signal, onText: function (u) { var mm = /"say"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(u.text || ''); if (mm && TALK.e === e) talkDraw(mm[1].replace(/\\"/g, '"').replace(/\\n/g, ' ')); } })
      .then(function (r) { var j = null; try { j = JSON.parse((r.text || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (x) {} talkReply(e, j || { say: (r.text || '…').slice(0, 300), mood: e.talk.mood, outcome: 'none' }, roll); },
        function (err) {
          if (err && err.name === 'AbortError') return;
          var why = err && err.code === 'rate_limited' ? 'The network is throttling the feed. Try again in a moment.' : (err && (err.code === 'not_granted' || err.code === 'ai_not_configured') ? 'AI voices are not switched on yet, so characters fall back to stock lines.' : 'The feed glitched.');
          if (err && (err.code === 'not_granted' || err.code === 'ai_not_configured')) NET.sample = null;
          if (err && err.status === 401) authOpen();
          e.talk.lines.push({ who: 'sys', text: why }); TALK.busy = false;
          if (!NET.sample) { talkReply(e, talkCanned(e, text), roll); return; }
          talkDraw();
        });
  }
  function talkReply(e, j, roll) {
    TALK.busy = false;
    var moods = ['friendly', 'neutral', 'wary', 'hostile'];
    if (moods.indexOf(j.mood) >= 0) e.talk.mood = j.mood;
    if (j.fact) e.talk.facts.push(String(j.fact).slice(0, 120));
    var note = j.used_roll ? roll.skill + ' d20 ' + roll.r + ' + ' + roll.b + ' = ' + roll.total : '';
    e.talk.lines.push({ who: 'them', text: String(j.say || '…').slice(0, 400), note: note });
    bubble(e, String(j.say || '…').replace(/\*[^*]*\*/g, '').trim().slice(0, 220) || '…', TALK.whisper);
    if (j.used_roll && roll && roll.total >= 13) skillUse(roll.skill);
    if (j.outcome === 'calm' && !e.calm) { setTimeout(function () { overcome(e); }, 1500); e.calm = true; e.talk.lines.push({ who: 'sys', text: (e.npc ? personaOf(e).name : e.name) + ' will not fight you.' }); if (typeof cbHUD === 'function') cbHUD(); if (CB.on && !CB.enemies.some(function (q) { return !q.dead && !q.calm && CB.order.indexOf(q) >= 0; })) cbEnd(true); }
    if (j.outcome === 'fight' && !e.npc) { e.calm = false; e.talk.mood = 'hostile'; talkDraw(); talkStore(e); setTimeout(function () { talkClose(); if (!CB.on) cbStart('Words failed. Steel next.', e); }, 1400); return; }
    talkStore(e); if (TALK.e === e) talkDraw();
  }
  // no Claude available: stock lines so the option still works
  function talkCanned(e, text) {
    var t = (text || '').toLowerCase(), roll = talkRoll(), win = roll.total >= (e.kind === 'imp' && !e.npc ? 15 : 12);
    if (e.npc) return { say: !text ? 'Oh! Talent! Hi! Welcome to the Safe Room. I\'m Pip, production. No hitting in here, please. Please don\'t die before the break.' : (/stairs|exit|down/.test(t) ? 'Stairs are far east, past the grotto, behind security. Don\'t tell him I said "behind."' : (/monster|puglin|imp|guard/.test(t) ? 'Two puglins and one very tired security imp. The imp takes bribes. You did not hear that from me.' : 'Uh huh, totally, love that. Great energy. Keep doing that on camera.')), mood: 'friendly', outcome: 'hint' };
    if (!text) return { say: e.kind === 'imp' ? 'Keep walking, pal. Or don\'t. I get paid either way.' : 'Grik see you. Grik hungry.', mood: e.talk.mood, outcome: 'none' };
    if (/stupid|ugly|idiot|die/.test(t)) return { say: '*bristles* Wrong thing to say.', mood: 'hostile', outcome: 'fight' };
    return win ? { say: e.kind === 'imp' ? 'Fine. I\'m on break. You never saw me.' : 'Grik... okay. Grik sit.', mood: 'neutral', outcome: 'calm', used_roll: true } : { say: e.kind === 'imp' ? 'Nice try, pal.' : 'Grik not trust soap-man.', mood: 'wary', outcome: 'none', used_roll: true };
  }
