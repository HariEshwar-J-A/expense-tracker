const { getAdapter } = require("../connection");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

/**
 * User Model - Data access layer for users
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain text password
   * @param {string} userData.firstName - First name
   * @param {string} userData.lastName - Last name
   * @returns {Promise<Object>} Created user (without password)
   */
  static async create(userData) {
    const { email, password, firstName, lastName } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      first_name: firstName || null,
      last_name: lastName || null,
      monthly_budget: userData.monthlyBudget || 0,
      budget_period: userData.budgetPeriod || "monthly",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const adapter = getAdapter();
    await adapter.create("users", user);

    return this.sanitize(user);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  static async findByEmail(email) {
    const adapter = getAdapter();
    const user = await adapter.findOne("users", {
      email: email.toLowerCase().trim(),
    });
    return user;
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  static async findById(id) {
    const adapter = getAdapter();
    const user = await adapter.findOne("users", { id });
    return user ? this.sanitize(user) : null;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, updates) {
    const adapter = getAdapter();

    const updateData = {};
    if (updates.firstName !== undefined)
      updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.monthlyBudget !== undefined)
      updateData.monthly_budget = updates.monthlyBudget;
    if (updates.budgetPeriod !== undefined)
      updateData.budget_period = updates.budgetPeriod;
    if (updates.email !== undefined)
      updateData.email = updates.email.toLowerCase().trim();

    // If password is being updated, hash it
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await adapter.update("users", id, updateData);
    return this.sanitize(user);
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<number>} Number of deleted records
   */
  static async delete(id) {
    const adapter = getAdapter();
    return await adapter.delete("users", id);
  }

  /**
   * Verify password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Whether password matches
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Whether email exists
   */
  static async emailExists(email) {
    const user = await this.findByEmail(email);
    return !!user;
  }

  /**
   * Get all users (admin only - for reference)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of users
   */
  static async getAll(options = {}) {
    const adapter = getAdapter();
    const users = await adapter.findMany(
      "users",
      {},
      {
        limit: options.limit || 100,
        offset: options.offset || 0,
        orderBy: [{ column: "created_at", direction: "desc" }],
      },
    );
    return users.map((user) => this.sanitize(user));
  }

  /**
   * Remove password from user object
   * @param {Object} user - User object
   * @returns {Object} User without password
   */
  static sanitize(user) {
    if (!user) return null;

    const { password, ...sanitized } = user;

    // Convert snake_case to camelCase for API response
    return {
      id: sanitized.id,
      email: sanitized.email,
      firstName: sanitized.first_name,
      lastName: sanitized.last_name,
      monthlyBudget: sanitized.monthly_budget || 0,
      budgetPeriod: sanitized.budget_period || "monthly",
      createdAt: sanitized.created_at,
      updatedAt: sanitized.updated_at,
    };
  }

  /**
   * Convert API data (camelCase) to database format (snake_case)
   * @param {Object} data - Data in camelCase
   * @returns {Object} Data in snake_case
   */
  static toDbFormat(data) {
    const dbData = {};

    if (data.id) dbData.id = data.id;
    if (data.email) dbData.email = data.email;
    if (data.password) dbData.password = data.password;
    if (data.firstName !== undefined) dbData.first_name = data.firstName;
    if (data.lastName !== undefined) dbData.last_name = data.lastName;
    if (data.monthlyBudget !== undefined) dbData.monthly_budget = data.monthlyBudget;
    if (data.budgetPeriod !== undefined) dbData.budget_period = data.budgetPeriod;
    if (data.createdAt) dbData.created_at = data.createdAt;
    if (data.updatedAt) dbData.updated_at = data.updatedAt;

    return dbData;
  }
}

module.exports = User;
