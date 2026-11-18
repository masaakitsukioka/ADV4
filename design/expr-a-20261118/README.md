# 立ち絵の表情追加（2026-11-18）

指定の30枚を加工せずコピーし、寸法1280×1440とコピー元とのSHA-256一致を確認。既存40枚と合わせ、立ち絵70枚の寸法と登録をテストした。

| 人物 | 感情タグ | 表情キー | 会話画面 | 瞬き・口パク |
|---|---|---|---|---|
| ハルキ | 笑顔 | smile | [写真](haruki-smile.png) | [動画](haruki-smile.mp4) |
| ハルキ | 困惑 | troubled | [写真](haruki-troubled.png) | [動画](haruki-troubled.mp4) |
| ハルキ | 呆れ | annoyed | [写真](haruki-annoyed.png) | [動画](haruki-annoyed.mp4) |
| サイジ | からかい | tease | [写真](saiji-tease.png) | [動画](saiji-tease.mp4) |
| サイジ | 疑問 | question | [写真](saiji-question.png) | [動画](saiji-question.mp4) |
| サイジ | 呆れ | annoyed | [写真](saiji-annoyed.png) | [動画](saiji-annoyed.mp4) |

写真は1920×1080、動画は960×540で実ブラウザを連続撮影し10fpsで再構成したもの。再生時間は実時間と完全には一致しない。仮の台詞は撮影時だけ使用し、scenarioには追加していない。動画の前半は口パク、後半は発話を止めて瞬きを確認する。各コマの検出結果は `frames-observed.json` に記録。ハルキの笑顔とサイジの呆れの半目・閉じ目は、標準と画素が同一であり、瞬き中の見た目は変わらない。

共通の既存対応は通常→normal、驚き→surprised、困惑→thinking、納得→confident、思案→thinking、疑問→surprised、確信→confident。上表の人物別対応を優先する。よってサイジの困惑はthinking、ハルキの疑問はsurprised。本人に用意されていない感情や未知のタグはnormal。現在の試作では台詞を変更せず、ハルキ「困惑」５か所とサイジ「疑問」２か所の表示が新しい絵になる。

## 「ナカコ」の感情タグについて

指示書にある「サイジの台詞で感情タグがナカコ」の箇所は、この作業開始時の `data/scenario.js` / `data/scenario.json` では確認できなかった。`data/scenario.js` 633行付近に `サイジ、ハルキ、ナカコ、オカボー` が並ぶ箇所はあるが、これは最後の推理の選択肢 `questions[4].groups[0].opts` であり、台詞や感情タグではない。シナリオの修正は行っていない。

## 検証

`tests/expr-a.cjs` で６表情の標準・瞬き・口パク各コマ、発話終了後の標準画像への復帰、人物別の対応と未対応時の通常表示を確認。既存の操作・保存・ストーリー・レイアウトテストも合格。９サイズの画面監査は本文の切れ・画面外・ボタンの隠れ・同梱外フォントが０件（PHS本体の装飾文字は従来どおり小さい）。`tests/transfers.cjs` は作業前からの `showWindow is not defined` による失敗が残るが、実ブラウザの `scene-transfers.cjs` は合格。
