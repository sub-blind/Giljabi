# 25. OMX 입력 문서 셋업

## 1. 목적

OmX가 긴 문서 묶음을 안정적으로 읽도록 `/input/docs`에 **정리된 미러**를 만든다.

## 2. 권장 입력 문서 구조

```text
/input/docs/
  00-index.md
  product/
  ui/
  architecture/
  data/
  api/
  analytics/
  execution/
  reference/
  prompts/
```

## 3. 카테고리별 매핑

### `product/`
- `00_INDEX.md`
- `01_PRD_FINAL.md`
- `02_PROJECT_BRIEF_FINAL.md`
- `03_FEATURE_DEFINITION_FINAL.md`
- `21_RELEASE_SCOPE_AND_MILESTONES.md`
- `23_PRODUCT_GLOSSARY.md`

### `ui/`
- `04_UI_FINAL_SPEC.md`
- `05_UI_STATE_MATRIX.md`
- `06_COMPONENT_CATALOG.md`
- `STORYROUTE_UI_FINAL_HANDOFF.html`
- `STORYROUTE_UI_FINAL_PROTOTYPE.html`

### `architecture/`
- `07_TECH_STACK_FINAL.md`
- `08_SYSTEM_ARCHITECTURE_FINAL.md`
- `14_REPO_STRUCTURE_FINAL.md`
- `22_DEVELOPMENT_ENV_AND_DEPLOY.md`

### `data/`
- `09_DATA_SOURCES_AND_INGESTION_FINAL.md`
- `10_DATA_MODEL_FINAL.md`
- `11_ETL_SYNC_RUNBOOK.md`
- `storyroute_schema_simplified.sql`
- `storyroute_schema_merge_map.md`

### `api/`
- `12_API_CONTRACT_BLUEPRINT.md`
- `openapi.yaml`

### `analytics/`
- `13_EVENT_LOG_SCHEMA.md`

### `execution/`
- `15_IMPLEMENTATION_BACKLOG_FINAL.md`
- `16_VALIDATION_AND_DOD_FINAL.md`
- `17_OMX_RUNBOOK_FINAL.md`
- `18_AGENT_CONTEXT.md`
- `19_AGENT_TASK_TEMPLATES.md`
- `20_AGENT_ROLE_CARDS.md`

### `reference/`
- 과거 프로토타입 / 스키마 / 기타 보조 레퍼런스

## 4. 읽기 순서 원칙

- 먼저 product / ui / validation / AGENTS를 읽는다
- 그 다음 contract / tech stack / architecture를 읽는다
- data / analytics는 해당 milestone에서 추가로 읽는다
- reference HTML은 화면 구현 직전에만 읽는다

## 5. 잘못된 셋업

- 모든 파일을 `/input/docs` 루트에 평평하게 넣기
- HTML/PDF만 넣고 text index를 만들지 않기
- `.env`, secret, API key 문서를 같이 넣기
