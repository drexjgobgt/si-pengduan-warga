const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

router.get("/", complaintController.getAll);
router.get("/:id", complaintController.getById);
router.post("/", authenticateToken, complaintController.create);
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin", "petugas"),
  complaintController.updateStatus
);
router.post("/:id/vote", authenticateToken, complaintController.vote);
router.post("/:id/comments", authenticateToken, complaintController.addComment);
router.get("/:id/comments", complaintController.getComments);
router.get("/:id/history", complaintController.getHistory);

module.exports = router;
