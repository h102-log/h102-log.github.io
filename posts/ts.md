---
title: "[TypeScript] 타입 기초 정리"
date: "2026-04-10 10:30"
description: "TypeScript의 교차 타입(&), type 재정의 제한, as 타입 단언, const/readonly, 리터럴 타입, as const를 예제로 정리합니다."
tag: "TypeScript"
---

# TypeScript 타입 기초 정리

실무에서 자주 헷갈리는 TypeScript 타입 문법을 짧고 명확하게 정리했습니다.

## `&` (교차 타입, Intersection Type)

`A & B`는 "A와 B의 조건을 모두 만족해야 하는 타입"입니다.

```ts
type A = { a: number; b: string };
type B = { a: number; b: number; c: boolean };

type C = A & B;
// C의 b는 string & number가 되어 사실상 never가 됩니다.
// 따라서 아래 객체는 타입 에러가 발생합니다.
const x: C = { a: 1, b: "hello", c: true };
```

왜 에러일까요?

- `A.b`는 `string`
- `B.b`는 `number`
- 교차 타입에서는 둘 다 만족해야 해서 `b: string & number`가 됩니다.
- `string`이면서 동시에 `number`인 값은 없으므로 `never`가 됩니다.

즉, 충돌하는 프로퍼티가 있으면 `&` 사용 시 주의가 필요합니다.

## `type` 재정의는 불가능

같은 스코프에서 같은 이름의 `type` 별칭은 다시 선언할 수 없습니다.

```ts
type User = { name: string };
// type User = { age: number }; // 에러: Duplicate identifier 'User'
```

필요하다면 새로운 이름을 쓰거나, 조합해서 새 타입을 만들어야 합니다.

```ts
type User = { name: string };
type UserWithAge = User & { age: number };
```

## `as` 문법 (타입 단언)

`as`는 "컴파일러에게 이 값을 이 타입으로 보겠다"고 알려주는 문법입니다.

```ts
const value: unknown = "hello";

// 컴파일러에게 문자열이라고 단언
const str = value as string;
console.log(str.toUpperCase());
```

단, `as`는 런타임 변환이 아닙니다. 실제 데이터 검증이 필요하면 타입 가드를 함께 사용해야 안전합니다.

```ts
function printUpper(value: unknown) {
  if (typeof value === "string") {
    // 여기서는 단언 없이도 string으로 추론됨
    console.log(value.toUpperCase());
  }
}
```

## `const` 변수와 `readonly`

- `const`: 변수 재할당 금지
- `readonly`: 객체 프로퍼티 재할당 금지

```ts
const num = 10;
// num = 20; // 에러: 재할당 불가

type Profile = {
  readonly name: string;
  age: number;
};

const profile: Profile = { name: "kim", age: 20 };
// profile.name = "lee"; // 에러: readonly 프로퍼티 수정 불가
profile.age = 21; // 가능
```

## 리터럴 타입

리터럴 타입은 값 그 자체를 타입으로 사용하는 방식입니다.

```ts
function 내함수(a: "kim") {}

내함수("kim"); // 가능
// 내함수("lee"); // 에러
```

## `as const`

`as const`를 붙이면 객체/배열이 최대한 좁은 리터럴 타입으로 고정되고, 프로퍼티가 `readonly`로 바뀝니다.

```ts
const 자료 = {
  name: "kim",
} as const;

자료.name; // 타입: "kim"
// 자료.name = "lee"; // 에러: readonly

function 내함수(a: "kim") {}
내함수(자료.name); // 가능
```

## 마무리
