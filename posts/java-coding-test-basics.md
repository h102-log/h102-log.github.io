---
title: Java 코딩 테스트 기초 - 자주 쓰이는 알고리즘과 패턴
date: "2026-03-12"
description: Java 코딩 테스트에서 자주 출제되는 알고리즘과 실전 코드 패턴을 정리한 가이드입니다.
tag:
  - Java
  - 알고리즘
  - 코딩테스트
draft: false
---

## 개요

Java로 코딩 테스트를 준비하는 개발자들을 위한 실전 가이드입니다. 자주 출제되는 패턴과 효율적인 풀이 방법을 소스 코드 예시와 함께 설명합니다.

---

## 1. 입출력 처리 기본

코테의 첫 번째 관문인 입출력 처리를 효율적으로 하는 것이 중요합니다.

### BufferedReader 활용

```java
import java.io.*;

public class InputExample {
    public static void main(String[] args) throws IOException {
        // BufferedReader는 Scanner보다 빠름 (시간 제한이 있을 때 중요)
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // 한 줄 읽기
        String line = br.readLine();
        
        // 공백으로 구분된 정수 배열
        int[] arr = new int[3];
        String[] input = br.readLine().split(" ");
        for (int i = 0; i < 3; i++) {
            arr[i] = Integer.parseInt(input[i]);
        }
        
        // StringBuilder로 출력 최적화 (많은 출력이 필요할 때)
        StringBuilder sb = new StringBuilder();
        for (int num : arr) {
            sb.append(num).append("\n");
        }
        System.out.print(sb.toString());
    }
}
```

**팁**: 한국 대부분의 온라인 저지(백준, 프로그래머스)에서 Scanner보다 BufferedReader가 빠릅니다. 시간 제한이 중요한 문제에서는 필수입니다.

---

## 2. 배열과 리스트 다루기

### ArrayList 기본 사용법

```java
import java.util.*;

public class ListExample {
    public static void main(String[] args) {
        // 1. ArrayList 기본
        List<Integer> numbers = new ArrayList<>();
        numbers.add(10);
        numbers.add(20);
        numbers.add(30);
        
        // 2. 특정 인덱스에 삽입 (시간복잡도: O(n))
        numbers.add(1, 15); // [10, 15, 20, 30]
        
        // 3. 반복처리
        for (int num : numbers) {
            System.out.println(num);
        }
        
        // 4. 정렬
        Collections.sort(numbers); // 오름차순
        Collections.sort(numbers, Collections.reverseOrder()); // 내림차순
        
        // 5. 조건에 맞는 요소 제거
        numbers.removeIf(n -> n < 15); // 15보다 작은 요소 제거
    }
}
```

### 배열 복사 및 조작

```java
public class ArrayExample {
    public static void main(String[] args) {
        int[] original = {1, 2, 3, 4, 5};
        
        // 1. 배열 복사
        int[] copy1 = original.clone();
        int[] copy2 = Arrays.copyOf(original, original.length);
        
        // 2. 일부분만 복사
        int[] partial = Arrays.copyOfRange(original, 1, 3); // [2, 3]
        
        // 3. 배열 정렬
        Arrays.sort(original);
        
        // 4. 배열 출력
        System.out.println(Arrays.toString(original)); // [1, 2, 3, 4, 5]
    }
}
```

---

## 3. 문자열 처리

### 문자열 비교와 조작

```java
public class StringExample {
    public static void main(String[] args) {
        String str = "Hello World";
        
        // 1. 문자열 비교 (반드시 .equals() 사용!)
        if (str.equals("Hello World")) {
            System.out.println("같습니다");
        }
        
        // 2. 대소문자 변환
        String lower = str.toLowerCase();
        String upper = str.toUpperCase();
        
        // 3. 문자열 분할
        String[] words = str.split(" "); // ["Hello", "World"]
        
        // 4. 문자 접근
        char firstChar = str.charAt(0); // 'H'
        
        // 5. 부분 문자열
        String sub = str.substring(0, 5); // "Hello"
        
        // 6. 문자 위치 찾기
        int index = str.indexOf("World"); // 6
        
        // 7. 문자열 포함 여부
        boolean contains = str.contains("Hello"); // true
    }
}
```

### StringBuilder로 문자열 조합

```java
public class StringBuilderExample {
    public static void main(String[] args) {
        // ❌ 나쁜 방법: 반복문에서 + 연산
        String result = "";
        for (int i = 0; i < 1000; i++) {
            result += i; // 매번 새로운 String 객체 생성 (비효율적)
        }
        
        // ✅ 좋은 방법: StringBuilder 사용
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 1000; i++) {
            sb.append(i);
        }
        String result2 = sb.toString();
    }
}
```

---

## 4. 자주 쓰이는 자료구조

### Stack

```java
import java.util.*;

public class StackExample {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();
        
        // 1. 추가
        stack.push(10);
        stack.push(20);
        stack.push(30);
        
        // 2. 조회 (제거하지 않음)
        int top = stack.peek(); // 30
        
        // 3. 제거
        int popped = stack.pop(); // 30
        
        // 4. 비어있는지 확인
        if (!stack.isEmpty()) {
            System.out.println("스택에 요소가 있습니다");
        }
        
        // 5. 크기
        int size = stack.size(); // 2
    }
}
```

**사용 예**: 괄호 매칭, 후위 표기식 계산, DFS

### Queue

```java
import java.util.*;

public class QueueExample {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();
        
        // 1. 추가
        queue.add(10);    // 또는 queue.offer(10)
        queue.add(20);
        queue.add(30);
        
        // 2. 조회 (제거하지 않음)
        int front = queue.peek(); // 10
        
        // 3. 제거
        int removed = queue.poll(); // 10 (또는 queue.remove())
        
        // 4. 비어있는지 확인
        if (!queue.isEmpty()) {
            System.out.println("큐에 요소가 있습니다");
        }
    }
}
```

**사용 예**: BFS, 대기열 시뮬레이션

### Map (HashMap, TreeMap)

```java
import java.util.*;

public class MapExample {
    public static void main(String[] args) {
        // 1. HashMap (순서 없음, 가장 빠름)
        Map<String, Integer> map = new HashMap<>();
        map.put("apple", 5);
        map.put("banana", 3);
        map.put("orange", 7);
        
        // 2. 값 조회
        int count = map.get("apple"); // 5
        int defaultVal = map.getOrDefault("grape", 0); // 0
        
        // 3. 키 존재 여부
        if (map.containsKey("apple")) {
            System.out.println("apple이 있습니다");
        }
        
        // 4. 모든 엔트리 순회
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
        
        // 5. TreeMap (정렬된 상태 유지)
        Map<String, Integer> treeMap = new TreeMap<>();
        treeMap.put("cherry", 10);
        treeMap.put("apple", 5);
        treeMap.put("banana", 3);
        // 자동으로 정렬됨: apple, banana, cherry
    }
}
```

**팁**: 빈도 수를 세는 문제에서 HashMap이 자주 쓰입니다.

---

## 5. 정렬과 비교

### 객체 정렬하기

```java
import java.util.*;

class Person {
    String name;
    int age;
    
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class SortExample {
    public static void main(String[] args) {
        List<Person> people = new ArrayList<>();
        people.add(new Person("Alice", 30));
        people.add(new Person("Bob", 25));
        people.add(new Person("Charlie", 35));
        
        // 1. Comparable 인터페이스 구현 (클래스 내부)
        // (자세한 구현은 아래 참고)
        
        // 2. Comparator 사용 (더 유연함)
        // 나이순 정렬
        Collections.sort(people, (p1, p2) -> {
            return Integer.compare(p1.age, p2.age);
        });
        
        // 3. 복합 정렬 (나이 오름차순, 같으면 이름으로)
        Collections.sort(people, (p1, p2) -> {
            if (p1.age != p2.age) {
                return Integer.compare(p1.age, p2.age);
            }
            return p1.name.compareTo(p2.name);
        });
    }
}
```

---

## 6. 배열 최솟값/최댓값

```java
import java.util.*;

public class MinMaxExample {
    public static void main(String[] args) {
        int[] arr = {3, 1, 4, 1, 5, 9, 2, 6};
        
        // 1. 배열에서 최솟값/최댓값
        int min = Arrays.stream(arr).min().orElse(0);
        int max = Arrays.stream(arr).max().orElse(0);
        
        // 2. 수동 계산 (더 빠를 수 있음)
        int min2 = Integer.MAX_VALUE;
        int max2 = Integer.MIN_VALUE;
        for (int num : arr) {
            min2 = Math.min(min2, num);
            max2 = Math.max(max2, num);
        }
        
        System.out.println("최소: " + min + ", 최대: " + max);
    }
}
```

---

## 7. 2중 배열 다루기

```java
public class Matrix2DExample {
    public static void main(String[] args) {
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        
        int rows = matrix.length;      // 3
        int cols = matrix[0].length;   // 3
        
        // 1. 행(row) 우선 순회
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
        
        // 2. 경계 체크 (범위를 벗어나지 않는지 확인)
        int x = 1, y = 1;
        if (x >= 0 && x < rows && y >= 0 && y < cols) {
            int value = matrix[x][y];
        }
        
        // 3. 방향 배열 (상하좌우)
        int[] dx = {-1, 1, 0, 0};
        int[] dy = {0, 0, -1, 1};
        
        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];
            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                System.out.println(matrix[nx][ny]);
            }
        }
    }
}
```

---

## 8. 자주 하는 실수와 주의사항

### 1. 정수 오버플로우

```java
public class OverflowExample {
    public static void main(String[] args) {
        int a = Integer.MAX_VALUE; // 2147483647
        int b = a + 1; // -2147483648 (오버플로우!)
        
        // ✅ 해결: long 사용
        long c = (long) a + 1; // 2147483648
        
        // 💡 팁: 합계를 구할 때는 미리 long으로 선언
        long sum = 0;
        for (int num : new int[]{1000000, 1000000, 1000000}) {
            sum += num;
        }
    }
}
```

### 2. null 체크

```java
public class NullCheckExample {
    public static void main(String[] args) {
        String[] arr = new String[5];
        
        // ❌ 위험: NullPointerException 발생 가능
        // String value = arr[0].toUpperCase();
        
        // ✅ 안전: null 체크
        if (arr[0] != null) {
            String value = arr[0].toUpperCase();
        }
        
        // ✅ 또는 메서드로 처리
        String value = arr[0] != null ? arr[0].toUpperCase() : "DEFAULT";
    }
}
```

### 3. 배열 복사 실수

```java
public class CopyMistakeExample {
    public static void main(String[] args) {
        int[] original = {1, 2, 3};
        
        // ❌ 실수: 참조만 복사됨
        int[] wrong = original;
        wrong[0] = 999;
        System.out.println(original[0]); // 999 (original도 변함!)
        
        // ✅ 올바른 방법
        int[] correct = original.clone();
        correct[0] = 888;
        System.out.println(original[0]); // 1 (original은 변하지 않음)
    }
}
```

---

## 9. 짧은 코드 예제 - 실전 문제 풀이

### 두 수의 합 찾기

```java
// 정렬된 배열에서 합이 target인 두 수 찾기
public class TwoSum {
    public static void main(String[] args) {
        int[] numbers = {2, 7, 11, 15};
        int target = 9;
        
        // 투 포인터 방식
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                System.out.println(left + " " + right); // 0 1
                break;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
}
```

### 배열의 회전

```java
// 배열을 k칸 오른쪽으로 회전
public class RotateArray {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int k = 2; // 2칸 회전
        
        k = k % arr.length; // k가 배열보다 클 경우 대비
        
        // 역순 회전 방식
        reverse(arr, 0, arr.length - 1);    // [5, 4, 3, 2, 1]
        reverse(arr, 0, k - 1);              // [4, 5, 3, 2, 1]
        reverse(arr, k, arr.length - 1);    // [4, 5, 1, 2, 3]
        
        System.out.println(Arrays.toString(arr)); // [4, 5, 1, 2, 3]
    }
    
    static void reverse(int[] arr, int start, int end) {
        while (start < end) {
            int temp = arr[start];
            arr[start] = arr[end];
            arr[end] = temp;
            start++;
            end--;
        }
    }
}
```

---

## 10. 성능 최적화 팁

| 작업 | 추천 방법 |
|------|---------|
| 입출력 | BufferedReader / StringBuilder |
| 문자열 연결 | StringBuilder (반복문에서) |
| 검색 | HashMap (O(1)) vs 배열 (O(n)) |
| 정렬 | Collections.sort (O(n log n)) |
| 중복 제거 | HashSet |
| 정렬 유지 | TreeSet, TreeMap |

---

## 마치며

Java 코테는 문법보다 **알고리즘 이해와 구현력**이 중요합니다. 위의 패턴들을 손에 익힐 때까지 반복 연습하고, 실제 문제를 풀면서 응용능력을 키워보세요!

**추천 문제 풀이 플랫폼**:
- 백준 온라인 저지 (acmicpc.net)
- 프로그래머스 (programmers.co.kr)
- LeetCode (주로 영어권)
