"use client";

import { useEffect, useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: number;
};

type PostTocProps = {
  items: TocItem[];
};

export default function PostToc({ items }: PostTocProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(
        (heading): heading is HTMLElement => heading instanceof HTMLElement,
      );

    if (headingElements.length === 0) {
      return;
    }

    const updateByScrollPosition = () => {
      const passedHeadings = headingElements
        .filter((heading) => heading.getBoundingClientRect().top <= 120)
        .sort(
          (left, right) =>
            right.getBoundingClientRect().top -
            left.getBoundingClientRect().top,
        );

      if (passedHeadings[0]?.id) {
        setActiveId(passedHeadings[0].id);
      }
    };

    updateByScrollPosition();

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          );

        if (visibleEntries[0]?.target instanceof HTMLElement) {
          setActiveId(visibleEntries[0].target.id);
          return;
        }

        updateByScrollPosition();
      },
      {
        root: null,
        rootMargin: "-90px 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    headingElements.forEach((headingElement) =>
      observer.observe(headingElement),
    );
    window.addEventListener("scroll", updateByScrollPosition, {
      passive: true,
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateByScrollPosition);
    };
  }, [items]);

  if (!items.length) {
    return null;
  }

  return (
    <nav className="post-toc" aria-label="목차">
      <h2 className="post-toc-title">목차</h2>
      <ol className="post-toc-list">
        {items.map((item) => {
          const itemLevelClassName =
            item.level >= 4
              ? "post-toc-item-level-4"
              : item.level === 3
                ? "post-toc-item-level-3"
                : "post-toc-item-level-2";
          const isActive = activeId === item.id;

          return (
            <li key={item.id} className={`post-toc-item ${itemLevelClassName}`}>
              <a
                href={`#${item.id}`}
                className={`post-toc-link${isActive ? " post-toc-link-active" : ""}`}
                aria-current={isActive ? "location" : undefined}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
