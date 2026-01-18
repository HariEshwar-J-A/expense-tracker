require("dotenv").config();
const app = require("./app");
const { initializeDatabase } = require("./database/connection");

const PORT = process.env.PORT || 5000;

/**
 * Start server with database initialization
 */
async function startServer() {
  try {
    // Initialize database connection
    const adapter = await initializeDatabase();

    // Run migrations automatically
    await adapter.migrate();



    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: ${process.env.DB_TYPE || "sqlite"}\n`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\n⚠️  SIGTERM received, shutting down gracefully...");
  const { closeDatabase } = require("./database/connection");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n⚠️  SIGINT received, shutting down gracefully...");
  const { closeDatabase } = require("./database/connection");
  await closeDatabase();
  process.exit(0);
});

startServer();
