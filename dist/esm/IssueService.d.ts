import { Database } from "./db";
import { Issue, IssueStatus } from "./db/schema";
/**
 * Provides services and operations for managing issues in the system.
 */
export declare class IssueService {
    private db;
    constructor(db: Database);
    /**
     * Creates a new issue with the given title, priority, and optional description.
     *
     * @param {string} title - The title of the issue to be created. This parameter is required.
     * @param {string} [priority="mid"] - The priority level of the issue. Defaults to "mid" if not provided.
     * @param {string | null} description - A description of the issue. Defaults to null if not provided.
     * @return {Promise<Issue>} A promise that resolves to the created Issue object.
     * @throws {Error} If the title is not provided.
     * @throws {Error} If the provided priority value is invalid.
     * @throws {Error} If the issue creation fails.
     */
    create(title: string, priority?: string, description?: string | null): Promise<Issue>;
    /**
     * Retrieves a list of issues filtered by their status.
     *
     * @param {string | undefined} status - The status to filter issues by. If undefined, retrieves all issues regardless of status.
     * @return {Promise<Partial<Issue>[]>} A promise resolving to a list of issues matching the specified status.
     */
    listIssues(status?: IssueStatus): Promise<Partial<Issue>[]>;
    /**
     * Retrieves the first assigned issue for a given assignee where the issue status is 'in_progress'.
     * If no assigned issue is found, it attempts to assign the next available issue.
     *
     * @param {string} assignee - The username or identifier of the assignee whose issue needs to be fetched.
     * @param {IssueStatus} status - The status of the issue to be fetched. Defaults to 'in_progress'.
     * @return {Promise<Issue | null>} A promise that resolves to the assigned issue if found, or null if no matching issue is found.
     */
    getAssignedIssue(assignee: string, status: IssueStatus): Promise<Issue | null>;
    getNextIssue(fromStatus: IssueStatus, toStatus: IssueStatus, assignee: string): Promise<Issue | null>;
    /**
     * Adds a comment to the specified issue.
     *
     * @param {number} issueId - The unique identifier of the issue to comment on.
     * @param {string} by - The username or identifier of the person making the comment.
     * @param {string} message - The content of the comment.
     * @return {Promise<Issue>} A promise that resolves to the updated issue object with the new comment included.
     */
    comment(issueId: number, by: string, message: string): Promise<Issue>;
    /**
     * Updates the status of an issue.
     *
     * @param {number} issueId - The ID of the issue to be updated.
     * @param {IssueStatus} status - The new status to assign to the issue.
     * @returns {Promise<Issue>} The updated issue.
     * @throws {Error} If the issue is not found.
     */
    updateStatus(issueId: number, status: IssueStatus): Promise<Issue>;
    updateAssignee(issueId: number, assignee: string): Promise<Issue>;
    /**
     * Finds an issue by its unique identifier.
     *
     * @param {number} id - The unique identifier of the issue to retrieve.
     * @return {Promise<Issue | null>} A promise that resolves to the issue with its associated comments if found, or null if no issue is found with the given identifier.
     */
    private findById;
}
//# sourceMappingURL=IssueService.d.ts.map