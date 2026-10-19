"""推理画面の背景（サイジの推理ノート）を 320x180・限定パレットで描くスクリプト。
python3 art_sources/pixel/deduction_notebook.py で assets/backgrounds/deduction-notebook.png を出力。
"""
from PIL import Image
import math, random, os
random.seed(7)
W,H=320,180
P={ # パレット（人物の色＋UIの墨・紙・朱）
 'ink':(6,7,18),'ink2':(17,24,46),'navy':(35,47,76),'slate':(67,74,112),
 'wood0':(24,4,9),'wood1':(51,20,22),'wood2':(71,37,44),'wood3':(96,43,46),'wood4':(133,69,67),
 'pap0':(250,241,228),'pap1':(232,219,196),'pap2':(212,196,168),'pap3':(176,156,128),'pap4':(157,122,99),
 'grid':(219,203,176),'gr0':(52,52,66),'gr1':(88,86,98),'gr2':(128,124,128),'gr3':(170,164,160),
 'red0':(120,30,22),'red1':(186,46,26),'red2':(218,57,28),'red3':(246,122,74),
 'skin':(222,156,100),
 'sp0':(170,152,140),'sp1':(146,128,118),'sg':(128,110,104),'sp2':(120,102,96),'sp3':(96,80,80),'dk3':(74,58,62),
 'lp0':(255,226,194),'lp1':(244,200,162),'lg':(226,176,140),'lp2':(214,160,124),'lp3':(182,126,100),
 'gs3':(124,118,128),'lg3':(206,176,160),
}
img=Image.new('RGB',(W,H),P['wood1']);px=img.load()
def put(x,y,c):
    if 0<=x<W and 0<=y<H: px[x,y]=P[c] if isinstance(c,str) else c
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): put(x,y,c)
def line(x0,y0,x1,y1,c,dash=0):
    n=max(abs(x1-x0),abs(y1-y0),1)
    for i in range(n+1):
        if dash and (i//dash)%2: continue
        put(round(x0+(x1-x0)*i/n),round(y0+(y1-y0)*i/n),c)
# 机：木目（横方向の帯＋節）
for y in range(H):
    for x in range(W):
        v=math.sin((y+math.sin(x/53)*4+math.sin(x/11)*0.6)/1.7)+0.35*math.sin(x/41+y/5)
        c='wood3' if v>1.15 else 'wood2' if v>0.55 else 'wood1' if v>-0.75 else 'wood0'
        px[x,y]=P[c]
# ノート（見開き）
L,T,R,B=34,14,286,170; mid=160
rect(L+3,T+4,R+4,B+4,'ink')                      # 影
for y in range(T,B+1):                            # 紙：中央の綴じ側を暗く
    for x in range(L,R+1):
        d=abs(x-mid)
        c='pap3' if d<3 else 'pap2' if d<8 else 'pap1'
        if (x-L<2 or R-x<2 or y-T<1 or B-y<1): c='pap3'
        px[x,y]=P[c]
for x in range(L+4,R-3):                          # 方眼（6px）
    for y in range(T+3,B-2):
        if abs(x-mid)>8 and ((x-L)%6==0 or (y-T)%6==0) and px[x,y]==P['pap1']: px[x,y]=P['grid']
for y in range(T+3,B-2,5):                        # リング綴じ
    put(mid-1,y,'gr0');put(mid,y,'gr2');put(mid+1,y,'gr1');put(mid,y+1,'gr0')
# 左ページ：石膏像（胸像）のスケッチ。光は左の窓から
cx,cy=80,70
shape={}
def ell(x0,y0,rx,ry):
    for y in range(-ry,ry+1):
        for x in range(-rx,rx+1):
            if (x/rx)**2+(y/ry)**2<=1: shape[(x0+x,y0+y)]=1
ell(cx,cy-6,11,14)                     # 頭
for hx,hy in ((-4,-18),(2,-21),(8,-18),(12,-11),(13,-3),(11,4),(6,-23)): ell(cx+hx,cy+hy-2,5,4)  # 巻き毛
for y in range(0,5): shape[(cx-12,cy-6+y)]=1; shape[(cx-13,cy-4+y//2)]=1   # 鼻（左向き）
for y in range(6,16):
    for x in range(-6,7): shape[(cx+x,cy+y)]=1                       # 首
ell(cx,cy+24,20,9)                     # 胸
for y in range(30,40):
    for x in range(-14,15): shape[(cx+x,cy+y)]=1                     # 台座
for (x,y) in shape:
    if y>cy+32: continue
    l=(x-cx)*0.7+(y-cy)*0.25
    c='pap0' if l<-5 else 'gr3' if l<3 else 'gr2' if l<9 else 'gr1'
    put(x,y,c)
for (x,y) in shape:
    if y>cy+32: put(x,y,'pap2' if x<cx+6 else 'pap3')
for (x,y) in list(shape):
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        if (x+dx,y+dy) not in shape: put(x+dx,y+dy,'gr0')
for x in range(cx-14,cx+15): put(x,cy+32,'gr1')
put(cx-8,cy-8,'gr0');put(cx-7,cy-8,'gr0');put(cx-9,cy+1,'gr1');put(cx-8,cy+1,'gr1')  # 目・口
for i in range(0,14,2): line(cx+20,cy+10+i,cx+26,cy+6+i,'gr2')      # ハッチング
# りんご
ax,ay=112,120
for y in range(-9,10):
    for x in range(-10,11):
        r=(x/10)**2+(y/9)**2
        if r<1:
            s=x*0.6+y*0.8
            c='red3' if s<-5 else 'red2' if s<2 else 'red1' if s<7 else 'red0'
            put(ax+x,ay+y,c)
line(ax,ay-9,ax+2,ay-13,'wood0');put(ax+3,ay-12,'gr1');put(ax+4,ay-12,'gr1')
for x in range(-12,14): put(ax+x,ay+10,'gr2')
for x in range(-8,10,2): put(ax+x,ay+11,'gr2')
# 左ページのメモ行（文字ではなく筆記の線）
for row,(x0,n) in enumerate([(44,30),(44,24),(44,34),(44,18)]):
    y=T+10+row*6
    x=x0
    while x<x0+n*2:
        seg=random.randint(3,7)
        for k in range(seg): put(x+k,y+random.choice((0,0,1)),'gr1')
        x+=seg+2
for row in range(4):
    y=140+row*6;x=44
    while x<98:
        seg=random.randint(2,6)
        for k in range(seg): put(x+k,y+random.choice((0,1)),'gr1')
        x+=seg+2
# 右ページ：美術準備室の配置図
fx0,fy0,fx1,fy1=176,28,272,100
for x in range(fx0,fx1+1): put(x,fy0,'ink2');put(x,fy1,'ink2');put(x,fy0+1,'gr1')
for y in range(fy0,fy1+1): put(fx0,y,'ink2');put(fx1,y,'ink2');put(fx0+1,y,'gr1')
rect(fx0,58,fx0,68,'pap1');line(fx0,58,fx0+9,52,'gr1')            # ドア
rect(fx1-1,36,fx1,52,'navy')                                      # 窓
for i in range(3):
    for j in range(2): rect(194+i*22,44+j*24,206+i*22,52+j*24,'gr2'); rect(195+i*22,45+j*24,205+i*22,51+j*24,'pap0')
rect(250,82,268,96,'gr1');rect(251,83,267,95,'pap2')               # 作品棚
for k in range(4): line(252+k*4,84,252+k*4,94,'gr1')
# 朱の書き込み：丸囲み・矢印・？
for a in range(0,360,9):
    put(round(216+13*math.cos(math.radians(a))),round(72+8*math.sin(math.radians(a))),'red2')
line(230,72,248,86,'red2');line(248,86,244,86,'red2');line(248,86,247,82,'red2')
def qmark(x,y,c):
    for dx,dy in ((1,0),(2,0),(3,1),(3,2),(2,3),(1,4),(1,5),(1,7)): put(x+dx,y+dy,c)
qmark(258,32,'red1');qmark(186,106,'red1');qmark(268,108,'red1')
# 右ページ下：手がかりカード（クリップで留めた切れ端）
rect(174,112,226,156,'pap4');rect(173,111,225,155,'pap0')
for r in range(5):
    y=118+r*7;x=178
    while x<219:
        seg=random.randint(3,8)
        for k in range(seg): put(x+k,y,'gr1')
        x+=seg+2
rect(196,108,200,116,'gr2');put(197,109,'gr3');put(198,115,'gr0')
for r in range(6):                                # 右下の箇条書き
    y=116+r*8;put(234,y,'red2');put(235,y,'red2');x=239
    while x<276:
        seg=random.randint(3,7)
        for k in range(seg): put(x+k,y+random.choice((0,1)),'gr1')
        x+=seg+2
line(232,163,278,161,'red1')                      # 朱の下線
# 机の上の道具：鉛筆と練り消し
for i in range(46):
    x=8+i;y=150-i//3
    put(x,y,'red1');put(x,y+1,'red0');put(x,y-1,'red2')
for i in range(5): put(54+i,135-(i//3),'skin')
put(59,133,'gr0');put(60,133,'gr0')
for y in range(-4,5):
    for x in range(-6,7):
        if (x/6)**2+(y/4)**2<1: put(300+x,40+y,'gr2' if x+y>1 else 'gr3')
# 光：色ごとの明暗ランプで塗り分ける（乗算で色を作らない）
SH={'pap0':'sp0','pap1':'sp1','grid':'sg','pap2':'sp2','pap3':'sp3','pap4':'dk3',
    'gr3':'gs3','gr2':'gr1','gr1':'gr0','gr0':'ink2','red3':'red2','red2':'red1','red1':'red0','red0':'wood1',
    'wood4':'wood3','wood3':'wood2','wood2':'wood1','wood1':'wood0','wood0':'ink','skin':'wood4','slate':'navy','navy':'ink2'}
LT={'pap0':'lp0','pap1':'lp1','grid':'lg','pap2':'lp2','pap3':'lp3','pap4':'lp3','gr3':'lg3','gr2':'gr3','gr1':'gr2',
    'red0':'red1','red1':'red2','red2':'red3','wood0':'wood2','wood1':'wood3','wood2':'wood4','wood3':'wood4','ink2':'navy'}
name={v:k for k,v in P.items()}
src=img.copy();sp=src.load()
for y in range(H):
    for x in range(W):
        n=name.get(sp[x,y])
        band=x*0.62-y
        lit=30<band<120 and not (66<band<71)
        edge=(26<band<=30) or (120<=band<124)
        if lit or (edge and (x+y)%2==0): t=LT.get(n,n)
        else: t=SH.get(n,n)
        px[x,y]=P[t]
pal=list(P.values())
def nearest(c):
    return min(pal,key=lambda q:sum((q[i]-c[i])**2 for i in range(3)))
# 周辺減光
for y in range(H):
    for x in range(W):
        if ((x-160)/175)**2+((y-90)/108)**2>1 and (x+y)%2==0:
            c=px[x,y];px[x,y]=nearest(tuple(int(v*0.55) for v in c))
out=os.path.join(os.path.dirname(__file__),'..','..','assets','backgrounds','deduction-notebook.png')
img.save(out)
print('colors',len(img.getcolors(256)),'->',os.path.normpath(out))
