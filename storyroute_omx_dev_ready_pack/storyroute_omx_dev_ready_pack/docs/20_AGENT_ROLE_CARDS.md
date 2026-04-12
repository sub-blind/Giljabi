# 20. Agent Role Cards

## Frontend Agent
### 책임
- route shell
- UI state
- component composition
- Playwright smoke

### 절대 금지
- external provider 직접 호출
- backend contract 임의 변경

## Backend Agent
### 책임
- FastAPI route
- schema
- service
- planner orchestration
- adapter boundary

### 절대 금지
- frontend-specific view logic를 DB row에 박아넣기
- raw payload 버리기

## Data Agent
### 책임
- ingestion
- normalize
- upsert
- chunk generation
- sync/repair batch

### 절대 금지
- `place`를 비대하게 만들기
- real source와 mock source를 다른 shape로 유지

## QA Agent
### 책임
- smoke/e2e
- API schema regression
- state matrix coverage

### 절대 금지
- 눈으로만 확인하고 테스트 미작성
