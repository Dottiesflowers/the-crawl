
  // ===================== props: furniture, clutter, nature and real weapons =====================
  // Quaternius Fantasy Props MegaKit and Stylized Nature MegaKit (CC0). Loaded after the floor is built; until they
  // arrive (or if they fail) the hand-made blocks stay.
  var PROPS = { ready: false, lib: {}, box: {}, mats: {} };
  var PROPBLOCK = {};
  var PTEX = [[/Trim_Furniture/, 'trim_furniture.jpg'], [/Trim_Metal/, 'trim_metal.jpg'], [/Trim_Props/, 'trim_props.jpg'], [/Trim_Cloth|Banner/, 'trim_cloth.jpg'],
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

  function propsReady() {
    PROPS.ready = true;
    // swap the block-built loot boxes, crates and barrels for the real things
    for (var i = tiles.length - 1; i >= 0; i--) { var t = tiles[i], c = ch(t.x, t.z); if ('CKR'.indexOf(c) >= 0 && !t.wall && t.mesh.position.y > -0.01) { scene.remove(t.mesh); tiles.splice(i, 1); } }
    for (var z = 0; z < H; z++) for (var x = 0; x < W; x++) {
      var c2 = ch(x, z), r = hash(x, z), r2 = hash(x + 31, z + 17);
      if (c2 === 'C') place('Chest_Wood', x, z, { fit: 0.78, rot: 0, lid: true });
      if (c2 === 'K') place(r > 0.5 ? 'Crate_Wooden' : 'Crate_Metal', x, z, { fit: 0.82, rot: (r2 - 0.5) * 0.5 });
      if (c2 === 'R') place(r > 0.6 ? 'Barrel_Apples' : 'Barrel', x, z, { fit: 0.62, rot: r * 6 });
      // the overgrowth: ferns, grasses, mushrooms and pebbles on the mossy floor
      if (roomAt(x, z) === 'moss' && c2 === ',') {
        var nearDoor = (x === 18 && z === 3) || (x === 21 && z === 6);
        if (!nearDoor && r > 0.5) place(['Grass_Wispy_Short', 'Clover_1', 'Fern_1', 'Plant_1', 'Grass_Common_Short', 'Plant_7'][Math.floor(r2 * 6)], x + (r2 - 0.5) * 0.5, z + (r - 0.75) * 0.6, { fit: 0.45 + r2 * 0.3, rot: r * 9, noShadow: true });
        if (r2 > 0.72) place(r > 0.5 ? 'Mushroom_Common' : 'Mushroom_Laetiporus', x - (r - 0.5) * 0.4, z + (r2 - 0.86) * 1.2, { fit: 0.26 + r * 0.14, rot: r2 * 7 });
        if (r < 0.18) place('Pebble_Round_' + (1 + Math.floor(r2 * 3)), x + 0.25, z - 0.2, { fit: 0.24, rot: r2 * 5, noShadow: true });
      }
    }
    // the Undercroft: candles for the dead, chains and a cage
    place('CandleStick_Stand', 1.2, 1.2, { h: 1.0, block: true }); place('CandleStick_Stand', 5.8, 1.2, { h: 1.0, block: true });
    place('Cage_Small', 5.8, 5.7, { fit: 0.7, rot: 0.3, block: true }); place('Chain_Coil', 1.3, 4.6, { fit: 0.55, noShadow: true });
    place('Vase_Rubble_Medium', 4.9, 5.6, { fit: 0.55, rot: 1.1, noShadow: true }); place('Vase_2', 1.25, 6.0, { fit: 0.42, block: true });
    // Pillar Hall: a long table laid for a feast nobody came to, a bench, a weapon rack and a training dummy
    place('Table_Large', 14.5, 1.45, { fit: 1.95, block: true, tx: 14, tz: 1 }); PROPBLOCK['15,1'] = 1;
    place('Bench', 14.5, 2.35, { fit: 1.8, tx: 14, tz: 2 });
    var ty = 0.815 * 0.685;
    place('Mug', 13.9, 1.3, { y: ty, s: 0.6 }); place('Mug', 15.1, 1.55, { y: ty, s: 0.6, rot: 2 }); place('CandleStick_Triple', 14.5, 1.3, { y: ty, s: 0.6 });
    place('Book_Stack_1', 13.7, 1.6, { y: ty, s: 0.6, rot: 0.4 }); place('Coin_Pile_2', 15.3, 1.3, { y: ty, s: 0.6 });
    place('WeaponStand', 9.2, 1.25, { fit: 1.0, block: true }); place('Dummy', 10.2, 5.8, { h: 1.3, block: true, rot: 0.6 });
    place('Barrel', 8.3, 6.3, { fit: 0.6, block: true, rot: 1 }); place('Barrel', 9.1, 6.5, { fit: 0.55, block: true, tx: 9, tz: 6 });
    // the Storeroom: shelves, sacks, a workbench, buckets
    place('Shelf_Small_Bottles', 1.0, 11.5, { fit: 0.95, rot: Math.PI / 2, tx: 1, tz: 11 }); PROPBLOCK['1,11'] = 1;
    place('Bag', 1.35, 12.6, { fit: 0.45, rot: 0.5, block: true }); place('Bag', 4.0, 9.25, { fit: 0.42, rot: 2.6, block: true });
    place('Workbench', 5.5, 13.6, { fit: 1.35, block: true, tx: 5, tz: 13 }); PROPBLOCK['6,13'] = 1; place('Bucket_Wooden_1', 6.3, 14.4, { fit: 0.28 });
    place('FarmCrate_Apple', 3.6, 14.4, { fit: 0.55, rot: 0.2, block: true, tx: 4, tz: 14 }); place('Rope_1', 3.2, 11.2, { fit: 0.4, noShadow: true }); place('Pouch_Large', 5.6, 13.45, { y: 0.895 * 0.67, s: 0.6 });
    // Stairwell Approach: a hedge-witch's corner by the stairs
    place('Cauldron', 19.2, 13.3, { fit: 0.72, block: true }); place('BookStand', 19.3, 9.3, { h: 1.0, block: true, rot: 0.8 });
    place('Shelf_Small_Bottles', 24.0, 10.5, { fit: 0.95, rot: -Math.PI / 2, tx: 24, tz: 10 }); PROPBLOCK['24,10'] = 1;
    place('Potion_2', 18.5, 12.6, { s: 0.6 }); place('Potion_4', 18.7, 12.4, { s: 0.6 }); place('Potion_1', 18.45, 12.3, { s: 0.6 });
    place('CandleStick_Stand', 24.0, 13.9, { h: 1.0, block: true }); place('Scroll_1', 20.3, 13.6, { s: 0.7, rot: 0.6 }); place('Coin_Pile', 22.6, 13.5, { s: 0.7 });
    place('Book_Stack_2', 18.3, 9.9, { s: 0.65, rot: 1.2 });
    buildHero(); refreshFog();
  }
  propLoad();
