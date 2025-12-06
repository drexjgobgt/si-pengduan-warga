const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    // Verify complaint exists and user has permission
    const complaintResult = await pool.query(
      'SELECT user_id FROM complaints WHERE id = $1',
      [id]
    );

    if (complaintResult.rows.length === 0) {
      // Delete uploaded file if complaint doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Pengaduan tidak ditemukan' });
    }

    const complaint = complaintResult.rows[0];
    
    // Check if user owns the complaint or is admin/petugas
    if (complaint.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'petugas') {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    // Generate public URL
    const imageUrl = `/uploads/complaints/${req.file.filename}`;

    // Check if this is the first image (make it primary)
    const existingImages = await pool.query(
      'SELECT COUNT(*) as count FROM complaint_images WHERE complaint_id = $1',
      [id]
    );

    const isPrimary = parseInt(existingImages.rows[0].count) === 0;

    // Save to database
    const result = await pool.query(
      `INSERT INTO complaint_images 
       (complaint_id, image_url, image_path, file_name, file_size, mime_type, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        imageUrl,
        req.file.path,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        isPrimary
      ]
    );

    // Update complaint's main image_url if this is primary
    if (isPrimary) {
      await pool.query(
        'UPDATE complaints SET image_url = $1 WHERE id = $2',
        [imageUrl, id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Gambar berhasil diupload',
      data: result.rows[0]
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const userId = req.user.userId;

    // Get image info
    const imageResult = await pool.query(
      `SELECT ci.*, c.user_id 
       FROM complaint_images ci
       JOIN complaints c ON ci.complaint_id = c.id
       WHERE ci.id = $1 AND ci.complaint_id = $2`,
      [imageId, id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gambar tidak ditemukan' });
    }

    const image = imageResult.rows[0];

    // Check permission
    if (image.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'petugas') {
      return res.status(403).json({ error: 'Tidak memiliki akses' });
    }

    // Delete file from filesystem
    if (image.image_path && fs.existsSync(image.image_path)) {
      try {
        fs.unlinkSync(image.image_path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    // Delete from database
    await pool.query('DELETE FROM complaint_images WHERE id = $1', [imageId]);

    res.json({
      success: true,
      message: 'Gambar berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};

exports.getImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM complaint_images WHERE complaint_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

