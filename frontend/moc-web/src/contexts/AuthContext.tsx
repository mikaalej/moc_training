import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/authApi';
import { usersApi, type User, type CreateUserDto } from '../api/usersApi';

const STORAGE_KEY = 'moc-user';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: { userName: string; displayName?: string; password: string; roleKey: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Provides current user and auth actions. Restores user from localStorage on load.
 * Login stores user; logout clears it and redirects to /login (caller handles navigation).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed?.id && parsed?.userName) setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await authApi.login({ username, password });
    const u = data.user;
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signup = useCallback(
    async (data: { userName: string; displayName?: string; password: string; roleKey: string }) => {
      const dto: CreateUserDto = {
        userName: data.userName,
        displayName: data.displayName ?? data.userName,
        roleKey: data.roleKey,
        isActive: true,
        password: data.password,
      };
      await usersApi.create(dto);
    },
    []
  );
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}
