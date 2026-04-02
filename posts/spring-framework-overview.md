---
title: "[Spring] Spring Framework란"
date: "2026-04-02 10:00"
description: "Spring Framework가 무엇인지"
tag: "spring"
group: "Spring Framework 완전 정복"
---

## Spring Framework란?

**Spring Framework는 자바 애플리케이션을 쉽고 빠르게 만들 수 있도록 도와주는 프레임워크입니다.**

좀 더 정확히 말하면, Spring은 "좋은 객체 지향 설계 원칙에 따라 애플리케이션을 개발할 수 있도록 도와주는 도구"라고 생각하면 됩니다.

---

### Spring의 핵심 정리

#### 1️⃣ **IoC (Inversion of Control) - 제어의 역전**

"객체를 직접 만들지 말고, Spring에게 만들어달라 라는 개념입니다."

```java
// Spring 방식 (IoC 적용)
@Service
public class OrderService {
    private PaymentService paymentService;       // 직접 new를 쓰지 않음
    private UserRepository userRepository;

    // Spring이 알아서 의존성을 주입해줘요 (Dependency Injection)
    public OrderService(PaymentService paymentService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    public void placeOrder(String userId, String itemId) {
        userRepository.getUser(userId);
        paymentService.processPayment(...);
        // 깔끔하고 의존성이 명확해졌어요!
    }
}
```

이제 PaymentService를 바꿔야 할 때:

- ✅ OrderService의 비즈니스 로직 수정은 필요 없습니다.
- ✅ Spring의 설정만 바꾸면 됩니다.
- ✅ 테스트할 때 가짜 PaymentService를 쉽게 주입할 수 있습니다.

#### 2️⃣ **느슨한 결합 (Loose Coupling)**

객체들 간의 의존도를 낮춤으로써, 코드 변경의 영향 범위를 최소화합니다.

한 클래스의 변경이 다른 클래스로 파급되지 않습니다. 레고처럼 쉽게 조립하고 분리할 수 있죠.

#### 3️⃣ **관심사의 분리 (Separation of Concerns)**

비즈니스 로직과 기술적 문제(DB 관리, 트랜잭션, 로깅)를 분리합니다.

Spring이 반복적인 기술 코드를 처리하고, 개발자는 비즈니스 로직만 작성하면 됩니다.

```java
// Spring 방식 - 트랜잭션 관리가 자동으로 처리됨
@Service
public class OrderService {

    // 이 메서드를 실행하면:
    // 1. 트랜잭션 시작
    // 2. 비즈니스 로직 실행
    // 3. 트랜잭션 커밋 (또는 예외 발생시 롤백)
    @Transactional
    public void placeOrder(String userId, String itemId) {
        // 개발자는 비즈니스 로직에만 집중
        userRepository.save(user);
        paymentService.processPayment(payment);
    }
}
```

## 정리

- **Spring Framework**: 좋은 객체 지향 개발을 도와주는 자바 프레임워크
- **핵심 철학**: IoC, DI, 느슨한 결합, 관심사의 분리
- **목표**: 개발자는 비즈니스 로직에 집중, Spring은 기술적 문제 해결
- **효과**: 빠르고 안정적이며 유지보수하기 쉬운 애플리케이션 개발 가능
