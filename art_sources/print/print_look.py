"""特色刷りルック（墨・朱・紫）試作2：版ごとの役割で分版する
  墨：主線と、一番暗い所
  紫：影（暗いほど濃く）
  朱：中間〜明るい所の暖かさ、木・果物など暖色の物
  紙：一番明るい所（窓の光など）
"""
import cv2,numpy as np,sys
PAPER=np.array([241,232,212],float)
INKS={'murasaki':np.array([104,82,150],float),'shu':np.array([222,74,48],float),'sumi':np.array([38,32,34],float)}
ORDER=['murasaki','shu','sumi'];ANG={'murasaki':75,'shu':15,'sumi':45}
LV=np.array([0,0.15,0.35,0.6,1.0])
def q(c):return LV[np.abs(c[...,None]-LV).argmin(-1)]
def screen(cov,ang,cell):
    h,w=cov.shape;yy,xx=np.mgrid[0:h,0:w].astype(np.float32);a=np.radians(ang)
    u=(xx*np.cos(a)+yy*np.sin(a))/cell;v=(-xx*np.sin(a)+yy*np.cos(a))/cell
    r=np.sqrt((u-np.floor(u)-0.5)**2+(v-np.floor(v)-0.5)**2)/0.7071
    return np.where(cov>=0.99,1.0,(r<np.sqrt(cov)).astype(np.float32))
def run(src,dst,W=1280,H=720,cell=6,shift=(2,1),time='after'):
    img=cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB)
    h,w=img.shape[:2];tw=min(w,h*16//9);th=tw*9//16;img=img[(h-th)//2:(h-th)//2+th,(w-tw)//2:(w-tw)//2+tw]
    img=cv2.resize(img,(W,H),interpolation=cv2.INTER_AREA)
    lab=cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32);low=cv2.GaussianBlur(lab[...,0],(0,0),W/8)
    lab[...,0]=np.clip(lab[...,0]-0.75*(low-low.mean()),0,255);img=cv2.cvtColor(lab.astype(np.uint8),cv2.COLOR_LAB2RGB)
    simp=cv2.bilateralFilter(cv2.pyrMeanShiftFiltering(img,12,26),9,40,40)
    lab=cv2.cvtColor(simp,cv2.COLOR_RGB2LAB).astype(np.float32)
    L=lab[...,0]/255;a=lab[...,1]-128;b=lab[...,2]-128;ch=np.hypot(a,b);hue=np.degrees(np.arctan2(b,a))%360
    lo,hi=np.percentile(L,3),np.percentile(L,99);L=np.clip((L-lo)/(hi-lo),0,1)
    warm=np.clip((ch-4)/14,0,1)*((hue<100)|(hue>330))
    sumi=np.clip((0.22-L)/0.22,0,1)*1.0
    mura=np.clip((0.55-L)/0.45,0,1)
    shu=np.clip(np.minimum((L-0.25)/0.25,(0.95-L)/0.35),0,1)*0.2+warm*np.clip((0.85-L)/0.5,0,1)*0.6
    cov={'murasaki':q(mura),'shu':q(np.clip(shu,0,1)),'sumi':q(sumi)}
    for k in cov:cov[k]=cv2.medianBlur((cov[k]*255).astype(np.uint8),9).astype(np.float32)/255
    planes={k:screen(cov[k],ANG[k],cell) for k in ORDER}
    e=cv2.Canny(cv2.cvtColor(simp,cv2.COLOR_RGB2GRAY),35,100)
    num,cc,st,_=cv2.connectedComponentsWithStats((e>0).astype(np.uint8),connectivity=8)
    keep=np.isin(cc,np.where(st[:,cv2.CC_STAT_AREA]>=25)[0][1:])
    e=cv2.dilate(keep.astype(np.uint8),np.ones((2,2),np.uint8))>0
    planes['sumi']=np.maximum(planes['sumi'],e.astype(np.float32))
    planes['shu']=np.roll(planes['shu'],shift,(1,0))
    out=np.tile(PAPER,(H,W,1))
    for k in ORDER:
        t=INKS[k]/PAPER;out=out*(1-planes[k][...,None]*(1-t))
    rng=np.random.default_rng(1);out*=1-rng.normal(0,0.01,(H,W,1))
    o=np.clip(out,0,255).astype(np.uint8);cv2.imwrite(dst,cv2.cvtColor(o,cv2.COLOR_RGB2BGR));return o
if __name__=='__main__':run(sys.argv[1],sys.argv[2],cell=int(sys.argv[3]) if len(sys.argv)>3 else 6)
