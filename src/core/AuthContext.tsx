import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../../types';
import { apiRequest } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  // Verify session on boot via GET /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const verifySessionOnBoot = async () => {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        try {
          const profile = await apiRequest('/auth/me');
          if (isMounted && profile && profile._id) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
            if (profile.role) {
              localStorage.setItem('role', profile.role);
            }
          }
        } catch (err: any) {
          console.warn('[AuthContext] Session bootstrap verification failed:', err?.message);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    verifySessionOnBoot();

    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const refreshProfile = async () => {
    try {
      const profile = await apiRequest('/auth/me');
      if (profile && profile._id) {
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
        if (profile.role) {
          localStorage.setItem('role', profile.role);
        }
      }
    } catch (err: any) {
      console.warn('[AuthContext] Manual profile refresh failed:', err?.message);
    }
  };

  const login = (newToken: string, newUser: User, refreshToken?: string) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (newUser?.role) {
      localStorage.setItem('role', newUser.role);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', 'POST').catch(() => {});
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.dispatchEvent(new Event('auth:logout'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Resilient fallback if invoked outside provider
    const storedToken = localStorage.getItem('token');
    let storedUser: User | null = null;
    const raw = localStorage.getItem('user');
    if (raw) {
      try { storedUser = JSON.parse(raw); } catch (_) {}
    }
    return {
      user: storedUser,
      token: storedToken,
      role: storedUser?.role || null,
      isAuthenticated: Boolean(storedToken),
      isLoading: false,
      login: (newToken: string, newUser: User, refreshToken?: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (newUser?.role) localStorage.setItem('role', newUser.role);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      },
      logout: async () => {
        try {
          await apiRequest('/auth/logout', 'POST').catch(() => {});
        } catch (_) {}
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('auth:logout'));
      },
      refreshProfile: async () => {},
    };
  }
  return context;
};

export default useAuth;
