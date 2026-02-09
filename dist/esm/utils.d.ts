import { Kysely } from "kysely";
import { DatabaseSchema } from "./db/schema";
export declare const clearScreen: () => boolean;
export declare function sendKeys(pane: number, command: string[]): void;
export declare function sleep(ms: number): Promise<unknown>;
export declare function executeImmediate<T>(db: Kysely<DatabaseSchema>, callback: (trx: Kysely<DatabaseSchema>) => Promise<T>): Promise<T>;
//# sourceMappingURL=utils.d.ts.map