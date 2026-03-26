"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { 
    console.error(error);
  }, [error]);

  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <p className="error-page-code">오류</p>
        <h1 className="error-page-title">문제가 발생했어요</h1>
        <p className="error-page-desc">
          페이지를 불러오는 중 예상치 못한 오류가 발생했어요.
        </p>
        <div className="error-page-actions">
          <button className="error-page-retry" onClick={reset}>
            다시 시도
          </button>
          <Link href="/" className="error-page-link">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
