import {existsSync} from "fs";
import {Kysely, sql} from "kysely";
import {execSync} from "node:child_process";
import {join, dirname} from "path";
import {DatabaseSchema} from "./db/schema";

export const clearScreen = () => process.stdout.write('\x1Bc');

export function findProjectRoot(target: string = ".skiv"): string {

  let dir = process.cwd();

  while (true) {
    if (existsSync(join(dir, target))) return dir;

    const parent = dirname(dir);
    if (parent === dir) throw new Error("Project root not found");
    dir = parent;
  }
}

export function sendKeys(pane: number, command: string[]) {
  const cmd = command.map(c => c.replaceAll(/"/g, '\\"')).join(' ')
  execSync(`tmux send-keys -t ${pane} "${cmd}" Enter`)
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

export const sh = (cmd: string, cwd?: string) => {
  return execSync(cmd, {cwd, stdio: "pipe"}).toString().trim()
}

export async function executeImmediate<T>(
  db: Kysely<DatabaseSchema>,
  callback: (trx: Kysely<DatabaseSchema>) => Promise<T>
): Promise<T> {
  // 1. Kyselyのインスタンスから直接 SQL を発行して BEGIN IMMEDIATE を開始
  await sql`BEGIN IMMEDIATE`.execute(db);

  try {
    // 2. db インスタンスをそのまま callback に渡す
    // (Kyselyの transaction ではないので、ネストエラーは出ない)
    const result = await callback(db);

    await sql`COMMIT`.execute(db);
    return result;
  } catch (error) {
    await sql`ROLLBACK`.execute(db);
    throw error;
  }
}