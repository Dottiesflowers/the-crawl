// Merge chosen Kenney Furniture Kit GLBs into one GLB: each model becomes a root node named P_<name>,
// materials renamed KN_<colour> so the game keeps their flat colours. Usage: node pack.mjs <srcDir> <out.json> name1 name2 ...
import { NodeIO, Document } from '@gltf-transform/core';
import { dedup, prune, weld } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

const [src, out, ...names] = process.argv.slice(2);
const io = new NodeIO();
const target = new Document();
const buf = target.createBuffer();
const scene = target.createScene('furn');
const matCache = new Map();

function matFor(m) {
  const c = m ? m.getBaseColorFactor() : [0.8, 0.8, 0.8, 1];
  const key = c.map(v => Math.round(v * 255)).join('_');
  if (!matCache.has(key)) {
    const nm = target.createMaterial('KN_' + key).setBaseColorFactor(c).setRoughnessFactor(0.85).setMetallicFactor(0);
    matCache.set(key, nm);
  }
  return matCache.get(key);
}
function copyAccessor(a) {
  const n = target.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setBuffer(buf);
  if (a.getNormalized()) n.setNormalized(true);
  return n;
}
for (const nm of names) {
  const file = path.join(src, nm + '.glb');
  if (!fs.existsSync(file)) { console.error('missing', nm); continue; }
  const doc = await io.read(file);
  const root = target.createNode('P_' + nm);
  const walk = (node, parent) => {
    const n = target.createNode(node.getName() || 'n').setTranslation(node.getTranslation()).setRotation(node.getRotation()).setScale(node.getScale());
    const mesh = node.getMesh();
    if (mesh) {
      const m2 = target.createMesh(nm);
      for (const p of mesh.listPrimitives()) {
        const p2 = target.createPrimitive().setMode(p.getMode());
        for (const sem of p.listSemantics()) { if (sem === 'POSITION' || sem === 'NORMAL') p2.setAttribute(sem, copyAccessor(p.getAttribute(sem))); }
        if (p.getIndices()) p2.setIndices(copyAccessor(p.getIndices()));
        p2.setMaterial(matFor(p.getMaterial()));
        m2.addPrimitive(p2);
      }
      n.setMesh(m2);
    }
    parent.addChild(n);
    for (const c of node.listChildren()) walk(c, n);
  };
  for (const s of doc.getRoot().listScenes()) for (const c of s.listChildren()) walk(c, root);
  scene.addChild(root);
}
await target.transform(dedup(), prune());
const glb = await io.writeBinary(target);
fs.writeFileSync(out, JSON.stringify({ glb: Buffer.from(glb).toString('base64') }));
console.log('wrote', out, Math.round(glb.byteLength / 1024) + ' KB', names.length + ' models', matCache.size + ' colours');
