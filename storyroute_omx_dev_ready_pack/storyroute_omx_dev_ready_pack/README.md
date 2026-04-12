# StoryRoute AI — Development Handoff Pack

이 패키지는 **스토리루트 AI 개발 직전 단계**에서 필요한 문서를 한 번에 정리한 최종 핸드오프 번들이다.

핵심 목표는 5가지다.

1. **제품 정의를 하나의 source of truth로 고정**
2. **UI 기준과 API/데이터 기준을 맞춤**
3. **OmX/Codex가 바로 실행 가능한 문맥을 제공**
4. **mock-first로 초반 구현을 빠르게 돌릴 수 있게 설계**
5. **실데이터(TourAPI/KTO) 연동 시 흔들리지 않게 raw/canonical/search/event 경계를 명확화**

## 권장 읽기 순서

1. `docs/00_INDEX.md`
2. `docs/01_PRD_FINAL.md`
3. `docs/02_PROJECT_BRIEF_FINAL.md`
4. `docs/04_UI_FINAL_SPEC.md`
5. `docs/07_TECH_STACK_FINAL.md`
6. `docs/09_DATA_SOURCES_AND_INGESTION_FINAL.md`
7. `docs/12_API_CONTRACT_BLUEPRINT.md`
8. `docs/16_VALIDATION_AND_DOD_FINAL.md`
9. `docs/17_OMX_RUNBOOK_FINAL.md`
10. `AGENTS.md`
11. `PLANS.md`

## 이 패키지에 포함된 것

- 최종 PRD
- 공모전 제출용 기획서 최종본
- 기능 정의서
- UI 최종 명세서
- 최종 UI 프로토타입 HTML
- 기술스택 정의서
- 시스템 아키텍처 정의서
- 데이터 소스/적재/스키마 가이드
- OpenAPI 청사진
- 이벤트 로그 스키마
- 저장소 구조 정의서
- 구현 backlog / milestone 문서
- 검증 명령 / DoD 문서
- OmX/Codex 실행 가이드
- AGENTS.md / PLANS.md / `.codex/config.toml`
- reference 원본 문서와 이전 프로토타입

## 실제 개발 시작 순서

### Day 0
- 문서 읽기
- route / API contract 동결
- UI shell 우선순위 확정

### Day 1~2
- Home / Search / Place / Planner shell 구현
- mock API 연결
- Playwright smoke 구축

### Day 3~5
- canonical `place` 모델 및 fixture 데이터
- place detail mock → real mapping 준비
- itinerary persistence mock

### Day 6+
- TourAPI adapter
- hybrid search
- planner v1
- admin metrics

## 폴더 구조

```text
apps/
  web/                  웹 앱 시작점 설명
  api/                  API 서버 시작점 설명
packages/
  contracts/            OpenAPI 청사진
  ui/                   공용 UI 컴포넌트 기준
infra/
  db/                   최종 스키마
tests/
  e2e/                  테스트 전략 메모
docs/                   최종 문서 세트
reference/              기존 문서 및 프로토타입 레퍼런스
AGENTS.md               agent 공통 규칙
PLANS.md                장기 작업 계획 템플릿
.codex/config.toml      repo-scoped Codex 기본 설정
```

## OMX 추가 운영 문서

- `docs/24_OMX_PROJECT_PATHS_AND_SYNC.md`
- `docs/25_OMX_INPUT_DOCS_SETUP.md`
- `docs/26_OMX_EXECUTION_SEQUENCE.md`
- `docs/27_OMX_PROMPT_PACK_USAGE.md`
- `docs/28_OMX_EXECUTION_PLAYBOOK.md`
- `omx/prompts/*`
- `omx/scripts/*`
