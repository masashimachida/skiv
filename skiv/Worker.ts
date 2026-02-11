import {spawn, SpawnOptions} from "child_process"
import fs from "fs";
import path from "path";
import {SimpleGit, simpleGit} from "simple-git";
import {Database} from "./db";
import {IssueService} from "./IssueService"
import Logger, {type LogLevel} from "./Logger";
import {clearScreen, sleep} from "./utils"

export default class Worker {

  protected LOG_LEVEL: LogLevel = "INFO"

  protected issueService: IssueService
  protected logger: Logger
  protected rootGit: SimpleGit
  protected git: SimpleGit

  protected NAME: string
  protected WORKSPACE: string
  protected WORKTREE: string
  protected LOOP_INTERVAL_MSEC: number = 5000
  protected MODEL: string
  protected PROMPT: string

  constructor(db: Database, name: string, workspace: string, model: string) {

    clearScreen()
    this.NAME = name
    this.WORKSPACE = workspace
    this.WORKTREE = path.resolve(workspace, 'worktree')
    this.MODEL = model
    this.PROMPT = `あなたの名前は${this.NAME}です。CLAUDE.mdに沿って処理をしてください。`

    this.issueService = new IssueService(db)
    this.logger = new Logger(this.LOG_LEVEL)
    this.rootGit = simpleGit()

    if (!fs.existsSync(this.WORKTREE)) {
      fs.mkdirSync(this.WORKTREE, {recursive: true})
    }
    this.git = simpleGit(this.WORKTREE)

    if (!this.NAME) {
      throw new Error('arg 0 name required')
    }
  }

  public async loop() {
    while (true) {
      // clearScreen()
      this.logger.debug("LOOP START")

      const beforeValue = await this.before()
      if (beforeValue) {
        const response = await this.execute()
        await this.after(response)
      }

      this.logger.debug("LOOP END")
      await sleep(this.LOOP_INTERVAL_MSEC)
    }
  }

  public async before(): Promise<boolean> {
    return Promise.resolve(true)
  }

  public async execute(): Promise<string> {
    return this.spawn(
      "claude",
      [
        "--model", this.MODEL,
        "--dangerously-skip-permissions",
        "-p", `"${this.PROMPT}"`
      ],
      {
        stdio: ["inherit", "pipe", "pipe"],
      }
    )
  }

  public async after(response: string): Promise<void> {
  }

  protected async setupWorktree(branch: string, base: string = 'main'): Promise<void> {
    this.logger.debug(`setupWorktree(${branch})`)

    const branchExists = (await this.rootGit.branchLocal()).all.includes(branch)

    const args = ['worktree', 'add', this.WORKTREE]

    if (!branchExists) {
      args.push('-B', branch, base);
    } else {
      args.push(branch);
    }

    try {
      await this.rootGit.raw(args);
    } catch (error: unknown) {
      this.logger.error(`failed to setup worktree: ${error}`)
      process.exit(1)
    }
  }

  protected async cleanupWorktree(): Promise<void> {
    this.logger.debug(`cleanupWorktree()`)
    try {
      await this.rootGit.raw(['worktree', 'remove', '--force', this.WORKTREE]);
    } catch (e) {
      // pass
    }
    try {
      await this.rootGit.raw(['worktree', 'prune']);
      fs.rmSync(this.WORKTREE, {recursive: true, force: true})
    } catch (error: unknown) {
      this.logger.error(`failed to cleanup worktree: ${error}`)
      process.exit(1)
    }
  }

  protected async spawn(command: string, args: string[], options: SpawnOptions = {}): Promise<string> {

    return new Promise((resolve, reject) => {

      Logger.log(`💻 ${command} ${args.join(' ')}`)

      let stdout = ''
      const child = spawn(command, args, options)

      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
        this.logger.info(chunk.toString())
      })

      child.stderr?.on("data", (chunk) => {
        this.logger.error(chunk.toString())
      })

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      })

      child.on("error", (err) => {
        reject(err);
      })
    })
  }
}
