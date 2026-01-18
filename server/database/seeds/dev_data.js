const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("expenses").del();
  await knex("users").del();

  // Create default user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const userId = uuidv4();

  await knex("users").insert([
    {
      id: userId,
      email: "test@example.com",
      password: hashedPassword,
      first_name: "Test",
      last_name: "User",
      monthly_budget: 3000.00, // Set a default budget
      budget_period: "monthly", // Default period
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // Categories and Vendors
  const categories = [
    "Food",
    "Transport",
    "Utilities",
    "Entertainment",
    "Health",
    "Housing",
    "Education",
    "Shopping"
  ];
  const vendors = {
    Food: ["Whole Foods", "Trader Joe's", "Uber Eats", "Starbucks", "Local Cafe"],
    Transport: ["Uber", "Shell", "Subway", "Bus Ticket", "Car Maintenance"],
    Utilities: ["PG&E", "Water Bill", "Internet Provider", "Phone Bill"],
    Entertainment: ["Netflix", "Spotify", "Cinema", "Steam", "Ticketmaster"],
    Health: ["CVS", "Doctor Visit", "Gym Membership", "Pharmacy"],
    Housing: ["Rent", "Furniture Store", "Home Depot", "Repairs"],
    Education: ["Udemy", "Books", "Course Fee"],
    Shopping: ["Amazon", "Target", "Walmart", "Best Buy", "Apple"]
  };

  const expenses = [];
  const today = new Date();

  // Generate data for the past 12 months
  for (let i = 0; i < 300; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryVendors = vendors[category];
    const vendor = categoryVendors[Math.floor(Math.random() * categoryVendors.length)];

    // Random date within last 365 days
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * 365));

    // Skew random amount based on category
    let amount;
    if (category === "Housing") amount = 500 + Math.random() * 1000;
    else if (category === "Shopping") amount = 20 + Math.random() * 200;
    else if (category === "Food") amount = 10 + Math.random() * 80;
    else amount = 5 + Math.random() * 100;

    expenses.push({
      id: uuidv4(),
      user_id: userId,
      amount: parseFloat(amount.toFixed(2)),
      category: category,
      vendor: vendor,
      date: pastDate.toISOString().split('T')[0], // YYYY-MM-DD
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  // Ensure some recent data for the current month for "Velocity" demo
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  for (let i = 0; i < 15; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const vendor = vendors[category][Math.floor(Math.random() * vendors[category].length)];
    const day = Math.floor(Math.random() * today.getDate()) + 1;
    const date = new Date(currentYear, currentMonth, day);

    expenses.push({
      id: uuidv4(),
      user_id: userId,
      amount: parseFloat((10 + Math.random() * 100).toFixed(2)),
      category: category,
      vendor: vendor,
      date: date.toISOString().split('T')[0],
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await knex("expenses").insert(expenses);
};
