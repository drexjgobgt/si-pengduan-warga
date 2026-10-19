const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Public/authenticated access to view departments
router.get("/", authenticateToken, departmentController.getAll);

// Authenticated staff can view officers and workload
router.get(
  "/officers",
  authenticateToken,
  authorizeRoles("petugas", "supervisor", "admin"),
  departmentController.getOfficers
);

// Admin-only department CRUD
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  departmentController.create
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  departmentController.update
);

module.exports = router;
