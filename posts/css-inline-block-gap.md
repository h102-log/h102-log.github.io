---
title: "inline-block 요소 사이 원치 않는 여백 제거하기"
date: "2026-04-01 12:00"
description: "display: inline-block 요소 사이에 생기는 약 4px 공백의 원인과 실무 해결 방법"
tag: "css"
group: "CSS 레이아웃"
---

# inline-block 요소 사이 원치 않는 여백 제거하기

`display: inline-block`을 사용하다 보면 요소 사이에 의도하지 않은 **약 4px 정도의 빈 공간**이 생기는 것을 경험하게 됩니다. 이 글에서는 왜 이 현상이 발생하는지, 그리고 실무에서 유지보수하기 좋은 해결 방법에는 어떤 것들이 있는지 알아봅니다.

---

## 현상 확인

아래처럼 `<a>` 또는 `<button>` 태그에 `inline-block`을 적용하면, 태그 사이에 원하지 않는 간격이 보입니다.

```html
<div>
  <a href="#" class="btn">버튼 A</a>
  <a href="#" class="btn">버튼 B</a>
  <a href="#" class="btn">버튼 C</a>
</div>
```

```css
.btn {
  display: inline-block;
  padding: 8px 16px;
  background: #3b82f6;
  color: #fff;
}
```

**결과:**

<div style="font-size:16px; padding:16px; background:#f8fafc; border:2px solid #d1d5db; border-radius:8px; margin:16px 0;">
  <a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 A</a>
  <a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 B</a>
  <a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 C</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">→ 버튼 사이에 약 4px의 원치 않는 공백이 보입니다</p>
</div>

위 코드를 렌더링하면 각 버튼 사이에 **약 4px의 빈 공간**이 생깁니다. `margin`이나 `padding`을 전혀 주지 않았는데도 말입니다.

---

## 원인

HTML 소스 코드에서 태그와 태그 사이에 있는 **줄바꿈(엔터)이나 띄어쓰기**가 원인입니다.

`inline-block` 요소는 이름 그대로 **인라인(텍스트) 흐름** 위에 놓이기 때문에, 브라우저는 태그 사이의 공백 문자(줄바꿈·스페이스·탭)를 **하나의 빈 텍스트 노드**로 렌더링합니다. 이 텍스트 노드가 현재 `font-size`에 비례하는 너비(보통 약 4px)를 차지하면서 눈에 보이는 간격이 만들어지는 것입니다.

> 쉽게 말해, `<span>안녕</span> <span>하세요</span>`에서 두 단어 사이의 공백과 동일한 원리입니다.

---

## 해결 방법

### 부모에 `font-size: 0` 적용 (권장)

가장 널리 사용되는 방법입니다. 부모의 `font-size`를 `0`으로 설정하면 공백 텍스트 노드의 너비가 `0`이 되어 간격이 사라집니다.

```css
.parent {
  font-size: 0;
}

.parent .btn {
  font-size: 16px; /* 자식에서 다시 원래 크기로 복원 */
  display: inline-block;
  padding: 8px 16px;
}
```

```html
<div class="parent">
  <a href="#" class="btn">버튼 A</a>
  <a href="#" class="btn">버튼 B</a>
  <a href="#" class="btn">버튼 C</a>
</div>
```

**결과:**

<div style="font-size:0; padding:16px; background:#f8fafc; border:2px solid #d1d5db; border-radius:8px; margin:16px 0;">
  <a style="display:inline-block; font-size:16px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 A</a><a style="display:inline-block; font-size:16px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 B</a><a style="display:inline-block; font-size:16px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 C</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">→ font-size: 0 적용 — 공백이 사라졌습니다</p>
</div>

- 장점: HTML 구조를 건드리지 않으므로 **유지보수가 쉽습니다.**
- 단점: 자식 요소에서 `font-size`를 **반드시 재선언**해야 합니다. `em` 단위를 사용하는 경우 계산이 달라질 수 있으므로 주의가 필요합니다.

---

### Flexbox 사용 (가장 권장)

`inline-block` 대신 부모에 `display: flex`를 적용하면 공백 문제 자체가 발생하지 않습니다.

```css
.parent {
  display: flex;
  gap: 8px; /* 원하는 간격만 정확하게 지정 */
}

.parent .btn {
  padding: 8px 16px;
}
```

```html
<div class="parent">
  <a href="#" class="btn">버튼 A</a>
  <a href="#" class="btn">버튼 B</a>
  <a href="#" class="btn">버튼 C</a>
</div>
```

**결과:**

<div style="display:flex; gap:8px; padding:16px; background:#f8fafc; border:2px solid #d1d5db; border-radius:8px; margin:16px 0; flex-wrap:wrap; align-items:center;">
  <a style="padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 A</a>
  <a style="padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 B</a>
  <a style="padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 C</a>
  <span style="font-size:12px; color:#64748b;">→ Flexbox + gap: 8px — 의도한 간격만 적용됩니다</span>
</div>

- 장점: 공백 문제가 **원천적으로 발생하지 않고**, `gap` 속성으로 간격을 명시적으로 제어할 수 있습니다.
- 모던 브라우저 환경이라면 이 방법이 **가장 깔끔하고 권장**됩니다.

Tailwind CSS를 사용한다면 더욱 간결합니다:

```html
<div class="flex gap-2">
  <a href="#" class="btn">버튼 A</a>
  <a href="#" class="btn">버튼 B</a>
  <a href="#" class="btn">버튼 C</a>
</div>
```

---

### 부모에 음수 마진(`negative margin`) 적용

자식 요소에 음수 `margin`을 주어 공백만큼의 간격을 상쇄하는 방법입니다.

```css
.btn {
  display: inline-block;
  margin-right: -4px;
  padding: 8px 16px;
}
```

**결과:**

<div style="font-size:16px; padding:16px; background:#f8fafc; border:2px solid #d1d5db; border-radius:8px; margin:16px 0;">
  <a style="display:inline-block; margin-right:-4px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 A</a>
  <a style="display:inline-block; margin-right:-4px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 B</a>
  <a style="display:inline-block; margin-right:-4px; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 C</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">→ margin-right: -4px 적용 — 공백이 상쇄되었습니다</p>
</div>

- 장점: 기존 `inline-block` 레이아웃을 유지할 수 있습니다.
- 단점: 공백의 너비가 `font-size`나 `font-family`에 따라 달라질 수 있어 **매직 넘버에 의존**하게 됩니다. 유지보수 측면에서 권장하지 않습니다.

---

### HTML 태그를 붙여 쓰기

소스 코드에서 태그 사이의 공백을 아예 없애는 방법입니다.

```html
<div>
  <a href="#" class="btn">버튼 A</a><a href="#" class="btn">버튼 B</a
  ><a href="#" class="btn">버튼 C</a>
</div>
```

또는 주석을 활용할 수도 있습니다:

```html
<div>
  <a href="#" class="btn">버튼 A</a
  ><!--
  --><a href="#" class="btn">버튼 B</a
  ><!--
  --><a href="#" class="btn">버튼 C</a>
</div>
```

**결과:**

<div style="font-size:16px; padding:16px; background:#f8fafc; border:2px solid #d1d5db; border-radius:8px; margin:16px 0;">
  <a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 A</a><a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 B</a><a style="display:inline-block; padding:8px 16px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:4px;">버튼 C</a>
  <p style="margin:8px 0 0; font-size:12px; color:#64748b;">→ 태그를 붙여 써서 공백 제거 — 간격 없이 렌더링됩니다</p>
</div>

- 장점: CSS를 전혀 수정하지 않아도 됩니다.
- 단점: 코드 가독성이 **크게 떨어지고**, Prettier 등의 포매터가 자동으로 줄바꿈을 추가하면 다시 문제가 발생할 수 있습니다.

---

## 정리

- `inline-block` 요소 사이의 여백은 **HTML 공백 문자**가 텍스트 노드로 렌더링되면서 발생합니다.
- 모던 환경이라면 **Flexbox로 전환**하는 것이 가장 깔끔한 해결책입니다.
- `inline-block`을 유지해야 한다면 **부모에 `font-size: 0`**을 적용하는 방법이 실무에서 가장 안정적입니다.
