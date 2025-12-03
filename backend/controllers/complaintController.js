const pool = require("../config/database");
const { classifyComplaint } = require("../services/classificationService");
const { sendStatusUpdateEmail } = require("../services/emailService");
const { sanitizeInput } = require("../utils/Validator");

exports.getAll = async (req, res, next) => {
  try {
    const {
      status,
      category,
      limit = 50,
      offset = 0,
      search,
      priority,
    } = req.query;

    let query = `
      SELECT c.*, cat.name as category_name, cat.color as category_color,
             u.name as user_name, 
             COUNT(DISTINCT v.id) as vote_count,
             COUNT(DISTINCT cm.id) as comment_count
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
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

    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY c.id, cat.name, cat.color, u.name 
               ORDER BY c.created_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count with same filters
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

    if (search) {
      countQuery += ` AND (c.title ILIKE $${countParamIndex} OR c.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT c.*, cat.name as category_name, cat.color as category_color,
             auto_cat.name as auto_category_name,
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             resp.name as responder_name
      FROM complaints c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN categories auto_cat ON c.auto_category_id = auto_cat.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users resp ON c.response_by = resp.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Pengaduan tidak ditemukan",
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      title,
      description,
      location_address,
      location_lat,
      location_lng,
      image_url,
    } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!title || !description) {
      return res.status(400).json({
        error: "Judul dan deskripsi wajib diisi",
      });
    }

    // Sanitize inputs
    const cleanTitle = sanitizeInput(title);
    const cleanDescription = sanitizeInput(description);

    // Perform AI classification
    const classification = await classifyComplaint(
      `${cleanTitle} ${cleanDescription}`
    );

    // Get category ID
    const categoryResult = await client.query(
      "SELECT id FROM categories WHERE name = $1",
      [classification.category]
    );

    const autoCategoryId = categoryResult.rows[0]?.id;

    // Insert complaint
    const complaintResult = await client.query(
      `INSERT INTO complaints 
       (user_id, title, description, auto_category_id, category_id, 
        confidence_score, location_address, location_lat, location_lng, image_url)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        cleanTitle,
        cleanDescription,
        autoCategoryId,
        classification.confidence,
        location_address,
        location_lat,
        location_lng,
        image_url,
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

    // Add history
    await client.query(
      `INSERT INTO complaint_history (complaint_id, status, note, changed_by) 
       VALUES ($1, $2, $3, $4)`,
      [complaint.id, "pending", "Pengaduan dibuat", userId]
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

exports.updateStatus = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { status, note, response_text } = req.body;
    const userId = req.user.userId;

    // Get complaint details
    const complaintResult = await client.query(
      "SELECT c.*, u.email, u.name FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = $1",
      [id]
    );

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: "Pengaduan tidak ditemukan" });
    }

    const complaint = complaintResult.rows[0];

    // Update complaint
    await client.query(
      `UPDATE complaints 
       SET status = $1, response_text = $2, 
           response_by = $3, response_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, response_text, userId, id]
    );

    // Add history
    await client.query(
      `INSERT INTO complaint_history (complaint_id, status, note, changed_by) 
       VALUES ($1, $2, $3, $4)`,
      [id, status, note || `Status diubah menjadi ${status}`, userId]
    );

    await client.query("COMMIT");

    // Send email notification (async)
    sendStatusUpdateEmail(complaint.email, complaint.title, status).catch(
      (err) => console.error("Failed to send email:", err)
    );

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

exports.vote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      `INSERT INTO votes (complaint_id, user_id, vote_type) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (complaint_id, user_id) DO NOTHING`,
      [id, userId, "support"]
    );

    // Get updated vote count
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM votes WHERE complaint_id = $1",
      [id]
    );

    res.json({
      success: true,
      message: "Vote berhasil ditambahkan",
      voteCount: parseInt(result.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
};

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

module.exports = exports;
