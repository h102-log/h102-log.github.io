---
title: "[Tailwind CSS] Tailwind CSS 포지셔닝 정렬 기법"
date: "2026-03-31 15:00"
description: "top-0, transform, translate 등을 활용한 우측 중앙·아래 중앙 정렬 기법 (Tailwind CSS)"
tag: "css"
group: "Tailwind CSS"
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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; right:0; top:50%; transform:translateY(-50%); width:40px; height:40px; background:#3b82f6; border-radius:50%;"></div>
  <span style="position:absolute; bottom:-24px; left:0; font-size:12px; color:#64748b;">→ 파란 원이 우측 수직 중앙에 위치</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:40px; height:40px; background:#22c55e; border-radius:50%;"></div>
  <span style="position:absolute; bottom:-24px; left:0; font-size:12px; color:#64748b;">→ 초록 원이 하단 수평 중앙에 위치</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:40px; height:40px; background:#ef4444; border-radius:50%;"></div>
  <span style="position:absolute; bottom:-24px; left:0; font-size:12px; color:#64748b;">→ 빨간 원이 정중앙에 위치</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:40px; height:40px; background:#eab308; border-radius:50%;"></div>
  <span style="position:absolute; bottom:-24px; left:0; font-size:12px; color:#64748b;">→ 노란 원이 상단 수평 중앙에 위치</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; left:0; top:50%; transform:translateY(-50%); width:40px; height:40px; background:#a855f7; border-radius:50%;"></div>
  <span style="position:absolute; bottom:-24px; left:0; font-size:12px; color:#64748b;">→ 보라 원이 좌측 수직 중앙에 위치</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; overflow:hidden; margin:16px 0;">
  <div style="position:absolute; right:-22px; top:12px; transform:rotate(45deg); background:#ef4444; color:#fff; font-size:12px; font-weight:bold; padding:2px 30px; text-align:center;">NEW</div>
  <span style="position:absolute; bottom:8px; left:8px; font-size:12px; color:#64748b;">→ 우측 상단 45도 리본</span>
</div>

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

**결과:**

<div style="position:relative; width:200px; height:200px; border:2px solid #d1d5db; border-radius:8px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; left:-30px; top:50%; transform:translateY(-50%) rotate(-90deg); transform-origin:center; white-space:nowrap; font-size:13px; font-weight:bold; color:#64748b; letter-spacing:2px;">VERTICAL TEXT</div>
  <span style="position:absolute; bottom:8px; right:8px; font-size:12px; color:#64748b;">→ 좌측 세로 텍스트</span>
</div>

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

### 한눈에 보는 9방향 데모

<div style="position:relative; width:280px; height:280px; border:2px solid #d1d5db; border-radius:12px; background:#f8fafc; margin:16px 0;">
  <div style="position:absolute; top:4px; left:4px; width:28px; height:28px; background:#f97316; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">TL</div>
  <div style="position:absolute; top:4px; left:50%; transform:translateX(-50%); width:28px; height:28px; background:#eab308; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">TC</div>
  <div style="position:absolute; top:4px; right:4px; width:28px; height:28px; background:#22c55e; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">TR</div>
  <div style="position:absolute; left:4px; top:50%; transform:translateY(-50%); width:28px; height:28px; background:#a855f7; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">CL</div>
  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:28px; height:28px; background:#ef4444; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">CC</div>
  <div style="position:absolute; right:4px; top:50%; transform:translateY(-50%); width:28px; height:28px; background:#3b82f6; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">CR</div>
  <div style="position:absolute; bottom:4px; left:4px; width:28px; height:28px; background:#ec4899; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">BL</div>
  <div style="position:absolute; bottom:4px; left:50%; transform:translateX(-50%); width:28px; height:28px; background:#14b8a6; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">BC</div>
  <div style="position:absolute; bottom:4px; right:4px; width:28px; height:28px; background:#6366f1; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; color:#fff; font-weight:bold;">BR</div>
</div>

> **Tip:** Tailwind v3.x부터 `translate` 유틸리티가 별도 클래스로 제공되므로 `transform` 클래스를 명시하지 않아도 됩니다.
