"""立ち絵（104x144ドット）→ 下絵ラフ（線画）。生成AIは使わない。
陰影の段はまとめて「部位（髪・肌・上着・シャツ・ネクタイ）」の面にし、その境目と、濃いドット（目・口・眼鏡など）を線にする。
使い方：python3 rough_char.py 入力.png 出力.png [--scale 6] [--minpx 8] [--feat 0.3]"""
import argparse,cv2,numpy as np
from scipy import ndimage as ndi
from skimage.morphology import skeletonize,remove_small_objects
a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst')
a.add_argument('--scale',type=int,default=6);a.add_argument('--minpx',type=int,default=8)
a.add_argument('--feat',type=float,default=0.3,help='目・口・眼鏡など細い線の拾いやすさ（小さいほど拾う）')
o=a.parse_args()
im=cv2.imread(o.src,cv2.IMREAD_UNCHANGED);rgb=cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2RGB);al=im[...,3]>128
lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(np.float32)
L,A,B=lab[...,0],lab[...,1],lab[...,2]
dark=al&(L<14)&(B>=118)          # 主線（黒に近いドット）
part=np.full(al.shape,-1)
part[al&(B<=118)]=0              # 紺（上着・サイジの髪）
part[al&(B>=150)]=1              # 肌
part[al&(L>=185)&(B<150)&(B>118)]=2   # 白（シャツ）
part[al&(part<0)&~dark]=3        # 赤茶（髪・ネクタイ）
lbl=part.copy();lbl[dark]=-1;body=al&~dark
K=4
# 濃いドットは、いちばん近い部位の面に入れる（主線が二重にならないように）
idx=ndi.distance_transform_edt(lbl<0,return_distances=False,return_indices=True)
lbl2=lbl.copy();m=dark;lbl2[m]=lbl[idx[0][m],idx[1][m]]
# 小さな面（陰影の粒・ハイライト）は周りの面に吸収
for _ in range(2):
    for k in range(K):
        cc,n=ndi.label(lbl2==k)
        for i in range(1,n+1):
            mm=cc==i
            if mm.sum()<o.minpx:
                ring=ndi.binary_dilation(mm)&~mm;v=lbl2[ring];v=v[v!=k]
                if len(v):lbl2[mm]=np.bincount(v+1).argmax()-1
S=o.scale;H,W=al.shape;h,w=H*S,W*S;sig=S*0.9
def up(mm):return cv2.GaussianBlur(cv2.resize(mm.astype(np.float32),(w,h),interpolation=cv2.INTER_NEAREST),(0,0),sig)
st=np.stack([up(lbl2==j) for j in range(-1,K)],-1);reg=st.argmax(-1)
P=np.pad(reg,1,mode='edge');edge=np.zeros((h,w),bool)
for dy,dx in((1,0),(0,1)):edge|=P[1+dy:1+dy+h,1+dx:1+dx+w]!=reg
# 濃いドットのうち、面の境目から離れたもの（目・口・眼鏡・しわ）だけ線として足す
feat=dark&~ndi.binary_dilation(~al,iterations=1)
dk=up(feat)>o.feat
line=edge|skeletonize(dk)
# 近い平行線をまとめる
line=skeletonize(ndi.binary_dilation(line,iterations=2))
line=remove_small_objects(line,max_size=S*3,connectivity=2)
line[-S*2:,:]=False  # 画面下の切れ目の線は引かない
rng=np.random.default_rng(3)
ln=cv2.GaussianBlur(cv2.dilate(line.astype(np.uint8),np.ones((3,3),np.uint8)).astype(np.float32),(0,0),0.9)
noise=cv2.GaussianBlur(rng.random((h,w)).astype(np.float32),(0,0),7);noise=(noise-noise.min())/(np.ptp(noise)+1e-6)
ink=np.clip(ln*(0.6+0.5*noise),0,1)
paper=np.array((250,249,245),np.float32);pencil=np.array((48,48,56),np.float32)
out=paper*(1-ink[...,None])+pencil*ink[...,None]
pad=S*6;Ht=h+pad*2;Wt=int(Ht*3/4)
canvas=np.tile(paper,(Ht,Wt,1));x0=(Wt-w)//2;canvas[pad:pad+h,x0:x0+w]=out
cv2.imwrite(o.dst,cv2.cvtColor(canvas.astype(np.uint8),cv2.COLOR_RGB2BGR));print('OK',o.dst,Wt,'x',Ht)
