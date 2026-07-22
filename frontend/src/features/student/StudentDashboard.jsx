// ============================================================================
// STUDENT — Quét QR trên màn hình giảng viên -> lấy fingerprint -> POST /checkin
// ============================================================================
import { useCallback, useState, useRef, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import QrScanner from "../../components/QrScanner";
import { useFingerprint } from "../../hooks/useFingerprint";
import { attendanceApi } from "../../api/attendance";

/** Parse nội dung QR: hỗ trợ cả JSON {sessionId, token} lẫn chuỗi token thô. */
function parseQr(text) {
  try {
    const obj = JSON.parse(text);
    if (obj?.sessionId && obj?.token)
      return { sessionId: obj.sessionId, token: obj.token };
  } catch {
    // fallback: token thô dạng "sessionId.timestamp.rand"
    const sessionId = text.split(".")[0];
    if (sessionId) return { sessionId, token: text };
  }
  return null;
}

export default function StudentDashboard() {
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

      // Nếu đã điểm danh thành công phiên này trước đó
      if (parsed.sessionId === lastSuccessSessionRef.current) {
        setFeedback({
          kind: "error",
          message: "Bạn đã điểm danh trong phiên này rồi.",
        });
        return;
      }

      // Tránh việc quét lại liên tục cùng 1 mã bị lỗi gây nhấp nháy UI
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
        setScanning(false); // Ẩn camera khi thành công
        setFeedback({
          kind: "success",
          record: res.data,
          message: res.message,
        });
      } else {
        lastErrorTokenRef.current = decodedText;
        setFeedback({
          kind: "error",
          message: res.message ?? "Điểm danh thất bại.",
        });
      }
    },
    [fingerprint],
  );

  function reset() {
    setFeedback({ kind: "idle" });
    setScanning(false); // Về trạng thái ban đầu (ẩn camera)
    lastErrorTokenRef.current = null;
  }

  return (
    <DashboardLayout
      title="Điểm danh sinh viên"
      subtitle="Quét mã QR trên màn hình giảng viên"
    >
      <div className="mx-auto max-w-xl space-y-4">
        {feedback.kind !== "success" && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Quét mã QR</h2>
              <span className="text-xs text-slate-500">
                Thiết bị:{" "}
                {fingerprint ? `${fingerprint.slice(0, 10)}…` : "đang lấy…"}
              </span>
            </div>

            {scanning ? (
              <div className="space-y-4">
                <QrScanner
                  onScan={handleScan}
                  paused={paused}
                  onError={(m) => setFeedback({ kind: "error", message: m })}
                />
                <button
                  onClick={reset}
                  className="w-full rounded-lg border border-slate-300 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy quét / Quay lại
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setScanning(true);
                  setFeedback({ kind: "idle" });
                }}
                disabled={!fingerprint}
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {fingerprint ? "Bắt đầu quét" : "Đang chuẩn bị thiết bị…"}
              </button>
            )}
          </div>
        )}

        {feedback.kind === "checking" && (
          <div className="rounded-xl bg-blue-50 p-4 text-center text-blue-700">
            Đang gửi điểm danh…
          </div>
        )}

        {feedback.kind === "success" && (
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-1 font-semibold text-green-700">
              Điểm danh thành công!
            </p>
            <p className="text-sm text-green-600">
              {feedback.record.studentName} ·{" "}
              {new Date(feedback.record.checkinAt).toLocaleTimeString("vi-VN")}
            </p>
            <button
              onClick={reset}
              className="mt-4 w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700"
            >
              Quay lại màn hình chính
            </button>
          </div>
        )}

        {/* Toast Popup Lỗi (Góc trên) */}
        {feedback.kind === "error" && (
          <div className="fixed top-4 right-4 z-50 w-80 max-w-[90vw] animate-slide-in-right rounded-lg border-l-4 border-red-500 bg-white p-4 shadow-xl">
            <div className="flex items-start">
              <span className="mr-3 text-xl leading-none">⚠️</span>
              <div>
                <p className="font-bold text-slate-800">Lỗi quét mã</p>
                <p className="mt-0.5 text-sm font-medium text-slate-600">
                  {feedback.message === "Already checked in"
                    ? "Bạn đã điểm danh trong phiên này rồi."
                    : feedback.message === "Invalid or expired QR token"
                      ? "Mã QR không hợp lệ hoặc đã hết hạn."
                      : feedback.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
