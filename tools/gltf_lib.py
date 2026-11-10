import json, numpy as np, os, struct
CT = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8, 5122: np.int16, 5120: np.int8}; NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def q2m(q):
    x,y,z,w=q; return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def nodemat(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    M=np.eye(4); s=np.array(n.get('scale',[1,1,1])); R=q2m(n.get('rotation',[0,0,0,1])); M[:3,:3]=R*s; M[:3,3]=n.get('translation',[0,0,0]); return M
def load(d):
    g=json.load(open(d+'/scene.gltf')); bufs=[open(os.path.join(d,b['uri']),'rb').read() for b in g['buffers']]
    def acc(i):
        a=g['accessors'][i]; v=g['bufferViews'][a['bufferView']]; dt=np.dtype(CT[a['componentType']]); n=NC[a['type']]
        off=v.get('byteOffset',0)+a.get('byteOffset',0); st=v.get('byteStride',0) or dt.itemsize*n
        arr=np.ndarray((a['count'],n),dtype=dt,buffer=bufs[v['buffer']],offset=off,strides=(st,dt.itemsize)).copy()
        if a.get('normalized'): arr=arr.astype(np.float32)/np.iinfo(dt).max
        return arr
    prims=[]
    def walk(i,M):
        n=g['nodes'][i]; W=M@nodemat(n)
        if 'mesh' in n:
            for p in g['meshes'][n['mesh']]['primitives']:
                P=acc(p['attributes']['POSITION']).astype(np.float64); P=(W[:3,:3]@P.T).T+W[:3,3]
                Nn=acc(p['attributes']['NORMAL']).astype(np.float64) if 'NORMAL' in p['attributes'] else None
                if Nn is not None: Nn=(np.linalg.inv(W[:3,:3]).T@Nn.T).T; Nn/=np.linalg.norm(Nn,axis=1,keepdims=True)+1e-9
                UV=acc(p['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in p['attributes'] else None
                I=acc(p['indices']).ravel() if 'indices' in p else np.arange(len(P))
                if np.linalg.det(W[:3,:3])<0: I=I.reshape(-1,3)[:,::-1].ravel()
                mat=g['materials'][p['material']] if 'material' in p else {}
                tex=None; pbr=mat.get('pbrMetallicRoughness',{}); col=pbr.get('baseColorFactor',[1,1,1,1])
                if 'baseColorTexture' in pbr: tex=os.path.join(d,g['images'][g['textures'][pbr['baseColorTexture']['index']]['source']]['uri'])
                prims.append(dict(P=P,N=Nn,UV=UV,I=I,tex=tex,col=col,mat=mat.get('name',''),node=n.get('name','')))
        for c in n.get('children',[]): walk(c,W)
    for r in g['scenes'][g.get('scene',0)]['nodes']: walk(r,np.eye(4))
    return prims
