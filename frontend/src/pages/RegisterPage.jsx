import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage({ onNavigateToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Gagal mendaftar akun baru');
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
          <p>Buat Akun Mahasiswa Baru</p>
        </div>
      </div>

      <div className="auth-card">
        <h2>Daftar Akun</h2>
        <p className="sub">Isi data dirimu untuk mulai merencanakan tugas.</p>

        {error && <div className="form-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nama Lengkap</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ringo Noer"
              required
            />
          </div>

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

          <div className="field">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>
      </div>

      <div className="auth-foot">
        Sudah punya akun?{' '}
        <button
          type="button"
          onClick={onNavigateToLogin}
          style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, textDecoration: 'underline' }}
        >
          Masuk di sini
        </button>
      </div>
    </div>
  );
}
