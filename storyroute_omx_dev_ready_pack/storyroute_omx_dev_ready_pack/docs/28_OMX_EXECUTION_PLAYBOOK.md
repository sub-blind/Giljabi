# 28. OMX Execution Playbook — 빠른 복붙판

## A. 시작 3줄

```bash
bash omx/scripts/sync_storyroute_workspace.sh storyroute-ai ~/dev/storyroute-ai
bash omx/scripts/setup_storyroute_inputs.sh storyroute-ai ~/dev/storyroute-ai
~/omx-sandbox/scripts/run-omx.sh storyroute-ai
```

## B. 컨테이너 안 4줄

```bash
codex login --device-auth
cd /workspace
omx setup --scope user
omx doctor && omx doctor --team
```

## C. 첫 세션 4줄

```bash
omx explore --prompt "Read /input/docs/prompts/00_GLOBAL_REPO_AUDIT.prompt.txt and produce a repository map and gap analysis."
omx --high
```

세션 안:
```text
$deep-interview "Read /input/docs/prompts/00_GLOBAL_REPO_AUDIT.prompt.txt and execute it exactly."
$ralplan "Read /input/docs/prompts/01_M0_BUILD_READY.prompt.txt and turn it into an approved implementation plan in /workspace/PLANS.md."
$ralph "Read /input/docs/prompts/01_M0_BUILD_READY.prompt.txt and execute it exactly."
```

## D. 구현 순서

1. `02_M1_HOME_SEARCH`
2. `03_M1_PLACE_DETAIL`
3. `04_M1_PLANNER`
4. `05_M1_TRIPS_REGION_ADMIN`
5. `06_M2_DATA_FOUNDATION`
6. `07_M2_TOURAPI_ADAPTER`
7. `08_M3_HYBRID_SEARCH`
8. `09_M3_PLANNER_PERSISTENCE`
9. `10_M3_EVENT_LOG_ADMIN`
10. `12_RELEASE_READINESS`

## E. 종료 2줄

```text
/diff
/review
```
