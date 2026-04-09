---
title: "[React] useEffect"
date: "2026-03-26 19:41"
description: "useEffect의 실행 시점, 의존성 배열, 정리 함수 정리"
tag: "react"
category: "FrontEnd"
group: "React"
---

## 서론

`useEffect`는 React에서 가장 강력하지만, 동시에 가장 오해가 많은 Hook입니다.
특히 의존성 배열과 정리 함수를 정확히 이해하지 못하면 API 중복 호출, 메모리 누수, 레이스 컨디션이 쉽게 발생합니다.

이번 글에서는 `useEffect`를 "언제 실행되고 언제 정리되는가" 중심으로 정리해 보겠습니다.

---

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

1. 첫 번째 인자: 이펙트 함수
2. 반환 함수: 정리 함수(cleanup)
3. 두 번째 인자: 의존성 배열


---

## 의존성 배열 동작

### 의존성 생략

```jsx
useEffect(() => {
  console.log("렌더링마다 실행");
});
```

렌더링마다 실행됩니다.

### 빈 배열 `[]`

```jsx
useEffect(() => {
  console.log("마운트 시 1회 실행");
}, []);
```

초기 마운트 시점에 한 번 실행됩니다.

### 특정 값 의존

```jsx
useEffect(() => {
  console.log("query가 바뀔 때마다 실행", query);
}, [query]);
```

`query` 값이 바뀔 때마다 실행됩니다.

---

## 정리 함수가 중요한 이유

이펙트에서 만든 자원은 반드시 이펙트에서 정리해야 합니다.
정리 함수가 없으면 메모리 누수와 중복 구독 문제가 발생할 수 있습니다.

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

---

## 예제: 검색 API 호출

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

위 패턴을 사용하면 느린 네트워크 상황에서도 이전 요청 응답이 최신 결과를 덮어쓰는 문제를 줄일 수 있습니다.

---

## useEffect를 쓰지 않아도 되는 경우

1. 단순 계산 값은 렌더링 과정에서 바로 계산합니다.
2. 이벤트 핸들러에서 끝나는 작업은 핸들러 내부에서 처리합니다.
3. 파생 상태는 가능하면 중복 상태로 저장하지 않고 계산으로 처리합니다.

---

## 정리

1. `useEffect`는 외부 시스템과의 동기화를 위한 Hook입니다.
2. 의존성 배열을 정확히 작성해야 실행 시점을 예측할 수 있습니다.
3. 정리 함수는 누수와 중복 실행 문제를 방지하는 필수 안전장치입니다.
