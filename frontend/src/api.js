// ============================================
// FILE: client/src/api.js (WITH DEBUGGING)
// ============================================
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add token and log requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Log responses and handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - Redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

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

// Order endpoints
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getTodaySales: () => api.get('/orders/today'),
  cancelOrder: (id, data) => api.put(`/orders/${id}/cancel`, data),
  refundOrder: (id, data) => api.post(`/orders/${id}/refund`, data),
  getSalesReport: (params) => api.get('/orders/report', { params }),
};

// Public endpoints (no auth required)
export const publicAPI = {
  getProducts: (params) => axios.get(`${API_BASE_URL}/public/products`, { params }),
  getCategories: () => axios.get(`${API_BASE_URL}/public/categories`),
  createOrder: (data) => axios.post(`${API_BASE_URL}/public/orders`, data),
};

// Customer endpoints
export const customerAPI = {
  create: (data) => api.post('/customers', data),
  placeOrder: (data) => api.post('/customers/order', data),
};

export default api;