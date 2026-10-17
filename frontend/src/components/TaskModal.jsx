import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function toDateTimeLocal(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskModal({ isOpen, onClose, taskToEdit, categories, onSave }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('deadline');
  const [categoryId, setCategoryId] = useState('');
  const [importance, setImportance] = useState(3);
  const [difficulty, setDifficulty] = useState(3);

  // Conditional fields
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState(1.5);
  const [routineTime, setRoutineTime] = useState('08:00');
  const [routineDays, setRoutineDays] = useState([0, 1, 2, 3, 4]); // Mon-Fri default

  // Conflict modal state
  const [conflictData, setConflictData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setType(taskToEdit.type || 'deadline');
      setCategoryId(taskToEdit.category_id || '');
      setImportance(taskToEdit.importance || 3);
      setDifficulty(taskToEdit.difficulty || 3);
      setStartTime(toDateTimeLocal(taskToEdit.start_time));
      setEndTime(toDateTimeLocal(taskToEdit.end_time));
      setDeadline(toDateTimeLocal(taskToEdit.deadline));
      setDuration(taskToEdit.estimated_duration_hours || 1.5);
      setRoutineTime(taskToEdit.routine_time || '08:00');
      setRoutineDays(taskToEdit.routine_days || [0, 1, 2, 3, 4]);
    } else {
      setTitle('');
      setDescription('');
      setType('deadline');
      setCategoryId(categories[0]?.id || '');
      setImportance(3);
      setDifficulty(3);

      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 0, 0);
      setDeadline(toDateTimeLocal(d.toISOString()));

      const now = new Date();
      setStartTime(toDateTimeLocal(now.toISOString()));
      now.setHours(now.getHours() + 2);
      setEndTime(toDateTimeLocal(now.toISOString()));
    }
    setConflictData(null);
    setErrorMsg('');
  }, [taskToEdit, isOpen]);

  const toggleDay = (idx) => {
    if (routineDays.includes(idx)) {
      setRoutineDays(routineDays.filter((d) => d !== idx));
    } else {
      setRoutineDays([...routineDays, idx].sort());
    }
  };

  const handleFormSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Judul tugas wajib diisi');
      return;
    }

    const payload = {
      title: title.trim(),
      description,
      type,
      category_id: categoryId || null,
      importance: Number(importance),
      difficulty: Number(difficulty),
      start_time: type === 'fixed' ? startTime : null,
      end_time: type === 'fixed' ? endTime : null,
      deadline: type === 'deadline' ? deadline : null,
      estimated_duration_hours: Number(duration),
      routine_time: type === 'routine' ? routineTime : null,
      routine_days: type === 'routine' ? routineDays : null
    };

    try {
      setLoading(true);
      await onSave(payload, taskToEdit?.id, force);
      onClose();
    } catch (err) {
      if (err.status === 409 && err.data?.conflictDetected) {
        setConflictData(err.data);
      } else {
        setErrorMsg(err.message || 'Gagal menyimpan tugas');
      }
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (conflictData?.suggestion) {
      setStartTime(toDateTimeLocal(conflictData.suggestion.start_time));
      setEndTime(toDateTimeLocal(conflictData.suggestion.end_time));
      setConflictData(null);
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="grabber" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px' }}>
            {taskToEdit ? 'Edit Tugas' : 'Tambah Tugas Baru'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && <div className="form-err">{errorMsg}</div>}

        {conflictData && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: 600, marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <span>Konflik Jadwal Terdeteksi (FR-04)</span>
            </div>

            {conflictData.conflicts.collisions?.length > 0 && (
              <p style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>
                • Bertabrakan jam dengan tugas: <b>{conflictData.conflicts.collisions[0].task.title}</b>
              </p>
            )}

            {conflictData.conflicts.buffers?.length > 0 && (
              <p style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>
                • Jeda istirahat &lt; 30 menit dari tugas: <b>{conflictData.conflicts.buffers[0].task.title}</b> ({conflictData.conflicts.buffers[0].gapMinutes} menit)
              </p>
            )}

            {conflictData.conflicts.overload?.length > 0 && (
              <p style={{ fontSize: '13px', color: '#92400E', marginBottom: '4px' }}>
                • Beban harian ({conflictData.conflicts.overload[0].loadHours} jam) melebihi kapasitas {conflictData.conflicts.overload[0].capacityHours} jam/hari.
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {conflictData.suggestion && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                  onClick={applySuggestion}
                >
                  Pakai Slot Saran
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                onClick={(e) => handleFormSubmit(e, true)}
              >
                Tetap Simpan
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleFormSubmit(e, false)}>
          <div className="field">
            <label>Judul Tugas <span className="req">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="Contoh: Quiz Matematika Diskrit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Deskripsi (Opsional)</label>
            <textarea
              className="input"
              placeholder="Detail instruksi, bahan materi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="row2">
            <div className="field">
              <label>Tipe Tugas</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="deadline">Deadline</option>
                <option value="fixed">Fixed-time</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div className="field">
              <label>Kategori</label>
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tanpa Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional: Fixed-time */}
          {type === 'fixed' && (
            <div className="row2">
              <div className="field">
                <label>Waktu Mulai <span className="req">*</span></label>
                <input
                  type="datetime-local"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Waktu Selesai <span className="req">*</span></label>
                <input
                  type="datetime-local"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Conditional: Deadline */}
          {type === 'deadline' && (
            <div className="row2">
              <div className="field">
                <label>Batas Waktu (Deadline) <span className="req">*</span></label>
                <input
                  type="datetime-local"
                  className="input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Estimasi Durasi (Jam)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="input"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Conditional: Routine */}
          {type === 'routine' && (
            <>
              <div className="field">
                <label>Jam Mulai Rutin</label>
                <input
                  type="time"
                  className="input"
                  value={routineTime}
                  onChange={(e) => setRoutineTime(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Hari Rutin</label>
                <div className="days">
                  {DAYS.map((name, idx) => (
                    <div
                      key={idx}
                      className={`day ${routineDays.includes(idx) ? 'on' : ''}`}
                      onClick={() => toggleDay(idx)}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="row2">
            <div className="field">
              <label>Tingkat Kepentingan: {importance}/5</label>
              <input
                type="range"
                min="1"
                max="5"
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="field">
              <label>Tingkat Kesulitan: {difficulty}/5</label>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
