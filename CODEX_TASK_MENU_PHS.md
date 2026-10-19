# Codex作業指示書：メニュー「捜査手帳」・PHSメール・人物相関図

作成：2026-10-17（Claude）
状態：**完了**（2026-10-17 Codex実装、コミット c54bea6。テスト合格は TEST_REPORT.txt）。本編のデータ（日付・メール・相関図）は未投入。相関図の名前表記は SPEC.md の〔2026-10-18〕の決まりに従う。
対象：ADV4（試作「消えたスケッチ」）。本編では同じ仕組みに本編のデータを流し込む。

## 読むもの（先に必ず読む）
1. `design/menu-phs-relations/SPEC.md` — デザイン仕様（見た目・色・動き・操作）
2. `design/menu-phs-relations/ui-mockup-1.png`〜`3.png` と `mockup.html` — 見本。**見本の内容（第二日・マコト等）は本編の例。試作では下の「サンプルデータ」を使う。**
3. `art_sources/menu-phs-prompts.json` — 生成する画像のプロンプト
4. `DEVELOPMENT.md` — 作業前後のGit手順とテスト

## 作業の順番
1. `git status` を確認し、`git pull --ff-only origin main`。
2. `art_sources/menu-phs-prompts.json` の画像を image_gen で生成し、指定のパスに置く。透過・寸法を確認。`assets.json` に登録。
3. メニューを手帳の専用画面に置き換える（下記「実装」）。
4. PHSメール、人物相関図を実装する。
5. テストを追加・実行し、実ブラウザで確認する（下記「確認」）。
6. `README.txt` と `TEST_REPORT.txt` に変更点を追記し、コミット・プッシュ。

## 実装

### 共通
- 既存の機能（セーブ3枠、途中から、もちもの、ちょうさメモ、操作方法、推理中はメニューを開かない）を**すべて維持**する。
- `data/scenario.js` と `data/scenario.json` は必ず同じ内容に保つ。
- 新しいセーブ項目（既読メール、相関図の判明状態）は既存のセーブに追加する。**旧セーブ（現行版）を読み込めること**。足りない項目は既定値で補う。

### メニュー「捜査手帳」
- `data/story-ui.js` の `menu()` と関連関数、`index.html` のCSSを変更。
- 白いパネル（`#panel`）の代わりに、手帳の見開き画面（新しい要素、例 `#notebook`）を使う。左ページに日付欄・現在地・項目一覧、右ページに選択中の項目の中身。
- 右端のインデックス見出しで項目を切り替えられる。
- 日付・時間帯は `SCENARIO.meta.calendar`（なければ既定値）から表示する。試作の既定値：
  `{ "day": 1, "date": "1996-07-19", "weekday": "金", "label": "放課後", "time": "夕" }`
- 状態表示（持ち物の数、メモの新着、相関図の人数、メールの未読数）を出す。

### PHSメール
- シナリオに `mails` 配列を追加：
  ```json
  { "id": "mail-nakako-01", "from": "ﾅｶｺ", "date": "7/19", "time": "21:04",
    "body": "ﾉｰﾄ ﾐﾂｶｯﾀ? ｱｽ ﾌﾞｼﾂ", "when": { "sketchFound": true },
    "lines": [["ハルキ", "ナカコからだ。", "通常"]] }
  ```
  - `when` は既存の条件判定（`Events`）と同じ書式。条件を満たした時点で受信し、通知を出す。
  - `lines` は任意。本文を開いた後に会話として表示する。
- 受信の通知：探索中に画面左下へ2.5秒。会話中は会話の終了後に出す。
- 端末：`assets/ui/phs-body.png` の液晶部分に、受信一覧と本文をHTMLで重ねる。本文の拡大表示を画面左に並べる。
- 液晶のフォントは、ライセンスが明確なドット風日本語フォント（例：DotGothic16、SIL OFL）を `assets/fonts/` に同梱し、ライセンス文も同梱する。用意できなければ既存フォントで代用し、その旨を `TEST_REPORT.txt` に書く。

### 人物相関図
- シナリオに `relations` を追加：
  ```json
  { "nodes": [
      { "id": "haruki", "name": "ハルキ", "realName": "前野春樹", "color": "#8a6e52", "face": "assets/characters/haruki_normal.png", "when": {}, "realNameWhen": {} }
    ],
    "edges": [
      { "from": "haruki", "to": "saiji", "label": "相棒", "style": "solid", "when": {} }
    ] }
  ```
  - `style`：`solid`（判明）／`dashed`（不確か）／`dotted`（印象的な接点）。
  - `deceased: true` で故人表示。`hint` を持つ未登場の人物は「？？？」で表示。
  - 配置は各ノードに `x`,`y`（見開き内の％）を持たせる。
- 見開き全体を相関図に使う。判明した人物・本名・関係だけを表示する。新しく判明したらメニューの行に「● 更新」。

### 試作のサンプルデータ（消えたスケッチ）
- メール：①ナカコ（`sketchFound` で受信）「ﾉｰﾄ ﾐﾂｶｯﾀ? ｱｽ ﾌﾞｼﾂ」程度の短文 ②サイジ（`dutyChecked` で受信）など2〜3通。文面は試作の筋に合わせて短く。
- 相関図：ハルキ、サイジ、ナカコ（初めから）、オカボー（`dutyChecked` で追加）、ブンジ先生（`layoutChecked` で追加。本名は試作では未判明のまま「？？？」）。関係：相棒、同級生、クロ研の当番、配置図を記した顧問 など。

## テスト（`tests/` に追加し、既存の2本と一緒に実行）
- `node tests/conditions.cjs` と `node tests/story.cjs` が引き続き合格すること。
- 新規 `tests/menu-phs.cjs`：
  - 条件を満たすとメールを受信し、未読数が増えること。開くと既読になること。
  - 会話中は通知が出ず、会話終了後に出ること。
  - 相関図：条件前は人物が出ない／条件後に出る／本名は `realNameWhen` を満たすまで「？？？」。
  - セーブ→ロードで既読・判明状態が保たれること。旧セーブを読み込めること。
  - 推理中はメニューを開けないこと。
  - `scenario.js` と `scenario.json` の一致。

## 確認（実ブラウザ）
- 1280×720、844×390、375×667 で、手帳・PHS・相関図の文字が欠けず、重ならないこと。
- キーボード（↑↓、Enter、Esc）とマウス・タップの両方で操作できること。
- `prefers-reduced-motion` で動きが止まること。
- 画面写真を `design/menu-phs-relations/result-*.png` として保存（Claudeが確認に使う）。

## 完了の報告
- `TEST_REPORT.txt` に、合格したテスト、確認した画面サイズ、未確認の点を追記する。
- コミットメッセージ例：`Add notebook menu, PHS mail and relationship chart`
