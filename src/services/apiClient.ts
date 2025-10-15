import type {
  ApiResult,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  VerificationStatusRequest,
  ChangePasswordRequest,
  RequestForgotPasswordRequest,
  ResetPasswordRequest,
  UserResponse,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ContactMessage,
  CreateContactMessageRequest,
  UpdateContactMessageRequest,
  LoginPasswordlessRequest
} from '@/types/api';
import { ErrorType } from '@/types/api';

// Configure your API base URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Try to load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private decodeToken(token: string): UserResponse {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Extract roles - can be a string or an array
      const rolesClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const roles = rolesClaim ? (Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim]) : [];
      
      return {
        id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
        firstName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']?.split(' ')[0] || '',
        lastName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']?.split(' ').slice(1).join(' ') || '',
        phone: payload.phone || undefined,
        emailVerified: true,
        phoneVerified: false,
        roles
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return {
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        emailVerified: false,
        phoneVerified: false,
        roles: []
      };
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { description: 'An error occurred', type: 'Failure' }
      }));
      throw new Error(errorData.error?.description || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<ApiResult<string>> {
    return this.request<ApiResult<string>>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<ApiResult<LoginResponse>> {
    try {
      // Accept multiple possible response shapes from the server
      // 1) { token: string }
      // 2) { success: boolean, statusCode: number, message: string | null, data: { token: string } }
      // 3) { isSuccess: boolean, value: { token: string } }
      const raw = await this.request<any>('/users/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const token: string | null =
        raw?.token ??
        raw?.data?.token ??
        raw?.value?.token ??
        null;

      if (!token) {
        return {
          isSuccess: false,
          isFailure: true,
          error: {
            code: raw?.error?.code || 'LOGIN_FAILED',
            description: raw?.message || raw?.error?.description || 'Invalid response from server',
            type: ErrorType.Failure,
          },
        };
      }

      // Don't set token here - 2FA required
      // Token will be set after OTP verification
      
      // Decode JWT to extract user info
      const user = this.decodeToken(token);

      return {
        isSuccess: true,
        isFailure: false,
        value: {
          token,
          user,
        },
      };
    } catch (error) {
      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'LOGIN_FAILED',
          description: error instanceof Error ? error.message : 'Login failed',
          type: ErrorType.Failure,
        },
      };
    }
  }

  async loginPasswordless(data: LoginPasswordlessRequest): Promise<ApiResult<string>> {
    return this.request<ApiResult<string>>('/users/login-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResult<LoginResponse>> {
    const result = await this.request<ApiResult<LoginResponse>>('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (result.isSuccess && result.value?.token) {
      this.setToken(result.value.token);
    }
    
    return result;
  }

  async resendOtp(data: ResendOtpRequest): Promise<ApiResult> {
    return this.request<ApiResult>('/users/resend-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVerificationStatus(data: VerificationStatusRequest): Promise<ApiResult> {
    return this.request<ApiResult>('/users/verification-status', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<ApiResult> {
    return this.request<ApiResult>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestForgotPassword(data: RequestForgotPasswordRequest): Promise<ApiResult> {
    return this.request<ApiResult>('/users/forgot-password/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResult> {
    return this.request<ApiResult>('/users/forgot-password/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserById(userId: string): Promise<ApiResult<UserResponse>> {
    return this.request<ApiResult<UserResponse>>(`/users/${userId}`, {
      method: 'GET',
    });
  }

  logout() {
    this.setToken(null);
  }

  // Products endpoints
  async getProducts(query?: string): Promise<ApiResult<Product[]>> {
    const url = query ? `/products?q=${encodeURIComponent(query)}` : '/products';
    return this.request<ApiResult<Product[]>>(url, {
      method: 'GET',
    });
  }

  async getProductById(id: number): Promise<ApiResult<Product>> {
    return this.request<ApiResult<Product>>(`/products/${id}`, {
      method: 'GET',
    });
  }

  async createProduct(data: CreateProductRequest): Promise<ApiResult<Product>> {
    return this.request<ApiResult<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<ApiResult<Product>> {
    return this.request<ApiResult<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<ApiResult> {
    return this.request<ApiResult>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Contact Us endpoints
  async getContactMessages(onlyUnresolved?: boolean): Promise<ApiResult<ContactMessage[]>> {
    const url = onlyUnresolved !== undefined 
      ? `/contact-us?onlyUnresolved=${onlyUnresolved}` 
      : '/contact-us';
    return this.request<ApiResult<ContactMessage[]>>(url, {
      method: 'GET',
    });
  }

  async getContactMessageById(id: string): Promise<ApiResult<ContactMessage>> {
    return this.request<ApiResult<ContactMessage>>(`/contact-us/${id}`, {
      method: 'GET',
    });
  }

  async createContactMessage(data: CreateContactMessageRequest): Promise<ApiResult<string>> {
    return this.request<ApiResult<string>>('/contact-us', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContactMessage(id: string, data: UpdateContactMessageRequest): Promise<ApiResult> {
    return this.request<ApiResult>(`/contact-us/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContactMessage(id: string): Promise<ApiResult> {
    return this.request<ApiResult>(`/contact-us/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
