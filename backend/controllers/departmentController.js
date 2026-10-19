const pool = require("../config/database");

/**
 * Controller untuk Manajemen Departemen dan Petugas
 */
const departmentController = {
  /**
   * Mendapatkan daftar semua departemen beserta statistik singkat
   */
  async getAll(req, res, next) {
    try {
      const query = `
        SELECT 
          d.id,
          d.name,
          d.code,
          d.description,
          d.created_at,
          COUNT(DISTINCT u.id) AS total_officers,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('diajukan', 'diverifikasi', 'diproses')) AS active_complaints_count,
          COUNT(DISTINCT c.id) AS total_complaints_count
        FROM departments d
        LEFT JOIN users u ON u.department_id = d.id AND u.role IN ('petugas', 'supervisor')
        LEFT JOIN complaints c ON c.department_id = d.id
        GROUP BY d.id
        ORDER BY d.name ASC;
      `;
      const result = await pool.query(query);
      return res.json({
        status: "success",
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mendapatkan daftar petugas dan supervisor dengan beban kerja aktif
   */
  async getOfficers(req, res, next) {
    try {
      const { department_id, role, search } = req.query;
      const conditions = ["u.role IN ('petugas', 'supervisor')"];
      const params = [];

      if (department_id) {
        params.push(department_id);
        conditions.push(`u.department_id = $${params.length}`);
      }

      if (role && ["petugas", "supervisor"].includes(role)) {
        params.push(role);
        conditions.push(`u.role = $${params.length}`);
      }

      if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
      }

      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.role,
          u.department_id,
          d.name AS department_name,
          d.code AS department_code,
          COUNT(c.id) FILTER (WHERE c.status IN ('diajukan', 'diverifikasi', 'diproses')) AS active_workload,
          COUNT(c.id) FILTER (WHERE c.status = 'selesai') AS completed_count
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN complaints c ON c.assigned_to = u.id
        WHERE ${conditions.join(" AND ")}
        GROUP BY u.id, d.name, d.code
        ORDER BY active_workload ASC, u.name ASC;
      `;

      const result = await pool.query(query, params);
      return res.json({
        status: "success",
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Membuat departemen baru (Admin only)
   */
  async create(req, res, next) {
    try {
      const { name, code, description } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: "Nama dan kode departemen wajib diisi" });
      }

      const query = `
        INSERT INTO departments (name, code, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), description || null]);
      return res.status(201).json({
        status: "success",
        message: "Departemen berhasil ditambahkan",
        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Nama atau kode departemen sudah terdaftar" });
      }
      next(error);
    }
  },

  /**
   * Memperbarui departemen (Admin only)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      if (!name || !code) {
        return res.status(400).json({ error: "Nama dan kode departemen wajib diisi" });
      }

      const query = `
        UPDATE departments
        SET name = $1, code = $2, description = $3
        WHERE id = $4
        RETURNING *;
      `;
      const result = await pool.query(query, [name.trim(), code.trim().toUpperCase(), description || null, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Departemen tidak ditemukan" });
      }

      return res.json({
        status: "success",
        message: "Departemen berhasil diperbarui",
        data: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Nama atau kode departemen sudah digunakan" });
      }
      next(error);
    }
  },
};

module.exports = departmentController;
