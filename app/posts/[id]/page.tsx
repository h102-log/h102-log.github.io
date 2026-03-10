// 경로가 프로젝트 구조에 맞게 설정되었는지 확인해 주세요!
import { getAllPostsData, getPostData } from '../../../src/lib/posts';
import BackButton from '../../../components/BackButton';

// [방어적 코딩 및 Edge Case 처리]: 
// 우리는 next.config.ts에서 'output: export' (정적 배포)를 설정했습니다.
// 정적 사이트에서는 빌드하는 시점에 "어떤 어떤 id의 페이지들을 미리 만들어둬야 해?"를 Next.js가 전부 알고 있어야 합니다.
// 이 함수가 모든 포스트의 id를 배열로 제공하여 빌드 에러를 방지합니다.
export async function generateStaticParams() {
  const posts = getAllPostsData();
  return posts.map((post) => ({
    id: post.id,
  }));
}

// [비즈니스 로직 의도]: 동적 라우팅된 URL의 파라미터(id)를 받아와서 해당 글의 데이터를 렌더링합니다.
export default async function Post(props: { params: Promise<{ id: string }> }) {
  // 최신 Next.js 버전의 규칙에 따라 params를 비동기로 안전하게 가져옵니다.
  const params = await props.params;
  const postData = await getPostData(params.id);

  return (
    <article className="post-detail-container">
      <BackButton />
      <header className="post-header">
        <h1 className="post-title">{postData.title}</h1>
        <p className="post-date">{postData.date}</p>
      </header>
      
      {/* [주의사항/Edge Case]: 리액트에서는 보안상의 이유로 문자열 형태의 HTML을 바로 렌더링하지 않습니다.
          우리가 직접 파싱한 안전한 HTML임을 보장하기 위해 'dangerouslySetInnerHTML' 속성을 사용해야 합니다. */}
      <div 
        className="post-content"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
      />
    </article>
  );
}