# ADV4
## ナカコの立ち絵（2026-11-21）

ナカコが話すと右側のサイジと入れ替わり、サイジが話すと戻ります。ハルキの台詞と地の文では右側の人物を維持します。場所の移動、新しい日、会話終了後の探索、セーブデータの読み込みではサイジに戻ります。動きを抑える設定では入れ替えは即時です。右側の人物は `index.html` の `RIGHT_ACTORS` にまとめています。仮の台詞はテスト用で、シナリオには追加していません。

| 感情タグ | 表情 |
| --- | --- |
| 通常 | normal |
| 驚き | surprised |
| 思案・困惑 | thinking |
| 確信・納得・自信 | confident |
| 笑顔 | smile |
| 怒り | angry |
| 落ち込み・悲しみ | down |
| 呆れ | annoyed |
| 激怒 | rage |
| 泣きそう・涙 | teary |

表にないタグは通常。泣きそうの間は瞬きの代わりに約0.25秒ごとにうるうるを繰り返し、口パク中は口パクを優先します。動きを抑える設定ではうるうるしません。

画像は指定された元ファイルから無加工でコピーしています。指示書の「51枚」に対し、指定の内訳は10表情×各5枚＋うるうる2枚の計52枚です。既存70枚と合わせ、立ち絵は122枚です。

確認用の画面写真（1920×1080）：[通常](design/nakako-20261121/normal.png)、[驚き](design/nakako-20261121/surprised.png)、[思案](design/nakako-20261121/thinking.png)、[確信](design/nakako-20261121/confident.png)、[笑顔](design/nakako-20261121/smile.png)、[怒り](design/nakako-20261121/angry.png)、[落ち込み](design/nakako-20261121/down.png)、[呆れ](design/nakako-20261121/annoyed.png)、[激怒](design/nakako-20261121/rage.png)、[泣きそう](design/nakako-20261121/teary.png)。

録画：[サイジ→ナカコ→サイジ](design/nakako-20261121/right-actor-switch.webm)、[泣きそうのうるうる](design/nakako-20261121/teary-wet.webm)。ブラウザ自動テストは `tests/nakako-261121.cjs`、素材の登録と寸法は `tests/assets.cjs` で確認できます。
