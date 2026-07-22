// ============================================================================
// ADMIN — Quản lý người dùng: cấp / thu hồi quyền Giảng viên.
// ============================================================================
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { adminApi } from "../../api/admin";

const roleStyle = {
  STUDENT: "bg-sky-100 text-sky-700",
  TEACHER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-amber-100 text-amber-700",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.listUsers();
    if (res.success && res.data) setUsers(res.data);
    else setError(res.message ?? "Không tải được danh sách người dùng.");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function grant(user) {
    setBusyId(user.id);
    const res = await adminApi.grantTeacher(user);
    if (res.success && res.data) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    }
    setBusyId(null);
  }

  async function revoke(user) {
    setBusyId(user.id);
    const res = await adminApi.revokeTeacher(user);
    if (res.success && res.data) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    }
    setBusyId(null);
  }

  return (
    <DashboardLayout
      title="Quản trị viên"
      subtitle="Quản lý người dùng & phân quyền giảng viên"
    >
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Danh sách người dùng{" "}
            <span className="text-indigo-600">({users.length})</span>
          </h2>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-slate-400">Đang tải…</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Vai trò</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {u.fullName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{u.email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleStyle[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {u.isActive ? (
                        <span className="text-xs text-green-600">
                          ● Kích hoạt
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          ● Chưa kích hoạt
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {u.role === "ADMIN" ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : u.role === "TEACHER" ? (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => void revoke(u)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Thu hồi quyền GV
                        </button>
                      ) : (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => void grant(u)}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                          Cấp quyền GV
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
