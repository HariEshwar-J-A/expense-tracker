const { getAdapter } = require('../connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Expense Model - Data access layer for expenses
 */
class Expense {
    /**
     * Create a new expense
     * @param {string} userId - User ID
     * @param {Object} expenseData - Expense data
     * @returns {Promise<Object>} Created expense
     */
    static async create(userId, expenseData) {
        const expense = {
            id: uuidv4(),
            user_id: userId,
            amount: parseFloat(expenseData.amount),
            vendor: expenseData.vendor,
            category: expenseData.category,
            date: expenseData.date,
            receipt_url: expenseData.receiptUrl || null,
            created_at: new Date(),
            updated_at: new Date()
        };

        const adapter = getAdapter();
        await adapter.create('expenses', expense);

        return this.toApiFormat(expense);
    }

    /**
     * Find expense by ID (with user ownership check)
     * @param {string} id - Expense ID
     * @param {string} userId - User ID (for ownership check)
     * @returns {Promise<Object|null>} Expense or null
     */
    static async findById(id, userId) {
        const adapter = getAdapter();
        const expense = await adapter.findOne('expenses', { id, user_id: userId });
        return expense ? this.toApiFormat(expense) : null;
    }

    /**
     * Get user's expenses with pagination and filters
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} {data: [], pagination: {}}
     */
    static async findByUserId(userId, options = {}) {
        const {
            page = 1,
            limit = 10,
            category,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy = 'date',
            order = 'desc'
        } = options;

        const adapter = getAdapter();
        const db = adapter.getConnection();

        // Build query with filters
        let query = db('expenses').where({ user_id: userId });

        // Apply filters
        if (category) {
            query = query.where('category', category);
        }

        if (startDate) {
            query = query.where('date', '>=', startDate);
        }

        if (endDate) {
            query = query.where('date', '<=', endDate);
        }

        if (minAmount) {
            query = query.where('amount', '>=', parseFloat(minAmount));
        }

        if (maxAmount) {
            query = query.where('amount', '<=', parseFloat(maxAmount));
        }

        // Get total count (before pagination)
        const countQuery = query.clone();
        const [{ count }] = await countQuery.count('* as count');
        const total = parseInt(count);

        // Apply sorting
        const validSortColumns = ['date', 'amount', 'vendor', 'category', 'created_at'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'date';
        const sortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

        query = query.orderBy(sortColumn, sortOrder);

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.limit(limit).offset(offset);

        // Execute query
        const expenses = await query;

        return {
            data: expenses.map(exp => this.toApiFormat(exp)),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update expense (with user ownership check)
     * @param {string} id - Expense ID
     * @param {string} userId - User ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated expense
     */
    static async update(id, userId, updates) {
        const adapter = getAdapter();

        // First check if expense exists and belongs to user
        const existing = await adapter.findOne('expenses', { id, user_id: userId });
        if (!existing) {
            throw new Error('Expense not found');
        }

        const updateData = {};
        if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount);
        if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.date !== undefined) updateData.date = updates.date;
        if (updates.receiptUrl !== undefined) updateData.receipt_url = updates.receiptUrl;

        const expense = await adapter.update('expenses', id, updateData);
        return this.toApiFormat(expense);
    }

    /**
     * Delete expense (with user ownership check)
     * @param {string} id - Expense ID
     * @param {string} userId - User ID
     * @returns {Promise<number>} Number of deleted records
     */
    static async delete(id, userId) {
        const adapter = getAdapter();
        const db = adapter.getConnection();

        // Delete only if belongs to user
        return await db('expenses')
            .where({ id, user_id: userId })
            .del();
    }

    /**
     * Get expense statistics for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Statistics
     */
    static async getStats(userId) {
        const adapter = getAdapter();
        const db = adapter.getConnection();

        // Total expenses
        const [totalResult] = await db('expenses')
            .where({ user_id: userId })
            .sum('amount as total')
            .count('* as count');

        // By category
        const byCategory = await db('expenses')
            .where({ user_id: userId })
            .select('category')
            .sum('amount as total')
            .count('* as count')
            .groupBy('category')
            .orderBy('total', 'desc');

        // Recent expenses (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [recentResult] = await db('expenses')
            .where({ user_id: userId })
            .where('date', '>=', sevenDaysAgo.toISOString().split('T')[0])
            .sum('amount as total')
            .count('* as count');

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await db('expenses')
            .where({ user_id: userId })
            .where('date', '>=', sixMonthsAgo.toISOString().split('T')[0])
            .select(db.raw(`strftime('%Y-%m', date) as month`))
            .sum('amount as total')
            .count('* as count')
            .groupBy('month')
            .orderBy('month', 'asc');

        // Top vendor (by total spending)
        const topVendorResult = await db('expenses')
            .where({ user_id: userId })
            .select('vendor')
            .sum('amount as total')
            .groupBy('vendor')
            .orderBy('total', 'desc')
            .limit(1);

        const topVendor = topVendorResult.length > 0
            ? {
                vendor: topVendorResult[0].vendor,
                total: parseFloat(topVendorResult[0].total).toFixed(2)
            }
            : {
                vendor: 'N/A',
                total: '0.00'
            };

        return {
            total: {
                amount: parseFloat(totalResult.total || 0).toFixed(2),
                count: parseInt(totalResult.count || 0)
            },
            byCategory: byCategory.map(cat => ({
                category: cat.category,
                total: parseFloat(cat.total).toFixed(2),
                count: parseInt(cat.count)
            })),
            recent: {
                amount: parseFloat(recentResult.total || 0).toFixed(2),
                count: parseInt(recentResult.count || 0)
            },
            monthlyTrend: monthlyTrend.map(month => ({
                month: month.month,
                total: parseFloat(month.total).toFixed(2),
                count: parseInt(month.count)
            })),
            topVendor: topVendor
        };
    }

    /**
     * Convert database format (snake_case) to API format (camelCase)
     * @param {Object} expense - Expense in snake_case
     * @returns {Object} Expense in camelCase
     */
    static toApiFormat(expense) {
        if (!expense) return null;

        return {
            id: expense.id,
            userId: expense.user_id,
            amount: parseFloat(expense.amount),
            vendor: expense.vendor,
            category: expense.category,
            date: expense.date,
            receiptUrl: expense.receipt_url,
            createdAt: expense.created_at,
            updatedAt: expense.updated_at
        };
    }

    /**
     * Convert API format (camelCase) to database format (snake_case)
     * @param {Object} data - Data in camelCase
     * @returns {Object} Data in snake_case
     */
    static toDbFormat(data) {
        const dbData = {};

        if (data.id) dbData.id = data.id;
        if (data.userId) dbData.user_id = data.userId;
        if (data.amount) dbData.amount = data.amount;
        if (data.vendor) dbData.vendor = data.vendor;
        if (data.category) dbData.category = data.category;
        if (data.date) dbData.date = data.date;
        if (data.receiptUrl !== undefined) dbData.receipt_url = data.receiptUrl;
        if (data.createdAt) dbData.created_at = data.createdAt;
        if (data.updatedAt) dbData.updated_at = data.updatedAt;

        return dbData;
    }
}

module.exports = Expense;
