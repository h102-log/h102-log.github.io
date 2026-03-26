"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GroupPostItem = {
  id: string;
  title: string;
};

type PostGroupPanelProps = {
  groupName: string;
  groupPosts: GroupPostItem[];
  currentPostId: string;
};

export default function PostGroupPanel({
  groupName,
  groupPosts,
  currentPostId,
}: PostGroupPanelProps) {
  const storageKey = `post-group-expanded:${groupName}`;
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(storageKey) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, isOpen ? "1" : "0");
  }, [isOpen, storageKey]);

  const currentPostIndex = groupPosts.findIndex(
    (post) => post.id === currentPostId,
  );

  const safeCurrentIndex = currentPostIndex >= 0 ? currentPostIndex : 0;
  const previousGroupPost =
    safeCurrentIndex > 0 ? groupPosts[safeCurrentIndex - 1] : null;
  const nextGroupPost =
    safeCurrentIndex < groupPosts.length - 1
      ? groupPosts[safeCurrentIndex + 1]
      : null;

  return (
    <section className="post-group-section" aria-labelledby="post-group-heading">
      <div className="post-group-head">
        <h2 id="post-group-heading">{groupName}</h2>
      </div>

      <div className="post-group-toolbar">
        <button
          type="button"
          className="post-group-toggle"
          onClick={() => setIsOpen((prevIsOpen) => !prevIsOpen)}
          aria-expanded={isOpen}
          aria-controls="post-group-list"
        >
          <span
            className={`post-group-chevron ${isOpen ? "post-group-chevron-open" : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
          목록 보기
        </button>

        <div className="post-group-nav" aria-label="같은 그룹 글 이동">
          <span className="post-group-position">
            {safeCurrentIndex + 1}/{groupPosts.length}
          </span>

          {previousGroupPost ? (
            <Link
              href={`/posts/${previousGroupPost.id}`}
              className="post-group-arrow"
              aria-label="이전 그룹 글"
            >
              <svg
                className="post-group-arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M14.5 6.5L9 12l5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <span className="post-group-arrow post-group-arrow-disabled">
              <svg
                className="post-group-arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M14.5 6.5L9 12l5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}

          {nextGroupPost ? (
            <Link
              href={`/posts/${nextGroupPost.id}`}
              className="post-group-arrow"
              aria-label="다음 그룹 글"
            >
              <svg
                className="post-group-arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9.5 6.5L15 12l-5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ) : (
            <span className="post-group-arrow post-group-arrow-disabled">
              <svg
                className="post-group-arrow-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9.5 6.5L15 12l-5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>
      </div>

      {isOpen ? (
        <ol id="post-group-list" className="post-group-list">
          {groupPosts.map((groupPost) => {
            const isCurrentPost = groupPost.id === currentPostId;

            return (
              <li key={groupPost.id} className="post-group-item">
                {isCurrentPost ? (
                  <strong
                    className="post-group-link post-group-link-current"
                    aria-current="page"
                  >
                    {groupPost.title}
                  </strong>
                ) : (
                  <Link
                    href={`/posts/${groupPost.id}`}
                    className="post-group-link"
                  >
                    {groupPost.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
