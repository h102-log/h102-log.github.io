"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/src/lib/site";

// [Business intent]: Fetch and show this post's pageview count from GoatCounter's
// visitor-counter endpoint. Keyed by the live location.pathname so it matches the
// path Analytics counts. Requires "Allow adding visitor counts on your website"
// to be enabled in the GoatCounter dashboard.
export default function ViewCount() {
  const [count, setCount] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${siteConfig.goatcounter}/counter/${encodeURIComponent(
      location.pathname,
    )}.json`;

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: string } | null) => {
        if (data?.count) {
          setCount(data.count);
        }
      })
      .catch(() => {
        // [Edge case]: network / CORS / not-yet-counted -> stay hidden silently.
      });

    return () => controller.abort();
  }, []);

  if (!count) {
    return null;
  }

  return <p className="post-views">조회수 {count}</p>;
}
