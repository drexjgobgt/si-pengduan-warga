const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const jwt = require("jsonwebtoken");

// Helper to safely extract user from Authorization header if present
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

// Indonesian Month Name Helper
const INDO_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const formatIndoDate = (dateStr, isMonthly = false) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (isMonthly) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${INDO_MONTHS[monthIdx] || parts[1]} ${year}`;
  } else {
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${day} ${INDO_MONTHS[monthIdx] || parts[1]}`;
  }
};

/**
 * GET /api/statistics
 * Overview general statistics + SLA summary
 */
router.get("/", async (req, res, next) => {
  try {
    const [
      statsResult,
      totalResult,
      avgConfidence,
      statusResult,
      recentResult,
      accuracyResult,
      slaResult,
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
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('pending', 'diproses')) AS active_count,
          COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'aman') AS safe_count,
          COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'mendekati_tenggat') AS near_deadline_count,
          COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'terlambat') AS overdue_count,
          COUNT(*) FILTER (WHERE status = 'selesai' AND sla_status = 'selesai_tepat_waktu') AS on_time_count,
          COUNT(*) FILTER (WHERE status = 'selesai' AND sla_status = 'selesai_terlambat') AS late_resolved_count,
          COUNT(*) FILTER (WHERE status = 'selesai') AS total_resolved
        FROM complaints
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
        sla: slaResult.rows[0] || {},
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/statistics/monthly
 * 12-month aggregated data for backward compatibility
 */
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

/**
 * GET /api/statistics/trends
 * Flexible chronological time-series trends (7d, 30d, 90d, 12m)
 * Supports role-based filtering:
 *   - scope: 'all' | 'my_tasks' | 'my_complaints'
 *   - department_id: optional filter
 * Generates continuous time series (zero-filled dates)
 */
router.get("/trends", async (req, res, next) => {
  try {
    const { period = "30d", department_id, scope } = req.query;
    const user = getOptionalUser(req);

    // Build WHERE clauses for complaint filters
    const filterClauses = [];
    const filterParams = [];
    let pIdx = 1;

    if (department_id) {
      filterClauses.push(`department_id = $${pIdx}`);
      filterParams.push(parseInt(department_id, 10));
      pIdx++;
    }

    if (scope === "my_tasks" && user) {
      filterClauses.push(`assigned_to = $${pIdx}`);
      filterParams.push(user.userId);
      pIdx++;
    } else if (scope === "my_complaints" && user) {
      filterClauses.push(`user_id = $${pIdx}`);
      filterParams.push(user.userId);
      pIdx++;
    }

    const whereExtra = filterClauses.length > 0 ? "AND " + filterClauses.join(" AND ") : "";

    let query = "";
    const isMonthly = period === "12m";

    if (isMonthly) {
      // 12 Months
      query = `
        WITH month_series AS (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date AS m_start
        )
        SELECT 
          TO_CHAR(ms.m_start, 'YYYY-MM') AS date,
          COUNT(DISTINCT c_in.id) AS masuk,
          COUNT(DISTINCT c_out.id) AS selesai,
          COUNT(DISTINCT c_act.id) AS proses,
          COUNT(DISTINCT c_late.id) AS terlambat
        FROM month_series ms
        LEFT JOIN complaints c_in 
          ON DATE_TRUNC('month', c_in.created_at) = ms.m_start ${whereExtra}
        LEFT JOIN complaints c_out 
          ON c_out.status = 'selesai' 
          AND DATE_TRUNC('month', COALESCE(c_out.resolved_at, c_out.updated_at)) = ms.m_start ${whereExtra}
        LEFT JOIN complaints c_act 
          ON c_act.status IN ('pending', 'diproses') 
          AND DATE_TRUNC('month', c_act.created_at) <= ms.m_start ${whereExtra}
        LEFT JOIN complaints c_late 
          ON c_late.sla_status = 'terlambat' 
          AND DATE_TRUNC('month', c_late.created_at) <= ms.m_start ${whereExtra}
        GROUP BY ms.m_start
        ORDER BY ms.m_start ASC;
      `;
    } else {
      // Daily: 7d, 30d, 90d
      let dayInterval = "29 days";
      if (period === "7d") dayInterval = "6 days";
      if (period === "90d") dayInterval = "89 days";

      query = `
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '${dayInterval}',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS day
        )
        SELECT 
          TO_CHAR(ds.day, 'YYYY-MM-DD') AS date,
          COUNT(DISTINCT c_in.id) AS masuk,
          COUNT(DISTINCT c_out.id) AS selesai,
          COUNT(DISTINCT c_act.id) AS proses,
          COUNT(DISTINCT c_late.id) AS terlambat
        FROM date_series ds
        LEFT JOIN complaints c_in 
          ON c_in.created_at::date = ds.day ${whereExtra}
        LEFT JOIN complaints c_out 
          ON c_out.status = 'selesai' 
          AND COALESCE(c_out.resolved_at, c_out.updated_at)::date = ds.day ${whereExtra}
        LEFT JOIN complaints c_act 
          ON c_act.status IN ('pending', 'diproses') 
          AND c_act.created_at::date <= ds.day ${whereExtra}
        LEFT JOIN complaints c_late 
          ON c_late.sla_status = 'terlambat' 
          AND c_late.created_at::date <= ds.day ${whereExtra}
        GROUP BY ds.day
        ORDER BY ds.day ASC;
      `;
    }

    const result = await pool.query(query, filterParams);

    const formattedData = result.rows.map((row) => ({
      date: row.date,
      displayDate: formatIndoDate(row.date, isMonthly),
      masuk: parseInt(row.masuk, 10) || 0,
      selesai: parseInt(row.selesai, 10) || 0,
      proses: parseInt(row.proses, 10) || 0,
      terlambat: parseInt(row.terlambat, 10) || 0,
    }));

    res.json({
      success: true,
      data: {
        period,
        isMonthly,
        points: formattedData,
        summary: {
          totalMasuk: formattedData.reduce((acc, p) => acc + p.masuk, 0),
          totalSelesai: formattedData.reduce((acc, p) => acc + p.selesai, 0),
          peakMasuk: Math.max(...formattedData.map((p) => p.masuk), 0),
          currentProses: formattedData.length > 0 ? formattedData[formattedData.length - 1].proses : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/statistics/performance
 * Resolution speed, SLA compliance rates, and department comparison
 */
router.get("/performance", async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const filterDept = department_id ? parseInt(department_id, 10) : null;

    let deptWhere = "";
    const params = [];
    if (filterDept) {
      deptWhere = "WHERE c.department_id = $1";
      params.push(filterDept);
    }

    const [speedRes, onTimeRes, deptRes, priorityRes] = await Promise.all([
      // 1. Resolution speed in hours
      pool.query(`
        SELECT 
          ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, updated_at) - created_at)) / 3600)::numeric, 1) as avg_resolution_hours,
          ROUND(MIN(EXTRACT(EPOCH FROM (COALESCE(resolved_at, updated_at) - created_at)) / 3600)::numeric, 1) as min_resolution_hours,
          ROUND(MAX(EXTRACT(EPOCH FROM (COALESCE(resolved_at, updated_at) - created_at)) / 3600)::numeric, 1) as max_resolution_hours,
          COUNT(*) as resolved_sample_count
        FROM complaints c
        ${filterDept ? "WHERE c.department_id = $1 AND c.status = 'selesai'" : "WHERE c.status = 'selesai'"}
      `, params),

      // 2. On-time resolution breakdown
      pool.query(`
        SELECT 
          COUNT(*) as total_resolved,
          COUNT(CASE WHEN sla_status = 'selesai_tepat_waktu' THEN 1 END) as on_time_count,
          COUNT(CASE WHEN sla_status = 'selesai_terlambat' THEN 1 END) as late_count,
          ROUND(
            (COUNT(CASE WHEN sla_status = 'selesai_tepat_waktu' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
            1
          ) as on_time_pct
        FROM complaints c
        ${filterDept ? "WHERE c.department_id = $1 AND c.status = 'selesai'" : "WHERE c.status = 'selesai'"}
      `, params),

      // 3. Department Comparison
      pool.query(`
        SELECT 
          d.id, d.name, d.code,
          COUNT(c.id) as total_complaints,
          COUNT(CASE WHEN c.status = 'selesai' THEN 1 END) as resolved_count,
          COUNT(CASE WHEN c.status IN ('pending', 'diproses') THEN 1 END) as active_count,
          COUNT(CASE WHEN c.sla_status = 'terlambat' THEN 1 END) as overdue_count,
          ROUND(
            (COUNT(CASE WHEN c.status = 'selesai' AND c.sla_status = 'selesai_tepat_waktu' THEN 1 END)::NUMERIC /
            NULLIF(COUNT(CASE WHEN c.status = 'selesai' THEN 1 END)::NUMERIC, 0)) * 100, 1
          ) as on_time_rate,
          ROUND(
            AVG(CASE WHEN c.status = 'selesai' THEN EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, c.updated_at) - c.created_at))/3600 END)::numeric, 1
          ) as avg_hours
        FROM departments d
        LEFT JOIN complaints c ON c.department_id = d.id
        GROUP BY d.id, d.name, d.code
        ORDER BY total_complaints DESC
      `),

      // 4. Priority breakdown
      pool.query(`
        SELECT 
          priority,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'selesai' THEN 1 END) as resolved_count
        FROM complaints c
        ${deptWhere}
        GROUP BY priority
      `, params),
    ]);

    res.json({
      success: true,
      data: {
        resolutionSpeed: {
          avgHours: parseFloat(speedRes.rows[0]?.avg_resolution_hours || 0),
          minHours: parseFloat(speedRes.rows[0]?.min_resolution_hours || 0),
          maxHours: parseFloat(speedRes.rows[0]?.max_resolution_hours || 0),
          sampleCount: parseInt(speedRes.rows[0]?.resolved_sample_count || 0, 10),
        },
        onTimeStats: {
          totalResolved: parseInt(onTimeRes.rows[0]?.total_resolved || 0, 10),
          onTimeCount: parseInt(onTimeRes.rows[0]?.on_time_count || 0, 10),
          lateCount: parseInt(onTimeRes.rows[0]?.late_count || 0, 10),
          onTimePct: parseFloat(onTimeRes.rows[0]?.on_time_pct || 0),
        },
        departments: deptRes.rows.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          total: parseInt(d.total_complaints || 0, 10),
          resolved: parseInt(d.resolved_count || 0, 10),
          active: parseInt(d.active_count || 0, 10),
          overdue: parseInt(d.overdue_count || 0, 10),
          onTimeRate: parseFloat(d.on_time_rate || 0),
          avgHours: parseFloat(d.avg_hours || 0),
        })),
        priorities: priorityRes.rows.map((p) => ({
          priority: p.priority,
          count: parseInt(p.count || 0, 10),
          resolved: parseInt(p.resolved_count || 0, 10),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
