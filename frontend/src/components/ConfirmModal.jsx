import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Batal', isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-bg">
      <div className="modal modal-center">
        <h3 style={{ fontSize: '17px', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '18px', lineHeight: 1.4 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1 }} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
