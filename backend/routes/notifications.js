const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, notificationController.getAll);
router.patch("/:id/read", authenticateToken, notificationController.markAsRead);
router.patch("/read-all", authenticateToken, notificationController.markAllAsRead);
router.delete("/:id", authenticateToken, notificationController.delete);

module.exports = router;

