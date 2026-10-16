import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  checkSessionValidity, 
  initInactivityTracker, 
  clearAuthSession, 
  recordActivity, 
  SessionInvalidReason 
} from '@/utils/sessionManager';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: (isAutoLogout?: boolean, reason?: SessionInvalidReason | string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async (isAutoLogout: boolean = false, reason: SessionInvalidReason | string = '') => {
    clearAuthSession();
    api.setToken(null);
    setUser(null);
    setSession(null);

    if (isAutoLogout) {
      if (reason === 'inactivity') {
        toast.warning('Session Expired', {
          description: 'You have been automatically logged out after 1 hour of inactivity.',
          duration: 6000,
        });
      } else if (reason === 'browser_closed') {
        toast.info('Session Ended', {
          description: 'Your previous session was closed. Please log in again.',
          duration: 5000,
        });
      }

      // Check if user is currently on an authenticated-only route
      if (typeof window !== 'undefined') {
        const protectedRoutes = ['/dashboard', '/order-history', '/admin', '/checkout'];
        const isCurrentRouteProtected = protectedRoutes.some((route) =>
          window.location.pathname.startsWith(route)
        );
        if (isCurrentRouteProtected) {
          window.location.href = '/login';
        }
      }
    }
  }, []);

  // Check for existing token and session validity on mount
  useEffect(() => {
    const validity = checkSessionValidity();
    if (!validity.valid) {
      if (validity.reason === 'inactivity') {
        toast.warning('Session Expired', {
          description: 'You were logged out after 1 hour of inactivity.',
          duration: 6000,
        });
      }
      clearAuthSession();
      api.setToken(null);
      setUser(null);
      setSession(null);
      setIsLoading(false);
      return;
    }

    const token = api.getToken();
    if (token) {
      recordActivity(true);
      api.getProfile()
        .then((profileData: any) => {
          const u = profileData?.user || profileData;
          const authUser: AuthUser = {
            id: u.id || u._id,
            email: u.email,
            name: u.name,
            role: (u.role || 'user') as 'admin' | 'user',
          };
          setUser(authUser);
          setSession({ access_token: token });
        })
        .catch(() => {
          // Token expired or invalid on backend
          clearAuthSession();
          api.setToken(null);
          setUser(null);
          setSession(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Inactivity tracker (1-hour timeout listener)
  useEffect(() => {
    if (!user) return;

    const cleanup = initInactivityTracker((reason) => {
      logout(true, reason);
    });

    return cleanup;
  }, [user, logout]);

  // Unauthorized (401) listener
  useEffect(() => {
    const handleUnauthorized = () => {
      logout(true, 'unauthorized');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const data = await api.login(email, password);
      api.setToken(data.token, rememberMe);

      const u = (data as any).user || data;
      const authUser: AuthUser = {
        id: u.id || u._id,
        email: u.email,
        name: u.name,
        role: (u.role || 'user') as 'admin' | 'user',
      };
      setUser(authUser);
      setSession({ access_token: data.token });
      recordActivity(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string, rememberMe: boolean = false) => {
    try {
      const data = await api.register(name, email, password);
      api.setToken(data.token, rememberMe);

      const u = (data as any).user || data;
      const authUser: AuthUser = {
        id: u.id || u._id,
        email: u.email,
        name: u.name,
        role: (u.role || 'user') as 'admin' | 'user',
      };
      setUser(authUser);
      setSession({ access_token: data.token });
      recordActivity(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const loginWithGoogle = async () => {
    return { success: false, error: 'Google login is not available with the Node.js backend. Use email/password instead.' };
  };

  const resetPassword = async (_email: string) => {
    return { success: false, error: 'Password reset via email is not yet implemented in the Node.js backend.' };
  };

  const updatePassword = async (newPassword: string) => {
    try {
      await api.updatePassword('', newPassword);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  const updateEmail = async (_newEmail: string) => {
    return { success: false, error: 'Email update is not yet implemented in the Node.js backend.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginWithGoogle,
        resetPassword,
        updatePassword,
        updateEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

