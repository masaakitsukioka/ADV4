# 全身差分による口パク・瞬き（2026-11-10）

口と目の差分も、基本立ち絵と同じ位置合わせの **1040×1440の全身透過PNG**。部分画像を重ねず、1枚まるごと切り替える。画像の生成・加工は行わない。

- 基本：`assets/characters/<人>_<表情>.png`
- 口：`assets/characters/talk/<人>-<表情>-mouth-1.png`（半開き）、`-mouth-2.png`（開き）
- 目：`assets/characters/blink/<人>-<表情>-eyes-1.png`（半目）、`-eyes-2.png`（閉じ目）
- 人：haruki / saiji、表情：normal / surprised / thinking / confident。
- `index.html` の `ASSETS.mouthFrames`・`ASSETS.blinkFrames` と `assets.json` に同じパスを登録。配列の0番はnull（基本立ち絵）。
- 口パク：話者だけ、文字送り中に0→1→2→1を120msずつ。全文表示・送り停止で基本に戻る。
- 瞬き：非発話時だけ、2〜6秒間隔で1→2→1→0を70msずつ。発話と同時には行わない。
- 動きを減らす設定では差分アニメーションを止める。
- 差分が欠ける・寸法が違う場合は基本立ち絵を保持。旧312×144の口帯は使わない。
- 腕の修正は作者が同じファイル名で上書きする。描画側は座標や画像内容を変更しない。
