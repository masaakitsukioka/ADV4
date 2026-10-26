"""生成画像・下描き（線画・イラスト）を、サイカチADVの背景ルール（320x180）に変換する。写真は photo_to_pixel.py を使う。
※2026-10-22 より色数の制限はなし。彩度を抑えたグレイッシュトーンにする（--check で平均彩度を確認）。
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
def check(path,max_sat=18.0):
    """2026-10-22 のルール：サイズ320x180／色数の制限なし／彩度を抑えたグレイッシュトーン（平均彩度の目安 18%以下）。"""
    import colorsys
    im=Image.open(path).convert('RGB');ok=True
    if im.size!=(W,H): print('NG サイズ',im.size,'→ 320x180 にする');ok=False
    cs=im.getcolors(1<<16);n=len(cs) if cs else 65537
    tot=0.0;cnt=0
    for c,(r,g,b) in (cs or []):
        tot+=colorsys.rgb_to_hsv(r/255,g/255,b/255)[1]*c;cnt+=c
    sat=tot/cnt*100 if cnt else 0
    if sat>max_sat: print('注意 平均彩度 %.0f%%（目安 %.0f%%以下）→ photo_to_pixel.py --gray 0.45〜0.6 で抑える'%(sat,max_sat))
    if n>65536: print('注意 色数が多すぎる（写真のまま？）→ photo_to_pixel.py で変換する')
    print('OK' if ok else 'NG',path,im.size,(n if n<=65536 else '65536以上'),'色','平均彩度 %.0f%%'%sat);return ok
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
