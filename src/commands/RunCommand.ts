import fs from "fs"
import path from "path"
import Member from "../Member"
import Command from "./Command"

export default class RunCommand extends Command {
  public async execute(name: string, model: string) {
    this.initialize()

    const dir = this.getRootDir()
    const workspaceDir = path.resolve(dir, 'workspaces', name)

    const customMemberPath = path.join(workspaceDir, 'custom.ts')

    const actor = fs.existsSync(customMemberPath)
      ? new ((await import(customMemberPath)).default as typeof Member)(this.db, name, workspaceDir, model)
      : new Member(this.db, name, workspaceDir, model)

    actor.loop()
      .catch(e => console.error(e))
      .then(() => process.exit(0))
  }
}