# 横向き専用・画面表示（2026-11-21）

縦向きでは「画面を横にしてください」を表示し、ゲームへの入力、文字送り・自動送り・瞬きを含むタイマーとアニメーションを一時停止する。横向きに戻すと、待ち時間の残りから再開する。画面の向きが固定できるタッチ端末では「最初から」「途中から」の操作時に全画面と横向き固定を試み、失敗は無視する。iPhone Safari では案内に従って端末を横にする。

ホーム画面向けに `manifest.webmanifest` の `display: fullscreen` と `orientation: landscape`、Apple 用メタタグを追加した。アイコンは指定していない。ホーム画面表示や向きの固定の実際の挙動は端末・OS・ブラウザによって異なる。

舞台は 1920×1080 の配置を保ったまま、表示領域と左右対称の安全余白に収まる大きさにする。余白には台紙の紙色と目盛りを延長している。表示領域の変更・スクロール・向きの変化で再計算する。

## 画面写真

| サイズ | 探索 | 会話 |
|---|---|---|
| 912×356 | [探索](912x356-explore.png) | [会話](912x356-dialogue.png) |
| 912×420 | [探索](912x420-explore.png) | [会話](912x420-dialogue.png) |
| 844×390 | [探索](844x390-explore.png) | [会話](844x390-dialogue.png) |
| 667×375 | [探索](667x375-explore.png) | [会話](667x375-dialogue.png) |
| 915×412 | [探索](915x412-explore.png) | [会話](915x412-dialogue.png) |
| 1180×820 | [探索](1180x820-explore.png) | [会話](1180x820-dialogue.png) |
| 1280×720 | [探索](1280x720-explore.png) | [会話](1280x720-dialogue.png) |
| 1920×1080 | [探索](1920x1080-explore.png) | [会話](1920x1080-dialogue.png) |

[縦向きの案内（390×844）](390x844-rotate.png)

## 縦向き専用指定

`orientation:portrait` のゲーム用 CSS を19か所削除：`index.html` 1、`data/manga.css` 9、`data/theme.css` 4、`data/notebook.css` 1、`data/deduction.css` 4。`data/manga.js` の縦向き900×1950舞台の計算も削除した。新たに残した縦向き指定は案内表示とアニメーション停止のため。ゲーム画面の縦向き専用配置は使用しない。既存の JavaScript にある縦画面判定の一部は、案内中はプレイできず既存処理に影響しないため残している。

## 検証

- `tests/landscape-only-261121.cjs`：８サイズの舞台位置・最大縮尺・余白、50pxの安全領域、縦向きでの停止と横向きでの再開、マニフェストを Chromium で検証。
- シミュレーター：この Mac は Command Line Tools のみで、`xcrun simctl` を利用できない。iPhone Air の実機 Safari、ホーム画面からの起動と Android の実機での全画面・向き固定は未確認。
- 既存の `tests/transfers.cjs` は今回の変更前から `showWindow is not defined` で失敗する既知の別件。
- 既存テスト：シナリオ、画面、コマンド、推理、手帳、セーブ、効果音、立ち絵、移動などの回帰テストと、９サイズの `ui-layout.cjs` を実行。縦向きの４サイズは案内と入力停止を確認した。`ui-audit.cjs` でも縦向き４サイズの案内を確認し、対象項目の指摘は0件だった。
