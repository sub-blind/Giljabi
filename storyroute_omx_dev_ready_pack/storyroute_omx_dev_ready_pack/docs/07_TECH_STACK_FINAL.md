# 07. 사용 기술 스택 정의서 Final

## 1. 모노레포 전략

### 선택
- `pnpm workspace`
- `turbo`

### 이유
- web / api / contracts / ui / infra를 한 저장소에서 관리
- contract-first 개발이 쉬움
- OmX/Codex가 파일 경계와 검증 명령을 이해하기 쉬움

## 2. Frontend

### 선택
- Next.js App Router
- TypeScript
- Tailwind CSS
- headless component layer + shadcn/ui 스타일
- TanStack Query
- URL state + 최소 store
- Playwright

### 이유
- route 중심 UI가 명확
- search / place / planner 같은 화면 shell 구현이 빠름
- server rendering + interactive client state 조합이 쉽다

## 3. Backend

### 선택
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x
- Alembic
- httpx
- pytest

### 이유
- OpenAPI 친화적
- adapter / service / planner / ingestion을 Python으로 통일 가능
- 데이터 엔지니어링 코드와 API 서버를 같은 언어로 유지 가능

## 4. Data / Search

### 선택
- PostgreSQL
- PostGIS
- pgvector
- OpenSearch
- Redis
- Object Storage(optional)

### 역할
- PostgreSQL: canonical model / persistence
- PostGIS: spatial query
- pgvector: dense retrieval
- OpenSearch: BM25 / facet / hybrid ranking
- Redis: cache / async handoff / rate limit
- Object Storage: raw snapshot / cached assets

## 5. AI / Planner

### 선택
- FastAPI 내 orchestration service
- versioned prompt assets in repo
- retrieval adapters
- planner validation rules
- agent logs table

### 이유
- planner 품질은 단일 prompt보다 retrieval + scoring + validation 조합이 중요
- regression 추적이 가능해야 한다

## 6. Ingestion / ETL

### 선택
- Python batch scripts
- raw snapshot 저장
- idempotent upsert
- delta sync + repair batch
- fixture seed for local/mock

### 이유
- KTO API가 목록/상세/동기화 목록으로 나뉘어 있어 배치가 필요
- source payload와 canonical entity를 분리해야 안전하다

## 7. Infra

### Local
- Docker Compose
- Postgres
- Redis
- OpenSearch

### CI
- GitHub Actions
- lint / typecheck / test / pytest / playwright

### Deploy baseline
- web: Vercel 또는 equivalent
- api: Cloud Run / container runtime
- db: Postgres managed
- redis: managed Redis
- object: S3 compatible storage

## 8. 외부 연동 경계

### Tourism sources
- TourAPI / KTO open data
- relation / story / metrics
- optional map provider

### 원칙
- provider-specific field는 adapter에서 종료
- web은 internal API만 본다
- provider outage는 fixture/mock으로 대체 가능해야 한다

## 9. 권장 baseline version
- Node.js 20+
- Python 3.12+
- PostgreSQL 16
- Redis 7
- OpenSearch 2.x

## 10. 선택하지 않은 것

### Spring Boot
- 팀이 Java 강하면 가능
- 하지만 ETL/API 언어 통일성이 깨질 수 있다

### Elasticsearch only
- 가능
- 하지만 vector와 canonical store를 한 축에서 운영하기엔 Postgres + pgvector 조합이 더 유연하다

### Next API Routes as main backend
- MVP는 가능
- ETL/planner/search adapter가 커질수록 FastAPI 분리가 더 낫다
