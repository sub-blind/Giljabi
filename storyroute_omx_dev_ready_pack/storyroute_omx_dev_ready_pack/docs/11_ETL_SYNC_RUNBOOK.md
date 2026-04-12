# 11. ETL / Sync Runbook

## 1. 배치 종류

### bootstrap
- full snapshot 수집
- normalize
- canonical upsert
- chunk/index build

### incremental
- sync list 기반 delta
- updated rows upsert
- impacted chunk만 재생성

### repair
- 실패 batch 재실행
- asset missing backfill
- source map mismatch fix

## 2. 표준 배치 단계

1. source fetch
2. raw store
3. schema validate
4. normalize
5. upsert canonical
6. generate chunks
7. update search indexes
8. audit log
9. notify/report

## 3. idempotency 규칙
- source natural key + version/hash 사용
- 같은 payload는 중복 insert 금지
- upsert 시 canonical updated_at만 갱신
- chunk regeneration은 deterministic 해야 한다

## 4. 실패 처리
- fetch 실패: source retry
- normalize 실패: dead-letter snapshot
- upsert 실패: transaction rollback
- index 실패: retry queue
- partial completion: batch_run status를 `partial_failed`로 기록

## 5. 로컬 개발 원칙
- 첫 단계는 fixture seed
- adapter는 `mock`/`real` 인터페이스 분리
- 테스트는 외부 API 없이 수행
