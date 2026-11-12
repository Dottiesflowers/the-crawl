import numpy as np, glob, colorsys
from PIL import Image, ImageFilter
D=glob.glob('/home/claude/assets_in/4bfb2901*/textures/')[0]
base=np.asarray(Image.open(D+'MAT_BanditWeaponKit_baseColor.jpeg').convert('RGB').resize((512,512),Image.LANCZOS)).astype(float)/255
mr=np.asarray(Image.open(D+'MAT_BanditWeaponKit_metallicRoughness.png').convert('RGB').resize((512,512),Image.LANCZOS)).astype(float)/255
metal=np.clip((mr[...,2]-0.35)/0.3,0,1)                       # metalness → where the steel is
metal=np.asarray(Image.fromarray((metal*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(float)/255
lum=base@[0.3,0.59,0.11]
# detail without the rust colour: luminance, with rust blotches (yellow/orange) pulled toward the surrounding steel
mx=base.max(-1); mn=base.min(-1); sat=(mx-mn)/(mx+1e-4)
det=lum+np.clip(sat-0.25,0,1)*0.25
det=np.clip(det-det[metal>0.5].mean(),-0.35,0.12)
def skin(name, steel, gain, grip=None, gripk=1.0, glow=False):
    s=np.array(steel)/255
    m=np.clip(s[None,None,:]*(1+det[...,None]*gain),0,1)
    out=base.copy()
    if grip is not None:                                        # recolour the non-metal (wood/leather) too
        g=np.array(grip)/255; out=np.clip(g[None,None,:]*(0.35+lum[...,None]*gripk),0,1)
    out=out*(1-metal[...,None])+m*metal[...,None]
    Image.fromarray((out*255).astype(np.uint8)).save('wskin_%s.jpg'%name,quality=88)
skin('steel',[160,167,178],1.3)
skin('gold',[226,178,70],1.4,grip=[90,20,24],gripk=1.1)
skin('storm',[150,186,220],1.5,grip=[30,34,48],gripk=0.9)
skin('ember',[70,58,54],1.2,grip=[60,22,14],gripk=0.9)
skin('frost',[200,224,240],1.2,grip=[200,210,220],gripk=0.6)
skin('shadow',[70,56,96],1.3,grip=[24,18,30],gripk=0.8)
# glow mask: the metal, brightest along its streaky detail
gm=np.clip(metal*(0.35+np.clip(det+0.12,0,1)*4.0),0,1)
Image.fromarray((gm*255).astype(np.uint8)).convert('RGB').save('wskin_glow.jpg',quality=85)
skin('crude',[120,110,96],0.8,grip=[176,150,104],gripk=1.05)   # homemade: raw pale stick wood, dull metal bits
