---
title: "[Tailwind CSS] inline-block 요소 사이 공백이 생기는 이유와 해결 방법"
date: "2026-04-03 10:20"
description: "inline-block 요소 사이의 약 4px 공백이 왜 생기는지, 그리고 실무에서 안전하게 제거하는 방법"
tag: ["css", "layout"]
category: "FrontEnd"
group: "Tailwind CSS"
---

## 서론

`display: inline-block`은 예전부터 버튼 정렬, 뱃지 정렬, 메뉴 나열에 자주 사용되던 속성입니다.
문제는 분명 `margin`을 주지 않았는데도 요소 사이에 미세한 공백(보통 약 4px)이 생긴다는 점입니다.

이 현상은 버그가 아니라 브라우저 렌더링 규칙에 따른 정상 동작입니다.
이번 글에서는 공백이 생기는 이유를 먼저 확인하고, 실무에서 많이 쓰는 해결 패턴을 예시 코드와 함께 정리해보겠습니다.

---

## 공백이 생기는 이유

`inline-block`은 이름 그대로 인라인 텍스트 흐름을 따릅니다.
그래서 HTML에서 태그와 태그 사이에 있는 줄바꿈, 스페이스, 탭이 "텍스트 공백"으로 해석됩니다.

아래 코드는 공백이 생기는 대표 예시입니다.

```html
<div class="menu">
  <a class="item" href="#">Home</a>
  <a class="item" href="#">Posts</a>
  <a class="item" href="#">About</a>
</div>
```

```css
.item {
  display: inline-block;
  padding: 8px 14px;
  background: #2563eb;
  color: #fff;
  border-radius: 6px;
}
```

결과:

<div style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f8fafc; margin: 8px 0 16px;">
  <a style="display:inline-block; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Home</a>
  <a style="display:inline-block; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Posts</a>
  <a style="display:inline-block; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">About</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">태그 사이 공백 문자 때문에 버튼 사이 간격이 보입니다.</p>
</div>

태그 사이 줄바꿈이 실제 공백 문자로 렌더링되기 때문에, 요소 사이가 떨어져 보이게 됩니다.

---

## 실습 1: `font-size: 0`으로 공백 제거 (inline-block 유지 시 추천)

`inline-block`을 반드시 유지해야 한다면 가장 흔히 쓰는 방법입니다.
부모의 글자 크기를 0으로 만들면 공백 문자 너비도 0이 됩니다.

```html
<div class="menu menu-inline-block">
  <a class="item" href="#">Home</a>
  <a class="item" href="#">Posts</a>
  <a class="item" href="#">About</a>
</div>
```

```css
.menu-inline-block {
  font-size: 0;
}

.menu-inline-block .item {
  display: inline-block;
  font-size: 14px; /* 자식 텍스트 복원 */
  padding: 8px 14px;
  background: #2563eb;
  color: #fff;
  border-radius: 6px;
}
```

결과:

<div style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f8fafc; margin: 8px 0 16px; font-size:0;">
  <a style="display:inline-block; font-size:14px; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Home</a><a style="display:inline-block; font-size:14px; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Posts</a><a style="display:inline-block; font-size:14px; padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">About</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">부모의 font-size를 0으로 만들어 공백이 사라진 상태입니다.</p>
</div>

검증 포인트:

1. 요소 사이 공백이 사라진다.
2. 자식의 `font-size`를 복원하지 않으면 텍스트가 안 보인다.

---

## 실습 2: Flexbox로 전환 (현대 브라우저 기준 최우선)

새로 작성하는 UI라면 `inline-block` 대신 Flexbox가 더 명확하고 유지보수도 쉽습니다.

```html
<nav class="menu menu-flex">
  <a class="item" href="#">Home</a>
  <a class="item" href="#">Posts</a>
  <a class="item" href="#">About</a>
</nav>
```

```css
.menu-flex {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.menu-flex .item {
  padding: 8px 14px;
  background: #2563eb;
  color: #fff;
  border-radius: 6px;
}
```

결과:

<div style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f8fafc; margin: 8px 0 16px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
  <a style="padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Home</a>
  <a style="padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">Posts</a>
  <a style="padding:8px 14px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none;">About</a>
  <span style="font-size:12px; color:#64748b;">gap 값(8px)만큼만 정확히 간격이 적용됩니다.</span>
</div>

장점:

1. 공백 문제가 원천적으로 없다.
2. 간격을 `gap`으로 정확하게 제어할 수 있다.
3. 반응형 레이아웃 대응이 쉽다.

---

## 실습 3: 실무형 방어 코드 (Tailwind/컴포넌트 환경)

팀에서 JSX 또는 템플릿 엔진을 사용하면 줄바꿈/포매팅 방식이 자주 바뀝니다.
이때는 레이아웃 책임을 부모 컨테이너에 고정하면 안전합니다.

```tsx
type MenuItem = { label: string; href: string };

const items: MenuItem[] = [
  { label: "Home", href: "/" },
  { label: "Posts", href: "/posts" },
  { label: "About", href: "/about" },
];

export default function HeaderMenu() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Main menu">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

결과(동일 레이아웃 미리보기):

<div style="padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; background: #f8fafc; margin: 8px 0 16px; display:flex; gap:8px; flex-wrap:wrap;">
  <a style="display:inline-flex; padding:8px 12px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">Home</a>
  <a style="display:inline-flex; padding:8px 12px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">Posts</a>
  <a style="display:inline-flex; padding:8px 12px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-size:14px;">About</a>
  <p style="width:100%; margin:8px 0 0; font-size:12px; color:#64748b;">컴포넌트 렌더링 시에도 줄바꿈/포매터 영향 없이 일정한 간격을 유지합니다.</p>
</div>

위 방식은 포매터가 줄바꿈을 바꿔도 간격이 깨지지 않습니다.
즉, "공백 문자"에 의존하지 않고 "레이아웃 속성"으로 간격을 관리하게 됩니다.

---

## 한계점과 주의사항

`font-size: 0` 방식의 주의점:

1. 자식 텍스트 크기를 반드시 재설정해야 한다.
2. `em` 단위를 많이 쓰는 프로젝트에서는 의도치 않은 크기 계산 문제가 생길 수 있다.

`margin-right: -4px` 방식의 주의점:

1. 폰트에 따라 공백 폭이 달라져서 매직 넘버 유지보수가 어렵다.
2. 브라우저/폰트 변경 시 간격이 다시 틀어질 수 있다.

결론적으로 신규 UI는 Flexbox, 기존 레거시 inline-block 유지 시에는 `font-size: 0`이 가장 현실적인 선택입니다.

---

## 정리

1. `inline-block` 공백의 본질은 HTML 공백 문자의 렌더링입니다.
2. 가장 깔끔한 해법은 Flexbox + `gap`입니다.
3. 레거시 제약이 있다면 부모 `font-size: 0` + 자식 글자 크기 복원이 안전한 우회책입니다.
