# Build modern clothes as shells of the Quaternius Regular Male body, so they share its
# skeleton and skin weights and animate with the existing rig. Output: modern.glb
import json, struct, numpy as np
D = "/home/claude/src2/chars/Base Characters/Exports/Godot - UE/"
g = json.load(open(D + "Regular_Male_FullBody.gltf")); BIN = open(D + "Regular_Male_FullBody.bin", 'rb').read()
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def acc(i):
    a = g['accessors'][i]; v = g['bufferViews'][a['bufferView']]; dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0); st = v.get('byteStride', 0) or dt.itemsize * n
    return np.ndarray((a['count'], n), dtype=dt, buffer=BIN, offset=off, strides=(st, dt.itemsize)).copy()
pr = g['meshes'][2]['primitives'][0]
P = acc(pr['attributes']['POSITION']).astype(np.float64); N = acc(pr['attributes']['NORMAL']).astype(np.float64)
J = acc(pr['attributes']['JOINTS_0']).astype(np.uint16); W = acc(pr['attributes']['WEIGHTS_0']).astype(np.float32)
UV0 = acc(pr['attributes']['TEXCOORD_0']).astype(np.float32)
I = acc(pr['indices']).reshape(-1, 3).astype(np.uint32)
sk = g['skins'][0]; names = [g['nodes'][j]['name'] for j in sk['joints']]
IBM = acc(sk['inverseBindMatrices']).reshape(-1, 4, 4)
JP = {nm: np.linalg.inv(IBM[i].T)[:3, 3] for i, nm in enumerate(names)}

# smooth vertex normals by position (the mesh has UV seams) so shells don't split open
key = np.round(P * 2000).astype(np.int64); _, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
Ns = np.zeros((inv.max() + 1, 3)); np.add.at(Ns, inv, N); Ns = Ns[inv]; Ns /= np.linalg.norm(Ns, axis=1, keepdims=True) + 1e-9

def grp(nm):
    if nm in ('Head',): return 'head'
    if nm == 'neck_01': return 'neck'
    if nm.startswith('spine') or nm.startswith('clavicle'): return 'torso'
    if nm in ('pelvis', 'root'): return 'pelvis'
    for k in ('upperarm', 'lowerarm', 'thigh', 'calf'):
        if nm.startswith(k): return k
    if nm.startswith('hand') or any(nm.startswith(f) for f in ('index', 'middle', 'ring', 'pinky', 'thumb')): return 'hand'
    if nm.startswith('foot') or nm.startswith('ball'): return 'foot'
    return 'other'
G = np.array([grp(nm) for nm in names])
dom = J[np.arange(len(J)), W.argmax(1)]; DG = G[dom]
x, y, z = P[:, 0], P[:, 1], P[:, 2]; ax = np.abs(x)
# parameter along the limb (0 at the joint, 1 at the next joint)
ua = (ax - JP['upperarm_l'][0]) / (JP['lowerarm_l'][0] - JP['upperarm_l'][0])
la = (ax - JP['lowerarm_l'][0]) / (JP['hand_l'][0] - JP['lowerarm_l'][0])
th = (JP['thigh_l'][1] - y) / (JP['thigh_l'][1] - JP['calf_l'][1])
cf = (JP['calf_l'][1] - y) / (JP['calf_l'][1] - JP['foot_l'][1])
BELT = 1.03; HEM = 0.90; NECK = JP['neck_01'][1] - 0.035
torso = ((DG == 'torso') | ((DG == 'pelvis') & (y > HEM)) | ((DG == 'neck') & (y < NECK))) & (ax < 0.2)
armup = (ax >= 0.12) & (y > 1.30) & (DG != 'thigh')
def shirt(sleeve):  # sleeve: fraction along the arm (0..2: upperarm then lowerarm)
    m = torso.copy()
    alen = np.where(ax < JP['lowerarm_l'][0], np.clip(ua, 0, 1), 1 + np.clip(la, 0, 1.5))
    m |= armup & (alen <= sleeve) & (y > 1.33)
    return m & (DG != 'hand') & (DG != 'head')
legs_all = ((DG == 'pelvis') & (y <= BELT + 0.02)) | (DG == 'thigh') | (DG == 'calf')
def pants(lenf):  # lenf: along the leg 0..2 (thigh then calf)
    llen = np.where(y > JP['calf_l'][1], np.clip(th, 0, 1), 1 + np.clip(cf, 0, 1.5))
    return legs_all & ((DG == 'pelvis') | (llen <= lenf)) & (y <= BELT + 0.02) & (y > 0.02)
feet = (DG == 'foot') | ((DG == 'calf') & (cf > 0.86))
boots = (DG == 'foot') | ((DG == 'calf') & (cf > 0.62))
headtop = (DG == 'head') & (y > JP['Head'][1] + 0.085)
headcap = (DG == 'head') & (y > JP['Head'][1] + 0.105)

def shell(mask, off, extra=None, all_in=True, smooth=0):
    t = mask[I]; keep = t.all(1) if all_in else t.any(1)
    tri = I[keep]; used = np.unique(tri); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    o = off + (0.006 * np.clip((P[used, 1] - 1.40) / 0.06, 0, 1) * (np.abs(P[used, 0]) < 0.2) if off > 0 else 0)
    pos = P[used] + Ns[used] * (o[:, None] if np.ndim(o) else o)
    if extra is not None: pos = extra(pos, used)
    if smooth and off > 0:  # drape: relax muscle detail, then keep at least the offset outside the skin
        wk = inv[used]; uk, wi = np.unique(wk, return_inverse=True); wi = wi.ravel()
        tri2 = wi[remap[tri]]; nb = len(uk)
        e = np.vstack([tri2[:, [0, 1]], tri2[:, [1, 2]], tri2[:, [2, 0]]]); e = np.vstack([e, e[:, ::-1]])
        q = np.zeros((nb, 3)); np.add.at(q, wi, pos); cnt = np.bincount(wi, minlength=nb)[:, None]; q /= cnt
        base = np.zeros((nb, 3)); np.add.at(base, wi, P[used]); base /= cnt
        nn = np.zeros((nb, 3)); np.add.at(nn, wi, Ns[used]); nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-9
        deg = np.bincount(e[:, 0], minlength=nb)[:, None]
        ek = np.sort(np.vstack([tri2[:, [0, 1]], tri2[:, [1, 2]], tri2[:, [2, 0]]]), 1); ue, ec = np.unique(ek, axis=0, return_counts=True)
        pin = np.zeros(nb, bool); pin[ue[ec == 1].ravel()] = True; q0 = q.copy()
        for _ in range(smooth):
            acc_ = np.zeros((nb, 3)); np.add.at(acc_, e[:, 0], q[e[:, 1]]); avg = acc_ / np.maximum(deg, 1)
            q = q * 0.5 + avg * 0.5; q[pin] = q0[pin]
            d = ((q - base) * nn).sum(1); q += nn * np.maximum(0, off * 0.9 - d)[:, None]
        pos = q[wi]
    return dict(pos=pos.astype(np.float32), nrm=Ns[used].astype(np.float32), j=J[used], w=W[used], idx=remap[tri].astype(np.uint32), src=used, uv=UV0[used])

def uvs(pos, nrm):  # box projection by normal direction; textures are tileable fabric
    a = np.abs(nrm); k = 4.0
    u = np.where(a[:, 0] > np.maximum(a[:, 1], a[:, 2]), pos[:, 2], np.where(a[:, 1] > a[:, 2], pos[:, 0], pos[:, 0]))
    v = np.where(a[:, 1] > np.maximum(a[:, 0], a[:, 2]), pos[:, 2], pos[:, 1])
    return np.stack([u * k, v * k], 1).astype(np.float32)

out = {}
out['Mod_Top_TShirt'] = shell(shirt(0.55), 0.0085, smooth=8)
out['Mod_Top_LongSleeve'] = shell(shirt(1.93), 0.0085, smooth=8)
out['Mod_Top_Tank'] = shell(torso & ~((DG == 'torso') & (ax > 0.13) & (y > 1.36)), 0.007, smooth=8)
def hoodie_shape(pos, used):  # looser over the belly and back
    return pos + Ns[used] * 0.008 * np.clip((1.45 - P[used, 1]) / 0.4, 0, 1)[:, None]
out['Mod_Top_Hoodie'] = shell(shirt(1.96), 0.014, hoodie_shape, smooth=12)
out['Mod_Top_ButtonUp'] = shell(shirt(1.9), 0.009, smooth=10)
# collars: a thicker ring at the neckline
collar = (DG == 'neck') & (y < NECK + 0.045) & (y > NECK - 0.02)
out['Mod_Collar'] = shell(collar | ((DG == 'torso') & (y > 1.47) & (ax < 0.09)), 0.016)
hood = (DG == 'neck') | ((DG == 'torso') & (y > 1.46) & (ax < 0.11))
out['Mod_HoodDown'] = shell(hood & (y < NECK + 0.06), 0.03)
def straight(rmin_top, rmin_bot):
    def f(pos, used):
        q = pos.copy(); yy = P[used, 1]; side = np.sign(P[used, 0]); cx = side * 0.095; cz = -0.03
        leg = (yy < 0.93) & (np.abs(P[used, 0]) > 0.015)
        r = np.hypot(q[:, 0] - cx, q[:, 2] - cz); t = np.clip((0.93 - yy) / 0.85, 0, 1); rmin = rmin_top + (rmin_bot - rmin_top) * t
        k = np.where(leg & (r < rmin), rmin / np.maximum(r, 1e-6), 1.0)
        q[:, 0] = cx + (q[:, 0] - cx) * k; q[:, 2] = cz + (q[:, 2] - cz) * k; return q
    return f
out['Mod_Legs_Jeans'] = shell(pants(1.93), 0.008, straight(0.074, 0.058), smooth=6)
out['Mod_Legs_Shorts'] = shell(pants(0.78), 0.011, straight(0.08, 0.075), smooth=6)
def baggy(pos, used): return pos + Ns[used] * 0.006
out['Mod_Legs_Sweatpants'] = shell(pants(1.95), 0.012, straight(0.08, 0.052), smooth=8)
def sole(pos, used):
    q = pos.copy(); q[:, 1] = np.maximum(q[:, 1], -0.004); return q
def sneaker(pos, used):
    q = pos.copy(); fy = P[used, 1]; q[:, 1] = np.where(fy < 0.03, q[:, 1] - 0.012, q[:, 1]); return q
out['Mod_Feet_Sneakers'] = shell(feet, 0.014, sneaker, smooth=10)
out['Mod_Feet_SneakerSole'] = shell(feet & (y < 0.035), 0.02, lambda pos, u: np.where((P[u, 1] < 0.03)[:, None], pos - [0, 0.016, 0], pos))
out['Mod_Feet_Boots'] = shell(boots, 0.016, sneaker, smooth=10)
out['Mod_Feet_BootSole'] = shell(boots & (y < 0.035), 0.022, lambda pos, u: np.where((P[u, 1] < 0.03)[:, None], pos - [0, 0.02, 0], pos))
out['Mod_Head_Beanie'] = shell(headtop, 0.016, smooth=6)
out['Mod_Head_Cap'] = shell(headcap, 0.012)
# bare skin segments shown under modern clothes
out['Mod_Skin_Torso'] = shell(((DG == 'torso') | (DG == 'neck') | ((DG == 'pelvis') & (y > BELT - 0.06))) & (ax < 0.22), 0.0, all_in=False)
out['Mod_Skin_Arms'] = shell((DG == 'upperarm') | (DG == 'lowerarm') | (DG == 'hand') | ((DG == 'torso') & (ax > 0.15)), 0.0, all_in=False)
out['Mod_Skin_Legs'] = shell(((DG == 'pelvis') & (y <= BELT)) | (DG == 'thigh') | (DG == 'calf'), 0.0, all_in=False)
out['Mod_Skin_Feet'] = shell((DG == 'foot') | ((DG == 'calf') & (cf > 0.85)), 0.0, all_in=False)

# cap brim: a flat half-disc at the forehead, all on the Head bone
hi = names.index('Head'); hy = JP['Head'][1] + 0.105; front = P[headcap][:, 2].max()
seg = 14; ang = np.linspace(-1.25, 1.25, seg); r0, r1 = 0.075, 0.15
ring0 = np.stack([np.sin(ang) * r0 * 1.15, np.full(seg, hy), np.cos(ang) * r0 + front - 0.07], 1)
ring1 = np.stack([np.sin(ang) * r1 * 0.85, np.full(seg, hy - 0.012), np.cos(ang) * r1 + front - 0.07], 1)
bp = np.vstack([ring0, ring1, ring0 + [0, 0.006, 0], ring1 + [0, 0.006, 0]]).astype(np.float32)
bi = []
for k in range(seg - 1):
    a, b_, c, d = k, k + 1, seg + k, seg + k + 1; bi += [a, c, b_, b_, c, d]
    a, b_, c, d = 2 * seg + k, 2 * seg + k + 1, 3 * seg + k, 3 * seg + k + 1; bi += [a, b_, c, b_, d, c]
bn = np.tile([0, 1, 0], (len(bp), 1)).astype(np.float32); bn[:2 * seg] = [0, -1, 0]
out['Mod_Head_CapBrim'] = dict(pos=bp, nrm=bn, j=np.tile([hi, 0, 0, 0], (len(bp), 1)).astype(np.uint16), w=np.tile([1, 0, 0, 0], (len(bp), 1)).astype(np.float32), idx=np.array(bi, np.uint32))

# ---------- write GLB: the original skeleton nodes + one skinned mesh node per piece ----------
nodes = []; jidx = sk['joints']; old2new = {}
# copy the whole node tree except mesh nodes
for i, n in enumerate(g['nodes']):
    if 'mesh' in n: continue
    old2new[i] = len(nodes); nodes.append({k: v for k, v in n.items() if k in ('name', 'translation', 'rotation', 'scale', 'children')})
for n in nodes:
    if 'children' in n: n['children'] = [old2new[c] for c in n['children'] if c in old2new]
    if 'children' in n and not n['children']: del n['children']
buf = bytearray(); views = []; accs = []; meshes = []
def add(arr, target, comp, typ, minmax=False):
    while len(buf) % 4: buf.append(0)
    off = len(buf); data = arr.tobytes(); buf.extend(data)
    views.append(dict(buffer=0, byteOffset=off, byteLength=len(data), **({'target': target} if target else {})))
    a = dict(bufferView=len(views) - 1, componentType=comp, count=len(arr), type=typ)
    if minmax: a['min'] = arr.min(0).tolist(); a['max'] = arr.max(0).tolist()
    accs.append(a); return len(accs) - 1
ibm_acc = add(IBM.reshape(-1, 16).astype(np.float32), None, 5126, 'MAT4')
skin = dict(joints=[old2new[j] for j in jidx], inverseBindMatrices=ibm_acc)
roots = [old2new[i] for i in g['scenes'][0]['nodes'] if i in old2new]
mats = [{'name': 'MI_Modern', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}}]
for name, s in out.items():
    pos = s['pos']; prim = {'attributes': {'POSITION': add(pos, 34962, 5126, 'VEC3', True), 'NORMAL': add(s['nrm'], 34962, 5126, 'VEC3'), 'TEXCOORD_0': add(s['uv'] if name.startswith('Mod_Skin') else uvs(pos, s['nrm']), 34962, 5126, 'VEC2'),
        'JOINTS_0': add(s['j'].astype(np.uint16), 34962, 5123, 'VEC4'), 'WEIGHTS_0': add(s['w'].astype(np.float32), 34962, 5126, 'VEC4')}, 'indices': add(s['idx'].astype(np.uint32).ravel(), 34963, 5125, 'SCALAR'), 'material': 0}
    meshes.append({'name': name, 'primitives': [prim]})
    nodes.append({'name': name, 'mesh': len(meshes) - 1, 'skin': 0}); roots.append(len(nodes) - 1)
    print('%-22s verts %5d tris %5d' % (name, len(pos), s['idx'].size // 3))
gl = {'asset': {'version': '2.0', 'generator': 'crawl modern clothes'}, 'scene': 0, 'scenes': [{'nodes': roots}], 'nodes': nodes, 'meshes': meshes, 'skins': [skin], 'materials': mats,
      'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(buf)}]}
js = json.dumps(gl, separators=(',', ':')).encode();
while len(js) % 4: js += b' '
while len(buf) % 4: buf.append(0)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(buf), 0x004E4942) + bytes(buf)
open('modern.glb', 'wb').write(glb); print('glb', len(glb))
