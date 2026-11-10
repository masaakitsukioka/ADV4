# 背景の仕様（試作「消えたスケッチ」の作り直し用）

背景チームが作り、作者が採用した絵の情報（2026-11-10 確定）。統括（Claude）が背景チームの資料から写した。

## 状態
- 2026-11-10：**完成・採用済み**。`assets/backgrounds/classroom.png`（美術準備室）・`corridor.png`（旧校舎廊下）、どちらも 1920×1080 に置き換え済み。作り直しの作業を始めてよい

## 調べる場所の座標（1920×1080の背景の座標、物の中心）
| 場所 id | target id | 物 | x | y |
|---|---|---|---|---|
| classroom | window | 窓 | 188 | 180 |
| classroom | desk | 机（天板の配置図の紙） | 1275 | 600 |
| classroom | shelf | 作品棚 | 1755 | 375 |
| classroom | prepDoor | ドア | 1425 | 278 |
| classroom | floor | 床 | 630 | 705 |
| corridor | door | 扉 | 1523 | 495 |
| corridor | notice | 掲示板 | 908 | 398 |

## 時間帯の表現（コードで付ける。作者採用・確定）
**画面全体の色調は変えない。** 下地は着彩済みの背景そのもの。窓から入る光（朝＝陽光、放課後＝夕焼けの赤み、夜＝暗い室内に月明かり）だけを足す。**昼は下地のまま。**

- 値：`design/manga-ui/timeofday-params.json`（`time` の asa＝朝・yu＝放課後・yoru＝夜、`place` は背景ごとの光源など）
- 窓のマスク：`assets/backgrounds/masks/<場所id>-window.png`（1920×1080、白＝光の出る窓）
- 見本（正解の画）：`design/manga-ui/timeofday-sample.jpg`（各場所 2×2：左上 朝・右上 昼・左下 放課後・右下 夜。上半分 classroom、下半分 corridor）

### 計算の順番
下地の画素（RGB 0〜1）、Y0＝下地の明るさ（0.299R＋0.587G＋0.114B）、画面の高さ H、幅 W、d＝光源（place.src）からの距離 ÷ W。
1. 窓：win ＝ 窓のマスク（0〜1）。マスクがない背景では smoothstep(0.78, 0.95, Y0)。ただし上から ymax×H より下は 0
2. 光の筋：win を光源に向かって縮めた絵を N＝48 枚重ねる（i 枚目の縮め率 s＝1 − length×i/N、重み 0.97^i、重みの合計で割る。よくある god ray）。×3.0 して 0〜1 に収め、半径3px（1920幅）ぼかす → R
3. 窓のまわりのにじみ：win を半径 W÷40 でぼかす → G
4. 光の当たる所：smoothstep(0.50, 0.85, Y0)（ymax×H より下だけ）× exp(−(d ÷ 0.9)²) → P
5. 壁や物に当たる光：exp(−(d ÷ (washR × reach))²) × smoothstep(0.15, 0.70, Y0) → Wa
6. 光の量：L ＝ clamp(R × ray × rayk ＋ G × glow ＋ P × patch ＋ Wa × wash)
7. 暗くする：RGB × dark（夜だけ 0.32）
8. 窓の外（夜だけ）：窓の所を 下地×win値×wc に置き換える（win値＝0.55、wc＝#AFC2F0）
9. 夕焼けの赤み（放課後だけ）：RGB × (1 − L×tint) ＋ RGB × tc × L×tint
10. 光を足す（スクリーン）：1 − (1 − RGB) × (1 − L × color)

## 動かす所
- なし
