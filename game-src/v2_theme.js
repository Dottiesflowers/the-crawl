
  // ===================== theme: Iron & Parchment (classic D&D chrome; the System keeps its own voice in the text) =====================
  (function () {
    var fl = document.createElement('link'); fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap';
    document.head.appendChild(fl);
    var P0 = '#E6D7B5', INK = '#2B1D12', OX = '#7A1F1A', BR = '#a07a3e', LT = '#EFE3C6';
    var parch = 'background-color:' + P0 + ';background-image:radial-gradient(circle at 20% 15%,rgba(255,250,235,.55),transparent 55%),radial-gradient(circle at 85% 90%,rgba(120,80,40,.22),transparent 60%);color:' + INK + ';';
    var iron = 'background-color:#232327;background-image:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.25));color:' + LT + ';';
    var css = document.createElement('style');
    css.textContent = [
      ':root{--neon:#E0B868;--hot:#c0392b;--panel:rgba(30,28,30,.94);--line:rgba(160,122,62,.55)}',
      'html,body{font-family:"EB Garamond",Georgia,serif}',
      '.hud{text-transform:none;letter-spacing:0}',
      // zone plaque
      '#title{left:50%;top:6px;transform:translateX(-50%);' + iron + 'border:0;border-top:1px solid ' + BR + ';border-bottom:1px solid ' + BR + ';border-radius:0;padding:3px 16px 4px;font-family:Cinzel,serif;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#C9B48A;text-align:center;white-space:nowrap}',
      '#title b{display:block;font-size:13.5px;letter-spacing:.06em;color:' + LT + ';text-transform:none}',
      'body.cb #title{display:none}',
      // read-aloud / System box
      '#sys{top:52px;' + parch + 'border:0;border-left:4px solid ' + OX + ';border-right:4px solid ' + OX + ';border-radius:0;box-shadow:0 4px 12px rgba(0,0,0,.6);font-size:14.5px;line-height:1.3;font-style:italic;width:min(400px,60vw)}',
      '@media (min-width:1000px) and (min-height:600px){#sys{width:min(620px,48vw) !important;font-size:18px !important;line-height:1.38 !important;padding:12px 18px !important}#sys .tag{font-size:15px !important}body.cb #sys{width:min(420px,28vw) !important;font-size:16px !important;max-height:150px !important}}',
      '#sys .tag{font-family:Cinzel,serif;font-style:normal;font-weight:800;color:' + OX + ';font-size:12px;letter-spacing:.06em;text-transform:none}',
      'body.cb #sys{top:auto;bottom:12px;left:12px;transform:none;width:min(234px,30vw);font-size:13px;max-height:78px;overflow:hidden}',
      // character card
      '#hpbox{left:10px;top:8px;width:214px;padding:7px 11px 8px;' + parch + 'border:2px solid #2e2116;outline:1px solid ' + BR + ';outline-offset:-6px;border-radius:3px;box-shadow:0 4px 12px rgba(0,0,0,.6);display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 6px;text-transform:none;letter-spacing:0;font-size:13px}',
      '#hpTxt{display:contents}',
      '#hpbox .nm{order:1;font-family:Cinzel,serif;font-weight:800;font-size:14.5px;flex:1}',
      '#hpbox .lv{order:2;font-style:italic;font-size:12px;color:#5a4430;margin-right:22px}',
      '#hpbox .hpn{order:3;width:100%;font-weight:700;font-size:12.5px}#hpbox .hpn b,#hpbox .xp b{font-family:Cinzel,serif;font-size:10.5px;color:' + OX + ';margin-right:3px}',
      '#hpbox .hb{order:4;width:calc(100% - 22px);height:10px;margin:0;border-radius:0;background:#c4ad80;border:1px solid #2e2116}',
      '#hpbox .hb i{background:linear-gradient(180deg,#a83228,#74180f)}',
      '#hpbox .xp{order:5;width:calc(100% - 22px);position:relative;font-size:11.5px;color:#5a4430;padding-bottom:5px}#hpbox .xp b{color:#6b5a3a}',
      '#hpbox .xp i{position:absolute;left:0;bottom:0;height:3px;background:#8a6a2e}#hpbox .xp:after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(138,106,46,.25)}',
      '#hpbox .ac{position:absolute;right:-12px;top:26px;width:38px;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;' + iron + 'border:2px solid ' + BR + ';border-radius:4px 4px 19px 19px;font-family:Cinzel,serif;font-size:8.5px;color:#C9B48A}',
      '#hpbox .ac b{font-size:16px;line-height:1;color:' + LT + '}',
      // top-right buttons, minimap, camera
      '#explored,#sight{display:none}',
      '#stats .hbtn,#gearBtn,.hbtn{' + iron + 'border:1px solid #8a7a5a !important;border-radius:3px !important;font-family:Cinzel,serif !important;font-weight:700;letter-spacing:.06em !important;text-transform:none !important;font-size:12px !important;color:' + LT + ' !important;padding:7px 12px !important;min-height:34px}',
      '#mini{border:2px solid ' + BR + ' !important;border-radius:4px !important;box-shadow:0 0 0 1px #2e2116,0 4px 12px rgba(0,0,0,.6);background:rgba(20,16,12,.8) !important}',
      '#camBar button{' + iron + 'border:1px solid #6b5a3a !important;color:' + LT + ' !important}',
      // joystick
      '#stick{background:rgba(10,8,6,.3);border:3px double rgba(160,122,62,.65)}',
      '#knob{' + iron + 'border:1px solid ' + BR + '}',
      // explore action bar
      '#bar{align-items:flex-end}',
      '#bar .act{' + iron + 'border:1px solid #8a7a5a;border-radius:50%;width:50px;height:50px;min-width:0;padding:0;font-family:Cinzel,serif;font-size:9.5px;letter-spacing:.02em;text-transform:none}',
      '#aTry{border-color:#7A1F1A !important;color:#F3C8B0 !important;font-style:italic}',
      '#bar .act.on{background:#5a4420}#bar .act.held{border-color:#E0B868;color:#E0B868}',
      '#aInteract{order:9;width:62px !important;height:62px !important;background:radial-gradient(circle at 40% 35%,#a8302a,#5e1410) !important;border:3px solid #3a0c08 !important;color:#F3E6CC !important;font-size:10.5px !important;font-weight:800;box-shadow:0 4px 12px rgba(0,0,0,.6)}',
      // belt hot bar
      '#hotbar{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:10px;display:flex;gap:12px;padding:5px 10px 7px;background:linear-gradient(180deg,#5a3a22,#3a2414);border:1px solid #1e130a;border-radius:4px;box-shadow:0 4px 10px rgba(0,0,0,.6)}',
      '#hotbar .hb small{display:block;font-family:Cinzel,serif;font-size:10px;letter-spacing:.06em;color:#E9DCC0;margin:0 0 3px 2px}#hotbar .hb small em{font-family:"EB Garamond",serif;font-style:italic;color:#C9B48A;margin-left:6px;letter-spacing:0}',
      '#hotbar .hs{display:flex;gap:4px}#hotbar button{position:relative;width:54px;height:54px;padding:2px;' + parch + 'border:1px solid #1e130a;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center}',
      '#hotbar button:disabled{opacity:.45;cursor:default}#hotbar button.ready{border-color:#E0B868;box-shadow:0 0 0 1px #E0B868}#hotbar button.fire{box-shadow:inset 0 -6px 10px -4px rgba(230,110,30,.75)}#hotbar button.fire.ready{box-shadow:0 0 0 1px #E0B868,inset 0 -6px 10px -4px rgba(230,110,30,.75)}',
      '#hotbar svg{width:30px;height:30px}#hotbar b{position:absolute;right:3px;bottom:1px;color:' + INK + ';font-family:"EB Garamond",serif;font-size:13px}#hotbar i{position:absolute;left:4px;top:1px;font-style:normal;font-size:10px;color:#6b5a3a}#hotbar .hn{display:none}',
      '@media (min-width:1000px) and (min-height:600px){#hotbar button{width:66px;height:66px}#hotbar svg{width:38px;height:38px}#hotbar .hb small{font-size:11.5px}#hotbar b{font-size:14px}}',
      '@media (max-width:700px){#hotbar{left:8px;transform:none;bottom:auto;top:150px;padding:4px;gap:4px}#hotbar .hs{flex-direction:column}#hotbar button{width:46px;height:46px}#hotbar svg{width:26px;height:26px}#hotbar .hb small em{display:none}#hotbar .hb small{font-size:8px;max-width:46px;overflow:hidden}}',
      'body.cb #hotbar{bottom:96px}',
      '#buffs{position:fixed;z-index:5;left:10px;top:96px;display:flex;flex-wrap:wrap;gap:4px;max-width:240px}',
      '#buffs .bf{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;' + iron + 'border:1px solid ' + BR + ';border-radius:12px;font-family:"EB Garamond",serif;font-size:12.5px}#buffs .bf b{font-size:12px}#buffs .bf i{font-style:normal;color:#C9B48A;font-size:11px}#buffs .bf.bad{border-color:#8a3a32;color:#f0b0a0}',
      '#buffs .bf.sw{' + parch + 'border:1px solid #2e2116;height:28px;font-weight:700;cursor:pointer}#buffs .bf.sw b{color:#7A1F1A}',
      'body.cb #buffs{top:96px}',
      // weapon set
      '#wset{position:fixed;z-index:6;right:16px;bottom:92px;width:150px;height:92px;pointer-events:none}',
      'body.cb #wset{right:auto;left:12px;bottom:96px}',
      '#wset .wb{position:absolute;right:0;top:0;width:100px;padding:4px 7px;' + iron + 'border:1px solid #6b5a3a;border-radius:3px;transform:rotate(3deg);font-size:12px;line-height:1.15}',
      '#wset .wh{position:absolute;left:0;bottom:0;width:104px;padding:5px 7px;' + parch + 'border:2px solid #2e2116;border-radius:3px;box-shadow:0 3px 8px rgba(0,0,0,.6);line-height:1.1}',
      '#wset small{display:block;font-family:Cinzel,serif;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#C9B48A}#wset .wh small{color:' + OX + '}',
      '#wset .wh b{display:block;font-size:13px}#wset .wh span{font-size:11.5px;color:#5a4430}#wset i{color:#9a8a6a}',
      '#wSwap{pointer-events:auto;position:absolute;right:0;bottom:0;width:44px;height:44px;border-radius:50%;' + iron + 'border:2px solid #E0B868;display:flex;align-items:center;justify-content:center}#wSwap:disabled{opacity:.4;border-color:#6b5a3a}',
      // combat: initiative bar
      '#turns{left:236px !important;top:0 !important;transform:none;flex-direction:row !important;align-items:center !important;gap:2px !important;padding:3px 8px;' + iron + 'border:1px solid ' + BR + ';border-top:0;border-radius:0 0 6px 6px;box-shadow:0 3px 8px rgba(0,0,0,.5);text-transform:none !important;letter-spacing:0 !important;max-width:calc(100vw - 556px);overflow-x:auto;height:34px}',
      '#turns .rnd{display:flex;align-items:baseline;gap:3px;padding-right:6px;margin-right:2px;border-right:1px solid #5A4A30;font-family:Cinzel,serif}#turns .rnd small{font-size:8px;letter-spacing:.12em;color:#C9B48A;text-transform:uppercase}#turns .rnd b{font-size:14px;line-height:1;color:' + LT + '}',
      '#turns .ini{position:relative;display:flex;align-items:center;padding:1px;border-radius:50%;border:1px solid transparent}',
      '#turns .ini .pf{width:24px;height:24px;border-radius:50%;border:2px solid #8a3a32;background:#2a1614;display:flex;align-items:center;justify-content:center;color:#e08a78;font-family:Cinzel,serif;font-weight:800;font-size:11px}#turns .ini .pf svg{width:13px;height:13px}',
      '#turns .ini.me .pf{border-color:#E0B868;background:#3a3238;color:#F3E6CC}',
      '#turns .ini.cur{border-color:#E0B868;background:rgba(160,122,62,.3)}#turns .ini.cur .pf{box-shadow:0 0 8px rgba(224,184,104,.8)}',
      '#turns .ini .hp{position:absolute;left:4px;right:4px;bottom:-1px;height:2px;background:#3a1410}#turns .ini .hp i{display:block;height:100%;background:#c0392b}',
      '#turns .ini small{display:none}#turns .ini.cur small{display:block;margin-left:4px;font-family:Cinzel,serif;font-size:9px;color:#E0B868;white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis}',
      '#turns .ini.cur{border-radius:14px;padding-right:6px}',
      '#turns .ini.dead{opacity:.35}#turns .ini.dead .pf{filter:grayscale(1)}#turns .ini.calm .pf{border-color:#5a8a5a;color:#9ad09a}',
      '#turns .ini.join{opacity:.7}#turns .ini.join .pf{border-style:dashed;border-color:#6b5a3a;color:#C9B48A}',
      '#turns span.arr{color:#6b5a3a;font-size:11px;padding:0;background:none;border:0}',
      '@media (min-width:1000px) and (min-height:600px){#turns{height:62px !important;padding:4px 12px !important;gap:6px !important;left:250px !important}#turns .rnd b{font-size:22px}#turns .rnd small{font-size:10px}#turns .ini{flex-direction:column;border-radius:8px !important;padding:2px 4px !important}#turns .ini .pf{width:38px;height:38px;font-size:16px}#turns .ini .pf svg{width:20px;height:20px}#turns .ini small,#turns .ini.cur small{display:block;margin:1px 0 0;font-family:Cinzel,serif;font-size:10px;color:#C9B48A;max-width:74px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#turns .ini.cur small{color:#E0B868}#turns .ini .hp{bottom:14px;height:3px}#turns span.arr{font-size:15px}}',
      '#res{left:236px !important;right:auto !important;top:36px !important;bottom:auto !important;transform:none;display:none;gap:12px;' + iron + 'border:1px solid #5A4A30 !important;border-radius:12px !important;padding:1px 10px !important;font-family:Cinzel,serif;font-size:9.5px !important;letter-spacing:.06em !important;text-transform:none !important;color:#6b5a3a !important}',
      '#res .turnlbl{font-weight:800;color:#C9B48A}#res .turnlbl.on{color:#E0B868}#res.on{display:flex !important}@media (min-width:1000px) and (min-height:600px){#res{top:70px !important;left:250px !important;font-size:13px !important;padding:4px 14px !important;gap:16px !important}#res i{width:12px !important;height:12px !important}}#res span{display:flex;align-items:center;gap:5px}#res span.on{color:#E9DCC0}',
      '#res i{width:9px;height:9px;display:inline-block;opacity:.3}#res span.on i{opacity:1}#res .pa{border-radius:50%;background:#c0392b}#res .pb{transform:rotate(45deg);background:#c9952e}#res .pm{border-radius:2px;background:#8a8a90}#res .ps{border-radius:50%;background:none;border:2px solid #E0B868;width:8px;height:8px}',
      // combat action bar
      '#cbBar.on{display:grid !important;grid-template-columns:82px 82px 124px;grid-auto-rows:46px;gap:6px;max-width:none}',
      '#cbBar .act{width:100%;height:100% !important}#cbAtk{grid-column:3;grid-row:1 / span 2}#cbEnd{grid-column:1 / span 2}',
      '#cbBar .act{' + parch + 'border:1px solid #2e2116;border-radius:3px;height:40px;font-family:"EB Garamond",serif;font-weight:700;font-size:13px;letter-spacing:0;text-transform:none}',
      '#cbBar .act small{font-size:11px;opacity:.8;letter-spacing:0}',
      '#cbAtk{width:124px !important;height:98px !important;background:radial-gradient(circle at 50% 30%,#a8302a,#5e1410) !important;border:3px solid #2e0a06 !important;color:#F3E6CC !important;font-family:Cinzel,serif !important;font-size:17px !important;font-weight:800 !important;letter-spacing:.06em !important;box-shadow:0 4px 12px rgba(0,0,0,.6)}',
      '#cbAtk small{font-family:"EB Garamond",serif;font-weight:700;font-size:12.5px !important;color:#f0c8b8;opacity:1 !important}',
      '#cbEnd{' + iron + 'border:1px solid #8a7a5a !important;font-family:Cinzel,serif !important;font-size:11px !important;letter-spacing:.1em !important}',
      // dice panel
      '#dice{position:fixed;z-index:9;left:50%;top:60px;transform:translate(-50%,-6px) scale(.86);transform-origin:top center;display:flex;align-items:center;gap:10px;padding:6px 12px 6px 9px;cursor:pointer;' + parch + 'border:2px solid #2e2116;box-shadow:0 6px 18px rgba(0,0,0,.7);opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap}',
      '#dice.on{pointer-events:auto}',
      '#dice.on{opacity:1;transform:translate(-50%,0) scale(.86)}#dice.foe{border-color:#5e1410}',
      '#dice .dl{font-family:Cinzel,serif;font-size:9.5px;letter-spacing:.16em;color:#6b5a3a;text-transform:uppercase}',
      '#dice .dt{font-family:Cinzel,serif;font-weight:800;font-size:18px;line-height:1.05}#dice .dt em{font-style:normal;color:' + OX + '}#dice .dt em.miss{color:#5a4430}',
      '#dice .ds{font-size:12.5px;color:#4a3826}#dice .sep{width:1px;align-self:stretch;background:#b8a070}',
      '#dice svg.roll{animation:dRoll .45s ease-out}@keyframes dRoll{0%{transform:rotate(-200deg) scale(.6)}100%{transform:rotate(0) scale(1)}}',
      'body.cb #dice{top:58px}','#sys.on{pointer-events:auto;cursor:pointer}',
      // menus and panels
      '#menu,#cbMenu{' + parch + 'border:2px solid #2e2116 !important;border-radius:3px !important;box-shadow:0 6px 18px rgba(0,0,0,.7) !important}',
      '#menu .mh,#cbMenu .mh{font-family:Cinzel,serif;color:' + OX + ' !important;letter-spacing:.08em !important}',
      '#menu button,#cbMenu button{color:' + INK + ' !important;border-top:1px solid rgba(43,29,18,.18) !important;font-family:"EB Garamond",serif !important;font-size:14px !important}',
      '#menu button i,#cbMenu button i{color:' + OX + ' !important;font-size:11.5px !important}#menu button:disabled,#cbMenu button:disabled{color:#9a8a6a !important}',
      // gear & pack
      '#bag{background:linear-gradient(180deg,#4a2e1a,#2c1a0e) !important;border:2px solid #2e2116 !important;border-radius:6px !important;color:' + INK + ' !important;font-family:"EB Garamond",serif !important;flex-direction:column}',
      '#bag header{' + iron + 'border-bottom:2px solid ' + BR + ' !important}#bag header b{font-family:Cinzel,serif;font-weight:800;font-size:14px !important;letter-spacing:.06em !important;color:' + LT + ' !important;text-transform:none !important;flex:1}',
      '#bag header .gp{font-family:Cinzel,serif;font-weight:700;color:#E0B868;font-size:13px}',
      '#bag .xbtn{' + iron + 'border:1px solid #6b5a3a !important;color:' + LT + ' !important;font-family:Cinzel,serif;border-radius:3px !important}',
      '#bagBody{display:flex !important;gap:10px;padding:10px;flex:1;min-height:0}',
      '#bag .eq{position:relative;width:min(352px,44%);flex:none;display:flex;gap:8px;padding:10px;' + parch + 'border:2px solid #2e2116;border-radius:3px;box-shadow:inset 0 0 30px rgba(90,60,30,.35);overflow:hidden}',
      '#bag .eqL,#bag .eqR{display:flex;flex-direction:column;gap:7px;width:92px;flex:none}',
      '#bag .eqC{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}',
      '#heroPic{width:100%;max-width:150px;aspect-ratio:2/3;border:3px solid #2e2116;border-radius:75px 75px 4px 4px;box-shadow:0 0 0 2px ' + BR + ',0 6px 14px rgba(0,0,0,.45);background:#1a1410}',
      '#bag .eqStat{font-family:Cinzel,serif;font-size:10px;letter-spacing:.08em;color:#5a4430}',
      '#bag .eqs{display:block;text-align:left;padding:4px 6px;background:rgba(255,250,235,.5);border:1px solid #6b5a3a;border-radius:3px;font-family:"EB Garamond",serif;font-size:12.5px;line-height:1.15;color:' + INK + ';min-height:40px}',
      '#bag .eqs small{display:block;font-family:Cinzel,serif;font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:#6b5a3a}#bag .eqs em{display:block;font-style:normal;font-size:11.5px;color:#5a4430}',
      '#bag .eqs.empty{background:transparent;border-style:dashed;color:#6b5a3a}#bag .eqs.on{border:2px solid ' + OX + ';background:#F3E9D2}',
      '#bag .eqs.main{background:#F3E9D2;border:2px solid ' + OX + '}#bag .eqs.main small{color:' + OX + '}',
      '#bag .eqSwap{align-self:center;height:34px;padding:0 12px;' + iron + 'border:2px solid ' + BR + ';border-radius:17px;font-family:Cinzel,serif;font-weight:700;font-size:11px;display:flex;align-items:center;gap:5px}#bag .eqSwap:disabled{opacity:.4}',
      '#bag .eqHint{position:absolute;left:10px;right:10px;bottom:4px;margin:0;font-style:italic;font-size:11.5px;color:#5a4430;text-align:center}',
      '#bag .pk{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;padding:9px 10px;' + parch + 'border:2px solid #2e2116;border-radius:3px;box-shadow:inset 0 0 30px rgba(90,60,30,.35)}',
      '#bagTools{display:flex;flex-wrap:wrap;gap:4px;padding:0 !important;border:0 !important}',
      '#bagQ{width:92px;height:30px;padding:0 8px;background:rgba(255,250,235,.6) !important;border:1px solid #6b5a3a !important;border-radius:3px;color:' + INK + ' !important;font-family:"EB Garamond",serif;font-size:13px}',
      '#bag .chip2{height:30px;padding:0 9px;background:transparent !important;border:1px solid #6b5a3a !important;border-radius:15px !important;color:#4a3826 !important;font-family:"EB Garamond",serif !important;font-size:12.5px !important;text-transform:none !important;letter-spacing:0 !important}',
      '#bag .chip2.on{background:#3a2a1a !important;color:#F3E6CC !important}',
      '#bagList{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:5px;overflow-y:auto;max-height:none !important;flex:1;align-content:start;border:0 !important;padding:0 !important}',
      '#bagList button{position:relative;display:flex !important;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:62px;padding:4px !important;background:rgba(255,250,235,.45) !important;border:1px solid #6b5a3a !important;border-radius:3px !important;color:' + INK + ' !important;font-family:"EB Garamond",serif;font-weight:600;font-size:12px !important;line-height:1.1;text-align:center}',
      '#bagList button.magic,#bagList button.r-uncommon{box-shadow:inset 0 0 0 2px #3a6ea8}#bagList button.r-rare{box-shadow:inset 0 0 0 2px #7a3ab8}#bagList button.r-legendary{box-shadow:inset 0 0 0 2px #c9952e}',
      '#bagList button.on{background:#F3E9D2 !important;border:2px solid #2e2116 !important}#bagList button svg{width:22px;height:22px}',
      '#bagList .tag{position:absolute;top:2px;right:3px;font-family:Cinzel,serif;font-size:8px;letter-spacing:.06em;color:' + OX + ' !important;background:none !important;border:0 !important;padding:0 !important}',
      '#bagInfo{padding:7px 10px !important;background:rgba(255,250,235,.55) !important;border:1px solid #6b5a3a !important;border-radius:3px;color:' + INK + ' !important;max-height:132px;overflow-y:auto}',
      '#bagInfo h3{margin:0;font-family:Cinzel,serif;font-weight:800;font-size:14px;color:' + INK + ' !important}#bagInfo p{margin:2px 0;font-size:13px;color:' + INK + ' !important}#bagInfo small{color:' + OX + ' !important;font-size:12px}',
      '#bagInfo .acts{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}',
      '#bagInfo .ccBtn{height:34px;padding:0 12px;' + iron + 'border:1px solid #8a7a5a !important;border-radius:3px !important;font-family:Cinzel,serif !important;font-weight:700;font-size:11.5px !important;text-transform:none !important;letter-spacing:.04em !important}',
      '#bagInfo .ccBtn[data-act=wield]{background:' + OX + ' !important;border-color:#3a0c08 !important;color:#F3E6CC !important}',
      '@media (max-height:420px){#bag .eqHint{display:none}#heroPic{max-width:120px}}',
      '#bagList .qn{position:absolute;right:4px;bottom:2px;font-family:Cinzel,serif;font-size:11px;color:' + OX + '}',
      // big screens: bigger tiles and text, a sensibly sized info panel
      '@media (min-width:1000px) and (min-height:600px){#bagList{grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:7px}#bagList button{height:92px;font-size:14.5px !important}#bagList button svg{width:34px;height:34px}#bagList .tag{font-size:10px}#bagList .qn{font-size:13px}#bag .eqs{font-size:14.5px;min-height:52px}#bag .eqs small{font-size:10px}#bag .eqL,#bag .eqR{width:130px}#bag .eq{width:min(470px,40%)}#heroPic{max-width:210px}#bagInfo{max-height:220px;font-size:15px}#bagInfo h3{font-size:17px}#bagInfo p{font-size:15px !important}#bag .chip2{height:34px;font-size:14px !important}#bagQ{height:34px;font-size:15px;width:160px}#bag header b{font-size:17px !important}}',
      // jury-rig
      '#craft{position:fixed;inset:10px;z-index:31;display:none;flex-direction:column;background:linear-gradient(180deg,#4a2e1a,#2c1a0e);border:2px solid #2e2116;border-radius:6px;font-family:"EB Garamond",serif;color:' + INK + '}#craft.on{display:flex}',
      '#craft header{display:flex;align-items:center;gap:8px;padding:6px 10px;' + iron + 'border-bottom:2px solid ' + BR + '}#craft header b{font-family:Cinzel,serif;font-size:15px;flex:1}#craft header span{font-family:Cinzel,serif;font-size:11px;color:#C9B48A}',
      '#craft .xbtn{' + iron + 'border:1px solid #6b5a3a !important;color:' + LT + ' !important;font-family:Cinzel,serif;border-radius:3px;height:34px;padding:0 12px}',
      '#craft .cb{flex:1;display:flex;gap:10px;padding:10px;min-height:0}',
      '#craft .cpick,#craft .crec{' + parch + 'border:2px solid #2e2116;border-radius:3px;padding:9px 10px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;min-width:0}#craft .cpick{flex:1}#craft .crec{width:min(300px,38%)}',
      '#craft h3{margin:0;font-family:Cinzel,serif;font-size:12px;letter-spacing:.08em;color:' + OX + '}',
      '#craft .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:5px}',
      '#craft .cgrid button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px;min-height:58px;background:rgba(255,250,235,.45);border:1px solid #6b5a3a;border-radius:3px;font-family:"EB Garamond",serif;font-size:12px;color:' + INK + ';line-height:1.1}',
      '#craft .cgrid button.on{background:#F3E9D2;border:2px solid ' + OX + '}#craft .cgrid svg{width:20px;height:20px}#craft .cgrid i{font-size:10px;color:#7A1F1A}',
      '#craft label{font-family:Cinzel,serif;font-size:11px;color:#5a4430;margin-top:4px}#craft input{height:38px;padding:0 10px;border:1px solid #6b5a3a;border-radius:3px;background:rgba(255,250,235,.7);font-family:"EB Garamond",serif;font-size:15px}',
      '#craft .go{height:44px;border:0;border-radius:3px;background:radial-gradient(circle at 50% 30%,#a8302a,#5e1410);color:#F3E6CC;font-family:Cinzel,serif;font-weight:800;font-size:14px}#craft .go:disabled{opacity:.45}',
      '#craft .hint{margin:0;font-style:italic;font-size:12.5px;color:#5a4430}',
      '#cblog{position:fixed;z-index:6;right:16px;bottom:140px;width:min(320px,40vw);max-height:42vh;overflow:hidden;display:none;padding:6px 10px;background:rgba(20,14,8,.78);border:1px solid #5A4A30;border-radius:4px;color:#E9DCC0;font-family:"EB Garamond",serif;font-size:12.5px;pointer-events:none}#cblog.on{display:block}#cblog h4{margin:0 0 3px;font-family:Cinzel,serif;font-size:10px;letter-spacing:.08em;color:#C9B48A}#cblog p{margin:0 0 4px;opacity:.6;line-height:1.25}#cblog p.new{opacity:1}#cblog b{font-family:Cinzel,serif;font-size:.85em;color:#E0B868}@media (min-width:1000px) and (min-height:600px){#cblog{font-size:15px;width:380px}#cblog h4{font-size:12px}}@media (max-width:700px){#cblog{display:none !important}}',
      '.floater.status{color:#ffd860;font-family:Cinzel,serif;font-size:14px;letter-spacing:.05em}@media (min-width:1000px) and (min-height:600px){.floater{font-size:20px !important}.floater.status{font-size:18px !important}}',
      '#bagInfo .traits{margin:4px 0}#bagInfo .traits b{color:#7A1F1A;font-family:Cinzel,serif;font-size:.85em}#bagInfo .traits .unk{color:#8a7a5a;font-style:italic}',
      '@media (min-width:1000px) and (min-height:600px){.ebar{width:120px !important;font-size:13.5px !important;font-family:Cinzel,serif;font-weight:700;letter-spacing:.03em !important;color:#ffe6d8 !important;text-shadow:0 1px 3px #000,0 0 6px #000 !important;white-space:nowrap}.ebar i{width:80px !important;height:7px !important;margin:0 auto 3px !important}}',
      '#craft .ctools{display:flex;flex-wrap:wrap;gap:5px;align-items:center}#craft .ctools input{flex:1 1 220px;min-width:0}#craft .chip2{height:30px;padding:0 10px;border:1px solid #6b5a3a;border-radius:15px;background:rgba(255,250,235,.45);font-family:"EB Garamond",serif;font-size:13px;color:' + INK + '}#craft .chip2.on{background:#2b1d12;color:#F3E6CC}',
      '#craft .cgrid{flex:1;min-height:120px;overflow-y:auto;align-content:start}#craft .cgrid button{position:relative}#craft .cgrid button:disabled{opacity:.4}#craft .cgrid .qn{position:absolute;right:4px;bottom:2px;font-size:11px;color:#7A1F1A}',
      '#craft .cbottom{display:flex;flex-direction:column;gap:6px;border-top:1px solid rgba(43,29,18,.25);padding-top:6px}',
      '#craft .csel{display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-height:44px;padding:6px;border:1px dashed #6b5a3a;border-radius:3px;background:rgba(255,250,235,.3)}#craft .csel h3{width:100%}#craft .csel h3 small{color:#6b5a3a;font-size:10px}',
      '#craft .cs{display:flex;align-items:center;gap:5px;height:34px;padding:0 8px;background:#F3E9D2;border:2px solid ' + OX + ';border-radius:3px;font-family:"EB Garamond",serif;font-size:14px;color:' + INK + '}#craft .cs svg{width:18px;height:18px}#craft .cs b{color:' + OX + ';font-size:16px;margin-left:2px}',
      '@media (min-width:1000px) and (min-height:600px){#craft .cgrid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}#craft .cgrid button{min-height:84px;font-size:14.5px}#craft .cgrid svg{width:30px;height:30px}#craft .cgrid i{font-size:11.5px}#craft .crec{width:min(360px,30%)}#craft .rc b{font-size:15px}#craft .rc span{font-size:13.5px}}',
      '#craft .rc{display:flex;align-items:center;gap:6px;padding:5px 0;border-top:1px solid rgba(43,29,18,.15)}#craft .rc>div{flex:1;min-width:0}#craft .rc small{font-family:Cinzel,serif;font-size:9.5px;color:#6b5a3a}#craft .rc span{display:block;font-size:12px;color:#4a3826}#craft .rc.off{opacity:.6}',
      '#craft .ccBtn{height:34px;padding:0 10px;' + iron + 'border:1px solid #8a7a5a;border-radius:3px;font-family:Cinzel,serif;font-size:11px;color:' + LT + '}#craft .ccBtn:disabled{opacity:.6}',
      '@media (max-width:700px){#craft .cb{flex-direction:column;overflow-y:auto}#craft .crec{width:auto}}',
      // other dialogs: same parchment family
      '#lootw,#talk,#mapFull,#tryBox,#deadBox{border-color:' + BR + ' !important}',
      '#lootw header b,#talk header b,#mapFull header b{font-family:Cinzel,serif;color:#E0B868 !important;letter-spacing:.08em}'
    ].join('\n');
    document.head.appendChild(css);
    var ws = document.createElement('div'); ws.id = 'wset'; document.body.appendChild(ws);
    var bf = document.createElement('div'); bf.id = 'buffs'; document.body.appendChild(bf); setTimeout(buffDraw, 500);
    var dc = document.createElement('div'); dc.id = 'dice'; dc.setAttribute('role', 'status'); dc.setAttribute('aria-live', 'polite'); document.body.appendChild(dc);
    dc.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); dc.classList.remove('on'); });
    var sy = document.getElementById('sys'); if (sy) sy.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); sy.classList.remove('on'); });
    setInterval(function () { var el = document.getElementById('wset'); if (el) el.style.display = !CHAR || gearOpen || CC || AUTH.open || UI.bag || UI.map || (typeof CS !== 'undefined' && CS.open) ? 'none' : ''; }, 300);
    setInterval(function () { if (typeof CB !== 'undefined' && !CB.on && typeof cbHUD === 'function') try { cbHUD(); } catch (e) {} try { buffDraw(); } catch (e) {} try { var sb = document.getElementById('aSight'), t = lampWorn() ? (lampLit() ? 'Lamp off' : 'Lamp on') : 'Torch'; if (sb && sb.textContent !== t) sb.textContent = t; } catch (e) {} }, 1000);
    setTimeout(wsetDraw, 0);
  })();

  // ---------- the dice panel: every attack shows its d20 and damage dice ----------
  function dieSVG(sides, n, cls) {
    var shape = sides === 20 ? '<polygon points="24,2 45,14 45,34 24,46 3,34 3,14" fill="#7A1F1A" stroke="#2e0a06" stroke-width="2"/><polygon points="24,9 39,33 9,33" fill="#8f2a22" stroke="#d89080" stroke-width=".8"/>'
      : sides === 4 ? '<polygon points="24,4 44,42 4,42" fill="#2e2116" stroke="#000" stroke-width="2"/>'
      : sides === 6 ? '<rect x="7" y="7" width="34" height="34" rx="5" fill="#2e2116" stroke="#000" stroke-width="2"/>'
      : sides === 8 ? '<polygon points="24,3 44,24 24,45 4,24" fill="#2e2116" stroke="#000" stroke-width="2"/>'
      : '<polygon points="24,3 45,19 37,44 11,44 3,19" fill="#2e2116" stroke="#000" stroke-width="2"/>';
    var ty = sides === 4 ? 35 : sides === 20 ? 28 : 29, fs = sides === 20 ? 12 : 14;
    return '<svg class="' + (cls || '') + '" width="' + (sides === 20 ? 52 : 38) + '" height="' + (sides === 20 ? 52 : 38) + '" viewBox="0 0 48 48" role="img" aria-label="d' + sides + ' showing ' + n + '">' + shape + '<text x="24" y="' + ty + '" text-anchor="middle" font-family="Cinzel, serif" font-weight="800" font-size="' + fs + '" fill="#F3E6CC">' + n + '</text></svg>';
  }
  function diceShow(o) {
    var el = document.getElementById('dice'); if (!el) return;
    var adv = /advantage/.test(o.R.txt) ? (/^dis/.test(o.R.txt) ? 'disadvantage ' : 'advantage ') + o.R.txt.split(' ')[1] : '';
    var res = o.crit ? 'Critical!' : o.R.r === 1 ? 'Fumble' : o.hit ? 'Hit' : 'Miss';
    var h = dieSVG(20, o.R.r, 'roll') + '<div><div class="dl">' + esc(o.who) + (o.foe ? ' attacks' : ' attack') + '</div><div class="dt">' + o.R.r + ' + ' + o.bonus + ' = ' + o.tot + ' <em class="' + (o.hit ? '' : 'miss') + '">· ' + res + '</em></div><div class="ds">vs ' + (o.foe ? 'your' : esc(o.vs) + '\'s') + ' AC ' + o.ac + (adv ? ' · ' + adv : '') + (o.why && o.why.length ? ' · ' + esc(o.why.join(', ')) : '') + '</div></div>';
    if (o.hit && o.dm !== undefined) h += '<div class="sep"></div>' + dieSVG(o.ds, o.raw, 'roll') + '<div><div class="dl">Damage · ' + o.dd + '</div><div class="dt">' + o.raw + (o.db ? (o.db > 0 ? ' + ' : ' − ') + Math.abs(o.db) : '') + ' = ' + o.dm + '</div><div class="ds">' + (o.foe ? 'to you' : 'to ' + esc(o.vs)) + '</div></div>';
    el.innerHTML = h; el.classList.toggle('foe', !!o.foe); el.classList.add('on');
    clearTimeout(diceShow.t); diceShow.t = setTimeout(function () { el.classList.remove('on'); }, 3400);
  }

  // ---------- a portrait of your crawler, rendered from the live model for the Gear & Pack screen ----------
  function heroShot(cv) {
    try {
      var w = cv.width, h = cv.height;
      if (!heroShot.rt) { heroShot.rt = new THREE.WebGLRenderTarget(w, h); heroShot.rt.texture.encoding = THREE.sRGBEncoding; heroShot.cam = new THREE.PerspectiveCamera(28, w / h, 0.1, 40); }
      var cam = heroShot.cam, hx = hero.position.x, hz = hero.position.z, a = (rig && rig.rotation ? rig.rotation.y : 0) + hero.rotation.y;
      cam.position.set(hx + Math.sin(a) * 3.4, 1.35, hz + Math.cos(a) * 3.4); cam.lookAt(hx, 0.88, hz);
      var fog = scene.fog; scene.fog = null;
      renderer.setRenderTarget(heroShot.rt); renderer.render(scene, cam);
      var px = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(heroShot.rt, 0, 0, w, h, px); renderer.setRenderTarget(null); scene.fog = fog;
      var g = cv.getContext('2d'), im = g.createImageData(w, h);
      for (var y = 0; y < h; y++) im.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      g.putImageData(im, 0, 0);
    } catch (e) { console.warn('heroShot', e); }
  }
