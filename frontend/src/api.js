// ============================================
// FILE: client/src/api.js
// ============================================
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Product endpoints
export const productAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Order endpoints
export const orderAPI = {
  getAll: () => api.get('/orders'),
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
};

// Report endpoints
export const reportAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
};

export default api;