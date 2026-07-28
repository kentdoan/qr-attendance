import { useCallback, useState, useRef, useEffect } from "react";
import QrScanner from "../../../components/QrScanner";
import { useFingerprint } from "../../../hooks/useFingerprint";
import { attendanceApi } from "../../../api/attendance";
import { useDispatch } from "react-redux";
import { fetchStudentHistory } from "../studentSlice";

function parseQr(text) {
  try {
    const obj = JSON.parse(text);
    if (obj?.sessionId && obj?.token)
      return { sessionId: obj.sessionId, token: obj.token };
  } catch {
    const sessionId = text.split(".")[0];
    if (sessionId) return { sessionId, token: text };
  }
  return null;
}

export default function CheckinSection() {
  const dispatch = useDispatch();
  const fingerprint = useFingerprint();
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "idle" });

  const lastSuccessSessionRef = useRef(null);
  const lastErrorTokenRef = useRef(null);

  useEffect(() => {
    if (feedback.kind === "error") {
      const timer = setTimeout(() => {
        setFeedback((prev) => (prev.kind === "error" ? { kind: "idle" } : prev));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback.kind]);

  const paused = feedback.kind === "checking" || feedback.kind === "success";

  const handleScan = useCallback(
    async (decodedText) => {
      if (!fingerprint) {
        setFeedback({
          kind: "error",
          message: "Chưa lấy được mã thiết bị, thử lại sau giây lát.",
        });
        return;
      }
      const parsed = parseQr(decodedText);
      if (!parsed) {
        setFeedback({ kind: "error", message: "Mã QR không hợp lệ." });
        return;
      }

      if (parsed.sessionId === lastSuccessSessionRef.current) {
        setFeedback({
          kind: "error",
          message: "Bạn đã điểm danh trong phiên này rồi.",
        });
        return;
      }

      if (decodedText === lastErrorTokenRef.current) {
        return;
      }

      setFeedback({ kind: "checking" });
      const res = await attendanceApi.checkin({
        sessionId: parsed.sessionId,
        token: parsed.token,
        deviceFingerprint: fingerprint,
      });

      if (res.success && res.data) {
        lastSuccessSessionRef.current = parsed.sessionId;
        lastErrorTokenRef.current = null;
        setScanning(false);
        setFeedback({
          kind: "success",
          record: res.data.attendance || res.data,
          message: res.message,
        });
        dispatch(fetchStudentHistory());
      } else {
        lastErrorTokenRef.current = decodedText;
        setFeedback({
          kind: "error",
          message: res.message ?? "Điểm danh thất bại.",
        });
      }
    },
    [fingerprint, dispatch],
  );

  function reset() {
    setFeedback({ kind: "idle" });
    setScanning(false);
    lastErrorTokenRef.current = null;
  }

  return (
    <div className="space-y-4">
      {feedback.kind !== "success" && (
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] border border-white hover:shadow-[var(--shadow-premium)] transition-all duration-500 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity"></div>
          <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-display font-bold text-slate-800">Quét mã QR</h2>
            <span className="text-xs font-medium text-slate-500 bg-white/80 shadow-sm border border-slate-100 px-3 py-1.5 rounded-full">
              Thiết bị:{" "}
              {fingerprint ? `${fingerprint.slice(0, 10)}…` : "đang lấy…"}
            </span>
          </div>

          {scanning ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden rounded-2xl bg-black flex items-center justify-center min-h-[300px] shadow-inner border-4 border-slate-100 relative z-10">
                <QrScanner
                  onScan={handleScan}
                  paused={paused}
                  onError={(m) => setFeedback({ kind: "error", message: m })}
                />
              </div>
              <button
                onClick={reset}
                className="w-full relative z-10 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                Hủy quét / Quay lại
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[200px] relative z-10">
              <button
                onClick={() => {
                  setScanning(true);
                  setFeedback({ kind: "idle" });
                }}
                disabled={!fingerprint}
                className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-4 text-lg font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-60 transition-all shadow-md hover:shadow-[var(--shadow-hover)] hover:-translate-y-1 focus:ring-4 focus:ring-indigo-200"
              >
                {fingerprint ? "Bắt đầu quét" : "Đang chuẩn bị..."}
              </button>
            </div>
          )}
        </div>
      )}

      {feedback.kind === "checking" && (
        <div className="rounded-xl bg-blue-50 p-4 text-center text-blue-700 font-medium animate-pulse">
          Đang gửi dữ liệu điểm danh…
        </div>
      )}

      {feedback.kind === "success" && (
        <div className="rounded-xl bg-green-50 p-6 text-center shadow-sm border border-green-100">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <p className="text-3xl">✅</p>
          </div>
          <p className="font-bold text-xl text-green-800">
            Điểm danh thành công!
          </p>
          <div className="mt-4 inline-block bg-white px-4 py-3 rounded-lg border border-green-100 w-full text-center">
            <p className="font-semibold text-slate-800 text-lg">
              Môn: {feedback.record?.courseName || feedback.record?.className || "Không rõ môn học"}
            </p>
            {feedback.record?.teacherName && (
              <p className="text-sm font-medium text-slate-600 mt-1">
                GV: {feedback.record.teacherName}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Thời gian: {new Date(feedback.record?.checkinTime || Date.now()).toLocaleTimeString("vi-VN")}
            </p>
          </div>
          <button
            onClick={reset}
            className="mt-6 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 transition-colors shadow-md"
          >
            Quay lại màn hình chính
          </button>
        </div>
      )}

      {feedback.kind === "error" && (
        <div className="fixed top-4 right-4 z-50 w-80 max-w-[90vw] animate-slide-in-right rounded-lg border-l-4 border-red-500 bg-white p-4 shadow-xl">
          <div className="flex items-start">
            <span className="mr-3 text-xl leading-none">⚠️</span>
            <div>
              <p className="font-bold text-slate-800">Lỗi quét mã</p>
              <p className="mt-0.5 text-sm font-medium text-slate-600">
                {feedback.message?.toLowerCase().includes("already checked in")
                  ? "Bạn đã điểm danh trong phiên này rồi."
                  : feedback.message?.toLowerCase().includes("invalid or expired qr")
                    ? "Mã QR không hợp lệ hoặc đã hết hạn."
                    : feedback.message === "SESSION_CLOSED"
                    ? "Phiên điểm danh đã kết thúc."
                    : feedback.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
