# Tourism 코드 작업 안내

이 저장소의 작업 기준은 [AGENTS.md](AGENTS.md)다. 모든 작업 문서·화면 안내는 한국어로 작성한다. 기술명, 코드 식별자, API 경로는 원래 표기를 유지한다.

## 먼저 읽을 문서

1. [프로젝트 README](README.md)
2. [개정 기획서](docs/PROJECT_PLAN.md)
   - [강원도 API 선정안](docs/API_SELECTION_GANGWON.md): 사용자 지역 정정·API 우선순위·실제 연결 확인.
3. [프런트·API 설계서](docs/FRONTEND_API_SPEC.md)
4. [최소 사용자 시나리오](docs/MVP_USER_SCENARIO.md)
5. [하루 여행 API 계약](contracts/day-trip.openapi.json)

## 구조

- `app`: FastAPI 서버. 환경변수는 `app/config.py`의 Settings로 읽는다.
- `app/services/day_trip.py`: 강원도·시군 검색·코스 재검증·구조화 AI 출력 검사.
- `app/tour_api`: 외부 관광 서비스 어댑터.
- `web`: 기존 Next.js 기반 React 프런트. CSS Modules로 콘텐츠 폭에 맞춰 배치한다.
- `web/lib/api.ts`: 내부 API 호출 관리.
- `contracts/openapi.yaml`: 이전의 넓은 서비스 계약.
- `contracts/day-trip.openapi.json`: 현재 하루 여행 화면의 실제 계약.
- `storyroute_omx_dev_ready_pack`: 이전 기획 참고 자료. 현재 범위와 충돌하면 최신 문서를 우선한다.

## 실행·검증

실행 명령은 [README](README.md)를 따른다. 프런트 명령은 `web`에서 npm으로 실행한다. 루트에는 package.json이 없다.

완료 전 `npm run build`, `npm run typecheck`, `npm run lint`, `python -m pytest -q`를 확인한다. 실제 관광·AI 호출은 모의 응답 검증과 구분해 기록한다.

## 핵심 원칙

개발 기준은 1인 개발·강원도 전체·당일·최대 세 장소다. 강원도 전체와 18개 시군을 지원한다. 관광사진·오디·기준월 연관 정보를 화면에 제공한다. 회원가입 없이 사용할 수 있다. 브라우저에는 개인 선택 ID·순서·조건만 저장한다.

장소 조회의 지역코드를 추정해서 박아 넣지 않는다. 국문 관광정보의 지역·시군구 목록에서 강원과 선택 시군을 찾는다. 연관 서비스는 별도 공식 코드표의 강원 `51`과 시군 코드를 사용한다. 사진·오디·연관 ID를 국문 장소 ID로 사용하지 않는다. 누락된 좌표에 다른 지역 좌표를 대신 넣지 않는다.

AI의 장소 ID·근거 구절을 실제 장소·소개 원문과 대조한다. 미확인 이동시간·영업시간·혼잡·접근성 조건은 사실처럼 표시하지 않는다. 카드 선택·순서 변경 때 LLM을 재호출하지 않는다.
