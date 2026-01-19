/**
 * Sanitizes a string value to prevent XSS and CSV Injection.
 * @param {string} value - The value to sanitize.
 * @returns {string} - The sanitized value.
 */
function sanitizeValue(value) {
    if (typeof value !== 'string') return value;

    // 1. Basic XSS prevention: Strip <script> tags and html special chars
    // rigorous way: use a library, but for this scope we'll do basic replacement
    let safeValue = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // 2. CSV Injection (Formula Injection) prevention
    // If the value starts with =, +, -, or @, prepend a single quote
    const dangerousPrefixes = ['=', '+', '-', '@'];
    if (dangerousPrefixes.some(prefix => safeValue.startsWith(prefix))) {
        safeValue = `'${safeValue}`;
    }

    return safeValue;
}

/**
 * Filters out internal metadata fields from an expense object for export.
 * @param {Object} expense - The expense object.
 * @returns {Object} - The filtered expense object.
 */
function filterExportFields(expense) {
    if (!expense) return null;

    // Destructure to separate unwanted fields
    const {
        id,
        userId,
        user_id, // in case of snake_case
        createdAt,
        updatedAt,
        created_at, // in case of snake_case
        updated_at,
        receiptUrl,
        receipt_url,
        ...rest
    } = expense;

    return rest;
}

module.exports = {
    sanitizeValue,
    filterExportFields
};
