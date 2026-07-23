import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const roleBadge = {
  STUDENT: "bg-sky-100 text-sky-700",
  TEACHER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-amber-100 text-amber-700",
};

export default function DashboardLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background ambient gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <header className="sticky top-0 z-40 glass shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 p-1.5">
                <img src="/attend.svg" alt="BK-Check Logo" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-display font-bold text-slate-800 hover:text-indigo-600 transition-colors tracking-tight">
                  BK-Sync
                </h1>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-600 uppercase border border-slate-200">
                  {title}
                </span>
              </div>
            </Link>
            {subtitle && <p className="text-sm font-medium text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                {user?.fullName}
              </p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  roleBadge[user?.role ?? "STUDENT"]
                }`}
              >
                {user?.role}
              </span>
            </div>
            
            <Link
              to="/profile"
              className="rounded-xl border border-slate-200 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:shadow-sm transition-all"
            >
              Hồ sơ
            </Link>

            <button
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true, state: null });
              }}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-900 hover:shadow-md transition-all"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 relative z-10 animate-fade-up">{children}</main>
    </div>
  );
}
