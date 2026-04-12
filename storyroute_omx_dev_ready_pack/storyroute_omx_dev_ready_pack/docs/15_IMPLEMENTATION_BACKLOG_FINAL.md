# 15. 구현 Backlog Final

## Epic M0 — Build Ready
- [ ] README / docs index 정리
- [ ] AGENTS.md / PLANS.md / config 고정
- [ ] OpenAPI blueprint 고정
- [ ] validation 명령 고정
- [ ] fixture seed 결정

## Epic M1 — Clickable Product
### Web shell
- [ ] Home route
- [ ] Search route
- [ ] Place detail route
- [ ] Planner route
- [ ] Trips route
- [ ] Region landing route
- [ ] Admin route

### API mock
- [ ] `/healthz`
- [ ] `/v1/search`
- [ ] `/v1/places/{id}`
- [ ] `/v1/planner/preview`
- [ ] `/v1/itineraries`
- [ ] `/v1/events`
- [ ] `/v1/admin/kpis`

### QA
- [ ] Playwright smoke
- [ ] route navigation smoke
- [ ] planner generate/save smoke

## Epic M2 — Data Foundation
- [ ] TourAPI adapter
- [ ] relation adapter
- [ ] story adapter
- [ ] canonical place upsert
- [ ] chunk generation
- [ ] admin fixture → real metric mapping

## Epic M3 — Search / Planner v1
- [ ] BM25 + vector hybrid
- [ ] relation expansion
- [ ] planner scoring
- [ ] itinerary persistence
- [ ] event logging

## Epic M4 — Demo Ready
- [ ] region landing polish
- [ ] explainability polish
- [ ] admin KPI polish
- [ ] deployment dry run

## 각 작업의 Done when
- UI / API / contract / docs 동기화
- 테스트 통과
- 실패 로그 0
