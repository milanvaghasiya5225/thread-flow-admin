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
  phone?: string;
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
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

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
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface UpdateContactMessageRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  isResolved?: boolean;
}
