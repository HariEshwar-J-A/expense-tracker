const SQLiteAdapter = require("./adapters/SQLiteAdapter");
const PostgresAdapter = require("./adapters/PostgresAdapter");

let adapterInstance = null;

/**
 * Get the database adapter based on environment configuration
 * Uses singleton pattern to ensure only one instance exists
 * @returns {BaseAdapter} Database adapter instance
 */
function getAdapter() {
  if (adapterInstance) {
    return adapterInstance;
  }

  const dbType = (process.env.DB_TYPE || "sqlite").toLowerCase();



  switch (dbType) {
    case "sqlite":
      adapterInstance = new SQLiteAdapter();
      break;

    case "postgres":
    case "postgresql":
      adapterInstance = new PostgresAdapter();
      break;

    default:
      console.warn(
        `⚠️  Unknown database type: ${dbType}. Defaulting to SQLite.`,
      );
      adapterInstance = new SQLiteAdapter();
  }

  return adapterInstance;
}

/**
 * Initialize database connection
 * @returns {Promise<BaseAdapter>} Connected adapter instance
 */
async function initializeDatabase() {
  const adapter = getAdapter();

  if (!adapter.connected) {
    await adapter.connect();
  }

  return adapter;
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  if (adapterInstance && adapterInstance.connected) {
    await adapterInstance.disconnect();
    adapterInstance = null;
  }
}

/**
 * Get the underlying Knex connection
 * Useful for complex queries and migrations
 * @returns {Knex} Knex instance
 */
function getKnex() {
  const adapter = getAdapter();
  return adapter.getConnection();
}

module.exports = {
  getAdapter,
  initializeDatabase,
  closeDatabase,
  getKnex,
};
