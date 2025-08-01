import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

// Response interceptor to handle auth errors
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
  login: (credentials) => api.post('/auth/login', credentials),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  verify: () => api.get('/auth/verify'),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getRecentBookings: () => api.get('/dashboard/recent-bookings'),
  getRoomOccupancy: () => api.get('/dashboard/room-occupancy'),
  getRevenueChart: () => api.get('/dashboard/revenue-chart'),
  getBookingStatus: () => api.get('/dashboard/booking-status'),
  getPopularRooms: () => api.get('/dashboard/popular-rooms'),
  getTodaysActivity: () => api.get('/dashboard/todays-activity'),
  getPaymentsSummary: () => api.get('/dashboard/payments-summary'),
};

// Rooms API
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
};

// Guests API
export const guestsAPI = {
  getAll: (params) => api.get('/guests', { params }),
  getById: (id) => api.get(`/guests/${id}`),
  create: (data) => api.post('/guests', data),
  update: (id, data) => api.put(`/guests/${id}`, data),
  delete: (id) => api.delete(`/guests/${id}`),
  search: (term) => api.get(`/guests/search/${term}`),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  checkIn: (id) => api.post(`/bookings/${id}/checkin`),
  checkOut: (id) => api.post(`/bookings/${id}/checkout`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
  addPayment: (id, data) => api.post(`/bookings/${id}/payment`, data),
};

// Staff API
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  updatePassword: (id, data) => api.put(`/staff/${id}/password`, data),
  deactivate: (id) => api.patch(`/staff/${id}/deactivate`),
  activate: (id) => api.patch(`/staff/${id}/activate`),
  delete: (id) => api.delete(`/staff/${id}`),
};

export default api;