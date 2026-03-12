'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type NavSearchPost = {
  id: string;  
  title: string;
  description: string;
};

type NavSearchProps = { 
  posts: NavSearchPost[];
};

export default function NavSearch({ posts }: NavSearchProps) {
  
  const [searchQuery, setSearchQuery] = useState<string>(''); // 검색어 상태를 관리합니다.
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false); // 검색 결과 모달의 열림/닫힘 상태를 관리합니다.
  const searchModalAreaRef = useRef<HTMLDivElement | null>(null); // 검색 모달 영역을 참조하기 위한 ref입니다. 클릭 이벤트가 모달 외부에서 발생했는지 확인하는 데 사용됩니다.

  // 검색어가 변경될 때마다 검색 결과를 계산합니다. 검색은 제목, 설명, ID를 대상으로 수행됩니다.
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return posts.filter((post) => {
      const title = post.title.toLowerCase();
      const description = post.description.toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery)        
      );
    });
  }, [posts, searchQuery]);

  // 검색어가 비어있지 않으면 검색 모달을 열고, 그렇지 않으면 닫습니다.
  useEffect(() => {
    setIsSearchModalOpen(searchQuery.trim() !== '');
  }, [searchQuery]);

  // 검색 모달이 열려 있을 때, 사용자가 모달 외부를 클릭하면 모달이 닫히도록 하는 이벤트 리스너를 설정합니다.
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchModalAreaRef.current) {
        return;
      }

      if (!searchModalAreaRef.current.contains(event.target as Node)) {
        setIsSearchModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className="nav-search-area" ref={searchModalAreaRef}>
      <div className="post-search-input-wrap">
        <input
          id="post-search"
          type="search"
          className="post-search-input"
          placeholder="제목, 설명으로 검색"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          name="post-search"
          value={searchQuery}
          onFocus={() => {
            if (searchQuery.trim() !== '') {
              setIsSearchModalOpen(true);
            }
          }}
          onChange={(event) => setSearchQuery(event.target.value)}  
       />
   
      </div>

      {isSearchModalOpen && (
        <div className="post-search-modal" role="dialog" aria-label="검색 결과">
          <ul className="post-search-result-list">
            {searchResults.length === 0 ? (
              <li className="post-search-empty-message">검색 결과가 없습니다.</li>
            ) : (
              searchResults.slice(0, 8).map((post) => (
                <li key={post.id}>
                  <Link
                    href={'/posts/' + post.id}
                    className="post-search-result-link"
                    onClick={() => setIsSearchModalOpen(false)}
                  >
                    <strong>{post.title}</strong>
                    <span>{post.description}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
