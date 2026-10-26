"""特色刷り・強コントラスト版（スタイリッシュ寄り）
明暗を少ない段に割り切り、影は墨や紫のベタの大きな形、光は紙の白、間を網点1段でつなぐ"""
import cv2,numpy as np
from print_look2 import screen
PAPER=np.array([242,234,216],float)
def prep(src,W,H):
    img=cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB)
    h,w=img.shape[:2];tw=min(w,h*16//9);th=tw*9//16;img=img[(h-th)//2:(h-th)//2+th,(w-tw)//2:(w-tw)//2+tw]
    img=cv2.resize(img,(W,H),interpolation=cv2.INTER_AREA)
    lab=cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32);low=cv2.GaussianBlur(lab[...,0],(0,0),W/8)
    lab[...,0]=np.clip(lab[...,0]-0.6*(low-low.mean()),0,255)
    simp=cv2.bilateralFilter(cv2.pyrMeanShiftFiltering(cv2.cvtColor(lab.astype(np.uint8),cv2.COLOR_LAB2RGB),14,30),9,50,50)
    L=cv2.cvtColor(simp,cv2.COLOR_RGB2LAB)[...,0].astype(np.float32)/255
    lo,hi=np.percentile(L,4),np.percentile(L,99);L=np.clip((L-lo)/(hi-lo),0,1)
    lab=cv2.cvtColor(simp,cv2.COLOR_RGB2LAB).astype(np.float32);a=lab[...,1]-128;b=lab[...,2]-128
    warm=np.clip((np.hypot(a,b)-4)/14,0,1)*(((np.degrees(np.arctan2(b,a))%360)<100))
    return simp,L,warm
def smooth(m,k):
    m=cv2.medianBlur((m*255).astype(np.uint8),k);return (m>127).astype(np.float32)
def edges(simp,minarea=40):
    e=cv2.Canny(cv2.cvtColor(simp,cv2.COLOR_RGB2GRAY),45,120)
    num,cc,st,_=cv2.connectedComponentsWithStats((e>0).astype(np.uint8),connectivity=8)
    keep=np.isin(cc,np.where(st[:,cv2.CC_STAT_AREA]>=minarea)[0][1:])
    return cv2.dilate(keep.astype(np.uint8),np.ones((2,2),np.uint8)).astype(np.float32)
def compose(planes,inks,W,H,shift=(3,1)):
    out=np.tile(PAPER,(H,W,1))
    for k,(pl,ink) in enumerate(zip(planes,inks)):
        if k==1:pl=np.roll(pl,shift,(1,0))
        out=out*(1-pl[...,None]*(1-np.array(ink,float)/PAPER))
    rng=np.random.default_rng(2);out*=1-rng.normal(0,0.012,(H,W,1))
    return np.clip(out,0,255).astype(np.uint8)
def noir(src,W=1280,H=720,cell=7):
    # 2色：墨のベタの影＋朱の網（光の当たる暖かい所）
    simp,L,warm=prep(src,W,H)
    sumi=smooth((L<0.36).astype(np.float32),11)
    sumi=np.maximum(sumi,screen(np.where((L>=0.36)&(L<0.5),0.35,0.0),45,cell))
    sumi=np.maximum(sumi,edges(simp))
    shu=screen(np.where(L>0.86,0.0,np.where(L>0.5,0.3+0.4*warm,0.0)),15,cell)
    return compose([sumi,shu],[(30,26,28),(225,70,44)],W,H)
def tri(src,W=1280,H=720,cell=7):
    # 3色：墨ベタ（一番暗い）、紫ベタ（影）、朱の網（光）、紙（一番明るい）
    simp,L,warm=prep(src,W,H)
    sumi=np.maximum(smooth((L<0.22).astype(np.float32),11),edges(simp))
    mura=smooth((L<0.48).astype(np.float32),11)
    mura=np.maximum(mura,screen(np.where((L>=0.48)&(L<0.62),0.3,0.0),75,cell))
    shu=np.maximum(screen(np.where((L>=0.48)&(L<0.86),0.25+0.5*warm,0.0),15,cell),smooth(((warm>0.6)&(L<0.75)&(L>0.3)).astype(np.float32),7))
    return compose([mura,shu,sumi],[(98,74,146),(225,70,44),(30,26,28)],W,H)
def coarse(src,W=1280,H=720,cell=12):
    # 大きな網点：墨と朱の2色、網の大きさで明暗
    simp,L,warm=prep(src,W,H)
    cs=np.clip((0.55-L)/0.55,0,1);cs=np.round(cs*3)/3
    sumi=np.maximum(screen(cs,45,cell),edges(simp))
    sumi=np.maximum(sumi,smooth((L<0.18).astype(np.float32),11))
    shu=screen(np.where(L>0.88,0,np.round((0.25+0.5*warm)*2)/2*np.clip((L-0.3)/0.3,0,1)),15,cell)
    return compose([sumi,shu],[(30,26,28),(225,70,44)],W,H)
if __name__=='__main__':
    from PIL import Image
    for n,f in (('noir',noir),('tri',tri),('coarse',coarse)):
        Image.fromarray(f('src.jpg')).save(f'bold_{n}.png')
