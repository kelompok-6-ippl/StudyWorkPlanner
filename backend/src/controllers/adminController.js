const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const { role } = req.query;

    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.daily_capacity_hours, 
        u.created_at,
        COUNT(t.id) AS total_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.user_id
    `;
    const params = [];

    if (role && role !== 'all') {
      params.push(role);
      query += ` WHERE u.role = $1`;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const result = await db.query(query, params);

    // Compute stats
    const totalUsers = result.rows.length;
    const totalStudents = result.rows.filter((u) => u.role === 'mahasiswa').length;
    const totalAdmins = result.rows.filter((u) => u.role === 'superadmin').length;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalAdmins
      },
      users: result.rows
    });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Nama lengkap minimal 3 karakter' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role === 'superadmin' ? 'superadmin' : 'mahasiswa';

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, daily_capacity_hours, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, userRole]
    );

    return res.status(201).json({
      success: true,
      message: 'User baru berhasil dibuat',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Admin CreateUser error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan user baru' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const check = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const existing = check.rows[0];
    let passwordHash = existing.password_hash;

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const userRole = role ? (role === 'superadmin' ? 'superadmin' : 'mahasiswa') : existing.role;

    const result = await db.query(
      `UPDATE users SET name = $1, email = $2, password_hash = $3, role = $4 
       WHERE id = $5 
       RETURNING id, name, email, role, daily_capacity_hours, created_at`,
      [
        name ? name.trim() : existing.name,
        email ? email.toLowerCase().trim() : existing.email,
        passwordHash,
        userRole,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Data user berhasil diperbarui',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Admin UpdateUser error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    return res.json({
      success: true,
      message: 'User beserta seluruh data terkait berhasil dihapus (cascading delete)'
    });
  } catch (error) {
    console.error('Admin DeleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus user' });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
