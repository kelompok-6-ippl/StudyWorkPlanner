import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ onNavigateToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@studywork.id');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await login(email, password, remember);
    } catch (err) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-logo">
        <div className="logo-mark">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <rect x="5" y="4" width="22" height="25" rx="4" fill="#DBEAFE"/>
            <rect x="11" y="2" width="10" height="5" rx="2" fill="#1D4ED8"/>
            <path d="m10 16 4 4 8-9" stroke="#2563EB" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h1>StudyWork Planner</h1>
          <p>Manajemen Tugas Cerdas Mahasiswa</p>
        </div>
      </div>

      <div className="auth-card">
        <h2>Masuk</h2>
        <p className="sub">Masuk ke akunmu untuk mengelola tugas.</p>

        {error && <div className="form-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Ingat Saya</span>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="demo-hint">
          <b>Akun Demo Bawaan:</b><br />
          SuperAdmin: <code>admin@studywork.id</code> / <code>admin123</code>
        </div>
      </div>

      <div className="auth-foot">
        Belum punya akun?{' '}
        <button
          type="button"
          onClick={onNavigateToRegister}
          style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
        >
          Daftar Sekarang
        </button>
      </div>
    </div>
  );
}
