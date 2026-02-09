import {Issue} from "../../../../skiv/src/db/schema";
import Member from "../../../src/Member";

export default class CustomMember extends Member {

  public async before(): Promise<boolean> {
    const assignedIssue = await this.issueService.getAssignedIssue(this.NAME, 'open')
    if (assignedIssue) {

      console.log(`[NEW ISSUE]
Title: ${assignedIssue.title}
Description: ${assignedIssue.description}
`)

      this.createPrompt(assignedIssue)
      return true
    }

    const assign = await this.issueService.assignNextIssue(this.NAME)
    if (assign) {

      console.log(`[NEW ISSUE]
Title: ${assign.title}
Description: ${assign.description}
`)

      this.createPrompt(assign)
      return true
    }

    console.log('no issue')

    return false
  }

  private createPrompt(issue: Issue) {

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
}