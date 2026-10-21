const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const uploadController = require("../controllers/uploadController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public / Filtered Complaints
router.get("/", complaintController.getAll);

// SLA Summary for Staff (must precede /:id)
router.get(
  "/sla/summary",
  authenticateToken,
  authorizeRoles("petugas", "supervisor", "admin"),
  complaintController.getSLASummary
);

// Detail Complaint
router.get("/:id", complaintController.getById);

// Create Complaint
router.post("/", authenticateToken, complaintController.create);

// Delete Complaint
router.delete("/:id", authenticateToken, complaintController.delete);

// Re-classify Complaint using AI LLM (Staff only)
router.post(
  "/:id/reclassify",
  authenticateToken,
  authorizeRoles("admin", "supervisor", "petugas"),
  complaintController.reclassify
);

// General status update
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin", "supervisor", "petugas"),
  complaintController.updateStatus
);

// Disposition / Assignment
router.post(
  "/:id/assign",
  authenticateToken,
  authorizeRoles("admin", "supervisor", "petugas"),
  complaintController.assign
);

// Progress Notes (Internal or Public)
router.post(
  "/:id/progress",
  authenticateToken,
  authorizeRoles("warga", "petugas", "supervisor", "admin"),
  complaintController.addProgressNote
);

// Resolve Complaint
router.post(
  "/:id/resolve",
  authenticateToken,
  authorizeRoles("petugas", "supervisor", "admin"),
  complaintController.resolve
);

// Reopen Complaint
router.post(
  "/:id/reopen",
  authenticateToken,
  authorizeRoles("warga", "supervisor", "admin"),
  complaintController.reopen
);

// Rich Chronological Timeline
router.get("/:id/timeline", complaintController.getTimeline);

// Voting
router.post("/:id/vote", authenticateToken, complaintController.vote);

// Comments
router.post("/:id/comments", authenticateToken, complaintController.addComment);
router.get("/:id/comments", complaintController.getComments);
router.delete("/:id/comments/:commentId", authenticateToken, complaintController.deleteComment);

// Legacy History
router.get("/:id/history", complaintController.getHistory);

// Image upload routes
router.post("/:id/upload", authenticateToken, upload.single("image"), uploadController.uploadImage);
router.get("/:id/images", uploadController.getImages);
router.delete("/:id/images/:imageId", authenticateToken, uploadController.deleteImage);

module.exports = router;
