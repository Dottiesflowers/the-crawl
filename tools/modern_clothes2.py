# Modern clothes, take 2. Same idea as gen.py (shells of the Quaternius Regular Male body that share its
# skeleton and skin weights), but built properly:
#  - hems, cuffs and necklines are cut cleanly along smooth curves instead of along whole triangles
#  - fabric hangs: shirts fall straight from the chest, sleeves and trouser legs are loose tubes
#  - every edge gets a folded lip, so you never look through a paper-thin edge
#  - shoes are smooth shoe shapes, not socks with toes; the hood is a real folded hood
#  - each garment gets its own texture painted from the 3D position of every pixel:
#    seams, hems, rib knit, pockets, plackets, buttons, belt loops, laces, toe caps...
# Output: modern.glb plus mp_<name>.jpg colour maps and mp_<name>_n.jpg normal maps.
import json, struct, numpy as np, os, sys
from scipy.spatial import cKDTree
from scipy import ndimage
from PIL import Image
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else '.'
_d = os.path.dirname(os.path.abspath(__file__)); _base = os.path.join(_d, 'gen.py') if os.path.exists(os.path.join(_d, 'gen.py')) else os.path.join(_d, 'modern_clothes.py')
exec(open(_base).read().split("def shell(")[0])
rng = np.random.default_rng(7)
FRONT_Z = 1.0  # the body faces +z

# ---------------- a small triangle-mesh toolkit ----------------
def base_mesh(vmask_allow):
    t = vmask_allow[I].all(1); tri = I[t]; used = np.unique(tri); rm = -np.ones(len(P), np.int64); rm[used] = np.arange(len(used))
    return dict(skin=P[used].copy(), snrm=Ns[used].copy(), uv=UV0[used].astype(np.float64), j=J[used].copy(), w=W[used].copy(), bid=used.copy(), tri=rm[tri].copy(), ex={})

def clip(m, f):
    """keep the part of the mesh where the per-vertex field f >= 0, cutting triangles cleanly"""
    f = np.asarray(f, np.float64); V = {k: list(m[k]) for k in ('skin', 'snrm', 'uv', 'j', 'w', 'bid')}; EX = {k: list(v) for k, v in m['ex'].items()}; F = list(f)
    if 'pos' in m: V['pos'] = list(m['pos'])
    cache = {}; out = []
    def mid(a, b):
        key = (min(a, b), max(a, b))
        if key in cache: return cache[key]
        t = F[a] / (F[a] - F[b]); n = len(F)
        for k in ('skin', 'snrm', 'uv') + (('pos',) if 'pos' in V else ()): V[k].append(V[k][a] * (1 - t) + V[k][b] * t)
        near = a if t < 0.5 else b
        for k in ('j', 'w', 'bid'): V[k].append(V[k][near])
        for k in EX: EX[k].append(EX[k][a] * (1 - t) + EX[k][b] * t)
        F.append(0.0); cache[key] = n; return n
    for tri in m['tri']:
        poly = list(tri); ins = [F[v] >= 0 for v in poly]
        if all(ins): out.append(poly); continue
        if not any(ins): continue
        res = []
        for i in range(len(poly)):
            a, b = poly[i], poly[(i + 1) % len(poly)]; ia, ib = F[a] >= 0, F[b] >= 0
            if ia: res.append(a)
            if ia != ib: res.append(mid(a, b))
        for k in range(1, len(res) - 1): out.append([res[0], res[k], res[k + 1]])
    used = np.unique(np.array(out).ravel()); rm = -np.ones(len(F), np.int64); rm[used] = np.arange(len(used))
    n = dict(tri=rm[np.array(out)])
    for k in V: n[k] = np.array(V[k])[used]
    n['ex'] = {k: np.array(v)[used] for k, v in EX.items()}
    return n

def weld(m, src='skin'):
    key = np.round(m[src] * 4000).astype(np.int64); _, wi = np.unique(key, axis=0, return_inverse=True); return wi.ravel()

def edges_of(tri):
    e = np.vstack([tri[:, [0, 1]], tri[:, [1, 2]], tri[:, [2, 0]]]); return e

def boundary(m):
    wi = weld(m); t2 = wi[m['tri']]; ek = np.sort(edges_of(t2), 1); ue, ec = np.unique(ek, axis=0, return_counts=True)
    bset = np.zeros(wi.max() + 1, bool); bset[ue[ec == 1].ravel()] = True; return bset[wi], wi

def relax(m, off, iters, keep=0.9):
    """drape: smooth away body detail while staying at least keep*off outside the skin; edges stay put"""
    wi = weld(m); nb = wi.max() + 1; t2 = wi[m['tri']]; e = edges_of(t2); e = np.vstack([e, e[:, ::-1]])
    cnt = np.bincount(wi, minlength=nb)[:, None].astype(float)
    def agg(a): r = np.zeros((nb, a.shape[1])); np.add.at(r, wi, a); return r / cnt
    q = agg(m['pos']); base = agg(m['skin']); nn = agg(m['snrm']); nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-9
    deg = np.bincount(e[:, 0], minlength=nb)[:, None]; pin, _ = boundary(m); pinw = np.zeros(nb, bool); pinw[wi[pin]] = True; q0 = q.copy()
    for _ in range(iters):
        acc_ = np.zeros((nb, 3)); np.add.at(acc_, e[:, 0], q[e[:, 1]]); avg = acc_ / np.maximum(deg, 1)
        q = q * 0.5 + avg * 0.5; q[pinw] = q0[pinw]
        d = ((q - base) * nn).sum(1); q += nn * np.maximum(0, off * keep - d)[:, None]
    m['pos'] = q[wi]

def normals(m):
    p = m['pos']; t = m['tri']; fn = np.cross(p[t[:, 1]] - p[t[:, 0]], p[t[:, 2]] - p[t[:, 0]])
    wi = weld(m, 'pos'); nb = wi.max() + 1; acc_ = np.zeros((nb, 3))
    for k in range(3): np.add.at(acc_, wi[t[:, k]], fn)
    n = acc_[wi]; n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    # make them point away from the body
    flip = (n * m['snrm']).sum(1) < 0; n[flip] *= -1; return n

def add_lip(m, depth=0.007):
    """fold every open edge inward a little so edges have thickness"""
    bnd, wi = boundary(m); t = m['tri']; e = edges_of(t); ek = np.sort(wi[e], 1)
    ue, inv_, ec = np.unique(ek, axis=0, return_inverse=True, return_counts=True); be = e[(ec[inv_] == 1)]
    if not len(be): return m
    vs = np.unique(be.ravel()); nid = {v: len(m['pos']) + i for i, v in enumerate(vs)}
    m['bpos'] = m['pos'][vs].copy()
    sel = vs; inward = -m['snrm'][sel] * depth
    for k in ('pos', 'skin', 'snrm', 'uv', 'j', 'w', 'bid'):
        add = m[k][sel] + (inward if k == 'pos' else 0)
        m[k] = np.concatenate([m[k], add])
    for k in m['ex']: m['ex'][k] = np.concatenate([m['ex'][k], m['ex'][k][sel]])
    quads = []
    for a, b in be: a2, b2 = nid[a], nid[b]; quads += [[b, a, a2], [b, a2, b2]]
    m['tri'] = np.concatenate([m['tri'], np.array(quads)]); m.setdefault('lipfrom', len(m['pos']) - len(sel)); return m

# ---------------- body landmarks and fields ----------------
Y = P[:, 1]; X = P[:, 0]; Z = P[:, 2]; AX = np.abs(X)
ARM_Y, ARM_Z = JP['upperarm_l'][1], -0.068
SH_X, EL_X, WR_X = JP['upperarm_l'][0], JP['lowerarm_l'][0], JP['hand_l'][0]
is_arm = (DG == 'upperarm') | (DG == 'lowerarm')
arm_s = np.where(AX > SH_X - 0.02, (AX - SH_X) / (WR_X - SH_X), -1.0)          # 0 at shoulder, 1 at wrist
ARMR = np.hypot(Y - ARM_Y, Z - ARM_Z)
leg_t = np.where(Y < JP['thigh_l'][1], (JP['thigh_l'][1] - Y) / (JP['thigh_l'][1] - JP['foot_l'][1]), -1.0)  # 0 at hip, 1 at ankle
CX_LEG = np.sign(X) * 0.095; CZ_LEG = -0.03
NECKY = JP['neck_01'][1] - 0.03
upper_body = np.isin(DG, ['torso', 'pelvis', 'neck', 'upperarm', 'lowerarm', 'other'])
lower_body = np.isin(DG, ['pelvis', 'thigh', 'calf', 'torso'])

NECK_C = (0.0, JP['neck_01'][2] + 0.01)
def neck_field(S, depth_front=0.05, depth_back=0.015, radius=0.078):
    """>= 0 outside the neck opening: below a scooped neckline near the neck, everything out on the shoulders"""
    front = np.clip(S[:, 2] / 0.1, 0, 1); below = (NECKY + 0.02 - (depth_back + (depth_front - depth_back) * front)) - S[:, 1]
    r = np.hypot(S[:, 0] - NECK_C[0], (S[:, 2] - NECK_C[1]) * 1.15); outside = r - (radius + 0.6 * depth_front * front)
    return np.maximum(below, outside)

def sleeve_field(S, s_end):  # keep the torso, and the arm out to s_end (0 shoulder .. 1 wrist)
    ax = np.abs(S[:, 0]); s = (ax - SH_X) / (WR_X - SH_X)
    return np.where(ax < SH_X - 0.03, 1.0, s_end - np.maximum(s, 0))

def hem_field(S, y_hem, curve=0.0):  # shirt tails: hem higher at the sides by `curve`
    side = np.clip(np.abs(S[:, 0]) / 0.2, 0, 1) ** 2
    return S[:, 1] - (y_hem + curve * side)

def leg_field(S, t_end):
    t = (JP['thigh_l'][1] - S[:, 1]) / (JP['thigh_l'][1] - JP['foot_l'][1]); return np.where(S[:, 1] > 0.9, 1.0, t_end - t)

# torso envelope for drape: the widest the body gets at or above each height, per direction
tor_pts = (np.isin(DG, ['torso', 'pelvis', 'neck'])) & (AX < 0.22)
def torso_center_z(y): return -0.02 + 0.0 * y
NTH = 72; YB = np.arange(0.80, 1.62, 0.01)
th_all = np.arctan2(X, Z - torso_center_z(Y)); r_all = np.hypot(X, Z - torso_center_z(Y))
env = np.zeros((len(YB), NTH))
ti = ((th_all + np.pi) / (2 * np.pi) * NTH).astype(int) % NTH; yi = np.clip(((Y - YB[0]) / 0.01).astype(int), 0, len(YB) - 1)
np.maximum.at(env, (yi[tor_pts], ti[tor_pts]), r_all[tor_pts])
for k in range(len(YB)):  # fill holes around each ring
    row = env[k]
    if (row > 0).any():
        idx = np.where(row > 0)[0]; env[k] = np.interp(np.arange(NTH), idx, row[idx], period=NTH)
def hang_env(top_y, taper):
    h = env.copy(); kt = int((top_y - YB[0]) / 0.01)
    for k in range(kt - 1, -1, -1): h[k] = np.maximum(h[k], h[k + 1] * taper)
    return h

def drape_torso(m, off, top_y=1.36, taper=0.993, loose=1.0, belly=0.0):
    p = m['pos']; sk = m['skin']; th = np.arctan2(sk[:, 0], sk[:, 2] - torso_center_z(sk[:, 1])); r = np.hypot(p[:, 0], p[:, 2] - torso_center_z(sk[:, 1]))
    H = hang_env(top_y, taper); ti_ = ((th + np.pi) / (2 * np.pi) * NTH).astype(int) % NTH; yi_ = np.clip(((sk[:, 1] - YB[0]) / 0.01).astype(int), 0, len(YB) - 1)
    want = H[yi_, ti_] * loose + off + belly * np.clip((1.30 - sk[:, 1]) / 0.3, 0, 1)
    torsoish = (np.abs(sk[:, 0]) < SH_X - 0.01) & (sk[:, 1] < 1.48)
    k = np.where(torsoish & (r < want), want / np.maximum(r, 1e-6), 1.0)
    cz = torso_center_z(sk[:, 1]); p[:, 0] = p[:, 0] * k; p[:, 2] = cz + (p[:, 2] - cz) * k

def drape_sleeve(m, r_sh, r_wr, flare=0.0):
    p = m['pos']; sk = m['skin']; s = (np.abs(sk[:, 0]) - SH_X) / (WR_X - SH_X); arm = s > -0.02
    rr = np.hypot(p[:, 1] - ARM_Y, p[:, 2] - ARM_Z); want = r_sh + (r_wr - r_sh) * np.clip(s, 0, 1) + flare * np.clip(s, 0, 1) ** 2
    blend = np.clip((s + 0.02) / 0.12, 0, 1)  # ease in from the armpit
    k = np.where(arm & (rr < want), 1 + (want / np.maximum(rr, 1e-6) - 1) * blend, 1.0)
    p[:, 1] = ARM_Y + (p[:, 1] - ARM_Y) * k; p[:, 2] = ARM_Z + (p[:, 2] - ARM_Z) * k

def drape_legs(m, r_top, r_bot, seat=0.0):
    p = m['pos']; sk = m['skin']; t = np.clip((JP['thigh_l'][1] - sk[:, 1]) / (JP['thigh_l'][1] - JP['foot_l'][1]), 0, 1)
    leg = (sk[:, 1] < 0.95) & (np.abs(sk[:, 0]) > 0.012); cx = np.sign(sk[:, 0]) * 0.095
    r = np.hypot(p[:, 0] - cx, p[:, 2] - CZ_LEG); want = r_top + (r_bot - r_top) * t
    blend = np.clip((0.95 - sk[:, 1]) / 0.08, 0, 1)
    k = np.where(leg & (r < want), 1 + (want / np.maximum(r, 1e-6) - 1) * blend, 1.0)
    p[:, 0] = cx + (p[:, 0] - cx) * k; p[:, 2] = CZ_LEG + (p[:, 2] - CZ_LEG) * k
    if seat:  # a little room in the seat
        b = (sk[:, 2] < -0.05) & (sk[:, 1] > 0.80) & (sk[:, 1] < 1.0); p[b, 2] -= seat * np.clip((sk[b, 1] - 0.8) / 0.1, 0, 1) * np.clip((1.0 - sk[b, 1]) / 0.1, 0, 1)

# ---------------- garments ----------------
G = {}
def top(name, sleeve, hem_y, off, sl_r=(0.062, 0.05), neck=(0.05, 0.015), curve=0.0, loose=1.0, belly=0.0, lip=0.007, drape=12):
    allow = (upper_body | ((DG == 'thigh') & (Y > 0.80))) & (DG != 'hand') & (DG != 'head') & ~((DG == 'pelvis') & (Y < 0.80))
    m = base_mesh(allow)
    m = clip(m, neck_field(m['skin'], *neck)); m = clip(m, hem_field(m['skin'], hem_y, curve))
    if sleeve > 0: m = clip(m, sleeve_field(m['skin'], sleeve))
    if sleeve <= 0:  # sleeveless: cut the arm hole
        sk = m['skin']; ah = np.maximum(0.13 - np.abs(sk[:, 0]), 1.33 - sk[:, 1] - np.clip(np.abs(sk[:, 0]) - 0.13, 0, 1) * 0.0); ah = np.where(np.abs(sk[:, 0]) > SH_X - 0.01, -1.0, ah); m = clip(m, ah)
    m['pos'] = m['skin'] + m['snrm'] * off
    drape_torso(m, off, loose=loose, belly=belly)
    if sleeve > 0: drape_sleeve(m, sl_r[0], sl_r[1])
    drape_legs(m, 0.096, 0.096)  # clear the trousers at the hips
    relax(m, off, drape)
    return add_lip(m, lip)

G['Mod_Top_TShirt'] = top('tee', 0.36, 0.93, 0.010, sl_r=(0.066, 0.060), neck=(0.035, 0.012))
G['Mod_Top_LongSleeve'] = top('long', 0.985, 0.93, 0.009, sl_r=(0.058, 0.040), neck=(0.03, 0.012))
G['Mod_Top_Tank'] = top('tank', 0, 0.94, 0.008, neck=(0.06, 0.02, 0.095))
G['Mod_Top_Hoodie'] = top('hoodie', 0.985, 0.90, 0.016, sl_r=(0.07, 0.05), neck=(0.025, 0.0, 0.074), loose=1.04, belly=0.006, lip=0.01, drape=16)
G['Mod_Top_ButtonUp'] = top('button', 0.985, 0.88, 0.011, sl_r=(0.062, 0.044), neck=(0.045, 0.004), curve=0.045, drape=12)

def collar_piece():
    # a stand-and-fall collar: a band around the neck that folds down
    allow = (DG == 'neck') | ((DG == 'torso') & (Y > 1.40))
    m = base_mesh(allow); sk = m['skin']
    lo = NECKY - 0.045 - 0.01 * np.clip(sk[:, 2] / 0.1, 0, 1)
    S = m['skin']; m = clip(m, S[:, 1] - (NECKY - 0.004 - 0.03 * np.clip(S[:, 2] / 0.1, 0, 1)))  # bottom edge follows the neckline
    m = clip(m, (NECKY + 0.045) - m['skin'][:, 1])
    m['pos'] = m['skin'] + m['snrm'] * 0.02; relax(m, 0.02, 4)
    # open at the front: drop the middle front
    m = clip(m, (np.abs(m['skin'][:, 0]) - 0.012) + (m['skin'][:, 2] < 0.03) * 1.0)
    return add_lip(m, 0.006)
G['Mod_Collar'] = collar_piece()

def pants(name, leg_end, off, r=(0.082, 0.064), belt=1.035, lip=0.007, seat=0.006, drape=8):
    allow = lower_body & ~((DG == 'torso') & (Y > 1.12))
    m = base_mesh(allow)
    m = clip(m, belt - m['skin'][:, 1]); m = clip(m, leg_field(m['skin'], leg_end)); m['pos'] = m['skin'] + m['snrm'] * off
    drape_legs(m, r[0], r[1], seat); relax(m, off, drape)
    return add_lip(m, lip)
G['Mod_Legs_Jeans'] = pants('jeans', 0.985, 0.009, r=(0.080, 0.066))
G['Mod_Legs_Shorts'] = pants('shorts', 0.40, 0.012, r=(0.088, 0.086))
G['Mod_Legs_Sweatpants'] = pants('sweats', 0.975, 0.013, r=(0.088, 0.058), drape=10)

def shoe_param(kind):
    """a lofted shoe around each foot: width from the foot outline, a flat sole, a rounded toe box and an ankle opening"""
    feet = (DG == 'foot') | ((DG == 'calf') & (Y < 0.13)); meshes = []
    for sd in (1, -1):
        fm = feet & (np.sign(X) == sd); fp = P[fm]; cx = sd * 0.091
        z0, z1 = fp[:, 2].min() - 0.012, fp[:, 2].max() + 0.016; nz, nphi = 26, 30
        zs = np.linspace(z0, z1, nz); half = []; tops = []
        for zz in zs:
            sl = fp[np.abs(fp[:, 2] - zz) < 0.02]
            half.append(np.abs(sl[:, 0] - cx).max() + 0.012 if len(sl) else 0.03); tops.append(sl[:, 1].max() + 0.012 if len(sl) else 0.05)
        half = ndimage.gaussian_filter1d(np.array(half), 1.5); tops = ndimage.gaussian_filter1d(np.array(tops), 1.5)
        u = (zs - z0) / (z1 - z0)
        plan = np.sqrt(np.clip(1 - ((u - 0.55) / 0.55) ** 8, 0.02, 1))           # round the heel and toe in plan view
        hgt = np.maximum(tops, 0.05) * (1 if kind == 'sneak' else 1.04) + 0.018 * np.exp(-((u - 0.45) / 0.18) ** 2); hgt[u > 0.72] = np.minimum(hgt[u > 0.72], 0.08 - (u[u > 0.72] - 0.72) * 0.09)
        if kind == 'boot': hgt[u < 0.45] = np.maximum(hgt[u < 0.45], 0.20)
        pts, uvs_ = [], []
        for i, zz in enumerate(zs):
            for k in range(nphi):
                ph = k / nphi * 2 * np.pi; c, s_ = np.cos(ph), np.sin(ph)
                w = half[i] * plan[i]; ex = 0.35
                xx = cx + w * np.sign(c) * np.abs(c) ** ex
                bottom = -0.012; yy = bottom + (hgt[i] - bottom) * (0.5 + 0.5 * np.sign(s_) * np.abs(s_) ** 0.6)
                if s_ < 0: yy = bottom + (yy - bottom) * 0.25            # flat underside
                pts.append([xx, yy, zz]); uvs_.append([k / nphi, i / (nz - 1)])
        pts = np.array(pts); uvs_ = np.array(uvs_); tri = []
        for i in range(nz - 1):
            for k in range(nphi):
                a = i * nphi + k; b = i * nphi + (k + 1) % nphi; c_ = a + nphi; d = b + nphi; tri += [[a, b, c_], [b, d, c_]]
        for endi, flip in ((0, True), (nz - 1, False)):  # caps
            cen = len(pts); ring = pts[endi * nphi:(endi + 1) * nphi]; pts = np.vstack([pts, ring.mean(0)]); uvs_ = np.vstack([uvs_, [0.5, endi / (nz - 1)]])
            for k in range(nphi):
                a = endi * nphi + k; b = endi * nphi + (k + 1) % nphi; tri.append([a, cen, b] if flip else [b, cen, a])
        tr = cKDTree(P[feet | (DG == 'calf')]); idxs = np.where(feet | (DG == 'calf'))[0]; _, ii = tr.query(pts); bid = idxs[ii]
        m = dict(pos=pts, skin=pts.copy(), snrm=np.zeros_like(pts), uv=uvs_, j=J[bid], w=W[bid], bid=bid, tri=np.array(tri), ex={}, own_uv=True)
        cn = pts - np.array([cx, 0.04, 0])[None]; cn[:, 2] *= 0.3; m['snrm'] = cn / (np.linalg.norm(cn, axis=1, keepdims=True) + 1e-9)
        # the ankle opening: cut out the top over the heel half
        uu = (pts[:, 2] - z0) / (z1 - z0); collar_y = (0.098 if kind == 'sneak' else 0.19) - 0.02 * np.clip((uu - 0.2) / 0.3, 0, 1)
        lx = np.abs(pts[:, 0] - cx); f = np.where((uu < 0.5) & (lx < half.max() * 0.75) & (pts[:, 1] > collar_y), -1.0, 1.0)
        f = np.maximum(f, (collar_y - pts[:, 1]) * 10) * np.where(uu < 0.52, 1, 0) + np.where(uu < 0.52, 0, 1.0)
        m = clip(m, np.where(uu < 0.52, np.maximum(collar_y - pts[:, 1], lx - half.max() * 0.72), 1.0))
        meshes.append(m)
    # join both feet
    out = meshes[0]; o = meshes[1]; n0 = len(out['pos'])
    for k in ('pos', 'skin', 'snrm', 'uv', 'j', 'w', 'bid'): out[k] = np.concatenate([out[k], o[k]])
    out['uv'][:n0, 0] *= 0.5; out['uv'][n0:, 0] = out['uv'][n0:, 0] * 0.5 + 0.5
    out['tri'] = np.concatenate([out['tri'], o['tri'] + n0]); return out

def shoe(name, top_t, off, smooth=40, heel=0.0):
    allow = (DG == 'foot') | (DG == 'calf')
    m = base_mesh(allow); m = clip(m, -leg_field(m['skin'], top_t) + (m['skin'][:, 1] > 0.9) * -5)
    sk = m['skin']; m['pos'] = sk + m['snrm'] * off
    relax(m, off, smooth, keep=1.0)
    p = m['pos']; low = sk[:, 1] < 0.035
    p[:, 1] = np.where(p[:, 1] < 0.006, -0.012, p[:, 1])                      # flat sole under the foot
    toe = sk[:, 2] > 0.06; p[toe, 1] += np.clip((sk[toe, 2] - 0.06) / 0.08, 0, 1) * 0.004 * (sk[toe, 1] < 0.03)  # slight toe spring
    p[:, 0] = np.where(np.abs(sk[:, 0]) > 0.0, p[:, 0] + np.sign(p[:, 0] - np.sign(sk[:, 0]) * 0.091) * 0.004 * (sk[:, 1] < 0.06), p[:, 0])
    return m
def split_sole(m, h):
    up = clip(m, m['pos'][:, 1] - h); so = clip(m, h - m['pos'][:, 1]); return add_lip(up, 0.006), so
G['Mod_Feet_Sneakers'], G['Mod_Feet_SneakerSole'] = split_sole(shoe_param('sneak'), 0.016)
G['Mod_Feet_Boots'], G['Mod_Feet_BootSole'] = split_sole(shoe_param('boot'), 0.022)
for k in ('Mod_Feet_SneakerSole', 'Mod_Feet_BootSole'):  # soles stick out a touch
    s = G[k]; c = np.stack([np.sign(s['skin'][:, 0]) * 0.091, s['pos'][:, 1], s['pos'][:, 2] * 0 - 0.02], 1); d = s['pos'] - c; d[:, 1] = 0
    s['pos'] = s['pos'] + d / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-9) * 0.004

def hat(name, y_cut, off, smooth=8):
    allow = (DG == 'head') | (DG == 'neck'); m = base_mesh(allow)
    S = m['skin']; m = clip(m, S[:, 1] - (y_cut - 0.012 * np.clip(-S[:, 2] / 0.1, 0, 1)));  # sits a little lower at the back
    m['pos'] = m['skin'] + m['snrm'] * off; relax(m, off, smooth, keep=1.0)
    return add_lip(m, 0.008)
G['Mod_Head_Beanie'] = hat('beanie', JP['Head'][1] + 0.075, 0.018, 10)
G['Mod_Head_Cap'] = hat('cap', JP['Head'][1] + 0.100, 0.013, 6)

# hood, folded down on the shoulders: built as a surface around the back of the neck, skinned from the nearest body point
def hood_down():
    nu, nv = 28, 9; cz = JP['neck_01'][2] - 0.005; yb = NECKY - 0.005
    pts = []; uvs_ = []
    for vi in range(nv):
        v = vi / (nv - 1)
        for ui in range(nu):
            u = ui / (nu - 1); ph = (u - 0.5) * np.pi * 1.55
            rx = 0.105 * (1 - 0.35 * v); rz = 0.098 * (1 - 0.15 * v) + 0.03 * np.sin(np.pi * v)
            x = np.sin(ph) * rx; z = cz - np.cos(ph) * rz - 0.02 * v; y = yb + 0.022 * np.cos(np.pi * v * 0.9) - 0.13 * v * (0.35 + 0.65 * np.cos(ph) ** 2)
            pts.append([x, y, z]); uvs_.append([u, v])
    pts = np.array(pts); uvs_ = np.array(uvs_)
    # keep it outside the body
    tr = cKDTree(P); d, ii = tr.query(pts); push = np.maximum(0, 0.05 - ((pts - P[ii]) * Ns[ii]).sum(1)); pts += Ns[ii] * push[:, None]
    tri = []
    for vi in range(nv - 1):
        for ui in range(nu - 1):
            a = vi * nu + ui; b = a + 1; c = a + nu; d_ = c + 1; tri += [[a, c, b], [b, c, d_]]
    inner = pts - Ns[ii] * 0.012
    allp = np.vstack([pts, inner]); n0 = len(pts); tri2 = tri + [[t[0] + n0, t[2] + n0, t[1] + n0] for t in tri]
    for ui in range(nu - 1):  # close the top rim
        a, b = ui, ui + 1; tri2 += [[a, b, a + n0], [b, b + n0, a + n0]]
    _, ii2 = tr.query(allp)
    m = dict(pos=allp, skin=P[ii2], snrm=Ns[ii2], uv=np.vstack([uvs_, uvs_]), j=J[ii2], w=W[ii2], bid=ii2, tri=np.array(tri2), ex={}, own_uv=True)
    return m
def hood_down2():
    """the hood, folded down: a thick U of fabric lying around the back of the neck and down the upper back"""
    allow = np.isin(DG, ['neck', 'torso', 'other']) & (Y > 1.15) & (AX < SH_X + 0.02); m = base_mesh(allow)
    S = m['skin']; a = np.abs(np.arctan2(S[:, 0], S[:, 2] - torso_center_z(S[:, 1])))
    m = clip(m, (NECKY + 0.03) - m['skin'][:, 1])                                                   # top edge round the neck
    S = m['skin']; a = np.abs(np.arctan2(S[:, 0], S[:, 2] - torso_center_z(S[:, 1])))
    m = clip(m, a - 1.4)                                                                              # open at the front
    S = m['skin']; a = np.abs(np.arctan2(S[:, 0], S[:, 2] - torso_center_z(S[:, 1])))
    m = clip(m, S[:, 1] - (NECKY - 0.035 - 0.16 * np.clip((a - 1.3) / (np.pi - 1.3), 0, 1) ** 0.7))  # a U down the back
    m = clip(m, (0.16 - np.abs(m['skin'][:, 0])))                                                     # no wider than the shoulders' top
    m['pos'] = m['skin'] + m['snrm'] * 0.036; relax(m, 0.036, 6, keep=1.0)
    return add_lip(m, 0.014)
G['Mod_HoodDown'] = hood_down2()

# ---------------- layering: outer pieces always sit outside the pieces they cover ----------------
def layer_over(top, unders, ymax=1.10, gap=0.007, reach=0.035):
    U_skin = np.vstack([u['skin'] for u in unders]); U_h = np.concatenate([((u['pos'] - u['skin']) * u['snrm']).sum(1) for u in unders])
    tr = cKDTree(U_skin); sel = np.where(top['skin'][:, 1] < ymax)[0]
    if not len(sel): return
    nbrs = tr.query_ball_point(top['skin'][sel], reach)
    h = ((top['pos'][sel] - top['skin'][sel]) * top['snrm'][sel]).sum(1)
    need = np.array([U_h[n].max() + gap if n else -1 for n in nbrs])
    push = np.maximum(0, need - h); top['pos'][sel] += top['snrm'][sel] * push[:, None]
    if 'bpos' in top: tb = cKDTree(top['skin']); _, bi = tb.query(top['bpos']); top['bpos'] = top['pos'][bi]
PANTS = [G['Mod_Legs_Jeans'], G['Mod_Legs_Shorts'], G['Mod_Legs_Sweatpants']]
for k in ('Mod_Top_TShirt', 'Mod_Top_LongSleeve', 'Mod_Top_Tank', 'Mod_Top_Hoodie', 'Mod_Top_ButtonUp'): layer_over(G[k], PANTS)
layer_over(G['Mod_HoodDown'], [G['Mod_Top_Hoodie']], ymax=2.0, gap=0.008, reach=0.05)

# ---------------- textures: paint each garment from the 3D position of every pixel ----------------
TEX = 1024
def norm_uv(m, pad=0.01):
    if m.get('own_uv'): m['uvn'] = m['uv'] * (1 - 2 * pad) + pad; return
    uv = m['uv']; lo = uv.min(0); hi = uv.max(0); s = (1 - 2 * pad) / np.maximum(hi - lo, 1e-6).max()
    m['uvn'] = (uv - lo) * s + pad
def bake(m, shade, size=TEX):
    norm_uv(m); uv = m['uvn'] * (size - 1); p = m['pos']; sk = m['skin']; n = normals(m)
    if 'bpos' in m: bp = m['bpos']
    else: bnd, _ = boundary(m); bp = p[bnd] if bnd.any() else p[:1]
    btree = cKDTree(bp)
    col = np.zeros((size, size, 3), np.float32); hgt = np.zeros((size, size), np.float32); have = np.zeros((size, size), bool)
    for t in m['tri']:
        a, b, c = uv[t]; xs = [a[0], b[0], c[0]]; ys = [a[1], b[1], c[1]]
        x0, x1 = int(np.floor(min(xs))), int(np.ceil(max(xs))); y0, y1 = int(np.floor(min(ys))), int(np.ceil(max(ys)))
        if x1 - x0 > size // 2 or y1 - y0 > size // 2: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1)); px = gx.ravel() + 0.5; py = gy.ravel() + 0.5
        d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        if abs(d) < 1e-9: continue
        l1 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d; l2 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d; l3 = 1 - l1 - l2
        ok = (l1 >= -0.02) & (l2 >= -0.02) & (l3 >= -0.02)
        if not ok.any(): continue
        L = np.stack([l1[ok], l2[ok], l3[ok]], 1); gxk = gx.ravel()[ok]; gyk = gy.ravel()[ok]
        inb = (gxk >= 0) & (gyk >= 0) & (gxk < size) & (gyk < size); gxk, gyk, L = gxk[inb], gyk[inb], L[inb]
        P3 = L @ p[t]; S3 = L @ sk[t]; N3 = L @ n[t]; bd = btree.query(P3)[0]
        rgb, h = shade(P3, S3, N3, bd)
        col[gyk, gxk] = rgb; hgt[gyk, gxk] = h; have[gyk, gxk] = True
    # grow the painted areas so mip-mapping never pulls in black
    idx = ndimage.distance_transform_edt(~have, return_distances=False, return_indices=True)
    col = col[idx[0], idx[1]]; hgt = hgt[idx[0], idx[1]]
    return col, hgt
def save(name, col, hgt, strength=1.6):
    img = Image.fromarray(np.clip(col * 255, 0, 255).astype(np.uint8)[::-1])  # glTF uv origin is top-left; our v grows down the image when flipped
    img.save(os.path.join(OUTDIR, 'mp_%s.jpg' % name), quality=88)
    hs = ndimage.gaussian_filter(hgt, 0.7); gy, gx = np.gradient(hs); nx = -gx * strength; ny = gy * strength; nz = np.ones_like(nx)
    l = np.sqrt(nx * nx + ny * ny + nz * nz); nm = np.stack([nx / l, ny / l, nz / l], -1) * 0.5 + 0.5
    Image.fromarray((nm * 255).astype(np.uint8)[::-1]).save(os.path.join(OUTDIR, 'mp_%s_n.jpg' % name), quality=90)

# ---- pattern helpers (all return values around 1.0; the game tints them with the chosen colour) ----
def noise3(p, f, seed=0):
    q = p * f + seed; return (np.sin(q[:, 0] * 1.7 + np.sin(q[:, 1] * 2.3)) * np.sin(q[:, 1] * 1.3 + q[:, 2] * 1.9) * np.sin(q[:, 2] * 2.1 + q[:, 0] * 0.7))
def line(d, w): return np.clip(1 - np.abs(d) / w, 0, 1)
def stitch(d, w, along, period=0.006):  # dashed stitching along a line
    return line(d, w) * (np.sin(along / period * np.pi) > -0.2)
def ang(S): return np.arctan2(S[:, 0], S[:, 2] - torso_center_z(S[:, 1]))  # 0 = front, ±pi = back
def armpos(S): return (np.abs(S[:, 0]) - SH_X) / (WR_X - SH_X)
def legpos(S): return np.clip((JP['thigh_l'][1] - S[:, 1]) / (JP['thigh_l'][1] - JP['foot_l'][1]), -1, 2)

def knit(P3, S, N, scale=1.0):  # jersey knit: fine vertical ribs + soft noise
    rib = 0.5 + 0.5 * np.sin((ang(S) * 0.2 * 900 + np.abs(S[:, 0]) * 0) * scale)
    return 0.94 + 0.03 * noise3(P3, 60) + 0.02 * rib
def rib(S, axis_val, freq=700): return 0.5 + 0.5 * np.sin(axis_val * freq)

def shade_top(kind):
    def f(P3, S, N, bd):
        a = ang(S); s = armpos(S); onarm = s > 0.02; v = knit(P3, S, N); h = np.zeros(len(S))
        neck = (S[:, 1] > 1.38) & (bd < 0.03) & ~onarm; hem = (S[:, 1] < 1.05) & (bd < 0.03) & ~onarm; cuff = onarm & (bd < 0.03)
        band = {'tee': 0.018, 'long': 0.018, 'tank': 0.012, 'hoodie': 0.05, 'button': 0.012}[kind]
        rb = rib(S, a * 0.25 * (~onarm) + (np.hypot(S[:, 1] - ARM_Y, S[:, 2] - ARM_Z) * 0 + np.arctan2(S[:, 1] - ARM_Y, S[:, 2] - ARM_Z) * 0.06) * onarm, 900)
        inband = (bd < band) & (neck | hem | cuff)
        if kind in ('tee', 'long', 'tank'):
            v = np.where(inband, 0.88 + 0.06 * rb, v); h += inband * (0.3 * rb)
            v -= 0.18 * line(bd - band, 0.0025) * (neck | hem | cuff); h -= 0.6 * line(bd - band, 0.0025) * (neck | hem | cuff)  # the stitched edge of the band
        if kind == 'hoodie':
            v = np.where(inband & (hem | cuff), 0.86 + 0.08 * rb, v); h += inband * (hem | cuff) * 0.5 * rb
            front = (np.abs(a) < 0.9) & ~onarm
            pk = front & (S[:, 1] > 0.94) & (S[:, 1] < 1.13) & (np.abs(S[:, 0]) < 0.105 - (S[:, 1] - 0.94) * 0.25)  # kangaroo pocket
            edge = front & (np.abs(np.abs(S[:, 0]) - (0.105 - (S[:, 1] - 0.94) * 0.25)) < 0.004) & (S[:, 1] > 0.94) & (S[:, 1] < 1.13)
            top_e = front & (np.abs(S[:, 1] - 1.13) < 0.003) & (np.abs(S[:, 0]) < 0.06)
            v = np.where(pk, v * 0.97, v); v -= 0.22 * (edge | top_e); h += pk * 0.4 - 0.8 * (edge | top_e)
            for sx in (-0.035, 0.035):  # drawstrings hanging from the neck
                dx = np.abs(S[:, 0] - sx - 0.004 * np.sin(S[:, 1] * 60)); m_ = front & (dx < 0.0045) & (S[:, 1] > 1.26) & (S[:, 1] < NECKY - 0.01)
                v = np.where(m_, 1.08, v); h += m_ * 1.0
                tip = front & (np.hypot(S[:, 0] - sx, S[:, 1] - 1.26) < 0.007); v = np.where(tip, 0.55, v)
            v -= 0.12 * line(np.abs(a) - np.pi / 2, 0.02) * ~onarm  # side seams
            v -= 0.15 * (neck & (bd < 0.012))
        if kind == 'button':
            front = (np.abs(a) < 0.6) & ~onarm
            pl = front & (np.abs(S[:, 0] - 0.004) < 0.014); ple = front & (np.abs(np.abs(S[:, 0] - 0.004) - 0.014) < 0.0018)
            v = np.where(pl, v * 1.02, v); v -= 0.2 * ple; h += pl * 0.4 - ple * 0.8
            for by in np.arange(NECKY - 0.06, 0.93, -0.075):  # buttons
                rr = np.hypot(S[:, 0] - 0.004, S[:, 1] - by); bt = front & (rr < 0.0055); ring = front & (np.abs(rr - 0.0055) < 0.0012)
                v = np.where(bt, 1.12, v); v = np.where(ring, 0.6, v); h += bt * 1.2 - ring * 0.5
            pk = (S[:, 0] > 0.04) & (S[:, 0] < 0.105) & (S[:, 1] > 1.30) & (S[:, 1] < 1.385) & front; pke = pk & ((np.abs(S[:, 0] - 0.04) < 0.002) | (np.abs(S[:, 0] - 0.105) < 0.002) | (np.abs(S[:, 1] - 1.30) < 0.002) | (np.abs(S[:, 1] - 1.385) < 0.002))
            v -= 0.18 * pke; h += pk * 0.3 - pke * 0.8
            v -= 0.12 * line(np.abs(a) - np.pi / 2, 0.015) * ~onarm; v -= 0.15 * ((bd < 0.006) & (hem | cuff))
            cufb = cuff & (bd < 0.05); v -= 0.15 * (cuff & (np.abs(bd - 0.05) < 0.002)); h -= 0.6 * (cuff & (np.abs(bd - 0.05) < 0.002))
            v *= 1 - 0.03 * (np.sin(S[:, 1] * 220) > 0.92)  # a faint oxford weave line
        # shoulder seam and the arm seam
        sh = ~onarm & (np.abs(S[:, 1] - (1.47 - (np.abs(S[:, 0]) - 0.05) * 0.25)) < 0.003) & (np.abs(S[:, 0]) > 0.06) & (np.abs(S[:, 0]) < SH_X)
        arm_seam = (np.abs(s) < 0.012) | (onarm & (np.abs(np.arctan2(S[:, 1] - ARM_Y, S[:, 2] - ARM_Z) + np.pi / 2) < 0.04))
        v -= 0.12 * (sh | arm_seam); h -= 0.5 * (sh | arm_seam)
        # soft folds: under the arms, at the elbows and above the hem
        fold = 0.035 * np.sin(S[:, 1] * 95 + np.sin(a * 3) * 2) * np.clip((1.12 - S[:, 1]) / 0.2, 0, 1) * ~onarm + 0.04 * np.sin(s * 70) * np.exp(-((s - 0.5) / 0.08) ** 2) * onarm
        v += fold; h += fold * 6
        v *= 1 - 0.18 * np.clip(1 - bd / 0.01, 0, 1) * 0.5  # a touch darker right at the edge
        return np.stack([v, v, v], 1), h
    return f

def shade_pants(kind):
    def f(P3, S, N, bd):
        t = legpos(S); a = ang(S); side = np.sign(S[:, 0]); h = np.zeros(len(S))
        lx = S[:, 0] - side * 0.095; la = np.arctan2(lx * side, S[:, 2] - CZ_LEG)  # around each leg: 0 front, +pi/2 outside
        if kind == 'jeans':
            tw = 0.5 + 0.5 * np.sin((S[:, 1] * 1.0 + la * 0.03 + S[:, 0] * 0.6) * 1400)  # diagonal twill
            v = 0.86 + 0.06 * tw + 0.04 * noise3(P3, 40)
            fade = np.exp(-((t - 0.25) / 0.12) ** 2) * (np.cos(la) > 0.3) * 0.12 + np.exp(-((t - 0.52) / 0.06) ** 2) * (np.cos(la) > 0.2) * 0.08
            v = v + fade - 0.06 * (np.cos(la) < -0.6) * np.exp(-((t - 0.55) / 0.1) ** 2)
            whisk = (S[:, 2] > 0) & (S[:, 1] < 0.93) & (S[:, 1] > 0.80) & (np.abs(S[:, 0]) < 0.11) & (np.sin((S[:, 1] + np.abs(S[:, 0]) * 0.8) * 260) > 0.85)
            v += 0.08 * whisk
        else:
            v = knit(P3, S, N) if kind == 'sweats' else 0.9 + 0.04 * noise3(P3, 50) + 0.02 * np.sin(S[:, 1] * 900)
        belt = S[:, 1] > 1.035 - 0.042; v = np.where(belt, v * 0.97, v); bl = np.abs(S[:, 1] - (1.035 - 0.042)) < 0.002; v -= 0.2 * bl; h += belt * 0.3 - bl * 0.8
        hem = (bd < 0.02) & (S[:, 1] < 0.6) if kind != 'shorts' else (bd < 0.02) & (S[:, 1] < 0.8)
        hl = hem & (np.abs(bd - 0.018) < 0.002); v -= 0.18 * hl; h -= 0.7 * hl
        seam_out = np.abs(np.abs(la) - np.pi / 2) < 0.03; seam_in = np.abs(np.abs(la) - np.pi / 2) < 0.03
        v -= 0.12 * seam_out * (S[:, 1] < 0.98); h -= 0.5 * seam_out * (S[:, 1] < 0.98)
        if kind in ('jeans', 'shorts'):
            st = lambda m_: m_ * 1.0
            # belt loops
            for la0 in (-2.4, -1.2, 0.0, 1.2, 2.4):
                for sd in (-1, 1):
                    loop = belt & (np.abs(a - la0 * 0.55) < 0.06) & (np.abs(S[:, 0]) > 0.02 if la0 == 0 else True)
            loops = belt & (np.abs(np.sin(a * 2.5)) < 0.12); v = np.where(loops, v * 1.05, v); h += loops * 0.8
            # front pockets: a curved opening from the waistband to the side seam
            fr = (S[:, 2] > -0.02) & (np.abs(S[:, 0]) > 0.04) & (S[:, 1] > 0.85)
            curve = 1.035 - 0.042 - (np.clip((0.15 - np.abs(S[:, 0])) / 0.1, 0, 1) ** 1.6) * 0.075
            po = fr & (np.abs(S[:, 1] - curve) < 0.0025) & (np.abs(S[:, 0]) < 0.15); v -= 0.25 * po; h -= 0.9 * po
            # fly: a J-shaped stitch on the front
            fly = (S[:, 2] > 0.02) & (S[:, 1] > 0.86) & (S[:, 1] < 0.993) & (np.abs(S[:, 0] - 0.026) < 0.0018) | ((S[:, 2] > 0.02) & (np.abs(np.hypot(S[:, 0] - 0.006, S[:, 1] - 0.873) - 0.02) < 0.0018) & (S[:, 1] < 0.873))
            ctr = (S[:, 2] > 0.02) & (np.abs(S[:, 0]) < 0.0022) & (S[:, 1] > 0.80) & (S[:, 1] < 0.993)
            v += 0.12 * fly - 0.2 * ctr; h += 0.4 * fly - 0.8 * ctr
            # back pockets: pentagons with stitching
            bk = S[:, 2] < -0.06
            for sd in (-1, 1):
                cx = sd * 0.075; px_ = np.abs(S[:, 0] - cx); top_y, bot_y = 0.975, 0.86
                inside = bk & (px_ < 0.045) & (S[:, 1] < top_y) & (S[:, 1] > bot_y + px_ * 0.5)
                edge = bk & (((np.abs(px_ - 0.045) < 0.002) & (S[:, 1] < top_y) & (S[:, 1] > bot_y + 0.02)) | ((np.abs(S[:, 1] - (bot_y + px_ * 0.5)) < 0.002) & (px_ < 0.045)) | ((np.abs(S[:, 1] - top_y) < 0.002) & (px_ < 0.045)))
                v = np.where(inside, v * 0.98, v); v += 0.1 * edge * (kind == 'jeans'); v -= 0.12 * edge; h += inside * 0.3 - edge * 0.6
            rivet = fr & (np.hypot(np.abs(S[:, 0]) - 0.145, S[:, 1] - (1.035 - 0.045)) < 0.004); v = np.where(rivet, 1.2, v)
            # yoke seam across the back
            yoke = bk & (np.abs(S[:, 1] - (0.985 - np.abs(S[:, 0]) * 0.2)) < 0.002); v -= 0.15 * yoke
        if kind == 'sweats':
            cuff = (bd < 0.05) & (S[:, 1] < 0.4); r2 = 0.5 + 0.5 * np.sin(la * 40); v = np.where(cuff, 0.86 + 0.08 * r2, v); h += cuff * r2 * 0.6
            ds = (S[:, 2] > 0.0) & (S[:, 1] > 0.99) & (S[:, 1] < 1.03); cord = ds & (np.abs(np.abs(S[:, 0]) - 0.03 - (1.0 - S[:, 1]) * 0.1) < 0.004)
            v = np.where(cord, 1.1, v); h += cord * 1.0
            stripe = np.abs(np.abs(la) - np.pi / 2) < 0.06; v -= 0.07 * stripe
        fold = 0.04 * np.sin(S[:, 1] * 160 + la * 2) * np.exp(-((t - 0.95) / 0.07) ** 2) + 0.03 * np.sin(S[:, 1] * 120) * np.exp(-((t - 0.5) / 0.05) ** 2)
        v += fold; h += fold * 6
        return np.stack([v, v, v], 1), h
    return f

def shade_shoe(kind):
    def f(P3, S, N, bd):
        side = np.sign(S[:, 0]); lx = (S[:, 0] - side * 0.091) * side; zf = S[:, 2]; y = S[:, 1]; h = np.zeros(len(S))
        v = 0.92 + 0.03 * noise3(P3, 70) if kind == 'sneak' else 0.85 + 0.06 * noise3(P3, 35) + 0.05 * noise3(P3, 120, 3)
        top = N[:, 1] > 0.35
        if kind == 'sneak':
            cap = zf > 0.07; cape = np.abs(zf - 0.07) < 0.002; v -= 0.15 * cape; h -= 0.7 * cape  # toe cap seam
            lace = top & (zf > -0.02) & (zf < 0.07) & (np.abs(lx) < 0.022)
            cross = lace & ((np.abs(np.sin((zf * 70 + lx * 90))) < 0.18) | (np.abs(np.sin((zf * 70 - lx * 90))) < 0.18))
            v = np.where(lace, 0.55, v); v = np.where(cross, 1.2, v); h += lace * 0.3 + cross * 1.0
            eyel = top & (np.abs(np.abs(lx) - 0.026) < 0.003) & (zf > -0.02) & (zf < 0.07) & (np.sin(zf * 140) > 0.6); v = np.where(eyel, 0.5, v)
            v -= 0.12 * (np.abs(y - 0.022) < 0.003)  # where the upper meets the sole
            stripe = (np.abs(lx) > 0.03) & (N[:, 1] < 0.6) & (np.abs((zf + 0.02) - (y - 0.03) * 1.6) < 0.006) & (y < 0.08)
            stripe2 = (np.abs(lx) > 0.03) & (N[:, 1] < 0.6) & (np.abs((zf + 0.0) - (y - 0.03) * 1.6) < 0.006) & (y < 0.08)
            v = np.where(stripe | stripe2, 1.12, v); h += (stripe | stripe2) * 0.5
            heel = (zf < -0.1) & (y > 0.04); v -= 0.08 * heel
            collar = (bd < 0.012) & (y > 0.05); v = np.where(collar, v * 0.9, v); h += collar * 0.6
        else:
            welt = np.abs(y - 0.03) < 0.0025; v -= 0.25 * welt; h -= 0.8 * welt
            st = (np.abs(y - 0.036) < 0.0012) & (np.sin((zf + lx) * 500) > 0); v += 0.15 * st
            lace = top & (np.abs(lx) < 0.016) & (zf > -0.06) & (zf < 0.05) | ((np.abs(lx) < 0.016) & (y > 0.09) & (zf > -0.03))
            hooks = (np.abs(np.abs(lx) - 0.02) < 0.004) & (np.sin((y + zf) * 120) > 0.7) & ((y > 0.06) | top) & (zf > -0.06)
            cross = lace & (np.abs(np.sin((y + zf) * 60 + lx * 120)) < 0.2)
            v = np.where(lace, 0.62, v); v = np.where(cross, 0.95, v); v = np.where(hooks, 1.25, v); h += cross * 1.0 + hooks * 0.8
            toe = (zf > 0.06) & (np.abs(zf - 0.06) < 0.002); v -= 0.15 * toe
            heel = (zf < -0.09) & (np.abs(zf + 0.09) < 0.002); v -= 0.15 * heel
            v *= 1 - 0.12 * np.clip((0.1 - y) / 0.1, 0, 1) * (N[:, 1] < 0.3)  # scuffed lower edge
        return np.stack([v, v, v], 1), h
    return f

def shade_sole(kind):
    def f(P3, S, N, bd):
        y = P3[:, 1]; v = np.where(N[:, 1] < -0.5, 0.35, 0.95) if kind == 'sneak' else np.where(N[:, 1] < -0.5, 0.25, 0.4)
        tread = (N[:, 1] < -0.5) & (np.sin(P3[:, 2] * 300) > 0.3); v = np.where(tread, v * 0.8, v)
        line_ = (N[:, 1] > -0.5) & (np.abs(y - 0.004) < 0.0025); v = np.where(line_, v * 0.75, v)
        h = tread * 0.8 - line_ * 0.6
        rgb = np.stack([v, v, v * (0.98 if kind == 'sneak' else 1.0)], 1) if kind == 'sneak' else np.stack([v * 1.15, v * 0.95, v * 0.8], 1)
        return rgb, h
    return f

def shade_hat(kind):
    def f(P3, S, N, bd):
        a = np.arctan2(S[:, 0], S[:, 2] - JP['Head'][2]); h = np.zeros(len(S))
        if kind == 'beanie':
            r = 0.5 + 0.5 * np.sin(a * 48); cuff = bd < 0.05
            v = 0.88 + 0.08 * r + 0.02 * noise3(P3, 80); h += r * 0.8
            fold = np.abs(bd - 0.05) < 0.003; v -= 0.15 * fold; h -= 0.8 * fold
            v = np.where(cuff, 0.86 + 0.1 * (0.5 + 0.5 * np.sin(a * 60)), v)
        else:
            v = 0.9 + 0.04 * noise3(P3, 60) + 0.015 * np.sin((S[:, 1] + a * 0.01) * 1200)
            topy = S[:, 1].max(); seams = (np.abs(np.sin(a * 3)) < 0.03); v -= 0.15 * seams; h -= 0.6 * seams
            btn = (S[:, 1] > topy - 0.006); v = np.where(btn, 0.8, v)
            sweat = bd < 0.008; v -= 0.1 * sweat
            vent = np.zeros(len(S), bool)
            for k in range(6):
                aa = (k + 0.5) * np.pi / 3 - np.pi; vent |= (np.hypot((a - aa) * 0.09, S[:, 1] - (topy - 0.04)) < 0.003)
            v = np.where(vent, 0.6, v)
        return np.stack([v, v, v], 1), h
    return f

def shade_hood(P3, S, N, bd):
    v = knit(P3, S, N); h = np.zeros(len(S)); rim = bd < 0.018; v = np.where(rim, v * 0.9, v); h += rim * 0.4
    seam = (np.abs(S[:, 0]) < 0.0025) & (S[:, 2] < 0); v -= 0.14 * seam; h -= 0.7 * seam
    fold = 0.04 * np.sin(np.arctan2(S[:, 0], S[:, 2]) * 9) * np.clip((NECKY - S[:, 1]) / 0.1, 0, 1); v += fold; h += fold * 5
    return np.stack([v, v, v], 1), h
def shade_collar(P3, S, N, bd):
    v = 0.93 + 0.02 * noise3(P3, 60); e = bd < 0.003; v -= 0.12 * e; h = -0.5 * e
    return np.stack([v, v, v], 1), h

SHADERS = {'Mod_Top_TShirt': ('tee', shade_top('tee')), 'Mod_Top_LongSleeve': ('long', shade_top('long')), 'Mod_Top_Tank': ('tank', shade_top('tank')),
           'Mod_Top_Hoodie': ('hoodie', shade_top('hoodie')), 'Mod_Top_ButtonUp': ('button', shade_top('button')), 'Mod_Collar': ('collar', shade_collar),
           'Mod_HoodDown': ('hood', shade_hood), 'Mod_Legs_Jeans': ('jeans', shade_pants('jeans')), 'Mod_Legs_Shorts': ('shorts', shade_pants('shorts')),
           'Mod_Legs_Sweatpants': ('sweats', shade_pants('sweats')), 'Mod_Feet_Sneakers': ('sneaker', shade_shoe('sneak')), 'Mod_Feet_SneakerSole': ('sneakersole', shade_sole('sneak')),
           'Mod_Feet_Boots': ('boot', shade_shoe('boot')), 'Mod_Feet_BootSole': ('bootsole', shade_sole('boot')), 'Mod_Head_Beanie': ('beanie', shade_hat('beanie')), 'Mod_Head_Cap': ('cap', shade_hat('cap'))}
SIZES = {'Mod_Feet_SneakerSole': 256, 'Mod_Feet_BootSole': 256, 'Mod_Collar': 256, 'Mod_HoodDown': 512, 'Mod_Head_Beanie': 512, 'Mod_Head_Cap': 512, 'Mod_Feet_Sneakers': 512, 'Mod_Feet_Boots': 512}

only = os.environ.get('ONLY')
for name, (tex, fn) in SHADERS.items():
    if only and name not in only.split(','): continue
    m = G[name]; col, hgt = bake(m, fn, SIZES.get(name, TEX)); save(tex, col, hgt)
    print('baked', name, tex, len(m['pos']), 'verts', len(m['tri']), 'tris')

# ---------------- carry over the unchanged pieces: bare skin and the cap brim ----------------
old = {}
def old_shell(mask, off, all_in=False):
    t = mask[I]; keep = t.all(1) if all_in else t.any(1); tri = I[keep]; used = np.unique(tri); rm = -np.ones(len(P), np.int64); rm[used] = np.arange(len(used))
    return dict(pos=P[used] + Ns[used] * off, nrm=Ns[used], j=J[used], w=W[used], idx=rm[tri].astype(np.uint32), uv=UV0[used])
old['Mod_Skin_Torso'] = old_shell(((DG == 'torso') | (DG == 'neck') | ((DG == 'pelvis') & (Y > BELT - 0.06))) & (AX < 0.22), 0.0)
old['Mod_Skin_Arms'] = old_shell((DG == 'upperarm') | (DG == 'lowerarm') | (DG == 'hand') | ((DG == 'torso') & (AX > 0.15)), 0.0)
old['Mod_Skin_Legs'] = old_shell(((DG == 'pelvis') & (Y <= BELT)) | (DG == 'thigh') | (DG == 'calf'), 0.0)
old['Mod_Skin_Feet'] = old_shell((DG == 'foot') | ((DG == 'calf') & (cf > 0.85)), 0.0)
cap = G['Mod_Head_Cap']; hi = names.index('Head'); hy = JP['Head'][1] + 0.100; front = cap['skin'][:, 2].max()
seg = 16; angs = np.linspace(-1.3, 1.3, seg); r0, r1 = 0.075, 0.155
ring0 = np.stack([np.sin(angs) * r0 * 1.15, np.full(seg, hy + 0.004), np.cos(angs) * r0 + front - 0.07], 1)
ring1 = np.stack([np.sin(angs) * r1 * 0.85, np.full(seg, hy - 0.016) - 0.006 * np.abs(np.sin(angs)), np.cos(angs) * r1 + front - 0.07], 1)
bp = np.vstack([ring0, ring1, ring0 + [0, 0.007, 0], ring1 + [0, 0.007, 0]]).astype(np.float32); bi = []
for k in range(seg - 1):
    a, b_, c, d = k, k + 1, seg + k, seg + k + 1; bi += [a, c, b_, b_, c, d]
    a, b_, c, d = 2 * seg + k, 2 * seg + k + 1, 3 * seg + k, 3 * seg + k + 1; bi += [a, b_, c, b_, d, c]
for k in (0, seg - 1): bi += [k, k + 2 * seg, seg + k, seg + k, k + 2 * seg, seg + k + 2 * seg]
for k in range(seg - 1): a, b_ = seg + k, seg + k + 1; bi += [a, b_, a + 2 * seg, b_, b_ + 2 * seg, a + 2 * seg]
bn = np.tile([0, 1, 0], (len(bp), 1)).astype(np.float32); bn[:2 * seg] = [0, -1, 0]
buv = np.vstack([np.stack([np.linspace(0.1, 0.9, seg), np.full(seg, 0.2)], 1), np.stack([np.linspace(0.1, 0.9, seg), np.full(seg, 0.8)], 1)] * 2).astype(np.float32)
old['Mod_Head_CapBrim'] = dict(pos=bp, nrm=bn, j=np.tile([hi, 0, 0, 0], (len(bp), 1)).astype(np.uint16), w=np.tile([1, 0, 0, 0], (len(bp), 1)).astype(np.float32), idx=np.array(bi, np.uint32), uv=buv)

# ---------------- write the GLB ----------------
nodes = []; jidx = sk['joints']; old2new = {}
for i, n in enumerate(g['nodes']):
    if 'mesh' in n: continue
    old2new[i] = len(nodes); nodes.append({k: v for k, v in n.items() if k in ('name', 'translation', 'rotation', 'scale', 'children')})
for n in nodes:
    if 'children' in n: n['children'] = [old2new[c] for c in n['children'] if c in old2new]
    if 'children' in n and not n['children']: del n['children']
buf = bytearray(); views = []; accs = []; meshes = []
def add(arr, target, comp, typ, minmax=False):
    while len(buf) % 4: buf.append(0)
    off = len(buf); data = np.ascontiguousarray(arr).tobytes(); buf.extend(data)
    views.append(dict(buffer=0, byteOffset=off, byteLength=len(data), **({'target': target} if target else {})))
    a = dict(bufferView=len(views) - 1, componentType=comp, count=len(arr), type=typ)
    if minmax: a['min'] = np.asarray(arr).min(0).tolist(); a['max'] = np.asarray(arr).max(0).tolist()
    accs.append(a); return len(accs) - 1
ibm_acc = add(IBM.reshape(-1, 16).astype(np.float32), None, 5126, 'MAT4')
skin = dict(joints=[old2new[j] for j in jidx], inverseBindMatrices=ibm_acc)
roots = [old2new[i] for i in g['scenes'][0]['nodes'] if i in old2new]
mats = [{'name': 'MI_Modern', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.9}}]
def emit(name, pos, nrm, uv, j, w, idx):
    prim = {'attributes': {'POSITION': add(pos.astype(np.float32), 34962, 5126, 'VEC3', True), 'NORMAL': add(nrm.astype(np.float32), 34962, 5126, 'VEC3'), 'TEXCOORD_0': add(uv.astype(np.float32), 34962, 5126, 'VEC2'),
        'JOINTS_0': add(j.astype(np.uint16), 34962, 5123, 'VEC4'), 'WEIGHTS_0': add(w.astype(np.float32), 34962, 5126, 'VEC4')}, 'indices': add(idx.astype(np.uint32).ravel(), 34963, 5125, 'SCALAR'), 'material': 0}
    meshes.append({'name': name, 'primitives': [prim]}); nodes.append({'name': name, 'mesh': len(meshes) - 1, 'skin': 0}); roots.append(len(nodes) - 1)
    print('%-22s verts %5d tris %5d' % (name, len(pos), idx.size // 3))
for name, m in G.items():
    if 'uvn' not in m: norm_uv(m)
    uv = m['uvn'].copy(); uv[:, 1] = 1 - uv[:, 1]  # we saved images flipped; glTF v runs down
    emit(name, m['pos'], normals(m), uv, m['j'], m['w'], m['tri'])
for name, s in old.items(): emit(name, s['pos'], s['nrm'], s['uv'], s['j'], s['w'], s['idx'])
gl = {'asset': {'version': '2.0', 'generator': 'crawl modern clothes v2'}, 'scene': 0, 'scenes': [{'nodes': roots}], 'nodes': nodes, 'meshes': meshes, 'skins': [skin], 'materials': mats,
      'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(buf)}]}
js = json.dumps(gl, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(buf) % 4: buf.append(0)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(buf), 0x004E4942) + bytes(buf)
open(os.path.join(OUTDIR, 'modern.glb'), 'wb').write(glb); print('glb', len(glb))
