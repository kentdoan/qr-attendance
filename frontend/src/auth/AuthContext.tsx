// ============================================================================
// AuthContext — quản lý trạng thái xác thực
// Hỗ trợ đồng thời:
//   - Mock mode (VITE_USE_MOCK_API === 'true'): dùng mockUsers.
//   - Cognito thật: aws-amplify/auth (signIn, signUp, signOut...).
// ============================================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import {
  LoginPayload,
  RegisterPayload,
  Role,
  User,
} from '../types';
import { mockUsers, MOCK_PASSWORD } from '../api/mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Khoá lưu user mock trong bộ nhớ (KHÔNG dùng localStorage theo quy ước).
let mockCurrentUser: User | null = null;

/** Trích role từ token Cognito: ưu tiên custom:role, fallback cognito:groups. */
function roleFromClaims(claims: Record<string, unknown>): Role {
  const custom = claims['custom:role'];
  if (custom === 'STUDENT' || custom === 'TEACHER' || custom === 'ADMIN') {
    return custom;
  }
  const groups = claims['cognito:groups'];
  if (Array.isArray(groups)) {
    if (groups.includes('ADMIN')) return 'ADMIN';
    if (groups.includes('TEACHER')) return 'TEACHER';
  }
  return 'STUDENT';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCognitoUser = useCallback(async (): Promise<User | null> => {
    const current = await getCurrentUser();
    const session = await fetchAuthSession();
    const claims = session.tokens?.idToken?.payload ?? {};
    const attrs = await fetchUserAttributes().catch(() => ({} as Record<string, string>));
    return {
      id: current.userId,
      email: attrs.email ?? current.signInDetails?.loginId ?? '',
      fullName: attrs.name ?? attrs.email ?? current.username,
      role: roleFromClaims(claims as Record<string, unknown>),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        setUser(mockCurrentUser);
      } else {
        setUser(await loadCognitoUser());
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadCognitoUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async ({ email, password }: LoginPayload) => {
      if (USE_MOCK) {
        const found = mockUsers.find((u) => u.email === email);
        if (!found || password !== MOCK_PASSWORD) {
          throw new Error('Email hoặc mật khẩu không đúng (mock).');
        }
        mockCurrentUser = found;
        setUser(found);
        return;
      }
      await signIn({ username: email, password });
      setUser(await loadCognitoUser());
    },
    [loadCognitoUser]
  );

  const register = useCallback(
    async ({ fullName, email, password }: RegisterPayload) => {
      if (USE_MOCK) {
        if (mockUsers.some((u) => u.email === email)) {
          throw new Error('Email đã tồn tại (mock).');
        }
        const newUser: User = {
          id: `u-${Date.now()}`,
          fullName,
          email,
          role: 'STUDENT', // mặc định STUDENT, ADMIN nâng quyền sau.
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        return;
      }
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: fullName,
            'custom:role': 'STUDENT',
          },
        },
      });
    },
    []
  );

  const logout = useCallback(async () => {
    if (USE_MOCK) {
      mockCurrentUser = null;
      setUser(null);
      return;
    }
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook truy cập AuthContext. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>.');
  return ctx;
}
