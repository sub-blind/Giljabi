# 스토리루트 문서 안내

이 폴더의 문서는 현재 구현을 설명하는 문서, 실행·검증 문서, 공모전 기획 자료로 나뉜다. 처음 보는 사람은 **시스템 구조 → 사용자 흐름 → 데이터 모델 → API 명세** 순서로 읽으면 된다.

## 1. 현재 구현을 이해하는 문서

| 문서 | 내용 | 기준 |
|---|---|---|
| [시스템 구조](./SYSTEM_ARCHITECTURE.md) | Vercel·Render·FastAPI·PostgreSQL·외부 API의 연결과 장애 처리 | 현재 운영 구조 |
| [데이터 모델과 ERD](./DATA_MODEL.md) | 5개 테이블, 관계·제약, 브라우저 저장 경계 | 현재 모델 |
| [최소 사용자 시나리오](./MVP_USER_SCENARIO.md) | 지도·문장·사진에서 코스와 여행 기록까지의 흐름 | 현재 화면 |
| [프런트·API 명세](./FRONTEND_API_SPEC.md) | 화면 상태, 하루 여행 API 계약, 오류·취소 처리 | 현재 구현 |
| [인증 API 명세](./AUTH_API_SPEC.md) | 카카오 로그인, 쿠키, 계정 코스, 탈퇴 | 현재 구현 |
| [데이터베이스 상세 구조](./DATABASE_SCHEMA.md) | 컬럼, 인덱스, 제약, 삭제 규칙 | 현재 구현 |

실제 요청·응답 형식은 문서 설명보다 [OpenAPI 계약](../contracts/day-trip.openapi.json)과 FastAPI `/docs`를 우선한다.

## 2. 실행과 검증

| 문서 | 용도 |
|---|---|
| [프로젝트 README](../README.md) | 설치, 로컬 실행, 주요 기능과 빠른 명령 |
| [검증 기록](./VALIDATION.md) | 자동 테스트와 날짜순 실제 연동 확인 이력 |
| [AI 설정과 확인](./AI_SETUP_AND_CHECK.md) | Responses API 설정, 평가 범위, 실패 시 대체 흐름 |
| [PostgreSQL 실행 안내](./POSTGRESQL_PLAN.md) | 로컬 DB 실행, 마이그레이션, 운영 시 주의점 |
| [강원도 API 선정안](./API_SELECTION_GANGWON.md) | TourAPI 서비스별 역할과 데이터 채택 기준 |

검증 기록은 과거 상태를 지우지 않는 날짜순 기록이다. 상단의 최신 요약과 마지막 날짜 절을 현재 상태로 보고, 중간의 “구현 전” 또는 “남은 작업”은 해당 날짜의 이력으로 해석한다.

## 3. 기획과 제출 참고

| 문서 | 용도 |
|---|---|
| [프로젝트 계획](./PROJECT_PLAN.md) | 문제 정의, 범위, 차별점, 확장 계획 |
| [제안서 초안](./proposal/00_작성순서와유의사항.md) | 공모전 서술 자료의 목차와 작성 원칙 |
| [기획 배경](./proposal/01_기획배경_필요성.md) | 주제 선정 이유와 사용자 문제 |
| [서비스 개요](./proposal/02_서비스개요.md) | 핵심 기능과 흐름 |
| [데이터 활용](./proposal/03_데이터활용방안.md) | 관광 데이터의 역할과 검증 방식 |
| [발전 방향](./proposal/04_서비스발전방향.md) | 현재 범위와 후속 확장 |

`storyroute_omx_dev_ready_pack/`은 초기 설계와 작업 인수인계를 위한 보관 자료다. 현재 구현 판단에는 이 폴더의 문서와 실제 코드를 사용한다.

## 4. 문서 작성 규칙

- 구현 여부, 로컬 검증, 공개 배포 검증을 구분해 쓴다.
- 관광 API에 없는 정보와 이동 시간을 추정해서 적지 않는다.
- 비밀키·DB 비밀번호·JWT 시크릿·실제 쿠키를 문서 예시에 넣지 않는다.
- 화면 동작이 바뀌면 사용자 시나리오와 검증 기록을 함께 갱신한다.
- DB 모델이나 저장 경계가 바뀌면 ERD의 Mermaid 원본과 SVG를 함께 갱신한다.
- 배포 구조가 바뀌면 시스템 구성도의 Mermaid 원본과 SVG를 함께 갱신한다.

## 5. 그림 원본

- [시스템 구성도 SVG](./assets/storyroute-system-architecture.svg) · [Mermaid 원본](./assets/storyroute-system-architecture.mmd)
- [ERD SVG](./assets/storyroute-erd.svg) · [Mermaid 원본](./assets/storyroute-erd.mmd)
