import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && apiService.isAuthenticated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login({ email, password });
    if (response.success && response.data) {
      const userData: User = {
        email,
        name: email.split('@')[0], // Temporary, as API doesn't return name
        userId: response.data.user_id || '',
        token: response.data.token,
      };
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await apiService.signup({ email, password, name });
    if (response.success) {
      // Auto login after signup
      await login(email, password);
    } else {
      throw new Error(response.error || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    apiService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
