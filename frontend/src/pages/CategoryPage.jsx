import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '../api/client';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
];

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('kuliah'); // 'kuliah' or 'pribadi'
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);

  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [type, setType] = useState('kuliah');
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditCat(null);
    setName('');
    setColor('#3B82F6');
    setType(tab);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditCat(cat);
    setName(cat.name);
    setColor(cat.color);
    setType(cat.type);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editCat) {
        await api.updateCategory(editCat.id, { name, color, type });
      } else {
        await api.createCategory({ name, color, type });
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus kategori ini?')) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (err) {
        alert(err.message || 'Gagal menghapus kategori');
      }
    }
  };

  const filtered = categories.filter((c) => c.type === tab);

  return (
    <div>
      {/* Scope Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${tab === 'kuliah' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, minHeight: '40px' }}
          onClick={() => setTab('kuliah')}
        >
          Kategori Kuliah
        </button>
        <button
          className={`btn ${tab === 'pribadi' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, minHeight: '40px' }}
          onClick={() => setTab('pribadi')}
        >
          Kategori Pribadi
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Daftar Kategori ({tab})</h4>
        <button className="btn btn-primary" style={{ padding: '6px 12px', minHeight: '34px', fontSize: '13px' }} onClick={openAddModal}>
          <Plus size={14} /> Tambah
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Memuat kategori...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>Belum ada kategori untuk {tab}.</p>
        </div>
      ) : (
        filtered.map((cat) => (
          <div
            key={cat.id}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: cat.color }} />
              <b style={{ fontSize: '14.5px' }}>{cat.name}</b>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => openEditModal(cat)} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal Add/Edit Category */}
      {modalOpen && (
        <div className="modal-bg">
          <div className="modal modal-center">
            <h3 style={{ fontSize: '17px', marginBottom: '14px' }}>
              {editCat ? 'Edit Kategori' : 'Tambah Kategori'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Nama Kategori</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contoh: Praktikum Basis Data"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Tipe Kategori</label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="kuliah">Kuliah</option>
                  <option value="pribadi">Pribadi</option>
                </select>
              </div>

              <div className="field">
                <label>Warna Tag</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {PRESET_COLORS.map((c) => (
                    <div
                      key={c}
                      onClick={() => setColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        cursor: 'pointer',
                        border: color === c ? '3px solid #0F172A' : '1px solid var(--line)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
