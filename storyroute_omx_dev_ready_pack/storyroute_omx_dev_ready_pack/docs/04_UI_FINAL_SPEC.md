# 04. UI Final Spec

## 1. 목적

이 문서는 `STORYROUTE_UI_FINAL_PROTOTYPE.html`을 기준으로 실제 구현에 필요한 화면 정의를 **개발 핸드오프 문서**로 정리한 것이다.

## 2. Route Map

- `/` 홈
- `/search`
- `/place/[id]`
- `/planner`
- `/trips`
- `/region/[slug]`
- `/admin`

## 3. 공통 레이아웃

### Global header
- 로고
- 검색 진입
- 내 여행
- 관리자
- 지역 특화 모드 토글

### Layout width
- Desktop container: 1280px 기준
- 3-column layout: 좌 320 / 중앙 flexible / 우 420
- Mobile: single column

### 공통 UI 원칙
- 추천 이유는 사람 친화적인 문장으로 쓴다.
- 데이터/AI 기능은 과도하게 기술 용어로 노출하지 않는다.
- CTA는 화면당 1개 primary, 1~2개 secondary만 둔다.

## 4. Home (`/`)

### 목적
자연어 질의 입력을 가장 빠르게 유도한다.

### 구성
1. hero copy
2. AI 검색 입력창
3. quick chips
4. 인기 여행 의도 카드
5. 지역 특화 진입
6. 최근 저장 itinerary

### 주요 CTA
- AI로 여행 찾기
- 샘플 질의로 시작
- 경북 특화 보기

### 상호작용
- chip 클릭 → input 반영
- Enter → `/search`
- 샘플 질의 → 미리 채움

## 5. Search (`/search`)

### 목적
결과 비교 / 필터링 / 지도 탐색

### 데스크톱 구조
- 좌: filter sidebar
- 중: result list
- 우: map + itinerary preview

### 필터
- 지역
- 카테고리
- 일정 길이
- 동행
- 접근성
- 반려동물
- 웰니스
- 정렬

### 결과 카드 필수 요소
- 썸네일
- 장소명
- 지역 / 카테고리
- 2~3줄 요약
- 추천 근거 태그
- 상세 보기
- 일정에 추가

### 상태
- loading
- empty
- partial error
- map hover sync
- filtered state

## 6. Place Detail (`/place/[id]`)

### 목적
사용자가 이 장소를 itinerary에 넣을지 결정하게 만든다.

### 섹션
1. hero image
2. 기본 정보 카드
3. AI 요약 / 스토리 카드
4. 주변 연관 장소
5. 추천 근거
6. 일정 추가 패널
7. 운영/주의 정보

### CTA
- 일정에 추가
- 플래너에서 보기
- 공유

## 7. Planner (`/planner`)

### 목적
사용자의 제약을 itinerary 초안으로 전환한다.

### 화면 구조
- 좌: 사용자 제약 + agent 설명 패널
- 중: day-by-day itinerary
- 우: 지도 + 이동 요약

### 입력
- 지역
- 날짜 수
- 동행
- 이동수단
- 예산 감도
- 분위기
- 피로도 허용치

### stop card
- 시간대
- 장소명
- 추천 이유
- 예상 체류시간
- 제거 / 위 / 아래 이동

### 상태
- draft
- generating
- generated
- modified
- saved

## 8. Trips (`/trips`)

### 목적
저장된 일정 재사용 / 재편집

### 섹션
- 최근 저장 일정
- 공유한 일정
- 최근 검색 기반 재생성
- 찜한 장소

## 9. Region (`/region/[slug]`)

### 목적
지역 특화 포인트를 강화한다.

### 필수 요소
- 지역 hero copy
- 대표 여행 의도 카드
- 지역 키 플레이스
- 추천 코스
- 지역 스토리
- 이 지역으로 일정 만들기 CTA

## 10. Admin (`/admin`)

### 목적
운영 성과를 한 화면에서 확인한다.

### 위젯
- KPI cards
- top intents
- popular regions
- popular place combinations
- ingestion status
- planner success funnel

## 11. Mobile rules

- Home hero copy 2줄 이하
- Search는 filter drawer + result list 우선
- Place detail CTA sticky footer
- Planner는 day tab + bottom sheet map
- Admin은 desktop 우선

## 12. 디자인 토큰

### Typography
- Hero: 36/44
- H1: 28/36
- H2: 22/30
- Body: 16/24
- Caption: 13/18

### Radius
- card: 16
- pill: 9999
- input: 14

### Spacing
- 4 / 8 / 12 / 16 / 24 / 32 / 48

### 톤
- 따뜻한 여행 서비스 톤
- 기술 기능보다 여행 맥락 우선
- 설명 가능한 추천 강조

## 13. 구현 우선순위
- P1: Home / Search / Place / Planner
- P2: Trips / Region
- P3: Admin / Mobile polish
