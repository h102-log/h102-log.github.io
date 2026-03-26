---
title: "[React] useState 완전 정리"
date: "2026-03-26 19:40"
description: "useState의 동작 원리와 실무 사용 패턴 정리"
tag: "react"
group: "React"
---

# [React] useState 완전 정리

`useState`는 React 함수형 컴포넌트에서 상태(State)를 관리하기 위한 가장 기본적인 Hook입니다.

## useState란?

상태는 "화면을 다시 그리게 만드는 값"입니다.
`useState`로 상태를 선언하면, 상태가 바뀔 때 컴포넌트가 다시 렌더링됩니다.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

## 기본 문법

```jsx
const [state, setState] = useState(initialValue);
```

- `state`: 현재 상태값
- `setState`: 상태를 바꾸는 함수
- `initialValue`: 초기 상태값

## 실무에서 자주 쓰는 패턴

### 객체 상태 업데이트

객체는 일부 필드만 바꾸더라도 새로운 객체를 만들어야 합니다.

```jsx
const [form, setForm] = useState({ email: "", password: "" });

const onChangeEmail = (e) => {
  setForm((prev) => ({ ...prev, email: e.target.value }));
};
```

### 이전 상태 기반 업데이트

연속 업데이트나 비동기 흐름에서는 업데이터 함수를 권장합니다.

```jsx
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
```

위 코드는 배칭되어도 의도대로 +3 됩니다.

### 초기값 계산 비용이 큰 경우

초기화 비용이 크면 함수 형태로 초기값을 지연 계산할 수 있습니다.

```jsx
const [items] = useState(() => {
  return Array.from({ length: 10000 }, (_, i) => `item-${i}`);
});
```

## 주의할 점

- 상태를 직접 변경하면 안 됩니다. 예: `state.value = 10` (X)
- 상태 변경 후 값이 즉시 바뀌었다고 가정하면 버그가 생길 수 있습니다.
- 상태는 "스냅샷"처럼 동작하므로, 이벤트 핸들러 내부에서 오래된 값을 참조할 수 있습니다.

## 요약

- `useState`는 함수형 컴포넌트의 상태 관리 핵심 도구입니다.
- 값이 변경되면 컴포넌트가 다시 렌더링됩니다.
- 이전 값 기반 업데이트는 업데이터 함수 패턴(`prev => ...`)을 사용하면 안전합니다.
