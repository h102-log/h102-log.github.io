package com.example; // [주의사항] VS Code 패키지 선언부 유지

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitForSelectorState;
import java.util.function.Function;

public class Main {

    // =========================================================================
    // 💡 [실험군] 스프링의 @Component 역할을 대신할 최적화된 PlaywrightHolder ====================
    // =========================================================================
    static class PlaywrightHolder {
        private Playwright pw;
        private BrowserContext ctx; 
        private Browser browser; 

        // @PostConstruct 역할 (서버 기동 시 1회만 실행)
        public void init() {
            pw = Playwright.create();
            browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            ctx = browser.newContext();
            
            // [핵심 최적화] 이미지, 폰트, CSS 다운로드 원천 차단
            ctx.route("**/*", route -> {
                String type = route.request().resourceType();
                if ("image".equals(type) || "font".equals(type) || "stylesheet".equals(type)) {
                    route.abort(); 
                } else {
                    route.resume(); 
                }
            });
        }
        
        public <T> T withPage(Function<Page, T> work) {
            Page page = ctx.newPage(); 
            page.setDefaultTimeout(20000); 
            page.setDefaultNavigationTimeout(40000); 
            try {
                return work.apply(page);
            } finally {
                page.close();
            }
        }

        // @PreDestroy 역할
        public void shutdown() {
            if (ctx != null) ctx.close();
            if (browser != null) browser.close();
            if (pw != null) pw.close();
        }
    }

    // =========================================================================
    // 💡 공통 크롤링 비즈니스 로직 (중복 코드 제거
    // =========================================================================
    private static void performCrawling(Page page) {
        String targetUrl = "https://h102-log.github.io/CrawlingTest.html";  
        page.navigate(targetUrl);

        // 1. 표 데이터 추출
        page.locator("#user-tbody > tr").nth(1).waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        Locator tableRows = page.locator("#user-tbody > tr");
        
        // (콘솔이 너무 길어지지 않게 첫 번째 데이터만 샘플로 추출합니다)
        if (tableRows.count() > 1) {
            String firstRowText = tableRows.nth(1).innerText().replaceAll("\\n", " \t| ");
            System.out.println("추출 샘플: " + firstRowText);  
        }

        // 2. 쿠폰 발급 (1초 대기 포함)
        page.locator("#activate-btn").click();
        page.waitForTimeout(1000); 
        String secretCoupon = page.locator("#coupon-code").innerText();
        System.out.println("쿠폰 확인: " + secretCoupon);
    }


    // =========================================================================
    // 💡 메인 테스트 실행 (비교군 vs 실험군)
    // =========================================================================
    public static void main(String[] args) {
        
        System.out.println("==================================================");
        System.out.println(" [비교군] 1. 기존 방식 (매번 브라우저 켜기 + 리소스 다운)");
        System.out.println("==================================================");
        
        long startUnoptimized = System.currentTimeMillis();
        
        // [Logic] 요청이 들어올 때마다 무거운 브라우저를 새로 띄웁니다.
        try (Playwright pw = Playwright.create();
             Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true))) {
             
            BrowserContext ctx = browser.newContext();
            Page page = ctx.newPage();
            page.setDefaultNavigationTimeout(60000);
            
            performCrawling(page); // 크롤링 수행
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        long endUnoptimized = System.currentTimeMillis();
        long unoptimizedTime = endUnoptimized - startUnoptimized;
        System.out.println("⏱️ 기존 방식 소요 시간: " + unoptimizedTime + "ms\n");


        System.out.println("==================================================");
        System.out.println(" [실험군] 2. 최적화 방식 (브라우저 재사용 + CSS/이미지 차단)");
        System.out.println("==================================================");
        
        // [Logic] 서버가 켜질 때 브라우저를 미리 세팅해 둡니다. (이 시간은 요청 시간에 포함되지 않음)
        System.out.println("   (백그라운드: 브라우저 초기화 중...)");
        PlaywrightHolder holder = new PlaywrightHolder();
        holder.init(); 
        
        long startOptimized = System.currentTimeMillis();
        
        try {
            // [Logic] 이미 켜진 브라우저에서 가볍게 새 탭만 열어서 크롤링합니다.
            holder.withPage(page -> {
                performCrawling(page);
                return null; 
            });
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            holder.shutdown(); // 서버 종료 시 자원 반납
        }
        
        long endOptimized = System.currentTimeMillis();
        long optimizedTime = endOptimized - startOptimized;
        System.out.println("⏱️ 최적화 방식 소요 시간: " + optimizedTime + "ms\n");


        // =========================================================================
        // 💡 최종 결과 리포트
        // =========================================================================
        System.out.println("================ 최종 리포트 ================");
        System.out.println("1. 기존 방식: " + unoptimizedTime + "ms");
        System.out.println("2. 최적화 방식: " + optimizedTime + "ms");
        System.out.println("🚀 결론: 최적화 방식이 약 " + (unoptimizedTime - optimizedTime) + "ms 더 빠릅니다!");
        System.out.println("===========================================");
    }
}