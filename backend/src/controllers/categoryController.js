const db = require('../config/db');

async function getCategories(req, res) {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories WHERE user_id = $1';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY created_at ASC';
    const result = await db.query(query, params);
    return res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('GetCategories error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar kategori' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, color, type } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const catType = type === 'pribadi' ? 'pribadi' : 'kuliah';
    const catColor = color || '#3B82F6';

    const result = await db.query(
      `INSERT INTO categories (user_id, name, color, type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, name.trim(), catColor, catType]
    );

    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('CreateCategory error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat kategori baru' });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, color, type } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const check = await db.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const catType = type === 'pribadi' ? 'pribadi' : 'kuliah';
    const catColor = color || '#3B82F6';

    const result = await db.query(
      `UPDATE categories SET name = $1, color = $2, type = $3 
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [name.trim(), catColor, catType, id, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Kategori berhasil diperbarui',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('UpdateCategory error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kategori' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    return res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('DeleteCategory error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
