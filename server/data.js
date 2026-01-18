// In-memory data store

// Users array
// { id, username, passwordHash }
const users = [];

// Expenses array
// { id, userId, amount, date, vendor, category }
const expenses = [
    {
        id: '1',
        userId: 'demo-user', // specific for demo
        amount: 50.00,
        date: new Date().toISOString().split('T')[0],
        vendor: 'Grocery Store',
        category: 'Food'
    },
    {
        id: '2',
        userId: 'demo-user',
        amount: 20.00,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        vendor: 'Uber',
        category: 'Transport'
    }
];

module.exports = { users, expenses };
