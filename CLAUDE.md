# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Dev Ports

다른 프로젝트와 충돌 방지를 위해 기본 포트에서 변경됨:

| 서비스 | 포트 |
| --- | --- |
| 백엔드 (FastAPI) | **8010** |
| 프론트 (Next.js) | **3010** |

## Commands

### Backend (Python / FastAPI)

```bash
# 가상환경 활성화 (프로젝트 루트에서)
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --port 8010
```

### Frontend (Next.js)

```bash
# web/ 폴더에서 실행 (루트에는 package.json 없음)
cd web
npm install
npm run dev -- -p 3010
```

### 확인 엔드포인트

- `http://127.0.0.1:8010/healthz` — 헬스체크
- `http://127.0.0.1:8010/docs` — Swagger UI (전체 API 목록)

## Architecture

```text
Tourism/
├── app/                        # FastAPI 백엔드
│   ├── main.py                 # FastAPI app factory, CORS 설정
│   ├── config.py               # pydantic-settings — .env 로드
│   ├── auth_tokens.py          # JWT 직접 구현(HS256), RefreshSessionStore (in-memory)
│   └── api/v1/
│       ├── router.py           # 라우터 조립
│       └── endpoints/
│           ├── auth.py         # 카카오 OAuth, /me, /refresh, /logout, /session
│           ├── health.py       # GET /health
│           ├── storyroute_bridge.py  # StoryRoute OpenAPI 계약 구현 (얇은 게이트)
│           └── tour/
│               ├── area.py     # GET /tour/list-by-area, /tour/list-by-keyword
│               └── detail.py   # GET /tour/detail/common, /tour/detail/intro
├── app/tour_api/
│   ├── client.py               # httpx 래퍼 — TourAPI KorService2 호출
│   └── operations.py           # KorServiceOp(StrEnum) — 오퍼레이션 이름 관리
├── contracts/
│   └── openapi.yaml            # StoryRoute AI와의 API 계약서 (서버 기준 URL은 :8000 — 실제 로컬은 8010)
├── web/                        # Next.js 14 프론트엔드
│   ├── app/page.tsx            # 루트: GangwonTravelPlanner 렌더
│   ├── app/auth/               # 카카오 콜백 처리 페이지
│   ├── components/
│   │   └── GangwonTravelPlanner.tsx  # 메인 UI 컴포넌트
│   └── lib/
│       ├── api.ts              # fetch 래퍼 (getApiBase, fetchAuthSession, fetchPlacesByArea 등)
│       └── tour.ts             # TourAPI 응답 파싱 타입/유틸
└── .env                        # 환경변수
```

### 핵심 설계 포인트

#### 두 개의 API 레이어

- `app/api/v1/tour/` — TourAPI 원형에 가까운 엔드포인트 (`areaCode`, `pageNo` 등 직접 노출)
- `app/api/v1/storyroute_bridge.py` — StoryRoute OpenAPI 계약을 따르는 게이트 (`placeId = {contentTypeId}_{contentId}` 형식)

#### 인증

- 카카오 OAuth2 (Authorization Code Flow + CSRF state 검증)
- JWT는 외부 라이브러리 없이 `auth_tokens.py`에서 직접 구현 (HS256, HMAC-SHA256)
- Refresh 세션은 in-memory `RefreshSessionStore` — 서버 재시작 시 초기화됨
- 쿠키명: `storyroute_access_token`, `storyroute_refresh_token`

#### TourAPI 호출

- `app/tour_api/client.py`의 `get_json(KorServiceOp, extra_params)` 단일 함수로 모든 호출 통일
- 강원도 기본 areaCode = **32**

#### 프론트 API 베이스

- `NEXT_PUBLIC_API_BASE_URL` 없으면 `http://127.0.0.1:8010` 하드코딩 (`web/lib/api.ts`)

## Environment Variables (.env)

| 키 | 설명 |
| --- | --- |
| `TOUR_API_SERVICE_KEY` | 공공데이터포털 인증키 |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 클라이언트 시크릿 |
| `KAKAO_REDIRECT_URI` | 카카오 콜백 URI (백엔드) |
| `AUTH_JWT_SECRET` | JWT 서명 시크릿 (32자 이상 필수) |
| `CORS_ORIGINS` | 허용 origin (쉼표 구분) |

## StoryRoute 계약 구현 현황

`contracts/openapi.yaml` 전체 경로 중 실제 데이터 반환:

- `GET /api/v1/search` (키워드 검색 → TourAPI searchKeyword2)
- `GET /api/v1/places/{placeId}` (상세 → TourAPI detailCommon2)
- `GET /api/v1/regions/{slug}` (강원 한정 랜딩 데이터)
- `GET /healthz`

스텁(빈 응답/고정값):

- `POST /api/v1/planner/preview` — AI 플래너 미구현
- `GET /api/v1/itineraries`, `POST /api/v1/itineraries` — DB 미연결
- `POST /api/v1/events` — 이벤트 로깅 미구현
- `GET /api/v1/admin/kpis`, `/admin/ingestion`
