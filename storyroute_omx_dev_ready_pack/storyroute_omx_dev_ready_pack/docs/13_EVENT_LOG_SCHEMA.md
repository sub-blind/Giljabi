# 13. 이벤트 로그 스키마 Final

## 1. 목적
추천 품질 개선과 admin KPI를 위해 사용자 행동을 구조화한다.

## 2. 이벤트 목록

| event_name | 설명 | 최소 필드 |
|---|---|---|
| `search_submitted` | 검색 제출 | query, filters |
| `search_result_clicked` | 결과 카드 클릭 | placeId, rank |
| `place_detail_viewed` | 상세 조회 | placeId |
| `place_added_to_planner` | 일정 추가 | placeId, source |
| `planner_generated` | itinerary 생성 완료 | draftId, stopCount |
| `planner_regenerated` | 재생성 | draftId |
| `planner_stop_moved` | 순서 변경 | draftId, from, to |
| `planner_stop_removed` | stop 제거 | draftId, placeId |
| `itinerary_saved` | 저장 | itineraryId |
| `itinerary_shared` | 공유 | itineraryId, channel |
| `region_landing_opened` | 지역 랜딩 진입 | regionSlug |
| `admin_dashboard_viewed` | admin 조회 | viewName |

## 3. 공통 필드
- `event_id`
- `event_name`
- `session_id`
- `user_key` (익명 가능)
- `occurred_at`
- `place_id` optional
- `itinerary_id` optional
- `payload_json`

## 4. 분석 관점 파생 지표
- search → detail CTR
- detail → planner add rate
- planner generation rate
- planner save rate
- share rate
- region landing conversion
