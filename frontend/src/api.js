// ============================================
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


// Delivery endpoints
export const deliveryAPI = {
  getMyOrders: () => api.get('/delivery/my-orders'),
  getAvailable: () => api.get('/delivery/available'),
  getTaken: () => api.get('/delivery/taken'),
  updateStatus: (id, status) => api.put(`/delivery/${id}/status`, { status }),
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

// Analytics endpoints (Finance Dashboard)
export const analyticsAPI = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getTimeseries: (params) => api.get('/analytics/timeseries', { params }),
  getPaymentMix: (params) => api.get('/analytics/payment-mix', { params }),
  getOrders: (params) => api.get('/analytics/orders', { params }),
  getProfitSummary: (params) => api.get('/analytics/profit/summary', { params }),
  getCategoryProfit: (params) => api.get('/analytics/profit/categories', { params }),
  getProductProfit: (params) => api.get('/analytics/profit/products', { params }),
  getInventoryMetrics: (params) => api.get('/analytics/inventory', { params }),
  getCashflow: (params) => api.get('/analytics/cashflow', { params }),
  getComparative: (params) => api.get('/analytics/comparative', { params }),
  getAlerts: (params) => api.get('/analytics/alerts', { params }),
};

// Branch endpoints
export const branchAPI = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Expense endpoints
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Settings endpoints
export const settingsAPI = {
  // Profile
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  
  // Security
  getSecurity: () => api.get('/settings/security'),
  updateSecurity: (data) => api.put('/settings/security', data),
  revokeSession: (sessionId) => api.delete(`/settings/security/sessions/${sessionId}`),
  signOutAllSessions: () => api.delete('/settings/security/sessions/all'),
  
  // Notifications
  getNotifications: () => api.get('/settings/notifications'),
  updateNotifications: (data) => api.put('/settings/notifications', data),
  
  // Storefront
  getStorefront: () => api.get('/settings/storefront'),
  updateStorefront: (data) => api.put('/settings/storefront', data),
  
  // Billing
  getBilling: () => api.get('/settings/billing'),
  updateBilling: (data) => api.put('/settings/billing', data),
  
  // Integrations
  getIntegrations: () => api.get('/settings/integrations'),
  updateIntegrations: (data) => api.put('/settings/integrations', data),
  
  // Audit
  getAudit: () => api.get('/settings/audit'),
  addAuditEntry: (data) => api.post('/settings/audit', data),
};

export default api;