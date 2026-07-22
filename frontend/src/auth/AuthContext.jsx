// ============================================================================
// AuthContext — quản lý trạng thái xác thực
// Hỗ trợ Cognito thật: aws-amplify/auth (signIn, signUp, signOut...).
// ============================================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";

const AuthContext = createContext(undefined);

/** Trích role từ token Cognito: ưu tiên cognito:groups vì backend dựa vào đó. */
function roleFromClaims(claims) {
  const groups = claims["cognito:groups"];
  if (Array.isArray(groups)) {
    if (groups.includes("ADMIN")) return "ADMIN";
    if (groups.includes("TEACHER")) return "TEACHER";
  }
  
  // Fallback sang custom:role nếu chưa có group (ví dụ lúc vừa đăng ký)
  const custom = claims["custom:role"];
  if (custom === "STUDENT" || custom === "TEACHER" || custom === "ADMIN") {
    return custom;
  }
  
  return "STUDENT";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCognitoUser = useCallback(async () => {
    const current = await getCurrentUser();
    const session = await fetchAuthSession();
    const claims = session.tokens?.idToken?.payload ?? {};
    const attrs = await fetchUserAttributes().catch(() => ({}));
    return {
      id: current.userId,
      email: attrs.email ?? current.signInDetails?.loginId ?? "",
      fullName: attrs.name ?? attrs.email ?? current.username,
      role: roleFromClaims(claims),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await loadCognitoUser());
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
    async ({ email, password }) => {
      try {
        await signIn({ username: email, password });
      } catch (err) {
        if (err.name === "UserAlreadyAuthenticatedException" || err.message?.includes("already a signed in user")) {
          await signOut();
          await signIn({ username: email, password });
        } else {
          throw err;
        }
      }
      setUser(await loadCognitoUser());
    },
    [loadCognitoUser],
  );

  const register = useCallback(async ({ fullName, email, password }) => {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name: fullName,
          "custom:role": "STUDENT",
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refresh,
    }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook truy cập AuthContext. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>.");
  return ctx;
}
