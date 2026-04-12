# 18. Agent Context — 모든 AI Agent가 알아야 하는 것

## 1. 제품 도메인 요약
- 제품명: StoryRoute AI
- 목적: 자연어 여행 질의를 itinerary로 바꾸는 서비스
- 대상: 국내 여행자 / 동행 제약 사용자 / 지역 특화 탐색자

## 2. 도메인 핵심 개념
- `place`: 장소 마스터
- `place_profile`: 상세/확장 속성
- `place_asset`: 이미지/스토리/오디오/링크
- `entity_relation`: place 간 관계
- `search_chunk`: semantic search 문서 단위
- `region_metric`: 지역 시계열 지표
- `user_event`: 사용자 행동 로그
- `itinerary`: 저장 일정

## 3. 절대 깨면 안 되는 원칙
1. web은 external provider를 직접 호출하지 않는다.
2. contract-first를 유지한다.
3. mock response shape와 real response shape는 동일해야 한다.
4. `place`는 얇게 유지한다.
5. raw payload와 source mapping은 보존한다.
6. planner는 explanation 없이 결과만 반환하면 안 된다.
7. 테스트는 외부 API 키 없이 돌아야 한다.

## 4. 추천 구현 철학
- 먼저 shell을 만든다.
- 그 다음 fixture/mock을 붙인다.
- 그 다음 contract에 맞춘다.
- 마지막에 real adapter를 연결한다.

## 5. UI tone
- 너무 기술적인 용어를 앞세우지 않는다.
- 추천 이유는 사람 친화적인 문장으로 표현한다.
- 지역/동행/분위기 중심으로 말한다.

## 6. Agent가 자주 실수하는 것
- canonical model과 UI view model을 혼동
- OpenAPI 안 바꾸고 response shape 변경
- external API 직접 호출을 web layer에 넣음
- Playwright 없는 UI 작업 완료 처리
- docs 미반영
