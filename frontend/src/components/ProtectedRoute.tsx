// ============================================================================
// ProtectedRoute — chặn truy cập theo trạng thái đăng nhập & Role.
// Dùng bọc quanh các route cần bảo vệ trong App.tsx.
// ============================================================================
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Danh sách role được phép. Bỏ trống = chỉ cần đăng nhập. */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Ghi nhớ trang đích để đăng nhập xong quay lại.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
