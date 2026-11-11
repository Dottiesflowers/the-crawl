
  // ===================== kit characters =====================
  // Rigged body, outfits, hair and animation from Quaternius' kits (Universal Base Characters, Modular Character
  // Outfits: Fantasy, Universal Animation Library). Outfit pieces mix freely; colours are the kit's three dyes plus two
  // re-dyes; the face is reshaped by the sliders below. The hand-made figure stays as the fallback "Handmade" model.
  var KDIR = 'kit2/';
  var KIT = { ready: false, on: false, s: 0.72, bones: {}, cat: {}, hair: {}, acts: {}, over: {}, cur: '', tex: {}, attached: [] };
  var KIT_OUTFITS = ['ranger', 'peasant', 'knight', 'noble', 'wizard'];
  var KIT_SW = { ranger: [0x3a6a2a, 0x2a2a2a, 0xc8bca0, 0x2a5a8a, 0x7a2a8a], peasant: [0x5a3a1a, 0x3a3328, 0x3e5f7a, 0x1e2a5a, 0x5a1e6a],
    modern: [0xf2f2ee, 0x1c1c1e, 0x8a8a8c, 0x1f2b4d, 0x9c2a2a, 0x2f5d3a, 0xc2a77c, 0x5a3d2b, 0x3e5f8f, 0x8aa4c4],
    knight: [0xb03030, 0xc8962e, 0x3a5a8a, 0x2f9a5a, 0x2a3fa0], noble: [0x8b2a22, 0x2a4f8a, 0x2f7a3a, 0x2a9aa0, 0x8a2aa0], wizard: [0x2a4a8a, 0x6a2a8a, 0x9a1a1a, 0x4a3a8a, 0x2a6a5a] };
  var KIT_HAIR = [null, 'long', 'simpleparted', 'slickback', 'buzzed', 'balding', 'mohawk', 'ponytail', 'ponytail_2', 'dreads', 'longdreads', 'bob', 'buns'];
  var KIT_BEARD = [[], ['beard'], ['moustache'], ['muttonchops'], ['muttonchops', 'moustache']];
  // modern clothes are shells of the base body (see m_modern): label -> meshes, texture
  // each modern piece has its own painted texture (mp_<key>.jpg) and normal map from tools/modern_clothes2.py; pc[2] = keeps its own colour
  var MOD_PIECES = { 'T-shirt': [['Mod_Top_TShirt', 'tee']], 'Long sleeve': [['Mod_Top_LongSleeve', 'long']], 'Tank top': [['Mod_Top_Tank', 'tank']], 'Hoodie': [['Mod_Top_Hoodie', 'hoodie'], ['Mod_HoodDown', 'hood']],
    'Button-up': [['Mod_Top_ButtonUp', 'button'], ['Mod_Collar', 'collar']], 'Jeans': [['Mod_Legs_Jeans', 'jeans']], 'Shorts': [['Mod_Legs_Shorts', 'shorts']], 'Sweatpants': [['Mod_Legs_Sweatpants', 'sweats']],
    'Sneakers': [['Mod_Feet_Sneakers', 'sneaker'], ['Mod_Feet_SneakerSole', 'sneakersole', 1]], 'Work boots': [['Mod_Feet_Boots', 'boot'], ['Mod_Feet_BootSole', 'bootsole', 1]], 'Beanie': [['Mod_Head_Beanie', 'beanie']], 'Cap': [['Mod_Head_Cap', 'cap'], ['Mod_Head_CapBrim', 'canvas']] };
  var HAT_LABELS = ['Cowboy hat', 'Hard hat', 'Winter hat', 'Santa hat', 'Clown hat', 'Wizard hat', 'Fedora', 'Trilby'];
  var MOD_SLOT = { 'T-shirt': 'kTop', 'Long sleeve': 'kTop', 'Tank top': 'kTop', 'Hoodie': 'kTop', 'Button-up': 'kTop', Jeans: 'kPants', Shorts: 'kPants', Sweatpants: 'kPants', Sneakers: 'kBoots', 'Work boots': 'kBoots', Beanie: 'kHead', Cap: 'kHead' };
  function kitOutfitOf(label) { if (MOD_SLOT[label] || HAT_LABELS.indexOf(label) >= 0) return 'modern'; var w = label.toLowerCase(); if (/crown|gorget|lion/.test(w)) return 'noble'; if (/helm|scarf|plate|tunic|round|spiked/.test(w)) return 'knight'; return w.split(' ')[0]; }
  function kitMode() { return sty('model') === 0; }
  function kitTex(name, color) {
    if (KIT.tex[name]) return KIT.tex[name];
    var t = new THREE.TextureLoader().load(KDIR + name); t.flipY = false; t.anisotropy = 4; t.encoding = THREE.LinearEncoding;
    KIT.tex[name] = t; return t;
  }
  function kitMat(base, n, orm, side) {
    var m = new THREE.MeshStandardMaterial({ map: kitTex(base), normalMap: n ? kitTex(n) : null, roughnessMap: orm ? kitTex(orm) : null, metalnessMap: orm && orm.indexOf('orm') >= 0 ? kitTex(orm) : null,
      roughness: 1, metalness: orm && orm.indexOf('orm') >= 0 ? 0.35 : 0, side: side || THREE.FrontSide });
    m.envMapIntensity = 0; m.color.setScalar(1.25); return m;
  }
  function L0() { return new THREE.GLTFLoader(); }
  // hats (from Michael's Sketchfab downloads, CC-BY; see credits) ride on the head bone like hair
  function kitLoadHats(L) {
    fetch(KDIR + 'hats.json').then(function (r) { return r.json(); }).then(function (pack) {
      Object.keys(pack).forEach(function (label) {
        var bin = atob(pack[label]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        L.parse(u.buffer, KDIR, function (g) {
          var grp = new THREE.Group(); grp.matrixAutoUpdate = false; grp.matrix.copy(KIT.headInv); KIT.bones.Head.add(grp); grp.visible = false;
          g.scene.traverse(function (o) { if (!o.isMesh) return; var m = new THREE.MeshStandardMaterial({ map: o.material.map || null, color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }); if (!o.material.map) m.userData.base = o.material.color.clone(); m.envMapIntensity = 0; if (m.map) m.map.encoding = THREE.LinearEncoding; var c = new THREE.Mesh(o.geometry, m); c.castShadow = true; grp.add(c); });
          if (!g.scene.children.length) return;
          KIT.hats[label] = grp; if (KIT.on && SLOT.kHead.styles[sty('kHead')] === label) buildHero();
        }, function (e) { console.warn('hat failed', label, e); });
      });
    }).catch(function (e) { console.warn('hats failed', e); });
  }
  function kitLoad() {
    if (!THREE.GLTFLoader) return;
    var L = new THREE.GLTFLoader(), names = KIT_OUTFITS.map(function (o) { return 'o_' + o; }).concat(['o_knightcloth', 'm_modern', 'head', 'anims', 'h_browsthick', 'h_beard', 'h_moustache', 'h_muttonchops']).concat(KIT_HAIR.filter(Boolean).map(function (h) { return 'h_' + h; }));
    var got = {}, n = 0, failed = false;
    names.forEach(function (nm) {
      function bad(e) { failed = true; console.warn('kit load failed: ' + nm, e); }
      fetch(KDIR + nm + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
        var bin = atob(j.glb), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        L.parse(u.buffer, KDIR, function (g) { got[nm] = g; if (++n === names.length && !failed) { try { kitAssemble(got); } catch (e) { console.warn('kit assemble failed', e); } } }, bad);
      }).catch(bad);
    });
  }
  // ---------- face shaping: smooth pushes on the head (and on beards and brows, so they stay on the face) ----------
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function kblob(x, y, z, cx, cy, cz, r) { var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy) + (z - cz) * (z - cz)) / r; return d >= 1 ? 0 : (1 - d * d) * (1 - d * d); }
  function kitShape(p, F) { // p: [x,y,z] in the character's model space (metres); F: face settings
    var x = p[0], y = p[1], z = p[2], ax = Math.abs(x), sx = x < 0 ? -1 : 1, f;
    // jaw width: lower face widens or narrows, most at the jaw corners
    f = sstep(1.665, 1.6, y) * sstep(1.535, 1.565, y) * sstep(-0.05, 0.02, z) * sstep(0.01, 0.04, ax); x += x * F.jaw * f;
    // chin: longer/shorter and more or less forward
    f = sstep(1.615, 1.575, y) * sstep(1.54, 1.56, y) * sstep(0.02, 0.06, z) * (1 - sstep(0.02, 0.055, ax));
    y -= F.chin * 0.016 * f; z += F.chinF * 0.012 * f;
    // nose: size about its root, length pulls the tip down and out
    f = kblob(x, y, z, 0, 1.655, 0.1, 0.034);
    if (f) { x += x * F.nose * 0.5 * f; y += (y - 1.66) * F.nose * 0.6 * f - F.noseL * 0.008 * f; z += (z - 0.09) * F.nose * 0.8 * f + F.noseL * 0.008 * f; }
    // brow ridge
    f = kblob(ax, y, z, 0.03, 1.72, 0.092, 0.034); z += F.brow * 0.008 * f; y += F.brow * 0.002 * f;
    // cheekbones
    f = kblob(ax, y, z, 0.056, 1.672, 0.066, 0.04); x += sx * F.cheek * 0.006 * f; z += F.cheek * 0.004 * f;
    // ears: scale about the ear
    f = sstep(0.068, 0.082, ax) * kblob(ax, y, z, 0.085, 1.69, -0.012, 0.05);
    if (f) { x += (x - sx * 0.072) * F.ears * f; y += (y - 1.69) * F.ears * f; z += (z + 0.012) * F.ears * f; }
    p[0] = x; p[1] = y; p[2] = z;
  }
  function kitFace() {
    return { jaw: [-0.22, 0, 0.22, 0.4][sty('kJaw')], chin: [-1, 0, 1.3, 0.7][sty('kChin')], chinF: [-0.4, 0, 0.4, 1.4][sty('kChin')],
      nose: [-0.35, 0, 0.55, 0.2, 0.75][sty('kNose')], noseL: [0, 0, 0, 1.6, 1.2][sty('kNose')], brow: [-0.8, 0, 1.4, 2.4][sty('kBrowR')],
      cheek: [-1, 0, 1.2, 1.8][sty('kCheek')], ears: [-0.25, 0, 0.3, 0.55][sty('kEars')] };
  }
  function kitReshape() {
    var F = kitFace(), key = JSON.stringify(F); if (key === KIT.faceKey) return; KIT.faceKey = key;
    KIT.shapeable.forEach(function (s) {
      var pos = s.mesh.geometry.attributes.position, o = s.orig, p = [0, 0, 0], v = new THREE.Vector3(), i;
      for (i = 0; i < pos.count; i++) {
        v.set(o[i * 3], o[i * 3 + 1], o[i * 3 + 2]); if (s.toModel) v.applyMatrix4(s.toModel);
        p[0] = v.x; p[1] = v.y; p[2] = v.z; kitShape(p, F); v.set(p[0], p[1], p[2]); if (s.fromModel) v.applyMatrix4(s.fromModel);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true; s.mesh.geometry.computeVertexNormals();
    });
  }
  function shapeable(mesh, toModel) {
    var g = mesh.geometry, pos = g.attributes.position;
    if (pos.isInterleavedBufferAttribute || pos.normalized || !(pos.array instanceof Float32Array)) { // de-quantize so it can be edited
      var arr = pos.isInterleavedBufferAttribute ? pos.data.array : pos.array, k = !pos.normalized ? 1 : arr instanceof Int16Array ? 1 / 32767 : arr instanceof Uint16Array ? 1 / 65535 : arr instanceof Int8Array ? 1 / 127 : arr instanceof Uint8Array ? 1 / 255 : 1;
      var a = new Float32Array(pos.count * 3); for (var i = 0; i < pos.count; i++) { a[i * 3] = pos.getX(i) * k; a[i * 3 + 1] = pos.getY(i) * k; a[i * 3 + 2] = pos.getZ(i) * k; }
      g.setAttribute('position', new THREE.BufferAttribute(a, 3)); pos = g.attributes.position;
    }
    if (g.attributes.normal && !(g.attributes.normal.array instanceof Float32Array)) g.deleteAttribute('normal');
    KIT.shapeable.push({ mesh: mesh, orig: Float32Array.from(pos.array), toModel: toModel || null, fromModel: toModel ? toModel.clone().invert() : null });
  }
  function kitAssemble(got) {
    var base = got.o_ranger.scene, B = KIT.bones; KIT.shapeable = [];
    base.traverse(function (o) { if (o.isBone) B[o.name] = o; });
    function rebind(m) { var sk = m.skeleton; m.bind(new THREE.Skeleton(sk.bones.map(function (b) { return B[b.name] || b; }), sk.boneInverses), m.bindMatrix); }
    function add(slot, label, m, outfit) { (KIT.cat[slot] = KIT.cat[slot] || {}); (KIT.cat[slot][label] = KIT.cat[slot][label] || []).push({ mesh: m, outfit: outfit }); }
    function title(o) { return o.charAt(0).toUpperCase() + o.slice(1); }
    KIT_OUTFITS.concat(['knightcloth']).forEach(function (o) {
      var list = []; got['o_' + o].scene.traverse(function (x) { if (x.isSkinnedMesh) list.push(x); });
      var tex = o === 'knightcloth' ? 'knight' : o;
      list.forEach(function (m) {
        if (o !== 'ranger') { rebind(m); base.add(m); }
        var skin = /Regular/.test(m.material.name || '');
        m.material = skin ? kitMat('skin_light.jpg', 'skin_n.jpg', 'skin_r.jpg') : kitMat(tex + '_0.jpg', tex + '_n.jpg', tex + '_orm.jpg');
        m.material.skinning = true; m.castShadow = true; m.frustumCulled = false; m.visible = false; m.userData.skin = skin;
        var n = m.name;
        if (/Head_Hood/.test(n)) add('kHead', 'Ranger hood', m, tex); else if (/Head_Armet/.test(n)) add('kHead', 'Knight helm', m, tex);
        else if (/Head_Horns/.test(n)) add('kHead', 'Horned helm', m, tex); else if (/Head_Crown/.test(n)) add('kHead', 'Crown', m, tex);
        else if (/Acc_Scarf/.test(n)) add('kNeck', 'Scarf', m, tex); else if (/Acc_Gorget/.test(n)) add('kNeck', 'Gorget', m, tex);
        else if (/Pauldron_Round/.test(n)) add('kShoulder', 'Knight round', m, tex); else if (/Pauldron_Spike/.test(n)) add('kShoulder', 'Knight spiked', m, tex);
        else if (/Pauldron_Lion/.test(n)) add('kShoulder', 'Noble lion', m, tex); else if (/Pauldron/.test(n)) add('kShoulder', title(o), m, tex);
        else if (/Body_Armor/.test(n)) add('kTop', 'Knight plate', m, tex); else if (/Body_Cloth/.test(n)) add('kTop', 'Knight tunic', m, tex);
        else if (/Body/.test(n)) add('kTop', title(o), m, tex); else if (/Arms/.test(n)) add('kSleeves', title(o), m, tex);
        else if (/Legs/.test(n)) add('kPants', title(o), m, tex); else if (/Feet/.test(n)) add('kBoots', title(o), m, tex);
      });
    });
    // modern clothes and the bare-skin pieces that show under them
    var mods = {}; got.m_modern.scene.traverse(function (x) { if (x.isSkinnedMesh) mods[x.name] = x; });
    Object.keys(mods).forEach(function (nm) { var m = mods[nm]; rebind(m); base.add(m); m.castShadow = true; m.frustumCulled = false; m.visible = false; });
    Object.keys(MOD_PIECES).forEach(function (label) {
      MOD_PIECES[label].forEach(function (pc) {
        var m = mods[pc[0]]; if (!m) return; var own = pc[1] !== 'canvas'; m.material = own ? kitMat('mp_' + pc[1] + '.jpg', 'mp_' + pc[1] + '_n.jpg', null, THREE.DoubleSide) : kitMat('mod_canvas.jpg', null, null, THREE.DoubleSide); m.material.skinning = true; m.material.roughness = pc[1] === 'boot' ? 0.6 : 0.95;
        if (own) m.material.normalScale.set(0.6, 0.6); else { var t = m.material.map; t.wrapS = t.wrapT = THREE.RepeatWrapping; } add(MOD_SLOT[label], label, m, 'modern'); m.userData.fixed = !!pc[2];
      });
    });
    KIT.modSkin = {}; ['Torso', 'Arms', 'Legs', 'Feet'].forEach(function (k) { var m = mods['Mod_Skin_' + k]; if (!m) return; m.material = kitMat('skin_light.jpg', 'skin_n.jpg', 'skin_r.jpg'); m.material.skinning = true; KIT.modSkin[k] = m; });
    // the head (Regular male, made for these outfits), its eyes and regular brows
    var hl = []; got.head.scene.traverse(function (o) { if (o.isSkinnedMesh) hl.push(o); });
    var headInv = null;
    hl.forEach(function (m) {
      var hi = m.skeleton.bones.map(function (b) { return b.name; }); if (!headInv) headInv = m.skeleton.boneInverses[hi.indexOf('Head')].clone();
      var mn = m.material.name || ''; rebind(m); base.add(m); m.castShadow = true; m.frustumCulled = false;
      if (/Regular/.test(mn)) { m.material = kitMat('skin_light.jpg', 'skin_n.jpg', 'skin_r.jpg'); KIT.headMesh = m; shapeable(m); }
      else if (/Eyes/.test(mn)) { m.material = kitMat('eye.jpg'); m.material.roughness = 0.35; KIT.eyes = m; }
      else { m.material = kitMat('hair1.jpg', 'hair1_n.jpg', null, THREE.DoubleSide); m.material.alphaTest = 0.4; KIT.browsReg = m; shapeable(m); }
      m.material.skinning = true;
    });
    // hair, brows and facial hair ride on the head bone
    var FIT = { long: 1, bob: 1, ponytail_2: 1, buns: 1, longdreads: 1 };
    Object.keys(got).forEach(function (nm) {
      if (nm.indexOf('h_') !== 0) return; var key = nm.slice(2);
      var grp = new THREE.Group(); grp.matrixAutoUpdate = false; grp.matrix.copy(headInv); B.Head.add(grp); grp.visible = false;
      var fm = new THREE.Matrix4(); if (FIT[key]) fm.makeTranslation(0, 1.582, -0.03).multiply(new THREE.Matrix4().makeScale(1.1, 1.1, 1.1)).multiply(new THREE.Matrix4().makeTranslation(0, -1.55, 0.03));
      got[nm].scene.updateMatrixWorld(true);
      got[nm].scene.traverse(function (o) {
        if (!o.isMesh) return; var c = new THREE.Mesh(o.geometry, null); c.matrixAutoUpdate = false; c.matrix.multiplyMatrices(fm, o.matrixWorld);
        var two = /Hair_2/.test(o.material.name || ''); c.material = kitMat(two ? 'hair2.jpg' : 'hair1.jpg', two ? 'hair2_n.jpg' : 'hair1_n.jpg', null, THREE.DoubleSide); c.material.alphaTest = 0.4;
        c.castShadow = true; grp.add(c);
        if (/beard|moustache|muttonchops|browsthick/.test(key)) shapeable(c, c.matrix.clone());
      });
      KIT.hair[key] = grp;
    });
    KIT.headInv = headInv; KIT.hats = {}; kitLoadHats(L0());
    var root = new THREE.Group(); root.add(base); root.scale.setScalar(KIT.s); root.position.y = -LIFT; KIT.root = root; KIT.base = base;
    var clips = {}; got.anims.animations.forEach(function (c) { clips[c.name] = c; });
    KIT.clips = clips; KIT.mixer = new THREE.AnimationMixer(base); KIT.overMixer = new THREE.AnimationMixer(base);
    function sub(name, clip, test) { return new THREE.AnimationClip(name, clip.duration, clip.tracks.filter(function (t) { return test(t.name.split('.')[0]); })); }
    var fingers = /^(index|middle|ring|pinky|thumb)_\d+_/;
    KIT.overClips = {
      torchArm_l: sub('torchArm_l', clips.Idle_Torch_Loop, function (b) { return /_l$/.test(b) && (/^(clavicle|upperarm|lowerarm|hand)_/.test(b) || fingers.test(b)); }),
      grip_r: sub('grip_r', clips.Sword_Idle, function (b) { return /_r$/.test(b) && fingers.test(b); }),
      grip_l: sub('grip_l', clips.Sword_Idle, function (b) { return /_l$/.test(b) && fingers.test(b); })
    };
    KIT.ready = true; buildHero(); if (typeof drawRows === 'function' && gearOpen) drawRows(); cbLoad();
  }
  function kitAct(name) { if (!KIT.acts[name]) KIT.acts[name] = KIT.mixer.clipAction(KIT.clips[name]); return KIT.acts[name]; }
  function kitOver(name) { if (!KIT.over[name]) KIT.over[name] = KIT.overMixer.clipAction(KIT.overClips[name]); return KIT.over[name]; }
  function kitOneShot(name, hold) { if (!KIT || !KIT.on || !KIT.clips[name]) return; KIT.shot = name; KIT.shotT = hold ? 1e9 : KIT.clips[name].duration; var a = kitAct(name); a.reset(); a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; a.play(); if (KIT.curA && KIT.curA !== a) a.crossFadeFrom(KIT.curA, 0.15, false); KIT.cur = name; KIT.curA = a; }

  // called at the end of buildHero: dress the kit figure as the builder says, or fall back to the hand-made one
  function kitApply(attach) {
    if (!KIT) return;
    (KIT.attached || []).forEach(function (o) { if (o.parent) o.parent.remove(o); }); KIT.attached = [];
    KIT.on = KIT.ready && kitMode();
    if (!KIT.on) return;
    rig.children.forEach(function (c) { c.visible = false; });
    rig.add(KIT.root); KIT.root.visible = true;
    var dark = (function () { var c = new THREE.Color(col('skin')); return (c.r * 0.3 + c.g * 0.59 + c.b * 0.11) < 0.45; })(), skinT = kitTex(dark ? 'skin_dark.jpg' : 'skin_light.jpg');
    Object.keys(KIT.cat).forEach(function (slot) {
      var label = SLOT[slot].styles[sty(slot)], v = look[slot][1] % 5;
      Object.keys(KIT.cat[slot]).forEach(function (lb) {
        KIT.cat[slot][lb].forEach(function (p) {
          var on = lb === label; p.mesh.visible = on; if (!on) return;
          if (p.outfit === 'modern') { var pal = KIT_SW.modern; if (p.mesh.userData.fixed) p.mesh.material.color.set(sty('kBoots') >= 0 && /Boot/.test(p.mesh.name) ? 0x2a2420 : 0xeeeeea); else p.mesh.material.color.set(pal[look[slot][1] % pal.length]).multiplyScalar(1.15); return; }
          var t = p.mesh.userData.skin ? skinT : kitTex(p.outfit + '_' + v + '.jpg');
          if (p.mesh.material.map !== t) { p.mesh.material.map = t; p.mesh.material.needsUpdate = true; }
        });
      });
    });
    // modern pieces: bare skin under them, and sleeves follow a modern top
    var modTop = !!MOD_SLOT[SLOT.kTop.styles[sty('kTop')]], modLegs = !!MOD_SLOT[SLOT.kPants.styles[sty('kPants')]], modFeet = !!MOD_SLOT[SLOT.kBoots.styles[sty('kBoots')]];
    if (modTop && KIT.cat.kSleeves) Object.keys(KIT.cat.kSleeves).forEach(function (lb) { KIT.cat.kSleeves[lb].forEach(function (p) { p.mesh.visible = false; }); });
    var ms = KIT.modSkin || {}; [['Torso', modTop], ['Arms', modTop], ['Legs', modLegs], ['Feet', modFeet]].forEach(function (q) { var m = ms[q[0]]; if (!m) return; m.visible = q[1]; if (m.material.map !== skinT) { m.material.map = skinT; m.material.needsUpdate = true; } });
    if (KIT.headMesh.material.map !== skinT) { KIT.headMesh.material.map = skinT; KIT.headMesh.material.needsUpdate = true; }
    kitReshape();
    var hl0 = SLOT.kHead.styles[sty('kHead')], knit = /^(Beanie|Cap)$/.test(hl0) || HAT_LABELS.indexOf(hl0) >= 0, helm = /helm|hood/i.test(hl0), closed = hl0 === 'Knight helm';
    var hc = new THREE.Color(col('kHair')).multiplyScalar(1.75), hs = KIT_HAIR[sty('kHair')], beards = KIT_BEARD[sty('kBeard')];
    Object.keys(KIT.hair).forEach(function (nm) {
      var on = nm === 'browsthick' ? sty('kBrows') === 1 : (/^(beard|moustache|muttonchops)$/.test(nm) ? beards.indexOf(nm) >= 0 && !closed : (knit ? (nm === 'buzzed' && hs) : (nm === hs && !helm)));
      KIT.hair[nm].visible = on; KIT.hair[nm].traverse(function (o) { if (o.material) o.material.color.copy(hc); });
    });
    Object.keys(KIT.hats || {}).forEach(function (lb) { var on = lb === hl0; KIT.hats[lb].visible = on; if (on) { var c = new THREE.Color(KIT_SW.modern[look.kHead[1] % 10]); if (look.kHead[1] % 10 === 0) c.set(0xffffff); KIT.hats[lb].traverse(function (o) { if (o.material) o.material.color.copy(o.material.userData.base || new THREE.Color(1, 1, 1)).multiply(c).multiplyScalar(1.1); }); } });
    KIT.browsReg.visible = sty('kBrows') === 0; KIT.browsReg.material.color.copy(hc);
    KIT.eyes.material.color.set(col('kEyes')).lerp(new THREE.Color(0xffffff), 0.25).multiplyScalar(1.15);
    // held gear into the hands, back gear onto the spine
    held.forEach(function (h) {
      if (h.el && h.el.isBone) return;
      if (h.t) h.t = new THREE.Quaternion(h.t.x, -h.t.y, -h.t.z, h.t.w);
      var bone = KIT.bones[h.side > 0 ? 'hand_r' : 'hand_l']; bone.add(h.g); KIT.attached.push(h.g); h.g.position.set(0, 0.085, 0.015 * (h.side > 0 ? 1 : -1)); h.g.scale.setScalar(1 / KIT.s); h.el = bone; h.g.visible = true;
    });
    if (attach && attach.shield) { var sg = attach.shield; KIT.bones.hand_l.add(sg); KIT.attached.push(sg); sg.position.set(0, 0.1, 0); sg.scale.set(-1 / KIT.s, 1 / KIT.s, 1 / KIT.s); held.push({ g: sg, el: KIT.bones.hand_l, side: -1, t: null }); }
    if (attach && attach.bass) { var bb = attach.bass; KIT.bones.hand_r.add(bb); KIT.attached.push(bb); bb.position.set(0, 0.1, 0); bb.scale.setScalar(1 / KIT.s); held.push({ g: bb, el: KIT.bones.hand_r, side: 1, t: lean(0.9, 0) }); }
    if (attach && attach.back) { rig.updateMatrixWorld(true); attach.back.position.z += 0.09; attach.back.updateMatrixWorld(true); KIT.bones.spine_03.attach(attach.back); KIT.attached.push(attach.back); attach.back.visible = true; }
  }

  // animation state, called every frame from the main loop
  function kitAnimate(dt, speed, air, crouching, torch) {
    if (!KIT.on) return;
    var want;
    if (KIT.shot) { KIT.shotT -= dt; if (KIT.shotT > 0.12 && !air && speed < 0.05) want = KIT.shot; else KIT.shot = null; }
    if (!want) want = air ? 'Jump_Loop' : crouching ? (speed > 0.05 ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop') : speed > 0.05 ? (speed > 2.3 ? 'Jog_Fwd_Loop' : 'Walk_Loop') : (torch ? 'Idle_Torch_Loop' : 'Idle_Loop');
    if (want !== KIT.cur) { var a = kitAct(want); a.reset(); a.setLoop(THREE.LoopRepeat); a.play(); if (KIT.curA) a.crossFadeFrom(KIT.curA, 0.22, false); KIT.cur = want; KIT.curA = a; }
    if (want === 'Walk_Loop') KIT.curA.timeScale = clamp(speed / 1.5, 0.6, 1.5);
    else if (want === 'Jog_Fwd_Loop') KIT.curA.timeScale = clamp(speed / 3.0, 0.8, 1.3);
    else if (want === 'Crouch_Fwd_Loop') KIT.curA.timeScale = clamp(speed / 1.2, 0.6, 1.4);
    else KIT.curA.timeScale = 1;
    KIT.mixer.update(dt);
    var main = sty('main'), off = sty('off');
    var want2 = { torchArm_l: off === 2 && !air, grip_r: main > 0 && main !== 5, grip_l: off === 3 || off === 1 };
    Object.keys(want2).forEach(function (k) { var a = kitOver(k); if (want2[k] && !a.isRunning()) { a.reset(); a.play(); } if (!want2[k] && a.isRunning()) a.stop(); });
    KIT.overMixer.update(dt);
  }
  kitLoad();
