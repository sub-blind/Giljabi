# 00. 문서 인덱스 / Source of Truth

## 문서 상태

| 문서 | 목적 | 주 독자 | 우선도 | source of truth |
|---|---|---|---|---|
| `01_PRD_FINAL.md` | 제품 요구사항 정의 | PM / FE / BE / AI | P0 | 제품 기능 |
| `02_PROJECT_BRIEF_FINAL.md` | 공모전/서비스 설명 | PM / 대외설명 | P0 | 제품 가치/스토리 |
| `03_FEATURE_DEFINITION_FINAL.md` | 기능 단위/우선순위 | PM / FE / BE | P0 | scope |
| `04_UI_FINAL_SPEC.md` | 화면 정의 | FE / PM / QA | P0 | UI |
| `05_UI_STATE_MATRIX.md` | 상태/예외/CTA 표준화 | FE / QA | P1 | UX 상태 |
| `06_COMPONENT_CATALOG.md` | 공용 컴포넌트 카탈로그 | FE | P1 | UI 구현 |
| `07_TECH_STACK_FINAL.md` | 기술스택 및 이유 | FE / BE / DE | P0 | 엔지니어링 기준 |
| `08_SYSTEM_ARCHITECTURE_FINAL.md` | 전체 아키텍처 | BE / DE / AI | P0 | 시스템 구조 |
| `09_DATA_SOURCES_AND_INGESTION_FINAL.md` | KTO/공공데이터 활용 전략 | DE / BE | P0 | 데이터 원천 |
| `10_DATA_MODEL_FINAL.md` | canonical 모델/테이블 정의 | DE / BE | P0 | 데이터 모델 |
| `11_ETL_SYNC_RUNBOOK.md` | 적재/동기화/복구 절차 | DE | P1 | 운영 배치 |
| `12_API_CONTRACT_BLUEPRINT.md` | API 설계 기준 | FE / BE | P0 | API 형태 |
| `13_EVENT_LOG_SCHEMA.md` | 이벤트 로깅 정의 | FE / BE / PM | P1 | analytics 이벤트 |
| `14_REPO_STRUCTURE_FINAL.md` | 저장소/폴더 책임 | FE / BE / OmX | P1 | 파일 배치 |
| `15_IMPLEMENTATION_BACKLOG_FINAL.md` | 구현 backlog | PM / OmX / FE / BE | P0 | 실행 순서 |
| `16_VALIDATION_AND_DOD_FINAL.md` | 검증 명령/완료 기준 | FE / BE / QA / OmX | P0 | done criteria |
| `17_OMX_RUNBOOK_FINAL.md` | OmX/Codex 실행 방식 | OmX / PM | P0 | agent 실행 |
| `18_AGENT_CONTEXT.md` | 모든 agent 공통 도메인 문맥 | OmX / Codex | P0 | agent context |
| `19_AGENT_TASK_TEMPLATES.md` | 바로 붙여넣는 prompt/명령 | OmX / Codex | P0 | prompt assets |
| `20_AGENT_ROLE_CARDS.md` | 역할별 책임 구분 | OmX / 팀 | P1 | 병렬 실행 |
| `21_RELEASE_SCOPE_AND_MILESTONES.md` | 단계별 릴리즈 범위 | PM / 팀 | P0 | milestone |
| `22_DEVELOPMENT_ENV_AND_DEPLOY.md` | 로컬/배포/환경변수 기준 | FE / BE / DevOps | P1 | 환경 구성 |
| `23_PRODUCT_GLOSSARY.md` | 용어집 | 전원 | P2 | 공통 용어 |

## 실제 구현 시 우선순위

### 반드시 먼저 읽을 것
1. PRD
2. UI Final Spec
3. Tech Stack
4. API Contract
5. Validation
6. OmX Runbook
7. AGENTS.md

### FE 우선
- 04 / 05 / 06 / 12 / 16

### BE 우선
- 01 / 07 / 08 / 09 / 10 / 11 / 12 / 13 / 16

### OmX/Codex 우선
- README / 15 / 16 / 17 / 18 / 19 / AGENTS / PLANS / `.codex/config.toml`

## 최종 소스 오브 트루스 원칙

1. 제품 범위는 `01_PRD_FINAL.md`
2. UI 화면 정의는 `04_UI_FINAL_SPEC.md`
3. API shape는 `packages/contracts/openapi.yaml`
4. 데이터 모델은 `10_DATA_MODEL_FINAL.md` + `infra/db/storyroute_schema_simplified.sql`
5. 완료 기준은 `16_VALIDATION_AND_DOD_FINAL.md`
6. agent 규칙은 `AGENTS.md`


## OmX 실행 추가 문서
- `24_OMX_PROJECT_PATHS_AND_SYNC.md`
- `25_OMX_INPUT_DOCS_SETUP.md`
- `26_OMX_EXECUTION_SEQUENCE.md`
- `27_OMX_PROMPT_PACK_USAGE.md`
- `28_OMX_EXECUTION_PLAYBOOK.md`
- `omx/prompts/*`
- `omx/scripts/*`
