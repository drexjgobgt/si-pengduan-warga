const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/database");
const {
  validateEmail,
  validatePassword,
  sanitizeInput,
} = require("../utils/Validator");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../services/emailService");

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, nik, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Nama, email, dan password wajib diisi",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Format email tidak valid" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ error: "Password minimal 6 karakter" });
    }

    // Sanitize inputs
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, nik, password_hash) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, phone, nik, hashedPassword]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      token,
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email atau NIK sudah terdaftar" });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email dan password wajib diisi",
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Email atau password salah",
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: "Email atau password salah",
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, name, email, phone, nik, role, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), phone = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, name, email, phone, role`,
      [name, phone, userId]
    );

    res.json({
      success: true,
      message: "Profile berhasil diupdate",
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi" });
    }

    // Find user
    const userResult = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1",
      [email]
    );

    // Don't reveal if user exists (security)
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: "Jika email terdaftar, link reset password akan dikirim",
      });
    }

    const user = userResult.rows[0];

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    // Send email
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({
      success: true,
      message: "Link reset password telah dikirim ke email Anda",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token dan password baru wajib diisi",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: "Password minimal 6 karakter",
      });
    }

    // Find valid token
    const tokenResult = await pool.query(
      `SELECT prt.*, u.id as user_id
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 
         AND prt.expires_at > NOW()
         AND prt.used = FALSE`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: "Token tidak valid atau sudah kadaluarsa",
      });
    }

    const resetToken = tokenResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashedPassword, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
      [resetToken.id]
    );

    res.json({
      success: true,
      message: "Password berhasil direset",
    });
  } catch (error) {
    next(error);
  }
};
