import {spawn, SpawnOptions} from "child_process"
import {Database} from "./db";
import {IssueService} from "./service/IssueService"
import Logger, {type LogLevel} from "./Logger";
import {sleep} from "./utils"

export default class Member {

  protected LOG_LEVEL: LogLevel = "INFO"

  protected issueService: IssueService
  protected logger: Logger;

  protected NAME: string
  protected WORKSPACE: string
  protected LOOP_INTERVAL_MSEC: number = 5000
  protected MODEL: string
  protected PROMPT: string

  constructor(db: Database, name: string, workspace: string, model: string) {
    this.issueService = new IssueService(db)
    this.logger = new Logger(this.LOG_LEVEL)

    this.NAME = name
    this.WORKSPACE = workspace
    this.MODEL = model
    this.PROMPT = `あなたの名前は${this.NAME}です。CLAUDE.mdに沿って処理をしてください。`

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
        "--permission-mode", "acceptEdits",
        "-p", `"${this.PROMPT}"`
      ],
      {
        stdio: ["inherit", "pipe", "pipe"],
      }
    )
  }

  public async after(response: string): Promise<void> {
  }

  protected async spawn(
    command: string,
    args: string[],
    options: SpawnOptions = {}
  ): Promise<string> {

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
