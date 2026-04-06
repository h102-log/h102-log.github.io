"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PostList from "@/components/PostList";

type PostItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  tag?: string | string[];
  category?: string | string[];
};

type HomeContentProps = {
  allPosts: PostItem[];
};

const ALL_TAG = "전체";
const CATEGORY_LABELS: Record<string, string> = {
  backend: "BackEnd",
  frontend: "FrontEnd",
  project: "Project",
};

function normalizeTagKey(tagValue: string): string {
  return tagValue.trim().toLowerCase();
}

function normalizeCategoryKey(categoryValue: string): string {
  return categoryValue.trim().toLowerCase();
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

function extractCategoryValues(categoryValue?: string | string[]): string[] {
  if (Array.isArray(categoryValue)) {
    return categoryValue.map((category) => category.trim()).filter(Boolean);
  }

  if (typeof categoryValue === "string" && categoryValue.trim() !== "") {
    return [categoryValue.trim()];
  }

  return [];
}

function SearchParamsHandler({
  setSelectedCategory,
  setSelectedTags,
}: {
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    const categoryParam = searchParams.get("category");
    const nextCategory =
      categoryParam && categoryParam.trim() !== ""
        ? normalizeCategoryKey(categoryParam)
        : null;

    setSelectedCategory(nextCategory);

    const tagParam = searchParams.get("tag");
    if (tagParam && tagParam.trim() !== "") {
      const normalizedTags = tagParam
        .split(",")
        .map((tag) => normalizeTagKey(tag))
        .filter(Boolean);

      setSelectedTags(Array.from(new Set(normalizedTags)));
      return;
    }

    setSelectedTags([]);
  }, [searchParams, setSelectedCategory, setSelectedTags]);

  return null;
}

export default function HomeContent({ allPosts }: HomeContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categoryFilteredPosts = useMemo(() => {
    if (!selectedCategory) {
      return allPosts;
    }

    return allPosts.filter((post) => {
      const normalizedCategoryKeys = extractCategoryValues(post.category).map(
        (category) => normalizeCategoryKey(category),
      );

      return normalizedCategoryKeys.includes(selectedCategory);
    });
  }, [allPosts, selectedCategory]);

  const tagLabelByKey = useMemo(() => {
    const labelMap = new Map<string, string>();

    categoryFilteredPosts.forEach((post) => {
      const values = extractTagValues(post.tag);
      values.forEach((value) => {
        const key = normalizeTagKey(value);
        if (!labelMap.has(key)) {
          labelMap.set(key, value);
        }
      });
    });

    return labelMap;
  }, [categoryFilteredPosts]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();

    categoryFilteredPosts.forEach((post) => {
      const tags = extractTagValues(post.tag);
      const uniqueTagKeys = new Set(tags.map((tag) => normalizeTagKey(tag)));

      uniqueTagKeys.forEach((tagKey) => {
        counts.set(tagKey, (counts.get(tagKey) ?? 0) + 1);
      });
    });

    return counts;
  }, [categoryFilteredPosts]);

  const availableTagKeySet = useMemo(() => {
    return new Set(tagLabelByKey.keys());
  }, [tagLabelByKey]);

  const activeSelectedTags = useMemo(() => {
    return selectedTags.filter((tagKey) => availableTagKeySet.has(tagKey));
  }, [selectedTags, availableTagKeySet]);

  const tags = useMemo(() => {
    return [ALL_TAG, ...Array.from(tagLabelByKey.values())];
  }, [tagLabelByKey]);

  const tagFilteredPosts = useMemo(() => {
    if (activeSelectedTags.length === 0) {
      return categoryFilteredPosts;
    }

    return categoryFilteredPosts.filter((post) => {
      const normalizedTagKeys = extractTagValues(post.tag).map((tag) =>
        normalizeTagKey(tag),
      );
      return normalizedTagKeys.some((tagKey) =>
        activeSelectedTags.includes(tagKey),
      );
    });
  }, [categoryFilteredPosts, activeSelectedTags]);

  const pushFilterState = (nextCategory: string | null, nextTags: string[]) => {
    const nextSearchParams = new URLSearchParams();

    if (nextCategory) {
      nextSearchParams.set("category", nextCategory);
    }

    if (nextTags.length > 0) {
      nextSearchParams.set("tag", nextTags.join(","));
    }

    const queryString = nextSearchParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const toggleTagSelection = (tag: string) => {
    if (tag === ALL_TAG) {
      setSelectedTags([]);
      pushFilterState(selectedCategory, []);
      return;
    }

    const targetTagKey = normalizeTagKey(tag);
    const nextTags = activeSelectedTags.includes(targetTagKey)
      ? activeSelectedTags.filter((selectedTag) => selectedTag !== targetTagKey)
      : [...activeSelectedTags, targetTagKey];

    setSelectedTags(nextTags);
    pushFilterState(selectedCategory, nextTags);
  };

  const categoryLabel =
    selectedCategory && CATEGORY_LABELS[selectedCategory]
      ? CATEGORY_LABELS[selectedCategory]
      : "전체";

  const initialPosts = tagFilteredPosts.slice(0, 10);

  return (
    <main className="main-container home-layout">
      <Suspense fallback={null}>
        <SearchParamsHandler
          setSelectedCategory={setSelectedCategory}
          setSelectedTags={setSelectedTags}
        />
      </Suspense>

      <div className="home-main-content">
        <section className="post-list-section">
          <div className="section-headline">
            <h2>목록</h2>
            <p>
              {categoryLabel} · {tagFilteredPosts.length} posts
            </p>
          </div>

          {tagFilteredPosts.length === 0 ? (
            <p className="empty-post-message">
              {selectedCategory === "project"
                ? "Project 글이 아직 없습니다."
                : "조건에 맞는 글이 없습니다."}
            </p>
          ) : (
            <PostList
              key={`${selectedCategory ?? "all"}|${activeSelectedTags.length === 0 ? ALL_TAG : activeSelectedTags.slice().sort().join("|")}`}
              initialPosts={initialPosts}
              allPosts={tagFilteredPosts}
            />
          )}
        </section>
      </div>

      <aside className="home-sidebar" aria-label="태그 목록">
        <h2 className="sidebar-title">{categoryLabel} 태그</h2>
        <ul className="sidebar-category-list">
          {tags.map((tag) => {
            const normalizedTagKey = normalizeTagKey(tag);
            const isActive =
              tag === ALL_TAG
                ? activeSelectedTags.length === 0
                : activeSelectedTags.includes(normalizedTagKey);
            const postCount =
              tag === ALL_TAG
                ? categoryFilteredPosts.length
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
