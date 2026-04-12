# 19. Agent Task Templates

## Template 1 — M0 build-ready
```text
$ralph "Own milestone M0. Create repo-level rules, docs alignment, OpenAPI blueprint validation, and test command documentation. Do not add real external integrations. Done when all docs are consistent and validation commands are defined."
```

## Template 2 — Home/Search shell
```text
$ralph "Implement Home and Search UI shell in apps/web using docs/04_UI_FINAL_SPEC.md and packages/contracts/openapi.yaml. Use mock fixtures only. Done when route navigation works and Playwright smoke covers home -> search."
```

## Template 3 — Place detail
```text
$ralph "Implement /place/[id] shell and apps/api mock route GET /v1/places/{placeId}. Keep response shape aligned to OpenAPI. Done when place detail renders hero, info, story, nearby places, and CTA."
```

## Template 4 — Planner
```text
$ralph "Implement /planner shell and POST /v1/planner/preview mock. Support generated and modified states. Done when itinerary preview renders day tabs, stop list, map panel, and save CTA."
```

## Template 5 — Trips / Region / Admin
```text
$team 3:executor "Split work across Trips, Region landing, and Admin KPI shells. Respect AGENTS.md and keep mock-first. Done when each route renders with fixtures and shared components."
```

## Template 6 — TourAPI adapter
```text
$ralph "Implement TourAPI adapter behind apps/api/app/adapters/tourapi. Do not call it in frontend. Preserve mock compatibility. Done when bootstrap ingestion can populate canonical place rows from fixture-like source payloads."
```

## Template 7 — Hybrid search v1
```text
$ralph "Implement retrieval composition for BM25 + vector + filters. Keep planner dependent on internal retrieval service, not direct DB logic. Done when search reasons remain explainable and tests pass."
```
