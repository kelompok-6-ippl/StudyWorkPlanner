import React from 'react';
import { Clock, Calendar, CheckSquare, Square, Edit, Trash2 } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const DAYS_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete }) {
  const isDone = task.status === 'selesai';

  const badgeClass = {
    TOP: 'badge-top',
    HIGH: 'badge-high',
    MEDIUM: 'badge-med',
    LOW: 'badge-low'
  }[task.priority_label || 'LOW'];

  return (
    <div className={`task-card ${isDone ? 'done' : ''}`}>
      <button
        onClick={() => onToggleStatus(task.id)}
        style={{ background: 'none', border: 'none', padding: 0, color: isDone ? 'var(--primary)' : 'var(--muted)' }}
      >
        {isDone ? <CheckSquare size={22} /> : <Square size={22} />}
      </button>

      <div className="task-content">
        <div className="task-header">
          <div>
            <h4>{task.title}</h4>
            {task.description && (
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                {task.description}
              </p>
            )}
          </div>
          <span className={`badge ${badgeClass}`}>
            {task.priority_label || 'LOW'} ({task.priority_score})
          </span>
        </div>

        <div className="task-meta">
          {task.category_name && (
            <span className="cat-pill">
              <span className="cat-dot" style={{ backgroundColor: task.category_color || '#3B82F6' }} />
              {task.category_name}
            </span>
          )}

          {task.type === 'fixed' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              {formatDate(task.start_time)} - {formatDate(task.end_time)}
            </span>
          )}

          {task.type === 'deadline' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#DC2626' }}>
              <Calendar size={13} />
              Deadline: {formatDate(task.deadline)} ({task.estimated_duration_hours || 1} jam)
            </span>
          )}

          {task.type === 'routine' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              Rutin: {task.routine_time} (
              {(task.routine_days || []).map((d) => DAYS_NAMES[d]).join(', ')}
              )
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => onEdit(task)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', padding: '2px' }}
          title="Edit Tugas"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '2px' }}
          title="Hapus Tugas"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
