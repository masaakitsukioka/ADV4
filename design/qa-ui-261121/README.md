# 総点検で判断待ちだった UI の修正（2026-11-21）

基準：`cfe335c`。画像素材・シナリオは変更していない。UI チームの画像は点検時点で SSD 上になかったため、指示書の文章と数値に従って実装した。

## 読む文字と飾り

- 読む文字：記録の「空き」・記録番号、メモ本文、人物名・本名、関係名、操作・設定・PHS の本文など。空き枠の文字を `#5f5a50` とした（紙色 `#fbfaf3` に対し約 6.55:1）。
- 飾り：ノートに印刷された `No.`・`Date`・サイジ、紙の消し跡、サイジの書き込み・落書き。既存の見た目のまま `aria-hidden="true"` とし、読み上げ・文字監査から除外した。PHS の飾りの本体画像も従来どおり除外。
- 手がかりの確認：メモの「同じ果物」「当番オカボー」「破られたページ」は本文にあり、メールの時刻・内容は PHS にもある。一方、飾りの「その日は1人きり」という断定は調査中のメモ本文にはなく、当番がオカボーだったことしか書かれていない。シナリオの解明部分には「みんなが帰った後、誰もいない準備室」とあるが、当日全体を１人きりと断定する根拠とは限らない。**書き込みだけにある強い表現として作者に報告する。** シナリオや未確認の情報は変更していない。

## 相関図と操作

凡例は左下の黄色い「？ 線の見方」に変更。クリック・タップまたは Tab で移動後に Enter で開き、閉じるボタン・付せんの再押下・紙の外・Esc で閉じられる。開いた紙の文字は表示上14px以上。５人版の人物・線・名前の既存位置は維持した。

判明済み人物が８人以下なら従来の相関図、９人以上ならグループ表示に切り替える。全体画面にはグループ名・人数・代表者とグループ間の関係を表示。グループを選ぶとその人物と内部関係、右下には他のグループとの関係を表示する。新しい人物があるグループには NEW が付く。グループ名はデータから取得し、長い補足は札上では省き、読み上げ名に全体を残す。

Tab またはタップでグループの札に移り、札にフォーカスがある時の ←→ で切り替える。それ以外の ←→ は従来どおりノートのシール切り替え。人物が増えたら絵を縮め、**１グループに13人以上集まる場合は、12人ずつ「前・次」でページを切り替える補助操作**を追加した。スクロールは使用しない。17人見本の元の４グループは各１ページに収まる。

## 検証

- 指定９サイズ × Chromium・WebKit の18環境で、５人、17人見本の全体・各グループ、凡例の開閉、NEW、Tab・←→、８人と９人の境界、９人・12人・17人が同一グループに集まる場合を検証。[結果](visual-results.txt)
- 17人見本はテスト時にのみ読込。グループ間の関係の検証用に「ハルキ─知り合い─オカボー」を一時的に追加しており、シナリオには保存していない。
- [UI 監査](audit-summary.txt)：飾りを除く12px未満の文字・コントラスト不足は０件。装飾の aria-hidden、空き枠の色、開いた凡例がタブ・閉じるボタンを塞がないことも両ブラウザーで確認した。[確認結果](accessibility-results.txt) 前回までの既存テストと通しプレイも実行。[既存テスト](test-results.txt)／[通しプレイ](playthrough.json)
- 実機 Safari・ホーム画面アプリと実際の音声は未確認。以下はブラウザー自動操作の写真。

## 修正前後の画面

[修正前：５人と凡例](before-five.png)／[修正前：17人](before-seventeen.png)／[修正前：記録](before-records.png)

| 大きさ | メモ | 記録 | ５人 | 線の見方 | 17人 全体 | グループ１ | グループ２ | グループ３ | グループ４ |
|---|---|---|---|---|---|---|---|---|---|
| 852x340 | [表示](screens/chromium-852x340-memo.png) | [表示](screens/chromium-852x340-save.png) | [表示](screens/chromium-852x340-relations.png) | [開く](screens/chromium-852x340-legend.png) | [表示](screens/chromium-852x340-17-overview.png) | [表示](screens/chromium-852x340-17-group-1.png) | [表示](screens/chromium-852x340-17-group-2.png) | [表示](screens/chromium-852x340-17-group-3.png) | [表示](screens/chromium-852x340-17-group-4.png) |
| 912x356 | [表示](screens/chromium-912x356-memo.png) | [表示](screens/chromium-912x356-save.png) | [表示](screens/chromium-912x356-relations.png) | [開く](screens/chromium-912x356-legend.png) | [表示](screens/chromium-912x356-17-overview.png) | [表示](screens/chromium-912x356-17-group-1.png) | [表示](screens/chromium-912x356-17-group-2.png) | [表示](screens/chromium-912x356-17-group-3.png) | [表示](screens/chromium-912x356-17-group-4.png) |
| 667x375 | [表示](screens/chromium-667x375-memo.png) | [表示](screens/chromium-667x375-save.png) | [表示](screens/chromium-667x375-relations.png) | [開く](screens/chromium-667x375-legend.png) | [表示](screens/chromium-667x375-17-overview.png) | [表示](screens/chromium-667x375-17-group-1.png) | [表示](screens/chromium-667x375-17-group-2.png) | [表示](screens/chromium-667x375-17-group-3.png) | [表示](screens/chromium-667x375-17-group-4.png) |
| 912x420 | [表示](screens/chromium-912x420-memo.png) | [表示](screens/chromium-912x420-save.png) | [表示](screens/chromium-912x420-relations.png) | [開く](screens/chromium-912x420-legend.png) | [表示](screens/chromium-912x420-17-overview.png) | [表示](screens/chromium-912x420-17-group-1.png) | [表示](screens/chromium-912x420-17-group-2.png) | [表示](screens/chromium-912x420-17-group-3.png) | [表示](screens/chromium-912x420-17-group-4.png) |
| 956x440 | [表示](screens/chromium-956x440-memo.png) | [表示](screens/chromium-956x440-save.png) | [表示](screens/chromium-956x440-relations.png) | [開く](screens/chromium-956x440-legend.png) | [表示](screens/chromium-956x440-17-overview.png) | [表示](screens/chromium-956x440-17-group-1.png) | [表示](screens/chromium-956x440-17-group-2.png) | [表示](screens/chromium-956x440-17-group-3.png) | [表示](screens/chromium-956x440-17-group-4.png) |
| 1180x820 | [表示](screens/chromium-1180x820-memo.png) | [表示](screens/chromium-1180x820-save.png) | [表示](screens/chromium-1180x820-relations.png) | [開く](screens/chromium-1180x820-legend.png) | [表示](screens/chromium-1180x820-17-overview.png) | [表示](screens/chromium-1180x820-17-group-1.png) | [表示](screens/chromium-1180x820-17-group-2.png) | [表示](screens/chromium-1180x820-17-group-3.png) | [表示](screens/chromium-1180x820-17-group-4.png) |
| 1376x1032 | [表示](screens/chromium-1376x1032-memo.png) | [表示](screens/chromium-1376x1032-save.png) | [表示](screens/chromium-1376x1032-relations.png) | [開く](screens/chromium-1376x1032-legend.png) | [表示](screens/chromium-1376x1032-17-overview.png) | [表示](screens/chromium-1376x1032-17-group-1.png) | [表示](screens/chromium-1376x1032-17-group-2.png) | [表示](screens/chromium-1376x1032-17-group-3.png) | [表示](screens/chromium-1376x1032-17-group-4.png) |
| 1512x860 | [表示](screens/chromium-1512x860-memo.png) | [表示](screens/chromium-1512x860-save.png) | [表示](screens/chromium-1512x860-relations.png) | [開く](screens/chromium-1512x860-legend.png) | [表示](screens/chromium-1512x860-17-overview.png) | [表示](screens/chromium-1512x860-17-group-1.png) | [表示](screens/chromium-1512x860-17-group-2.png) | [表示](screens/chromium-1512x860-17-group-3.png) | [表示](screens/chromium-1512x860-17-group-4.png) |
| 1920x1080 | [表示](screens/chromium-1920x1080-memo.png) | [表示](screens/chromium-1920x1080-save.png) | [表示](screens/chromium-1920x1080-relations.png) | [開く](screens/chromium-1920x1080-legend.png) | [表示](screens/chromium-1920x1080-17-overview.png) | [表示](screens/chromium-1920x1080-17-group-1.png) | [表示](screens/chromium-1920x1080-17-group-2.png) | [表示](screens/chromium-1920x1080-17-group-3.png) | [表示](screens/chromium-1920x1080-17-group-4.png) |

WebKit の記録例：[852×340・凡例](screens/webkit-852x340-legend.png)、[1180×820・全体](screens/webkit-1180x820-17-overview.png)。人数が集中した場合：[17人・１ページ目](screens/chromium-852x340-17-one-group-page-1.png)、[２ページ目](screens/chromium-852x340-17-one-group-page-2.png)。
