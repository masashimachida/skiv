import {program, Argument, Option} from 'commander'
import RunCommand from "./commands/RunCommand";
import InitCommand from "./commands/InitCommand";
import IssueCommand from "./commands/IssueCommand";
import StartCommand from "./commands/StartCommand";
import {ISSUE_STATUSES, IssueStatus} from './db/schema'

program
  .name('skiv')
  .description('Claude Code orchestration tool')
  .version('0.0.1')

// init
program.command('init')
  .description('Initialize skiv')
  .action(async () => {
    const command = new InitCommand()
    await command.execute()
  })

// start
program.command('start')
  .description('run skiv')
  .action(async () => {
    const command = new StartCommand()
    await command.execute()
  })

// run
program.command('run')
  .description('run member')
  .argument('<name>', 'member name')
  .argument('[model]', 'model name', 'sonnet')
  .action(async (name: string, model: string) => {
    const command = new RunCommand()
    await command.execute(name, model)
  })

// issue
const issue = program.command('issue')
  .description('Issue manager')

// create
issue.command('create')
  .description('create a new issue')
  .argument('<title>', 'issue title')
  .addArgument(
    new Argument('[priority]', 'issue priority')
      .choices(['low', 'mid', 'high'])
      .default('mid')
  )
  .argument('[description]', 'spec')
  .action(async (title: string, priority?: string, description?: string) => {
    const command = new IssueCommand()
    await command.create(title, priority, description)
  })

// list
issue.command('list')
  .description('list issues')
  .addOption(
    new Option('-s, --status <string>', 'filter by status')
      .choices(ISSUE_STATUSES)
  )
  .action(async (options: { status?: IssueStatus }) => {
    const command = new IssueCommand()
    await command.list(options.status)
  })

// assign
issue.command('assign')
  .description('assign an issue')
  .argument('<fromStatus>', 'search from status')
  .argument('<toStatus>', 'change to status')
  .argument('<assignee>', 'assignee name')
  .action(async (fromStatus: IssueStatus, toStatus: IssueStatus, assignee: string) => {
    const command = new IssueCommand()
    await command.assign(fromStatus, toStatus, assignee)
  })

// comment
issue.command('comment')
  .description('add a comment to an issue')
  .argument('<id>', 'issue id')
  .argument('<by>', 'author name')
  .argument('<message>', 'comment message')
  .action(async (id: number, by: string, message: string) => {
    const command = new IssueCommand()
    await command.comment(id, by, message)
  })

// update status
issue.command('update_status')
  .description('update issue status')
  .argument('<id>', 'issue id')
  .addArgument(
    new Argument('<status>', 'issue status')
      .choices(ISSUE_STATUSES)
  )
  .action(async (id: number, status: IssueStatus) => {
    const command = new IssueCommand()
    await command.updateStatus(id, status)
  })


// parse
program.parse()
