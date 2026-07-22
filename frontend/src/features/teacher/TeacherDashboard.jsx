// ============================================================================
// TEACHER — Tạo phiên -> trình chiếu QR động (đổi mã mỗi 30s) -> xem danh sách
//           realtime -> xuất Excel.
// ============================================================================
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../auth/AuthContext";
import { attendanceApi } from "../../api/attendance";
import { exportReportToExcel } from "../../utils/exportExcel";

const QR_TTL = 30; // giây — trùng với TTL token mock/backend.
const LIST_POLL_MS = 5000; // chu kỳ làm mới danh sách điểm danh.

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL);
  const [records, setRecords] = useState([]);

  // ---- Tạo phiên ----
  async function handleCreate(e) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setError(null);
    const res = await attendanceApi.createSession({
      className: title.trim() || "Phiên điểm danh",
      duration: 60, // Mặc định 60 phút theo Backend
    });
    setCreating(false);
    if (res.success && res.data) {
      setSession(res.data);
    } else {
      setError(res.message ?? "Không tạo được phiên.");
    }
  }

  // ---- Làm mới QR token ----
  const refreshQr = useCallback(async (sessionId) => {
    const res = await attendanceApi.getQrToken(sessionId);
    if (res.success && res.data) {
      setQr(res.data);
      setSecondsLeft(res.data.ttlSeconds ?? QR_TTL);
    }
  }, []);

  // Khi có phiên: lấy QR lần đầu + đặt interval đổi mã mỗi 30s.
  useEffect(() => {
    if (!session) return;
    void refreshQr(session.id);
    const id = setInterval(() => void refreshQr(session.id), QR_TTL * 1000);
    return () => clearInterval(id);
  }, [session, refreshQr]);

  // Đồng hồ đếm ngược hiển thị thời gian còn lại của mã.
  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [qr]);

  // ---- Poll danh sách điểm danh ----
  useEffect(() => {
    if (!session) return;
    let mounted = true;
    const load = async () => {
      const res = await attendanceApi.getReport(session.id);
      if (mounted && res.success && res.data) setRecords(res.data.records);
    };
    void load();
    const id = setInterval(load, LIST_POLL_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [session]);

  async function handleExport() {
    if (!session) return;
    const res = await attendanceApi.getReport(session.id);
    if (res.success && res.data) exportReportToExcel(res.data, session.className ?? session.title);
  }

  async function handleClose() {
    if (!session) return;
    await attendanceApi.closeSession(session.id);
    setSession((s) => (s ? { ...s, isOpen: false } : s));
  }

  const qrValue = qr
    ? JSON.stringify({ sessionId: qr.sessionId, token: qr.token })
    : "";

  return (
    <DashboardLayout
      title="Giảng viên"
      subtitle="Tạo phiên & trình chiếu QR điểm danh động"
    >
      {!session ? (
        <form
          onSubmit={handleCreate}
          className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Tạo phiên điểm danh
          </h2>
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tên buổi học / môn học
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Nhập môn ĐTĐM - Buổi 3"
            className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? "Đang tạo…" : "Tạo phiên"}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* QR động */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-lg">
                  {session.className ?? session.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    session.isOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {session.isOpen ? "Đang mở" : "Đã đóng"}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Bắt đầu:</span>
                  <span className="font-medium">
                    {new Date(session.createdAt || Date.now()).toLocaleTimeString("vi-VN")} - {new Date(session.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kết thúc dự kiến:</span>
                  <span className="font-medium">
                    {new Date(session.expiresAt || Date.now() + 60*60*1000).toLocaleTimeString("vi-VN")} - {new Date(session.expiresAt || Date.now() + 60*60*1000).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {qr && session.isOpen ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <QRCodeSVG value={qrValue} size={220} level="M" />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(secondsLeft / QR_TTL) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {secondsLeft}s
                    </span>
                  </div>
                  <p className="mt-2 text-center text-xs text-slate-400">
                    Mã tự đổi mỗi {QR_TTL} giây để chống điểm danh hộ.
                  </p>
                </>
              ) : (
                <p className="py-16 text-slate-400">
                  {session.isOpen ? "Đang tải mã QR…" : "Phiên đã đóng."}
                </p>
              )}
            </div>

            {session.isOpen ? (
              <button
                onClick={handleClose}
                className="mt-6 w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Đóng phiên
              </button>
            ) : (
              <button
                onClick={() => setSession(null)}
                className="mt-6 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Quay lại (Tạo phiên mới)
              </button>
            )}
          </div>

          {/* Danh sách điểm danh */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                Đã điểm danh{" "}
                <span className="text-indigo-600">({records.length})</span>
              </h2>
              <button
                onClick={handleExport}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Xuất Excel
              </button>
            </div>

            <div className="max-h-96 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Họ tên</th>
                    <th className="px-2 py-2">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-2 py-8 text-center text-slate-400"
                      >
                        Chưa có sinh viên điểm danh.
                      </td>
                    </tr>
                  ) : (
                    records.map((r, i) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-2 py-2 font-medium text-slate-700">
                          {r.studentName}
                        </td>
                        <td className="px-2 py-2 text-slate-500">
                          {new Date(r.checkinAt).toLocaleTimeString("vi-VN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
