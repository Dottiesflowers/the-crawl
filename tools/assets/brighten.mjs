// Brighten base-color textures of a GLB: node brighten.mjs in.glb out.glb gain
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
const [, , inp, out, g] = process.argv; const gain = +g || 1.8;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
const base = new Set(doc.getRoot().listMaterials().map(m => m.getBaseColorTexture()).filter(Boolean));
for (const m of doc.getRoot().listMaterials()) if (!m.getMetallicRoughnessTexture()) m.setMetallicFactor(0);
for (const t of base) { const img = sharp(Buffer.from(t.getImage())); const fmt = t.getMimeType().includes('png') ? 'png' : 'jpeg';
  t.setImage(new Uint8Array(await img.linear(gain, 6).toFormat(fmt).toBuffer())); }
await io.write(out, doc); console.log('brightened', base.size);
