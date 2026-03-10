'use client';

import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  return (
    <button type="button" className="back-button" onClick={handleGoBack}>
      목록으로
    </button>
  );
}
