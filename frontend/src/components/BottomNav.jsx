import React from 'react';
import { Home, BookOpen, User, Sparkles, Tag } from 'lucide-react';

export default function BottomNav({ currentTab, onSelectTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'kuliah', label: 'Kuliah', icon: BookOpen },
    { id: 'pribadi', label: 'Pribadi', icon: User },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'kategori', label: 'Kategori', icon: Tag }
  ];

  return (
    <nav className="bottomnav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            className={isActive ? 'on' : ''}
            onClick={() => onSelectTab(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
