# 23. 제품 용어집 Final

## 제품 개념

### StoryRoute AI
자연어 여행 의도를 itinerary로 바꾸는 공공데이터 기반 여행 탐색 서비스

### itinerary
하루 이상 일정 단위의 저장 가능한 여행 계획

### stop
itinerary 안의 개별 방문 지점

### explanation
추천 결과가 왜 나왔는지 설명하는 human-readable 근거

## 데이터 개념

### canonical `place`
외부 원천을 통합한 장소 마스터

### `place_profile`
상세/확장 속성 묶음

### `place_asset`
이미지/스토리/오디오/링크 자산

### `entity_relation`
장소/콘텐츠/지역 간 관계

### `search_chunk`
semantic search에 쓰이는 문서 단위

### `region_metric`
지역 시계열 지표

### `user_event`
검색/저장/공유/플래너 동작 로그

### raw payload
외부 API/파일의 원본 응답

### source mapping
raw source id와 canonical entity 간 매핑

## 검색/AI 개념

### semantic search
키워드 일치만이 아니라 의미 유사성 기반 검색

### hybrid search
BM25 + vector + filter 조합

### planner
제약조건을 받아 itinerary를 생성하는 로직

### agent orchestration
intent extraction → retrieval → generation → validation → explanation 순서의 에이전트 흐름

## UI 개념

### shell
실데이터 연결 전, 구조와 상호작용을 갖춘 화면 골격

### fixture
mock 응답을 대체하는 테스트/로컬용 정적 데이터

### smoke test
핵심 경로가 깨지지 않았는지 빠르게 확인하는 E2E 테스트
