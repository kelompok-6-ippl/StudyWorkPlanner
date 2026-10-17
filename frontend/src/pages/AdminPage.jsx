import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Users, UserCheck } from 'lucide-react';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mahasiswa');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAllUsers(roleFilter);
      setUsers(res.users || []);
      setStats(res.stats);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const openAddModal = () => {
    setEditUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('mahasiswa');
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.updateUser(editUser.id, { name, email, password: password || undefined, role });
      } else {
        await api.createUser({ name, email, password, role });
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data user');
    }
  };

  const handleDelete = async (id, userName) => {
    if (window.confirm(`Hapus user "${userName}"? Seluruh tugas, kategori, dan mood user ini akan ikut terhapus otomatis (cascading delete).`)) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (err) {
        alert(err.message || 'Gagal menghapus user');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Shield size={22} color="var(--primary)" />
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Admin Panel (FR-11)</h3>
      </div>

      {/* Admin Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div className="stat-card" style={{ padding: '10px' }}>
          <div className="stat-val" style={{ fontSize: '20px' }}>{stats?.totalUsers || 0}</div>
          <div className="stat-lbl">Total Users</div>
        </div>
        <div className="stat-card" style={{ padding: '10px' }}>
          <div className="stat-val" style={{ fontSize: '20px', color: 'var(--ok)' }}>{stats?.totalStudents || 0}</div>
          <div className="stat-lbl">Mahasiswa</div>
        </div>
        <div className="stat-card" style={{ padding: '10px' }}>
          <div className="stat-val" style={{ fontSize: '20px', color: 'var(--danger)' }}>{stats?.totalAdmins || 0}</div>
          <div className="stat-lbl">SuperAdmin</div>
        </div>
      </div>

      {/* Filter and Add Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <select
          className="input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ flex: 1, minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
        >
          <option value="all">Semua Role</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="superadmin">SuperAdmin</option>
        </select>
        <button className="btn btn-primary" style={{ padding: '6px 14px', minHeight: '38px', fontSize: '13px' }} onClick={openAddModal}>
          <Plus size={14} /> Tambah User
        </button>
      </div>

      {/* User List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Memuat data pengguna...</div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--muted)' }}>Tidak ada user ditemukan.</p>
        </div>
      ) : (
        users.map((u) => (
          <div
            key={u.id}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              marginBottom: '8px',
              boxShadow: 'var(--shadow)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <b style={{ fontSize: '14.5px' }}>{u.name}</b>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: u.role === 'superadmin' ? '#FEE2E2' : '#EFF6FF',
                    color: u.role === 'superadmin' ? '#991B1B' : '#1E40AF'
                  }}
                >
                  {u.role.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                {u.email} • {u.total_tasks || 0} tugas terdaftar
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openEditModal(u)} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(u.id, u.name)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal Add/Edit User */}
      {modalOpen && (
        <div className="modal-bg">
          <div className="modal modal-center">
            <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
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
                <label>Password {editUser && '(Kosongkan jika tidak diubah)'}</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editUser ? 'Biarkan kosong untuk password lama' : 'Minimal 6 karakter'}
                  required={!editUser}
                />
              </div>

              <div className="field">
                <label>Role Pengguna</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
