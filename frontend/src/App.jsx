import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';

import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
import Drawer from './components/Drawer';
import TaskModal from './components/TaskModal';
import ConfirmModal from './components/ConfirmModal';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TaskListPage from './pages/TaskListPage';
import AIPage from './pages/AIPage';
import CategoryPage from './pages/CategoryPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const { user, loading, logout } = useAuth();

  // Navigation state
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  // Reload trigger for child pages
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCategories = async () => {
    if (user) {
      try {
        const res = await api.getCategories();
        setCategories(res.categories || []);
      } catch (err) {
        console.error('Failed to load categories in app:', err);
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>
        Memuat StudyWork Planner...
      </div>
    );
  }

  // Not logged in -> Show Auth screens
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView('register')} />;
  }

  // Open Task Modal for Add
  const handleOpenAddTask = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  // Open Task Modal for Edit
  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (payload, taskId, force = false) => {
    if (taskId) {
      await api.updateTask(taskId, payload, force);
    } else {
      await api.createTask(payload, force);
    }
    setRefreshKey((prev) => prev + 1);
  };

  const pageTitles = {
    dashboard: 'Dashboard',
    kuliah: 'Tugas Kuliah',
    pribadi: 'Tugas Pribadi',
    ai: 'AI Recommendation',
    kategori: 'Kategori Tugas',
    admin: 'Admin Panel'
  };

  return (
    <>
      <Topbar
        title={pageTitles[currentTab] || 'StudyWork Planner'}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <main className="main" key={refreshKey}>
        {currentTab === 'dashboard' && (
          <DashboardPage
            user={user}
            onOpenTaskModal={handleOpenAddTask}
            onEditTask={handleEditTask}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}
        {currentTab === 'kuliah' && (
          <TaskListPage
            scope="kuliah"
            onOpenTaskModal={handleOpenAddTask}
            onEditTask={handleEditTask}
          />
        )}
        {currentTab === 'pribadi' && (
          <TaskListPage
            scope="pribadi"
            onOpenTaskModal={handleOpenAddTask}
            onEditTask={handleEditTask}
          />
        )}
        {currentTab === 'ai' && <AIPage onEditTask={handleEditTask} />}
        {currentTab === 'kategori' && <CategoryPage />}
        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Floating Action Button for adding task */}
      {currentTab !== 'admin' && currentTab !== 'kategori' && (
        <button className="fab" onClick={handleOpenAddTask} aria-label="Tambah Tugas">
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Side Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onConfirmLogout={() => setConfirmLogoutOpen(true)}
      />

      {/* Task Add/Edit Modal (UISW09) */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        categories={categories}
        onSave={handleSaveTask}
      />

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={confirmLogoutOpen}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun StudyWork Planner?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        isDanger={true}
        onCancel={() => setConfirmLogoutOpen(false)}
        onConfirm={() => {
          setConfirmLogoutOpen(false);
          logout();
        }}
      />
    </>
  );
}
