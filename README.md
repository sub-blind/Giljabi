# Giljabi

강원도 관광 코스 추천 서비스

---

## 🛠 기술 스택

| 구분 | 기술 |
| --- | --- |
| Backend | Python, FastAPI, uvicorn |
| Frontend | TypeScript, Next.js 14, Tailwind CSS |
| Auth | 카카오 OAuth2, JWT (HS256) |
| Data | 한국관광공사 TourAPI (KorService2) |

---

## 🚀 Quick Start

### 사전 준비

`.env.example`을 복사해 `.env`를 만들고 각 값을 채워주세요.

```bash
cp .env.example .env
```

### Backend

```bash
# 가상환경 생성 및 활성화
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (기본 포트 8000)
uvicorn app.main:app --reload --port 8000
```

- 헬스체크: `http://127.0.0.1:8000/healthz`
- API 문서: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd web
npm install
npm run dev        # 기본 포트 3000
```

> 포트 충돌 시: `uvicorn ... --port 8010`, `npm run dev -- -p 3010`으로 변경 가능

---

## 📑 프로젝트 규칙

### 🌿 Branch Strategy

- `main` / `dev` 브랜치 기본 운영
- `main`과 `dev`로 직접 push 금지

#### 브랜치 클론

```bash
# dev 브랜치 클론
git clone -b dev https://github.com/sub-blind/Giljabi.git

# 확인
git remote -v
git branch
```

#### 작업 브랜치 생성

```bash
# dev 브랜치 최신화
git switch dev
git pull origin dev

# 브랜치 생성: {타입}-{개발자}-{작업내용}-#{이슈번호}
git checkout -b feat-kjs-kakao-login-#1
```

#### Push 및 브랜치 정리

```bash
git add .
git commit -m "Feat: 카카오 로그인 구현 (#1)"
git push origin feat-kjs-kakao-login-#1

# PR 머지 완료 후 브랜치 삭제
git switch dev
git branch -D feat-kjs-kakao-login-#1
git push -d origin feat-kjs-kakao-login-#1
```

---

### 🔍 Git Convention

커밋 메시지 형식: `{접두사}: {내용} (#{이슈번호})`

```bash
git commit -m "Feat: 강원도 관광지 목록 API 연동 (#3)"
```

| 접두사 | 설명 |
| --- | --- |
| Feat | 새로운 기능 구현 |
| Fix | 버그 수정 |
| Docs | 문서 추가 및 수정 |
| Style | 스타일링 작업 |
| Refactor | 코드 리팩토링 (동작 변경 없음) |
| Test | 테스트 |
| Conf | 빌드, 환경 설정 |
| Chore | 기타 작업 |

---

### 🚀 Pull Request

#### PR 제목

`[Feat] 카카오 로그인 UI 구현`

#### PR 본문 양식

```markdown
### Description
구체적인 작업 내용을 작성해주세요.

### Discussion
추후 논의할 점을 작성해주세요.
```

---

### 📚 Code Convention

#### Backend (Python / FastAPI)

- PEP8 준수
- 함수명·변수명: `snake_case`
- 클래스명: `PascalCase`
- 상수: `UPPER_SNAKE_CASE`
- 라우터 함수명은 동사로 시작 (예: `get_tour_list`, `create_itinerary`)
- 환경변수는 반드시 `config.py`의 `Settings`를 통해 참조 (`.env` 직접 읽기 금지)

#### Frontend (TypeScript / Next.js)

- 컴포넌트명: `PascalCase`
- 함수·변수명: `camelCase`
- API 호출은 `web/lib/api.ts`에서 관리
- 환경변수는 `NEXT_PUBLIC_` 접두사 사용

---

### 📢 Communication Rules

- Discord 활용
- 매주 토요일 오전 10시 정기 회의
- 구글 시트로 작업 일정 관리
- 주간 회의록 공유
