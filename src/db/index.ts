import {Kysely, Migrator, SqliteDialect} from 'kysely'
import SQLite from 'better-sqlite3'
import {DatabaseSchema} from './schema'
import {migrationProvider} from './migrations'

export const createDb = (path: string): Database => {

  const db = new SQLite(path);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: db,
    }),
  })
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({db, provider: migrationProvider})
  const {error} = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>