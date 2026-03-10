// [주의사항/Edge Case]: 가져오는 경로(path)는 프로젝트 구조에 따라 약간 다를 수 있습니다.
// src 폴더를 사용 중이시라면 '../lib/posts' 혹은 '@/lib/posts' 로 맞춰주세요.
import { getAllPostsData } from '@/src/lib/posts';
import HomeContent from '@/components/HomeContent';

// [비즈니스 로직 의도]: 서버 컴포넌트는 async/await를 직접 사용할 수 있습니다.
// 빌드 타임에 이 함수가 실행되어 데이터를 모두 가져온 후 정적 HTML을 생성합니다.
export default async function Home() {
  const allPosts = getAllPostsData();

  return <HomeContent allPosts={allPosts} />;
}