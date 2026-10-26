"""写真から、サイカチADVの背景ルール（320x180・グレイッシュトーン・空は原則1色）に沿った下地ドット絵を作る。
推奨（2026-10-22 ルール）：屋外 --flat 2 --tones 24 --sky --no-palette ／ 室内 --evenlight 0.8 --flat 1 --tones 24 --no-palette（--sky は付けない）
to_pixel.py との違い：写真特有の細かい質感・ノイズ・現実の光を先に整理してから減色する。
  1) 16:9に切り抜き（--box x,y,w,h で範囲指定も可）
  2) 640x360で質感をならす（バイラテラルフィルタ）
  3) 明るさを場面の雰囲気に合わせる（--mood dusk|day|night）
  3b) グラデーションの省略（--flat 1〜3、任意）：近い色の面をまとめ、明るさの段数を減らす
  4) 面積平均で320x180へ縮小（--tones N：画面全体の階調をN色にまとめる。空・植物の陰影を2〜3段に省略）
  5) 共通パレットへLab色空間で減色（ディザなし、最大 --colors 色）
  6) 輪郭線を足す（--outline、任意）
  7) 1ドットだけ孤立した点を周囲の色に寄せて除去
使い方:
  python3 art_sources/pixel/photo_to_pixel.py 写真.jpg 出力.png [--mood dusk] [--outline] [--box x,y,w,h]
出力は「手直し前の下地」。必ず作者が等倍×4で見てドットを直す。
"""
import sys,os,json,argparse
import numpy as np,cv2
HERE=os.path.dirname(os.path.abspath(__file__))
W,H=320,180
EXTRA={'outdoor':['#3d5f8a','#6f93b8','#a9c4d9','#2f4a2e','#4f6e3a','#7f9a55']}
def palette(extra=None):
    d=json.load(open(os.path.join(HERE,'palette.json'),encoding='utf8'))['colors']
    cols=list(d.values())+(EXTRA.get(extra,[]) if extra else [])
    return np.array([[int(v[i:i+2],16) for i in (1,3,5)] for v in cols],dtype=np.uint8)
def flatten(work,strength):
    # グラデーションの省略：近い色の面をまとめ、空・植物の細かい陰影を2〜3段にする
    sp,sr={1:(8,20),2:(12,32),3:(16,44)}[strength]
    out=cv2.pyrMeanShiftFiltering(work,sp,sr)
    lab=cv2.cvtColor(out,cv2.COLOR_RGB2LAB).astype(np.float32)
    step={1:10,2:16,3:22}[strength]
    lab[:,:,0]=np.round(lab[:,:,0]/step)*step   # 明るさの段数を減らす
    return cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2RGB)
def to_lab(rgb): return cv2.cvtColor(rgb.reshape(-1,1,3).astype(np.uint8),cv2.COLOR_RGB2LAB).reshape(-1,3).astype(np.float32)

def grayish(img,chroma=0.45,light=(0.08,0.92)):
    # 彩度を抑えたグレイッシュトーン：Labの色み(a,b)を縮め、明るさの両端を少し詰める
    lab=cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[:,:,1]=128+(lab[:,:,1]-128)*chroma
    lab[:,:,2]=128+(lab[:,:,2]-128)*chroma
    lo,hi=light;lab[:,:,0]=255*lo+lab[:,:,0]*(hi-lo)
    return cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2RGB)
def sky_mask(work,thr=14.0):
    # 画面上端につながる、なめらかで明るい領域を空とみなす
    lab=cv2.cvtColor(cv2.GaussianBlur(work,(7,7),0),cv2.COLOR_RGB2LAB).astype(np.float32)
    h,w=lab.shape[:2];top=lab[:6].reshape(-1,3);ref=np.median(top,0)
    if ref[0]<120: return None,0.0          # 上端が暗い＝屋内や天井。空ではない
    near=(np.sqrt(((lab-ref)**2).sum(2))<thr*2.2)&(lab[:,:,0]>ref[0]-60)
    grad=cv2.Laplacian(cv2.cvtColor(work,cv2.COLOR_RGB2GRAY),cv2.CV_32F,ksize=3)
    smooth=cv2.GaussianBlur(np.abs(grad),(9,9),0)<thr
    cand=(near&smooth).astype(np.uint8)
    n,lbl=cv2.connectedComponents(cand,connectivity=4)
    ids=set(np.unique(lbl[0]))-{0}
    mask=np.isin(lbl,list(ids)).astype(np.uint8)
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))   # 細いすき間（ひび状の線）を埋める
    ff=mask.copy();m2=np.zeros((h+2,w+2),np.uint8);cv2.floodFill(ff,m2,(w-1,h-1),1)
    holes=(ff==0);mask=(mask>0)|holes                                      # 空の中の小さな穴も埋める
    if mask.mean()<0.02: return None,0.0
    edges=cv2.Canny(cv2.cvtColor(work,cv2.COLOR_RGB2GRAY),40,110)>0
    inner=cv2.erode(mask.astype(np.uint8),np.ones((5,5),np.uint8))>0
    cloud=edges[inner].mean() if inner.any() else 0.0   # 空の内側の輪郭の多さ＝はっきりした雲
    return mask,float(cloud)
def crop169(img,box=None):
    if box:
        x,y,w,h=box;img=img[y:y+h,x:x+w]
    h,w=img.shape[:2];t=W/H
    if w/h>t: nw=int(h*t);x=(w-nw)//2;return img[:,x:x+nw]
    nh=int(w/t);y=(h-nh)//2;return img[y:y+nh]
def mood(img,m):
    f=img.astype(np.float32)/255
    if m=='dusk':  f=np.clip((f**1.35)*np.array([1.10,.92,.86]),0,1)
    elif m=='night': f=np.clip((f**1.7)*np.array([.80,.88,1.10]),0,1)
    elif m=='day': f=np.clip(f**1.05,0,1)
    return (f*255).astype(np.uint8)
def quantize(img,pal,colors):
    lab=to_lab(img.reshape(-1,3));pl=to_lab(pal)
    idx=np.argmin(((lab[:,None,:]-pl[None,:,:])**2).sum(2),1)
    used,cnt=np.unique(idx,return_counts=True)
    if len(used)>colors:
        keep=used[np.argsort(-cnt)[:colors]];pl2=pl[keep]
        idx=keep[np.argmin(((lab[:,None,:]-pl2[None,:,:])**2).sum(2),1)]
    return pal[idx].reshape(img.shape)
def despeckle(img,passes=2):
    out=img.copy()
    for _ in range(passes):
        src=out.copy();h,w=src.shape[:2]
        for y in range(1,h-1):
            for x in range(1,w-1):
                c=src[y,x];nb=src[y-1:y+2,x-1:x+2].reshape(-1,3)
                same=(nb==c).all(1).sum()-1
                if same==0:
                    vals,counts=np.unique(np.delete(nb,4,0),axis=0,return_counts=True)
                    out[y,x]=vals[np.argmax(counts)]
    return out
def even_light(img,k=0.8):
    # 光ムラ（四隅の暗さ・照明の明暗）をならす。大きくぼかした明るさとの差だけ残す（2026-10-22 追加）
    lab=cv2.cvtColor(img,cv2.COLOR_RGB2LAB).astype(np.float32)
    L=lab[...,0];low=cv2.GaussianBlur(L,(0,0),img.shape[1]/8)
    lab[...,0]=np.clip(L-k*(low-low.mean()),0,255)
    return cv2.cvtColor(lab.astype(np.uint8),cv2.COLOR_LAB2RGB)
def run(src,dst,m='dusk',outline=False,box=None,colors=32,flat=0,extra=None,tones=0,gray=0.0,sky=False,use_palette=True,evenlight=0.0):
    img=cv2.cvtColor(cv2.imread(src),cv2.COLOR_BGR2RGB)
    img=crop169(img,box)
    if evenlight: img=even_light(img,evenlight)
    work=cv2.resize(img,(W*2,H*2),interpolation=cv2.INTER_AREA if img.shape[1]>=W*2 else cv2.INTER_CUBIC)
    for _ in range(2): work=cv2.bilateralFilter(work,9,60,60)
    work=mood(work,m)
    if flat: work=flatten(work,flat)
    if sky:
        mask,cloud=sky_mask(work)
        if mask is not None and cloud<0.02:
            col=np.median(work[mask],0).astype(np.uint8);work[mask]=col
            print('空：1色に省略（雲の輪郭 %.3f）'%cloud)
        elif mask is not None: print('空：はっきりした雲があるため残す（雲の輪郭 %.3f）'%cloud)
        else: print('空：見つからない（屋内など）')
    if gray: work=grayish(work,gray)
    small=cv2.resize(work,(W,H),interpolation=cv2.INTER_AREA)
    if tones:
        # 階調の予算：画面全体を tones 色にまとめてからパレットへ（空・植物は2〜3段に収まる）
        lab=cv2.cvtColor(small,cv2.COLOR_RGB2LAB).reshape(-1,3).astype(np.float32)
        _,lbl,cen=cv2.kmeans(lab,tones,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,30,0.5),4,cv2.KMEANS_PP_CENTERS)
        small=cv2.cvtColor(cen[lbl.flatten()].reshape(H,W,3).astype(np.uint8),cv2.COLOR_LAB2RGB)
    if use_palette:
        pal=palette(extra);q=quantize(small,pal,colors)
    else:
        q=small.copy();pal=np.unique(q.reshape(-1,3),axis=0)
    if outline:
        edges=cv2.Canny(cv2.cvtColor(work,cv2.COLOR_RGB2GRAY),60,140)
        e=cv2.resize((edges>0).astype(np.uint8)*255,(W,H),interpolation=cv2.INTER_AREA)>90
        lab=to_lab(pal);dark=pal[np.argmin(lab[:,0])]
        q[e]=dark
    q=despeckle(q)
    cv2.imwrite(dst,cv2.cvtColor(q,cv2.COLOR_RGB2BGR))
    n=len(np.unique(q.reshape(-1,3),axis=0));print('OK',dst,q.shape[1],'x',q.shape[0],n,'色')
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst')
    a.add_argument('--mood',default='none',choices=['dusk','day','night','none']);a.add_argument('--outline',action='store_true')
    a.add_argument('--box');a.add_argument('--colors',type=int,default=32)
    a.add_argument('--flat',type=int,default=0,choices=[0,1,2,3],help='グラデーションの省略 0=しない 1弱 2中 3強');a.add_argument('--extra',choices=['outdoor'],help='追加色（屋外）');a.add_argument('--tones',type=int,default=0,help='階調の予算（例 12〜16）。0=使わない')
    a.add_argument('--gray',type=float,default=0.45,help='グレイッシュ化：色みの残る割合（標準 0.45＝グレイッシュ強）。0=しない')
    a.add_argument('--sky',action='store_true',help='空を1色に省略（はっきりした雲がある時は残す）')
    a.add_argument('--no-palette',action='store_true',help='共通パレットに寄せない（色数の制限なし）')
    a.add_argument('--evenlight',type=float,default=0.0,help='光ムラをならす強さ（室内の推奨 0.8）。0=しない')
    o=a.parse_args();box=tuple(int(v) for v in o.box.split(',')) if o.box else None
    run(o.src,o.dst,o.mood,o.outline,box,o.colors,o.flat,o.extra,o.tones,o.gray,o.sky,not o.no_palette,o.evenlight)
