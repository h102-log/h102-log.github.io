---
title: "[JavaScript] js some()함수"
date: "2026-03-22 23:23"
description: "js some()함수 사용법"
tag: "javascript"
category: "FrontEnd"
group: "JavaScript 배열 메서드"
---

## 서론

배열 안에 특정 조건을 만족하는 데이터가 하나라도 있는지 확인해야 하는 상황은 실무에서 정말 자주 등장합니다.
예를 들어 "관리자 권한을 가진 사용자가 한 명이라도 있는가?", "장바구니에 품절 상품이 하나라도 포함됐는가?" 같은 케이스입니다.   

이럴 때 가장 간결하게 사용할 수 있는 메서드가 바로 `Array.prototype.some()`입니다.
이번 글에서는 `some()`의 기본 동작부터 실무에서 자주 놓치는 방어 코드 포인트까지 순서대로 정리해 보겠습니다.

---

## some() 기본 동작

`some()`은 배열을 앞에서부터 순회하다가, 콜백 조건을 만족하는 요소를 하나라도 찾으면 즉시 `true`를 반환하고 종료합니다.
끝까지 검사했는데 만족하는 값이 없으면 `false`를 반환합니다.

```javascript
const numbers = [1, 2, 3, 4];

const hasOne = numbers.some((value) => value === 1);
const hasTen = numbers.some((value) => value === 10);

console.log(hasOne); // true
console.log(hasTen); // false
```

---

## 실습: 방어 코드

실무에서는 API 응답이 항상 배열이라는 보장이 없습니다.
`null`, `undefined`, 객체 등이 들어오면 `some()` 호출 시 런타임 에러가 발생할 수 있습니다.

아래처럼 배열 여부를 먼저 검증한 뒤 처리하는 패턴이 안전합니다.

```javascript
function hasBlockedUser(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return false;
  }

  return users.some((user) => user?.status === "blocked");
}

console.log(hasBlockedUser([{ status: "active" }, { status: "blocked" }]));
// true

console.log(hasBlockedUser(null));
// false
```

이 패턴을 사용하면 "데이터 이상치 때문에 화면이 깨지는 문제"를 상당히 줄일 수 있습니다.

---

## forEach, filter와의 차이

조건 검사 목적이라면 `forEach`나 `filter`보다 `some()`이 의도에 더 정확히 맞습니다.

1. `forEach`는 중간에 멈출 수 없어 항상 끝까지 순회합니다.
2. `filter`는 끝까지 순회하고, 추가로 새 배열까지 생성합니다.
3. `some()`은 조건 만족 즉시 종료하므로 불필요한 연산이 줄어듭니다.

즉, "하나라도 있으면 된다"라는 요구사항에는 `some()`이 가장 직관적입니다.

---

## 일반 for문과 비교

성능만 극단적으로 보면 콜백이 없는 `for` 문이 미세하게 유리할 수 있습니다.
하지만 대부분의 서비스 코드에서는 그 차이보다 "코드를 읽고 의도를 즉시 파악할 수 있는가"가 더 중요합니다.

`some()`은 이름 자체가 의도를 설명해 주기 때문에, 팀 단위 유지보수에서 특히 강점을 가집니다.

---

## 정리

1. `some()`은 조건을 만족하는 요소가 하나라도 있으면 `true`를 반환합니다.
2. 조건 검사 목적에서는 `forEach`/`filter`보다 `some()`이 더 적합합니다.
3. 실무에서는 `Array.isArray()` 기반의 방어 코드를 함께 사용하는 습관이 중요합니다.
