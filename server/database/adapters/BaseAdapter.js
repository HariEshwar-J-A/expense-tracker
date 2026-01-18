/**
 * BaseAdapter - Abstract interface for database adapters
 * All database adapters must extend this class and implement its methods
 */
class BaseAdapter {
    constructor(config = {}) {
        this.config = config;
        this.db = null;
        this.connected = false;
    }

    /**
     * Connect to the database
     * @returns {Promise<void>}
     */
    async connect() {
        throw new Error('connect() must be implemented by adapter');
    }

    /**
     * Disconnect from the database
     * @returns {Promise<void>}
     */
    async disconnect() {
        throw new Error('disconnect() must be implemented by adapter');
    }

    /**
     * Get the underlying database connection
     * @returns {*} Database connection object
     */
    getConnection() {
        if (!this.connected) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    /**
     * Execute a transaction
     * @param {Function} callback - Function to execute within transaction
     * @returns {Promise<*>} Result of the transaction
     */
    async transaction(callback) {
        throw new Error('transaction() must be implemented by adapter');
    }

    /**
     * Find a single record
     * @param {string} table - Table name
     * @param {Object} conditions - Where conditions
     * @returns {Promise<Object|null>} Found record or null
     */
    async findOne(table, conditions) {
        const db = this.getConnection();
        return await db(table).where(conditions).first();
    }

    /**
     * Find multiple records
     * @param {string} table - Table name
     * @param {Object} conditions - Where conditions
     * @param {Object} options - Query options (limit, offset, orderBy, select)
     * @returns {Promise<Array>} Array of records
     */
    async findMany(table, conditions = {}, options = {}) {
        const db = this.getConnection();
        let query = db(table).where(conditions);

        if (options.select) {
            query = query.select(options.select);
        }

        if (options.orderBy) {
            if (Array.isArray(options.orderBy)) {
                options.orderBy.forEach(order => {
                    query = query.orderBy(order.column, order.direction || 'asc');
                });
            } else {
                query = query.orderBy(options.orderBy);
            }
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.offset(options.offset);
        }

        return await query;
    }

    /**
     * Create a new record
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Created record
     */
    async create(table, data) {
        const db = this.getConnection();
        const [id] = await db(table).insert(data);

        // For SQLite, id is the rowid, for postgres it's the inserted row
        if (typeof id === 'object') {
            return id;
        }

        return await this.findOne(table, { id: data.id });
    }

    /**
     * Update a record by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @param {Object} data - Data to update
     * @returns {Promise<Object>} Updated record
     */
    async update(table, id, data) {
        const db = this.getConnection();
        await db(table).where({ id }).update({
            ...data,
            updated_at: new Date()
        });
        return await this.findOne(table, { id });
    }

    /**
     * Delete a record by ID
     * @param {string} table - Table name
     * @param {string} id - Record ID
     * @returns {Promise<number>} Number of deleted records
     */
    async delete(table, id) {
        const db = this.getConnection();
        return await db(table).where({ id }).del();
    }

    /**
     * Count records
     * @param {string} table - Table name
     * @param {Object} conditions - Where conditions
     * @returns {Promise<number>} Count of records
     */
    async count(table, conditions = {}) {
        const db = this.getConnection();
        const result = await db(table).where(conditions).count('* as count').first();
        return parseInt(result.count);
    }

    /**
     * Execute raw query
     * @param {string} query - SQL query
     * @param {Array} bindings - Query bindings
     * @returns {Promise<*>} Query result
     */
    async raw(query, bindings = []) {
        const db = this.getConnection();
        return await db.raw(query, bindings);
    }
}

module.exports = BaseAdapter;
