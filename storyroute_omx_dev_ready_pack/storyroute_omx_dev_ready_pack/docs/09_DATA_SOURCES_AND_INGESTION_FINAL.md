# 09. 데이터 소스 / 적재 전략 Final

## 1. 원칙

이 서비스는 **TourAPI 단독 적재가 아니라 통합 적재**가 맞다.

이유:
- 장소 마스터는 TourAPI가 가장 좋다.
- 관계 그래프는 연관/중심 관광지 데이터가 필요하다.
- 설명력은 스토리텔링/오디오/LOD가 필요하다.
- 희소 속성은 무장애/반려동물/웰니스가 필요하다.
- 운영 지표는 지역 metric이 따로 필요하다.

## 2. 반드시 사용할 원천

### A. TourAPI / 국문 관광정보 서비스_GW
용도:
- 장소 마스터
- 목록/상세/이미지/동기화 목록
- 공통정보/소개정보/반복정보
- 반려동물 동반여행 일부

적재 대상:
- `place`
- `place_profile`
- `place_asset`
- `place_source_map`

### B. 관광지별 연관 관광지 정보
용도:
- graph edge
- itinerary 후보 확장
- nearby/next stop 추천

적재 대상:
- `entity_relation`

### C. 기초지자체 중심 관광지 정보
용도:
- 지역 허브 노드
- region landing 주요 장소 선정

적재 대상:
- `entity_relation`
- region hero seed

### D. 관광 스토리텔링 DB
용도:
- 스토리 카드
- 설명형 추천
- multilingual content 자산 확장 준비

적재 대상:
- `place_asset`
- `search_chunk`
- `content resource`

### E. 국문관광정보 LOD
용도:
- URI / linked data
- entity linking
- graph enrichment

적재 대상:
- `entity_relation`
- `place_source_map`
- optional `knowledge triple` raw asset

### F. 무장애 여행 정보
용도:
- accessibility filters
- 동행 제약 반영

적재 대상:
- `place_profile.accessibility_json`

### G. 반려동물 동반여행 정보
용도:
- pet travel filters
- detail panel

적재 대상:
- `place_profile.pet_json`

### H. 웰니스 관광정보
용도:
- wellness category
- theme landing
- search facet

적재 대상:
- `place_profile.wellness_json`

### I. 지역 metric / 수요 / 다양성
용도:
- region landing
- admin KPI
- 지역 인기/수요 맥락

적재 대상:
- `region_metric`

## 3. 선택적 보강 원천

- 지역콘텐츠정보목록
- 지역 문화관광 포털 목록
- 여행 가이드북
- 관광 사진 정보
- 인증/열린관광지/100선 배지 목록

## 4. 적재 계층

### Raw
- API payload 원문
- file snapshot
- 재현성 확보

### Canonical
- `place`
- `place_profile`
- `place_asset`
- `entity_relation`

### Search
- `search_chunk`
- embedding
- facet document

### App facts
- `user_event`
- `itinerary`
- `itinerary_stop`
- `agent_run`

## 5. 초기 적재 우선순위

### Phase 1
- TourAPI
- place master
- image/basic detail

### Phase 2
- place profile 통합
- story
- relation

### Phase 3
- region metrics
- admin facts
- real hybrid search index

## 6. 적재 방식

### Bootstrap
- full load
- raw snapshot 저장
- canonical normalize
- chunk generation
- indexing

### Incremental
- sync list 기반 delta
- updated_at 기준 upsert
- chunk selective rebuild

### Repair
- missing asset 재수집
- broken source map 복구
- failed batch replay

## 7. 설계 원칙

1. `place`는 얇게 유지
2. 확장 속성은 `place_profile`로 통합
3. 자산은 `place_asset`로 통합
4. 관계는 `entity_relation`로 분리
5. search index는 canonical row와 분리
6. raw는 절대 삭제하지 않음

## 8. 주의사항

- relation/center data는 차량 이동 기반 추정값이므로 “실제 방문수”와 동일하게 쓰지 않는다.
- region metric은 place grain이 아니라 region/time grain이다.
- API 필드 변경 공지가 잦으므로 source map과 raw snapshot은 필수다.
