// =====================================================================
// API Client wrapper with JWT token handling & error formatting
// =====================================================================

const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('swp_jwt_token') || sessionStorage.getItem('swp_jwt_token') || null;
}

export function setToken(token, remember = true) {
  if (remember) {
    localStorage.setItem('swp_jwt_token', token);
    sessionStorage.removeItem('swp_jwt_token');
  } else {
    sessionStorage.setItem('swp_jwt_token', token);
    localStorage.removeItem('swp_jwt_token');
  }
}

export function clearToken() {
  localStorage.removeItem('swp_jwt_token');
  sessionStorage.removeItem('swp_jwt_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (token) {
        clearToken();
        window.location.reload();
      }
    }
    const error = new Error(data.message || 'Terjadi kesalahan pada server');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (creds) => request('/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  updateCapacity: (capacity) => request('/auth/capacity', { method: 'PUT', body: JSON.stringify({ capacity }) }),

  // Tasks
  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getDashboardStats: () => request('/tasks/dashboard-stats'),
  createTask: (payload, force = false) => request('/tasks', { method: 'POST', body: JSON.stringify({ ...payload, force }) }),
  updateTask: (id, payload, force = false) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ ...payload, force }) }),
  toggleTaskStatus: (id) => request(`/tasks/${id}/toggle-status`, { method: 'PATCH' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (type) => request(`/categories${type ? `?type=${type}` : ''}`),
  createCategory: (payload) => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Moods & AI
  getLatestMood: () => request('/moods/latest'),
  logMood: (level) => request('/moods/log', { method: 'POST', body: JSON.stringify({ level }) }),
  getRecommendations: () => request('/moods/recommendations'),

  // Admin
  getAllUsers: (role) => request(`/admin/users${role ? `?role=${role}` : ''}`),
  createUser: (payload) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' })
};
