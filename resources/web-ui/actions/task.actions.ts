"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "../lib/errors";
import * as repo from "../lib/task.repository";
import { Task, TaskWithComments, Status } from "../types/index";

type Ok<T> = { data: T; error: null };
type Err = { data: null; error: string };

function ok<T>(data: T): Ok<T> { return { data, error: null }; }
function err(e: unknown): Err {
  const msg = e instanceof Error ? e.message : String(e);
  return { data: null, error: msg };
}

export async function listProjectsAction(): Promise<Ok<string[]> | Err> {
  try {
    return ok(repo.listProjects());
  } catch (e) { return err(e); }
}

export async function listAllTasksAction(projectId: string): Promise<Ok<Task[]> | Err> {
  try {
    return ok(repo.listTasks(projectId));
  } catch (e) { return err(e); }
}

export async function getTaskDetailAction(projectId: string, taskId: string): Promise<Ok<TaskWithComments> | Err> {
  try {
    return ok(repo.getTaskById(projectId, taskId));
  } catch (e) { return err(e); }
}

export async function createTaskAction(projectId: string, input: {
  title: string;
  status?: Status;
  description?: string;
  assignee?: string;
  dependencies?: string[];
}): Promise<Ok<Task> | Err> {
  try {
    const task = repo.createTask(projectId, input);
    revalidatePath("/");
    return ok(task);
  } catch (e) { return err(e); }
}

export async function updateTaskStatusAction(
  projectId: string,
  taskId: string,
  status: Status
): Promise<Ok<Task> | Err> {
  try {
    const task = repo.updateTask(projectId, taskId, { status });
    revalidatePath("/");
    return ok(task);
  } catch (e) { return err(e); }
}

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  input: {
    title?: string;
    description?: string | null;
    assignee?: string | null;
    dependencies?: string[] | null;
  }
): Promise<Ok<Task> | Err> {
  try {
    const task = repo.updateTask(projectId, taskId, input);
    revalidatePath("/");
    return ok(task);
  } catch (e) { return err(e); }
}

export async function deleteTaskAction(projectId: string, taskId: string): Promise<Ok<{ success: true }> | Err> {
  try {
    repo.deleteTask(projectId, taskId);
    revalidatePath("/");
    return ok({ success: true });
  } catch (e) {
    if (e instanceof AppError && e.code === "DEPENDENCY_CONSTRAINT") {
      return { data: null, error: "他のタスクが依存しているため削除できません" };
    }
    return err(e);
  }
}
