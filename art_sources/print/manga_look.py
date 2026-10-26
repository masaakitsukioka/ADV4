"""マンガ原稿ルックの背景：墨の線・ベタ・スクリーントーン（明るさの帯ごとに一定の網）＋朱1色"""
import cv2,numpy as np
from print_bold import prep,smooth,edges
from print_look2 import screen
PAPER=np.array([246,243,234],float);SUMI=np.array([24,22,24],float);SHU=np.array([226,72,44],float)
def lines_hatch(h,w,ang,gap,width=1):
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32);a=np.radians(ang)
    u=xx*np.cos(a)+yy*np.sin(a);return ((u%gap)<width).astype(np.float32)
def manga(src,W,H,cell=5):
    simp,L,warm=prep(src,W,H)
    lab=cv2.cvtColor(simp,cv2.COLOR_RGB2LAB).astype(np.float32);ch=np.hypot(lab[...,1]-128,lab[...,2]-128)
    redish=((lab[...,1]-128)>10)&(ch>16)  # 果物など、はっきり赤い物だけ
    beta=smooth((L<0.20).astype(np.float32),9)
    t30=screen(np.full((H,W),0.30,np.float32),45,cell)*((L>=0.20)&(L<0.42))
    t10=screen(np.full((H,W),0.12,np.float32),45,cell)*((L>=0.42)&(L<0.64))
    # 一番暗い帯の手前にカケアミ（2方向の線）を少し
    hatch=np.maximum(lines_hatch(H,W,30,6),lines_hatch(H,W,-30,6))*((L>=0.17)&(L<0.24))
    sumi=np.maximum.reduce([beta,t30,t10,hatch,edges(simp,30)])
    # 朱：窓の光・明るい暖色（果物・木の明部）に網、果物などはベタ
    glow=smooth(((L>0.8)).astype(np.float32),15)
    glow_ring=cv2.dilate(glow,np.ones((25,25),np.uint8))-glow
    shu=np.maximum(screen(np.full((H,W),0.25,np.float32),15,cell)*np.clip(glow_ring,0,1),
                   smooth((redish&(L>0.25)).astype(np.float32),5))
    shu=np.roll(shu,(1,2),(0,1))
    out=np.tile(PAPER,(H,W,1))
    out=out*(1-shu[...,None]*(1-SHU/PAPER));out=out*(1-sumi[...,None]*(1-SUMI/PAPER))
    return np.clip(out,0,255).astype(np.uint8)
def manga_char(fn,scale=4):
    im=cv2.cvtColor(cv2.imread(fn,cv2.IMREAD_UNCHANGED),cv2.COLOR_BGRA2RGBA)
    big=cv2.resize(im,None,fx=scale,fy=scale,interpolation=cv2.INTER_NEAREST)
    rgb=cv2.medianBlur(big[...,:3],5);a=(cv2.medianBlur(big[...,3],5)>127)
    L=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB)[...,0].astype(np.float32)/255
    H,W=L.shape
    beta=(L<0.25);t=screen(np.full((H,W),0.35,np.float32),45,4)*((L>=0.25)&(L<0.55))
    t2=screen(np.full((H,W),0.12,np.float32),45,4)*((L>=0.55)&(L<0.72))
    lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(np.float32);aa=lab[...,1]-128;bb=lab[...,2]-128;red=(aa>16)&(aa>bb*1.4)&(L<0.6)&(L>0.2);red[:int(H*0.55)]=False  # 朱はネクタイだけ（髪は墨とトーン）
    out=np.tile(PAPER,(H,W,1));sumi=np.maximum.reduce([beta.astype(np.float32),t,t2])
    sh=red.astype(np.float32);out=out*(1-sh[...,None]*(1-SHU/PAPER))
    sumi=np.where(red,0,sumi);out=out*(1-sumi[...,None]*(1-SUMI/PAPER))
    edge=cv2.morphologyEx(a.astype(np.uint8),cv2.MORPH_GRADIENT,np.ones((5,5),np.uint8))>0
    out[edge]=SUMI
    return np.dstack([np.clip(out,0,255).astype(np.uint8),(a|edge).astype(np.uint8)*255])
if __name__=='__main__':
    from PIL import Image
    Image.fromarray(manga('src.jpg',1000,560)).save('manga_bg.png')
    Image.fromarray(manga_char('haruki_normal.png'),'RGBA').save('manga_haruki.png')
    Image.fromarray(manga_char('saiji_normal.png'),'RGBA').save('manga_saiji.png')
