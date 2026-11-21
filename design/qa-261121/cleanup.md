# 整理候補（削除・移動はしていない）

## 旧 UI の候補

- `index.html` の `#targets`／`#actions`、`placeTarget()`／`showActions()`：現行の `render()` はターゲットを空にして隠し、操作はコマンド一覧から行う。旧 UI とテスト・互換コードとの依存を確認してから整理する候補。
- `index.html` の旧 `.target`／`.actions`／`.portrait-rail`／旧推理パネルのスタイル：新しい原稿用紙・手帳のスタイルと重ねて残っている。実際に効くセレクターが混ざるため、一括削除しない。
- `assets/characters/talk/saiji-*-mouths.png`（４枚）：現行の口パクは個別フレームを参照しており、静的検索では旧スプライトシートへの参照が見つからない。ただし動的参照・資料用途は要確認。
- `assets/backgrounds/deduction-notebook.png`、`assets/ui/menu.png`、`assets/ui/menu-title-notebook.png`、`assets/ui/notebook-cover.png`、`assets/ui/phs-body.png`、`assets/ui/phs-mini.png`：現行 `index.html`・`data/` の静的検索でファイル名の直接参照が見つからなかった候補。動的なパス生成や資料としての用途を確認するまでは未使用と断定しない。
- `data/scenario.json` は実行時の主データではないが、`scenario.js` との一致をテストしているため削除候補にしない。`assets/fonts/*README*`・OFL 等はライセンス情報なので残す。

## 点検開始時に未コミットだったファイル

以下は `git ls-files --others --exclude-standard` による一覧。ユーザーの既存ファイルとしてそのまま残した。

```text
CODEX_TASK_APPLE_LAYOUT_261121.md
CODEX_TASK_CHAR_1280.md
CODEX_TASK_DEBUG_261118.md
CODEX_TASK_DEDUCE_261118.md
CODEX_TASK_EXPR_A.md
CODEX_TASK_LANDSCAPE_ONLY_261121.md
CODEX_TASK_MOBILE_LANDSCAPE_261120.md
CODEX_TASK_PAPER_FULLSCREEN_261121.md
CODEX_TASK_QA_261121.md
CODEX_TASK_SE_261118.md
Claude outputs/CODEX_TASK_MOBILE_LANDSCAPE_261120.md
design/deduce-transition-261118/weak-a.html
design/paper-fullscreen-261121/iphone-before_261121.png
design/paper-fullscreen-261121/iphone-homescreen-before_261121.png
```

Git が無視する macOS の `._` メタデータはこの一覧に含めない。候補のファイルは削除していない。
