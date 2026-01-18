const knex = require("knex");
const path = require("path");
const BaseAdapter = require("./BaseAdapter");

/**
 * PostgresAdapter - PostgreSQL database adapter
 */
class PostgresAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.config = {
      host: config.host || process.env.DB_HOST || "localhost",
      port: config.port || process.env.DB_PORT || 5432,
      database: config.database || process.env.DB_NAME || "expense_tracker",
      user: config.user || process.env.DB_USER || "postgres",
      password: config.password || process.env.DB_PASSWORD || "",
    };
  }

  /**
   * Connect to PostgreSQL database
   */
  async connect() {
    if (this.connected) {
      console.log("PostgreSQL already connected");
      return;
    }

    try {
      this.db = knex({
        client: "pg",
        connection: this.config,
        migrations: {
          directory: path.join(__dirname, "../migrations"),
          tableName: "knex_migrations",
        },
        seeds: {
          directory: path.join(__dirname, "../seeds"),
        },
        pool: {
          min: 2,
          max: 10,
          afterCreate: (conn, done) => {
            // Set timezone to UTC
            conn.query('SET timezone="UTC";', (err) => {
              done(err, conn);
            });
          },
        },
        acquireConnectionTimeout: 10000,
      });

      // Test connection
      await this.db.raw("SELECT 1");
      this.connected = true;

      console.log(
        `✅ PostgreSQL connected: ${this.config.host}:${this.config.port}/${this.config.database}`,
      );
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error.message);
      throw error;
    }
  }

  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      await this.db.destroy();
      this.connected = false;
      console.log("✅ PostgreSQL disconnected");
    } catch (error) {
      console.error("❌ PostgreSQL disconnection failed:", error.message);
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
        console.log("✅ Database is up to date");
      } else {
        console.log(
          `✅ Ran ${migrations.length} migration(s) in batch ${batch}`,
        );
        migrations.forEach((migration) => {
          console.log(`  - ${migration}`);
        });
      }
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
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
      migrations.forEach((migration) => {
        console.log(`  - ${migration}`);
      });
    } catch (error) {
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  }
}

module.exports = PostgresAdapter;
