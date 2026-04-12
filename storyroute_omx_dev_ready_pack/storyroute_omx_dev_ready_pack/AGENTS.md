# AGENTS.md — StoryRoute AI

## 1. 목표
이 저장소의 목표는 StoryRoute AI를 **문서 중심 / contract-first / mock-first** 방식으로 구현하는 것이다.

## 2. 반드시 먼저 읽을 파일
1. `README.md`
2. `docs/00_INDEX.md`
3. `docs/01_PRD_FINAL.md`
4. `docs/04_UI_FINAL_SPEC.md`
5. `docs/12_API_CONTRACT_BLUEPRINT.md`
6. `docs/16_VALIDATION_AND_DOD_FINAL.md`

## 3. 핵심 규칙
- external tourism provider 호출은 adapter 뒤에 숨긴다.
- frontend는 internal API만 호출한다.
- mock response shape와 real response shape는 동일해야 한다.
- OpenAPI를 바꾸면 관련 docs와 tests도 같이 바꾼다.
- `place`는 얇게 유지한다.
- raw/source mapping은 보존한다.
- planner는 explanation 없는 결과를 반환하지 않는다.
- 테스트는 외부 키 없이 돌아야 한다.

## 4. 작업 방식
- plan first
- mock-first
- contract-first
- 작은 작업 단위로 쪼갠다
- 각 작업은 명확한 `Done when`을 가진다

## 5. 구현 순서
1. docs 확인
2. contracts 확인
3. shell 구현
4. mock API 구현
5. tests
6. adapter 연결
7. docs update

## 6. 금지 사항
- schema/doc 수정 없이 response shape 변경
- provider-specific field를 UI에 직접 노출
- 테스트 없이 완료 처리
- unrelated refactor 동시 진행

## 7. 완료 기준
- lint/typecheck/test/pytest/playwright pass
- 문서 반영
- contract 반영
- 실패 테스트 0
