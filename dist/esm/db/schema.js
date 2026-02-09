export const ISSUE_STATUSES = [
    "open",
    "in_progress",
    "ready_for_review",
    "reviewing",
    "request_for_merge",
    "done",
    "error",
];
export function isIssueStatus(value) {
    return typeof value === "string" && ISSUE_STATUSES.includes(value);
}
export const ISSUE_PRIORITIES = [
    "low",
    "mid",
    "high",
];
export function isIssuePriority(value) {
    return typeof value === "string" && ISSUE_PRIORITIES.includes(value);
}
