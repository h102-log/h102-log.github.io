"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// [Business intent]: GoatCounter's count.js attaches this object to window.
// We disable its auto-count (no_onload in layout.tsx) and fire manually on every
// client-side route change, because this blog navigates as an SPA and the default
// script only counts the first full page load.
declare global {
  interface Window {
    goatcounter?: {
      count?: (opts: {
        path: string;
        title?: string;
        referrer?: string;
      }) => void;
    };
  }
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // [Edge case]: count.js loads async (afterInteractive). If it is not ready
    // on the first navigation, retry briefly until window.goatcounter appears.
    let attempts = 0;
    let timer: number | undefined;

    const send = () => {
      if (window.goatcounter?.count) {
        // Use the live location.pathname so the counted path is byte-identical
        // to the one ViewCount queries for display (avoids trailing-slash mismatch).
        window.goatcounter.count({
          path: location.pathname + location.search,
        });
        return;
      }
      if (attempts++ < 20) {
        timer = window.setTimeout(send, 200);
      }
    };

    send();

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [pathname]);

  return null;
}
