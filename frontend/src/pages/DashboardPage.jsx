import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import TaskCard from '../components/TaskCard';

const MOODS = [
  { level: 5, emoji: '😄', label: 'Sangat Baik' },
  { level: 4, emoji: '🙂', label: 'Baik' },
  { level: 3, emoji: '😐', label: 'Netral' },
  { level: 2, emoji: '😟', label: 'Buruk' },
  { level: 1, emoji: '😢', label: 'Sangat Buruk' }
];

export default function DashboardPage({ user, onOpenTaskModal, onEditTask, onNavigateToTab }) {
  const [stats, setStats] = useState(null);
  const [nearestTasks, setNearestTasks] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, moodData] = await Promise.all([
        api.getDashboardStats(),
        api.getLatestMood()
      ]);
      setStats(statsData.stats);
      setNearestTasks(statsData.nearestTasks);
      setCurrentMood(moodData.latestMood);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectMood = async (level) => {
    try {
      await api.logMood(level);
      setCurrentMood(level);
    } catch (err) {
      console.error('Failed to log mood:', err);
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      await api.toggleTaskStatus(taskId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      try {
        await api.deleteTask(taskId);
        loadData();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Memuat Dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>
          Halo, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          Yuk cek prioritas dan kondisi tugasmu hari ini.
        </p>
      </div>

      {/* Analytics 4 Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-val">{stats?.totalTasks || 0}</div>
          <div className="stat-lbl">Total Tugas</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: '#D97706' }}>
            {stats?.totalWorkHours || 0} jam
          </div>
          <div className="stat-lbl">Waktu Kerja Aktif</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--danger)' }}>
            {stats?.highPriorityCount || 0}
          </div>
          <div className="stat-lbl">Prioritas Tinggi</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: 'var(--ok)' }}>
            {stats?.completedTasks || 0}
          </div>
          <div className="stat-lbl">Tugas Selesai</div>
        </div>
      </div>

      {/* Mood Check-In (FR-03) */}
      <div className="mood-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>Bagaimana Perasaanmu Hari Ini?</h3>
          {currentMood && (
            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
              Tercatat: {MOODS.find((m) => m.level === currentMood)?.label}
            </span>
          )}
        </div>
        <div className="mood-options">
          {MOODS.map((m) => (
            <button
              key={m.level}
              className={`mood-btn ${currentMood === m.level ? 'on' : ''}`}
              onClick={() => handleSelectMood(m.level)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 Nearest Tasks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>4 Tugas Terdekat</h3>
        <button
          onClick={() => onNavigateToTab('kuliah')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        >
          Lihat Semua <ArrowRight size={14} />
        </button>
      </div>

      {nearestTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: 'var(--radius)', border: '1px dashed var(--line)' }}>
          <CheckCircle2 size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '8px' }} />
          <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>Belum ada tugas mendesak!</h4>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
            Tambahkan tugas baru untuk mulai menyusun jadwal cerdasmu.
          </p>
          <button className="btn btn-primary" onClick={() => onOpenTaskModal()}>
            <Plus size={16} /> Tambah Tugas Sekarang
          </button>
        </div>
      ) : (
        nearestTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onToggleStatus={handleToggleStatus}
            onEdit={onEditTask}
            onDelete={handleDeleteTask}
          />
        ))
      )}
    </div>
  );
}
