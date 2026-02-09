import fs, { existsSync } from "fs";
import path, { dirname, join } from "path";
import { load } from 'js-yaml';
import { createDb } from "../db";
export default class Command {
    DIR_NAME = ".skiv";
    CONFIG_FILE_NAME = "config.yaml";
    DB_FILE_NAME = "data.db";
    config;
    db;
    initialize() {
        const rootDir = this.getRootDir();
        const yamlPath = path.resolve(rootDir, this.CONFIG_FILE_NAME);
        const yaml = fs.readFileSync(yamlPath, 'utf-8');
        this.config = load(yaml);
        const dbPath = join(rootDir, this.DB_FILE_NAME);
        this.db = createDb(dbPath);
    }
    getRootDir() {
        let dir = process.cwd();
        while (true) {
            if (existsSync(join(dir, this.DIR_NAME)))
                return `${dir}/${this.DIR_NAME}`;
            const parent = dirname(dir);
            if (parent === dir)
                throw new Error("root not found");
            dir = parent;
        }
    }
}
