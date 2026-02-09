"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const RunCommand_1 = __importDefault(require("./commands/RunCommand"));
const InitCommand_1 = __importDefault(require("./commands/InitCommand"));
const IssueCommand_1 = __importDefault(require("./commands/IssueCommand"));
const StartCommand_1 = __importDefault(require("./commands/StartCommand"));
const schema_1 = require("./db/schema");
commander_1.program
    .name('skiv')
    .description('Claude Code orchestration tool')
    .version('0.0.1');
// init
commander_1.program.command('init')
    .description('Initialize skiv')
    .action(async () => {
    const command = new InitCommand_1.default();
    await command.execute();
});
// start
commander_1.program.command('start')
    .description('run skiv')
    .action(async () => {
    const command = new StartCommand_1.default();
    await command.execute();
});
// run
commander_1.program.command('run')
    .description('run member')
    .argument('<name>', 'member name')
    .argument('[model]', 'model name', 'sonnet')
    .action(async (name, model) => {
    const command = new RunCommand_1.default();
    await command.execute(name, model);
});
// issue
const issue = commander_1.program.command('issue')
    .description('Issue manager');
// create
issue.command('create')
    .description('create a new issue')
    .argument('<title>', 'issue title')
    .addArgument(new commander_1.Argument('[priority]', 'issue priority')
    .choices(['low', 'mid', 'high'])
    .default('mid'))
    .argument('[description]', 'spec')
    .action(async (title, priority, description) => {
    const command = new IssueCommand_1.default();
    await command.create(title, priority, description);
});
// list
issue.command('list')
    .description('list issues')
    .addOption(new commander_1.Option('-s, --status <string>', 'filter by status')
    .choices(schema_1.ISSUE_STATUSES))
    .action(async (options) => {
    const command = new IssueCommand_1.default();
    await command.list(options.status);
});
// assign
issue.command('assign')
    .description('assign an issue')
    .argument('<fromStatus>', 'search from status')
    .argument('<toStatus>', 'change to status')
    .argument('<assignee>', 'assignee name')
    .action(async (fromStatus, toStatus, assignee) => {
    const command = new IssueCommand_1.default();
    await command.assign(fromStatus, toStatus, assignee);
});
// comment
issue.command('comment')
    .description('add a comment to an issue')
    .argument('<id>', 'issue id')
    .argument('<by>', 'author name')
    .argument('<message>', 'comment message')
    .action(async (id, by, message) => {
    const command = new IssueCommand_1.default();
    await command.comment(id, by, message);
});
// update status
issue.command('update_status')
    .description('update issue status')
    .argument('<id>', 'issue id')
    .addArgument(new commander_1.Argument('<status>', 'issue status')
    .choices(schema_1.ISSUE_STATUSES))
    .action(async (id, status) => {
    const command = new IssueCommand_1.default();
    await command.updateStatus(id, status);
});
// parse
commander_1.program.parse();
