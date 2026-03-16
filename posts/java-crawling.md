---
title: 'Java 크롤링'
date: '2026-03-16 00:03'
description: 'Java로 크롤링 하는 방법'
tag: 'java'
---

## 서론

Java로 웹 크롤링(Scraping)을 구현하는 방법은 크게 두 가지가 있습니다. 
첫 번째는 **Jsoup** 라이브러리를 사용하는 방법이고, 두 번째는 **Playwright**를 사용하는 방법입니다.

이 둘을 간단히 비교하자면, **Jsoup**는 가볍고 처리 속도가 빠르지만 초기 로딩된 정적인 데이터만 수집이 가능합니다. 반면 **Playwright**는 브라우저를 직접 제어하기 때문에 Jsoup에 비해 속도는 다소 느리지만, 화면 렌더링 이후에 JavaScript나 AJAX로 생성되는 동적인 데이터까지 모두 수집할 수 있다는 강력한 장점이 있습니다.

아래 예시를 통해 Jsoup의 특징과 한계점을 직접 확인해 보겠습니다.
이번 크롤링 연습을 위해 타겟으로 삼을 사이트 주소는 다음과 같습니다.
> **실습 타겟 URL:**   [크롤링 연습 사이트](https://h102-log.github.io/CrawlingTest.html)

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

그렇다면 이번에는 화면 하단에 있는 테이블의 데이터(TR)를 가져오고 싶다면 어떻게 해야 할까요?
테이블 데이터를 추출하기 위해 다음과 같이 코드를 작성해 볼 수 있습니다.
``` java
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