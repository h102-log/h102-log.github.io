---
title: "React 실무 기초 정리"
date: "2026-03-16 00:03"
description: "렌더링 원리부터 전역 상태 관리까지 React 핵심 개념 정리"
tag: "react"
---

# ⚛️ React 실무 기초: 렌더링 원리부터 전역 상태 관리까지

React를 단순히 사용하는 것을 넘어, 실무 수준에서 성능과 유지보수를 고려하며 학습한 핵심 내용들을 정리합니다.

---

## JSX와 가상 돔 (Virtual DOM) 🧠

React에서 작성하는 HTML 같은 코드는 사실 **JSX(JavaScript XML)**입니다. 브라우저는 이를 이해하지 못하므로, 빌드 과정에서 순수한 자바스크립트 객체로 변환됩니다.

- **가상 돔:** 실제 DOM을 조작하는 것은 비용이 많이 듭니다. React는 메모리에 가벼운 자바스크립트 객체 트리(가상 돔)를 유지하며, 변경 사항이 생기면 이전 트리와 비교(Diffing)하여 꼭 필요한 부분만 실제 화면에 반영합니다.

```jsx
// JSX 작성 예시
function Greeting({ name }) {
  return <h1>안녕하세요, {name}님!</h1>;
}

// 위 JSX는 빌드 시 아래와 같은 JS 객체로 변환됩니다
// React.createElement('h1', null, `안녕하세요, ${name}님!`)
```

## 상태 관리와 useState 📸

화면을 다시 그리게(리렌더링) 만드는 핵심 트리거는 **상태(State)**입니다.

- **스냅샷과 배칭:** 상태 업데이트는 비동기적으로 발생하며, 한 이벤트 내의 여러 업데이트는 **배칭(Batching)** 처리되어 성능을 최적화합니다.
- **방어적 코딩:** 이전 상태값을 안전하게 참조하려면 `setCount((prev) => prev + 1)`와 같이 **업데이터 함수**를 사용하는 것이 좋습니다.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // ❌ 잘못된 방법: 배칭으로 인해 +3이 아닌 +1만 됩니다
    // setCount(count + 1);
    // setCount(count + 1);
    // setCount(count + 1);

    // ✅ 올바른 방법: 업데이터 함수로 이전 상태를 안전하게 참조
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={handleClick}>+3 증가</button>
    </div>
  );
}
```

## useEffect와 클로저의 함정 🧹

외부 시스템과의 동기화(API 호출, 타이머 등)를 위해 사용합니다.

- **클린업 함수(Cleanup):** 이펙트가 다시 실행되거나 컴포넌트가 사라질 때 메모리 누수를 방지하기 위해 `return () => { ... }`를 작성해야 합니다.
- **클로저 이슈:** 클린업 함수는 해당 이펙트가 생성될 당시의 상태값(스냅샷)을 기억합니다. 최신 값을 반영하려면 의존성 배열(`[]`) 관리가 필수적입니다.

```jsx
import { useState, useEffect } from "react";

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // ✅ 업데이터 함수로 최신 상태 참조 (클로저 이슈 방지)
      setSeconds((prev) => prev + 1);
    }, 1000);

    // ✅ 클린업: 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(interval);
  }, []); // 빈 배열: 마운트 시 한 번만 실행

  return <p>경과 시간: {seconds}초</p>;
}
```

## 관심사의 분리와 커스텀 훅 (Custom Hooks) 🎣

UI를 담당하는 컴포넌트와 비즈니스 로직을 분리하는 것은 실무의 기본입니다.

- **재사용성:** `useState`, `useEffect` 등을 조합하여 `useCounter`와 같은 나만의 훅을 만들면 로직을 깔끔하게 캡슐화하고 여러 곳에서 재사용할 수 있습니다.

```jsx
// ✅ 커스텀 훅: 로직 캡슐화
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);
  const reset = () => setCount(initialValue);
  return { count, increment, decrement, reset };
}

// 컴포넌트에서 재사용
function CounterA() {
  const { count, increment } = useCounter(0);
  return <button onClick={increment}>A: {count}</button>;
}

function CounterB() {
  const { count, increment, reset } = useCounter(10);
  return (
    <div>
      <button onClick={increment}>B: {count}</button>
      <button onClick={reset}>초기화</button>
    </div>
  );
}
```

## Props Drilling 해결: Context API 📦

부모에서 깊은 자식까지 데이터를 전달할 때 발생하는 **Props Drilling**을 해결하기 위해 전역 상태 관리 도구를 사용합니다.

- **Provider:** 데이터를 제공하는 최상위 부모입니다.
- **useContext:** 어느 깊이의 자식이든 `Provider`가 쏜 데이터를 "빨대"처럼 직접 뽑아서 사용할 수 있게 해줍니다.

```jsx
import { createContext, useContext, useState } from "react";

// 1. Context 생성
const ThemeContext = createContext(null);

// 2. Provider로 하위 트리에 데이터 공급
function App() {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. 깊은 자식 컴포넌트에서 직접 소비 (props 없이)
function ThemeToggleButton() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      현재 테마: {theme}
    </button>
  );
}
```

---
