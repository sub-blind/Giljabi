# StoryRoute

원하는 여행을 말하거나 사진을 보며 실제 관광 장소를 골라 나만의 강원도 하루 코스를 만드는 반응형 웹 서비스다. 한 사람이 프런트와 백엔드를 개발하며, 최대 세 장소를 선택한다. 한두 장소로도 코스를 만들 수 있다.

강원특별자치도 전체 검색과 18개 시·군 선택을 지원한다. 관광사진에서 지역을 발견하고 장소 상세에서 오디 원본 이야기와 기준월 연관 관광지를 살펴볼 수 있다. 데이터 판단은 [강원도 API 선정안](docs/API_SELECTION_GANGWON.md)을 따른다.

## 최신 문서

- [개정 기획서](docs/PROJECT_PLAN.md)
- [강원도 API 선정안](docs/API_SELECTION_GANGWON.md)
- [프런트·API 설계서](docs/FRONTEND_API_SPEC.md)
- [최소 사용자 시나리오](docs/MVP_USER_SCENARIO.md)
- [검증 기록](docs/VALIDATION.md)
- [실제 AI 연결·평가 안내](docs/AI_SETUP_AND_CHECK.md)
- [하루 여행 API 계약](contracts/day-trip.openapi.json)

작업 문서와 화면 안내는 한국어를 기준으로 한다. `storyroute_omx_dev_ready_pack`은 이전 기획의 참고 자료이며 현재 개발 범위는 위 문서를 따른다.

## 기술 구성

| 영역 | 구성 |
|---|---|
| 프런트 | React 19·TypeScript·Next.js 15·CSS Modules |
| 백엔드 | Python·FastAPI·httpx |
| 관광 정보 | 한국관광공사 국문 관광정보 서비스, KorService2 |
| 추가 콘텐츠 | 관광사진·오디·관광지별 연관 관광지·무장애 여행정보 서비스 |
| AI | 선택적으로 OpenAI Responses API 구조화 출력 |
| 지도 | Leaflet·OpenStreetMap |
| 개인 저장 | 이 브라우저의 localStorage에 ID·순서·조건 저장 |

기존 저장소의 Next.js 구조에서 React 프런트를 구현한다. 개발·운영 모두 Next.js의 경로 연결로 `/api/v1/day-trip` 요청을 FastAPI에 전달한다.

## 실행 준비

Node.js 22.12 이상과 Python 3.12 이상을 권장한다. 아래 명령은 Windows PowerShell에서 프로젝트 루트를 기준으로 실행한다.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
```

`.env`의 `TOUR_API_SERVICE_KEY`에 공공데이터포털 인증키를 설정한다. 선택적으로 `OPENAI_API_KEY`, `OPENAI_MODEL`을 함께 설정하면 AI 해석과 근거 선택을 사용할 수 있다. 모델은 해당 API 계정에서 구조화 출력을 지원하는 모델을 지정한다. 실제 `.env`의 값은 공개 문서나 코드에 넣지 않는다.

사진·오디오·연관 관광지·무장애 여행정보의 별도 인증 설정은 서버 `.env`에서 아래 항목으로 관리한다. 국문 관광정보의 설정은 그대로 유지한다. 네 서비스를 화면에 연결했다. 없는 콘텐츠나 추가 서비스 오류는 해당 영역에서 안내한다.

| 서비스 | 서버 주소 변수 | 인증키 변수 |
|---|---|---|
| 관광사진 | `PHOTO_API_BASE_URL` | `PHOTO_API_SERVICE_KEY` |
| 오디오 가이드 | `AUDIO_API_BASE_URL` | `AUDIO_API_SERVICE_KEY` |
| 연관 관광지 | `RELATED_API_BASE_URL` | `RELATED_API_SERVICE_KEY` |
| 무장애 여행정보 | `ACCESS_API_BASE_URL` | `ACCESS_API_SERVICE_KEY` |

서버 환경변수를 바꾸면 백엔드를 다시 시작한다. 각 서비스의 지역코드·ID·응답 형태를 별도로 처리한다. `RELATED_API_BASE_MONTH`의 기본값은 실제 조회한 `202504`다. 화면에 자료 기준월을 표시한다. 상태 API의 준비 표시는 설정 여부이며 실제 정상 여부는 조회 결과로 확인한다.

## 백엔드 실행

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- 상태 확인: <http://127.0.0.1:8000/healthz>
- API 문서: <http://127.0.0.1:8000/docs>

## 프런트 실행

다른 터미널에서 프로젝트 루트를 기준으로 실행한다.

```powershell
Set-Location -LiteralPath web
npm ci
npm run dev
```

화면 주소: <http://localhost:3000>. `web/package-lock.json`을 사용하므로 npm을 기본 패키지 관리자로 사용한다.

백엔드 주소가 다르면 `web/.env.local`의 `API_BASE_URL`을 설정하고 프런트를 다시 시작한다. 기본값은 `http://127.0.0.1:8000`이며 기존 `NEXT_PUBLIC_API_BASE_URL`도 호환한다. 외부 API 비밀키는 이 프런트 설정에 넣지 않는다.

## 구현한 흐름

1. 여행 문장 해석 또는 직접 조건 선택.
2. 강원도 전체 또는 시군·관심 유형·키워드 수정. 주관적 선호와 미지원 조건 표시.
3. 실제 강원도 장소 조회, 사진·분류·주소·확인된 근거 표시.
4. 최대 세 장소 선택, 지정한 장소를 현재 후보의 다른 장소로 교체.
5. 서버에서 ID·유형·지역·존재 여부 재검증 후 코스 생성.
6. 소개 원문과 대조한 AI 단서 또는 확인된 사실 표시.
7. 순서 변경, 실제 좌표 마커, 외부 길찾기.
8. 브라우저 저장, 복원 시 실제 장소 재조회.
9. 관광사진 탐색에서 촬영 지역의 실제 관광 후보 검색.
10. 상세의 ‘이야기 듣기’에서 관광지명·좌표를 대조한 오디 원본 대본·오디오 제공.
11. ‘함께 볼 곳’에서 기준월 연관 자료 표시. 국문 관광정보에서도 이름·지역을 확인한 장소만 후보로 연결.
12. ‘방문 편의정보’에서 동일 장소를 대조한 무장애 원본 항목 표시. 누락 항목은 이용 가능·불가로 해석하지 않음.

후보 카드 표시·선택·순서 변경마다 LLM을 호출하지 않는다. 관광 연결이 없으면 실제 장소를 제공한 것처럼 표시하지 않는다. AI가 없거나 실패해도 직접 조건 선택과 실제 관광 검색을 사용할 수 있다.

## 코드 위치

| 위치 | 역할 |
|---|---|
| `web/components/storyroute` | 세 단계 화면, 조건 편집, 장소 카드·상세, 지도 |
| `web/lib/api.ts` | 내부 API 요청·시간 제한·오류 처리 |
| `web/lib/storyroute` | 공통 타입과 브라우저 저장 |
| `app/services/day_trip.py` | 관광 데이터 정리·지역 검증·AI 근거 확인 |
| `app/services/travel_content.py` | 관광사진·오디·연관·무장애 자료와 실제 장소 대조 |
| `app/tour_api/related_region_codes.json` | 공식 코드표의 연관 서비스 강원 시군 코드 |
| `app/api/v1/endpoints/day_trip.py` | 하루 여행 API |
| `app/tour_api/client.py` | 서버에서 관광 API 호출·조회량 제한 |
| `tests/test_day_trip.py` | 외부 키가 필요 없는 흐름·실패 검증 |
| `tests/test_travel_content.py` | 강원도 범위·추가 콘텐츠·장소 연결 검증 |

기존 인증·관광 원형 API·이전 계약 경로는 같은 서버에 있다. 현재 화면은 하루 여행 API를 사용한다. 이전 서버 저장·행사 기록·관리자 경로는 실제 저장이나 수집이 구현된 것으로 간주하지 않는다.

## 검증

프로젝트 루트:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe tools/check_live_tourism.py
.\.venv\Scripts\python.exe tools/check_extra_tourism.py
```

`web` 폴더:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

기능 테스트는 모의 관광·AI 응답을 사용한다. 실제 연결 확인 명령은 설정한 관광 API로 최소 조회를 실행하며 인증키·인증 URL을 출력하지 않는다. 최근 결과와 미확인 항목은 [검증 기록](docs/VALIDATION.md)에 구분해 기록한다.

## 운영

프런트는 `npm run build` 후 `npm run start`, 백엔드는 uvicorn으로 각각 운영한다. 프런트의 `API_BASE_URL`이 실제 백엔드에 닿아야 한다. 운영 빌드에 연결 주소가 반영되므로 주소를 바꾸면 다시 빌드한다. 공개 주소 배포와 공모전 제출은 별도 단계다.

현재 조회량 제한과 지역코드는 메모리에 있다. 백엔드는 한 워커를 기준으로 운영하고, 여러 인스턴스 운영 때는 공유 제한 저장소가 필요하다. 관광 원천 데이터의 대량 영속 저장과 색인은 별도 이용 안내를 확인한 후 확장한다.

## 프로젝트 규칙

### 브랜치

- 기본 브랜치는 `main`과 `dev`이며 두 브랜치에 직접 푸시하지 않는다.
- `dev`에서 작업 브랜치를 만들고 작업 브랜치를 푸시한 뒤 풀리퀘스트로 반영한다.
- 작업 브랜치 이름은 `{타입}-{개발자}-{작업내용}-#{이슈번호}` 형식으로 작성한다.
- 예: `feat-kjs-kakao-login-#1`.

### 커밋

커밋 메시지는 `{접두사}: {내용} (#{이슈번호})` 형식을 사용한다. 내용은 간결한 한국어로 작성한다.

예: `Feat: 강원도 관광지 목록 API 연동 (#3)`.

| 접두사 | 용도 |
|---|---|
| Feat | 새로운 기능 |
| Fix | 버그 수정 |
| Docs | 문서 추가·수정 |
| Style | 스타일링 |
| Refactor | 동작 변경 없는 리팩토링 |
| Test | 테스트 |
| Conf | 빌드·환경 설정 |
| Chore | 기타 작업 |

### 풀리퀘스트

제목은 `[접두사] 내용` 형식을 사용한다. 예: `[Feat] 강원도 하루 여행 구현`.
본문은 저장소의 [풀리퀘스트 템플릿](.github/PULL_REQUEST_TEMPLATE.md)에 따라 변경 내용과 검토할 사항을 한국어로 작성한다.

## 공식 자료

- [한국관광공사 국문 관광정보 서비스](https://www.data.go.kr/data/15101578/openapi.do)
- [Next.js 경로 연결](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- [OpenAI 구조화 출력](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Leaflet 지도](https://leafletjs.com/reference.html)
- [OpenStreetMap 타일 이용 안내](https://operations.osmfoundation.org/policies/tiles/)
- [공모전 안내](https://lowly-polyanthus-1fb.notion.site/2026-36b5dce406e380e0a3d1f80525667a11)
