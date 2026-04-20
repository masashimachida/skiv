import { v4 as uuidv4 } from "uuid";
import db from "./db";
import { AppError } from "./errors";
import { Task, TaskWithComments, TaskRow, CommentRow, mapTaskRow, mapCommentRow } from "../types/index";

function getDependencyIds(taskId: string): string[] {
  const rows = db
    .prepare("SELECT depends_on_id FROM task_dependencies WHERE task_id = ?")
    .all(taskId) as { depends_on_id: string }[];
  return rows.map((r) => r.depends_on_id);
}

function checkDependenciesExist(projectId: string, ids: string[]): void {
  for (const id of ids) {
    const row = db.prepare("SELECT id FROM tasks WHERE id = ? AND project_id = ?").get(id, projectId);
    if (!row) throw new AppError("DEPENDENCY_NOT_FOUND", `Task not found: ${id}`);
  }
}

function checkCircularDependency(taskId: string, newDependencies: string[]): void {
  for (const depId of newDependencies) {
    if (depId === taskId) {
      throw new AppError("CIRCULAR_DEPENDENCY", `Task ${taskId} cannot depend on itself`);
    }
    const row = db
      .prepare(
        `WITH RECURSIVE chain(id) AS (
          SELECT depends_on_id FROM task_dependencies WHERE task_id = ?
          UNION ALL
          SELECT td.depends_on_id FROM task_dependencies td
          JOIN chain c ON td.task_id = c.id
        )
        SELECT 1 FROM chain WHERE id = ? LIMIT 1`
      )
      .get(depId, taskId);
    if (row) {
      throw new AppError("CIRCULAR_DEPENDENCY", `Adding dependency ${depId} would create a cycle`);
    }
  }
}

export function createTask(projectId: string, input: {
  title: string;
  status?: string;
  description?: string;
  dependencies?: string[];
  assignee?: string;
}): Task {
  const id = uuidv4();
  const now = new Date().toISOString();
  const status = input.status ?? "inbox";
  const deps = input.dependencies ?? [];

  checkDependenciesExist(projectId, deps);

  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO tasks (id, project_id, title, status, description, assignee, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, projectId, input.title, status, input.description ?? null, input.assignee ?? null, now, now);
    for (const depId of deps) {
      db.prepare("INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)").run(id, depId);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
  return mapTaskRow(row, deps);
}

export function getTaskById(projectId: string, id: string): TaskWithComments {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?").get(id, projectId) as TaskRow | undefined;
  if (!row) throw new AppError("TASK_NOT_FOUND", `Task not found: ${id}`);

  const commentRows = db
    .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC")
    .all(id) as CommentRow[];

  return {
    ...mapTaskRow(row, getDependencyIds(id)),
    comments: commentRows.map(mapCommentRow),
  };
}

export function listTasks(projectId: string, filters: { status?: string | string[]; assignee?: string } = {}): Task[] {
  const conditions: string[] = ["project_id = ?"];
  const params: unknown[] = [projectId];

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    conditions.push(`status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  }
  if (filters.assignee) {
    conditions.push("assignee = ?");
    params.push(filters.assignee);
  }

  const rows = db.prepare(`SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY created_at ASC`).all(...params) as TaskRow[];
  return rows.map((row) => mapTaskRow(row, getDependencyIds(row.id)));
}

export function listProjects(): string[] {
  const rows = db.prepare("SELECT DISTINCT project_id FROM tasks ORDER BY project_id ASC").all() as { project_id: string }[];
  return rows.map((r) => r.project_id);
}

export function updateTask(projectId: string, id: string, input: {
  title?: string;
  status?: string;
  description?: string | null;
  dependencies?: string[] | null;
  assignee?: string | null;
}): Task {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?").get(id, projectId) as TaskRow | undefined;
  if (!row) throw new AppError("TASK_NOT_FOUND", `Task not found: ${id}`);

  if (input.dependencies != null) {
    checkDependenciesExist(projectId, input.dependencies);
    checkCircularDependency(id, input.dependencies);
  }

  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    const fields: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title); }
    if (input.status !== undefined) { fields.push("status = ?"); values.push(input.status); }
    if ("description" in input) { fields.push("description = ?"); values.push(input.description ?? null); }
    if ("assignee" in input) { fields.push("assignee = ?"); values.push(input.assignee ?? null); }

    db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND project_id = ?`).run(...values, id, projectId);

    if (input.dependencies !== undefined) {
      db.prepare("DELETE FROM task_dependencies WHERE task_id = ?").run(id);
      for (const depId of input.dependencies ?? []) {
        db.prepare("INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)").run(id, depId);
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
  const deps = input.dependencies !== undefined ? (input.dependencies ?? []) : getDependencyIds(id);
  return mapTaskRow(updated, deps);
}

export function deleteTask(projectId: string, id: string): void {
  const row = db.prepare("SELECT id FROM tasks WHERE id = ? AND project_id = ?").get(id, projectId);
  if (!row) throw new AppError("TASK_NOT_FOUND", `Task not found: ${id}`);

  try {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  } catch (err) {
    if (err instanceof Error && err.message.includes("FOREIGN KEY constraint failed")) {
      throw new AppError("DEPENDENCY_CONSTRAINT", `Task ${id} is a dependency of other tasks`);
    }
    throw err;
  }
}
