'use client';

import { useState } from 'react';

export default function PostShare() {
  const [copyMsg, setCopyMsg] = useState("");

  const handleCopy = async () => {
    try {
      // 최신 브라우저 클립보드 API (비동기)
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopyMsg("링크가 복사되었습니다!");
      
      // 1.5초 후 알림창 닫기
      setTimeout(() => setCopyMsg(""), 1500);
    } catch (err) {
      console.error('URL 복사 실패:', err);
    }
  };

  return (
    <div className="post-share">
      <span className="share-label">Share:</span>
      <button 
        type="button" 
        className="share-button" 
        aria-label="링크 복사" 
        onClick={handleCopy}
      >
        🔗
      </button>

      {/* [Design]: 복사 완료 시 나타나는 토스트 모달 */}
      {copyMsg && (
        <div className="copy-toast-modal" role="alert">
          {copyMsg}
        </div>
      )}
    </div>
  );
}