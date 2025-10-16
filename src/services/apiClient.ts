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
  ContactMessage,
  CreateContactMessageRequest,
  UpdateContactMessageRequest,
  SendMessageRequest,
  ContactStatistics,
  MonthlyStatistics,
  GetContactsParams,
  UpdateMeRequest,
  UpdateStatusRequest,
  GetUsersParams,
  AssignRoleRequest,
  RoleInfo,
  Todo,
  CreateTodoRequest,
  RoleAuditLog,
  GetAuditLogsParams,
  LoginPasswordlessRequest
} from '@/types/api';
import { ErrorType } from '@/types/api';

// Configure your API base URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001';

// User-friendly error messages mapped by error codes
const USER_FRIENDLY_ERRORS: Record<string, string> = {
  'AUTH_001': 'Invalid email or password. Please try again.',
  'AUTH_002': 'Your session has expired. Please log in again.',
  'AUTH_003': 'Too many login attempts. Please try again later.',
  'OTP_001': 'Invalid verification code. Please check and try again.',
  'OTP_002': 'Verification code has expired. Please request a new one.',
  'OTP_003': 'Too many verification attempts. Please request a new code.',
  'USER_001': 'User not found.',
  'USER_002': 'Email already registered. Please use a different email.',
  'USER_003': 'Phone number already registered.',
  'VALIDATION_001': 'Invalid input. Please check your information.',
  'PERMISSION_001': 'You do not have permission to perform this action.',
  'RATE_LIMIT': 'Too many requests. Please wait a moment and try again.',
  'default': 'Something went wrong. Please try again later.'
};

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
      if (import.meta.env.DEV) {
        console.error('Failed to decode token:', error);
      }
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
      // Parse error payload safely
      const payload = await response.json().catch(() => null);
      const errorCode = payload?.error?.code || 'default';
      const userMessage = USER_FRIENDLY_ERRORS[errorCode] || USER_FRIENDLY_ERRORS.default;

      // Log detailed error info only in development
      if (import.meta.env.DEV) {
        console.error('API error:', {
          endpoint,
          status: response.status,
          payload
        });
      }

      // Handle 401 Unauthorized - clear token and logout
      if (response.status === 401) {
        this.logout();
      }

      throw new Error(userMessage);
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
      // Standard ApiResponse format:
      // { success: boolean, data: { requiresOtp: boolean, contact?: string, medium?: string } | { token: string, user: {...} } }
      const raw = await this.request<any>('/users/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Unwrap the data property from ApiResponse
      const responseData = raw?.data || raw;

      // Check if 2FA is required
      if (responseData?.requiresOtp) {
        return {
          isSuccess: true,
          isFailure: false,
          value: {
            requiresOtp: true,
            contact: responseData.contact,
            medium: responseData.medium,
          } as LoginResponse,
        };
      }

      // Otherwise, extract token
      const token: string | null = responseData?.token ?? null;

      if (!token) {
        return {
          isSuccess: false,
          isFailure: true,
          error: {
            code: raw?.error?.code || 'LOGIN_FAILED',
            description: raw?.message || 'Invalid response from server',
            type: ErrorType.Failure,
          },
        };
      }

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
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
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
    try {
      const raw = await this.request<any>('/users/login-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Transform API response to ApiResult format
      // Handle both: data.sent = true OR data = null (per spec)
      if (raw?.success) {
        return {
          isSuccess: true,
          isFailure: false,
          value: raw?.message || 'OTP sent successfully',
        };
      }

      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'OTP_SEND_FAILED',
          description: raw?.message || 'Failed to send OTP',
          type: ErrorType.Failure,
        },
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login passwordless error:', error);
      }
      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'OTP_SEND_FAILED',
          description: error instanceof Error ? error.message : 'Failed to send OTP',
          type: ErrorType.Failure,
        },
      };
    }
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResult<LoginResponse>> {
    try {
      const raw = await this.request<any>('/users/verify-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Unwrap the data property from ApiResponse
      const responseData = raw?.data || raw;

      // Extract token from response
      const token = responseData?.token;
      
      if (!token) {
        return {
          isSuccess: false,
          isFailure: true,
          error: {
            code: raw?.error?.code || 'OTP_VERIFICATION_FAILED',
            description: raw?.message || 'Invalid OTP or verification failed',
            type: ErrorType.Failure,
          },
        };
      }

      // Set token for authenticated requests
      this.setToken(token);

      // Decode user from token
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
      if (import.meta.env.DEV) {
        console.error('Verify OTP error:', error);
      }
      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'OTP_VERIFICATION_FAILED',
          description: error instanceof Error ? error.message : 'OTP verification failed',
          type: ErrorType.Failure,
        },
      };
    }
  }

  async resendOtp(data: ResendOtpRequest): Promise<ApiResult> {
    try {
      const raw = await this.request<any>('/users/resend-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Transform API response to ApiResult format
      // Success response: { sent: true }
      if (raw?.sent) {
        return {
          isSuccess: true,
          isFailure: false,
        };
      }

      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'OTP_RESEND_FAILED',
          description: 'Failed to resend OTP',
          type: ErrorType.Failure,
        },
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Resend OTP error:', error);
      }
      return {
        isSuccess: false,
        isFailure: true,
        error: {
          code: 'OTP_RESEND_FAILED',
          description: error instanceof Error ? error.message : 'Failed to resend OTP',
          type: ErrorType.Failure,
        },
      };
    }
  }

  async getVerificationStatus(email?: string, phone?: string): Promise<ApiResult> {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    const queryString = params.toString();
    return this.request<ApiResult>(`/users/verification-status${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
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

  async getUsers(params?: GetUsersParams): Promise<ApiResult<UserResponse[]>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    const queryString = queryParams.toString();
    return this.request<ApiResult<UserResponse[]>>(`/users${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  }

  async getCurrentUser(): Promise<ApiResult<UserResponse>> {
    return this.request<ApiResult<UserResponse>>('/users/me', {
      method: 'GET',
    });
  }

  async updateCurrentUser(data: UpdateMeRequest): Promise<ApiResult<UserResponse>> {
    return this.request<ApiResult<UserResponse>>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(userId: string, data: UpdateStatusRequest): Promise<ApiResult> {
    return this.request<ApiResult>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }

  // Contact Us endpoints
  async getContactMessages(params: GetContactsParams): Promise<ApiResult<ContactMessage[]>> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    if (params.search) queryParams.append('search', params.search);
    queryParams.append('page', params.page.toString());
    queryParams.append('pageSize', params.pageSize.toString());
    return this.request<ApiResult<ContactMessage[]>>(`/contact-us?${queryParams.toString()}`, {
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

  async sendContactMessage(id: string, data: SendMessageRequest): Promise<ApiResult> {
    return this.request<ApiResult>(`/contact-us/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markMessageAsRead(messageId: string): Promise<ApiResult> {
    return this.request<ApiResult>(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async getContactStatistics(): Promise<ApiResult<ContactStatistics>> {
    return this.request<ApiResult<ContactStatistics>>('/contact-us/statistics', {
      method: 'GET',
    });
  }

  async getMonthlyStatistics(months?: number): Promise<ApiResult<MonthlyStatistics[]>> {
    const url = months ? `/contact-us/statistics/monthly?months=${months}` : '/contact-us/statistics/monthly';
    return this.request<ApiResult<MonthlyStatistics[]>>(url, {
      method: 'GET',
    });
  }

  // Role Management endpoints
  async getUserRoles(userId: string): Promise<ApiResult<RoleInfo[]>> {
    return this.request<ApiResult<RoleInfo[]>>(`/users/${userId}/roles`, {
      method: 'GET',
    });
  }

  async getAllRoles(): Promise<ApiResult<RoleInfo[]>> {
    return this.request<ApiResult<RoleInfo[]>>('/roles', {
      method: 'GET',
    });
  }

  async assignRole(userId: string, data: AssignRoleRequest): Promise<ApiResult> {
    return this.request<ApiResult>(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeRole(userId: string, roleId: string): Promise<ApiResult> {
    return this.request<ApiResult>(`/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

  // Todo endpoints
  async getTodos(userId: string): Promise<ApiResult<Todo[]>> {
    return this.request<ApiResult<Todo[]>>(`/todos?userId=${userId}`, {
      method: 'GET',
    });
  }

  async getTodoById(id: string): Promise<ApiResult<Todo>> {
    return this.request<ApiResult<Todo>>(`/todos/${id}`, {
      method: 'GET',
    });
  }

  async createTodo(data: CreateTodoRequest): Promise<ApiResult<Todo>> {
    return this.request<ApiResult<Todo>>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeTodo(id: string): Promise<ApiResult> {
    return this.request<ApiResult>(`/todos/${id}/complete`, {
      method: 'PUT',
    });
  }

  async deleteTodo(id: string): Promise<ApiResult> {
    return this.request<ApiResult>(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit endpoints
  async getRoleAuditLogs(params: GetAuditLogsParams): Promise<ApiResult<RoleAuditLog[]>> {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    queryParams.append('page', params.page.toString());
    queryParams.append('pageSize', params.pageSize.toString());
    return this.request<ApiResult<RoleAuditLog[]>>(`/audit/roles?${queryParams.toString()}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
