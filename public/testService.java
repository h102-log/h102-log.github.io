package com.example.demo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.dpendencyTest.ABservice;
import com.example.demo.dpendencyTest.Aservice;

@ExtendWith(MockitoExtension.class)
class BserviceTest {

    @Test
    void testBservice() {
        // 1. Aservice 객체 준비 (스프링 도움 없이 순수 자바 인스턴스 생성)
        Aservice aservice = new Aservice();

        // 2. 생성자 주입으로 Aservice 주입 (우리가 직접 제어할 수 있음!)
        ABservice abservice = new ABservice(aservice);

        System.out.println("===========================================");
        
        // 3. 실행 결과 확인 - 생성자 주입 메서드
        try {
            // 의도: 생성자를 통해 안전하게 aservice가 주입되었으므로 "이건 성공" 합니다!
            abservice.constructorFunction(); 
        } catch (Exception e) {
            System.out.println("생성자 주입에서 예외 발생: " + e.getMessage());
        }
        
        System.out.println("-------------------------------------------");

        // 4. 실행 결과 확인 - 필드 주입 메서드
        try {
            // 의도: 순수 자바 환경이므로 @Autowired가 무시되어 초기값이 null입니다. 
            // 내부 로직에서 NPE가 발생하여 catch 블록의 메시지가 출력됩니다.
            abservice.autowiredFunction(); 
        } catch (Exception e) {
            // (참고: ABservice 내부에서 이미 catch 했기 때문에 이 바깥쪽 catch 문까지는 오지 않습니다.)
            System.out.println("필드 주입 로직 실행 중 문제 발생: " + e.getMessage());
        }
        
        System.out.println("===========================================");
    }
}