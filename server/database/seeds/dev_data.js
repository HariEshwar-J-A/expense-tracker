const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Seed development data
 */
exports.seed = async function (knex) {
    // Delete existing data (in reverse order due to foreign keys)
    await knex('expenses').del();
    await knex('users').del();

    console.log('🌱 Seeding database...');

    // Create demo users
    const users = [
        {
            id: uuidv4(),
            email: 'demo@example.com',
            password: await bcrypt.hash('password123', 10),
            first_name: 'Demo',
            last_name: 'User',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: uuidv4(),
            email: 'john@example.com',
            password: await bcrypt.hash('password123', 10),
            first_name: 'John',
            last_name: 'Doe',
            created_at: new Date(),
            updated_at: new Date()
        }
    ];

    await knex('users').insert(users);
    console.log(`✅ Created ${users.length} users`);

    // Create expenses for demo user
    const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Other'];
    const vendors = {
        Food: ['Walmart', 'Whole Foods', 'Starbucks', 'McDonald\'s', 'Chipotle'],
        Transport: ['Uber', 'Lyft', 'Shell Gas', 'Metro Card'],
        Utilities: ['Electric Company', 'Water Utility', 'Internet Provider'],
        Entertainment: ['Netflix', 'Spotify', 'Cinema', 'Amazon Prime'],
        Health: ['CVS Pharmacy', 'Walgreens', 'Gym Membership'],
        Other: ['Amazon', 'Target', 'Office Depot']
    };

    const expenses = [];
    const demoUserId = users[0].id;

    // Generate 30 expenses over the last 90 days
    for (let i = 0; i < 30; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const vendorList = vendors[category];
        const vendor = vendorList[Math.floor(Math.random() * vendorList.length)];

        // Random date in last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        // Amount varies by category
        let amount;
        switch (category) {
            case 'Food':
                amount = (Math.random() * 50 + 10).toFixed(2); // $10-60
                break;
            case 'Transport':
                amount = (Math.random() * 40 + 5).toFixed(2); // $5-45
                break;
            case 'Utilities':
                amount = (Math.random() * 150 + 50).toFixed(2); // $50-200
                break;
            case 'Entertainment':
                amount = (Math.random() * 30 + 10).toFixed(2); // $10-40
                break;
            case 'Health':
                amount = (Math.random() * 100 + 20).toFixed(2); // $20-120
                break;
            default:
                amount = (Math.random() * 80 + 15).toFixed(2); // $15-95
        }

        expenses.push({
            id: uuidv4(),
            user_id: demoUserId,
            amount: parseFloat(amount),
            vendor,
            category,
            date: date.toISOString().split('T')[0],
            receipt_url: null,
            created_at: new Date(),
            updated_at: new Date()
        });
    }

    // Generate 15 expenses for second user
    const johnUserId = users[1].id;
    for (let i = 0; i < 15; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const vendorList = vendors[category];
        const vendor = vendorList[Math.floor(Math.random() * vendorList.length)];

        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        const amount = (Math.random() * 100 + 10).toFixed(2);

        expenses.push({
            id: uuidv4(),
            user_id: johnUserId,
            amount: parseFloat(amount),
            vendor,
            category,
            date: date.toISOString().split('T')[0],
            receipt_url: null,
            created_at: new Date(),
            updated_at: new Date()
        });
    }

    await knex('expenses').insert(expenses);
    console.log(`✅ Created ${expenses.length} expenses`);

    console.log('\n🎉 Seed complete!');
    console.log('\nTest credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: password123');
    console.log('\n  Email: john@example.com');
    console.log('  Password: password123');
};
