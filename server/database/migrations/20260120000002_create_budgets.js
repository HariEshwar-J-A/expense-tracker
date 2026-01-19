/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("budgets", (table) => {
        table.increments("id").primary();
        table
            .integer("user_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("category").notNullable();
        table.decimal("amount", 10, 2).notNullable();
        table.timestamps(true, true);

        // CRITICAL: Prevent duplicate budgets for same category per user
        table.unique(["user_id", "category"]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("budgets");
};
