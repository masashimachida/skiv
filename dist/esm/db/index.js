import { Kysely, Migrator, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';
import { migrationProvider } from './migrations';
export const createDb = (path) => {
    const db = new SQLite(path);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    return new Kysely({
        dialect: new SqliteDialect({
            database: db,
        }),
    });
};
export const migrateToLatest = async (db) => {
    const migrator = new Migrator({ db, provider: migrationProvider });
    const { error } = await migrator.migrateToLatest();
    if (error)
        throw error;
};
