import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/apiClient';
import type { UserResponse, LoginPasswordlessRequest, OtpPurpose } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean; email?: { required: boolean; contact: string; sent: boolean }; phone?: { required: boolean; contact: string; sent: boolean } }>;
  loginWithOtp: (data: LoginPasswordlessRequest) => Promise<{ success: boolean; contact: string; medium: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phone: string;
    password: string;
  }) => Promise<{ userId: string }>;
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
    // Restore auth state on mount if token exists
    const token = apiClient.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch current user to restore session
    (async () => {
      try {
        const result = await apiClient.getCurrentUser();
        if (result.isSuccess && result.value) {
          setUser(result.value);
        } else {
          // Token exists but user fetch failed - clear invalid token
          apiClient.logout();
        }
      } catch (error) {
        // Network error or invalid token - clear and logout
        apiClient.logout();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiClient.login({ email, password });
      
      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Login failed');
      }

      // Check if the response indicates OTP is required
      if (result.value && 'requiresOtp' in result.value && result.value.requiresOtp) {
        // Pass the verification data directly from the API response
        return { 
          requiresOtp: true,
          email: result.value.email,
          phone: result.value.phone,
        };
      }

      // Direct login without 2FA (if backend ever supports it)
      if (result.value && 'token' in result.value) {
        setUser(result.value.user);
        return { requiresOtp: false };
      }

      throw new Error('Invalid login response');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
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
      if (import.meta.env.DEV) {
        console.error('Login with OTP error:', error);
      }
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
      
      // Return user ID for verification flow
      return { userId: result.value || '' };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Registration error:', error);
      }
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
