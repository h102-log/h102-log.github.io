'use client';

import { useMemo, useState } from 'react';
import PostList from '@/components/PostList';

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

const ALL_TAG = '전체';

export default function HomeContent({ allPosts }: HomeContentProps) {
  // 선택된 태그 배열(빈 배열이면 전체 보기)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();

    allPosts.forEach((post) => {
      const tags = Array.isArray(post.tag)
        ? post.tag
        : typeof post.tag === 'string' && post.tag.trim() !== ''
          ? [post.tag]
          : [];

      tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return counts;
  }, [allPosts]);

  const tags = useMemo(() => {
    const values = allPosts.flatMap((post) => {
      if (Array.isArray(post.tag)) {
        return post.tag;
      }

      if (typeof post.tag === 'string' && post.tag.trim() !== '') {
        return [post.tag];
      }
      
      return [];
    });

    return [ALL_TAG, ...Array.from(new Set(values))];
  }, [allPosts]);

  const tagFilteredPosts = useMemo(() => {
    // 태그를 선택하지 않으면 전체 글을 보여줍니다.
    if (selectedTags.length === 0) {
      return allPosts;
    }

    return allPosts.filter((post) => {
      if (Array.isArray(post.tag)) {
        // OR 조건: 선택 태그 중 하나라도 포함되면 노출
        return post.tag.some((tag) => selectedTags.includes(tag));
      }

      return typeof post.tag === 'string' && selectedTags.includes(post.tag);
    });
  }, [allPosts, selectedTags]);

  // 전체는 초기화, 개별 태그는 토글 선택 
  const toggleTagSelection = (tag: string) => {
    if (tag === ALL_TAG) {
      setSelectedTags([]);
      return;
    }

    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((selectedTag) => selectedTag !== tag);
      }

      return [...prevTags, tag];
    });
  };

  const initialPosts = tagFilteredPosts.slice(0, 10);

  return (
    <main className="main-container home-layout">
      <aside className="home-sidebar" aria-label="태그 목록">
        <h2 className="sidebar-title">태그</h2>
        <ul className="sidebar-category-list">
          {tags.map((tag) => {
            const isActive = tag === ALL_TAG ? selectedTags.length === 0 : selectedTags.includes(tag);
            const postCount = tag === ALL_TAG ? allPosts.length : (tagCounts.get(tag) ?? 0);

            return (
              <li key={tag}>
                <button
                  type="button"
                  className={`sidebar-category-button ${isActive ? 'sidebar-category-button-active' : ''}`}
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

      <div className="home-main-content">
        <header className="blog-header home-hero">
          <p className="hero-kicker"></p>
          <p className="hero-description"></p>
        </header>

        <section className="post-list-section">
          <div className="section-headline">
            <h2>Writing</h2>
            <p>
              {tagFilteredPosts.length} posts
            </p>
          </div>

          {tagFilteredPosts.length === 0 ? (
            <p className="empty-post-message">조건에 맞는 글이 없습니다.</p>
          ) : (
            <PostList
              key={selectedTags.length === 0 ? ALL_TAG : selectedTags.slice().sort().join('|')}
              initialPosts={initialPosts}
              allPosts={tagFilteredPosts}
            ></PostList>
          )}
        </section>
      </div>
    </main>
  );
}
