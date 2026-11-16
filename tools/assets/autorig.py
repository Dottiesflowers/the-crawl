# Rig a static humanoid mesh (standing, arms down or out) with a Mixamo-named skeleton fitted to its shape, automatic weights.
# usage: python3 autorig.py in.glb out.glb
import bpy, sys, math
import numpy as np
from mathutils import Vector
inp, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=inp)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# bake every transform into the meshes and join them
for o in bpy.context.scene.objects: o.select_set(False)
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
for o in meshes:
    o.data = o.data.copy() if o.data.users > 1 else o.data
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1: bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o != body: bpy.data.objects.remove(o, do_unlink=True)
V = np.array([body.matrix_world @ v.co for v in body.data.vertices])  # Blender: Z up, model faces -Y after the glTF import
zmin, zmax = V[:, 2].min(), V[:, 2].max(); H = zmax - zmin; cx = (V[:, 0].min() + V[:, 0].max()) / 2; cy = np.median(V[:, 1])
def band(z0, z1): return V[(V[:, 2] >= zmin + z0 * H) & (V[:, 2] <= zmin + z1 * H)]
def P(x, y, z): return Vector((x, y, z))
# legs: the vertices low down split left/right of the middle
lb = band(0.15, 0.35); Lx = np.median(lb[lb[:, 0] > cx][:, 0]) if (lb[:, 0] > cx).any() else cx + 0.1 * H; Rx = np.median(lb[lb[:, 0] < cx][:, 0]) if (lb[:, 0] < cx).any() else cx - 0.1 * H
hipZ = zmin + 0.5 * H
# torso width just under the armpits, from the middle 60% of that band's points
tb = band(0.62, 0.7); tw = np.percentile(np.abs(tb[:, 0] - cx), 70)
sh = band(0.76, 0.84); shX = np.percentile(np.abs(sh[:, 0] - cx), 92)
# hands: the outermost points in the arm band; if the arms hang, the hand is low; if they are out (T pose), out at shoulder height
ab = band(0.35, 0.86); outer = ab[np.abs(ab[:, 0] - cx) > tw * 1.05]
def hand(side):
    pts = outer[(outer[:, 0] - cx) * side > 0]
    if len(pts) < 10: return P(cx + side * shX * 1.6, cy, zmin + 0.5 * H)
    far = np.abs(pts[:, 0] - cx).max()
    if far > shX * 1.8: tip = pts[np.argmax(np.abs(pts[:, 0] - cx))]; return P(tip[0] - side * 0.06 * H, tip[1], tip[2])  # arms out
    lo = pts[pts[:, 2] < np.percentile(pts[:, 2], 12)]; m = lo.mean(axis=0); return P(m[0], m[1], m[2] + 0.04 * H)
hL, hR = hand(1), hand(-1)
J = {}
J['Hips'] = P(cx, cy, hipZ); J['Spine'] = P(cx, cy, zmin + 0.58 * H); J['Spine1'] = P(cx, cy, zmin + 0.66 * H); J['Spine2'] = P(cx, cy, zmin + 0.74 * H)
J['Neck'] = P(cx, cy, zmin + 0.84 * H); J['Head'] = P(cx, cy, zmin + 0.88 * H); J['HeadTop_End'] = P(cx, cy, zmax)
for s, X, hand_ in [('Left', 1, hL), ('Right', -1, hR)]:
    sx = cx + X * shX * 0.92; shz = zmin + 0.8 * H
    J[s + 'Shoulder'] = P(cx + X * shX * 0.25, cy, shz); J[s + 'Arm'] = P(sx, cy, shz)
    J[s + 'ForeArm'] = (J[s + 'Arm'] + hand_) / 2 + Vector((0, 0.02 * H, 0)); J[s + 'Hand'] = hand_
    J[s + 'HandEnd'] = hand_ + (hand_ - J[s + 'ForeArm']).normalized() * 0.07 * H
    lx = Lx if X > 0 else Rx
    J[s + 'UpLeg'] = P(lx, cy, hipZ - 0.04 * H); J[s + 'Leg'] = P(lx, cy - 0.01 * H, zmin + 0.27 * H); J[s + 'Foot'] = P(lx, cy, zmin + 0.05 * H); J[s + 'ToeBase'] = P(lx, cy - 0.08 * H, zmin + 0.01 * H); J[s + 'ToeEnd'] = P(lx, cy - 0.13 * H, zmin)
chain = [('Hips', 'Spine', None), ('Spine', 'Spine1', 'Hips'), ('Spine1', 'Spine2', 'Spine'), ('Spine2', 'Neck', 'Spine1'), ('Neck', 'Head', 'Spine2'), ('Head', 'HeadTop_End', 'Neck')]
for s in ('Left', 'Right'):
    chain += [(s + 'Shoulder', s + 'Arm', 'Spine2'), (s + 'Arm', s + 'ForeArm', s + 'Shoulder'), (s + 'ForeArm', s + 'Hand', s + 'Arm'), (s + 'Hand', s + 'HandEnd', s + 'ForeArm'),
              (s + 'UpLeg', s + 'Leg', 'Hips'), (s + 'Leg', s + 'Foot', s + 'UpLeg'), (s + 'Foot', s + 'ToeBase', s + 'Leg'), (s + 'ToeBase', s + 'ToeEnd', s + 'Foot')]
arm = bpy.data.armatures.new('Armature'); rig = bpy.data.objects.new('Armature', arm); bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
for name, tail, par in chain:
    b = arm.edit_bones.new(name); b.head = J[name]; b.tail = J[tail]
    if (b.tail - b.head).length < 1e-4: b.tail = b.head + Vector((0, 0, 0.05 * H))
    if par: b.parent = arm.edit_bones[par]; b.use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')
for o in bpy.context.scene.objects: o.select_set(False)
body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
try:
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
except Exception as e:
    print('auto weights failed', e)
ok = sum(1 for v in body.data.vertices if len(v.groups))
if ok < len(body.data.vertices) * 0.9:
    print('heat weighting incomplete (%d/%d), using envelopes' % (ok, len(body.data.vertices)))
    for vg in list(body.vertex_groups): body.vertex_groups.remove(vg)
    body.parent = None; body.modifiers.clear()
    for o in bpy.context.scene.objects: o.select_set(False)
    body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
# any vertex left with no weights goes wholly to the nearest bone (unweighted vertices fly apart in three.js)
bones = [(b.name, rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local) for b in rig.data.bones]
def segd(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(ab.length_squared, 1e-9))); return (a + ab * t - p).length
fix = 0
for v in body.data.vertices:
    if sum(g.weight for g in v.groups) > 1e-4: continue
    p = body.matrix_world @ v.co; nm = min(bones, key=lambda q: segd(p, q[1], q[2]))[0]
    vg = body.vertex_groups.get(nm) or body.vertex_groups.new(name=nm); vg.add([v.index], 1.0, 'REPLACE'); fix += 1
print('fixed unweighted', fix)
# mesh islands: a small piece at a hand (a held prop) goes rigidly with that hand; a loose piece nearer the body than the arm drops its arm weights
nv = len(body.data.vertices); par_ = list(range(nv))
def fnd(i):
    while par_[i] != i: par_[i] = par_[par_[i]]; i = par_[i]
    return i
for e in body.data.edges:
    a1, b1 = fnd(e.vertices[0]), fnd(e.vertices[1])
    if a1 != b1: par_[a1] = b1
isl = {}
for i in range(nv): isl.setdefault(fnd(i), []).append(i)
ARM = [n for n in ('LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand')]
bseg = {q[0]: (q[1], q[2]) for q in bones}
gidx = {vg.index: vg.name for vg in body.vertex_groups}
rigid = strip = 0
for root_, ids in isl.items():
    if len(ids) > nv * 0.3: continue
    pts = [body.matrix_world @ body.data.vertices[i].co for i in ids]; c = sum(pts, Vector()) / len(pts)
    ext = max((p - c).length for p in pts)
    for hn in ('RightHand', 'LeftHand'):
        hp = J[hn]
        if min((p - hp).length for p in pts) < 0.05 * H and ext < 0.45 * H:
            for vg in body.vertex_groups: vg.remove(ids)
            (body.vertex_groups.get(hn) or body.vertex_groups.new(name=hn)).add(ids, 1.0, 'REPLACE'); rigid += 1; break
    else:
        dA = min(segd(c, *bseg[n]) for n in ARM); oth = min(((segd(c, *bseg[n]), n) for n in bseg if n not in ARM), key=lambda q: q[0])
        if oth[0] < dA:
            for vg in body.vertex_groups:
                if vg.name in ARM: vg.remove(ids)
            for i in ids:
                v = body.data.vertices[i]
                if sum(g.weight for g in v.groups) < 1e-4: (body.vertex_groups.get(oth[1]) or body.vertex_groups.new(name=oth[1])).add([i], 1.0, 'REPLACE')
            strip += 1
print('islands', len(isl), 'rigid to a hand', rigid, 'arm weights stripped', strip)
print('weighted', sum(1 for v in body.data.vertices if len(v.groups)), '/', len(body.data.vertices), 'H', round(H, 3), 'hands', [round(c, 3) for c in hL], [round(c, 3) for c in hR])
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=False, export_skins=True, export_yup=True)
