const { getAdapter } = require("../connection");

/**
 * BudgetHistory Model - Track monthly budget changes over time
 */
class BudgetHistory {
    /**
     * Record a budget change
     * @param {string} userId - User ID
     * @param {number} amount - New budget amount
     * @param {Date|string} effectiveDate - When this budget takes effect
     * @param {string|null} reason - Optional reason for change
     * @returns {Promise<Object>} Created history record
     */
    static async recordChange(userId, amount, effectiveDate, reason = null) {
        const adapter = getAdapter();

        const record = {
            user_id: userId,
            amount: parseFloat(amount),
            effective_date: effectiveDate instanceof Date
                ? effectiveDate.toISOString().split('T')[0]
                : effectiveDate,
            reason: reason || null,
            created_at: new Date(),
        };

        const result = await adapter.create("budget_history", record);
        return result;
    }

    /**
     * Get all budget history for a user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum records to return
     * @returns {Promise<Array>} Budget history records
     */
    static async getHistory(userId, limit = 12) {
        const adapter = getAdapter();
        const records = await adapter.findMany(
            "budget_history",
            { user_id: userId },
            {
                limit,
                orderBy: [{ column: "effective_date", direction: "desc" }],
            }
        );

        return records.map(this.format);
    }

    /**
     * Get budget that was effective on a specific date
     * @param {string} userId - User ID
     * @param {Date|string} date - Date to check
     * @returns {Promise<Object|null>} Budget record effective on that date
     */
    static async getBudgetAtDate(userId, date) {
        const adapter = getAdapter();
        const dateStr = date instanceof Date
            ? date.toISOString().split('T')[0]
            : date;

        // Find the most recent budget on or before the given date
        const db = adapter.db;
        const record = await db("budget_history")
            .where("user_id", userId)
            .where("effective_date", "<=", dateStr)
            .orderBy("effective_date", "desc")
            .first();

        return record ? this.format(record) : null;
    }

    /**
     * Get budget trend (last N months)
     * @param {string} userId - User ID
     * @param {number} months - Number of months to include
     * @returns {Promise<Array>} Trend data
     */
    static async getTrend(userId, months = 6) {
        const adapter = getAdapter();
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const db = adapter.db;
        const records = await db("budget_history")
            .where("user_id", userId)
            .where("effective_date", ">=", cutoffStr)
            .orderBy("effective_date", "asc");

        return records.map(this.format);
    }

    /**
   * Update a budget history record
   * @param {number} id - Record ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated record
   */
    static async update(id, updates) {
        const adapter = getAdapter();
        const db = adapter.db;

        const updateData = {};
        if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
        if (updates.effectiveDate !== undefined) {
            updateData.effective_date = updates.effectiveDate instanceof Date
                ? updates.effectiveDate.toISOString().split('T')[0]
                : updates.effectiveDate;
        }
        if (updates.reason !== undefined) updateData.reason = updates.reason || null;

        await db("budget_history").where({ id }).update(updateData);
        const record = await db("budget_history").where({ id }).first();
        return this.format(record);
    }

    /**
     * Delete a budget history record
     * @param {number} id - Record ID
     * @returns {Promise<number>} Number of deleted records
     */
    static async delete(id) {
        const adapter = getAdapter();
        return await adapter.delete("budget_history", id);
    }

    /**
     * Format database record to API response
     * @param {Object} record - Database record
     * @returns {Object} Formatted record
     */
    static format(record) {
        return {
            id: record.id,
            userId: record.user_id,
            amount: parseFloat(record.amount),
            effectiveDate: record.effective_date,
            reason: record.reason,
            createdAt: record.created_at,
        };
    }
}

module.exports = BudgetHistory;
