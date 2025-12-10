// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth Types
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_id?: string;
}

// Performance Types
export enum PerformanceCategory {
  THEATER = 'THEATER',
  MUSICAL = 'MUSICAL',
  CONCERT = 'CONCERT',
  EXHIBITION = 'EXHIBITION',
  MOVIE = 'MOVIE',
}

export interface Performance {
  id: number;
  title: string;
  description: string;
  category: PerformanceCategory;
  venue: string;
  imageUrl?: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  reservedSeats?: number;
  createdAt: string;
  updatedAt: string;
}

// Reservation Types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface Reservation {
  reservationId: number;
  performanceId: number;
  title: string;
  price: number;
  availableSeats: number;
  status: ReservationStatus;
  message: string;
  seatCount?: number;
}

// Booking Types
export enum BookingStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'payment_failed',
}

export interface CreateBookingRequest {
  performanceId: string;
  quantity: number;
  paymentMethod: string;
}

export interface Booking {
  bookingId: string;
  userId: string;
  performanceId: string;
  quantity: number;
  paymentMethod: string;
  status: BookingStatus;
  totalAmount: number;
  seatIds?: string[];
  reservationId?: number;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt?: {
    _seconds: number;
    _nanoseconds: number;
  };
}

// Payment Types
export interface PaymentRequest {
  bookingId: string;
  paymentMethodToken: string;
  cardNumber: string;
  cvv: string;
}

export interface PaymentResponse {
  message: string;
  finalStatus: string;
  bookingId: string;
}

// Review Types
export interface Review {
  id: number;
  performanceId: number;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  performanceId: number;
  rating: number;
  content: string;
}

export interface UpdateReviewRequest {
  rating: number;
  content: string;
}

// User Context
export interface User {
  email: string;
  name: string;
  userId: string;
  token: string;
}
