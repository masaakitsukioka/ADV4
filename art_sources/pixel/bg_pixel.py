"""サイカチADV 背景ドット化（2026-10-22 新ルール版）
ルール：design/visual-rules/README.md 1章「背景ドット絵の描き方」
  - 背景に輪郭線は引かない。形は明暗の差で分ける
  - 陰影は素材ごとに2〜4段。広い面は2段。なだらかなグラデーションにしない
  - 細かく描くのは見せ場（--focus の範囲）だけ。それ以外は大きな面にまとめる
  - 時間帯（--time morning/day/after/night）で地の色を変える。暗部は寒色、明部は暖色。黒・灰色にしない
  - 鮮やかな色は小さな面（光源・手がかり）だけ残す
使い方：python3 bg_pixel_v5.py 入力 出力.png --time after --focus 0.22,0.12,0.78,0.80
"""
import argparse,cv2,numpy as np
from skimage.segmentation import felzenszwalb
W,H=320,180

# 時間帯の色の道筋（明るさ0〜1 → Labの色相・色み）。参考：2331/2332（夕方）、2335/2337（昼）、2336/2333（夜）
RAMPS={
 'after':[(0.00,295,16),(0.30,305,18),(0.50,340,18),(0.66,25,26),(0.82,60,32),(1.00,88,18)],
 'day':  [(0.00,275,14),(0.40,265,12),(0.70,240,6),(0.85,80,8),(1.00,90,4)],
 'night':[(0.00,235,8),(0.40,225,8),(0.70,215,10),(1.00,205,8)],
 'morning':[(0.00,260,8),(0.50,250,6),(0.80,85,8),(1.00,90,6)],
}
def ramp(t,name):
    pts=RAMPS[name];t=float(np.clip(t,0,1))
    for (t0,h0,c0),(t1,h1,c1) in zip(pts,pts[1:]):
        if t<=t1:
            u=(t-t0)/max(t1-t0,1e-6);d=((h1-h0+180)%360)-180
            return (h0+d*u)%360,c0+(c1-c0)*u
    return pts[-1][1],pts[-1][2]

def crop169(img):
    h,w=img.shape[:2];tw=min(w,h*16//9);th=tw*9//16;x=(w-tw)//2;y=(h-th)//2
    return img[y:y+th,x:x+tw]
def lab(img):return cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32)
def rgb(l):return cv2.cvtColor(np.clip(l,0,255).astype(np.uint8),cv2.COLOR_LAB2RGB)
def even_light(img,k):
    L=lab(img);low=cv2.GaussianBlur(L[...,0],(0,0),img.shape[1]/8)
    L[...,0]=L[...,0]-k*(low-low.mean());return rgb(L)

def segment(work,detail):
    sp,sr,scale,mins={1:(12,26,600,180),2:(8,18,220,60),3:(5,12,90,20)}[detail]
    return felzenszwalb(cv2.pyrMeanShiftFiltering(work,sp,sr),scale=scale,sigma=0.6,min_size=mins)

def despeckle(img):
    out=img.copy();h,w=img.shape[:2]
    for y in range(1,h-1):
        for x in range(1,w-1):
            c=tuple(img[y,x]);n=[tuple(img[y-1,x]),tuple(img[y+1,x]),tuple(img[y,x-1]),tuple(img[y,x+1])]
            if c not in n and n.count(n[0])>=3:out[y,x]=n[0]
    return out

def run(src,dst,time='after',focus=(0.22,0.12,0.78,0.80),tint=0.7,evenlight=0.7,colors=32,minL=0.07):
    img=crop169(cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB))
    if evenlight:img=even_light(img,evenlight)
    work=cv2.resize(img,(W*2,H*2),interpolation=cv2.INTER_AREA)
    # 見せ場だけ細かく分け、他は大きな面にまとめる
    fine=segment(work,3);coarse=segment(work,2)
    fm=np.zeros(work.shape[:2],bool);x0,y0,x1,y1=focus
    fm[int(y0*H*2):int(y1*H*2),int(x0*W*2):int(x1*W*2)]=True
    seg=np.where(fm,fine,coarse+fine.max()+1)[::2,::2];focus320=fm[::2,::2]
    Lab=lab(cv2.resize(cv2.GaussianBlur(work,(0,0),1.0),(W,H),interpolation=cv2.INTER_AREA));L=Lab[...,0]
    out=np.zeros((H,W,3),np.float32);big=np.zeros((H,W),bool)
    Lmin,Lmax=np.percentile(L,1),np.percentile(L,99.5)
    for r in np.unique(seg):
        m=seg==r;n=m.sum();Ls=L[m];med=np.median(Lab[m],0)
        area=n/(W*H)
        # 段の数：広い面2段、見せ場の小物4段、その他3段
        steps=1 if area>0.06 else 2 if area>0.03 else (4 if focus320[m].mean()>0.5 else 3)
        if area>0.03:big[m]=True
        if n<12 or np.percentile(Ls,90)-np.percentile(Ls,10)<5:steps=1
        if steps==1:lev=np.zeros(n,int);vals=[np.median(Ls)]
        else:
            qs=np.percentile(Ls,np.linspace(0,100,steps+1)[1:-1])
            lev=np.digitize(Ls,qs);vals=[np.median(Ls[lev==k]) if (lev==k).any() else np.median(Ls) for k in range(steps)]
        mch=np.hypot(med[1]-128,med[2]-128);mh=np.degrees(np.arctan2(med[2]-128,med[1]-128))%360
        accent=area<0.004 and mch>20 and focus320[m].mean()>0.5  # 小さく鮮やかな物（果物など）は自分の色を残す
        ys,xs=np.where(m)
        for k in range(len(vals)):
            sel=lev==k
            t=(vals[k]-Lmin)/max(Lmax-Lmin,1);t=float(np.clip(t,0,1));t=t*t*(3-2*t)*0.6+t*0.4  # 明暗の差を少し強める
            Lo=255*(minL+(0.96-minL)*np.clip(t,0,1))
            rh,rc=ramp(t,time)
            if accent:hh,cc=mh,max(mch*0.9,rc)
            else:
                d=((rh-mh+180)%360)-180;hh=(mh+d*tint)%360
                cc=mch*0.45*(1-tint)+rc*tint
            cc=max(cc,4.0)  # 灰色にしない
            out[ys[sel],xs[sel]]=(Lo,128+cc*np.cos(np.radians(hh)),128+cc*np.sin(np.radians(hh)))
    col=rgb(out)
    X=lab(col).reshape(-1,3)
    _,lbl,cen=cv2.kmeans(X,colors,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,0.3),5,cv2.KMEANS_PP_CENTERS)
    lbl=lbl.reshape(H,W)
    # 見せ場の外は、面の境目のギザギザを多数決でならす（大きな面を平らに）
    acc=np.stack([cv2.boxFilter((lbl==j).astype(np.float32),-1,(7,7),normalize=False) for j in range(colors)],-1)
    sm=acc.argmax(-1);lbl=np.where(big,sm,lbl)  # 広い面（壁・床・天井）だけ平らにならす
    o=despeckle(rgb(cen[lbl].reshape(H,W,3)))
    cv2.imwrite(dst,cv2.cvtColor(o,cv2.COLOR_RGB2BGR))
    print('OK',dst,W,'x',H,len(np.unique(o.reshape(-1,3),axis=0)),'色')

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst')
    a.add_argument('--time',default='after',choices=list(RAMPS))
    a.add_argument('--focus',default='0.22,0.12,0.78,0.80',help='見せ場の範囲（左,上,右,下 を画面比で）')
    a.add_argument('--tint',type=float,default=0.7,help='時間帯の色に寄せる強さ（0=素材の色のまま、1=時間帯の色だけ）')
    a.add_argument('--colors',type=int,default=32)
    a.add_argument('--evenlight',type=float,default=0.7)
    o=a.parse_args()
    run(o.src,o.dst,o.time,tuple(float(v) for v in o.focus.split(',')),o.tint,o.evenlight,o.colors)
