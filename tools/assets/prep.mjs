// Slim a downloaded glTF into a game-ready GLB: weld, simplify to a triangle budget, shrink textures, prune.
// usage: node prep.mjs in.gltf out.glb maxTris [texSize]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, simplify, prune, textureCompress, flatten, join, resample } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [, , inp, out, maxTrisS, texS, dropS, keepS] = process.argv;
const maxTris = +maxTrisS || 5000, tex = +texS || 512;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
function tris() { let t = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(), a = p.getAttribute('POSITION'); t += Math.floor((i ? i.getCount() : a.getCount()) / 3); } return t; }
// drop parts by node name (ground planes, shadow catchers) or keep only some (pull one object out of a scene)
const dropRx = dropS && dropS !== '-' ? new RegExp(dropS, 'i') : null, keepRx = keepS && keepS !== '-' ? new RegExp(keepS, 'i') : null;
for (const n of doc.getRoot().listNodes()) { if (!n.getMesh()) continue; const nm = n.getName() + ' ' + n.getMesh().getName(); if ((dropRx && dropRx.test(nm)) || (keepRx && !keepRx.test(nm))) n.setMesh(null); }
await doc.transform(prune());
const before = tris();
const skinned = doc.getRoot().listSkins().length > 0;
// untextured models: drop normals and UVs so seams weld and the mesh can actually be simplified (shaded flat in game)
if (!doc.getRoot().listTextures().length && !skinned) for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { for (const s of ['NORMAL', 'TEXCOORD_0', 'TEXCOORD_1', 'TANGENT', 'COLOR_0']) { const a = p.getAttribute(s); if (a) p.setAttribute(s, null); } }
await doc.transform(dedup(), weld());
if (!skinned) await doc.transform(flatten(), join({ keepNamed: false }));
let t = tris();
await MeshoptSimplifier.ready;
const ERR = [0.005, 0.02, 0.05, 0.1, 0.2, 0.4];
for (let pass = 0; pass < ERR.length && t > maxTris; pass++) {
  const ratio = Math.max(0.005, (maxTris / t) * 0.95);
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: ERR[pass], lockBorder: false }));
  t = tris();
}
// shrink every texture we keep (base colour) to tex px; jpeg unless it needs alpha
for (const m of doc.getRoot().listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); m.setEmissiveTexture(null); }
await doc.transform(prune());
for (const tx of doc.getRoot().listTextures()) {
  const img = tx.getImage(); if (!img) continue;
  const sh = sharp(Buffer.from(img)), meta = await sh.metadata();
  const alpha = meta.hasAlpha && (await sharp(Buffer.from(img)).stats()).channels[3]?.min < 250;
  const r = sharp(Buffer.from(img)).resize(tex, tex, { fit: 'inside', withoutEnlargement: true });
  const buf = alpha ? await r.png({ compressionLevel: 9, palette: true }).toBuffer() : await r.jpeg({ quality: 80 }).toBuffer();
  tx.setImage(new Uint8Array(buf)).setMimeType(alpha ? 'image/png' : 'image/jpeg');
}
// normal and metal/rough maps are dropped: the game lights props with simple materials
for (const m of doc.getRoot().listMaterials()) { m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); m.setEmissiveTexture(null); }
await doc.transform(prune(), dedup());
if (skinned) await doc.transform(resample());
await io.write(out, doc);
console.log(JSON.stringify({ inp: inp.split('/').slice(-2, -1)[0], before, after: t, skinned }));
