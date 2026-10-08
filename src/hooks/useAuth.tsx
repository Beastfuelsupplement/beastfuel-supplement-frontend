import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { api } from '@/lib/api';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
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
          // Token expired or invalid
          api.setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);

      const u = (data as any).user || data;
      const authUser: AuthUser = {
        id: u.id || u._id,
        email: u.email,
        name: u.name,
        role: (u.role || 'user') as 'admin' | 'user',
      };
      setUser(authUser);
      setSession({ access_token: data.token });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await api.register(name, email, password);
      api.setToken(data.token);

      const u = (data as any).user || data;
      const authUser: AuthUser = {
        id: u.id || u._id,
        email: u.email,
        name: u.name,
        role: (u.role || 'user') as 'admin' | 'user',
      };
      setUser(authUser);
      setSession({ access_token: data.token });
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

  const logout = async () => {
    api.setToken(null);
    setUser(null);
    setSession(null);
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
