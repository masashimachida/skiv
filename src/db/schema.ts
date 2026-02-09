import {Generated} from "kysely";

export type DatabaseSchema = {
  issues: IssueTable,
  comments: CommentTable
}

export const ISSUE_STATUSES = [
  "open",
  "in_progress",
  "ready_for_review",
  "reviewing",
  "request_for_merge",
  "done",
  "error",
] as const
export type IssueStatus = typeof ISSUE_STATUSES[number]
export function isIssueStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && ISSUE_STATUSES.includes(value as IssueStatus)
}

export const ISSUE_PRIORITIES = [
  "low",
  "mid",
  "high",
] as const
export type IssuePriority = typeof ISSUE_PRIORITIES[number]
export function isIssuePriority(value: unknown): value is IssuePriority {
  return typeof value === "string" && ISSUE_PRIORITIES.includes(value as IssuePriority)
}

export type IssueTable = {
  id: Generated<number>
  status: IssueStatus
  title: string
  assignee: string | null
  priority: IssuePriority | null
  description: string | null
  created_at: string
  updated_at: string
}

export type CommentTable = {
  id: Generated<number>
  issue_id: number
  by: string
  message: string
  at: string
}

export type Issue = {
  id: number
  status: IssueStatus
  title: string
  assignee: string | null
  priority: IssuePriority | null
  description: string | null
  comments?: {
    id: number
    issue_id: number
    by: string
    message: string
    at: string
  }[]
  created_at: string
  updated_at: string
}