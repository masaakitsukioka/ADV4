# Codex作業指示：ドット絵をやめた表示への切り替え（2026-10-26）

作者決定：**ドット絵はやめる。** 寸法は `design/visual-rules/README.md` 1章。
- 立ち絵：1040×1440ピクセル（縦横比 104:144 は旧と同じ）
- 背景：1920×1080ピクセル（16:9）
- 画面の設計の基準：1920×1080。立ち絵の高さは画面の高さの約8割
- 色数の制限なし。整数倍の拡大にこだわらず、なめらかに縮小・拡大して表示する

**画像は生成しない。** 新しい寸法の本番画像はまだ無い。今あるドット絵（104×144・320×180）は、そのまま拡大して仮に表示してよい（足りない画像は灰色の仮置き）。

## 直す所（2026-10-26 時点で見つかった箇所。ほかにもあれば同じ考え方で）
- `index.html`
  - `ASSETS.resolution` の 320×180 → 1920×1080。調べる場所の座標（`targets`）も 1920×1080 の座標系に換算（×6）
  - `image-rendering: pixelated / crisp-edges`（#scene・#pixelScene・.character-talk・.tab img・.location img・#itemCanvas など）を外す。仮のドット絵を表示している間だけ必要なら、絵の種類で切り替えられる形にする
  - `#pixelScene`（canvas の仮背景 320×180、`imageSmoothingEnabled=false`）を新しい基準に合わせる
- `data/theme.js`：`--px`（320×180 の1ドットの大きさ）の計算をやめるか、「画面の高さに対する比率」に置き換える
- `data/theme.css`
  - 立ち絵の高さ `calc(var(--px)*144)` → 画面の高さの約8割（README 4章）
  - 推理背景 `.deduction-door` の `--px*320` による敷き方を、1920×1080 の画像を cover で敷く形に
  - `#opening` などの `image-rendering: pixelated` を外す
- `data/notebook.css`：`image-rendering: pixelated` を外す（手帳の表紙・タイトル・相関図の顔・メールの通知）
- `data/presentation.js`：口パクを 104×144 のマス目で描く処理 → 1040×1440 の口差し替え画像を重ねる形に（口差し替え画像はまだ無い。今の動きは壊さない）
- テスト：`tests/ui-audit.cjs`・`tests/ui-layout.cjs`・`tests/assets.cjs` などで 144×--px や 320×180 を前提にしている所を直す

## 守ること
- 見た目のルール（UIの紙・墨・朱、書体4種）は変えない。DotGothic16 は PHS の液晶表示だけに使い続ける
- `assets/` と `art_sources/rough/` のファイル名（`<id>`）は変えない。差し替えは「置き換えるだけ」の仕組みのまま
