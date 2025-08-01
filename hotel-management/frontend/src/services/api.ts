import axios, { AxiosResponse } from 'axios';
import {
  User,
  LoginCredentials,
  AuthResponse,
  Room,
  RoomFormData,
  Guest,
  GuestFormData,
  Booking,
  BookingFormData,
  Staff,
  StaffFormData,
  Service,
  DashboardStats,
  RecentActivity,
  RevenueChart,
  RoomOccupancy,
  RoomType,
  PaginatedResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
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
  login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', credentials),
  
  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/profile'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<{ message: string }>> =>
    api.put('/auth/change-password', data),
};

// Rooms API
export const roomsAPI = {
  getRooms: (params?: {
    status?: string;
    floor?: number;
    room_type?: number;
    available_from?: string;
    available_to?: string;
  }): Promise<AxiosResponse<Room[]>> =>
    api.get('/rooms', { params }),
  
  getRoom: (id: number): Promise<AxiosResponse<Room>> =>
    api.get(`/rooms/${id}`),
  
  createRoom: (data: RoomFormData): Promise<AxiosResponse<{ message: string; roomId: number }>> =>
    api.post('/rooms', data),
  
  updateRoom: (id: number, data: Partial<RoomFormData>): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/rooms/${id}`, data),
  
  deleteRoom: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/rooms/${id}`),
  
  getRoomTypes: (): Promise<AxiosResponse<RoomType[]>> =>
    api.get('/rooms/types/all'),
};

// Guests API
export const guestsAPI = {
  getGuests: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Guest>>> =>
    api.get('/guests', { params }),
  
  getGuest: (id: number): Promise<AxiosResponse<Guest>> =>
    api.get(`/guests/${id}`),
  
  createGuest: (data: GuestFormData): Promise<AxiosResponse<{ message: string; guestId: number }>> =>
    api.post('/guests', data),
  
  updateGuest: (id: number, data: Partial<GuestFormData>): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/guests/${id}`, data),
  
  deleteGuest: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/guests/${id}`),
  
  searchGuests: (term: string): Promise<AxiosResponse<Guest[]>> =>
    api.get(`/guests/search/${term}`),
};

// Bookings API
export const bookingsAPI = {
  getBookings: (params?: {
    status?: string;
    room_id?: number;
    guest_id?: number;
    check_in_from?: string;
    check_in_to?: string;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Booking>>> =>
    api.get('/bookings', { params }),
  
  getBooking: (id: number): Promise<AxiosResponse<Booking>> =>
    api.get(`/bookings/${id}`),
  
  createBooking: (data: BookingFormData): Promise<AxiosResponse<{ message: string; bookingId: number }>> =>
    api.post('/bookings', data),
  
  checkIn: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/bookings/${id}/checkin`),
  
  checkOut: (id: number, data?: { additional_charges?: number }): Promise<AxiosResponse<{ 
    message: string; 
    finalAmount: number; 
    balanceAmount: number; 
  }>> =>
    api.post(`/bookings/${id}/checkout`, data),
  
  cancelBooking: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/bookings/${id}/cancel`),
  
  addService: (id: number, data: { service_id: number; quantity?: number }): Promise<AxiosResponse<{ 
    message: string; 
    totalPrice: number; 
  }>> =>
    api.post(`/bookings/${id}/services`, data),
};

// Staff API
export const staffAPI = {
  getStaff: (params?: {
    role?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Staff>>> =>
    api.get('/staff', { params }),
  
  getStaffMember: (id: number): Promise<AxiosResponse<Staff>> =>
    api.get(`/staff/${id}`),
  
  createStaff: (data: StaffFormData): Promise<AxiosResponse<{ message: string; staffId: number }>> =>
    api.post('/staff', data),
  
  updateStaff: (id: number, data: Partial<StaffFormData>): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/staff/${id}`, data),
  
  deleteStaff: (id: number): Promise<AxiosResponse<{ message: string; action: string }>> =>
    api.delete(`/staff/${id}`),
  
  resetPassword: (id: number, data: { newPassword: string }): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/staff/${id}/reset-password`, data),
  
  getStaffStats: (id: number): Promise<AxiosResponse<any>> =>
    api.get(`/staff/${id}/stats`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/dashboard/stats'),
  
  getRecentActivities: (limit?: number): Promise<AxiosResponse<RecentActivity[]>> =>
    api.get('/dashboard/recent-activities', { params: { limit } }),
  
  getRevenueChart: (year?: number): Promise<AxiosResponse<RevenueChart[]>> =>
    api.get('/dashboard/revenue-chart', { params: { year } }),
  
  getRoomOccupancy: (): Promise<AxiosResponse<RoomOccupancy[]>> =>
    api.get('/dashboard/room-occupancy'),
  
  getUpcoming: (days?: number): Promise<AxiosResponse<{ 
    checkins: any[]; 
    checkouts: any[]; 
  }>> =>
    api.get('/dashboard/upcoming', { params: { days } }),
  
  getServices: (): Promise<AxiosResponse<Service[]>> =>
    api.get('/dashboard/services'),
};

export default api;