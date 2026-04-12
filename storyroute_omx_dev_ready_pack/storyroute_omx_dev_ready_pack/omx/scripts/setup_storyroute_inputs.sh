#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${1:?usage: setup_storyroute_inputs.sh <project-name> <source-repo-dir>}"
SOURCE_DIR="${2:?usage: setup_storyroute_inputs.sh <project-name> <source-repo-dir>}"

BASE="$HOME/omx-sandbox"
INPUT_DIR="$BASE/inputs/${PROJECT_NAME}-docs"

rm -rf "$INPUT_DIR"
mkdir -p \
  "$INPUT_DIR"/{product,ui,architecture,data,api,analytics,execution,reference,prompts}

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
  fi
}

copy_if_exists "$SOURCE_DIR/docs/00_INDEX.md" "$INPUT_DIR/product/"
copy_if_exists "$SOURCE_DIR/docs/01_PRD_FINAL.md" "$INPUT_DIR/product/"
copy_if_exists "$SOURCE_DIR/docs/02_PROJECT_BRIEF_FINAL.md" "$INPUT_DIR/product/"
copy_if_exists "$SOURCE_DIR/docs/03_FEATURE_DEFINITION_FINAL.md" "$INPUT_DIR/product/"
copy_if_exists "$SOURCE_DIR/docs/21_RELEASE_SCOPE_AND_MILESTONES.md" "$INPUT_DIR/product/"
copy_if_exists "$SOURCE_DIR/docs/23_PRODUCT_GLOSSARY.md" "$INPUT_DIR/product/"

copy_if_exists "$SOURCE_DIR/docs/04_UI_FINAL_SPEC.md" "$INPUT_DIR/ui/"
copy_if_exists "$SOURCE_DIR/docs/05_UI_STATE_MATRIX.md" "$INPUT_DIR/ui/"
copy_if_exists "$SOURCE_DIR/docs/06_COMPONENT_CATALOG.md" "$INPUT_DIR/ui/"
copy_if_exists "$SOURCE_DIR/docs/STORYROUTE_UI_FINAL_HANDOFF.html" "$INPUT_DIR/reference/"
copy_if_exists "$SOURCE_DIR/docs/STORYROUTE_UI_FINAL_PROTOTYPE.html" "$INPUT_DIR/reference/"

copy_if_exists "$SOURCE_DIR/docs/07_TECH_STACK_FINAL.md" "$INPUT_DIR/architecture/"
copy_if_exists "$SOURCE_DIR/docs/08_SYSTEM_ARCHITECTURE_FINAL.md" "$INPUT_DIR/architecture/"
copy_if_exists "$SOURCE_DIR/docs/14_REPO_STRUCTURE_FINAL.md" "$INPUT_DIR/architecture/"
copy_if_exists "$SOURCE_DIR/docs/22_DEVELOPMENT_ENV_AND_DEPLOY.md" "$INPUT_DIR/architecture/"

copy_if_exists "$SOURCE_DIR/docs/09_DATA_SOURCES_AND_INGESTION_FINAL.md" "$INPUT_DIR/data/"
copy_if_exists "$SOURCE_DIR/docs/10_DATA_MODEL_FINAL.md" "$INPUT_DIR/data/"
copy_if_exists "$SOURCE_DIR/docs/11_ETL_SYNC_RUNBOOK.md" "$INPUT_DIR/data/"
copy_if_exists "$SOURCE_DIR/infra/db/storyroute_schema_simplified.sql" "$INPUT_DIR/data/"
copy_if_exists "$SOURCE_DIR/reference/storyroute_schema_merge_map.md" "$INPUT_DIR/data/"

copy_if_exists "$SOURCE_DIR/docs/12_API_CONTRACT_BLUEPRINT.md" "$INPUT_DIR/api/"
copy_if_exists "$SOURCE_DIR/packages/contracts/openapi.yaml" "$INPUT_DIR/api/"

copy_if_exists "$SOURCE_DIR/docs/13_EVENT_LOG_SCHEMA.md" "$INPUT_DIR/analytics/"

copy_if_exists "$SOURCE_DIR/docs/15_IMPLEMENTATION_BACKLOG_FINAL.md" "$INPUT_DIR/execution/"
copy_if_exists "$SOURCE_DIR/docs/16_VALIDATION_AND_DOD_FINAL.md" "$INPUT_DIR/execution/"
copy_if_exists "$SOURCE_DIR/docs/17_OMX_RUNBOOK_FINAL.md" "$INPUT_DIR/execution/"
copy_if_exists "$SOURCE_DIR/docs/18_AGENT_CONTEXT.md" "$INPUT_DIR/execution/"
copy_if_exists "$SOURCE_DIR/docs/19_AGENT_TASK_TEMPLATES.md" "$INPUT_DIR/execution/"
copy_if_exists "$SOURCE_DIR/docs/20_AGENT_ROLE_CARDS.md" "$INPUT_DIR/execution/"

cp "$SOURCE_DIR"/omx/prompts/*.prompt.txt "$INPUT_DIR/prompts/" 2>/dev/null || true

cp "$SOURCE_DIR/omx/templates/00-index.md" "$INPUT_DIR/00-index.md"

echo "Input docs prepared at: $INPUT_DIR"
