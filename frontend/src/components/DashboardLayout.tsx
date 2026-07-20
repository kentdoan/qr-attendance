// ============================================================================
// DashboardLayout — khung chung: header (tên app, user, nút đăng xuất) + nội dung.
// ============================================================================
import { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const roleBadge: Record<string, string> = {
  STUDENT: 'bg-sky-100 text-sky-700',
  TEACHER: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-amber-100 text-amber-700',
};

export default function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{user?.fullName}</p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  roleBadge[user?.role ?? 'STUDENT']
                }`}
              >
                {user?.role}
              </span>
            </div>
            <button
              onClick={() => void logout()}
              className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
