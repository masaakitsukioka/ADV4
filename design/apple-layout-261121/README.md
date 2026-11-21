# Apple 端末向け原稿用紙レイアウト（2026-11-21）

画面寸法と安全領域をもとに、原稿用紙、画面端の部品、コマをそれぞれ配置する。機種名では分岐しない。縦向きの案内は従来どおり。

## 配置の基準

表示領域から実際の安全領域を引き、左右だけは大きい方にそろえる。上下はそれぞれ実際の値を使う。`s = min(利用可能幅 / 1920, 利用可能高さ / 1080)`、`ex = 利用可能幅 / s - 1920`、`ey = 利用可能高さ / s - 1080`。以下の数値は拡大縮小前の舞台単位。実画面では `s` を掛ける。

| 対象 | 配置の決まり |
|---|---|
| 台紙 | 表示領域全体を紙色にし、安全領域の外まで１枚の SVG として描画。外側の定規線は左右40、上80、下40、内側の枠は左右52、上88、下40。目盛りは６単位間隔、中央が０。舞台内の旧 `paper.svg` と点線延長は撤去 |
| メニュー | 左 `1598 + ex`、上18、312×94、傾きは従来どおり。従来の左1630・上6では回転した付せんが安全領域をはみ出すため、左へ32、下へ12だけ補正 |
| 情報欄 | タイトルは左122。日付790・場所1080には `ex / 2`、時刻の丸1348〜1564には `ex` を加える。欄と目盛りは画面幅に延長 |
| ハルキ／サイジ | 左端からそれぞれ `-12` と `1475 + ex`、上 `599 + ey` と `592 + ey`。大きさ472×531。元の見本どおり、左右の端にわずかにはみ出し、下端でもそれぞれ50・43単位はみ出す |
| 捜査／調べる先 | 左 `1462 + ex`／`1722 + ex`、上108／136。傾いた一覧項目が安全領域を越える場合だけ、その項目を内側へ補正。多数の項目は従来どおり必要な場合に詰める |
| 会話の紙 | 奥は左89・幅 `1760 + ex`・上 `812 + ey`、手前は左60・幅 `1770 + ex`・上 `847 + ey`。話者と本文は左右の余りの中央に移し、本文の幅は最大1080（従来の1.2倍） |
| 推理・手帳 | 推理の設問と選択肢はコマの中央、右の進行欄は `ex` だけ右へ。台紙を含む背景を白黒化し赤入れは外側。手帳は安全領域内で1920×1080を最大表示 |
| コマ | 左62。幅は `1398 + min(ex, 2.15×718 - 1398)`、高さは `718 + min(ey, 幅 / 1.70 - 718)`。縦余白の残りは上側と下側に均等配置。縦横比は1.70〜2.15。調査位置は元画像とコマの cover 寸法から換算 |

## 画面写真

Chromium の画面サイズと安全領域を設定した画像。探索・会話（２人）・一覧・推理・手帳の６種類を保存した。

| 環境 | 探索 | ハルキ | サイジ | 一覧 | 推理 | 手帳 |
|---|---|---|---|---|---|---|
| iPhone SE | [探索](iphone-se-explore.png) | [会話](iphone-se-haruki.png) | [会話](iphone-se-saiji.png) | [一覧](iphone-se-list.png) | [推理](iphone-se-deduction.png) | [手帳](iphone-se-menu.png) |
| iPhone Air | [探索](iphone-air-explore.png) | [会話](iphone-air-haruki.png) | [会話](iphone-air-saiji.png) | [一覧](iphone-air-list.png) | [推理](iphone-air-deduction.png) | [手帳](iphone-air-menu.png) |
| iPhone Pro Max | [探索](iphone-max-explore.png) | [会話](iphone-max-haruki.png) | [会話](iphone-max-saiji.png) | [一覧](iphone-max-list.png) | [推理](iphone-max-deduction.png) | [手帳](iphone-max-menu.png) |
| iPad 11インチ | [探索](ipad-11-explore.png) | [会話](ipad-11-haruki.png) | [会話](ipad-11-saiji.png) | [一覧](ipad-11-list.png) | [推理](ipad-11-deduction.png) | [手帳](ipad-11-menu.png) |
| iPad 13インチ | [探索](ipad-13-explore.png) | [会話](ipad-13-haruki.png) | [会話](ipad-13-saiji.png) | [一覧](ipad-13-list.png) | [推理](ipad-13-deduction.png) | [手帳](ipad-13-menu.png) |
| MacBook | [探索](macbook-explore.png) | [会話](macbook-haruki.png) | [会話](macbook-saiji.png) | [一覧](macbook-list.png) | [推理](macbook-deduction.png) | [手帳](macbook-menu.png) |

[912×420 比較](comparison-912x420.png) ／ [912×356 比較](comparison-912x356.png)。上は作者の修正前の実機写真、下は修正後の Chromium シミュレーション。Safari の実機写真にはアドレスバーも含まれるため、写真全体の高さは同一ではない。実機写真の元ファイルは `design/paper-fullscreen-261121/` に残している。

## 検証・制限

- `tests/apple-layout-261121.cjs`：指定の19画面、左右および下側の安全領域、左右非対称の安全領域、台紙の端・縮尺、付せん、人物・コマンドの座標、コマ比率、調査位置７か所、長い会話、推理、手帳を確認。安全領域は CSS で模擬した。
- 旧テストのうち、横向き全サイズで部品座標を完全固定する前提は、新しい端基準の仕様に更新。台紙 SVG の装飾用数字は画面監査で本文扱いしない。シナリオと画像素材は変更していない。
- 既存のシナリオ、コマンド、推理、手帳、セーブ、効果音、移動、画面レイアウト等の回帰テストを実行。既知の `tests/transfers.cjs` は修正前から `showWindow is not defined` で失敗する別件。
- iOS Simulator は利用できない（`xcrun simctl` なし）。今回の変更後の iPhone・iPad 実機 Safari、および各 Mac 実機での表示は未確認。作者によるホーム画面からの全画面表示確認は変更前のもの。
