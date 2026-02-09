"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IssueService_1 = require("../IssueService");
const Command_1 = __importDefault(require("./Command"));
class IssueCommand extends Command_1.default {
    async create(title, priority, description) {
        this.initialize();
        const service = new IssueService_1.IssueService(this.db);
        const issue = await service.create(title, priority, description);
        console.log(`issue created: ${issue.id}`);
    }
    async list(status) {
        this.initialize();
        const service = new IssueService_1.IssueService(this.db);
        const issues = await service.listIssues(status);
        console.table(issues);
    }
    async assign(fromStatus, toStatus, assignee) {
        this.initialize();
        const service = new IssueService_1.IssueService(this.db);
        return service.getNextIssue(fromStatus, toStatus, assignee);
    }
    async comment(id, by, message) {
        this.initialize();
        const service = new IssueService_1.IssueService(this.db);
        const issue = await service.comment(id, by, message);
        console.log(`commented: ${issue.id}`);
    }
    async updateStatus(id, status) {
        this.initialize();
        const service = new IssueService_1.IssueService(this.db);
        const issue = await service.updateStatus(id, status);
        console.log(`updated status: ${issue.id} ${issue.status}`);
    }
}
exports.default = IssueCommand;
