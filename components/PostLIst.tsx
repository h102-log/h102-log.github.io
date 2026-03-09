'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
  const [visiblePosts, setVisiblePosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // [비즈니스 로직]: 스크롤이 끝에 닿았을 때 실행할 함수
  const loadMorePosts = () => {
    const nextStep = (page + 1) * 10;
    const nextPosts = allPosts.slice(0, nextStep);
    
    setVisiblePosts(nextPosts);
    setPage(page + 1);
  };

  useEffect(() => {
    // [방어적 코딩]: 더 이상 가져올 데이터가 없으면 관찰을 중단합니다.
    if (visiblePosts.length >= allPosts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [visiblePosts, allPosts]);

  return (
    <div className="post-list-wrapper">
      <ul className="post-list">
        {visiblePosts.map((post: PostItem) => (
          <li key={post.id} className="post-item">
            <Link href={'/posts/' + post.id} className="post-link">
              <div className="post-main">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
              </div>
            </Link>
          </li>
        ))}
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