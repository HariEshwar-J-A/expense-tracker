const knex = require('knex');
const path = require('path');
const BaseAdapter = require('./BaseAdapter');

/**
 * SQLiteAdapter - SQLite database adapter using better-sqlite3
 */
class SQLiteAdapter extends BaseAdapter {
    constructor(config = {}) {
        super(config);
        this.dbPath = config.dbPath || process.env.DB_PATH || path.join(__dirname, '../../data/expense_tracker.db');
    }

    /**
     * Connect to SQLite database
     */
    async connect() {
        if (this.connected) {
            console.log('SQLite already connected');
            return;
        }

        try {
            this.db = knex({
                client: 'better-sqlite3',
                connection: {
                    filename: this.dbPath
                },
                useNullAsDefault: true,
                migrations: {
                    directory: path.join(__dirname, '../migrations'),
                    tableName: 'knex_migrations'
                },
                seeds: {
                    directory: path.join(__dirname, '../seeds')
                },
                pool: {
                    afterCreate: (conn, cb) => {
                        // Enable foreign keys
                        conn.pragma('foreign_keys = ON');
                        cb();
                    }
                }
            });

            // Test connection
            await this.db.raw('SELECT 1');
            this.connected = true;

            console.log(`✅ SQLite connected: ${this.dbPath}`);
        } catch (error) {
            console.error('❌ SQLite connection failed:', error.message);
            throw error;
        }
    }

    /**
     * Disconnect from SQLite database
     */
    async disconnect() {
        if (!this.connected) {
            return;
        }

        try {
            await this.db.destroy();
            this.connected = false;
            console.log('✅ SQLite disconnected');
        } catch (error) {
            console.error('❌ SQLite disconnection failed:', error.message);
            throw error;
        }
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Function to execute within transaction
     * @returns {Promise<*>} Result of the transaction
     */
    async transaction(callback) {
        const db = this.getConnection();
        return await db.transaction(callback);
    }

    /**
     * Run migrations
     * @returns {Promise<void>}
     */
    async migrate() {
        const db = this.getConnection();
        try {
            const [batch, migrations] = await db.migrate.latest();
            if (migrations.length === 0) {
                console.log('✅ Database is up to date');
            } else {
                console.log(`✅ Ran ${migrations.length} migration(s) in batch ${batch}`);
                migrations.forEach(migration => {
                    console.log(`  - ${migration}`);
                });
            }
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    /**
     * Rollback last migration
     * @returns {Promise<void>}
     */
    async rollback() {
        const db = this.getConnection();
        try {
            const [batch, migrations] = await db.migrate.rollback();
            console.log(`✅ Rolled back batch ${batch}`);
            migrations.forEach(migration => {
                console.log(`  - ${migration}`);
            });
        } catch (error) {
            console.error('❌ Rollback failed:', error.message);
            throw error;
        }
    }
}

module.exports = SQLiteAdapter;
