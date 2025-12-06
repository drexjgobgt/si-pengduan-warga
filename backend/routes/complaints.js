const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const uploadController = require("../controllers/uploadController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

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

// Image upload routes
router.post("/:id/upload", authenticateToken, upload.single("image"), uploadController.uploadImage);
router.get("/:id/images", uploadController.getImages);
router.delete("/:id/images/:imageId", authenticateToken, uploadController.deleteImage);

module.exports = router;
