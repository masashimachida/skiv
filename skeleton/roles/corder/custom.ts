import {Issue} from "skiv/skiv/db/schema"
import AbstractWorker from "../../worker"

export default class Custom extends AbstractWorker {

  public async before(): Promise<boolean> {
    this.logger.debug('before()')
    const assignedIssue = await this.issueService.getNextIssue('todo', 'in_progress', this.NAME)
    if (assignedIssue) {
      this.logger.info(`found issue: #${assignedIssue.id} ${assignedIssue.title}`)
      await this.setup(assignedIssue)
      return true
    }

    return false
  }

  protected createPrompt(issue: Issue): void {

    const comments = issue.comments?.map(comment => {
      return `- id: ${comment.id}
  by: ${comment.by}
  message: ${comment.message}
`
    }).join("\n") || ''

    this.PROMPT = `あなたの名前は${this.NAME}です。
あなたに割り当てられた課題は以下です。

id:
${issue.id}

タスク名:
${issue.title}

概要:
${issue.description}

コメント:
${comments}

このあとはCLAUDE.mdに沿って処理をしてください。`
  }

  public async after(response: string): Promise<void> {
    this.logger.debug('after()')

    if (!this.ISSUE_ID) {
      throw new Error('ISSUE_ID is not set')
    }
    const res = this.parseResponse<{
      result: "FINISH" | "ERROR",
      branch: string,
      issue_title: string,
      reason?: string
    }>(response)

    if (res.result === "FINISH") {

      try {
        await this.git
          .add('.')
          .commit(`feature: issue #${this.ISSUE_ID} ${res.issue_title}`)
        await this.issueService.updateStatus(this.ISSUE_ID, 'pending_review')
      } catch (e) {
        this.logger.error(e as string)
        process.exit(1)
      } finally {
        await this.cleanupWorktree()
      }

    } else {
      this.logger.error(res)
      await this.issueService.updateStatus(this.ISSUE_ID, 'failed')
      await this.cleanupWorktree()
      process.exit(1)
    }
  }
}