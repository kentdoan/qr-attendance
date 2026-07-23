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
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes,
} from "aws-amplify/auth";

const AuthContext = createContext(undefined);

function roleFromClaims(claims) {
  const groups = claims["cognito:groups"];
  if (Array.isArray(groups)) {
    if (groups.includes("ADMIN")) return "ADMIN";
    if (groups.includes("TEACHER")) return "TEACHER";
  }
  
  const custom = claims["custom:role"];
  if (custom === "STUDENT" || custom === "TEACHER" || custom === "ADMIN") {
    return custom;
  }
  
  return "STUDENT";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCognitoUser = useCallback(async (forceRefresh = false) => {
    const current = await getCurrentUser();
    const session = await fetchAuthSession({ forceRefresh });
    const claims = session.tokens?.idToken?.payload ?? {};
    const attrs = await fetchUserAttributes().catch(() => ({}));
    return {
      id: current.userId,
      email: attrs.email ?? current.signInDetails?.loginId ?? "",
      fullName: attrs.name ?? attrs.email ?? current.username,
      school: attrs["custom:school"] ?? "",
      faculty: attrs["custom:faculty"] ?? "",
      major: attrs["custom:major"] ?? "",
      role: roleFromClaims(claims),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, []);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    try {
      setUser(await loadCognitoUser(force));
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
        },
      },
    });
  }, []);

  const confirmRegister = useCallback(async ({ email, code }) => {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    await resetPassword({ username: email });
  }, []);

  const confirmForgotPassword = useCallback(async ({ email, code, newPassword }) => {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  }, []);

  const updateProfile = useCallback(async (data) => {
    const userAttributes = {};
    if (data.fullName !== undefined) userAttributes.name = data.fullName;
    if (data.school !== undefined) userAttributes["custom:school"] = data.school;
    if (data.faculty !== undefined) userAttributes["custom:faculty"] = data.faculty;
    if (data.major !== undefined) userAttributes["custom:major"] = data.major;

    await updateUserAttributes({ userAttributes });
    await refresh(true); // Buộc tải lại session để nhận JWT token mới với thông tin vừa cập nhật
  }, [refresh]);

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
      confirmRegister,
      forgotPassword,
      confirmForgotPassword,
      updateProfile,
      logout,
      refresh,
    }),
    [user, loading, login, register, confirmRegister, forgotPassword, confirmForgotPassword, updateProfile, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>.");
  return ctx;
}
