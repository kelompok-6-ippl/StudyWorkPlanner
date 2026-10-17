import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';

export default function Topbar({ title, onOpenDrawer, onBack, rightAction }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={22} />
        </button>
      ) : (
        <button className="icon-btn" onClick={onOpenDrawer} aria-label="Menu">
          <Menu size={22} />
        </button>
      )}
      <h1>{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
