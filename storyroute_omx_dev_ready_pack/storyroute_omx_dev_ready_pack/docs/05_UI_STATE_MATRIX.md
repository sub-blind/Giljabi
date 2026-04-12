# 05. UI State Matrix

## 1. Home

| 상태 | 조건 | UI |
|---|---|---|
| default | 최초 진입 | hero + chips + 샘플 질의 |
| with recent | 최근 검색 있음 | recent query section |
| no recent | 로그인/저장 없음 | 샘플 질의만 노출 |

## 2. Search

| 상태 | 조건 | UI |
|---|---|---|
| loading | 질의 직후 | skeleton cards + map skeleton |
| success | 결과 있음 | list + map + filters |
| empty | 결과 0 | 대체 질의 제안 |
| partial error | map 또는 일부 source 실패 | warning banner + list 유지 |
| filtered | 필터 적용 | pill active state + URL sync |

## 3. Place Detail

| 상태 | 조건 | UI |
|---|---|---|
| loading | id resolve 중 | hero skeleton + card skeleton |
| success | 데이터 있음 | hero + info + story + nearby |
| minimal | 자산 부족 | fallback image + short summary |
| no relation | 주변 추천 없음 | empty nearby card |

## 4. Planner

| 상태 | 조건 | UI |
|---|---|---|
| draft | 입력만 있음 | constraint form |
| generating | 생성 중 | progress / placeholder day cards |
| generated | 생성 완료 | itinerary + map + reasons |
| modified | stop 이동/삭제 후 | unsaved badge |
| saved | 저장 완료 | saved toast / share CTA |

## 5. Trips

| 상태 | 조건 | UI |
|---|---|---|
| empty | 저장 일정 없음 | 검색으로 시작 CTA |
| with drafts | draft 있음 | draft card section |
| with saved | 저장 일정 있음 | saved list |

## 6. Region

| 상태 | 조건 | UI |
|---|---|---|
| default | 지역 랜딩 | hero + key places + intent cards |
| seasonal | 시즌 테마 활성화 | seasonal banner |
| low data | 지역 데이터 부족 | general fallback layout |

## 7. Admin

| 상태 | 조건 | UI |
|---|---|---|
| mock mode | 초기 개발 | fixture KPI |
| live mode | real metrics 연결 | latest ingestion timestamp |
| degraded | 일부 source 미수집 | banner + partial KPI |
