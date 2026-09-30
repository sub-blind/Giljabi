# 카카오 인증 API와 PostgreSQL 연결

2026년 9월 30일 기준. 회원·인증 세션 저장, 프런트 카카오 로그인 상태, 계정별 코스 생성·목록·조회·삭제와 회원 탈퇴를 구현했다. 방문 체크와 메모는 현재 브라우저에만 저장한다.

## 처리 흐름

```mermaid
sequenceDiagram
    participant B as 브라우저
    participant A as FastAPI
    participant K as 카카오
    participant D as PostgreSQL
    B->>A: GET /api/v1/auth/kakao/login
    A-->>B: 상태 쿠키와 카카오 인증 주소로 이동
    B->>K: 로그인과 동의
    K-->>B: 인가 코드로 콜백 이동
    B->>A: GET /api/v1/auth/kakao/callback
    A->>A: 서명된 상태·약관 버전·연령 확인 검증
    A->>K: 토큰 교환과 사용자 조회
    K-->>A: 카카오 사용자 ID와 프로필
    A->>D: 회원 생성 또는 갱신 + 세션 해시 저장
    D-->>A: 트랜잭션 커밋
    A-->>B: HttpOnly 인증 쿠키와 성공 주소로 이동
```

카카오 ID는 `users.provider_user_id`로 저장하며 서비스 내부 사용자 ID는 UUID다. 동일 제공자·사용자 ID의 유일 제약과 PostgreSQL의 충돌 갱신을 사용한다. 닉네임은 최대 100자로 제한하고 재로그인 때 갱신한다. 카카오 원본 토큰·이메일·프로필 사진은 DB에 보관하지 않는다.

세션은 로그인 유지용 토큰의 SHA-256 해시만 저장한다. 접근 토큰과 로그인 유지용 토큰에는 내부 사용자 ID와 세션 ID가 들어간다. 기존 메모리 방식의 쿠키는 호환하지 않으며 한 번 다시 로그인해야 한다. 서버 재시작이나 다른 앱 인스턴스에서도 동일 DB와 JWT 서명을 사용하면 로그인 세션을 조회할 수 있다. 실제 프로세스 재시작의 브라우저 검증은 별도로 남겨 둔다.

접근·갱신·OAuth 상태 쿠키는 모두 `HttpOnly`, `SameSite=Lax`, 경로 `/`로 설정한다. 운영 HTTPS 배포에서는 `AUTH_SECURE_COOKIES=true`를 사용한다. 기본 유효기간은 접근 토큰 900초, 갱신 토큰 1,209,600초이며 환경변수로 조정할 수 있다. `KAKAO_LOGOUT_REDIRECT_URI`는 설정 모델에 남아 있지만 현재 로그아웃 API는 카카오 계정 로그아웃 화면으로 이동하지 않고 서비스 세션을 폐기한 뒤 JSON을 반환하므로, 현재 동작에 사용되는 값은 아니다.

## API 계약

| 메서드·경로 | 동작 |
|---|---|
| GET `/api/v1/auth/kakao/login-url` | OAuth 설정 활성 여부·안내 버전·`confirmationRequired` 반환. 활성 상태에서도 `loginUrl`은 null이며 프런트 로그인 안내를 거쳐야 한다. DB 연결 성공을 보장하는 상태가 아님 |
| GET `/api/v1/auth/kakao/login` | `policy_version=2026-09-30`, `age_confirmed=true`, `terms_agreed=true`를 확인한 뒤 서명된 상태 쿠키를 발급하고 카카오로 이동. 누락은 422, 불일치·거절은 400. `request_nickname=true`이면 닉네임 추가 동의 요청 |
| GET `/api/v1/auth/kakao/callback` | 상태 검증·카카오 사용자 조회·회원과 세션 저장 후 프런트 성공 주소로 이동. 인증 또는 DB 저장 실패 시 쿠키를 지우고 실패 주소로 이동 |
| GET `/api/v1/auth/me` | 접근 쿠키와 DB의 활성 세션을 확인하고 회원 반환. 미인증은 401 |
| GET `/api/v1/auth/session` | `ok`, `authenticated`, `hasRefreshToken`, `user` 반환. 미인증은 200과 `authenticated: false`. `hasRefreshToken`은 쿠키 존재 여부이며 유효성 판정이 아님 |
| POST `/api/v1/auth/refresh` | 세션 행 잠금·만료와 폐기 및 해시 검증·기존 세션 폐기·새 세션 저장 후 쿠키 갱신 |
| POST `/api/v1/auth/logout` | 유효한 로그인 유지용 쿠키에 해당하는 세션을 폐기하고 인증 쿠키 삭제 |
| DELETE `/api/v1/auth/account` | 로그인 유지용 쿠키와 활성 세션을 다시 확인한 뒤 회원·전체 세션·계정 코스를 연쇄 삭제하고 인증 쿠키 삭제 |
| POST `/api/v1/account/courses` | 로그인 사용자의 코스 제목·조건·장소 ID와 순서를 저장 |
| GET `/api/v1/account/courses` | 로그인 사용자의 최근 코스 최대 20개 조회 |
| GET `/api/v1/account/courses/{course_id}` | 소유권을 확인한 계정 코스 단건 조회 |
| DELETE `/api/v1/account/courses/{course_id}` | 소유권을 확인한 계정 코스와 장소 삭제 |

회원 응답은 `userId`, `provider`, `nickname`이다. `userId`는 내부 UUID 문자열이며 외부 카카오 ID를 프런트에 전달하지 않는다. 이메일 필드는 반환하지 않는다.

인증 응답에는 `Cache-Control: no-store`를 적용한다. DB 오류는 503과 한국어 안내를 반환하고 연결 주소·비밀번호·SQL 원문은 노출하지 않는다. DB 장애를 미인증 성공 응답으로 감추지 않는다. DB가 없어도 기본 관광 검색과 `/healthz`는 유지된다.

토큰 갱신은 `SELECT FOR UPDATE`로 같은 세션을 잠근다. 먼저 갱신된 세션은 폐기 상태가 되어 재사용을 거절한다. 새 토큰 저장에 실패하면 기존 세션 폐기도 롤백한다. 폐기·만료된 세션은 접근 토큰도 거절한다. 다른 기기의 별도 세션까지 로그아웃하지 않는다. 회원 탈퇴는 로그인 유지용 토큰 해시를 재검증한 뒤 사용자 행을 삭제하며 외래키 연쇄 삭제로 모든 세션·코스·코스 장소를 함께 제거한다. 만료·폐기 행은 서버 시작 및 실행 중 매시간 정리한다. 서버 중단·DB 장애 시 다음 실행에서 재시도하며 계정과 저장 코스는 정리 대상이 아니다.

## 로컬 설정과 확인

서버 `.env`에 `DATABASE_URL`, `AUTH_JWT_SECRET`(최소 32자), `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`, `AUTH_FRONTEND_SUCCESS_URL`, `AUTH_FRONTEND_FAILURE_URL`을 설정한다. 카카오 로그인과 시크릿 활성화를 확인하고 동일 REST API 키의 리다이렉트 URI를 콜백 주소와 정확히 맞춘다. 프런트 주소와 `CORS_ORIGINS`도 실행 포트와 맞춘다. 비밀 값은 서버 환경파일에만 넣는다.

테이블 준비는 프로젝트 루트에서 실행한다.

```powershell
.\.venv\Scripts\python.exe -X utf8 -m alembic upgrade head
```

실제 카카오 로그인 후 프런트 헤더의 닉네임·내 코스·로그아웃과 백엔드 `/api/v1/auth/me`의 회원 응답을 함께 확인한다. 계정 코스를 저장하고 목록에서 다시 열 때 관광 API로 장소를 재조회하는 흐름까지 확인한다. 콜백의 성공 리다이렉트만으로 프런트 연동·코스 저장이 끝났다고 판단하지 않는다.

## 자동 검증

일반 테스트는 외부 DB·카카오를 호출하지 않는다. 로컬 PostgreSQL 인증 검증은 명시적으로 켠다.

```powershell
$env:STORYROUTE_TEST_DATABASE = "1"
.\.venv\Scripts\python.exe -X utf8 -m pytest -q
Remove-Item Env:STORYROUTE_TEST_DATABASE
```

실제 DB 테스트는 `127.0.0.1:55432/storyroute`에서만 실행하며 테스트 회원·세션을 트랜잭션으로 롤백한다. 카카오 사용자 조회는 모의 응답이다. 중복 가입 방지·닉네임 갱신·해시 저장·새 앱의 기존 세션 조회·갱신 후 재사용 거절·로그아웃·회원과 저장 코스 연쇄 삭제·만료·해시 불일치·트랜잭션 실패를 확인한다. 동시 요청의 부하 검증과 실제 사용자 재로그인 확인은 별도다.

## 안내 확인과 선택 닉네임

로그인 안내에서 약관·방침 확인과 만 14세 이상 확인을 별도로 받으며, 닉네임은 선택 체크다. 서버는 안내 버전·확인 시각·선택 닉네임을 수명이 10분인 서명된 OAuth 상태에 넣고 쿠키와 콜백 값을 대조한다. 일치하는 임의 문자열만으로는 가입 확인을 우회할 수 없다. 가입 시 `users.policy_version`, `policy_confirmed_at`, `age_confirmed_at`을 로그인 트랜잭션에서 저장한다. 기존 회원의 과거 확인은 추정하지 않고 NULL로 유지하다가 재로그인 시 최신 확인을 기록한다. 이 기록은 실명·실제 나이 인증이 아니다.

`request_nickname=true`일 때만 `scope=profile_nickname`과 `property_keys=["kakao_account.profile"]`을 사용한다. 선택하지 않으면 기본 사용자 식별에 필요한 범위만 요청하고 닉네임을 저장하지 않는다. 카카오가 프로필 묶음에 반환한 사진 주소는 추출하지 않는다. 이미 동의한 항목은 카카오 화면이 생략될 수 있으므로 모의 응답 검사와 실제 카카오 확인을 구분한다.

참고: [카카오 REST API 조회 범위·추가 동의 안내](https://developers.kakao.com/docs/ko/kakaologin/rest-api).
