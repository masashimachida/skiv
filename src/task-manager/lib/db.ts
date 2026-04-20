import { DatabaseSync } from "node:sqlite";
import { homedir } from "os";
import { join } from "path";
import { mkdirSync } from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __db: DatabaseSync | undefined;
}

const dbPath = process.env.TASK_DB_PATH ?? join(homedir(), ".task-manager", "tasks.db");
const dbDir = join(dbPath, "..");

mkdirSync(dbDir, { recursive: true });

const db = global.__db ?? new DatabaseSync(dbPath);
global.__db = db;

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT    PRIMARY KEY,
  project_id  TEXT    NOT NULL,
  title       TEXT    NOT NULL CHECK (length(title) BETWEEN 1 AND 255),
  status      TEXT    NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox','in_progress','review_requested','in_review','done','cancel','pending')),
  description TEXT    CHECK (description IS NULL OR length(description) <= 10000),
  assignee    TEXT    CHECK (assignee IS NULL OR length(assignee) <= 64),
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
  PRIMARY KEY (task_id, depends_on_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author     TEXT NOT NULL CHECK (length(author) BETWEEN 1 AND 64),
  body       TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
`);

export default db;
