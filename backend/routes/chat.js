const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const chatController = require("../controllers/chatController");

// Rate limit: 25 requests per minute per IP to protect AI quota and server resources
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Terlalu banyak pesan dalam waktu singkat. Silakan tunggu 1 menit sebelum mengirim pesan lagi.",
  },
});

// POST /api/chat - Send message to citizen chatbot
router.post("/", chatLimiter, chatController.sendMessage);

// GET /api/chat/faq - Get official FAQ topics
router.get("/faq", chatController.getFAQ);

// GET /api/chat/status - Check AI status and daily limit
router.get("/status", chatController.getStatus);

module.exports = router;
