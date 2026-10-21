const jwt = require("jsonwebtoken");
const { handleCitizenChat, getPublicFAQ } = require("../services/chatService");
const { getUsageStats } = require("../config/kiosApi");

/**
 * Safely extract authenticated user from Bearer token if present
 */
const getOptionalUser = (req) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * POST /api/chat
 * Handles incoming chat message from citizen (public or authenticated)
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Pesan tidak boleh kosong.",
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Panjang pesan maksimal 500 karakter.",
      });
    }

    // Extract user token if logged in
    const user = getOptionalUser(req);

    const chatResult = await handleCitizenChat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      user,
    });

    res.json({
      success: true,
      data: chatResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/faq
 * Public FAQ list
 */
exports.getFAQ = async (req, res, next) => {
  try {
    const faq = getPublicFAQ();
    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chat/status
 * Public AI status and quota monitoring (sanitized, no secrets)
 */
exports.getStatus = async (req, res, next) => {
  try {
    const stats = getUsageStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
