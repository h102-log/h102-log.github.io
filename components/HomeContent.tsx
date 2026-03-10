'use client';

import { useMemo, useState } from 'react';
import PostList from '@/components/PostList';

type PostItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  category?: string | string[];
};

type HomeContentProps = {
  allPosts: PostItem[];
};

const ALL_CATEGORY = '전체';

export default function HomeContent({ allPosts }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);

  const categories = useMemo(() => {
    const values = allPosts.flatMap((post) => {
      if (Array.isArray(post.category)) {
        return post.category;
      }

      if (typeof post.category === 'string' && post.category.trim() !== '') {
        return [post.category];
      }
      
      return [];
    });

    return [ALL_CATEGORY, ...Array.from(new Set(values))];
  }, [allPosts]);

  const categoryFilteredPosts = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) {
      return allPosts;
    }

    return allPosts.filter((post) => {
      if (Array.isArray(post.category)) {
        return post.category.includes(selectedCategory);
      }

      return post.category === selectedCategory;
    });
  }, [allPosts, selectedCategory]);

  const initialPosts = categoryFilteredPosts.slice(0, 10);

  return (
    <main className="main-container home-layout">
      <aside className="home-sidebar" aria-label="카테고리 목록">
        <h2 className="sidebar-title">카테고리</h2>
        <ul className="sidebar-category-list">
          {categories.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <li key={category}>
                <button
                  type="button"
                  className={`sidebar-category-button ${isActive ? 'sidebar-category-button-active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
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
              {categoryFilteredPosts.length} / {allPosts.length} posts
            </p>
          </div>

          {categoryFilteredPosts.length === 0 ? (
            <p className="empty-post-message">조건에 맞는 글이 없습니다.</p>
          ) : (
            <PostList initialPosts={initialPosts} allPosts={categoryFilteredPosts}></PostList>
          )}
        </section>
      </div>
    </main>
  );
}
