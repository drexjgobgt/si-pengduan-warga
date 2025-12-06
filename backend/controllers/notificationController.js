const pool = require('../config/database');

exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { is_read, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT n.*, c.title as complaint_title
      FROM notifications n
      LEFT JOIN complaints c ON n.complaint_id = c.id
      WHERE n.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (is_read !== undefined) {
      query += ` AND n.is_read = $${paramIndex}`;
      params.push(is_read === 'true');
      paramIndex++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify notification belongs to user
    const notification = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Notifikasi ditandai sebagai sudah dibaca',
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sebagai sudah dibaca',
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notifikasi berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

