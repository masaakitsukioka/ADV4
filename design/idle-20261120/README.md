# 待機中の瞬き・呼吸（2026-11-20）

CODEX_TASK_IDLE_261120.mdを先に実装。基準コミットは141652a。見本idle-demo_261120.mp4は1920×1080、30fps、13秒、音声なし。既存の画像だけを使い、画像素材・シナリオは変更していない。pushは行わない。

## 実装値

- 瞬きは2.5〜5秒のランダム待機。15%で、1回目終了の180ms後に2回目。半目70ms→閉じ70ms→半目70ms→開き。もう一方の瞬きが終わってから400ms空くまで開始を延期する（二度まばたき中の隙間も予約する）。この競合回避でランダム待機の満了後に開始が少し遅れる場合がある。
- reduced-motionでも瞬き・口パクの画像切り替えを許可。文字送りをシステム設定だけで即時終了する経路も外し、実際の台詞でも口パクが動く。文字設定を「一括」にした場合は従来どおり即時表示し、送り待ちの瞬きになる。
- character-cardの中のcharacter-bodyがimgとcanvasを一緒に動かす。幅と高さは親の100%で、後続の472×531にも追従する。canvasのhidden切り替えで呼吸はリセットしない。
- 呼吸はtranslateY ±2.2px、scaleY .996〜1.004、ease-in-out、下端中央基準。ハルキ3.6秒、サイジ4.3秒・遅延-1.2秒。指示書の値の表（±）を採用した。片方向のみの参考keyframesより全振幅になる。
- 表情画像が実際に差し替わった時だけ、240msで-12×sin(π×進み)pxの弾み。独立したtranslateなので呼吸のtransformを止めない。同じ画像の再指定では弾まない。reduced-motionでは呼吸と弾みを止める。

## 写真と測定

[idle-samples.html](idle-samples.html)に0〜3秒まで500msおきの7枚と、自然に出た両者の瞬きの写真を並べた。写真は画面キャプチャで、新しい立ち絵素材は作っていない。[測定値](idle-results.json)には呼吸のcomputed transformと、瞬き開始時刻を記録した。[推理中](deduction-idle.png)も確認。

## テスト結果・未達事項

- tests/idle.cjs：合格。探索15秒・台詞送り待ち10秒で両者が瞬き。400ms以上の開始間隔、70msのフレーム、180ms間隔の二度まばたき、選択肢待ち・推理・reduced-motionでの瞬きと口パク、呼吸、表情変更の弾みを確認。[追加テストログ](idle-test.log)
- 既存テスト21本中20本合格。[回帰ログ](regression-tests.log)。portrait-animation.cjsの旧「最短2秒」の待ち時間を新しい2.5秒と両者の間隔回避に合わせて更新した。story.cjsはDOMだけの台詞内容検査なので文字送り「一括」を明示し、システムのreduced-motionによる暗黙の即時表示に依存しないようにした。
- **既存テスト全部の合格は未達**。旧tests/transfers.cjsはshowWindow未定義で失敗する。変更前141652aを別の一時フォルダで実行しても同じ失敗。[変更前ログ](baseline-transfers.log)。同テストは現在のHTMLが読み込むpresentation.js等を読み込まず、現在の製品から削除されたtransferMenu/exportProgress/readSaveFileを呼ぶ。今回、その旧機能の復活・テストの廃止は行っていない。現在の保存復元はsaves・story・scene-transfers・menu-phs-browser等で合格。
- UI監査も合格（9サイズ×35状態＝315状態）。本文切れ・画面外・枠切れ・操作サイズ・隠れた操作・コントラスト・書体・JS/HTTPエラーは0件。既存PHS本体の装飾ミニ文字15種類は従来の除外。[UI監査](ui-audit-summary.txt)。画像素材・シナリオのgit diffは0。

実行にはPlaywright、Chrome、ローカルHTTP配信を使用。ADV_URL、CHROME_PATH、OUTで環境を指定できる。口パクテストではreduced-motion下で実際にsay()を呼び、文字が出ている途中で口の画像コマが切り替わることを確認した。
