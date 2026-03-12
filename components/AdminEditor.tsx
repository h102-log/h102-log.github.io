'use client';

import { ChangeEvent, Children, FormEvent, isValidElement, PointerEvent as ReactPointerEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
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
type PendingAttachmentUpload = {
  file: File;
  attachmentFilePath: string;
  publicAttachmentPath: string;
  originalFileName: string;
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

// 한글 제목도 URL slug로 사용할 수 있도록 허용하는 슬러그 생성 규칙입니다.
// 의도: 작성자가 입력한 제목을 URL 친화적으로 정규화해 포스트 파일명 충돌을 줄입니다.
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-ㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// frontmatter가 single quote를 사용하므로 값 내부 quote를 먼저 이스케이프합니다.
// 의도: YAML 파싱 에러를 사전에 방지해 커밋 실패를 줄입니다.
function escapeSingleQuote(value: string) {
  return value.replace(/'/g, "\\'");
}

// GitHub Contents API는 base64 본문을 요구하므로 UTF-8 안전 인코딩을 사용합니다.
// 의도: 한글/특수문자 포함 문서가 깨지지 않도록 인코딩 일관성을 보장합니다.
function encodeBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

// 저장소 경로로 쓰일 파일명을 정규화합니다.
// 의도: 운영체제/브라우저별 허용 문자 차이로 인한 업로드 실패를 줄입니다.
function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^\w.-ㄱ-ㅎㅏ-ㅣ가-힣]/g, '-')
    .replace(/-+/g, '-');
}

// 글 메타데이터의 날짜를 커밋 시점 기준으로 고정하기 위한 포맷터입니다.
// 의도: 사용자가 수동 입력한 값이 아닌 "실제 배포/반영 시각"을 남겨 운영 이력과 맞추기 위함.
// 연계: handleCommit -> setDate(commitDateTime) -> finalMarkdownText(date)
function formatCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
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

// 편집 UI 안정성을 위해 이미지 너비 상한/하한을 강제합니다.
// 의도: 극단적인 값 입력으로 레이아웃이 깨지는 것을 방지합니다.
function clampImageWidth(width: number) {
  return Math.max(MIN_PREVIEW_IMAGE_WIDTH, Math.min(MAX_PREVIEW_IMAGE_WIDTH, Math.round(width)));
}

// 높이도 동일한 정책으로 제한해 리사이즈 UX를 일관되게 유지합니다.
function clampImageHeight(height: number) {
  return Math.max(MIN_PREVIEW_IMAGE_HEIGHT, Math.min(MAX_PREVIEW_IMAGE_HEIGHT, Math.round(height)));
}

// markdown 이미지 title에서 크기 토큰(w/h)을 파싱합니다.
// 의도: 본문 기반 상태 복원을 통해 새로고침 이후에도 미리보기 크기를 재현합니다.
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

// 기존 title 메타정보를 보존한 채 크기 토큰만 갱신합니다.
// 의도: align 등 다른 토큰과의 호환성을 유지하기 위함입니다.
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

// 특정 index의 markdown 이미지만 업데이트합니다.
// 의도: 다중 이미지 본문에서 의도하지 않은 대량 치환을 방지합니다.
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

// title의 align 토큰을 enum으로 해석합니다.
// 의도: UI 값과 본문 문자열 간 변환 규칙을 단일화합니다.
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

// 선택한 이미지 구문만 본문에서 제거합니다.
// 의도: 삭제 후 불필요한 빈 줄을 정리해 markdown 가독성을 유지합니다.
function removeMarkdownImageByIndex(markdown: string, targetImageIndex: number) {
  let currentImageIndex = -1;

  const removedMarkdown = markdown.replace(MARKDOWN_IMAGE_PATTERN, (fullMatch) => {
    currentImageIndex += 1;

    if (currentImageIndex !== targetImageIndex) {
      return fullMatch;
    }

    return '';
  });

  return removedMarkdown.replace(/\n{3,}/g, '\n\n').trimEnd();
}

// 첨부파일 링크는 본문 하단 "## 첨부파일" 섹션에 누적합니다.
// 의도: 독자가 포스트 끝에서 다운로드 자원을 한 번에 확인하도록 UI 흐름을 고정합니다.
function appendAttachmentLinksToContent(markdown: string, attachmentLines: string[]) {
  const trimmedMarkdown = markdown.trimEnd();
  const attachmentSectionTitle = '## 첨부파일';
  const uniqueAttachmentLines = attachmentLines.filter(Boolean);

  if (uniqueAttachmentLines.length === 0) {
    return markdown;
  }

  if (!trimmedMarkdown) {
    return `${attachmentSectionTitle}\n${uniqueAttachmentLines.join('\n')}\n`;
  }

  if (trimmedMarkdown.includes(attachmentSectionTitle)) {
    return `${trimmedMarkdown}\n${uniqueAttachmentLines.join('\n')}\n`;
  }

  return `${trimmedMarkdown}\n\n${attachmentSectionTitle}\n${uniqueAttachmentLines.join('\n')}\n`;
}

function normalizeAttachmentPath(pathValue: string) {
  const trimmedPath = pathValue.trim();

  if (!trimmedPath) {
    return '';
  }

  const decodedPath = (() => {
    try {
      return decodeURIComponent(trimmedPath);
    } catch {
      return trimmedPath;
    }
  })();

  return decodedPath
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/\/+/g, '/')
    .replace(/\/+$/g, '');
}

function isSameAttachmentPath(leftPath: string, rightPath: string) {
  const normalizedLeft = normalizeAttachmentPath(leftPath);
  const normalizedRight = normalizeAttachmentPath(rightPath);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  return normalizedLeft.endsWith(normalizedRight) || normalizedRight.endsWith(normalizedLeft);
}

function removeAttachmentLinkByPath(markdown: string, attachmentPath: string) {
  const lines = markdown
    .split('\n')
    .filter((line) => {
      const linkMatch = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(line);

      if (!linkMatch) {
        return true;
      }

      const linkedPath = linkMatch[1];

      if (!linkedPath.includes('/files/')) {
        return true;
      }

      return !isSameAttachmentPath(linkedPath, attachmentPath);
    });
  const attachmentSectionTitle = '## 첨부파일';
  const sectionStartIndex = lines.findIndex((line) => line.trim() === attachmentSectionTitle);

  if (sectionStartIndex >= 0) {
    const nextHeadingIndex = lines.findIndex((line, index) => (
      index > sectionStartIndex && /^##\s+/.test(line.trim())
    ));
    const sectionEndIndex = nextHeadingIndex >= 0 ? nextHeadingIndex : lines.length;
    const sectionBody = lines.slice(sectionStartIndex + 1, sectionEndIndex);
    const hasAttachmentItem = sectionBody.some((line) => /\[[^\]]+\]\(\/files\//.test(line));

    if (!hasAttachmentItem) {
      lines.splice(sectionStartIndex, sectionEndIndex - sectionStartIndex);
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
}

// ReactMarkdown의 img 렌더 시 원문 순서(index)를 안정적으로 매핑하기 위한 플러그인입니다.
// 의도: DOM 조작 없이도 "몇 번째 이미지"인지 식별해 정렬/리사이즈/삭제를 정확히 적용하기 위함.
// 연계: components.img -> data-image-index -> handleAlignChange / handleImageResizePointerDown / handleDeleteImage
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
  const [date, setDate] = useState(formatCurrentDateTime());
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('post');
  const [localPreviewImageMap, setLocalPreviewImageMap] = useState<Record<string, string>>({});
  const [pendingImageUploadMap, setPendingImageUploadMap] = useState<Record<string, PendingImageUpload>>({});
  const [pendingAttachmentUploadMap, setPendingAttachmentUploadMap] = useState<Record<string, PendingAttachmentUpload>>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [resizingImageIndex, setResizingImageIndex] = useState<number | null>(null);
  const [previewImageSizeMap, setPreviewImageSizeMap] = useState<Record<number, ImageSize>>({});
  const [previewImageRatioMap, setPreviewImageRatioMap] = useState<Record<number, number>>({});
  // 현재 선택된 이미지 인덱스입니다.
  // 의도: 팝업 UI(정렬/삭제)를 단일 선택 상태로 고정해 동시 편집 충돌을 줄입니다.
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [previewImageAlignMap, setPreviewImageAlignMap] = useState<Record<number, ImageAlign | null>>({});
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);
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

  // 미리보기 탭은 "저장될 최종 markdown"을 사람이 검증하기 위한 용도입니다.
  // 의도: 커밋 전에 메타데이터와 본문이 기대 형식인지 확인하도록 지원합니다.
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

  // 커밋 대상 파일 경로를 slug 기반으로 고정합니다.
  // 의도: 에디터 UI/미리보기/커밋 API가 동일 경로를 바라보게 하여 혼선을 줄입니다.
  const filePath = `posts/${computedSlug}.md`;

  const handleImageResizePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    imageIndex: number,
    currentSize: ImageSize,
    direction: ResizeDirection,
    fallbackRatio: number,
  ) => {
    // 포인터 세션 기반으로 리사이즈를 처리해 드래그 중에도 부드럽게 미리보기 값을 반영합니다.
    // 최종 포인터 업 시점에만 markdown 본문을 갱신해 잦은 문자열 재생성 비용을 줄입니다.
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
    // 커서 위치 삽입을 유지해 작성 흐름을 끊지 않기 위한 유틸입니다.
    // 의도: 이미지 버튼으로 본문 중간 삽입 시 사용자가 직접 위치를 다시 찾지 않게 합니다.
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

  // 이미지 정렬 UI 변경을 markdown title 토큰으로 역직렬화합니다.
  // 의도: 미리보기 상태와 저장 텍스트를 동일하게 유지해 새로고침/재편집에도 동일한 결과를 보장합니다.
  const handleAlignChange = (imageIndex: number, align: ImageAlign | null) => {
    setPreviewImageAlignMap((previousMap) => ({ ...previousMap, [imageIndex]: align }));
    setContent((previousContent) => updateMarkdownImageAlignByIndex(previousContent, imageIndex, align)); 
  };

  const handleDeleteImage = (imageIndex: number, imagePath: string) => {
    // 순서도:
    // 1) 본문에서 이미지 markdown 제거
    // 2) 업로드 대기 목록/로컬 프리뷰 URL 정리
    // 3) 정렬/크기/비율 캐시 정리
    // 의도: 화면에서만 사라지는 "유령 상태"를 방지하고, 커밋 시 실제 반영 데이터와 완전히 일치시킵니다.
    setContent((previousContent) => removeMarkdownImageByIndex(previousContent, imageIndex));
    setSelectedImageIndex(null); 
    setStatusMessage('이미지를 본문에서 삭제했습니다. 커밋 시 반영됩니다.');

    setPendingImageUploadMap((previousMap) => {
      if (!(imagePath in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      delete nextMap[imagePath];
      return nextMap;
    });

    setLocalPreviewImageMap((previousMap) => {
      if (!(imagePath in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      const objectUrl = previousMap[imagePath];

      if (typeof objectUrl === 'string' && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }

      delete nextMap[imagePath];
      return nextMap;
    });

    setPreviewImageAlignMap((previousMap) => {
      if (!(imageIndex in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      delete nextMap[imageIndex];
      return nextMap;
    });

    setPreviewImageSizeMap((previousMap) => {
      if (!(imageIndex in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      delete nextMap[imageIndex];
      return nextMap;
    });

    setPreviewImageRatioMap((previousMap) => {
      if (!(imageIndex in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      delete nextMap[imageIndex];
      return nextMap;
    });
  };

  const handleDeleteAttachment = (attachmentPath: string) => {
    setContent((previousContent) => removeAttachmentLinkByPath(previousContent, attachmentPath));
    setPendingAttachmentUploadMap((previousMap) => {
      if (!(attachmentPath in previousMap)) {
        return previousMap;
      }

      const nextMap = { ...previousMap };
      delete nextMap[attachmentPath];
      return nextMap;
    });
    setStatusMessage('첨부파일을 본문에서 삭제했습니다. 커밋 시 반영됩니다.');
  };

  const handleImageUpload = async (pendingUploads: PendingImageUpload[]) => {
    // 이 함수는 "업로드 전담"이며, 커밋 여부 판단은 handleCommit에서 담당합니다.
    // 의도: 업로드 책임을 분리해 실패 지점(권한/브랜치/네트워크)을 명확히 추적하기 위함입니다.
    if (pendingUploads.length === 0) {
      setStatusMessage('업로드할 이미지 파일을 선택해 주세요.');
      return [] as string[];
    }

    setIsUploadingAsset(true);
    setStatusMessage('이미지를 업로드하는 중입니다...');
    try {
      const uploadedPublicImagePathList: string[] = [];

      for (const pendingUpload of pendingUploads) {
        const { file, imageFilePath, publicImagePath } = pendingUpload;
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

        uploadedPublicImagePathList.push(publicImagePath);
      }

      setStatusMessage(`${pendingUploads.length}개의 이미지 업로드 완료`);
      return uploadedPublicImagePathList;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleAttachmentUpload = async (pendingUploads: PendingAttachmentUpload[]) => {
    if (pendingUploads.length === 0) {
      setStatusMessage('업로드할 첨부파일을 선택해 주세요.');
      return [] as string[];
    }

    setIsUploadingAsset(true);
    setStatusMessage('첨부파일을 업로드하는 중입니다...');

    try {
      const uploadedPublicAttachmentPathList: string[] = [];

      for (const pendingUpload of pendingUploads) {
        const { file, attachmentFilePath, publicAttachmentPath } = pendingUpload;
        const contentApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${attachmentFilePath}`;
        const encodedFileContent = await encodeFileToBase64(file);

        const uploadResponse = await fetch(contentApiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken.trim()}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `docs: upload attachment ${computedSlug || 'draft'}`,
            content: encodedFileContent,
            branch: branch.trim() || DEFAULT_BRANCH,
          }),
        });

        if (!uploadResponse.ok) {
          const errorPayload = await uploadResponse.json().catch(() => ({}));
          const message = typeof errorPayload?.message === 'string'
            ? errorPayload.message
            : '첨부파일 업로드에 실패했습니다.';
          throw new Error(message);
        }

        uploadedPublicAttachmentPathList.push(publicAttachmentPath);
      }

      setStatusMessage(`${pendingUploads.length}개의 첨부파일 업로드 완료`);
      return uploadedPublicAttachmentPathList;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '첨부파일 업로드 중 오류가 발생했습니다.');
      throw error;
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // 순서도:
    // 1) 파일 선택
    // 2) 본문 markdown 삽입
    // 3) pendingImageUploadMap에 적재(아직 서버 업로드 X)
    // 4) localPreviewImageMap으로 즉시 미리보기
    // 의도: 작성 중 네트워크 의존성을 제거해 편집 반응성을 유지하고,
    //       최종 커밋 시점에만 원자적으로 업로드+문서 반영을 수행하기 위함입니다.
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

    setPendingImageUploadMap((previousMap) => {
      const nextMap = { ...previousMap };

      pendingUploads.forEach((pendingUpload) => {
        nextMap[pendingUpload.publicImagePath] = pendingUpload;
      });

      return nextMap;
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

    setStatusMessage(`${pendingUploads.length}개의 이미지를 선택했습니다. GitHub에 커밋 시 함께 업로드됩니다.`);
    event.target.value = '';
  };

  const handleAttachmentFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const safeSlug = computedSlug || 'draft';
    const timestamp = Date.now();

    const pendingUploads = files.map((file, index) => {
      const safeFileName = sanitizeFileName(file.name);
      const publicAttachmentPath = `/files/posts/${safeSlug}/${timestamp}-${index}-${safeFileName}`;

      return {
        file,
        attachmentFilePath: `public${publicAttachmentPath}`,
        publicAttachmentPath,
        originalFileName: file.name,
      };
    });

    setPendingAttachmentUploadMap((previousMap) => {
      const nextMap = { ...previousMap };

      pendingUploads.forEach((pendingUpload) => {
        nextMap[pendingUpload.publicAttachmentPath] = pendingUpload;
      });

      return nextMap;
    });

    const attachmentLines = pendingUploads.map((pendingUpload) => (
      `- [${pendingUpload.originalFileName}](${pendingUpload.publicAttachmentPath} "download")`
    ));

    setContent((previousContent) => appendAttachmentLinksToContent(previousContent, attachmentLines));
    setStatusMessage(`${pendingUploads.length}개의 첨부파일을 추가했습니다. GitHub에 커밋 시 함께 업로드됩니다.`);
    event.target.value = '';
  };

  const handleOpenImagePicker = () => {
    // 파일 input을 숨기고 버튼으로 트리거하는 방식으로 UI 복잡도를 낮춥니다.
    imageFileInputRef.current?.click();
  };

  const handleOpenAttachmentPicker = () => {
    attachmentFileInputRef.current?.click();
  };

  const handleCommit = async (event: FormEvent<HTMLFormElement>) => {
    // 순서도(핵심 비즈니스 트랜잭션):
    // 1) 필수값/권한 검증
    // 2) 커밋 시각 확정(date)
    // 3) pending 이미지 업로드
    // 4) md 파일 create/update 커밋
    // 의도: "이미지는 없고 문서만 올라간 상태"를 최소화하고, 운영자가 기대하는 단일 커밋 경험을 보장합니다.
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
      const commitDateTime = formatCurrentDateTime();
      setDate(commitDateTime);
      const finalMarkdownText = [
        '---',
        `title: '${escapeSingleQuote(title.trim())}'`,
        `date: '${commitDateTime}'`,
        `description: '${escapeSingleQuote(description.trim())}'`,
      ];

      if (normalizedTags.length === 1) {
        finalMarkdownText.push(`tag: '${escapeSingleQuote(normalizedTags[0])}'`);
      }

      if (normalizedTags.length > 1) {
        finalMarkdownText.push(`tag: [${normalizedTags.map((tag) => `'${escapeSingleQuote(tag)}'`).join(', ')}]`);
      }

      if (thumbnail.trim()) {
        finalMarkdownText.push(`thumbnail: '${escapeSingleQuote(thumbnail.trim())}'`);
      }

      finalMarkdownText.push('---', '', content.trimEnd());

      const pendingUploadsForCommit = Object.values(pendingImageUploadMap);
      const pendingAttachmentUploadsForCommit = Object.values(pendingAttachmentUploadMap);

      if (pendingUploadsForCommit.length > 0) {
        setStatusMessage(`커밋 전 이미지 ${pendingUploadsForCommit.length}개를 업로드하는 중입니다...`);
        const uploadedPublicImagePathList = await handleImageUpload(pendingUploadsForCommit);

        setPendingImageUploadMap((previousMap) => {
          const nextMap = { ...previousMap };

          uploadedPublicImagePathList.forEach((uploadedPath) => {
            delete nextMap[uploadedPath];
          });

          return nextMap;
        });
      }

      if (pendingAttachmentUploadsForCommit.length > 0) {
        setStatusMessage(`커밋 전 첨부파일 ${pendingAttachmentUploadsForCommit.length}개를 업로드하는 중입니다...`);
        const uploadedPublicAttachmentPathList = await handleAttachmentUpload(pendingAttachmentUploadsForCommit);

        setPendingAttachmentUploadMap((previousMap) => {
          const nextMap = { ...previousMap };

          uploadedPublicAttachmentPathList.forEach((uploadedPath) => {
            delete nextMap[uploadedPath];
          });

          return nextMap;
        });
      }

      // 기존 파일 여부를 먼저 조회해 create/update 모드 정책을 강제합니다.
      // 의도: 실수로 기존 글을 덮어쓰거나, 없는 글 수정 커밋을 차단합니다.
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

      // commit message를 모드에 따라 분기해 변경 이력을 Git 로그에서 빠르게 추적할 수 있게 합니다.
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
          content: encodeBase64Utf8(finalMarkdownText.join('\n')),
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

      setPendingImageUploadMap({});
      setPendingAttachmentUploadMap({});
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
            <input value={date} readOnly disabled />
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

        <div className="admin-field admin-field-wide">
          <div className="admin-content-header">
            <label htmlFor="admin-content-textarea" className="admin-content-label">본문 (Markdown)</label>
            <div className="admin-content-actions">
              <button
                type="button"
                className="admin-inline-image-button"
                onClick={handleOpenImagePicker}
                disabled={isUploadingAsset}
              >
                {isUploadingAsset ? '업로드 중...' : 'IMG +'}
              </button>
              <button
                type="button"
                className="admin-inline-image-button"
                onClick={handleOpenAttachmentPicker}
                disabled={isUploadingAsset}
              >
                {isUploadingAsset ? '업로드 중...' : 'FILE +'}
              </button>
            </div>
          </div>

          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFileChange}
            className="admin-hidden-file-input"
          />

          <input
            ref={attachmentFileInputRef}
            type="file"
            multiple
            onChange={handleAttachmentFileChange}
            className="admin-hidden-file-input"
          />

          <textarea
            id="admin-content-textarea"
            ref={contentTextareaRef}
            className="admin-content-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="## 제목\n\n본문을 작성하세요."
            required
          />
        </div>

        <div className="admin-editor-actions">
          <button type="submit" disabled={isSubmitting || isUploadingAsset} className="admin-primary-button">
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

              <div
                className="post-content admin-post-content"
                onClick={() => {
                  setSelectedImageIndex(null);
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks, remarkAssignImageIndices]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // float 이미지가 포함된 <p>는 p를 제거해 Fragment로 반환합니다. 
                    // 의도: ReactMarkdown이 이미지를 <p>로 감싸는데, float된 이미지가 p 안에 갇히면
                    //       다음 텍스트 단락이 같은 BFC에서 float를 인식하지 못해 줄 위치가 틀어집니다.
                    //       p를 없애면 float 이미지와 텍스트가 같은 컨테이너(admin-post-content) BFC에서
                    //       올바르게 처리되어 텍스트가 이미지 옆으로 정확히 흐릅니다.
                    p: ({ children }) => {
                      const hasImageWrap = Children.toArray(children).some(
                        (child) =>
                          isValidElement(child) &&
                          typeof (child.props as Record<string, unknown>).className === 'string' &&
                          ((child.props as Record<string, unknown>).className as string).includes('admin-resizable-image-wrap'),
                      );
                      return hasImageWrap ? <>{children}</> : <p>{children}</p>;
                    },
                    a: ({ href, title: linkTitle, children }) => {
                      if (typeof href !== 'string') {
                        return <>{children}</>;
                      }

                      const isAttachmentLink = href.startsWith('/files/');

                      if (!isAttachmentLink) {
                        return (
                          <a href={href} title={linkTitle}>
                            {children}
                          </a>
                        );
                      }

                      return (
                        <span className="admin-attachment-preview-item" onClick={(event) => event.stopPropagation()}>
                          <a href={href} title={linkTitle} className="post-download-link" download>
                            {children}
                          </a>
                          <button
                            type="button"
                            className="admin-attachment-delete-button"
                            aria-label="첨부파일 삭제"
                            onClick={() => handleDeleteAttachment(href)}
                            //가로폭 50px
                            style={{ width: '50px', height: '24px', marginLeft: '8px' }}
                          >
                            삭제
                          </button>
                        </span>
                      );
                    },
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
                      // float 이미지 하단 margin을 크게 잡아 width-chip(bottom:-1.65rem)과 다음 텍스트가 겹치지 않게 합니다.
                      const alignStyle = resolvedAlign === 'left'
                        ? { float: 'left' as const, margin: '0 16px 2.5rem 0' }
                        : resolvedAlign === 'right'
                        ? { float: 'right' as const, margin: '0 0 2.5rem 16px' }
                        : resolvedAlign === 'center'
                        ? { marginLeft: 'auto', marginRight: 'auto' }
                        : {};

                      return (
                        <span
                          className={`admin-resizable-image-wrap ${resizingImageIndex === imageIndex ? 'admin-resizable-image-wrap-active' : ''}${selectedImageIndex === imageIndex ? ' admin-resizable-image-wrap-selected' : ''}`}
                          style={{ width: `min(100%, ${resolvedWidth}px)`, height: `${resolvedHeight}px`, ...alignStyle }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedImageIndex(imageIndex);
                          }}
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

                              setPreviewImageRatioMap((previousMap) => {
                                const previousRatio = previousMap[imageIndex];
                                const isSameRatio = typeof previousRatio === 'number' && Math.abs(previousRatio - nextRatio) < 0.0001;

                                if (isSameRatio) {
                                  return previousMap;
                                }

                                return {
                                  ...previousMap,
                                  [imageIndex]: nextRatio,
                                };
                              });
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
                              <button
                                type="button"
                                className="admin-align-btn admin-align-btn-clear"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteImage(imageIndex, src);
                                }}
                              >
                                삭제
                              </button>
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
