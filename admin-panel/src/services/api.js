import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    api.post('/admin/login', { username, password }),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

export const categoriesAPI = {
  getAll: (includeInactive = false) =>
    api.get(`/categories?include_inactive=${includeInactive}`),
  getById: (id) => api.get(`/categories/${id}`),
  getStats: (id) => api.get(`/categories/${id}/stats`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id, action = 'soft') =>
    api.delete(`/categories/${id}?action=${action}`),
};

export const providersAPI = {
  getAll: (filters) => api.get('/admin/providers', { params: filters }),
  updateApproval: (id, action, rejectionReason) =>
    api.put(`/admin/providers/${id}/approval`, { action, rejection_reason: rejectionReason }),
};

export const bookingsAPI = {
  getAll: (filters) => api.get('/admin/bookings', { params: filters }),
  getById: (id) => api.get(`/admin/bookings/${id}`),
};

export const usersAPI = {
  getAll: (filters) => api.get('/admin/users', { params: filters }),
  updateStatus: (id, action) =>
    api.put(`/admin/users/${id}/status`, { action }),
};

export const earningsAPI = {
  getReport: (dateFrom, dateTo, groupBy) =>
    api.get('/admin/reports/earnings', {
      params: { date_from: dateFrom, date_to: dateTo, group_by: groupBy },
    }),
};

export const settingsAPI = {
  getAll: () => api.get('/admin/settings'),
  update: (key, value) => api.put(`/admin/settings/${key}`, { value }),
};

export const notificationsAPI = {
  broadcast: (data) => api.post('/admin/notifications/broadcast', data),
};

export const commissionAPI = {
  getAll: () => api.get('/admin/commission-settings'),
  create: (data) => api.post('/admin/commission-settings', data),
};

export default api;
