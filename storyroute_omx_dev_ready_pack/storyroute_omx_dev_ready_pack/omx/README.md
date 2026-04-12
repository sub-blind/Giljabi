# StoryRoute AI — OMX Prompt Pack

## 빠른 시작

1. `bash omx/scripts/sync_storyroute_workspace.sh storyroute-ai ~/dev/storyroute-ai`
2. `bash omx/scripts/setup_storyroute_inputs.sh storyroute-ai ~/dev/storyroute-ai`
3. `~/omx-sandbox/scripts/run-omx.sh storyroute-ai`
4. 컨테이너 안에서 `codex login --device-auth && omx setup --scope user`
5. `omx explore --prompt "Read /input/docs/prompts/00_GLOBAL_REPO_AUDIT.prompt.txt and produce a repository map and gap analysis."`
6. `omx --high`
7. 세션 안에서 `$deep-interview`, `$ralplan`, `$ralph`, `$team` 순으로 진행

자세한 내용은 `docs/26_OMX_EXECUTION_SEQUENCE.md` 를 본다.
