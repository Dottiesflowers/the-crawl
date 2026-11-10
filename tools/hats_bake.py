import sys, io, json, struct, base64; sys.path.insert(0,'.'); from lib import *
from PIL import Image
def rot(euler):
    rx,ry,rz=np.radians(euler); cx,sx,cy,sy,cz,sz=np.cos(rx),np.sin(rx),np.cos(ry),np.sin(ry),np.cos(rz),np.sin(rz)
    Rx=np.array([[1,0,0],[0,cx,-sx],[0,sx,cx]]); Ry=np.array([[cy,0,sy],[0,1,0],[-sy,0,cy]]); Rz=np.array([[cz,-sz,0],[sz,cz,0],[0,0,1]]); return Rz@Ry@Rx
# label: (folder, prim filter, euler deg, target width (m, x extent), bottom y, z shift, texture size)
HATS = {
 'Cowboy hat': ('cowboy_hat_free', None, (0,0,0), 0.40, 1.715, -0.005, 512),
 'Hard hat': ('hard_hat', None, (0,0,0), 0.255, 1.705, 0.0, 512),
 'Winter hat': ('winter_hat', None, (0,0,0), 0.205, 1.705, -0.005, 512),
 'Santa hat': ('santa_hat', None, (0,0,0), 0.215, 1.70, -0.01, 256),
 'Clown hat': ('clown_hat', None, (0,0,0), 0.40, 1.735, -0.015, 0),
 'Wizard hat': ('stylized_wizard_hat', None, (0,0,0), 0.36, 1.715, -0.01, 512),
 'Fedora': ('gangster_hats', lambda p: p['P'][:,0].mean() > 0, (0,0,0), 0.30, 1.718, -0.005, 512),
 'Trilby': ('gangster_hats', lambda p: p['P'][:,0].mean() < 0, (0,0,0), 0.30, 1.718, -0.005, 512),
}
def bake(label, cfg):
    d, filt, eul, width, ybot, zs, tsz = cfg
    pr = [p for p in load(d) if not filt or filt(p)]
    R = rot(eul)
    for p in pr: p['P'] = (R @ p['P'].T).T; p['N'] = (R @ p['N'].T).T if p['N'] is not None else None
    allP = np.vstack([p['P'] for p in pr]); mn, mx = allP.min(0), allP.max(0)
    s = width / (mx[0] - mn[0]); c = (mn + mx) / 2
    for p in pr: p['P'] = (p['P'] - [c[0], mn[1], c[2]]) * s + [0, ybot, zs]
    buf = bytearray(); views=[]; accs=[]; meshes_prims=[]; mats=[]; images=[]; textures=[]; texmap={}
    def add(arr, target=None, comp=5126, typ='VEC3', mm=False):
        while len(buf)%4: buf.append(0)
        off=len(buf); b=arr.tobytes(); buf.extend(b); v=dict(buffer=0,byteOffset=off,byteLength=len(b));
        if target: v['target']=target
        views.append(v); a=dict(bufferView=len(views)-1,componentType=comp,count=len(arr),type=typ)
        if mm: a['min']=arr.min(0).tolist(); a['max']=arr.max(0).tolist()
        accs.append(a); return len(accs)-1
    for p in pr:
        key=(p['tex'], tuple(p['col']))
        if key not in texmap:
            m={'name':p['mat'],'pbrMetallicRoughness':{'baseColorFactor':list(p['col']),'metallicFactor':0,'roughnessFactor':0.85}}
            if p['tex'] and tsz:
                im=Image.open(p['tex']).convert('RGB'); im.thumbnail((tsz,tsz)); bio=io.BytesIO(); im.save(bio,'JPEG',quality=85)
                while len(buf)%4: buf.append(0)
                off=len(buf); buf.extend(bio.getvalue()); views.append(dict(buffer=0,byteOffset=off,byteLength=len(bio.getvalue())))
                images.append({'bufferView':len(views)-1,'mimeType':'image/jpeg'}); textures.append({'source':len(images)-1})
                m['pbrMetallicRoughness']['baseColorTexture']={'index':len(textures)-1}
            mats.append(m); texmap[key]=len(mats)-1
        at={'POSITION':add(p['P'].astype(np.float32),34962,mm=True)}
        if p['N'] is not None: at['NORMAL']=add(p['N'].astype(np.float32),34962)
        if p['UV'] is not None and p['tex']: at['TEXCOORD_0']=add(p['UV'].astype(np.float32),34962,typ='VEC2')
        meshes_prims.append({'attributes':at,'indices':add(p['I'].astype(np.uint32),34963,5125,'SCALAR'),'material':texmap[key]})
    gl={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':label,'mesh':0}],'meshes':[{'name':label,'primitives':meshes_prims}],
        'materials':mats,'accessors':accs,'bufferViews':views,'buffers':[{'byteLength':len(buf)}]}
    if images: gl['images']=images; gl['textures']=textures; gl['samplers']=[{}]
    js=json.dumps(gl,separators=(',',':')).encode()
    while len(js)%4: js+=b' '
    while len(buf)%4: buf.append(0)
    glb=struct.pack('<III',0x46546C67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(buf),0x004E4942)+bytes(buf)
    return glb, sum(len(p['I'])//3 for p in pr)
pack={}
for label,cfg in HATS.items():
    glb,t=bake(label,cfg); pack[label]=base64.b64encode(glb).decode(); print(label, t, len(glb))
json.dump(pack, open('/home/claude/crawl/kit2/hats.json','w')); print('total', os.path.getsize('/home/claude/crawl/kit2/hats.json'))
