---
title: "Java 크롤링"
date: "2026-03-16 00:03"
description: "Java로 크롤링 하는 방법"
tag: "java"
---

## 서론

Java로 웹 크롤링(Scraping)을 구현하는 방법은 크게 두 가지가 있습니다.
첫 번째는 **Jsoup** 라이브러리를 사용하는 방법이고, 두 번째는 **Playwright**를 사용하는 방법입니다.

이 둘을 간단히 비교하자면, **Jsoup**는 가볍고 처리 속도가 빠르지만 초기 로딩된 정적인 데이터만 수집이 가능합니다.
반면 **Playwright**는 브라우저를 직접 제어하기 때문에 Jsoup에 비해 속도는 다소 느리지만, 화면 렌더링 이후에 JavaScript나 AJAX로 생성되는 동적인 데이터까지 모두 수집할 수 있다는 강력한 장점이 있습니다.

아래 예시를 통해 Jsoup의 특징과 한계점을 직접 확인해 보겠습니다.
이번 크롤링 연습을 위해 타겟으로 삼을 사이트 주소는 다음과 같습니다.

> **실습 타겟 URL:** [크롤링 연습 사이트](https://h102-log.github.io/CrawlingTest.html)

---

## Jsoup을 활용한 정적 데이터 크롤링

### 실습

가장 먼저 Jsoup을 사용하기 위해 `pom.xml`에 의존성을 추가해 줍니다.

```xml
<dependencies>
  <dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.17.2</version>
  </dependency>
</dependencies>
```

이후 연습 사이트의 구조를 개발자 도구(F12)로 확인해 보면,
메인 타이틀이 아래와 같이 작성되어 있는 것을 알 수 있습니다.

```html
<h1 id="title">웹 데이터 수집(Scraping &amp; API) 연습장</h1>
```

이제 이 타이틀 텍스트를 Jsoup을 이용해 가져와 보겠습니다.

```java

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;

public class JsoupCrawlerDemo {
    public static void main(String[] args) {
        // 타겟 URL과 연결 타임아웃 설정
        String targetUrl = "https://h102-log.github.io/CrawlingTest.html";
        // 연결 타임아웃을 5초로 설정, 5초가 지나면 연결이 실패로 간주됩니다.
        int connectionTimeoutMs = 5000;
        try {
            // Jsoup을 사용하여 타겟 URL에 연결하고 HTML 문서를 가져옵니다.
            Document htmlDocument = Jsoup.connect(targetUrl)
                                         .timeout(connectionTimeoutMs)
                                         .get();
            // HTML 문서에서 id가 "title"인 요소를 선택하여 텍스트를 출력합니다.
            Elements title = htmlDocument.select("#title");
            if (title == null || title .isEmpty()) {
                System.err.println("타겟구조를 확인하세요.");
                return;
            }
            // 선택된 요소의 텍스트를 출력합니다.
            System.out.println("title: " + title.text());
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}

```

위 코드를 실행해 보면 다음과 같이 타이틀 값이 정상적으로 조회되는 것을 확인할 수 있습니다.

여기서 중요한 점 하나는 `htmlDocument.select()` 메서드의 반환값 처리입니다.
이 메서드는 타겟 HTML에서 조건에 맞는 태그를 찾지 못하더라도
오류를 발생시키거나 `null`을 반환하지 않고, **비어있는(empty) 객체를 반환**합니다.

따라서 데이터가 정상적으로 수집되었는지 검증할 때는 `null` 체크가 아닌,
`.isEmpty()`를 활용하여 예외 처리를 해주어야 합니다.
그래야만 의도치 않은 빈 데이터 처리를 방지하고 안전한 로직을 구성할 수 있습니다.

### 한계점

그렇다면 이번에는 화면 하단에 있는 테이블의 데이터(TR)를 가져오고 싶다면 어떻게 해야 할까요?
테이블 데이터를 추출하기 위해 다음과 같이 코드를 작성해 볼 수 있습니다.

```java
Elements tableRows = htmlDocument.select("#user-tbody > tr");
if (tableRows == null || tableRows.isEmpty()) {
   System.err.println("타겟 구조를 확인하세요.");
   return;
}
tableRows.stream().forEach(row -> {
                String rowText = row.text();
                if (rowText != null && !rowText.trim().isEmpty()) {
                    System.out.println(rowText);
                }
         });
```

작성한 구문을 기존 코드에 추가하여 실행해 보겠습니다.

`tr` 구조를 순회했으니 화면에 보이는 대로 직원 ID, 이름, 이메일, 소속사 정보가 출력되어야 할 것입니다.

하지만 의도와는 전혀 다른, **데이터를 불러오는 중입니다** 가 출력되고 있습니다.

> **왜 이런 현상이 발생할까요?**
> 연습 사이트는 초기 화면 렌더링 이후 AJAX 통신을 통해 비동기적으로 `tr` 값을 갱신해주고 있기 때문입니다.

여기서 바로 **Jsoup의 치명적인 단점**이 드러납니다. Jsoup은 최초에 서버로부터 전달받은 정적인 HTML 소스코드만 파싱하기 때문에, 브라우저가 JavaScript를 실행한 이후에 변경되거나 추가된 동적인 데이터는 읽어오지 못하는 것입니다.

---

## Playwright로 동적 데이터 크롤링하기

동적 데이터까지 안정적으로 가져오려면 실제 브라우저를 띄워 JavaScript 실행 이후의 DOM을 읽어야 합니다.
Java에서는 **Playwright**가 이 역할을 아주 잘 수행합니다.

### 실습

먼저 `pom.xml`에 Playwright 의존성을 추가합니다.

```xml
<dependencies>
  <dependency>
    <groupId>com.microsoft.playwright</groupId>
    <artifactId>playwright</artifactId>
    <version>1.52.0</version>
  </dependency>
</dependencies>
```

아래 코드는 Playwright로 페이지에 접속한 뒤, 비동기로 채워지는 테이블 행을 기다렸다가 데이터를 가져오는 예시입니다.

```java
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.WaitForSelectorState;

public class DynamicTrCrawlingSample {
    public static void main(String[] args) {
        String targetUrl = "https://h102-log.github.io/CrawlingTest.html";

        try (Playwright pw = Playwright.create();
             Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
             BrowserContext ctx = browser.newContext();
             Page page = ctx.newPage()) {

            // 네비게이션 타임아웃을 넉넉히 설정하여 네트워크 지연에도 방어적으로 대응합니다.
            page.setDefaultNavigationTimeout(60000);
            page.navigate(targetUrl);

            // 동적 렌더링이 끝나기 전 접근하면 "데이터를 불러오는 중"만 읽을 수 있으므로
            // 실제 행이 보일 때까지 명시적으로 대기합니다.
            page.locator("#user-tbody > tr")
                .nth(1)
                .waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));

            Locator tableRows = page.locator("#user-tbody > tr");
            int rowCount = tableRows.count();

            if (rowCount <= 1) {
                System.err.println("테이블 데이터가 아직 준비되지 않았습니다.");
                return;
            }

            // 헤더/안내 행을 제외하고 실제 데이터 행만 출력합니다.
            for (int index = 1; index < rowCount; index++) {
                String rowText = tableRows.nth(index).innerText();
                if (rowText != null && !rowText.trim().isEmpty()) {
                    System.out.println(rowText.replaceAll("\\n", " | "));
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

위 코드의 핵심은 아래 두 가지입니다.

1. 브라우저를 통해 JavaScript가 실제 실행된 뒤의 DOM을 읽는다.
2. waitFor로 렌더링 완료 시점을 기다린 뒤 tr을 조회한다.

---

**그런데 매번 Playwright.create() 하면 느립니다**

여기서 중요한 운영 이슈가 하나 있습니다.

요청이 들어올 때마다 아래처럼 Playwright/Browser를 매번 새로 만들면,
브라우저 초기화 비용 때문에 응답 시간이 길어집니다.

```java
try (Playwright pw = Playwright.create();
     Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true))) {
    BrowserContext ctx = browser.newContext();
    Page page = ctx.newPage();
    // 크롤링 로직...
}
```

학습용 단일 실행에서는 큰 문제가 없지만,
실서비스(예: 스케줄러, API 서버, 배치 시스템)에서는 요청 수가 늘수록 병목이 됩니다.

---

## 개선 포인트: 브라우저 재사용 구조 만들기

첨부한 Main.java의 아이디어처럼,
애플리케이션 시작 시점에 Playwright와 Browser를 1회 초기화하고,
요청마다 가벼운 새 Page만 열어 작업하는 구조가 효율적입니다.

```java
import com.microsoft.playwright.*;
import java.util.function.Function;

public class PlaywrightHolder {
    private Playwright pw;
    private Browser browser;
    private BrowserContext ctx;

    // 서버 기동 시 1회 초기화
    public void init() {
        pw = Playwright.create();
        browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
        ctx = browser.newContext();

        // 크롤링에 불필요한 리소스는 차단하여 응답 시간을 더 줄입니다.
        ctx.route("**/*", route -> {
            String type = route.request().resourceType();
            if ("image".equals(type) || "font".equals(type) || "stylesheet".equals(type)) {
                route.abort();
            } else {
                route.resume();
            }
        });
    }

    // 요청마다 새 탭(Page)만 열어 작업
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

    // 서버 종료 시 자원 정리
    public void shutdown() {
        if (ctx != null) ctx.close();
        if (browser != null) browser.close();
        if (pw != null) pw.close();
    }
}
```

### 왜 이 구조가 더 좋을까요?

1. 무거운 브라우저 부팅 비용을 매 요청마다 반복하지 않습니다.
2. Page 단위로 작업을 분리해 코드 책임이 명확해집니다.
3. 이미지/CSS/폰트 차단으로 네트워크 낭비를 줄일 수 있습니다.
4. init/shutdown 라이프사이클이 분리되어 운영 안정성이 좋아집니다.

---

## 실무 적용 팁

Spring 환경이라면 아래처럼 연결하면 이해하기 쉽습니다.

1. init: @PostConstruct에서 1회 실행
2. withPage: 서비스 메서드에서 크롤링 로직 실행
3. shutdown: @PreDestroy에서 자원 정리

이 패턴을 적용하면
동적 데이터 수집 성공률을 유지하면서도,
불필요한 브라우저 생성 비용을 줄여 전체 처리 시간을 안정적으로 단축할 수 있습니다.

---

## 마무리

정리하면,

1. Jsoup은 빠르지만 정적 HTML 중심입니다.
2. 동적 tr/AJAX 데이터는 Playwright 같은 브라우저 자동화 도구가 필요합니다.
3. Playwright를 매번 create하지 말고 재사용 구조를 만들면 성능과 운영성이 함께 좋아집니다.

다음 단계에서는 이 구조를 바탕으로
로그인 세션 유지, 무한 스크롤 처리, 실패 재시도 정책까지 확장해 보면 실무에 더 가까운 크롤러를 만들 수 있습니다.
