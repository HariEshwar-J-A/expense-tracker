/**
 * API Test Script
 * Tests all major API endpoints
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
let authToken = "";

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

async function runTests() {
  console.log("🧪 Starting API Tests...\n");

  // Test 1: Health Check
  console.log("1️⃣  Testing API Health Check...");
  const health = await apiCall("GET", "/../");
  console.log(
    health.success ? "✅ API is running" : "❌ API failed",
    health.data,
  );
  console.log("");

  // Test 2: User Registration
  console.log("2️⃣  Testing User Registration...");
  const newUser = {
    email: `test${Date.now()}@example.com`,
    password: "testpass123",
    firstName: "Test",
    lastName: "User",
  };
  const register = await apiCall("POST", "/auth/register", newUser);
  if (register.success) {
    console.log("✅ Registration successful");
    authToken = register.data.token;
    console.log("   User:", register.data.user);
    console.log("   Token:", authToken.substring(0, 30) + "...");
  } else {
    console.log("❌ Registration failed:", register.error);
  }
  console.log("");

  // Test 3: User Login
  console.log("3️⃣  Testing User Login...");
  const login = await apiCall("POST", "/auth/login", {
    email: "demo@example.com",
    password: "password123",
  });
  if (login.success) {
    console.log("✅ Login successful");
    authToken = login.data.token; // Use demo user token
    console.log("   User:", login.data.user);
  } else {
    console.log("❌ Login failed:", login.error);
  }
  console.log("");

  if (!authToken) {
    console.log("❌ Cannot proceed without auth token");
    return;
  }

  // Test 4: Create Expense
  console.log("4️⃣  Testing Create Expense...");
  const newExpense = {
    amount: 45.99,
    vendor: "Test Store",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  };
  const createExpense = await apiCall(
    "POST",
    "/expenses",
    newExpense,
    authToken,
  );
  const expenseId = createExpense.data?.id;
  if (createExpense.success) {
    console.log("✅ Expense created successfully");
    console.log("   Expense:", createExpense.data);
  } else {
    console.log("❌ Create expense failed:", createExpense.error);
  }
  console.log("");

  // Test 5: Get All Expenses
  console.log("5️⃣  Testing Get All Expenses (paginated)...");
  const getExpenses = await apiCall(
    "GET",
    "/expenses?page=1&limit=5",
    null,
    authToken,
  );
  if (getExpenses.success) {
    console.log("✅ Fetched expenses successfully");
    console.log(`   Total: ${getExpenses.data.pagination.total}`);
    console.log(`   Pages: ${getExpenses.data.pagination.pages}`);
    console.log(`   Items: ${getExpenses.data.data.length}`);
  } else {
    console.log("❌ Get expenses failed:", getExpenses.error);
  }
  console.log("");

  // Test 6: Get Expense by ID
  if (expenseId) {
    console.log("6️⃣  Testing Get Expense by ID...");
    const getExpense = await apiCall(
      "GET",
      `/expenses/${expenseId}`,
      null,
      authToken,
    );
    if (getExpense.success) {
      console.log("✅ Fetched expense by ID");
      console.log("   Expense:", getExpense.data);
    } else {
      console.log("❌ Get expense by ID failed:", getExpense.error);
    }
    console.log("");
  }

  // Test 7: Update Expense
  if (expenseId) {
    console.log("7️⃣  Testing Update Expense...");
    const updateExpense = await apiCall(
      "PUT",
      `/expenses/${expenseId}`,
      {
        amount: 55.99,
        vendor: "Updated Store",
      },
      authToken,
    );
    if (updateExpense.success) {
      console.log("✅ Updated expense successfully");
      console.log("   Updated Expense:", updateExpense.data);
    } else {
      console.log("❌ Update expense failed:", updateExpense.error);
    }
    console.log("");
  }

  // Test 8: Get Expense Statistics
  console.log("8️⃣  Testing Get Expense Statistics...");
  const getStats = await apiCall("GET", "/expenses/stats", null, authToken);
  if (getStats.success) {
    console.log("✅ Fetched statistics successfully");
    console.log("   Total Amount:", getStats.data.total.amount);
    console.log("   Total Count:", getStats.data.total.count);
    console.log("   By Category:", getStats.data.byCategory.slice(0, 3));
  } else {
    console.log("❌ Get stats failed:", getStats.error);
  }
  console.log("");

  // Test 9: Filter Expenses
  console.log("9️⃣  Testing Filter Expenses (Category: Food)...");
  const filterExpenses = await apiCall(
    "GET",
    "/expenses?category=Food&limit=5",
    null,
    authToken,
  );
  if (filterExpenses.success) {
    console.log("✅ Filtered expenses successfully");
    console.log(
      `   Found ${filterExpenses.data.pagination.total} Food expenses`,
    );
  } else {
    console.log("❌ Filter expenses failed:", filterExpenses.error);
  }
  console.log("");

  // Test 10: Delete Expense
  if (expenseId) {
    console.log("🔟 Testing Delete Expense...");
    const deleteExpense = await apiCall(
      "DELETE",
      `/expenses/${expenseId}`,
      null,
      authToken,
    );
    if (deleteExpense.success) {
      console.log("✅ Deleted expense successfully");
      console.log("   Message:", deleteExpense.data.message);
    } else {
      console.log("❌ Delete expense failed:", deleteExpense.error);
    }
    console.log("");
  }

  console.log("🎉 All tests completed!\n");
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
