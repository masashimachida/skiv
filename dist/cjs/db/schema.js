"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ISSUE_PRIORITIES = exports.ISSUE_STATUSES = void 0;
exports.isIssueStatus = isIssueStatus;
exports.isIssuePriority = isIssuePriority;
exports.ISSUE_STATUSES = [
    "open",
    "in_progress",
    "ready_for_review",
    "reviewing",
    "request_for_merge",
    "done",
    "error",
];
function isIssueStatus(value) {
    return typeof value === "string" && exports.ISSUE_STATUSES.includes(value);
}
exports.ISSUE_PRIORITIES = [
    "low",
    "mid",
    "high",
];
function isIssuePriority(value) {
    return typeof value === "string" && exports.ISSUE_PRIORITIES.includes(value);
}
