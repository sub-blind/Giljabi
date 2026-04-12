# 03. 기능 정의서 Final

## 1. 기능 맵

| 기능군 | 기능 | 우선순위 | Route | API | 데이터 의존성 |
|---|---|---|---|---|---|
| Search Entry | 자연어 검색 입력 | P0 | `/` | `GET /v1/search` | none/mock |
| Search Entry | quick chips / 샘플 질의 | P0 | `/` | none | static |
| Search | 리스트/지도/필터 | P0 | `/search` | `GET /v1/search` | place/search_chunk |
| Search | 일정에 추가 | P0 | `/search` | `POST /v1/planner/draft` | place |
| Place | 장소 상세/이미지/운영정보 | P0 | `/place/[id]` | `GET /v1/places/{id}` | place/place_profile/place_asset |
| Place | AI 요약/스토리/주변 추천 | P0 | `/place/[id]` | `GET /v1/places/{id}` | relation/resource |
| Planner | 제약 입력 | P0 | `/planner` | `POST /v1/planner/preview` | none/mock |
| Planner | itinerary 생성 | P0 | `/planner` | `POST /v1/planner/preview` | place/relation |
| Planner | itinerary 저장 | P0 | `/planner` | `POST /v1/itineraries` | itinerary |
| Trips | 저장한 일정 목록 | P1 | `/trips` | `GET /v1/itineraries` | itinerary |
| Trips | 최근 검색 기반 재생성 | P1 | `/trips` | `GET /v1/events/recent` | user_event |
| Region | 지역 특화 랜딩 | P1 | `/region/[slug]` | `GET /v1/regions/{slug}` | region_metric/place |
| Admin | KPI / top intents | P2 | `/admin` | `GET /v1/admin/kpis` | user_event |
| Admin | ingestion status | P2 | `/admin` | `GET /v1/admin/ingestion` | meta/raw |

## 2. 기능 우선순위 기준

### P0 — 데모 핵심
- 홈
- 검색
- 상세
- 플래너
- 저장

### P1 — 공모전 차별화
- 지역 특화
- trips 재활용
- explainability 강화

### P2 — 운영 완성도
- 관리자 대시보드
- ingestion status
- intent cluster

## 3. 기능별 완료 조건

### 홈
- 질의 입력 가능
- 칩 클릭 → 입력 반영
- `/search` 이동

### 검색
- 결과 카드 6개 이상 mock 렌더링
- 필터 동작
- 지도 패널 동기화

### 상세
- 기본 정보 / 이미지 / 요약 / 연관 장소
- 일정 추가 CTA

### 플래너
- 제약 입력 → itinerary 생성
- day list 렌더링
- save CTA

### Trips
- 저장된 일정 카드 3개 이상 렌더링

### Region
- hero + 대표 intent + 추천 코스 + CTA

### Admin
- KPI card 3개 이상
- intent list 1개
- ingestion 상태 1개

## 4. 이벤트 로깅 연결

| 기능 | 주요 이벤트 |
|---|---|
| 홈 검색 | `search_submitted` |
| 검색 결과 카드 | `search_result_clicked` |
| 일정 추가 | `place_added_to_planner` |
| itinerary 생성 | `planner_generated` |
| itinerary 수정 | `planner_stop_moved`, `planner_stop_removed` |
| itinerary 저장 | `itinerary_saved` |
| 공유 | `itinerary_shared` |
| region landing | `region_landing_opened` |
| admin 조회 | `admin_dashboard_viewed` |
