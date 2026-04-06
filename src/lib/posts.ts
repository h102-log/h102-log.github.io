import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkBreaks from "remark-breaks";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options as RehypePrettyCodeOptions } from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

type HtmlNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HtmlNode[];
  properties?: Record<string, unknown>;
};

export type PostTocItem = {
  id: string;
  text: string;
  level: number;
};

const IMAGE_SIZE_TOKEN_PATTERN = /\b([wh])\s*=\s*(\d{2,4})\b/gi;
const MIN_POST_IMAGE_WIDTH = 160;
const MAX_POST_IMAGE_WIDTH = 1200;
const MIN_POST_IMAGE_HEIGHT = 120;
const MAX_POST_IMAGE_HEIGHT = 1200;

export type PostSummary = {
  id: string;
  title: string;
  date: string;
  description: string;
  tag?: string[];
  category?: string[];
  group?: string;
  updatedAt?: string;
  draft?: boolean;
  thumbnail?: string;
};

export type PostNavigation = {
  previousPost: PostSummary | null;
  nextPost: PostSummary | null;
  relatedPosts: PostSummary[];
  groupPosts: PostSummary[];
  groupName?: string;
};

type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  tag?: string | string[];
  group?: string;
  category?: string | string[];
  updatedAt?: string;
  draft?: boolean;
  thumbnail?: string;
};

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function normalizeTags(value: unknown): string[] | undefined {
  if (typeof value === "string") {
    const normalizedTag = value.trim();
    return normalizedTag ? [normalizedTag] : undefined;
  }

  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalizedTags = value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return normalizedTags.length > 0 ? normalizedTags : undefined;
}

function visitHtmlTree(
  node: HtmlNode,
  visitor: (currentNode: HtmlNode) => void,
) {
  visitor(node);
  node.children?.forEach((childNode) => visitHtmlTree(childNode, visitor));
}

function getHtmlNodeText(node: HtmlNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  if (!node.children || node.children.length === 0) {
    return "";
  }

  return node.children.map((childNode) => getHtmlNodeText(childNode)).join("");
}

function createHeadingSlugger() {
  const usedSlugCountMap = new Map<string, number>();

  return (headingText: string) => {
    const baseSlug =
      headingText
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "section";

    const usedCount = usedSlugCountMap.get(baseSlug) ?? 0;
    usedSlugCountMap.set(baseSlug, usedCount + 1);

    return usedCount === 0 ? baseSlug : `${baseSlug}-${usedCount}`;
  };
}

function clampPostImageWidth(width: number) {
  return Math.max(
    MIN_POST_IMAGE_WIDTH,
    Math.min(MAX_POST_IMAGE_WIDTH, Math.round(width)),
  );
}

function clampPostImageHeight(height: number) {
  return Math.max(
    MIN_POST_IMAGE_HEIGHT,
    Math.min(MAX_POST_IMAGE_HEIGHT, Math.round(height)),
  );
}

function rehypeApplyImageWidthFromTitle() {
  return (tree: HtmlNode) => {
    visitHtmlTree(tree, (currentNode) => {
      if (currentNode.tagName !== "img") {
        return;
      }

      const titleValue =
        typeof currentNode.properties?.title === "string"
          ? currentNode.properties.title
          : undefined;

      if (!titleValue) {
        return;
      }

      let matchResult = IMAGE_SIZE_TOKEN_PATTERN.exec(titleValue);
      let parsedWidth: number | undefined;
      let parsedHeight: number | undefined;

      while (matchResult) {
        const token = matchResult[1]?.toLowerCase();
        const parsedSize = Number.parseInt(matchResult[2], 10);

        if (!Number.isNaN(parsedSize)) {
          if (token === "w") {
            parsedWidth = clampPostImageWidth(parsedSize);
          }

          if (token === "h") {
            parsedHeight = clampPostImageHeight(parsedSize);
          }
        }

        matchResult = IMAGE_SIZE_TOKEN_PATTERN.exec(titleValue);
      }

      IMAGE_SIZE_TOKEN_PATTERN.lastIndex = 0;

      // align 토큰 파싱: align=left | center | right
      const alignMatch = /\balign=(left|center|right)\b/i.exec(titleValue);
      const parsedAlign = alignMatch
        ? (alignMatch[1].toLowerCase() as "left" | "center" | "right")
        : undefined;

      if (!parsedWidth && !parsedHeight && !parsedAlign) {
        return;
      }

      const existingStyle =
        typeof currentNode.properties?.style === "string"
          ? currentNode.properties.style
          : "";
      const sizeStyleParts = [
        parsedWidth ? `width: min(100%, ${parsedWidth}px)` : "",
        parsedHeight ? `height: ${parsedHeight}px` : "",
        parsedHeight ? "object-fit: fill" : "",
        parsedAlign === "left" ? "float: left; margin: 0 16px 8px 0" : "",
        parsedAlign === "right" ? "float: right; margin: 0 0 8px 16px" : "",
        parsedAlign === "center" && parsedWidth
          ? "display: block; margin-left: auto; margin-right: auto"
          : "",
      ].filter(Boolean);

      const titleWithoutWidthToken = titleValue
        .replace(IMAGE_SIZE_TOKEN_PATTERN, "")
        .replace(/\balign=(left|center|right)\b/gi, "")
        .trim();
      IMAGE_SIZE_TOKEN_PATTERN.lastIndex = 0;

      currentNode.properties = {
        ...(currentNode.properties ?? {}),
        style: `${existingStyle ? `${existingStyle}; ` : ""}${sizeStyleParts.join("; ")};`,
      };

      if (titleWithoutWidthToken) {
        currentNode.properties.title = titleWithoutWidthToken;
      } else {
        delete currentNode.properties.title;
      }
    });
  };
}

function rehypeApplyAttachmentDownload() {
  return (tree: HtmlNode) => {
    visitHtmlTree(tree, (currentNode) => {
      if (currentNode.tagName !== "a") {
        return;
      }

      const hrefValue =
        typeof currentNode.properties?.href === "string"
          ? currentNode.properties.href
          : "";
      const titleValue =
        typeof currentNode.properties?.title === "string"
          ? currentNode.properties.title
          : undefined;
      const hasDownloadToken =
        typeof titleValue === "string" && /\bdownload\b/i.test(titleValue);
      const isAttachmentHref = hrefValue.startsWith("/files/");

      if (!isAttachmentHref && !hasDownloadToken) {
        return;
      }

      const existingClassName = currentNode.properties?.className;
      const normalizedClassName = Array.isArray(existingClassName)
        ? existingClassName
        : typeof existingClassName === "string"
          ? existingClassName.split(" ").filter(Boolean)
          : [];
      const nextClassName = normalizedClassName.includes("post-download-link")
        ? normalizedClassName
        : [...normalizedClassName, "post-download-link"];

      const titleWithoutDownloadToken =
        typeof titleValue === "string"
          ? titleValue.replace(/\bdownload\b/gi, "").trim()
          : undefined;

      currentNode.properties = {
        ...(currentNode.properties ?? {}),
        className: nextClassName,
        download: "",
      };

      if (titleWithoutDownloadToken) {
        currentNode.properties.title = titleWithoutDownloadToken;
      } else {
        delete currentNode.properties.title;
      }
    });
  };
}

function rehypeCollectTocAndApplyHeadingId(options?: {
  tocItems?: PostTocItem[];
}) {
  return (tree: HtmlNode) => {
    const tocItems = options?.tocItems ?? [];
    const slugifyHeading = createHeadingSlugger();

    visitHtmlTree(tree, (currentNode) => {
      const headingMatch =
        typeof currentNode.tagName === "string"
          ? /^h([1-6])$/.exec(currentNode.tagName)
          : null;

      if (!headingMatch) {
        return;
      }

      const headingLevel = Number.parseInt(headingMatch[1], 10);
      const headingText = getHtmlNodeText(currentNode)
        .replace(/\s+/g, " ")
        .trim();

      if (!headingText) {
        return;
      }

      const existingId =
        typeof currentNode.properties?.id === "string"
          ? currentNode.properties.id
          : undefined;
      const headingId = existingId || slugifyHeading(headingText);

      currentNode.properties = {
        ...(currentNode.properties ?? {}),
        id: headingId,
      };

      if (headingLevel >= 2 && headingLevel <= 4) {
        tocItems.push({
          id: headingId,
          text: headingText,
          level: headingLevel,
        });
      }
    });
  };
}

function parseValidFrontmatter(data: unknown): PostFrontmatter | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const frontmatter = data as Partial<PostFrontmatter>;

  if (
    typeof frontmatter.title !== "string" ||
    typeof frontmatter.date !== "string" ||
    typeof frontmatter.description !== "string"
  ) {
    return null;
  }

  const title = frontmatter.title.trim();
  const date = frontmatter.date.trim();
  const description = frontmatter.description.trim();

  if (!title || !date || !description) {
    return null;
  }

  return {
    title,
    date,
    description,
    // 하위 호환을 위해 기존 category 키도 tag로 병합해 처리합니다.
    tag: normalizeTags(frontmatter.tag ?? frontmatter.category),
    category: normalizeTags(frontmatter.category),
    group: normalizeText(frontmatter.group),
    updatedAt: normalizeText(frontmatter.updatedAt),
    draft: typeof frontmatter.draft === "boolean" ? frontmatter.draft : false,
    thumbnail: normalizeText(frontmatter.thumbnail),
  };
}

function getDateValue(date: string): number {
  const parsed = Date.parse(date);
  return Number.isNaN(parsed) ? 0 : parsed;
}
// [비즈니스 로직 의도]: 블로그 폴더의 절대 경로를 미리 계산해 둡니다.
// process.cwd()는 현재 Node.js 프로세스가 실행되는 위치(프로젝트 최상단)를 반환합니다.
const postsDirectory = path.join(process.cwd(), "posts");

// [비즈니스 로직 의도]: posts 폴더 안의 모든 마크다운 파일을 읽어와서 배열로 반환하는 함수입니다.
export function getAllPostsData() {
  try {
    // [주의사항/Edge Case 방어]: 만약 사용자가 'posts' 폴더를 깜빡하고 안 만들었을 경우,
    // 서버가 터지는(Crash) 것을 방지하기 위해 폴더 존재 여부를 먼저 검사합니다.
    if (!fs.existsSync(postsDirectory)) {
      console.warn("posts 폴더가 존재하지 않습니다.");
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);

    const allPostsData = fileNames
      // [주의사항/Edge Case 방어]: macOS의 .DS_Store 같은 숨김 파일이나
      // 이미지가 섞여 있을 수 있으므로, 확장자가 .md인 파일만 필터링합니다.
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => {
        // [비즈니스 로직 의도]: 파일 이름에서 '.md'를 제거하여 URL 라우팅에 쓸 id(slug)를 만듭니다.
        // 예: 'hello-world.md' -> 'hello-world'
        const id = fileName.replace(/\.md$/, "");

        // 마크다운 파일을 문자열(utf-8) 형태로 읽어옵니다.
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");

        // [비즈니스 로직 의도]: gray-matter를 사용해 메타데이터(Frontmatter)와 본문을 분리합니다.
        const matterResult = matter(fileContents);

        const frontmatter = parseValidFrontmatter(matterResult.data);

        if (!frontmatter) {
          // 필수 frontmatter가 없거나 비어 있으면 목록에서 제외합니다.
          return null;
        }

        if (frontmatter.draft) {
          return null;
        }

        // id와 메타데이터를 합쳐서 하나의 객체로 반환합니다.
        return {
          id,
          ...frontmatter,
        };
      })
      .filter(
        (post): post is { id: string } & PostFrontmatter => post !== null,
      );

    // [비즈니스 로직 의도]: 블로그 메인 화면에서는 최신 글이 먼저 나와야 하므로,
    // 날짜(date)를 기준으로 내림차순 정렬을 수행합니다.
    return allPostsData.sort(
      (a, b) => getDateValue(b.date) - getDateValue(a.date),
    );
  } catch (error) {
    // [주의사항/Edge Case 방어]: 파일을 읽는 도중 권한 문제 등으로 에러가 발생할 경우를 대비합니다.
    console.error("게시글 데이터를 가져오는 중 에러가 발생했습니다:", error);
    return [];
  }
}

function getSharedTagCount(
  leftTags: string[] | undefined,
  rightTags: string[] | undefined,
) {
  if (
    !leftTags ||
    !rightTags ||
    leftTags.length === 0 ||
    rightTags.length === 0
  ) {
    return 0;
  }

  const rightTagSet = new Set(rightTags);
  return leftTags.filter((tag) => rightTagSet.has(tag)).length;
}

function pickRandomPost(posts: PostSummary[]): PostSummary | null {
  if (posts.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * posts.length);
  return posts[randomIndex] ?? null;
}

export function getPostNavigation(id: string): PostNavigation {
  const allPosts = getAllPostsData() as PostSummary[];
  const currentPostIndex = allPosts.findIndex((post) => post.id === id);

  if (currentPostIndex === -1) {
    return {
      previousPost: null,
      nextPost: null,
      relatedPosts: [],
      groupPosts: [],
      groupName: undefined,
    };
  }

  const currentPost = allPosts[currentPostIndex];

  const previousPost =
    currentPostIndex < allPosts.length - 1
      ? allPosts[currentPostIndex + 1]
      : null;

  const nextPost = currentPostIndex > 0 ? allPosts[currentPostIndex - 1] : null;

  const candidates = allPosts.filter((post) => post.id !== id);
  const maxRelatedPosts = Math.min(3, candidates.length);
  const selectedIdSet = new Set<string>();
  let hasRandomPick = false;

  const scoreByTagAndDate = (post: PostSummary) => ({
    post,
    sharedTagCount: getSharedTagCount(currentPost.tag, post.tag),
    dateDistance: Math.abs(
      getDateValue(currentPost.date) - getDateValue(post.date),
    ),
  });

  const sortedGroupCandidates = candidates
    .filter((post) => currentPost.group && post.group === currentPost.group)
    .map(scoreByTagAndDate)
    .sort((left, right) => {
      if (right.sharedTagCount !== left.sharedTagCount) {
        return right.sharedTagCount - left.sharedTagCount;
      }

      if (left.dateDistance !== right.dateDistance) {
        return left.dateDistance - right.dateDistance;
      }

      return getDateValue(right.post.date) - getDateValue(left.post.date);
    })
    .map(({ post }) => post);

  const sortedTagCandidates = candidates
    .filter(
      (post) =>
        (!currentPost.group || post.group !== currentPost.group) &&
        getSharedTagCount(currentPost.tag, post.tag) > 0,
    )
    .map(scoreByTagAndDate)
    .sort((left, right) => {
      if (right.sharedTagCount !== left.sharedTagCount) {
        return right.sharedTagCount - left.sharedTagCount;
      }

      if (left.dateDistance !== right.dateDistance) {
        return left.dateDistance - right.dateDistance;
      }

      return getDateValue(right.post.date) - getDateValue(left.post.date);
    })
    .map(({ post }) => post);

  const relatedPosts: PostSummary[] = [];

  const takeByPriority = (priorityPosts: PostSummary[]) => {
    for (const post of priorityPosts) {
      if (relatedPosts.length >= maxRelatedPosts) {
        return;
      }

      if (selectedIdSet.has(post.id)) {
        continue;
      }

      relatedPosts.push(post);
      selectedIdSet.add(post.id);
    }
  };

  takeByPriority(sortedGroupCandidates);
  takeByPriority(sortedTagCandidates);

  while (relatedPosts.length < maxRelatedPosts) {
    const remainingCandidates = candidates.filter(
      (post) => !selectedIdSet.has(post.id),
    );
    const randomPost = pickRandomPost(remainingCandidates);

    if (!randomPost) {
      break;
    }

    relatedPosts.push(randomPost);
    selectedIdSet.add(randomPost.id);
    hasRandomPick = true;
  }

  if (!hasRandomPick && relatedPosts.length > 0) {
    const remainingCandidates = candidates.filter(
      (post) => !selectedIdSet.has(post.id),
    );
    const forcedRandomPost = pickRandomPost(remainingCandidates);

    if (forcedRandomPost) {
      relatedPosts[relatedPosts.length - 1] = forcedRandomPost;
      hasRandomPick = true;
    }
  }

  const groupName = currentPost.group;
  const groupPosts = groupName
    ? allPosts
        .filter((post) => post.group === groupName)
        .sort((left, right) => {
          const dateDiff = getDateValue(left.date) - getDateValue(right.date);

          if (dateDiff !== 0) {
            return dateDiff;
          }

          return left.title.localeCompare(right.title, "ko");
        })
    : [];

  return {
    previousPost,
    nextPost,
    relatedPosts,
    groupPosts,
    groupName,
  };
}

// [비즈니스 로직 의도]: 파일명(id)을 받아 해당 마크다운 파일의 본문을 HTML 문자열로 변환하여 반환합니다.
export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // 메타데이터와 마크다운 본문을 분리합니다.
  const matterResult = matter(fileContents);
  const frontmatter = parseValidFrontmatter(matterResult.data);

  if (!frontmatter) {
    throw new Error(`필수 frontmatter 누락: posts/${id}.md`);
  }

  // [비즈니스 로직 의도]: remark 라이브러리를 사용하여 순수 마크다운 텍스트를 HTML 태그로 변환합니다.
  // 이 과정은 비동기(async)로 이루어지므로 await 키워드가 필요합니다.
  const tocItems: PostTocItem[] = [];
  const prettyCodeOptions: RehypePrettyCodeOptions = {
    keepBackground: false,
    defaultLang: "text",
  };

  const processedContent = await remark()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCollectTocAndApplyHeadingId, { tocItems })
    .use(rehypeApplyImageWidthFromTitle)
    .use(rehypeApplyAttachmentDownload)
    // [비즈니스 로직 의도]: 에디터 스타일의 고급 문법 하이라이팅을 적용합니다.
    .use(rehypePrettyCode, prettyCodeOptions)
    // [비즈니스 로직 의도]: 코드 블록 상단 툴바(Copy 버튼/언어 라벨)를 자동으로 주입합니다.
    .use(rehypeEnhanceCodeBlock)
    .use(rehypeStringify)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    toc: tocItems,
    ...frontmatter,
  };
}

function getNodeClassNames(node: HtmlNode): string[] {
  const classNameValue = node.properties?.className;

  if (Array.isArray(classNameValue)) {
    return classNameValue.filter(
      (value): value is string => typeof value === "string",
    );
  }

  if (typeof classNameValue === "string") {
    return classNameValue
      .split(" ")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function detectCodeLanguage(preNode: HtmlNode): string {
  const codeNode = preNode.children?.find(
    (childNode) => childNode.tagName === "code",
  );

  if (!codeNode) {
    return "TEXT";
  }

  const languageClassName = getNodeClassNames(codeNode).find((className) =>
    className.startsWith("language-"),
  );

  if (!languageClassName) {
    return "TEXT";
  }

  const parsedLanguage = languageClassName.replace("language-", "");
  return parsedLanguage ? parsedLanguage.toUpperCase() : "TEXT";
}

function rehypeEnhanceCodeBlock() {
  return (tree: HtmlNode) => {
    const wrapCodeBlock = (
      currentNode: HtmlNode,
      parentNode?: HtmlNode,
      childIndex?: number,
    ) => {
      if (
        currentNode.tagName === "pre" &&
        parentNode?.children &&
        typeof childIndex === "number"
      ) {
        const language = detectCodeLanguage(currentNode);

        parentNode.children[childIndex] = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["post-code-block"],
          },
          children: [
            {
              type: "element",
              tagName: "div",
              properties: {
                className: ["post-code-toolbar"],
              },
              children: [
                {
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: ["post-code-language"],
                    "aria-hidden": "true",
                  },
                  children: [{ type: "text", value: language }],
                },
                {
                  type: "element",
                  tagName: "button",
                  properties: {
                    type: "button",
                    className: ["post-code-copy-button"],
                    "aria-label": "코드 복사",
                  },
                  children: [{ type: "text", value: "Copy" }],
                },
              ],
            },
            currentNode,
          ],
        };

        return;
      }

      currentNode.children?.forEach((childNode, index) => {
        wrapCodeBlock(childNode, currentNode, index);
      });
    };

    wrapCodeBlock(tree);
  };
}
