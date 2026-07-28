import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { attendanceApi } from "../../../api/attendance";
import { updateSessionStatus } from "../teacherSlice";

const QR_TTL = 30;

export default function ActiveSessionCard({ session }) {
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();

  const [qr, setQr] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null);

  useEffect(() => {
    if (!session || !session.isOpen || !session.expiresAt) return;
    
    const checkAndClose = (diff) => {
      if (diff <= 0) {
        dispatch(updateSessionStatus({ id: session.id, isOpen: false }));
        attendanceApi.closeSession(session.id).catch(() => {});
        return true;
      }
      return false;
    };

    const calc = () => {
      const diff = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    };
    
    const initialDiff = calc();
    setSessionTimeLeft(initialDiff);
    if (checkAndClose(initialDiff)) return;

    const interval = setInterval(() => {
      const diff = calc();
      setSessionTimeLeft(diff);
      if (checkAndClose(diff)) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session, dispatch]);

  const refreshQr = useCallback(async (sessionId) => {
    const res = await attendanceApi.getQrToken(sessionId);
    if (res.success && res.data) {
      setQr(res.data);
      setSecondsLeft(res.data.ttlSeconds ?? QR_TTL);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void refreshQr(session.id);
    const id = setInterval(() => void refreshQr(session.id), QR_TTL * 1000);
    return () => clearInterval(id);
  }, [session, refreshQr]);

  useEffect(() => {
    if (!qr) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [qr]);

  async function handleClose() {
    if (!session) return;
    await attendanceApi.closeSession(session.id);
    dispatch(updateSessionStatus({ id: session.id, isOpen: false }));
  }

  const qrValue = qr
    ? JSON.stringify({ sessionId: qr.sessionId, token: qr.token })
    : "";

  return (
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
          {sessionTimeLeft !== null && session.isOpen && (
            <div className="mt-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700 border border-indigo-100">
              <span className="font-semibold">Thời gian điểm danh còn lại:</span>
              <span className="font-bold text-lg tracking-wider">
                {Math.floor(sessionTimeLeft / 60).toString().padStart(2, "0")}:{(sessionTimeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
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
          onClick={() => setSearchParams({})}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Quay lại (Tạo phiên mới)
        </button>
      )}
    </div>
  );
}
