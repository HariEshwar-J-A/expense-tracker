const path = require("path");

module.exports = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: path.join(__dirname, "../data/expense_tracker.db"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, "migrations"),
      tableName: "knex_migrations",
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma("foreign_keys = ON");
        cb();
      },
    },
  },

  test: {
    client: "better-sqlite3",
    connection: {
      filename: ":memory:",
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, "migrations"),
      tableName: "knex_migrations",
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma("foreign_keys = ON");
        cb();
      },
    },
  },

  production: {
    client: process.env.DB_TYPE === "postgres" ? "pg" : "better-sqlite3",
    connection: process.env.DB_TYPE === "postgres" ? {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "expense_tracker",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
    } : {
      filename: process.env.DB_PATH || path.join(__dirname, "../data/expense_tracker.db"),
    },
    useNullAsDefault: true,
    pool: process.env.DB_TYPE === "postgres" ? {
      min: 2,
      max: 10,
    } : {
      afterCreate: (conn, cb) => {
        conn.pragma("foreign_keys = ON");
        cb();
      },
    },
    migrations: {
      directory: path.join(__dirname, "migrations"),
      tableName: "knex_migrations",
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
  },

  // Allow environment-based selection
  get sqlite() {
    return this.development;
  },

  get postgres() {
    return this.production;
  },
};
