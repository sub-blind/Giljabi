# 01. PRD Final — StoryRoute AI

## 1. 제품 한 줄 정의

StoryRoute AI는 한국관광공사 공공데이터를 기반으로, 사용자의 모호한 여행 의도를 **의미 검색 + 장소 관계 그래프 + AI 일정 플래닝**으로 해석해 실제 itinerary를 생성하는 국내 여행 탐색 서비스다.

## 2. 문제

기존 관광 서비스는 대체로 다음 문제가 있다.

1. 장소는 많이 보여주지만 **어떻게 이어서 가야 하는지**가 약하다.
2. 사용자가 자연어로 제약을 말하면 키워드 검색이 실패한다.
3. 공공데이터가 풍부해도 서비스 경험은 `목록 + 상세` 수준에 머무른다.
4. 추천 결과가 나와도 **왜 이 장소가 추천되었는지** 설명이 약하다.
5. 운영자가 추천 품질을 개선할 만큼 구조화된 행동 로그가 쌓이지 않는다.

## 3. 목표

### Primary goals
1. 모호한 자연어 질의를 slot/constraint 구조로 해석한다.
2. 의미 검색 + 필터 + 관계 데이터를 조합해 후보를 만든다.
3. 후보를 실제 일정 초안으로 재구성한다.
4. 사용자 행동 로그를 적재해 추천 품질 개선 루프를 만든다.

### Success metrics
- 검색 → 장소 상세 진입률
- 검색 → itinerary 생성률
- itinerary 저장률
- itinerary 공유률
- 재방문률
- region landing → planner 전환율
- planner 생성 성공률
- planner 수정 후 저장률

## 4. 비목표

- 예약/결제
- 실시간 경로 엔진 정확도 최적화
- 다국어 운영
- UGC 후기 플랫폼
- 실시간 지도/교통 정확도 SLA 보장

## 5. 핵심 페르소나

### Persona A — 빨리 일정이 필요한 사용자
- 시간은 부족하다.
- 대충이 아니라 완성도 높은 초안이 필요하다.

### Persona B — 동행 제약이 있는 사용자
- 부모님/아이/반려동물 동행이 있다.
- 이동량, 접근성, 체력 조건을 중요하게 본다.

### Persona C — 지역 중심 탐색 사용자
- 경북/강원/제주처럼 지역을 먼저 정한다.
- 대표 코스와 숨은 포인트를 같이 보고 싶다.

## 6. 핵심 사용자 스토리

1. 홈에서 자연어로 여행 의도를 입력한다.
2. 검색 결과에서 리스트/지도/필터를 함께 본다.
3. 장소 상세에서 기본 정보, 이미지, 스토리, 주변 연관 장소를 본다.
4. 플래너에서 일정 초안을 생성하고 수정한다.
5. 일정을 저장하고 공유한다.
6. 운영자는 추천 성과와 데이터 수집 상태를 본다.

## 7. 기능 요구사항

### FR-01 홈 / 검색 진입
- 자연어 입력창
- 빠른 칩(지역/동행/일정/분위기/이동강도)
- 샘플 질의
- 최근 검색/인기 질의
- 지역 특화 진입

### FR-02 검색 결과
- 리스트 + 지도 + 필터
- 지역, 카테고리, 일정 길이, 동행, 접근성, 반려동물, 웰니스, 정렬
- 추천 근거 태그/문장
- partial error / empty / loading state
- 결과 카드에서 상세/일정 추가

### FR-03 장소 상세
- 대표 이미지
- 기본 정보
- AI 요약
- 스토리 카드
- 주변 연관 장소
- 추천 근거
- 운영/주의 정보
- 일정 추가 CTA

### FR-04 AI 플래너
- 날짜, 동행, 이동수단, 예산감도, 분위기, 피로도 입력
- 일자별 itinerary 생성
- stop별 추천 이유, 체류시간, 이동 논리 표기
- MVP는 up/down edit만 지원
- 저장 가능한 draft 구조

### FR-05 저장 / 공유
- itinerary draft 저장
- 링크 공유
- 최근 일정 재편집
- 찜한 장소 기반 재생성

### FR-06 지역 특화 랜딩
- 지역별 hero copy
- 대표 의도 카드
- 대표 코스
- 키 플레이스
- 지역 스토리
- 지역 일정 만들기 CTA

### FR-07 관리자
- 검색 의도 상위 클러스터
- itinerary 생성/저장/공유 KPI
- 인기 지역/장소/조합
- ingestion status
- planner success funnel

## 8. AI / Search 요구사항

### Semantic Search
- BM25 + vector hybrid
- summary chunk 단위 검색
- 지역/카테고리/속성 filter 병행
- explainable reason 반환
- mock 단계에서는 deterministic fixture ranking 지원

### Planner
- 입력 제약 구조화
- 후보 pool 생성
- 시간/거리/카테고리 다양성 반영
- 같은 유형 장소 과다 반복 방지
- 날씨/혼잡 대체 시나리오 수용 가능 구조

### Agent orchestration
1. intent extraction
2. candidate retrieval
3. graph expansion
4. itinerary generation
5. validation
6. explanation generation

## 9. 데이터 요구사항

### Canonical entity
- `place`

### Supporting entities
- `place_profile`
- `place_asset`
- `entity_relation`
- `search_chunk`
- `region_metric`
- `user_event`
- `itinerary`
- `itinerary_stop`
- `agent_run`

### 원칙
- raw payload 보존
- source mapping 유지
- delta sync 가능 구조
- mock / real adapter 분리
- vector / place / analytics 분리

## 10. MVP 범위

### In scope
- Home
- Search
- Place Detail
- Planner
- Trips
- Region landing 기본형
- Admin 기본형
- mock API
- OpenAPI blueprint
- Playwright smoke
- 최소 FastAPI skeleton
- 최소 canonical schema

### Out of scope
- 로그인
- 결제/예약
- 실시간 길찾기 엔진
- production infra automation
- 모바일 앱 네이티브 패키징

## 11. 릴리즈 마일스톤

### M0 — Build Ready
- 문서 / 계약 / repo rule / validation / mock fixtures

### M1 — Clickable Product
- 홈 / 검색 / 상세 / 플래너 / trips / region / admin UI shell
- mock API
- smoke E2E

### M2 — Data Foundation
- TourAPI adapter
- place ingestion
- place detail mapping
- search chunk generation

### M3 — Search / Planner v1
- hybrid search
- planner scoring
- itinerary persistence
- event logging

### M4 — Demo Ready
- region landing polish
- admin metrics
- story/explainability polish
- deployment dry run

## 12. 리스크

- 원천 API 필드 변경
- mock/real response drift
- UI 복잡도 대비 adapter 지연
- planner 품질 회귀
- vector search explainability 부족

## 13. 수용 기준

### Search
- 자연어 질의로 카드 1개 이상 렌더링
- 필터 적용 시 URL 상태 동기화
- 카드에서 상세 진입 가능

### Place Detail
- 기본 정보/이미지/요약/주변 추천 렌더링
- 일정 추가 CTA 동작

### Planner
- 제약 입력 후 itinerary 생성 가능
- 일자별 stop 구조 명확
- 저장 가능

### Admin
- 최소 3종 KPI
- mock event 기반 차트 렌더링

## 14. Done Definition
1. 문서 업데이트
2. contract 업데이트
3. UI/API 반영
4. unit/integration/e2e 검증
5. 실패 테스트 0건
