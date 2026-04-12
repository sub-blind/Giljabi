# 16. 검증 명령 / Definition of Done Final

## 1. 최소 검증 명령

```bash
pnpm lint
pnpm typecheck
pnpm test
pytest
pnpm playwright test
pnpm verify
```

## 2. 권장 추가 검증

```bash
pnpm build
python -m pytest -q
pnpm playwright test --project=chromium
```

## 3. M0 완료 기준
- 문서/계약/검증 명령 존재
- mock fixture 구조 존재
- AGENTS/PLANS/config 존재

## 4. M1 완료 기준
- 전체 route shell 렌더링
- mock API 연결
- smoke E2E 통과

## 5. M2 완료 기준
- canonical `place` 적재
- detail mapping
- search chunk 생성

## 6. M3 완료 기준
- planner preview 동작
- save/load itinerary
- event logging
- basic admin metric

## 7. 작업 종료 체크리스트
1. 문서 변경 반영
2. OpenAPI 변경 반영
3. 테스트 추가/수정
4. lint/typecheck/test 통과
5. 위험/제약 메모 남김
