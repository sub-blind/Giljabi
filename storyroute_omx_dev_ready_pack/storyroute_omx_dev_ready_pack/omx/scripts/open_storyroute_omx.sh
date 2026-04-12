#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:-storyroute-ai}"
BASE="$HOME/omx-sandbox"

if [ ! -x "$BASE/scripts/run-omx.sh" ]; then
  echo "Missing $BASE/scripts/run-omx.sh"
  echo "Create it from your omx_docker_sandbox_guide.md first."
  exit 1
fi

"$BASE/scripts/run-omx.sh" "$PROJECT_NAME"
