/**
 * Migration: Create users table
 */
exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    // Primary key
    table.uuid("id").primary();

    // User credentials
    table.string("email", 255).unique().notNullable();
    table.string("password", 255).notNullable();

    // User profile
    table.string("first_name", 100);
    table.string("last_name", 100);

    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Indexes
    table.index("email", "idx_users_email");
  });
};

/**
 * Rollback: Drop users table
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};
