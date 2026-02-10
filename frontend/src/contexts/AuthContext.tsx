import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Validate the current session token
   */
  const validateSession = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('authToken');

    if (!storedToken) {
      return false;
    }

    try {
      // Import authApi dynamically to avoid circular dependencies
      const { authApi } = await import('../api/client');
      const response = await authApi.validate();

      if (response.valid) {
        setToken(storedToken);
        setIsAuthenticated(true);
        return true;
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        setToken(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // If validation fails (network error, etc.), clear the session
      localStorage.removeItem('authToken');
      setToken(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  /**
   * Login with username and password
   */
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Import authApi dynamically to avoid circular dependencies
      const { authApi } = await import('../api/client');
      const response = await authApi.login({ username, password });

      if (response.success && response.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.token);
        setToken(response.token);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during login',
      };
    }
  };

  /**
   * Logout and clear session
   */
  const logout = async (): Promise<void> => {
    try {
      // Try to call the logout endpoint
      const { authApi } = await import('../api/client');
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local cleanup even if API call fails
    }

    // Clear local storage and state
    localStorage.removeItem('authToken');
    setToken(null);
    setIsAuthenticated(false);
  };

  /**
   * On mount, check if there's a stored token and validate it
   */
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await validateSession();
      setLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    token,
    loading,
    login,
    logout,
    validateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
