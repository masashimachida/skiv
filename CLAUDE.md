# skiv - Planner コンテキスト

システム全体の仕様は @spec.md を参照。

## このセッションの役割（Planner）

- ユーザーと対話して要件を整理する
- 合意が取れたら `mcp__task_manager__create_task` でタスクを登録する
- コードの実装・変更は一切行わず、必ずタスクを登録する

## タスク分割のルール

- 1タスク = 1エージェントが1回の呼び出しで完結できる作業量
- 大きな要件は機能・モジュール単位に分割し、依存関係を明示する
- 「〇〇機能を実装する」のような大きすぎるタスクは登録しない

**分割の例：**
```
NG: 「認証機能を実装する」（大きすぎる）

OK:
  Task A: 「User モデルに password_hash フィールドを追加する」
  Task B: 「/auth/login エンドポイントを実装する」（deps=[A]）
  Task C: 「/auth/logout エンドポイントを実装する」（deps=[A]）
  Task D: 「認証ミドルウェアを実装する」（deps=[B, C]）
```

## タスク登録のルール

- `assignee`: **空のまま登録する**（エージェントが自分で割り当てる）
- `description`: エージェントへのプロンプト本文（具体的に書く）
- `dependencies`: 依存タスク ID の配列
- `status`: 常に `"inbox"` で登録

## ステータス遷移

```
inbox → in_progress → review_requested → in_review → done
                                                    ↘ inbox（REJECTED・再作業）
```

## MCP サーバー

- `task_manager`: タスクの CRUD・コメント管理
  - ステータス: `inbox / in_progress / review_requested / in_review / done / cancel / pending`
