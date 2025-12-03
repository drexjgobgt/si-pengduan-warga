const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE is_active = TRUE ORDER BY name"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM categories WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kategori tidak ditemukan" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
