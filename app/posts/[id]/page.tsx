import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
// 경로가 프로젝트 구조에 맞게 설정되었는지 확인해 주세요!
import { getAllPostsData, getPostData, getPostNavigation } from '../../../src/lib/posts';
import BackButton from '../../../components/BackButton';
import PostToc from '../../../components/PostToc';
// [비즈니스 로직 의도]: 클라이언트 상호작용(복사 알림)이 필요한 공유 버튼은 별도의 클라이언트 컴포넌트로 분리하여 임포트합니다.
import PostShare from '../../../components/PostShare';
import { formatDateToYmd } from '../../../src/lib/date';
import { createAbsoluteUrl, siteConfig } from '../../../src/lib/site';

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

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;

  try {
    const postData = await getPostData(params.id);
    const postUrl = `/posts/${postData.id}`;
    const publishedTime = new Date(postData.date).toISOString();
    const modifiedTime = new Date(postData.updatedAt ?? postData.date).toISOString();
    const thumbnailUrl = postData.thumbnail ? createAbsoluteUrl(postData.thumbnail) : undefined;
    const tags = Array.isArray(postData.tag)
      ? postData.tag
      : typeof postData.tag === 'string'
        ? [postData.tag]
        : [];

    return {
      title: postData.title,
      description: postData.description,
      alternates: {
        canonical: postUrl,
      },
      openGraph: {
        type: 'article',
        url: postUrl,
        title: postData.title,
        description: postData.description,
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        publishedTime,
        modifiedTime,
        authors: [siteConfig.author],
        tags,
        images: thumbnailUrl
          ? [
              {
                url: thumbnailUrl,
                alt: postData.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: thumbnailUrl ? 'summary_large_image' : 'summary',
        title: postData.title,
        description: postData.description,
        images: thumbnailUrl ? [thumbnailUrl] : undefined,
      },
    };
  } catch {
    return {
      title: '글을 찾을 수 없습니다',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// [비즈니스 로직 의도]: 동적 라우팅된 URL의 파라미터(id)를 받아와서 해당 글의 데이터를 렌더링합니다.
// 서버 컴포넌트이므로 SEO에 완벽하게 대응하며, 클라이언트 측 자바스크립트 번들을 줄여줍니다.
export default async function Post(props: { params: Promise<{ id: string }> }) {
  // 최신 Next.js 버전의 규칙에 따라 params를 비동기로 안전하게 가져옵니다.
  const params = await props.params;
  let postData;

  try {
    postData = await getPostData(params.id);
  } catch {
    notFound();
  }

  const { previousPost, nextPost, relatedPosts } = getPostNavigation(params.id);
  
  // [방어적 코딩]: 메타데이터에서 처리한 것과 동일하게, 본문에서도 tag 데이터를 안전한 배열 형태로 정제합니다.
  const tags = Array.isArray(postData.tag)
    ? postData.tag
    : typeof postData.tag === 'string' && postData.tag.trim() !== ''
      ? [postData.tag]
      : [];

  return (
    <article className="post-detail-container">
      <div className="post-detail-layout">
        <div className="post-detail-main">
          <BackButton />
          <header className="post-header">
            <h1 className="post-title">{postData.title}</h1>
            <div className="post-meta-row">
              <p className="post-date">{formatDateToYmd(postData.date)}</p>
              {postData.updatedAt ? (
                <p className="post-updated-at">업데이트 {formatDateToYmd(postData.updatedAt)}</p>
              ) : null}
            </div>
          </header>

          {/* [주의사항/Edge Case]: 리액트에서는 보안상의 이유로 문자열 형태의 HTML을 바로 렌더링하지 않습니다.
              우리가 직접 파싱한 안전한 HTML임을 보장하기 위해 'dangerouslySetInnerHTML' 속성을 사용해야 합니다. */}
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
          />

          {/* [Design]: 본문 종료 영역 (태그, 저작권, 공유 버튼) */}
          <div className="post-end-section">
            {tags.length > 0 ? (
              <div className="post-end-tags">
                <svg className="tag-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="post-end-tag-item"
                    aria-label={`${tag} 태그로 이동`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="post-end-meta">
              <p className="post-license">
                ⓒ bh10. 오타나 코드 피드백은 언제나 환영합니다!
              </p>
              {/* 분리된 공유 버튼 컴포넌트를 마운트합니다. */}
              <PostShare />
            </div>
          </div>

          {previousPost || nextPost ? (
            <nav className="post-pagination" aria-label="글 이동">
              {previousPost ? (
                <Link href={`/posts/${previousPost.id}`} className="post-pagination-link post-pagination-prev">
                  <span className="post-pagination-label">이전 글</span>
                  <strong>{previousPost.title}</strong>
                </Link>
              ) : (
                <div />
              )}

              {nextPost ? (
                <Link href={`/posts/${nextPost.id}`} className="post-pagination-link post-pagination-next">
                  <span className="post-pagination-label">다음 글</span>
                  <strong>{nextPost.title}</strong>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          ) : null}

          {relatedPosts.length > 0 ? (
            <section className="related-posts-section" aria-labelledby="related-posts-heading">
              <div className="section-headline related-posts-headline">
                <h2 id="related-posts-heading">관련 글</h2>
              </div>

              <ul className="related-posts-list">
                {relatedPosts.map((relatedPost) => (
                  <li key={relatedPost.id} className="related-post-item">
                    <Link href={`/posts/${relatedPost.id}`} className="related-post-link">
                      <div className="related-post-main">
                        <h3 className="related-post-title">{relatedPost.title}</h3>
                        <p className="related-post-description">{relatedPost.description}</p>
                      </div>
                      <time className="related-post-date" dateTime={relatedPost.date}>
                        {formatDateToYmd(relatedPost.date)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {postData.toc?.length ? (
          <aside className="post-toc-area">
            <PostToc items={postData.toc} />
          </aside>
        ) : null}
      </div>
    </article>
  );
}