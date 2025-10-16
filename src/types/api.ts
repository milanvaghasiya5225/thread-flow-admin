// Generated types from Swagger specification

export enum OtpPurpose {
  Login = 'Login',
  Registration = 'Registration',
  ForgotPassword = 'ForgotPassword'
}

export enum ErrorType {
  Failure = 'Failure',
  Validation = 'Validation',
  Problem = 'Problem',
  NotFound = 'NotFound',
  Conflict = 'Conflict'
}

export interface ApiError {
  code: string | null;
  description: string | null;
  type: ErrorType;
}

export interface ApiResult<T = void> {
  isSuccess: boolean;
  isFailure: boolean;
  error?: ApiError;
  value?: T;
}

// User Types
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  userName: string; // Username field (typically set to email)
  phone: string; // Required field as per API spec
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginPasswordlessRequest {
  medium: string;
  email?: string;
  phone?: string;
  countryIso2?: string;
  dialCode?: string;
  nationalNumber?: string;
}

export interface VerifyOtpRequest {
  purpose: OtpPurpose;
  contact: string;
  code: string;
}

export interface ResendOtpRequest {
  identifier: string;
  purpose: OtpPurpose;
}

export interface VerificationStatusRequest {
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RequestForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles?: string[];
}

export type LoginResponse = 
  | { requiresOtp: true; contact: string; medium: string }
  | { token: string; user: UserResponse; requiresOtp?: false };

// Product Types
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  stock: number;
}

export interface UpdateProductRequest {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Contact Us Types
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAtUtc: string;
  isResolved: boolean;
  status?: string;
  assignedTo?: string;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface UpdateContactMessageRequest {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  status?: string;
  statusComment?: string;
  assignedTo?: string;
}

export interface SendMessageRequest {
  content: string;
  sendEmail: boolean;
  sendSms: boolean;
}

export interface ContactStatistics {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
}

export interface MonthlyStatistics {
  month: string;
  count: number;
}

export interface GetContactsParams {
  status?: string;
  assignedTo?: string;
  search?: string;
  page: number;
  pageSize: number;
}

// User Management Types
export interface UpdateMeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UpdateStatusRequest {
  isActive: boolean;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
}

export interface UserDetailsDto {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
}

// Role Management Types
export interface AssignRoleRequest {
  roleId: string;
}

export interface RoleInfo {
  id: string;
  name: string;
}

export interface UserRoleAssignment {
  userId: string;
  userName: string;
  userEmail: string;
  roles: string[];
}

// Todo Types
export interface Todo {
  id: string;
  userId: string;
  description: string;
  dueDate?: string;
  labels?: string[];
  priority: number;
  isCompleted: boolean;
  createdAtUtc: string;
}

export interface CreateTodoRequest {
  userId: string;
  description: string;
  dueDate?: string;
  labels?: string[];
  priority: number;
}

// Audit Types
export interface RoleAuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  performedBy?: string;
  performedByName?: string;
  reason?: string;
  createdAt: string;
}

export interface GetAuditLogsParams {
  userId?: string;
  page: number;
  pageSize: number;
}

export interface AuditLogsResponse {
  items: RoleAuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    details?: string;
    meta?: Record<string, any>;
  };
  traceId?: string;
  timestamp: string;
  path?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
