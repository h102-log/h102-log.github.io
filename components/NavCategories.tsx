"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { key: "backend", label: "BackEnd" },
  { key: "frontend", label: "FrontEnd" },
  { key: "project", label: "Project" },
] as const;

function normalizeCategoryKey(value: string): string {
  return value.trim().toLowerCase();
}

export default function NavCategories() {
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    const updateActiveCategory = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveCategory(normalizeCategoryKey(params.get("category") ?? ""));
    };

    updateActiveCategory();
    window.addEventListener("popstate", updateActiveCategory);

    return () => {
      window.removeEventListener("popstate", updateActiveCategory);
    };
  }, []);

  return (
    <div className="nav-categories" aria-label="카테고리 메뉴">
      {CATEGORIES.map((category, index) => {
        const isActive = activeCategory === category.key;

        return (
          <Fragment key={category.key}>
            {index > 0 ? (
              <span className="category-divider" aria-hidden="true">
                |
              </span>
            ) : null}
            <Link
              href={`/?category=${category.key}`}
              className={`category-button ${isActive ? "category-button-active" : ""}`}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.label}
            </Link>
          </Fragment>
        );
      })}
    </div>
  );
}
