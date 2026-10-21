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
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
    console.warn("⚠️ Database connection check warning:", error.message);
    console.warn("   Pastikan PostgreSQL server aktif jika ingin melakukan query database.");
  }
})();

// Routes
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const categoryRoutes = require("./routes/categories");
const statisticsRoutes = require("./routes/statistics");
const notificationsRoutes = require("./routes/notifications");
const departmentRoutes = require("./routes/departments");
const chatRoutes = require("./routes/chat");

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "PostgreSQL",
    aiClassification: "Active (Real LLM via Kios API)",
    aiChatbot: "Active (Kios API)",
    freeOnly: (process.env.KIOSAPI_FREE_ONLY || "true").toLowerCase() === "true",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

// Error handler (harus di paling bawah)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 Server berjalan di port ${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🤖 AI Engine: Kios API (Real LLM Classification & Citizen Chatbot)`);
  console.log(`🛡️ Free-Only Policy: ${(process.env.KIOSAPI_FREE_ONLY || "true").toLowerCase() === "true" ? "Aktif (Gratis Saja)" : "Nonaktif"}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log("========================================");
});
