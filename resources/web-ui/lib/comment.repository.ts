import { v4 as uuidv4 } from "uuid";
import db from "./db";
import { AppError } from "./errors";
import { Comment, CommentRow, mapCommentRow } from "../types/index";

export function createComment(projectId: string, input: {
  taskId: string;
  author: string;
  body: string;
}): Comment {
  const task = db.prepare("SELECT id FROM tasks WHERE id = ? AND project_id = ?").get(input.taskId, projectId);
  if (!task) throw new AppError("TASK_NOT_FOUND", `Task not found: ${input.taskId}`);

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO comments (id, task_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.taskId, input.author, input.body, now);

  const row = db.prepare("SELECT * FROM comments WHERE id = ?").get(id) as CommentRow;
  return mapCommentRow(row);
}

export function listCommentsByTaskId(projectId: string, taskId: string): Comment[] {
  const task = db.prepare("SELECT id FROM tasks WHERE id = ? AND project_id = ?").get(taskId, projectId);
  if (!task) throw new AppError("TASK_NOT_FOUND", `Task not found: ${taskId}`);

  const rows = db
    .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC")
    .all(taskId) as CommentRow[];
  return rows.map(mapCommentRow);
}
