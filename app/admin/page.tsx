import type { Metadata } from 'next';
import AdminGate from '@/components/AdminGate';
import AdminEditor from '@/components/AdminEditor';

export const metadata: Metadata = {
  title: 'Admin Editor',
  description: '웹에서 글을 작성하고 GitHub에 커밋하는 관리자 페이지입니다.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="main-container admin-page-container">
      <header className="blog-header">
        <p className="hero-kicker">ADMIN</p>
        <h1>웹 에디터</h1>
        <p className="hero-description">
          글 작성 후 마크다운 파일을 다운로드하거나 GitHub 저장소로 바로 커밋할 수 있습니다.
        </p>
      </header>

      <AdminGate>
        <AdminEditor />
      </AdminGate>
    </main>
  );
}