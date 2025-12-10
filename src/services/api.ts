import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  Performance,
  Reservation,
  CreateBookingRequest,
  Booking,
  PaymentRequest,
  PaymentResponse,
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '../types';

const GATEWAY_URL = 'https://apigateway-iota.vercel.app';

function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    console.log('[Token Payload]', payload);

    const userId = payload.sub || payload.userId || payload.user_id || payload.id || payload.aud;

    console.log('[Extracted userId]', userId);

    return userId ? String(userId) : null;
  } catch (error) {
    console.error('Token parsing error:', error);
    return null;
  }
}

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: GATEWAY_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    this.api.interceptors.request.use((config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: {
          Authorization: config.headers['Authorization'],
          'x-user-id': config.headers['x-user-id'],
        },
      });
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
  }

  private setAuthHeader(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const userId = extractUserIdFromToken(token);
    if (userId) {
      this.api.defaults.headers.common['x-user-id'] = userId;
    }
  }

  private removeAuthHeader() {
    delete this.api.defaults.headers.common['Authorization'];
    delete this.api.defaults.headers.common['x-user-id'];
  }

  private handleArrayResponse(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      Array.isArray((data as Record<string, unknown>).data)
    ) {
      return (data as Record<string, unknown>).data as unknown[];
    }
    return [];
  }

  private handleObjectResponse<T>(data: unknown): T {
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as Record<string, unknown>).data as T;
    }
    return data as T;
  }

  // Auth APIs
  async signup(data: SignupRequest): Promise<ApiResponse<{ user_id: string }>> {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.api.post('/auth/login', data);
    if (response.data.success && response.data.data?.token) {
      this.token = response.data.data.token;
      localStorage.setItem('token', this.token!);
      this.setAuthHeader(this.token!);
    }
    return response.data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.removeAuthHeader();
    window.location.href = '/';
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Performance APIs
  async getPerformances(): Promise<Performance[]> {
    const response = await this.api.get('/performances/performances');
    return response.data;
  }

  async getPerformanceById(id: number): Promise<Performance> {
    const response = await this.api.get(`/performances/performances/${id}`);
    return response.data;
  }

  // Reservation APIs
  async createReservation(performanceId: number, seatCount: number): Promise<Reservation> {
    const response = await this.api.post(`/performances/reservations/${performanceId}`, {
      seatCount,
    });
    return response.data;
  }

  async confirmReservation(performanceId: number, reservationId: number): Promise<Reservation> {
    const response = await this.api.patch(
      `/performances/reservations/${performanceId}/${reservationId}/confirm`
    );
    return response.data;
  }

  async cancelReservation(performanceId: number, reservationId: number): Promise<Reservation> {
    const response = await this.api.patch(
      `/performances/reservations/${performanceId}/${reservationId}/cancel`
    );
    return response.data;
  }

  async refundReservation(performanceId: number, reservationId: number): Promise<Reservation> {
    const response = await this.api.patch(
      `/performances/reservations/${performanceId}/${reservationId}/refund`
    );
    return response.data;
  }

  // Booking APIs
  async createBooking(data: CreateBookingRequest): Promise<{ message: string; bookingId: string }> {
    const response = await this.api.post('/booking/booking', data);
    return response.data;
  }

  async getMyBookings(): Promise<Booking[]> {
    const response = await this.api.get('/booking/booking/my');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<{ message: string }> {
    const response = await this.api.delete('/booking/booking/my', {
      data: { bookingId },
    });
    return response.data;
  }

  // Payment APIs
  async executePayment(data: PaymentRequest): Promise<PaymentResponse> {
    const response = await this.api.post('/payment/payment/execute', data);
    return response.data;
  }

  async getMyReviews(): Promise<Review[]> {
    try {
      const response = await this.api.get(`/review/reviews/my`);
      return this.handleArrayResponse(response.data) as Review[];
    } catch (error) {
      const axiosError = error as Record<string, unknown> & { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        return [];
      }
      throw error;
    }
  }

  async createReview(data: CreateReviewRequest): Promise<Review> {
    const response = await this.api.post(`/review/reviews`, {
      performanceId: data.performanceId,
      rating: data.rating,
      content: data.content,
    });
    return this.handleObjectResponse<Review>(response.data);
  }

  async getPerformanceReviews(performanceId: number): Promise<Review[]> {
    const response = await this.api.get(`/review/reviews/performance/${performanceId}`);
    return this.handleArrayResponse(response.data) as Review[];
  }

  async updateReview(reviewId: number, data: UpdateReviewRequest): Promise<Review> {
    const response = await this.api.patch(`/review/reviews/${reviewId}`, data);
    return this.handleObjectResponse<Review>(response.data);
  }

  async deleteReview(reviewId: number): Promise<void> {
    await this.api.delete(`/review/reviews/${reviewId}`);
  }
}

export const apiService = new ApiService();
