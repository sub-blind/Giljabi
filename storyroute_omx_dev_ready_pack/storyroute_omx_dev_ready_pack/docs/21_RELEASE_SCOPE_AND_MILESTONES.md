# 21. 릴리즈 범위 / 마일스톤 Final

## M0 — Build Ready

### 목표
문서와 계약을 고정하고, OmX가 반복 구현을 시작할 수 있는 저장소를 만든다.

### 포함
- monorepo skeleton
- root package / workspace / turbo
- Next.js / FastAPI 기본 골격
- AGENTS / PLANS / `.codex/config.toml`
- validation 명령 정의
- fixture/mock 기본 구조
- docs index 정합화

### 제외
- real TourAPI 연동
- real OpenAI / Kakao 연동

### Done when
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pytest`
- 기본 smoke 또는 placeholder test 통과

## M1 — Clickable Product

### 목표
사용자가 클릭 가능한 제품을 경험할 수 있게 한다.

### 포함
- `/`
- `/search`
- `/place/[id]`
- `/planner`
- `/trips`
- `/region/[slug]`
- `/admin`
- mock API
- smoke E2E

### Done when
- route shell 전부 렌더링
- home → search → place → planner 흐름 동작
- mock data로 UI 시연 가능

## M2 — Data Foundation

### 목표
canonical `place`와 supporting entity를 다루는 실제 데이터 기반을 만든다.

### 포함
- TourAPI adapter
- relation/story adapter
- canonical upsert
- chunk generation
- raw/source mapping 보존
- local seed / repair batch 골격

### Done when
- fixture-like raw payload에서 `place` 적재 가능
- place detail mapping 가능
- search chunk 생성 가능

## M3 — Search / Planner v1

### 목표
검색과 플래너가 mock을 넘어서 제품 핵심 로직으로 진입한다.

### 포함
- BM25 + vector hybrid
- filter composition
- relation expansion
- planner scoring
- itinerary persistence
- event logging
- admin metric 연결

### Done when
- 자연어 질의 → 후보 검색 → planner preview
- itinerary 저장/조회
- event log 적재
- admin mock 일부 real metric 대체 가능

## M4 — Demo Ready

### 목표
공모전 제출용 데모 완성도와 설명력을 끌어올린다.

### 포함
- 지역 특화 polish
- explainability polish
- admin KPI polish
- 배포 dry run
- 발표 시나리오 고정

### Done when
- 경북 시나리오 end-to-end 시연 가능
- 설명 문구/CTA/대시보드가 발표 자료와 일치
