const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "DB_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error("\n💡 Please create a .env file with the required variables.");
  console.error("   See .env.example for reference.\n");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test database connection
const pool = require("./config/database");
(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful");
    console.log(`   Database time: ${result.rows[0].now}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("   Please check your database configuration in .env file");
    process.exit(1);
  }
})();

// Routes
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const categoryRoutes = require("./routes/categories");
const statisticsRoutes = require("./routes/statistics");
const notificationsRoutes = require("./routes/notifications");

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "PostgreSQL",
    aiClassification: "Active",
  });
});

// Error handler (harus di paling bawah)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🤖 ML Classification: Active (Keyword-based)`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log("========================================");
});
