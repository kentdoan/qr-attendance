import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role isn't loaded yet from jwt (rare but possible if async), could show loading
  // Assuming role is sync decoded
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Has account but wrong role -> go to root to redirect properly
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-sm">
              QR
            </div>
            Attendance
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Role: <span className="text-purple-400 font-medium">{role || 'GUEST'}</span></span>
            <button 
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
