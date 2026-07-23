import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);

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
