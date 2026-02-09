const migrations = {};
export const migrationProvider = {
    async getMigrations() {
        return migrations;
    },
};
migrations['001'] = {
    async up(db) {
        await db.schema
            .createTable('issues')
            .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
            .addColumn('status', 'varchar(255)', (col) => col.notNull())
            .addColumn('title', 'varchar(255)', (col) => col.notNull())
            .addColumn('assignee', 'varchar(255)')
            .addColumn('priority', 'varchar(255)')
            .addColumn('description', 'text')
            .addColumn('created_at', 'timestamptz', (col) => col.notNull())
            .addColumn('updated_at', 'timestamptz', (col) => col.notNull())
            .execute();
        await db.schema
            .createTable('comments')
            .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
            .addColumn('issue_id', 'integer', (col) => col.notNull().references('issues.id').onDelete('cascade'))
            .addColumn('by', 'varchar(255)', (col) => col.notNull())
            .addColumn('message', 'text', (col) => col.notNull())
            .addColumn('at', 'timestamptz', (col) => col.notNull())
            .execute();
    },
    async down(db) {
        await db.schema.dropTable('issues').execute();
        await db.schema.dropTable('comments').execute();
    },
};
