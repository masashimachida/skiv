import fs from "fs"
import {execSync} from "child_process"
import path from "path"
import {migrateToLatest} from "../db"
import {sendKeys} from "../utils"
import Command from "./Command"

export default class StartCommand extends Command {

  /**
   * Executes the primary workflow, including initializing resources, migrating the database to the latest schema,
   * setting up the tmux grid, and configuring individual workspaces for team members.
   *
   * @return {Promise<void>} A promise that resolves when the execution of the workflow is completed.
   */
  public async execute(): Promise<void> {
    this.initialize()
    await migrateToLatest(this.db)

    const dir = this.getRootDir()

    const memberCount = this.config.members?.length || 0
    const model = this.config.model || 'sonnet'

    this.setupTmuxGrid(1 + memberCount)

    const seWorkspace = this.createWorkspace(dir, `SE`, `se`)
    sendKeys(0, ["cd", seWorkspace])
    sendKeys(0, ["claude", "--model", model])

    for (const member of this.config.members) {
      const index = this.config.members.indexOf(member)
      const pane = index + 1
      const workspace = this.createWorkspace(dir, member.name, member.role)
      sendKeys(pane, ["cd", workspace])
      sendKeys(pane, ["npx", "skiv", "run", member.name, model])
    }
  }

  /**
   * Creates a new workspace by copying role-specific files to the workspace directory.
   *
   * @param {string} rootDir - The root directory of the project.
   * @param {string} name - The name of the workspace to be created.
   * @param {string} role - The role associated with the workspace, used to determine the base template.
   * @return {string} The path to the created workspace directory.
   */
  private createWorkspace(rootDir: string, name: string, role: string): string {
    const workspaceDir = path.join(rootDir, 'workspaces', name)
    const roleDir = path.join(rootDir, 'roles', role)

    if (fs.existsSync(workspaceDir)) return workspaceDir

    execSync(`cp -Rp ${roleDir} ${workspaceDir}`)

    return workspaceDir
  }

  /**
   * Sets up a tmux grid layout by splitting the tmux window vertically multiple times,
   * arranging the panes in a main-horizontal layout, and adjusting the main pane's height.
   *
   * @param {number} paneCount - The total number of panes to create in the tmux grid.
   * @return {void} No return value.
   */
  private setupTmuxGrid(paneCount: number): void {
    for (let i = 1; i < paneCount; i++) {
      execSync('tmux split-window -f -v')
    }

    execSync('tmux select-layout main-horizontal')
    execSync('tmux set-window-option main-pane-height 40%')
    execSync('tmux select-pane -t 0')
  }
}
