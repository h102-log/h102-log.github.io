---
title: "[React] useState"
date: "2026-03-26 19:40"
description: "useState의 동작 원리와 실무 사용 패턴 정리"
tag: "react"
group: "React"
---

## 서론

`useState`는 React에서 가장 기본이 되는 Hook이지만, 실무에서는 가장 자주 버그가 나는 지점이기도 합니다.
특히 상태 업데이트 타이밍과 이전 값 참조 방식을 정확히 이해하지 못하면, 겉보기엔 동작하는데 실제로는 불안정한 코드가 만들어집니다.

이번 글에서는 `useState`를 실무 관점에서 정리해 보겠습니다.

---

## useState란?

상태는 "값이 바뀌면 화면을 다시 그리게 만드는 데이터"입니다.
`useState`로 상태를 선언하면 상태가 변경될 때 컴포넌트가 다시 렌더링됩니다.

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

---

## 기본 문법

```jsx
const [state, setState] = useState(initialValue);
```

1. `state`: 현재 상태값
2. `setState`: 상태를 갱신하는 함수
3. `initialValue`: 초기 상태값

---

## 실무에서 자주 쓰는 패턴

### 객체 상태 업데이트

객체 상태는 일부만 바꾸더라도 항상 새 객체를 만들어야 합니다.

```jsx
const [form, setForm] = useState({ email: "", password: "" });

const onChangeEmail = (e) => {
  setForm((prev) => ({ ...prev, email: e.target.value }));
};
```

### 이전 상태 기반 업데이트

연속 업데이트, 비동기 처리, 이벤트 배칭 상황에서는 업데이터 함수 패턴이 안전합니다.

```jsx
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
```

위 코드는 배칭되어도 의도대로 `+3`이 보장됩니다.

### 초기값 계산 비용이 큰 경우

초기화 비용이 큰 로직은 함수 형태로 전달해 최초 렌더링 때만 실행되도록 만드는 것이 유리합니다.

```jsx
const [items] = useState(() => {
  return Array.from({ length: 10000 }, (_, i) => `item-${i}`);
});
```

---

## 주의할 점

1. 상태를 직접 변경하면 안 됩니다. 예: `state.value = 10`.
2. 상태 변경 직후 값이 즉시 바뀐다고 가정하면 버그가 생길 수 있습니다.
3. 이벤트 핸들러는 오래된 상태 스냅샷을 참조할 수 있으므로, 이전 값 기반 계산은 업데이터 함수를 사용해야 합니다.

---

## 정리

1. `useState`는 함수형 컴포넌트 상태 관리의 핵심 도구입니다.
2. 객체/배열 상태는 불변성을 지키며 업데이트해야 합니다.
3. 이전 값 기반 갱신은 `setState(prev => ...)` 패턴이 가장 안정적입니다.
