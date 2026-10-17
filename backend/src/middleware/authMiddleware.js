const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'studywork_super_secret_jwt_key_2025', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Sesi tidak valid atau telah kedaluwarsa' });
    }
    req.user = user;
    next();
  });
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak: Memerlukan izin SuperAdmin' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireSuperAdmin
};
