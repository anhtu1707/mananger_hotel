import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
};

// Menu services
export const menuService = {
  getAll: async (params) => {
    const response = await api.get('/menu', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/menu', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/menu/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },
};

// Employee services
export const employeeService = {
  getAll: async (params) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
};

// Table services
export const tableService = {
  getAll: async (params) => {
    const response = await api.get('/tables', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/tables/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/tables', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tables/${id}`, data);
    return response.data;
  },
  
  updateStatus: async (id, status) => {
    const response = await api.patch(`/tables/${id}/status?status=${status}`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },
};

// Inventory services
export const inventoryService = {
  getAll: async (params) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  
  updateQuantity: async (id, quantityChange) => {
    const response = await api.patch(`/inventory/${id}/quantity?quantity_change=${quantityChange}`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
};

// Order services
export const orderService = {
  getAll: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },
  
  updateItemStatus: async (orderId, itemId, status) => {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/status?status=${status}`);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

// Bill services
export const billService = {
  getAll: async (params) => {
    const response = await api.get('/bills', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },
  
  getByOrderId: async (orderId) => {
    const response = await api.get(`/bills/order/${orderId}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/bills', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/bills/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/bills/${id}`);
    return response.data;
  },
};

// Report services
export const reportService = {
  getDailyRevenue: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/reports/revenue/daily', { params });
    return response.data;
  },
  
  getMonthlyRevenue: async (year, month) => {
    const response = await api.get('/reports/revenue/monthly', { params: { year, month } });
    return response.data;
  },
  
  getRevenueByRange: async (startDate, endDate) => {
    const response = await api.get('/reports/revenue/range', { 
      params: { start_date: startDate, end_date: endDate } 
    });
    return response.data;
  },
  
  getBestsellers: async (days = 30, limit = 10) => {
    const response = await api.get('/reports/bestsellers', { params: { days, limit } });
    return response.data;
  },
};

// User services
export const userService = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  getAll: async (params) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export default api;