#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# apply-schema.sh — Apply TerraAI schema to opusaimobility-db RDS
#
# Two modes:
#   1. Seed mode (default): creates tables on the new empty RDS.
#      No source DB needed. Run this now to make the migration Lambda work.
#
#   2. Full migration mode: if you have old TerraAI DB credentials, exports
#      data from the old DB, converts it, and imports into the new RDS.
#
# Prerequisites:
#   - mysql client installed (brew install mysql-client  or  apt install mysql-client)
#   - Network access to RDS (same VPC, or use AWS SSM/bastion)
#
# Usage — seed only (run now):
#   ./scripts/migrate/apply-schema.sh
#
# Usage — full migration (when you have old DB credentials):
#   TERRA_DB_HOST=old-host.rds.amazonaws.com \
#   TERRA_DB_USER=old_user \
#   TERRA_DB_PASS=old_pass \
#   TERRA_DB_NAME=old_db_name \
#   ./scripts/migrate/apply-schema.sh --migrate
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

TARGET_HOST="${TARGET_DB_HOST:-opusaimobility-db.c43i6c8ow71c.us-east-1.rds.amazonaws.com}"
TARGET_PORT="${TARGET_DB_PORT:-3306}"
TARGET_DB="${TARGET_DB_NAME:-terraai}"
TARGET_USER="${TARGET_DB_USER:-admin_opus}"
TARGET_PASS="${TARGET_DB_PASS:-}"    # Prompt if not set

SCHEMA_FILE="$(dirname "$0")/schema.sql"
MIGRATE_MODE=false

for arg in "$@"; do [[ "$arg" == "--migrate" ]] && MIGRATE_MODE=true; done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  OpusAIMobility — TerraAI Schema Application"
echo "═══════════════════════════════════════════════════════════"
echo "  Target: $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
if $MIGRATE_MODE; then
  echo "  Mode:   Full migration (source DB required)"
else
  echo "  Mode:   Seed schema only (tables + default data)"
fi
echo ""

# ── Prompt for password if not set ───────────────────────────────────────────
if [ -z "$TARGET_PASS" ]; then
  read -rsp "Password for $TARGET_USER@$TARGET_HOST: " TARGET_PASS
  echo ""
fi

MYSQL_CMD="mysql -h $TARGET_HOST -P $TARGET_PORT -u $TARGET_USER -p$TARGET_PASS $TARGET_DB"

# ── Step 1: Test connection ───────────────────────────────────────────────────
echo "▶ Testing connection to RDS..."
if ! $MYSQL_CMD -e "SELECT 1" > /dev/null 2>&1; then
  echo "✗ Cannot connect to RDS. Check:"
  echo "  - Your machine is in the same VPC (or using a bastion/SSM)"
  echo "  - Security group sg-049d8a649251314bf allows your IP on port 3306"
  echo "  - Credentials are correct"
  echo ""
  echo "  To connect via AWS SSM Session Manager (no VPC required):"
  echo "  aws ssm start-session --target <ec2-instance-id> --document-name AWS-StartPortForwardingSessionToRemoteHost \\"
  echo "    --parameters 'host=$TARGET_HOST,portNumber=3306,localPortNumber=3307'"
  echo "  # Then connect on localhost:3307"
  exit 1
fi
echo "  ✔ Connected"

# ── Step 2: Apply schema ──────────────────────────────────────────────────────
echo ""
echo "▶ Applying schema..."
$MYSQL_CMD < "$SCHEMA_FILE"
echo "  ✔ Schema applied"

# ── Step 3: Verify tables ─────────────────────────────────────────────────────
echo ""
echo "▶ Verifying tables..."
$MYSQL_CMD -e "SHOW TABLES;" | column -t
echo ""

# ── Step 4 (optional): Full data migration ────────────────────────────────────
if $MIGRATE_MODE; then
  echo "▶ Full migration mode: exporting from source DB..."

  TERRA_HOST="${TERRA_DB_HOST:?Set TERRA_DB_HOST}"
  TERRA_PORT="${TERRA_DB_PORT:-3306}"
  TERRA_DB_N="${TERRA_DB_NAME:?Set TERRA_DB_NAME}"
  TERRA_USER="${TERRA_DB_USER:?Set TERRA_DB_USER}"
  TERRA_PASS="${TERRA_DB_PASS:?Set TERRA_DB_PASS}"

  DUMP_FILE="/tmp/terraai_users_$(date +%Y%m%d_%H%M%S).sql"

  echo "  Dumping users table from $TERRA_HOST/$TERRA_DB_N..."
  mysqldump -h "$TERRA_HOST" -P "$TERRA_PORT" -u "$TERRA_USER" -p"$TERRA_PASS" \
    --no-tablespaces \
    --skip-add-drop-table \
    --insert-ignore \
    --single-transaction \
    "$TERRA_DB_N" user > "$DUMP_FILE"

  echo "  Exported to $DUMP_FILE ($(wc -l < "$DUMP_FILE") lines)"

  # Transform: rename `user` table to `users`, `password` col to match Lambda expectations
  echo "  Transforming schema (user → users, mapping columns)..."
  TRANSFORMED="/tmp/terraai_users_transformed.sql"
  sed -e 's/`user`/`users`/g' \
      -e 's/\bINSERT INTO `users`/INSERT IGNORE INTO `users`/g' \
      -e 's/ENGINE=MyISAM/ENGINE=InnoDB/g' \
      -e 's/DEFAULT CHARSET=latin1/DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g' \
      "$DUMP_FILE" > "$TRANSFORMED"

  echo "  Importing users into $TARGET_DB..."
  $MYSQL_CMD < "$TRANSFORMED"

  # Count
  USER_COUNT=$($MYSQL_CMD -se "SELECT COUNT(*) FROM users;")
  echo "  ✔ Imported $USER_COUNT users"

  rm -f "$DUMP_FILE" "$TRANSFORMED"
fi

# ── Step 5: Final check — migration Lambda query test ─────────────────────────
echo ""
echo "▶ Testing user migration Lambda query..."
$MYSQL_CMD -e "
  SELECT 'users table exists' AS check_result,
         COUNT(*) AS row_count
  FROM users;
  DESCRIBE users;
" 2>/dev/null | head -20

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✔ Schema ready. Migration Lambda can now query users."
echo ""
echo "  Next: verify the Lambda can connect:"
echo "  aws lambda invoke --function-name opusaimobility-user-migration \\"
echo "    --payload '{\"triggerSource\":\"UserMigration_Authentication\",\"userName\":\"test@example.com\",\"request\":{\"password\":\"test\"}}' \\"
echo "    --region us-east-1 /tmp/migration-test.json"
echo "  cat /tmp/migration-test.json"
echo "═══════════════════════════════════════════════════════════"
