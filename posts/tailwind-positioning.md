---
title: "Tailwind CSS 포지셔닝 정렬 기법"
date: "2026-03-31 15:00"
description: "top-0, transform, translate 등을 활용한 우측 중앙·아래 중앙 정렬 기법 (Tailwind CSS)"
tag: "css"
group: "CSS 레이아웃"
---

# Tailwind CSS 포지셔닝 정렬 기법

`position`, `top`, `right`, `bottom`, `left`와 `transform`을 조합하면 부모 요소 기준으로 자식 요소를 원하는 위치에 정확히 배치할 수 있습니다.

---

## 핵심 원리

1. **부모**에 `relative` (Tailwind: `relative`)
2. **자식**에 `absolute` (Tailwind: `absolute`)
3. `top`, `right`, `bottom`, `left`로 기준점 설정
4. `translate`로 자기 자신의 크기만큼 보정

> 자식 요소에 `top-1/2`을 주면 **부모 높이의 50%** 지점에 자식의 **상단 모서리**가 위치합니다.
> 여기서 `-translate-y-1/2`를 추가하면 자식 자신의 높이 절반만큼 위로 올라가 **정중앙**에 놓이게 됩니다.

---

## 우측 중앙 정렬

부모의 오른쪽 변 수직 중앙에 자식을 배치합니다.

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute right-0 top-1/2 -translate-y-1/2
              h-12 w-12 bg-blue-500 rounded-full"
  ></div>
</div>
```

| 클래스             | 역할                                       |
| ------------------ | ------------------------------------------ |
| `absolute`         | 부모 기준 절대 배치                        |
| `right-0`          | 오른쪽 끝에 붙임                           |
| `top-1/2`          | 부모 높이의 50% 지점                       |
| `-translate-y-1/2` | 자신의 높이 절반만큼 위로 이동 → 수직 중앙 |

---

## 아래 중앙 정렬

부모의 아래쪽 변 수평 중앙에 자식을 배치합니다.

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute bottom-0 left-1/2 -translate-x-1/2
              h-12 w-12 bg-green-500 rounded-full"
  ></div>
</div>
```

| 클래스             | 역할                                       |
| ------------------ | ------------------------------------------ |
| `absolute`         | 부모 기준 절대 배치                        |
| `bottom-0`         | 아래쪽 끝에 붙임                           |
| `left-1/2`         | 부모 너비의 50% 지점                       |
| `-translate-x-1/2` | 자신의 너비 절반만큼 왼쪽 이동 → 수평 중앙 |

---

## 정중앙 정렬

부모의 수평 + 수직 정중앙에 배치합니다.

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              h-12 w-12 bg-red-500 rounded-full"
  ></div>
</div>
```

`top-1/2` + `left-1/2`로 부모 중심에 놓고, `-translate-x-1/2 -translate-y-1/2`로 자기 자신의 크기만큼 보정합니다.

---

## 상단 중앙 정렬

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute top-0 left-1/2 -translate-x-1/2
              h-12 w-12 bg-yellow-500 rounded-full"
  ></div>
</div>
```

---

## 좌측 중앙 정렬

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute left-0 top-1/2 -translate-y-1/2
              h-12 w-12 bg-purple-500 rounded-full"
  ></div>
</div>
```

---

## 회전(rotate) + 포지셔닝 응용

`transform`의 `rotate`와 포지셔닝을 함께 사용하면 장식 요소나 뱃지 등을 만들 수 있습니다.

### 우측 상단 대각선 리본

```html
<div class="relative h-64 w-64 overflow-hidden border-2 border-gray-300">
  <div
    class="absolute right-0 top-0 origin-bottom-right rotate-45
              bg-red-500 px-8 py-1 text-sm text-white"
  >
    NEW
  </div>
</div>
```

| 클래스                | 역할                         |
| --------------------- | ---------------------------- |
| `right-0 top-0`       | 우측 상단 기준점             |
| `origin-bottom-right` | 회전 축을 우측 하단으로 변경 |
| `rotate-45`           | 45도 시계 방향 회전          |

### 왼쪽 세로 텍스트 (중앙)

```html
<div class="relative h-64 w-64 border-2 border-gray-300">
  <div
    class="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90
              origin-center whitespace-nowrap text-sm font-bold text-gray-500"
  >
    VERTICAL TEXT
  </div>
</div>
```

`-rotate-90`으로 반시계 90도 회전 후, `top-1/2 -translate-y-1/2`로 수직 중앙을 맞춥니다.

---

## 정리 — 조합 치트시트

| 위치      | Tailwind 클래스 조합                                          |
| --------- | ------------------------------------------------------------- |
| 상단 좌측 | `absolute top-0 left-0`                                       |
| 상단 중앙 | `absolute top-0 left-1/2 -translate-x-1/2`                    |
| 상단 우측 | `absolute top-0 right-0`                                      |
| 좌측 중앙 | `absolute left-0 top-1/2 -translate-y-1/2`                    |
| 정중앙    | `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` |
| 우측 중앙 | `absolute right-0 top-1/2 -translate-y-1/2`                   |
| 하단 좌측 | `absolute bottom-0 left-0`                                    |
| 하단 중앙 | `absolute bottom-0 left-1/2 -translate-x-1/2`                 |
| 하단 우측 | `absolute bottom-0 right-0`                                   |

> **Tip:** Tailwind v3.x부터 `translate` 유틸리티가 별도 클래스로 제공되므로 `transform` 클래스를 명시하지 않아도 됩니다.
