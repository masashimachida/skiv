import { z } from "zod";

export const StatusEnum = z.enum([
  "inbox",
  "in_progress",
  "review_requested",
  "in_review",
  "done",
  "cancel",
  "pending",
]);

export type Status = z.infer<typeof StatusEnum>;

export const STATUSES: Status[] = [
  "inbox",
  "in_progress",
  "review_requested",
  "in_review",
  "done",
  "cancel",
  "pending",
];

export const STATUS_LABELS: Record<Status, string> = {
  inbox: "Inbox",
  in_progress: "In Progress",
  review_requested: "Review Requested",
  in_review: "In Review",
  done: "Done",
  cancel: "Cancel",
  pending: "Pending",
};

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: Status;
  description: string | null;
  dependencies: string[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithComments extends Task {
  comments: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  description: string | null;
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  task_id: string;
  author: string;
  body: string;
  created_at: string;
}

export function mapTaskRow(row: TaskRow, dependencies: string[]): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status as Status,
    description: row.description,
    dependencies,
    assignee: row.assignee,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    taskId: row.task_id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  };
}
