const { getKnex } = require("../connection");

const Budget = {
    /**
     * Find all budgets for a user
     * @param {number} userId
     */
    findAllByUser: async (userId) => {
        const knex = getKnex();
        return knex("budgets").where({ user_id: userId }).select("*");
    },

    /**
     * Create or Update a budget limit
     * @param {number} userId
     * @param {string} category
     * @param {number} amount
     */
    upsert: async (userId, category, amount) => {
        // SQLite upsert syntax via Knex
        const knex = getKnex();
        return knex("budgets")
            .insert({
                user_id: userId,
                category,
                amount,
            })
            .onConflict(["user_id", "category"]) // Target the unique constraint
            .merge({
                // Update these fields if conflict exists
                amount: amount,
                updated_at: knex.fn.now(),
            });
    },

    /**
     * Delete a budget limit
     * @param {number} userId
     * @param {string} category
     */
    delete: async (userId, category) => {
        const knex = getKnex();
        return knex("budgets")
            .where({ user_id: userId, category })
            .del();
    },
};

module.exports = Budget;
