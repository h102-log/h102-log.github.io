import os

# Define the content for the DataGrid Development Guide MD file

md_content = """# 📊 High-Performance DataGrid 개발 로드맵 (Side Project)

본 프로젝트는 대용량 데이터를 효율적으로 렌더링하고, AG Grid 수준의 확장성을 갖춘 데이터 그리드 라이브러리를 직접 설계하고 구현하는 것을 목표로 합니다.

---

## 🗓️ 전체 일정 계획 (5월 말 완료 목표)

- **4월 말 ~ 5월 1주:** 기초 설계 및 코어 렌더링 엔진 구현 (PHASE 1-2)
- **5월 2주:** 핵심 상호작용 및 최적화 구현 (PHASE 3-4)
- **5월 3주:** AG Grid 스타일 고급 기능 추가 (PHASE 5-6)
- **5월 4주:** 안정화, 문서화 및 npm 배포 (PHASE 7-8)

---

## 🏗️ 개발 단계별 상세 계획 (Phases)

### PHASE 1 — 타입 시스템 및 코어 렌더링

- [ ] **Type Definition:** `Column`, `Row`, `Cell`, `GridOptions` 등 핵심 인터페이스 정의
- [ ] **Basic Rendering:** HTML5 Table 구조 또는 Div 기반 Flex 구조 설계
- [ ] **Layout Engine:** 데이터 양에 따른 자동 너비 계산 및 레이아웃 배치

### PHASE 2 — 상호작용의 기초 (Interaction)

- [ ] **Row Selection:** 단일/다중 선택 (Checkbox, Shift+Click)
- [ ] **Keyboard Navigation:** 화살표 키를 이용한 셀 이동 및 포커스 관리
- [ ] **Event System:** `onCellClick`, `onRowSelectionChange` 등 사용자 정의 이벤트 API 설계

### PHASE 3 — 컬럼 제어 (Column Management)

- [ ] **Sorting:** 단일 및 다중 컬럼 정렬 로직 (Custom Comparator 지원)
- [ ] **Resizing:** 핸들 드래그를 통한 실시간 컬럼 너비 조절
- [ ] **Reordering:** Drag & Drop을 이용한 컬럼 순서 변경

### PHASE 4 — 성능 최적화 (The Core)

- [ ] **Virtual Scrolling:** 수만 개의 행 중 보이는 영역만 렌더링하여 성능 극대화
- [ ] **Cell Memoization:** 불필요한 리렌더링 방지 및 DOM 노드 재사용 로직

### PHASE 5 — AG Grid형 고급 UI 기능

- [ ] **Column Pinning (Frozen):** 좌/우측 컬럼 틀 고정 기능
- [ ] **Custom Cell Renderer:** 사용자가 직접 정의한 컴포넌트(버튼, 이미지 등)를 셀에 주입하는 기능
- [ ] **Column Grouping:** 여러 컬럼을 하나의 그룹 헤더로 묶는 기능

### PHASE 6 — 데이터 조작 및 유틸리티

- [ ] **Column Filtering:** 텍스트, 숫자, 날짜 등 타입별 필터 팝업 구현
- [ ] **Global Search:** 그리드 전체 데이터 대상 실시간 검색 기능
- [ ] **Export to CSV:** 현재 뷰의 데이터를 CSV 파일로 추출 및 다운로드

### PHASE 7 — 완성도 높이기 (Developer Experience)

- [ ] **Submit Support:** 수정된 데이터만 추출하는 변경분(Change-set) 관리 API
- [ ] **Theme System:** CSS Variables를 활용한 Light/Dark 테마 및 커스텀 스타일 지원
- [ ] **Accessibility:** ARIA Role 준수 및 스크린 리더 지원

### PHASE 8 — 품질 보증 및 배포

- [ ] **Unit Testing:** 정렬, 필터링 등 핵심 로직에 대한 테스트 코드 작성
- [ ] **Documentation:** Storybook을 활용한 라이브 예제 및 API 문서화
- [ ] **NPM Publishing:** 라이브러리 번들링(Vite/Rollup) 및 배포

---

## 💡 개발 원칙 (Rules of Development)

### 🚫 지켜야 할 제한 사항

1. **AI 전면 의존 금지:** AI를 통해 전체 코드를 한 번에 생성하지 않습니다.
2. **사람 중심 설계:** 로직의 흐름과 아키텍처는 반드시 본인이 설계합니다.
3. **AI 보조 활용:** AI는 특정 수식 계산, 정규식 작성, 혹은 버그 수정 아이디어 제공 등 '질문 답변'용으로만 제한적으로 사용합니다.

### ✅ 권장 사항

- **Small Commits:** 각 PHASE 혹은 기능 단위로 명확하게 커밋 로그를 남깁니다.
- **Zero Dependency:** 가능한 외부 라이브러리 없이 브라우저 기본 API를 활용하여 기술적 깊이를 쌓습니다.
- **Developer-Friendly:** "내가 이 라이브러리를 사용한다면 어떤 API가 편할까?"를 끊임없이 고민합니다.
  """

# Save to a file

file_path = "/mnt/data/DataGrid_Development_Guide.md"
with open(file_path, "w", encoding="utf-8") as f:
f.write(md_content)

print(file_path)
