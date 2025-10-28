
// FILE: client/src/api.js (COMPLETE)
// ============================================
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

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

// Category endpoints
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (formData) => api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Product endpoints
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/lowstock'),
};

// Order endpoints - ENHANCED VERSION
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),  // Enhanced with params
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getTodaySales: () => api.get('/orders/today'),  // NEW ENDPOINT
  cancelOrder: (id, data) => api.put(`/orders/${id}/cancel`, data),  // NEW ENDPOINT
  refundOrder: (id, data) => api.post(`/orders/${id}/refund`, data),  // NEW ENDPOINT
  getSalesReport: (params) => api.get('/orders/report', { params }),  // NEW ENDPOINT
};

// Report endpoints
export const reportAPI = {
  getSales: (params) => api.get('/reports/sales', { params }),
  getFinancial: (params) => api.get('/reports/financial', { params }),
};


// Customer API (public)
export const customerAPI = {
  create: (data) => api.post('/customers', data),
  placeOrder: (data) => api.post('/customers/order', data),
};


export default api;


export const getProducts = (params) => api.get("/products", { params });
export const createOrder = (data) => api.post("/orders", data);