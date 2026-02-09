import fs, {existsSync} from "fs"
import path, {dirname, join} from "path"
import {load} from 'js-yaml'
import {createDb, Database} from "../db"

interface ConfigInterface {
  model: string
  members: {
    name: string
    role: string
  }[]
}

export default abstract class Command {

  protected DIR_NAME: string = ".skiv"
  protected CONFIG_FILE_NAME: string = "config.yaml"
  protected DB_FILE_NAME: string = "data.db"

  protected config!: ConfigInterface
  protected db!: Database

  protected initialize(): any {
    const rootDir = this.getRootDir()
    const yamlPath = path.resolve(rootDir, this.CONFIG_FILE_NAME)
    const yaml = fs.readFileSync(yamlPath, 'utf-8')
    this.config = load(yaml) as ConfigInterface

    const dbPath = join(rootDir, this.DB_FILE_NAME)
    this.db = createDb(dbPath)
  }

  protected getRootDir(): string {

    let dir = process.cwd()

    while (true) {
      if (existsSync(join(dir, this.DIR_NAME))) return `${dir}/${this.DIR_NAME}`

      const parent = dirname(dir)
      if (parent === dir) throw new Error("root not found")
      dir = parent
    }
  }
}
