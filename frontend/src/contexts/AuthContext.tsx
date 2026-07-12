import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | null;

interface AuthContextType {
  token: string | null;
  role: Role;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const groups = decoded['cognito:groups'] || [];
        if (groups.includes('ADMIN')) setRole('ADMIN');
        else if (groups.includes('TEACHER')) setRole('TEACHER');
        else if (groups.includes('STUDENT')) setRole('STUDENT');
        else setRole(null);
        
        localStorage.setItem('token', token);
      } catch (e) {
        console.warn('Invalid token:', e);
        setToken(null);
        setRole(null);
        localStorage.removeItem('token');
      }
    } else {
      setRole(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
