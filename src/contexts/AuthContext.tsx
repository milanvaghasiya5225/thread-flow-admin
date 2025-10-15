import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/apiClient';
import type { UserResponse, LoginPasswordlessRequest, OtpPurpose } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean; email: string }>;
  loginWithOtp: (data: LoginPasswordlessRequest) => Promise<{ success: boolean; contact: string; medium: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  setUserFromToken: (user: UserResponse) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = apiClient.getToken();
    if (token) {
      // TODO: You might want to add a /users/me endpoint to get current user
      // For now, we'll just set loading to false
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Step 1: Validate password (but don't save token yet for 2FA)
      const result = await apiClient.login({ email, password });
      
      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Login failed');
      }

      // Step 2: Send OTP for 2FA
      const otpResult = await apiClient.loginPasswordless({ 
        medium: 'email', 
        email 
      });
      
      if (!otpResult.isSuccess) {
        throw new Error(otpResult.error?.description || 'Failed to send 2FA code');
      }

      // Return success - user needs to verify OTP
      return { requiresOtp: true, email };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithOtp = async (data: LoginPasswordlessRequest) => {
    try {
      const result = await apiClient.loginPasswordless(data);
      
      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Failed to send OTP');
      }

      // Return success with contact info for OTP verification page
      return {
        success: true,
        contact: data.email || data.phone || '',
        medium: data.email ? 'email' : 'phone'
      };
    } catch (error) {
      console.error('Login with OTP error:', error);
      throw error;
    }
  };

  const setUserFromToken = (userData: UserResponse) => {
    setUser(userData);
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phone: string;
    password: string;
  }) => {
    try {
      const result = await apiClient.register(data);
      
      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Registration failed');
      }
      
      // After registration, you might want to automatically log in
      // or redirect to verification page
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithOtp,
    register,
    logout,
    isAuthenticated: !!user,
    setUserFromToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
