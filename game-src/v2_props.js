
  // ===================== props: furniture, clutter, nature and real weapons =====================
  // Quaternius Fantasy Props MegaKit and Stylized Nature MegaKit (CC0). Loaded after the floor is built; until they
  // arrive (or if they fail) the hand-made blocks stay.
  var PROPS = { ready: false, lib: {}, box: {}, mats: {} };
  var PROPBLOCK = {};
  var PTEX = [[/Bark_NormalTree/, 'n_bark.jpg'], [/Bark_Twisted|Bark_Dead/, 'n_bark2.jpg'], [/Leaves_NormalTree/, 'n_treeleaves.png'], [/Leaves_TwistedTree/, 'n_twleaves.png'], [/Leaves_Pine/, 'n_pine.png'], [/^Flowers/, 'n_flowers.png'], [/Trim_Furniture/, 'trim_furniture.jpg'], [/Trim_Metal/, 'trim_metal.jpg'], [/Trim_Props/, 'trim_props.jpg'], [/Trim_Cloth|Banner/, 'trim_cloth.jpg'],
    [/Page/, 'page.jpg'], [/Mushrooms/, 'n_mushrooms.jpg'], [/Rocks|Bark/, 'n_rocks.jpg'], [/Grass/, 'n_grass.jpg'], [/Leaves|Flowers/, 'n_leaves.png']];
  function propMat(name, fade) {
    var file = 'trim_furniture.jpg', leafy = /Leaves|Flowers/.test(name);
    PTEX.some(function (p) { if (p[0].test(name)) { file = p[1]; return true; } return false; });
    var m = new THREE.MeshLambertMaterial({ map: kitTex(file), side: THREE.DoubleSide, alphaTest: leafy ? 0.35 : 0, transparent: !!fade });
    return m;
  }
  function propLoad() {
    var L = new THREE.GLTFLoader(), left = 2;
    ['props', 'nature'].forEach(function (nm) {
      fetch(KDIR + nm + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
        var bin = atob(j.glb), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        L.parse(u.buffer, KDIR, function (g) {
          g.scene.traverse(function (o) { // de-quantize positions so bounds and placement work in plain numbers
            if (!o.isMesh) return; var p = o.geometry.attributes.position;
            if (p.normalized) { var a = p.array, k = a instanceof Int16Array ? 1 / 32767 : a instanceof Uint16Array ? 1 / 65535 : a instanceof Int8Array ? 1 / 127 : 1 / 255, f = new Float32Array(a.length);
              for (var i = 0; i < a.length; i++) f[i] = a[i] * k; o.geometry.setAttribute('position', new THREE.BufferAttribute(f, 3)); }
          });
          g.scene.updateMatrixWorld(true);
          g.scene.children.forEach(function (n) { if (n.name.indexOf('P_') === 0) { var key = n.name.slice(2); PROPS.lib[key] = n; PROPS.box[key] = new THREE.Box3().setFromObject(n); } });
          if (--left === 0) propsReady();
        }, function (e) { console.warn('props failed', nm, e); });
      }).catch(function (e) { console.warn('props failed', nm, e); });
    });
  }
  var _pv = new THREE.Vector3(), _pq = new THREE.Quaternion(), _ps = new THREE.Vector3(), _pm = new THREE.Matrix4();
  function propMatrix(name, o) {
    var b = PROPS.box[name], sz = b.getSize(new THREE.Vector3());
    var s = o.fit ? o.fit / Math.max(sz.x, sz.z) : o.h ? o.h / sz.y : (o.s || 0.72);
    var ctr = b.getCenter(new THREE.Vector3());
    var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.rot || 0, 0));
    var off = new THREE.Vector3(-ctr.x * s, -b.min.y * s, -ctr.z * s).applyQuaternion(q); // centre it on the spot, bottom on the floor
    return new THREE.Matrix4().compose(new THREE.Vector3(o.x + off.x, (o.y || 0) + off.y, o.z + off.z), q, new THREE.Vector3(s, s, s));
  }
  // put a prop into the world at (x, z), fogged with the tile it stands on
  function place(name, x, z, o) {
    if (!PROPS.lib[name]) return; o = o || {}; o.x = x; o.z = z;
    var tx = o.tx !== undefined ? o.tx : Math.round(x), tz = o.tz !== undefined ? o.tz : Math.round(z), M = propMatrix(name, o);
    PROPS.lib[name].traverse(function (m) {
      if (!m.isMesh) return;
      var mesh = new THREE.Mesh(m.geometry, propMat(m.material.name || '', o.fade));
      _pm.multiplyMatrices(M, m.matrixWorld); _pm.decompose(mesh.position, mesh.quaternion, mesh.scale);
      var t = reg(mesh, tx, tz, { fade: o.fade, hang: o.hang, noShadow: o.noShadow, mob: o.mob });
      if (o.lid && /lid|top/i.test(m.name + ' ' + (m.parent ? m.parent.name : ''))) t.lid = true;
    });
    if (o.block) PROPBLOCK[tx + ',' + tz] = 1;
  }
  // a prop held by the hero (no fog), centred on its grip
  function propInto(group, name, o) {
    if (!PROPS.lib[name]) return false; o = o || {}; o.x = 0; o.z = 0;
    var holder = new THREE.Group(), M = new THREE.Matrix4().compose(new THREE.Vector3(o.gx || 0, o.gy || 0, o.gz || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.rot || 0, o.rz || 0)), new THREE.Vector3(o.s, o.s, o.s));
    PROPS.lib[name].traverse(function (m) {
      if (!m.isMesh) return; var k = 'held' + (m.material.name || '');
      if (!PROPS.mats[k]) PROPS.mats[k] = propMat(m.material.name || '');
      var mesh = new THREE.Mesh(m.geometry, PROPS.mats[k]); _pm.multiplyMatrices(M, m.matrixWorld); _pm.decompose(mesh.position, mesh.quaternion, mesh.scale); mesh.castShadow = true; holder.add(mesh);
    });
    group.add(holder); return true;
  }

  function propsReady() { PROPS.ready = true; rebuildChunks(); buildHero(); refreshFog(); }
  // props for one tile, built with its chunk
  function buildTileProps(x, z) {
    if (!propsOn()) return;
    var c = ch(x, z), r = hash(x, z), r2 = hash(x + 31, z + 17), th = roomAt(x, z);
    if (c === 'C') place('Chest_Wood', x, z, { fit: 0.78, rot: 0, lid: true });
    else if (c === 'K') place(r > 0.5 ? 'Crate_Wooden' : 'Crate_Metal', x, z, { fit: 0.82, rot: (r2 - 0.5) * 0.5 });
    else if (c === 'R') place(r > 0.6 ? 'Barrel_Apples' : 'Barrel', x, z, { fit: 0.62, rot: r * 6 });
    else if (c === 'T') { place('Table_Large', x, z, { fit: 1.25, rot: r > 0.5 ? 0 : Math.PI / 2 }); var ty = 0.815 * 0.44; place('Mug', x - 0.2, z - 0.1, { y: ty, s: 0.5 }); place(r2 > 0.5 ? 'CandleStick_Triple' : 'Coin_Pile_2', x + 0.15, z, { y: ty, s: 0.5 }); }
    else if (c === 'W') place('WeaponStand', x, z, { fit: 1.0, rot: r * 2 });
    else if (c === 'U') place('Dummy', x, z, { h: 1.3, rot: r * 6 });
    else if (c === 'b') place('Bag', x, z, { fit: 0.45, rot: r * 6 });
    else if (c === 'h' && th === 'water') place('Bookcase_2', x, z, { fit: 0.98, rot: Math.PI / 2 });
    else if (c === 'h' && th === 'office') place('Shelf_Arch', x, z, { fit: 0.9, rot: Math.round(r * 2) * Math.PI });
    else if (c === 'F') { place('Table_Large', x, z, { fit: 1.05, rot: 0 }); var fy = 0.815 * 0.37; place('FarmCrate_Apple', x - 0.18, z, { y: fy, fit: 0.32 }); place(r > 0.5 ? 'Pot_1' : 'Mug', x + 0.2, z - 0.08, { y: fy, fit: 0.2 }); place('Bag', x + 0.15, z + 0.15, { y: fy, fit: 0.2 }); }
    else if (c === 'Y') { place(['CommonTree_1', 'CommonTree_3', 'Pine_2', 'CommonTree_1'][Math.floor(r * 4)], x, z, { h: 2.6 + r2 * 1.1, rot: r * 7, fade: true, noShadow: true }); }
    else if (c === 'h') place('Shelf_Small_Bottles', x, z, { fit: 0.95, rot: Math.round(r * 4) * Math.PI / 2 });
    else if (c === 'c') place('CandleStick_Stand', x, z, { h: 1.0 });
    else if (c === 'q') place('Cauldron', x, z, { fit: 0.72 });
    else if (c === 'k') place('BookStand', x, z, { h: 1.0, rot: r * 3 });
    else if (c === 'g') place('Cage_Small', x, z, { fit: 0.7, rot: r * 2 });
    else if (c === 'v') place(r > 0.5 ? 'Vase_2' : 'Vase_4', x, z, { fit: 0.42 });
    else if (th === 'moss' && c === ',') {
      if (r > 0.5) place(['Grass_Wispy_Short', 'Clover_1', 'Fern_1', 'Plant_1', 'Grass_Common_Short', 'Plant_7'][Math.floor(r2 * 6)], x + (r2 - 0.5) * 0.5, z + (r - 0.75) * 0.6, { fit: 0.45 + r2 * 0.3, rot: r * 9, noShadow: true, tx: x, tz: z });
      if (r2 > 0.72) place(r > 0.5 ? 'Mushroom_Common' : 'Mushroom_Laetiporus', x - (r - 0.5) * 0.4, z + (r2 - 0.86) * 1.2, { fit: 0.26 + r * 0.14, rot: r2 * 7, tx: x, tz: z });
      if (r < 0.18) place('Pebble_Round_' + (1 + Math.floor(r2 * 3)), x + 0.25, z - 0.2, { fit: 0.24, rot: r2 * 5, noShadow: true, tx: x, tz: z });
    } else if (th === 'garden' && c === ',') {
      if (r > 0.68) place(['Grass_Wispy_Short', 'Grass_Common_Short', 'Grass_Wispy_Tall', 'Clover_1', 'Fern_1', 'Plant_1', 'Flower_3_Group', 'Flower_4_Group'][Math.floor(r2 * 8)], x + (r2 - 0.5) * 0.5, z + (r - 0.7) * 0.6, { fit: 0.45 + r2 * 0.35, rot: r * 9, noShadow: true, tx: x, tz: z });
      if (r2 > 0.93) place(r > 0.5 ? 'Bush_Common_Flowers' : 'Bush_Common', x - 0.1, z + 0.1, { fit: 0.8, rot: r2 * 7, tx: x, tz: z });
      else if (r2 > 0.86) place(r > 0.5 ? 'Mushroom_Common' : 'Rock_Medium_' + (1 + Math.floor(r * 3)), x, z, { fit: r > 0.5 ? 0.3 : 0.4, rot: r2 * 7, tx: x, tz: z, noShadow: true });
    } else if (c === '.' && th === 'store' && r > 0.94) place(r2 > 0.5 ? 'Bucket_Wooden_1' : 'Rope_1', x + (r2 - 0.5) * 0.4, z, { fit: 0.3, rot: r * 5, noShadow: true, tx: x, tz: z });
    else if (c === '.' && th === 'crypt' && r > 0.95) place('Chain_Coil', x, z, { fit: 0.45, noShadow: true });
  }
  propLoad();
