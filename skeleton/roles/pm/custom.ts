import {Issue} from "skiv/skiv/db/schema"
import AbstractWorker from "../../worker"

export default class CustomMember extends AbstractWorker {

  public async before(): Promise<boolean> {
    this.logger.debug('before()')
    const issue = await this.issueService.getNextIssue('request_for_merge', 'in_merge_process', this.NAME)
    if (issue) {
      this.logger.info(`found issue: #${issue.id} ${issue.title}`)
      await this.setup(issue)
      return true
    }

    return false
  }

  protected createPrompt(issue: Issue) {

    const comments = issue.comments?.map(comment => {
      return `- id: ${comment.id}
  by: ${comment.by}
  message: ${comment.message}
`
    }).join("\n") || ''

    this.PROMPT = `あなたの名前は \`${this.NAME}\` です。
あなたがレビューするタスクは以下の通りです。

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
      result: "MERGED" | "ERROR",
      branch: string,
      issue_title: string,
      reason?: string
    }>(response)

    if (res.result === "MERGED") {

      await this.issueService.updateStatus(this.ISSUE_ID, 'done')
      if (res.reason) {
        await this.issueService.comment(this.ISSUE_ID, this.NAME, res.reason)
      }
    } else {
      this.logger.error(res)
      await this.issueService.updateStatus(this.ISSUE_ID, 'error')
      await this.issueService.comment(this.ISSUE_ID, this.NAME, res.reason || "(no reason)")
      await this.cleanupWorktree()
      process.exit(1)
    }

    await this.cleanupWorktree()
  }
}