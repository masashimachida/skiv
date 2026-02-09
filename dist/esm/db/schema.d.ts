import { Generated } from "kysely";
export type DatabaseSchema = {
    issues: IssueTable;
    comments: CommentTable;
};
export declare const ISSUE_STATUSES: readonly ["open", "in_progress", "ready_for_review", "reviewing", "request_for_merge", "done", "error"];
export type IssueStatus = typeof ISSUE_STATUSES[number];
export declare function isIssueStatus(value: unknown): value is IssueStatus;
export declare const ISSUE_PRIORITIES: readonly ["low", "mid", "high"];
export type IssuePriority = typeof ISSUE_PRIORITIES[number];
export declare function isIssuePriority(value: unknown): value is IssuePriority;
export type IssueTable = {
    id: Generated<number>;
    status: IssueStatus;
    title: string;
    assignee: string | null;
    priority: IssuePriority | null;
    description: string | null;
    created_at: string;
    updated_at: string;
};
export type CommentTable = {
    id: Generated<number>;
    issue_id: number;
    by: string;
    message: string;
    at: string;
};
export type Issue = {
    id: number;
    status: IssueStatus;
    title: string;
    assignee: string | null;
    priority: IssuePriority | null;
    description: string | null;
    comments?: {
        id: number;
        issue_id: number;
        by: string;
        message: string;
        at: string;
    }[];
    created_at: string;
    updated_at: string;
};
//# sourceMappingURL=schema.d.ts.map