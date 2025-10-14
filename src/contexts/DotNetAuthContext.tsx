import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/apiClient';
import type { UserResponse } from '@/types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const DotNetAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useDotNetAuth = () => {
  const context = useContext(DotNetAuthContext);
  if (!context) {
    throw new Error('useDotNetAuth must be used within DotNetAuthProvider');
  }
  return context;
};

interface DotNetAuthProviderProps {
  children: ReactNode;
}

export const DotNetAuthProvider = ({ children }: DotNetAuthProviderProps) => {
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
      const result = await apiClient.login({ email, password });
      
      if (!result.isSuccess) {
        throw new Error(result.error?.description || 'Login failed');
      }

      if (result.value) {
        setUser(result.value.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
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
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <DotNetAuthContext.Provider value={value}>
      {children}
    </DotNetAuthContext.Provider>
  );
};
