import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const REGION_ID = "qr-reader-region";

export default function QrScanner({ onScan, onError, paused = false }) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  onScanRef.current = onScan;
  pausedRef.current = paused;

  useEffect(() => {
    let scanner = null;
    let stopped = false;

    const timer = setTimeout(() => {
      if (stopped) return;
      scanner = new Html5Qrcode(REGION_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!pausedRef.current) onScanRef.current(decodedText);
          },
          () => {},
        )
        .catch((err) => {
          onError?.(
            err instanceof Error
              ? err.message
              : "Không mở được camera. Vui lòng cấp quyền.",
          );
        });
    }, 150);

    return () => {
      stopped = true;
      clearTimeout(timer);
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div
      id={REGION_ID}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-black"
    />
  );
}
