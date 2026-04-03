---
title: "[Spring] Spring Framework란"
date: "2026-04-02 10:00"
description: "Spring Framework가 무엇인지"
tag: "spring"
group: "Spring Framework 완전 정복"
---

## Spring Framework란?

Spring Framework를 한 문장으로 설명하면,
"객체 지향 설계를 더 잘 지키면서, 유지보수하기 쉬운 자바 애플리케이션을 만들게 도와주는 프레임워크"입니다.

처음에는 기능이 많아 보여 복잡해 보일 수 있지만,
핵심 원리만 이해하면 오히려 코드가 단순해지고 테스트도 쉬워집니다.

---

## Spring의 핵심 개념

### 1) IoC (Inversion of Control, 제어의 역전)

기존 자바 코드에서는 필요한 객체를 직접 `new`로 생성했습니다.
Spring에서는 객체 생성과 생명주기를 컨테이너가 담당하고, 개발자는 필요한 의존성을 "주입"받아 사용합니다.

```java
// Spring 방식 (IoC 적용)
@Service
public class OrderService {
    private PaymentService paymentService; // 직접 new를 쓰지 않음
    private UserRepository userRepository;

    // Spring이 생성자 주입 방식으로 의존성을 전달합니다.
    public OrderService(PaymentService paymentService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    public void placeOrder(String userId, String itemId) {
        userRepository.getUser(userId);
        paymentService.processPayment(...);
        // 비즈니스 로직에만 집중
    }
}
```

이 구조의 장점은 의존성 교체가 쉬워진다는 점입니다.
예를 들어 결제 구현체가 바뀌어도 비즈니스 로직 자체는 크게 흔들리지 않습니다.

---

### 2) 느슨한 결합 (Loose Coupling)

느슨한 결합은 "클래스 간 의존도를 낮춰 변경 영향 범위를 줄이는 설계"입니다.
실무에서는 이 원칙 하나만 잘 지켜도 기능 추가 속도와 안정성이 크게 올라갑니다.

한 클래스 변경이 전체 시스템으로 번지지 않도록 만드는 것이 핵심입니다.

---

### 3) 관심사의 분리 (Separation of Concerns)

Spring은 비즈니스 로직과 기술 로직(트랜잭션, 보안, 로깅)을 분리해서 관리할 수 있게 도와줍니다.
덕분에 개발자는 서비스 메서드에서 핵심 도메인 흐름에 집중할 수 있습니다.

아래는 트랜잭션 처리 예시입니다.

```java
// Spring이 트랜잭션 경계를 관리해 주는 예시
@Service
public class OrderService {

    @Transactional
    public void placeOrder(String userId, String itemId) {
        // 비즈니스 로직 작성
        userRepository.save(user);
        paymentService.processPayment(payment);
    }
}
```

`@Transactional` 같은 선언적 기능을 통해 반복적인 기술 코드를 크게 줄일 수 있습니다.

---

## 정리

1. Spring Framework의 핵심 가치는 "좋은 객체 지향 설계 지원"에 있습니다.
2. IoC/DI를 통해 객체 생성 책임을 분리하면 테스트와 유지보수가 쉬워집니다.
3. 관심사 분리를 적용하면 비즈니스 로직은 더 단순하고 읽기 쉬운 형태로 유지됩니다.
