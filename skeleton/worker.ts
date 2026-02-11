import {Issue} from "skiv/skiv/db/schema";
import Worker from "skiv/skiv/Worker";

export default abstract class AbstractWorker extends Worker {

  protected ISSUE_ID: number | null = null

  protected async setup(issue: Issue) {
    this.ISSUE_ID = issue.id
    await this.cleanupWorktree()
    await this.setupWorktree(`issues/issue-${issue.id}`)
    this.createPrompt(issue)
  }

  protected abstract createPrompt(issue: Issue): void

  protected parseResponse<T>(response: string): T {
    const matches = response.match(/\{[\s\S]*\}/)
    const jsonStr = matches ? matches[0] : response

    const parsed = JSON.parse(jsonStr) as T

    this.logger.debug('----------------------')
    this.logger.debug(parsed as unknown as object)
    this.logger.debug('----------------------')

    return parsed
  }
}
