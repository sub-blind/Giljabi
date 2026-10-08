# PostgreSQL 연결·운영 안내

2026년 10월 9일 현행화 · 로컬 DB와 운영 계정 코스 저장 상태

## 선택한 DB와 현재 상태

서버에 저장하는 데이터는 PostgreSQL로 관리한다. SQLAlchemy 2·Psycopg 3 연결 관리에 사용자·세션·코스·장소·기록 모델과 Alembic 초기 변경을 추가하고 Docker의 PostgreSQL 17.11에 다섯 테이블을 생성했다. 실제 제약조건·기록 유지·연쇄 삭제 16개 사례도 확인했다. 카카오 회원·로그인 세션과 계정별 코스 생성·목록·조회·삭제는 DB에 연결했다. 비회원 최근 코스와 모든 방문 체크·메모는 브라우저의 localStorage에 저장하며 `place_records`는 아직 화면과 API에서 사용하지 않는다.

계정 저장의 연결 흐름은 React → FastAPI → PostgreSQL이다. 프런트는 내부 API를 사용하고 FastAPI가 로그인한 사용자와 데이터 소유권을 확인한다. DB 비밀번호와 연결 주소는 서버 환경변수에서 관리한다.

## 현재 PC에서 로컬 실행

9월 18일 17:03 Docker 엔진의 정상 실행을 확인한 뒤 `compose.yaml`로 PostgreSQL 컨테이너를 실행했다. 앞서 Docker 시작 오류 때문에 사용한 Windows PostgreSQL은 중지했다. 전환 전에 해당 프로젝트 DB에 사용자 테이블이 없는지 확인했으며 기존 5432 포트의 별도 PostgreSQL은 변경하지 않았다.

| 항목 | 현재 설정 |
|---|---|
| 호스트·포트 | `127.0.0.1:55432` |
| DB 이름 | `storyroute` |
| 실행 방식 | Docker Compose, PostgreSQL 17.11 |
| Docker Desktop 그룹 | `storyroute-local-db` |
| 컨테이너 | `storyroute-local-db-postgres-1` |
| 저장 볼륨 | `storyroute-local-db_postgres_data` |
| 인증 | 서버 `.env`의 로컬 DB 비밀번호, SCRAM |
| 연결 풀 | 프로세스당 최대 2개, 연결 확인 후 재사용 |
| 시간 제한 | 연결·풀 대기 5초, 쿼리 실행 5초 |

Docker Desktop을 켠 뒤 프로젝트 루트에서 실행한다.

```powershell
# 실행 및 준비 상태 확인
docker compose up -d --wait

# 실제 연결과 한국어 데이터 저장·수정·조회 확인
.\.venv\Scripts\python.exe -X utf8 tools/check_local_db.py

# 상태 확인
docker compose ps

# 개발을 마치고 DB 중지
docker compose stop
```

확인 스크립트는 임시 테이블만 만들며 트랜잭션 완료 후 제거한다. 사용자·코스 테이블이나 실제 방문 기록은 만들지 않는다. 외부 AI·관광 API도 호출하지 않는다.

새 PC에서 Docker를 사용할 때는 서버 `.env`의 `STORYROUTE_DB_NAME`, `STORYROUTE_DB_USER`, `STORYROUTE_DB_PASSWORD`, `STORYROUTE_DB_PORT`를 설정한다. `DATABASE_URL`의 사용자·비밀번호·DB·포트를 같은 값으로 맞춘다. URI 비밀번호의 특수문자는 URL 인코딩한다. 초기화된 저장 볼륨의 비밀번호는 환경파일 수정만으로 바뀌지 않는다.

Docker 데이터는 프로젝트 전용 볼륨에 저장된다. 일반 중지는 볼륨을 유지한다. 운영 DB 연결 주소와 비밀번호는 프런트 환경파일에 넣지 않는다.

### 현재 PC의 Windows PostgreSQL 대체 실행

이전에 초기화한 PostgreSQL 17.6 데이터 폴더는 `%LOCALAPPDATA%\StoryRoute\Tourism\postgres17`에 남아 있다. Docker 실행이 어려울 때 사용할 수 있는 별도 DB이며 Docker 볼륨과 데이터를 공유하지 않는다. 같은 55432 포트를 사용하므로 먼저 컨테이너를 중지한다. 아래 관리 스크립트는 이 PC에 초기화한 인스턴스용이다.

```powershell
docker compose stop
.\tools\local_postgres.ps1 -Action start
.\.venv\Scripts\python.exe -X utf8 tools/check_local_db.py
.\tools\local_postgres.ps1 -Action status

# 다시 Docker를 사용할 때
.\tools\local_postgres.ps1 -Action stop
docker compose up -d --wait
```

사용자 데이터 저장을 구현한 뒤 실행 방식을 바꿀 때는 필요한 데이터를 별도로 내보내고 복원한다.

## FastAPI 연결 확인

`GET /api/v1/health/database`는 설정 유무만 검사하지 않고 실제 `SELECT 1`을 실행한다. 성공 응답은 다음과 같다.

```json
{"status":"ok","database":"postgresql"}
```

미설정은 HTTP 503·`DATABASE_NOT_CONFIGURED`, 연결 실패는 HTTP 503·`DATABASE_UNAVAILABLE`을 반환하며 연결 주소·비밀번호·외부 오류 원문은 숨긴다. DB 중단 중에도 `/healthz`와 관광 준비 상태 조회는 유지된다.

이번에는 기존 8000 서버를 종료하지 않고 새 코드 검증용 서버를 8001에 추가했다. 실제 확인 주소는 <http://127.0.0.1:8001/api/v1/health/database>다. 이후 일반 백엔드를 새 코드로 시작하면 같은 API를 해당 서버 포트에서 사용할 수 있다.

9월 18일 16:53 로컬 DB 중지 → 실제 API 503 → 기본 상태 200 유지 → DB 재실행 → 실제 읽기·쓰기와 API 200 복구까지 확인했다. 기본 코스 화면의 브라우저 저장과 계정 DB 저장은 구분한다.

17:03 Docker 컨테이너 전환 후 동일한 서버 환경 설정으로 한국어 임시 데이터 저장·수정·조회·정리와 위 연결 확인 API의 HTTP 200을 다시 확인했다. 백엔드는 재시작하지 않았으며 이전 연결 풀에서 새 PostgreSQL로 연결이 복구됐다.

## 운영 구성

현재 프런트는 Vercel, FastAPI는 Render, 운영 PostgreSQL은 Neon에 배포했다. PostgreSQL은 백엔드의 `DATABASE_URL`로만 연결하며 연결 주소와 비밀번호를 소스·문서에 기록하지 않는다. 운영 DB를 바꾸더라도 동일한 Alembic 마이그레이션과 `/api/v1/health/database` 확인 절차를 사용한다. Neon의 실제 복구본 보관기간과 별도 백업 여부는 아직 확인하지 못했으며 [개인정보 운영 점검](PRIVACY_OPERATIONS.md)에 남겼다. 외부 AI·길찾기 등의 API 사용량은 호스팅과 별도로 관리한다.

## 데이터 구조

현재 다섯 테이블의 관계는 [데이터 모델과 ERD](DATA_MODEL.md), 필드·제약·삭제 규칙은 [데이터베이스 상세 구조](DATABASE_SCHEMA.md)를 따른다. 계정 코스에는 관광 장소 ID·유형·순서·검색 조건을 저장하며 관광 소개나 이미지 원본을 대량 복제하지 않는다. `place_records`는 DB에 테이블만 있고 현재 방문 완료·메모 화면에서는 사용하지 않는다.

## 구현 순서와 완료 기준

1. 로컬 연결·모델·초기 마이그레이션·테이블 생성을 완료했고 운영 DB에 계정 코스를 저장한다. 운영 DB 공급자는 Neon이며 요금제·복구 설정은 실제 콘솔에서 별도로 확인한다.
2. 로그인한 사용자를 내부 사용자 ID와 연결하고, 다른 사용자의 코스를 읽거나 삭제하지 못하도록 검증했다.
3. 계정별 코스 생성·목록·조회·삭제 API를 구현했다. 코스 이름·장소·순서를 수정하는 API가 필요해질 때 버전 충돌 검사와 함께 추가한다.
4. 방문 체크·개인 메모를 연결하고, 브라우저 기록을 계정에 가져오는 작업은 사용자가 명시적으로 선택하게 한다.
5. 운영 카카오 계정의 재접속·별도 브라우저 코스 복원·로그아웃·탈퇴 후 재가입을 확인했다. 다른 물리적 기기 복원, 서버 재시작 뒤 세션 유지, 동시 수정과 장시간 장애 복구는 별도 검증이 필요하다.

DB 연결만 성공한 상태와 화면에서 계정 저장을 끝까지 검증한 상태는 구분해 기록한다. 공개 사진 리뷰는 계정 저장이 안정된 뒤 진행한다.
