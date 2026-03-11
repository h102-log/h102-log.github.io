'use client';

import { ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const REPO_OWNER = 'h102-log';
const REPO_NAME = 'h102-log.github.io';
const DEFAULT_BRANCH = 'main';

type Mode = 'create' | 'update';
type PreviewMode = 'post' | 'markdown';
type PendingImageUpload = {
  file: File;
  imageFilePath: string;
  publicImagePath: string;
  altText: string;
};
type ResizeDirection = 'horizontal' | 'vertical' | 'diagonal';
type ImageSize = {
  width: number;
  height?: number;
};
type ImageAlign = 'left' | 'center' | 'right';

const DEFAULT_PREVIEW_IMAGE_WIDTH = 760;
const DEFAULT_PREVIEW_IMAGE_RATIO = 1.5;
const MIN_PREVIEW_IMAGE_WIDTH = 160;
const MAX_PREVIEW_IMAGE_WIDTH = 1200;
const MIN_PREVIEW_IMAGE_HEIGHT = 120;
const MAX_PREVIEW_IMAGE_HEIGHT = 1200;
const IMAGE_SIZE_TOKEN_PATTERN = /\b([wh])\s*=\s*(\d{2,4})\b/gi;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeSingleQuote(value: string) {
  return value.replace(/'/g, "\\'");
}

function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-ㄱ-ㅎㅏ-ㅣ가-힣]/g, '-')
    .replace(/-+/g, '-');
}

async function encodeFileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

function clampImageWidth(width: number) {
  return Math.max(MIN_PREVIEW_IMAGE_WIDTH, Math.min(MAX_PREVIEW_IMAGE_WIDTH, Math.round(width)));
}

function clampImageHeight(height: number) {
  return Math.max(MIN_PREVIEW_IMAGE_HEIGHT, Math.min(MAX_PREVIEW_IMAGE_HEIGHT, Math.round(height)));
}

function parseImageSizeFromTitle(title?: string | null): Partial<ImageSize> {
  if (typeof title !== 'string') {
    return {};
  }

  let matchResult = IMAGE_SIZE_TOKEN_PATTERN.exec(title);
  let width: number | undefined;
  let height: number | undefined;

  while (matchResult) {
    const token = matchResult[1]?.toLowerCase();
    const parsedSize = Number.parseInt(matchResult[2], 10);

    if (!Number.isNaN(parsedSize)) {
      if (token === 'w') {
        width = clampImageWidth(parsedSize);
      }

      if (token === 'h') {
        height = clampImageHeight(parsedSize);
      }
    }

    matchResult = IMAGE_SIZE_TOKEN_PATTERN.exec(title);
  }

  IMAGE_SIZE_TOKEN_PATTERN.lastIndex = 0;
  return {
    width,
    height,
  };
}

function buildImageTitleWithSize(existingTitle: string | undefined, size: ImageSize) {
  const normalizedWidth = clampImageWidth(size.width);
  const normalizedHeight = typeof size.height === 'number' ? clampImageHeight(size.height) : undefined;
  const cleanedTitle = (existingTitle ?? '').replace(IMAGE_SIZE_TOKEN_PATTERN, '').trim();

  IMAGE_SIZE_TOKEN_PATTERN.lastIndex = 0;

  const tokens = [`w=${normalizedWidth}`];

  if (typeof normalizedHeight === 'number') {
    tokens.push(`h=${normalizedHeight}`);
  }

  return cleanedTitle ? `${cleanedTitle} ${tokens.join(' ')}` : tokens.join(' ');
}

function updateMarkdownImageSizeByIndex(markdown: string, targetImageIndex: number, size: ImageSize) {
  let currentImageIndex = -1;

  return markdown.replace(MARKDOWN_IMAGE_PATTERN, (fullMatch, altText, src, title) => {
    currentImageIndex += 1;

    if (currentImageIndex !== targetImageIndex) {
      return fullMatch;
    }

    const nextTitle = buildImageTitleWithSize(title, size);
    return `![${altText}](${src} "${nextTitle}")`;
  });
}

function parseImageAlignFromTitle(title?: string | null): ImageAlign | undefined {
  if (typeof title !== 'string') {
    return undefined;
  }

  const match = /\balign=(left|center|right)\b/i.exec(title);

  if (!match) {
    return undefined;
  }

  const value = match[1].toLowerCase();
  return (value === 'left' || value === 'center' || value === 'right') ? value : undefined;
}

function updateMarkdownImageAlignByIndex(markdown: string, targetImageIndex: number, align: ImageAlign | null) {
  let currentImageIndex = -1;

  return markdown.replace(MARKDOWN_IMAGE_PATTERN, (fullMatch, altText, src, title) => {
    currentImageIndex += 1;

    if (currentImageIndex !== targetImageIndex) {
      return fullMatch;
    }

    // 기존 title에서 align 토큰 제거
    const cleanedTitle = (title ?? '').replace(/\balign=(left|center|right)\b/gi, '').trim();
    const nextTitle = align
      ? (cleanedTitle ? `${cleanedTitle} align=${align}` : `align=${align}`)
      : cleanedTitle;

    return nextTitle ? `![${altText}](${src} "${nextTitle}")` : `![${altText}](${src})`;
  });
}

function remarkAssignImageIndices() {
  return (tree: { type?: string; children?: Array<Record<string, unknown>> }) => {
    let imageIndex = 0;

    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') {
        return;
      }

      const typedNode = node as {
        type?: string;
        data?: { hProperties?: Record<string, unknown> };
        children?: unknown[];
      };

      if (typedNode.type === 'image') {
        typedNode.data = typedNode.data ?? {};
        typedNode.data.hProperties = {
          ...(typedNode.data.hProperties ?? {}),
          'data-image-index': String(imageIndex),
        };
        imageIndex += 1;
      }

      typedNode.children?.forEach((childNode) => visit(childNode));
    };

    visit(tree);
  };
}

export default function AdminEditor() {
  const [mode, setMode] = useState<Mode>('create');
  const [githubToken, setGithubToken] = useState('');
  const [branch, setBranch] = useState(DEFAULT_BRANCH);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('post');
  const [localPreviewImageMap, setLocalPreviewImageMap] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [resizingImageIndex, setResizingImageIndex] = useState<number | null>(null);
  const [previewImageSizeMap, setPreviewImageSizeMap] = useState<Record<number, ImageSize>>({});
  const [previewImageRatioMap, setPreviewImageRatioMap] = useState<Record<number, number>>({});
  // 현재 클릭으로 선택된 이미지 인덱스 (배치 팝업 표시용)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [previewImageAlignMap, setPreviewImageAlignMap] = useState<Record<number, ImageAlign | null>>({});
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const resizeSessionRef = useRef<{
    imageIndex: number;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    ratio: number;
    currentWidth: number;
    currentHeight: number;
  } | null>(null);

  const computedSlug = useMemo(() => {
    if (slug.trim()) {
      return slugify(slug);
    }

    return slugify(title);
  }, [slug, title]);

  const normalizedTags = useMemo(() => {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tags]);

  const markdownText = useMemo(() => {
    const frontmatterLines = [
      '---',
      `title: '${escapeSingleQuote(title.trim())}'`,
      `date: '${date}'`,
      `description: '${escapeSingleQuote(description.trim())}'`,
    ];

    if (normalizedTags.length === 1) {
      frontmatterLines.push(`tag: '${escapeSingleQuote(normalizedTags[0])}'`);
    }

    if (normalizedTags.length > 1) {
      frontmatterLines.push(`tag: [${normalizedTags.map((tag) => `'${escapeSingleQuote(tag)}'`).join(', ')}]`);
    }

    if (thumbnail.trim()) {
      frontmatterLines.push(`thumbnail: '${escapeSingleQuote(thumbnail.trim())}'`);
    }

    frontmatterLines.push('---', '', content.trimEnd());

    return frontmatterLines.join('\n');
  }, [title, date, description, normalizedTags, thumbnail, content]);

  const filePath = `posts/${computedSlug}.md`;

  const handleImageResizePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    imageIndex: number,
    currentSize: ImageSize,
    direction: ResizeDirection,
    fallbackRatio: number,
  ) => {
    event.preventDefault();

    const safeRatio = fallbackRatio > 0 ? fallbackRatio : DEFAULT_PREVIEW_IMAGE_RATIO;
    const startWidth = clampImageWidth(currentSize.width);
    const startHeight = clampImageHeight(currentSize.height ?? Math.round(startWidth / safeRatio));
    const ratio = startWidth / Math.max(startHeight, 1);

    resizeSessionRef.current = {
      imageIndex,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startWidth,
      startHeight,
      ratio,
      currentWidth: startWidth,
      currentHeight: startHeight,
    };
    setResizingImageIndex(imageIndex);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentSession = resizeSessionRef.current;

      if (!currentSession || currentSession.imageIndex !== imageIndex) {
        return;
      }

      const deltaX = moveEvent.clientX - currentSession.startX;
      const deltaY = moveEvent.clientY - currentSession.startY;

      let nextWidth = currentSession.startWidth;
      let nextHeight = currentSession.startHeight;

      if (currentSession.direction === 'horizontal') {
        nextWidth = clampImageWidth(currentSession.startWidth + deltaX);
      }

      if (currentSession.direction === 'vertical') {
        nextHeight = clampImageHeight(currentSession.startHeight + deltaY);
      }

      if (currentSession.direction === 'diagonal') {
        const ratio = currentSession.ratio > 0 ? currentSession.ratio : DEFAULT_PREVIEW_IMAGE_RATIO;
        const widthByX = currentSession.startWidth + deltaX;
        const widthByY = currentSession.startWidth + (deltaY * ratio);
        const nextWidthRaw = Math.abs(deltaX) >= Math.abs(deltaY * ratio) ? widthByX : widthByY;

        nextWidth = clampImageWidth(nextWidthRaw);
        nextHeight = clampImageHeight(nextWidth / ratio);
      }

      currentSession.currentWidth = nextWidth;
      currentSession.currentHeight = nextHeight;

      setPreviewImageSizeMap((previousMap) => ({
        ...previousMap,
        [imageIndex]: {
          width: nextWidth,
          height: nextHeight,
        },
      }));
    };

    const handlePointerUp = () => {
      const currentSession = resizeSessionRef.current;

      if (currentSession && currentSession.imageIndex === imageIndex) {
        const finalSize: ImageSize = {
          width: currentSession.currentWidth,
          height: currentSession.currentHeight,
        };

        setContent((previousContent) => updateMarkdownImageSizeByIndex(previousContent, imageIndex, finalSize));
      }

      resizeSessionRef.current = null;
      setResizingImageIndex(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  };

  const insertTextIntoContent = (text: string) => {
    const textarea = contentTextareaRef.current;

    if (!textarea) {
      setContent((previousContent) => `${previousContent}${previousContent ? '\n' : ''}${text}`);
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    setContent((previousContent) => {
      const nextContent = `${previousContent.slice(0, selectionStart)}${text}${previousContent.slice(selectionEnd)}`;

      requestAnimationFrame(() => {
        textarea.focus();
        const nextCursorPosition = selectionStart + text.length;
        textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });

      return nextContent;
    });
  };

  // 이미지 배치(float) 변경 후 마크다운 title의 align 토큰에 반영
  const handleAlignChange = (imageIndex: number, align: ImageAlign | null) => {
    setPreviewImageAlignMap((previousMap) => ({ ...previousMap, [imageIndex]: align }));
    setContent((previousContent) => updateMarkdownImageAlignByIndex(previousContent, imageIndex, align));
  };

  const handleImageUpload = async (pendingUploads: PendingImageUpload[]) => {
    if (pendingUploads.length === 0) {
      setStatusMessage('업로드할 이미지 파일을 선택해 주세요.');
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage('이미지를 업로드하는 중입니다...');

    try {
      for (const pendingUpload of pendingUploads) {
        const { file, imageFilePath } = pendingUpload;
        const contentApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${imageFilePath}`;
        const encodedFileContent = await encodeFileToBase64(file);

        const uploadResponse = await fetch(contentApiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken.trim()}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `docs: upload image ${computedSlug || 'draft'}`,
            content: encodedFileContent,
            branch: branch.trim() || DEFAULT_BRANCH,
          }),
        });

        if (!uploadResponse.ok) {
          const errorPayload = await uploadResponse.json().catch(() => ({}));
          const message = typeof errorPayload?.message === 'string'
            ? errorPayload.message
            : '이미지 업로드에 실패했습니다.';
          throw new Error(message);
        }
      }

      setStatusMessage(`${pendingUploads.length}개의 이미지 업로드 완료`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const safeSlug = computedSlug || 'draft';
    const timestamp = Date.now();

    const pendingUploads = files.map((file, index) => {
      const safeFileName = sanitizeFileName(file.name);
      const publicImagePath = `/images/posts/${safeSlug}/${timestamp}-${index}-${safeFileName}`;

      return {
        file,
        imageFilePath: `public${publicImagePath}`,
        publicImagePath,
        altText: file.name.replace(/\.[^.]+$/, ''),
      };
    });

    const markdownImage = pendingUploads
      .map((pendingUpload) => `![${pendingUpload.altText}](${pendingUpload.publicImagePath} "w=${DEFAULT_PREVIEW_IMAGE_WIDTH}")`)
      .join('\n\n');

    insertTextIntoContent(`\n${markdownImage}\n`);

    setLocalPreviewImageMap((previousMap) => {
      const nextMap = { ...previousMap };

      pendingUploads.forEach((pendingUpload) => {
        nextMap[pendingUpload.publicImagePath] = URL.createObjectURL(pendingUpload.file);
      });

      return nextMap;
    });

    if (!githubToken.trim()) {
      setStatusMessage('본문에는 이미지 경로를 삽입했고, 미리보기는 로컬 파일로 표시됩니다. 커밋 전 토큰으로 업로드해 주세요.'); 
      event.target.value = '';
      return;
    }

    await handleImageUpload(pendingUploads);
    event.target.value = '';
  };

  const handleOpenImagePicker = () => {
    imageFileInputRef.current?.click();
  };

  const handleDownload = () => {
    if (!computedSlug) {
      setStatusMessage('slug가 비어 있어 파일을 다운로드할 수 없습니다.');
      return;
    }

    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${computedSlug}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('마크다운 파일을 다운로드했습니다.');
  };

  const handleCommit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!githubToken.trim()) {
      setStatusMessage('GitHub 토큰을 입력해 주세요.');
      return;
    }

    if (!title.trim() || !description.trim() || !computedSlug || !content.trim()) {
      setStatusMessage('제목, 설명, slug, 본문은 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('GitHub에 커밋하는 중입니다...');

    try {
      const contentApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
      const headers = {
        Authorization: `Bearer ${githubToken.trim()}`,
        Accept: 'application/vnd.github+json',
      };

      const getResponse = await fetch(`${contentApiUrl}?ref=${encodeURIComponent(branch.trim() || DEFAULT_BRANCH)}`, {
        method: 'GET',
        headers,
      });

      let existingSha: string | undefined;

      if (getResponse.ok) {
        const existingFile = (await getResponse.json()) as { sha?: string };
        existingSha = existingFile.sha;
      } else if (getResponse.status !== 404) {
        throw new Error('기존 파일 조회에 실패했습니다. 토큰 권한과 브랜치를 확인해 주세요.');
      }

      if (mode === 'create' && existingSha) {
        throw new Error('이미 같은 slug의 파일이 존재합니다. update 모드로 바꾸거나 slug를 변경해 주세요.');
      }

      if (mode === 'update' && !existingSha) {
        throw new Error('수정할 파일을 찾을 수 없습니다. create 모드를 사용하거나 slug를 확인해 주세요.');
      }

      const commitMessage = mode === 'create'
        ? `docs: add post ${computedSlug}`
        : `docs: update post ${computedSlug}`;

      const putResponse = await fetch(contentApiUrl, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodeBase64Utf8(markdownText),
          branch: branch.trim() || DEFAULT_BRANCH,
          sha: existingSha,
        }),
      });

      if (!putResponse.ok) {
        const errorPayload = await putResponse.json().catch(() => ({}));
        const message = typeof errorPayload?.message === 'string'
          ? errorPayload.message
          : '커밋 요청에 실패했습니다.';
        throw new Error(message);
      }

      setStatusMessage(`커밋 완료: ${filePath}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-editor-wrap">
      <form className="admin-editor-form" onSubmit={handleCommit}>
        <div className="admin-editor-grid">
          <label className="admin-field">
            <span>모드</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              <option value="create">새 글 생성</option>
              <option value="update">기존 글 수정</option>
            </select>
          </label>

          <label className="admin-field">
            <span>브랜치</span>
            <input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="main" />
          </label>

          <label className="admin-field admin-field-wide">
            <span>GitHub Token (repo 권한 필요)</span>
            <input
              type="password"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              placeholder="ghp_xxx"
              autoComplete="off"
            />
          </label>

          <label className="admin-field">
            <span>제목</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="글 제목" required />
          </label>

          <label className="admin-field">
            <span>slug</span>
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="hello-world" />
          </label>

          <label className="admin-field">
            <span>날짜</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>

          <label className="admin-field">
            <span>태그 (쉼표 구분)</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Java, Spring" />
          </label>

          <label className="admin-field admin-field-wide">
            <span>설명</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="목록과 SEO에 사용할 짧은 설명"
              required
            />
          </label>

          <label className="admin-field admin-field-wide">
            <span>thumbnail 경로 (선택)</span>
            <input
              value={thumbnail}
              onChange={(event) => setThumbnail(event.target.value)}
              placeholder="/images/posts/cover.png"
            />
          </label>
        </div>

        <label className="admin-field admin-field-wide">
          <div className="admin-content-header">
            <span>본문 (Markdown)</span>
            <button
              type="button"
              className="admin-inline-image-button"
              onClick={handleOpenImagePicker}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? '업로드 중...' : 'IMG +'}
            </button>
          </div>

          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFileChange}
            className="admin-hidden-file-input"
          />

          <textarea
            ref={contentTextareaRef}
            className="admin-content-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="## 제목\n\n본문을 작성하세요."
            required
          />
        </label>

        <div className="admin-editor-actions">
          <button type="button" onClick={handleDownload} className="admin-secondary-button">
            md 다운로드
          </button>
          <button type="submit" disabled={isSubmitting} className="admin-primary-button">
            {isSubmitting ? '커밋 중...' : 'GitHub에 커밋'}
          </button>
        </div>

        <p className="admin-status-message">{statusMessage}</p>
      </form>

      <section className="admin-preview-section" aria-label="미리보기">
        <div className="section-headline">
          <h2>미리보기</h2>
          <p>{filePath}</p>
        </div>

        <div className="admin-preview-toolbar" role="tablist" aria-label="미리보기 모드">
          <button
            type="button"
            className={`admin-toggle-button ${previewMode === 'post' ? 'admin-toggle-button-active' : ''}`}
            onClick={() => setPreviewMode('post')}
          >
            실제 포스트 미리보기
          </button>
          <button
            type="button"
            className={`admin-toggle-button ${previewMode === 'markdown' ? 'admin-toggle-button-active' : ''}`}
            onClick={() => setPreviewMode('markdown')}
          >
            생성될 Markdown
          </button>
        </div>

        {previewMode === 'markdown' ? (
          <pre className="admin-markdown-preview">{markdownText}</pre>
        ) : (
          <div className="admin-preview-post-viewport">
            <article className="admin-post-preview">
              <header className="post-header">
                <h1 className="post-title">{title || '제목 미리보기'}</h1>
                <div className="post-meta-row">
                  <p className="post-date">{date}</p>
                </div>
                {description ? <p className="hero-description admin-preview-description">{description}</p> : null}
              </header>

              {thumbnail ? (
                <div className="admin-preview-thumbnail-wrap">
                  <Image
                    src={thumbnail}
                    alt={title || 'thumbnail preview'}
                    width={1200}
                    height={630}
                    className="admin-preview-thumbnail"
                  />
                </div>
              ) : null}

              <div className="post-content admin-post-content" onClick={() => setSelectedImageIndex(null)}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkAssignImageIndices]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    img: ({ src, alt, title: imageTitle, node }) => {
                      if (typeof src !== 'string' || !src) {
                        return null;
                      }

                      const imageIndexValue = (node?.properties?.['data-image-index'] as string | undefined) ?? '0';
                      const parsedImageIndex = Number.parseInt(imageIndexValue, 10);
                      const imageIndex = Number.isNaN(parsedImageIndex) ? 0 : parsedImageIndex;
                      const parsedSize = parseImageSizeFromTitle(imageTitle);
                      const cachedSize = previewImageSizeMap[imageIndex];
                      const fallbackRatio = previewImageRatioMap[imageIndex] ?? DEFAULT_PREVIEW_IMAGE_RATIO;
                      const resolvedWidth = clampImageWidth(
                        cachedSize?.width ?? parsedSize.width ?? DEFAULT_PREVIEW_IMAGE_WIDTH,
                      );
                      const resolvedHeight = clampImageHeight(
                        cachedSize?.height ?? parsedSize.height ?? Math.round(resolvedWidth / fallbackRatio),
                      );
                      const previewSource = localPreviewImageMap[src] ?? src;
                      // previewImageAlignMap에 명시적으로 등록된 값 우선, 없으면 md title에서 파싱
                      const resolvedAlign = imageIndex in previewImageAlignMap
                        ? previewImageAlignMap[imageIndex]
                        : parseImageAlignFromTitle(imageTitle);
                      const alignStyle = resolvedAlign === 'left'
                        ? { float: 'left' as const, margin: '0 16px 12px 0' }
                        : resolvedAlign === 'right'
                        ? { float: 'right' as const, margin: '0 0 12px 16px' }
                        : resolvedAlign === 'center'
                        ? { marginLeft: 'auto', marginRight: 'auto' }
                        : {};

                      return (
                        <span
                          className={`admin-resizable-image-wrap ${resizingImageIndex === imageIndex ? 'admin-resizable-image-wrap-active' : ''}${selectedImageIndex === imageIndex ? ' admin-resizable-image-wrap-selected' : ''}`}
                          style={{ width: `min(100%, ${resolvedWidth}px)`, height: `${resolvedHeight}px`, ...alignStyle }}
                          onClick={(event) => { event.stopPropagation(); setSelectedImageIndex(imageIndex); }}
                        >
                          <Image
                            src={previewSource}
                            alt={alt ?? 'post image'}
                            fill
                            sizes="(max-width: 760px) 100vw, 760px"
                            className="admin-preview-inline-image"
                            style={{ objectFit: 'fill' }}
                            unoptimized
                            onLoad={(event) => {
                              const nextRatio = event.currentTarget.naturalWidth > 0 && event.currentTarget.naturalHeight > 0
                                ? event.currentTarget.naturalWidth / event.currentTarget.naturalHeight
                                : DEFAULT_PREVIEW_IMAGE_RATIO;

                              setPreviewImageRatioMap((previousMap) => ({
                                ...previousMap,
                                [imageIndex]: nextRatio,
                              }));
                            }}
                          />
                          {/* 이미지 클릭 시 배치 팝업 — Image fill 뒤에 위치해야 z-index가 올바르게 적용됩니다 */}
                          {selectedImageIndex === imageIndex && (
                            <span className="admin-image-align-popup" onClick={(event) => event.stopPropagation()}>
                              <button
                                type="button"
                                className={`admin-align-btn${resolvedAlign === 'left' ? ' admin-align-btn-active' : ''}`}
                                onClick={(event) => { event.stopPropagation(); handleAlignChange(imageIndex, 'left'); }}
                              >
                                ◀ 좌측
                              </button>
                              <button
                                type="button"
                                className={`admin-align-btn${resolvedAlign === 'center' ? ' admin-align-btn-active' : ''}`}
                                onClick={(event) => { event.stopPropagation(); handleAlignChange(imageIndex, 'center'); }}
                              >
                                가운데
                              </button>
                              <button
                                type="button"
                                className={`admin-align-btn${resolvedAlign === 'right' ? ' admin-align-btn-active' : ''}`}
                                onClick={(event) => { event.stopPropagation(); handleAlignChange(imageIndex, 'right'); }}
                              >
                                우측 ▶
                              </button>
                              {resolvedAlign && (
                                <button
                                  type="button"
                                  className="admin-align-btn admin-align-btn-clear"
                                  onClick={(event) => { event.stopPropagation(); handleAlignChange(imageIndex, null); }}
                                >
                                  × 해제
                                </button>
                              )}
                            </span>
                          )}
                          <button
                            type="button"
                            className="admin-image-resize-handle admin-image-resize-handle-horizontal"
                            aria-label="이미지 가로 크기 조절"
                            onPointerDown={(event) => handleImageResizePointerDown(
                              event,
                              imageIndex,
                              { width: resolvedWidth, height: resolvedHeight },
                              'horizontal',
                              fallbackRatio,
                            )}
                          />
                          <button
                            type="button"
                            className="admin-image-resize-handle admin-image-resize-handle-vertical"
                            aria-label="이미지 세로 크기 조절"
                            onPointerDown={(event) => handleImageResizePointerDown(
                              event,
                              imageIndex,
                              { width: resolvedWidth, height: resolvedHeight },
                              'vertical',
                              fallbackRatio,
                            )}
                          />
                          <button
                            type="button"
                            className="admin-image-resize-handle admin-image-resize-handle-diagonal"
                            aria-label="이미지 대각선 비율 유지 조절"
                            onPointerDown={(event) => handleImageResizePointerDown(
                              event,
                              imageIndex,
                              { width: resolvedWidth, height: resolvedHeight },
                              'diagonal',
                              fallbackRatio,
                            )}
                          />
                          <span className="admin-image-width-chip">{resolvedWidth}px × {resolvedHeight}px</span>
                        </span>
                      );
                    },
                  }}
                >
                  {content || '본문을 입력하면 실제 포스트에 가까운 형태로 여기에서 미리 볼 수 있습니다.'}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        )}
      </section>
    </section>
  );
}