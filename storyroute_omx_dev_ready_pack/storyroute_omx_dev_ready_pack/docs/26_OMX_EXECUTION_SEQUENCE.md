# 26. OMX 실행 순서 — StoryRoute AI

## 0. 시작 전 전제

이 저장소는 `storyroute-ai`라는 이름으로 OmX sandbox에 들어간다고 가정한다.

## 1. 호스트에서 1회 준비

### 1-1. 원본 저장소 위치
```bash
mkdir -p ~/dev
cp -R /path/to/storyroute_omx_dev_ready_pack ~/dev/storyroute-ai
```

### 1-2. workspace 복사본 생성
```bash
cd ~/dev/storyroute-ai
bash omx/scripts/sync_storyroute_workspace.sh storyroute-ai ~/dev/storyroute-ai
```

### 1-3. input docs 미러 생성
```bash
cd ~/dev/storyroute-ai
bash omx/scripts/setup_storyroute_inputs.sh storyroute-ai ~/dev/storyroute-ai
```

### 1-4. OmX 컨테이너 실행
```bash
~/omx-sandbox/scripts/run-omx.sh storyroute-ai
```

## 2. 컨테이너 안에서 최초 1회

```bash
codex login --device-auth
cd /workspace
omx setup --scope user
omx doctor
omx doctor --team
```

## 3. 첫 세션 — repo 감사와 계획

### Step A. repo 맵/갭 분석
```bash
omx explore --prompt "Read /input/docs/prompts/00_GLOBAL_REPO_AUDIT.prompt.txt and produce a repository map, gap analysis, and milestone recommendation."
```

### Step B. 인터랙티브 세션 시작
```bash
omx --high
```

세션 안에서:
```text
$deep-interview "Read /input/docs/prompts/00_GLOBAL_REPO_AUDIT.prompt.txt and execute it exactly. Save the report to /output/reports/00_repo_gap_analysis.md."
$ralplan "Read /input/docs/prompts/01_M0_BUILD_READY.prompt.txt and turn it into an approved implementation plan in /workspace/PLANS.md. Do not code yet."
$ralph "Read /input/docs/prompts/01_M0_BUILD_READY.prompt.txt and execute it exactly."
```

## 4. M0 완료 후 다음 순서

### M1A — Home/Search
```text
$ralph "Read /input/docs/prompts/02_M1_HOME_SEARCH.prompt.txt and execute it exactly."
```

### M1B — Place Detail
```text
$ralph "Read /input/docs/prompts/03_M1_PLACE_DETAIL.prompt.txt and execute it exactly."
```

### M1C — Planner
```text
$ralph "Read /input/docs/prompts/04_M1_PLANNER.prompt.txt and execute it exactly."
```

### M1D — Trips/Region/Admin
```text
$team 3:executor "Read /input/docs/prompts/05_M1_TRIPS_REGION_ADMIN.prompt.txt and execute it exactly. Split work across route shells, mock APIs, and smoke tests. Keep the contract intact."
```

## 5. M2 순서

### Data foundation
```text
$ralph "Read /input/docs/prompts/06_M2_DATA_FOUNDATION.prompt.txt and execute it exactly."
```

### TourAPI adapter / ingestion
```text
$ralph "Read /input/docs/prompts/07_M2_TOURAPI_ADAPTER.prompt.txt and execute it exactly."
```

## 6. M3 순서

### Hybrid search
```text
$ralph "Read /input/docs/prompts/08_M3_HYBRID_SEARCH.prompt.txt and execute it exactly."
```

### Planner persistence
```text
$ralph "Read /input/docs/prompts/09_M3_PLANNER_PERSISTENCE.prompt.txt and execute it exactly."
```

### Event log + admin
```text
$ralph "Read /input/docs/prompts/10_M3_EVENT_LOG_ADMIN.prompt.txt and execute it exactly."
```

## 7. 버그 수정 / 회귀 대응

```text
$ralph "Read /input/docs/prompts/11_REGRESSION_FIX.prompt.txt and execute it exactly."
```

## 8. 데모 준비 / 릴리즈 점검

```text
$ralph "Read /input/docs/prompts/12_RELEASE_READINESS.prompt.txt and execute it exactly."
```

## 9. 세션 종료 루틴

세션 안에서:
```text
/diff
/review
```

셸에서:
```bash
mkdir -p /output/reports /output/patches
git -C /workspace status
git -C /workspace diff > /output/patches/working-tree.patch
```
