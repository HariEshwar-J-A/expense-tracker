/**
 * Migration: Create expenses table
 */
exports.up = function (knex) {
  return knex.schema.createTable("expenses", (table) => {
    // Primary key
    table.uuid("id").primary();

    // Foreign key to users
    table.uuid("user_id").notNullable();
    table.foreign("user_id").references("users.id").onDelete("CASCADE");

    // Expense details
    table.decimal("amount", 10, 2).notNullable();
    table.string("vendor", 255).notNullable();
    table.string("category", 50).notNullable();
    table.date("date").notNullable();
    table.string("receipt_url", 500);

    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Indexes for efficient queries
    table.index("user_id", "idx_expenses_user_id");
    table.index("date", "idx_expenses_date");
    table.index("category", "idx_expenses_category");
    table.index(["user_id", "date"], "idx_expenses_user_date");
  });
};

/**
 * Rollback: Drop expenses table
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("expenses");
};
