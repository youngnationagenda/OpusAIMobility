#!/bin/bash
# ==============================================================================
# Before Install — Clean previous deployment artifacts
# ==============================================================================
set -euo pipefail

echo "[BeforeInstall] Cleaning previous deployment..."
rm -rf /tmp/deploy
mkdir -p /tmp/deploy/frontend /tmp/deploy/lambda /tmp/deploy/lambda-push
echo "[BeforeInstall] Done"
