// Retarget the UAL clips (anims.glb, the player's animation library) onto another humanoid rig, in world space with bone-direction
// alignment, so A-pose and T-pose rigs both come out right. Also computes a weapon grip on the right hand that matches the player's.
// usage: node retarget.mjs in.json out.json clips   e.g.  Walk=Walk_Loop,Attack=Sword_Attack,Hit=Hit_Chest,Death=Death01[,Idle=Sword_Idle]
// A clip name the model already has is kept unless prefixed with ! (e.g. !Idle=Sword_Idle).
import fs from 'fs';
import * as THREE from 'three';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [, , inF, outF, spec] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const J = JSON.parse(fs.readFileSync(inF, 'utf8'));
const glbBuf = Buffer.from(J.glb.split(',').pop(), 'base64');
const doc = await io.readBinary(new Uint8Array(glbBuf)), root = doc.getRoot();
const src = await io.read('/home/claude/kitwork/anims.glb'), sroot = src.getRoot();

const norm = n => String(n).replace(/_\d+$/, '').replace(/^.*:/, '').replace(/^UnknownSoldier_/, '').replace(/^CC_Base_/, '').replace(/^M_/, '');
const SEM = ['hips', 's1', 's2', 's3', 'neck', 'head', 'clav_l', 'ua_l', 'la_l', 'hand_l', 'fing_l', 'th_l', 'calf_l', 'foot_l', 'ball_l', 'clav_r', 'ua_r', 'la_r', 'hand_r', 'fing_r', 'th_r', 'calf_r', 'foot_r', 'ball_r'];
const FAM = {
  ual: { hips: 'pelvis', s1: 'spine_01', s2: 'spine_02', s3: 'spine_03', neck: 'neck_01', head: 'Head', clav_l: 'clavicle_l', ua_l: 'upperarm_l', la_l: 'lowerarm_l', hand_l: 'hand_l', fing_l: 'middle_01_l', th_l: 'thigh_l', calf_l: 'calf_l', foot_l: 'foot_l', ball_l: 'ball_l' },
  mixamo: { hips: 'Hips', s1: 'Spine', s2: 'Spine1', s3: 'Spine2', neck: 'Neck', head: 'Head', clav_l: 'LeftShoulder', ua_l: 'LeftArm', la_l: 'LeftForeArm', hand_l: 'LeftHand', fing_l: 'LeftHandMiddle1', th_l: 'LeftUpLeg', calf_l: 'LeftLeg', foot_l: 'LeftFoot', ball_l: 'LeftToeBase' },
  crew: { hips: 'pelvis', s1: 'spine', s2: 'chest', neck: 'neck', head: 'head', clav_l: 'shoulder_left', ua_l: 'upper_arm_left', la_l: 'forearm_left', hand_l: 'hand_left', th_l: 'thigh_left', calf_l: 'shin.L', foot_l: 'foot_left' },
  cc: { hips: 'Hip', s1: 'Waist', s2: 'Spine01', s3: 'Spine02', head: 'Head', clav_l: 'L_Clavicle', ua_l: 'L_Upperarm', la_l: 'L_Forearm', hand_l: 'L_Hand', fing_l: 'L_Mid1', th_l: 'L_Thigh', calf_l: 'L_Calf', foot_l: 'L_Foot', ball_l: 'L_ToeBase' },
  dracul: { hips: 'Pelvis', s1: 'Spine1', s2: 'Spine2', s3: 'Spine3', neck: 'Neck', head: 'Head', clav_l: 'L_Clav', ua_l: 'L_Shoulder', la_l: 'L_Forearm', hand_l: 'L_Wrist', th_l: 'L_Thigh', calf_l: 'L_Knee', foot_l: 'L_Ankle', ball_l: 'L_Foot' }
};
const mirror = n => n.replace(/_l$/, '_r').replace(/^Left/, 'Right').replace(/LeftHand/, 'RightHand').replace(/_left$/, '_right').replace(/\.L$/, '.R').replace(/^L_/, 'R_');
for (const f of Object.values(FAM)) for (const k of Object.keys(f)) if (k.endsWith('_l')) f[k.replace(/_l$/, '_r')] = mirror(f[k]);
const CHILD = { hips: 's1', s1: 's2', s2: 's3', s3: 'neck', neck: 'head', clav_l: 'ua_l', ua_l: 'la_l', la_l: 'hand_l', hand_l: 'fing_l', th_l: 'calf_l', calf_l: 'foot_l', foot_l: 'ball_l', clav_r: 'ua_r', ua_r: 'la_r', la_r: 'hand_r', hand_r: 'fing_r', th_r: 'calf_r', calf_r: 'foot_r', foot_r: 'ball_r' };
const PARENT = {}; for (const k in CHILD) PARENT[CHILD[k]] = k;

function tree(r) { // gltf-transform nodes -> THREE objects
  const map = new Map(); const sc = r.listScenes()[0]; const top = new THREE.Object3D();
  const mk = (n, par) => { const o = new THREE.Object3D(); o.name = n.getName(); o.position.fromArray(n.getTranslation()); o.quaternion.fromArray(n.getRotation()); o.scale.fromArray(n.getScale()); par.add(o); map.set(n, o); n.listChildren().forEach(c => mk(c, o)); };
  const kids = new Set(); r.listNodes().forEach(n => n.listChildren().forEach(c => kids.add(c)));
  r.listNodes().filter(n => !kids.has(n)).forEach(n => mk(n, top)); top.updateMatrixWorld(true); return { top, map };
}
function semMap(r, famName) {
  const byN = {}, byR = {}; r.listNodes().forEach(n => { const k = norm(n.getName()); if (!(k in byN)) byN[k] = n; byR[n.getName()] = n; });
  let fam = famName; if (!fam) fam = byN.LeftUpLeg ? 'mixamo' : byN.upper_arm_left ? 'crew' : byN.L_Upperarm ? 'cc' : byN.L_Shoulder && byN.L_Knee ? 'dracul' : byN.upperarm_l ? 'ual' : null;
  if (!fam) throw new Error('unknown rig'); const out = {}; for (const s of SEM) { const nm = FAM[fam][s]; const n = nm && (byR[nm] || byN[nm]); if (n) out[s] = n; } return { fam, m: out };
}
const S = tree(sroot), T = tree(root);
const sm = semMap(sroot, 'ual').m, tmI = semMap(root), tm = tmI.m;
const used = SEM.filter(s => sm[s] && tm[s]);
const wpos = (TR, n) => TR.map.get(n).getWorldPosition(new THREE.Vector3());
const wq = (TR, n) => TR.map.get(n).getWorldQuaternion(new THREE.Quaternion());
// global yaw: line the rigs' left-right axes up
const latS = wpos(S, sm.th_l).sub(wpos(S, sm.th_r)), latT = wpos(T, tm.th_l).sub(wpos(T, tm.th_r)); latS.y = 0; latT.y = 0;
const G = new THREE.Quaternion().setFromUnitVectors(latS.normalize(), latT.normalize()), Gi = G.clone().invert();
const hgt = (TR, m) => wpos(TR, m.head).y - Math.min(wpos(TR, m.foot_l).y, wpos(TR, m.foot_r).y);
const k = hgt(T, tm) / hgt(S, sm);
// rest frames and bone-direction alignment
const RS = {}, RT = {}, AL = {};
for (const s of used) { RS[s] = wq(S, sm[s]); RT[s] = wq(T, tm[s]); }
function align(s) { if (!sm[s] || !tm[s]) return PARENT[s] ? align(PARENT[s]) : new THREE.Quaternion(); let c = CHILD[s]; while (c && !(sm[c] && tm[c])) c = CHILD[c];
  if (c) { const dS = wpos(S, sm[c]).sub(wpos(S, sm[s])).applyQuaternion(G).normalize(), dT = wpos(T, tm[c]).sub(wpos(T, tm[s])).normalize(); return new THREE.Quaternion().setFromUnitVectors(dT, dS); } return PARENT[s] ? align(PARENT[s]) : new THREE.Quaternion(); }
for (const s of used) AL[s] = align(s);
// depth order (parents first)
const depth = n => { let d = 0, o = T.map.get(n); while (o.parent) { d++; o = o.parent; } return d; };
const order = used.slice().sort((a, b) => depth(tm[a]) - depth(tm[b]));
// sampling helpers
function sampler(ch) { const sp = ch.getSampler(), ia = sp.getInput(), oa = sp.getOutput(), n = ia.getCount(), w = oa.getElementSize(), ti = new Float32Array(n), vo = new Float32Array(n * w), e = [];
  for (let i = 0; i < n; i++) { ti[i] = ia.getElement(i, [])[0]; oa.getElement(i, e); for (let c = 0; c < w; c++) vo[i * w + c] = e[c]; } return { ti, vo, w }; }
function at(s, t, out) { const { ti, vo, w } = s; let i = 0; while (i < ti.length - 1 && ti[i + 1] < t) i++; const j = Math.min(i + 1, ti.length - 1), a = ti[i], b = ti[j], f = b > a ? Math.min(1, Math.max(0, (t - a) / (b - a))) : 0;
  if (w === 4) { const q1 = new THREE.Quaternion().fromArray(vo, i * 4), q2 = new THREE.Quaternion().fromArray(vo, j * 4); return q1.slerp(q2, f); }
  return new THREE.Vector3().fromArray(vo, i * 3).lerp(new THREE.Vector3().fromArray(vo, j * 3), f); }
const buf = root.listBuffers()[0];
const have = new Set(root.listAnimations().map(a => a.getName()));
const restS = new Map(), restT = new Map(); S.map.forEach((o, n) => restS.set(o, [o.position.clone(), o.quaternion.clone()])); T.map.forEach((o, n) => restT.set(o, [o.position.clone(), o.quaternion.clone()]));
const hipsRestW = wpos(T, tm.hips), hipsRestS = wpos(S, sm.hips); if (process.env.DBG2) { const po = T.map.get(tm.hips).parent; console.log("hips parent", po.name, po.matrixWorld.determinant(), hipsRestW, hipsRestS, k); }
for (const item of spec.split(',')) {
  let [name, clip] = item.split('='); const force = name.startsWith('!'); name = name.replace('!', '');
  if (have.has(name) && !force) { console.log('keep', name); continue; }
  if (force) root.listAnimations().filter(a => a.getName() === name).forEach(a => a.dispose());
  const sa = sroot.listAnimations().find(a => a.getName() === clip); if (!sa) { console.log('no clip', clip); continue; }
  const chans = sa.listChannels().map(c => ({ o: S.map.get(c.getTargetNode()), path: c.getTargetPath(), s: sampler(c) })).filter(c => c.o);
  const dur = Math.max(...chans.map(c => c.s.ti[c.s.ti.length - 1])), fps = 30, nF = Math.max(2, Math.round(dur * fps) + 1);
  const times = new Float32Array(nF), rot = {}, hipT = new Float32Array(nF * 3); used.forEach(s => rot[s] = new Float32Array(nF * 4));
  for (let f = 0; f < nF; f++) {
    const t = times[f] = Math.min(dur, f / fps);
    restS.forEach((v, o) => { o.position.copy(v[0]); o.quaternion.copy(v[1]); });
    for (const c of chans) { const v = at(c.s, t); if (c.path === 'rotation') c.o.quaternion.copy(v); else if (c.path === 'translation') c.o.position.copy(v); }
    S.top.updateMatrixWorld(true); restT.forEach((v, o) => { o.position.copy(v[0]); o.quaternion.copy(v[1]); }); T.top.updateMatrixWorld(true);
    for (const s of order) {
      const qS = wq(S, sm[s]), delta = qS.multiply(RS[s].clone().invert()), dT = G.clone().multiply(delta).multiply(Gi);
      const want = dT.multiply(AL[s]).multiply(RT[s]); const o = T.map.get(tm[s]), pq = o.parent.getWorldQuaternion(new THREE.Quaternion());
      o.quaternion.copy(pq.invert().multiply(want)); o.updateMatrixWorld(true); o.quaternion.toArray(rot[s], f * 4);
    }
    // the hips follow the source's pelvis (scaled), in place for walks
    const d = wpos(S, sm.hips).sub(hipsRestS).applyQuaternion(G).multiplyScalar(k); if (process.env.DBG2 && f < 2) console.log("d", f, wpos(S, sm.hips), d); if (/Walk|Jog/.test(clip)) { d.x = 0; d.z = 0; }
    const o = T.map.get(tm.hips), wantW = hipsRestW.clone().add(d), loc = o.parent.worldToLocal(wantW); loc.toArray(hipT, f * 3);
  }
  const anim = doc.createAnimation(name), inA = doc.createAccessor().setType('SCALAR').setArray(times).setBuffer(buf);
  for (const s of used) { const sp = doc.createAnimationSampler().setInput(inA).setOutput(doc.createAccessor().setType('VEC4').setArray(rot[s]).setBuffer(buf)).setInterpolation('LINEAR'); anim.addSampler(sp).addChannel(doc.createAnimationChannel().setTargetNode(tm[s]).setTargetPath('rotation').setSampler(sp)); }
  const sp2 = doc.createAnimationSampler().setInput(inA).setOutput(doc.createAccessor().setType('VEC3').setArray(hipT).setBuffer(buf)).setInterpolation('LINEAR'); anim.addSampler(sp2).addChannel(doc.createAnimationChannel().setTargetNode(tm.hips).setTargetPath('translation').setSampler(sp2));
  console.log('made', name, '<-', clip, nF, 'frames,', used.length, 'bones');
}
// the grip: where the player's weapon sits on hand_r (0, 0.085, 0.015 in the hand's frame, same rotation), carried over to this rig
restS.forEach((v, o) => { o.position.copy(v[0]); o.quaternion.copy(v[1]); }); restT.forEach((v, o) => { o.position.copy(v[0]); o.quaternion.copy(v[1]); }); S.top.updateMatrixWorld(true); T.top.updateMatrixWorld(true);
function grip(side) { const hS = S.map.get(sm['hand_' + side]), hT = T.map.get(tm['hand_' + side]);
  const gripS = new THREE.Vector3(0, 0.085, side === 'r' ? 0.015 : -0.015).applyMatrix4(hS.matrixWorld).sub(hS.getWorldPosition(new THREE.Vector3()));
  const posW = hT.getWorldPosition(new THREE.Vector3()).add(gripS.applyQuaternion(G).multiplyScalar(k)), qW = G.clone().multiply(RS['hand_' + side]);
  const boneAl = new THREE.Matrix4().compose(hT.getWorldPosition(new THREE.Vector3()), AL['hand_' + side].clone().multiply(RT['hand_' + side]), hT.getWorldScale(new THREE.Vector3()));
  const wantM = new THREE.Matrix4().compose(posW, qW, new THREE.Vector3(1, 1, 1).multiplyScalar(k));
  const L = boneAl.clone().invert().multiply(wantM), lp = new THREE.Vector3(), lq = new THREE.Quaternion(), ls = new THREE.Vector3(); L.decompose(lp, lq, ls);
  return { bone: tm['hand_' + side].getName(), p: lp.toArray().map(v => +v.toFixed(5)), q: lq.toArray().map(v => +v.toFixed(5)), s: +ls.x.toFixed(5) }; }
J.grip = grip('r'); J.gripL = grip('l');
const outB = await io.writeBinary(doc);
J.glb = Buffer.from(outB).toString('base64');
fs.writeFileSync(outF, JSON.stringify(J)); console.log(tmI.fam, 'k', k.toFixed(3), 'grip', JSON.stringify(J.grip), (fs.statSync(outF).size / 1e6).toFixed(2) + 'MB');
