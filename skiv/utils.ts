import {Kysely, sql} from "kysely";
import {execSync} from "child_process";
import {DatabaseSchema} from "./db/schema";

export const clearScreen = () => process.stdout.write('\x1Bc');

export function sendKeys(pane: number, command: string[]) {
  const cmd = command.map(c => c.replaceAll(/"/g, '\\"')).join(' ')
  execSync(`tmux send-keys -t ${pane} " ${cmd}" Enter`)
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
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