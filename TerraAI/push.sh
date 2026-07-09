#!/usr/bin/env bash
# ─────────────────────────────────────────
#  TerraAI | Local Git Push Helper
# ─────────────────────────────────────────
set -e
cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "  TerraAI  |  Local Git Push"
echo "=========================================="
echo ""

# Check for changes
if [ -z "$(git status --short)" ]; then
  echo "[INFO] Nothing to commit — working tree clean."
  echo ""
  git log --oneline -3
  echo ""
  exit 0
fi

# Show diff summary
echo "[CHANGES DETECTED]"
git status --short
echo ""

# Commit message
read -rp "Enter commit message (ENTER = auto): " MSG
if [ -z "$MSG" ]; then
  MSG="Auto-commit $(date '+%Y-%m-%d %H:%M')"
fi

echo ""
echo "[STAGING ALL FILES]"
git add .

echo "[COMMITTING] $MSG"
git commit -m "$MSG"

echo "[PUSHING] to origin/main ..."
git push origin main

echo ""
echo "=========================================="
echo "  ✅ SUCCESS — Pushed to GitHub!"
echo "  https://github.com/youngnationagenda/TerraAI"
echo "=========================================="
echo ""
