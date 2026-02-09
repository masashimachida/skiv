import { IssueStatus } from "../db/schema";
import Command from "./Command";
export default class IssueCommand extends Command {
    create(title: string, priority?: string, description?: string): Promise<void>;
    list(status?: IssueStatus): Promise<void>;
    assign(fromStatus: IssueStatus, toStatus: IssueStatus, assignee: string): Promise<import("../db/schema").Issue | null>;
    comment(id: number, by: string, message: string): Promise<void>;
    updateStatus(id: number, status: IssueStatus): Promise<void>;
}
//# sourceMappingURL=IssueCommand.d.ts.map