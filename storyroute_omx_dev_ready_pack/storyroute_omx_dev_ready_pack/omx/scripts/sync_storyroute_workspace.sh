#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:?usage: sync_storyroute_workspace.sh <project-name> <source-repo-dir>}"
SOURCE_DIR="${2:?usage: sync_storyroute_workspace.sh <project-name> <source-repo-dir>}"

BASE="$HOME/omx-sandbox"
TARGET_DIR="$BASE/workspaces/$PROJECT_NAME"

mkdir -p "$TARGET_DIR"

rsync -a --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '.pytest_cache' \
  --exclude '.mypy_cache' \
  --exclude '.turbo' \
  --exclude '.env' \
  --exclude '.env.*' \
  "$SOURCE_DIR"/ \
  "$TARGET_DIR"/

echo "Workspace synced to: $TARGET_DIR"
