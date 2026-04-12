# StoryRoute AI 스키마 통합 가이드

## 권장 방향

현재 정규화가 과한 편이라서, **운영 서비스 기준으로는 1차 통합**이 더 적합합니다.
다만 아래 3가지는 끝까지 분리 유지하는 것이 좋습니다.

1. `core.place` : 장소 마스터
2. `core.place_source_map` : 원천 API/파일과 place 매핑
3. `raw.*` : 원본 payload 보존

이 3가지를 섞으면 API 변경 대응과 재적재가 어려워집니다.

## 기존 → 통합 테이블 매핑

### 1) 코드/참조
- `ref.area_code`
- `ref.sigungu_code`
- `ref.legal_dong_code`
  → `ref.region_code`

- `ref.category_code`
- `ref.classification_code`
  → `ref.taxonomy_code`

### 2) 장소 상세
- `core.place_common_detail`
- `core.place_intro_detail`
- `core.place_repeat_detail`
- `feature.place_accessibility`
- `feature.place_pet`
- `feature.place_wellness`
  → `core.place_profile`

### 3) 장소 자산
- `core.place_image`
- `core.place_external_link`
- `feature.place_narrative_asset`
  → `core.place_asset`

### 4) 장소 라벨
- `feature.place_certification`
- `feature.place_tag`
  → `core.place_label`

### 5) 관계/그래프
- `feature.place_relation`
- `feature.region_hub_place`
- `feature.article_place_map`
  → `feature.entity_relation`

### 6) 콘텐츠 허브
- `feature.editorial_article`
- `feature.region_content`
- `feature.region_portal`
- `feature.guidebook`
  → `content.resource`

### 7) 검색 인덱스
- `feature.search_document`
- `feature.search_document_chunk`
- `feature.search_document_embedding`
  → `search.search_chunk`

### 8) 지역 시계열
- `analytics.region_daily_visitor`
- `analytics.region_index_metric`
  → `analytics.region_metric`

### 9) 사용자 이벤트
- `app.search_session`
- `app.search_event`
- `app.search_result_action`
- `app.recommendation_log`
  → `app.user_event`

### 10) 일정/에이전트
- `app.itinerary_day`
- `app.itinerary_stop`
  → `app.itinerary_stop` (`day_no` 포함)

- `app.agent_step`
  → `app.agent_run.trace_json`

## 합치지 않는 것이 좋은 것

### `core.place` + `feature.entity_relation`
관계 데이터는 한 장소에 대해 여러 개가 생기고 시점별/유형별로 누적됩니다.
장소 테이블에 넣으면 row duplication과 업데이트 비용이 커집니다.

### `core.place` + `search.search_chunk`
임베딩은 크고 변경 주기가 다릅니다.
같은 row에 넣으면 place 조회까지 무거워집니다.

### `core.place` + `analytics.region_metric`
방문자/수요강도/다양성은 지역 시계열이며 place grain이 아닙니다.

## 최종 권장 테이블 수

초기안: 50개 안팎

권장 단순화안: **22개 전후**

이 정도면
- 적재 복잡도는 줄고
- API 변경 대응은 가능하고
- semantic search / graph 추천 / AI planner는 그대로 유지됩니다.
