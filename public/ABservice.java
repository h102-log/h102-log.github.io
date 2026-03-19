package com.example.demo.dpendencyTest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class ABservice {

    // 비즈니스 로직 의도: 필드 주입의 취약점(가변성 및 단위 테스트 시 주입 누락)을 보여주기 위한 변수 
    // 주의사항: 순수 단위 테스트(new) 시 스프링 컨테이너가 개입하지 않아 null 상태로 방치됩니다.
    @Autowired
    @Qualifier("aservice")
    private AB autowiredAB;

    // 비즈니스 로직 의도: 생성자 주입을 통한 방어적 코딩 및 불변성(Immutability) 확보
    // 주의사항: final 키워드로 인해 초기화 이후 절대 다른 객체로 변조될 수 없습니다.
    private final AB finalAb;
    // 명시적으로 aservice 빈을 주입받도록 설정 (스프링 컨테이너 구동 시 동작)
    public ABservice(@Qualifier("aservice") AB ab) {
        this.finalAb = ab;
    }

    public void autowiredFunction() {
        System.out.println("[필드 주입 방식 테스트]");
        try {
            // 주의사항: 스프링 없이 new 로 생성했기 때문에 autowiredAB는 null 입니다. (NPE 발생 지점)
            autowiredAB.doWork();
        } catch (NullPointerException e) {
            System.out.println(" -> 예상된 예외 발생: autowiredAB가 아직 주입되지 않아 null 입니다.");
        }

        // 의도: 필드 주입은 final이 없으므로, 이렇게 런타임에 외부/내부에서 의존성이 변조될 수 있는 취약점이 있습니다.
        System.out.println(" -> 강제로 autowiredAB에 finalAb 객체를 할당(변조)합니다.");
        this.autowiredAB = finalAb;

        try {
            // 변조된 이후에는 정상 동작합니다. (실무에서는 이러한 상태 변경이 치명적인 버그를 만듭니다.)
            autowiredAB.doWork();
        } catch (NullPointerException e) {
            System.out.println(" -> NullPointerException 발생");
        }
    }

    public void constructorFunction() {
        System.out.println("[생성자 주입 방식 테스트]");
        // 의도: 생성 시점에 완벽하게 의존성이 주입(finalAb)되었으므로 무조건 안전하게 동작합니다.
        finalAb.doWork();

        // 방어적 코딩: 아래 주석을 해제하면 final 키워드 덕분에 '컴파일 에러'가 발생하여 상태 변조를 원천 차단합니다.
        // this.finalAb = new Bservice(); 
    }
}