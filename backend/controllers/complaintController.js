const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const { classifyComplaint } = require("../services/classificationService");
const { sendStatusUpdateEmail } = require("../services/emailService");
const { sanitizeInput } = require("../utils/Validator");
const { cloudinary } = require("../config/cloudinary");

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

// Helper: Calculate default SLA hours based on priority
const getSLAHoursByPriority = (priority) => {
  switch (priority) {
    case "darurat":
      return 24; // 1 day
    case "tinggi":
      return 48; // 2 days
    case "normal":
      return 72; // 3 days
    case "rendah":
      return 120; // 5 days
    default:
      return 72;
  }
};

// Helper: Background SLA status refresh & auto-escalation
const refreshSLAs = async () => {
  try {
    // 1. Mark overdue active complaints as 'terlambat' and escalate to supervisor
    await pool.query(`
      UPDATE complaints
      SET sla_status = 'terlambat',
          is_escalated = TRUE,
          escalated_at = COALESCE(escalated_at, CURRENT_TIMESTAMP),
          escalation_level = GREATEST(escalation_level, 1),
          escalation_reason = COALESCE(escalation_reason, 'Melewati batas waktu target penyelesaian (SLA)')
      WHERE status IN ('pending', 'diproses')
        AND sla_deadline_at IS NOT NULL
        AND CURRENT_TIMESTAMP > sla_deadline_at
        AND (sla_status != 'terlambat' OR is_escalated = FALSE);
    `);

    // 2. Mark active complaints within 12 hours of deadline as 'mendekati_tenggat'
    await pool.query(`
      UPDATE complaints
      SET sla_status = 'mendekati_tenggat'
      WHERE status IN ('pending', 'diproses')
        AND sla_deadline_at IS NOT NULL
        AND CURRENT_TIMESTAMP <= sla_deadline_at
        AND CURRENT_TIMESTAMP >= (sla_deadline_at - INTERVAL '12 hours')
        AND sla_status != 'mendekati_tenggat';
    `);

    // 3. Active complaints with ample time remain 'aman'
    await pool.query(`
      UPDATE complaints
      SET sla_status = 'aman'
      WHERE status IN ('pending', 'diproses')
        AND sla_deadline_at IS NOT NULL
        AND CURRENT_TIMESTAMP < (sla_deadline_at - INTERVAL '12 hours')
        AND sla_status NOT IN ('aman', 'terlambat');
    `);
  } catch (err) {
    // Silently continue if database is temporarily unavailable
  }
};

/**
 * GET /api/complaints
 * Daftar laporan dengan filter komprehensif (status, kategori, prioritas, SLA, departemen, petugas)
 */
exports.getAll = async (req, res, next) => {
  try {
    // Refresh SLA statuses in background
    refreshSLAs().catch(() => {});

    const {
      status,
      category,
      priority,
      department_id,
      assigned_to,
      sla_status,
      is_escalated,
      unassigned,
      my_tasks,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const requestingUser = getOptionalUser(req);

    let query = `
      SELECT c.id, c.title, c.description, c.category_id, c.auto_category_id,
             c.confidence_score, c.location_address, c.location_lat, c.location_lng,
             c.image_url, c.status, c.priority, c.response_text, c.response_at,
             c.created_at, c.updated_at, c.is_anonymous,
             c.sla_hours, c.sla_start_at, c.sla_deadline_at, c.sla_status,
             c.is_escalated, c.escalated_at, c.escalation_level, c.escalation_reason,
             c.resolution_proof_url, c.resolution_notes, c.resolved_at,
             c.assigned_to, c.department_id,
             d.name as department_name, d.code as department_code,
             officer.name as assigned_officer_name, officer.email as assigned_officer_email,
             CASE WHEN c.is_anonymous = TRUE THEN NULL ELSE c.user_id END as user_id,
             CASE WHEN c.is_anonymous = TRUE THEN 'Anonim' ELSE u.name END as user_name,
             cat.name as category_name, cat.color as category_color,
             COUNT(DISTINCT CASE WHEN v.vote_type = 'up' THEN v.id END) as up_vote_count,
             COUNT(DISTINCT CASE WHEN v.vote_type = 'down' THEN v.id END) as down_vote_count,
             COUNT(DISTINCT cm.id) as comment_count
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users officer ON c.assigned_to = officer.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN votes v ON c.id = v.complaint_id
      LEFT JOIN comments cm ON c.id = cm.complaint_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND cat.name = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (priority) {
      query += ` AND c.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (department_id) {
      query += ` AND c.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND c.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (unassigned === "true") {
      query += ` AND c.assigned_to IS NULL`;
    }

    if (my_tasks === "true" && requestingUser) {
      query += ` AND c.assigned_to = $${paramIndex}`;
      params.push(requestingUser.userId);
      paramIndex++;
    }

    if (sla_status) {
      query += ` AND c.sla_status = $${paramIndex}`;
      params.push(sla_status);
      paramIndex++;
    }

    if (is_escalated === "true") {
      query += ` AND c.is_escalated = TRUE`;
    }

    if (search && search.trim()) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR c.location_address ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    query += ` GROUP BY c.id, cat.name, cat.color, d.name, d.code, officer.name, officer.email, u.name 
               ORDER BY 
                 CASE WHEN c.is_escalated = TRUE THEN 0 ELSE 1 END,
                 CASE WHEN c.sla_status = 'terlambat' THEN 0 
                      WHEN c.sla_status = 'mendekati_tenggat' THEN 1 
                      ELSE 2 END,
                 c.created_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(safeLimit, safeOffset);

    // Count query
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM complaints c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND c.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (category) {
      countQuery += ` AND cat.name = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    if (priority) {
      countQuery += ` AND c.priority = $${countParamIndex}`;
      countParams.push(priority);
      countParamIndex++;
    }
    if (department_id) {
      countQuery += ` AND c.department_id = $${countParamIndex}`;
      countParams.push(department_id);
      countParamIndex++;
    }
    if (assigned_to) {
      countQuery += ` AND c.assigned_to = $${countParamIndex}`;
      countParams.push(assigned_to);
      countParamIndex++;
    }
    if (unassigned === "true") {
      countQuery += ` AND c.assigned_to IS NULL`;
    }
    if (my_tasks === "true" && requestingUser) {
      countQuery += ` AND c.assigned_to = $${countParamIndex}`;
      countParams.push(requestingUser.userId);
      countParamIndex++;
    }
    if (sla_status) {
      countQuery += ` AND c.sla_status = $${countParamIndex}`;
      countParams.push(sla_status);
      countParamIndex++;
    }
    if (is_escalated === "true") {
      countQuery += ` AND c.is_escalated = TRUE`;
    }
    if (search && search.trim()) {
      countQuery += ` AND (c.title ILIKE $${countParamIndex} OR c.description ILIKE $${countParamIndex} OR c.location_address ILIKE $${countParamIndex})`;
      countParams.push(`%${search.trim()}%`);
      countParamIndex++;
    }

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0]?.total || 0, 10),
        limit: safeLimit,
        offset: safeOffset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id
 * Detail pengaduan dengan data SLA, petugas, dan perlindungan privasi anonim
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT c.*, 
             cat.name as category_name, cat.color as category_color,
             auto_cat.name as auto_category_name,
             d.name as department_name, d.code as department_code,
             officer.name as assigned_officer_name, officer.email as assigned_officer_email, officer.phone as assigned_officer_phone,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             resp.name as responder_name,
             (SELECT COUNT(*) FROM votes WHERE complaint_id = c.id AND vote_type = 'up') as up_vote_count,
             (SELECT COUNT(*) FROM votes WHERE complaint_id = c.id AND vote_type = 'down') as down_vote_count
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN categories auto_cat ON c.auto_category_id = auto_cat.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users officer ON c.assigned_to = officer.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users resp ON c.response_by = resp.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = result.rows[0];

    // Privacy protection for anonymous complaints
    if (complaint.is_anonymous) {
      const requestingUser = getOptionalUser(req);
      const isOwner = requestingUser && requestingUser.userId === complaint.user_id;
      const isStaff = requestingUser && ["admin", "supervisor", "petugas"].includes(requestingUser.role);

      if (!isOwner && !isStaff) {
        complaint.user_id = null;
        complaint.user_name = "Anonim";
        complaint.user_email = null;
        complaint.user_phone = null;
      }
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints
 * Pembuatan pengaduan baru dengan kalkulasi SLA dan auto-mapping departemen
 */
exports.create = async (req, res, next) => {
  const {
    title,
    description,
    location_address,
    location_lat,
    location_lng,
    image_url,
    is_anonymous,
    priority = "normal",
  } = req.body;
  const userId = req.user.userId;

  if (!title || !description) {
    return res.status(400).json({ error: "Judul dan deskripsi wajib diisi" });
  }

  const cleanTitle = sanitizeInput(title);
  const cleanDescription = sanitizeInput(description);

  // Perform AI classification
  const classification = await classifyComplaint(
    `${cleanTitle} ${cleanDescription}`
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get category ID and associated department
    const categoryResult = await client.query(
      "SELECT id, department_id FROM categories WHERE name = $1",
      [classification.category]
    );

    const autoCategoryId = categoryResult.rows[0]?.id || null;
    const departmentId = categoryResult.rows[0]?.department_id || null;

    // Calculate SLA
    const slaHours = getSLAHoursByPriority(priority);

    // Insert complaint with SLA and department
    const complaintResult = await client.query(
      `INSERT INTO complaints 
       (user_id, title, description, auto_category_id, category_id, department_id,
        confidence_score, location_address, location_lat, location_lng, image_url, 
        is_anonymous, priority, sla_hours, sla_start_at, sla_deadline_at, sla_status)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, 
               CURRENT_TIMESTAMP + ($13 || ' hours')::INTERVAL, 'aman')
       RETURNING *`,
      [
        userId,
        cleanTitle,
        cleanDescription,
        autoCategoryId,
        departmentId,
        classification.confidence,
        location_address || null,
        location_lat || null,
        location_lng || null,
        image_url || null,
        Boolean(is_anonymous),
        priority,
        slaHours,
      ]
    );

    const complaint = complaintResult.rows[0];

    // Log classification
    await client.query(
      `INSERT INTO classification_logs 
       (complaint_id, input_text, predicted_category, confidence_score, 
        all_scores, model_version, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        complaint.id,
        `${cleanTitle} ${cleanDescription}`,
        classification.category,
        classification.confidence,
        JSON.stringify(classification.scores),
        classification.modelVersion,
        classification.processingTime,
      ]
    );

    // Add initial history timeline entry
    await client.query(
      `INSERT INTO complaint_history (complaint_id, status, note, changed_by, action_type, is_internal) 
       VALUES ($1, $2, $3, $4, 'created', FALSE)`,
      [complaint.id, "pending", "Laporan berhasil diajukan oleh warga", userId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Pengaduan berhasil dibuat",
      data: complaint,
      classification: {
        category: classification.category,
        confidence: classification.confidence,
        processingTime: classification.processingTime,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/complaints/:id/status
 * Update status umum laporan oleh Admin/Petugas/Supervisor
 */
exports.updateStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, note, response_text } = req.body;
  const userId = req.user.userId;

  if (!status) {
    return res.status(400).json({ error: "Status wajib diisi" });
  }

  const allowedStatuses = ["pending", "diproses", "selesai", "ditolak"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Nilai status tidak valid" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const complaintResult = await client.query(
      "SELECT c.*, u.email, u.name FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = $1",
      [id]
    );

    if (complaintResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = complaintResult.rows[0];

    // Determine action type
    let actionType = "status_change";
    if (status === "diproses") actionType = "in_progress";
    if (status === "selesai") actionType = "resolved";
    if (status === "ditolak") actionType = "rejected";

    // If marked selesai, compute SLA completion
    let slaUpdateClause = "";
    const params = [status, response_text || null, userId, id];
    if (status === "selesai") {
      const isLate = complaint.sla_deadline_at && new Date() > new Date(complaint.sla_deadline_at);
      const slaStatus = isLate ? "selesai_terlambat" : "selesai_tepat_waktu";
      slaUpdateClause = `, resolved_at = CURRENT_TIMESTAMP, sla_status = '${slaStatus}'`;
    }

    await client.query(
      `UPDATE complaints 
       SET status = $1, response_text = $2, 
           response_by = $3, response_at = CURRENT_TIMESTAMP${slaUpdateClause}
       WHERE id = $4`,
      params
    );

    // Add history entry
    await client.query(
      `INSERT INTO complaint_history (complaint_id, status, note, changed_by, action_type, is_internal) 
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [id, status, note || `Status diubah menjadi ${status}`, userId, actionType]
    );

    await client.query("COMMIT");

    if (complaint.email) {
      sendStatusUpdateEmail(complaint.email, complaint.title, status).catch(
        (err) => console.error("Failed to send email:", err)
      );
    }

    res.json({
      success: true,
      message: "Status berhasil diupdate",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /api/complaints/:id/assign
 * Disposisi atau penugasan laporan ke departemen dan/atau petugas
 */
exports.assign = async (req, res, next) => {
  const { id } = req.params;
  const { officer_id, department_id, notes } = req.body;
  const assignerId = req.user.userId;

  if (!officer_id && !department_id) {
    return res.status(400).json({ error: "Pilih departemen atau petugas tujuan" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT c.*, d.name as current_dept_name, off.name as current_officer_name 
       FROM complaints c 
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN users off ON c.assigned_to = off.id
       WHERE c.id = $1`,
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = currentResult.rows[0];
    const previousOfficerId = complaint.assigned_to;
    const targetOfficerId = officer_id ? parseInt(officer_id, 10) : previousOfficerId;
    const targetDeptId = department_id ? parseInt(department_id, 10) : complaint.department_id;

    // Fetch target officer and department names for audit note
    let targetOfficerName = null;
    if (targetOfficerId) {
      const offRes = await client.query("SELECT name FROM users WHERE id = $1", [targetOfficerId]);
      targetOfficerName = offRes.rows[0]?.name || null;
    }

    let targetDeptName = null;
    if (targetDeptId) {
      const deptRes = await client.query("SELECT name FROM departments WHERE id = $1", [targetDeptId]);
      targetDeptName = deptRes.rows[0]?.name || null;
    }

    // 1. Insert disposition audit log
    await client.query(
      `INSERT INTO complaint_dispositions 
       (complaint_id, assigned_by, from_officer_id, to_officer_id, department_id, notes) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, assignerId, previousOfficerId, targetOfficerId, targetDeptId, notes || null]
    );

    // 2. Update complaint assignment and auto-advance status if pending
    const newStatus = complaint.status === "pending" ? "diproses" : complaint.status;
    await client.query(
      `UPDATE complaints 
       SET assigned_to = $1, department_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [targetOfficerId, targetDeptId, newStatus, id]
    );

    // 3. Add to timeline history
    const actionType = previousOfficerId ? "transferred" : "assigned";
    const historyText = notes
      ? notes
      : targetOfficerName
      ? `Disposisi penugasan ke ${targetOfficerName} (${targetDeptName || "Departemen Terkait"})`
      : `Disposisi dialihkan ke departemen ${targetDeptName}`;

    await client.query(
      `INSERT INTO complaint_history (complaint_id, status, note, changed_by, action_type, is_internal) 
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [id, newStatus, historyText, assignerId, actionType]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Laporan berhasil didisposisikan",
      data: {
        complaint_id: id,
        assigned_to: targetOfficerId,
        department_id: targetDeptId,
        status: newStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /api/complaints/:id/progress
 * Tambah catatan perkembangan penanganan laporan (dapat berupa internal atau publik)
 */
exports.addProgressNote = async (req, res, next) => {
  const { id } = req.params;
  const { note, is_internal = false, proof_url } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({ error: "Catatan progres wajib diisi" });
  }

  // Regular warga cannot create internal-only notes
  const safeIsInternal = userRole === "warga" ? false : Boolean(is_internal);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query("SELECT status FROM complaints WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const currentStatus = check.rows[0].status;

    const result = await client.query(
      `INSERT INTO complaint_history 
       (complaint_id, status, note, changed_by, action_type, is_internal, proof_url) 
       VALUES ($1, $2, $3, $4, 'progress_note', $5, $6)
       RETURNING *`,
      [id, currentStatus, sanitizeInput(note), userId, safeIsInternal, proof_url || null]
    );

    // Update updated_at on complaint
    await client.query("UPDATE complaints SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Catatan progres berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /api/complaints/:id/resolve
 * Selesaikan laporan dengan bukti tindakan, catatan penyelesaian, dan evaluasi kepatuhan SLA
 */
exports.resolve = async (req, res, next) => {
  const { id } = req.params;
  const { resolution_notes, resolution_proof_url } = req.body;
  const userId = req.user.userId;

  if (!resolution_notes && !resolution_proof_url) {
    return res.status(400).json({ error: "Catatan penyelesaian atau bukti foto tindakan wajib diisi" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query(
      "SELECT c.*, u.email FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = $1",
      [id]
    );

    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = check.rows[0];

    // Compute SLA performance: on time vs late
    const isLate = complaint.sla_deadline_at && new Date() > new Date(complaint.sla_deadline_at);
    const slaStatus = isLate ? "selesai_terlambat" : "selesai_tepat_waktu";

    await client.query(
      `UPDATE complaints 
       SET status = 'selesai',
           resolution_notes = $1,
           resolution_proof_url = $2,
           resolved_at = CURRENT_TIMESTAMP,
           sla_status = $3,
           response_by = $4,
           response_at = CURRENT_TIMESTAMP,
           response_text = COALESCE($1, response_text),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [resolution_notes || null, resolution_proof_url || null, slaStatus, userId, id]
    );

    await client.query(
      `INSERT INTO complaint_history 
       (complaint_id, status, note, changed_by, action_type, is_internal, proof_url) 
       VALUES ($1, 'selesai', $2, $3, 'resolved', FALSE, $4)`,
      [
        id,
        resolution_notes || "Laporan telah diselesaikan dan diverifikasi oleh petugas di lapangan.",
        userId,
        resolution_proof_url || null,
      ]
    );

    await client.query("COMMIT");

    if (complaint.email) {
      sendStatusUpdateEmail(complaint.email, complaint.title, "selesai").catch(
        (err) => console.error("Email send error:", err)
      );
    }

    res.json({
      success: true,
      message: "Laporan berhasil diselesaikan",
      data: {
        id,
        status: "selesai",
        sla_status: slaStatus,
        resolved_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * POST /api/complaints/:id/reopen
 * Membuka kembali laporan yang telah selesai jika warga/supervisor mendapati masalah belum tuntas
 */
exports.reopen = async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.userId;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: "Alasan pembukaan kembali laporan wajib diisi" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query("SELECT * FROM complaints WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    // Set back to 'diproses'
    await client.query(
      `UPDATE complaints 
       SET status = 'diproses', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    await client.query(
      `INSERT INTO complaint_history 
       (complaint_id, status, note, changed_by, action_type, is_internal) 
       VALUES ($1, 'diproses', $2, $3, 'reopened', FALSE)`,
      [id, `Laporan dibuka kembali: ${reason.trim()}`, userId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Laporan berhasil dibuka kembali",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/complaints/:id/timeline
 * Mengembalikan timeline kronologis lengkap dengan filter privasi anonim dan catatan internal
 */
exports.getTimeline = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaintRes = await pool.query(
      `SELECT c.id, c.user_id, c.is_anonymous, c.status, c.created_at, c.title
       FROM complaints c 
       WHERE c.id = $1`,
      [id]
    );

    if (complaintRes.rows.length === 0) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = complaintRes.rows[0];
    const requestingUser = getOptionalUser(req);
    const isOwner = requestingUser && requestingUser.userId === complaint.user_id;
    const isStaff = requestingUser && ["admin", "supervisor", "petugas"].includes(requestingUser.role);

    // Filter out internal notes for regular citizens
    let query = `
      SELECT h.id, h.complaint_id, h.status, h.note, h.created_at, 
             h.action_type, h.is_internal, h.proof_url,
             u.id as actor_id, u.name as actor_name, u.role as actor_role,
             d.name as actor_department_name
      FROM complaint_history h
      LEFT JOIN users u ON h.changed_by = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE h.complaint_id = $1
    `;

    if (!isStaff) {
      query += ` AND h.is_internal = FALSE`;
    }

    query += ` ORDER BY h.created_at ASC;`;

    const historyRes = await pool.query(query, [id]);

    // Privacy protection for whistleblower anonymity in timeline
    const timeline = historyRes.rows.map((entry) => {
      if (complaint.is_anonymous && entry.actor_id === complaint.user_id) {
        if (!isOwner && !isStaff) {
          return {
            ...entry,
            actor_id: null,
            actor_name: "Pelapor (Anonim)",
          };
        }
      }
      return entry;
    });

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/sla/summary
 * Statistik SLA untuk Admin dan Supervisor
 */
exports.getSLASummary = async (req, res, next) => {
  try {
    await refreshSLAs();

    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('pending', 'diproses')) AS active_count,
        COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'aman') AS safe_count,
        COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'mendekati_tenggat') AS near_deadline_count,
        COUNT(*) FILTER (WHERE status IN ('pending', 'diproses') AND sla_status = 'terlambat') AS overdue_count,
        COUNT(*) FILTER (WHERE is_escalated = TRUE) AS escalated_count,
        COUNT(*) FILTER (WHERE status = 'selesai' AND sla_status = 'selesai_tepat_waktu') AS resolved_on_time_count,
        COUNT(*) FILTER (WHERE status = 'selesai' AND sla_status = 'selesai_terlambat') AS resolved_late_count,
        COUNT(*) FILTER (WHERE assigned_to IS NULL AND status IN ('pending', 'diproses')) AS unassigned_count
      FROM complaints;
    `;

    const deptSlaQuery = `
      SELECT 
        d.id, d.name, d.code,
        COUNT(c.id) FILTER (WHERE c.status IN ('pending', 'diproses')) AS active_count,
        COUNT(c.id) FILTER (WHERE c.sla_status = 'terlambat' AND c.status IN ('pending', 'diproses')) AS overdue_count,
        COUNT(c.id) FILTER (WHERE c.is_escalated = TRUE) AS escalated_count,
        COUNT(c.id) FILTER (WHERE c.status = 'selesai') AS resolved_total,
        ROUND(
          (COUNT(c.id) FILTER (WHERE c.status = 'selesai' AND c.sla_status = 'selesai_tepat_waktu')::NUMERIC / 
          NULLIF(COUNT(c.id) FILTER (WHERE c.status = 'selesai'), 0)::NUMERIC) * 100, 1
        ) AS on_time_rate_pct
      FROM departments d
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id
      ORDER BY overdue_count DESC, active_count DESC;
    `;

    const [statsResult, deptResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(deptSlaQuery),
    ]);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        by_department: deptResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints/:id/vote
 */
exports.vote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body;
    const userId = req.user.userId;

    if (!["up", "down"].includes(vote_type)) {
      return res.status(400).json({ error: "Invalid vote type. Use 'up' or 'down'" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingVote = await client.query(
        "SELECT * FROM votes WHERE complaint_id = $1 AND user_id = $2",
        [id, userId]
      );

      let newVoteState = vote_type;

      if (existingVote.rows.length > 0) {
        if (existingVote.rows[0].vote_type === vote_type) {
          await client.query("DELETE FROM votes WHERE id = $1", [
            existingVote.rows[0].id,
          ]);
          newVoteState = null;
        } else {
          await client.query(
            "UPDATE votes SET vote_type = $1 WHERE id = $2",
            [vote_type, existingVote.rows[0].id]
          );
        }
      } else {
        await client.query(
          "INSERT INTO votes (complaint_id, user_id, vote_type) VALUES ($1, $2, $3)",
          [id, userId, vote_type]
        );
      }

      await client.query("COMMIT");

      const counts = await pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE vote_type = 'up') as up_count,
           COUNT(*) FILTER (WHERE vote_type = 'down') as down_count
         FROM votes WHERE complaint_id = $1`,
        [id]
      );

      res.json({
        success: true,
        data: {
          up_count: parseInt(counts.rows[0]?.up_count || 0, 10),
          down_count: parseInt(counts.rows[0]?.down_count || 0, 10),
          user_vote: newVoteState,
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/complaints/:id/comments
 */
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: "Komentar tidak boleh kosong" });
    }

    const result = await pool.query(
      `INSERT INTO comments (complaint_id, user_id, comment) 
       VALUES ($1, $2, $3) 
       RETURNING *, (SELECT name FROM users WHERE id = $2) as user_name`,
      [id, userId, sanitizeInput(comment)]
    );

    res.status(201).json({
      success: true,
      message: "Komentar berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id/comments
 */
exports.getComments = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT c.*, u.name as user_name, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = $1
      ORDER BY c.created_at DESC
    `,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/complaints/:id/history
 */
exports.getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT h.*, u.name as changed_by_name
      FROM complaint_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.complaint_id = $1
      ORDER BY h.created_at DESC
    `,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/complaints/:id/comments/:commentId
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.userId;

    const commentResult = await pool.query(
      "SELECT user_id FROM comments WHERE id = $1 AND complaint_id = $2",
      [commentId, id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Komentar tidak ditemukan" });
    }

    const comment = commentResult.rows[0];

    if (comment.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki akses menghapus komentar ini" });
    }

    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);

    res.json({ success: true, message: "Komentar berhasil dihapus" });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/complaints/:id
 */
exports.delete = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkResult = await client.query(
      "SELECT user_id, image_url FROM complaints WHERE id = $1",
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = checkResult.rows[0];

    if (complaint.user_id !== userId && !["admin", "petugas", "supervisor"].includes(req.user.role)) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Anda tidak memiliki akses untuk menghapus pengaduan ini" });
    }

    const imagesResult = await client.query(
      "SELECT image_path FROM complaint_images WHERE complaint_id = $1",
      [id]
    );

    await client.query("DELETE FROM complaints WHERE id = $1", [id]);

    await client.query("COMMIT");

    for (const img of imagesResult.rows) {
      if (img.image_path) {
        cloudinary.uploader.destroy(img.image_path).catch((err) =>
          console.error("Cloudinary cleanup error during complaint deletion:", err)
        );
      }
    }

    res.json({ success: true, message: "Pengaduan berhasil dihapus" });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};
