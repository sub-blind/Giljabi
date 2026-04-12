# 12. API Contract Blueprint

## 1. 원칙
- contract-first
- web은 internal API만 호출
- external provider field는 adapter에서 종료
- mock/real response shape는 동일하게 유지

## 2. 핵심 엔드포인트

### Search
- `GET /v1/search`
- 목적: place card + map marker + reason 반환

### Place
- `GET /v1/places/{placeId}`
- 목적: detail assembly 반환

### Planner
- `POST /v1/planner/preview`
- 목적: constraint → itinerary preview

### Itinerary
- `GET /v1/itineraries`
- `POST /v1/itineraries`

### Events
- `POST /v1/events`

### Region
- `GET /v1/regions/{slug}`

### Admin
- `GET /v1/admin/kpis`
- `GET /v1/admin/ingestion`

## 3. Response shape 정책
- card/list/detail는 view model로 반환
- canonical DB row를 그대로 노출하지 않음
- `reason`과 `summary`는 UI-friendly field를 포함
- null 허용 필드는 명시적으로 유지

## 4. Search response 예시
- query
- total
- items[]
- markers[]

## 5. Planner response 예시
- draftId
- title
- summary
- stops[]

## 6. mock-first 규칙
- fixture JSON을 기준으로 contract 검증
- frontend는 fixture에만 의존해도 UI 구현 가능해야 한다
- adapter 연결 시 contract drift 금지
