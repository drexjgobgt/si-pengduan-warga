const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/", async (req, res, next) => {
  try {
    // Get category statistics
    const statsResult = await pool.query("SELECT * FROM complaint_stats");

    // Get total complaints
    const totalResult = await pool.query(
      "SELECT COUNT(*) as total FROM complaints"
    );

    // Get average confidence
    const avgConfidence = await pool.query(
      "SELECT AVG(confidence_score) as avg_conf FROM complaints WHERE confidence_score IS NOT NULL"
    );

    // Get status distribution
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM complaints
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get recent complaints count (last 7 days)
    const recentResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    // Get classification accuracy
    const accuracyResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category_id = auto_category_id THEN 1 END) as correct,
        ROUND(
          (COUNT(CASE WHEN category_id = auto_category_id THEN 1 END)::NUMERIC / 
          COUNT(*)::NUMERIC) * 100, 
          2
        ) as accuracy_percentage
      FROM complaints
      WHERE category_id IS NOT NULL AND auto_category_id IS NOT NULL
    `);

    res.json({
      success: true,
      data: {
        byCategory: statsResult.rows,
        byStatus: statusResult.rows,
        total: parseInt(totalResult.rows[0].total),
        averageConfidence: parseFloat(
          avgConfidence.rows[0].avg_conf || 0
        ).toFixed(2),
        recentCount: parseInt(recentResult.rows[0].count),
        accuracy: accuracyResult.rows[0] || {
          total: 0,
          correct: 0,
          accuracy_percentage: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'selesai' THEN 1 END) as resolved
      FROM complaints
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
