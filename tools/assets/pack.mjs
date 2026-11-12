// Pack several prepared GLBs into one game kit: each model becomes a node named P_<key>; materials are renamed TX_<key>_n
// so the game keeps their own textures. Output: { glb: base64 } like the other kit files.
// usage: node pack.mjs out.json key=file.glb [key=file.glb ...]
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, unpartition } from '@gltf-transform/functions';
import fs from 'fs';

const [, , out, ...pairs] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const target = new Document(); target.createBuffer();
const scene = target.createScene('kit');
for (const pr of pairs) {
  const [key, file] = pr.split('=');
  const src = await io.read(file);
  src.getRoot().listMaterials().forEach((m, i) => m.setName('TX_' + key + '_' + i));
  const map = mergeDocuments(target, src);
  const holder = target.createNode('P_' + key);
  for (const sc of src.getRoot().listScenes()) { const tsc = map.get(sc); for (const n of tsc.listChildren()) { tsc.removeChild(n); holder.addChild(n); } tsc.dispose(); }
  scene.addChild(holder);
}
target.getRoot().setDefaultScene(scene);
await target.transform(unpartition(), prune(), dedup());
const glb = await io.writeBinary(target);
fs.writeFileSync(out, JSON.stringify({ glb: Buffer.from(glb).toString('base64') }));
console.log('wrote', out, (glb.length / 1024 | 0) + ' KB');
