import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const siteConfig = {
  title: "h102-log",
  description: "개발자 bh102의 기술 기록과 학습 내용을 정리하는 블로그입니다.",
  url: "https://h102-log.github.io",
  language: "ko",
};

const postsDirectory = path.join(process.cwd(), "posts");
const outputPath = path.join(process.cwd(), "public", "feed.xml");

function normalizeText(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPosts() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      const title = normalizeText(data.title);
      const date = normalizeText(data.date);
      const description = normalizeText(data.description);
      const updatedAt = normalizeText(data.updatedAt);
      const isDraft = typeof data.draft === "boolean" ? data.draft : false;

      if (!title || !date || !description || isDraft) {
        return null;
      }

      return {
        id: fileName.replace(/\.md$/, ""),
        title,
        date,
        description,
        updatedAt,
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        Date.parse(right.updatedAt ?? right.date) -
        Date.parse(left.updatedAt ?? left.date),
    );
}

function generateFeedXml(posts) {
  const items = posts
    .map((post) => {
      const postUrl = `${siteConfig.url}/posts/${post.id}`;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join("");

  const lastBuildDate =
    posts[0]?.updatedAt ?? posts[0]?.date ?? new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.language}</language>
    <lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`;
}

const posts = getPosts();
const feedXml = generateFeedXml(posts);

fs.writeFileSync(outputPath, feedXml, "utf8");
console.log(`RSS feed generated: ${outputPath}`);
