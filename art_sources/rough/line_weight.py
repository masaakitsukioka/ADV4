"""ラフの線の太さだけを描き直す（絵の形は変えない）。見本 ref-rough の線のルール：
 - 外側の輪郭は太く、特に影側（光は左上から → 下・右向きの輪郭）を太く
 - 内側の線（髪の中・顔の中・服の縫い目）は細く
 - 線の端は細くすぼめる（入り抜き）
使い方：python3 line_weight.py 入力.png 出力.png [--inner 1.1] [--outer 2.4] [--shadow 2.2] [--taper 18]"""
import argparse,cv2,numpy as np
from scipy import ndimage as ndi
from skimage.morphology import skeletonize
a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst')
a.add_argument('--inner',type=float,default=1.4,help='内側の線の半径(px)')
a.add_argument('--outer',type=float,default=2.4,help='外側の輪郭の半径(px)')
a.add_argument('--shadow',type=float,default=2.2,help='影側でさらに足す半径(px)')
a.add_argument('--taper',type=float,default=18,help='線の端をすぼめる長さ(px)')
a.add_argument('--light',default='-1,-1',help='光の来る向き x,y（左上=-1,-1）')
o=a.parse_args()
g=cv2.imread(o.src,cv2.IMREAD_GRAYSCALE).astype(np.float32)
H,W=g.shape
ink=g<140
sk=skeletonize(ink)
# 人物の形（線と背景以外）＝外から塗った背景の補集合
lab,n=ndi.label(~ink)
border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
back=np.isin(lab,list(border))
fig=~back
# 外側の輪郭＝背景に接する線
near_back=ndi.binary_dilation(back,iterations=3)
outer=sk&near_back
# 影側：人物の形の外向きの向きと光の向き
lx,ly=[float(v) for v in o.light.split(',')];L=np.array([lx,ly]);L/=np.linalg.norm(L)
f=cv2.GaussianBlur(fig.astype(np.float32),(0,0),6)
gy,gx=np.gradient(f);nx,ny=-gx,-gy;nn=np.hypot(nx,ny)+1e-6;nx/=nn;ny/=nn
shade=np.clip(-(nx*L[0]+ny*L[1]),0,1)   # 外向きが光と反対＝影側
# 線の端：骨格の端点からの距離ですぼめる
k=np.ones((3,3));k[1,1]=0
nb=ndi.convolve(sk.astype(np.uint8),k,mode='constant')
ends=sk&(nb==1)
dend=ndi.distance_transform_edt(~ends)
taper=np.clip(dend/o.taper,0.25,1)**0.7
r=np.where(outer,o.outer+o.shadow*shade,o.inner)*taper
# 太さを線に沿ってなめらかに
w=cv2.GaussianBlur(sk.astype(np.float32),(0,0),3)
r=cv2.GaussianBlur(np.where(sk,r,0).astype(np.float32),(0,0),3)/(w+1e-6)
r=np.where(sk,r,0)
# 半径つきで描く（半径ごとにまとめて太らせる）
out=np.zeros((H,W),np.float32)
for rr in np.arange(0.5,o.outer+o.shadow+0.6,0.5):
    m=sk&(r>=rr-0.25)&(r<rr+0.25)
    if not m.any():continue
    d=ndi.distance_transform_edt(~m)
    out=np.maximum(out,np.clip(rr+0.6-d,0,1))
# 塗りの部分（まつ毛・瞳など太い黒）は元の絵のまま残す
dist=ndi.distance_transform_edt(ink)
solid=ndi.binary_dilation(dist>2.6,iterations=3)&ink
out=np.maximum(out,np.where(solid,1-g/255.0,0))
img=(255*(1-out)).clip(0,255).astype(np.uint8)
cv2.imwrite(o.dst,img);print('OK',o.dst,W,'x',H)
