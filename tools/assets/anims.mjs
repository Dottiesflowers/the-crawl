// Merge animations from other copies of the same rig into one model, matching bones by name.
// usage: node anims.mjs base.glb out.glb Idle extra.glb=Walk [extra2.glb=Run ...]   (base's own first animation becomes "Idle")
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [, , baseF, outF, baseName, ...extras] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(baseF), root = doc.getRoot(), buf = root.listBuffers()[0];
const key = n => String(n).replace(/_\d+$/, '').replace(/^.*:/, '').replace(/^UnknownSoldier_/, ''); // Mixamo exports number their bones differently; match on the bone name
const byName = {}; root.listNodes().forEach(n => { byName[key(n.getName())] = n; });
root.listAnimations().forEach((a, i) => { if (i === 0) a.setName(baseName); else a.dispose(); });
for (const ex of extras) {
  const [file, name] = ex.split('=');
  const src = await io.read(file), sa = src.getRoot().listAnimations()[0]; if (!sa) continue;
  const anim = doc.createAnimation(name), copies = new Map();
  const acc = a => { if (copies.has(a)) return copies.get(a); const c = doc.createAccessor().setType(a.getType()).setArray(a.getArray().slice()).setBuffer(buf); copies.set(a, c); return c; };
  for (const ch of sa.listChannels()) {
    const tn = ch.getTargetNode(); const node = tn && byName[key(tn.getName())]; if (!node || ch.getTargetPath() !== 'rotation') continue; // rotations only: walks in place
    const s = ch.getSampler(); let out = acc(s.getOutput());
    if (process.env.RETARGET) { // different rest poses: keep the motion relative to each rig's own rest  q = dstRest * inv(srcRest) * q
      const sr = tn.getRotation(), dr = node.getRotation(), a = out.getArray().slice();
      const mul = (p, q) => [p[3]*q[0]+p[0]*q[3]+p[1]*q[2]-p[2]*q[1], p[3]*q[1]-p[0]*q[2]+p[1]*q[3]+p[2]*q[0], p[3]*q[2]+p[0]*q[1]-p[1]*q[0]+p[2]*q[3], p[3]*q[3]-p[0]*q[0]-p[1]*q[1]-p[2]*q[2]];
      const inv = [-sr[0], -sr[1], -sr[2], sr[3]], pre = mul(dr, inv);
      for (let i = 0; i < a.length; i += 4) { const r = mul(pre, [a[i], a[i+1], a[i+2], a[i+3]]); a[i] = r[0]; a[i+1] = r[1]; a[i+2] = r[2]; a[i+3] = r[3]; }
      out = doc.createAccessor().setType('VEC4').setArray(a).setBuffer(buf);
    }
    const ns = doc.createAnimationSampler().setInput(acc(s.getInput())).setOutput(out).setInterpolation(s.getInterpolation());
    anim.addSampler(ns).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(ch.getTargetPath()).setSampler(ns));
  }
  console.log(name, anim.listChannels().length, 'channels');
}
await io.write(outF, doc);
