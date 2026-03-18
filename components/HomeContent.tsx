"use client";

// [주의사항]: React 패키지에서 Suspense를 추가로 import 해야 합니다.
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostList from "@/components/PostList";

type PostItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  tag?: string | string[];
};

type HomeContentProps = {
  allPosts: PostItem[];
};

const ALL_TAG = "전체";

function normalizeTagKey(tagValue: string): string {
  return tagValue.trim().toLowerCase();
}

function extractTagValues(tagValue?: string | string[]): string[] {
  if (Array.isArray(tagValue)) {
    return tagValue.map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof tagValue === "string" && tagValue.trim() !== "") {
    return [tagValue.trim()];
  }

  return [];
}

// [비즈니스 로직 의도]: useSearchParams()를 호출하는 로직을 별도의 독립된 컴포넌트로 분리합니다.
// Next.js 빌드 시 정적 생성(Prerendering)을 방해하지 않도록, 이 컴포넌트만 Suspense로 격리하기 위함입니다.
function SearchParamsHandler({
  setSelectedTags,
}: {
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // [방어적 코딩]: 빌드 타임이나 예기치 못한 상황에서 searchParams가 null일 경우를 대비합니다.
    if (!searchParams) return;

    const tagParam = searchParams.get("tag");
    if (tagParam && tagParam.trim() !== "") {
      setSelectedTags([normalizeTagKey(tagParam)]);
    }
  }, [searchParams, setSelectedTags]);

  // [의도]: 이 컴포넌트는 화면에 보여줄 UI가 없으므로 null을 반환하여 로직만 백그라운드에서 실행되도록 합니다.
  return null;
}

export default function HomeContent({ allPosts }: HomeContentProps) {
  // 메인 화면시작시 스크롤은 항상 최상단에 오도록
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 선택된 태그 배열(빈 배열이면 전체 보기)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // (이전 코드 삭제됨) searchParams와 useEffect 로직은 위 SearchParamsHandler 컴포넌트로 이동했습니다.

  const tagLabelByKey = useMemo(() => {
    const labelMap = new Map<string, string>();

    allPosts.forEach((post) => {
      const values = extractTagValues(post.tag);
      values.forEach((value) => {
        const key = normalizeTagKey(value);
        if (!labelMap.has(key)) {
          labelMap.set(key, value);
        }
      });
    });

    return labelMap;
  }, [allPosts]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();

    allPosts.forEach((post) => {
      const tags = extractTagValues(post.tag);
      const uniqueTagKeys = new Set(tags.map((tag) => normalizeTagKey(tag)));

      uniqueTagKeys.forEach((tagKey) => {
        counts.set(tagKey, (counts.get(tagKey) ?? 0) + 1);
      });
    });

    return counts;
  }, [allPosts]);

  const tags = useMemo(() => {
    return [ALL_TAG, ...Array.from(tagLabelByKey.values())];
  }, [tagLabelByKey]);

  const tagFilteredPosts = useMemo(() => {
    // 태그를 선택하지 않으면 전체 글을 보여줍니다.
    if (selectedTags.length === 0) {
      return allPosts;
    }

    return allPosts.filter((post) => {
      const normalizedTagKeys = extractTagValues(post.tag).map((tag) =>
        normalizeTagKey(tag),
      );
      // OR 조건: 선택 태그 중 하나라도 포함되면 노출
      return normalizedTagKeys.some((tagKey) => selectedTags.includes(tagKey));
    });
  }, [allPosts, selectedTags]);

  // 전체는 초기화, 개별 태그는 토글 선택
  const toggleTagSelection = (tag: string) => {
    if (tag === ALL_TAG) {
      setSelectedTags([]);
      return;
    }

    const targetTagKey = normalizeTagKey(tag);

    setSelectedTags((prevTags) => {
      if (prevTags.includes(targetTagKey)) {
        return prevTags.filter((selectedTag) => selectedTag !== targetTagKey);
      }

      return [...prevTags, targetTagKey];
    });
  };

  const initialPosts = tagFilteredPosts.slice(0, 10);

  return (
    <main className="main-container home-layout">
      {/* [비즈니스 로직 의도]: 파라미터를 읽어오는 로직을 Suspense로 감싸서, 
          사용자가 접속하기 전(빌드 시점)에는 이 부분의 렌더링을 보류하도록 처리합니다. 
          UI가 없는 컴포넌트이므로 fallback은 null로 지정합니다. */}
      <Suspense fallback={null}>
        <SearchParamsHandler setSelectedTags={setSelectedTags} />
      </Suspense>

      {/* [비즈니스 로직 의도]: 스크린 리더기 등 웹 접근성(a11y)을 고려하여 
          핵심 콘텐츠인 '글 목록'이 보조 네비게이션인 '태그'보다 HTML DOM 상에서 먼저 오도록 배치합니다. */}
      <div className="home-main-content">
        <section className="post-list-section">
          <div className="section-headline">
            <h2>목록</h2>
            <p>{tagFilteredPosts.length} posts</p>
          </div>

          {tagFilteredPosts.length === 0 ? (
            <p className="empty-post-message">조건에 맞는 글이 없습니다.</p>
          ) : (
            <PostList
              key={
                selectedTags.length === 0
                  ? ALL_TAG
                  : selectedTags.slice().sort().join("|")
              }
              initialPosts={initialPosts}
              allPosts={tagFilteredPosts}
            ></PostList>
          )}
        </section>
      </div>

      {/* [Design]: 메인 콘텐츠 우측에 배치될 태그 사이드바 */}
      <aside className="home-sidebar" aria-label="태그 목록">
        <h2 className="sidebar-title">태그</h2>
        <ul className="sidebar-category-list">
          {tags.map((tag) => {
            const normalizedTagKey = normalizeTagKey(tag);
            const isActive =
              tag === ALL_TAG
                ? selectedTags.length === 0
                : selectedTags.includes(normalizedTagKey);
            const postCount =
              tag === ALL_TAG
                ? allPosts.length
                : (tagCounts.get(normalizedTagKey) ?? 0);

            return (
              <li key={tag}>
                <button
                  type="button"
                  className={`sidebar-category-button ${isActive ? "sidebar-category-button-active" : ""}`}
                  onClick={() => toggleTagSelection(tag)}
                >
                  <span>{tag}</span>
                  <span className="sidebar-tag-count">{postCount}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </main>
  );
}
