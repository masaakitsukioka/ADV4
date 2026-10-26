"""サイカチADV 背景ドット化（v4 試作 2026-10-22：参考ピクセルアートから学んだ色の使い方を追加。v3＋色の調整）
  追加：暗部を寒色・明部を暖色へ少し寄せる（--shift、--key）／面積の小さい鮮やかな色は残す（--accent）／暗部を無彩色の灰にしない

生成画像・写真 → 320x180 のドット絵の下地。立ち絵と同じ「物ごとの面＋段の陰影＋色トレスの主線」で作る。
  1) 16:9に切り抜き → 光ムラを少しならす（--evenlight、標準0.5）
  2) 640x360 で物ごとの面に分ける（平均シフト → 領域分割）
  3) 面ごとに陰影を段で付ける（--shade、標準4段）。色相は面の中央値、明るさだけ段で変える
  4) グレイッシュ化（--gray、標準0.6＝平均彩度 約11%）→ 32色にまとめる（--colors）
  5) 主線：面（物）の境目のうち、はっきりした輪郭の上だけに1ドット。陰影の段の境目には引かない。
     色は暗い側の面の色を暗くした色（黒にしない）を、同じ32色の中から選ぶ
  6) 線の角のだぶり（L字）を取る → 小さな粒・孤立ドットの掃除
使い方：python3 bg_pixel.py 入力 出力.png
標準：--colors 32 --shade 4 --gray 0.6 --evenlight 0.5 --detail 2 --edge 50 --line 10
"""
import argparse,cv2,numpy as np
from skimage.segmentation import felzenszwalb
from skimage.morphology import skeletonize,remove_small_objects
W,H=320,180
BAYER=np.array([[-0.375,0.125],[0.375,-0.125]])

def crop169(img):
    h,w=img.shape[:2];tw=min(w,h*16//9);th=tw*9//16;x=(w-tw)//2;y=(h-th)//2
    return img[y:y+th,x:x+tw]
def lab(img):return cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32)
def rgb(l):return cv2.cvtColor(np.clip(l,0,255).astype(np.uint8),cv2.COLOR_LAB2RGB)
def even_light(img,k):
    L=lab(img);low=cv2.GaussianBlur(L[...,0],(0,0),img.shape[1]/8)
    L[...,0]=L[...,0]-k*(low-low.mean());return rgb(L)
def grayish(img,c,light=(0.08,0.92)):
    L=lab(img);L[...,1:]=128+(L[...,1:]-128)*c
    L[...,0]=255*light[0]+L[...,0]*(light[1]-light[0]);return rgb(L)
def _hue(a,b):return np.degrees(np.arctan2(b-128,a-128))%360
def _mixhue(h1,h2,t):
    d=((h2-h1+180)%360)-180;return (h1+d*t)%360
def grade(cen,area,gray,key,shift,accent):
    # 参考ピクセルアートから：地は低彩度でも色相を持たせる（無彩色の灰にしない）。
    # 暗い色ほど寒色（key[0]）、明るい色ほど暖色（key[1]）に色相を寄せる。
    # 面積の小さい鮮やかな色（光源・小物）はアクセントとして彩度を残す。
    out=cen.copy();ch=np.hypot(cen[:,1]-128,cen[:,2]-128);h=_hue(cen[:,1],cen[:,2])
    thr=np.percentile(ch,80)
    for i in range(len(cen)):
        L=cen[i,0]/255
        # 素材の色（木の茶・壁のクリーム）は残し、暗部だけ寒色へ・明部だけ暖色へ少し寄せる
        if L<0.40: target,w=key[0],shift*(0.40-L)/0.40
        elif L>0.70: target,w=key[1],shift*(L-0.70)/0.30
        else: target,w=h[i],0.0
        hh=_mixhue(h[i],target,w)
        is_acc=accent and ch[i]>=thr and area[i]<0.03 and ch[i]>12
        c=ch[i]*(1.0 if is_acc else gray)
        c=max(c,6.0 if L<0.40 else 4.0)  # 灰色にしない最低限の色み（暗部は色を残す）
        out[i,1]=128+c*np.cos(np.radians(hh));out[i,2]=128+c*np.sin(np.radians(hh))
        out[i,0]=255*0.06+cen[i,0]*0.88
    return out
def quantize(img,n):
    X=lab(img).reshape(-1,3)
    _,lbl,cen=cv2.kmeans(X,n,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,0.3),5,cv2.KMEANS_PP_CENTERS)
    return lbl.reshape(img.shape[:2]),cen
def absorb_small(lbl,n,minpx=3):
    out=lbl.copy()
    for k in range(n):
        num,cc,st,_=cv2.connectedComponentsWithStats((lbl==k).astype(np.uint8),connectivity=4)
        for i in range(1,num):
            if st[i,cv2.CC_STAT_AREA]<minpx:
                m=cc==i;ring=cv2.dilate(m.astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)&~m
                v=lbl[ring]
                if len(v):out[m]=np.bincount(v,minlength=n).argmax()
    return out
def pixel_perfect(sk):
    sk=sk.copy();h,w=sk.shape
    for y in range(1,h-1):
        for x in range(1,w-1):
            if not sk[y,x]:continue
            for dy,dx in ((-1,-1),(-1,1),(1,-1),(1,1)):
                if sk[y+dy,x] and sk[y,x+dx] and not sk[y-dy,x] and not sk[y,x-dx]:
                    sk[y,x]=False;break
    return sk
def line_color(cen,k,ratio=0.55):
    t=cen[k].copy();t[0]*=ratio;t[1:]=128+(t[1:]-128)*1.1
    cand=[j for j in range(len(cen)) if cen[j,0]<cen[k,0]-6]
    return min(cand,key=lambda j:np.linalg.norm(cen[j]-t)) if cand else k
def despeckle(lbl):
    out=lbl.copy();h,w=lbl.shape
    for y in range(1,h-1):
        for x in range(1,w-1):
            n4=[lbl[y-1,x],lbl[y+1,x],lbl[y,x-1],lbl[y,x+1]]
            if lbl[y,x] not in n4 and n4.count(n4[0])>=3:out[y,x]=n4[0]
    return out

def run(src,dst,colors=32,shade=4,gray=0.6,evenlight=0.5,detail=2,edge=50,thr=10,dither=False,lines=True,key=(235,75),shift=0.0,accent=False):
    img=crop169(cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB))
    if evenlight:img=even_light(img,evenlight)
    work=cv2.resize(img,(W*2,H*2),interpolation=cv2.INTER_AREA)
    sp,sr,scale,mins={1:(10,24,400,120),2:(8,18,220,60),3:(6,14,120,30)}[detail]
    seg=felzenszwalb(cv2.pyrMeanShiftFiltering(work,sp,sr),scale=scale,sigma=0.6,min_size=mins)
    g=cv2.cvtColor(cv2.pyrMeanShiftFiltering(work,6,14),cv2.COLOR_RGB2GRAY)
    e=cv2.dilate(cv2.Canny(g,edge,edge*2.5),np.ones((3,3),np.uint8))
    gate=cv2.dilate((cv2.resize(e,(W,H),interpolation=cv2.INTER_AREA)>0).astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
    seg=seg[::2,::2]
    Lab=lab(cv2.resize(cv2.GaussianBlur(work,(0,0),1.2),(W,H),interpolation=cv2.INTER_AREA));L=Lab[...,0]
    out=np.zeros((H,W,3),np.float32);flat=np.zeros((H,W,3),np.float32)
    by=np.tile(BAYER,(H//2,W//2))
    for r in np.unique(seg):
        m=seg==r;Ls=L[m];med=np.median(Lab[m],0);flat[m]=med
        if shade<=1 or m.sum()<30 or np.percentile(Ls,90)-np.percentile(Ls,10)<6:
            out[m]=med;continue
        lo,hi=np.percentile(Ls,8),np.percentile(Ls,92)
        t=np.clip((L-lo)/max(hi-lo,1e-3),0,1)*(shade-1)
        if dither:t=t+by
        lev=np.clip(np.round(t),0,shade-1).astype(int)
        for k in range(shade):
            mk=m&(lev==k)
            if mk.any():c=med.copy();c[0]=np.median(Lab[mk][:,0]);out[mk]=c
    col=rgb(out)
    lbl,cen=quantize(col,colors)
    area=np.bincount(lbl.flatten(),minlength=colors)/lbl.size
    cen=grade(cen,area,gray,key,shift,accent)
    if not dither:lbl=absorb_small(lbl,colors)
    if lines:
        fl=flat.copy()
        P=np.pad(seg,1,mode='edge');Pf=np.pad(fl,((1,1),(1,1),(0,0)),mode='edge');line=np.zeros((H,W),bool)
        for dy,dx in ((-1,0),(1,0),(0,-1),(0,1)):
            nb=P[1+dy:1+dy+H,1+dx:1+dx+W];nf=Pf[1+dy:1+dy+H,1+dx:1+dx+W]
            line|=(nb!=seg)&(np.linalg.norm(nf-fl,axis=-1)>thr)&(nf[...,0]>fl[...,0])
        sk=remove_small_objects(pixel_perfect(skeletonize(line&gate)),max_size=5,connectivity=2)
        lc={k:line_color(cen,k) for k in range(colors)}
        for y,x in zip(*np.where(sk)):lbl[y,x]=lc[lbl[y,x]]
    if not dither:lbl=despeckle(lbl)
    o=rgb(cen[lbl].reshape(H,W,3))
    cv2.imwrite(dst,cv2.cvtColor(o,cv2.COLOR_RGB2BGR))
    hsv=cv2.cvtColor(o,cv2.COLOR_RGB2HSV)
    print('OK',dst,W,'x',H,len(np.unique(o.reshape(-1,3),axis=0)),'色 平均彩度 %d%%'%round(hsv[...,1].mean()/2.55))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst')
    a.add_argument('--colors',type=int,default=32,help='色数（標準32。主線の色もこの中から選ぶ）')
    a.add_argument('--shade',type=int,default=4,help='面ごとの陰影の段数（標準4。1=陰影なし）')
    a.add_argument('--gray',type=float,default=0.6,help='グレイッシュ化（色みの残る割合。標準0.6＝約11%）')
    a.add_argument('--evenlight',type=float,default=0.5,help='光ムラをならす強さ。0=しない')
    a.add_argument('--detail',type=int,default=2,choices=[1,2,3],help='面の細かさ 1粗い 2標準 3細かい')
    a.add_argument('--edge',type=int,default=50,help='輪郭とみなす強さ。大きいほど線が減る')
    a.add_argument('--line',type=float,default=10.0,help='主線を引く面どうしの色の差。小さいほど線が増える')
    a.add_argument('--dither',action='store_true',help='陰影の段の境目を市松でつなぐ（標準は使わない）')
    a.add_argument('--no-lines',action='store_true')
    a.add_argument('--shift',type=float,default=0.7,help='暗部→寒色・明部→暖色の寄せ具合（0=しない）')
    a.add_argument('--key',default='290,75',help='寒色,暖色 のLab色相（標準 290=青紫, 75=黄みの暖色）')
    a.add_argument('--no-accent',action='store_true',help='小さな鮮やかな色も彩度を落とす')
    o=a.parse_args()
    run(o.src,o.dst,o.colors,o.shade,o.gray,o.evenlight,o.detail,o.edge,o.line,o.dither,not o.no_lines,tuple(float(v) for v in o.key.split(',')),o.shift,not o.no_accent)
