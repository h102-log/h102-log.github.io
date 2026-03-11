/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { FormEvent, useLayoutEffect, useMemo, useState } from 'react';

const SESSION_KEY = 'admin-gate-unlocked';

type AdminGateProps = {
  children: React.ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const [inputCode, setInputCode] = useState('');
  // 서버 렌더링과 클라이언트 렌더링이 일치하도록 초기값은 항상 false
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [message, setMessage] = useState('');

  // useLayoutEffect: 브라우저 페인트 전에 실행되어 hydration 미스매치 방지
  // suppressHydrationWarning이 있으므로 sessionStorage 동기화는 의도된 동작
  useLayoutEffect(() => {
    const unlockedFromStorage = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    setIsUnlocked(unlockedFromStorage);
  }, []);

  const configuredCode = useMemo(() => {
    return process.env.NEXT_PUBLIC_ADMIN_GATE_CODE?.trim() ?? ''; 
  }, []);

  const handleUnlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!configuredCode) {
      setMessage('NEXT_PUBLIC_ADMIN_GATE_CODE가 설정되지 않았습니다. 설정 후 다시 시도해 주세요.');
      return;
    }

    if (inputCode !== configuredCode) {
      setMessage('접근 코드가 일치하지 않습니다.');
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, 'true');
    setMessage('잠금 해제되었습니다.');
    setIsUnlocked(true);
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <section className="admin-gate-card" aria-label="관리자 접근 잠금" suppressHydrationWarning>
      <h2>관리자 접근 잠금</h2>
      <p>
        이 페이지는 1차 접근 코드가 필요합니다. 배포 환경 변수에 NEXT_PUBLIC_ADMIN_GATE_CODE를 설정해 주세요.
      </p>

      <form onSubmit={handleUnlock} className="admin-gate-form">
        <label className="admin-field">
          <span>접근 코드</span>
          <input
            type="password"
            value={inputCode}
            onChange={(event) => setInputCode(event.target.value)}
            placeholder="접근 코드를 입력하세요"
            autoComplete="off"
          />
        </label>

        <button type="submit" className="admin-primary-button">
          잠금 해제
        </button>
      </form>

      <p className="admin-status-message">{message}</p>
    </section>
  );
}