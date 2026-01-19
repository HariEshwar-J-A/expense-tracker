const { getAdapter } = require("../connection");
const { v4: uuidv4 } = require("uuid");

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
      updated_at: new Date(),
    };

    const adapter = getAdapter();
    await adapter.create("expenses", expense);

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
    const expense = await adapter.findOne("expenses", { id, user_id: userId });
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
      sortBy = "date",
      order = "desc",
    } = options;

    const adapter = getAdapter();
    const db = adapter.getConnection();

    // Build query with filters
    let query = db("expenses").where({ user_id: userId });

    // Apply filters
    if (category) {
      query = query.where("category", category);
    }

    if (startDate) {
      query = query.where("date", ">=", startDate);
    }

    if (endDate) {
      query = query.where("date", "<=", endDate);
    }

    if (minAmount) {
      query = query.where("amount", ">=", parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.where("amount", "<=", parseFloat(maxAmount));
    }

    // Get total count (before pagination)
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count("* as count");
    const total = parseInt(count);

    // Apply sorting
    const validSortColumns = [
      "date",
      "amount",
      "vendor",
      "category",
      "created_at",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "date";
    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    query = query.orderBy(sortColumn, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    // Execute query
    const expenses = await query;

    return {
      data: expenses.map((exp) => this.toApiFormat(exp)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    const existing = await adapter.findOne("expenses", { id, user_id: userId });
    if (!existing) {
      throw new Error("Expense not found");
    }

    const updateData = {};
    if (updates.amount !== undefined)
      updateData.amount = parseFloat(updates.amount);
    if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.receiptUrl !== undefined)
      updateData.receipt_url = updates.receiptUrl;

    const expense = await adapter.update("expenses", id, updateData);
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
    return await db("expenses").where({ id, user_id: userId }).del();
  }

  /**
   * Get expense statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Statistics
   */
  static async getStats(userId, period = 'monthly', customStartDate = null, customEndDate = null) {
    const adapter = getAdapter();
    const db = adapter.getConnection();

    // Determine Date Range
    let startDateStr, endDateStr;

    if (customStartDate && customEndDate) {
      // Use provided range (Frontend controls time travel)
      startDateStr = customStartDate;
      endDateStr = customEndDate;
    } else {
      // Fallback: Default relative logic
      const now = new Date();
      let startDate;
      if (period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      startDateStr = startDate.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      endDateStr = tomorrow.toISOString().split('T')[0];
    }

    // Total expenses (Filtered by Period)
    const [totalResult] = await db("expenses")
      .where({ user_id: userId })
      .where("date", ">=", startDateStr)
      .where("date", "<=", endDateStr)
      .sum("amount as total")
      .count("* as count");

    // By category (Filtered by Period)
    const byCategory = await db("expenses")
      .where({ user_id: userId })
      .where("date", ">=", startDateStr)
      .where("date", "<=", endDateStr)
      .select("category")
      .sum("amount as total")
      .count("* as count")
      .groupBy("category")
      .orderBy("total", "desc");

    // Recent expenses (Last 7 days - kept relative to today)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentResult] = await db("expenses")
      .where({ user_id: userId })
      .where("date", ">=", sevenDaysAgo.toISOString().split("T")[0])
      .sum("amount as total")
      .count("* as count");

    // Trend: Daily for Monthly view, Monthly for Yearly view
    let trend;

    if (period === 'yearly') {
      // Group by Month (YYYY-MM)
      trend = await db("expenses")
        .where({ user_id: userId })
        .where("date", ">=", startDateStr)
        .where("date", "<=", endDateStr)
        .select(db.raw(`strftime('%Y-%m', date) as label`))
        .sum("amount as total")
        .groupBy("label")
        .orderBy("label", "asc");
    } else {
      // Group by Week (Custom logic for "Monthly View")
      // 1. Fetch all raw daily data first
      const dailyData = await db("expenses")
        .where({ user_id: userId })
        .where("date", ">=", startDateStr)
        .where("date", "<=", endDateStr)
        .select("date")
        .sum("amount as total")
        .groupBy("date")
        .orderBy("date", "asc");

      // 2. Helper to format date as "MMM DD"
      const formatDate = (dateObj) => {
        return dateObj.toLocaleString('en-US', { month: 'short', day: '2-digit' });
      };

      // 3. Bucket into weeks (1-7, 8-14, 15-21, 22-28, 29-End)
      // Extract Year/Month from startDateStr (YYYY-MM-DD) explicitly
      const [startYear, startMonthVal, startDayVal] = startDateStr.split('-').map(Number);
      const year = startYear;
      const month = startMonthVal - 1; // JS Month is 0-indexed
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

      // Define 7-day chunks
      const ranges = [
        { start: 1, end: 7 },
        { start: 8, end: 14 },
        { start: 15, end: 21 },
        { start: 22, end: 28 },
        { start: 29, end: lastDayOfMonth }
      ];

      trend = ranges.map(r => {
        if (r.start > lastDayOfMonth) return null; // Skip if month is shorter (e.g. Feb 30)

        // Ensure end doesn't exceed month length
        const currentEnd = Math.min(r.end, lastDayOfMonth);

        // Create Label "Jan 01 - Jan 07"
        const sDate = new Date(year, month, r.start);
        const eDate = new Date(year, month, currentEnd);
        const label = `${formatDate(sDate)} - ${formatDate(eDate)}`;

        // Sum totals for days in this range
        let weekTotal = 0;
        dailyData.forEach(d => {
          const dDate = new Date(d.date);
          const dayNum = dDate.getDate();
          if (dDate.getMonth() === month && dayNum >= r.start && dayNum <= currentEnd) {
            weekTotal += parseFloat(d.total);
          }
        });

        return {
          label: label,
          total: weekTotal
        };
      }).filter(Boolean); // Remove nulls
    }

    // Top vendor (Filtered by Period)
    const topVendorResult = await db("expenses")
      .where({ user_id: userId })
      .where("date", ">=", startDateStr)
      .where("date", "<=", endDateStr)
      .select("vendor")
      .sum("amount as total")
      .groupBy("vendor")
      .orderBy("total", "desc")
      .limit(1);

    const topVendor =
      topVendorResult.length > 0
        ? {
          vendor: topVendorResult[0].vendor,
          total: parseFloat(topVendorResult[0].total).toFixed(2),
        }
        : {
          vendor: "N/A",
          total: "0.00",
        };

    return {
      period,
      total: {
        amount: parseFloat(totalResult.total || 0).toFixed(2),
        count: parseInt(totalResult.count || 0),
      },
      byCategory: byCategory.map((cat) => ({
        category: cat.category,
        total: parseFloat(cat.total).toFixed(2),
        count: parseInt(cat.count),
      })),
      recent: {
        amount: parseFloat(recentResult.total || 0).toFixed(2),
        count: parseInt(recentResult.count || 0),
      },
      trend: trend.map((t) => ({
        label: t.label,
        total: parseFloat(t.total).toFixed(2),
      })),
      topVendor: topVendor,
    };
  }

  /**
   * Check for duplicate expenses
   * @param {string} userId - User ID
   * @param {Object} criteria - Search criteria {amount, date, vendor}
   * @returns {Promise<Object|null>} Found duplicate or null
   */
  static async findDuplicate(userId, { amount, date, vendor }) {
    const adapter = getAdapter();
    const db = adapter.getConnection();

    // Basic duplicate check logic
    // We look for same amount AND same date AND similar vendor
    const query = db("expenses")
      .where({
        user_id: userId,
        amount: parseFloat(amount),
        date: date,
      })
      .where("vendor", "like", `%${vendor}%`) // Simple fuzzy match
      .first();

    const duplicate = await query;
    return duplicate ? this.toApiFormat(duplicate) : null;
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
      updatedAt: expense.updated_at,
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
