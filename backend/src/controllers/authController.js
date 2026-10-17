const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'studywork_super_secret_jwt_key_2025',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Nama lengkap minimal 3 karakter' });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    // Check existing
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar dalam sistem' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role, daily_capacity_hours) 
       VALUES ($1, $2, $3, 'mahasiswa', 8.0) 
       RETURNING id, name, email, role, daily_capacity_hours, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const newUser = userResult.rows[0];

    // Seed default categories for this new user
    const defaultCats = [
      ['Quiz', '#EF4444', 'kuliah'],
      ['Assessment', '#8B5CF6', 'kuliah'],
      ['Tugas Harian', '#3B82F6', 'kuliah'],
      ['Praktikum', '#0EA5E9', 'kuliah'],
      ['Olahraga', '#22C55E', 'pribadi'],
      ['Pekerjaan', '#F59E0B', 'pribadi'],
      ['Keluarga', '#EC4899', 'pribadi']
    ];

    for (const [cName, color, type] of defaultCats) {
      await db.query(
        'INSERT INTO categories (user_id, name, color, type) VALUES ($1, $2, $3, $4)',
        [newUser.id, cName, color, type]
      );
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di StudyWork Planner.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat registrasi' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const result = await db.query(
      'SELECT id, name, email, password_hash, role, daily_capacity_hours FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password tidak valid' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password tidak valid' });
    }

    const token = generateToken(user);
    delete user.password_hash;

    return res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login' });
  }
}

async function getMe(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, daily_capacity_hours, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data profil' });
  }
}

async function updateCapacity(req, res) {
  try {
    const { capacity } = req.body;
    const hours = Number(capacity);

    if (isNaN(hours) || hours < 1 || hours > 24) {
      return res.status(400).json({ success: false, message: 'Kapasitas jam harus antara 1 sampai 24 jam/hari' });
    }

    const result = await db.query(
      'UPDATE users SET daily_capacity_hours = $1 WHERE id = $2 RETURNING id, name, email, role, daily_capacity_hours',
      [hours, req.user.id]
    );

    return res.json({ success: true, message: 'Kapasitas harian berhasil diperbarui', user: result.rows[0] });
  } catch (error) {
    console.error('UpdateCapacity error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kapasitas harian' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateCapacity
};
