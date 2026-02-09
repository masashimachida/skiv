import {IssueStatus} from "../db/schema";
import {IssueService} from "../service/IssueService";
import Command from "./Command";

export default class IssueCommand extends Command {

  async create(title: string, priority?: string, description?: string) {
    this.initialize()
    const service = new IssueService(this.db)
    const issue = await service.create(title, priority, description)
    console.log(`issue created: ${issue.id}`)
  }

  async list(status?: IssueStatus) {
    this.initialize()
    const service = new IssueService(this.db)
    const issues = await service.listIssues(status)
    console.table(issues)
  }

  async assign(id: number, assignee: string) {
    this.initialize()
    const service = new IssueService(this.db)
    return service.assignIssue(id, assignee)
  }

  async comment(id: number, by: string, message: string) {
    this.initialize()
    const service = new IssueService(this.db)
    const issue = await service.comment(id, by, message)
    console.log(`commented: ${issue.id}`)
  }

  async updateStatus(id: number, status: IssueStatus) {
    this.initialize()
    const service = new IssueService(this.db)
    const issue = await service.updateStatus(id, status)
    console.log(`updated status: ${issue.id} ${issue.status}`)
  }
}
