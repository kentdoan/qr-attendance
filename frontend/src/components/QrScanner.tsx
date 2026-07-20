// ============================================================================
// QrScanner — bọc html5-qrcode để quét QR bằng camera thiết bị.
// ============================================================================
import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  /** Gọi khi quét được 1 mã QR. */
  onScan: (decodedText: string) => void;
  onError?: (message: string) => void;
  /** Tạm dừng xử lý kết quả (ví dụ đang chờ API check-in). */
  paused?: boolean;
}

const REGION_ID = 'qr-reader-region';

export default function QrScanner({ onScan, onError, paused = false }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Giữ callback mới nhất mà không phải khởi tạo lại scanner.
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  onScanRef.current = onScan;
  pausedRef.current = paused;

  useEffect(() => {
    const scanner = new Html5Qrcode(REGION_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!pausedRef.current) onScanRef.current(decodedText);
        },
        () => {
          // Bỏ qua lỗi quét từng frame (rất thường xuyên).
        }
      )
      .catch((err: unknown) => {
        onError?.(
          err instanceof Error
            ? err.message
            : 'Không mở được camera. Vui lòng cấp quyền camera cho trình duyệt.'
        );
      });

    return () => {
      stopped = true;
      // Dừng & dọn dẹp camera khi unmount.
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {
          if (!stopped) return;
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={REGION_ID}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-black"
    />
  );
}
