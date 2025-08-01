// Auth types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Room types
export interface RoomType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  created_at: string;
}

export interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  last_cleaned: string;
  notes?: string;
  room_type_name?: string;
  description?: string;
  base_price?: number;
  max_occupancy?: number;
  amenities?: string[];
  created_at: string;
  updated_at: string;
}

// Guest types
export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  id_type?: 'passport' | 'driver_license' | 'national_id';
  id_number?: string;
  date_of_birth?: string;
  nationality?: string;
  total_bookings?: number;
  last_visit?: string;
  created_at: string;
  updated_at: string;
}

// Booking types
export interface Booking {
  id: number;
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  total_amount: number;
  advance_payment: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  created_by: number;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  room_number?: string;
  room_type_name?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// Staff types
export interface Staff {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  hire_date: string;
  salary: number;
  is_active: boolean;
  created_at: string;
}

// Service types
export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: 'food' | 'spa' | 'laundry' | 'transport' | 'other';
  is_active: boolean;
  created_at: string;
}

export interface BookingService {
  id: number;
  booking_id: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  service_date: string;
  service_name?: string;
  description?: string;
  category?: string;
}

// Dashboard types
export interface DashboardStats {
  rooms: {
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    maintenance_rooms: number;
    cleaning_rooms: number;
  };
  occupancy_rate: number;
  today_bookings: {
    total_bookings: number;
    confirmed_bookings: number;
    checked_in_bookings: number;
    checked_out_bookings: number;
    cancelled_bookings: number;
  };
  today_checkins: number;
  today_checkouts: number;
  revenue: {
    today_revenue: number;
    month_revenue: number;
    year_revenue: number;
  };
  guests: {
    total_guests: number;
    new_guests_today: number;
  };
}

export interface RecentActivity {
  id: number;
  activity_type: 'booking' | 'checkin' | 'checkout';
  activity_time: string;
  description: string;
  guest_name?: string;
  room_number?: string;
}

export interface RevenueChart {
  month: string;
  revenue: number;
  bookings: number;
}

export interface RoomOccupancy {
  room_type: string;
  total_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface RoomFormData {
  room_number: string;
  room_type_id: number;
  floor: number;
  notes?: string;
}

export interface GuestFormData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  id_type?: 'passport' | 'driver_license' | 'national_id';
  id_number?: string;
  date_of_birth?: string;
  nationality?: string;
}

export interface BookingFormData {
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  advance_payment?: number;
  special_requests?: string;
}

export interface StaffFormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeping';
  hire_date?: string;
  salary?: number;
}