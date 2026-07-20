// ============================================================================
// STUDENT — Quét QR trên màn hình giảng viên -> lấy fingerprint -> POST /checkin
// ============================================================================
import { useCallback, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import QrScanner from '../../components/QrScanner';
import { useFingerprint } from '../../hooks/useFingerprint';
import { attendanceApi } from '../../api/attendance';
import { CheckinRecord } from '../../types';

type Feedback =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'success'; record: CheckinRecord; message?: string }
  | { kind: 'error'; message: string };

/** Parse nội dung QR: hỗ trợ cả JSON {sessionId, token} lẫn chuỗi token thô. */
function parseQr(text: string): { sessionId: string; token: string } | null {
  try {
    const obj = JSON.parse(text);
    if (obj?.sessionId && obj?.token) return { sessionId: obj.sessionId, token: obj.token };
  } catch {
    // fallback: token thô dạng "sessionId.timestamp.rand"
    const sessionId = text.split('.')[0];
    if (sessionId) return { sessionId, token: text };
  }
  return null;
}

export default function StudentDashboard() {
  const fingerprint = useFingerprint();
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });

  const paused = feedback.kind === 'checking' || feedback.kind === 'success';

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (!fingerprint) {
        setFeedback({ kind: 'error', message: 'Chưa lấy được mã thiết bị, thử lại sau giây lát.' });
        return;
      }
      const parsed = parseQr(decodedText);
      if (!parsed) {
        setFeedback({ kind: 'error', message: 'Mã QR không hợp lệ.' });
        return;
      }

      setFeedback({ kind: 'checking' });
      const res = await attendanceApi.checkin({
        sessionId: parsed.sessionId,
        qrToken: parsed.token,
        deviceFingerprint: fingerprint,
      });

      if (res.success && res.data) {
        setFeedback({ kind: 'success', record: res.data, message: res.message });
      } else {
        setFeedback({ kind: 'error', message: res.message ?? 'Điểm danh thất bại.' });
      }
    },
    [fingerprint]
  );

  function reset() {
    setFeedback({ kind: 'idle' });
    setScanning(true);
  }

  return (
    <DashboardLayout title="Điểm danh sinh viên" subtitle="Quét mã QR trên màn hình giảng viên">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Quét mã QR</h2>
            <span className="text-xs text-slate-500">
              Thiết bị: {fingerprint ? `${fingerprint.slice(0, 10)}…` : 'đang lấy…'}
            </span>
          </div>

          {scanning ? (
            <QrScanner
              onScan={handleScan}
              paused={paused}
              onError={(m) => setFeedback({ kind: 'error', message: m })}
            />
          ) : (
            <button
              onClick={() => setScanning(true)}
              disabled={!fingerprint}
              className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {fingerprint ? 'Bắt đầu quét' : 'Đang chuẩn bị thiết bị…'}
            </button>
          )}
        </div>

        {feedback.kind === 'checking' && (
          <div className="rounded-xl bg-blue-50 p-4 text-center text-blue-700">
            Đang gửi điểm danh…
          </div>
        )}

        {feedback.kind === 'success' && (
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-1 font-semibold text-green-700">
              {feedback.message ?? 'Điểm danh thành công!'}
            </p>
            <p className="text-sm text-green-600">
              {feedback.record.studentName} ·{' '}
              {new Date(feedback.record.checkinAt).toLocaleTimeString('vi-VN')}
            </p>
            <button
              onClick={reset}
              className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Quét mã khác
            </button>
          </div>
        )}

        {feedback.kind === 'error' && (
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <p className="text-2xl">⚠️</p>
            <p className="mt-1 font-semibold text-red-700">{feedback.message}</p>
            <button
              onClick={reset}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
