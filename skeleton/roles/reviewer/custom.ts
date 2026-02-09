import {Issue} from "../../../../skiv/src/db/schema";
import Member from "../../../src/Member";

export default class CustomMember extends Member {

  public async before(): Promise<boolean> {
    const readyForReviewIssue = await this.issueService.getReviewIssue()

    if (!readyForReviewIssue) {
      console.log('no issue for review')
      return false
    }

    // if (readyForReviewIssue.status !== 'ready_for_review') {
    //   console.log('issue is not ready for review')
    //   return false
    // }

    console.log(`[NEW ISSUE]
Title: ${readyForReviewIssue.title}
Description: ${readyForReviewIssue.description}
`)

    this.createPrompt(readyForReviewIssue)
    return true
  }

  private createPrompt(issue: Issue) {

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
}