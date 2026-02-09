import { Kysely } from 'kysely';
import { DatabaseSchema } from './schema';
export declare const createDb: (path: string) => Database;
export declare const migrateToLatest: (db: Database) => Promise<void>;
export type Database = Kysely<DatabaseSchema>;
//# sourceMappingURL=index.d.ts.map