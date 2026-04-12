# 17. OmX / Codex Runbook Final

## 1. 이 저장소에서 OMX를 쓰는 방식

이 저장소는 **문서 → 계약 → mock → 구현 → 검증** 순서를 강제하는 방식으로 운용한다.

## 2. 기본 워크플로

### Step 1 — 요구사항 정리
```text
$deep-interview "Read README.md, docs/00_INDEX.md, docs/01_PRD_FINAL.md, docs/04_UI_FINAL_SPEC.md, docs/09_DATA_SOURCES_AND_INGESTION_FINAL.md, AGENTS.md. Ask only blocking questions. Summarize assumptions and produce the next milestone scope."
```

### Step 2 — 계획 수립
```text
$ralplan "Implement milestone M1 search flow. Use PLANS.md format. Keep work mock-first and contract-first. Done when pnpm lint, pnpm test, pytest, pnpm playwright test pass."
```

### Step 3 — 단일 오너 실행
```text
$ralph "Own milestone M1 to completion. Stay within repo sandbox. Do not change schema or contract without updating docs. Run validation commands before finishing."
```

### Step 4 — 병렬 실행
```text
$team 3:executor "Parallelize work across web shell, api mocks, and e2e smoke tests. Respect AGENTS.md and keep the OpenAPI contract intact."
```

## 3. 추천 작업 단위

### Unit A
- Home + Search shell

### Unit B
- Place detail shell + mock route

### Unit C
- Planner shell + itinerary preview route

### Unit D
- Trips + Region + Admin shell

### Unit E
- TourAPI adapter + ingestion

## 4. OMX 작업 규칙
- 작업은 1~2일 단위로 자른다.
- 각 작업에 명확한 `Done when`을 둔다.
- mock-first로 시작한다.
- 문서/계약이 코드보다 먼저 변경되어야 한다.
- schema 또는 contract가 바뀌면 docs를 같이 수정한다.

## 5. 시작용 공통 프롬프트

```text
Read README.md, docs/00_INDEX.md, docs/01_PRD_FINAL.md, docs/04_UI_FINAL_SPEC.md, docs/07_TECH_STACK_FINAL.md, docs/12_API_CONTRACT_BLUEPRINT.md, docs/16_VALIDATION_AND_DOD_FINAL.md, AGENTS.md, PLANS.md, packages/contracts/openapi.yaml.
Goal: build the next missing milestone.
Constraints: mock-first, contract-first, no external API dependency in tests, no schema change without docs update.
Done when: pnpm lint, pnpm typecheck, pnpm test, pytest, pnpm playwright test pass.
```

## 6. 승인 없이 가능한 범위
- repo 파일 수정
- mock server 실행
- test/lint/typecheck
- docs update
- local fixture seed 수정

## 7. 승인 또는 실서버 정보가 필요한 범위
- 실제 OpenAI API key 사용
- 실제 TourAPI key 사용
- Kakao key 사용
- 클라우드 배포
- 외부 managed DB 접근
