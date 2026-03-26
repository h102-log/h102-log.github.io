---
title: "[React] useEffect 완전 정리"
date: "2026-03-26 19:41"
description: "useEffect의 실행 시점, 의존성 배열, 정리 함수 정리"
tag: "react"
group: "React"
---

# [React] useEffect 완전 정리

`useEffect`는 React 컴포넌트에서 "외부 시스템"과 동기화할 때 사용하는 Hook입니다.
예를 들어 API 호출, 이벤트 리스너 등록, 타이머 시작/해제 같은 작업에 사용합니다.

## useEffect 기본 문법

```jsx
import { useEffect } from "react";

useEffect(() => {
  // 실행할 작업
  return () => {
    // 정리(cleanup) 작업
  };
}, [deps]);
```

- 첫 번째 인자: 이펙트 함수
- 반환 함수: 정리 함수(cleanup)
- 두 번째 인자: 의존성 배열

## 의존성 배열 동작

### 의존성 생략

```jsx
useEffect(() => {
  console.log("렌더링마다 실행");
});
```

렌더링할 때마다 실행됩니다.

### 빈 배열 `[]`

```jsx
useEffect(() => {
  console.log("마운트 시 1회 실행");
}, []);
```

초기 마운트 시점에만 실행됩니다.

### 특정 값 의존

```jsx
useEffect(() => {
  console.log("query가 바뀔 때마다 실행", query);
}, [query]);
```

`query`가 바뀔 때마다 실행됩니다.

## 정리 함수가 중요한 이유

정리 함수를 작성하지 않으면 메모리 누수나 중복 구독 문제가 발생할 수 있습니다.

```jsx
useEffect(() => {
  const timerId = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => {
    clearInterval(timerId);
  };
}, []);
```

## 실무 예제: 검색 API 호출

```jsx
import { useEffect, useState } from "react";

function SearchBox({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!cancelled) {
        setResults(data.items ?? []);
      }
    }

    if (query.trim() !== "") {
      fetchData();
    } else {
      setResults([]);
    }

    return () => {
      cancelled = true;
    };
  }, [query]);

  return <div>{results.length}개 결과</div>;
}
```

## useEffect를 쓰지 않아도 되는 경우

- 단순 계산 값은 `useEffect` 대신 렌더링 과정에서 계산
- 이벤트 핸들러에서 끝나는 작업은 핸들러 내부에서 처리
- 파생 상태는 가능하면 상태로 중복 저장하지 않고 계산으로 처리

## 요약

- `useEffect`는 외부 시스템과의 동기화용입니다.
- 의존성 배열을 정확히 작성해야 예측 가능한 동작을 보장할 수 있습니다.
- 정리 함수는 메모리 누수와 중복 실행 문제를 막아줍니다.
