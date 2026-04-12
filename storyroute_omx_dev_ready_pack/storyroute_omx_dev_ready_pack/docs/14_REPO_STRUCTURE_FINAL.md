# 14. 저장소 구조 정의서 Final

## 1. 목적

이 문서는 StoryRoute AI 저장소에서 **각 폴더가 무엇을 책임지는지**를 고정한다.
OmX/Codex는 이 문서를 기준으로 파일을 생성하거나 수정해야 한다.

## 2. 최종 권장 트리

```text
apps/
  web/
    app/
    components/
    features/
    lib/
    public/
    tests/
  api/
    app/
      main.py
      routes/
      schemas/
      services/
      planners/
      adapters/
      repositories/
      fixtures/
      ingestion/
    tests/
packages/
  contracts/
    openapi.yaml
    generated/
  ui/
    src/
infra/
  db/
    storyroute_schema_simplified.sql
    migrations/
tests/
  e2e/
docs/
reference/
omx/
  prompts/
  scripts/
  templates/
AGENTS.md
PLANS.md
```

## 3. 폴더별 책임

### `apps/web`
- Next.js App Router 웹 앱
- route/page/layout
- 화면 shell
- view model
- frontend fixtures
- route-level test
- Playwright가 접근하는 UI entry

### `apps/api`
- FastAPI 엔트리포인트
- route/controller
- request/response schema
- service layer
- planner orchestration
- provider adapter
- ingestion entrypoint
- backend tests

### `packages/contracts`
- OpenAPI 원천
- FE/BE 공통 계약
- generator output 위치
- mock shape와 real shape의 기준점

### `packages/ui`
- 공통 디자인 토큰
- Button/Card/Tag/Layout/Section 같은 재사용 컴포넌트
- screen-specific 로직은 넣지 않음

### `infra/db`
- SQL DDL
- migration
- seed 메모
- local compose나 DB bootstrap 참고 파일

### `tests/e2e`
- Playwright smoke
- critical journey
- home → search → place → planner 흐름
- trips / region / admin 기본 진입 검증

### `docs`
- source of truth 문서
- 제품/기능/UI/API/데이터/운영 기준
- 문서명이 숫자 prefix를 가지며 읽기 순서를 반영함

### `reference`
- 이전 기획안
- UI 프로토타입 HTML
- 과거 스키마 가이드
- 구현 참고자료

### `omx`
- OmX 실행 전용 자산
- 단계별 프롬프트
- 샌드박스/입력 문서 셋업 스크립트
- `/input/docs`용 `00-index.md` 템플릿

## 4. 파일 생성 원칙

1. route는 `apps/web/app/...` 아래에 만든다.
2. API route는 `apps/api/app/routes/...` 아래에 만든다.
3. fixture는 web/api 각각 필요하지만, 응답 shape 원천은 `packages/contracts/openapi.yaml` 이다.
4. provider-specific field는 adapter layer에서 canonical shape로 바꾼다.
5. shared component는 `packages/ui`로 승격하되, 조기 추상화는 피한다.

## 5. OmX/Codex가 자주 틀리는 배치

- OpenAPI는 `packages/contracts/openapi.yaml`인데, 앱 코드 안에 임의 schema를 새로 만드는 경우
- `apps/web`가 외부 관광 API를 직접 호출하는 경우
- mock fixture를 `reference/`에 넣고 실제 앱에서 import하는 경우
- Playwright를 `apps/web` 내부에 중복 생성하는 경우

## 6. 구현 우선 파일 생성 순서

1. root package/workspace 설정
2. `apps/web` route shell
3. `apps/api` mock routes
4. `tests/e2e` smoke
5. DB/service/adapter
6. real ingestion
