# 08. 시스템 아키텍처 정의서 Final

## 1. Logical Layers

```mermaid
flowchart TB
  subgraph Client
    WEB[Next.js Web]
  end

  subgraph API
    GATEWAY[FastAPI Routes]
    SEARCH[Search Service]
    PLANNER[Planner Service]
    PLACE[Place Service]
    EVENTS[Event Service]
  end

  subgraph Data
    PG[(PostgreSQL/PostGIS)]
    VEC[(pgvector)]
    OS[(OpenSearch)]
    REDIS[(Redis)]
    OBJ[(Object Storage)]
  end

  subgraph Sources
    KTO[TourAPI / KTO datasets]
    REL[연관/중심 관광지]
    STORY[스토리텔링 / 오디오]
    METRIC[지역 지표]
  end

  WEB --> GATEWAY
  GATEWAY --> SEARCH
  GATEWAY --> PLANNER
  GATEWAY --> PLACE
  GATEWAY --> EVENTS

  SEARCH --> OS
  SEARCH --> VEC
  SEARCH --> PG
  PLANNER --> PG
  PLANNER --> REDIS
  PLACE --> PG
  EVENTS --> PG
  PG --> OBJ

  KTO --> PG
  REL --> PG
  STORY --> PG
  METRIC --> PG
```

## 2. 요청 흐름

### 검색 흐름
1. 사용자 질의 입력
2. intent extraction
3. filter normalization
4. BM25 + vector retrieval
5. relation expansion
6. UI view model 반환

### 상세 흐름
1. place id 수신
2. canonical place 조회
3. profile / asset / relation / summary 결합
4. detail response 구성

### 플래너 흐름
1. constraint parsing
2. candidate pool 생성
3. scoring
4. itinerary generation
5. validation
6. explanation
7. draft 반환/저장

## 3. 데이터 적재 흐름

```mermaid
flowchart LR
  RAW[raw payload snapshot] --> STAGE[normalize stage]
  STAGE --> CANON[canonical place/profile/asset]
  CANON --> SEARCH_CHUNK[search chunk generation]
  SEARCH_CHUNK --> INDEX[OpenSearch + pgvector]
  CANON --> APP[planner / place / search API]
```

## 4. 핵심 서비스 경계

### Search Service
- query parse
- retrieval
- ranking
- search response view model

### Place Service
- canonical read
- detail assembly
- nearby places
- explainability surface

### Planner Service
- slot extraction
- scoring
- validation
- itinerary assembly

### Event Service
- client event intake
- normalization
- fact persistence

## 5. 실패 허용 설계

- search index 실패 → PG fallback + reduced result
- relation 데이터 없음 → place-only 결과
- planner generation 실패 → candidate list fallback
- asset 없음 → placeholder rendering
- external API 장애 → fixture/mock 유지

## 6. Observability
- request id
- trace id
- planner run id
- ingestion run id
- search query id
- error category
