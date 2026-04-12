# 24. OMX 프로젝트 경로 / 동기화 기준

## 1. 이 패키지를 어떻게 취급할 것인가

이 폴더 전체를 **실제 개발 저장소의 초기 루트**로 취급한다.
즉, 이 패키지는 단순 문서 묶음이 아니라 **repo root seed**다.

권장 repo 이름:
- `storyroute-ai`

## 2. 호스트 권장 경로

```text
~/dev/storyroute-ai                 # 실제 원본 repo 또는 이 패키지의 복사본
~/omx-sandbox/workspaces/storyroute-ai
~/omx-sandbox/inputs/storyroute-ai-docs
~/omx-sandbox/output/storyroute-ai
```

## 3. 역할 분리

### `~/dev/storyroute-ai`
- 사람이 직접 보고 관리하는 원본 작업 디렉터리
- Git remote와 연결될 수 있는 곳

### `~/omx-sandbox/workspaces/storyroute-ai`
- OmX가 실제로 수정하는 복사본
- 컨테이너의 `/workspace`에 mount

### `~/omx-sandbox/inputs/storyroute-ai-docs`
- 읽기 전용 문서 미러
- 컨테이너의 `/input/docs`에 mount
- OmX는 여기 문서를 **읽기만** 한다

### `~/omx-sandbox/output/storyroute-ai`
- 세션 리포트 / patch / artifact 저장
- 컨테이너의 `/output`에 mount

## 4. 권장 동기화 순서

1. 이 패키지를 `~/dev/storyroute-ai`로 둔다
2. `omx/scripts/sync_storyroute_workspace.sh` 로 `/workspace` 복사본 생성
3. `omx/scripts/setup_storyroute_inputs.sh` 로 `/input/docs` 미러 생성
4. `~/omx-sandbox/scripts/run-omx.sh storyroute-ai` 로 컨테이너 실행

## 5. 왜 docs를 두 벌로 나누는가

### `/workspace/docs`
- 구현 중 갱신되는 living docs

### `/input/docs`
- 세션 시작 시 읽는 frozen spec

이렇게 나누면 OmX가 구현 도중 변경한 문서와, 처음 받아둔 기준 문서를 구분할 수 있다.

## 6. 반드시 지킬 것

- OmX는 `/workspace`만 수정
- `/input/docs`는 read-only
- `.git`는 workspace 복사본에도 유지
- `--madmax`는 기본값으로 쓰지 않음
