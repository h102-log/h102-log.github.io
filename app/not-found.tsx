import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <p className="error-page-code">404</p>
        <h1 className="error-page-title">페이지를 찾을 수 없어요</h1>
        <p className="error-page-desc">
          요청하신 페이지가 없거나 삭제된 것 같아요.
        </p>
        <Link href="/" className="error-page-link">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
