import Link from 'next/link';
// [주의사항/Edge Case]: 가져오는 경로(path)는 프로젝트 구조에 따라 약간 다를 수 있습니다.
// src 폴더를 사용 중이시라면 '../lib/posts' 혹은 '@/lib/posts' 로 맞춰주세요.
import { getAllPostsData } from '../src/lib/posts'; 

// [비즈니스 로직 의도]: 서버 컴포넌트는 async/await를 직접 사용할 수 있습니다.
// 빌드 타임에 이 함수가 실행되어 데이터를 모두 가져온 후 정적 HTML을 생성합니다.
export default async function Home() {
  // 1. 작성해둔 유틸리티 함수를 호출하여 전체 포스트 데이터를 가져옵니다.
  const allPosts = getAllPostsData();

  return (
    // [디자인 컨벤션]: CSS 클래스명은 규칙에 따라 'kebab-case'를 사용합니다.
    <main className="main-container">
      <header className="blog-header">
        <h1>bh102님의 기술 블로그</h1>
        <p>프론트엔드 개발자 bh102의 성장 기록 공간, h102-log 입니다.</p>
      </header>

      <section className="post-list-section">
        <h2>최근 작성한 글</h2>
        
        {/* [주의사항/Edge Case 방어]: 로컬에 마크다운 파일이 하나도 없을 경우, 
            화면이 깨지거나 빈 공간이 나오지 않도록 친절한 안내 메시지를 렌더링합니다. */}
        {allPosts.length === 0 ? (
          <div className="empty-post-message">
            <p>아직 작성된 글이 없습니다. 첫 번째 포스트를 작성해 보세요!</p>
          </div>
        ) : (
          <ul className="post-list">
            {allPosts.map((post) => (
              <li key={post.id} className="post-item">
                {/* [비즈니스 로직 의도]: Next.js의 <Link> 컴포넌트를 사용하면 
                    새로고침 없이 아주 부드럽고 빠르게 페이지를 이동(Client-side navigation)할 수 있습니다. */}
                <Link href={`/posts/${post.id}`} className="post-link">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-date">{post.date}</p>
                  <p className="post-description">{post.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}