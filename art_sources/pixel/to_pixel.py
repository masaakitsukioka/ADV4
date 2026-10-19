"""生成画像・下描きを、サイカチADVの背景ルール（320x180・共通パレット）に変換する。
使い方:
  python3 art_sources/pixel/to_pixel.py 入力.png assets/backgrounds/<roomId>.png [--colors 32] [--dither]
  python3 art_sources/pixel/to_pixel.py --check assets/backgrounds/<roomId>.png
手順: 16:9に中央トリミング → 面積平均で320x180へ縮小 → 共通パレットから最大N色を選んで減色。
"""
import sys,json,os,argparse
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__))
W,H=320,180
def palette():
    d=json.load(open(os.path.join(HERE,'palette.json'),encoding='utf8'))['colors']
    return [tuple(int(v[i:i+2],16) for i in (1,3,5)) for v in d.values()]
def check(path):
    im=Image.open(path).convert('RGB');ok=True
    if im.size!=(W,H): print('NG サイズ',im.size,'→ 320x180 にする');ok=False
    cs=im.getcolors(1<<16);n=len(cs) if cs else 65537
    if n>32: print('NG 色数',n,'→ 32色以内');ok=False
    pal=set(palette());off=[c for _,c in (im.getcolors(1<<16) or []) if c not in pal]
    if off: print('注意 共通パレット外の色',len(off),'色（意図した追加色なら palette.json に登録）')
    print('OK' if ok else 'NG',path,im.size,(n if n<=65536 else '65536以上'),'色');return ok
def convert(src,dst,colors=32,dither=False):
    im=Image.open(src).convert('RGB');w,h=im.size;t=W/H
    if w/h>t: nw=round(h*t);im=im.crop(((w-nw)//2,0,(w-nw)//2+nw,h))
    else: nh=round(w/t);im=im.crop((0,(h-nh)//2,w,(h-nh)//2+nh))
    small=im.resize((W,H),Image.BOX)
    pal=palette();pi=Image.new('P',(1,1));flat=[v for c in pal for v in c];pi.putpalette(flat+list(pal[0] if False else flat[:3])*((768-len(flat))//3))
    q=small.quantize(palette=pi,dither=Image.Dither.FLOYDSTEINBERG if dither else Image.Dither.NONE).convert('RGB')
    used=q.getcolors(1<<16)
    if len(used)>colors:   # よく使う色だけ残して再減色
        keep=[c for _,c in sorted(used,reverse=True)[:colors]];flat=[v for c in keep for v in c]
        pi.putpalette(flat+list(pal[0] if False else flat[:3])*((768-len(flat))//3));q=small.quantize(palette=pi,dither=Image.Dither.NONE).convert('RGB')
    q.save(dst);check(dst)
if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('src');a.add_argument('dst',nargs='?');a.add_argument('--colors',type=int,default=32);a.add_argument('--dither',action='store_true');a.add_argument('--check',action='store_true')
    o=a.parse_args()
    if o.check: sys.exit(0 if check(o.src) else 1)
    convert(o.src,o.dst,o.colors,o.dither)
