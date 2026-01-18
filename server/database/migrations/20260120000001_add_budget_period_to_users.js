/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable("users", (table) => {
        table.string("budget_period", 20).defaultTo("monthly"); // 'monthly' or 'yearly'
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("budget_period");
    });
};
