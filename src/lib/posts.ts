import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
  category?: string | string[];
};

function parseValidFrontmatter(data: unknown): PostFrontmatter | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const frontmatter = data as Partial<PostFrontmatter>;

  if (
    typeof frontmatter.title !== 'string' ||
    typeof frontmatter.date !== 'string' ||
    typeof frontmatter.description !== 'string'
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
    category: frontmatter.category,
  };
}

function getDateValue(date: string): number {
  const parsed = Date.parse(date);
  return Number.isNaN(parsed) ? 0 : parsed;
}
// [비즈니스 로직 의도]: 블로그 폴더의 절대 경로를 미리 계산해 둡니다.
// process.cwd()는 현재 Node.js 프로세스가 실행되는 위치(프로젝트 최상단)를 반환합니다.
const postsDirectory = path.join(process.cwd(), 'posts');

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
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        // [비즈니스 로직 의도]: 파일 이름에서 '.md'를 제거하여 URL 라우팅에 쓸 id(slug)를 만듭니다.
        // 예: 'hello-world.md' -> 'hello-world'
        const id = fileName.replace(/\.md$/, '');

        // 마크다운 파일을 문자열(utf-8) 형태로 읽어옵니다.
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // [비즈니스 로직 의도]: gray-matter를 사용해 메타데이터(Frontmatter)와 본문을 분리합니다.
        const matterResult = matter(fileContents);

        const frontmatter = parseValidFrontmatter(matterResult.data);

        if (!frontmatter) {
          // 필수 frontmatter가 없거나 비어 있으면 목록에서 제외합니다.
          return null;
        }

        // id와 메타데이터를 합쳐서 하나의 객체로 반환합니다.
        return {
          id,
          ...frontmatter,
        };
      })
      .filter((post): post is { id: string } & PostFrontmatter => post !== null);

    // [비즈니스 로직 의도]: 블로그 메인 화면에서는 최신 글이 먼저 나와야 하므로,
    // 날짜(date)를 기준으로 내림차순 정렬을 수행합니다.
    return allPostsData.sort((a, b) => getDateValue(b.date) - getDateValue(a.date));

  } catch (error) {
    // [주의사항/Edge Case 방어]: 파일을 읽는 도중 권한 문제 등으로 에러가 발생할 경우를 대비합니다.
    console.error("게시글 데이터를 가져오는 중 에러가 발생했습니다:", error);
    return [];
  }
}

// [비즈니스 로직 의도]: 파일명(id)을 받아 해당 마크다운 파일의 본문을 HTML 문자열로 변환하여 반환합니다.
export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // 메타데이터와 마크다운 본문을 분리합니다.
  const matterResult = matter(fileContents);
  const frontmatter = parseValidFrontmatter(matterResult.data);

  if (!frontmatter) {
    throw new Error(`필수 frontmatter 누락: posts/${id}.md`);
  }

  // [비즈니스 로직 의도]: remark 라이브러리를 사용하여 순수 마크다운 텍스트를 HTML 태그로 변환합니다.
  // 이 과정은 비동기(async)로 이루어지므로 await 키워드가 필요합니다.
  const processedContent = await remark()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(matterResult.content);    
  
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...frontmatter,
  };
}