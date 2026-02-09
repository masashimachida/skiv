import path from "path"
import fs from "fs-extra"
import Command from "./Command"

export default class InitCommand extends Command {
  public async execute() {
    const cwd = process.cwd()
    const dest = path.join(cwd, this.DIR_NAME)
    const skeleton = path.resolve(__dirname, "../../../skeleton")

    if (fs.existsSync(dest)) {
      console.error(`Error: Directory ${dest} already exists.`)
      return
    }

    try {
      await fs.copy(skeleton, dest)
      console.log(`Initialized skiv in ${dest}`)
    } catch (err) {
      console.error("Failed to initialize:", err)
    }
  }
}
