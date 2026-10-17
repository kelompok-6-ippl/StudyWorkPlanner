import React from 'react';
import { Home, BookOpen, User, Sparkles, Tag, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Drawer({ isOpen, onClose, currentTab, onSelectTab, onConfirmLogout }) {
  const { user } = useAuth();
  if (!isOpen || !user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'kuliah', label: 'Tugas Kuliah', icon: BookOpen },
    { id: 'pribadi', label: 'Tugas Pribadi', icon: User },
    { id: 'ai', label: 'AI Recommendation', icon: Sparkles },
    { id: 'kategori', label: 'Kategori Tugas', icon: Tag }
  ];

  if (user.role === 'superadmin') {
    menu.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <div className="avatar">{initials}</div>
          <b>{user.name}</b>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>{user.email}</div>
          <span className="role-chip">
            {user.role === 'superadmin' ? 'SUPERADMIN' : 'MAHASISWA'}
          </span>
        </div>

        <nav>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={active ? 'on' : ''}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="drawer-foot">
          <button
            className="btn btn-secondary btn-block"
            style={{ color: 'var(--danger)', borderColor: '#FECACA' }}
            onClick={() => {
              onClose();
              onConfirmLogout();
            }}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
