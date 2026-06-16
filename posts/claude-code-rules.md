---
title: "[Claude Code] .claude/rules로 프로젝트 규칙 모듈화하기"
date: "2026-06-16 10:30"
description: "비대해진 CLAUDE.md를 .claude/rules 디렉터리로 분리해 토픽별로 관리하는 방법을 정리합니다. paths frontmatter로 특정 파일에만 규칙을 적용하는 경로 스코핑, 유저 레벨 규칙, symlink 공유까지 다룹니다."
tag: "Claude Code"
category: "Tools"
---

## CLAUDE.md가 너무 커졌다면

`CLAUDE.md` 는 Claude Code에게 프로젝트 규칙을 전달하는 가장 기본적인 방법입니다.
하지만 규칙이 늘어날수록 파일이 비대해지고, 문제가 생깁니다.

`CLAUDE.md` 는 **매 세션 시작 시 전체가 컨텍스트로 로드**되므로 토큰을 그만큼 소비합니다.
공식 권장 크기는 **200줄 이하**이며, 이를 넘어가면 컨텍스트를 많이 먹을 뿐 아니라 **규칙 준수율도 떨어집니다.**

이럴 때 쓰는 것이 `.claude/rules/` 디렉터리입니다.
규칙을 **토픽별 파일로 쪼개** 관리하고, 더 나아가 **특정 파일에서만 로드**되도록 만들 수 있습니다.

---

## `.claude/rules/`란

`.claude/rules/` 는 마크다운 규칙 파일들을 모아 두는 디렉터리입니다.

- 디렉터리 안의 모든 `.md` 파일이 **재귀적으로 자동 발견**되어 로드됩니다.
- `paths` 설정이 없는 규칙은 `.claude/CLAUDE.md` 와 **동일한 우선순위**로 세션 시작 시 로드됩니다.
- 파일 하나당 하나의 토픽을 담고, `testing.md` `api-design.md` 처럼 **설명적인 파일명**을 쓰는 것이 좋습니다.

기본 구조는 다음과 같습니다.

```text
your-project/
├── .claude/
│   ├── CLAUDE.md           # 메인 프로젝트 규칙
│   └── rules/
│       ├── code-style.md   # 코드 스타일 규칙
│       ├── testing.md      # 테스트 컨벤션
│       └── security.md     # 보안 요구사항
```

`frontend/` `backend/` 같은 하위 디렉터리로 더 세분화해도 모두 재귀적으로 로드됩니다.

---

## 경로 스코핑 (핵심)

`.claude/rules/` 의 진짜 강점은 **규칙을 특정 파일 경로에만 적용**할 수 있다는 점입니다.
YAML frontmatter의 `paths` 필드에 glob 패턴을 넣으면, **매칭되는 파일을 Claude가 다룰 때만** 그 규칙이 로드됩니다.

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API 개발 규칙

- 모든 API 엔드포인트는 입력 검증을 포함한다
- 표준 에러 응답 포맷을 사용한다
- OpenAPI 문서화 주석을 포함한다
```

위 규칙은 `src/api/` 아래 TypeScript 파일을 건드릴 때만 컨텍스트에 들어옵니다.
덕분에 도메인별 지침이 **필요할 때만 높은 우선순위로** 적용되고, 평소엔 컨텍스트 공간을 아낍니다.

`paths` 가 **없는** 규칙은 조건 없이 모든 파일에 적용됩니다.
glob 패턴은 다음처럼 쓸 수 있습니다.

| 패턴 | 매칭 대상 |
| --- | --- |
| `**/*.ts` | 모든 디렉터리의 TypeScript 파일 |
| `src/**/*` | `src/` 아래 모든 파일 |
| `*.md` | 프로젝트 루트의 마크다운 파일 |
| `src/components/*.tsx` | 특정 디렉터리의 React 컴포넌트 |

여러 패턴을 나열하거나, 중괄호 확장으로 여러 확장자를 한 번에 매칭할 수도 있습니다.

```markdown
---
paths:
  - "src/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

---

## 유저 레벨 규칙

프로젝트가 아니라 **나 개인의 모든 프로젝트**에 적용하고 싶은 규칙은
`~/.claude/rules/` 에 두면 됩니다.

```text
~/.claude/rules/
├── preferences.md    # 개인 코딩 선호
└── workflows.md      # 선호하는 워크플로
```

유저 레벨 규칙은 **프로젝트 규칙보다 먼저 로드**됩니다.
나중에 로드되는 쪽이 더 구체적인 맥락이라는 전제이므로, 결과적으로 **프로젝트 규칙이 더 높은 우선순위**를 가집니다.

---

## symlink로 규칙 공유하기

`.claude/rules/` 는 **symlink를 지원**합니다.
공용 규칙 세트를 한 곳에서 관리하고, 여러 프로젝트에 링크해 재사용할 수 있습니다.

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

symlink는 정상적으로 따라가 로드되며, 순환 symlink도 안전하게 감지·처리됩니다.

---

## 한계와 주의점

규칙을 다룰 때 기억해 둘 점들입니다.

**1) 규칙은 강제(enforcement)가 아니다**

`.claude/rules/` 와 `CLAUDE.md` 는 어디까지나 **컨텍스트**일 뿐, 강제 설정이 아닙니다.
Claude가 읽고 따르려 하지만 100% 보장되지는 않습니다.
어떤 동작을 **반드시 막아야 한다면** 규칙이 아니라 [PreToolUse hook](https://code.claude.com/docs/en/hooks-guide)을 사용하세요.
hook은 Claude의 판단과 무관하게 셸 명령으로 실행됩니다.

**2) 항상 필요하지 않은 지침은 skill로**

규칙은 매 세션(또는 매칭 파일을 열 때) 컨텍스트에 로드됩니다.
**작업할 때만** 필요한 절차성 지침이라면, 호출 시에만 로드되는 **skill**이 더 적합합니다.

**3) 모노레포에서 불필요한 규칙 제외**

다른 팀의 규칙이 끌려 들어온다면, `settings.json` 의 `claudeMdExcludes` 로 특정 경로를 제외할 수 있습니다.

```json
{
  "claudeMdExcludes": [
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

---

## 정리

언제 무엇을 쓸지 한눈에 비교하면 다음과 같습니다.

| 메커니즘 | 로드 시점 | 적합한 내용 |
| --- | --- | --- |
| `CLAUDE.md` | 매 세션 전체 로드 | 빌드 명령, 공통 컨벤션, 프로젝트 구조 |
| `.claude/rules/` (paths 없음) | 매 세션 로드 | 토픽별로 분리한 공통 규칙 |
| `.claude/rules/` (paths 있음) | 매칭 파일 열 때만 | 특정 경로 한정 규칙 |
| skill | 호출/필요 시에만 | 가끔 쓰는 절차성 워크플로 |

핵심은 **"항상 필요한 건 CLAUDE.md, 경로/토픽별은 rules, 가끔 쓰는 절차는 skill"** 로 나누는 것입니다.
비대한 `CLAUDE.md` 를 `.claude/rules/` 로 쪼개면, 컨텍스트도 아끼고 팀이 규칙을 유지보수하기도 훨씬 수월해집니다.
