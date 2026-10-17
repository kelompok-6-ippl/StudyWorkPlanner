import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { api } from '../api/client';
import TaskCard from '../components/TaskCard';

export default function TaskListPage({ scope, onOpenTaskModal, onEditTask }) {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        scope,
        status: statusFilter,
        priority: priorityFilter,
        sort: sortBy,
        q: searchQuery
      });
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [scope, statusFilter, priorityFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTasks();
  };

  const handleToggleStatus = async (taskId) => {
    try {
      await api.toggleTaskStatus(taskId);
      loadTasks();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Hapus tugas ini?')) {
      try {
        await api.deleteTask(taskId);
        loadTasks();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="input"
            placeholder={`Cari tugas ${scope}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', minHeight: '42px' }}
          />
          <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ minHeight: '42px', padding: '0 16px' }}>
          Cari
        </button>
      </form>

      {/* Filter and Sort Toolbar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
        >
          <option value="all">Semua Status</option>
          <option value="belum">Belum</option>
          <option value="sedang">Sedang</option>
          <option value="selesai">Selesai</option>
        </select>

        <select
          className="input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
        >
          <option value="all">Semua Prioritas</option>
          <option value="top">TOP (≥36)</option>
          <option value="high">HIGH (≥24)</option>
          <option value="med">MEDIUM (≥12)</option>
          <option value="low">LOW (&lt;12)</option>
        </select>

        <select
          className="input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ minHeight: '38px', padding: '6px 10px', fontSize: '13px' }}
        >
          <option value="priority">Urut: Prioritas</option>
          <option value="deadline">Urut: Deadline</option>
          <option value="newest">Urut: Terbaru</option>
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Memuat data tugas...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '14px' }}>
            Tidak ada tugas {scope} ditemukan.
          </p>
          <button className="btn btn-primary" onClick={() => onOpenTaskModal()}>
            <Plus size={16} /> Tambah Tugas Baru
          </button>
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleStatus={handleToggleStatus}
            onEdit={onEditTask}
            onDelete={handleDeleteTask}
          />
        ))
      )}
    </div>
  );
}
