// ============================================================================
// useFingerprint — lấy Device Fingerprint bằng @fingerprintjs/fingerprintjs.
// ============================================================================
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/** Trả về visitorId (device fingerprint) hoặc null khi đang tải. */
export function useFingerprint(): string | null {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    FingerprintJS.load()
      .then((agent) => agent.get())
      .then((result) => {
        if (mounted) setFingerprint(result.visitorId);
      })
      .catch(() => {
        if (mounted) setFingerprint(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return fingerprint;
}
