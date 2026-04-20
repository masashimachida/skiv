# skiv 仕様書

## 概要

複数の AI コーディングツール（Claude Code / Codex / Junie 等）を非インタラクティブモードで並列起動し、タスクを分散実行するオーケストレーター。個人の開発作業効率化を目的とし、npm パッケージとして配布する。

---

## 設計原則

- **ロールはシステムが規定しない** — ロール名はプロジェクトの `skiv.config.json` で自由に定義する
- **エージェントは自己組織化** — エージェントが自分でタスクを見つけ・クレームし・完了させる
- **フローはタスクグラフで表現する** — 実行順序はタスクの `dependencies` で決まる

---

## CLI コマンド

| コマンド | 説明 |
|---|---|
| `skiv init` | カレントディレクトリに設定ファイルを生成 |
| `skiv planner` | Orchestrator をバックグラウンド起動し、Planner（Claude）をフォアグラウンドで起動 |
| `skiv run` | Orchestrator のみ起動 |

---

## システムアーキテクチャ

```
ユーザー
  │
  ▼
skiv planner
  ├─ Orchestrator（バックグラウンド、ポーリングループ）
  │    ├─ task_manager からタスク取得
  │    ├─ git worktree 作成（feature/<task_id>）
  │    ├─ エージェントを並列起動（非インタラクティブ）
  │    └─ 完了後: git merge → worktree 削除
  │
  └─ Planner（フォアグラウンド、Claude インタラクティブセッション）
       ↕ ユーザーと壁打ちして要件整理
       └─ 合意 → task_manager にタスク登録
```

---

## ディレクトリ構成

```
project-root/
├── skiv.config.json       # エージェント・ロール設定
├── .mcp.json              # プロジェクトの MCP サーバー設定（Claude Code 標準）
├── CLAUDE.md              # Planner 用コンテキスト（@.skiv/CLAUDE.md をインポート）
└── .skiv/
    ├── CLAUDE.md          # skiv Planner 指示（skiv init で生成）
    └── worktrees/         # git worktree の作業ディレクトリ（自動管理）

skiv パッケージ本体:
├── src/
│   ├── cli.ts             # エントリポイント
│   ├── orchestrator.ts    # ポーリングループ
│   ├── agent.ts           # プロンプト生成・エージェント起動
│   ├── mcp.ts             # MCP 接続・タスク取得
│   ├── worktree.ts        # git worktree 管理
│   ├── logger.ts          # ログユーティリティ
│   ├── types.ts           # 型定義
│   └── commands/
│       ├── init.ts
│       ├── planner.ts
│       └── run.ts
└── templates/             # skiv init で配置するひな形
```

---

## 設定ファイル（skiv.config.json）

```json
{
  "roles": {
    "coder": {
      "prompt": "実装専門家として要件をコードで実装する",
      "pickFrom": "inbox",
      "claimStatus": "in_progress",
      "defaultOutcome": "review_requested"
    },
    "checker": {
      "prompt": "コードレビュアーとしてバグ・セキュリティ・可読性を確認する",
      "pickFrom": "review_requested",
      "claimStatus": "in_review",
      "outcomes": {
        "APPROVED": "done",
        "REJECTED": "inbox"
      },
      "defaultOutcome": "pending",
      "maxRetries": 3
    }
  },
  "agents": [
    { "name": "claude-coder", "tool": "claude", "role": "coder", "allowedTools": ["Read", "Edit", "Write", "Bash", "mcp__task_manager__*"] },
    { "name": "claude-checker", "tool": "claude", "role": "checker", "allowedTools": ["Read", "mcp__task_manager__*"] }
  ],
  "pollingInterval": 10
}
```

### ロール設定フィールド

| フィールド | 説明 |
|---|---|
| `prompt` | エージェントへの役割指示 |
| `pickFrom` | このロールが拾うタスクのステータス |
| `claimStatus` | タスクをクレームした時に設定するステータス |
| `defaultOutcome` | 完了時のデフォルト遷移先ステータス |
| `outcomes` | 出力キーワードとステータスのマッピング |
| `maxRetries` | 同一タスクへの最大コメント数（超過でスキップ） |

---

## ステータス遷移

```
inbox → in_progress → review_requested → in_review → done
                                                    ↘ inbox（REJECTED・再作業）
                                        ↘ pending（マージ失敗・要人手対応）
```

---

## task_manager MCP フィールド

| フィールド | 用途 |
|---|---|
| `assignee` | 作業中エージェントのロール名（完了時に null クリア） |
| `dependencies` | 依存タスク ID の配列（全て done になるまで着手しない） |
| `description` | エージェントに渡すプロンプト本文 |
| コメント | 作業結果の記録・エージェント間の非同期通信 |

### タスクグラフの例

```
Task A (role=coder,   deps=[])     ← 即座に起動
Task B (role=coder,   deps=[])     ← Task A と並列起動
Task C (role=checker, deps=[A, B]) ← A と B が done になってから起動
```

---

## git worktree 管理

- タスク着手時: `feature/<task_id>` ブランチを作成し `.skiv/worktrees/<task_id>` に展開
- エージェントはそのディレクトリで作業・コミット
- タスク完了（`done`）時: Orchestrator が自動マージ
  - 失敗時: タスクに失敗コメントを追記し `pending` に移動
- worktree は完了後に削除（ブランチは残る）

---

## AI ツールの非インタラクティブ起動

| ツール | コマンド |
|---|---|
| Claude Code | `claude --print --mcp-config .skiv/mcp.json --allowedTools <tools>` |
| Codex | `codex` （要確認） |
| Junie | `junie` （要確認） |

---

## 実装ロードマップ

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | Orchestrator 基本実装（Claude Code のみ） | ✅ 完了 |
| Phase 2 | git worktree による作業分離・自動マージ | ✅ 完了 |
| Phase 3 | npm パッケージ化・`skiv init` | ✅ 完了 |
| Phase 4 | Codex / Junie 対応 | 未着手 |

---

## 未決事項

- Codex / Junie の非インタラクティブ起動コマンドの確認
- 同一ロールの複数エージェントが同一タスクを取り合わないための排他制御の強化
