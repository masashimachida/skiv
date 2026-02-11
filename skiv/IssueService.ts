import {Database} from "./db";
import {isIssuePriority, isIssueStatus, Issue, ISSUE_PRIORITIES, IssueStatus} from "./db/schema";
import {executeImmediate} from "./utils";

/**
 * Provides services and operations for managing issues in the system.
 */
export class IssueService {

  constructor(private db: Database) {
  }

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
  public async create(title: string, priority: string = "mid", description: string | null = null): Promise<Issue> {
    if (!title) {
      throw new Error("title required")
    }

    if (!isIssuePriority(priority)) {
      throw new Error(`Invalid priority: ${priority} (valid values: ${ISSUE_PRIORITIES.join(", ")})`)
    }

    const row = await this.db
      .insertInto('issues')
      .values({
        status: "todo",
        title,
        assignee: null,
        priority,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning('id')
      .executeTakeFirst()

    if (!row) {
      throw new Error("Failed to create issue")
    }

    const issue = await this.findById(row.id)
    if (!issue) {
      throw new Error("Failed to retrieve newly created issue")
    }

    return issue
  }

  /**
   * Retrieves a list of issues filtered by their status.
   *
   * @param {string | undefined} status - The status to filter issues by. If undefined, retrieves all issues regardless of status.
   * @return {Promise<Partial<Issue>[]>} A promise resolving to a list of issues matching the specified status.
   */
  public async listIssues(status?: IssueStatus): Promise<Partial<Issue>[]> {
    if (status !== undefined && !isIssueStatus(status)) {
      throw new Error(`Invalid status: ${status}`)
    }
    let query = this.db
      .selectFrom('issues')
      .selectAll()
    if (status) {
      query = query.where('status', '=', status)
    }
    return query
      .orderBy('created_at', 'asc')
      .execute()
  }

  /**
   * Retrieves the first assigned issue for a given assignee where the issue status is 'in_progress'.
   * If no assigned issue is found, it attempts to assign the next available issue.
   *
   * @param {string} assignee - The username or identifier of the assignee whose issue needs to be fetched.
   * @param {IssueStatus} status - The status of the issue to be fetched. Defaults to 'in_progress'.
   * @return {Promise<Issue | null>} A promise that resolves to the assigned issue if found, or null if no matching issue is found.
   */
  public async getAssignedIssue(assignee: string, status: IssueStatus): Promise<Issue | null> {
    const row = await this.db.selectFrom('issues')
      .select(['id'])
      .where('status', '=', status)
      .where('assignee', '=', assignee)
      .orderBy('id', 'asc')
      .executeTakeFirst()

    if (!row) return null

    return this.findById(row.id)
  }

  /**
   * Retrieves the next available issue based on the current status and assigns it to the specified assignee.
   * Updates the status and assignee of the issue upon retrieval.
   *
   * @param {IssueStatus} fromStatus - The current status of the issue to be retrieved.
   * @param {IssueStatus} toStatus - The status to update the issue to after retrieval.
   * @param {string} assignee - The identifier of the assignee for the issue.
   * @return {Promise<Issue | null>} A promise that resolves to the next issue object or null if no such issue exists.
   */
  public async getNextIssue(fromStatus: IssueStatus, toStatus: IssueStatus, assignee: string): Promise<Issue | null> {

    const id = await executeImmediate(this.db, async (trx) => {

      let query = trx
        .selectFrom('issues')
        .selectAll()
        .where('status', '=', fromStatus)
      // .where('assignee', 'is', null)

      query = query.orderBy('created_at', 'asc')

      const nextIssue = await query.executeTakeFirst()

      if (!nextIssue) return null

      await trx.updateTable('issues')
        .set({
          status: toStatus,
          assignee: assignee,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', nextIssue.id)
        .execute()

      return nextIssue.id
    })

    if (!id) return null
    return this.findById(id)
  }

  /**
   * Adds a comment to the specified issue.
   *
   * @param {number} issueId - The unique identifier of the issue to comment on.
   * @param {string} by - The username or identifier of the person making the comment.
   * @param {string} message - The content of the comment.
   * @return {Promise<Issue>} A promise that resolves to the updated issue object with the new comment included.
   */
  public async comment(issueId: number, by: string, message: string): Promise<Issue> {
    const issue = await this.findById(issueId)
    if (!issue) {
      throw new Error(`Issue #${issueId} not found`)
    }

    await this.db
      .insertInto('comments')
      .values({
        issue_id: issue.id,
        by,
        message,
        at: new Date().toISOString()
      })
      .execute()

    const returnIssue = await this.findById(issueId)
    if (!returnIssue) {
      throw new Error(`Failed to retrieve issue #${issueId} after commenting`)
    }

    return returnIssue
  }

  /**
   * Updates the status of an issue.
   *
   * @param {number} issueId - The ID of the issue to be updated.
   * @param {IssueStatus} status - The new status to assign to the issue.
   * @returns {Promise<Issue>} The updated issue.
   * @throws {Error} If the issue is not found.
   */
  async updateStatus(issueId: number, status: IssueStatus): Promise<Issue> {
    const issue = await this.findById(issueId)
    if (!issue) {
      throw new Error(`Issue #${issueId} not found`)
    }

    await this.db
      .updateTable('issues')
      .set({
        status,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', issueId)
      .execute()

    const returnIssue = await this.findById(issueId)
    if (!returnIssue) {
      throw new Error(`Failed to retrieve issue #${issueId} after updating status`)
    }

    return returnIssue
  }

  /**
   * Updates the assignee of a specific issue by its ID.
   *
   * @param {number} issueId - The unique identifier of the issue to update.
   * @param {string | null} assignee - The new assignee for the issue. Pass null to unassign.
   * @return {Promise<Issue>} A promise that resolves to the updated issue object.
   * @throws {Error} If the issue with the given ID does not exist or cannot be retrieved after the update.
   */
  async updateAssignee(issueId: number, assignee: string | null): Promise<Issue> {
    const issue = await this.findById(issueId)
    if (!issue) {
      throw new Error(`Issue #${issueId} not found`)
    }

    await this.db
      .updateTable('issues')
      .set({
        assignee,
        updated_at: new Date().toISOString()
      })
      .where('id', '=', issueId)
      .execute()

    const returnIssue = await this.findById(issueId)
    if (!returnIssue) {
      throw new Error(`Failed to retrieve issue #${issueId} after updating assignee`)
    }

    return returnIssue
  }

  /**
   * Finds an issue by its unique identifier.
   *
   * @param {number} id - The unique identifier of the issue to retrieve.
   * @return {Promise<Issue | null>} A promise that resolves to the issue with its associated comments if found, or null if no issue is found with the given identifier.
   */
  private async findById(id: number): Promise<Issue | null> {
    const row = await this.db.selectFrom('issues')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    if (!row) return null

    const comments = await this.db.selectFrom('comments')
      .selectAll()
      .where('issue_id', '=', id)
      .orderBy('at', 'asc')
      .execute()

    return {...row, comments}
  }
}
