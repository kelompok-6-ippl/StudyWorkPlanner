import React, { useState, useEffect } from 'react';
import { Sparkles, HeartHandshake, Clock, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

export default function AIPage({ onEditTask }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState(3);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getRecommendations();
      setData(res);
      if (res.mood) {
        setSelectedMood(res.mood.level);
      }
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleMoodChange = async (level) => {
    setSelectedMood(level);
    try {
      await api.logMood(level);
      await loadRecommendations();
    } catch (err) {
      console.error('Failed to update mood:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Menganalisis tugas & mood Anda...</div>;
  }

  return (
    <div>
      {/* Mood Selector Header */}
      <div className="mood-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <span>Kondisi Energimu Saat Ini</span>
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
          Sistem AI akan menyelaraskan kompleksitas tugas dengan kapasitas energimu.
        </p>

        <div className="mood-options">
          {(data?.allMoods || []).map((m) => (
            <button
              key={m.level}
              className={`mood-btn ${selectedMood === m.level ? 'on' : ''}`}
              onClick={() => handleMoodChange(m.level)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mental Health / Self-Care Alert (FR-08) */}
      {data?.selfCareTip && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-d)', fontWeight: 600, marginBottom: '6px' }}>
            <HeartHandshake size={20} />
            <span>Saran Self-Care & Pemulihan Energi</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#1E3A8A', lineHeight: 1.45 }}>
            {data.selfCareTip}
          </p>
        </div>
      )}

      {/* Postpone Suggestions (FR-06.4) */}
      {data?.postponed?.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <h4 style={{ fontSize: '15px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <AlertCircle size={16} /> Disarankan Ditunda Sementara
          </h4>
          {data.postponed.map((item) => (
            <div
              key={item.task.id}
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }}
            >
              <b style={{ fontSize: '14.5px', color: '#78350F' }}>{item.task.title}</b>
              <p style={{ fontSize: '12.5px', color: '#92400E', marginTop: '4px' }}>
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Tasks */}
      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
        Tugas Paling Pas Dikerjakan Sekarang
      </h4>

      {data?.recommendations?.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: 'var(--radius)' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Tidak ada tugas yang perlu disarankan saat ini.
          </p>
        </div>
      ) : (
        data.recommendations.map((item) => (
          <div
            key={item.task.id}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              marginBottom: '10px',
              boxShadow: 'var(--shadow)',
              borderLeft: '4px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 600 }}>{item.task.title}</h5>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-xl)', padding: '2px 8px', borderRadius: '6px' }}>
                Match: {item.matchScore}%
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
              💡 {item.reason}
            </p>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--muted)' }}>
              <span>Kompleksitas: <b>{item.complexity}/5</b></span>
              <span>Prioritas: <b>{item.priority.label} ({item.priority.score})</b></span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
