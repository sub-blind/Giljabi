# 22. 개발 환경 / 배포 기준 Final

## 1. 로컬 개발 기본 원칙

- 초반 개발은 **외부 API 키 없이** 돌아야 한다.
- mock fixture와 local service로 대부분의 검증이 가능해야 한다.
- 실데이터 연동은 adapter 뒤로 숨긴다.
- OmX/Codex는 repo sandbox 안에서만 작업한다.

## 2. 로컬 권장 환경

### Frontend
- Node.js 20+
- `pnpm`
- Next.js App Router

### Backend
- Python 3.11+
- virtualenv or uv
- FastAPI
- pytest

### 선택형 인프라
- PostgreSQL
- Redis
- OpenSearch

초반에는 fixture/mock 우선, 이후에 local compose로 붙인다.

## 3. 환경변수 원칙

### root
- `.env.example`만 commit
- 실제 `.env*`는 commit 금지

### web
- internal API base URL
- public-safe key만 허용

### api
- database URL
- redis URL
- provider key
- planner feature flags

## 4. 초기 실행 형태

### M0~M1
- file fixture
- in-memory 또는 sqlite-like lightweight path 허용
- real DB 의존 최소화

### M2+
- Postgres
- optional Redis/OpenSearch
- adapter/ingestion 배치

## 5. 배포 단계 기준

### Stage A — local only
- mock-first
- no provider key required

### Stage B — dev/staging
- real TourAPI key
- real DB
- partial planner wiring

### Stage C — demo/prod-like
- stable deployment target
- real ingestion schedule
- environment secret 분리
- smoke + regression test 필수

## 6. OmX 관점에서 중요한 점

- 테스트가 외부 키 없이 돌아가야 한다.
- 배포 작업은 승인 필요 범위로 본다.
- provider key/Kakao/OpenAI key는 M0~M1 prompt에 포함시키지 않는다.
- deployment script는 code path와 분리해서 작성한다.

## 7. 권장 산출물

- `.env.example`
- `docker-compose.yml` 또는 `compose.yaml`
- `Makefile` 또는 `justfile`
- `pnpm verify`
- `scripts/dev-web.sh`
- `scripts/dev-api.sh`
