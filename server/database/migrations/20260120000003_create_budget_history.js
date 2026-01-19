/**
 * Migration: Create budget_history table
 * 
 * Tracks changes to user's monthly budget over time
 * Enables income trend analysis and accurate historical comparisons
 */

exports.up = function (knex) {
    return knex.schema.createTable('budget_history', (table) => {
        table.increments('id').primary();
        table.string('user_id').notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.date('effective_date').notNullable();
        table.string('reason', 100); // Optional: "Raise", "Bonus", "Job Change", etc.
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Foreign key
        table.foreign('user_id').references('users.id').onDelete('CASCADE');

        // Index for fast queries
        table.index(['user_id', 'effective_date']);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('budget_history');
};
