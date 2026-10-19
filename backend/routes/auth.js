const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // Maksimal 20 percobaan per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.",
  },
});

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

module.exports = router;
