import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  getUsers: (params) => api.get('/auth/users', { params }),
  updateUser: (id, userData) => api.put(`/auth/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Menu API
export const menuAPI = {
  getItems: (params) => api.get('/menu/items', { params }),
  getItem: (id) => api.get(`/menu/items/${id}`),
  createItem: (itemData) => api.post('/menu/items', itemData),
  updateItem: (id, itemData) => api.put(`/menu/items/${id}`, itemData),
  deleteItem: (id) => api.delete(`/menu/items/${id}`),
  toggleAvailability: (id) => api.patch(`/menu/items/${id}/toggle-availability`),
  getCategories: () => api.get('/menu/categories'),
};

// Employee API
export const employeeAPI = {
  getEmployees: (params) => api.get('/employees', { params }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (employeeData) => api.post('/employees', employeeData),
  updateEmployee: (id, employeeData) => api.put(`/employees/${id}`, employeeData),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
  toggleStatus: (id) => api.patch(`/employees/${id}/toggle-status`),
  getPositions: () => api.get('/employees/data/positions'),
};

// Table API
export const tableAPI = {
  getTables: (params) => api.get('/tables', { params }),
  getTable: (id) => api.get(`/tables/${id}`),
  createTable: (tableData) => api.post('/tables', tableData),
  updateTable: (id, tableData) => api.put(`/tables/${id}`, tableData),
  deleteTable: (id) => api.delete(`/tables/${id}`),
  updateStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),
  getAvailable: () => api.get('/tables/available'),
  getStatuses: () => api.get('/tables/data/statuses'),
  getLocations: () => api.get('/tables/data/locations'),
};

// Inventory API
export const inventoryAPI = {
  getItems: (params) => api.get('/inventory', { params }),
  getItem: (id) => api.get(`/inventory/${id}`),
  createItem: (itemData) => api.post('/inventory', itemData),
  updateItem: (id, itemData) => api.put(`/inventory/${id}`, itemData),
  deleteItem: (id) => api.delete(`/inventory/${id}`),
  restock: (id, quantity) => api.patch(`/inventory/${id}/restock`, { quantity }),
  consume: (id, quantity) => api.patch(`/inventory/${id}/consume`, { quantity }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getExpired: () => api.get('/inventory/expired'),
  getUnits: () => api.get('/inventory/data/units'),
  getCategories: () => api.get('/inventory/data/categories'),
};

// Order API
export const orderAPI = {
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  addItem: (id, itemData) => api.post(`/orders/${id}/items`, itemData),
  removeItem: (itemId) => api.delete(`/orders/items/${itemId}`),
  applyDiscount: (id, discount_amount) => api.patch(`/orders/${id}/discount`, { discount_amount }),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  getStatuses: () => api.get('/orders/data/statuses'),
};

// Report API
export const reportAPI = {
  getReports: (params) => api.get('/reports', { params }),
  generateDaily: (date) => api.post('/reports/daily', null, { params: { report_date: date } }),
  generateMonthly: (year, month) => api.post('/reports/monthly', null, { params: { year, month } }),
  getRevenueByPeriod: (start_date, end_date) => api.get('/reports/revenue-by-period', { params: { start_date, end_date } }),
  getDailyChart: (start_date, end_date) => api.get('/reports/daily-chart', { params: { start_date, end_date } }),
  getTopItems: (start_date, end_date, limit = 10) => api.get('/reports/top-selling-items', { params: { start_date, end_date, limit } }),
  getDashboard: () => api.get('/reports/dashboard'),
};

export default api;