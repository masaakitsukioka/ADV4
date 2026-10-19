# サイカチADV ビジュアル・UIルール（v0.15〜）

本編を含め、これから作る画面・背景・文字はこのルールに揃える。
実装は `data/theme.css`（最後に読み込む共通テーマ層）と `data/theme.js`。

---

## 1. 背景ドット絵：人物と同じドット密度で作る

人物の立ち絵は **104×144ドット・16色**。背景もこれと同じ「1ドットの大きさ」になるように作る。

| 項目 | ルール |
|---|---|
| 原寸 | **320×180ドット**（ゲームの仮想解像度そのもの）。1672×941などの大きな画像で納品しない |
| 1ドット | 背景の1ドット＝立ち絵の1ドット。画面上の大きさは `--px`（`theme.js` が背景を画面に敷いた倍率から計算）で共有 |
| 色数 | 1枚 **32色以内**。基本は `art_sources/pixel/palette.json`（共通パレット）から選ぶ |
| 追加色 | 場所固有の色が必要なら `palette.json` に名前付きで登録してから使う |
| 線・粒 | 粒の大きさは1ドット単位で揃える。にじみ・ぼかし・半透明のグラデーションは使わない。中間色が要る所は2×2の市松ディザ |
| 光 | 窓からの朱色の夕光を斜めに差す、を基本にする。明暗は「乗算」ではなく、色ごとに1段明るい色／1段暗い色を割り当てる（ランプ） |
| 文字 | 背景の中に読める文字・偽の日本語を描かない。メモ書きは「筆記の線」で表す |
| 余白 | 人物は画面の左右に立つ。調べる対象・重要な小物は**中央寄り**、会話窓が来る**下から1/3**には置かない |
| 表示 | `image-rendering: pixelated` で拡大。CSS側で縮小・平滑化しない |

### 作り方（生成画像や下描きから作る場合）

```sh
# 16:9に中央トリミング → 面積平均で320x180へ → 共通パレットで減色（32色以内）
python3 art_sources/pixel/to_pixel.py 下描き.png assets/backgrounds/<roomId>.png
# ルールに合っているか確認（サイズ・色数・パレット外の色）
python3 art_sources/pixel/to_pixel.py --check assets/backgrounds/<roomId>.png
```

変換後は、等倍×4で見て輪郭・顔・小物を手で1ドットずつ直す（自動変換のままにしない）。
例：`art_sources/pixel/preview/classroom-320.png`（既存の美術準備室を変換した試し。未差し替え）。

### 既存の背景について
- `classroom.png` / `corridor.png`（1672×941・約21万色）はルール外。差し替えるときは上の手順で320×180に作り直す。
- 推理画面の背景は `deduction-notebook.png`（320×180・28色、`art_sources/pixel/deduction_notebook.py` で生成）に差し替え済み。旧 `saiji-notebook-deduction.png` は未使用。

---

## 2. UIスタイル：基準は「捜査手帳」

全画面を **墨・紙（方眼）・朱** の3要素で作る。

| トークン | 値 | 用途 |
|---|---|---|
| 紙 `--t-paper` | `#efe5cf` ＋22px方眼 | パネル・コマンド・問題カード・タイトル |
| 墨 `--t-ink` / `--t-sumi` | `#111219` / `#070e10` | 文字・枠線・主ボタン |
| 朱 `--t-red` | `#da391c` | 選択中の印・決定ボタン・影 |
| 朱の影 | `8px 8px 0 #b63e31` | 紙の部品は必ず右下に朱の影を落とす |

- **ボタン**：墨のボタン＋朱の影（4px）。押せる決定は朱。選択中の行は、手帳と同じ「蛍光ペン線」（下半分に朱の帯）と `▶`。
- **角丸・ガラス風・半透明の黒パネルは使わない**。例外は会話窓（立ち絵の上で読ませるため墨の半透明）。
- **タイトル・オープニング**：暗くした背景の上に手帳の1ページ（紙のカード）。
- **推理の問題カード**：紙のカードを立ち絵より手前に置く（重ならせない）。

### 文字設定の場所
「文字の速さ」「自動送り」は画面上に出さず、手帳の **七「設定・操作方法」** で切り替える。セーブに設定も保存される。

---

## 3. 書体：4種類だけ

| 役割 | 書体 | ファイル |
|---|---|---|
| 1. 画像文字 | 筆文字・新聞切り抜き（画像） | `assets/ui/location-*.png`, `menu.png`, `name-*.png`, `menu-title-notebook.png` |
| 2. 見出し | **ADV Mincho**（Noto Serif CJK JP Bold） | `assets/fonts/NotoSerifJP-Bold.subset.woff` |
| 3. 本文・UI | **ADV Gothic**（Noto Sans CJK JP Regular/Bold） | `assets/fonts/NotoSansJP-*.subset.woff` |
| 4. ドット | **DotGothic16** | `assets/fonts/DotGothic16-Regular.ttf`（PHS液晶など） |

- CSSでは `var(--font-head)` / `var(--font-body)` / `var(--font-dot)` だけを使う。書体名を直接書かない。
- 英字の飾り見出し（例：DETECTIVE COMMAND）は使わない。日本語で書く（例：捜査コマンド）。
- 本文・見出しは同梱Webフォントなので、Mac/Windows/スマホで同じ見た目になる。

### フォントの作り直し（字が足りないとき）
同梱フォントはJIS第1・第2水準漢字＋かな＋英数記号＋シナリオ使用文字のサブセット（見出しは第1水準）。
本編で外字（例：人名の旧字）が増えたら、元のNoto CJK（OFL）から作り直す。

```sh
pyftsubset NotoSansCJKjp-Regular.otf --text-file=chars.txt \
  --layout-features='vert,vrt2,palt,vpal,kern,locl,liga' --flavor=woff \
  --output-file=assets/fonts/NotoSansJP-Regular.subset.woff
```
`chars.txt` には JIS第1・第2水準＋`data/*.js` の全文字を入れる。ライセンス：`assets/fonts/OFL-NotoCJK.txt`。

---

## 4. 画面サイズ別のルール

- **スマホ縦**（幅700px以下・縦向き）：立ち絵は**話している1人だけ**を中央に表示。推理カードは画面幅いっぱい。
- 立ち絵の高さは常に `144 × --px`。サイズ別に固定値で上書きしない。
