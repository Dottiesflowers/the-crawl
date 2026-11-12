// One held weapon per file: bake the node's world transform, lay the long axis along +y, grip end at y=0, centered in x/z.
// usage: node wsplit.mjs in.gltf outdir name:NodeRegex:flip ...   (flip=1 puts the other end at the bottom)
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { transformMesh, prune, flatten, dedup, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
const [, , inp, outdir, ...specs] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const sp of specs) {
  const [name, rx, flip] = sp.split(':');
  const doc = await io.read(inp), root = doc.getRoot(), re = new RegExp(rx);
  await doc.transform(flatten());
  const scene = root.listScenes()[0];
  let keep = null;
  for (const n of root.listNodes()) { if (n.getMesh() && re.test(n.getName()) && !keep) keep = n; }
  // bake world matrix into the mesh, then detach
  const wm = keep.getWorldMatrix(); transformMesh(keep.getMesh(), wm);
  keep.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  for (const n of root.listNodes()) if (n !== keep) n.dispose();
  scene.addChild(keep);
  let b = getBounds(keep); const ext = [0, 1, 2].map(i => b.max[i] - b.min[i]); const ax = ext.indexOf(Math.max(...ext));
  // rotate long axis -> +y
  const s = flip === '1' ? -1 : 1, c = Math.SQRT1_2;
  let q = [0, 0, 0, 1];
  if (ax === 0) q = s > 0 ? [0, 0, c, c] : [0, 0, -c, c];      // x -> y (rotate about z)
  else if (ax === 2) q = s > 0 ? [-c, 0, 0, c] : [c, 0, 0, c]; // z -> y (rotate about x)
  else if (s < 0) q = [0, 0, 1, 0];
  const qm = (q => { const [x, y, z, w] = q; return [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0, 2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0, 2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]; })(q);
  transformMesh(keep.getMesh(), qm);
  b = getBounds(keep); const L = b.max[1] - b.min[1];
  const k = 1 / L; // normalize length to 1; the game sizes it
  transformMesh(keep.getMesh(), [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, -(b.min[0] + b.max[0]) / 2 * k, -b.min[1] * k, -(b.min[2] + b.max[2]) / 2 * k, 1]);
  root.listAnimations().forEach(a => a.dispose());
  root.listMaterials().forEach(m => { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); });
  await doc.transform(prune(), dedup(), textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512] }));
  await io.write(`${outdir}/w_${name}.glb`, doc);
  console.log(name, 'axis', ax, 'len', L.toFixed(1));
}
