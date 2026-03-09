// [주의사항/Edge Case]: 가져오는 경로(path)는 프로젝트 구조에 따라 약간 다를 수 있습니다.
// src 폴더를 사용 중이시라면 '../lib/posts' 혹은 '@/lib/posts' 로 맞춰주세요.
import { getAllPostsData } from '@/src/lib/posts';
import PostList from '@/components/PostList';

// [비즈니스 로직 의도]: 서버 컴포넌트는 async/await를 직접 사용할 수 있습니다.
// 빌드 타임에 이 함수가 실행되어 데이터를 모두 가져온 후 정적 HTML을 생성합니다.
export default async function Home() {
  // 1. 작성해둔 유틸리티 함수를 호출하여 전체 포스트 데이터를 가져옵니다.
  const allPosts = getAllPostsData();
  const initialPosts =allPosts.slice(0,10);
  const totalPosts = allPosts.length;

  return (
    // [디자인 컨벤션]: CSS 클래스명은 규칙에 따라 'kebab-case'를 사용합니다. 
    <main className="main-container">
      <header className="blog-header home-hero">
        <p className="hero-kicker"></p>
        <h1>안녕하세요, bh102입니다.</h1>
        <p className="hero-description">
          기록남기고자 시작했습니다.
        </p>
      </header>

      <section className="post-list-section">
        <div className="section-headline">
          <h2>Writing</h2>
          <p>{totalPosts} posts</p>
        </div>
        <PostList
          initialPosts={initialPosts}
          allPosts={allPosts}
        ></PostList>
        
  
      </section>
    </main>
  );
}