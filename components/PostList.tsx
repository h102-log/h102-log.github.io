'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatDateToYmd } from '@/src/lib/date';

type PostItem = { 
  id: string;
  title: string;
  description: string;
  date: string;
};

type PostListProps = {
  initialPosts: PostItem[];
  allPosts: PostItem[];
};

export default function PostList({ initialPosts, allPosts }: PostListProps) {
  const [visibleCount, setVisibleCount] = useState(initialPosts.length);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const visiblePosts = allPosts.slice(0, visibleCount);

  useEffect(() => {
    // [방어적 코딩]: 더 이상 가져올 데이터가 없으면 관찰을 중단합니다.
    if (visiblePosts.length >= allPosts.length) {
      return;
    }

    const targetElement = observerTarget.current;

    if (!targetElement) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prevVisibleCount) => Math.min(prevVisibleCount + 10, allPosts.length));
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(targetElement);

    return () => {
      observer.unobserve(targetElement);
      observer.disconnect();
    };
  }, [visiblePosts, allPosts]);

  return (
    <div className="post-list-wrapper">
      <ul className="post-list">
        {visiblePosts.map((post: PostItem) => {
          // 표시용 날짜는 재사용 가능한 util 함수로 통일합니다.
          const formattedDate = formatDateToYmd(post.date);

          return (
            <li key={post.id} className="post-item">
              <Link href={'/posts/' + post.id} className="post-link">
                <div className="post-main">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description">{post.description}</p>
                </div>
                <time className="post-date" dateTime={formattedDate}>
                  {formattedDate}
                </time>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* [디자인/UX]: 이 요소가 화면에 보이면 다음 데이터를 로드합니다. */}
      {visiblePosts.length < allPosts.length && (
        <div ref={observerTarget} className="loading-indicator">
          <p>목록을 불러오는 중입니다...</p>
        </div>
      )}
    </div>
  );
}