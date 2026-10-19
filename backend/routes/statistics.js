const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.get("/", async (req, res, next) => {
  try {
    // Run all independent queries in parallel using Promise.all
    const [
      statsResult,
      totalResult,
      avgConfidence,
      statusResult,
      recentResult,
      accuracyResult,
    ] = await Promise.all([
      pool.query("SELECT * FROM complaint_stats"),
      pool.query("SELECT COUNT(*) as total FROM complaints"),
      pool.query(
        "SELECT AVG(confidence_score) as avg_conf FROM complaints WHERE confidence_score IS NOT NULL"
      ),
      pool.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM complaints
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT COUNT(*) as count 
        FROM complaints 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN category_id = auto_category_id THEN 1 END) as correct,
          ROUND(
            (COUNT(CASE WHEN category_id = auto_category_id THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
            2
          ) as accuracy_percentage
        FROM complaints
        WHERE category_id IS NOT NULL AND auto_category_id IS NOT NULL
      `),
    ]);

    res.json({
      success: true,
      data: {
        byCategory: statsResult.rows,
        byStatus: statusResult.rows,
        total: parseInt(totalResult.rows[0].total, 10) || 0,
        averageConfidence: parseFloat(
          avgConfidence.rows[0]?.avg_conf || 0
        ).toFixed(2),
        recentCount: parseInt(recentResult.rows[0]?.count, 10) || 0,
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
