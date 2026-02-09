"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToLatest = exports.createDb = void 0;
const kysely_1 = require("kysely");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const migrations_1 = require("./migrations");
const createDb = (path) => {
    const db = new better_sqlite3_1.default(path);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    return new kysely_1.Kysely({
        dialect: new kysely_1.SqliteDialect({
            database: db,
        }),
    });
};
exports.createDb = createDb;
const migrateToLatest = async (db) => {
    const migrator = new kysely_1.Migrator({ db, provider: migrations_1.migrationProvider });
    const { error } = await migrator.migrateToLatest();
    if (error)
        throw error;
};
exports.migrateToLatest = migrateToLatest;
