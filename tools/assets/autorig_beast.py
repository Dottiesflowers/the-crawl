# Rig a static two-legged beast (raptor, T-rex: body along one horizontal axis, two legs) and key its own clips.
# usage: python3 -I autorig_beast.py in.glb out.glb
import bpy, sys, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix
inp, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=inp)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in bpy.context.scene.objects: o.select_set(False)
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(meshes) > 1: bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
for o in list(bpy.context.scene.objects):
    if o != body: bpy.data.objects.remove(o, do_unlink=True)
V = np.array([body.matrix_world @ v.co for v in body.data.vertices])
zmin, zmax = V[:, 2].min(), V[:, 2].max(); H = zmax - zmin
# the long axis: x or y, whichever spans more
ax = 0 if np.ptp(V[:, 0]) > np.ptp(V[:, 1]) else 1; lat = 1 - ax
lo, hi = V[:, ax].min(), V[:, ax].max(); Lb = hi - lo
def endH(a0, a1):
    m = (V[:, ax] >= a0) & (V[:, ax] <= a1); return V[m][:, 2].max() if m.any() else 0
headAtHi = endH(hi - 0.15 * Lb, hi) > endH(lo, lo + 0.15 * Lb)
sgn = 1 if headAtHi else -1  # +sgn along the axis is forward
def at(t, z, side=0.0):  # t: 0 tail end .. 1 head end along the body; z height
    p = [0.0, 0.0, z]; p[ax] = (lo + t * Lb) if headAtHi else (hi - t * Lb); p[lat] = np.median(V[:, lat]) + side; return Vector(p)
# legs: low vertices, split either side of the body's middle line
low = V[V[:, 2] < zmin + 0.25 * H]; mid = np.median(V[:, lat])
legT = ((low[:, ax] - lo) / Lb) if headAtHi else ((hi - low[:, ax]) / Lb); tL = float(np.median(legT))
sideW = float(np.median(np.abs(low[:, lat] - mid))) or 0.08 * H
def body_z(t):  # the middle height of the body at t
    m = np.abs((((V[:, ax] - lo) / Lb) if headAtHi else ((hi - V[:, ax]) / Lb)) - t) < 0.04
    return float((V[m][:, 2].max() + V[m][:, 2].min()) / 2) if m.any() else zmin + 0.6 * H
hipZ = body_z(tL)
J = {'Root': at(tL, hipZ)}
# spine forward to the head, tail back to the tip
spineT = [tL, tL + (1 - tL) * 0.3, tL + (1 - tL) * 0.6, tL + (1 - tL) * 0.82, 1.0]
names = ['Root', 'Spine', 'Neck', 'Head', 'HeadEnd']
for n, t in zip(names, spineT): J[n] = at(t, body_z(min(t, 0.97)))
tailT = [tL, tL * 0.72, tL * 0.48, tL * 0.25, 0.0]; tn = ['Root', 'Tail1', 'Tail2', 'Tail3', 'TailEnd']
for n, t in zip(tn[1:], tailT[1:]): J[n] = at(t, body_z(max(t, 0.03)))
for s, X in (('L', 1), ('R', -1)):
    J[s + 'Thigh'] = at(tL, hipZ - 0.05 * H, X * sideW * 0.9); J[s + 'Shin'] = at(tL + 0.03, zmin + 0.35 * H, X * sideW); J[s + 'Foot'] = at(tL - 0.03, zmin + 0.06 * H, X * sideW); J[s + 'Toe'] = at(tL + 0.07, zmin, X * sideW)
chain = [('Root', 'Spine', None), ('Spine', 'Neck', 'Root'), ('Neck', 'Head', 'Spine'), ('Head', 'HeadEnd', 'Neck'),
         ('Tail1', 'Tail2', 'Root'), ('Tail2', 'Tail3', 'Tail1'), ('Tail3', 'TailEnd', 'Tail2')]
for s in ('L', 'R'): chain += [(s + 'Thigh', s + 'Shin', 'Root'), (s + 'Shin', s + 'Foot', s + 'Thigh'), (s + 'Foot', s + 'Toe', s + 'Shin')]
arm = bpy.data.armatures.new('Armature'); rig = bpy.data.objects.new('Armature', arm); bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
for name, tail, par in chain:
    b = arm.edit_bones.new(name); b.head = J[name] if name != 'Tail1' else J['Root']; b.tail = J[tail]
    if name == 'Tail1': b.head = J['Root']; b.tail = J['Tail2']
    if par: b.parent = arm.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT')
for o in bpy.context.scene.objects: o.select_set(False)
body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
try: bpy.ops.object.parent_set(type='ARMATURE_AUTO')
except Exception as e: print('auto weights failed', e)
bones = [(b.name, rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local) for b in rig.data.bones]
def segd(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(ab.length_squared, 1e-9))); return (a + ab * t - p).length
fix = 0
for v in body.data.vertices:  # vertices heat weighting missed: blend the two nearest bones by inverse square distance
    if sum(g.weight for g in v.groups) > 1e-4: continue
    p = body.matrix_world @ v.co; ds = sorted(((segd(p, q[1], q[2]) + 1e-4 * H, q[0]) for q in bones))[:2]
    ws = [1 / (d * d) for d, _ in ds]; tot = sum(ws)
    for (d, nm), w in zip(ds, ws):
        vg = body.vertex_groups.get(nm) or body.vertex_groups.new(name=nm); vg.add([v.index], w / tot, 'REPLACE')
    fix += 1
print('fixed unweighted', fix, 'of', len(body.data.vertices), 'long axis', 'xy'[ax], 'head at', 'hi' if headAtHi else 'lo', 'legs at', round(tL, 2))
# ---- clips, keyed in armature-space axes ----
F = Vector((0, 0, 0)); F[ax] = sgn; Lat = Vector((0, 0, 0)); Lat[lat] = 1; Up = Vector((0, 0, 1))
rig.animation_data_create(); fps = 30; bpy.context.scene.render.fps = fps
def rotq(axis, deg): return Quaternion(axis, math.radians(deg))
def key(action, frame, poses, root_off=None):
    for bn, q in poses.items():
        pb = rig.pose.bones[bn]; M = pb.bone.matrix_local.to_3x3(); qb = (M.inverted() @ q.to_matrix() @ M).to_quaternion()
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = qb; pb.keyframe_insert('rotation_quaternion', frame=frame, group=bn)
    if root_off is not None:
        pb = rig.pose.bones['Root']; M = pb.bone.matrix_local.to_3x3(); pb.location = M.inverted() @ root_off; pb.keyframe_insert('location', frame=frame, group='Root')
ALL = [b.name for b in rig.data.bones]
def clip(name, nF, fn):
    act = bpy.data.actions.new(name); rig.animation_data.action = act
    for f in range(nF + 1):
        t = f / nF; poses = {b: Quaternion() for b in ALL}; off = Vector()
        fn(t, poses, off); key(act, f + 1, poses, off)
    tr = rig.animation_data.nla_tracks.new(); tr.name = name; st = tr.strips.new(name, 1, act); rig.animation_data.action = None
def walk(t, P, off):
    w = 2 * math.pi * t
    for s, ph in (('L', 0), ('R', math.pi)):
        P[s + 'Thigh'] = rotq(Lat, 28 * math.sin(w + ph) * -sgn); P[s + 'Shin'] = rotq(Lat, (18 * max(0, math.sin(w + ph + 1.2))) * sgn); P[s + 'Foot'] = rotq(Lat, -10 * math.sin(w + ph) * -sgn)
    for i, b in enumerate(('Tail1', 'Tail2', 'Tail3')): P[b] = rotq(Up, 9 * math.sin(w - 0.6 * (i + 1)))
    P['Neck'] = rotq(Up, -4 * math.sin(w)); P['Head'] = rotq(Lat, 4 * math.sin(2 * w) * sgn); off.z = abs(math.sin(w)) * 0.03 * H
def idle(t, P, off):
    w = 2 * math.pi * t
    for i, b in enumerate(('Tail1', 'Tail2', 'Tail3')): P[b] = rotq(Up, 5 * math.sin(w - 0.5 * i))
    P['Spine'] = rotq(Lat, 1.5 * math.sin(2 * w) * sgn); P['Neck'] = rotq(Up, 10 * math.sin(w)); P['Head'] = rotq(Lat, 5 * math.sin(2 * w + 1) * sgn)
def attack(t, P, off):
    k = math.sin(min(1, t / 0.45) * math.pi / 2) if t < 0.45 else max(0, 1 - (t - 0.45) / 0.55); k2 = k * k
    P['Spine'] = rotq(Lat, 10 * k2 * sgn); P['Neck'] = rotq(Lat, 22 * k2 * sgn); P['Head'] = rotq(Lat, 18 * k * sgn)
    for s in ('L', 'R'): P[s + 'Thigh'] = rotq(Lat, -14 * k2 * -sgn)
    for b in ('Tail1', 'Tail2'): P[b] = rotq(Lat, -8 * k2 * sgn)
    off.x, off.y = (F * (0.12 * H * k2)).x, (F * (0.12 * H * k2)).y; off.z = -0.03 * H * k2
def hit(t, P, off):
    k = math.sin(t * math.pi); P['Spine'] = rotq(Lat, -10 * k * sgn); P['Neck'] = rotq(Lat, -18 * k * sgn); P['Head'] = rotq(Up, 15 * k)
    off.x, off.y = (F * (-0.06 * H * k)).x, (F * (-0.06 * H * k)).y
def death(t, P, off):
    k = min(1, t / 0.6); k = k * k * (3 - 2 * k)
    P['Root'] = rotq(F, 85 * k); P['Neck'] = rotq(Lat, -25 * k * sgn); P['Head'] = rotq(Lat, -20 * k * sgn)
    for s in ('L', 'R'): P[s + 'Thigh'] = rotq(Lat, 20 * k * -sgn); P[s + 'Shin'] = rotq(Lat, 30 * k * sgn)
    for b in ('Tail1', 'Tail2', 'Tail3'): P[b] = rotq(Up, 12 * k)
    off.z = -(hipZ - zmin) * 0.55 * k
clip('Idle', 90, idle); clip('Walk', 24, walk); clip('Attack', 24, attack); clip('Hit', 12, hit); clip('Death', 45, death)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_yup=True)
print('done', out)
